import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import {
  mapStatusIndicator,
  mapVerificationText,
} from "../src/pages/game/mapStatusIndicator.ts";

test("地图状态在没有作者和注记时使用 Minus Circle", () => {
  assert.deepEqual(
    mapStatusIndicator("explore", true, "original/1-1", "第一关"),
    {
      id: "map-status",
      icon: "map-status",
      tone: "success",
      label: "地图状态：通关验证 已验证可通关；关卡 ID original/1-1；关卡名字 第一关",
      details: [
        {
          id: "verification",
          label: "通关验证",
          text: "已验证可通关",
        },
        { id: "map-id", label: "关卡 ID", text: "original/1-1" },
        { id: "map-name", label: "关卡名字", text: "第一关" },
      ],
    },
  );
});

test("地图状态用 Caret Circle Up 承载作者与长注记", () => {
  const indicator = mapStatusIndicator(
    "explore",
    false,
    "imported/custom-level",
    "测试地图",
    {
      name: "测试地图",
      author: "  Alice  ",
      note: "  第一段\n第二段  ",
    },
  );

  assert.equal(indicator.icon, "map-details");
  assert.equal(indicator.tone, "muted");
  assert.deepEqual(indicator.details, [
    {
      id: "verification",
      label: "通关验证",
      text: "尚未进行通关验证",
    },
    { id: "map-id", label: "关卡 ID", text: "imported/custom-level" },
    { id: "map-name", label: "关卡名字", text: "测试地图" },
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
    mapStatusIndicator(
      "adventure",
      false,
      "original/1-1",
      "空白元信息",
      {
        name: "空白元信息",
        author: " ",
        note: "\n",
      },
    ).icon,
    "map-status",
  );
});


test("地图状态 Tooltip 区分鼠标 hover 与点击固定状态", () => {
  const source = readFileSync(
    new URL("../src/shell/ShellIndicator.vue", import.meta.url),
    "utf8",
  );

  assert.match(source, /const hovered = ref\(false\)/);
  assert.match(source, /const pinned = ref\(false\)/);
  assert.match(source, /hovered\.value \|\| pinned\.value \|\| focused\.value/);
  assert.match(source, /if \(event\.pointerType === "mouse"\) hovered\.value = true/);
  assert.match(source, /pinned\.value = !pinned\.value/);
  assert.match(source, /root\.value\?\.contains\(event\.target as Node\)/);
});
