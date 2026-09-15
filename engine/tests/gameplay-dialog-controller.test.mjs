import assert from "node:assert/strict";
import test from "node:test";
import { GameplayDialogController } from "../dist/ui/GameplayDialogController.js";

const DISMISSED = { type: "dismissed" };

function request(actorId, entityId, lines = ["第一句", "第二句"]) {
  return {
    type: "dialogue-request",
    actorId,
    entityId,
    objectType: "beaver",
    x: 1,
    y: 1,
    action: "touch",
    lines,
  };
}

function fixture() {
  let now = 0;
  let blocks = 0;
  let releases = 0;
  let inputReleases = 0;
  let inputConsumer = null;
  const pending = [];
  const calls = [];
  const moves = [];
  const view = {
    show(message) {
      return this.showSequence([message]);
    },
    showSequence(messages, direction) {
      calls.push({ type: "sequence", messages: [...messages], direction });
      return new Promise((resolve) => pending.push(resolve));
    },
    present(presentation) {
      calls.push({ type: "presentation", presentation });
      return new Promise((resolve) => pending.push(resolve));
    },
    handleInput(input) {
      calls.push({ type: "input", input });
    },
    close() {
      pending.shift()?.(DISMISSED);
    },
    destroy() {
      this.close();
    },
  };
  const controller = new GameplayDialogController(view, {
    acquireBlock() {
      blocks += 1;
      let active = true;
      return {
        release() {
          if (!active) return;
          active = false;
          releases += 1;
        },
      };
    },
    acquireInput(_reason, consumer) {
      inputConsumer = consumer;
      let active = true;
      return {
        release() {
          if (!active) return;
          active = false;
          inputConsumer = null;
          inputReleases += 1;
        },
      };
    },
    now: () => now,
    directionForDialogue: () => "up",
    moveFromDialogue: (actorId, direction) => {
      moves.push({ actorId, direction });
    },
  });
  return {
    controller,
    calls,
    moves,
    pending,
    counts: () => ({ blocks, releases, inputReleases }),
    input: (value) => inputConsumer?.(value),
    setNow: (value) => {
      now = value;
    },
  };
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

test("Entity dialogue 把完整段落交给同一个 View 生命周期", async () => {
  const f = fixture();

  assert.equal(f.controller.handleEntityDialogue(request(1, 2)), true);
  assert.deepEqual(f.calls, [{
    type: "sequence",
    messages: ["第一句", "第二句"],
    direction: "up",
  }]);
  assert.deepEqual(f.counts(), { blocks: 1, releases: 0, inputReleases: 0 });

  f.input({ type: "direction", source: "wasd", direction: "up" });
  assert.deepEqual(f.calls.at(-1), {
    type: "input",
    input: { type: "direction", source: "wasd", direction: "up" },
  });

  f.pending.shift()(DISMISSED);
  await settle();
  assert.deepEqual(f.counts(), { blocks: 1, releases: 1, inputReleases: 1 });
});

test("实体对白关闭后解除输入门禁并提交发起者的移动", async () => {
  const f = fixture();
  f.controller.handleEntityDialogue(request(7, 9));
  f.pending.shift()({ type: "move", direction: "left" });
  await settle();

  assert.deepEqual(f.counts(), { blocks: 1, releases: 1, inputReleases: 1 });
  assert.deepEqual(f.moves, [{ actorId: 7, direction: "left" }]);
});

test("Entity dialogue 按 actor/entity 隔离 pending 与 500ms 冷却", async () => {
  const f = fixture();

  assert.equal(f.controller.handleEntityDialogue(request(1, 2)), true);
  assert.equal(f.controller.handleEntityDialogue(request(1, 2)), false);
  assert.equal(f.controller.handleEntityDialogue(request(2, 2)), true);
  f.pending.shift()(DISMISSED);
  await settle();
  f.pending.shift()(DISMISSED);
  await settle();

  f.setNow(499);
  assert.equal(f.controller.handleEntityDialogue(request(1, 2)), false);
  f.setNow(500);
  assert.equal(f.controller.handleEntityDialogue(request(1, 2)), true);
  assert.equal(f.calls.length, 3);
  f.pending.shift()(DISMISSED);
  await settle();
});

test("宿主 show/present 共用串行门禁，reset 关闭当前项并清空队列", async () => {
  const f = fixture();
  const first = f.controller.show("外部对白");
  const second = f.controller.present({
    message: "购买？",
    options: [{ id: "yes", label: "购买" }],
  });

  assert.equal(f.calls.length, 1);
  f.controller.reset();
  assert.deepEqual(await first, DISMISSED);
  assert.deepEqual(await second, DISMISSED);
  await settle();
  assert.deepEqual(f.counts(), { blocks: 1, releases: 1, inputReleases: 1 });
  assert.equal(f.calls.length, 1);
});
