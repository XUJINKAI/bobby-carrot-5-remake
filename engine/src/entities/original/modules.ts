import type { EntityModule } from "../EntityModule.js";
import { beaver } from "./beaver.js";
import { beanField } from "./bean-field.js";
import { carousel } from "./carousel.js";
import { carouselSwitch } from "./carousel-switch.js";
import { carrot } from "./carrot.js";
import { cloud } from "./cloud.js";
import { cloudParking } from "./cloud-parking.js";
import { colorBlock } from "./color-block.js";
import { colorSwitch } from "./color-switch.js";
import { dragon } from "./dragon.js";
import { dreamMachine } from "./dream-machine.js";
import { egg } from "./egg.js";
import { exit } from "./exit.js";
import { fence } from "./fence.js";
import { fireball } from "./fireball.js";
import { landing, whirlwind } from "./flight.js";
import { highGrass } from "./high-grass.js";
import { ice } from "./ice.js";
import { iceBlock } from "./ice-block.js";
import { lock, timedChallenge } from "./lock.js";
import { lockKey } from "./lock-key.js";
import { leaf } from "./leaf.js";
import { mirror } from "./mirror.js";
import { crumblyRock, mower, mowerParkingTile } from "./mower.js";
import { plank } from "./plank.js";
import { sandman } from "./sandman.js";
import { snow } from "./snow.js";
import { speed } from "./speed.js";
import { speedSwitch } from "./speed-switch.js";
import {
  staticContentModules,
  staticSurfaceModules,
} from "./static-catalog.js";
import { tide } from "./tide.js";
import { tideSwitch } from "./tide-switch.js";
import { trap } from "./trap.js";
import { originalVariantModules } from "./variants.js";
import { windSwitch } from "./wind-switch.js";
import { windmill } from "./windmill.js";

export const originalEntityModules: readonly EntityModule[] = [
  ...staticSurfaceModules,
  exit,
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
  highGrass,
  snow,
  plank,
  iceBlock,
  carrot,
  egg,
  windmill,
  ...staticContentModules,
  cloud,
  cloudParking,
  leaf,
  mower,
  crumblyRock,
  whirlwind,
  landing,
  beanField,
  lockKey,
  lock,
  timedChallenge,
  dragon,
  fireball,
  sandman,
  dreamMachine,
  beaver,
  fence,
  ...originalVariantModules,
];
