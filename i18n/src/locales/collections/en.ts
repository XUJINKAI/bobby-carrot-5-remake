import type { CollectionTranslationKey } from "./zh-CN.js";

const catalog = {
  "collections.original.name": "Bobby Carrot 5",
  "collections.original.tag": "Original Levels",
  "collections.original.description":
    "400 regular levels, 80 bonus levels, and 5 special scenes from the original game.",

  "collections.robo2.name": "Robo 2",
  "collections.robo2.tag": "Laser Puzzles",
  "collections.robo2.description":
    "The 25 built-in levels from HeroCraft's 2004 J2ME puzzle game.",

  "collections.novoban-pushbox.name": "Novoban",
  "collections.novoban-pushbox.tag": "Sokoban",
  "collections.novoban-pushbox.description":
    "50 beginner-friendly Sokoban levels by François Marques with increasing difficulty.",

  "collections.loma-pushbox.name": "LOMA",
  "collections.loma-pushbox.tag": "Sokoban",
  "collections.loma-pushbox.description":
    "Levels Of Many Authors: 137 Sokoban maps with three boxes each.",

  "collections.engine-lab.name": "Engine Lab",
  "collections.engine-lab.tag": "Mechanics Lab",
  "collections.engine-lab.description":
    "Extension maps for experimenting with new Engine mechanics.",

  "collections.original-patch.name": "Original Patch",
  "collections.original-patch.tag": "Original Validation",
  "collections.original-patch.description":
    "Mechanics test maps used to generate original JAR validation builds.",
} satisfies Record<CollectionTranslationKey, string>;

export default catalog;
