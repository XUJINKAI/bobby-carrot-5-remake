import fs from 'node:fs';

function edit(path, transform) {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`No change produced for ${path}`);
  fs.writeFileSync(path, after);
}
function once(text, from, to, label) {
  const i = text.indexOf(from);
  if (i < 0) throw new Error(`Missing ${label}`);
  return text.slice(0, i) + to + text.slice(i + from.length);
}

edit('engine/src/mechanics/definitions.ts', (text) => {
  text = once(text,
    "import { DYNAMIC_OBJECT_IDS, EMPTY_OBJECT, ObjectId, SPEED_TERRAIN_DIRECTION, Terrain, type Direction } from './ids.js';\nimport { isOrdinaryWalkableTerrainType, isWaterTerrainType } from './terrainTraits.js';",
    "import { EMPTY_OBJECT, ObjectId, Terrain, type Direction } from './ids.js';",
    'definition imports');
  text = once(text, "  directionalPassage,\n", "  directionalPassage,\n  fireReflectionBehavior,\n", 'fire behavior import');
  text = once(text, "  | 'pickup';", "  | 'pickup'\n  | 'beanstalk-growth'\n  | 'cloud-passable'\n  | 'dragon-fire-passable'\n  | 'dragon-fire-melt'\n  | 'dragon-fire-blocking'\n  | 'dragon-head'\n  | 'climbable'\n  | 'dynamic-cloud'\n  | 'dynamic-leaf'\n  | 'windmill'\n  | 'cloud-grid'\n  | 'start'\n  | 'objective-carrot'\n  | 'objective-nest'\n  | 'hidden-objective';", 'extra traits');
  const marker = "function terrain(definition: TileDefinition<TerrainType>): void { terrainDefinitions.set(definition.id, definition); }";
  const helpers = `const WATER_IDS = new Set<TerrainType>([Terrain.WATER,Terrain.WATER_ANIMATED,Terrain.TIDE_UP,Terrain.TIDE_DOWN,Terrain.TIDE_LEFT,Terrain.TIDE_RIGHT,Terrain.WATER_VARIANT_1,Terrain.WATER_VARIANT_2,Terrain.WATER_VARIANT_3]);\nconst DYNAMIC_IDS = new Set<ObjectType>([ObjectId.CLOUD_RED,ObjectId.CLOUD_PURPLE,ObjectId.CLOUD_GREEN,ObjectId.LEAF]);\nfunction isWaterSemantic(id:TerrainType):boolean{return WATER_IDS.has(id);}\nfunction isWalkableSemantic(id:TerrainType):boolean{if(id.startsWith('walkable-variant-'))return true;if(id.startsWith('background-variant-'))return false;if(isWaterSemantic(id)||id===Terrain.SNOW)return false;return true;}\nfunction environmentTraits(id:TerrainType):TileTrait[]{const out:TileTrait[]=[];if(isWalkableSemantic(id))out.push('walkable');if(isWaterSemantic(id))out.push('water');if(isWalkableSemantic(id)||isWaterSemantic(id)||id.startsWith('background-variant-'))out.push('cloud-passable');if((isWalkableSemantic(id)||isWaterSemantic(id)||id.startsWith('background-variant-'))&&id!==Terrain.COLOR_YELLOW_BLOCK_RAISED&&id!==Terrain.COLOR_PINK_BLOCK_RAISED)out.push('dragon-fire-passable');if(isWaterSemantic(id)||id.startsWith('background-variant-'))out.push('beanstalk-growth');return out;}\n\n${marker}`;
  text = once(text, marker, helpers, 'environment helpers');
  text = once(text,
    "  const source = sourceForTerrain(id);\n  terrain({ id, presentation: { name: pretty(id), category }, traits, behaviors, ...(source ? { source } : {}) });",
    "  const source = sourceForTerrain(id);\n  const merged = [...new Set([...environmentTraits(id), ...traits])];\n  terrain({ id, presentation: { name: pretty(id), category }, traits: merged, behaviors, ...(source ? { source } : {}) });",
    'terrain trait merge');
  text = once(text,
    "  const water = isWaterTerrainType(id);\n  const walkable = isOrdinaryWalkableTerrainType(id);",
    "  const water = isWaterSemantic(id);\n  const walkable = isWalkableSemantic(id);",
    'default terrain classifiers');
  text = once(text,
    "  objectDef(id, DYNAMIC_OBJECT_IDS.has(id) ? 'dynamic-object' : 'object', DYNAMIC_OBJECT_IDS.has(id) ? ['dynamic'] : [], [markerBehavior('static-object', '无额外运行时行为')]);",
    "  objectDef(id, DYNAMIC_IDS.has(id) ? 'dynamic-object' : 'object', DYNAMIC_IDS.has(id) ? ['dynamic'] : [], [markerBehavior('static-object', '无额外运行时行为')]);",
    'dynamic default classifier');
  text = once(text,
    "for (const [id,next] of [[Terrain.MIRROR_1,Terrain.MIRROR_2],[Terrain.MIRROR_2,Terrain.MIRROR_4],[Terrain.MIRROR_3,Terrain.MIRROR_1],[Terrain.MIRROR_4,Terrain.MIRROR_3]] as Array<[TerrainType,TerrainType]>) {\n  terrainDef(id,'movement',['walkable','mirror','rotatable'],[\n    passageBehavior('mower-blocked','割草机不能驶过魔法镜',(ctx)=>ctx.state.ridingMower?{passable:false,reason:'割草机不能驶过魔法镜',confidence:'confirmed'}:undefined),\n    rotateOnLeave(next)\n  ]);\n}",
    "const mirrorDefs:Array<[TerrainType,TerrainType,Partial<Record<Direction,Direction>>]>=[[Terrain.MIRROR_1,Terrain.MIRROR_2,{left:'down',up:'right'}],[Terrain.MIRROR_2,Terrain.MIRROR_4,{right:'down',up:'left'}],[Terrain.MIRROR_3,Terrain.MIRROR_1,{left:'up',down:'right'}],[Terrain.MIRROR_4,Terrain.MIRROR_3,{right:'up',down:'left'}]];\nfor (const [id,next,reflections] of mirrorDefs) {\n  terrainDef(id,'movement',['walkable','mirror','rotatable'],[\n    passageBehavior('mower-blocked','割草机不能驶过魔法镜',(ctx)=>ctx.state.ridingMower?{passable:false,reason:'割草机不能驶过魔法镜',confidence:'confirmed'}:undefined),\n    fireReflectionBehavior('reflect-dragon-fire',reflections),\n    rotateOnLeave(next)\n  ]);\n}",
    'mirror definitions');
  text = once(text,
    "for(const [id,direction] of SPEED_TERRAIN_DIRECTION) terrainDef(id,'movement',['walkable','forced-movement'],[enterBehavior('force-speed','进入后按格子方向高速移动',(ctx)=>{if(ctx.mode==='normal')ctx.state.forced={kind:'speed',direction};},{direction})]);",
    "const speedDirections:Array<[TerrainType,Direction]>=[[Terrain.SPEED_LEFT,'left'],[Terrain.SPEED_RIGHT,'right'],[Terrain.SPEED_UP,'up'],[Terrain.SPEED_DOWN,'down']];\nfor(const [id,direction] of speedDirections) terrainDef(id,'movement',['walkable','forced-movement'],[enterBehavior('force-speed','进入后按格子方向高速移动',(ctx)=>{if(ctx.mode==='normal')ctx.state.forced={kind:'speed',direction};},{direction})]);",
    'speed registry');
  text = once(text, "objectDef(ObjectId.CRUMBLY_ROCK,'mower',['object-passage-override'],[", "objectDef(ObjectId.CRUMBLY_ROCK,'mower',['object-passage-override','dragon-fire-blocking'],[", 'rock fire trait');
  text = once(text, "objectDef(ObjectId.CARROT,'collectible',['collectible'],[", "objectDef(ObjectId.CARROT,'collectible',['collectible','objective-carrot'],[", 'carrot objective trait');
  text = once(text, "objectDef(ObjectId.EGG_NEST_EMPTY,'objective',['collectible'],[", "objectDef(ObjectId.EGG_NEST_EMPTY,'objective',['collectible','objective-nest'],[", 'nest objective trait');
  text = once(text,
    "for(const id of [ObjectId.CLOUD_RED,ObjectId.CLOUD_PURPLE,ObjectId.CLOUD_GREEN,ObjectId.LEAF]){\n  const current=objectDefinitions.get(id)!; object({...current,traits:[...new Set([...current.traits,'dynamic' as TileTrait])],behaviors:[markerBehavior('dynamic-entity','由 World 的动态实体系统更新位置')]});\n}",
    `const cloudInfo:Array<[ObjectType,ObjectType]>=[[ObjectId.CLOUD_RED,ObjectId.CLOUD_GRID_RED],[ObjectId.CLOUD_PURPLE,ObjectId.CLOUD_GRID_PURPLE],[ObjectId.CLOUD_GREEN,ObjectId.CLOUD_GRID_GREEN]];\nfor(const [id] of cloudInfo){const current=objectDefinitions.get(id)!;object({...current,traits:[...new Set([...current.traits,'dynamic','dynamic-cloud'] as TileTrait[])],behaviors:[markerBehavior('dynamic-cloud','由 World 动态实体系统按风场移动')]});}\n{const current=objectDefinitions.get(ObjectId.LEAF)!;object({...current,traits:[...new Set([...current.traits,'dynamic','dynamic-leaf'] as TileTrait[])],behaviors:[markerBehavior('dynamic-leaf','由 World 动态实体系统按水流/玩家方向漂流')]});}\nfor(const id of [ObjectId.BEANSTALK_TIP,ObjectId.BEANSTALK_MID,ObjectId.BEANSTALK_BASE]){const current=objectDefinitions.get(id)!;object({...current,traits:[...new Set([...current.traits,'climbable'] as TileTrait[])]});}\nfor(const id of [ObjectId.CLOUD_GRID_RED,ObjectId.CLOUD_GRID_PURPLE,ObjectId.CLOUD_GRID_GREEN]){const current=objectDefinitions.get(id)!;object({...current,traits:[...new Set([...current.traits,'cloud-grid'] as TileTrait[])]});}\nfor(const id of [ObjectId.DRAGON_HEAD_BASE,ObjectId.DRAGON_BODY]){const current=objectDefinitions.get(id)!;object({...current,traits:[...new Set([...current.traits,'dragon-fire-blocking',...(id===ObjectId.DRAGON_HEAD_BASE?['dragon-head' as TileTrait]:[])] as TileTrait[])]});}\n{const current=objectDefinitions.get(ObjectId.ICE_BLOCK)!;object({...current,traits:[...new Set([...current.traits,'dragon-fire-melt'] as TileTrait[])]});}\nterrainDef(Terrain.START,'marker',['start'],[markerBehavior('start-position','Bobby 的出生点')]);\nterrainDef(Terrain.HIGH_GRASS_OBJECTIVE,'mower',['terrain-passage-override','hidden-objective'],getTerrainDefinition(Terrain.HIGH_GRASS_OBJECTIVE).behaviors as TileBehavior[]);\nfor(const [id] of [[ObjectId.WINDMILL_UP,'up'],[ObjectId.WINDMILL_DOWN,'down'],[ObjectId.WINDMILL_LEFT,'left'],[ObjectId.WINDMILL_RIGHT,'right']] as Array<[ObjectType,Direction]>){const current=objectDefinitions.get(id)!;object({...current,traits:[...new Set([...current.traits,'windmill'] as TileTrait[])]});}`,
    'dynamic and semantic traits');
  text = once(text, "  const source=sourceForTerrain(id); const water=isWaterTerrainType(id); const walkable=isOrdinaryWalkableTerrainType(id);", "  const source=sourceForTerrain(id); const water=isWaterSemantic(id); const walkable=isWalkableSemantic(id);", 'variant classifier');
  const exportsMarker = "export function getTerrainDefinition(id: TerrainType): TileDefinition<TerrainType> {";
  const queryHelpers = `const TIDE_DIRECTION = new Map<TerrainType,Direction>([[Terrain.TIDE_UP,'up'],[Terrain.TIDE_DOWN,'down'],[Terrain.TIDE_LEFT,'left'],[Terrain.TIDE_RIGHT,'right']]);\nconst WINDMILL_INFO = new Map<ObjectType,{index:number;direction:Direction}>([[ObjectId.WINDMILL_UP,{index:0,direction:'up'}],[ObjectId.WINDMILL_DOWN,{index:1,direction:'down'}],[ObjectId.WINDMILL_LEFT,{index:2,direction:'left'}],[ObjectId.WINDMILL_RIGHT,{index:3,direction:'right'}]]);\nconst WIND_SWITCH_INDEX = new Map<TerrainType,number>([[Terrain.WIND_SWITCH_0_ON,0],[Terrain.WIND_SWITCH_0_OFF,0],[Terrain.WIND_SWITCH_1_ON,1],[Terrain.WIND_SWITCH_1_OFF,1],[Terrain.WIND_SWITCH_2_ON,2],[Terrain.WIND_SWITCH_2_OFF,2],[Terrain.WIND_SWITCH_3_ON,3],[Terrain.WIND_SWITCH_3_OFF,3]]);\nconst WIND_SWITCH_PEER = new Map<TerrainType,TerrainType>([[Terrain.WIND_SWITCH_0_ON,Terrain.WIND_SWITCH_0_OFF],[Terrain.WIND_SWITCH_0_OFF,Terrain.WIND_SWITCH_0_ON],[Terrain.WIND_SWITCH_1_ON,Terrain.WIND_SWITCH_1_OFF],[Terrain.WIND_SWITCH_1_OFF,Terrain.WIND_SWITCH_1_ON],[Terrain.WIND_SWITCH_2_ON,Terrain.WIND_SWITCH_2_OFF],[Terrain.WIND_SWITCH_2_OFF,Terrain.WIND_SWITCH_2_ON],[Terrain.WIND_SWITCH_3_ON,Terrain.WIND_SWITCH_3_OFF],[Terrain.WIND_SWITCH_3_OFF,Terrain.WIND_SWITCH_3_ON]]);\nconst CLOUD_GRID = new Map<ObjectType,ObjectType>(cloudInfo);\nconst FOOTPRINT = new Map<ObjectType,Array<{dx:number;dy:number;type:ObjectType}>>([[ObjectId.DRAGON_HEAD_BASE,[{dx:1,dy:0,type:ObjectId.DRAGON_BODY},{dx:2,dy:0,type:ObjectId.DRAGON_TAIL}]],[ObjectId.SANDMAN,[{dx:0,dy:1,type:ObjectId.SANDMAN_BODY}]],[ObjectId.DREAM_MACHINE,[{dx:0,dy:1,type:ObjectId.DREAM_MACHINE_BODY}]],[ObjectId.BEAVER_BASE,[{dx:0,dy:1,type:ObjectId.BEAVER_BODY}]]]);\nexport function tideDirectionForTerrain(id:TerrainType):Direction|undefined{return TIDE_DIRECTION.get(id);}\nexport function windmillInfoForObject(id:ObjectType):{index:number;direction:Direction}|undefined{return WINDMILL_INFO.get(id);}\nexport function windSwitchIndexForTerrain(id:TerrainType):number|undefined{return WIND_SWITCH_INDEX.get(id);}\nexport function windSwitchPeerForTerrain(id:TerrainType):TerrainType|undefined{return WIND_SWITCH_PEER.get(id);}\nexport function cloudGridForObject(id:ObjectType):ObjectType|undefined{return CLOUD_GRID.get(id);}\nexport function initialObjectFootprint(id:ObjectType):readonly {dx:number;dy:number;type:ObjectType}[]{return FOOTPRINT.get(id)??[];}\nexport function reflectFireForTerrain(id:TerrainType,direction:Direction):Direction|null|false{for(const behavior of getTerrainDefinition(id).behaviors){if(behavior.reflectFire)return behavior.reflectFire(direction);}return null;}\n\n${exportsMarker}`;
  text = once(text, exportsMarker, queryHelpers, 'registry query helpers');
  return text;
});

