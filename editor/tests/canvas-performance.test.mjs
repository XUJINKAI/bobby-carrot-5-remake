import test from "node:test";
import assert from "node:assert/strict";
import { createBuiltinEntityCatalog, EntityStore } from "../../engine/dist/public.js";
import { EditorCanvasRenderer } from "../dist/canvas/EditorCanvasRenderer.js";
import { EditorEntityPreviewRenderer } from "../dist/canvas/EditorEntityPreviewRenderer.js";
import { EditorPreview } from "../dist/authoring/EditorPreview.js";
import { createPlacementPreview } from "../dist/authoring/EditorPlacementPreview.js";

function canvas() {
  let draws = 0;
  const context = {
    setTransform() {},
    fillRect() {},
    clearRect() {},
    strokeRect() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    drawImage() {
      draws += 1;
    },
  };
  return { style: {}, getContext: () => context, draws: () => draws };
}

test("大地图交互复用底图，放置预览只实例化待放置对象", (t) => {
  const level = {
    schemaVersion: 1,
    meta: { name: "性能回归" },
    width: 40,
    height: 40,
    entities: Array.from({ length: 1600 }, (_, i) => ({
      type: "grass", variant: "ts-10-1", x: i % 40, y: Math.floor(i / 40),
    })),
  };
  const base = canvas();
  const overlay = canvas();
  const renderer = new EditorCanvasRenderer(base, {
    sourceTileSize: 48,
    atlasId: "atlas",
    image: () => ({ width: 480, height: 480 }),
  }, undefined, undefined, undefined, overlay);
  const state = {
    level, tool: "select", placement: null, selection: null, hover: null,
    viewport: { zoom: 1, panX: 0, panY: 0 },
  };
  renderer.render(state);
  const baseDraws = base.draws();
  assert.ok(baseDraws >= 1600);
  const sizes = [];
  const all = EntityStore.prototype.all;
  t.mock.method(EntityStore.prototype, "all", function () {
    const result = all.call(this);
    sizes.push(result.length);
    return result;
  });
  for (const tool of ["select", "erase", "place"]) {
    renderer.renderInteraction({
      ...state, tool, hover: { x: 10, y: 10 }, placement: { type: "carrot" },
      selection: { anchor: { x: 1, y: 1 }, focus: { x: 3, y: 3 } },
    });
  }
  assert.equal(base.draws(), baseDraws);
  assert.ok(overlay.draws() > 0);
  assert.ok(sizes.length > 0);
  assert.ok(sizes.every((size) => size === 1));
});

test("放置预览保留邻格与多格身份，并隔离替换结果", () => {
  const level = {
    schemaVersion: 1, meta: { name: "预览" }, width: 8, height: 4,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 2, y: 2 },
      { type: "carrot", x: 2, y: 2 },
      { type: "fence", x: 4, y: 2 },
    ],
  };
  const before = structuredClone(level);
  const base = new EditorPreview(level, createBuiltinEntityCatalog());
  const ghost = createPlacementPreview(base, {
    entity: { type: "dragon", x: 2, y: 2, direction: "right" },
    cells: [], replace: [{ index: 1 }], valid: true,
  });
  assert.equal(ghost.inspections.length, 3);
  const id = ghost.inspections[0].presence.entityId;
  assert.ok(ghost.inspections.every((item) => item.presence.entityId === id));
  assert.equal(ghost.query.entity(id).type, "dragon");
  assert.equal(ghost.query.entity(2), undefined);
  assert.equal(ghost.query.presencesAt({ x: 4, y: 2 })[0].entityId, 3);
  assert.ok(ghost.query.presencesAt({ x: 2, y: 2 }).some((p) => p.entityId === 1));
  assert.ok(base.inspectCell(2, 2).presences.some((p) => p.entity.type === "carrot"));
  assert.deepEqual(level, before);
});

test("Entity 缩略图可注入只读 visual state", () => {
  const draws = [];
  const context = {
    setTransform() {},
    clearRect() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    drawImage(...args) {
      draws.push(args);
    },
    getImageData() {
      throw new Error("测试使用布局 fallback");
    },
  };
  const originalDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      width: 0,
      height: 0,
      style: {},
      getContext: () => context,
    }),
  };
  try {
    const renderer = new EditorEntityPreviewRenderer({
      sourceTileSize: 48,
      atlasId: "atlas",
      image: () => ({ width: 768, height: 768 }),
    });
    renderer.render(canvas(), { type: "egg" }, 48, { filled: true });
    assert.equal(draws[0]?.[1], 12 * 48);
    assert.equal(draws[0]?.[2], 12 * 48);

    draws.length = 0;
    renderer.render(canvas(), { type: "egg" }, 48);
    assert.equal(draws[0]?.[1], 11 * 48);
    assert.equal(draws[0]?.[2], 12 * 48);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
