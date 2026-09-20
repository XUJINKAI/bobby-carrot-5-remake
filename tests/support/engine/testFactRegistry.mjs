import { createBuiltinFactRegistry } from "../../../engine/dist/fact/builtinFacts.js";

/** 测试对象的专用 Fact 由用例显式声明，正式词汇仍取自内置目录。 */
export function testFactRegistry(...ids) {
  const registry = createBuiltinFactRegistry();
  for (const id of ids) {
    registry.register({ id, description: `测试 Fact：${id}` });
  }
  return registry;
}