edit('engine/src/mechanics/rules.ts', (text) => {
  text = text.replace("import { isOrdinaryWalkableTerrainType, isWaterTerrainType } from './terrainTraits.js';\n", '');
  text = once(text, "export function isWaterTerrain(id: TerrainType): boolean { return isWaterTerrainType(id); }", "export function isWaterTerrain(id: TerrainType): boolean { return terrainHasTrait(id, 'water'); }", 'water wrapper');
  text = once(text, "export function isOrdinaryWalkableTerrain(id: TerrainType): boolean { return isOrdinaryWalkableTerrainType(id); }", "export function isOrdinaryWalkableTerrain(id: TerrainType): boolean { return terrainHasTrait(id, 'walkable'); }", 'walkable wrapper');
  return text;
});

edit('engine/src/mechanics/terrainTraits.ts', () => `import type { TerrainType } from '../data/types.js';\nimport { terrainHasTrait } from './definitions.js';\n\n/** Compatibility query wrappers. Definition Registry is the single source of truth. */\nexport function isWaterTerrainType(type:TerrainType):boolean{return terrainHasTrait(type,'water');}\nexport function isOrdinaryWalkableTerrainType(type:TerrainType):boolean{return terrainHasTrait(type,'walkable');}\nexport function allowsBeanstalkGrowth(type:TerrainType):boolean{return terrainHasTrait(type,'beanstalk-growth');}\nexport function isCloudPassableBackground(type:TerrainType):boolean{return terrainHasTrait(type,'cloud-passable');}\nexport function isDragonFireBackground(type:TerrainType):boolean{return terrainHasTrait(type,'dragon-fire-passable');}\n`);

