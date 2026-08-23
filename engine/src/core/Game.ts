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
  /** 本段动画中动态载具与 Bobby 必须共享同一条视觉轨迹。 */
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
  private readonly inputQueue: Direction[] = [];
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
    this.inputQueue.length = 0;
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
   * 请求移动。动画进行中时只缓存方向，不修改世界状态；
   * 因此连续按键/手机连续 Swipe 不会造成角色逻辑坐标提前跳跃。
   */
  move(direction: Direction): MoveResult | null {
    if (!this.worldValue || this.world.dead || this.world.completed) return null;
    if (this.motion) {
      if (this.inputQueue.length < 4) this.inputQueue.push(direction);
      return null;
    }
    return this.startLogicalMove(direction, false);
  }

  undo(): boolean {
    const previous = this.history.pop();
    if (!previous || !this.worldValue) return false;
    this.world.restore(previous);
    this.inputQueue.length = 0;
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
    this.inputQueue.length = 0;
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
      // 强制状态撞墙后已经由 World 清除，可继续处理用户队列。
      if (!forced) this.dequeueUserMove();
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
      this.inputQueue.length = 0;
      this.emit('change');
      return;
    }

    const forcedDirection = this.world.forcedDirection;
    if (forcedDirection) {
      const result = this.startLogicalMove(forcedDirection, true);
      // 强制移动若立即撞墙，递归会在 World 中清除 forced；随后允许用户队列继续。
      if (!result.moved && !this.world.forcedDirection) this.dequeueUserMove();
      return;
    }
    this.dequeueUserMove();
  }

  private dequeueUserMove(): void {
    if (this.motion || this.world.dead || this.world.completed) return;
    const direction = this.inputQueue.shift();
    if (direction) this.startLogicalMove(direction, false);
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
      // smoothstep：保留格子感，同时避免线性滑动显得机械。
      const t = raw * raw * (3 - 2 * raw);
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
