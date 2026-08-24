import type { LevelMap } from '@bobby/model';
export type { LevelMap, LevelObject, ObjectType, TerrainType } from '@bobby/model';
/** Temporary compile bridge while World bonus-round archive coupling is migrated to session options. */
export type LevelData = LevelMap & { chapterLevel?: number };
