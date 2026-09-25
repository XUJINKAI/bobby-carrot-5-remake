import type { SurfaceTerrainId, SurfaceTheme } from "@bobby/editor";
import { webT, type WebTranslationKey } from "../../i18n/webI18n.js";

const terrainKeys = {
  water: "editor.terrain.water",
  waterfall: "editor.terrain.waterfall",
  starfield: "editor.terrain.starfield",
  moon: "editor.terrain.moon",
  "snow-cloud": "editor.terrain.snowCloud",
  grass: "editor.terrain.grass",
  fence: "editor.terrain.fence",
  hedge: "editor.terrain.hedge",
  tree: "editor.terrain.tree",
  "stone-wall": "editor.terrain.stoneWall",
  stump: "editor.terrain.stump",
  "flower-pot": "editor.terrain.flowerPot",
  stone: "editor.terrain.stone",
  mushroom: "editor.terrain.mushroom",
  snowman: "editor.terrain.snowman",
  "christmas-cane": "editor.terrain.christmasCane",
  "christmas-tree": "editor.terrain.christmasTree",
  "snow-fence": "editor.terrain.snowFence",
  "snow-rock": "editor.terrain.snowRock",
  cactus: "editor.terrain.cactus",
  sand: "editor.terrain.sand",
  ice: "editor.terrain.ice",
} satisfies Record<SurfaceTerrainId, WebTranslationKey>;

const themeKeys = {
  mixed: "editor.theme.mixed",
  forest: "editor.theme.forest",
  snow: "editor.theme.snow",
  desert: "editor.theme.desert",
  space: "editor.theme.space",
} satisfies Record<SurfaceTheme, WebTranslationKey>;

const surfaceGroupKeys: Record<string, WebTranslationKey> = {
  forest: "editor.surfaceGroup.forest",
  "water-space": "editor.surfaceGroup.waterSpace",
  snow: "editor.surfaceGroup.snow",
};

const paletteGroupKeys: Record<string, WebTranslationKey> = {
  objective: "editor.paletteGroup.objective",
  mechanism: "editor.paletteGroup.mechanism",
  shop: "editor.paletteGroup.shop",
  ungrouped: "editor.paletteGroup.ungrouped",
};

export function editorTerrainLabel(id: SurfaceTerrainId): string {
  return webT(terrainKeys[id]);
}

export function editorThemeLabel(id: SurfaceTheme): string {
  return webT(themeKeys[id]);
}

export function editorSurfaceGroupLabel(id: string, fallback: string): string {
  const key = surfaceGroupKeys[id];
  return key ? webT(key) : fallback;
}

export function editorPaletteGroupLabel(id: string, fallback: string): string {
  const key = paletteGroupKeys[id];
  return key ? webT(key) : fallback;
}
