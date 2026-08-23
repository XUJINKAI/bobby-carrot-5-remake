import type { TerrainType } from '../data/types.js';
import { terrainHasTrait } from './definitions.js';

/** Compatibility query wrappers. Definition Registry is the single source of truth. */
export function isWaterTerrainType(type:TerrainType):boolean{return terrainHasTrait(type,'water');}
export function isOrdinaryWalkableTerrainType(type:TerrainType):boolean{return terrainHasTrait(type,'walkable');}
export function allowsBeanstalkGrowth(type:TerrainType):boolean{return terrainHasTrait(type,'beanstalk-growth');}
export function isCloudPassableBackground(type:TerrainType):boolean{return terrainHasTrait(type,'cloud-passable');}
export function isDragonFireBackground(type:TerrainType):boolean{return terrainHasTrait(type,'dragon-fire-passable');}
