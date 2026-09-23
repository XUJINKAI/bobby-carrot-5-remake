import type { CollectionTranslationKey } from "./zh-CN.js";

const catalog = {
  "collections.original.name": "Bobby Carrot 5",
  "collections.original.tag": "Original Levels",
  "collections.original.description":
    "400 regular levels, 80 bonus levels, and 5 special scenes from the original game.",
  "collections.original.filters.targets.name": "Targets",
  "collections.original.filters.targets.options.carrot": "Carrot",
  "collections.original.filters.targets.options.egg": "Egg",
  "collections.original.filters.target-count.name": "Target Count",
  "collections.original.filters.target-count.options.0-10": "0-10",
  "collections.original.filters.target-count.options.11-20": "11-20",
  "collections.original.filters.target-count.options.21-40": "21-40",
  "collections.original.filters.target-count.options.41-60": "41-60",
  "collections.original.filters.target-count.options.61+": "61+",
  "collections.original.filters.scenes.name": "Scenes",
  "collections.original.filters.scenes.options.grassland": "Grassland",
  "collections.original.filters.scenes.options.water": "Water",
  "collections.original.filters.scenes.options.snow": "Snow",
  "collections.original.filters.scenes.options.starfield": "Starfield",
  "collections.original.filters.scenes.options.desert": "Desert",
  "collections.original.filters.mechanics.name": "Items & Mechanics",
  "collections.original.filters.mechanics.options.speed": "Speed Belt",
  "collections.original.filters.mechanics.options.mower": "Mower / High Grass",
  "collections.original.filters.mechanics.options.highgrass": "High Grass",
  "collections.original.filters.mechanics.options.crumblyrock": "Crumbly Rock",
  "collections.original.filters.mechanics.options.bean": "Magic Bean",
  "collections.original.filters.mechanics.options.shovel": "Shovel / Snow",
  "collections.original.filters.mechanics.options.kite": "Kite / Whirlwind",
  "collections.original.filters.mechanics.options.tide": "Tide",
  "collections.original.filters.mechanics.options.leaf": "Leaf",
  "collections.original.filters.mechanics.options.color": "Color Blocks",
  "collections.original.filters.mechanics.options.carousel": "Carousel",
  "collections.original.filters.mechanics.options.dragon":
    "Dragon / Mirror / Ice Block",
  "collections.original.filters.mechanics.options.wind": "Windmill / Cloud",
  "collections.original.filters.mechanics.options.trap": "Trap",
  "collections.original.filters.mechanics.options.plank": "Plank",

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
