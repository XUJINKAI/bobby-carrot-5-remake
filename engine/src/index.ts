export { Game, type GameOptions } from './core/Game.js';
export { InputController } from './input/InputController.js';
export { NullAudioBackend, type AudioBackend } from './audio/AudioBackend.js';
export { fetchJson, type LevelData, type LevelCatalog, type CatalogLevel, type LevelObject, type LevelSource } from './data/types.js';
export { type Direction, DIRECTIONS, terrainPassage, canEnterTile } from './mechanics/registry.js';
export { type TileInspection, type MoveResult, type Point } from './world/World.js';

export { Terrain, ObjectId, EMPTY_OBJECT, signedByte, hexByte, type Direction as MechanicDirection } from './mechanics/ids.js';
