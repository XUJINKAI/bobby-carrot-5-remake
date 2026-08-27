import { EntityTypeId, type LevelEntity } from "@bobby/model";

export interface AtlasCell {
  column: number;
  row: number;
}

const cell = (column: number, row: number): AtlasCell => ({ column, row });
export const originalObjectAtlasCell = (index: number): AtlasCell => {
  const linear = 9 + index;
  return cell(linear % 16, 12 + Math.floor(linear / 16));
};
const objectCell = originalObjectAtlasCell;

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

/** Resolve one canonical Entity/Presence into the original HD atlas. */
export function entityAtlasCell(
  entity: Pick<LevelEntity, "type" | "direction" | "properties" | "state">,
  role?: string,
): AtlasCell | null {
  const direct = DIRECT_ART.get(entity.type);
  if (direct) return direct;

  if (entity.type === EntityTypeId.TIDE) {
    return directionCell(entity.direction, {
      up: cell(7, 5),
      down: cell(8, 5),
      left: cell(9, 5),
      right: cell(10, 5),
    });
  }
  if (entity.type === EntityTypeId.SPEED) {
    return directionCell(entity.direction, {
      up: cell(5, 11),
      down: cell(6, 11),
      left: cell(7, 11),
      right: cell(8, 11),
    });
  }

  if (entity.type === EntityTypeId.SPEED_SWITCH) {
    return entity.state?.pressed === true ? cell(1, 10) : cell(2, 10);
  }
  if (entity.type === EntityTypeId.CAROUSEL_SWITCH) {
    return entity.state?.pressed === true ? cell(4, 10) : cell(3, 10);
  }
  if (entity.type === EntityTypeId.TIDE_SWITCH) {
    return entity.state?.pressed === true ? cell(6, 10) : cell(5, 10);
  }
  if (entity.type === EntityTypeId.WIND_SWITCH) {
    const channel = boundedInt(entity.properties?.channel, 0, 3, 0);
    return cell(
      7 + channel * 2 + (entity.state?.active === true ? 0 : 1),
      10,
    );
  }
  if (entity.type === EntityTypeId.TRAP) {
    return entity.state?.active === false ? cell(0, 11) : cell(15, 10);
  }
  if (entity.type === EntityTypeId.MIRROR) {
    return cell(boundedInt(entity.state?.variant, 1, 4, 1), 11);
  }
  if (entity.type === EntityTypeId.CAROUSEL) {
    const variant = entity.state?.variant ?? 1;
    if (variant === "vertical") return cell(13, 11);
    if (variant === "horizontal") return cell(14, 11);
    return cell(8 + boundedInt(variant, 1, 4, 1), 11);
  }
  if (entity.type === EntityTypeId.COLOR_YELLOW_SWITCH) {
    return entity.state?.pressed === true ? cell(0, 12) : cell(15, 11);
  }
  if (entity.type === EntityTypeId.COLOR_PINK_SWITCH) {
    return entity.state?.pressed === true ? cell(2, 12) : cell(1, 12);
  }
  if (entity.type === EntityTypeId.COLOR_YELLOW_BLOCK) {
    return entity.state?.raised === false ? cell(4, 12) : cell(3, 12);
  }
  if (entity.type === EntityTypeId.COLOR_PINK_BLOCK) {
    return entity.state?.raised === false ? cell(6, 12) : cell(5, 12);
  }

  if (entity.type === EntityTypeId.DRAGON) {
    if (role === "body") return objectCell(15);
    if (role === "tail") return objectCell(16);
    return objectCell(14);
  }
  if (entity.type === EntityTypeId.SANDMAN) {
    return role === "body" ? objectCell(33) : objectCell(17);
  }
  if (entity.type === EntityTypeId.DREAM_MACHINE) {
    return role === "body" ? objectCell(34) : objectCell(18);
  }
  if (entity.type === EntityTypeId.BEAVER) {
    return role === "body" ? objectCell(46) : objectCell(30);
  }
  if (entity.type === EntityTypeId.ICE_BLOCK) {
    return objectCell(26 + boundedInt(entity.state?.meltStage, 0, 3, 0));
  }

  const walkable = /^walkable-variant-(\d+)$/.exec(entity.type);
  if (walkable) {
    const ordinal = Math.max(1, Number(walkable[1]));
    const linear = 6 * 16 + ordinal - 1;
    return cell(linear % 16, Math.floor(linear / 16));
  }
  const background = /^background-variant-(\d+)$/.exec(entity.type);
  if (background) {
    const ordinal = Math.max(1, Number(background[1]));
    const linear = ordinal - 1;
    return cell(linear % 16, Math.floor(linear / 16));
  }
  const objectVariant = /^object-variant-(\d+)$/.exec(entity.type);
  if (objectVariant) {
    const ordinal = Math.max(1, Number(objectVariant[1]));
    const linear = ordinal - 1;
    return cell(linear % 16, Math.floor(linear / 16));
  }
  return null;
}

/** Canvas fallback for canonical entities that are not sourced from the original atlas. */
export function drawEntityTile(
  context: CanvasRenderingContext2D,
  entity: Pick<LevelEntity, "type" | "direction" | "properties" | "state">,
  x: number,
  y: number,
  size: number,
): boolean {
  if (entity.type === EntityTypeId.PUSH_GOAL) {
    context.save();
    context.fillStyle = "#6c543d";
    context.fillRect(x, y, size, size);
    context.strokeStyle = "#f2c14e";
    context.lineWidth = Math.max(2, size * 0.08);
    context.strokeRect(
      x + size * 0.2,
      y + size * 0.2,
      size * 0.6,
      size * 0.6,
    );
    context.restore();
    return true;
  }
  if (entity.type === EntityTypeId.PORTAL) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      size * 0.08,
      centerX,
      centerY,
      size * 0.42,
    );
    gradient.addColorStop(0, "rgba(130,238,255,.12)");
    gradient.addColorStop(0.55, "#7c5cff");
    gradient.addColorStop(0.78, "#54e8ff");
    gradient.addColorStop(1, "rgba(84,232,255,0)");
    context.save();
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centerX, centerY, size * 0.44, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(225,252,255,.9)";
    context.lineWidth = Math.max(1, size * 0.035);
    context.beginPath();
    context.arc(centerX, centerY, size * 0.29, 0, Math.PI * 2);
    context.stroke();
    context.restore();
    return true;
  }
  if (entity.type === EntityTypeId.BOBBY) {
    context.save();
    context.fillStyle = "rgba(245,245,245,.92)";
    context.beginPath();
    context.arc(
      x + size * 0.5,
      y + size * 0.55,
      size * 0.28,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.fillStyle = "#273238";
    context.font = `${Math.max(10, size * 0.3)}px system-ui`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("B", x + size * 0.5, y + size * 0.55);
    context.restore();
    return true;
  }
  return false;
}

function directionCell(
  direction: LevelEntity["direction"],
  cells: Record<"up" | "down" | "left" | "right", AtlasCell>,
): AtlasCell {
  return cells[direction ?? "right"];
}

function boundedInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const number = Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
