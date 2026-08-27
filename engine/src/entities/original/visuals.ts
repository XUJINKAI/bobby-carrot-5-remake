import { EntityTypeId, type Direction, type LevelEntity } from "@bobby/model";
import type { EntityDefinition } from "../../world/entity/EntityDefinition.js";
import {
  cardinalConnectionMask,
  resolveCardinalTopology,
  type AutoConnectShape,
} from "../../visual/AutoConnect.js";
import type { VisualDefinition } from "../../visual/VisualDefinition.js";

interface AtlasCell {
  column: number;
  row: number;
}

const cell = (column: number, row: number): AtlasCell => ({ column, row });
const objectCell = (index: number): AtlasCell => {
  const linear = 9 + index;
  return cell(linear % 16, 12 + Math.floor(linear / 16));
};

export const BOBBY_VISUAL_ASSETS: Readonly<Record<Direction, string>> = {
  left: "bobby-left",
  right: "bobby-right",
  up: "bobby-up",
  down: "bobby-down",
};

const FENCE_ART_INDEX: Record<AutoConnectShape, number> = {
  isolated: 48,
  end: 49,
  straight: 50,
  corner: 51,
  tee: 52,
  cross: 53,
};

const DIRECT_ART = new Map<string, AtlasCell>([
  [EntityTypeId.SNOW, cell(13, 4)],
  [EntityTypeId.WATER, cell(5, 5)],
  [EntityTypeId.WATER_ANIMATED, cell(6, 5)],
  [EntityTypeId.WATER_VARIANT_1, cell(11, 5)],
  [EntityTypeId.WATER_VARIANT_2, cell(12, 5)],
  [EntityTypeId.WATER_VARIANT_3, cell(13, 5)],
  [EntityTypeId.GROUND_A, cell(14, 5)],
  [EntityTypeId.GROUND_B, cell(15, 5)],
  [EntityTypeId.SHOVEL_CLEARED_GROUND, cell(12, 7)],
  [EntityTypeId.GROUND_C, cell(0, 9)],
  [EntityTypeId.GROUND_D, cell(1, 9)],
  [EntityTypeId.ICE, cell(4, 9)],
  [EntityTypeId.START, cell(5, 9)],
  [EntityTypeId.EXIT, cell(6, 9)],
  [EntityTypeId.SHOP_DREAM, cell(7, 9)],
  [EntityTypeId.SHOP_CLOUD9, cell(8, 9)],
  [EntityTypeId.SHOP_SUPER_KEY, cell(9, 9)],
  [EntityTypeId.SHOP_STEREO, cell(10, 9)],
  [EntityTypeId.SHOP_MUSIC, cell(11, 9)],
  [EntityTypeId.SHOP_SPEED_SHOES, cell(12, 9)],
  [EntityTypeId.SHOP_COIN_RADAR, cell(13, 9)],
  [EntityTypeId.SHOP_UNAVAILABLE, cell(14, 9)],
  [EntityTypeId.SHOVEL_PICKUP, cell(15, 9)],
  [EntityTypeId.MOWER_PARKING, cell(0, 10)],
  [EntityTypeId.HIGH_GRASS, cell(7, 12)],
  [EntityTypeId.HIGH_GRASS_OBJECTIVE, cell(8, 12)],
  [EntityTypeId.CONSUMED_CARROT, objectCell(0)],
  [EntityTypeId.CARROT, objectCell(1)],
  [EntityTypeId.EGG_NEST_EMPTY, objectCell(2)],
  [EntityTypeId.EGG_NEST_FILLED, objectCell(3)],
  [EntityTypeId.LOCK, objectCell(4)],
  [EntityTypeId.BEANSTALK_TIP, objectCell(5)],
  [EntityTypeId.BEAN, objectCell(6)],
  [EntityTypeId.WINDMILL_UP, objectCell(7)],
  [EntityTypeId.WINDMILL_DOWN, objectCell(8)],
  [EntityTypeId.WINDMILL_LEFT, objectCell(9)],
  [EntityTypeId.WINDMILL_RIGHT, objectCell(10)],
  [EntityTypeId.PLANK, objectCell(11)],
  [EntityTypeId.PLANK_CRUMBLING, objectCell(12)],
  [EntityTypeId.PLANK_FRAGMENT, objectCell(13)],
  [EntityTypeId.MOWER, objectCell(19)],
  [EntityTypeId.GAS, objectCell(20)],
  [EntityTypeId.BEANSTALK_MID, objectCell(21)],
  [EntityTypeId.BEAN_FIELD, objectCell(22)],
  [EntityTypeId.CLOUD_RED, objectCell(23)],
  [EntityTypeId.CLOUD_PURPLE, objectCell(24)],
  [EntityTypeId.CLOUD_GREEN, objectCell(25)],
  [EntityTypeId.LEAF, objectCell(35)],
  [EntityTypeId.CRUMBLY_ROCK, objectCell(36)],
  [EntityTypeId.BEANSTALK_BASE, objectCell(37)],
  [EntityTypeId.BEAN_SPROUT, objectCell(38)],
  [EntityTypeId.CLOUD_GRID_RED, objectCell(39)],
  [EntityTypeId.CLOUD_GRID_PURPLE, objectCell(40)],
  [EntityTypeId.CLOUD_GRID_GREEN, objectCell(41)],
  [EntityTypeId.KITE, objectCell(42)],
  [EntityTypeId.WHIRLWIND, objectCell(43)],
  [EntityTypeId.LANDING, objectCell(44)],
  [EntityTypeId.GOLDEN_CARROT, objectCell(45)],
  [EntityTypeId.BONUS_COIN, objectCell(47)],
]);

