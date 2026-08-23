import type { LevelData } from '../data/types.js';
import type { AudioBackend } from '../audio/AudioBackend.js';
import { NullAudioBackend } from '../audio/AudioBackend.js';
import type { Direction } from '../mechanics/ids.js';
import { Renderer, type RendererAssets, type VisualPlayerState } from '../render/Renderer.js';
import { World, type MoveResult, type TileInspection, type WorldEvent, type WorldSnapshot } from '../world/World.js';
import type { ProfileCapabilities } from '../world/RuntimeState.js';

export interface GameOptions {
  canvas: HTMLCanvasElement;
  assets: RendererAssets;
  audio?: AudioBackend;
  debug?: boolean;
  profile?: Partial<ProfileCapabilities>;
}

type GameEventName = 'change' | 'move' | 'blocked' | 'level-loaded' | 'debug-change' | 'death' | 'level-complete' | 'world-event';
type Listener = (game: Game) => void;

interface Motion {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  direction: Direction;
  startedAt: number;
  duration: number;
  forced: boolean;
  ridingDynamic: boolean;
}

export class Game {
  readonly renderer: Renderer;
  readonly audio: AudioBackend;
  private readonly profile: Partial<ProfileCapabilities>;
  private worldValue: World | null = null;
  private initialLevel: LevelData | null = null;
  private readonly history: WorldSnapshot[] = [];
  private readonly listeners = new Map<GameEventName, Set<Listener>>();
  private debugValue = false;
  private motion: Motion | null = null;
  private visual: VisualPlayerState = { x: 0, y: 0, direction: 'down', progress: 0, moving: false, ridingDynamic: false };
  /** 当前物理按键状态。这里只保留“现在想往哪走”，绝不积压历史 keydown。 */
  private heldDirection: Direction | null = null;
  private animationFrame = 0;
  private destroyed = false;
  private lastTimestamp = 0;
  private fireTrailClearAt = 0;
  lastMove: MoveResult | null = null;
  lastWorldEvents: WorldEvent[] = [];

  constructor(options: GameOptions) {
    this.renderer = new Renderer(options.canvas, options.assets);
    this.audio = options.audio ?? new NullAudioBackend();
    this.profile = options.profile ?? {};
    this.debugValue = options.debug ?? false;
    this.renderer.setDebug(this.debugValue);
    window.addEventListener('resize', this.onResize);
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  get world(): World {
    if (!this.worldValue) throw new Error('尚未载入关卡');
    return this.worldValue;
  }

  get hasLevel(): boolean { return this.worldValue !== null; }
  get debug(): boolean { return this.debugValue; }
  get zoom(): number { return this.renderer.camera.zoom; }
  get isAnimating(): boolean { return this.motion !== null; }
  get canUndo(): boolean { return this.history.length > 0; }

  async loadLevel(level: LevelData): Promise<void> {
    this.initialLevel = structuredClone(level);
    this.worldValue = new World(structuredClone(level), this.profile);
    this.history.length = 0;
    this.heldDirection = null;
    this.motion = null;
    this.lastMove = null;
    this.lastWorldEvents = [];
    this.syncVisualToWorld();
    await this.waitForRenderer();
    this.render();
    this.emit('level-loaded');
    this.emit('change');
  }

  /**
   * 一次离散移动请求（Swipe、按钮等）。动画进行中时直接忽略，不排队。
   * 键盘长按使用 setHeldDirection()，每格结束时重新读取当前物理状态。
   */
  move(direction: Direction): MoveResult | null {
    if (!this.worldValue || this.world.dead || this.world.completed || this.motion) return null;
    return this.startLogicalMove(direction, false);
  }

  /**
   * 更新当前键盘方向。keyup(null) 不会取消已经开始的当前格动画，但该格结束后立即停。
   */
  setHeldDirection(direction: Direction | null): void {
    this.heldDirection = direction;
    if (direction && this.worldValue && !this.motion && !this.world.dead && !this.world.completed && !this.world.forcedDirection) {
      this.startLogicalMove(direction, false);
    }
  }

  undo(): boolean {
    const previous = this.history.pop();
    if (!previous || !this.worldValue) return false;
    this.world.restore(previous);
    this.heldDirection = null;
    this.motion = null;
    this.lastMove = null;
    this.lastWorldEvents = [];
    this.syncVisualToWorld();
    this.render();
    this.emit('change');
    return true;
  }

  restart(): void {
    if (!this.initialLevel) return;
    this.worldValue = new World(structuredClone(this.initialLevel), this.profile);
    this.history.length = 0;
    this.heldDirection = null;
    this.motion = null;
    this.lastMove = null;
    this.lastWorldEvents = [];
    this.syncVisualToWorld();
    this.render();
    this.emit('change');
  }

  setProfile(profile: Partial<ProfileCapabilities>): void {
    if (this.worldValue) this.worldValue.setProfile(profile);
  }

  setZoom(value: number): void {
    this.renderer.camera.setZoom(value);
    this.render();
    this.emit('change');
  }

  zoomBy(factor: number): void { this.setZoom(this.zoom * factor); }

  setDebug(value: boolean): void {
    this.debugValue = value;
    this.renderer.setDebug(value);
    this.render();
    this.emit('debug-change');
    this.emit('change');
  }

  toggleDebug(): void { this.setDebug(!this.debugValue); }

  inspectCanvasPoint(clientX: number, clientY: number): TileInspection | null {
    if (!this.worldValue) return null;
    const rect = this.renderer.canvas.getBoundingClientRect();
    const point = this.renderer.camera.screenToTile(clientX - rect.left, clientY - rect.top);
    return this.world.inspect(point.x, point.y);
  }

  render(): void {
    if (!this.worldValue) return;
    this.renderer.render(this.worldValue, this.visual);
  }

  on(event: GameEventName, listener: Listener): () => void {
    const set = this.listeners.get(event) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(event, set);
    return () => set.delete(listener);
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.onResize);
    this.audio.stopMusic();
  }

