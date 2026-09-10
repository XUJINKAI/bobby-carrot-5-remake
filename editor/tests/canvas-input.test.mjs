import test from "node:test";
import assert from "node:assert/strict";
import { EditorCanvasInput } from "../dist/canvas/EditorCanvasInput.js";

class FakeCanvas {
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

  getBoundingClientRect() {
    return { left: 10, top: 20, width: 100, height: 100 };
  }
}

test("Editor 滚轮只围绕指针缩放地图", () => {
  const canvas = new FakeCanvas();
  const zoomCalls = [];
  let viewportChanges = 0;
  const input = new EditorCanvasInput(
    canvas,
    {
      zoomAt(factor, x, y) {
        zoomCalls.push({ factor, x, y });
      },
    },
    {
      dimensions: () => ({ width: 10, height: 10 }),
      hover() {},
      primaryStart() {},
      primaryMove() {},
      primaryEnd() {},
      secondarySelect() {},
      viewportChanged() {
        viewportChanges += 1;
      },
    },
  );
  const event = {
    deltaY: -1,
    clientX: 58,
    clientY: 92,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };

  try {
    canvas.dispatch("wheel", event);

    assert.deepEqual(zoomCalls, [{ factor: 1.08, x: 48, y: 72 }]);
    assert.equal(viewportChanges, 1);
    assert.equal(event.defaultPrevented, true);
  } finally {
    input.destroy();
  }
});

test("Editor 右键阻止浏览器菜单并请求选择当前格", () => {
  const canvas = new FakeCanvas();
  const selected = [];
  const input = new EditorCanvasInput(
    canvas,
    {},
    {
      dimensions: () => ({ width: 10, height: 10 }),
      hover() {},
      primaryStart() {},
      primaryMove() {},
      primaryEnd() {},
      secondarySelect(cell) {
        selected.push(cell);
      },
      viewportChanged() {},
    },
  );
  const event = {
    clientX: 35,
    clientY: 65,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };

  try {
    canvas.dispatch("contextmenu", event);

    assert.deepEqual(selected, [{ x: 2, y: 4 }]);
    assert.equal(event.defaultPrevented, true);
  } finally {
    input.destroy();
  }
});