export function originalVisualDefinition(
  definition: EntityDefinition,
): VisualDefinition {
  if (definition.type === EntityTypeId.BOBBY) return bobbyVisualDefinition();
  if (definition.type === EntityTypeId.FENCE) return fenceVisualDefinition();
  const id = definition.presentation.visual ?? definition.type;
  return {
    id,
    resolve(context) {
      const atlas = entityAtlasCell(context.entity, context.presence.role);
      return atlas
        ? { layers: [{ kind: "atlas", column: atlas.column, row: atlas.row }] }
        : null;
    },
  };
}

function bobbyVisualDefinition(): VisualDefinition {
  return {
    id: EntityTypeId.BOBBY,
    resolve(context) {
      const direction = context.entity.direction ?? "down";
      return {
        layers: [
          {
            kind: "image",
            asset: BOBBY_VISUAL_ASSETS[direction],
            frameWidth: 48,
            frameProgress: context.runtime?.moving
              ? clampProgress(context.runtime.progress ?? 0)
              : 0,
            anchor: "bottom",
          },
        ],
      };
    },
  };
}

function fenceVisualDefinition(): VisualDefinition {
  return {
    id: EntityTypeId.FENCE,
    resolve(context) {
      const mask = cardinalConnectionMask(
        context,
        (_entity, presence) =>
          presence.traits.includes("fence") || presence.traits.includes("gate"),
      );
      const topology = resolveCardinalTopology(mask);
      const atlas = objectCell(FENCE_ART_INDEX[topology.shape]);
      return {
        layers: [
          {
            kind: "atlas",
            column: atlas.column,
            row: atlas.row,
            rotate: topology.rotation,
          },
        ],
      };
    },
  };
}

