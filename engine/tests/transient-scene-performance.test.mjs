import test from "node:test";
import assert from "node:assert/strict";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
import { VisualRegistry } from "../dist/visual/VisualRegistry.js";

test("瞬态特效只复制受影响的绘制层，结束与倒帧保持场景复用和层序", () => {
  const registry = new VisualRegistry();
  let resolutions = 0;
  for (const pass of ["world", "player", "effect"]) {
    registry.registerTransient({
      id: pass,
      eventType: pass,
      durationMs: 100,
      renderPass: pass,
      resolve() {
        resolutions += 1;
        return { layers: [] };
      },
    });
  }
  registry.registerTransient({
    id: "empty",
    eventType: "empty",
    durationMs: 100,
    resolve: () => null,
  });
  const runtime = new VisualRuntime(registry, 48);
  const scene = {
    worldWidth: 1,
    worldHeight: 1,
    world: Object.freeze([]),
    player: Object.freeze([]),
    effect: Object.freeze([]),
  };
  function update(nowMs) {
    runtime.update({ frame: 0, nowMs, deltaMs: 0 }, "linear");
  }
  function emit(type, nowMs) {
    runtime.consumeWorldDeltas({}, [{
      type: "world-event",
      event: { type, x: 0, y: 0 },
    }], { frame: 0, nowMs, deltaMs: 0 }, {});
    update(nowMs);
  }
  // 检查合并边界的引用复用，避免基础场景构建掩盖额外复制成本。
  const append = () => runtime.appendTransientVisuals(scene);
  update(0);
  assert.equal(append(), scene);
  emit("empty", 0);
  assert.equal(append(), scene);
  emit("world", 0);
  const first = append();
  assert.notEqual(first.world, scene.world);
  assert.equal(first.player, scene.player);
  assert.equal(first.effect, scene.effect);
  emit("world", 0);
  emit("player", 0);
  emit("effect", 0);
  const active = append();
  assert.deepEqual(active.world.map((item) => item.presence.entityId), [-3, -2]);
  assert.equal(active.player.length, 1);
  assert.equal(active.effect.length, 1);
  update(100);
  resolutions = 0;
  assert.equal(append(), scene);
  assert.equal(resolutions, 0);
  update(-1);
  assert.equal(append(), scene);
  update(50);
  assert.deepEqual(append(), active);
  runtime.clear();
  assert.equal(append(), scene);
});
