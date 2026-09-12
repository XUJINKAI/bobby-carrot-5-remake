import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";
import { resolveGamePageCapabilities } from "../src/pages/game/gamePageCapabilities.ts";

const mountSource = fs.readFileSync(
  new URL("../src/pages/game/mountGamePage.ts", import.meta.url),
  "utf8",
);

test("Explore 始终提供 Debug 与 Replay 工具", () => {
  assert.deepEqual(resolveGamePageCapabilities("explore", false), {
    debug: true,
    replayPanel: true,
  });
});

test("Adventure 只在开发服务器提供 Debug 与 Replay 工具", () => {
  assert.deepEqual(resolveGamePageCapabilities("adventure", true), {
    debug: true,
    replayPanel: true,
  });
  assert.deepEqual(resolveGamePageCapabilities("adventure", false), {
    debug: false,
    replayPanel: false,
  });
  assert.match(
    mountSource,
    /resolveGamePageCapabilities\(mode, import\.meta\.env\.DEV\)/,
  );
});
