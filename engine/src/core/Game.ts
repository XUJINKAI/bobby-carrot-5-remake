import type { Direction, LevelMap } from "@bobby/model";
import type { AudioBackend } from "../audio/AudioBackend.js";
import { NullAudioBackend } from "../audio/AudioBackend.js";
import type { ControlBinding } from "../input/ControlBindings.js";
import {
  InputController,
  type LogicalMoveInput,
} from "../input/InputController.js";
import {
  resolveEngineTiming,
  type EngineTiming,
} from "../time/EngineTiming.js";
import type { WorldClock, WorldTick } from "../time/WorldClock.js";
import { GameplayHud } from "../ui/GameplayHud.js";
import { GameplayDialogControl } from "../ui/GameplayDialogControl.js";
import type { PresentationTuning } from "../visual/tuning/PresentationTuning.js";
import { resolveOriginalTuning } from "../visual/tuning/original.js";
import type { World } from "../world/World.js";
import type {
  CellInspection,
  MoveResult,
  WinConditionState,
  WorldEvent,
} from "../world/WorldTypes.js";
import type { WorldDelta } from "../world/delta/WorldDelta.js";
import type {
  EntityId,
} from "../world/entity/EntityInstance.js";
import type {
  ActorEffectIntent,
  GameplayEffectIntent,
  WorldIntentGroup,
} from "../world/movement/WorldIntent.js";
import type { Replay, ReplayRecordingMeta } from "../replay/ReplayFormat.js";
import {
  ReplayPlayback,
  type ReplayPlaybackOptions,
} from "../replay/ReplayPlayback.js";
import { ReplayRecorder } from "../replay/ReplayRecorder.js";
import { runReplay, type ReplayReport } from "../replay/ReplayRunner.js";
import type { GameplayState } from "./GameplayState.js";
import type { GameOptions } from "./GameOptions.js";
import { GameDebugControls } from "./GameDebugControls.js";
import { GamePresentation } from "./GamePresentation.js";
import { GameplaySession, type GameplayTickInput, type GameplayTickResult } from "./GameplaySession.js";
import { prepareRuntimeLevel } from "./RuntimeLevel.js";
import {
  WorldEventDispatcher,
  type InteractionRequestListener,
  type WorldEventListener,
} from "./WorldEventDispatcher.js";

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

const MAX_REPLAY_IDLE_TICKS_PER_FRAME = 128;
const REPLAY_IDLE_FRAME_BUDGET_MS = 6;

export class Game {
  readonly audio: AudioBackend;
  readonly inputController: InputController | null;
  private readonly presentation: GamePresentation;
  private readonly gameplayHud: GameplayHud | null;
  private readonly debugControls: GameDebugControls;
  private readonly tuning: PresentationTuning;
  private readonly timing: EngineTiming;
  private readonly session: GameplaySession;
  private readonly listeners = new Map<GameEventName, Set<Listener>>();
  private readonly worldEvents = new WorldEventDispatcher();
  private heldDirection: Direction | null = null;
  private heldDirectionBlocked = false;
  private readonly queuedMoves: LogicalMoveInput[] = [];
  private readonly queuedIntentGroups: WorldIntentGroup[] = [];
  private replayRecorder: ReplayRecorder | null = null;
  private readonly replayPlayback: ReplayPlayback;
  readonly dialogControl: GameplayDialogControl;
  private levelLoadPending = false;
  private animationFrame = 0;
  private destroyed = false;
  private lastTimestamp = 0;
  lastMove: MoveResult | null = null;
  lastWorldEvents: WorldEvent[] = [];

