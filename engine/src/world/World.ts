import type { LevelData, LevelObject } from '../data/types.js';
import {
  CLOUD_GRID_FOR_OBJECT,
  CLOUD_OBJECT_IDS,
  DIRECTIONS,
  DYNAMIC_OBJECT_IDS,
  EMPTY_OBJECT,
  ObjectId,
  SPEED_TERRAIN_DIRECTION,
  TIDE_TERRAIN_DIRECTION,
  Terrain,
  WINDMILL_DIRECTION,
  hexByte,
  signedByte,
  type Direction
} from '../mechanics/ids.js';
import {
  isCarousel,
  isMirror,
  isOrdinaryWalkableTerrain,
  isWaterTerrain,
  passageFor,
  rotateCarousel,
  rotateMirror,
  toggleColorTerrain,
  toggleSpeedTerrain,
  toggleTideTerrain,
  type PassageResult
} from '../mechanics/rules.js';
import type {
  DynamicEntity,
  Point,
  ProfileCapabilities,
  RuntimeState,
  WorldSnapshot
} from './RuntimeState.js';

export type { Point, WorldSnapshot } from './RuntimeState.js';
export type { PassageResult } from '../mechanics/rules.js';

export interface WorldEvent {
  type:
    | 'collect-carrot' | 'fill-nest' | 'collect-gas' | 'collect-kite' | 'collect-shovel'
    | 'collect-bean' | 'collect-golden-carrot' | 'collect-bonus-coin'
    | 'board-mower' | 'leave-mower' | 'mow' | 'break-rock' | 'toggle-switch'
    | 'dragon-fire' | 'melt-ice' | 'plant-bean' | 'beanstalk-grow' | 'death' | 'complete' | 'warning';
  message: string;
  x?: number;
  y?: number;
}

export interface MoveResult {
  moved: boolean;
  from: Point;
  to: Point;
  passage: PassageResult;
  events: WorldEvent[];
  forcedDirection: Direction | null;
  forcedKind: RuntimeState['forced'] extends infer _T ? string | null : never;
  dead: boolean;
  completed: boolean;
}

export interface TileInspection {
  x: number;
  y: number;
  terrainId: number;
  terrainSignedId: number;
  terrainHexId: string;
  object: LevelObject | null;
  objectId: number;
  objectSignedId: number;
  objectHexId: string;
  dynamicEntity: DynamicEntity | null;
  isPlayer: boolean;
  isStart: boolean;
}

const GROUND_AFTER_MOW = [Terrain.GROUND_A, Terrain.GROUND_B, Terrain.GROUND_C, Terrain.GROUND_D] as const;

function emptyGrid(width: number, height: number, value: number): number[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => value));
}

function pointEquals(a: Point | null, b: Point): boolean {
  return a !== null && a.x === b.x && a.y === b.y;
}

function copyPoint(point: Point): Point { return { x: point.x, y: point.y }; }

function isSameCell(entity: DynamicEntity, x: number, y: number): boolean {
  return entity.x === x && entity.y === y;
}

export class World {
  readonly level: LevelData;
  private stateValue: RuntimeState;

  constructor(level: LevelData, profile: Partial<ProfileCapabilities> = {}) {
    this.level = level;
    this.stateValue = this.createInitialState(level, profile);
  }

  get state(): Readonly<RuntimeState> { return this.stateValue; }
  get player(): Point { return this.stateValue.player; }
  get width(): number { return this.level.width; }
  get height(): number { return this.level.height; }
  get startPosition(): Point { return copyPoint(this.stateValue.start); }
  get objectiveRemaining(): number { return this.stateValue.objectiveRemaining; }
  get objectiveTotal(): number { return this.stateValue.objectiveTotal; }
  get ridingMower(): boolean { return this.stateValue.ridingMower; }
  get dead(): boolean { return this.stateValue.dead; }
  get completed(): boolean { return this.stateValue.completed; }
  get facing(): Direction { return this.stateValue.facing; }
  get forcedDirection(): Direction | null { return this.stateValue.forced?.direction ?? null; }
  get forcedKind(): string | null { return this.stateValue.forced?.kind ?? null; }
  /** Bobby 是否正站在 CE/DE/EE 三种成熟藤蔓段上。原版此时强制使用向上/背面人物动画。 */
  get isPlayerClimbing(): boolean {
    const id = this.objectIdAt(this.stateValue.player.x, this.stateValue.player.y);
    return id === ObjectId.BEANSTALK_TIP || id === ObjectId.BEANSTALK_MID || id === ObjectId.BEANSTALK_BASE;
  }

  /** 当前被 Bobby 搭乘的动态对象。供 Game 判断“载具和人物是否应共用同一段插值”。 */
  getRiddenDynamicEntity(): DynamicEntity | null {
    return this.stateValue.dynamicEntities.find((entity) => entity.rider && isSameCell(entity, this.stateValue.player.x, this.stateValue.player.y)) ?? null;
  }

