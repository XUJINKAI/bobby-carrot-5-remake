import type { ObjectType, TerrainType } from '../data/types.js';
import { DYNAMIC_OBJECT_IDS, EMPTY_OBJECT, ObjectId, SPEED_TERRAIN_DIRECTION, Terrain, type Direction } from './ids.js';
import { isOrdinaryWalkableTerrainType, isWaterTerrainType } from './terrainTraits.js';
import {
  directionalPassage,
  enterBehavior,
  leaveBehavior,
  markerBehavior,
  passageBehavior,
  rotateOnLeave,
  type BehaviorDescription,
  type BehaviorRuntimeContext,
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
  | 'dynamic'
  | 'forced-movement'
  | 'switch'
  | 'hazard'
  | 'exit'
  | 'pickup';

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

function hex(code: number): string { return `0x${code.toString(16).padStart(2, '0').toUpperCase()}`; }
function original(code: number, evidence = 'DAT codec / UP9 reverse-engineering reference'): TileSourceMetadata {
  return { kind: 'original', datHexIds: [hex(code)], confidence: 'confirmed', evidence };
}
function inferredOriginal(code: number): TileSourceMetadata {
  return { kind: 'original', datHexIds: [hex(code)], confidence: 'inferred', evidence: 'Semantic variant preserved by DAT codec' };
}
function pretty(id: string): string {
  return id.split('-').map((part) => part ? part[0]!.toUpperCase() + part.slice(1) : part).join(' ');
}

const TERRAIN_DAT = new Map<TerrainType, number>([
  [Terrain.SNOW,0x4d],[Terrain.WATER,0x55],[Terrain.WATER_ANIMATED,0x56],[Terrain.TIDE_UP,0x57],[Terrain.TIDE_DOWN,0x58],[Terrain.TIDE_LEFT,0x59],[Terrain.TIDE_RIGHT,0x5a],
  [Terrain.WATER_VARIANT_1,0x5b],[Terrain.WATER_VARIANT_2,0x5c],[Terrain.WATER_VARIANT_3,0x5d],[Terrain.GROUND_A,0x5e],[Terrain.GROUND_B,0x5f],[Terrain.SHOVEL_CLEARED_GROUND,0x7c],
  [Terrain.GROUND_C,0x90],[Terrain.GROUND_D,0x91],[Terrain.ICE,0x94],[Terrain.START,0x95],[Terrain.EXIT,0x96],
  [Terrain.SHOP_DREAM,0x97],[Terrain.SHOP_CLOUD9,0x98],[Terrain.SHOP_SUPER_KEY,0x99],[Terrain.SHOP_STEREO,0x9a],[Terrain.SHOP_MUSIC,0x9b],[Terrain.SHOP_SPEED_SHOES,0x9c],[Terrain.SHOP_COIN_RADAR,0x9d],[Terrain.SHOP_UNAVAILABLE,0x9e],
  [Terrain.SHOVEL_PICKUP,0x9f],[Terrain.MOWER_PARKING,0xa0],[Terrain.SPEED_SWITCH_PRESSED,0xa1],[Terrain.SPEED_SWITCH_RAISED,0xa2],[Terrain.CAROUSEL_SWITCH_RAISED,0xa3],[Terrain.CAROUSEL_SWITCH_PRESSED,0xa4],
  [Terrain.TIDE_SWITCH_RAISED,0xa5],[Terrain.TIDE_SWITCH_PRESSED,0xa6],[Terrain.WIND_SWITCH_0_ON,0xa7],[Terrain.WIND_SWITCH_0_OFF,0xa8],[Terrain.WIND_SWITCH_1_ON,0xa9],[Terrain.WIND_SWITCH_1_OFF,0xaa],
  [Terrain.WIND_SWITCH_2_ON,0xab],[Terrain.WIND_SWITCH_2_OFF,0xac],[Terrain.WIND_SWITCH_3_ON,0xad],[Terrain.WIND_SWITCH_3_OFF,0xae],[Terrain.TRAP_ACTIVE,0xaf],[Terrain.TRAP_INACTIVE,0xb0],
  [Terrain.MIRROR_1,0xb1],[Terrain.MIRROR_2,0xb2],[Terrain.MIRROR_3,0xb3],[Terrain.MIRROR_4,0xb4],[Terrain.SPEED_UP,0xb5],[Terrain.SPEED_DOWN,0xb6],[Terrain.SPEED_LEFT,0xb7],[Terrain.SPEED_RIGHT,0xb8],
  [Terrain.CAROUSEL_1,0xb9],[Terrain.CAROUSEL_2,0xba],[Terrain.CAROUSEL_3,0xbb],[Terrain.CAROUSEL_4,0xbc],[Terrain.CAROUSEL_VERTICAL,0xbd],[Terrain.CAROUSEL_HORIZONTAL,0xbe],
  [Terrain.COLOR_YELLOW_SWITCH_RAISED,0xbf],[Terrain.COLOR_YELLOW_SWITCH_PRESSED,0xc0],[Terrain.COLOR_PINK_SWITCH_RAISED,0xc1],[Terrain.COLOR_PINK_SWITCH_PRESSED,0xc2],
  [Terrain.COLOR_YELLOW_BLOCK_RAISED,0xc3],[Terrain.COLOR_YELLOW_BLOCK_LOWERED,0xc4],[Terrain.COLOR_PINK_BLOCK_RAISED,0xc5],[Terrain.COLOR_PINK_BLOCK_LOWERED,0xc6],[Terrain.HIGH_GRASS,0xc7],[Terrain.HIGH_GRASS_OBJECTIVE,0xc8]
]);

const OBJECT_DAT = new Map<ObjectType, number>([
  [ObjectId.CONSUMED_CARROT,0xc9],[ObjectId.CARROT,0xca],[ObjectId.EGG_NEST_EMPTY,0xcb],[ObjectId.EGG_NEST_FILLED,0xcc],[ObjectId.LOCK,0xcd],[ObjectId.BEANSTALK_TIP,0xce],[ObjectId.BEAN,0xcf],
  [ObjectId.WINDMILL_UP,0xd0],[ObjectId.WINDMILL_DOWN,0xd1],[ObjectId.WINDMILL_LEFT,0xd2],[ObjectId.WINDMILL_RIGHT,0xd3],[ObjectId.PLANK,0xd4],[ObjectId.PLANK_CRUMBLING,0xd5],[ObjectId.PLANK_FRAGMENT,0xd6],
  [ObjectId.DRAGON_HEAD_BASE,0xd7],[ObjectId.DRAGON_BODY,0xd8],[ObjectId.DRAGON_TAIL,0xd9],[ObjectId.SANDMAN,0xda],[ObjectId.DREAM_MACHINE,0xdb],[ObjectId.MOWER,0xdc],[ObjectId.GAS,0xdd],[ObjectId.BEANSTALK_MID,0xde],[ObjectId.BEAN_FIELD,0xdf],
  [ObjectId.CLOUD_RED,0xe0],[ObjectId.CLOUD_PURPLE,0xe1],[ObjectId.CLOUD_GREEN,0xe2],[ObjectId.ICE_BLOCK,0xe3],[ObjectId.ICE_MELT_1,0xe4],[ObjectId.ICE_MELT_2,0xe5],[ObjectId.ICE_MELT_3,0xe6],[ObjectId.BEAVER_BASE,0xe7],
  [ObjectId.DRAGON_ANIM_1,0xe8],[ObjectId.DRAGON_ANIM_2,0xe9],[ObjectId.SANDMAN_BODY,0xea],[ObjectId.DREAM_MACHINE_BODY,0xeb],[ObjectId.LEAF,0xec],[ObjectId.CRUMBLY_ROCK,0xed],[ObjectId.BEANSTALK_BASE,0xee],[ObjectId.BEAN_SPROUT,0xef],
  [ObjectId.CLOUD_GRID_RED,0xf0],[ObjectId.CLOUD_GRID_PURPLE,0xf1],[ObjectId.CLOUD_GRID_GREEN,0xf2],[ObjectId.KITE,0xf3],[ObjectId.WHIRLWIND,0xf4],[ObjectId.LANDING,0xf5],[ObjectId.GOLDEN_CARROT,0xf6],[ObjectId.BEAVER_BODY,0xf7],[ObjectId.BONUS_COIN,0xf8],
  [ObjectId.FENCE_1,0xf9],[ObjectId.FENCE_2,0xfa],[ObjectId.FENCE_3,0xfb],[ObjectId.FENCE_4,0xfc],[ObjectId.FENCE_5,0xfd],[ObjectId.FENCE_6,0xfe],[ObjectId.EMPTY,0xff]
]);

function sourceForTerrain(id: TerrainType): TileSourceMetadata | undefined {
  const known = TERRAIN_DAT.get(id);
  if (known !== undefined) return original(known);
  const walkable = /^walkable-variant-(\d{2})$/.exec(id);
  if (walkable) return inferredOriginal(0x60 + Number(walkable[1]) - 1);
  const background = /^background-variant-(\d{3})$/.exec(id);
  if (background) return inferredOriginal(Number(background[1]) - 1);
  return undefined;
}
function sourceForObject(id: ObjectType): TileSourceMetadata | undefined {
  const known = OBJECT_DAT.get(id);
  if (known !== undefined) return original(known);
  const variant = /^object-variant-(\d{3})$/.exec(id);
  return variant ? inferredOriginal(Number(variant[1]) - 1) : undefined;
}

function terrain(definition: TileDefinition<TerrainType>): void { terrainDefinitions.set(definition.id, definition); }
function object(definition: TileDefinition<ObjectType>): void { objectDefinitions.set(definition.id, definition); }
function terrainDef(id: TerrainType, category: string, traits: TileTrait[], behaviors: TileBehavior[]): void {
  const source = sourceForTerrain(id);
  terrain({ id, presentation: { name: pretty(id), category }, traits, behaviors, ...(source ? { source } : {}) });
}
function objectDef(id: ObjectType, category: string, traits: TileTrait[], behaviors: TileBehavior[]): void {
  const source = sourceForObject(id);
  object({ id, presentation: { name: pretty(id), category }, traits, behaviors, ...(source ? { source } : {}) });
}

for (const id of Object.values(Terrain) as TerrainType[]) {
  const water = isWaterTerrainType(id);
  const walkable = isOrdinaryWalkableTerrainType(id);
  terrainDef(id, water ? 'water' : walkable ? 'terrain' : 'background', [...(walkable ? ['walkable' as TileTrait] : []), ...(water ? ['water' as TileTrait] : [])], [
    markerBehavior(walkable ? 'ordinary-walkable' : water ? 'water-background' : 'background', walkable ? '使用普通步行规则' : water ? '水面默认不能直接步行' : '背景/边界默认不能直接步行')
  ]);
}
for (const id of Object.values(ObjectId) as ObjectType[]) {
  objectDef(id, DYNAMIC_OBJECT_IDS.has(id) ? 'dynamic-object' : 'object', DYNAMIC_OBJECT_IDS.has(id) ? ['dynamic'] : [], [markerBehavior('static-object', '无额外运行时行为')]);
}

function toggleSpeed(id: TerrainType): TerrainType {
  if (id === Terrain.SPEED_UP) return Terrain.SPEED_DOWN; if (id === Terrain.SPEED_DOWN) return Terrain.SPEED_UP;
  if (id === Terrain.SPEED_LEFT) return Terrain.SPEED_RIGHT; if (id === Terrain.SPEED_RIGHT) return Terrain.SPEED_LEFT;
  if (id === Terrain.SPEED_SWITCH_PRESSED) return Terrain.SPEED_SWITCH_RAISED; if (id === Terrain.SPEED_SWITCH_RAISED) return Terrain.SPEED_SWITCH_PRESSED;
  return id;
}
function toggleTide(id: TerrainType): TerrainType {
  if (id === Terrain.TIDE_UP) return Terrain.TIDE_DOWN; if (id === Terrain.TIDE_DOWN) return Terrain.TIDE_UP;
  if (id === Terrain.TIDE_LEFT) return Terrain.TIDE_RIGHT; if (id === Terrain.TIDE_RIGHT) return Terrain.TIDE_LEFT;
  if (id === Terrain.TIDE_SWITCH_RAISED) return Terrain.TIDE_SWITCH_PRESSED; if (id === Terrain.TIDE_SWITCH_PRESSED) return Terrain.TIDE_SWITCH_RAISED;
  return id;
}
function toggleColor(id: TerrainType, color: 'yellow' | 'pink'): TerrainType {
  if (color === 'yellow') {
    if (id === Terrain.COLOR_YELLOW_SWITCH_RAISED) return Terrain.COLOR_YELLOW_SWITCH_PRESSED;
    if (id === Terrain.COLOR_YELLOW_SWITCH_PRESSED) return Terrain.COLOR_YELLOW_SWITCH_RAISED;
    if (id === Terrain.COLOR_YELLOW_BLOCK_RAISED) return Terrain.COLOR_YELLOW_BLOCK_LOWERED;
    if (id === Terrain.COLOR_YELLOW_BLOCK_LOWERED) return Terrain.COLOR_YELLOW_BLOCK_RAISED;
  } else {
    if (id === Terrain.COLOR_PINK_SWITCH_RAISED) return Terrain.COLOR_PINK_SWITCH_PRESSED;
    if (id === Terrain.COLOR_PINK_SWITCH_PRESSED) return Terrain.COLOR_PINK_SWITCH_RAISED;
    if (id === Terrain.COLOR_PINK_BLOCK_RAISED) return Terrain.COLOR_PINK_BLOCK_LOWERED;
    if (id === Terrain.COLOR_PINK_BLOCK_LOWERED) return Terrain.COLOR_PINK_BLOCK_RAISED;
  }
  return id;
}
const CAROUSEL_NEXT = new Map<TerrainType, TerrainType>([
  [Terrain.CAROUSEL_1,Terrain.CAROUSEL_4],[Terrain.CAROUSEL_2,Terrain.CAROUSEL_1],[Terrain.CAROUSEL_3,Terrain.CAROUSEL_2],[Terrain.CAROUSEL_4,Terrain.CAROUSEL_3],
  [Terrain.CAROUSEL_VERTICAL,Terrain.CAROUSEL_HORIZONTAL],[Terrain.CAROUSEL_HORIZONTAL,Terrain.CAROUSEL_VERTICAL]
]);
function rotateCarousel(id: TerrainType): TerrainType { return CAROUSEL_NEXT.get(id) ?? id; }

function defineCarousel(id: TerrainType, next: TerrainType, enter: Direction[], leave: Direction[]): void {
  terrainDef(id, 'movement', ['walkable','carousel','directional-passage','rotatable'], [directionalPassage({ enter, leave }), rotateOnLeave(next)]);
}
defineCarousel(Terrain.CAROUSEL_1,Terrain.CAROUSEL_4,['left','down'],['right','up']);
defineCarousel(Terrain.CAROUSEL_2,Terrain.CAROUSEL_1,['right','down'],['left','up']);
defineCarousel(Terrain.CAROUSEL_3,Terrain.CAROUSEL_2,['right','up'],['left','down']);
defineCarousel(Terrain.CAROUSEL_4,Terrain.CAROUSEL_3,['left','up'],['right','down']);
defineCarousel(Terrain.CAROUSEL_VERTICAL,Terrain.CAROUSEL_HORIZONTAL,['up','down'],['up','down']);
defineCarousel(Terrain.CAROUSEL_HORIZONTAL,Terrain.CAROUSEL_VERTICAL,['left','right'],['left','right']);

for (const [id,next] of [[Terrain.MIRROR_1,Terrain.MIRROR_2],[Terrain.MIRROR_2,Terrain.MIRROR_4],[Terrain.MIRROR_3,Terrain.MIRROR_1],[Terrain.MIRROR_4,Terrain.MIRROR_3]] as Array<[TerrainType,TerrainType]>) {
  terrainDef(id,'movement',['walkable','mirror','rotatable'],[
    passageBehavior('mower-blocked','割草机不能驶过魔法镜',(ctx)=>ctx.state.ridingMower?{passable:false,reason:'割草机不能驶过魔法镜',confidence:'confirmed'}:undefined),
    rotateOnLeave(next)
  ]);
}

terrainDef(Terrain.SNOW,'terrain',['terrain-passage-override'],[
  passageBehavior('requires-shovel','需要雪铲清除；割草机不能铲雪',(ctx)=>{
    if(ctx.state.ridingMower)return{passable:false,reason:'割草机不能铲雪',confidence:'inferred'};
    return ctx.state.inventory.shovel?{passable:true,clearsSnow:true,reason:'雪铲清除雪堆',confidence:'confirmed'}:{passable:false,reason:'需要雪铲',confidence:'confirmed'};
  })
]);
for(const id of [Terrain.WATER,Terrain.WATER_ANIMATED,Terrain.TIDE_UP,Terrain.TIDE_DOWN,Terrain.TIDE_LEFT,Terrain.TIDE_RIGHT,Terrain.WATER_VARIANT_1,Terrain.WATER_VARIANT_2,Terrain.WATER_VARIANT_3]){
  terrainDef(id,'water',['water'],[markerBehavior('requires-overlay','普通步行需要荷叶、木板或藤蔓等覆盖对象')]);
}
for(const id of [Terrain.COLOR_YELLOW_BLOCK_RAISED,Terrain.COLOR_PINK_BLOCK_RAISED]){
  terrainDef(id,'switch',['terrain-passage-override','blocking'],[passageBehavior('raised-block','升起状态阻挡 Bobby',()=>({passable:false,reason:'彩色方块当前处于升起状态',confidence:'confirmed'}))]);
}
for(const id of [Terrain.COLOR_YELLOW_BLOCK_LOWERED,Terrain.COLOR_PINK_BLOCK_LOWERED]) terrainDef(id,'switch',['walkable'],[markerBehavior('lowered-block','降下状态可通行')]);
for(const id of [Terrain.HIGH_GRASS,Terrain.HIGH_GRASS_OBJECTIVE]){
  terrainDef(id,'mower',['terrain-passage-override'],[
    passageBehavior('requires-mower','只有驾驶割草机才能通过',(ctx)=>ctx.state.ridingMower?{passable:true,reason:'割草机可以通过高草',confidence:'confirmed'}:{passable:false,reason:'高草必须使用割草机通过',confidence:'confirmed'}),
    enterBehavior('mow-on-enter',id===Terrain.HIGH_GRASS_OBJECTIVE?'割开高草并揭示隐藏目标':'割开高草',(ctx)=>{
      if(ctx.mode!=='normal')return;
      const hidden=ctx.terrainId===Terrain.HIGH_GRASS_OBJECTIVE;
      ctx.api.setTerrain(ctx.api.mowedGround());
      if(hidden&&ctx.objectId===EMPTY_OBJECT)ctx.api.setObject(ctx.state.objectiveMode==='carrot'?ObjectId.CARROT:ObjectId.EGG_NEST_EMPTY);
      ctx.api.event('mow',hidden?'割开高草，发现目标':'割开高草');
      return {stop:true};
    })
  ]);
}

terrainDef(Terrain.SHOVEL_PICKUP,'pickup',['walkable','pickup'],[enterBehavior('collect-shovel','取得雪铲并把地形变为清理后的地面',(ctx)=>{
  if(ctx.mode!=='normal')return; ctx.state.inventory.shovel=true; ctx.api.setTerrain(Terrain.SHOVEL_CLEARED_GROUND); ctx.api.event('collect-shovel','取得雪铲');
})]);
terrainDef(Terrain.TRAP_INACTIVE,'hazard',['walkable','hazard'],[leaveBehavior('activate-on-leave','离开后变为激活陷阱',(ctx)=>{ctx.api.setTerrain(Terrain.TRAP_ACTIVE);})]);
terrainDef(Terrain.TRAP_ACTIVE,'hazard',['walkable','hazard'],[enterBehavior('kill-on-enter','步行踩入会死亡；割草机免疫',(ctx)=>{if(ctx.mode==='normal'&&!ctx.state.ridingMower)ctx.api.kill('踩中了已经激活的陷阱');})]);
terrainDef(Terrain.CAROUSEL_SWITCH_RAISED,'switch',['walkable','switch'],[enterBehavior('rotate-all-carousel','旋转全部 Carousel 并按下开关',(ctx)=>{
  if(ctx.mode!=='normal')return; ctx.api.mapTerrain((type)=>CAROUSEL_NEXT.has(type)?rotateCarousel(type):type===Terrain.CAROUSEL_SWITCH_RAISED?Terrain.CAROUSEL_SWITCH_PRESSED:type===Terrain.CAROUSEL_SWITCH_PRESSED?Terrain.CAROUSEL_SWITCH_RAISED:type); ctx.api.event('toggle-switch','旋转全部 Carousel 地板');
})]);
terrainDef(Terrain.CAROUSEL_SWITCH_PRESSED,'switch',['walkable','switch'],[markerBehavior('pressed-switch','已按下；不会再次触发')]);
terrainDef(Terrain.SPEED_SWITCH_RAISED,'switch',['walkable','switch'],[enterBehavior('toggle-speed','反转全部加速方向',(ctx)=>{if(ctx.mode==='normal'){ctx.api.mapTerrain(toggleSpeed);ctx.api.event('toggle-switch','反转全部加速方向');}})]);
terrainDef(Terrain.SPEED_SWITCH_PRESSED,'switch',['walkable','switch'],[markerBehavior('pressed-switch','已按下；不会再次触发')]);
terrainDef(Terrain.TIDE_SWITCH_RAISED,'switch',['walkable','switch'],[enterBehavior('toggle-tide','反转全部潮汐方向',(ctx)=>{if(ctx.mode==='normal'){ctx.api.mapTerrain(toggleTide);ctx.api.event('toggle-switch','反转潮汐方向');}})]);
terrainDef(Terrain.TIDE_SWITCH_PRESSED,'switch',['walkable','switch'],[markerBehavior('pressed-switch','已按下；不会再次触发')]);
terrainDef(Terrain.COLOR_YELLOW_SWITCH_RAISED,'switch',['walkable','switch'],[enterBehavior('toggle-yellow','切换黄色开关与方块',(ctx)=>{if(ctx.mode==='normal'){ctx.api.mapTerrain((t)=>toggleColor(t,'yellow'));ctx.api.event('toggle-switch','切换黄色机关');}})]);
terrainDef(Terrain.COLOR_YELLOW_SWITCH_PRESSED,'switch',['walkable','switch'],[markerBehavior('pressed-switch','已按下；不会再次触发')]);
terrainDef(Terrain.COLOR_PINK_SWITCH_RAISED,'switch',['walkable','switch'],[enterBehavior('toggle-pink','切换粉色开关与方块',(ctx)=>{if(ctx.mode==='normal'){ctx.api.mapTerrain((t)=>toggleColor(t,'pink'));ctx.api.event('toggle-switch','切换粉色机关');}})]);
terrainDef(Terrain.COLOR_PINK_SWITCH_PRESSED,'switch',['walkable','switch'],[markerBehavior('pressed-switch','已按下；不会再次触发')]);

const windSwitches:Array<[TerrainType,number]>=[[Terrain.WIND_SWITCH_0_ON,0],[Terrain.WIND_SWITCH_0_OFF,0],[Terrain.WIND_SWITCH_1_ON,1],[Terrain.WIND_SWITCH_1_OFF,1],[Terrain.WIND_SWITCH_2_ON,2],[Terrain.WIND_SWITCH_2_OFF,2],[Terrain.WIND_SWITCH_3_ON,3],[Terrain.WIND_SWITCH_3_OFF,3]];
for(const [id,index] of windSwitches) terrainDef(id,'switch',['walkable','switch'],[enterBehavior('toggle-wind','切换对应风车并推动云',(ctx)=>{if(ctx.mode==='normal'){ctx.api.toggleWind(index);ctx.api.event('toggle-switch',`切换风车 ${index+1}`);ctx.api.propelClouds();}},{index})]);

for(const [id,direction] of SPEED_TERRAIN_DIRECTION) terrainDef(id,'movement',['walkable','forced-movement'],[enterBehavior('force-speed','进入后按格子方向高速移动',(ctx)=>{if(ctx.mode==='normal')ctx.state.forced={kind:'speed',direction};},{direction})]);
terrainDef(Terrain.ICE,'movement',['walkable','forced-movement'],[enterBehavior('force-ice','沿进入方向继续滑行',(ctx)=>{if(ctx.mode==='normal')ctx.state.forced={kind:'ice',direction:ctx.direction};})]);
terrainDef(Terrain.MOWER_PARKING,'vehicle',['walkable'],[enterBehavior('leave-mower','驾驶割草机进入停车位后自动下车',(ctx)=>{
  if(ctx.mode==='normal'&&ctx.state.ridingMower&&!ctx.justBoarded){ctx.api.setObject(ObjectId.MOWER);ctx.state.ridingMower=false;ctx.state.forced={kind:'mower-exit',direction:'right'};ctx.api.event('leave-mower','在停车位自动下车');}
})]);
terrainDef(Terrain.EXIT,'objective',['walkable','exit'],[enterBehavior('complete-level','主要目标清空后进入出口完成关卡',(ctx)=>{
  if(ctx.mode==='normal'&&!ctx.state.ridingMower&&ctx.state.objectiveRemaining===0){ctx.state.completed=true;ctx.state.forced=null;ctx.api.event('complete','关卡完成');}
})]);

const overlayObjects:Array<[ObjectType,string]>=[[ObjectId.PLANK,'Plank'],[ObjectId.BEANSTALK_TIP,'Beanstalk Tip'],[ObjectId.BEANSTALK_MID,'Beanstalk Mid'],[ObjectId.BEANSTALK_BASE,'Beanstalk Base']];
for(const [id,name] of overlayObjects)object({id,presentation:{name,category:'overlay'},traits:['terrain-overlay'],behaviors:[markerBehavior('terrain-passage-overlay','覆盖底层不可步行地形并提供通路'),...(id===ObjectId.PLANK?[leaveBehavior('crumble-on-leave','离开木板后进入坍塌阶段',(ctx)=>{ctx.api.setObject(ObjectId.PLANK_CRUMBLING);ctx.state.previousCrumblingPlank={x:ctx.x,y:ctx.y};})]:[])],source:sourceForObject(id)!});

objectDef(ObjectId.LOCK,'gate',['object-passage-override'],[passageBehavior('requires-key','需要 Beaver Key 或 Super Key',(ctx)=>ctx.state.profile.superKey||ctx.state.profile.temporaryKey?{passable:true,consumesLock:true,reason:ctx.state.profile.superKey?'Super Key 打开锁':'一次性 Beaver Key 打开锁',confidence:'confirmed'}:{passable:false,reason:'需要 Beaver 的钥匙或 Super Key',confidence:'confirmed'})]);
objectDef(ObjectId.MOWER,'vehicle',['object-passage-override'],[passageBehavior('board-mower','取得汽油后可登上割草机',(ctx)=>{if(ctx.state.ridingMower)return{passable:false,reason:'已经在驾驶割草机',confidence:'inferred'};return ctx.state.inventory.gas?{passable:true,boardsMower:true,reason:'登上已加油的割草机',confidence:'confirmed'}:{passable:false,reason:'割草机需要先取得汽油',confidence:'confirmed'};})]);
objectDef(ObjectId.WHIRLWIND,'flight',['object-passage-override'],[passageBehavior('requires-kite','取得风筝后进入飞行状态',(ctx)=>{if(ctx.state.ridingMower)return{passable:false,reason:'割草机不能进入龙卷风',confidence:'confirmed'};return ctx.state.inventory.kite?{passable:true,startsFlight:true,reason:'风筝被龙卷风带起',confidence:'confirmed'}:{passable:false,reason:'需要风筝才能进入龙卷风',confidence:'confirmed'};})]);
objectDef(ObjectId.CRUMBLY_ROCK,'mower',['object-passage-override'],[
  passageBehavior('break-by-fast-mower','高速割草机可以撞碎',(ctx)=>ctx.state.ridingMower&&ctx.state.forced?.kind==='speed'?{passable:true,reason:'高速割草机撞碎岩石',confidence:'confirmed'}:{passable:false,reason:'岩石需要高速割草机撞碎',confidence:'confirmed'}),
  enterBehavior('break-on-enter','高速割草机进入后移除岩石',(ctx)=>{if(ctx.mode==='normal'&&ctx.state.ridingMower&&ctx.state.forced?.kind==='speed'){ctx.api.setObject(EMPTY_OBJECT);ctx.api.event('break-rock','高速割草机撞碎岩石');}})
]);

objectDef(ObjectId.CARROT,'collectible',['collectible'],[enterBehavior('collect-carrot','收集主要目标胡萝卜',(ctx)=>{if(ctx.mode==='normal'){ctx.state.objectiveRemaining=Math.max(0,ctx.state.objectiveRemaining-1);ctx.api.setObject(ObjectId.CONSUMED_CARROT);ctx.api.event('collect-carrot','收集胡萝卜');}})]);
objectDef(ObjectId.EGG_NEST_EMPTY,'objective',['collectible'],[leaveBehavior('fill-nest-on-leave','离开空蛋巢时完成该目标',(ctx)=>{ctx.api.setObject(ObjectId.EGG_NEST_FILLED);ctx.state.objectiveRemaining=Math.max(0,ctx.state.objectiveRemaining-1);ctx.api.event('fill-nest','填满一个彩蛋巢');})]);
objectDef(ObjectId.GAS,'pickup',['pickup'],[enterBehavior('collect-gas','取得割草机汽油',(ctx)=>{if(ctx.mode==='normal'){ctx.state.inventory.gas=true;ctx.api.setObject(EMPTY_OBJECT);ctx.api.event('collect-gas','取得割草机汽油，本关永久有效');}})]);
objectDef(ObjectId.KITE,'pickup',['pickup'],[enterBehavior('collect-kite','取得风筝',(ctx)=>{if(ctx.mode==='normal'){ctx.state.inventory.kite=true;ctx.api.setObject(EMPTY_OBJECT);ctx.api.event('collect-kite','取得风筝');}})]);
objectDef(ObjectId.BEAN,'pickup',['pickup'],[enterBehavior('collect-bean','取得魔豆',(ctx)=>{if(ctx.mode==='normal'){ctx.state.inventory.beans+=1;ctx.api.setObject(EMPTY_OBJECT);ctx.api.event('collect-bean','取得魔豆');}})]);
objectDef(ObjectId.BEAN_FIELD,'beanstalk',[],[enterBehavior('plant-bean','持有魔豆时种下并启动藤蔓生长',(ctx)=>{if(ctx.mode==='normal'&&ctx.state.inventory.beans>0){ctx.state.inventory.beans-=1;ctx.api.setObject(ObjectId.BEAN_SPROUT);ctx.state.beanstalkGrowth.push({x:ctx.x,baseY:ctx.y,stage:1,ticksUntilGrowth:16});ctx.api.event('plant-bean','种下魔豆，藤蔓开始生长');}})]);
objectDef(ObjectId.GOLDEN_CARROT,'collectible',['collectible'],[enterBehavior('collect-golden-carrot','取得金胡萝卜',(ctx)=>{ctx.state.goldenCarrotsInLevel+=1;ctx.api.setObject(EMPTY_OBJECT);ctx.api.event('collect-golden-carrot',ctx.mode==='flight'?'飞行中取得金胡萝卜':'取得金胡萝卜');})]);
objectDef(ObjectId.BONUS_COIN,'collectible',['collectible'],[enterBehavior('collect-bonus-coin','取得 Bonus Coin',(ctx)=>{ctx.state.bonusCoinsInLevel+=1;ctx.api.setObject(EMPTY_OBJECT);ctx.api.event('collect-bonus-coin',ctx.mode==='flight'?'飞行中取得 Bonus Coin':'取得 Bonus Coin');})]);
objectDef(ObjectId.DRAGON_TAIL,'dragon',[],[enterBehavior('trigger-dragon-fire','踩到龙尾触发喷火',(ctx)=>{if(ctx.mode==='normal')ctx.api.fireDragon();})]);
objectDef(ObjectId.LANDING,'flight',[],[enterBehavior('land-flight','飞行状态进入降落点后结束强制飞行',(ctx)=>{if(ctx.state.forced?.kind==='flight')ctx.state.forced=null;})]);

const blockingObjects:ObjectType[]=[ObjectId.EGG_NEST_FILLED,ObjectId.WINDMILL_UP,ObjectId.WINDMILL_DOWN,ObjectId.WINDMILL_LEFT,ObjectId.WINDMILL_RIGHT,ObjectId.PLANK_CRUMBLING,ObjectId.PLANK_FRAGMENT,ObjectId.DRAGON_HEAD_BASE,ObjectId.SANDMAN,ObjectId.DREAM_MACHINE,ObjectId.ICE_BLOCK,ObjectId.BEAVER_BASE,ObjectId.SANDMAN_BODY,ObjectId.DREAM_MACHINE_BODY,ObjectId.BEAVER_BODY,ObjectId.FENCE_1,ObjectId.FENCE_2,ObjectId.FENCE_3,ObjectId.FENCE_4,ObjectId.FENCE_5,ObjectId.FENCE_6];
for(const id of blockingObjects)objectDef(id,'blocking-object',['blocking'],[markerBehavior('blocks-passage','默认阻挡 Bobby 通过')]);
for(const id of [ObjectId.CLOUD_RED,ObjectId.CLOUD_PURPLE,ObjectId.CLOUD_GREEN,ObjectId.LEAF]){
  const current=objectDefinitions.get(id)!; object({...current,traits:[...new Set([...current.traits,'dynamic' as TileTrait])],behaviors:[markerBehavior('dynamic-entity','由 World 的动态实体系统更新位置')]});
}

function variantTerrainDefinition(id: TerrainType): TileDefinition<TerrainType> {
  const source=sourceForTerrain(id); const water=isWaterTerrainType(id); const walkable=isOrdinaryWalkableTerrainType(id);
  return {id,presentation:{name:pretty(id),category:walkable?'terrain-variant':'background-variant'},traits:[...(walkable?['walkable' as TileTrait]:[]),...(water?['water' as TileTrait]:[])],behaviors:[markerBehavior(walkable?'ordinary-walkable':'background','DAT 未命名语义变体；行为按已确认类别处理')],...(source?{source}:{})};
}
function variantObjectDefinition(id: ObjectType): TileDefinition<ObjectType> {
  const source=sourceForObject(id); return {id,presentation:{name:pretty(id),category:'object-variant'},traits:[],behaviors:[markerBehavior('unknown-object','DAT 未命名对象变体；没有附加已确认行为')],...(source?{source}:{})};
}

export function getTerrainDefinition(id: TerrainType): TileDefinition<TerrainType> {
  return terrainDefinitions.get(id)??variantTerrainDefinition(id);
}
export function getObjectDefinition(id: ObjectType): TileDefinition<ObjectType> {
  return objectDefinitions.get(id)??variantObjectDefinition(id);
}
export function terrainHasTrait(id: TerrainType,trait:TileTrait):boolean{return getTerrainDefinition(id).traits.includes(trait);}
export function objectHasTrait(id:ObjectType,trait:TileTrait):boolean{return getObjectDefinition(id).traits.includes(trait);}
export function nextTerrainAfterLeave(id:TerrainType):TerrainType{for(const behavior of getTerrainDefinition(id).behaviors){const next=behavior.nextTerrainOnLeave?.(id);if(next!==undefined)return next;}return id;}

export function runTerrainEnter(id:TerrainType,ctx:BehaviorRuntimeContext):boolean{for(const behavior of getTerrainDefinition(id).behaviors){if(behavior.onEnter?.(ctx)?.stop)return true;}return false;}
export function runTerrainLeave(id:TerrainType,ctx:BehaviorRuntimeContext):boolean{for(const behavior of getTerrainDefinition(id).behaviors){if(behavior.onLeave?.(ctx)?.stop)return true;}return false;}
export function runObjectEnter(id:ObjectType,ctx:BehaviorRuntimeContext):boolean{for(const behavior of getObjectDefinition(id).behaviors){if(behavior.onEnter?.(ctx)?.stop)return true;}return false;}
export function runObjectLeave(id:ObjectType,ctx:BehaviorRuntimeContext):boolean{for(const behavior of getObjectDefinition(id).behaviors){if(behavior.onLeave?.(ctx)?.stop)return true;}return false;}

function inspect<T extends string>(definition:TileDefinition<T>):TileDefinitionInspection{return{id:definition.id,presentation:definition.presentation,traits:definition.traits,behaviors:definition.behaviors.map((behavior)=>behavior.describe()),...(definition.source?{source:definition.source}:{})};}
export function inspectTerrainDefinition(id:TerrainType):TileDefinitionInspection{return inspect(getTerrainDefinition(id));}
export function inspectObjectDefinition(id:ObjectType):TileDefinitionInspection{return inspect(getObjectDefinition(id));}
