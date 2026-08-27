import type { EntityInstance } from "../world/entity/EntityInstance.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";
import type {
  QuarterTurn,
  VisualQuery,
  VisualResolveContext,
} from "./VisualDefinition.js";

export const CARDINAL_CONNECTION = {
  north: 1,
  east: 2,
  south: 4,
  west: 8,
} as const;

export type CardinalConnectionMask = number;
export type AutoConnectShape =
  | "isolated"
  | "end"
  | "straight"
  | "corner"
  | "tee"
  | "cross";

export interface AutoConnectTopology {
  mask: CardinalConnectionMask;
  shape: AutoConnectShape;
  /** 顺时针 90° 的倍数；以每种 shape 的 canonical 朝向为 0。 */
  rotation: QuarterTurn;
}

export type AutoConnectPredicate = (
  entity: Readonly<EntityInstance>,
  presence: Readonly<EntityPresence>,
) => boolean;

/**
 * 查询当前 Presence 上下左右四格。连接条件完全由调用者决定；它可以按 type、
 * trait、property、state 或其它 Visual 规则连接任意 Entity。
 */
export function cardinalConnectionMask(
  context: VisualResolveContext,
  connects: AutoConnectPredicate,
): CardinalConnectionMask {
  const { x, y } = context.presence.cell;
  let mask = 0;
  if (cellConnects(context.query, x, y - 1, connects))
    mask |= CARDINAL_CONNECTION.north;
  if (cellConnects(context.query, x + 1, y, connects))
    mask |= CARDINAL_CONNECTION.east;
  if (cellConnects(context.query, x, y + 1, connects))
    mask |= CARDINAL_CONNECTION.south;
  if (cellConnects(context.query, x - 1, y, connects))
    mask |= CARDINAL_CONNECTION.west;
  return mask;
}

/**
 * 把 16 种 N/E/S/W mask 归一为六类拓扑 + 旋转。
 * canonical 朝向：end=E、straight=E-W、corner=E-S、tee=N-E-S。
 */
export function resolveCardinalTopology(
  mask: CardinalConnectionMask,
): AutoConnectTopology {
  const normalized = mask & 0b1111;
  switch (normalized) {
    case 0:
      return { mask: normalized, shape: "isolated", rotation: 0 };
    case 2:
      return { mask: normalized, shape: "end", rotation: 0 };
    case 4:
      return { mask: normalized, shape: "end", rotation: 1 };
    case 8:
      return { mask: normalized, shape: "end", rotation: 2 };
    case 1:
      return { mask: normalized, shape: "end", rotation: 3 };
    case 10:
      return { mask: normalized, shape: "straight", rotation: 0 };
    case 5:
      return { mask: normalized, shape: "straight", rotation: 1 };
    case 6:
      return { mask: normalized, shape: "corner", rotation: 0 };
    case 12:
      return { mask: normalized, shape: "corner", rotation: 1 };
    case 9:
      return { mask: normalized, shape: "corner", rotation: 2 };
    case 3:
      return { mask: normalized, shape: "corner", rotation: 3 };
    case 7:
      return { mask: normalized, shape: "tee", rotation: 0 };
    case 14:
      return { mask: normalized, shape: "tee", rotation: 1 };
    case 13:
      return { mask: normalized, shape: "tee", rotation: 2 };
    case 11:
      return { mask: normalized, shape: "tee", rotation: 3 };
    case 15:
      return { mask: normalized, shape: "cross", rotation: 0 };
    default:
      throw new Error(`无效 cardinal connection mask：${mask}`);
  }
}

function cellConnects(
  query: VisualQuery,
  x: number,
  y: number,
  connects: AutoConnectPredicate,
): boolean {
  const cell = { x, y };
  if (!query.inBounds(cell)) return false;
  return query.presencesAt(cell).some((presence) => {
    const entity = query.entity(presence.entityId);
    return entity !== undefined && connects(entity, presence);
  });
}
