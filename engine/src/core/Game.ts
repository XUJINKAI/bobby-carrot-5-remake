import type { Direction, LevelMap } from "@bobby/model";
import type { AudioBackend } from "../audio/AudioBackend.js";
import { NullAudioBackend } from "../audio/AudioBackend.js";
import { DebugRuntime } from "../debug/DebugRuntime.js";
import { buildDebugSnapshot } from "../debug/DebugSnapshot.js";
import { visualRegistry } from "../entities/registry.js";
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
import type { VisualAssetSources } from "../visual/VisualDefinition.js";
import { VisualRuntime } from "../visual/VisualRuntime.js";
import type {
  PresentationTuning,
  PresentationTuningOverride,
} from "../visual/tuning/PresentationTuning.js";
import { resolveOriginalTuning } from "../visual/tuning/original.js";
import type {
  ForcedKind,
  ProfileCapabilities,
} from "../world/GlobalState.js";
import { World, type WorldSnapshot } from "../world/World.js";
import type {
  CellInspection,
  MoveResult,
  WorldEvent,
} from "../world/WorldTypes.js";
import { createDelayRuntimeAction } from "../world/action/builtinActions.js";
import type { GameplayState } from "./GameplayState.js";

export interface GameRuntimeOptions {
  hud?: boolean | GameplayHudOptions;
  input?: InputControllerOptions;
  tuning?: PresentationTuningOverride;
  timing?: EngineTimingOptions;
}

export interface GameOptions {
  canvas: HTMLCanvasElement;
  assets: VisualAssetSources;
  audio?: AudioBackend;
  debug?: boolean;
  profile?: Partial<ProfileCapabilities>;
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
type MoveAttempt = "moved" | "blocked" | "busy";

export class Game {
  readonly audio: AudioBackend;
  readonly inputController: InputController | null;
  private readonly renderer: Renderer;
  private readonly visual: VisualRuntime;
  private readonly gameplayHud: GameplayHud | null;
  private readonly debugRuntime: DebugRuntime;
  private readonly profile: Partial<ProfileCapabilities>;
  private readonly tuning: PresentationTuning;
  private readonly timing: EngineTiming;
  private readonly worldClock: WorldClock;
  private readonly presentationClock: PresentationClock;
  private worldValue: World | null = null;
  private initialLevel: LevelMap | null = null;
  private lastScene: RenderScene | null = null;
  private readonly history: WorldSnapshot[] = [];
  private readonly future: WorldSnapshot[] = [];
  private readonly listeners = new Map<GameEventName, Set<Listener>>();
  private readonly worldEventListeners = new Set<WorldEventListener>();
  private debugValue = false;
  private debugInputEnabledBeforePause: boolean | null = null;
  private heldDirection: Direction | null = null;
  private heldDirectionBlocked = false;
  private animationFrame = 0;
  private destroyed = false;
  private lastTimestamp = 0;
  lastMove: MoveResult | null = null;
  lastWorldEvents: WorldEvent[] = [];

