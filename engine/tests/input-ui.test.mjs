import test from "node:test";
import assert from "node:assert/strict";
import { resolveEngineTiming } from "../dist/time/EngineTiming.js";
import {
  DEFAULT_INPUT_CONTROLLER_OPTIONS,
  directionForDiscreteDrag,
} from "../dist/input/InputController.js";
import { HeldDirectionRepeater } from "../dist/input/HeldDirectionRepeater.js";
import {
  DEFAULT_SCREEN_JOYSTICK_OPTIONS,
  directionForJoystickVector,
  resolveScreenJoystickLayout,
} from "../dist/input/ScreenJoystick.js";

function advance(repeater, deltaMs, result = "moved") {
  const direction = repeater.update(deltaMs);
  if (direction) repeater.resolveAttempt(result);
  return direction;
}

test("单指或鼠标左键的小范围拖动不触发移动", () => {
  assert.equal(directionForDiscreteDrag(12, 8), null);
});

test("单指或鼠标左键拖动按主轴折算为单格移动方向", () => {
  assert.equal(directionForDiscreteDrag(-30, 4), "left");
  assert.equal(directionForDiscreteDrag(30, 4), "right");
  assert.equal(directionForDiscreteDrag(3, -30), "up");
  assert.equal(directionForDiscreteDrag(3, 30), "down");
});

test("显式 initial repeat delay 只作用于第一格和第二格之间", () => {
  const repeater = new HeldDirectionRepeater();
  repeater.setInput({
    source: "keyboard",
    direction: "right",
    initialRepeatDelayMs: 250,
  });

  assert.equal(advance(repeater, 62.5), "right");
  for (let i = 0; i < 3; i += 1)
    assert.equal(advance(repeater, 62.5), null);
  assert.equal(advance(repeater, 62.5), "right");
});

test("默认零 initial repeat delay 不制造第一步到第二步的特殊停顿", () => {
  const repeater = new HeldDirectionRepeater();
  repeater.setInput({
    source: "keyboard",
    direction: "right",
    initialRepeatDelayMs: 0,
  });

  assert.equal(advance(repeater, 62.5), "right");
  assert.equal(advance(repeater, 62.5), "right");
});

test("一个 tick 内按下再松开仍保留一次单格输入", () => {
  const repeater = new HeldDirectionRepeater();
  repeater.setInput({
    source: "keyboard",
    direction: "up",
    initialRepeatDelayMs: 0,
  });
  repeater.setInput(null);

  assert.equal(advance(repeater, 62.5), "up");
  for (let i = 0; i < 8; i += 1)
    assert.equal(advance(repeater, 62.5), null);
});

test("持续输入换方向后重新作为新的第一格处理", () => {
  const repeater = new HeldDirectionRepeater();
  repeater.setInput({
    source: "keyboard",
    direction: "right",
    initialRepeatDelayMs: 0,
  });
  assert.equal(advance(repeater, 62.5), "right");
  repeater.setInput({
    source: "keyboard",
    direction: "down",
    initialRepeatDelayMs: 0,
  });
  assert.equal(advance(repeater, 62.5), "down");
});

test("持续输入 busy 时下一世界 tick 重试同一方向", () => {
  const repeater = new HeldDirectionRepeater();
  repeater.setInput({
    source: "keyboard",
    direction: "left",
    initialRepeatDelayMs: 0,
  });
  assert.equal(advance(repeater, 62.5, "busy"), "left");
  assert.equal(advance(repeater, 62.5, "moved"), "left");
});

test("持续输入 consumed 后不会在 gameplay lock 结束时补执行", () => {
  const repeater = new HeldDirectionRepeater();
  const input = {
    source: "keyboard",
    direction: "up",
    initialRepeatDelayMs: 0,
  };
  repeater.setInput(input);
  assert.equal(advance(repeater, 62.5, "consumed"), "up");

  for (let i = 0; i < 10; i += 1)
    assert.equal(advance(repeater, 62.5), null);

  // 只有真实 release/change 才重新成为一个新的输入操作。
  repeater.setInput(null);
  repeater.setInput(input);
  assert.equal(advance(repeater, 62.5), "up");
});

test("持续输入被阻挡后等待方向改变，不按世界 Tick 重复 blocked", () => {
  const repeater = new HeldDirectionRepeater();
  repeater.setInput({
    source: "joystick",
    direction: "left",
    initialRepeatDelayMs: 0,
  });
  assert.equal(advance(repeater, 62.5, "blocked"), "left");
  for (let i = 0; i < 10; i += 1)
    assert.equal(advance(repeater, 62.5, "blocked"), null);
});

test("默认持续输入没有额外首步延迟且与可配置 WorldClock 分离", () => {
  assert.equal(DEFAULT_INPUT_CONTROLLER_OPTIONS.keyboardRepeatDelayMs, 0);
  assert.equal(DEFAULT_INPUT_CONTROLLER_OPTIONS.externalRepeatDelayMs, 0);
  assert.equal(DEFAULT_SCREEN_JOYSTICK_OPTIONS.initialRepeatDelayMs, 0);
  assert.equal(resolveEngineTiming().worldStepMs, 62.5);
});

test("屏幕摇杆默认识别区紧贴右下角，默认圆盘完整落在识别区内", () => {
  const layout = resolveScreenJoystickLayout();
  const half = layout.size / 2;

  assert.equal(layout.size, 128);
  assert.equal(layout.activationWidth, 180);
  assert.equal(layout.activationHeight, 180);
  assert.equal(layout.activationInsetRight, 0);
  assert.equal(layout.activationInsetBottom, 0);
  assert.equal(layout.defaultInsetRight, 28);
  assert.equal(layout.defaultInsetBottom, 28);
  assert.ok(layout.defaultBaseX - half >= 0);
  assert.ok(layout.defaultBaseY - half >= 0);
  assert.ok(layout.defaultBaseX + half <= layout.activationWidth);
  assert.ok(layout.defaultBaseY + half <= layout.activationHeight);
});

test("屏幕摇杆识别区和默认位置可以独立配置", () => {
  const layout = resolveScreenJoystickLayout({
    size: 144,
    activationWidth: 220,
    activationHeight: 190,
    activationInsetRight: 6,
    activationInsetBottom: 10,
    defaultInsetRight: 36,
    defaultInsetBottom: 32,
  });

  assert.equal(layout.size, 144);
  assert.equal(layout.activationWidth, 220);
  assert.equal(layout.activationHeight, 190);
  assert.equal(layout.activationInsetRight, 6);
  assert.equal(layout.activationInsetBottom, 10);
  assert.equal(layout.defaultInsetRight, 36);
  assert.equal(layout.defaultInsetBottom, 32);
  assert.equal(layout.defaultBaseX, 112);
  assert.equal(layout.defaultBaseY, 86);
});

test("屏幕摇杆 dead zone 不产生移动方向", () => {
  assert.deepEqual(directionForJoystickVector(3, 4, 8), {
    direction: null,
    distance: 5,
  });
});

test("屏幕摇杆把拖动向量折算为四个主轴方向", () => {
  assert.equal(directionForJoystickVector(-30, 4, 8).direction, "left");
  assert.equal(directionForJoystickVector(30, 4, 8).direction, "right");
  assert.equal(directionForJoystickVector(3, -30, 8).direction, "up");
  assert.equal(directionForJoystickVector(3, 30, 8).direction, "down");
});

test("屏幕摇杆在对角线附近保留上一方向", () => {
  assert.equal(
    directionForJoystickVector(20, 21, 8, "right").direction,
    "right",
  );
  assert.equal(directionForJoystickVector(8, 30, 8, "right").direction, "down");
});
