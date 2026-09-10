import assert from "node:assert/strict";
import test from "node:test";
import {
  levelEntityContractIssues,
  parseLevelMap,
  parseMapDocument,
} from "../../model/dist/index.js";

function documentWith(entities) {
  return {
    schemaVersion: 1,
    meta: { name: "合同测试" },
    width: 3,
    height: 3,
    entities,
  };
}

test("egg 实体与填充规则使用稳定合同", () => {
  const document = {
    ...documentWith([{ type: "egg", x: 1, y: 1 }]),
    rules: { win: { type: "fill-all", target: "egg-nest", filler: "filled-egg" } },
  };
  assert.deepEqual(parseMapDocument(document), document);
});

test("Map parser 接受 canonical Entity 和显式 Surface variant", () => {
  const document = documentWith([
    { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
    { type: "water", x: 1, y: 0, variant: "ripple" },
    { type: "sandman", x: 1, y: 1, dialogue: "测试对白" },
    { type: "beaver", x: 2, y: 0, dialogue: "欢迎" },
    { type: "dream-machine", x: 2, y: 1, dialogue: "做个好梦" },
  ]);
  assert.deepEqual(parseMapDocument(document), document);
});

test("Portal 接受任意非空 channel、hex color 与常用颜色别名", () => {
  for (const color of ["#fff", "#12aBcF", "cyan", "orange"]) {
    const document = documentWith([
      { type: "portal", x: 1, y: 1, channel: "secret-room", color },
    ]);
    assert.deepEqual(parseMapDocument(document), document);
  }
  assert.deepEqual(
    levelEntityContractIssues({
      type: "portal",
      x: 1,
      y: 1,
      channel: "",
      color: "#fff",
    }),
    ["字段 channel 不符合 string 合同"],
  );
  assert.deepEqual(
    levelEntityContractIssues({
      type: "portal",
      x: 1,
      y: 1,
      channel: "secret",
      color: "tealish",
    }),
    ["字段 color 不符合 string 合同"],
  );
});

test("Map parser 保留未知 Entity，并报告已知 Entity 字段问题", () => {
  assert.deepEqual(
    parseMapDocument(documentWith([
      { type: "future-mechanic", x: 0, y: 0, mode: "preview" },
    ])),
    documentWith([
      { type: "future-mechanic", x: 0, y: 0, mode: "preview" },
    ]),
  );
  assert.deepEqual(
    parseMapDocument(documentWith([
      { type: "future-mechanic", x: 0, y: 0, config: {} },
    ])).entities[0],
    {
      type: "future-mechanic",
      x: 0,
      y: 0,
      config: "{}",
      __invalidJsonFields: "config",
    },
  );
  assert.deepEqual(
    levelEntityContractIssues({
      type: "grass",
      x: 0,
      y: 0,
      variant: "ts-10-1",
      mystery: true,
    }),
    ["字段 mystery 未声明"],
  );
  assert.deepEqual(
    levelEntityContractIssues({
      type: "grass",
      x: 0,
      y: 0,
      variant: "wrong",
    }),
    ["字段 variant 不符合 enum 合同"],
  );
});

test("类型专属字段只对声明它的 Entity 生效", () => {
  const windmill = documentWith([
    { type: "windmill", x: 0, y: 0, direction: "down" },
  ]);
  assert.deepEqual(parseMapDocument(windmill), windmill);
  const controlledBobby = documentWith([{
    type: "bobby",
    x: 0,
    y: 0,
    controller: "channel-2",
    mirrorX: true,
    mirrorY: true,
  }]);
  assert.deepEqual(parseMapDocument(controlledBobby), controlledBobby);
  assert.deepEqual(
    levelEntityContractIssues({
      type: "bobby",
      x: 0,
      y: 0,
      direction: "down",
    }),
    ["字段 direction 未声明"],
  );
  assert.deepEqual(
    levelEntityContractIssues({
      type: "bobby",
      x: 0,
      y: 0,
      controller: "secondary",
    }),
    ["字段 controller 不符合 enum 合同"],
  );
});

test("LevelMap parser 校验 MapDocument 后只返回 gameplay 字段", () => {
  const document = documentWith([
    { type: "water", x: 1, y: 2, variant: "ripple" },
  ]);
  assert.deepEqual(parseLevelMap(document), {
    schemaVersion: 1,
    width: 3,
    height: 3,
    entities: [{ type: "water", x: 1, y: 2, variant: "ripple" }],
  });
});

test("Map parser 校验坐标、规则树和文档 metadata", () => {
  assert.throws(
    () =>
      parseMapDocument(
        documentWith([{ type: "water", x: 3, y: 0, variant: "ripple" }]),
      ),
    /坐标.*超出/,
  );
  assert.throws(
    () =>
      parseMapDocument({
        ...documentWith([]),
        rules: { win: { type: "reach", target: "" } },
      }),
    /target 必须为非空字符串/,
  );
  assert.throws(
    () => parseMapDocument({ ...documentWith([]), meta: { name: "" } }),
    /meta.name 必须为非空字符串/,
  );
  assert.throws(
    () =>
      parseMapDocument({
        ...documentWith([]),
        meta: { name: "合同测试", description: "旧字段" },
      }),
    /不允许字段 description/,
  );
  assert.deepEqual(
    parseMapDocument({ ...documentWith([]), note: "作者注记" }).note,
    "作者注记",
  );
});

test("Map parser 要求已归类 Surface 使用 semantic type 与 variant", () => {
  const document = documentWith([
    { type: "tree", x: 0, y: 0, variant: "ts-4-13" },
  ]);
  assert.deepEqual(parseMapDocument(document), document);
});

test("Map parser 规范化字段顺序，并将 entities 放在最后", () => {
  const parsed = parseMapDocument({
    entities: [{ type: "carousel", x: 0, y: 0, variant: "left-top" }],
    height: 3,
    rules: { win: { type: "reach", target: "exit" } },
    width: 3,
    music: "ingame0",
    meta: { name: "字段顺序" },
    schemaVersion: 1,
  });
  assert.deepEqual(Object.keys(parsed), [
    "schemaVersion",
    "meta",
    "music",
    "rules",
    "width",
    "height",
    "entities",
  ]);
  assert.deepEqual(
    levelEntityContractIssues({
      type: "carousel",
      x: 0,
      y: 0,
      variant: 1,
    }),
    ["字段 variant 不符合 enum 合同"],
  );
  assert.deepEqual(
    levelEntityContractIssues({
      type: "fence",
      x: 0,
      y: 0,
      variant: 1,
    }),
    ["字段 variant 不符合 enum 合同"],
  );
});
