import type { Direction, LevelMap } from "@bobby/model";
import type { AudioBackend } from "../audio/AudioBackend.js";
import { NullAudioBackend } from "../audio/AudioBackend.js";
import { DebugRuntime } from "../debug/DebugRuntime.js";
import { buildDebugSnapshot } from "../debug/DebugSnapshot.js";
import {
  resolveBobbyLocomotionTiming,
  type BobbyLocomotionTiming,
  type BobbyLocomotionTimingOverride,
} from "../entities/player/BobbyLocomotion.js";
import { readBobbyInventory } from "../entities/player/BobbyState.js";
import { visualRegistry } from "../entities/registry.js";
import type { ImageManager } from "../image/ImageManager.js";
import {
  type ControlBinding,
  resolveControlInput,
} from "../input/ControlBindings.js";
import {
  InputController,
  type InputControllerOptions,
  type InputState,
} from "../input/InputController.js";
import type { RenderScene } from "../render/RenderScene.js";
import { Renderer } from "../render/Renderer.js";
import {
  resolveEngineTiming,
  type EngineTiming,
  type EngineTimingOptions,
} from "../time/EngineTiming.js";
import { PresentationClock } from "../time/PresentationClock.js";
import { WorldClock, type WorldTick } from "../time/WorldClock.js";
import { GameplayHud, type GameplayHudOptions } from "../ui/GameplayHud.js";
import { VisualRuntime } from "../visual/VisualRuntime.js";
import type {
  PresentationTuning,
  PresentationTuningOverride,
} from "../visual/tuning/PresentationTuning.js";
import { resolveOriginalTuning } from "../visual/tuning/original.js";
import type {
  EconomyState,
  ProfileCapabilities,
} from "../world/GlobalState.js";
import { World, type WorldSnapshot } from "../world/World.js";
import type {
  CellInspection,
  MoveResult,
  WinConditionState,
  WorldEvent,
} from "../world/WorldTypes.js";
import type { WorldDelta } from "../world/delta/WorldDelta.js";
import type {
  CellPosition,
  EntityId,
} from "../world/entity/EntityInstance.js";
import type {
  WorldIntent,
  WorldIntentGroup,
} from "../world/movement/WorldIntent.js";
import type {
  EntityMotion,
  WorldStepResult,
} from "../world/movement/WorldStepResult.js";
import { resolveFootprintCells } from "../world/spatial/Footprint.js";
import {
  DEFAULT_HISTORY_POLICY,
  shouldCheckpoint,
  type HistoryPolicy,
} from "./HistoryPolicy.js";
import type { GameplayState } from "./GameplayState.js";

export interface GameRuntimeOptions {
  hud?: boolean | GameplayHudOptions;
  input?: InputControllerOptions;
  tuning?: PresentationTuningOverride;
  bobbyLocomotion?: BobbyLocomotionTimingOverride;
  timing?: EngineTimingOptions;
  history?: HistoryPolicy;
  /** Concrete runtime bindings; callers may also call setControlBindings after load. */
  controls?: readonly ControlBinding[];
}

export interface GameOptions {
  canvas: HTMLCanvasElement;
  images: ImageManager;
  audio?: AudioBackend;
  debug?: boolean;
  profile?: Partial<ProfileCapabilities>;
  economy?: Partial<EconomyState>;
  runtime?: GameRuntimeOptions;
}

type GameEventName =
  | "change"
  | "move"
  | "blocked"
  | "level-loaded"
  | "debug-change"
  | "death"
  | "level-complete";
type Listener = (game: Game) => void;
type WorldEventListener = (event: WorldEvent) => void;
type MoveAttempt = "moved" | "blocked" | "busy" | "consumed";

