import type { JsonPrimitive } from "../../shared/json.js";
import { MapEntityTypeId, type MapEntityType } from "./ids.js";
import { coordinateSurfaceType, surfaceMappingForTs, tsLabel, type TsCoordinate } from "./surface.js";

export interface EntityMapMigrationAlias {
  from: string;
  to?: MapEntityType;
  fields?: Readonly<Record<string, JsonPrimitive>>;
  disposition: "rename" | "collapse" | "runtime-only" | "visual-only";
  note: string;
}

export interface UnresolvedEntityMapSource {
  id: string;
  source: string;
  note: string;
}

/** 仅供审阅的迁移记录；最终严格 Map parser 不接受这些 alias。 */
export const ENTITY_MAP_MIGRATION_ALIASES: readonly EntityMapMigrationAlias[] = Object.freeze([
  rename("snow", MapEntityTypeId.SNOW, {}, "Snow is a shovelable cover mechanic; the visual currently comes from ts(5,14)."),
  rename("water-animated", MapEntityTypeId.WATER_RIPPLE, {}, "ts(6,7) is the ripple water surface."),
  rename("water-variant-1", MapEntityTypeId.WATERFALL, { variant: "top" }, "ts(6,12) is waterfall top/start."),
  rename("water-variant-2", MapEntityTypeId.WATERFALL, { variant: "middle" }, "ts(6,13) is waterfall middle."),
  rename("water-variant-3", MapEntityTypeId.WATERFALL, { variant: "bottom" }, "ts(6,14) is waterfall bottom/end."),
  fromTs("ground-a", 6, 15, "Current generic ground name is a documented forest grass visual."),
  fromTs("ground-b", 6, 16, "Current generic ground name is a documented forest grass visual."),
  fromTs("ground-c", 10, 1, "Current generic ground name is a documented forest grass visual."),
  fromTs("ground-d", 10, 2, "Current generic ground name is a documented forest grass visual."),
  fromTs("shovel-cleared-ground", 8, 13, "The persisted source tile is ts(8,13), documented as cloud-layer. Shovel-cleared is runtime state, not map identity."),

  runtimeOnly("high-grass-objective", "Represent as overlapping high-grass + carrot/egg; covered visual is presentation."),
  runtimeOnly("consumed-carrot", "Consumed/transient carrot presentation."),
  rename("egg-nest-empty", MapEntityTypeId.EGG_NEST, {}, "Nest fill state is runtime state."),
  runtimeOnly("egg-nest-filled", "Filled nest is runtime/presentation state."),
  rename("beanstalk-tip", MapEntityTypeId.BEANSTALK, {}, "Canonical beanstalk identity."),
  runtimeOnly("beanstalk-mid", "Growth/presentation phase of beanstalk."),
  runtimeOnly("beanstalk-base", "Growth/presentation phase of beanstalk."),
  runtimeOnly("bean-sprout", "Growth/presentation phase of beanstalk."),

  rename("windmill-up", MapEntityTypeId.WINDMILL, { direction: "up" }, "Direction becomes a field."),
  rename("windmill-right", MapEntityTypeId.WINDMILL, { direction: "right" }, "Direction becomes a field."),
  rename("windmill-down", MapEntityTypeId.WINDMILL, { direction: "down" }, "Direction becomes a field."),
  rename("windmill-left", MapEntityTypeId.WINDMILL, { direction: "left" }, "Direction becomes a field."),
  runtimeOnly("plank-crumbling", "Runtime/presentation phase of plank."),
  runtimeOnly("plank-fragment", "Runtime/presentation fragment spawned from plank."),
  runtimeOnly("fireball", "Spawned by Dragon at runtime."),

  rename("cloud-red", MapEntityTypeId.CLOUD, { color: "red" }, "Color becomes a field."),
  rename("cloud-purple", MapEntityTypeId.CLOUD, { color: "purple" }, "Color becomes a field."),
  rename("cloud-green", MapEntityTypeId.CLOUD, { color: "green" }, "Color becomes a field."),
  rename("cloud-grid-red", MapEntityTypeId.CLOUD_PARKING, { color: "red" }, "docs identify ts(16,1) as red Cloud Parking."),
  rename("cloud-grid-purple", MapEntityTypeId.CLOUD_PARKING, { color: "purple" }, "docs identify ts(16,2) as purple Cloud Parking."),
  rename("cloud-grid-green", MapEntityTypeId.CLOUD_PARKING, { color: "green" }, "docs identify ts(16,3) as green Cloud Parking."),

  rename("color-yellow-switch", MapEntityTypeId.COLOR_SWITCH, { color: "yellow" }, "Color becomes a field."),
  rename("color-pink-switch", MapEntityTypeId.COLOR_SWITCH, { color: "pink" }, "Color becomes a field."),
  rename("color-yellow-block", MapEntityTypeId.COLOR_BLOCK, { color: "yellow" }, "Color becomes a field."),
  rename("color-pink-block", MapEntityTypeId.COLOR_BLOCK, { color: "pink" }, "Color becomes a field."),
  rename("fence", MapEntityTypeId.FENCE, { variant: "ts-16-10" }, "DAT fence frames use their ts.png coordinates as variants."),
]);

