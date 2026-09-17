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

test("alternate music rendition is fetched during an idle period", async (t) => {
  const originalAudioContext = globalThis.AudioContext;
  const originalFetch = globalThis.fetch;
  const originalRequestIdleCallback = globalThis.requestIdleCallback;
  const originalCancelIdleCallback = globalThis.cancelIdleCallback;
  const idleCallbacks = new Map();
  const fetchedUrls = [];
  let idleHandle = 0;
  globalThis.AudioContext = RunningAudioContext;
  globalThis.fetch = async (url) => {
    fetchedUrls.push(String(url));
    return {
      ok: true,
      async arrayBuffer() {
        return new ArrayBuffer(0);
      },
    };
  };
  globalThis.requestIdleCallback = (callback) => {
    const handle = ++idleHandle;
    idleCallbacks.set(handle, callback);
    return handle;
  };
  globalThis.cancelIdleCallback = (handle) => idleCallbacks.delete(handle);
  t.after(() => {
    globalThis.AudioContext = originalAudioContext;
    globalThis.fetch = originalFetch;
    globalThis.requestIdleCallback = originalRequestIdleCallback;
    globalThis.cancelIdleCallback = originalCancelIdleCallback;
  });

  const audio = new AudioRuntime({
    baseUrl: "https://example.test/assets/audio/original/",
  });
  audio.playMusic("title");
  await waitFor(() => idleCallbacks.size === 1);

  assert.deepEqual(fetchedUrls, [
    "https://example.test/assets/audio/original/8bit/title.ogg",
  ]);
  assert.equal(idleCallbacks.size, 1);

  idleCallbacks.values().next().value();
  await waitFor(() => fetchedUrls.length === 2);
  assert.deepEqual(fetchedUrls, [
    "https://example.test/assets/audio/original/8bit/title.ogg",
    "https://example.test/assets/audio/original/modern/title.ogg",
  ]);
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

class RunningAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};

  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        cancelScheduledValues() {},
      },
      connect() {
        return this;
      },
      disconnect() {},
    };
  }

  createBufferSource() {
    return {
      loop: false,
      onended: null,
      connect() {
        return this;
      },
      disconnect() {},
      start() {},
      stop() {},
    };
  }

  async decodeAudioData() {
    return { duration: 60 };
  }

  addEventListener() {}

  async close() {
    this.state = "closed";
  }
}

async function waitFor(predicate) {
  for (let index = 0; index < 20; index += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail("等待异步音频状态超时");
}