export class Game {
  readonly audio: AudioBackend;
  readonly inputController: InputController | null;
  private readonly renderer: Renderer;
  private readonly visual: VisualRuntime;
  private readonly gameplayHud: GameplayHud | null;
  private readonly debugRuntime: DebugRuntime;
  private readonly profile: Partial<ProfileCapabilities>;
  private readonly initialEconomy: Partial<EconomyState>;
  private readonly tuning: PresentationTuning;
  private readonly bobbyLocomotion: BobbyLocomotionTiming;
  private readonly timing: EngineTiming;
  private readonly historyPolicy: HistoryPolicy;
  private configuredControls: readonly ControlBinding[] | null;
  private controlBindings: readonly ControlBinding[] = [];
  private primaryActorIdValue: EntityId | null = null;
  private readonly worldClock: WorldClock;
  private readonly presentationClock: PresentationClock;
  private worldValue: World | null = null;
  private initialLevel: LevelMap | null = null;
  private lastScene: RenderScene | null = null;
  private readonly history: WorldSnapshot[] = [];
  private readonly future: WorldSnapshot[] = [];
  private pendingHistorySnapshot: WorldSnapshot | null = null;
  private readonly listeners = new Map<GameEventName, Set<Listener>>();
  private readonly worldEventListeners = new Set<WorldEventListener>();
  private debugValue = false;
  private debugExternalActorId: EntityId | null = null;
  private heldDirection: Direction | null = null;
  private heldDirectionBlocked = false;
  private animationFrame = 0;
  private destroyed = false;
  private lastTimestamp = 0;
  lastMove: MoveResult | null = null;
  lastWorldEvents: WorldEvent[] = [];

