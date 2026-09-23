import test from "node:test";
import assert from "node:assert/strict";
import { builtinEngineEnvironment, EntityStore } from "../../../engine/dist/public.js";
import { EditorCanvasRenderer } from "../../../editor/dist/canvas/EditorCanvasRenderer.js";
import { EditorEntityPreviewRenderer } from "../../../editor/dist/canvas/EditorEntityPreviewRenderer.js";
import {
  EditorPreview,
  editorPreviewFor,
} from "../../../editor/dist/authoring/EditorPreview.js";
import { createPlacementPreview } from "../../../editor/dist/authoring/EditorPlacementPreview.js";

function canvas() {
  let draws = 0;
  const labels = [];
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
    fillText(label) {
      labels.push(label);
    },
  };
  return {
    style: {},
    getContext: () => context,
    draws: () => draws,
    labels: () => labels,
  };
}

function laserCanvas() {
  const strokes = [];
  let path = [];
  const context = {
    strokeStyle: "",
    lineWidth: 0,
    setTransform() {},
    fillRect() {},
    clearRect() {},
    strokeRect() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    drawImage() {},
    fillText() {},
    beginPath() {
      path = [];
    },
    moveTo(x, y) {
      path.push([x, y]);
    },
    lineTo(x, y) {
      path.push([x, y]);
    },
    stroke() {
      strokes.push({ color: this.strokeStyle, width: this.lineWidth, path });
    },
  };
  return {
    style: {},
    getContext: () => context,
    strokes: () => strokes,
  };
}

test("Canvas 为两个以上 Palette 层显示数量角标", () => {
  const level = {
    schemaVersion: 1,
    meta: { name: "堆叠角标" },
    width: 1,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "carrot", x: 0, y: 0 },
      { type: "bobby", x: 0, y: 0 },
    ],
  };
  const target = canvas();
  const renderer = new EditorCanvasRenderer(target, {
    sourceTileSize: 48,
    atlasId: "atlas",
    image: () => ({ width: 768, height: 768 }),
  });

  renderer.render({
    level,
    tool: "select",
    placement: null,
    selection: null,
    hover: null,
    viewport: { zoom: 1, panX: 0, panY: 0 },
  });

  assert.deepEqual(target.labels(), ["2"]);
});

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
  }, undefined, undefined, overlay);
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

test("同一不可变关卡 revision 复用空间投影", () => {
  const level = {
    schemaVersion: 1,
    meta: { name: "空间投影缓存" },
    width: 2,
    height: 1,
    entities: [{ type: "grass", variant: "ts-10-1", x: 0, y: 0 }],
  };
  assert.equal(
    editorPreviewFor(level, builtinEngineEnvironment),
    editorPreviewFor(level, builtinEngineEnvironment),
  );
  assert.notEqual(
    editorPreviewFor(structuredClone(level), builtinEngineEnvironment),
    editorPreviewFor(level, builtinEngineEnvironment),
  );
});

test("Editor Canvas 复用 Engine 光路投影且不污染可编辑空间", () => {
  const level = {
    schemaVersion: 1,
    meta: { name: "激光预览" },
    width: 5,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 2, y: 0 },
      { type: "laser-cannon", direction: "right", x: 0, y: 0 },
      { type: "stump", x: 3, y: 0 },
    ],
  };
  const preview = new EditorPreview(level, builtinEngineEnvironment);
  assert.equal(
    preview.entities.all().some((entity) => entity.type === "laser-beam"),
    false,
  );
  assert.deepEqual(
    preview.renderEntities.all()
      .filter((entity) => entity.type === "laser-beam")
      .map((entity) => ({ x: entity.anchor.x, terminal: entity.state?.terminal })),
    [
      { x: 1, terminal: false },
      { x: 2, terminal: false },
      { x: 3, terminal: true },
    ],
  );

  const target = laserCanvas();
  const renderer = new EditorCanvasRenderer(target, {
    sourceTileSize: 48,
    atlasId: "atlas",
    image: () => ({ width: 768, height: 768 }),
  });
  const state = {
    level,
    tool: "select",
    placement: null,
    selection: null,
    hover: null,
    viewport: { zoom: 1, panX: 0, panY: 0 },
  };
  renderer.render(state, 0);

  assert.equal(target.strokes().length, 2);
  assert.equal(new Set(target.strokes().map((stroke) => stroke.color)).size, 1);
  assert.equal(new Set(target.strokes().map((stroke) => stroke.width)).size, 1);
  assert.deepEqual(target.strokes().map((stroke) => stroke.path), [
    [[38, 19], [76, 19]],
    [[76, 19], [114, 19]],
  ]);
});

test("Editor 光路按 Energy 规则穿过覆盖物并由原版 Mirror 反射", () => {
  const entities = [];
  for (let y = 0; y < 3; y += 1) {
    for (let x = 0; x < 5; x += 1) {
      entities.push({ type: "grass", variant: "ts-10-1", x, y });
    }
  }
  entities.push(
    { type: "laser-cannon", direction: "right", x: 0, y: 1 },
    { type: "high-grass", x: 1, y: 1, stackOrder: 1 },
    { type: "fence", x: 2, y: 1, stackOrder: 1 },
    { type: "mirror", variant: "left-bottom", x: 3, y: 1 },
  );
  const preview = new EditorPreview({
    schemaVersion: 1,
    meta: { name: "Energy 光路预览" },
    width: 5,
    height: 3,
    entities,
  }, builtinEngineEnvironment);

  assert.deepEqual(
    preview.renderEntities.all()
      .filter((entity) => entity.type === "laser-beam")
      .map((entity) => ({
        x: entity.anchor.x,
        y: entity.anchor.y,
        direction: entity.direction,
        outgoingDirection: entity.state?.outgoingDirection,
      })),
    [
      { x: 1, y: 1, direction: "right", outgoingDirection: undefined },
      { x: 2, y: 1, direction: "right", outgoingDirection: undefined },
      { x: 3, y: 1, direction: "right", outgoingDirection: "down" },
      { x: 3, y: 2, direction: "down", outgoingDirection: undefined },
    ],
  );
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
  const base = new EditorPreview(level, builtinEngineEnvironment);
  const ghost = createPlacementPreview(base, {
    entity: { type: "dragon", x: 2, y: 2, direction: "right" },
    cells: [], replace: [{ index: 1 }], warnings: [], valid: true,
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