function entityAtlasCell(
  entity: Pick<LevelEntity, "type" | "direction" | "properties" | "state">,
  role?: string,
): AtlasCell | null {
  const direct = DIRECT_ART.get(entity.type);
  if (direct) return direct;
  if (entity.type === EntityTypeId.TIDE)
    return directionCell(entity.direction, cell(7, 5), cell(8, 5), cell(9, 5), cell(10, 5));
  if (entity.type === EntityTypeId.SPEED)
    return directionCell(entity.direction, cell(5, 11), cell(6, 11), cell(7, 11), cell(8, 11));
  if (entity.type === EntityTypeId.SPEED_SWITCH)
    return entity.state?.pressed === true ? cell(1, 10) : cell(2, 10);
  if (entity.type === EntityTypeId.CAROUSEL_SWITCH)
    return entity.state?.pressed === true ? cell(4, 10) : cell(3, 10);
  if (entity.type === EntityTypeId.TIDE_SWITCH)
    return entity.state?.pressed === true ? cell(6, 10) : cell(5, 10);
  if (entity.type === EntityTypeId.WIND_SWITCH) {
    const channel = boundedInt(entity.properties?.channel, 0, 3, 0);
    return cell(7 + channel * 2 + (entity.state?.active === true ? 0 : 1), 10);
  }
  if (entity.type === EntityTypeId.TRAP)
    return entity.state?.active === false ? cell(0, 11) : cell(15, 10);
  if (entity.type === EntityTypeId.MIRROR)
    return cell(boundedInt(entity.state?.variant, 1, 4, 1), 11);
  if (entity.type === EntityTypeId.CAROUSEL) {
    const variant = entity.state?.variant ?? 1;
    if (variant === "vertical") return cell(13, 11);
    if (variant === "horizontal") return cell(14, 11);
    return cell(8 + boundedInt(variant, 1, 4, 1), 11);
  }
  if (entity.type === EntityTypeId.COLOR_YELLOW_SWITCH)
    return entity.state?.pressed === true ? cell(0, 12) : cell(15, 11);
  if (entity.type === EntityTypeId.COLOR_PINK_SWITCH)
    return entity.state?.pressed === true ? cell(2, 12) : cell(1, 12);
  if (entity.type === EntityTypeId.COLOR_YELLOW_BLOCK)
    return entity.state?.raised === false ? cell(4, 12) : cell(3, 12);
  if (entity.type === EntityTypeId.COLOR_PINK_BLOCK)
    return entity.state?.raised === false ? cell(6, 12) : cell(5, 12);
  if (entity.type === EntityTypeId.DRAGON)
    return role === "body" ? objectCell(15) : role === "tail" ? objectCell(16) : objectCell(14);
  if (entity.type === EntityTypeId.SANDMAN)
    return role === "body" ? objectCell(33) : objectCell(17);
  if (entity.type === EntityTypeId.DREAM_MACHINE)
    return role === "body" ? objectCell(34) : objectCell(18);
  if (entity.type === EntityTypeId.BEAVER)
    return role === "body" ? objectCell(46) : objectCell(30);
  if (entity.type === EntityTypeId.ICE_BLOCK)
    return objectCell(26 + boundedInt(entity.state?.meltStage, 0, 3, 0));
  return variantAtlasCell(entity.type);
}

function variantAtlasCell(type: string): AtlasCell | null {
  const walkable = /^walkable-variant-(\d+)$/.exec(type);
  if (walkable) {
    const linear = 6 * 16 + Math.max(1, Number(walkable[1])) - 1;
    return cell(linear % 16, Math.floor(linear / 16));
  }
  const background = /^background-variant-(\d+)$/.exec(type);
  if (background) {
    const linear = Math.max(1, Number(background[1])) - 1;
    return cell(linear % 16, Math.floor(linear / 16));
  }
  const object = /^object-variant-(\d+)$/.exec(type);
  if (object) {
    const linear = Math.max(1, Number(object[1])) - 1;
    return cell(linear % 16, Math.floor(linear / 16));
  }
  return null;
}

function directionCell(
  direction: LevelEntity["direction"],
  up: AtlasCell,
  down: AtlasCell,
  left: AtlasCell,
  right: AtlasCell,
): AtlasCell {
  return { up, down, left, right }[direction ?? "right"];
}

function boundedInt(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(0.999999, value));
}
