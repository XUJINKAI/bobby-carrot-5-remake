import type { ObjectType, TerrainType } from '../data/types.js';
import { ObjectId, Terrain, type Direction } from './ids.js';
import {
  directionalPassage,
  markerBehavior,
  passageBehavior,
  rotateOnLeave,
  type BehaviorDescription,
  type TileBehavior
} from './behaviors.js';

export type TileTrait =
  | 'walkable'
  | 'water'
  | 'carousel'
  | 'mirror'
  | 'directional-passage'
  | 'rotatable'
  | 'terrain-passage-override'
  | 'object-passage-override'
  | 'terrain-overlay'
  | 'blocking'
  | 'collectible'
  | 'dynamic';

export interface TilePresentation {
  name: string;
  category: string;
}

export interface TileSourceMetadata {
  kind: 'original' | 'custom';
  datHexIds?: string[];
  confidence: 'confirmed' | 'inferred';
  evidence?: string;
}

export interface TileDefinition<T extends string> {
  id: T;
  presentation: TilePresentation;
  traits: readonly TileTrait[];
  behaviors: readonly TileBehavior[];
  source?: TileSourceMetadata;
}

export interface TileDefinitionInspection {
  id: string;
  presentation: TilePresentation;
  traits: readonly TileTrait[];
  behaviors: BehaviorDescription[];
  source?: TileSourceMetadata;
}

const terrainDefinitions = new Map<TerrainType, TileDefinition<TerrainType>>();
const objectDefinitions = new Map<ObjectType, TileDefinition<ObjectType>>();

function terrain(definition: TileDefinition<TerrainType>): void {
  terrainDefinitions.set(definition.id, definition);
}

function object(definition: TileDefinition<ObjectType>): void {
  objectDefinitions.set(definition.id, definition);
}

function original(hex: string, evidence = 'UP9 DAT / bytecode reference'): TileSourceMetadata {
  return { kind: 'original', datHexIds: [hex], confidence: 'confirmed', evidence };
}

function defineCarousel(
  id: TerrainType,
  hex: string,
  next: TerrainType,
  enter: Direction[],
  leave: Direction[]
): void {
  terrain({
    id,
    presentation: { name: 'Carousel', category: 'movement' },
    traits: ['walkable', 'carousel', 'directional-passage', 'rotatable'],
    behaviors: [directionalPassage({ enter, leave }), rotateOnLeave(next)],
    source: original(hex)
  });
}

defineCarousel(Terrain.CAROUSEL_1, '0xB9', Terrain.CAROUSEL_4, ['left', 'down'], ['right', 'up']);
defineCarousel(Terrain.CAROUSEL_2, '0xBA', Terrain.CAROUSEL_1, ['right', 'down'], ['left', 'up']);
defineCarousel(Terrain.CAROUSEL_3, '0xBB', Terrain.CAROUSEL_2, ['right', 'up'], ['left', 'down']);
defineCarousel(Terrain.CAROUSEL_4, '0xBC', Terrain.CAROUSEL_3, ['left', 'up'], ['right', 'down']);
defineCarousel(Terrain.CAROUSEL_VERTICAL, '0xBD', Terrain.CAROUSEL_HORIZONTAL, ['up', 'down'], ['up', 'down']);
defineCarousel(Terrain.CAROUSEL_HORIZONTAL, '0xBE', Terrain.CAROUSEL_VERTICAL, ['left', 'right'], ['left', 'right']);

const mirrorTransitions: Array<[TerrainType, string, TerrainType]> = [
  [Terrain.MIRROR_1, '0xB1', Terrain.MIRROR_2],
  [Terrain.MIRROR_2, '0xB2', Terrain.MIRROR_4],
  [Terrain.MIRROR_3, '0xB3', Terrain.MIRROR_1],
  [Terrain.MIRROR_4, '0xB4', Terrain.MIRROR_3]
];
for (const [id, hex, next] of mirrorTransitions) {
  terrain({
    id,
    presentation: { name: 'Magic Mirror', category: 'movement' },
    traits: ['walkable', 'mirror', 'rotatable'],
    behaviors: [
      passageBehavior('mower-blocked', '割草机不能驶过魔法镜', (ctx) => ctx.state.ridingMower
        ? { passable: false, reason: '割草机不能驶过魔法镜', confidence: 'confirmed' }
        : undefined),
      rotateOnLeave(next)
    ],
    source: original(hex)
  });
}

terrain({
  id: Terrain.SNOW,
  presentation: { name: 'Snow', category: 'terrain' },
  traits: ['terrain-passage-override'],
  behaviors: [passageBehavior('requires-shovel', '需要雪铲清除；割草机不能铲雪', (ctx) => {
    if (ctx.state.ridingMower) return { passable: false, reason: '割草机不能铲雪', confidence: 'inferred' };
    return ctx.state.inventory.shovel
      ? { passable: true, clearsSnow: true, reason: '雪铲清除雪堆', confidence: 'confirmed' }
      : { passable: false, reason: '需要雪铲', confidence: 'confirmed' };
  })],
  source: original('0x4D')
});

