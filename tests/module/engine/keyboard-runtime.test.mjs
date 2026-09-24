import assert from "node:assert/strict";
import test from "node:test";
import { KeyboardRuntime } from "../../../engine/dist/input/KeyboardRuntime.js";

class KeyboardWindow extends EventTarget {}

function key(target, type, name, options = {}) {
  const event = new Event(type, { cancelable: true });
  const { timeStamp, ...attributes } = options;
  Object.assign(event, {
    key: name,
    code: name,
    repeat: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...attributes,
  });
  if (timeStamp !== undefined) Object.defineProperty(event, "timeStamp", { value: timeStamp });
  target.dispatchEvent(event);
  return event;
}

function fixture(options = {}) {
  const target = new KeyboardWindow();
  const runtime = new KeyboardRuntime({ target, ...options });
  return { target, runtime };
}

test("宿主声明的层级决定输入所有权，模态作用域阻止下层命令", () => {
  const { target, runtime } = fixture({ layers: ["commands", "background"] });
  const calls = [];
  runtime.register({
    layer: "commands",
    keydown: () => {
      calls.push("command");
      return true;
    },
  });
  runtime.register({
    keydown: () => {
      calls.push("background");
      return true;
    },
  });
  assert.equal(key(target, "keydown", "M").defaultPrevented, true);
  key(target, "keyup", "M");
  const modal = runtime.register({ modal: true, keydown: () => false });
  assert.equal(key(target, "keydown", "Tab").defaultPrevented, false);
  assert.deepEqual(calls, ["command"]);
  modal.dispose();
  runtime.destroy();
});

test("切换作用域取消长按，keyup 仍交还原接收者", () => {
  const { target, runtime } = fixture();
  let moves = 0;
  let releases = 0;
  let cancels = 0;
  runtime.register({
    repeat: true,
    keydown: () => {
      moves++;
      return true;
    },
    keyup: () => releases++,
    cancel: () => cancels++,
  });
  key(target, "keydown", "ArrowRight");
  const modal = runtime.register({ modal: true, keydown: () => true });
  modal.dispose();
  key(target, "keydown", "ArrowRight", { repeat: true });
  assert.equal(moves, 1);
  assert.ok(cancels > 0);
  key(target, "keyup", "ArrowRight");
  assert.equal(releases, 1);
  key(target, "keydown", "ArrowRight");
  assert.equal(moves, 2);
  runtime.destroy();
});

test("同步打开弹窗的按键在松开前不会触发弹窗操作", () => {
  const { target, runtime } = fixture();
  let confirmations = 0;
  runtime.register({
    keydown: () => {
      runtime.register({
        modal: true,
        keydown: () => {
          confirmations++;
          return true;
        },
      });
      return true;
    },
  });
  key(target, "keydown", "Enter");
  key(target, "keydown", "Enter", { repeat: true });
  assert.equal(confirmations, 0);
  key(target, "keyup", "Enter");
  key(target, "keydown", "Enter");
  assert.equal(confirmations, 1);
  runtime.destroy();
});

test("失焦清理按键，新窗口焦点下的孤立 repeat 不会恢复移动", () => {
  const { target, runtime } = fixture();
  let moves = 0;
  runtime.register({
    repeat: true,
    keydown: () => {
      moves++;
      return true;
    },
  });
  key(target, "keydown", "ArrowLeft");
  target.dispatchEvent(new Event("blur"));
  assert.equal(key(target, "keydown", "ArrowLeft", { repeat: true }).defaultPrevented, true);
  assert.equal(moves, 1);
  key(target, "keyup", "ArrowLeft");
  key(target, "keydown", "ArrowLeft");
  assert.equal(moves, 2);
  runtime.destroy();
});

test("焦点范围可以由 runtime 默认，也可以由注册项覆盖为全局", () => {
  let focused = false;
  const root = {
    ownerDocument: { activeElement: null },
    contains: () => false,
    matches: () => focused,
  };
  const { target, runtime } = fixture({ range: { mode: "focus", root } });
  const calls = [];
  runtime.register({
    range: { mode: "global" },
    keydown: () => {
      calls.push("global");
      return true;
    },
  });
  runtime.register({
    keydown: () => {
      calls.push("focus");
      return true;
    },
  });
  key(target, "keydown", "ArrowDown");
  key(target, "keyup", "ArrowDown");
  focused = true;
  key(target, "keydown", "ArrowDown");
  assert.deepEqual(calls, ["global", "focus"]);
  runtime.destroy();
});

test("离散命令默认忽略修饰键、重复和输入法组合事件", () => {
  const { target, runtime } = fixture();
  let calls = 0;
  runtime.register({
    keydown: () => {
      calls++;
      return true;
    },
  });
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }, { isComposing: true }]) {
    key(target, "keydown", "m", options);
    key(target, "keyup", "m", options);
  }
  key(target, "keydown", "m");
  key(target, "keydown", "m", { repeat: true });
  assert.equal(calls, 1);
  runtime.destroy();
});

test("销毁消费者和共享 runtime 后监听释放且按键不会回到已销毁实例", () => {
  const { target, runtime } = fixture();
  let releases = 0;
  const scope = runtime.register({
    keydown: () => true,
    keyup: () => releases++,
  });
  key(target, "keydown", "w");
  scope.dispose();
  key(target, "keyup", "w");
  assert.equal(releases, 0);
  runtime.destroy();
  assert.equal(key(target, "keydown", "w").defaultPrevented, false);
});

test("焦点导航长按按间隔重复，自身焦点移动保留按键而外部焦点变化取消", () => {
  const { target, runtime } = fixture();
  let selections = 0;
  runtime.register({
    repeat: true,
    repeatIntervalMs: 100,
    retainOnFocusChange: true,
    keydown: () => {
      selections++;
      target.dispatchEvent(new Event("focusin"));
      return true;
    },
  });
  key(target, "keydown", "ArrowDown", { timeStamp: 0 });
  key(target, "keydown", "ArrowDown", { repeat: true, timeStamp: 40 });
  assert.equal(selections, 1);
  key(target, "keydown", "ArrowDown", { repeat: true, timeStamp: 120 });
  key(target, "keydown", "ArrowDown", { repeat: true, timeStamp: 150 });
  assert.equal(selections, 2);
  target.dispatchEvent(new Event("focusin"));
  key(target, "keydown", "ArrowDown", { repeat: true, timeStamp: 250 });
  assert.equal(selections, 2);
  key(target, "keyup", "ArrowDown");
  key(target, "keydown", "ArrowDown", { timeStamp: 300 });
  assert.equal(selections, 3);
  target.dispatchEvent(new Event("compositionstart"));
  key(target, "keydown", "ArrowDown", { repeat: true, timeStamp: 450 });
  assert.equal(selections, 3);
  runtime.destroy();
});
