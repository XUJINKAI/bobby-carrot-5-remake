/** Behavior 只能观察已提交状态；返回值与 World 持有的可变对象断开引用。 */
export function readonlyView<T>(value: T): T {
  return freezeTree(structuredClone(value));
}

function freezeTree<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  for (const child of Object.values(value)) freezeTree(child);
  return Object.freeze(value);
}
