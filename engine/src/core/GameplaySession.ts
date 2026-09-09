import type { Direction, LevelMap } from "@bobby/model";
import {
  resolveBobbyLocomotionTiming,
  type BobbyLocomotionTiming,
  type BobbyLocomotionTimingOverride,
} from "../entities/player/BobbyLocomotion.js";
import { readBobbyInventory } from "../entities/player/BobbyState.js";
import {
  resolveControlInput,
  type ControlBinding,
} from "../input/ControlBindings.js";
import type { LogicalMoveInput } from "../input/InputController.js";
import {
  resolveEngineTiming,
  type EngineTimingOptions,
} from "../time/EngineTiming.js";
import { WorldClock, type WorldTick } from "../time/WorldClock.js";
import type { EconomyState, ProfileCapabilities } from "../world/GlobalState.js";
import { World, type WorldSnapshot } from "../world/World.js";
import type { MoveResult, WinConditionState } from "../world/WorldTypes.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type {
  WorldIntent,
  WorldIntentGroup,
} from "../world/movement/WorldIntent.js";
import {
  emptyWorldStepResult,
  mergeWorldStepResult,
  type WorldStepResult,
} from "../world/movement/WorldStepResult.js";
import {
  DEFAULT_HISTORY_POLICY,
  shouldCheckpoint,
  type HistoryPolicy,
} from "./HistoryPolicy.js";
import type { GameplayState } from "./GameplayState.js";
import type { RuntimeEntityStateInitializer } from "./GameOptions.js";

export type GameplayInputAttempt = "moved" | "blocked" | "busy" | "consumed";

export interface GameplayTickInput {
  moves?: readonly LogicalMoveInput[];
  groups?: readonly WorldIntentGroup[];
  /** Debug 可以只为当前 Tick 覆盖控制目标，不改变 Session 的正式绑定。 */
  controls?: readonly ControlBinding[];
}

export interface GameplayInputResolution {
  source: string;
  result: GameplayInputAttempt;
}

export interface GameplayTickResult {
  time: WorldTick;
  result: WorldStepResult;
  phases: readonly WorldStepResult[];
  inputGroups: readonly WorldIntentGroup[];
  inputResolutions: readonly GameplayInputResolution[];
}

export interface GameplaySessionOptions {
  profile?: Partial<ProfileCapabilities>;
  economy?: Partial<EconomyState>;
  timing?: EngineTimingOptions;
  bobbyLocomotion?: BobbyLocomotionTimingOverride;
  history?: HistoryPolicy;
  controls?: readonly ControlBinding[];
  initializeEntityState?: RuntimeEntityStateInitializer;
}

export interface SerializableGameplaySetup {
  worldHz: number;
  bobbyLocomotion: BobbyLocomotionTiming;
}

export type GameplayTickInputProvider = (time: WorldTick) => GameplayTickInput;

/**
 * 一局地图的纯 gameplay 运行边界。浏览器 Game 与 ReplayRunner 都通过这里
 * 组织固定 Tick、玩家输入、World 初始化和历史记录。
 */
export class GameplaySession {
  readonly clock: WorldClock;
  readonly bobbyLocomotion: BobbyLocomotionTiming;
  private readonly profile: Partial<ProfileCapabilities>;
  private readonly initialEconomy: Partial<EconomyState>;
  private readonly historyPolicy: HistoryPolicy;
  private readonly initializeEntityState: RuntimeEntityStateInitializer | null;
  private configuredControls: readonly ControlBinding[] | null;
  private controlBindings: readonly ControlBinding[] = [];
  private primaryActorIdValue: EntityId | null = null;
  private worldValue: World | null = null;
  private initialLevel: LevelMap | null = null;
  private readonly history: WorldSnapshot[] = [];
  private readonly future: WorldSnapshot[] = [];
  private pendingHistorySnapshot: WorldSnapshot | null = null;

  constructor(options: GameplaySessionOptions = {}) {
    const timing = resolveEngineTiming(options.timing);
    this.clock = new WorldClock(timing.worldHz, timing.worldSpeed);
    this.bobbyLocomotion = resolveBobbyLocomotionTiming(options.bobbyLocomotion);
    this.profile = options.profile ?? {};
    this.initialEconomy = options.economy ?? {};
    this.historyPolicy = structuredClone(
      options.history ?? DEFAULT_HISTORY_POLICY,
    );
    this.initializeEntityState = options.initializeEntityState ?? null;
    this.configuredControls = options.controls
      ? structuredClone(options.controls)
      : null;
  }

