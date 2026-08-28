import test from "node:test";
import assert from "node:assert/strict";
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

test("单指或鼠标左键的小范围拖动不触发移动", () => {
  assert.equal(directionForDiscreteDrag(12, 8), null);
});

test("单指或鼠标左键拖动按主轴折算为单格移动方向", () => {
  assert.equal(directionForDiscreteDrag(-30, 4), "left");
  assert.equal(directionForDiscreteDrag(30, 4), "right");
  assert.equal(directionForDiscreteDrag(3, -30), "up");
  assert.equal(directionForDiscreteDrag(3, 30), "down");
});

test("持续输入第一格立即执行，第二格等待 initial repeat delay", () => {
  const repeater = new HeldDirectionRepeater();
  const attempts = [];
  repeater.setInput({
    source: "keyboard",
    direction: "right",
    initialRepeatDelayMs: 250,
  });
  const move = (direction) => {
    attempts.push(direction);
    return "moved";
  };

  repeater.update(62.5, move);
  assert.deepEqual(attempts, ["right"]);
  for (let i = 0; i < 3; i += 1) repeater.update(62.5, move);
  assert.deepEqual(attempts, ["right"]);
  repeater.update(62.5, move);
  assert.deepEqual(attempts, ["right", "right"]);
});

test("一个 tick 内按下再松开仍保留一次单格输入", () => {
  const repeater = new HeldDirectionRepeater();
  const attempts = [];
  repeater.setInput({
    source: "keyboard",
    direction: "up",
    initialRepeatDelayMs: 250,
  });
  repeater.setInput(null);

  repeater.update(62.5, (direction) => {
    attempts.push(direction);
    return "moved";
  });
  for (let i = 0; i < 8; i += 1) {
    repeater.update(62.5, (direction) => {
      attempts.push(direction);
      return "moved";
    });
  }

  assert.deepEqual(attempts, ["up"]);
});

test("持续输入换方向后重新作为新的第一格处理", () => {
  const repeater = new HeldDirectionRepeater();
  const attempts = [];
  const move = (direction) => {
    attempts.push(direction);
    return "moved";
  };

  repeater.setInput({
    source: "keyboard",
    direction: "right",
    initialRepeatDelayMs: 250,
  });
  repeater.update(62.5, move);
  repeater.setInput({
    source: "keyboard",
    direction: "down",
    initialRepeatDelayMs: 250,
  });
  repeater.update(62.5, move);

  assert.deepEqual(attempts, ["right", "down"]);
});

test("持续输入被阻挡后等待方向改变，不按更新频率重复 blocked", () => {
  const repeater = new HeldDirectionRepeater();
  let attempts = 0;
  repeater.setInput({
    source: "joystick",
    direction: "left",
    initialRepeatDelayMs: 375,
  });
  const blocked = () => {
    attempts += 1;
    return "blocked";
  };

  repeater.update(62.5, blocked);
  for (let i = 0; i < 10; i += 1) repeater.update(62.5, blocked);
  assert.equal(attempts, 1);
});

test("默认持续输入手感：键盘 250ms，屏幕摇杆 375ms", () => {
  assert.equal(DEFAULT_INPUT_CONTROLLER_OPTIONS.keyboardRepeatDelayMs, 250);
  assert.equal(DEFAULT_INPUT_CONTROLLER_OPTIONS.updateIntervalMs, 62.5);
  assert.equal(DEFAULT_SCREEN_JOYSTICK_OPTIONS.initialRepeatDelayMs, 375);
  assert.ok(
    DEFAULT_SCREEN_JOYSTICK_OPTIONS.initialRepeatDelayMs >
      DEFAULT_INPUT_CONTROLLER_OPTIONS.keyboardRepeatDelayMs,
  );
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
