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
  nextTerrainOnLeave?(current: TerrainType): TerrainType | undefined;
}

export function directionalPassage(options: {
  enter: Direction[];
  leave: Direction[];
}): TileBehavior {
  const enter = [...options.enter];
  const leave = [...options.leave];
  return {
    id: 'directional-passage',
    describe: () => ({
      id: 'directional-passage',
      summary: '只允许从指定方向进入和离开',
      config: { enter, leave }
    }),
    canEnter(ctx) {
      return enter.includes(ctx.direction)
        ? undefined
        : { passable: false, reason: '目标旋转地板不允许从这个方向进入', confidence: 'confirmed' };
    },
    canLeave(ctx) {
      return leave.includes(ctx.direction)
        ? undefined
        : { passable: false, reason: '当前旋转地板不允许从这个方向离开', confidence: 'confirmed' };
    }
  };
}

export function rotateOnLeave(next: TerrainType): TileBehavior {
  return {
    id: 'rotate-on-leave',
    describe: () => ({
      id: 'rotate-on-leave',
      summary: 'Bobby 离开后切换到下一旋转状态',
      config: { next }
    }),
    nextTerrainOnLeave(current) {
      return current === next ? undefined : next;
    }
  };
}

export function passageBehavior(
  id: string,
  summary: string,
  handler: (ctx: BehaviorContext) => BehaviorPassageResult | undefined,
  config?: Record<string, string | number | boolean | string[]>
): TileBehavior {
  return {
    id,
    describe: () => ({ id, summary, ...(config ? { config } : {}) }),
    passage: handler
  };
}

export function markerBehavior(
  id: string,
  summary: string,
  config?: Record<string, string | number | boolean | string[]>
): TileBehavior {
  return {
    id,
    describe: () => ({ id, summary, ...(config ? { config } : {}) })
  };
}
