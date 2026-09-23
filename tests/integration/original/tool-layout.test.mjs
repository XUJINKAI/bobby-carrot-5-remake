import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { root } from "../../../tools/lib/fs.mjs";

test("Original 根目录只提供 CLI，命令向职责目录调用", () => {
  const originalRoot = path.join(root, "tools/original");
  const rootScripts = fs
    .readdirSync(originalRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mjs"))
    .map((entry) => entry.name)
    .sort();
  const cli = fs.readFileSync(path.join(originalRoot, "cli.mjs"), "utf8");

  assert.deepEqual(rootScripts, ["cli.mjs"]);
  assert.equal(fs.existsSync(path.join(originalRoot, "lib")), false);
  for (const directory of ["adapter", "archive", "catalog", "commands", "dat"]) {
    assert.equal(fs.statSync(path.join(originalRoot, directory)).isDirectory(), true);
  }
  assert.match(cli, /import\("\.\/archive\/extract\.mjs"\)/);
  assert.match(cli, /import\("\.\/adapter\/adapt\.mjs"\)/);
  assert.match(cli, /import\("\.\/catalog\/adventure\.mjs"\)/);
  assert.match(cli, /import\("\.\/commands\/patch\.mjs"\)/);
});
