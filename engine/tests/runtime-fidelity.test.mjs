import test from "node:test";
import assert from "node:assert/strict";
import { ObjectId, Terrain } from "../dist/index.js";
import { World } from "../dist/world/World.js";
import {
  animatedObjectTile,
  animatedTerrainTile,
  originalAnimationCounters,
} from "../dist/render/animation.js";

const EMPTY = ObjectId.EMPTY;
const BACKGROUND = "background-variant-081";

function object(type, x, y) {
  return { type, x, y };
}

function level({ width, height, terrain, objects = [] }) {
  return { width, height, terrain, objects };
}

test("原版 ta.png 动画计数器和关键格映射", () => {
  const world = new World(
    level({ width: 1, height: 1, terrain: [[Terrain.START]] }),
  );
  assert.deepEqual(originalAnimationCounters(0), {
    bC8: 0,
    bD6: 0,
    bE4: 0,
    bF3: 0,
  });
  assert.deepEqual(originalAnimationCounters(248), {
    bC8: 1,
    bD6: 1,
    bE4: 1,
    bF3: 1,
  });
  assert.equal(animatedTerrainTile(Terrain.SPEED_UP, world.state, 0), null);
  assert.equal(
    animatedTerrainTile(Terrain.SPEED_UP, world.state, 248)?.taIndex,
    3,
  );
  assert.equal(
    animatedTerrainTile(Terrain.WATER_ANIMATED, world.state, 248)?.taIndex,
    39,
  );
  assert.equal(
    animatedObjectTile(ObjectId.WHIRLWIND, world.state, 248)?.taIndex,
    26,
  );
});

test("魔豆按原版 S() 分段向上生长，并形成可攀爬藤蔓", () => {
  const terrain = [
    [BACKGROUND, BACKGROUND, BACKGROUND],
    [BACKGROUND, BACKGROUND, BACKGROUND],
    [BACKGROUND, BACKGROUND, BACKGROUND],
    [Terrain.START, Terrain.GROUND_C, Terrain.GROUND_C],
  ];
  const world = new World(
    level({
      width: 3,
      height: 4,
      terrain,
      objects: [object(ObjectId.BEAN_FIELD, 1, 3)],
    }),
  );
  world.state.inventory.beans = 1;
  assert.equal(world.move("right").moved, true);
  assert.equal(world.objectIdAt(1, 3), ObjectId.BEAN_SPROUT);

  world.advanceTime(17 * 62);
  assert.equal(world.objectIdAt(1, 3), ObjectId.BEANSTALK_BASE);
  assert.equal(world.objectIdAt(1, 2), ObjectId.BEANSTALK_TIP);
  assert.equal(world.isPlayerClimbing, true);
  assert.equal(
    world.move("up").moved,
    true,
    "藤蔓覆盖对象允许跨过不可步行背景",
  );

  world.advanceTime(17 * 62);
  assert.equal(world.objectIdAt(1, 2), ObjectId.BEANSTALK_MID);
  assert.equal(world.objectIdAt(1, 1), ObjectId.BEANSTALK_TIP);
});

test("荷叶撞岸后保持 rider 但进入 settled，必须下叶再重登才能启动", () => {
  const terrain = [
    [
      Terrain.START,
      Terrain.WATER_ANIMATED,
      Terrain.WATER_ANIMATED,
      Terrain.GROUND_C,
    ],
  ];
  const world = new World(
    level({
      width: 4,
      height: 1,
      terrain,
      objects: [object(ObjectId.LEAF, 1, 0)],
    }),
  );

  assert.equal(world.move("right").moved, true);
  let leaf = world.getRiddenDynamicEntity();
  assert.equal(leaf?.settled, false);
  assert.equal(world.forcedDirection, "right");

  assert.equal(world.move("right", true).moved, true);
  leaf = world.getRiddenDynamicEntity();
  assert.equal(leaf?.x, 2);
  assert.deepEqual(world.player, { x: 2, y: 0 });

  assert.equal(world.move("right", true).moved, false);
  leaf = world.getRiddenDynamicEntity();
  assert.equal(leaf?.settled, true);
  assert.equal(world.forcedDirection, null);
  assert.equal(world.move("left").moved, false);
  assert.equal(world.move("right").moved, true);
  assert.equal(world.getRiddenDynamicEntity(), null);
  assert.equal(world.move("left").moved, true);
  assert.equal(world.getRiddenDynamicEntity()?.settled, false);
});

