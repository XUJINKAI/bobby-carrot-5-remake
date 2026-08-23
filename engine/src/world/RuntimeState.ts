import type { Direction } from '../mechanics/ids.js';

export interface Point { x: number; y: number; }

export type ObjectiveMode = 'carrot' | 'nest';
export type ForcedKind = 'speed' | 'ice' | 'flight' | 'leaf' | 'mower-exit';

export interface ForcedMovement {
  kind: ForcedKind;
  direction: Direction;
}

export interface DynamicEntity {
  /** 原始对象 ID：E0/E1/E2 云，EC 荷叶。 */
  id: number;
  x: number;
  y: number;
  direction: Direction | null;
  /** Bobby 是否正站在该动态实体上。 */
  rider: boolean;
  /**
   * 仅荷叶使用：原版荷叶撞到障碍后会停住，必须先下叶再重新登上才能再次漂流。
   * 该状态来自 EN.dat 帮助文本与原版动态实体更新逻辑的交叉验证。
   */
  settled: boolean;
  /** 动态云的原版亚格像素位移；UP9 高清 Tile 为 48px。荷叶通常保持 0。 */
  offsetXpx: number;
  offsetYpx: number;
}

/** 原版 S() 中的一条魔豆生长任务。每 16 个约 62ms 的逻辑 Tick 向上长一格。 */
export interface BeanstalkGrowth {
  x: number;
  baseY: number;
  /** 下一次尝试生长到 baseY - stage。初值为 1。 */
  stage: number;
  ticksUntilGrowth: number;
}

export interface InventoryState {
  gas: boolean;
  kite: boolean;
  shovel: boolean;
  beans: number;
}

export interface ProfileCapabilities {
  /** Beaver Shop 的 Super Key。 */
  superKey: boolean;
  /** 奖励关进入前由 Beaver 发放/购买的一次性钥匙；开锁后立即消耗。 */
  temporaryKey: boolean;
  /** Speed Shoes 只改变现代版移动动画速度，不改变谜题规则。 */
  speedShoes: boolean;
}

export interface RuntimeState {
  terrain: number[][];
  /** 每格至多一个静态对象；0xFF 表示空。原始 485 关均满足这一约束。 */
  objects: number[][];
  dynamicEntities: DynamicEntity[];

  player: Point;
  facing: Direction;
  start: Point;

  objectiveMode: ObjectiveMode;
  objectiveRemaining: number;
  objectiveTotal: number;

  inventory: InventoryState;
  profile: ProfileCapabilities;

  ridingMower: boolean;
  forced: ForcedMovement | null;

  /** 原版进入这些格子后，在“离开”时改变状态。 */
  pendingTrap: Point | null;
  pendingCarousel: Point | null;
  pendingMirror: Point | null;
  pendingNest: Point | null;
  pendingPlank: Point | null;
  previousCrumblingPlank: Point | null;

  windmillsEnabled: [boolean, boolean, boolean, boolean];

  /** 正在生长的魔豆。原版以 62ms 主循环 Tick 驱动。 */
  beanstalkGrowth: BeanstalkGrowth[];
  /** 保留不足一个原版逻辑 Tick 的时间，使暂停/Undo 后生长节奏稳定。 */
  logicRemainderMs: number;

  /** Bonus Round 原版 60 秒倒计时；普通关为 null。 */
  bonusTimeRemainingMs: number | null;
  bonusCoinsInLevel: number;
  goldenCarrotsInLevel: number;
  moves: number;

  dead: boolean;
  deathReason: string | null;
  completed: boolean;

  /** 最近一次龙火经过的格子，仅用于短暂渲染效果。 */
  fireTrail: Point[];
  /** 调试/兼容性提示，不会阻止游戏继续。 */
  warnings: string[];
}

export type WorldSnapshot = RuntimeState;