  constructor(options: GameOptions) {
    this.renderer = new Renderer(options.canvas, options.images);
    this.visual = new VisualRuntime(
      visualRegistry,
      options.images.sourceTileSize,
    );
    this.audio = options.audio ?? new NullAudioBackend();
    this.profile = options.profile ?? {};
    this.initialEconomy = options.economy ?? {};
    this.tuning = resolveOriginalTuning(options.runtime?.tuning);
    this.bobbyLocomotion = resolveBobbyLocomotionTiming(
      options.runtime?.bobbyLocomotion,
    );
    this.timing = resolveEngineTiming(options.runtime?.timing);
    this.historyPolicy = structuredClone(
      options.runtime?.history ?? DEFAULT_HISTORY_POLICY,
    );
    this.configuredControls = options.runtime?.controls
      ? structuredClone(options.runtime.controls)
      : null;
    this.worldClock = new WorldClock(this.timing.worldHz);
    this.presentationClock = new PresentationClock(this.timing.presentationHz);
    if (typeof performance !== "undefined")
      this.presentationClock.advance(performance.now());
    this.debugValue = options.debug ?? false;
    this.renderer.setDebug(this.debugValue);
    const hud = options.runtime?.hud;
    this.gameplayHud =
      hud === undefined || hud === false
        ? null
        : new GameplayHud(
            this,
            options.images,
            options.canvas,
            hud === true ? {} : hud,
          );
    this.inputController = options.runtime?.input
      ? new InputController(this, options.runtime.input)
      : null;
    this.debugRuntime = new DebugRuntime(options.canvas, {
      snapshot: (selection, actorId) =>
        buildDebugSnapshot({
          world: this.worldValue,
          scene: this.lastScene,
          visual: this.visual,
          worldClock: this.worldClock,
          presentationClock: this.presentationClock,
          timing: this.timing,
          input: this.inputController?.inspectMovement() ?? null,
          actorId,
          selection,
        }),
      inspectPoint: (clientX, clientY) =>
        this.inspectCanvasPoint(clientX, clientY),
      pause: () => this.pauseDebugClock(),
      resume: () => this.resumeDebugClock(),
      step: (count) => this.stepDebugClock(count),
      setHeldDirection: (actorId, direction) =>
        this.setDebugHeldDirection(actorId, direction),
      teleportActor: (actorId, cell) => this.debugTeleportActor(actorId, cell),
      pausePresentation: () => this.pauseDebugPresentationClock(),
      resumePresentation: () => this.resumeDebugPresentationClock(),
      stepPresentation: (frames) => this.stepDebugPresentationClock(frames),
      selectionChanged: (cell) => this.renderer.setDebugSelection(cell),
      requestRender: () => this.render(),
    });
    this.debugRuntime.setEnabled(this.debugValue);
    window.addEventListener("resize", this.onResize);
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  private get world(): World {
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

  get hasLevel(): boolean {
    return this.worldValue !== null;
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.canvas;
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
    const primaryActorId = this.primaryActorIdValue;
    const primary =
      primaryActorId === null ? null : world.entities.get(primaryActorId) ?? null;
    return {
      status: world.dead ? "dead" : world.completed ? "won" : "playing",
      deathReason: state.deathReason,
      moves: state.moves,
      primaryActorId,
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

  get debug(): boolean {
    return this.debugValue;
  }

  get zoom(): number {
    return this.visual.camera.zoom;
  }

  get sourceTileSize(): number {
    return this.visual.camera.sourceTileSize;
  }

  get isAnimating(): boolean {
    return this.visual.isAnimating;
  }

  get canUndo(): boolean {
    return this.history.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  async loadLevel(level: LevelMap): Promise<void> {
    this.initialLevel = structuredClone(level);
    this.worldValue = new World(level, {
      profile: this.profile,
      economy: this.initialEconomy,
    });
    this.world.setMotionDurationMs(this.gameplayMotionDuration());
    this.configureActorsAndControls();
    this.worldClock.reset();
    this.history.length = 0;
    this.future.length = 0;
    this.pendingHistorySnapshot = null;
    this.debugExternalActorId = null;
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.visual.clear();
    this.debugRuntime.clearSelection();
    this.lastScene = null;
    this.lastMove = null;
    this.lastWorldEvents = [];
    await this.renderer.load();
    this.render();
    this.emit("level-loaded");
    this.emit("change");
  }

  setControlBindings(bindings: readonly ControlBinding[]): void {
    const controls = structuredClone(bindings);
    this.configuredControls = controls;
    this.controlBindings = controls;
  }

  move(direction: Direction, source = "external"): MoveResult | null {
    if (
      !this.worldValue ||
      this.worldClock.paused ||
      this.world.dead ||
      this.world.completed
    )
      return null;
    const group = resolveControlInput(
      this.controlBindings,
      source,
      direction,
    );
    const { runnable, blocked } = this.partitionInputIntents(group.intents);
    if (blocked.length > 0) this.observeBlockedIntents(blocked);
    if (runnable.length === 0) return null;
    const result = this.startLogicalStep({ ...group, intents: runnable });
    this.render();
    return result?.moves[0] ?? null;
  }

  setHeldDirection(direction: Direction | null): void {
    if (this.inputController) {
      this.inputController.setHeldDirection(direction);
      return;
    }
    if (direction === this.heldDirection) return;
    this.heldDirection = direction;
    this.heldDirectionBlocked = false;
  }

  undo(): void {
    if (!this.worldValue) return;
    const snapshot = this.history.pop();
    if (!snapshot) return;
    this.future.push(this.world.snapshot());
    this.world.restore(snapshot);
    this.pendingHistorySnapshot = null;
    this.resetVisualMotion();
    this.lastMove = null;
    this.lastWorldEvents = [];
    this.render();
    this.emit("change");
  }

  redo(): void {
    if (!this.worldValue) return;
    const snapshot = this.future.pop();
    if (!snapshot) return;
    this.history.push(this.world.snapshot());
    this.world.restore(snapshot);
    this.pendingHistorySnapshot = null;
    this.resetVisualMotion();
    this.lastMove = null;
    this.lastWorldEvents = [];
    this.render();
    this.emit("change");
  }

  restart(): void {
    if (!this.initialLevel) return;
    const wasPaused = this.worldClock.paused;
    const profile = this.worldValue
      ? structuredClone(this.world.state.profile)
      : this.profile;
    const economy = this.worldValue
      ? structuredClone(this.world.state.economy)
      : this.initialEconomy;
    Object.assign(this.profile, profile);
    this.worldValue = new World(this.initialLevel, { profile, economy });
    this.world.setMotionDurationMs(this.gameplayMotionDuration());
    this.configureActorsAndControls();
    this.worldClock.reset();
    if (wasPaused) this.worldClock.pause();
    this.history.length = 0;
    this.future.length = 0;
    this.pendingHistorySnapshot = null;
    this.debugExternalActorId = null;
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.resetVisualMotion();
    this.debugRuntime.clearSelection();
    this.lastScene = null;
    this.lastMove = null;
    this.lastWorldEvents = [];
    this.render();
    this.emit("change");
  }

  killPlayer(reason?: string): void {
    if (!this.worldValue || this.primaryActorIdValue === null) return;
    this.killActor(this.primaryActorIdValue, reason);
  }

  killActor(actorId: EntityId, reason?: string): void {
    if (!this.worldValue) return;
    if (!this.world.entities.get(actorId)) return;
    const result = this.world.downActor(actorId, reason);
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.consumeWorldDeltas(result.deltas);
    this.lastWorldEvents = result.events;
    this.publishWorldEvents(result.events);
    this.render();
    this.emitTerminalEvents();
    this.emit("change");
  }

  /** 仅提供 engine 能力；具体复活机制决定条件、距离和消耗。 */
  reviveActor(actorId: EntityId): void {
    if (!this.worldValue) return;
    const result = this.world.reviveActor(actorId);
    if (result.events.length === 0) return;
    this.consumeWorldDeltas(result.deltas);
    this.lastWorldEvents = result.events;
    this.publishWorldEvents(result.events);
    this.render();
    this.emit("change");
  }

  setProfile(profile: Partial<ProfileCapabilities>): void {
    Object.assign(this.profile, profile);
    if (this.worldValue) {
      this.world.setProfile(profile);
      this.world.setMotionDurationMs(this.gameplayMotionDuration());
    }
  }

  setEconomy(economy: Partial<EconomyState>): void {
    if (this.worldValue) this.world.setEconomy(economy);
  }

  setZoom(value: number): void {
    this.visual.camera.setZoom(value);
    this.render();
  }

  setZoomLimits(min: number, max?: number): void {
    this.visual.camera.setZoomLimits(min, max);
    this.render();
  }

  zoomBy(factor: number): void {
    this.setZoom(this.zoom * factor);
  }

  panByScreen(dx: number, dy: number): void {
    this.visual.camera.panByScreen(dx, dy);
    this.render();
  }

  setDebug(value: boolean): void {
    if (value === this.debugValue) return;
    if (!value && this.worldClock.paused) this.resumeDebugClock();
    if (!value && this.presentationClock.paused)
      this.resumeDebugPresentationClock();
    this.debugValue = value;
    this.renderer.setDebug(value);
    this.debugRuntime.setEnabled(value);
    this.render();
    this.emit("debug-change");
  }

  toggleDebug(): void {
    this.setDebug(!this.debugValue);
  }

  inspectCanvasPoint(
    clientX: number,
    clientY: number,
  ): CellInspection | null {
    if (!this.worldValue) return null;
    const rect = this.canvas.getBoundingClientRect();
    const cell = this.visual.camera.screenToTile(
      clientX - rect.left,
      clientY - rect.top,
    );
    return this.world.inspect(cell.x, cell.y);
  }

  render(): void {
    this.renderScene();
    this.gameplayHud?.render();
    this.debugRuntime.render();
  }

  on(event: GameEventName, listener: Listener): () => void {
    const listeners = this.listeners.get(event) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return () => listeners.delete(listener);
  }

  onWorldEvent(listener: WorldEventListener): () => void {
    this.worldEventListeners.add(listener);
    return () => this.worldEventListeners.delete(listener);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.onResize);
    this.inputController?.destroy();
    this.gameplayHud?.destroy();
    this.debugRuntime.destroy();
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

  private startLogicalStep(group: WorldIntentGroup): WorldStepResult | null {
    if (group.intents.length === 0) return null;
    const before = this.world.snapshot();
    if (group.historyBoundary !== false) this.pendingHistorySnapshot = before;

    const result = this.world.step(group);
    this.lastMove = result.moves[0] ?? null;
    this.lastWorldEvents = result.events;

    const controlledIds = group.intents.map((intent) => intent.actorId);
    this.checkpointPendingHistory(result, controlledIds);
    this.consumeWorldDeltas(result.deltas);
    this.publishWorldEvents(result.events);
    this.emitTerminalEvents();

    if (result.motions.length === 0) {
      this.emit("blocked");
      this.emit("change");
      return result;
    }

    this.emit("move");
    this.emit("change");
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

  private consumeWorldDeltas(deltas: readonly WorldDelta[]): void {
    if (deltas.length === 0) return;
    const frame = this.presentationClock.current;
    this.visual.camera.recenterPan(frame);
    this.visual.consumeWorldDeltas(this.world, deltas, frame, {
      motionDuration: (motion) => this.motionPresentationDuration(motion),
      stationaryDeathDurationMs: this.presentationMotionDuration(),
    });
  }

  private motionPresentationDuration(motion: EntityMotion): number {
    if (
      motion.cause.type === "forced" &&
      motion.cause.cadenceMs !== undefined &&
      Number.isFinite(motion.cause.cadenceMs) &&
      motion.cause.cadenceMs > 0
    )
      return motion.cause.cadenceMs;
    return this.presentationMotionDuration();
  }

  private gameplayMotionDuration(): number {
    let duration = this.bobbyLocomotion.moveMs;
    if (this.world.state.profile.speedShoes)
      duration *= this.bobbyLocomotion.speedShoesScale;
    return duration;
  }

  private presentationMotionDuration(): number {
    const motion = this.tuning.motion;
    let duration = motion.normalMs;
    if (this.world.state.profile.speedShoes)
      duration *= motion.speedShoesScale;
    return duration;
  }

  private updateWorld(time: WorldTick): void {
    if (!this.worldValue) return;

    const result = this.world.update(time);
    this.consumeWorldDeltas(result.deltas);
    if (result.moves.length > 0) this.lastMove = result.moves[0] ?? null;
    if (result.events.length > 0) {
      this.lastWorldEvents = result.events;
      this.publishWorldEvents(result.events);
      this.emitTerminalEvents();
    }
    if (result.motions.length > 0) {
      const actorIds = result.moves
        .map((move) => move.actorId)
        .filter((id): id is EntityId => id !== undefined);
      this.checkpointPendingHistory(result, actorIds);
      this.emit("move");
    }
    if (
      result.events.length > 0 ||
      result.motions.length > 0 ||
      result.deltas.length > 0
    )
      this.emit("change");

    if (this.world.dead || this.world.completed) {
      this.heldDirection = null;
      return;
    }

    const input = this.inputController?.update(time) ?? null;
    if (input) this.applyInput(input);
    else this.applyDirectHeldInput();
  }

  private applyInput(input: InputState): void {
    if (!this.inputController || input.moves.length === 0) return;

    if (!this.worldValue || this.world.dead || this.world.completed) {
      this.resolveInputAttempts(input, "blocked");
      return;
    }

    const intents: WorldIntentGroup["intents"] = [];
    const actorsBySource = new Map<string, EntityId[]>();
    const claimedActors = new Set<EntityId>();

    for (const move of input.moves) {
      const group = this.resolveRuntimeControlInput(move.source, move.direction);
      const actorIds: EntityId[] = [];
      for (const intent of group.intents) {
        if (claimedActors.has(intent.actorId)) continue;
        claimedActors.add(intent.actorId);
        actorIds.push(intent.actorId);
        intents.push(intent);
      }
      actorsBySource.set(move.source, actorIds);
    }

    if (intents.length === 0) {
      this.resolveInputAttempts(input, "blocked");
      return;
    }
    const { runnable, blocked } = this.partitionInputIntents(intents);
    const blockedDisposition =
      blocked.length > 0 ? this.observeBlockedIntents(blocked) : "busy";
    if (runnable.length === 0) {
      const disposition = blockedDisposition;
      this.resolveInputAttempts(input, disposition);
      return;
    }

    const result = this.startLogicalStep({
      intents: runnable,
      historyBoundary: true,
    });
    const movedActors = new Set(
      result?.moves
        .filter((move) => move.moved && move.actorId !== undefined)
        .map((move) => move.actorId!) ?? [],
    );
    this.inputController.resolveMoveAttempts(
      input.moves.map((move) => ({
        source: move.source,
        result: (actorsBySource.get(move.source) ?? []).some((actorId) =>
          movedActors.has(actorId),
        )
          ? "moved"
          : (actorsBySource.get(move.source) ?? []).some((actorId) =>
                blocked.some((intent) => intent.actorId === actorId),
              )
            ? blockedDisposition
            : "blocked",
      })),
    );
  }

  private resolveInputAttempts(
    input: InputState,
    result: MoveAttempt,
  ): void {
    this.inputController?.resolveMoveAttempts(
      input.moves.map((move) => ({ source: move.source, result })),
    );
  }

  private observeBlockedIntents(
    intents: readonly WorldIntent[],
  ): "busy" | "consumed" {
    return this.world.actions.observeIntents(intents, this.world.query) ===
      "consumed"
      ? "consumed"
      : "busy";
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

  private resolveRuntimeControlInput(
    source: string,
    direction: Direction,
  ): WorldIntentGroup {
    if (source === "external" && this.debugExternalActorId !== null)
      return resolveControlInput(
        [
          {
            input: "external",
            targets: [{ entityId: this.debugExternalActorId }],
          },
        ],
        source,
        direction,
      );
    return resolveControlInput(this.controlBindings, source, direction);
  }

  private applyDirectHeldInput(): void {
    if (
      !this.heldDirection ||
      this.heldDirectionBlocked ||
      !this.worldValue ||
      this.world.dead ||
      this.world.completed
    )
      return;
    const group = this.resolveRuntimeControlInput(
      "external",
      this.heldDirection,
    );
    const { runnable, blocked } = this.partitionInputIntents(group.intents);
    if (blocked.length > 0) {
      if (this.observeBlockedIntents(blocked) === "consumed")
        this.heldDirectionBlocked = true;
    }
    if (runnable.length === 0) return;
    const result = this.startLogicalStep({ ...group, intents: runnable });
    if (!result?.moves.some((move) => move.moved))
      this.heldDirectionBlocked = true;
  }

  private setDebugHeldDirection(
    actorId: EntityId,
    direction: Direction | null,
  ): void {
    if (direction === null) {
      if (this.debugExternalActorId === actorId)
        this.debugExternalActorId = null;
      this.setHeldDirection(null);
      return;
    }
    this.debugExternalActorId = actorId;
    this.setHeldDirection(direction);
  }

  private debugTeleportActor(actorId: EntityId, cell: CellPosition): boolean {
    if (!this.debugValue || !this.worldValue) return false;
    const actor = this.world.entities.get(actorId);
    if (!actor || !this.actorIds.includes(actorId)) return false;
    const definition = this.world.definition(actorId);
    const footprint = resolveFootprintCells(
      {
        anchor: cell,
        ...(actor.direction ? { direction: actor.direction } : {}),
      },
      definition.footprint,
    );
    if (!footprint.every((part) => this.world.spatial.inBounds(part)))
      return false;

    this.world.actions.cancelOwnedBy(actorId);
    this.world.movement.clearEntity(actorId);
    this.pendingHistorySnapshot = null;
    if (this.debugExternalActorId === actorId)
      this.setDebugHeldDirection(actorId, null);
    this.world.spatial.moveEntity(actorId, cell);
    this.visual.clearEntity(actorId);
    this.lastMove = null;
    this.lastWorldEvents = [];
    return true;
  }

  private resetVisualMotion(): void {
    this.visual.clear();
  }

  private pauseDebugClock(): void {
    if (this.worldClock.paused) return;
    this.worldClock.pause();
    this.render();
  }

  private resumeDebugClock(): void {
    if (!this.worldClock.paused) return;
    this.worldClock.resume();
    this.render();
  }

  private stepDebugClock(count: number): void {
    this.worldClock.step(count, (time) => this.updateWorld(time));
    this.render();
  }

  private pauseDebugPresentationClock(): void {
    if (this.presentationClock.paused) return;
    this.presentationClock.pause();
    this.render();
  }

  private resumeDebugPresentationClock(): void {
    if (!this.presentationClock.paused) return;
    this.presentationClock.resume();
    this.render();
  }

  private stepDebugPresentationClock(frames: number): void {
    const frame = this.presentationClock.step(frames);
    if (frame && this.worldValue)
      this.visual.update(frame, this.tuning.motion.easing);
    this.render();
  }

  private renderScene(): void {
    if (!this.worldValue) {
      this.lastScene = null;
      return;
    }
    const viewport = this.renderer.measureViewport();
    this.visual.camera.setViewport(viewport.width, viewport.height);
    const scene = this.visual.scene(
      this.worldValue,
      this.world.cameraTarget,
    );
    this.lastScene = scene;
    this.renderer.render(scene, this.visual.camera, viewport);
  }

  private readonly onResize = (): void => {
    this.render();
  };

  private readonly tick = (timestamp: number): void => {
    if (this.destroyed) return;
    const delta = this.lastTimestamp > 0 ? timestamp - this.lastTimestamp : 0;
    this.lastTimestamp = timestamp;

    let worldUpdated = 0;
    if (this.worldValue && delta > 0)
      worldUpdated = this.worldClock.advance(delta, (time) =>
        this.updateWorld(time),
      );

    const frame = this.presentationClock.advance(timestamp);
    if (this.worldValue && frame) {
      const wasAnimating = this.visual.isAnimating;
      this.visual.update(frame, this.tuning.motion.easing);
      this.renderScene();
      if (this.debugValue) this.debugRuntime.render();
      if (wasAnimating && !this.visual.isAnimating) this.emit("change");
    } else if (worldUpdated > 0) {
      this.render();
    }
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private publishWorldEvents(events: readonly WorldEvent[]): void {
    for (const event of events) {
      if (event.type === "speed-impact")
        this.visual.camera.shake(this.presentationClock.current);
      for (const listener of this.worldEventListeners) listener(event);
    }
  }

  private emitTerminalEvents(): void {
    if (!this.worldValue) return;
    if (this.world.dead) this.emit("death");
    if (this.world.completed) this.emit("level-complete");
  }

  private emit(event: GameEventName): void {
    for (const listener of this.listeners.get(event) ?? []) listener(this);
  }
}