test("荷叶遇到与运动方向相反的潮汐时停住，不会立即掉头", () => {
  const world = new World(
    level({
      width: 3,
      height: 1,
      terrain: [[Terrain.START, Terrain.WATER_ANIMATED, Terrain.TIDE_LEFT]],
      objects: [object(ObjectId.LEAF, 1, 0)],
    }),
  );
  assert.equal(world.move("right").moved, true);
  assert.equal(world.move("right", true).moved, false);
  assert.deepEqual(world.player, { x: 1, y: 0 });
  assert.equal(world.getRiddenDynamicEntity()?.settled, true);
  assert.equal(world.forcedDirection, null);
});

test("逆着荷叶脚下的湍急水流登叶时可以上叶，但不会启动漂流", () => {
  const world = new World(
    level({
      width: 3,
      height: 1,
      terrain: [[Terrain.START, Terrain.TIDE_LEFT, Terrain.WATER_ANIMATED]],
      objects: [object(ObjectId.LEAF, 1, 0)],
    }),
  );
  assert.equal(world.move("right").moved, true);
  assert.equal(world.getRiddenDynamicEntity()?.settled, true);
  assert.equal(world.getRiddenDynamicEntity()?.direction, null);
  assert.equal(world.forcedDirection, null);
});

test("一次性 Beaver Key 可以开锁、立即消耗并报告通用 object-interaction", () => {
  const world = new World(
    level({
      width: 2,
      height: 1,
      terrain: [[Terrain.START, Terrain.GROUND_C]],
      objects: [object(ObjectId.LOCK, 1, 0)],
    }),
    { temporaryKey: true },
  );
  const result = world.move("right");
  assert.equal(result.moved, true);
  assert.equal(world.objectIdAt(1, 0), EMPTY);
  assert.equal(world.state.profile.temporaryKey, false);
  assert.ok(
    result.events.some(
      (event) =>
        event.type === "object-interaction" &&
        event.objectType === ObjectId.LOCK &&
        event.action === "open",
    ),
  );
});

test("割草机第一次从停车位上车不会同帧自动下车，并可安全碾过激活陷阱", () => {
  const world = new World(
    level({
      width: 3,
      height: 1,
      terrain: [[Terrain.START, Terrain.MOWER_PARKING, Terrain.TRAP_ACTIVE]],
      objects: [object(ObjectId.MOWER, 1, 0)],
    }),
  );
  world.state.inventory.gas = true;
  assert.equal(world.move("right").moved, true);
  assert.equal(world.ridingMower, true);
  assert.equal(world.move("right").moved, true);
  assert.equal(world.dead, false);
});

test("割草机不能进入 Carousel 通道", () => {
  const world = new World(
    level({
      width: 3,
      height: 1,
      terrain: [[Terrain.START, Terrain.MOWER_PARKING, Terrain.CAROUSEL_2]],
      objects: [object(ObjectId.MOWER, 1, 0)],
    }),
  );
  world.state.inventory.gas = true;
  assert.equal(world.move("right").moved, true);
  const blocked = world.move("right");
  assert.equal(blocked.moved, false);
  assert.match(blocked.passage.reason, /割草机.*旋转通道/);
});

test("水面木板属于 Object 覆盖 Terrain；木板消失后底层水重新阻挡", () => {
  const world = new World(
    level({
      width: 5,
      height: 1,
      terrain: [
        [
          Terrain.START,
          Terrain.WATER_ANIMATED,
          Terrain.GROUND_C,
          Terrain.GROUND_C,
          Terrain.GROUND_C,
        ],
      ],
      objects: [object(ObjectId.PLANK, 1, 0)],
    }),
  );
  assert.equal(world.move("right").moved, true);
  assert.equal(world.move("right").moved, true);
  assert.equal(world.objectIdAt(1, 0), ObjectId.PLANK_CRUMBLING);
  assert.equal(world.move("right").moved, true);
  assert.equal(world.objectIdAt(1, 0), EMPTY);
  assert.equal(world.move("left").moved, true);
  assert.equal(world.move("left").moved, false);
});

test("木板坍塌中间态不能重新进入", () => {
  for (const type of [ObjectId.PLANK_CRUMBLING, ObjectId.PLANK_FRAGMENT]) {
    const world = new World(
      level({
        width: 2,
        height: 1,
        terrain: [[Terrain.START, Terrain.GROUND_C]],
        objects: [object(type, 1, 0)],
      }),
    );
    assert.equal(world.move("right").moved, false, `${type} 应阻挡`);
  }
});

test("高草覆盖已有 Bonus Coin；割草只揭示，不覆盖也不在同一拍自动收集", () => {
  const world = new World(
    level({
      width: 3,
      height: 1,
      terrain: [[Terrain.START, Terrain.HIGH_GRASS, Terrain.GROUND_C]],
      objects: [object(ObjectId.BONUS_COIN, 1, 0)],
    }),
  );
  world.state.ridingMower = true;
  assert.equal(world.move("right").moved, true);
  assert.notEqual(world.terrainAt(1, 0), Terrain.HIGH_GRASS);
  assert.equal(world.objectIdAt(1, 0), ObjectId.BONUS_COIN);
  assert.equal(world.state.bonusCoinsInLevel, 0);
  assert.equal(world.move("left").moved, true);
  assert.equal(world.move("right").moved, true);
  assert.equal(world.objectIdAt(1, 0), EMPTY);
  assert.equal(world.state.bonusCoinsInLevel, 1);
});

