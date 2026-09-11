import type { Direction, LevelMap } from "@bobby/model";
import type { AudioBackend } from "../audio/AudioBackend.js";
import { NullAudioBackend } from "../audio/AudioBackend.js";
import { DebugRuntime } from "../debug/DebugRuntime.js";
import { buildDebugSnapshot } from "../debug/DebugSnapshot.js";
import { visualRegistry } from "../entities/registry.js";
import type { ControlBinding } from "../input/ControlBindings.js";
import {
  InputController,
  type LogicalMoveInput,
} from "../input/InputController.js";
import type { RenderScene } from "../render/RenderScene.js";
import { Renderer } from "../render/Renderer.js";
import {
  resolveEngineTiming,
  type EngineTiming,
} from "../time/EngineTiming.js";
import { PresentationClock } from "../time/PresentationClock.js";
import type { WorldClock, WorldTick } from "../time/WorldClock.js";
import { GameplayHud } from "../ui/GameplayHud.js";
import { VisualRuntime } from "../visual/VisualRuntime.js";
import type {
  PresentationTuning,
} from "../visual/tuning/PresentationTuning.js";
import { resolveOriginalTuning } from "../visual/tuning/original.js";
import type { World } from "../world/World.js";
import type {
  CellInspection,
  MoveResult,
  ObjectInteractionEvent,
  WinConditionState,
  WorldEvent,
} from "../world/WorldTypes.js";
import { isObjectInteractionEvent } from "../world/WorldTypes.js";
import type { WorldDelta } from "../world/delta/WorldDelta.js";
import type {
  CellPosition,
  EntityId,
} from "../world/entity/EntityInstance.js";
import type {
  EntityMotion,
} from "../world/movement/WorldStepResult.js";
import type {
  ActorEffectIntent,
  GameplayEffectIntent,
  WorldIntentGroup,
} from "../world/movement/WorldIntent.js";
import { resolveFootprintCells } from "../world/spatial/Footprint.js";
import type { Replay, ReplayRecordingMeta } from "../replay/ReplayFormat.js";
import {
  ReplayPlayback,
  type ReplayPlaybackOptions,
} from "../replay/ReplayPlayback.js";
import { ReplayRecorder } from "../replay/ReplayRecorder.js";
import { runReplay, type ReplayReport } from "../replay/ReplayRunner.js";
import type { GameplayState } from "./GameplayState.js";
import type {
  GameOptions,
} from "./GameOptions.js";
import {
  GameplaySession,
  type GameplayTickInput,
  type GameplayTickResult,
} from "./GameplaySession.js";
import { prepareRuntimeLevel } from "./RuntimeLevel.js";

type GameEventName =
  | "change"
  | "tick"
  | "move"
  | "blocked"
  | "level-loaded"
  | "debug-change"
  | "death"
  | "level-complete";
type Listener = (game: Game) => void;
type WorldEventListener = (event: WorldEvent) => void;
type InteractionRequestListener = (event: ObjectInteractionEvent) => void;

const MAX_REPLAY_IDLE_TICKS_PER_FRAME = 128;
const REPLAY_IDLE_FRAME_BUDGET_MS = 6;

