import { FactRegistry, type FactDefinition } from "./FactRegistry.js";

/** 供跨对象规则消费的共享语义；对象身份由 Type 查询。 */
export const builtinFactDefinitions: readonly FactDefinition[] = [
  { id: "blocking", description: "标准通行需要检查的阻挡部位" },
  { id: "climbable", description: "允许攀爬的部位" },
  { id: "contact-cover", description: "遮蔽较低接触层的部位" },
  { id: "elevated-obstacle", description: "占据高于地面的实体空间" },
  { id: "moving-platform", description: "可承载 Actor 的移动平台" },
  { id: "player", description: "ActorLifecycle 识别的可控角色" },
  { id: "pushable", description: "可由推机制考虑的部位" },
  { id: "sky", description: "天空地形，供 Cloud 与 Fireball 查询" },
  { id: "walkable", description: "标准通行可落脚的部位" },
  { id: "water", description: "水面部位" },
];

export function createBuiltinFactRegistry(): FactRegistry {
  const registry = new FactRegistry();
  registry.registerAll(builtinFactDefinitions);
  return registry;
}
