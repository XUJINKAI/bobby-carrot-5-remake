import type { ObjectType, TerrainType } from '../data/types.js';
import type { RuntimeState } from '../world/RuntimeState.js';
import type { Direction } from './ids.js';

export interface BehaviorPassageResult {
  passable: boolean;
  reason: string;
  confidence: 'confirmed' | 'inferred';
  consumesLock?: boolean;
  clearsSnow?: boolean;
  boardsMower?: boolean;
  startsFlight?: boolean;
}

export interface BehaviorContext {
  state: RuntimeState;
  direction: Direction;
  terrainId: TerrainType;
  objectId: ObjectType;
  fromTerrain?: TerrainType;
}

export interface BehaviorRuntimeApi {
  setTerrain(type: TerrainType): void;
  setObject(type: ObjectType): void;
  mapTerrain(mapper: (type: TerrainType) => TerrainType): void;
  event(type: string, message: string): void;
  kill(reason: string): void;
  fireDragon(): void;
  propelClouds(): void;
  toggleWind(index: number): void;
  mowedGround(): TerrainType;
}

export interface BehaviorRuntimeContext extends BehaviorContext {
  x: number;
  y: number;
  mode: 'normal' | 'flight';
  justBoarded: boolean;
  api: BehaviorRuntimeApi;
}

export interface BehaviorRuntimeResult { stop?: boolean; }
export type BehaviorEnterPhase = 'before-object' | 'after-object';

export interface BehaviorDescription {
  id: string;
  summary: string;
  config?: Record<string, string | number | boolean | string[]>;
}

export interface TileBehavior {
  id: string;
  describe(): BehaviorDescription;
  canEnter?(ctx: BehaviorContext): BehaviorPassageResult | undefined;
  canLeave?(ctx: BehaviorContext): BehaviorPassageResult | undefined;
  passage?(ctx: BehaviorContext): BehaviorPassageResult | undefined;
  enterPhase?: BehaviorEnterPhase;
  onEnter?(ctx: BehaviorRuntimeContext): BehaviorRuntimeResult | void;
  onLeave?(ctx: BehaviorRuntimeContext): BehaviorRuntimeResult | void;
  nextTerrainOnLeave?(current: TerrainType): TerrainType | undefined;
  reflectFire?(direction: Direction): Direction | null | false;
}

export function directionalPassage(options: { enter: Direction[]; leave: Direction[]; }): TileBehavior {
  const enter = [...options.enter];
  const leave = [...options.leave];
  return {
    id: 'directional-passage',
    describe: () => ({ id: 'directional-passage', summary: '只允许从指定方向进入和离开', config: { enter, leave } }),
    canEnter(ctx) { return enter.includes(ctx.direction) ? undefined : { passable: false, reason: '目标旋转地板不允许从这个方向进入', confidence: 'confirmed' }; },
    canLeave(ctx) { return leave.includes(ctx.direction) ? undefined : { passable: false, reason: '当前旋转地板不允许从这个方向离开', confidence: 'confirmed' }; }
  };
}

export function rotateOnLeave(next: TerrainType): TileBehavior {
  return {
    id: 'rotate-on-leave',
    describe: () => ({ id: 'rotate-on-leave', summary: 'Bobby 离开后切换到下一旋转状态', config: { next } }),
    onLeave(ctx) { ctx.api.setTerrain(next); },
    nextTerrainOnLeave(current) { return current === next ? undefined : next; }
  };
}

export function fireReflectionBehavior(
  id: string,
  reflections: Partial<Record<Direction, Direction>>
): TileBehavior {
  const config = Object.fromEntries(Object.entries(reflections).map(([from, to]) => [from, String(to)]));
  return {
    id,
    describe: () => ({ id, summary: '按镜面朝向反射龙火；其它入射方向被镜面阻断', config }),
    reflectFire(direction) { return reflections[direction] ?? false; }
  };
}

export function passageBehavior(id: string, summary: string, handler: (ctx: BehaviorContext) => BehaviorPassageResult | undefined, config?: Record<string, string | number | boolean | string[]>): TileBehavior {
  return { id, describe: () => ({ id, summary, ...(config ? { config } : {}) }), passage: handler };
}
export function enterBehavior(id: string, summary: string, handler: (ctx: BehaviorRuntimeContext) => BehaviorRuntimeResult | void, config?: Record<string, string | number | boolean | string[]>): TileBehavior {
  return { id, enterPhase: 'after-object', describe: () => ({ id, summary, ...(config ? { config } : {}) }), onEnter: handler };
}
export function preEnterBehavior(id: string, summary: string, handler: (ctx: BehaviorRuntimeContext) => BehaviorRuntimeResult | void, config?: Record<string, string | number | boolean | string[]>): TileBehavior {
  return { id, enterPhase: 'before-object', describe: () => ({ id, summary, ...(config ? { config } : {}) }), onEnter: handler };
}
export function leaveBehavior(id: string, summary: string, handler: (ctx: BehaviorRuntimeContext) => BehaviorRuntimeResult | void, config?: Record<string, string | number | boolean | string[]>): TileBehavior {
  return { id, describe: () => ({ id, summary, ...(config ? { config } : {}) }), onLeave: handler };
}
export function markerBehavior(id: string, summary: string, config?: Record<string, string | number | boolean | string[]>): TileBehavior {
  return { id, describe: () => ({ id, summary, ...(config ? { config } : {}) }) };
}
