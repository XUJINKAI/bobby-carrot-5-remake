import { FactRegistry, type FactDefinition } from "./FactRegistry.js";

/** 供跨对象规则消费的共享语义；对象身份由 Type 查询。 */
export const builtinFactDefinitions: readonly FactDefinition[] = [
  { id: "bean-growth-space", description: "允许豆蔓生长的空间" },
  { id: "blocking", description: "标准通行需要检查的阻挡部位" },
  { id: "climbable", description: "允许攀爬的部位" },
  { id: "cloud-space", description: "云可经过的空间" },
  { id: "collectible", description: "可计入收集目标的对象" },
  { id: "egg-nest", description: "可接纳蛋的目标格" },
  { id: "filled-egg", description: "当前已填充的蛋目标" },
  { id: "hidden-objective", description: "被覆盖的目标格" },
  { id: "meltable", description: "可被融化的对象" },
  { id: "moving-platform", description: "可承载 Actor 的移动平台" },
  { id: "player", description: "ActorLifecycle 识别的可控角色" },
  { id: "pushable", description: "可由推机制考虑的部位" },
  { id: "reach-all-players", description: "到达目标需所有玩家满足" },
  { id: "ride-carried", description: "骑乘时随角色移动的对象" },
  { id: "terrain-overlay", description: "覆盖地形的部位" },
  { id: "walkable", description: "标准通行可落脚的部位" },
  { id: "water", description: "水面部位" },
];

export function createBuiltinFactRegistry(): FactRegistry {
  const registry = new FactRegistry();
  registry.registerAll(builtinFactDefinitions);
  return registry;
}
