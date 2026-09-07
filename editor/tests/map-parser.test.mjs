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

test("Map parser 接受 canonical Entity 和坐标型临时 Surface", () => {
  const document = documentWith([
    { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
    { type: "surface-4-13", x: 1, y: 0 },
    { type: "sandman", x: 1, y: 1, dialogue: "测试对白" },
  ]);
  assert.deepEqual(parseMapDocument(document), document);
});

test("Map parser 拒绝旧 Entity 别名、未知字段和错误字段值", () => {
  assert.throws(
    () => parseMapDocument(documentWith([{ type: "ground-c", x: 0, y: 0 }])),
    /未知 Entity type：ground-c/,
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
    { type: "surface-4-13", x: 1, y: 2 },
  ]);
  assert.deepEqual(parseLevelMap(document), {
    schemaVersion: 1,
    width: 3,
    height: 3,
    entities: [{ type: "surface-4-13", x: 1, y: 2 }],
  });
});

test("Map parser 校验坐标、规则树和文档 metadata", () => {
  assert.throws(
    () =>
      parseMapDocument(
        documentWith([{ type: "surface-4-13", x: 3, y: 0 }]),
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
});
