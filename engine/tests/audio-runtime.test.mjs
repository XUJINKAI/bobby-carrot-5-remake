import test from "node:test";
import assert from "node:assert/strict";
import {
  AudioRuntime,
  resolveOriginalMusicUrl,
} from "../dist/public.js";

test("audio runtime defaults to the 8bit rendition", () => {
  const audio = new AudioRuntime({
    baseUrl: "https://example.test/assets/audio/original/",
  });
  assert.equal(audio.getMusicStyle(), "8bit");
  assert.equal(audio.isMusicEnabled(), true);
  audio.destroy();
});

test("music and sound gain can exceed 100 percent", () => {
  const audio = new AudioRuntime({
    baseUrl: "https://example.test/assets/audio/original/",
  });
  audio.setMusicGain(1.75);
  audio.setSoundGain(2.25);
  assert.equal(audio.getMusicGain(), 1.75);
  assert.equal(audio.getSoundGain(), 2.25);
  audio.destroy();
});

test("music style changes without requiring an active AudioContext", () => {
  const audio = new AudioRuntime({
    baseUrl: "https://example.test/assets/audio/original/",
  });
  audio.setMusicStyle("modern");
  assert.equal(audio.getMusicStyle(), "modern");
  assert.equal(audio.getMusicPosition(), 0);
  audio.destroy();
});

test("original music URLs are resolved by style and track id", () => {
  const base = "https://example.test/assets/audio/original/";
  assert.equal(
    resolveOriginalMusicUrl(base, "modern", "title"),
    "https://example.test/assets/audio/original/modern/title.ogg",
  );
  assert.equal(
    resolveOriginalMusicUrl(base, "8bit", "ingame1"),
    "https://example.test/assets/audio/original/8bit/ingame1.ogg",
  );
});

test("audio runtime reports when browser interaction is required", async (t) => {
  const originalAudioContext = globalThis.AudioContext;
  const originalFetch = globalThis.fetch;
  globalThis.AudioContext = SuspendedAudioContext;
  globalThis.fetch = () => new Promise(() => undefined);
  t.after(() => {
    globalThis.AudioContext = originalAudioContext;
    globalThis.fetch = originalFetch;
  });

  const audio = new AudioRuntime({
    baseUrl: "https://example.test/assets/audio/original/",
  });
  const changes = [];
  const dispose = audio.onMusicInteractionRequiredChange((required) => {
    changes.push(required);
  });

  audio.playMusic("title");
  await Promise.resolve();
  assert.equal(audio.isMusicInteractionRequired(), true);
  assert.deepEqual(changes, [true]);

  audio.resume();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(audio.isMusicInteractionRequired(), false);
  assert.deepEqual(changes, [true, false]);

  dispose();
  audio.destroy();
});

class SuspendedAudioContext {
  state = "suspended";
  currentTime = 0;
  destination = {};
  stateListeners = new Set();

  createGain() {
    return {
      gain: { value: 1 },
      connect() {},
    };
  }

  addEventListener(type, listener) {
    if (type === "statechange") this.stateListeners.add(listener);
  }

  async resume() {
    this.state = "running";
    for (const listener of this.stateListeners) listener();
  }

  async close() {
    this.state = "closed";
  }
}