  constructor(options: GameOptions) {
    this.audio = options.audio ?? new NullAudioBackend();
    this.tuning = resolveOriginalTuning(options.runtime?.tuning);
    this.timing = resolveEngineTiming(options.runtime?.timing);
    this.presentation = new GamePresentation(options, this.timing, this.tuning);
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
    this.replayPlayback = new ReplayPlayback(
      this.session,
      this.presentation.clock,
    );
    this.dialogControl = new GameplayDialogControl({
      discardPendingInput: () => this.discardPendingGameplayInput(),
      consumeReplayChoice: (count) => this.replayPlayback.consumeChoice(count),
      recordChoice: (tick, choice) =>
        this.replayRecorder?.recordChoice(tick, choice),
      dispatchEffect: (intent) => {
        if (!this.worldValue || this.world.dead || this.world.completed) return;
        this.queuedIntentGroups.push({
          intents: [structuredClone(intent)],
          historyBoundary: false,
          recordInReplay: false,
        });
      },
    });
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
    this.debugControls = new GameDebugControls(
      options.canvas,
      this.session,
      this.presentation,
      this.timing,
      this.inputController,
      {
        world: () => this.worldValue,
        pendingIntents: () =>
          this.queuedIntentGroups.flatMap((group) =>
            group.intents.filter(
              (intent): intent is ActorEffectIntent =>
                intent.type !== "move" &&
                intent.type !== "commit-entity-replacement",
            ),
          ),
        replayState: () => ({
          recording: this.replayRecording,
          playing: this.replayPlaying,
          paused: this.replayPaused,
        }),
        inspectPoint: (clientX, clientY) =>
          this.inspectCanvasPoint(clientX, clientY),
        dispatch: (intent) => this.dispatch(intent),
        setHeldDirection: (direction) => this.setHeldDirection(direction),
        inputForTick: (time) => this.inputForTick(time),
        consumeTick: (tick) => {
          this.consumeGameplayTick(tick);
        },
        restart: () => this.restart(),
        render: () => this.render(),
        emitDebugChange: () => this.emit("debug-change"),
        clearLastResults: () => {
          this.lastMove = null;
          this.lastWorldEvents = [];
        },
      },
      options.debug ?? false,
    );
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
    return this.presentation.canvas;
  }

  get state(): GameplayState {
    return this.session.state;
  }

  get winState(): WinConditionState | null {
    return this.session.winState;
  }

  get debug(): boolean {
    return this.debugControls.enabled;
  }

  get zoom(): number {
    return this.presentation.zoom;
  }

  get sourceTileSize(): number {
    return this.presentation.sourceTileSize;
  }

