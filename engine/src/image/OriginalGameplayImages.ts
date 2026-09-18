import {
  ImageManager,
  type ImageSliceDefinition,
} from "./ImageManager.js";

export const ORIGINAL_GAMEPLAY_IMAGE_IDS = {
  entityAtlas: "entity-atlas",
  animatedTiles: "original-animated-tiles",
  bobby: {
    move: {
      left: "bobby-left",
      right: "bobby-right",
      up: "bobby-up",
      down: "bobby-down",
    },
    idle: "bobby-idle",
    death: "bobby-death",
    transition: "bobby-transition",
    mower: "bobby-mower",
    snowplow: "bobby-snowplow",
    kite: "bobby-kite",
    speedTrail: "bobby-speed-trail",
  },
  dragonFireball: "dragon-fireball",
  ambientButterfly: "ambient-butterfly",
  hudAtlas: "hud-atlas",
  goldenCarrot: "golden-carrot",
} as const;

export const ORIGINAL_GAMEPLAY_HUD_SLICE_IDS = {
  carrot: "hud-carrot",
  gas: "hud-gas",
  key: "hud-key",
  kite: "hud-kite",
  shovel: "hud-shovel",
  egg: "hud-egg",
  bean: "hud-bean",
} as const;

export const ORIGINAL_GAMEPLAY_IMAGE_FILES = {
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.entityAtlas]: "ts.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.animatedTiles]: "ta.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.move.left]: "b0.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.move.right]: "b1.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.move.up]: "b2.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.move.down]: "b3.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.idle]: "b4.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.death]: "b5.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.transition]: "b6.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.mower]: "b7.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.snowplow]: "b8.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.kite]: "b9.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.speedTrail]: "mow.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.dragonFireball]: "hud.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.ambientButterfly]: "bf.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.hudAtlas]: "hud.png",
  [ORIGINAL_GAMEPLAY_IMAGE_IDS.goldenCarrot]: "icon.png",
} as const;

export type OriginalGameplayImageFile =
  (typeof ORIGINAL_GAMEPLAY_IMAGE_FILES)[keyof typeof ORIGINAL_GAMEPLAY_IMAGE_FILES];

export const ORIGINAL_GAMEPLAY_IMAGE_SLICES = {
  [ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.carrot]: hudSlice(42, 39),
  [ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.gas]: hudSlice(83, 37),
  [ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.key]: hudSlice(122, 20),
  [ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.kite]: hudSlice(144, 35),
  [ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.shovel]: hudSlice(179, 37),
  [ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.egg]: hudSlice(217, 29),
  [ORIGINAL_GAMEPLAY_HUD_SLICE_IDS.bean]: hudSlice(247, 35),
} satisfies Readonly<Record<string, ImageSliceDefinition>>;

/**
 * 宿主只决定资源根地址；Engine 维护内置 gameplay 视觉所需的完整语义资源合同。
 */
export function createOriginalGameplayImageManager(
  resolveUrl: (file: OriginalGameplayImageFile) => string,
): ImageManager {
  const sources = Object.fromEntries(
    Object.entries(ORIGINAL_GAMEPLAY_IMAGE_FILES).map(([id, file]) => [
      id,
      resolveUrl(file),
    ]),
  );
  return new ImageManager({
    atlas: ORIGINAL_GAMEPLAY_IMAGE_IDS.entityAtlas,
    sourceTileSize: 48,
    sources,
    slices: ORIGINAL_GAMEPLAY_IMAGE_SLICES,
  });
}

function hudSlice(x: number, width: number): ImageSliceDefinition {
  return {
    source: ORIGINAL_GAMEPLAY_IMAGE_IDS.hudAtlas,
    x,
    y: 0,
    width,
    height: 38,
  };
}