export class Game {
  readonly audio: AudioBackend;
  readonly inputController: InputController | null;
  private readonly renderer: Renderer;
  private readonly visual: VisualRuntime;
  private readonly gameplayHud: GameplayHud | null;
  private readonly debugRuntime: DebugRuntime;
  private readonly tuning: PresentationTuning;
  private readonly timing: EngineTiming;
  private readonly session: GameplaySession;
  private readonly presentationClock: PresentationClock;
  private lastScene: RenderScene | null = null;
  private readonly listeners = new Map<GameEventName, Set<Listener>>();
  private readonly worldEventListeners = new Set<WorldEventListener>();
  private readonly interactionRequestListeners =
    new Set<InteractionRequestListener>();
  private debugValue = false;
  private debugExternalActorId: EntityId | null = null;
  private heldDirection: Direction | null = null;
  private heldDirectionBlocked = false;
  private readonly queuedMoves: LogicalMoveInput[] = [];
  private readonly queuedIntentGroups: WorldIntentGroup[] = [];
  private replayRecorder: ReplayRecorder | null = null;
  private readonly replayPlayback: ReplayPlayback;
  private levelLoadPending = false;
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
      options.runtime?.camera,
    );
    this.audio = options.audio ?? new NullAudioBackend();
    this.tuning = resolveOriginalTuning(options.runtime?.tuning);
    this.timing = resolveEngineTiming(options.runtime?.timing);
    this.session = new GameplaySession({
      ...(options.runtime?.timing ? { timing: options.runtime.timing } : {}),
      ...(options.runtime?.bobbyLocomotion
        ? { bobbyLocomotion: options.runtime.bobbyLocomotion }
        : {}),
      ...(options.runtime?.history ? { history: options.runtime.history } : {}),
      ...(options.runtime?.controls ? { controls: options.runtime.controls } : {}),
      ...(options.runtime?.initialActorIntents
        ? { initialActorIntents: options.runtime.initialActorIntents }
        : {}),
    });
    this.presentationClock = new PresentationClock(
      this.timing.presentationHz,
      this.timing.presentationSpeed,
    );
    this.replayPlayback = new ReplayPlayback(
      this.session,
      this.presentationClock,
    );
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
          setup: this.session.replaySetup,
          controls: this.session.controls,
          gameplayState: this.worldValue ? this.session.state : null,
          pendingIntents: this.queuedIntentGroups.flatMap((group) =>
            group.intents.filter(
              (intent): intent is ActorEffectIntent =>
                intent.type !== "move" &&
                intent.type !== "commit-entity-replacement",
            ),
          ),
          replay: {
            recording: this.replayRecording,
            playing: this.replayPlaying,
            paused: this.replayPaused,
          },
          actorId,
          selection,
        }),
      inspectPoint: (clientX, clientY) =>
        this.inspectCanvasPoint(clientX, clientY),
      pause: () => this.pauseDebugClock(),
      resume: () => this.resumeDebugClock(),
      step: (count) => this.stepDebugClock(count),
      setWorldHz: (hz) => this.setDebugWorldHz(hz),
      setWorldSpeed: (speed) => this.setDebugWorldSpeed(speed),
      setHeldDirection: (actorId, direction) =>
        this.setDebugHeldDirection(actorId, direction),
      teleportActor: (actorId, cell) => this.debugTeleportActor(actorId, cell),
      dispatchIntent: (intent) => this.dispatch(intent),
      pausePresentation: () => this.pauseDebugPresentationClock(),
      resumePresentation: () => this.resumeDebugPresentationClock(),
      stepPresentation: (frames) => this.stepDebugPresentationClock(frames),
      setPresentationHz: (hz) => this.setDebugPresentationHz(hz),
      setPresentationSpeed: (speed) =>
        this.setDebugPresentationSpeed(speed),
      selectionChanged: (cell) => this.renderer.setDebugSelection(cell),
      requestRender: () => this.render(),
    });
    this.debugRuntime.setEnabled(this.debugValue);
    window.addEventListener("resize", this.onResize);
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  private get world(): World {
    return this.session.world;
  }

  private get worldValue(): World | null {
    return this.session.hasLevel ? this.session.world : null;
  }

  private get worldClock(): WorldClock {
    return this.session.clock;
  }

  get actorIds(): readonly EntityId[] {
    return this.session.actorIds;
  }

  get controls(): readonly ControlBinding[] {
    return this.session.controls;
  }

  get hasLevel(): boolean {
    return this.session.hasLevel;
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.canvas;
  }

  get state(): GameplayState {
    return this.session.state;
  }

  get winState(): WinConditionState | null {
    return this.session.winState;
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

  get timedChallengeRemainingMs(): number | null {
    return this.worldValue
      ? this.session.state.timedChallengeRemainingMs
      : null;
  }

  get timedChallengePhase(): "waiting" | "running" | null {
    return this.worldValue ? this.session.state.timedChallengePhase : null;
  }

  /** 关卡载入与 Bobby 出现阶段丢弃 gameplay 输入，不把它们延迟到首个 WorldTick。 */
  get presentationBlocksInput(): boolean {
    return this.levelLoadPending || this.visual.blocksGameplay;
  }

  get canUndo(): boolean {
    return this.session.canUndo;
  }

  get canRedo(): boolean {
    return this.session.canRedo;
  }

  get replayRecording(): boolean {
    return this.replayRecorder !== null;
  }

  get replayPlaying(): boolean {
    return this.replayPlayback.playing;
  }

  get replayPaused(): boolean {
    return this.replayPlayback.paused;
  }

  get replayTickCount(): number {
    return this.worldClock.tickCount;
  }

  async loadLevel(level: LevelMap): Promise<void> {
    this.levelLoadPending = true;
    this.replayPlayback.stop();
    this.session.loadLevel(prepareRuntimeLevel(level));
    this.debugExternalActorId = null;
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.queuedMoves.length = 0;
    this.queuedIntentGroups.length = 0;
    this.visual.clear();
    this.visual.camera.resetFollow();
    this.visual.camera.resetPan();
    this.debugRuntime.clearSelection();
    this.lastScene = null;
    this.lastMove = null;
    this.lastWorldEvents = [];
    try {
      await this.renderer.load();
    } catch (error) {
      this.levelLoadPending = false;
      throw error;
    }
    this.beginLevelPresentation();
    this.levelLoadPending = false;
    this.render();
    this.emit("level-loaded");
    this.emit("change");
  }

  setControlBindings(bindings: readonly ControlBinding[]): void {
    this.session.setControlBindings(bindings);
  }

  move(direction: Direction, source = "external"): void {
    if (
      !this.worldValue ||
      this.replayPlayback.playing ||
      this.worldClock.paused ||
      this.presentationBlocksInput ||
      this.world.dead ||
      this.world.completed
    )
      return;
    this.queuedMoves.push({ source, direction });
  }

  /** 将封闭的地图内语义动作排入下一个 World Tick。 */
  dispatch(intent: GameplayEffectIntent): void {
    if (
      !this.worldValue ||
      this.replayPlayback.playing ||
      this.world.dead ||
      this.world.completed
    )
      return;
    this.queuedIntentGroups.push({
      intents: [structuredClone(intent)],
      historyBoundary: intent.type !== "commit-entity-replacement",
    });
  }

  setHeldDirection(direction: Direction | null): void {
    if (this.replayPlayback.playing) return;
    if (direction !== null && this.presentationBlocksInput) return;
    if (this.inputController) {
      this.inputController.setHeldDirection(direction);
      return;
    }
    if (direction === this.heldDirection) return;
    this.heldDirection = direction;
    this.heldDirectionBlocked = false;
  }

  undo(): void {
    if (!this.session.undo()) return;
    this.resetVisualMotion();
    this.lastMove = null;
    this.lastWorldEvents = [];
    this.render();
    this.emit("change");
  }

  redo(): void {
    if (!this.session.redo()) return;
    this.resetVisualMotion();
    this.lastMove = null;
    this.lastWorldEvents = [];
    this.render();
    this.emit("change");
  }

  restart(): void {
    if (!this.session.hasLevel) return;
    this.replayPlayback.stop();
    this.replayRecorder = null;
    this.session.restart();
    this.resetSessionView();
    this.render();
    this.emit("change");
  }

  private resetSessionView(): void {
    this.debugExternalActorId = null;
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.queuedMoves.length = 0;
    this.queuedIntentGroups.length = 0;
    this.resetVisualMotion();
    this.beginLevelPresentation();
    this.debugRuntime.clearSelection();
    this.lastScene = null;
    this.lastMove = null;
    this.lastWorldEvents = [];
  }

  startReplayRecording(meta: ReplayRecordingMeta): void {
    if (!this.session.hasLevel) throw new Error("尚未载入关卡");
    this.replayRecorder = null;
    this.restart();
    this.replayRecorder = new ReplayRecorder(this.session, meta);
    this.emit("change");
  }

  stopReplayRecording(): Replay {
    const recorder = this.replayRecorder;
    if (!recorder) throw new Error("Replay 录制尚未开始");
    this.replayRecorder = null;
    const replay = recorder.stop();
    this.emit("change");
    return replay;
  }

  verifyReplay(replay: Replay): ReplayReport {
    return runReplay(this.session.level, replay);
  }

  startReplayPlayback(
    replay: Replay,
    options: ReplayPlaybackOptions = {},
  ): void {
    this.replayRecorder = null;
    this.replayPlayback.start(replay, options);
    this.resetSessionView();
    this.render();
    this.emit("change");
  }

  /** 同时设置 gameplay 与表现层相对真实时间的推进倍率。 */
  setTimeScale(speed: number): void {
    if (!Number.isFinite(speed) || speed <= 0) return;
    this.worldClock.setSpeed(speed);
    this.presentationClock.setSpeed(speed);
    this.render();
    this.emit("change");
  }

  pauseReplayPlayback(): void {
    this.changeReplayPlayback("pause");
  }
  resumeReplayPlayback(): void {
    this.changeReplayPlayback("resume");
  }

  stopReplayPlayback(): void {
    this.changeReplayPlayback("stop");
  }

  private changeReplayPlayback(action: "pause" | "resume" | "stop"): void {
    if (!this.replayPlayback.playing) return;
    this.replayPlayback[action]();
    this.render();
    this.emit("change");
  }

  jumpReplayToEnd(replay: Replay): void {
    this.replayRecorder = null;
    const ticks = this.replayPlayback.jumpToEnd(replay);
    this.resetSessionView();
    for (const tick of ticks) {
      if (tick.result.moves.length > 0)
        this.lastMove = tick.result.moves[0] ?? null;
      if (tick.result.events.length > 0)
        this.lastWorldEvents = tick.result.events;
    }
    this.render();
    this.emitTerminalEvents();
    this.emit("change");
  }

  killPlayer(reason?: string): void {
    const primaryActorId = this.session.state.primaryActorId;
    if (primaryActorId === null) return;
    this.killActor(primaryActorId, reason);
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

  setZoom(value: number): void {
    this.visual.camera.setZoom(value);
    this.render();
  }

  setZoomAt(value: number, clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.visual.camera.setZoomAt(value, clientX - rect.left, clientY - rect.top);
    this.render();
  }

  setZoomLimits(min: number, max?: number): void {
    this.visual.camera.setZoomLimits(min, max);
    this.render();
  }

  zoomBy(factor: number): void {
    this.visual.camera.zoomBy(factor);
    this.render();
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

  /** 只在 live session 通知外层控制器；Replay 仍保留普通 WorldEvent。 */
  onInteractionRequest(listener: InteractionRequestListener): () => void {
    this.interactionRequestListeners.add(listener);
    return () => this.interactionRequestListeners.delete(listener);
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

  private consumeWorldDeltas(deltas: readonly WorldDelta[]): void {
    if (deltas.length === 0) return;
    const frame = this.presentationClock.current;
    this.debugRuntime.recordWorldDeltas(deltas, frame.frame);
    this.visual.camera.recenterPan(frame);
    this.visual.consumeWorldDeltas(this.world, deltas, frame, {
      motionDuration: (motion) => this.motionPresentationDuration(motion),
      stationaryDeathDurationMs: this.presentationMotionDuration(),
      levelExitDurationMs: this.tuning.levelTransition.exitMs,
    });
  }

  private faceBlockedActors(moves: readonly MoveResult[]): void {
    const frame = this.presentationClock.current;
    for (const move of moves) {
      if (!move.blocked || move.actorId === undefined) continue;
      if (!this.world.query.entityHasTrait(move.actorId, "player")) continue;
      this.visual.faceDirection(move.actorId, move.direction, frame);
    }
  }

  private motionPresentationDuration(motion: EntityMotion): number {
    return motion.durationMs;
  }

  private presentationMotionDuration(): number {
    return this.tuning.motion.normalMs;
  }

  private inputForTick(time: WorldTick): GameplayTickInput {
    const sampled = this.inputController?.update(time).moves ?? [];
    const queued = this.queuedMoves.splice(0);
    const groups = this.queuedIntentGroups.splice(0);
    const moves = [...queued, ...sampled];
    const debugActorMoves = this.debugExternalActorId === null
      ? []
      : moves
          .filter((move) => move.source === "external")
          .map((move) => ({ ...move, actorId: this.debugExternalActorId! }));
    const routedMoves = this.debugExternalActorId === null
      ? moves
      : moves.filter((move) => move.source !== "external");
    if (this.inputController || !this.heldDirection || this.heldDirectionBlocked) {
      return {
        moves: routedMoves,
        actorMoves: debugActorMoves,
        groups,
      };
    }
    if (this.debugExternalActorId !== null) {
      return {
        moves: routedMoves,
        actorMoves: [
          ...debugActorMoves,
          {
            source: "external",
            direction: this.heldDirection,
            actorId: this.debugExternalActorId,
          },
        ],
        groups,
      };
    }
    return {
      moves: [
        ...routedMoves,
        { source: "external", direction: this.heldDirection },
      ],
      groups,
    };
  }

  private consumeGameplayTick(
    tick: GameplayTickResult,
    emitChange = true,
  ): boolean {
    let changed = false;
    this.replayRecorder?.record(tick);
    this.emit("tick");
    this.inputController?.resolveMoveAttempts(tick.inputResolutions);
    if (!this.inputController) {
      const external = tick.inputResolutions.find(
        (resolution) => resolution.source === "external",
      );
      if (external && external.result !== "moved")
        this.heldDirectionBlocked = true;
    }
    for (const [index, result] of tick.phases.entries()) {
      const inputPhase = index > 0;
      this.consumeWorldDeltas(result.deltas);
      if (inputPhase) {
        this.lastMove = result.moves[0] ?? null;
        this.lastWorldEvents = result.events;
        this.faceBlockedActors(result.moves);
      } else if (result.moves.length > 0) {
        this.lastMove = result.moves[0] ?? null;
      }
      if (result.events.length > 0) {
        if (!inputPhase) this.lastWorldEvents = result.events;
        this.publishWorldEvents(result.events);
        this.emitTerminalEvents();
      }
      if (result.motions.length > 0) this.emit("move");
      else if (inputPhase) this.emit("blocked");
      if (
        inputPhase ||
        result.events.length > 0 ||
        result.motions.length > 0 ||
        result.deltas.length > 0
      ) {
        changed = true;
        if (emitChange) this.emit("change");
      }
    }
    if (this.world.dead || this.world.completed) {
      this.heldDirection = null;
      this.queuedMoves.length = 0;
    }
    return changed;
  }

  private advanceReplayIdleTicks(): number {
    if (
      !this.worldValue ||
      this.levelLoadPending ||
      this.visual.isAnimating ||
      this.world.inputBlocked
    )
      return 0;
    const startedAt = performance.now();
    let changed = false;
    const count = this.replayPlayback.advanceIdleTicks(
      MAX_REPLAY_IDLE_TICKS_PER_FRAME,
      (tick) => {
        changed = this.consumeGameplayTick(tick, false) || changed;
        return (
          !this.visual.isAnimating &&
          !this.world.inputBlocked &&
          tick.result.events.length === 0 &&
          performance.now() - startedAt < REPLAY_IDLE_FRAME_BUDGET_MS
        );
      },
    );
    if (changed) this.emit("change");
    return count;
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
    if (
      this.world.spatial.presencesAt(cell).some(
        (presence) =>
          presence.entityId !== actorId && presence.traits.includes("player"),
      )
    )
      return false;

    this.world.actions.cancelOwnedBy(actorId);
    this.world.movement?.clearEntity(actorId);
    this.session.discardPendingHistory();
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

  private beginLevelPresentation(): void {
    if (!this.worldValue) return;
    const frame = this.presentationClock.current;
    if (this.session.state.status === "won") {
      this.visual.beginLevelExit(
        this.world,
        this.tuning.levelTransition.exitMs,
        frame,
      );
    } else if (this.session.state.status === "playing") {
      this.visual.beginLevelEntrance(
        this.world,
        this.tuning.levelTransition.enterMs,
        frame,
      );
      this.discardPendingGameplayInput();
    }
  }

  private discardPendingGameplayInput(): void {
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.queuedMoves.length = 0;
    this.queuedIntentGroups.length = 0;
    this.inputController?.resetMovement();
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
    for (const tick of this.session.stepPaused(count, (time) =>
      this.inputForTick(time),
    ))
      this.consumeGameplayTick(tick);
    this.render();
  }

  private setDebugWorldHz(hz: number): void {
    if (hz === this.worldClock.hz) return;
    this.worldClock.setHz(hz);
    this.restart();
  }

  private setDebugWorldSpeed(speed: number): void {
    this.worldClock.setSpeed(speed);
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

  private setDebugPresentationHz(hz: number): void {
    this.presentationClock.setHz(hz);
    this.render();
  }

  private setDebugPresentationSpeed(speed: number): void {
    this.presentationClock.setSpeed(speed);
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
    if (this.presentationBlocksInput) this.discardPendingGameplayInput();

    const worldTicks =
      this.worldValue &&
      delta > 0 &&
      !this.levelLoadPending &&
      !this.visual.blocksGameplay
        ? this.session.advanceRealTime(
            delta,
            (time) =>
              this.replayPlayback.playing
                ? this.replayPlayback.inputForTick(time)
                : this.inputForTick(time),
            this.replayPlayback.remainingTicks,
          )
        : [];
    for (const worldTick of worldTicks) this.consumeGameplayTick(worldTick);
    const idleTickCount = this.advanceReplayIdleTicks();
    if (this.replayPlayback.finishIfComplete()) this.emit("change");

    const frame = this.presentationClock.advance(timestamp);
    if (this.worldValue && frame) {
      const wasAnimating = this.visual.isAnimating;
      this.visual.update(frame, this.tuning.motion.easing);
      this.renderScene();
      if (this.debugValue) this.debugRuntime.render();
      if (wasAnimating && !this.visual.isAnimating) this.emit("change");
    } else if (worldTicks.length > 0 || idleTickCount > 0) {
      this.render();
    }
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private publishWorldEvents(events: readonly WorldEvent[]): void {
    for (const event of events) {
      if (event.type === "speed-impact")
        this.visual.camera.shake(this.presentationClock.current);
      for (const listener of this.worldEventListeners) listener(event);
      if (!this.replayPlayback.playing && isObjectInteractionEvent(event)) {
        for (const listener of this.interactionRequestListeners) listener(event);
      }
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
