import type { Direction, LevelMap } from "@bobby/model";
import type { AudioBackend } from "../audio/AudioBackend.js";
import { NullAudioBackend } from "../audio/AudioBackend.js";
import { visualRegistry } from "../entities/registry.js";
import {
  InputController,
  type InputControllerOptions,
  type InputState,
} from "../input/InputController.js";
import { Renderer } from "../render/Renderer.js";
import {
  EngineClock,
  type EngineTick,
} from "../time/EngineClock.js";
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
import type { GameplayState } from "./GameplayState.js";

export interface GameRuntimeOptions {
  hud?: boolean | GameplayHudOptions;
  input?: InputControllerOptions;
  tuning?: PresentationTuningOverride;
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
  private readonly profile: Partial<ProfileCapabilities>;
  private readonly tuning: PresentationTuning;
  private readonly clock = new EngineClock();
  private worldValue: World | null = null;
  private initialLevel: LevelMap | null = null;
  private readonly history: WorldSnapshot[] = [];
  private readonly future: WorldSnapshot[] = [];
  private readonly listeners = new Map<GameEventName, Set<Listener>>();
  private readonly worldEventListeners = new Set<WorldEventListener>();
  private debugValue = false;
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
    this.history.length = 0;
    this.future.length = 0;
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.visual.clear();
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
      this.world.dead ||
      this.world.completed ||
      this.visual.isAnimating
    )
      return null;
    const result = this.startLogicalMove(direction, forced, this.clock.nextTick);
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
    this.worldValue = new World(this.initialLevel, { profile: this.profile });
    this.history.length = 0;
    this.future.length = 0;
    this.heldDirection = null;
    this.heldDirectionBlocked = false;
    this.resetVisualMotion();
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
    this.debugValue = value;
    this.renderer.setDebug(value);
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
    if (this.worldValue) {
      const viewport = this.renderer.measureViewport();
      this.visual.camera.setViewport(viewport.width, viewport.height);
      const scene = this.visual.scene(this.worldValue);
      this.renderer.render(scene, this.visual.camera, viewport);
    }
    this.gameplayHud?.render();
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
  }

  private startLogicalMove(
    direction: Direction,
    forced: boolean,
    time: EngineTick,
  ): MoveResult {
    const before = this.world.snapshot();
    const result = this.world.move(direction, forced);
    this.lastMove = result;
    this.lastWorldEvents = result.events;
    if (result.moved || result.events.length > 0) {
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

    this.visual.camera.recenterPan(time);
    this.visual.beginMove(
      this.world.playerId,
      result.from,
      result.to,
      this.motionDuration(this.world.forcedKind as ForcedKind | null),
      time,
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

  private update(time: EngineTick): void {
    if (!this.worldValue) return;

    const input = this.inputController?.update(time) ?? null;
    if (input) this.applyInput(input, time);
    else this.applyDirectHeldInput(time);

    const events = this.world.update(time);
    if (events.length > 0) {
      this.lastWorldEvents = events;
      this.publishWorldEvents(events);
      this.emitTerminalEvents();
      this.emit("change");
    }

    if (this.visual.update(time, this.tuning.motion.easing))
      this.finishMotion(time);
  }

  private applyInput(input: InputState, time: EngineTick): void {
    if (!input.move || !this.inputController) return;
    const result = this.attemptInputMove(input.move, time);
    this.inputController.resolveMoveAttempt(result);
  }

  private attemptInputMove(direction: Direction, time: EngineTick): MoveAttempt {
    if (!this.worldValue || this.world.dead || this.world.completed)
      return "blocked";
    if (this.visual.isAnimating) return "busy";
    const result = this.startLogicalMove(direction, false, time);
    return result.moved ? "moved" : "blocked";
  }

  private applyDirectHeldInput(time: EngineTick): void {
    if (
      !this.heldDirection ||
      this.heldDirectionBlocked ||
      !this.worldValue ||
      this.world.dead ||
      this.world.completed ||
      this.visual.isAnimating
    )
      return;
    const result = this.startLogicalMove(this.heldDirection, false, time);
    if (!result.moved) this.heldDirectionBlocked = true;
  }

  private finishMotion(time: EngineTick): void {
    if (!this.worldValue) return;
    if (this.world.dead || this.world.completed) {
      this.heldDirection = null;
      return;
    }
    const forcedDirection = this.world.forcedDirection;
    if (forcedDirection) this.startLogicalMove(forcedDirection, true, time);
  }

  private resetVisualMotion(): void {
    this.visual.clear();
  }

  private readonly onResize = (): void => {
    this.render();
  };

  private readonly tick = (timestamp: number): void => {
    if (this.destroyed) return;
    const delta = this.lastTimestamp > 0 ? timestamp - this.lastTimestamp : 0;
    this.lastTimestamp = timestamp;
    if (this.worldValue && delta > 0) {
      const updated = this.clock.advance(delta, (time) => this.update(time));
      if (updated > 0) this.render();
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
