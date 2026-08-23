import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../dist/world/World.js';
import { animatedObjectTile, animatedTerrainTile, originalAnimationCounters } from '../dist/render/animation.js';

const EMPTY = 0xff;

function object(id, x, y) {
  return { id, signedId: id > 127 ? id - 256 : id, hexId: `0x${id.toString(16).toUpperCase().padStart(2, '0')}`, x, y };
}

function level({ width, height, terrain, objects = [] }) {
  return {
    schemaVersion: 1,
    id: 'test',
    source: { edition: 'test', packFile: 'test.dat', levelIndex: 0 },
    recordLength: 0,
    recordSha256: 'test',
    width,
    height,
    dynamicSlots: 0,
    terrainEncoding: 'unsigned-byte',
    terrain,
    objects
  };
}

test('原版 ta.png 动画计数器和关键格映射', () => {
  const world = new World(level({ width: 1, height: 1, terrain: [[0x95]] }));
  assert.deepEqual(originalAnimationCounters(0), { bC8: 0, bD6: 0, bE4: 0, bF3: 0 });
  assert.deepEqual(originalAnimationCounters(248), { bC8: 1, bD6: 1, bE4: 1, bF3: 1 });
  assert.equal(animatedTerrainTile(0xb5, world.state, 0), null);
  assert.equal(animatedTerrainTile(0xb5, world.state, 248)?.taIndex, 3);
  assert.equal(animatedTerrainTile(0x56, world.state, 248)?.taIndex, 39);
  assert.equal(animatedObjectTile(0xf4, world.state, 248)?.taIndex, 26);
});

test('魔豆按原版 S() 分段向上生长，并形成可攀爬 CE/DE/EE', () => {
  const terrain = [
    [0x50, 0x50, 0x50],
    [0x50, 0x50, 0x50],
    [0x50, 0x50, 0x50],
    [0x95, 0x90, 0x90]
  ];
  const world = new World(level({ width: 3, height: 4, terrain, objects: [object(0xdf, 1, 3)] }));
  world.state.inventory.beans = 1;
  const planted = world.move('right');
  assert.equal(planted.moved, true);
  assert.equal(world.objectIdAt(1, 3), 0xef, '豆田先变成 EF 萌芽');

  world.advanceTime(17 * 62);
  assert.equal(world.objectIdAt(1, 3), 0xee, '第一段后基座是 EE');
  assert.equal(world.objectIdAt(1, 2), 0xce, '第一格顶端是 CE');
  assert.equal(world.isPlayerClimbing, true, '站在 EE 基座上也属于攀爬状态');

  const climb = world.move('up');
  assert.equal(climb.moved, true, 'CE 藤蔓允许跨过原本不可步行的低 ID 背景');

  world.advanceTime(17 * 62);
  assert.equal(world.objectIdAt(1, 2), 0xde, '旧顶端变成 DE 中段');
  assert.equal(world.objectIdAt(1, 1), 0xce, '新顶端继续向上生长');
});

test('荷叶撞岸后保持 rider 但进入 settled，必须下叶再重登才能启动', () => {
  const terrain = [[0x95, 0x56, 0x56, 0x90]];
  const world = new World(level({ width: 4, height: 1, terrain, objects: [object(0xec, 1, 0)] }));

  assert.equal(world.move('right').moved, true, '从陆地登上荷叶');
  let leaf = world.getRiddenDynamicEntity();
  assert.ok(leaf);
  assert.equal(leaf.settled, false);
  assert.equal(world.forcedDirection, 'right');

  assert.equal(world.move('right', true).moved, true, '荷叶和 Bobby 一起漂过水面');
  leaf = world.getRiddenDynamicEntity();
  assert.equal(leaf?.x, 2);
  assert.deepEqual(world.player, { x: 2, y: 0 });

  const shore = world.move('right', true);
  assert.equal(shore.moved, false, '强制漂流到岸边时只停住，不自动上岸');
  leaf = world.getRiddenDynamicEntity();
  assert.equal(leaf?.settled, true);
  assert.equal(world.forcedDirection, null);
  assert.deepEqual(world.player, { x: 2, y: 0 });

  assert.equal(world.move('left').moved, false, '停住后不能直接在水上反向重启');
  assert.equal(world.move('right').moved, true, '可主动从荷叶走上陆地');
  assert.equal(world.getRiddenDynamicEntity(), null);

  assert.equal(world.move('left').moved, true, '重新登上同一荷叶');
  leaf = world.getRiddenDynamicEntity();
  assert.equal(leaf?.settled, false, '重登后解除 settled，可以再次漂流');
});

