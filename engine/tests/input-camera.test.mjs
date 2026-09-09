import test from "node:test";
import assert from "node:assert/strict";
import { InputController } from "../dist/input/InputController.js";

class FakeEventTarget {
  listeners = new Map();

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type) {
    this.listeners.delete(type);
  }

  dispatch(type, event) {
    this.listeners.get(type)?.(event);
  }

  setPointerCapture() {}
}

function pointer(pointerId, clientX, clientY) {
  return {
    pointerId,
    clientX,
    clientY,
    pointerType: "touch",
    button: 0,
    preventDefault() {},
  };
}

function fixture(options = {}) {
  const previousWindow = globalThis.window;
  const windowTarget = new FakeEventTarget();
  const canvas = new FakeEventTarget();
  globalThis.window = windowTarget;
  const calls = { pan: [], zoom: [] };
  const game = {
    canvas,
    hasLevel: true,
    zoom: 1,
    panByScreen(dx, dy) {
      calls.pan.push({ dx, dy });
    },
    setZoomAt(value, clientX, clientY) {
      this.zoom = value;
      calls.zoom.push({ value, clientX, clientY });
    },
  };
  const input = new InputController(game, {
    screenJoystick: false,
    ...options,
  });
  return {
    canvas,
    calls,
    game,
    destroy() {
      input.destroy();
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    },
  };
}

test("双指手势同时按中心位移平移并围绕中心缩放", () => {
  const view = fixture();
  try {
    view.canvas.dispatch("pointerdown", pointer(1, 0, 0));
    view.canvas.dispatch("pointerdown", pointer(2, 100, 0));
    view.canvas.dispatch("pointermove", pointer(2, 120, 20));

    assert.deepEqual(view.calls.pan, [{ dx: 10, dy: 10 }]);
    assert.equal(view.calls.zoom.length, 1);
    assert.ok(
      Math.abs(view.calls.zoom[0].value - Math.hypot(120, 20) / 100) <
        0.0001,
    );
    assert.deepEqual(
      {
        clientX: view.calls.zoom[0].clientX,
        clientY: view.calls.zoom[0].clientY,
      },
      { clientX: 60, clientY: 10 },
    );
  } finally {
    view.destroy();
  }
});

test("Pinch 与滚轮缩放能力可以独立配置", () => {
  const view = fixture({ zoom: false, pinchZoom: true, wheelZoom: false });
  try {
    view.canvas.dispatch("pointerdown", pointer(1, 0, 0));
    view.canvas.dispatch("pointerdown", pointer(2, 100, 0));
    view.canvas.dispatch("pointermove", pointer(2, 120, 0));
    view.canvas.dispatch("wheel", {
      deltaY: -1,
      clientX: 25,
      clientY: 35,
      preventDefault() {},
    });

    assert.equal(view.calls.zoom.length, 1);
    assert.equal(view.calls.zoom[0].value, 1.2);
  } finally {
    view.destroy();
  }
});

test("滚轮围绕指针位置缩放", () => {
  const view = fixture();
  try {
    view.canvas.dispatch("wheel", {
      deltaY: -1,
      clientX: 25,
      clientY: 35,
      preventDefault() {},
    });

    assert.deepEqual(view.calls.zoom, [
      { value: 1.08, clientX: 25, clientY: 35 },
    ]);
  } finally {
    view.destroy();
  }
});
