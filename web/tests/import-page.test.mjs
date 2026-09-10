import assert from "node:assert/strict";
import { test } from "vitest";
import { decodeImportedData } from "../src/pages/import/mountImportPage.ts";
import { encodeBc5rV1 } from "../src/shared/data-exchange/dataExchangeCodec.ts";

test("Import 可直接游玩 Embed 生成的纯 LevelMap 分享链接", async () => {
  const level = {
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
      { type: "bobby", x: 0, y: 0 },
    ],
  };
  const payload = await encodeBc5rV1(JSON.stringify(level));
  const imported = await decodeImportedData(payload);

  assert.equal(imported.type, "map");
  if (imported.type !== "map") return;
  assert.deepEqual(imported.level, level);
  assert.equal(imported.value.meta.name, "Imported Bobby Level");
});
