import assert from "node:assert/strict";
import test from "node:test";
import { installStandaloneApi } from "../../../embed/dist/standaloneBootstrap.js";

const first = { target: "#first", map: "{}" };
const second = { target: "#second", map: "{}" };

test("standalone 启动加载前 queue 中的单个和多个 Embed", () => {
  const started = [];
  const host = { BC5R: { queue: [first, second] } };
  const api = installStandaloneApi(
    host,
    (options) => {
      started.push(options);
      return { ready: Promise.resolve(), destroy() {} };
    },
  );

  assert.deepEqual(started, [first, second]);
  assert.equal(host.BC5R, api);
  assert.equal(api.queue.push(first, second), 2);
  assert.deepEqual(started, [first, second, first, second]);
});

test("一个 queue mount 失败不会阻止后续配置", async () => {
  const started = [];
  const errors = [];
  const host = { BC5R: { queue: [first, second, first] } };
  installStandaloneApi(
    host,
    (options) => {
      assert.equal(typeof host.BC5R.mount, "function");
      started.push(options);
      if (started.length === 1) throw new Error("sync failure");
      return {
        ready: started.length === 2
          ? Promise.reject(new Error("async failure"))
          : Promise.resolve(),
        destroy() {},
      };
    },
    (error) => errors.push(error),
  );

  await Promise.resolve();
  assert.deepEqual(started, [first, second, first]);
  assert.deepEqual(errors.map((error) => error.message), [
    "sync failure",
    "async failure",
  ]);
});

test("正式 BC5R.mount 仍可直接调用", () => {
  const started = [];
  const api = installStandaloneApi({}, (options) => {
    started.push(options);
    return { ready: Promise.resolve(), destroy() {} };
  });

  const handle = api.mount(first);
  assert.equal(typeof handle.destroy, "function");
  assert.deepEqual(started, [first]);
});