  private startLogicalMove(direction: Direction, forced: boolean): MoveResult {
    const world = this.world;
    const riddenBefore = world.getRiddenDynamicEntity();
    const snapshot = !forced ? world.snapshot() : null;
    const result = world.move(direction, forced);
    const riddenAfter = world.getRiddenDynamicEntity();
    this.lastMove = result;
    this.lastWorldEvents = result.events;

    if (!result.moved) {
      this.emit('blocked');
      this.handleWorldEvents(result.events);
      this.emit('change');
      return result;
    }

    if (snapshot) this.history.push(snapshot);
    this.motion = {
      fromX: result.from.x,
      fromY: result.from.y,
      toX: result.to.x,
      toY: result.to.y,
      direction,
      startedAt: performance.now(),
      duration: this.motionDuration(result.forcedKind),
      forced,
      ridingDynamic: riddenBefore !== null && riddenBefore === riddenAfter
    };
    this.visual.direction = direction;
    this.visual.moving = true;
    this.visual.progress = 0;
    this.visual.ridingDynamic = this.motion.ridingDynamic;
    this.emit('move');
    this.handleWorldEvents(result.events);
    this.emit('change');
    return result;
  }

  private motionDuration(forcedKind: string | null): number {
    let duration = 132;
    if (forcedKind === 'speed') duration = 70;
    else if (forcedKind === 'ice') duration = 88;
    else if (forcedKind === 'flight') duration = 94;
    else if (forcedKind === 'leaf') duration = 115;
    else if (forcedKind === 'mower-exit') duration = 105;
    if (this.world.state.profile.speedShoes) duration *= 0.76;
    return duration;
  }

  private finishMotion(): void {
    if (!this.motion) return;
    this.visual.x = this.motion.toX;
    this.visual.y = this.motion.toY;
    this.visual.progress = 1;
    this.visual.moving = false;
    this.visual.ridingDynamic = false;
    this.motion = null;

    if (this.world.dead || this.world.completed) {
      this.heldDirection = null;
      this.emit('change');
      return;
    }

    // 机关强制运动优先于玩家按键。若没有强制状态，才读取“这一刻”仍按着的方向。
    const forcedDirection = this.world.forcedDirection;
    if (forcedDirection) {
      this.startLogicalMove(forcedDirection, true);
      return;
    }
    if (this.heldDirection) this.startLogicalMove(this.heldDirection, false);
  }

  private handleWorldEvents(events: WorldEvent[]): void {
    for (const event of events) {
      this.emit('world-event');
      switch (event.type) {
        case 'collect-carrot': this.audio.playSound('carrot'); break;
        case 'collect-bonus-coin': this.audio.playSound('coin'); break;
        case 'board-mower': this.audio.playMusic('mow'); break;
        case 'dragon-fire':
          this.audio.playSound('dragon-fire');
          this.fireTrailClearAt = performance.now() + 520;
          break;
        case 'death':
          this.audio.playMusic('death');
          this.emit('death');
          break;
        case 'complete':
          this.audio.playMusic('cleared');
          this.emit('level-complete');
          break;
      }
    }
  }

  private syncVisualToWorld(): void {
    if (!this.worldValue) return;
    this.visual = {
      x: this.world.player.x,
      y: this.world.player.y,
      direction: this.world.facing,
      progress: 0,
      moving: false,
      ridingDynamic: false
    };
  }

  private emit(event: GameEventName): void {
    for (const listener of this.listeners.get(event) ?? []) listener(this);
  }

  private async waitForRenderer(): Promise<void> {
    const deadline = Date.now() + 10000;
    while (!this.renderer.ready) {
      if (Date.now() > deadline) throw new Error('等待 Renderer 资源超时');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  private readonly onResize = (): void => this.render();

  private readonly tick = (timestamp: number): void => {
    if (this.destroyed) return;
    const deltaMs = this.lastTimestamp > 0 ? Math.min(250, Math.max(0, timestamp - this.lastTimestamp)) : 0;
    this.lastTimestamp = timestamp;

    if (this.worldValue && deltaMs > 0) {
      const timedEvents = this.worldValue.advanceTime(deltaMs);
      if (timedEvents.length > 0) {
        this.lastWorldEvents = timedEvents;
        this.handleWorldEvents(timedEvents);
        this.emit('change');
      }
    }

    if (this.motion) {
      const raw = Math.min(1, Math.max(0, (timestamp - this.motion.startedAt) / this.motion.duration));
      const t = raw;
      this.visual.x = this.motion.fromX + (this.motion.toX - this.motion.fromX) * t;
      this.visual.y = this.motion.fromY + (this.motion.toY - this.motion.fromY) * t;
      this.visual.progress = raw;
      this.visual.direction = this.motion.direction;
      this.visual.moving = true;
      this.visual.ridingDynamic = this.motion.ridingDynamic;
      if (raw >= 1) this.finishMotion();
    }
    if (this.worldValue && this.fireTrailClearAt > 0 && timestamp >= this.fireTrailClearAt) {
      this.worldValue.clearTransientEffects();
      this.fireTrailClearAt = 0;
    }
    if (this.worldValue) this.render();
    this.animationFrame = requestAnimationFrame(this.tick);
  };
}