  get hasLevel(): boolean {
    return this.worldValue !== null;
  }

  get level(): LevelMap {
    if (!this.initialLevel) throw new Error("尚未载入关卡");
    return structuredClone(this.initialLevel);
  }

  get world(): World {
    if (!this.worldValue) throw new Error("尚未载入关卡");
    return this.worldValue;
  }

  get actorIds(): readonly EntityId[] {
    if (!this.worldValue) return [];
    return this.world.query
      .entitiesWithTrait("player")
      .map((entity) => entity.id);
  }

  get controls(): readonly ControlBinding[] {
    return structuredClone(this.controlBindings);
  }

  get canUndo(): boolean {
    return this.history.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get state(): GameplayState {
    const world = this.world;
    const state = world.state;
    const actors = this.actorIds.map((id) => {
      const entity = world.entities.require(id);
      return {
        id,
        position: { ...entity.anchor },
        facing: entity.direction ?? ("down" as Direction),
        ...(entity.state ? { state: structuredClone(entity.state) } : {}),
      };
    });
    const primary = this.primaryActorIdValue === null
      ? null
      : world.entities.get(this.primaryActorIdValue) ?? null;
    return {
      status: world.dead ? "dead" : world.completed ? "won" : "playing",
      deathReason: state.deathReason,
      moves: state.moves,
      primaryActorId: this.primaryActorIdValue,
      actors,
      player: primary ? { ...primary.anchor } : null,
      facing: primary?.direction ?? null,
      inventory: readBobbyInventory(primary?.state),
      economy: structuredClone(state.economy),
      profile: structuredClone(state.profile),
      bonusCoinsInLevel: state.bonusCoinsInLevel,
      goldenCarrotsInLevel: state.goldenCarrotsInLevel,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
    };
  }

  get winState(): WinConditionState | null {
    if (!this.worldValue) return null;
    const win = this.world.winState;
    return win ? structuredClone(win) : null;
  }

  get replaySetup(): SerializableGameplaySetup | null {
    if (this.initializeEntityState) return null;
    return {
      worldHz: this.clock.hz,
      bobbyLocomotion: structuredClone(this.bobbyLocomotion),
    };
  }

  loadLevel(level: LevelMap): void {
    this.initialLevel = structuredClone(level);
    this.worldValue = new World(level, {
      profile: this.profile,
      economy: this.initialEconomy,
    });
    this.applyRuntimeEntityStateInitializer();
    this.world.setMotionDurationMs(this.gameplayMotionDuration());
    this.configureActorsAndControls();
    this.clock.reset();
    this.clearHistory();
  }

  restart(): void {
    if (!this.initialLevel) return;
    const wasPaused = this.clock.paused;
    const profile = this.worldValue
      ? structuredClone(this.world.state.profile)
      : this.profile;
    const economy = this.worldValue
      ? structuredClone(this.world.state.economy)
      : this.initialEconomy;
    Object.assign(this.profile, profile);
    this.worldValue = new World(this.initialLevel, { profile, economy });
    this.applyRuntimeEntityStateInitializer();
    this.world.setMotionDurationMs(this.gameplayMotionDuration());
    this.configureActorsAndControls();
    this.clock.reset();
    if (wasPaused) this.clock.pause();
    this.clearHistory();
  }

  setControlBindings(bindings: readonly ControlBinding[]): void {
    const controls = structuredClone(bindings);
    this.configuredControls = controls;
    this.controlBindings = controls;
  }

  setProfile(profile: Partial<ProfileCapabilities>): void {
    Object.assign(this.profile, profile);
    if (!this.worldValue) return;
    this.world.setProfile(profile);
    this.world.setMotionDurationMs(this.gameplayMotionDuration());
  }

  setEconomy(economy: Partial<EconomyState>): void {
    if (this.worldValue) this.world.setEconomy(economy);
  }

  undo(): boolean {
    if (!this.worldValue) return false;
    const snapshot = this.history.pop();
    if (!snapshot) return false;
    this.future.push(this.world.snapshot());
    this.world.restore(snapshot);
    this.pendingHistorySnapshot = null;
    return true;
  }

  redo(): boolean {
    if (!this.worldValue) return false;
    const snapshot = this.future.pop();
    if (!snapshot) return false;
    this.history.push(this.world.snapshot());
    this.world.restore(snapshot);
    this.pendingHistorySnapshot = null;
    return true;
  }

  discardPendingHistory(): void {
    this.pendingHistorySnapshot = null;
  }

  advanceRealTime(
    deltaMs: number,
    inputForTick: GameplayTickInputProvider,
    maxTicks = Number.POSITIVE_INFINITY,
  ): GameplayTickResult[] {
    const results: GameplayTickResult[] = [];
    this.clock.advance(deltaMs, (time) => {
      results.push(this.advanceTick(time, inputForTick(time)));
    }, maxTicks);
    return results;
  }

  advanceTicks(
    count: number,
    inputForTick: GameplayTickInputProvider = () => ({}),
  ): GameplayTickResult[] {
    const results: GameplayTickResult[] = [];
    this.clock.advanceTicks(count, (time) => {
      results.push(this.advanceTick(time, inputForTick(time)));
    });
    return results;
  }

  stepPaused(
    count: number,
    inputForTick: GameplayTickInputProvider = () => ({}),
  ): GameplayTickResult[] {
    if (!this.clock.paused) return [];
    return this.advanceTicks(count, inputForTick);
  }

  private advanceTick(time: WorldTick, input: GameplayTickInput): GameplayTickResult {
    const phases: WorldStepResult[] = [];
    const aggregate = emptyWorldStepResult();
    const worldPhase = this.world.update(time);
    phases.push(worldPhase);
    mergeWorldStepResult(aggregate, worldPhase);
    this.checkpointPendingHistory(
      worldPhase,
      worldPhase.moves
        .map((move) => move.actorId)
        .filter((id): id is EntityId => id !== undefined),
    );

    const resolved = this.resolveTickInput(input);
    for (const group of resolved.groups) {
      const inputPhase = this.submitIntentGroup(group);
      if (!inputPhase) continue;
      phases.push(inputPhase);
      mergeWorldStepResult(aggregate, inputPhase);
    }
    return {
      time,
      result: aggregate,
      phases,
      inputGroups: resolved.recordedGroups.map((group) => structuredClone(group)),
      inputResolutions: this.resolveInputAttempts(
        resolved.sources,
        resolved.blocked,
        resolved.blockedDisposition,
        phases.slice(1),
      ),
    };
  }

  private resolveTickInput(input: GameplayTickInput): ResolvedTickInput {
    const recordedGroups = (input.groups ?? []).map((group) =>
      structuredClone(group),
    );
    const sources = new Map<string, EntityId[]>();
    const intents: WorldIntent[] = [];
    const claimedActors = new Set<EntityId>();
    for (const move of input.moves ?? []) {
      const group = resolveControlInput(
        input.controls ?? this.controlBindings,
        move.source,
        move.direction,
      );
      const actorIds: EntityId[] = [];
      for (const intent of group.intents) {
        if (claimedActors.has(intent.actorId)) continue;
        claimedActors.add(intent.actorId);
        actorIds.push(intent.actorId);
        intents.push(intent);
      }
      sources.set(move.source, actorIds);
    }
    if (intents.length > 0)
      recordedGroups.push({ intents, historyBoundary: true });

    const normalized: WorldIntentGroup[] = [];
    const blocked: WorldIntent[] = [];
    let blockedDisposition: GameplayInputAttempt = "busy";
    for (const group of recordedGroups) {
      const partition = this.partitionInputIntents(group.intents);
      blocked.push(...partition.blocked);
      if (partition.blocked.length > 0)
        blockedDisposition = this.observeBlockedIntents(partition.blocked);
      if (partition.runnable.length > 0)
        normalized.push({ ...group, intents: partition.runnable });
    }
    return {
      groups: normalized,
      recordedGroups,
      sources,
      blocked,
      blockedDisposition,
    };
  }

  private submitIntentGroup(group: WorldIntentGroup): WorldStepResult | null {
    if (group.intents.length === 0 || !this.world.outcome.playing) return null;
    if (this.historyPolicy.mode !== "disabled" && group.historyBoundary !== false)
      this.pendingHistorySnapshot = this.world.snapshot();
    const result = this.world.step(group);
    this.checkpointPendingHistory(
      result,
      group.intents.map((intent) => intent.actorId),
    );
    return result;
  }

  private checkpointPendingHistory(
    result: WorldStepResult,
    actorIds: readonly EntityId[],
  ): void {
    if (
      !this.pendingHistorySnapshot ||
      !shouldCheckpoint(this.historyPolicy, result, actorIds)
    )
      return;
    this.history.push(this.pendingHistorySnapshot);
    this.future.length = 0;
    this.pendingHistorySnapshot = null;
  }

  private resolveInputAttempts(
    sources: ReadonlyMap<string, readonly EntityId[]>,
    blocked: readonly WorldIntent[],
    blockedDisposition: GameplayInputAttempt,
    inputPhases: readonly WorldStepResult[],
  ): GameplayInputResolution[] {
    const movedActors = new Set(
      inputPhases.flatMap((phase) =>
        phase.moves
          .filter((move) => move.moved && move.actorId !== undefined)
          .map((move) => move.actorId!),
      ),
    );
    return [...sources].map(([source, actorIds]) => ({
      source,
      result: actorIds.some((actorId) => movedActors.has(actorId))
        ? "moved"
        : actorIds.some((actorId) =>
              blocked.some((intent) => intent.actorId === actorId),
            )
          ? blockedDisposition
          : "blocked",
    }));
  }

  private partitionInputIntents(intents: readonly WorldIntent[]): {
    runnable: WorldIntent[];
    blocked: WorldIntent[];
  } {
    const runnable: WorldIntent[] = [];
    const blocked: WorldIntent[] = [];
    for (const intent of intents)
      (this.world.isInputBlockedFor(intent.actorId) ? blocked : runnable).push(
        intent,
      );
    return { runnable, blocked };
  }

  private observeBlockedIntents(
    intents: readonly WorldIntent[],
  ): "busy" | "consumed" {
    return this.world.actions.observeIntents(intents, this.world.query) ===
      "consumed"
      ? "consumed"
      : "busy";
  }

  private configureActorsAndControls(): void {
    const actorIds = this.actorIds;
    this.primaryActorIdValue = actorIds[0] ?? null;
    if (this.configuredControls) {
      this.controlBindings = structuredClone(this.configuredControls);
      return;
    }
    const primary = actorIds[0];
    if (primary === undefined) {
      this.controlBindings = [];
      return;
    }
    const secondary = actorIds[1];
    this.controlBindings = secondary
      ? [
          { input: "arrows", targets: [{ entityId: primary }] },
          { input: "wasd", targets: [{ entityId: secondary }] },
          { input: "pointer", targets: [{ entityId: primary }] },
          { input: "joystick", targets: [{ entityId: primary }] },
          { input: "external", targets: [{ entityId: primary }] },
        ]
      : [
          { input: "arrows", targets: [{ entityId: primary }] },
          { input: "wasd", targets: [{ entityId: primary }] },
          { input: "pointer", targets: [{ entityId: primary }] },
          { input: "joystick", targets: [{ entityId: primary }] },
          { input: "external", targets: [{ entityId: primary }] },
        ];
  }

  private applyRuntimeEntityStateInitializer(): void {
    if (!this.initializeEntityState) return;
    for (const entity of this.world.entities.all()) {
      const patch = this.initializeEntityState(structuredClone(entity));
      if (!patch) continue;
      entity.state = {
        ...(entity.state ?? {}),
        ...structuredClone(patch),
      };
    }
  }

  private gameplayMotionDuration(): number {
    let duration = this.bobbyLocomotion.moveMs;
    if (this.world.state.profile.speedShoes)
      duration *= this.bobbyLocomotion.speedShoesScale;
    return duration;
  }

  private clearHistory(): void {
    this.history.length = 0;
    this.future.length = 0;
    this.pendingHistorySnapshot = null;
  }
}

interface ResolvedTickInput {
  groups: WorldIntentGroup[];
  recordedGroups: WorldIntentGroup[];
  sources: Map<string, EntityId[]>;
  blocked: WorldIntent[];
  blockedDisposition: GameplayInputAttempt;
}
