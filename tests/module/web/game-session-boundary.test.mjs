import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";

test("Web 只把外部 interaction 交给业务层并复用 Engine dialog controller", () => {
  const source = fs.readFileSync(
    new URL("../../../web/src/runtime/game/createGameSession.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /const \{ game, input, dialog \} = runtime/);
  assert.match(source, /options\.interaction\?\.\(\{ request, game, dialog \}\)/);
  assert.doesNotMatch(source, /GameplayDialogView/);
  assert.doesNotMatch(source, /request\.text/);
  assert.doesNotMatch(source, /dialog\?\.show\(request/);
});