edit('engine/src/world/World.ts', (text) => {
  text = text.replace("  CLOUD_GRID_FOR_OBJECT,\n  CLOUD_OBJECT_IDS,\n", '');
  text = text.replace("  DYNAMIC_OBJECT_IDS,\n", '');
  text = text.replace("  TIDE_TERRAIN_DIRECTION,\n", '');
  text = text.replace("  WINDMILL_DIRECTION,\n", '');
  text = once(text, "  inspectObjectDefinition,\n  inspectTerrainDefinition,", "  cloudGridForObject,\n  initialObjectFootprint,\n  inspectObjectDefinition,\n  inspectTerrainDefinition,\n  objectHasTrait,\n  reflectFireForTerrain,", 'world registry imports 1');
  text = once(text, "  terrainHasTrait,\n  type TileDefinitionInspection", "  terrainHasTrait,\n  tideDirectionForTerrain,\n  windmillInfoForObject,\n  windSwitchIndexForTerrain,\n  windSwitchPeerForTerrain,\n  type TileDefinitionInspection", 'world registry imports 2');
  text = text.replace(/import \{\n  allowsBeanstalkGrowth,\n  isCloudPassableBackground,\n  isDragonFireBackground\n\} from '\.\.\/mechanics\/terrainTraits\.js';\n/, '');
  text = once(text, "    return type === ObjectId.BEANSTALK_TIP || type === ObjectId.BEANSTALK_MID || type === ObjectId.BEANSTALK_BASE;", "    return objectHasTrait(type, 'climbable');", 'climbing trait');
  text = text.replace("if (ridden?.type === ObjectId.LEAF)", "if (ridden && objectHasTrait(ridden.type, 'dynamic-leaf'))");
  text = text.replace("if (ridden && CLOUD_OBJECT_IDS.has(ridden.type))", "if (ridden && objectHasTrait(ridden.type, 'dynamic-cloud'))");
  text = text.replace("const tideDirection = underlyingTerrain ? TIDE_TERRAIN_DIRECTION.get(underlyingTerrain) : undefined;", "const tideDirection = underlyingTerrain ? tideDirectionForTerrain(underlyingTerrain) : undefined;");
  text = once(text, "        if (terrain[y]?.[x] === Terrain.START) start = { x, y };", "        if (terrain[y]?.[x] && terrainHasTrait(terrain[y]![x]!, 'start')) start = { x, y };", 'start trait');
  text = once(text, "      if (DYNAMIC_OBJECT_IDS.has(type)) {", "      if (objectHasTrait(type, 'dynamic')) {", 'dynamic trait');
  const footprintsOld = `      objects[y]![x] = type;\n      if (type === ObjectId.DRAGON_HEAD_BASE) {\n        if (x + 1 < level.width) objects[y]![x + 1] = ObjectId.DRAGON_BODY;\n        if (x + 2 < level.width) objects[y]![x + 2] = ObjectId.DRAGON_TAIL;\n      } else if (type === ObjectId.SANDMAN && y + 1 < level.height) {\n        objects[y + 1]![x] = ObjectId.SANDMAN_BODY;\n      } else if (type === ObjectId.DREAM_MACHINE && y + 1 < level.height) {\n        objects[y + 1]![x] = ObjectId.DREAM_MACHINE_BODY;\n      } else if (type === ObjectId.BEAVER_BASE && y + 1 < level.height) {\n        objects[y + 1]![x] = ObjectId.BEAVER_BODY;\n      }`;
  const footprintsNew = `      objects[y]![x] = type;\n      for (const part of initialObjectFootprint(type)) {\n        const px=x+part.dx, py=y+part.dy;\n        if(px>=0&&py>=0&&px<level.width&&py<level.height) objects[py]![px]=part.type;\n      }`;
  text = once(text, footprintsOld, footprintsNew, 'generic footprints');
  text = once(text, "        if (object === ObjectId.CARROT) carrotCount += 1;\n        if (object === ObjectId.EGG_NEST_EMPTY) nestCount += 1;\n        if (terrain[y]![x] === Terrain.HIGH_GRASS_OBJECTIVE && object === EMPTY_OBJECT) hiddenCount += 1;", "        if (objectHasTrait(object,'objective-carrot')) carrotCount += 1;\n        if (objectHasTrait(object,'objective-nest')) nestCount += 1;\n        if (terrainHasTrait(terrain[y]![x]!,'hidden-objective') && object === EMPTY_OBJECT) hiddenCount += 1;", 'objective traits');
  const windInitStart = text.indexOf('    const windmillsEnabled: [boolean, boolean, boolean, boolean]');
  const windInitEnd = text.indexOf('    const bonusTimeRemainingMs', windInitStart);
  if(windInitStart<0||windInitEnd<0)throw new Error('wind init block missing');
  const windInit = `    const windmillsEnabled: [boolean, boolean, boolean, boolean] = [false, false, false, false];\n    const hasSwitch: [boolean, boolean, boolean, boolean] = [false, false, false, false];\n    for (const row of terrain) for (const type of row) { const index=windSwitchIndexForTerrain(type); if(index!==undefined){hasSwitch[index]=true;if(type.endsWith('-on'))windmillsEnabled[index]=true;} }\n    for (const row of objects) for (const type of row) { const info=windmillInfoForObject(type); if(info&&!hasSwitch[info.index])windmillsEnabled[info.index]=true; }\n\n`;
  text = text.slice(0, windInitStart)+windInit+text.slice(windInitEnd);
  text = text.replace("const tideDirection = TIDE_TERRAIN_DIRECTION.get(terrain);", "const tideDirection = tideDirectionForTerrain(terrain);");
  text = once(text, "        && allowsBeanstalkGrowth(targetTerrain);", "        && terrainHasTrait(targetTerrain, 'beanstalk-growth');", 'growth trait');
  text = once(text, "        if (this.objectIdAt(x, y) === ObjectId.DRAGON_HEAD_BASE) { head = { x, y }; break outer; }", "        if (objectHasTrait(this.objectIdAt(x,y),'dragon-head')) { head = { x, y }; break outer; }", 'dragon head trait');
  text = once(text, "      if (object === ObjectId.ICE_BLOCK) {\n        this.setObject(x, y, EMPTY_OBJECT);\n        events.push({ type: 'melt-ice', message: '龙火融化冰块', x, y });\n      } else if (object === ObjectId.DRAGON_HEAD_BASE || object === ObjectId.DRAGON_BODY || object === ObjectId.CRUMBLY_ROCK) {\n        break;\n      }\n\n      const reflected = this.reflectFire(terrain, direction);", "      if (objectHasTrait(object,'dragon-fire-melt')) {\n        this.setObject(x,y,EMPTY_OBJECT);\n        events.push({type:'melt-ice',message:'龙火融化冰块',x,y});\n      } else if (objectHasTrait(object,'dragon-fire-blocking')) break;\n\n      const reflected = reflectFireForTerrain(terrain, direction);", 'dragon object and reflection traits');
  text = once(text, "      else if (!this.fireTerrainPassable(terrain)) break;", "      else if (!terrainHasTrait(terrain,'dragon-fire-passable')) break;", 'fire passable trait');
  text = text.replace(/\n  private reflectFire\(terrain: TerrainType, direction: Direction\): Direction \| null \| false \{[\s\S]*?\n  }\n\n  private fireTerrainPassable\(terrain: TerrainType\): boolean \{[\s\S]*?\n  }\n/, '\n');
  const propelOld = `        const object = this.objectIdAt(x, y);\n        const index = types.indexOf(object);\n        if (index >= 0) windmills.push({ x, y, direction: WINDMILL_DIRECTION.get(object)!, enabled: state.windmillsEnabled[index]! });`;
  const propelNew = `        const object = this.objectIdAt(x,y);\n        const info=windmillInfoForObject(object);\n        if(info)windmills.push({x,y,direction:info.direction,enabled:state.windmillsEnabled[info.index]!});`;
  text = once(text, "    const types: ObjectType[] = [ObjectId.WINDMILL_UP, ObjectId.WINDMILL_DOWN, ObjectId.WINDMILL_LEFT, ObjectId.WINDMILL_RIGHT];\n", '', 'windmill types array');
  text = once(text, propelOld, propelNew, 'windmill registry info');
  text = text.replace("if (!CLOUD_OBJECT_IDS.has(entity.type)) continue;", "if (!objectHasTrait(entity.type,'dynamic-cloud')) continue;");
  text = text.replace("if (!CLOUD_OBJECT_IDS.has(entity.type) || !entity.direction) continue;", "if (!objectHasTrait(entity.type,'dynamic-cloud') || !entity.direction) continue;");
  text = text.replaceAll("const ownGrid = CLOUD_GRID_FOR_OBJECT.get(entity.type);", "const ownGrid = cloudGridForObject(entity.type);");
  text = once(text, "    return isCloudPassableBackground(terrain);", "    return terrainHasTrait(terrain,'cloud-passable');", 'cloud terrain trait');
  const toggleStart=text.indexOf('  private toggleWindSwitchTiles(index: number): void {');
  const toggleEnd=text.indexOf('  private mapTerrain(',toggleStart);
  if(toggleStart<0||toggleEnd<0)throw new Error('toggle wind block missing');
  const toggle=`  private toggleWindSwitchTiles(index:number):void{this.mapTerrain((type)=>windSwitchIndexForTerrain(type)===index?(windSwitchPeerForTerrain(type)??type):type);}\n\n`;
  text=text.slice(0,toggleStart)+toggle+text.slice(toggleEnd);
  return text;
});

edit('engine/src/index.ts', (text) => {
  text = once(text, "  markerBehavior,", "  fireReflectionBehavior,\n  markerBehavior,", 'fire behavior export');
  return text;
});

console.log('Applied remaining semantic registry migration.');