  constructor(options: GameOptions) {
    this.renderer = new Renderer(options.canvas, options.assets);
    this.visual = new VisualRuntime(
      visualRegistry,
      options.assets.sourceTileSize ?? 48,
    );
    this.audio = options.audio ?? new NullAudioBackend();
    this.profile = options.profile ?? {};
    this.tuning = resolveOriginalTuning(options.runtime?.tuning);
    this.timing = resolveEngineTiming(options.runtime?.timing);
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
            options.canvas,
            hud === true ? {} : hud,
          );
    this.inputController = options.runtime?.input
      ? new InputController(this, options.runtime.input)
      : null;
    this.debugRuntime = new DebugRuntime(options.canvas, {
      snapshot: (selection) =>
        buildDebugSnapshot({
          world: this.worldValue,
          scene: this.lastScene,
          visual: this.visual,
          worldClock: this.worldClock,
          presentationClock: this.presentationClock,
          timing: this.timing,
          selection,
        }),
      inspectPoint: (clientX, clientY) =>
        this.inspectCanvasPoint(clientX, clientY),
      pause: () => this.pauseDebugClock(),
      resume: () => this.resumeDebugClock(),
      step: (count) => this.stepDebugClock(count),
      pausePresentation: () => this.pauseDebugPresentationClock(),
      resumePresentation: () => this.resumeDebugPresentationClock(),
      stepPresentation: (frames) => this.stepDebugPresentationClock(frames),
      close: () => this.setDebug(false),
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

  get hasLevel(): boolean {
    return this.worldValue !== null;
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.canvas;
  }

  get state(): GameplayState {
    const world = this.world;
    const state = world.state;
    return {
      status: world.dead ? "dead" : world.completed ? "won" : "playing",
      deathReason: state.deathReason,
      moves: state.moves,
      player: world.player,
      facing: world.facing,
      inventory: structuredClone(state.inventory),
      profile: structuredClone(state.profile),
      ridingMower: state.ridingMower,
      objective: {
        mode: state.objectiveMode,
        remaining: state.objectiveRemaining,
        total: state.objectiveTotal,
      },
      forced: state.forced ? structuredClone(state.forced) : null,
      bonusCoinsInLevel: state.bonusCoinsInLevel,
      goldenCarrotsInLevel: state.goldenCarrotsInLevel,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
    };
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
    this.worldValue = new World(level, { profile: this.profile });
    this.worldClock.reset();
    this.restoreDebugPausedInput();
    this.history.length = 0;
    this.future.length = 0;
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

  move(direction: Direction, forced = false): MoveResult | null {
    if (
      !this.worldValue ||
      this.worldClock.paused ||
      this.world.dead ||
      this.world.completed ||
      this.world.inputBlocked
    )
      return null;
    const result = this.startLogicalMove(direction, forced, this.worldClock.nextTick);
    this.render();
    return result;
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
    this.resetVisualMotion();
    this.lastMove = null;
    this.lastWorldEvents = [];
    this.render();
    this.emit("change");
  }

  restart(): void {
    if (!this.initialLevel) return;
    const wasPaused = this.worldClock.paused;
    this.worldValue = new World(this.initialLevel, { profile: this.profile });
    this.worldClock.reset();
    if (wasPaused) this.worldClock.pause();
    this.history.length = 0;
    this.future.length = 0;
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
    if (!this.worldValue) return;
    const events = this.world.killPlayer(reason);
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.resetVisualMotion();
    this.lastWorldEvents = events;
    this.publishWorldEvents(events);
    this.render();
    this.emitTerminalEvents();
    this.emit("change");
  }

  setProfile(profile: Partial<ProfileCapabilities>): void {
    if (this.worldValue) this.world.setProfile(profile);
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

  private startLogicalMove(
    direction: Direction,
    forced: boolean,
    time: WorldTick,
  ): MoveResult {
    const before = forced ? null : this.world.snapshot();
    const result = this.world.move(direction, forced);
    this.lastMove = result;
    this.lastWorldEvents = result.events;
    if (before && (result.moved || result.events.length > 0)) {
      this.history.push(before);
      this.future.length = 0;
    }
    this.publishWorldEvents(result.events);
    this.emitTerminalEvents();

    if (!result.moved) {
      this.emit("blocked");
      this.emit("change");
      return result;
    }

    const durationMs = this.motionDuration(this.world.forcedKind as ForcedKind | null);
    this.world.startAction(
      createDelayRuntimeAction(durationMs, {
        ownerEntityId: this.world.playerId,
        blocksInput: true,
        reason: forced ? "forced-player-motion" : "player-motion",
      }),
    );
    const frame = this.presentationClock.current;
    this.visual.camera.recenterPan(frame);
    this.visual.beginMove(
      this.world.playerId,
      result.from,
      result.to,
      durationMs,
      frame,
    );
    this.emit("move");
    this.emit("change");
    return result;
  }

  private motionDuration(forcedKind: ForcedKind | null): number {
    const motion = this.tuning.motion;
    let duration = forcedKind ? motion.forcedMs[forcedKind] : motion.normalMs;
    if (this.world.state.profile.speedShoes) duration *= motion.speedShoesScale;
    return duration;
  }

  private updateWorld(time: WorldTick): void {
    if (!this.worldValue) return;

    const events = this.world.update(time);
    if (events.length > 0) {
      this.lastWorldEvents = events;
      this.publishWorldEvents(events);
      this.emitTerminalEvents();
      this.emit("change");
    }
    if (this.world.dead || this.world.completed) {
      this.heldDirection = null;
      return;
    }

    if (!this.world.inputBlocked && this.world.forcedDirection) {
      this.startLogicalMove(this.world.forcedDirection, true, time);
      return;
    }

    const input = this.inputController?.update(time) ?? null;
    if (input) this.applyInput(input, time);
    else this.applyDirectHeldInput(time);
  }

  private applyInput(input: InputState, time: WorldTick): void {
    if (!input.move || !this.inputController) return;
    const result = this.attemptInputMove(input.move, time);
    this.inputController.resolveMoveAttempt(result);
  }

  private attemptInputMove(direction: Direction, time: WorldTick): MoveAttempt {
    if (!this.worldValue || this.world.dead || this.world.completed)
      return "blocked";
    if (this.world.inputBlocked) return "busy";
    const result = this.startLogicalMove(direction, false, time);
    return result.moved ? "moved" : "blocked";
  }

  private applyDirectHeldInput(time: WorldTick): void {
    if (
      !this.heldDirection ||
      this.heldDirectionBlocked ||
      !this.worldValue ||
      this.world.dead ||
      this.world.completed ||
      this.world.inputBlocked
    )
      return;
    const result = this.startLogicalMove(this.heldDirection, false, time);
    if (!result.moved) this.heldDirectionBlocked = true;
  }

  private resetVisualMotion(): void {
    this.visual.clear();
  }

  private pauseDebugClock(): void {
    if (this.worldClock.paused) return;
    this.debugInputEnabledBeforePause = this.inputController?.isEnabled ?? null;
    this.inputController?.setEnabled(false);
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.worldClock.pause();
    this.render();
  }

  private resumeDebugClock(): void {
    if (!this.worldClock.paused) return;
    this.worldClock.resume();
    this.restoreDebugPausedInput();
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.render();
  }

  private restoreDebugPausedInput(): void {
    if (
      this.inputController &&
      this.debugInputEnabledBeforePause !== null
    )
      this.inputController.setEnabled(this.debugInputEnabledBeforePause);
    this.debugInputEnabledBeforePause = null;
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
    const scene = this.visual.scene(this.worldValue, this.world.cameraTarget);
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
      worldUpdated = this.worldClock.advance(delta, (time) => this.updateWorld(time));

    const frame = this.presentationClock.advance(timestamp);
    if (this.worldValue && frame) {
      this.visual.update(frame, this.tuning.motion.easing);
      this.renderScene();
      if (this.debugValue) this.debugRuntime.render();
    } else if (worldUpdated > 0) {
      this.render();
    }
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private publishWorldEvents(events: readonly WorldEvent[]): void {
    for (const event of events)
      for (const listener of this.worldEventListeners) listener(event);
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
