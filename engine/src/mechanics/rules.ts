import type { ObjectType, TerrainType } from '../data/types.js';
import { DIRECTIONS, ObjectId, Terrain, type Direction, type StepVector } from './ids.js';
import { isOrdinaryWalkableTerrainType, isWaterTerrainType } from './terrainTraits.js';
import type { RuntimeState } from '../world/RuntimeState.js';

export interface PassageResult {
  passable: boolean;
  reason: string;
  confidence: 'confirmed' | 'inferred';
  consumesLock?: boolean;
  clearsSnow?: boolean;
  boardsMower?: boolean;
  startsFlight?: boolean;
}

export function rotateCarousel(id: TerrainType): TerrainType {
  switch (id) {
    case Terrain.CAROUSEL_1: return Terrain.CAROUSEL_4;
    case Terrain.CAROUSEL_2: return Terrain.CAROUSEL_1;
    case Terrain.CAROUSEL_3: return Terrain.CAROUSEL_2;
    case Terrain.CAROUSEL_4: return Terrain.CAROUSEL_3;
    case Terrain.CAROUSEL_VERTICAL: return Terrain.CAROUSEL_HORIZONTAL;
    case Terrain.CAROUSEL_HORIZONTAL: return Terrain.CAROUSEL_VERTICAL;
    default: return id;
  }
}

export function rotateMirror(id: TerrainType): TerrainType {
  switch (id) {
    case Terrain.MIRROR_1: return Terrain.MIRROR_2;
    case Terrain.MIRROR_2: return Terrain.MIRROR_4;
    case Terrain.MIRROR_3: return Terrain.MIRROR_1;
    case Terrain.MIRROR_4: return Terrain.MIRROR_3;
    default: return id;
  }
}

export function toggleSpeedTerrain(id: TerrainType): TerrainType {
  switch (id) {
    case Terrain.SPEED_UP: return Terrain.SPEED_DOWN;
    case Terrain.SPEED_DOWN: return Terrain.SPEED_UP;
    case Terrain.SPEED_LEFT: return Terrain.SPEED_RIGHT;
    case Terrain.SPEED_RIGHT: return Terrain.SPEED_LEFT;
    case Terrain.SPEED_SWITCH_PRESSED: return Terrain.SPEED_SWITCH_RAISED;
    case Terrain.SPEED_SWITCH_RAISED: return Terrain.SPEED_SWITCH_PRESSED;
    default: return id;
  }
}

export function toggleTideTerrain(id: TerrainType): TerrainType {
  switch (id) {
    case Terrain.TIDE_UP: return Terrain.TIDE_DOWN;
    case Terrain.TIDE_DOWN: return Terrain.TIDE_UP;
    case Terrain.TIDE_LEFT: return Terrain.TIDE_RIGHT;
    case Terrain.TIDE_RIGHT: return Terrain.TIDE_LEFT;
    case Terrain.TIDE_SWITCH_RAISED: return Terrain.TIDE_SWITCH_PRESSED;
    case Terrain.TIDE_SWITCH_PRESSED: return Terrain.TIDE_SWITCH_RAISED;
    default: return id;
  }
}

export function toggleColorTerrain(id: TerrainType, color: 'yellow' | 'pink'): TerrainType {
  if (color === 'yellow') {
    switch (id) {
      case Terrain.COLOR_YELLOW_SWITCH_RAISED: return Terrain.COLOR_YELLOW_SWITCH_PRESSED;
      case Terrain.COLOR_YELLOW_SWITCH_PRESSED: return Terrain.COLOR_YELLOW_SWITCH_RAISED;
      case Terrain.COLOR_YELLOW_BLOCK_RAISED: return Terrain.COLOR_YELLOW_BLOCK_LOWERED;
      case Terrain.COLOR_YELLOW_BLOCK_LOWERED: return Terrain.COLOR_YELLOW_BLOCK_RAISED;
      default: return id;
    }
  }
  switch (id) {
    case Terrain.COLOR_PINK_SWITCH_RAISED: return Terrain.COLOR_PINK_SWITCH_PRESSED;
    case Terrain.COLOR_PINK_SWITCH_PRESSED: return Terrain.COLOR_PINK_SWITCH_RAISED;
    case Terrain.COLOR_PINK_BLOCK_RAISED: return Terrain.COLOR_PINK_BLOCK_LOWERED;
    case Terrain.COLOR_PINK_BLOCK_LOWERED: return Terrain.COLOR_PINK_BLOCK_RAISED;
    default: return id;
  }
}

