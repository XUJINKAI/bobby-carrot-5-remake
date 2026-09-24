import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";

const component = fs.readFileSync(
  new URL("../../../web/src/pages/explore/ExploreMapCard.vue", import.meta.url),
  "utf8",
);

test("Explore 地图卡片原样显示 collection 提供的地图名称", () => {
  assert.match(component, /\{\{ map\.name \}\}/);
  assert.doesNotMatch(component, /primaryLabel|secondaryLabel|map\.id\.split/);
});

test("Explore 地图卡片只在开发模式标记有 Replay 的关卡", () => {
  assert.match(
    component,
    /const showRecordingIndicator = import\.meta\.env\.DEV;/,
  );
  assert.match(
    component,
    /v-if="showRecordingIndicator && map\.verified"/,
  );
  assert.match(component, /class="recording-indicator"/);
});

test("Replay 标记是在卡片右下角显示的红色圆点", () => {
  const style = component.match(
    /\.recording-indicator\s*\{(?<body>[\s\S]*?)\}/,
  )?.groups?.body;
  assert.ok(style);
  assert.match(style, /right:\s*6px/);
  assert.match(style, /bottom:\s*6px/);
  assert.match(style, /border-radius:\s*50%/);
  assert.match(style, /background:\s*#f23838/);
  assert.doesNotMatch(style, /\bborder\s*:|box-shadow/);
});
