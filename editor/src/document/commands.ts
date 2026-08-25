import {
  objectVariantCycle,
  transformObjectVariant,
  type ObjectType,
  type TerrainType,
} from "@bobby/engine";
import type { LevelObjectProperties } from "@bobby/model";
import {
  normalizeEditorLevel,
  resizeEditorLevel,
} from "../level/editorLevel.js";
import type { EditorLevel } from "../level/types.js";
import {
  intersectingOwners,
  objectCells,
  resolveObjectOwner,
  type Cell,
} from "../authoring/objectOwners.js";
import {
  anchorForCursor,
  placementCells,
  placementFits,
} from "../authoring/objectPlacement.js";

export interface EditorCommand {
  apply(level: EditorLevel): EditorLevel;
}

export function paintTerrain(
  cell: Cell,
  type: TerrainType,
): EditorCommand {
  return command((level) => {
    if (!inside(level, cell) || level.terrain[cell.y]![cell.x] === type)
      return level;
    const terrain = level.terrain.map((row) => [...row]);
    terrain[cell.y]![cell.x] = type;
    return { ...level, terrain };
  });
}

export function placeObject(cell: Cell, type: ObjectType): EditorCommand {
  return command((level) => {
    if (!placementFits(level, type, cell)) return level;
    const cells = placementCells(type, cell);
    const owners = intersectingOwners(level, cells);
    const anchor = anchorForCursor(type, cell);
    if (
      owners.length === 1 &&
      owners[0]?.type === type &&
      owners[0].x === anchor.x &&
      owners[0].y === anchor.y
    )
      return level;
    const removed = new Set(owners);
    return normalizeEditorLevel({
      ...level,
      objects: [
        ...level.objects.filter((object) => !removed.has(object)),
        { type, x: anchor.x, y: anchor.y },
      ],
    });
  });
}

export function removeObject(cell: Cell): EditorCommand {
  return command((level) => {
    const owner = resolveObjectOwner(level, cell.x, cell.y)?.object;
    if (!owner) return level;
    return { ...level, objects: level.objects.filter((item) => item !== owner) };
  });
}

export function transformObject(cell: Cell, step: number): EditorCommand {
  return command((level) => {
    const owner = resolveObjectOwner(level, cell.x, cell.y)?.object;
    if (!owner || !objectVariantCycle(owner.type)) return level;
    const type = transformObjectVariant(owner.type, step);
    if (!type) return level;
    const replacement = { ...owner, type };
    const cells = objectCells(replacement);
    if (cells.some((part) => !inside(level, part))) return level;
    const withoutOwner = {
      ...level,
      objects: level.objects.filter((item) => item !== owner),
    };
    if (intersectingOwners(withoutOwner, cells).length > 0) return level;
    return normalizeEditorLevel({
      ...withoutOwner,
      objects: [...withoutOwner.objects, replacement],
    });
  });
}

export function updateObjectProperty(
  anchor: Cell,
  key: string,
  value: string,
): EditorCommand {
  return command((level) => {
    const index = level.objects.findIndex(
      (object) => object.x === anchor.x && object.y === anchor.y,
    );
    if (index < 0) return level;
    const object = level.objects[index]!;
    const properties: LevelObjectProperties = { ...object.properties };
    if (value) properties[key] = value;
    else delete properties[key];
    const objects = [...level.objects];
    const { properties: _previousProperties, ...base } = object;
    objects[index] = Object.keys(properties).length > 0
      ? { ...base, properties }
      : base;
    return normalizeEditorLevel({ ...level, objects });
  });
}

export function updateObjectTrait(
  anchor: Cell,
  trait: string,
  enabled: boolean,
): EditorCommand {
  return command((level) => {
    const index = level.objects.findIndex(
      (object) => object.x === anchor.x && object.y === anchor.y,
    );
    if (index < 0) return level;
    const object = level.objects[index]!;
    const traits = new Set(object.traits ?? []);
    if (enabled) traits.add(trait);
    else traits.delete(trait);
    const objects = [...level.objects];
    const { traits: _previousTraits, ...base } = object;
    objects[index] = traits.size > 0
      ? { ...base, traits: [...traits] }
      : base;
    return normalizeEditorLevel({ ...level, objects });
  });
}

export function updateMetadata(metadata: {
  name: string;
  author?: string;
  description?: string;
}): EditorCommand {
  return command((level) => {
    const next: EditorLevel = {
      ...level,
      name: metadata.name,
    };
    if (metadata.author) next.author = metadata.author;
    else delete next.author;
    if (metadata.description) next.description = metadata.description;
    else delete next.description;
    return normalizeEditorLevel(next);
  });
}

export function resizeDocument(width: number, height: number): EditorCommand {
  return command((level) => resizeEditorLevel(level, width, height));
}

export function updateMaxMoves(value: number | null): EditorCommand {
  return command((level) => {
    const next = { ...level };
    if (value !== null && Number.isInteger(value) && value > 0)
      next.rules = { ...level.rules, maxMoves: value };
    else delete next.rules;
    return normalizeEditorLevel(next);
  });
}

function command(apply: (level: EditorLevel) => EditorLevel): EditorCommand {
  return { apply };
}

function inside(level: EditorLevel, cell: Cell): boolean {
  return (
    cell.x >= 0 &&
    cell.y >= 0 &&
    cell.x < level.width &&
    cell.y < level.height
  );
}
