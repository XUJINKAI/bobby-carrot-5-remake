import test from "node:test";
import assert from "node:assert/strict";
import { directionForJoystickVector } from "../dist/input/ScreenJoystick.js";

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