export const ENTITY_MAP_UNRESOLVED_SOURCES: readonly UnresolvedEntityMapSource[] = Object.freeze([
  {
    id: "coordinate-surfaces",
    source: "surface-<row>-<column>",
    note: "尚未完成最终语义命名的 ts.png 单元使用坐标型临时身份；可用 atlas usage CLI 逐项审阅。",
  },
  {
    id: "original-object-variants",
    source: "current object-variant-* fallback",
    note: "剩余原版 object fallback 在确认语义前使用坐标型临时身份。",
  },
  {
    id: "beaver-dialog-ids",
    source: "Adventure/original Beaver dialog interactions",
    note: "bonus-key-vendor 已确认；普通对话身份仍需进一步还原。",
  },
]);

/**
 * 把当前通用 raw terrain 名称解析为首轮 semantic/coordinate Map 身份。
 * ts-row-column 是当前 archive 表示；旧 variant 名只用于迁移审阅。
 */
export function legacyEntityMapAlias(type: string): EntityMapMigrationAlias | undefined {
  const exact = ENTITY_MAP_MIGRATION_ALIASES.find((candidate) => candidate.from === type);
  if (exact) return exact;

  const coordinate = /^ts-(\d+)-(\d+)$/.exec(type);
  if (coordinate) {
    const row = Number(coordinate[1]);
    const column = Number(coordinate[2]);
    if (row < 1 || row > 16 || column < 1 || column > 16) return undefined;
    return fromCoordinate(
      type,
      { row, column },
      "Archive atlas coordinate replaced by semantic surface or reviewable coordinate identity.",
    );
  }

  const background = /^background-variant-(\d{3})$/.exec(type);
  if (background) {
    const value = Number(background[1]);
    if (value < 1 || value > 256) return undefined;
    const source = coordinateFromByte(value - 1);
    return fromCoordinate(type, source, "Generic background variant replaced by semantic surface or reviewable ts coordinate.");
  }

  const walkable = /^walkable-variant-(\d{2})$/.exec(type);
  if (walkable) {
    const value = Number(walkable[1]);
    if (value < 1 || value > 52) return undefined;
    const source = coordinateFromByte(0x60 + value - 1);
    return fromCoordinate(type, source, "Generic walkable variant replaced by documented surface identity.");
  }

  return undefined;
}

function fromTs(from: string, row: number, column: number, note: string): EntityMapMigrationAlias {
  return fromCoordinate(from, { row, column }, note);
}

function fromCoordinate(from: string, source: TsCoordinate, note: string): EntityMapMigrationAlias {
  const mapping = surfaceMappingForTs(source.row, source.column);
  return {
    from,
    to: mapping?.type ?? coordinateSurfaceType(source.row, source.column),
    ...(mapping?.fields ? { fields: mapping.fields } : {}),
    disposition: "rename",
    note: `${note} Source: ${tsLabel(source)}.`,
  };
}

function coordinateFromByte(byte: number): TsCoordinate {
  return { row: Math.floor(byte / 16) + 1, column: (byte % 16) + 1 };
}

function rename(
  from: string,
  to: MapEntityType,
  fields: Readonly<Record<string, JsonPrimitive>>,
  note: string,
): EntityMapMigrationAlias {
  return { from, to, fields, disposition: "rename", note };
}

function runtimeOnly(from: string, note: string): EntityMapMigrationAlias {
  return { from, disposition: "runtime-only", note };
}
