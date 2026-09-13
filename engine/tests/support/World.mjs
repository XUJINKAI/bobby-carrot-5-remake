import { composeWorldOptions } from "../../dist/entities/WorldComposition.js";
import { World as WorldKernel } from "../../dist/world/World.js";

/** 测试复用正式组合入口，同时允许为单例测试注入局部 Registry。 */
export class World extends WorldKernel {
  constructor(level, options = {}) {
    super(level, composeWorldOptions(options));
  }
}
