import type { LevelObject } from '../data/types.js';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface StepVector {
  dx: number;
  dy: number;
}

export const DIRECTIONS: Record<Direction, StepVector> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};

export interface PassageResult {
  passable: boolean;
  reason: string;
  confidence: 'confirmed' | 'partial';
}

const BLOCKING_OBJECTS = new Set([
  -52, -51, -48, -47, -46, -45, -41, -38, -37, -36,
  -29, -25, -22, -21, -19, -12, -9, -7, -6, -5, -4, -3, -2
]);
const TERRAIN_OVERRIDE_OBJECTS = new Set([-50, -44, -34]);

function signed(id: number): number {
  return id > 127 ? id - 256 : id;
}

/**
 * 从 Bobby 5 v1.0.3 字节码恢复的默认状态通行规则。
 * 需要额外状态的机关不会在这里凭空猜测。
 */
export function terrainPassage(id: number, vector: StepVector): PassageResult {
  if (id < 94 || id > 200) {
    return { passable: false, reason: `terrain ${id} 超出已确认的默认可步行范围`, confidence: 'confirmed' };
  }

  if (id === 195 || id === 197 || id === 199 || id === 200) {
    return { passable: false, reason: `terrain ${id} 需要额外机关状态`, confidence: 'partial' };
  }

  // 原版 signed ID -71..-66（unsigned 185..190）是带方向限制的地板。
  const directionRules: Record<number, (v: StepVector) => boolean> = {
    185: (v) => v.dx === -1 || v.dy === 1,
    186: (v) => v.dx === 1 || v.dy === 1,
    187: (v) => v.dx === 1 || v.dy === -1,
    188: (v) => v.dx === -1 || v.dy === -1,
    189: (v) => v.dy !== 0,
    190: (v) => v.dx !== 0
  };
  const directional = directionRules[id];
  if (directional) {
    return {
      passable: directional(vector),
      reason: `方向地形 ${id}`,
      confidence: 'confirmed'
    };
  }

  return { passable: true, reason: `terrain ${id} 位于已确认的默认可步行范围`, confidence: 'confirmed' };
}

export function canEnterTile(terrainId: number, objects: LevelObject[], vector: StepVector): PassageResult {
  let terrain = terrainPassage(terrainId, vector);
  const signedObjects = objects.map((object) => signed(object.id));

  if (!terrain.passable && signedObjects.some((id) => TERRAIN_OVERRIDE_OBJECTS.has(id))) {
    terrain = { passable: true, reason: '原版碰撞逻辑允许该对象覆盖底层不可通行地形', confidence: 'confirmed' };
  }
  if (!terrain.passable) return terrain;

  const blocker = signedObjects.find((id) => BLOCKING_OBJECTS.has(id));
  if (blocker !== undefined) {
    return {
      passable: false,
      reason: `object ${blocker} 在默认状态下阻挡通行`,
      confidence: 'partial'
    };
  }

  return terrain;
}
