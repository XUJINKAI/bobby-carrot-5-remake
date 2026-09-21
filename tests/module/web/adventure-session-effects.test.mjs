import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import { bindAdventureSessionEffects } from "../../../web/src/pages/game/adventureSessionEffects.ts";

test("Adventure Bonus 首次加载与重载都向 primary Bobby 发放一枚钥匙", () => {
  const intents = [];
  const listeners = new Set();
  const game = {
    state: { primaryActorId: 7 },
    dispatchInteractionEffect(intent) {
      intents.push(intent);
    },
    on(event, listener) {
      assert.equal(event, "level-loaded");
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  const dispose = bindAdventureSessionEffects(game, {
    levelId: "1-bonus-1",
    bobbyMoveMs: 350,
    initialLockKeys: 1,
  });

  assert.deepEqual(intents, [{
    type: "add-actor-inventory-item",
    actorId: 7,
    item: "lock-key",
    count: 1,
  }]);
  for (const listener of listeners) listener();
  assert.equal(intents.length, 2);

  dispose();
  assert.equal(listeners.size, 0);
});

test("没有 Bonus 开局钥匙的 Session 不注册加载监听", () => {
  let subscribed = false;
  const game = {
    state: { primaryActorId: 1 },
    dispatchInteractionEffect() {
      throw new Error("不应派发钥匙");
    },
    on() {
      subscribed = true;
      return () => {};
    },
  };

  bindAdventureSessionEffects(game, {
    levelId: "1-1",
    bobbyMoveMs: 350,
    initialLockKeys: 0,
  });

  assert.equal(subscribed, false);
});

test("GamePage 绑定并销毁 Adventure Session effect", async () => {
  const source = await readFile(
    new URL("../../../web/src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /bindAdventureSessionEffects\(\s*game,\s*sessionPlan/);
  assert.match(source, /disposeAdventureSessionEffects\(\)/);
});
