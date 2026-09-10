import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityCatalog,
  validateLevelPlayability,
} from "../dist/public.js";

test("可游玩性检查使用 canonical Entity 对应的 Runtime Definition", () => {
  const warnings = validateLevelPlayability(
    {
      schemaVersion: 1,
      width: 3,
      height: 1,
      entities: [
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
        {
          type: MapEntityTypeId.WINDMILL,
          x: 2,
          y: 0,
          direction: "left",
        },
      ],
      rules: {
        win: { type: "reach", target: MapEntityTypeId.WINDMILL },
      },
    },
    createBuiltinEntityCatalog(),
  );

  assert.equal(
    warnings.some((warning) => warning.code === "missing-reach-target"),
    false,
  );
});

test("可游玩性检查报告未知 Entity 的惰性占位行为", () => {
  const warnings = validateLevelPlayability(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      entities: [
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
        { type: "future-mechanic", x: 1, y: 0 },
      ],
    },
    createBuiltinEntityCatalog(),
  );

  assert.deepEqual(
    warnings.filter((warning) => warning.code === "unknown-entity"),
    [{
      code: "unknown-entity",
      message: "未知 Entity 'future-mechanic' 将作为无功能占位符显示。",
    }],
  );
});

test("字段无效的已知 Entity 作为惰性占位并报告具体问题", () => {
  const warnings = validateLevelPlayability(
    {
      schemaVersion: 1,
      width: 1,
      height: 1,
      entities: [
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0, controller: "future" },
      ],
    },
    createBuiltinEntityCatalog(),
  );

  assert.equal(
    warnings.some((warning) => warning.code === "invalid-entity"),
    true,
  );
  assert.equal(
    warnings.some((warning) => warning.code === "missing-player"),
    true,
  );
});
