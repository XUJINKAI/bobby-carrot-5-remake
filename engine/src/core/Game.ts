import type { Direction, LevelMap } from "@bobby/model";
import type { AudioBackend } from "../audio/AudioBackend.js";
import { NullAudioBackend } from "../audio/AudioBackend.js";
import {
  InputController,
  type InputControllerOptions,
} from "../input/InputController.js";
import {
  Renderer,
  type RendererAssets,
  type VisualRuntimeState,
} from "../render/Renderer.js";
import { GameplayHud, type GameplayHudOptions } from "../ui/GameplayHud.js";
import type { EntityVisualRuntimeState } from "../visual/VisualDefinition.js";
import type { ProfileCapabilities } from "../world/GlobalState.js";
import { World, type WorldSnapshot } from "../world/World.js";
import type {
  CellInspection,
  MoveResult,
  WorldEvent,
} from "../world/WorldTypes.js";

export interface GameRuntimeOptions {
  hud?: boolean | GameplayHudOptions;
  input?: InputControllerOptions;
}

export interface GameOptions {
  canvas: HTMLCanvasElement;
  assets: RendererAssets;
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

interface Motion {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  direction: Direction;
  startedAt: number;
  duration: number;
  forced: boolean;
}

export class Game {
  readonly renderer: Renderer;
  readonly audio: AudioBackend;
  readonly inputController: InputController | null;
  private readonly gameplayHud: GameplayHud | null;
  private readonly profile: Partial<ProfileCapabilities>;
  private worldValue: World | null = null;
  private initialLevel: LevelMap | null = null;
  private readonly history: WorldSnapshot[] = [];
  private readonly future: WorldSnapshot[] = [];
  private readonly listeners = new Map<GameEventName, Set<Listener>>();
  private readonly worldEventListeners = new Set<WorldEventListener>();
  private readonly visualRuntime = new Map<number, EntityVisualRuntimeState>();
  private debugValue = false;
  private motion: Motion | null = null;
  private heldDirection: Direction | null = null;
  private animationFrame = 0;
  private destroyed = false;
  private lastTimestamp = 0;
  lastMove: MoveResult | null = null;
  lastWorldEvents: WorldEvent[] = [];

  constructor(options: GameOptions) {
    this.renderer = new Renderer(options.canvas, options.assets);
    this.audio = options.audio ?? new NullAudioBackend();
    this.profile = options.profile ?? {};
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

  get world(): World {
    if (!this.worldValue) throw new Error("尚未载入关卡");
    return this.worldValue;
  }

  get hasLevel(): boolean {
    return this.worldValue !== null;
  }

  get debug(): boolean {
    return this.debugValue;
  }

  get zoom(): number {
    return this.renderer.camera.zoom;
  }

  get isAnimating(): boolean {
    return this.motion !== null;
  }

  get canUndo(): boolean {
    return this.history.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get timedChallengeRemainingMs(): number | null {
    return null;
  }

  async loadLevel(level: LevelMap): Promise<void> {
    this.initialLevel = structuredClone(level);
    this.worldValue = new World(level, { profile: this.profile });
    this.history.length = 0;
    this.future.length = 0;
    this.heldDirection = null;
    this.motion = null;
    this.visualRuntime.clear();
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
      this.motion
    )
      return null;
    return this.startLogicalMove(direction, forced);
  }

  setHeldDirection(direction: Direction | null): void {
    this.heldDirection = direction;
    if (
      direction &&
      this.worldValue &&
      !this.motion &&
      !this.world.dead &&
      !this.world.completed
    )
      this.startLogicalMove(direction, false);
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
    this.renderer.camera.setZoom(value);
    this.render();
  }

  setZoomLimits(min: number, max?: number): void {
    this.renderer.camera.setZoomLimits(min, max);
    this.render();
  }

  zoomBy(factor: number): void {
    this.setZoom(this.zoom * factor);
  }

  panByScreen(dx: number, dy: number): void {
    this.renderer.camera.panByScreen(dx, dy);
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
    const rect = this.renderer.canvas.getBoundingClientRect();
    const cell = this.renderer.camera.screenToTile(
      clientX - rect.left,
      clientY - rect.top,
    );
    return this.world.inspect(cell.x, cell.y);
  }

  render(): void {
    if (this.worldValue)
      this.renderer.render(this.worldValue, this.visualRuntime as VisualRuntimeState);
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

  private startLogicalMove(direction: Direction, forced: boolean): MoveResult {
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
      this.render();
      this.emit("blocked");
      this.emit("change");
      return result;
    }

    this.renderer.camera.recenterPan();
    this.motion = {
      fromX: result.from.x,
      fromY: result.from.y,
      toX: result.to.x,
      toY: result.to.y,
      direction,
      startedAt: performance.now(),
      duration: this.motionDuration(this.world.forcedKind),
      forced,
    };
    this.visualRuntime.set(this.world.playerId, {
      offsetX: result.from.x - result.to.x,
      offsetY: result.from.y - result.to.y,
      moving: true,
      progress: 0,
    });
    this.render();
    this.emit("move");
    this.emit("change");
    return result;
  }

  private motionDuration(forcedKind: string | null): number {
    let duration = 132;
    if (forcedKind === "speed") duration = 70;
    else if (forcedKind === "ice") duration = 88;
    else if (forcedKind === "flight") duration = 94;
    else if (forcedKind === "leaf") duration = 115;
    else if (forcedKind === "mower-exit") duration = 105;
    if (this.world.state.profile.speedShoes) duration *= 0.76;
    return duration;
  }

  private updateMotion(timestamp: number): void {
    if (!this.motion || !this.worldValue) return;
    const progress = Math.min(
      1,
      Math.max(0, (timestamp - this.motion.startedAt) / this.motion.duration),
    );
    this.visualRuntime.set(this.world.playerId, {
      offsetX: (this.motion.fromX - this.motion.toX) * (1 - progress),
      offsetY: (this.motion.fromY - this.motion.toY) * (1 - progress),
      moving: true,
      progress,
    });
    if (progress >= 1) this.finishMotion();
  }

  private finishMotion(): void {
    if (!this.motion || !this.worldValue) return;
    this.visualRuntime.delete(this.world.playerId);
    this.motion = null;
    if (this.world.dead || this.world.completed) {
      this.heldDirection = null;
      return;
    }
    const forcedDirection = this.world.forcedDirection;
    if (forcedDirection) {
      this.startLogicalMove(forcedDirection, true);
      return;
    }
    if (this.heldDirection) this.startLogicalMove(this.heldDirection, false);
  }

  private resetVisualMotion(): void {
    this.motion = null;
    this.visualRuntime.clear();
  }

  private readonly onResize = (): void => {
    this.render();
  };

  private readonly tick = (timestamp: number): void => {
    if (this.destroyed) return;
    const delta = this.lastTimestamp > 0 ? timestamp - this.lastTimestamp : 0;
    this.lastTimestamp = timestamp;
    if (this.worldValue && delta > 0) {
      const events = this.world.advanceTime(delta);
      if (events.length > 0) {
        this.lastWorldEvents = events;
        this.publishWorldEvents(events);
        this.emitTerminalEvents();
        this.emit("change");
      }
      this.updateMotion(timestamp);
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
