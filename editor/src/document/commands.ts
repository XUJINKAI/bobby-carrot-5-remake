import type {
  Direction,
  EntityProperties,
  EntityState,
  EntityTraits,
  LevelEntity,
} from "@bobby/model";
import {
  normalizeEditorLevel,
  resizeEditorLevel,
} from "../level/editorLevel.js";
import type { EditorLevel, EntityRef } from "../level/types.js";

export interface EditorCommand {
  apply(level: EditorLevel): EditorLevel;
}

/** Document 原子操作；Authoring placement/occupancy 在上层解析后调用它。 */
export function addEntity(entity: LevelEntity): EditorCommand {
  return command((level) =>
    normalizeEditorLevel({
      ...level,
      entities: [...level.entities, structuredClone(entity)],
    }),
  );
}

export function removeEntity(ref: EntityRef): EditorCommand {
  return command((level) => {
    if (!hasEntity(level, ref)) return level;
    return {
      ...level,
      entities: level.entities.filter((_, index) => index !== ref.index),
    };
  });
}

export function moveEntity(
  ref: EntityRef,
  x: number,
  y: number,
): EditorCommand {
  return updateEntity(ref, (entity) => ({
    ...entity,
    x: Math.trunc(x),
    y: Math.trunc(y),
  }));
}

export function setEntityDirection(
  ref: EntityRef,
  direction: Direction | undefined,
): EditorCommand {
  return updateEntity(ref, (entity) => {
    const next = { ...entity };
    if (direction) next.direction = direction;
    else delete next.direction;
    return next;
  });
}

export function updateEntityProperties(
  ref: EntityRef,
  properties: EntityProperties | undefined,
): EditorCommand {
  return updateEntity(ref, (entity) => {
    const next = { ...entity };
    if (properties && Object.keys(properties).length > 0)
      next.properties = structuredClone(properties);
    else delete next.properties;
    return next;
  });
}

export function updateEntityState(
  ref: EntityRef,
  state: EntityState | undefined,
): EditorCommand {
  return updateEntity(ref, (entity) => {
    const next = { ...entity };
    if (state && Object.keys(state).length > 0)
      next.state = structuredClone(state);
    else delete next.state;
    return next;
  });
}

export function updateEntityTraits(
  ref: EntityRef,
  traits: EntityTraits | undefined,
): EditorCommand {
  return updateEntity(ref, (entity) => {
    const next = { ...entity };
    const unique = traits ? [...new Set(traits)] : [];
    if (unique.length > 0) next.traits = unique;
    else delete next.traits;
    return next;
  });
}

export function replaceEntity(
  ref: EntityRef,
  replacement: LevelEntity,
): EditorCommand {
  return updateEntity(ref, () => structuredClone(replacement));
}

export function updateMetadata(metadata: {
  name: string;
  author?: string;
  description?: string;
}): EditorCommand {
  return command((level) => {
    const next: EditorLevel = { ...level, name: metadata.name };
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
    const rules = { ...level.rules };
    if (value !== null && Number.isInteger(value) && value > 0)
      rules.maxMoves = value;
    else delete rules.maxMoves;
    const next = { ...level };
    if (Object.keys(rules).length > 0) next.rules = rules;
    else delete next.rules;
    return normalizeEditorLevel(next);
  });
}

function updateEntity(
  ref: EntityRef,
  update: (entity: LevelEntity) => LevelEntity,
): EditorCommand {
  return command((level) => {
    if (!hasEntity(level, ref)) return level;
    const entities = [...level.entities];
    entities[ref.index] = update(entities[ref.index]!);
    return normalizeEditorLevel({ ...level, entities });
  });
}

function hasEntity(level: EditorLevel, ref: EntityRef): boolean {
  return Number.isInteger(ref.index) && ref.index >= 0 && ref.index < level.entities.length;
}

function command(apply: (level: EditorLevel) => EditorLevel): EditorCommand {
  return { apply };
}
