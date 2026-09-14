import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const STANDARD_LEAVES = [
  [{ type: "collect-all", target: "carrot" }, "carrot"],
  [{ type: "fill-all", target: "egg-nest", filler: "filled-egg" }, "egg"],
  [{ type: "fill-all", target: "push-goal", filler: "pushable" }, "push-goal"],
  [{ type: "reach", target: "exit" }, "exit"],
  [{ type: "reach", target: "golden-carrot" }, "golden-carrot"],
];

function hasExactlyFields(condition, expected) {
  const keys = Object.keys(condition);
  return keys.length === Object.keys(expected).length &&
    keys.every((key) => Object.hasOwn(expected, key) && condition[key] === expected[key]);
}

/** 显式转换已知标准条件；自定义 selector 返回准确路径供人工审计。 */
export function convertLegacyWinCondition(condition, path = "rules.win") {
  if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
    throw new Error(`${path}: 条件必须是对象`);
  }
  if (condition.type === "all" || condition.type === "any") {
    if (Object.keys(condition).some((key) => key !== "type" && key !== "conditions")) {
      throw new Error(`${path}: 无法确定目标语义 ${JSON.stringify(condition)}`);
    }
    if (!Array.isArray(condition.conditions) || condition.conditions.length === 0) {
      throw new Error(`${path}.conditions: 必须为非空数组`);
    }
    return {
      type: condition.type,
      conditions: condition.conditions.map((child, index) =>
        convertLegacyWinCondition(child, `${path}.conditions[${index}]`)
      ),
    };
  }
  const type = STANDARD_LEAVES.find(([expected]) =>
    hasExactlyFields(condition, expected)
  )?.[1];
  if (!type) throw new Error(`${path}: 无法确定目标语义 ${JSON.stringify(condition)}`);
  return { type };
}

export function convertLegacyMapDocument(source) {
  const document = structuredClone(source);
  if (!document.rules?.win) throw new Error("rules.win: 地图缺少目标条件");
  document.rules.win = convertLegacyWinCondition(document.rules.win);
  return document;
}

export function convertLegacyReplay(source) {
  const replay = structuredClone(source);
  const completed = replay.finalState?.completedConditions;
  if (completed !== undefined) {
    if (!Array.isArray(completed)) {
      throw new Error("finalState.completedConditions: 必须为数组");
    }
    replay.finalState.completedConditions = completed.map((condition, index) =>
      convertLegacyWinCondition(condition, `finalState.completedConditions[${index}]`)
    );
  }
  return replay;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , input, output] = process.argv;
  if (!input || !output) {
    throw new Error("用法：node tools/model/convert-goals.mjs 输入.json 输出.json");
  }
  const source = JSON.parse(await readFile(input, "utf8"));
  const converted = source.formatVersion === 1
    ? convertLegacyReplay(source)
    : convertLegacyMapDocument(source);
  await writeFile(output, `${JSON.stringify(converted, null, 2)}\n`);
}