test('一次性 Beaver Key 可以开锁且开锁后立即消耗', () => {
  const world = new World(
    level({ width: 2, height: 1, terrain: [[0x95, 0x90]], objects: [object(0xcd, 1, 0)] }),
    { temporaryKey: true }
  );
  const result = world.move('right');
  assert.equal(result.moved, true);
  assert.equal(world.objectIdAt(1, 0), EMPTY);
  assert.equal(world.state.profile.temporaryKey, false);
});

test('割草机第一次从停车位上车不会同帧自动下车，并可安全碾过激活陷阱', () => {
  const world = new World(level({
    width: 3,
    height: 1,
    terrain: [[0x95, 0xa0, 0xaf]],
    objects: [object(0xdc, 1, 0)]
  }));
  world.state.inventory.gas = true;
  assert.equal(world.move('right').moved, true);
  assert.equal(world.ridingMower, true, '刚上车时不能被 A0 停车位立即弹下来');
  assert.equal(world.move('right').moved, true);
  assert.equal(world.dead, false, '割草机可以安全通过已激活陷阱');
});

test('割草机不能进入 Carousel 通道，即使该方向对步行者本来可通行', () => {
  const world = new World(level({
    width: 3,
    height: 1,
    terrain: [[0x95, 0xa0, 0xba]],
    objects: [object(0xdc, 1, 0)]
  }));
  world.state.inventory.gas = true;
  assert.equal(world.move('right').moved, true, '先在停车位登上割草机');
  const blocked = world.move('right');
  assert.equal(blocked.moved, false, 'BA 对向右进入的步行者可通，但割草机必须被阻挡');
  assert.match(blocked.passage.reason, /割草机.*旋转通道/);
});

test('木板 D5/D6 坍塌中间态不能重新进入', () => {
  for (const id of [0xd5, 0xd6]) {
    const world = new World(level({ width: 2, height: 1, terrain: [[0x95, 0x90]], objects: [object(id, 1, 0)] }));
    assert.equal(world.move('right').moved, false, `0x${id.toString(16)} 应阻挡`);
  }
});

test('Bonus Round 使用 60 秒倒计时并在耗尽时死亡', () => {
  const world = new World(level({ width: 2, height: 1, terrain: [[0x95, 0x90]], objects: [object(0xf8, 1, 0)] }));
  assert.equal(world.state.bonusTimeRemainingMs, 60_000);
  const events = world.advanceTime(60_001);
  assert.equal(world.dead, true);
  assert.equal(world.state.bonusTimeRemainingMs, 0);
  assert.ok(events.some((event) => event.type === 'death'));
});

test('无人云按原版 3px/Tick 获得风向后会带惯性离开三格风道继续漂流', () => {
  const world = new World(level({
    width: 6,
    height: 1,
    terrain: [[0x90, 0x90, 0x90, 0x90, 0x90, 0x95]],
    objects: [object(0xd3, 0, 0), object(0xe0, 1, 0)]
  }));
  world.advanceTime(80 * 62);
  const cloud = world.getDynamicEntities().find((entity) => entity.id === 0xe0);
  assert.equal(cloud?.x, 5, '云应离开风车前三格风道后继续靠惯性漂到边界前');
  assert.equal(cloud?.direction, null, '撞到边界后停止');
});

test('Bobby 搭乘云时按原版 6px/Tick 与云一起移动', () => {
  const world = new World(level({
    width: 5,
    height: 2,
    terrain: [
      [0x90, 0x95, 0x90, 0x90, 0x90],
      [0x90, 0x90, 0x90, 0x90, 0x90]
    ],
    objects: [object(0xd3, 0, 1), object(0xe0, 1, 1)]
  }));
  assert.equal(world.move('down').moved, true, '先登上云');
  world.advanceTime(8 * 62);
  const cloud = world.getRiddenDynamicEntity();
  assert.equal(cloud?.x, 2);
  assert.deepEqual(world.player, { x: 2, y: 1 }, '一个 48px Tile / 6px = 8 Tick，Bobby 与云同步换格');
});
