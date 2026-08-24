import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ObjectId,
  collapseObjectLayouts,
  expandObjectLayouts,
  isMultiCellObject,
  isObjectLayoutPart,
  objectLayoutFor,
  objectVariantCycle,
  transformObjectVariant
} from '../dist/index.js';

test('Dragon/Sandman/Dream Machine/Beaver 使用 anchor + semantic footprint', () => {
  assert.equal(isMultiCellObject(ObjectId.DRAGON_HEAD_BASE), true);
  assert.equal(isObjectLayoutPart(ObjectId.DRAGON_BODY), true);
  assert.deepEqual(objectLayoutFor(ObjectId.DRAGON_HEAD_BASE), {
    cells: [
      { dx: 0, dy: 0, type: ObjectId.DRAGON_HEAD_BASE },
      { dx: 1, dy: 0, type: ObjectId.DRAGON_BODY },
      { dx: 2, dy: 0, type: ObjectId.DRAGON_TAIL }
    ],
    cursor: { dx: 1, dy: 0 }
  });
});

test('anchor 可以展开为 Runtime occupancy，也能折回 authoring anchor', () => {
  const anchors = [
    { type: ObjectId.DRAGON_HEAD_BASE, x: 1, y: 1 },
    { type: ObjectId.BEAVER_BASE, x: 6, y: 1 }
  ];
  const expanded = expandObjectLayouts(anchors, 10, 6);
  assert.deepEqual(expanded.slice(0, 3), [
    { type: ObjectId.DRAGON_HEAD_BASE, x: 1, y: 1 },
    { type: ObjectId.DRAGON_BODY, x: 2, y: 1 },
    { type: ObjectId.DRAGON_TAIL, x: 3, y: 1 }
  ]);
  assert.deepEqual(collapseObjectLayouts(expanded), anchors);
});

test('Editor authoring variants 支持 Q/E / wheel 双向循环', () => {
  assert.deepEqual(objectVariantCycle(ObjectId.WINDMILL_UP), [
    ObjectId.WINDMILL_UP,
    ObjectId.WINDMILL_RIGHT,
    ObjectId.WINDMILL_DOWN,
    ObjectId.WINDMILL_LEFT
  ]);
  assert.equal(transformObjectVariant(ObjectId.WINDMILL_UP, 1), ObjectId.WINDMILL_RIGHT);
  assert.equal(transformObjectVariant(ObjectId.WINDMILL_UP, -1), ObjectId.WINDMILL_LEFT);
  assert.equal(transformObjectVariant(ObjectId.CARROT, 1), undefined);
});