const CAROUSELS = new Set<TerrainType>([
  Terrain.CAROUSEL_1, Terrain.CAROUSEL_2, Terrain.CAROUSEL_3, Terrain.CAROUSEL_4, Terrain.CAROUSEL_VERTICAL, Terrain.CAROUSEL_HORIZONTAL
]);
const MIRRORS = new Set<TerrainType>([Terrain.MIRROR_1, Terrain.MIRROR_2, Terrain.MIRROR_3, Terrain.MIRROR_4]);
const FENCES = new Set<ObjectType>([ObjectId.FENCE_1, ObjectId.FENCE_2, ObjectId.FENCE_3, ObjectId.FENCE_4, ObjectId.FENCE_5, ObjectId.FENCE_6]);

export function isCarousel(id: TerrainType): boolean { return CAROUSELS.has(id); }
export function isMirror(id: TerrainType): boolean { return MIRRORS.has(id); }
export function isWaterTerrain(id: TerrainType): boolean { return isWaterTerrainType(id); }
export function isOrdinaryWalkableTerrain(id: TerrainType): boolean { return isOrdinaryWalkableTerrainType(id); }
export function isFence(id: ObjectType): boolean { return FENCES.has(id); }

export function canLeaveCarousel(id: TerrainType, vector: StepVector): boolean {
  switch (id) {
    case Terrain.CAROUSEL_1: return vector.dx === 1 || vector.dy === -1;
    case Terrain.CAROUSEL_2: return vector.dx === -1 || vector.dy === -1;
    case Terrain.CAROUSEL_3: return vector.dx === -1 || vector.dy === 1;
    case Terrain.CAROUSEL_4: return vector.dx === 1 || vector.dy === 1;
    case Terrain.CAROUSEL_VERTICAL: return vector.dy !== 0;
    case Terrain.CAROUSEL_HORIZONTAL: return vector.dx !== 0;
    default: return true;
  }
}

export function canEnterCarousel(id: TerrainType, vector: StepVector): boolean {
  switch (id) {
    case Terrain.CAROUSEL_1: return vector.dx === -1 || vector.dy === 1;
    case Terrain.CAROUSEL_2: return vector.dx === 1 || vector.dy === 1;
    case Terrain.CAROUSEL_3: return vector.dx === 1 || vector.dy === -1;
    case Terrain.CAROUSEL_4: return vector.dx === -1 || vector.dy === -1;
    case Terrain.CAROUSEL_VERTICAL: return vector.dy !== 0;
    case Terrain.CAROUSEL_HORIZONTAL: return vector.dx !== 0;
    default: return true;
  }
}

export function objectOverridesTerrainPassage(id: ObjectType): boolean {
  return id === ObjectId.PLANK || id === ObjectId.BEANSTALK_TIP || id === ObjectId.BEANSTALK_MID || id === ObjectId.BEANSTALK_BASE;
}

export function objectBlocksByDefault(id: ObjectType): boolean {
  return id === ObjectId.EGG_NEST_FILLED
    || id === ObjectId.WINDMILL_UP || id === ObjectId.WINDMILL_DOWN || id === ObjectId.WINDMILL_LEFT || id === ObjectId.WINDMILL_RIGHT
    || id === ObjectId.PLANK_CRUMBLING || id === ObjectId.PLANK_FRAGMENT
    || id === ObjectId.DRAGON_HEAD_BASE || id === ObjectId.SANDMAN || id === ObjectId.DREAM_MACHINE
    || id === ObjectId.ICE_BLOCK || id === ObjectId.BEAVER_BASE || id === ObjectId.SANDMAN_BODY || id === ObjectId.DREAM_MACHINE_BODY
    || id === ObjectId.BEAVER_BODY || isFence(id);
}

