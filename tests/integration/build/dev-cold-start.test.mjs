import assert from "node:assert/strict";
import { once } from "node:events";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";
import { root } from "../../../tools/lib/fs.mjs";

const workspaces = [
  "model",
  "exchange",
  "i18n",
  "engine",
  "editor",
  "adventure",
  "embed",
  "web",
  "tools",
];
const generatedDirectories = [
  "tmp/assets",
  "assets/maps",
  "assets/adventure",
  "assets/art/hd",
  "assets/audio/midi",
  "tmp/assets",
];

test("npm run dev 从无 workspace dist 和生成资产的检出启动", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bc5r-dev-cold-"));
  let child;
  try {
    copyCheckout(directory);
    linkInstalledDependencies(directory);
    for (const workspace of workspaces) {
      assert.equal(
        fs.existsSync(path.join(directory, workspace, "dist")),
        false,
        `${workspace}/dist 应在启动前缺失`,
      );
    }
    assert.equal(fs.existsSync(path.join(directory, "dist")), false);
    for (const generated of generatedDirectories) {
      assert.equal(
        fs.existsSync(path.join(directory, generated)),
        false,
        `${generated} 应在启动前缺失`,
      );
    }

    const port = await availablePort();
    child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "dev"],
      {
        cwd: directory,
        detached: process.platform !== "win32",
        env: { ...process.env, PORT: String(port) },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const output = await waitForOutput(
      child,
      `Web UI: http://localhost:${port}`,
    );
    assert.match(output, /执行资产任务：bc5\.extract/);
    assert.match(output, /Replay 文件标记/);
    assert.equal(
      fs.existsSync(path.join(directory, "model/dist/index.js")),
      true,
    );
    for (const workspace of workspaces.filter((name) => name !== "model")) {
      assert.equal(
        fs.existsSync(path.join(directory, workspace, "dist")),
        false,
        `${workspace}/dist 不应由 dev 预编译`,
      );
    }

    const home = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(home.status, 200);
    const editor = await fetch(`http://127.0.0.1:${port}/edit`);
    assert.equal(editor.status, 200);
  } finally {
    if (child) await stopProcessTree(child);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function copyCheckout(directory) {
  for (const relative of [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.base.json",
    ...workspaces,
    "custom-maps",
    "original/official-hd",
    "assets/replays",
  ]) {
    const source = path.join(root, relative);
    const target = path.join(directory, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, {
      recursive: true,
      filter: (entry) => shouldCopy(entry),
    });
  }
}

function shouldCopy(entry) {
  const relative = path.relative(root, entry);
  if (!relative) return true;
  const segments = relative.split(path.sep);
  if (segments.includes("node_modules") || segments.includes("dist")) {
    return false;
  }
  if (path.basename(entry).endsWith(".tsbuildinfo")) return false;
  return !generatedDirectories.some(
    (generated) =>
      relative === generated || relative.startsWith(`${generated}${path.sep}`),
  );
}

function linkInstalledDependencies(directory) {
  const source = path.join(root, "node_modules");
  const target = path.join(directory, "node_modules");
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.name === "@bobby" || entry.name.startsWith(".vite")) continue;
    fs.symlinkSync(
      path.join(source, entry.name),
      path.join(target, entry.name),
      entry.isDirectory() ? "junction" : "file",
    );
  }
  const scope = path.join(target, "@bobby");
  fs.mkdirSync(scope, { recursive: true });
  for (const workspace of workspaces) {
    fs.symlinkSync(
      path.join(directory, workspace),
      path.join(scope, workspace),
      "junction",
    );
  }
}

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert.ok(address && typeof address !== "string");
      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

function waitForOutput(child, expected, timeoutMs = 90_000) {
  return new Promise((resolve, reject) => {
    let output = "";
    const append = (chunk) => {
      output += chunk.toString();
      if (output.includes(expected)) finish(resolve, output);
    };
    const exited = (code, signal) => {
      finish(
        reject,
        new Error(
          `npm run dev 在启动前退出：code=${String(code)} signal=${String(signal)}\n${output}`,
        ),
      );
    };
    const timer = setTimeout(() => {
      finish(reject, new Error(`npm run dev 启动超时\n${output}`));
    }, timeoutMs);
    const finish = (settle, value) => {
      clearTimeout(timer);
      child.stdout.off("data", append);
      child.stderr.off("data", append);
      child.off("exit", exited);
      settle(value);
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.once("exit", exited);
  });
}

async function stopProcessTree(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit");
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"]);
  } else {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  }
  await exited;
}