for (const [id, hex] of [
  [Terrain.WATER, '0x55'], [Terrain.WATER_ANIMATED, '0x56'],
  [Terrain.TIDE_UP, '0x57'], [Terrain.TIDE_DOWN, '0x58'], [Terrain.TIDE_LEFT, '0x59'], [Terrain.TIDE_RIGHT, '0x5A'],
  [Terrain.WATER_VARIANT_1, '0x5B'], [Terrain.WATER_VARIANT_2, '0x5C'], [Terrain.WATER_VARIANT_3, '0x5D']
] as Array<[TerrainType, string]>) {
  terrain({
    id,
    presentation: { name: id.startsWith('tide-') ? 'Tide' : 'Water', category: 'water' },
    traits: ['water'],
    behaviors: [markerBehavior('requires-overlay', '普通步行需要荷叶、木板或藤蔓等覆盖对象')],
    source: original(hex)
  });
}

for (const [id, hex] of [
  [Terrain.COLOR_YELLOW_BLOCK_RAISED, '0xC3'],
  [Terrain.COLOR_PINK_BLOCK_RAISED, '0xC5']
] as Array<[TerrainType, string]>) {
  terrain({
    id,
    presentation: { name: 'Raised Color Block', category: 'switch' },
    traits: ['terrain-passage-override'],
    behaviors: [passageBehavior('raised-block', '升起状态阻挡 Bobby', () => ({
      passable: false, reason: '彩色方块当前处于升起状态', confidence: 'confirmed'
    }))],
    source: original(hex)
  });
}

for (const [id, hex] of [[Terrain.HIGH_GRASS, '0xC7'], [Terrain.HIGH_GRASS_OBJECTIVE, '0xC8']] as Array<[TerrainType, string]>) {
  terrain({
    id,
    presentation: { name: id === Terrain.HIGH_GRASS ? 'High Grass' : 'High Grass Objective', category: 'mower' },
    traits: ['terrain-passage-override'],
    behaviors: [passageBehavior('requires-mower', '只有驾驶割草机才能通过', (ctx) => ctx.state.ridingMower
      ? { passable: true, reason: '割草机可以通过高草', confidence: 'confirmed' }
      : { passable: false, reason: '高草必须使用割草机通过', confidence: 'confirmed' })],
    source: original(hex)
  });
}

const overlayObjects: Array<[ObjectType, string, string]> = [
  [ObjectId.PLANK, '0xD4', 'Plank'],
  [ObjectId.BEANSTALK_TIP, '0xCE', 'Beanstalk Tip'],
  [ObjectId.BEANSTALK_MID, '0xDE', 'Beanstalk Mid'],
  [ObjectId.BEANSTALK_BASE, '0xEE', 'Beanstalk Base']
];
for (const [id, hex, name] of overlayObjects) {
  object({
    id,
    presentation: { name, category: 'overlay' },
    traits: ['terrain-overlay'],
    behaviors: [markerBehavior('terrain-passage-overlay', '覆盖底层不可步行地形并提供通路')],
    source: original(hex)
  });
}

object({
  id: ObjectId.LOCK,
  presentation: { name: 'Lock', category: 'gate' },
  traits: ['object-passage-override'],
  behaviors: [passageBehavior('requires-key', '需要 Beaver Key 或 Super Key', (ctx) => ctx.state.profile.superKey || ctx.state.profile.temporaryKey
    ? { passable: true, consumesLock: true, reason: ctx.state.profile.superKey ? 'Super Key 打开锁' : '一次性 Beaver Key 打开锁', confidence: 'confirmed' }
    : { passable: false, reason: '需要 Beaver 的钥匙或 Super Key', confidence: 'confirmed' })],
  source: original('0xCD')
});

object({
  id: ObjectId.MOWER,
  presentation: { name: 'Mower', category: 'vehicle' },
  traits: ['object-passage-override'],
  behaviors: [passageBehavior('board-mower', '取得汽油后可登上割草机', (ctx) => {
    if (ctx.state.ridingMower) return { passable: false, reason: '已经在驾驶割草机', confidence: 'inferred' };
    return ctx.state.inventory.gas
      ? { passable: true, boardsMower: true, reason: '登上已加油的割草机', confidence: 'confirmed' }
      : { passable: false, reason: '割草机需要先取得汽油', confidence: 'confirmed' };
  })],
  source: original('0xDC')
});

