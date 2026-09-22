import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeRobo2LevelRecord,
  encodeRobo2LevelRecord,
  ROBO2_TILE_CODE,
} from "../../../tools/custom/robo2/format.mjs";

const FIRST_LEVEL_HEX =
  "0606031111111008011000b127000110a001111111";

test("Robo 2 记录按高半字节优先解码并可逐字节往返", () => {
  const source = Buffer.from(FIRST_LEVEL_HEX, "hex");
  const level = decodeRobo2LevelRecord(source, "data/0");

  assert.equal(level.width, 6);
  assert.equal(level.height, 6);
  assert.equal(level.theme, 3);
  assert.deepEqual(level.rows, [
    "111211",
    "100701",
    "1000a1",
    "180001",
    "10b001",
    "111111",
  ]);
  assert.equal(level.tiles.filter((code) => code === ROBO2_TILE_CODE.EXIT).length, 1);
  assert.equal(level.tiles.filter((code) => code === ROBO2_TILE_CODE.PLAYER).length, 1);
  assert.deepEqual(encodeRobo2LevelRecord(level), source);
});

test("Robo 2 记录拒绝长度、theme、tile 与 padding 损坏", () => {
  assert.throws(
    () => decodeRobo2LevelRecord(Buffer.from([1, 1])),
    /短于 3 字节头部/,
  );
  assert.throws(
    () => decodeRobo2LevelRecord(Buffer.from([1, 1, 4, 0])),
    /theme 必须是 0\.\.3/,
  );
  assert.throws(
    () => decodeRobo2LevelRecord(Buffer.from([2, 1, 0, 0xc0])),
    /未知 tile code 0xc/,
  );
  assert.throws(
    () => decodeRobo2LevelRecord(Buffer.from([1, 1, 0, 0x01])),
    /末尾 padding 必须为 0/,
  );
  assert.throws(
    () => decodeRobo2LevelRecord(Buffer.from([2, 2, 0, 0x00])),
    /长度应为 5 字节/,
  );
});
