import assert from "node:assert/strict";
import { test } from "vitest";
import {
  mapStatusIndicator,
  mapVerificationText,
} from "../src/pages/game/mapStatusIndicator.ts";

test("地图状态在没有作者和注记时使用 Minus Circle", () => {
  assert.deepEqual(mapStatusIndicator("explore", true), {
    id: "map-status",
    icon: "map-status",
    tone: "success",
    label: "地图状态：通关验证 已验证可通关",
    details: [{
      id: "verification",
      label: "通关验证",
      text: "已验证可通关",
    }],
  });
});

test("地图状态用 Caret Circle Up 承载作者与长注记", () => {
  const indicator = mapStatusIndicator("explore", false, {
    name: "测试地图",
    author: "  Alice  ",
    note: "  第一段\n第二段  ",
  });

  assert.equal(indicator.icon, "map-details");
  assert.equal(indicator.tone, "muted");
  assert.deepEqual(indicator.details, [
    {
      id: "verification",
      label: "通关验证",
      text: "尚未进行通关验证",
    },
    { id: "author", label: "作者", text: "Alice" },
    {
      id: "note",
      label: "注记",
      text: "第一段\n第二段",
      kind: "note",
    },
  ]);
});

test("Adventure 状态明确通关验证来自自由探索模式", () => {
  assert.equal(
    mapVerificationText("adventure", true),
    "已在自由探索模式中验证可通关",
  );
  assert.equal(
    mapStatusIndicator("adventure", false, {
      name: "空白元信息",
      author: " ",
      note: "\n",
    }).icon,
    "map-status",
  );
});
