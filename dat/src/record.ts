import { ObjectId, type LevelMap, type LevelObject, type ObjectType, type TerrainType } from '@bobby/model';
import { decodeDatObject, decodeDatTerrain, encodeDatObject, encodeDatTerrain } from './mapping.js';

const DYNAMIC_DAT_OBJECTS = new Set<ObjectType>([ObjectId.CLOUD_RED,ObjectId.CLOUD_PURPLE,ObjectId.CLOUD_GREEN,ObjectId.LEAF]);
export function deriveDatDynamicSlots(map:LevelMap):number { return Math.min(255,map.objects.filter((object)=>DYNAMIC_DAT_OBJECTS.has(object.type)).length); }

export interface DecodedDatLevelRecord { map: LevelMap; dynamicSlots: number; }
export function decodeDatLevelRecord(bytes:Uint8Array):DecodedDatLevelRecord {
  if(bytes.length<5)throw new Error('DAT level record too short');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength); let offset=0;
  const width=bytes[offset++]!; const height=bytes[offset++]!; if(!width||!height)throw new Error('DAT level dimensions are invalid');
  const terrainLength=width*height; if(offset+terrainLength+3>bytes.length)throw new Error('DAT terrain is truncated');
  const flat:TerrainType[]=[]; for(let i=0;i<terrainLength;i++)flat.push(decodeDatTerrain(bytes[offset++]!));
  const dynamicSlots=bytes[offset++]!; const count=view.getUint16(offset); offset+=2;
  if(offset+count*3!==bytes.length)throw new Error('DAT object table length mismatch');
  const objects:LevelObject[]=[]; for(let i=0;i<count;i++)objects.push({type:decodeDatObject(bytes[offset++]!),x:bytes[offset++]!,y:bytes[offset++]!});
  return {dynamicSlots,map:{width,height,terrain:Array.from({length:height},(_,y)=>flat.slice(y*width,(y+1)*width)),objects}};
}

export function encodeDatLevelRecord(map:LevelMap):Uint8Array {
  const width=Math.trunc(Number(map.width)); const height=Math.trunc(Number(map.height));
  if(width<1||width>255||height<1||height>255)throw new Error(`DAT dimensions must fit unsigned bytes: ${width}x${height}`);
  if(map.terrain.length!==height||map.terrain.some((row)=>row.length!==width))throw new Error('Semantic terrain dimensions do not match map width/height');
  if(map.objects.length>0xffff)throw new Error('Too many DAT objects');
  for(const object of map.objects)if(!Number.isInteger(object.x)||!Number.isInteger(object.y)||object.x<0||object.y<0||object.x>255||object.y>255)throw new Error(`Object coordinate does not fit DAT byte: ${object.x},${object.y}`);
  const output=new Uint8Array(2+width*height+1+2+map.objects.length*3); const view=new DataView(output.buffer); let offset=0;
  output[offset++]=width; output[offset++]=height; for(const row of map.terrain)for(const type of row)output[offset++]=encodeDatTerrain(type);
  output[offset++]=deriveDatDynamicSlots(map); view.setUint16(offset,map.objects.length); offset+=2;
  for(const object of map.objects){output[offset++]=encodeDatObject(object.type);output[offset++]=object.x;output[offset++]=object.y;}
  return output;
}
