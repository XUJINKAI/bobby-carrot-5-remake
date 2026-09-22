import type { ImageManager } from "./ImageManager.js";

export const ROBO2_GAMEPLAY_IMAGE_IDS = {
  emitter: {
    up: "robo2-emitter-up",
    right: "robo2-emitter-right",
    down: "robo2-emitter-down",
    left: "robo2-emitter-left",
  },
  mirror: {
    slash: "robo2-mirror-slash",
    backslash: "robo2-mirror-backslash",
  },
  bomb: "robo2-bomb",
  bombExplosion: "robo2-bomb-explosion",
  explosion: "robo2-explosion",
  stone: "robo2-stone",
} as const;

export const ROBO2_GAMEPLAY_IMAGE_FILES = {
  [ROBO2_GAMEPLAY_IMAGE_IDS.emitter.up]: "laserUp.png",
  [ROBO2_GAMEPLAY_IMAGE_IDS.emitter.right]: "laserRight.png",
  [ROBO2_GAMEPLAY_IMAGE_IDS.emitter.down]: "laserDown.png",
  [ROBO2_GAMEPLAY_IMAGE_IDS.emitter.left]: "laserLeft.png",
  [ROBO2_GAMEPLAY_IMAGE_IDS.mirror.slash]: "mirrorR.png",
  [ROBO2_GAMEPLAY_IMAGE_IDS.mirror.backslash]: "mirrorL.png",
  [ROBO2_GAMEPLAY_IMAGE_IDS.bomb]: "bombTickTick.png",
  [ROBO2_GAMEPLAY_IMAGE_IDS.bombExplosion]: "bombExplode.png",
  [ROBO2_GAMEPLAY_IMAGE_IDS.explosion]: "explosion.png",
  [ROBO2_GAMEPLAY_IMAGE_IDS.stone]: "stone.png",
} as const;

export type Robo2GameplayImageFile =
  (typeof ROBO2_GAMEPLAY_IMAGE_FILES)[keyof typeof ROBO2_GAMEPLAY_IMAGE_FILES];

/** 宿主决定资源根地址，Engine 只持有 Robo 2 gameplay 图片的语义身份。 */
export function registerRobo2GameplayImages(
  images: ImageManager,
  resolveUrl: (file: Robo2GameplayImageFile) => string,
): void {
  for (const [id, file] of Object.entries(ROBO2_GAMEPLAY_IMAGE_FILES)) {
    images.registerSource(id, resolveUrl(file));
  }
}
