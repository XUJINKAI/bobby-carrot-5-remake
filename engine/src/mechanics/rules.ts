import {
  DIRECTIONS,
  ObjectId,
  Terrain,
  type Direction,
  type StepVector
} from './ids.js';
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

/** 原版旋转地板：b(byte) 的精确映射。 */
export function rotateCarousel(id: number): number {
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

/** 原版镜子 c(byte) 的精确旋转顺序。 */
export function rotateMirror(id: number): number {
  switch (id) {
    case Terrain.MIRROR_1: return Terrain.MIRROR_2;
    case Terrain.MIRROR_2: return Terrain.MIRROR_4;
    case Terrain.MIRROR_3: return Terrain.MIRROR_1;
    case Terrain.MIRROR_4: return Terrain.MIRROR_3;
    default: return id;
  }
}

export function toggleSpeedTerrain(id: number): number {
  switch (id) {
    case Terrain.SPEED_UP: return Terrain.SPEED_DOWN;
    case Terrain.SPEED_DOWN: return Terrain.SPEED_UP;
    case Terrain.SPEED_LEFT: return Terrain.SPEED_RIGHT;
    case Terrain.SPEED_RIGHT: return Terrain.SPEED_LEFT;
    case Terrain.SPEED_SWITCH_A: return Terrain.SPEED_SWITCH_B;
    case Terrain.SPEED_SWITCH_B: return Terrain.SPEED_SWITCH_A;
    default: return id;
  }
}

/**
 * 潮汐反向。原版 c(1) 会同时翻转 87..90 和 A5/A6；
 * 方向语义来自荷叶移动分支，四个方向成对反转。
 */
export function toggleTideTerrain(id: number): number {
  switch (id) {
    case Terrain.TIDE_UP: return Terrain.TIDE_DOWN;
    case Terrain.TIDE_DOWN: return Terrain.TIDE_UP;
    case Terrain.TIDE_LEFT: return Terrain.TIDE_RIGHT;
    case Terrain.TIDE_RIGHT: return Terrain.TIDE_LEFT;
    case Terrain.TIDE_SWITCH_A: return Terrain.TIDE_SWITCH_B;
    case Terrain.TIDE_SWITCH_B: return Terrain.TIDE_SWITCH_A;
    default: return id;
  }
}

export function toggleColorTerrain(id: number, color: 'yellow' | 'pink'): number {
  if (color === 'yellow') {
    switch (id) {
      case Terrain.COLOR_YELLOW_SWITCH_A: return Terrain.COLOR_YELLOW_SWITCH_B;
      case Terrain.COLOR_YELLOW_SWITCH_B: return Terrain.COLOR_YELLOW_SWITCH_A;
      case Terrain.COLOR_YELLOW_BLOCK_ON: return Terrain.COLOR_YELLOW_BLOCK_OFF;
      case Terrain.COLOR_YELLOW_BLOCK_OFF: return Terrain.COLOR_YELLOW_BLOCK_ON;
      default: return id;
    }
  }
  switch (id) {
    case Terrain.COLOR_PINK_SWITCH_A: return Terrain.COLOR_PINK_SWITCH_B;
    case Terrain.COLOR_PINK_SWITCH_B: return Terrain.COLOR_PINK_SWITCH_A;
    case Terrain.COLOR_PINK_BLOCK_ON: return Terrain.COLOR_PINK_BLOCK_OFF;
    case Terrain.COLOR_PINK_BLOCK_OFF: return Terrain.COLOR_PINK_BLOCK_ON;
    default: return id;
  }
}

export function isCarousel(id: number): boolean {
  return id >= Terrain.CAROUSEL_1 && id <= Terrain.CAROUSEL_HORIZONTAL;
}

export function isMirror(id: number): boolean {
  return id >= Terrain.MIRROR_1 && id <= Terrain.MIRROR_4;
}

export function canLeaveCarousel(id: number, vector: StepVector): boolean {
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

/**
 * 进入旋转地板时的方向限制，按原版碰撞分支恢复。
 * vector 表示“从当前格到目标格”的方向。
 */
export function canEnterCarousel(id: number, vector: StepVector): boolean {
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

export function isWaterTerrain(id: number): boolean {
  // 0x55..0x5A 是 atlas 中的水/浪/潮汐区域；87..90 明确承担潮汐方向。
  return id >= 0x55 && id <= 0x5a;
}

export function isOrdinaryWalkableTerrain(id: number): boolean {
  // 反编译的默认地形碰撞将大多数 94..200 视为可进入，再单独排除机关状态。
  // 这里同时包含 0x5E/0x5F/0x90/0x91 等常规草地。
  return (id >= 0x5e && id <= 0xc8) && !isWaterTerrain(id);
}

export function isFence(id: number): boolean {
  return id >= ObjectId.FENCE_1 && id <= ObjectId.FENCE_6;
}

export function objectBlocksByDefault(id: number): boolean {
  return id === ObjectId.EGG_NEST_FILLED
    || id === ObjectId.WINDMILL_UP
    || id === ObjectId.WINDMILL_DOWN
    || id === ObjectId.WINDMILL_LEFT
    || id === ObjectId.WINDMILL_RIGHT
    || id === ObjectId.PLANK_CRUMBLING
    || id === ObjectId.PLANK_FRAGMENT
    || id === ObjectId.DRAGON_HEAD_BASE
    || id === ObjectId.SANDMAN
    || id === ObjectId.DREAM_MACHINE
    || id === ObjectId.ICE_BLOCK
    || id === ObjectId.BEAVER_BASE
    || id === ObjectId.SANDMAN_BODY
    || id === ObjectId.DREAM_MACHINE_BODY
    || id === ObjectId.BEAVER
    || isFence(id);
}

export function passageFor(
  state: RuntimeState,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  direction: Direction,
  terrainId: number,
  objectId: number
): PassageResult {
  const vector = DIRECTIONS[direction];
  const fromTerrain = state.terrain[fromY]?.[fromX];

  if (fromTerrain !== undefined && isCarousel(fromTerrain) && !canLeaveCarousel(fromTerrain, vector)) {
    return { passable: false, reason: '当前旋转地板不允许从这个方向离开', confidence: 'confirmed' };
  }
  if (isCarousel(terrainId) && !canEnterCarousel(terrainId, vector)) {
    return { passable: false, reason: '目标旋转地板不允许从这个方向进入', confidence: 'confirmed' };
  }

  if (terrainId === Terrain.COLOR_YELLOW_BLOCK_ON || terrainId === Terrain.COLOR_PINK_BLOCK_ON) {
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

  // 潮汐/水面不能直接步行；动态荷叶单独处理。
  if (isWaterTerrain(terrainId)) {
    return { passable: false, reason: '水面需要荷叶等动态载具', confidence: 'confirmed' };
  }

  if (!isOrdinaryWalkableTerrain(terrainId) && objectId !== ObjectId.BEANSTALK_TIP && objectId !== ObjectId.BEANSTALK_BASE && objectId !== ObjectId.PLANK && objectId !== ObjectId.BEANSTALK_MID) {
    return { passable: false, reason: `地形 0x${terrainId.toString(16).toUpperCase()} 不可直接通行`, confidence: 'inferred' };
  }

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

  if (isMirror(terrainId) && state.ridingMower) {
    return { passable: false, reason: '割草机不能驶过魔法镜', confidence: 'confirmed' };
  }

  if (objectBlocksByDefault(objectId)) {
    return { passable: false, reason: `对象 0x${objectId.toString(16).toUpperCase()} 阻挡道路`, confidence: 'confirmed' };
  }

  // D8/D9（龙身体/尾巴）在原碰撞表中并非统一阻挡；D9 必须可踩以触发喷火。
  return { passable: true, reason: '可通行', confidence: 'confirmed' };
}
