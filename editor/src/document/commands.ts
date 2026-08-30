import type {
  Direction,
  EntityProperties,
  EntityState,
  EntityTraits,
  LevelEntity,
  LevelLimit,
  WinCondition,
} from "@bobby/model";
import {
  normalizeEditorLevel,
  resizeEditorLevel,
} from "../level/editorLevel.js";
import type { EditorMap, EntityRef } from "../level/types.js";

export interface EditorCommand {
  apply(level: EditorMap): EditorMap;
}

export interface EditorEntityReplacement {
  ref: EntityRef;
  entity: LevelEntity;
}

export function addEntity(entity: LevelEntity): EditorCommand {
  return addEntities([entity]);
}

export function addEntities(entities: readonly LevelEntity[]): EditorCommand {
  return command((level) =>
    normalizeEditorLevel({
      ...level,
      entities: [
        ...level.entities,
        ...entities.map((entity) => structuredClone(entity)),
      ],
    }),
  );
}

export function removeEntity(ref: EntityRef): EditorCommand {
  return removeEntities([ref]);
}

export function removeEntities(refs: readonly EntityRef[]): EditorCommand {
  return command((level) => {
    const removed = new Set(
      refs
        .map((ref) => ref.index)
        .filter(
          (index) =>
            Number.isInteger(index) &&
            index >= 0 &&
            index < level.entities.length,
        ),
    );
    if (removed.size === 0) return level;
    return {
      ...level,
      entities: level.entities.filter((_, index) => !removed.has(index)),
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
  return replaceEntities([{ ref, entity: replacement }]);
}

export function replaceEntities(
  replacements: readonly EditorEntityReplacement[],
): EditorCommand {
  return command((level) => {
    if (replacements.length === 0) return level;
    const entities = [...level.entities];
    let changed = false;
    for (const replacement of replacements) {
      if (!hasEntity(level, replacement.ref)) continue;
      entities[replacement.ref.index] = structuredClone(replacement.entity);
      changed = true;
    }
    return changed
      ? normalizeEditorLevel({ ...level, entities })
      : level;
  });
}

/** Reorder one cell's Entity stack. Input order is top-most first. */
export function reorderEntityStack(
  refsTopToBottom: readonly EntityRef[],
): EditorCommand {
  return command((level) => {
    const unique = [
      ...new Map(refsTopToBottom.map((ref) => [ref.index, ref])).values(),
    ].filter((ref) => hasEntity(level, ref));
    if (unique.length < 2) return level;
    const entities = [...level.entities];
    unique.forEach((ref, index) => {
      entities[ref.index] = {
        ...entities[ref.index]!,
        stackOrder: (unique.length - index - 1) * 1000,
      };
    });
    return normalizeEditorLevel({ ...level, entities });
  });
}

export function updateMetadata(metadata: {
  name: string;
  author?: string;
  description?: string;
}): EditorCommand {
  return command((level) => {
    const next: EditorMap = { ...level, name: metadata.name };
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

export function updateWinCondition(value: WinCondition | null): EditorCommand {
  return command((level) => {
    const rules = { ...(level.rules ?? {}) };
    if (value) rules.win = structuredClone(value);
    else delete rules.win;
    return normalizeEditorLevel({ ...level, rules });
  });
}

export function updateMaxMoves(value: number | null): EditorCommand {
  return updateLimit(
    "max-moves",
    value !== null && Number.isInteger(value) && value > 0
      ? { type: "max-moves", moves: value }
      : null,
  );
}

export function updateMaxTimeSeconds(value: number | null): EditorCommand {
  return updateLimit(
    "max-time-seconds",
    value !== null && Number.isInteger(value) && value > 0
      ? { type: "max-time-seconds", seconds: value }
      : null,
  );
}

function updateLimit(
  type: LevelLimit["type"],
  value: LevelLimit | null,
): EditorCommand {
  return command((level) => {
    const limits = (level.rules?.limits ?? []).filter(
      (limit) => limit.type !== type,
    );
    if (value) limits.push(value);
    const rules = { ...(level.rules ?? {}) };
    if (limits.length > 0) rules.limits = limits;
    else delete rules.limits;
    return normalizeEditorLevel({ ...level, rules });
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

function hasEntity(level: EditorMap, ref: EntityRef): boolean {
  return (
    Number.isInteger(ref.index) &&
    ref.index >= 0 &&
    ref.index < level.entities.length
  );
}

function command(
  apply: (level: EditorMap) => EditorMap,
): EditorCommand {
  return { apply };
}
