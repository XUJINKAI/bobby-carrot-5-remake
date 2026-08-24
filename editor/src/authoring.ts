import { objectLayoutFor, type ObjectType } from '@bobby/engine';
import type { EditorLevel, EditorObject } from './level.js';
export interface Cell{x:number;y:number;}export interface OccupiedCell extends Cell{type:ObjectType;}export interface ResolvedObject{object:EditorObject;cells:OccupiedCell[];partType:ObjectType;}
export function objectCells(object:EditorObject):OccupiedCell[]{return objectLayoutFor(object.type).cells.map((cell)=>({x:object.x+cell.dx,y:object.y+cell.dy,type:cell.type}));}
export function resolveObjectOwner(level:EditorLevel,x:number,y:number):ResolvedObject|null{for(const object of level.objects){const cells=objectCells(object),part=cells.find((cell)=>cell.x===x&&cell.y===y);if(part)return{object,cells,partType:part.type};}return null;}
export function anchorForCursor(type:ObjectType,cell:Cell):Cell{const cursor=objectLayoutFor(type).cursor;return{x:cell.x-cursor.dx,y:cell.y-cursor.dy};}
export function placementCells(type:ObjectType,cell:Cell):OccupiedCell[]{const anchor=anchorForCursor(type,cell);return objectLayoutFor(type).cells.map((part)=>({x:anchor.x+part.dx,y:anchor.y+part.dy,type:part.type}));}
export function placementFits(level:EditorLevel,type:ObjectType,cell:Cell):boolean{return placementCells(type,cell).every((part)=>part.x>=0&&part.y>=0&&part.x<level.width&&part.y<level.height);}
export function intersectingOwners(level:EditorLevel,cells:readonly Cell[]):EditorObject[]{const targets=new Set(cells.map((cell)=>`${cell.x},${cell.y}`)),result:EditorObject[]=[];for(const object of level.objects)if(objectCells(object).some((cell)=>targets.has(`${cell.x},${cell.y}`)))result.push(object);return result;}
export function removeOwners(level:EditorLevel,owners:readonly EditorObject[]):EditorLevel{const remove=new Set(owners);return{...level,objects:level.objects.filter((object)=>!remove.has(object))};}
