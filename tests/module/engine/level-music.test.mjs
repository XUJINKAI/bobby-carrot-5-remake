import test from "node:test";
import assert from "node:assert/strict";
import {
  LevelMusicController,
  resolveLevelMusic,
} from "../../../engine/dist/audio/LevelMusicController.js";

class RecordingAudio {
  calls = [];

  playMusic(id) {
    this.calls.push(id);
  }

  stopMusic() {
    this.calls.push(null);
  }
}

test("LevelMap music 由 Engine 解析明确曲目、静音与随机曲目", () => {
  assert.equal(resolveLevelMusic("shop", () => 0.5), "shop");
  assert.equal(resolveLevelMusic("none", () => 0.5), null);
  assert.equal(resolveLevelMusic(undefined, () => 0), "ingame0");
  assert.equal(resolveLevelMusic("random", () => 0.5), "ingame1");
  assert.equal(resolveLevelMusic("random", () => 0.999), "ingame2");
});

test("Timed Bonus 与 Mower 按优先级覆盖并恢复关卡音乐", () => {
  const audio = new RecordingAudio();
  const music = new LevelMusicController(audio, () => 0);
  music.load("shop");
  music.observe({
    type: "music-state",
    data: { source: "timed-bonus", track: "bonus" },
  });
  music.observe({
    type: "music-state",
    data: { source: "mower", track: "mow" },
  });
  music.observe({
    type: "music-state",
    data: { source: "mower", track: null },
  });
  assert.deepEqual(audio.calls, ["shop", "bonus", "mow", "bonus"]);
});

test("Engine 根据关卡终局状态播放一次完成或失败音乐", () => {
  const audio = new RecordingAudio();
  const music = new LevelMusicController(audio, () => 0);
  music.load("shop");

  music.setOutcome("won");
  music.setOutcome("won");
  music.setOutcome("playing");
  music.setOutcome("dead");
  music.resetMechanics();

  assert.deepEqual(audio.calls, [
    "shop",
    "cleared",
    "shop",
    "death",
    "shop",
  ]);
});

test("Engine 从 World 重建终局音乐并恢复基础曲目", () => {
  const audio = new RecordingAudio();
  const music = new LevelMusicController(audio, () => 0);
  const world = {
    dead: false,
    completed: true,
    query: {
      entityCountMatching: () => 0,
      entitiesWithFact: () => [],
    },
    entity: () => undefined,
  };
  music.load("shop");

  music.syncWorld(world);
  world.completed = false;
  music.syncWorld(world);

  assert.deepEqual(audio.calls, ["shop", "cleared", "shop"]);
});
