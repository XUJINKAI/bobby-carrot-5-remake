import assert from "node:assert/strict";
import test from "node:test";
import { parseLevelMap, parseMapDocument } from "../../model/dist/index.js";

function documentWith(entities) {
  return {
    schemaVersion: 1,
    meta: { name: "合同测试" },
    width: 3,
    height: 3,
    entities,
  };
}

test("Map parser 接受 canonical Entity 和带坐标 variant 的临时 Surface", () => {
  const document = documentWith([
    { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
    { type: "surface", x: 1, y: 0, variant: "ts-14-10" },
    { type: "sandman", x: 1, y: 1, dialogue: "测试对白" },
  ]);
  assert.deepEqual(parseMapDocument(document), document);
});

test("Map parser 拒绝未知 Entity、未知字段和错误字段值", () => {
  assert.throws(
    () => parseMapDocument(documentWith([{ type: "unknown", x: 0, y: 0 }])),
    /未知 Entity type：unknown/,
  );
  assert.throws(
    () =>
      parseMapDocument(
        documentWith([
          {
            type: "grass",
            x: 0,
            y: 0,
            variant: "ts-10-1",
            mystery: true,
          },
        ]),
      ),
    /不允许字段 mystery/,
  );
  assert.throws(
    () =>
      parseMapDocument(
        documentWith([{ type: "grass", x: 0, y: 0, variant: "wrong" }]),
      ),
    /variant 不符合 enum 合同/,
  );
});

test("LevelMap parser 校验 MapDocument 后只返回 gameplay 字段", () => {
  const document = documentWith([
    { type: "surface", x: 1, y: 2, variant: "ts-14-10" },
  ]);
  assert.deepEqual(parseLevelMap(document), {
    schemaVersion: 1,
    width: 3,
    height: 3,
    entities: [{ type: "surface", x: 1, y: 2, variant: "ts-14-10" }],
  });
});

test("Map parser 校验坐标、规则树和文档 metadata", () => {
  assert.throws(
    () =>
      parseMapDocument(
        documentWith([{ type: "surface", x: 3, y: 0, variant: "ts-14-10" }]),
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
  assert.throws(
    () =>
      parseMapDocument(
        documentWith([{ type: "carousel", x: 0, y: 0, variant: 1 }]),
      ),
    /variant 不符合 enum 合同/,
  );
  assert.throws(
    () =>
      parseMapDocument(
        documentWith([{ type: "fence", x: 0, y: 0, variant: 1 }]),
      ),
    /variant 不符合 enum 合同/,
  );
});
