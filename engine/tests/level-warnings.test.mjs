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