test("隐藏目标草上已有显式 Object 时不会重复生成/计数主目标", () => {
  const world = new World(
    level({
      width: 2,
      height: 1,
      terrain: [[Terrain.START, Terrain.HIGH_GRASS_OBJECTIVE]],
      objects: [object(ObjectId.BONUS_COIN, 1, 0)],
    }),
  );
  assert.equal(world.objectiveTotal, 0);
  world.state.ridingMower = true;
  assert.equal(world.move("right").moved, true);
  assert.equal(world.objectIdAt(1, 0), ObjectId.BONUS_COIN);
});

test("Speed 开关只有 raised 状态触发；pressed 状态不会重复触发", () => {
  const world = new World(
    level({
      width: 4,
      height: 1,
      terrain: [
        [
          Terrain.START,
          Terrain.SPEED_SWITCH_RAISED,
          Terrain.GROUND_C,
          Terrain.SPEED_UP,
        ],
      ],
    }),
  );
  assert.equal(world.move("right").moved, true);
  assert.equal(world.terrainAt(1, 0), Terrain.SPEED_SWITCH_PRESSED);
  assert.equal(world.terrainAt(3, 0), Terrain.SPEED_DOWN);
  assert.equal(world.move("left").moved, true);
  assert.equal(world.move("right").moved, true);
  assert.equal(world.terrainAt(1, 0), Terrain.SPEED_SWITCH_PRESSED);
  assert.equal(world.terrainAt(3, 0), Terrain.SPEED_DOWN);
});

test("Engine 不保存或递减 Adventure Bonus 倒计时", () => {
  const world = new World(
    level({
      width: 2,
      height: 1,
      terrain: [[Terrain.START, Terrain.GROUND_C]],
      objects: [object(ObjectId.BONUS_COIN, 1, 0)],
    }),
  );
  assert.equal("bonusTimeRemainingMs" in world.state, false);
  assert.equal("bonusTimeLimitMs" in world.state, false);
  world.advanceTime(60_001);
  assert.equal(world.dead, false);
});

test("外部规则可以通过通用 killPlayer 让 Bobby 死亡", () => {
  const world = new World(
    level({
      width: 2,
      height: 1,
      terrain: [[Terrain.START, Terrain.GROUND_C]],
    }),
  );
  const events = world.killPlayer("外部规则判定失败");
  assert.equal(world.dead, true);
  assert.equal(world.state.deathReason, "外部规则判定失败");
  assert.ok(events.some((event) => event.type === "death"));
});

test("无人云获得风向后会带惯性离开三格风道继续漂流", () => {
  const world = new World(
    level({
      width: 6,
      height: 1,
      terrain: [
        [
          Terrain.GROUND_C,
          Terrain.GROUND_C,
          Terrain.GROUND_C,
          Terrain.GROUND_C,
          Terrain.GROUND_C,
          Terrain.START,
        ],
      ],
      objects: [
        object(ObjectId.WINDMILL_RIGHT, 0, 0),
        object(ObjectId.CLOUD_RED, 1, 0),
      ],
    }),
  );
  world.advanceTime(80 * 62);
  const cloud = world
    .getDynamicEntities()
    .find((entity) => entity.type === ObjectId.CLOUD_RED);
  assert.equal(cloud?.x, 5);
  assert.equal(cloud?.direction, null);
});

test("Bobby 搭乘云时按原版 6px/Tick 与云一起移动", () => {
  const world = new World(
    level({
      width: 5,
      height: 2,
      terrain: [
        [
          Terrain.GROUND_C,
          Terrain.START,
          Terrain.GROUND_C,
          Terrain.GROUND_C,
          Terrain.GROUND_C,
        ],
        [
          Terrain.GROUND_C,
          Terrain.GROUND_C,
          Terrain.GROUND_C,
          Terrain.GROUND_C,
          Terrain.GROUND_C,
        ],
      ],
      objects: [
        object(ObjectId.WINDMILL_RIGHT, 0, 1),
        object(ObjectId.CLOUD_RED, 1, 1),
      ],
    }),
  );
  assert.equal(world.move("down").moved, true);
  world.advanceTime(8 * 62);
  const cloud = world.getRiddenDynamicEntity();
  assert.equal(cloud?.x, 2);
  assert.deepEqual(world.player, { x: 2, y: 1 });
});