export function passageFor(
  state: RuntimeState,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  direction: Direction,
  terrainId: TerrainType,
  objectId: ObjectType
): PassageResult {
  const vector = DIRECTIONS[direction];
  const fromTerrain = state.terrain[fromY]?.[fromX];

  if (state.ridingMower && (isCarousel(terrainId) || (fromTerrain !== undefined && isCarousel(fromTerrain)))) {
    return { passable: false, reason: '割草机不能进入旋转通道', confidence: 'confirmed' };
  }
  if (fromTerrain !== undefined && isCarousel(fromTerrain) && !canLeaveCarousel(fromTerrain, vector)) {
    return { passable: false, reason: '当前旋转地板不允许从这个方向离开', confidence: 'confirmed' };
  }
  if (isCarousel(terrainId) && !canEnterCarousel(terrainId, vector)) {
    return { passable: false, reason: '目标旋转地板不允许从这个方向进入', confidence: 'confirmed' };
  }
  if (terrainId === Terrain.COLOR_YELLOW_BLOCK_RAISED || terrainId === Terrain.COLOR_PINK_BLOCK_RAISED) {
    return { passable: false, reason: '彩色方块当前处于升起状态', confidence: 'confirmed' };
  }
  if (terrainId === Terrain.HIGH_GRASS || terrainId === Terrain.HIGH_GRASS_OBJECTIVE) {
    return state.ridingMower
      ? { passable: true, reason: '割草机可以通过高草', confidence: 'confirmed' }
      : { passable: false, reason: '高草必须使用割草机通过', confidence: 'confirmed' };
  }
  if (terrainId === Terrain.SNOW) {
    if (state.ridingMower) return { passable: false, reason: '割草机不能铲雪', confidence: 'inferred' };
    return state.inventory.shovel
      ? { passable: true, clearsSnow: true, reason: '雪铲清除雪堆', confidence: 'confirmed' }
      : { passable: false, reason: '需要雪铲', confidence: 'confirmed' };
  }

  const overlayPassable = objectOverridesTerrainPassage(objectId);
  if (isWaterTerrain(terrainId) && !overlayPassable) return { passable: false, reason: '水面需要荷叶或桥面等覆盖对象', confidence: 'confirmed' };
  if (!isOrdinaryWalkableTerrain(terrainId) && !overlayPassable) return { passable: false, reason: `地形 ${terrainId} 不可直接通行`, confidence: 'inferred' };

  if (objectId === ObjectId.LOCK) {
    return state.profile.superKey || state.profile.temporaryKey
      ? { passable: true, consumesLock: true, reason: state.profile.superKey ? 'Super Key 打开锁' : '一次性 Beaver Key 打开锁', confidence: 'confirmed' }
      : { passable: false, reason: '需要 Beaver 的钥匙或 Super Key', confidence: 'confirmed' };
  }
  if (objectId === ObjectId.MOWER) {
    if (state.ridingMower) return { passable: false, reason: '已经在驾驶割草机', confidence: 'inferred' };
    return state.inventory.gas
      ? { passable: true, boardsMower: true, reason: '登上已加油的割草机', confidence: 'confirmed' }
      : { passable: false, reason: '割草机需要先取得汽油', confidence: 'confirmed' };
  }
  if (objectId === ObjectId.WHIRLWIND) {
    if (state.ridingMower) return { passable: false, reason: '割草机不能进入龙卷风', confidence: 'confirmed' };
    return state.inventory.kite
      ? { passable: true, startsFlight: true, reason: '风筝被龙卷风带起', confidence: 'confirmed' }
      : { passable: false, reason: '需要风筝才能进入龙卷风', confidence: 'confirmed' };
  }
  if (objectId === ObjectId.CRUMBLY_ROCK) {
    const accelerated = state.forced?.kind === 'speed';
    return state.ridingMower && accelerated
      ? { passable: true, reason: '高速割草机撞碎岩石', confidence: 'confirmed' }
      : { passable: false, reason: '岩石需要高速割草机撞碎', confidence: 'confirmed' };
  }
  if (isMirror(terrainId) && state.ridingMower) return { passable: false, reason: '割草机不能驶过魔法镜', confidence: 'confirmed' };
  if (objectBlocksByDefault(objectId)) return { passable: false, reason: `对象 ${objectId} 阻挡道路`, confidence: 'confirmed' };

  return { passable: true, reason: overlayPassable ? '覆盖对象提供通路' : '可通行', confidence: 'confirmed' };
}