  /**
   * 推进原版约 62ms 的逻辑时钟。当前首先用于精确复刻魔豆 S() 的 16 Tick 分段生长。
   * 返回的事件由 Game 统一转发给 UI / 音频层。
   */
  advanceTime(deltaMs: number): WorldEvent[] {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || this.stateValue.dead || this.stateValue.completed) return [];
    const events: WorldEvent[] = [];
    if (this.stateValue.bonusTimeRemainingMs !== null) {
      this.stateValue.bonusTimeRemainingMs = Math.max(0, this.stateValue.bonusTimeRemainingMs - deltaMs);
      if (this.stateValue.bonusTimeRemainingMs <= 0) {
        this.kill('Bonus Round 的 60 秒时间耗尽', events, this.stateValue.player.x, this.stateValue.player.y);
        return events;
      }
    }
    this.stateValue.logicRemainderMs += deltaMs;
    while (this.stateValue.logicRemainderMs >= 62) {
      this.stateValue.logicRemainderMs -= 62;
      this.advanceOriginalLogicTick(events);
    }
    return events;
  }

  clearTransientEffects(): void {
    this.stateValue.fireTrail = [];
  }

  snapshot(): WorldSnapshot {
    return structuredClone(this.stateValue);
  }

  restore(snapshot: WorldSnapshot): void {
    this.stateValue = structuredClone(snapshot);
  }

  setProfile(profile: Partial<ProfileCapabilities>): void {
    this.stateValue.profile = { ...this.stateValue.profile, ...profile };
  }

  terrainAt(x: number, y: number): number | null {
    if (!this.inBounds(x, y)) return null;
    return this.stateValue.terrain[y]?.[x] ?? null;
  }

  objectIdAt(x: number, y: number): number {
    if (!this.inBounds(x, y)) return EMPTY_OBJECT;
    return this.stateValue.objects[y]?.[x] ?? EMPTY_OBJECT;
  }

  objectsAt(x: number, y: number): LevelObject[] {
    const id = this.objectIdAt(x, y);
    if (id === EMPTY_OBJECT) return [];
    return [{ id, signedId: signedByte(id), hexId: hexByte(id), x, y }];
  }

  dynamicEntityAt(x: number, y: number): DynamicEntity | null {
    return this.stateValue.dynamicEntities.find((entity) => isSameCell(entity, x, y)) ?? null;
  }

  getDynamicEntities(): readonly DynamicEntity[] {
    return this.stateValue.dynamicEntities;
  }

  /**
   * 执行一个“逻辑格”移动。视觉插值由 Game/Renderer 完成。
   * 如果存在冰面、加速、飞行等强制状态，Game 会在本次动画结束后继续调用 forcedDirection。
   */
  move(direction: Direction, forced = false): MoveResult {
    const state = this.stateValue;
    const from = copyPoint(state.player);
    const events: WorldEvent[] = [];

    if (state.dead || state.completed) {
      return this.result(false, from, from, { passable: false, reason: state.dead ? 'Bobby 已失败' : '关卡已完成', confidence: 'confirmed' }, events);
    }

    if (!forced) state.facing = direction;
    const vector = DIRECTIONS[direction];
    const to = { x: from.x + vector.dx, y: from.y + vector.dy };

    // Bobby 正搭乘荷叶时，移动语义不同于普通地面。
    const ridden = state.dynamicEntities.find((entity) => entity.rider && isSameCell(entity, from.x, from.y));
    if (ridden?.id === ObjectId.LEAF) {
      return this.moveWithLeaf(ridden, direction, from, to, events, forced);
    }

    // 站在云上时，可向普通地面下云；云本身不随玩家输入移动。
    if (ridden && CLOUD_OBJECT_IDS.has(ridden.id)) {
      const passage = this.passageTo(from, to, direction);
      if (!passage.passable) return this.result(false, from, to, passage, events);
      ridden.rider = false;
      this.beforeLeave(from, events);
      state.player = to;
      state.facing = direction;
      state.moves += forced ? 0 : 1;
      this.applyPassageSideEffects(passage, to, events);
      this.afterEnter(to, direction, events);
      return this.result(true, from, to, passage, events);
    }

    if (!this.inBounds(to.x, to.y)) {
      if (state.forced?.kind === 'flight') {
        this.kill('风筝飞出了地图边界', events, from.x, from.y);
      } else {
        state.forced = null;
      }
      return this.result(false, from, to, { passable: false, reason: '地图边界', confidence: 'confirmed' }, events);
    }

    // 飞行状态不走普通碰撞：保持方向，直到落到 F5；越界会失败。
    if (state.forced?.kind === 'flight') {
      this.beforeLeave(from, events);
      state.player = to;
      state.facing = direction;
      this.afterEnterFlight(to, direction, events);
      return this.result(true, from, to, { passable: true, reason: '风筝飞行', confidence: 'confirmed' }, events);
    }

    // 可以从陆地踏上动态荷叶/云，即使其下方是水或不可步行地形。
    const dynamicTarget = this.dynamicEntityAt(to.x, to.y);
    if (dynamicTarget) {
      const staticObject = this.objectIdAt(to.x, to.y);
      if (staticObject !== EMPTY_OBJECT && staticObject !== ObjectId.CLOUD_GRID_RED && staticObject !== ObjectId.CLOUD_GRID_PURPLE && staticObject !== ObjectId.CLOUD_GRID_GREEN) {
        return this.result(false, from, to, { passable: false, reason: '动态载具所在格还有阻挡对象', confidence: 'inferred' }, events);
      }
      this.beforeLeave(from, events);
      state.player = to;
      state.facing = direction;
      state.moves += forced ? 0 : 1;
      dynamicTarget.rider = true;
      if (dynamicTarget.id === ObjectId.LEAF) {
        // 重新登上已经停住的荷叶会解除 settled；这是原版帮助文本明确规定的“必须下去再上来”。
        dynamicTarget.settled = false;
        state.forced = { kind: 'leaf', direction };
      }
      this.afterEnter(to, direction, events, { skipDynamic: true });
      return this.result(true, from, to, { passable: true, reason: '踏上动态载具', confidence: 'confirmed' }, events);
    }

    const passage = this.passageTo(from, to, direction);
    if (!passage.passable) {
      // 冰面/加速撞到障碍后停止强制移动，而不是无限重复。
      if (forced) state.forced = null;
      return this.result(false, from, to, passage, events);
    }

    this.beforeLeave(from, events);
    state.player = to;
    state.facing = direction;
    state.moves += forced ? 0 : 1;
    this.applyPassageSideEffects(passage, to, events);

    if (this.objectIdAt(to.x, to.y) === ObjectId.CRUMBLY_ROCK && state.ridingMower && state.forced?.kind === 'speed') {
      this.setObject(to.x, to.y, EMPTY_OBJECT);
      events.push({ type: 'break-rock', message: '高速割草机撞碎岩石', ...to });
    }

    this.afterEnter(to, direction, events, { justBoarded: passage.boardsMower === true });
    return this.result(true, from, to, passage, events);
  }

  inspect(x: number, y: number): TileInspection | null {
    const terrainId = this.terrainAt(x, y);
    if (terrainId === null) return null;
    const objectId = this.objectIdAt(x, y);
    return {
      x, y,
      terrainId,
      terrainSignedId: signedByte(terrainId),
      terrainHexId: hexByte(terrainId),
      object: objectId === EMPTY_OBJECT ? null : { id: objectId, signedId: signedByte(objectId), hexId: hexByte(objectId), x, y },
      objectId,
      objectSignedId: signedByte(objectId),
      objectHexId: hexByte(objectId),
      dynamicEntity: this.dynamicEntityAt(x, y),
      isPlayer: statePoint(this.stateValue.player, x, y),
      isStart: statePoint(this.stateValue.start, x, y)
    };
  }

  private createInitialState(level: LevelData, profile: Partial<ProfileCapabilities>): RuntimeState {
    const terrain = level.terrain.map((row) => [...row]);
    const objects = emptyGrid(level.width, level.height, EMPTY_OBJECT);
    const dynamicEntities: DynamicEntity[] = [];
    let start: Point | null = null;

    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        if (terrain[y]?.[x] === Terrain.START) start = { x, y };
      }
    }

    // 原版 e(int,int) 会把四种动态对象从 cv[][] 中抽出来，并展开若干多格对象。
    for (const sourceObject of level.objects) {
      const id = sourceObject.id & 0xff;
      const { x, y } = sourceObject;
      if (DYNAMIC_OBJECT_IDS.has(id)) {
        dynamicEntities.push({ id, x, y, direction: null, rider: false, settled: false, offsetXpx: 0, offsetYpx: 0 });
        continue;
      }
      objects[y]![x] = id;
      if (id === ObjectId.DRAGON_HEAD_BASE) {
        if (x + 1 < level.width) objects[y]![x + 1] = ObjectId.DRAGON_BODY;
        if (x + 2 < level.width) objects[y]![x + 2] = ObjectId.DRAGON_TAIL;
      } else if (id === ObjectId.SANDMAN && y + 1 < level.height) {
        objects[y + 1]![x] = ObjectId.SANDMAN_BODY;
      } else if (id === ObjectId.DREAM_MACHINE && y + 1 < level.height) {
        objects[y + 1]![x] = ObjectId.DREAM_MACHINE_BODY;
      } else if (id === ObjectId.BEAVER_BASE && y + 1 < level.height) {
        objects[y + 1]![x] = ObjectId.BEAVER_BODY;
      }
    }

    if (!start) start = this.findFallbackStart(terrain);

    let carrotCount = 0;
    let nestCount = 0;
    let hiddenCount = 0;
    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const object = objects[y]![x]!;
        if (object === ObjectId.CARROT) carrotCount += 1;
        if (object === ObjectId.EGG_NEST_EMPTY) nestCount += 1;
        if (terrain[y]![x] === Terrain.HIGH_GRASS_OBJECTIVE && object === EMPTY_OBJECT) hiddenCount += 1;
      }
    }
    // 原版 cU 初值为 false；扫描到 CA 时设 true，扫描到 CB 时设 false。
    // 只有没有显式 Object 的 C8 才是“隐式隐藏目标”；C8 上若已有金币等 Object，不能重复计目标。
    const objectiveMode = carrotCount > 0 ? 'carrot' : 'nest';
    const visibleObjective = objectiveMode === 'carrot' ? carrotCount : nestCount;
    const objectiveTotal = visibleObjective + hiddenCount;

    const windmillsEnabled: [boolean, boolean, boolean, boolean] = [false, false, false, false];
    const hasSwitch: [boolean, boolean, boolean, boolean] = [false, false, false, false];
    const onTiles = [Terrain.WIND_SWITCH_0_ON, Terrain.WIND_SWITCH_1_ON, Terrain.WIND_SWITCH_2_ON, Terrain.WIND_SWITCH_3_ON];
    const offTiles = [Terrain.WIND_SWITCH_0_OFF, Terrain.WIND_SWITCH_1_OFF, Terrain.WIND_SWITCH_2_OFF, Terrain.WIND_SWITCH_3_OFF];
    for (const row of terrain) {
      for (const id of row) {
        for (let i = 0; i < 4; i += 1) {
          if (id === onTiles[i]) { hasSwitch[i] = true; windmillsEnabled[i] = true; }
          if (id === offTiles[i]) { hasSwitch[i] = true; }
        }
      }
    }
    // 没有对应开关的风车按“常开”处理；这是对帮助文本和原版渲染行为的保守推断。
    const windmillIds = [ObjectId.WINDMILL_UP, ObjectId.WINDMILL_DOWN, ObjectId.WINDMILL_LEFT, ObjectId.WINDMILL_RIGHT];
    for (let i = 0; i < 4; i += 1) {
      if (!hasSwitch[i] && objects.some((row) => row.includes(windmillIds[i]!))) windmillsEnabled[i] = true;
    }

    return {
      terrain,
      objects,
      dynamicEntities,
      player: copyPoint(start),
      facing: 'down',
      start: copyPoint(start),
      objectiveMode,
      objectiveRemaining: objectiveTotal,
      objectiveTotal,
      inventory: { gas: false, kite: false, shovel: false, beans: 0 },
      profile: { superKey: profile.superKey ?? false, temporaryKey: profile.temporaryKey ?? false, speedShoes: profile.speedShoes ?? false },
      ridingMower: false,
      forced: null,
      pendingTrap: null,
      pendingCarousel: null,
      pendingMirror: null,
      pendingNest: null,
      pendingPlank: null,
      previousCrumblingPlank: null,
      windmillsEnabled,
      beanstalkGrowth: [],
      logicRemainderMs: 0,
      bonusTimeRemainingMs: level.objects.some((object) => object.id === ObjectId.BEAVER_BASE || object.id === ObjectId.BEAVER_BODY || object.id === ObjectId.BONUS_COIN) ? 60_000 : null,
      bonusCoinsInLevel: 0,
      goldenCarrotsInLevel: 0,
      moves: 0,
      dead: false,
      deathReason: null,
      completed: false,
      fireTrail: [],
      warnings: []
    };
  }

  private passageTo(from: Point, to: Point, direction: Direction): PassageResult {
    if (!this.inBounds(to.x, to.y)) return { passable: false, reason: '地图边界', confidence: 'confirmed' };
    const terrain = this.terrainAt(to.x, to.y)!;
    const object = this.objectIdAt(to.x, to.y);
    return passageFor(this.stateValue, from.x, from.y, to.x, to.y, direction, terrain, object);
  }

  private applyPassageSideEffects(passage: PassageResult, to: Point, events: WorldEvent[]): void {
    if (passage.consumesLock) {
      this.setObject(to.x, to.y, EMPTY_OBJECT);
      if (!this.stateValue.profile.superKey) this.stateValue.profile.temporaryKey = false;
    }
    if (passage.clearsSnow) {
      this.setTerrain(to.x, to.y, Terrain.GROUND_D);
      events.push({ type: 'toggle-switch', message: '雪铲清除了雪堆', ...to });
    }
    if (passage.boardsMower) {
      this.setObject(to.x, to.y, EMPTY_OBJECT);
      this.stateValue.ridingMower = true;
      events.push({ type: 'board-mower', message: '登上割草机', ...to });
    }
    if (passage.startsFlight) {
      this.stateValue.forced = { kind: 'flight', direction: this.stateValue.facing };
    }
  }

  private beforeLeave(from: Point, events: WorldEvent[]): void {
    const state = this.stateValue;

    if (pointEquals(state.pendingTrap, from)) {
      this.setTerrain(from.x, from.y, Terrain.TRAP_ACTIVE);
      state.pendingTrap = null;
    }

    if (pointEquals(state.pendingCarousel, from)) {
      this.setTerrain(from.x, from.y, rotateCarousel(this.terrainAt(from.x, from.y)!));
      state.pendingCarousel = null;
    }

    if (pointEquals(state.pendingMirror, from)) {
      this.setTerrain(from.x, from.y, rotateMirror(this.terrainAt(from.x, from.y)!));
      state.pendingMirror = null;
    }

    if (pointEquals(state.pendingNest, from)) {
      if (this.objectIdAt(from.x, from.y) === ObjectId.EGG_NEST_EMPTY) {
        this.setObject(from.x, from.y, ObjectId.EGG_NEST_FILLED);
        state.objectiveRemaining = Math.max(0, state.objectiveRemaining - 1);
        events.push({ type: 'fill-nest', message: '填满一个彩蛋巢', ...from });
      }
      state.pendingNest = null;
    }

    if (state.previousCrumblingPlank && !pointEquals(state.previousCrumblingPlank, from)) {
      const old = state.previousCrumblingPlank;
      if (this.objectIdAt(old.x, old.y) === ObjectId.PLANK_CRUMBLING || this.objectIdAt(old.x, old.y) === ObjectId.PLANK_FRAGMENT) {
        this.setObject(old.x, old.y, EMPTY_OBJECT);
      }
      state.previousCrumblingPlank = null;
    }

    if (pointEquals(state.pendingPlank, from)) {
      this.setObject(from.x, from.y, ObjectId.PLANK_CRUMBLING);
      state.previousCrumblingPlank = copyPoint(from);
      state.pendingPlank = null;
    }
  }

  private afterEnter(point: Point, direction: Direction, events: WorldEvent[], options: { skipDynamic?: boolean; justBoarded?: boolean } = {}): void {
    const state = this.stateValue;
    let terrain = this.terrainAt(point.x, point.y)!;
    const object = this.objectIdAt(point.x, point.y);

    // Terrain 与 Object 是独立层。割草只揭掉 Terrain 覆盖，不得覆盖原 DAT 已存在的 Object。
    // 第一次进入草格只负责 reveal；隐藏对象不会在同一逻辑拍被自动拾取。
    if (terrain === Terrain.HIGH_GRASS || terrain === Terrain.HIGH_GRASS_OBJECTIVE) {
      const hiddenObjective = terrain === Terrain.HIGH_GRASS_OBJECTIVE;
      const ground = GROUND_AFTER_MOW[(point.x * 17 + point.y * 31) & 3]!;
      this.setTerrain(point.x, point.y, ground);
      if (hiddenObjective && object === EMPTY_OBJECT) {
        this.setObject(point.x, point.y, state.objectiveMode === 'carrot' ? ObjectId.CARROT : ObjectId.EGG_NEST_EMPTY);
      }
      events.push({ type: 'mow', message: hiddenObjective ? '割开高草，发现目标' : '割开高草', ...point });
      return;
    }

    switch (object) {
      case ObjectId.CARROT:
        state.objectiveRemaining = Math.max(0, state.objectiveRemaining - 1);
        this.setObject(point.x, point.y, ObjectId.CONSUMED_CARROT);
        events.push({ type: 'collect-carrot', message: '收集胡萝卜', ...point });
        break;
      case ObjectId.EGG_NEST_EMPTY:
        state.pendingNest = copyPoint(point);
        break;
      case ObjectId.GAS:
        state.inventory.gas = true;
        this.setObject(point.x, point.y, EMPTY_OBJECT);
        events.push({ type: 'collect-gas', message: '取得割草机汽油，本关永久有效', ...point });
        break;
      case ObjectId.KITE:
        state.inventory.kite = true;
        this.setObject(point.x, point.y, EMPTY_OBJECT);
        events.push({ type: 'collect-kite', message: '取得风筝', ...point });
        break;
      case ObjectId.BEAN:
        state.inventory.beans += 1;
        this.setObject(point.x, point.y, EMPTY_OBJECT);
        events.push({ type: 'collect-bean', message: '取得魔豆', ...point });
        break;
      case ObjectId.BEAN_FIELD:
        if (state.inventory.beans > 0) {
          state.inventory.beans -= 1;
          // 原版 S()：DF 豆田先变 EF 萌芽；16 个逻辑 Tick 后才开始逐格向上长。
          this.setObject(point.x, point.y, ObjectId.BEAN_SPROUT);
          state.beanstalkGrowth.push({ x: point.x, baseY: point.y, stage: 1, ticksUntilGrowth: 16 });
          events.push({ type: 'plant-bean', message: '种下魔豆，藤蔓开始生长', ...point });
        }
        break;
      case ObjectId.GOLDEN_CARROT:
        state.goldenCarrotsInLevel += 1;
        this.setObject(point.x, point.y, EMPTY_OBJECT);
        events.push({ type: 'collect-golden-carrot', message: '取得金胡萝卜', ...point });
        break;
      case ObjectId.BONUS_COIN:
        state.bonusCoinsInLevel += 1;
        this.setObject(point.x, point.y, EMPTY_OBJECT);
        events.push({ type: 'collect-bonus-coin', message: '取得 Bonus Coin', ...point });
        break;
      case ObjectId.DRAGON_TAIL:
        this.fireDragon(events);
        break;
      case ObjectId.PLANK:
        state.pendingPlank = copyPoint(point);
        break;
    }

    terrain = this.terrainAt(point.x, point.y)!;

    if (terrain === Terrain.SHOVEL_PICKUP) {
      state.inventory.shovel = true;
      // 原版字节码明确将该格替换为 unsigned 124 (0x7C)。
      this.setTerrain(point.x, point.y, 0x7c);
      events.push({ type: 'collect-shovel', message: '取得雪铲', ...point });
      terrain = 0x7c;
    }

    if (terrain === Terrain.TRAP_INACTIVE) state.pendingTrap = copyPoint(point);
    if (terrain === Terrain.TRAP_ACTIVE && !state.ridingMower) this.kill('踩中了已经激活的陷阱', events, point.x, point.y);
    if (isCarousel(terrain)) state.pendingCarousel = copyPoint(point);
    if (isMirror(terrain)) state.pendingMirror = copyPoint(point);

    // A 是未按下/可触发态；全局翻转后当前格变 B。B 允许踩，但不得再次触发。
    if (terrain === Terrain.CAROUSEL_SWITCH_A) {
      this.mapTerrain((id) => isCarousel(id) ? rotateCarousel(id) : (id === Terrain.CAROUSEL_SWITCH_A ? Terrain.CAROUSEL_SWITCH_B : id === Terrain.CAROUSEL_SWITCH_B ? Terrain.CAROUSEL_SWITCH_A : id));
      events.push({ type: 'toggle-switch', message: '旋转全部 Carousel 地板', ...point });
      terrain = this.terrainAt(point.x, point.y)!;
    }

    if (terrain === Terrain.SPEED_SWITCH_A) {
      this.mapTerrain(toggleSpeedTerrain);
      events.push({ type: 'toggle-switch', message: '反转全部加速方向', ...point });
      terrain = this.terrainAt(point.x, point.y)!;
    }

    if (terrain === Terrain.TIDE_SWITCH_A) {
      this.mapTerrain(toggleTideTerrain);
      events.push({ type: 'toggle-switch', message: '反转潮汐方向', ...point });
      terrain = this.terrainAt(point.x, point.y)!;
    }

    if (terrain === Terrain.COLOR_YELLOW_SWITCH_A) {
      this.mapTerrain((id) => toggleColorTerrain(id, 'yellow'));
      events.push({ type: 'toggle-switch', message: '切换黄色机关', ...point });
      terrain = this.terrainAt(point.x, point.y)!;
    } else if (terrain === Terrain.COLOR_PINK_SWITCH_A) {
      this.mapTerrain((id) => toggleColorTerrain(id, 'pink'));
      events.push({ type: 'toggle-switch', message: '切换粉色机关', ...point });
      terrain = this.terrainAt(point.x, point.y)!;
    }

    const windSwitch = this.windSwitchIndex(terrain);
    if (windSwitch !== null) {
      state.windmillsEnabled[windSwitch] = !state.windmillsEnabled[windSwitch];
      this.toggleWindSwitchTiles(windSwitch);
      events.push({ type: 'toggle-switch', message: `切换风车 ${windSwitch + 1}`, ...point });
      this.propelCloudsByWind(events);
      terrain = this.terrainAt(point.x, point.y)!;
    }

    const speedDirection = SPEED_TERRAIN_DIRECTION.get(terrain);
    if (speedDirection) state.forced = { kind: 'speed', direction: speedDirection };
    else if (terrain === Terrain.ICE) state.forced = { kind: 'ice', direction };
    else if (state.forced?.kind === 'speed' || state.forced?.kind === 'ice') state.forced = null;

    // F4 的 passage 已设置 flight；F5 结束飞行。
    if (object === ObjectId.LANDING && state.forced?.kind === 'flight') state.forced = null;

    if (state.ridingMower && terrain === Terrain.MOWER_PARKING && !options.justBoarded) {
      this.setObject(point.x, point.y, ObjectId.MOWER);
      state.ridingMower = false;
      state.forced = { kind: 'mower-exit', direction: 'right' };
      events.push({ type: 'leave-mower', message: '在停车位自动下车', ...point });
    }

    if (!options.skipDynamic) this.propelCloudsByWind(events);

    if (!state.ridingMower && state.objectiveRemaining === 0 && terrain === Terrain.EXIT) {
      state.completed = true;
      state.forced = null;
      events.push({ type: 'complete', message: '关卡完成', ...point });
    }
  }

  private afterEnterFlight(point: Point, direction: Direction, events: WorldEvent[]): void {
    const object = this.objectIdAt(point.x, point.y);
    if (object === ObjectId.LANDING) {
      this.stateValue.forced = null;
      this.afterEnter(point, direction, events);
      return;
    }
    // 飞行中仍可收金胡萝卜/金币；其他机关按原版 cutscene 逻辑不触发。
    if (object === ObjectId.GOLDEN_CARROT) {
      this.stateValue.goldenCarrotsInLevel += 1;
      this.setObject(point.x, point.y, EMPTY_OBJECT);
      events.push({ type: 'collect-golden-carrot', message: '飞行中取得金胡萝卜', ...point });
    } else if (object === ObjectId.BONUS_COIN) {
      this.stateValue.bonusCoinsInLevel += 1;
      this.setObject(point.x, point.y, EMPTY_OBJECT);
      events.push({ type: 'collect-bonus-coin', message: '飞行中取得 Bonus Coin', ...point });
    }
    this.stateValue.forced = { kind: 'flight', direction };
  }

  private moveWithLeaf(entity: DynamicEntity, direction: Direction, from: Point, to: Point, events: WorldEvent[], forced: boolean): MoveResult {
    const state = this.stateValue;
    if (!this.inBounds(to.x, to.y)) {
      state.forced = null;
      entity.settled = true;
      return this.result(false, from, to, { passable: false, reason: '荷叶到达地图边界并停住', confidence: 'confirmed' }, events);
    }

    const terrain = this.terrainAt(to.x, to.y)!;
    const dynamicTarget = this.dynamicEntityAt(to.x, to.y);
    const object = this.objectIdAt(to.x, to.y);

    // 原版说明：荷叶一旦撞停，在 Bobby 下去并重新登叶之前，不能再次从普通水面启动。
    if (!entity.settled && isWaterTerrain(terrain) && !dynamicTarget && object === EMPTY_OBJECT) {
      const tideDirection = TIDE_TERRAIN_DIRECTION.get(terrain);
      // 反向潮汐不是“立即掉头”：它会让当前荷叶停住。
      if (tideDirection && DIRECTIONS[tideDirection].dx === -DIRECTIONS[direction].dx && DIRECTIONS[tideDirection].dy === -DIRECTIONS[direction].dy) {
        state.forced = null;
        entity.settled = true;
        return this.result(false, from, to, { passable: false, reason: '荷叶遇到反向潮汐并停住', confidence: 'confirmed' }, events);
      }
      entity.x = to.x;
      entity.y = to.y;
      entity.direction = tideDirection ?? direction;
      state.player = to;
      state.facing = direction;
      state.forced = { kind: 'leaf', direction: tideDirection ?? direction };
      return this.result(true, from, to, { passable: true, reason: tideDirection ? '荷叶受潮汐推动' : '荷叶继续漂流', confidence: 'confirmed' }, events);
    }

    // 漂流是强制移动：撞到可步行陆地也只会“靠岸停住”，不会自动把 Bobby 弹上岸。
    // 玩家下一次主动输入时才真正下荷叶。
    const passage = this.passageTo(from, to, direction);
    if (passage.passable && forced) {
      state.forced = null;
      entity.settled = true;
      return this.result(false, from, to, { passable: false, reason: '荷叶靠岸并停住', confidence: 'confirmed' }, events);
    }
    if (passage.passable) {
      entity.rider = false;
      state.forced = null;
      this.beforeLeave(from, events);
      state.player = to;
      state.facing = direction;
      state.moves += 1;
      this.applyPassageSideEffects(passage, to, events);
      this.afterEnter(to, direction, events);
      return this.result(true, from, to, passage, events);
    }

    state.forced = null;
    entity.settled = true;
    return this.result(false, from, to, { passable: false, reason: '荷叶撞到障碍并停住；需先下叶再重新登上', confidence: 'confirmed' }, events);
  }

  private advanceOriginalLogicTick(events: WorldEvent[]): void {
    this.propelCloudsByWind(events);
    this.advanceCloudMotion(events);
    const growth = this.stateValue.beanstalkGrowth;
    // 对应原版 private S()：从后往前删除已停止生长的任务。
    for (let index = growth.length - 1; index >= 0; index -= 1) {
      const item = growth[index]!;
      if (item.ticksUntilGrowth > 0) {
        item.ticksUntilGrowth -= 1;
        continue;
      }

      const targetY = item.baseY - item.stage;
      const canGrow = this.inBounds(item.x, targetY)
        && this.objectIdAt(item.x, targetY) === EMPTY_OBJECT
        // 原版 S() 的字节码是 unsigned terrain <= 93 (0x5D)。
        && (this.terrainAt(item.x, targetY) ?? 0xff) <= 0x5d;

      if (!canGrow) {
        growth.splice(index, 1);
        continue;
      }

      // 旧顶端 CE 变成中段 DE；第一段生长时豆田 EF 同时变成根部 EE。
      this.setObject(item.x, item.baseY - item.stage + 1, ObjectId.BEANSTALK_MID);
      if (item.stage <= 1) this.setObject(item.x, item.baseY, ObjectId.BEANSTALK_BASE);
      this.setObject(item.x, targetY, ObjectId.BEANSTALK_TIP);
      item.stage += 1;
      item.ticksUntilGrowth = 16;
      events.push({ type: 'beanstalk-grow', message: '藤蔓向上生长一格', x: item.x, y: targetY });
    }
  }

  private fireDragon(events: WorldEvent[]): void {
    const state = this.stateValue;
    let head: Point | null = null;
    outer: for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.objectIdAt(x, y) === ObjectId.DRAGON_HEAD_BASE) { head = { x, y }; break outer; }
      }
    }
    if (!head) return;

    // 原版 Q(): 火球从龙头格中心开始，dt=0；其方向枚举 0/1/2/3 = 左/右/上/下。
    let direction: Direction = 'left';
    let x = head.x - 1;
    let y = head.y;
    const trail: Point[] = [];
    const seen = new Set<string>();

    for (let step = 0; step < this.width * this.height * 2; step += 1) {
      if (!this.inBounds(x, y)) break;
      const key = `${x},${y},${direction}`;
      if (seen.has(key)) break;
      seen.add(key);
      trail.push({ x, y });

      const terrain = this.terrainAt(x, y)!;
      const object = this.objectIdAt(x, y);

      if (object === ObjectId.ICE_BLOCK) {
        this.setObject(x, y, EMPTY_OBJECT);
        events.push({ type: 'melt-ice', message: '龙火融化冰块', x, y });
      } else if (object === ObjectId.DRAGON_HEAD_BASE || object === ObjectId.DRAGON_BODY || object === ObjectId.CRUMBLY_ROCK) {
        break;
      }

      const reflected = this.reflectFire(terrain, direction);
      if (reflected === false) break;
      if (reflected) direction = reflected;
      else if (!this.fireTerrainPassable(terrain)) break;

      const vector = DIRECTIONS[direction];
      x += vector.dx;
      y += vector.dy;
    }

    state.fireTrail = trail;
    events.push({ type: 'dragon-fire', message: `龙喷火经过 ${trail.length} 格`, x: head.x, y: head.y });
  }

  private reflectFire(terrain: number, direction: Direction): Direction | null | false {
    // 从原版 Q() 逐分支恢复；未列出的入射方向会被镜子背面挡住。
    switch (terrain) {
      case Terrain.MIRROR_1:
        if (direction === 'left') return 'down';
        if (direction === 'up') return 'right';
        return false;
      case Terrain.MIRROR_2:
        if (direction === 'right') return 'down';
        if (direction === 'up') return 'left';
        return false;
      case Terrain.MIRROR_3:
        if (direction === 'left') return 'up';
        if (direction === 'down') return 'right';
        return false;
      case Terrain.MIRROR_4:
        if (direction === 'right') return 'up';
        if (direction === 'down') return 'left';
        return false;
      default:
        return null;
    }
  }

  private fireTerrainPassable(terrain: number): boolean {
    // 原版 Q() 明确允许 94..200、85..93、71..76；其中 C3/C5 两个升起方块阻挡。
    const inRange = (terrain >= 94 && terrain <= 200) || (terrain >= 85 && terrain <= 93) || (terrain >= 71 && terrain <= 76);
    return inRange && terrain !== Terrain.COLOR_YELLOW_BLOCK_ON && terrain !== Terrain.COLOR_PINK_BLOCK_ON;
  }

  private propelCloudsByWind(events: WorldEvent[]): void {
    const state = this.stateValue;
    const windmills: Array<{ x: number; y: number; direction: Direction; enabled: boolean }> = [];
    const ids: number[] = [ObjectId.WINDMILL_UP, ObjectId.WINDMILL_DOWN, ObjectId.WINDMILL_LEFT, ObjectId.WINDMILL_RIGHT];
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const object = this.objectIdAt(x, y);
        const index = ids.indexOf(object);
        if (index >= 0) windmills.push({ x, y, direction: WINDMILL_DIRECTION.get(object)!, enabled: state.windmillsEnabled[index]! });
      }
    }

    // 原版 P() 的风道只负责“捕获/改变云方向”；云离开前三格风道后仍保留惯性继续漂。
    for (const entity of state.dynamicEntities) {
      if (!CLOUD_OBJECT_IDS.has(entity.id)) continue;
      const wind = windmills.find((candidate) => candidate.enabled && this.isInWindTunnel(entity.x, entity.y, candidate.x, candidate.y, candidate.direction));
      if (wind) entity.direction = wind.direction;
    }
    void events;
  }

  /**
   * UP9 原版 P() 中无人云每逻辑 Tick 移动 3px，Bobby 搭乘时移动 6px；高清 Tile 为 48px。
   * 这里保留整数格碰撞，同时积累亚格像素偏移供 Renderer 平滑绘制。
   */
  private advanceCloudMotion(events: WorldEvent[]): void {
    const state = this.stateValue;
    const tilePx = 48;
    for (const entity of state.dynamicEntities) {
      if (!CLOUD_OBJECT_IDS.has(entity.id) || !entity.direction) continue;
      const vector = DIRECTIONS[entity.direction];
      const speed = entity.rider ? 6 : 3;
      entity.offsetXpx += vector.dx * speed;
      entity.offsetYpx += vector.dy * speed;

      const crossed = Math.abs(entity.offsetXpx) >= tilePx || Math.abs(entity.offsetYpx) >= tilePx;
      if (!crossed) continue;

      const nx = entity.x + vector.dx;
      const ny = entity.y + vector.dy;
      if (!this.canDynamicEntityOccupy(entity, nx, ny)) {
        entity.direction = null;
        entity.offsetXpx = 0;
        entity.offsetYpx = 0;
        continue;
      }

      entity.x = nx;
      entity.y = ny;
      entity.offsetXpx -= vector.dx * tilePx;
      entity.offsetYpx -= vector.dy * tilePx;
      if (entity.rider) state.player = { x: nx, y: ny };

      const ownGrid = CLOUD_GRID_FOR_OBJECT.get(entity.id);
      if (ownGrid !== undefined && this.objectIdAt(nx, ny) === ownGrid) {
        entity.direction = null;
        entity.offsetXpx = 0;
        entity.offsetYpx = 0;
      }
    }
    void events;
  }

  private isInWindTunnel(x: number, y: number, wx: number, wy: number, direction: Direction): boolean {
    const vector = DIRECTIONS[direction];
    for (let distance = 1; distance <= 3; distance += 1) {
      if (wx + vector.dx * distance === x && wy + vector.dy * distance === y) return true;
    }
    return false;
  }

  private canDynamicEntityOccupy(entity: DynamicEntity, x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    if (this.dynamicEntityAt(x, y)) return false;
    const object = this.objectIdAt(x, y);
    const ownGrid = CLOUD_GRID_FOR_OBJECT.get(entity.id);
    if (object !== EMPTY_OBJECT && object !== ownGrid) return false;
    const terrain = this.terrainAt(x, y)!;
    // 云在空中可跨越大多数底图，但实心墙/树区域仍停止；这里沿用火球的“可见游戏区域”范围作保守边界。
    return isOrdinaryWalkableTerrain(terrain) || isWaterTerrain(terrain) || (terrain >= 0x47 && terrain <= 0x5d);
  }

  private windSwitchIndex(terrain: number): number | null {
    // 风车开关的 ON/OFF 命名表达的是风车状态，不等同于 A/B 的“按下/未按下”视觉态；
    // 在字节码确认其触发边之前保持双态可触发，避免把未经确认的 A/B 规则硬套到风车系统。
    if (terrain === Terrain.WIND_SWITCH_0_ON || terrain === Terrain.WIND_SWITCH_0_OFF) return 0;
    if (terrain === Terrain.WIND_SWITCH_1_ON || terrain === Terrain.WIND_SWITCH_1_OFF) return 1;
    if (terrain === Terrain.WIND_SWITCH_2_ON || terrain === Terrain.WIND_SWITCH_2_OFF) return 2;
    if (terrain === Terrain.WIND_SWITCH_3_ON || terrain === Terrain.WIND_SWITCH_3_OFF) return 3;
    return null;
  }

  private toggleWindSwitchTiles(index: number): void {
    const pairs: Array<[number, number]> = [
      [Terrain.WIND_SWITCH_0_ON, Terrain.WIND_SWITCH_0_OFF],
      [Terrain.WIND_SWITCH_1_ON, Terrain.WIND_SWITCH_1_OFF],
      [Terrain.WIND_SWITCH_2_ON, Terrain.WIND_SWITCH_2_OFF],
      [Terrain.WIND_SWITCH_3_ON, Terrain.WIND_SWITCH_3_OFF]
    ];
    const pair = pairs[index]!;
    this.mapTerrain((id) => id === pair[0] ? pair[1] : id === pair[1] ? pair[0] : id);
  }

  private mapTerrain(mapper: (id: number) => number): void {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.stateValue.terrain[y]![x] = mapper(this.stateValue.terrain[y]![x]!);
      }
    }
  }

  private setTerrain(x: number, y: number, id: number): void {
    if (this.inBounds(x, y)) this.stateValue.terrain[y]![x] = id & 0xff;
  }

  private setObject(x: number, y: number, id: number): void {
    if (this.inBounds(x, y)) this.stateValue.objects[y]![x] = id & 0xff;
  }

  private kill(reason: string, events: WorldEvent[], x: number, y: number): void {
    const state = this.stateValue;
    state.dead = true;
    state.deathReason = reason;
    state.forced = null;
    events.push({ type: 'death', message: reason, x, y });
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  private findFallbackStart(terrain: number[][]): Point {
    for (let y = 0; y < terrain.length; y += 1) {
      for (let x = 0; x < (terrain[y]?.length ?? 0); x += 1) {
        const id = terrain[y]![x]!;
        if (isOrdinaryWalkableTerrain(id)) return { x, y };
      }
    }
    return { x: 0, y: 0 };
  }

  private result(moved: boolean, from: Point, to: Point, passage: PassageResult, events: WorldEvent[]): MoveResult {
    const forced = this.stateValue.forced;
    return {
      moved, from, to, passage, events,
      forcedDirection: forced?.direction ?? null,
      forcedKind: forced?.kind ?? null,
      dead: this.stateValue.dead,
      completed: this.stateValue.completed
    };
  }
}

function statePoint(point: Point, x: number, y: number): boolean {
  return point.x === x && point.y === y;
}
