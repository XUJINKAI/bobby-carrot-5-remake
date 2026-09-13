import test from "node:test";
import assert from "node:assert/strict";
import { WorldCalloutRegistry } from "../dist/visual/callout/WorldCalloutRegistry.js";
import { WorldCalloutRuntime } from "../dist/visual/callout/WorldCalloutRuntime.js";

function fixture() {
  const registry = new WorldCalloutRegistry();
  registry.register({
    id: "test-callout",
    eventType: "test-callout",
    resolve(event) {
      if (event.actorId === undefined) return null;
      return {
        channel: `test:${event.actorId}`,
        anchor: { type: "entity", entityId: event.actorId },
        content: { type: "text", text: event.text ?? "提示" },
        placement: "auto-vertical",
        durationMs: 992,
        blink: {
          periodMs: 248,
          visibleFromMs: 124,
          visibleUntilMs: 248,
        },
      };
    },
  });
  const announcements = [];
  const runtime = new WorldCalloutRuntime(registry, {
    announce: (message) => announcements.push(message),
  });
  const entities = new Map([
    [1, { id: 1, anchor: { x: 2, y: 3 } }],
    [2, { id: 2, anchor: { x: 4, y: 5 } }],
  ]);
  const world = { entity: (id) => entities.get(id) };
  return { announcements, entities, runtime, world };
}

function frame(nowMs) {
  return { frame: Math.floor(nowMs / 16), nowMs, deltaMs: 16 };
}

test("Callout 按 PresentationClock 闪烁并在持续时间结束", () => {
  const { runtime, world } = fixture();
  runtime.consume({ type: "test-callout", actorId: 1 }, frame(0));
  assert.equal(runtime.isAnimating, true);
  assert.deepEqual(runtime.renderItems(world, new Map(), frame(0)), []);

  runtime.update(frame(124));
  assert.equal(runtime.renderItems(world, new Map(), frame(124)).length, 1);
  runtime.update(frame(248));
  assert.deepEqual(runtime.renderItems(world, new Map(), frame(248)), []);
  runtime.update(frame(992));
  assert.equal(runtime.isAnimating, false);
});

test("同一 actor 的 channel 替换内容，不同 actor 可以并存", () => {
  const { announcements, runtime, world } = fixture();
  runtime.consume(
    { type: "test-callout", actorId: 1, text: "第一次" },
    frame(0),
  );
  runtime.consume(
    { type: "test-callout", actorId: 1, text: "第二次" },
    frame(50),
  );
  runtime.consume(
    { type: "test-callout", actorId: 2, text: "另一个角色" },
    frame(50),
  );
  runtime.update(frame(174));
  const items = runtime.renderItems(world, new Map(), frame(174));
  assert.deepEqual(
    items.map((item) => item.content.text),
    ["第二次", "另一个角色"],
  );
  assert.deepEqual(announcements, ["第一次", "第二次", "另一个角色"]);
});

test("Entity Callout 跟随插值 pose，并在锚点删除后清理", () => {
  const { entities, runtime, world } = fixture();
  runtime.consume({ type: "test-callout", actorId: 1 }, frame(0));
  runtime.update(frame(124));
  const visualState = new Map([[1, { offsetX: -0.5, offsetY: 0.25 }]]);
  const [item] = runtime.renderItems(world, visualState, frame(124));
  assert.deepEqual({ x: item.x, y: item.y }, { x: 2, y: 3.25 });

  entities.delete(1);
  assert.deepEqual(runtime.renderItems(world, visualState, frame(124)), []);
  assert.equal(runtime.isAnimating, false);
});

test("无效 Callout Definition 结果不会进入生命周期", () => {
  const registry = new WorldCalloutRegistry();
  registry.register({
    id: "invalid",
    eventType: "invalid",
    resolve: () => ({
      channel: "",
      anchor: { type: "cell", x: 0, y: 0 },
      content: { type: "text", text: "invalid" },
      placement: "above",
      durationMs: Number.NaN,
    }),
  });
  const runtime = new WorldCalloutRuntime(registry);
  runtime.consume({ type: "invalid" }, frame(0));
  assert.equal(runtime.isAnimating, false);
});

test("同一 WorldEvent type 只能登记一个 Callout Definition", () => {
  const registry = new WorldCalloutRegistry();
  const definition = {
    id: "once",
    eventType: "once",
    resolve: () => null,
  };
  registry.register(definition);
  assert.throws(() => registry.register(definition), /重复 World Callout event/);
});
