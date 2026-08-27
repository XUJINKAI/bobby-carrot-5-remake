import type { EntityModule } from "../EntityModule.js";
import { beaver } from "./beaver.js";
import { bobby } from "./bobby.js";
import { carousel } from "./carousel.js";
import { carouselSwitch } from "./carousel-switch.js";
import { colorPinkBlock } from "./color-pink-block.js";
import { colorPinkSwitch } from "./color-pink-switch.js";
import { colorYellowBlock } from "./color-yellow-block.js";
import { colorYellowSwitch } from "./color-yellow-switch.js";
import { dragon } from "./dragon.js";
import { dreamMachine } from "./dream-machine.js";
import { fence } from "./fence.js";
import { iceBlock } from "./ice-block.js";
import { mirror } from "./mirror.js";
import { sandman } from "./sandman.js";
import { speed } from "./speed.js";
import { speedSwitch } from "./speed-switch.js";
import {
  staticContentModules,
  staticCoverModules,
  staticSurfaceModules,
} from "./static-catalog.js";
import { tide } from "./tide.js";
import { tideSwitch } from "./tide-switch.js";
import { trap } from "./trap.js";
import { originalVariantModules } from "./variants.js";
import { windSwitch } from "./wind-switch.js";

export const originalEntityModules: readonly EntityModule[] = [
  ...staticSurfaceModules,
  tide,
  tideSwitch,
  speedSwitch,
  carouselSwitch,
  windSwitch,
  trap,
  mirror,
  speed,
  carousel,
  colorYellowSwitch,
  colorPinkSwitch,
  colorYellowBlock,
  colorPinkBlock,
  ...staticCoverModules,
  iceBlock,
  bobby,
  ...staticContentModules,
  dragon,
  sandman,
  dreamMachine,
  beaver,
  fence,
  ...originalVariantModules,
];