  get isAnimating(): boolean {
    return this.presentation.isAnimating;
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
    return this.levelLoadPending || this.presentation.blocksGameplay;
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
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.queuedMoves.length = 0;
    this.queuedIntentGroups.length = 0;
    this.presentation.resetLevelView();
    this.debugControls.resetSession();
    this.lastMove = null;
    this.lastWorldEvents = [];
    try {
      await this.presentation.load();
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
      this.dialogControl.worldPaused ||
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

  dispatchInteractionEffect(intent: GameplayEffectIntent): void {
    this.dialogControl.dispatchEffect(intent);
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
    this.presentation.resetMotion();
    this.lastMove = null;
    this.lastWorldEvents = [];
    this.render();
    this.emit("change");
  }

  redo(): void {
    if (!this.session.redo()) return;
    this.presentation.resetMotion();
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
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.queuedMoves.length = 0;
    this.queuedIntentGroups.length = 0;
    this.presentation.resetMotion();
    this.beginLevelPresentation();
    this.debugControls.resetSession();
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
    this.presentation.setSpeed(speed);
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
      this.publishWorldEvents(tick.result.events, false);
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
    this.presentation.setZoom(value);
    this.render();
  }

  setZoomAt(value: number, clientX: number, clientY: number): void {
    this.presentation.setZoomAt(value, clientX, clientY);
    this.render();
  }

  setZoomLimits(min: number, max?: number): void {
    this.presentation.setZoomLimits(min, max);
    this.render();
  }

  zoomBy(factor: number): void {
    this.presentation.zoomBy(factor);
    this.render();
  }

  panByScreen(dx: number, dy: number): void {
    this.presentation.panByScreen(dx, dy);
    this.render();
  }

  setDebug(value: boolean): void {
    this.debugControls.setEnabled(value);
  }

  toggleDebug(): void {
    this.setDebug(!this.debug);
  }

  inspectCanvasPoint(
    clientX: number,
    clientY: number,
  ): CellInspection | null {
    if (!this.worldValue) return null;
    const cell = this.presentation.inspectCell(clientX, clientY);
    return this.world.inspect(cell.x, cell.y);
  }

  render(): void {
    this.presentation.render(this.worldValue);
    this.gameplayHud?.render();
    this.debugControls.render();
  }

  on(event: GameEventName, listener: Listener): () => void {
    const listeners = this.listeners.get(event) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return () => listeners.delete(listener);
  }

  onWorldEvent(listener: WorldEventListener): () => void {
    return this.worldEvents.onWorldEvent(listener);
  }

  onInteractionRequest(
    listener: InteractionRequestListener,
  ): () => void {
    return this.worldEvents.onInteractionRequest(listener);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.onResize);
    this.inputController?.destroy();
    this.gameplayHud?.destroy();
    this.presentation.destroy();
    this.debugControls.destroy();
  }

  private consumeWorldDeltas(deltas: readonly WorldDelta[]): void {
    if (deltas.length === 0) return;
    const frame = this.presentation.clock.current;
    this.debugControls.recordWorldDeltas(deltas, frame.frame);
    this.presentation.consumeWorldDeltas(this.world, deltas);
  }

  private faceBlockedActors(moves: readonly MoveResult[]): void {
    const frame = this.presentation.clock.current;
    for (const move of moves) {
      if (!move.blocked || move.actorId === undefined) continue;
      if (!this.world.query.entityHasTrait(move.actorId, "player")) continue;
      this.presentation.visual.faceDirection(move.actorId, move.direction, frame);
    }
  }

  private inputForTick(time: WorldTick): GameplayTickInput {
    const sampled = this.inputController?.update(time).moves ?? [];
    const queued = this.queuedMoves.splice(0);
    const groups = this.queuedIntentGroups.splice(0);
    const moves = [...queued, ...sampled];
    const debugActorId = this.debugControls.externalActorId;
    const debugActorMoves = debugActorId === null
      ? []
      : moves
          .filter((move) => move.source === "external")
          .map((move) => ({ ...move, actorId: debugActorId }));
    const routedMoves = debugActorId === null
      ? moves
      : moves.filter((move) => move.source !== "external");
    if (this.inputController || !this.heldDirection || this.heldDirectionBlocked) {
      return {
        moves: routedMoves,
        actorMoves: debugActorMoves,
        groups,
      };
    }
    if (debugActorId !== null) {
      return {
        moves: routedMoves,
        actorMoves: [
          ...debugActorMoves,
          {
            source: "external",
            direction: this.heldDirection,
            actorId: debugActorId,
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
    this.dialogControl.beginTick(tick.time.tick);
    this.replayPlayback.prepareChoices(tick.time.tick);
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
      this.presentation.isAnimating ||
      this.dialogControl.worldPaused ||
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
          !this.presentation.isAnimating &&
          !this.world.inputBlocked &&
          tick.result.events.length === 0 &&
          performance.now() - startedAt < REPLAY_IDLE_FRAME_BUDGET_MS
        );
      },
    );
    if (changed) this.emit("change");
    return count;
  }

  private beginLevelPresentation(): void {
    if (!this.worldValue) return;
    this.presentation.beginLevel(
      this.world,
      this.session.state.status,
      () => this.discardPendingGameplayInput(),
    );
  }

  private discardPendingGameplayInput(): void {
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.queuedMoves.length = 0;
    this.queuedIntentGroups.length = 0;
    this.inputController?.resetMovement();
  }

  private readonly onResize = (): void => {
    this.render();
  };

  private readonly tick = (timestamp: number): void => {
    if (this.destroyed) return;
    const delta = this.lastTimestamp > 0 ? timestamp - this.lastTimestamp : 0;
    this.lastTimestamp = timestamp;
    if (this.presentationBlocksInput) this.discardPendingGameplayInput();

    const worldTicks: GameplayTickResult[] = [];
    if (
      this.worldValue &&
      delta > 0 &&
      !this.levelLoadPending &&
      !this.presentation.blocksGameplay &&
      !this.dialogControl.worldPaused
    ) {
      this.session.advanceRealTime(
        delta,
        (time) =>
          this.replayPlayback.playing
            ? this.replayPlayback.inputForTick(time)
            : this.inputForTick(time),
        this.replayPlayback.remainingTicks,
        (worldTick) => {
          worldTicks.push(worldTick);
          this.consumeGameplayTick(worldTick);
          return !this.dialogControl.worldPaused;
        },
      );
    }
    const idleTickCount = this.advanceReplayIdleTicks();
    if (this.replayPlayback.finishIfComplete()) this.emit("change");

    const presentationFrame = this.presentation.advance(
      timestamp,
      this.worldValue,
    );
    if (presentationFrame) {
      if (this.debug) this.debugControls.render();
      if (presentationFrame.animationCompleted) this.emit("change");
    } else if (worldTicks.length > 0 || idleTickCount > 0) {
      this.render();
    }
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private publishWorldEvents(
    events: readonly WorldEvent[],
    notifyInteractions = true,
  ): void {
    const notifyRequests = notifyInteractions &&
      (!this.replayPlayback.playing || this.replayPlayback.hasPendingChoices);
    this.worldEvents.publish(events, notifyRequests, (event) => {
      if (
        event.type === "speed-impact" ||
        event.type === "crumbly-rock-smashed"
      )
        this.presentation.shake(248, 42);
    });
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
