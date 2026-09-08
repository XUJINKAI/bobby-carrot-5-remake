import type { EntityModule } from "../EntityModule.js";
import { beaver } from "./beaver.js";
import { beanField } from "./bean-field.js";
import { carousel } from "./carousel.js";
import { carouselSwitch } from "./carousel-switch.js";
import { colorBlock } from "./color-block.js";
import { colorSwitch } from "./color-switch.js";
import { dragon } from "./dragon.js";
import { dreamMachine } from "./dream-machine.js";
import { fence } from "./fence.js";
import { fireball } from "./fireball.js";
import { landing, whirlwind } from "./flight.js";
import { ice } from "./ice.js";
import { iceBlock } from "./ice-block.js";
import { lock } from "./lock.js";
import { mirror } from "./mirror.js";
import { cloud, cloudParking, leaf } from "./moving-entities.js";
import { crumblyRock, mower, mowerParkingTile, pushableRock } from "./mower.js";
import { plank } from "./plank.js";
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
  mowerParkingTile,
  ice,
  tide,
  tideSwitch,
  speedSwitch,
  carouselSwitch,
  windSwitch,
  trap,
  mirror,
  speed,
  carousel,
  colorSwitch,
  colorBlock,
  ...staticCoverModules,
  plank,
  iceBlock,
  ...staticContentModules,
  cloud,
  cloudParking,
  leaf,
  mower,
  crumblyRock,
  pushableRock,
  whirlwind,
  landing,
  beanField,
  lock,
  dragon,
  fireball,
  sandman,
  dreamMachine,
  beaver,
  fence,
  ...originalVariantModules,
];