object({
  id: ObjectId.WHIRLWIND,
  presentation: { name: 'Whirlwind', category: 'flight' },
  traits: ['object-passage-override'],
  behaviors: [passageBehavior('requires-kite', '取得风筝后进入飞行状态', (ctx) => {
    if (ctx.state.ridingMower) return { passable: false, reason: '割草机不能进入龙卷风', confidence: 'confirmed' };
    return ctx.state.inventory.kite
      ? { passable: true, startsFlight: true, reason: '风筝被龙卷风带起', confidence: 'confirmed' }
      : { passable: false, reason: '需要风筝才能进入龙卷风', confidence: 'confirmed' };
  })],
  source: original('0xF4')
});

object({
  id: ObjectId.CRUMBLY_ROCK,
  presentation: { name: 'Crumbly Rock', category: 'mower' },
  traits: ['object-passage-override'],
  behaviors: [passageBehavior('break-by-fast-mower', '高速割草机可以撞碎', (ctx) => ctx.state.ridingMower && ctx.state.forced?.kind === 'speed'
    ? { passable: true, reason: '高速割草机撞碎岩石', confidence: 'confirmed' }
    : { passable: false, reason: '岩石需要高速割草机撞碎', confidence: 'confirmed' })],
  source: original('0xED')
});

const blockingObjects: Array<[ObjectType, string | undefined]> = [
  [ObjectId.EGG_NEST_FILLED, '0xCC'],
  [ObjectId.WINDMILL_UP, '0xD0'], [ObjectId.WINDMILL_DOWN, '0xD1'], [ObjectId.WINDMILL_LEFT, '0xD2'], [ObjectId.WINDMILL_RIGHT, '0xD3'],
  [ObjectId.PLANK_CRUMBLING, '0xD5'], [ObjectId.PLANK_FRAGMENT, '0xD6'],
  [ObjectId.DRAGON_HEAD_BASE, '0xD7'], [ObjectId.SANDMAN, '0xDA'], [ObjectId.DREAM_MACHINE, '0xDB'],
  [ObjectId.ICE_BLOCK, '0xE3'], [ObjectId.BEAVER_BASE, '0xE7'], [ObjectId.SANDMAN_BODY, '0xEA'], [ObjectId.DREAM_MACHINE_BODY, '0xEB'],
  [ObjectId.BEAVER_BODY, '0xF7'],
  [ObjectId.FENCE_1, '0xF9'], [ObjectId.FENCE_2, '0xFA'], [ObjectId.FENCE_3, '0xFB'], [ObjectId.FENCE_4, '0xFC'], [ObjectId.FENCE_5, '0xFD'], [ObjectId.FENCE_6, '0xFE']
];
for (const [id, hex] of blockingObjects) {
  if (objectDefinitions.has(id)) continue;
  object({
    id,
    presentation: { name: id, category: 'blocking-object' },
    traits: ['blocking'],
    behaviors: [markerBehavior('blocks-passage', '默认阻挡 Bobby 通过')],
    ...(hex ? { source: original(hex) } : {})
  });
}

export function getTerrainDefinition(id: TerrainType): TileDefinition<TerrainType> | undefined {
  return terrainDefinitions.get(id);
}

export function getObjectDefinition(id: ObjectType): TileDefinition<ObjectType> | undefined {
  return objectDefinitions.get(id);
}

export function terrainHasTrait(id: TerrainType, trait: TileTrait): boolean {
  return terrainDefinitions.get(id)?.traits.includes(trait) ?? false;
}

export function objectHasTrait(id: ObjectType, trait: TileTrait): boolean {
  return objectDefinitions.get(id)?.traits.includes(trait) ?? false;
}

export function nextTerrainAfterLeave(id: TerrainType): TerrainType {
  const definition = terrainDefinitions.get(id);
  if (!definition) return id;
  for (const behavior of definition.behaviors) {
    const next = behavior.nextTerrainOnLeave?.(id);
    if (next !== undefined) return next;
  }
  return id;
}

function inspect<T extends string>(definition: TileDefinition<T> | undefined, id: T): TileDefinitionInspection {
  if (!definition) {
    return {
      id,
      presentation: { name: id, category: 'unregistered' },
      traits: [],
      behaviors: [],
      source: { kind: 'original', confidence: 'inferred', evidence: 'No explicit Engine definition registered' }
    };
  }
  return {
    id: definition.id,
    presentation: definition.presentation,
    traits: definition.traits,
    behaviors: definition.behaviors.map((behavior) => behavior.describe()),
    ...(definition.source ? { source: definition.source } : {})
  };
}

export function inspectTerrainDefinition(id: TerrainType): TileDefinitionInspection {
  return inspect(terrainDefinitions.get(id), id);
}

export function inspectObjectDefinition(id: ObjectType): TileDefinitionInspection {
  return inspect(objectDefinitions.get(id), id);
}
