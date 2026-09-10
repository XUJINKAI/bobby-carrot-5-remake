import type { Direction, LevelMap } from "@bobby/model";
import {
  resolveBobbyLocomotionTiming,
  type BobbyLocomotionTiming,
  type BobbyLocomotionTimingOverride,
} from "../entities/player/BobbyLocomotion.js";
import {
  readBobbyInventory,
  readBobbyLocomotionMoveMs,
} from "../entities/player/BobbyState.js";
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
import { World, type WorldSnapshot } from "../world/World.js";
import type { MoveResult, WinConditionState } from "../world/WorldTypes.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type {
  WorldIntent,
  WorldIntentGroup,
  InitialActorIntent,
  ActorEffectIntent,
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
  timing?: EngineTimingOptions;
  bobbyLocomotion?: BobbyLocomotionTimingOverride;
  history?: HistoryPolicy;
  controls?: readonly ControlBinding[];
  initialActorIntents?: readonly InitialActorIntent[];
  /** ReplayRunner 使用的已解析 tick 0 动作。 */
  initialIntents?: readonly ActorEffectIntent[];
}

export interface SerializableGameplaySetup {
  worldHz: number;
  bobbyLocomotion: BobbyLocomotionTiming;
  initialIntents: readonly ActorEffectIntent[];
}

export type GameplayTickInputProvider = (time: WorldTick) => GameplayTickInput;

/**
 * 一局地图的纯 gameplay 运行边界。浏览器 Game 与 ReplayRunner 都通过这里
 * 组织固定 Tick、玩家输入、World 初始化和历史记录。
 */
export class GameplaySession {
  readonly clock: WorldClock;
  readonly bobbyLocomotion: BobbyLocomotionTiming;
  private readonly historyPolicy: HistoryPolicy;
  private readonly initialActorIntents: readonly InitialActorIntent[];
  private readonly configuredInitialIntents: readonly ActorEffectIntent[] | null;
  private initialIntentsValue: readonly ActorEffectIntent[] = [];
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
    this.historyPolicy = structuredClone(
      options.history ?? DEFAULT_HISTORY_POLICY,
    );
    this.initialActorIntents = structuredClone(options.initialActorIntents ?? []);
    this.configuredInitialIntents = options.initialIntents
      ? structuredClone(options.initialIntents)
      : null;
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
        inventory: readBobbyInventory(entity.state),
        moveDurationMs:
          readBobbyLocomotionMoveMs(entity.state) ?? this.bobbyLocomotion.moveMs,
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
    return {
      worldHz: this.clock.hz,
      bobbyLocomotion: structuredClone(this.bobbyLocomotion),
      initialIntents: structuredClone(this.initialIntentsValue),
    };
  }

  loadLevel(level: LevelMap): void {
    this.initialLevel = structuredClone(level);
    this.worldValue = new World(level);
    this.world.setMotionDurationMs(this.gameplayMotionDuration());
    this.configureActorsAndControls();
    this.applyInitialActorIntents(this.configuredInitialIntents ?? undefined);
    this.clock.reset();
    this.clearHistory();
  }

  restart(initialIntents?: readonly ActorEffectIntent[]): void {
    if (!this.initialLevel) return;
    const wasPaused = this.clock.paused;
    this.worldValue = new World(this.initialLevel);
    this.world.setMotionDurationMs(this.gameplayMotionDuration());
    this.configureActorsAndControls();
    this.applyInitialActorIntents(
      initialIntents ?? this.configuredInitialIntents ?? undefined,
    );
    this.clock.reset();
    if (wasPaused) this.clock.pause();
    this.clearHistory();
  }

  setControlBindings(bindings: readonly ControlBinding[]): void {
    const controls = structuredClone(bindings);
    this.configuredControls = controls;
    this.controlBindings = controls;
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
    for (const intent of intents) {
      const actorBusy =
        intent.type === "move" && this.world.isInputBlockedFor(intent.actorId);
      (actorBusy ? blocked : runnable).push(intent);
    }
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
    const targets = actorIds.map((entityId) => {
      const state = this.world.entities.require(entityId).state;
      return {
        controller:
          state?.["controller"] === "channel-2"
            ? ("channel-2" as const)
            : ("channel-1" as const),
        target: {
          entityId,
          directionTransform: {
            mirrorX: state?.["mirrorX"] === true,
            mirrorY: state?.["mirrorY"] === true,
          },
        },
      };
    });
    const channel1 = targets
      .filter(({ controller }) => controller === "channel-1")
      .map(({ target }) => target);
    const channel2 = targets
      .filter(({ controller }) => controller === "channel-2")
      .map(({ target }) => target);
    const primaryTargets = channel1.length > 0 ? channel1 : channel2;
    this.primaryActorIdValue = primaryTargets[0]?.entityId ?? null;
    if (this.configuredControls) {
      this.controlBindings = structuredClone(this.configuredControls);
      return;
    }
    if (primaryTargets.length === 0) {
      this.controlBindings = [];
      return;
    }
    this.controlBindings = [
      { input: "arrows", targets: primaryTargets },
      {
        input: "wasd",
        targets: channel1.length > 0 && channel2.length > 0
          ? channel2
          : primaryTargets,
      },
      { input: "pointer", targets: primaryTargets },
      { input: "joystick", targets: primaryTargets },
      { input: "external", targets: primaryTargets },
    ];
  }

  private gameplayMotionDuration(): number {
    return this.bobbyLocomotion.moveMs;
  }

  private applyInitialActorIntents(
    resolvedIntents?: readonly ActorEffectIntent[],
  ): void {
    const intents: ActorEffectIntent[] = resolvedIntents
      ? [...structuredClone(resolvedIntents)]
      : [];
    if (resolvedIntents) {
      this.initialIntentsValue = structuredClone(intents);
      if (intents.length > 0)
        this.world.step({ intents, historyBoundary: false });
      return;
    }
    for (const intent of this.initialActorIntents) {
      const targets = intent.actor === "all"
        ? this.actorIds
        : this.primaryActorIdValue === null
          ? []
          : [this.primaryActorIdValue];
      for (const actorId of targets) {
        if (intent.type === "set-actor-lock-key") {
          intents.push({
            type: intent.type,
            actorId,
            kind: intent.kind,
            enabled: intent.enabled,
          });
        } else {
          intents.push({
            type: intent.type,
            actorId,
            moveDurationMs: intent.moveDurationMs,
          });
        }
      }
    }
    this.initialIntentsValue = structuredClone(intents);
    if (intents.length > 0)
      this.world.step({ intents, historyBoundary: false });
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
