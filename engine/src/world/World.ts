import type { LevelData, LevelObject, ObjectType, TerrainType } from '../data/types.js';
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
import {
  allowsBeanstalkGrowth,
  isCloudPassableBackground,
  isDragonFireBackground
} from '../mechanics/terrainTraits.js';
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
  forcedKind: string | null;
  dead: boolean;
  completed: boolean;
}

export interface TileInspection {
  x: number;
  y: number;
  terrainType: TerrainType;
  object: LevelObject | null;
  objectType: ObjectType;
  dynamicEntity: DynamicEntity | null;
  isPlayer: boolean;
  isStart: boolean;
}

const GROUND_AFTER_MOW = [Terrain.GROUND_A, Terrain.GROUND_B, Terrain.GROUND_C, Terrain.GROUND_D] as const;

function emptyGrid<T>(width: number, height: number, value: T): T[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => value));
}

function pointEquals(a: Point | null, b: Point): boolean {
  return a !== null && a.x === b.x && a.y === b.y;
}

function copyPoint(point: Point): Point { return { x: point.x, y: point.y }; }
function statePoint(point: Point, x: number, y: number): boolean { return point.x === x && point.y === y; }
function isSameCell(entity: DynamicEntity, x: number, y: number): boolean { return entity.x === x && entity.y === y; }
function isOppositeDirection(a: Direction, b: Direction): boolean {
  return DIRECTIONS[a].dx === -DIRECTIONS[b].dx && DIRECTIONS[a].dy === -DIRECTIONS[b].dy;
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
  get isPlayerClimbing(): boolean {
    const type = this.objectIdAt(this.stateValue.player.x, this.stateValue.player.y);
    return type === ObjectId.BEANSTALK_TIP || type === ObjectId.BEANSTALK_MID || type === ObjectId.BEANSTALK_BASE;
  }

  getRiddenDynamicEntity(): DynamicEntity | null {
    return this.stateValue.dynamicEntities.find((entity) => entity.rider && isSameCell(entity, this.stateValue.player.x, this.stateValue.player.y)) ?? null;
  }

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

  clearTransientEffects(): void { this.stateValue.fireTrail = []; }
  snapshot(): WorldSnapshot { return structuredClone(this.stateValue); }
  restore(snapshot: WorldSnapshot): void { this.stateValue = structuredClone(snapshot); }
  setProfile(profile: Partial<ProfileCapabilities>): void { this.stateValue.profile = { ...this.stateValue.profile, ...profile }; }

  terrainAt(x: number, y: number): TerrainType | null {
    if (!this.inBounds(x, y)) return null;
    return this.stateValue.terrain[y]?.[x] ?? null;
  }

  objectIdAt(x: number, y: number): ObjectType {
    if (!this.inBounds(x, y)) return EMPTY_OBJECT;
    return this.stateValue.objects[y]?.[x] ?? EMPTY_OBJECT;
  }

  objectsAt(x: number, y: number): LevelObject[] {
    const type = this.objectIdAt(x, y);
    return type === EMPTY_OBJECT ? [] : [{ type, x, y }];
  }

  dynamicEntityAt(x: number, y: number): DynamicEntity | null {
    return this.stateValue.dynamicEntities.find((entity) => isSameCell(entity, x, y)) ?? null;
  }

  getDynamicEntities(): readonly DynamicEntity[] { return this.stateValue.dynamicEntities; }

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

    const ridden = state.dynamicEntities.find((entity) => entity.rider && isSameCell(entity, from.x, from.y));
    if (ridden?.type === ObjectId.LEAF) return this.moveWithLeaf(ridden, direction, from, to, events, forced);

    if (ridden && CLOUD_OBJECT_IDS.has(ridden.type)) {
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
      if (state.forced?.kind === 'flight') this.kill('风筝飞出了地图边界', events, from.x, from.y);
      else state.forced = null;
      return this.result(false, from, to, { passable: false, reason: '地图边界', confidence: 'confirmed' }, events);
    }

    if (state.forced?.kind === 'flight') {
      this.beforeLeave(from, events);
      state.player = to;
      state.facing = direction;
      this.afterEnterFlight(to, direction, events);
      return this.result(true, from, to, { passable: true, reason: '风筝飞行', confidence: 'confirmed' }, events);
    }

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
      if (dynamicTarget.type === ObjectId.LEAF) {
        const underlyingTerrain = this.terrainAt(to.x, to.y);
        const tideDirection = underlyingTerrain ? TIDE_TERRAIN_DIRECTION.get(underlyingTerrain) : undefined;
        if (tideDirection && isOppositeDirection(tideDirection, direction)) {
          dynamicTarget.settled = true;
          dynamicTarget.direction = null;
          state.forced = null;
        } else {
          dynamicTarget.settled = false;
          dynamicTarget.direction = tideDirection ?? direction;
          state.forced = { kind: 'leaf', direction: tideDirection ?? direction };
        }
      }
      this.afterEnter(to, direction, events, { skipDynamic: true });
      return this.result(true, from, to, { passable: true, reason: '踏上动态载具', confidence: 'confirmed' }, events);
    }

    const passage = this.passageTo(from, to, direction);
    if (!passage.passable) {
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
    const terrainType = this.terrainAt(x, y);
    if (terrainType === null) return null;
    const objectType = this.objectIdAt(x, y);
    return {
      x,
      y,
      terrainType,
      object: objectType === EMPTY_OBJECT ? null : { type: objectType, x, y },
      objectType,
      dynamicEntity: this.dynamicEntityAt(x, y),
      isPlayer: statePoint(this.stateValue.player, x, y),
      isStart: statePoint(this.stateValue.start, x, y)
    };
  }

  private createInitialState(level: LevelData, profile: Partial<ProfileCapabilities>): RuntimeState {
    const terrain = level.terrain.map((row) => [...row]);
    const objects = emptyGrid<ObjectType>(level.width, level.height, EMPTY_OBJECT);
    const dynamicEntities: DynamicEntity[] = [];
    let start: Point | null = null;

    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        if (terrain[y]?.[x] === Terrain.START) start = { x, y };
      }
    }

    for (const sourceObject of level.objects) {
      const type = sourceObject.type;
      const { x, y } = sourceObject;
      if (DYNAMIC_OBJECT_IDS.has(type)) {
        dynamicEntities.push({ type, x, y, direction: null, rider: false, settled: false, offsetXpx: 0, offsetYpx: 0 });
        continue;
      }
      objects[y]![x] = type;
      if (type === ObjectId.DRAGON_HEAD_BASE) {
        if (x + 1 < level.width) objects[y]![x + 1] = ObjectId.DRAGON_BODY;
        if (x + 2 < level.width) objects[y]![x + 2] = ObjectId.DRAGON_TAIL;
      } else if (type === ObjectId.SANDMAN && y + 1 < level.height) {
        objects[y + 1]![x] = ObjectId.SANDMAN_BODY;
      } else if (type === ObjectId.DREAM_MACHINE && y + 1 < level.height) {
        objects[y + 1]![x] = ObjectId.DREAM_MACHINE_BODY;
      } else if (type === ObjectId.BEAVER_BASE && y + 1 < level.height) {
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
    const objectiveMode = carrotCount > 0 ? 'carrot' : 'nest';
    const visibleObjective = objectiveMode === 'carrot' ? carrotCount : nestCount;
    const objectiveTotal = visibleObjective + hiddenCount;

    const windmillsEnabled: [boolean, boolean, boolean, boolean] = [false, false, false, false];
    const hasSwitch: [boolean, boolean, boolean, boolean] = [false, false, false, false];
    const onTiles: TerrainType[] = [Terrain.WIND_SWITCH_0_ON, Terrain.WIND_SWITCH_1_ON, Terrain.WIND_SWITCH_2_ON, Terrain.WIND_SWITCH_3_ON];
    const offTiles: TerrainType[] = [Terrain.WIND_SWITCH_0_OFF, Terrain.WIND_SWITCH_1_OFF, Terrain.WIND_SWITCH_2_OFF, Terrain.WIND_SWITCH_3_OFF];
    for (const row of terrain) {
      for (const type of row) {
        for (let i = 0; i < 4; i += 1) {
          if (type === onTiles[i]) { hasSwitch[i] = true; windmillsEnabled[i] = true; }
          if (type === offTiles[i]) hasSwitch[i] = true;
        }
      }
    }
    const windmillTypes: ObjectType[] = [ObjectId.WINDMILL_UP, ObjectId.WINDMILL_DOWN, ObjectId.WINDMILL_LEFT, ObjectId.WINDMILL_RIGHT];
    for (let i = 0; i < 4; i += 1) {
      if (!hasSwitch[i] && objects.some((row) => row.includes(windmillTypes[i]!))) windmillsEnabled[i] = true;
    }

    const bonusTimeRemainingMs = (level.chapterLevel ?? 0) > 10 ? 60_000 : null;

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
      bonusTimeRemainingMs,
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
    return passageFor(
      this.stateValue,
      from.x,
      from.y,
      to.x,
      to.y,
      direction,
      this.terrainAt(to.x, to.y)!,
      this.objectIdAt(to.x, to.y)
    );
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
    if (passage.startsFlight) this.stateValue.forced = { kind: 'flight', direction: this.stateValue.facing };
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
      const oldType = this.objectIdAt(old.x, old.y);
      if (oldType === ObjectId.PLANK_CRUMBLING || oldType === ObjectId.PLANK_FRAGMENT) this.setObject(old.x, old.y, EMPTY_OBJECT);
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

    if (terrain === Terrain.HIGH_GRASS || terrain === Terrain.HIGH_GRASS_OBJECTIVE) {
      const hiddenObjective = terrain === Terrain.HIGH_GRASS_OBJECTIVE;
      const ground = GROUND_AFTER_MOW[(point.x * 17 + point.y * 31) & 3]!;
      this.setTerrain(point.x, point.y, ground);
      if (hiddenObjective && object === EMPTY_OBJECT) this.setObject(point.x, point.y, state.objectiveMode === 'carrot' ? ObjectId.CARROT : ObjectId.EGG_NEST_EMPTY);
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
      this.setTerrain(point.x, point.y, Terrain.SHOVEL_CLEARED_GROUND);
      events.push({ type: 'collect-shovel', message: '取得雪铲', ...point });
      terrain = Terrain.SHOVEL_CLEARED_GROUND;
    }

    if (terrain === Terrain.TRAP_INACTIVE) state.pendingTrap = copyPoint(point);
    if (terrain === Terrain.TRAP_ACTIVE && !state.ridingMower) this.kill('踩中了已经激活的陷阱', events, point.x, point.y);
    if (isCarousel(terrain)) state.pendingCarousel = copyPoint(point);
    if (isMirror(terrain)) state.pendingMirror = copyPoint(point);

    if (terrain === Terrain.CAROUSEL_SWITCH_RAISED) {
      this.mapTerrain((type) => isCarousel(type)
        ? rotateCarousel(type)
        : type === Terrain.CAROUSEL_SWITCH_RAISED
          ? Terrain.CAROUSEL_SWITCH_PRESSED
          : type === Terrain.CAROUSEL_SWITCH_PRESSED
            ? Terrain.CAROUSEL_SWITCH_RAISED
            : type);
      events.push({ type: 'toggle-switch', message: '旋转全部 Carousel 地板', ...point });
      terrain = this.terrainAt(point.x, point.y)!;
    }

    if (terrain === Terrain.SPEED_SWITCH_RAISED) {
      this.mapTerrain(toggleSpeedTerrain);
      events.push({ type: 'toggle-switch', message: '反转全部加速方向', ...point });
      terrain = this.terrainAt(point.x, point.y)!;
    }

    if (terrain === Terrain.TIDE_SWITCH_RAISED) {
      this.mapTerrain(toggleTideTerrain);
      events.push({ type: 'toggle-switch', message: '反转潮汐方向', ...point });
      terrain = this.terrainAt(point.x, point.y)!;
    }

    if (terrain === Terrain.COLOR_YELLOW_SWITCH_RAISED) {
      this.mapTerrain((type) => toggleColorTerrain(type, 'yellow'));
      events.push({ type: 'toggle-switch', message: '切换黄色机关', ...point });
      terrain = this.terrainAt(point.x, point.y)!;
    } else if (terrain === Terrain.COLOR_PINK_SWITCH_RAISED) {
      this.mapTerrain((type) => toggleColorTerrain(type, 'pink'));
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

    if (!entity.settled && isWaterTerrain(terrain) && !dynamicTarget && object === EMPTY_OBJECT) {
      const tideDirection = TIDE_TERRAIN_DIRECTION.get(terrain);
      if (tideDirection && isOppositeDirection(tideDirection, direction)) {
        state.forced = null;
        entity.settled = true;
        entity.direction = null;
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

    const passage = this.passageTo(from, to, direction);
    if (passage.passable && forced) {
      state.forced = null;
      entity.settled = true;
      entity.direction = null;
      return this.result(false, from, to, { passable: false, reason: '荷叶靠岸并停住', confidence: 'confirmed' }, events);
    }
    if (passage.passable) {
      entity.rider = false;
      state.forced = null;
      entity.direction = null;
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
    entity.direction = null;
    return this.result(false, from, to, { passable: false, reason: '荷叶撞到障碍并停住；需先下叶再重新登上', confidence: 'confirmed' }, events);
  }

  private advanceOriginalLogicTick(events: WorldEvent[]): void {
    this.propelCloudsByWind(events);
    this.advanceCloudMotion(events);
    const growth = this.stateValue.beanstalkGrowth;
    for (let index = growth.length - 1; index >= 0; index -= 1) {
      const item = growth[index]!;
      if (item.ticksUntilGrowth > 0) {
        item.ticksUntilGrowth -= 1;
        continue;
      }

      const targetY = item.baseY - item.stage;
      const targetTerrain = this.terrainAt(item.x, targetY);
      const canGrow = this.inBounds(item.x, targetY)
        && this.objectIdAt(item.x, targetY) === EMPTY_OBJECT
        && targetTerrain !== null
        && allowsBeanstalkGrowth(targetTerrain);

      if (!canGrow) {
        growth.splice(index, 1);
        continue;
      }

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

  private reflectFire(terrain: TerrainType, direction: Direction): Direction | null | false {
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

  private fireTerrainPassable(terrain: TerrainType): boolean {
    return isDragonFireBackground(terrain)
      && terrain !== Terrain.COLOR_YELLOW_BLOCK_RAISED
      && terrain !== Terrain.COLOR_PINK_BLOCK_RAISED;
  }

  private propelCloudsByWind(events: WorldEvent[]): void {
    const state = this.stateValue;
    const windmills: Array<{ x: number; y: number; direction: Direction; enabled: boolean }> = [];
    const types: ObjectType[] = [ObjectId.WINDMILL_UP, ObjectId.WINDMILL_DOWN, ObjectId.WINDMILL_LEFT, ObjectId.WINDMILL_RIGHT];
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const object = this.objectIdAt(x, y);
        const index = types.indexOf(object);
        if (index >= 0) windmills.push({ x, y, direction: WINDMILL_DIRECTION.get(object)!, enabled: state.windmillsEnabled[index]! });
      }
    }

    for (const entity of state.dynamicEntities) {
      if (!CLOUD_OBJECT_IDS.has(entity.type)) continue;
      const wind = windmills.find((candidate) => candidate.enabled && this.isInWindTunnel(entity.x, entity.y, candidate.x, candidate.y, candidate.direction));
      if (wind) entity.direction = wind.direction;
    }
    void events;
  }

  private advanceCloudMotion(events: WorldEvent[]): void {
    const state = this.stateValue;
    const tilePx = 48;
    for (const entity of state.dynamicEntities) {
      if (!CLOUD_OBJECT_IDS.has(entity.type) || !entity.direction) continue;
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

      const ownGrid = CLOUD_GRID_FOR_OBJECT.get(entity.type);
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
    const ownGrid = CLOUD_GRID_FOR_OBJECT.get(entity.type);
    if (object !== EMPTY_OBJECT && object !== ownGrid) return false;
    const terrain = this.terrainAt(x, y)!;
    return isCloudPassableBackground(terrain);
  }

  private windSwitchIndex(terrain: TerrainType): number | null {
    if (terrain === Terrain.WIND_SWITCH_0_ON || terrain === Terrain.WIND_SWITCH_0_OFF) return 0;
    if (terrain === Terrain.WIND_SWITCH_1_ON || terrain === Terrain.WIND_SWITCH_1_OFF) return 1;
    if (terrain === Terrain.WIND_SWITCH_2_ON || terrain === Terrain.WIND_SWITCH_2_OFF) return 2;
    if (terrain === Terrain.WIND_SWITCH_3_ON || terrain === Terrain.WIND_SWITCH_3_OFF) return 3;
    return null;
  }

  private toggleWindSwitchTiles(index: number): void {
    const pairs: Array<[TerrainType, TerrainType]> = [
      [Terrain.WIND_SWITCH_0_ON, Terrain.WIND_SWITCH_0_OFF],
      [Terrain.WIND_SWITCH_1_ON, Terrain.WIND_SWITCH_1_OFF],
      [Terrain.WIND_SWITCH_2_ON, Terrain.WIND_SWITCH_2_OFF],
      [Terrain.WIND_SWITCH_3_ON, Terrain.WIND_SWITCH_3_OFF]
    ];
    const pair = pairs[index]!;
    this.mapTerrain((type) => type === pair[0] ? pair[1] : type === pair[1] ? pair[0] : type);
  }

  private mapTerrain(mapper: (type: TerrainType) => TerrainType): void {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.stateValue.terrain[y]![x] = mapper(this.stateValue.terrain[y]![x]!);
      }
    }
  }

  private setTerrain(x: number, y: number, type: TerrainType): void {
    if (this.inBounds(x, y)) this.stateValue.terrain[y]![x] = type;
  }

  private setObject(x: number, y: number, type: ObjectType): void {
    if (this.inBounds(x, y)) this.stateValue.objects[y]![x] = type;
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

  private findFallbackStart(terrain: TerrainType[][]): Point {
    for (let y = 0; y < terrain.length; y += 1) {
      for (let x = 0; x < (terrain[y]?.length ?? 0); x += 1) {
        const type = terrain[y]![x]!;
        if (isOrdinaryWalkableTerrain(type)) return { x, y };
      }
    }
    return { x: 0, y: 0 };
  }

  private result(moved: boolean, from: Point, to: Point, passage: PassageResult, events: WorldEvent[]): MoveResult {
    const forced = this.stateValue.forced;
    return {
      moved,
      from,
      to,
      passage,
      events,
      forcedDirection: forced?.direction ?? null,
      forcedKind: forced?.kind ?? null,
      dead: this.stateValue.dead,
      completed: this.stateValue.completed
    };
  }
}
