import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { extractZip } from "../lib/zip.mjs";
import { RELEASES } from "./source-definitions.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const jarRoot = path.join(root, "original/official-hd");
const outputIndex = process.argv.indexOf("--output");
const outputRoot = path.resolve(
  root,
  outputIndex >= 0 ? process.argv[outputIndex + 1] : "tmp/release-research",
);

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function walkFiles(dir, prefix = "") {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walkFiles(absolute, relative));
    else result.push(relative.replaceAll("\\", "/"));
  }
  return result.sort();
}

function categoryFor(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".class")) return "class";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".mid") || lower.endsWith(".midi")) return "midi";
  if (lower.endsWith(".dat")) return "dat";
  if (lower === "meta-inf/manifest.mf") return "manifest";
  if (
    lower.endsWith(".properties") ||
    /(^|\/)(lang|language|locale|localization|messages?)(\/|\.|_|-)/.test(
      lower,
    )
  ) {
    return "language";
  }
  return "other";
}

function groupReleasesByHash(rows, entryName) {
  const groups = new Map();
  for (const row of rows) {
    const entry = row.entries[entryName];
    if (!entry) continue;
    const releases = groups.get(entry.sha256) ?? [];
    releases.push(row.release);
    groups.set(entry.sha256, releases);
  }
  return [...groups.entries()].map(([hash, releases]) => ({ hash, releases }));
}

function findJavaTool() {
  for (const command of ["javap", "javap.exe"]) {
    const probe = spawnSync(command, ["-version"], { encoding: "utf8" });
    if (probe.status === 0) return command;
  }
  return undefined;
}

function javapClass(command, classpath, className) {
  const result = spawnSync(
    command,
    ["-classpath", classpath, "-c", "-p", "-s", className],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    throw new Error(
      `javap ${className} 失败：${result.stderr || result.stdout || result.status}`,
    );
  }
  return result.stdout.replaceAll(classpath, "<classpath>").replaceAll("\r\n", "\n");
}

function methodBlocks(disassembly) {
  const lines = disassembly.split("\n");
  const result = new Map();
  let currentName = "<class>";
  let current = [];

  const flush = () => {
    if (!current.length) return;
    const text = current.join("\n").trim();
    if (text) result.set(currentName, sha256(Buffer.from(text)));
    current = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const looksLikeMember =
      trimmed &&
      !trimmed.startsWith("descriptor:") &&
      !trimmed.startsWith("Code:") &&
      !/^\d+:/.test(trimmed) &&
      /[;)]$/.test(trimmed) &&
      !trimmed.startsWith("Compiled from");
    if (looksLikeMember) {
      flush();
      currentName = trimmed;
    }
    current.push(line);
  }
  flush();
  return result;
}

function compareMethodBlocks(beforeText, afterText) {
  const before = methodBlocks(beforeText);
  const after = methodBlocks(afterText);
  const names = [...new Set([...before.keys(), ...after.keys()])].sort();
  return names
    .map((name) => {
      if (!before.has(name)) return { member: name, change: "added" };
      if (!after.has(name)) return { member: name, change: "removed" };
      if (before.get(name) !== after.get(name)) {
        return { member: name, change: "changed" };
      }
      return undefined;
    })
    .filter(Boolean);
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

const extractedRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bc5r-release-research-"));
const rows = [];

try {
  for (const release of RELEASES) {
    const jarPath = path.join(jarRoot, release.jar);
    if (!fs.existsSync(jarPath)) throw new Error(`缺少官方 JAR：${jarPath}`);
    const extractDir = path.join(extractedRoot, release.id);
    extractZip(jarPath, extractDir);
    const entries = {};
    for (const name of walkFiles(extractDir)) {
      const content = fs.readFileSync(path.join(extractDir, name));
      entries[name] = {
        category: categoryFor(name),
        size: content.length,
        sha256: sha256(content),
      };
    }
    rows.push({
      release: release.id,
      label: release.label,
      jar: release.jar,
      jarSha256: sha256(fs.readFileSync(jarPath)),
      entryCount: Object.keys(entries).length,
      entries,
      extractDir,
    });
  }

  const allEntryNames = [...new Set(rows.flatMap((row) => Object.keys(row.entries)))].sort();
  const matrix = allEntryNames.map((name) => {
    const releases = Object.fromEntries(
      rows.map((row) => [row.release, row.entries[name] ?? null]),
    );
    const present = Object.values(releases).filter(Boolean);
    const hashes = new Set(present.map((entry) => entry.sha256));
    return {
      path: name,
      category: categoryFor(name),
      presentIn: present.length,
      distinctHashes: hashes.size,
      sharedAcrossAll:
        present.length === RELEASES.length && hashes.size === 1,
      releases,
    };
  });

  const categories = {};
  for (const category of ["class", "png", "midi", "dat", "manifest", "language", "other"]) {
    const items = matrix.filter((item) => item.category === category);
    categories[category] = {
      entries: items.length,
      sharedAcrossAll: items.filter((item) => item.sharedAcrossAll).length,
      releaseSpecificOrChanged: items.filter((item) => !item.sharedAcrossAll).length,
    };
  }

  const importantClasses = ["a.class", "Bobby.class"];
  const classLineage = Object.fromEntries(
    importantClasses.map((name) => [name, groupReleasesByHash(rows, name)]),
  );
  const engineRevisionGroups = new Map();
  for (const row of rows) {
    const key = importantClasses
      .map((name) => row.entries[name]?.sha256 ?? "missing")
      .join(":");
    const releases = engineRevisionGroups.get(key) ?? [];
    releases.push(row.release);
    engineRevisionGroups.set(key, releases);
  }
  const engineRevisions = [...engineRevisionGroups.entries()].map(
    ([signature, releases], index) => ({
      id: `R${index + 1}`,
      signature,
      releases,
    }),
  );

  const javap = findJavaTool();
  const bytecodeDiffs = [];
  if (javap) {
    const disassemblyByRelease = new Map();
    for (const revision of engineRevisions) {
      const releaseId = revision.releases[0];
      const row = rows.find((candidate) => candidate.release === releaseId);
      const classTexts = {};
      for (const classFile of importantClasses) {
        if (!row.entries[classFile]) continue;
        const className = classFile.replace(/\.class$/, "");
        const text = javapClass(javap, row.extractDir, className);
        classTexts[classFile] = text;
        const destination = path.join(
          outputRoot,
          "javap",
          revision.id,
          `${className}.txt`,
        );
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, text);
      }
      disassemblyByRelease.set(revision.id, classTexts);
    }
    for (let index = 1; index < engineRevisions.length; index += 1) {
      const before = engineRevisions[index - 1];
      const after = engineRevisions[index];
      for (const classFile of importantClasses) {
        const beforeText = disassemblyByRelease.get(before.id)?.[classFile];
        const afterText = disassemblyByRelease.get(after.id)?.[classFile];
        if (!beforeText || !afterText) continue;
        bytecodeDiffs.push({
          from: before.id,
          to: after.id,
          classFile,
          changedMembers: compareMethodBlocks(beforeText, afterText),
        });
      }
    }
  }

  const report = {
    schemaVersion: 1,
    releases: rows.map(({ extractDir: _extractDir, ...row }) => row),
    categories,
    classLineage,
    engineRevisions,
    bytecodeTool: javap ? "javap -c -p -s" : null,
    bytecodeDiffs,
    matrix,
  };
  writeJson(path.join(outputRoot, "release-matrix.json"), report);

  console.log(`官方 HD JAR：${rows.length} 个；联合 entry：${matrix.length} 个。`);
  for (const [category, summary] of Object.entries(categories)) {
    console.log(
      `${category}: ${summary.entries} entries；全发行包同 hash ${summary.sharedAcrossAll}；变化/缺失 ${summary.releaseSpecificOrChanged}`,
    );
  }
  console.log("a.class 谱系：", JSON.stringify(classLineage["a.class"]));
  console.log("Bobby.class 谱系：", JSON.stringify(classLineage["Bobby.class"]));
  console.log("Engine revision：", JSON.stringify(engineRevisions));
  console.log("Bytecode diff：", JSON.stringify(bytecodeDiffs));
  console.log(`完整矩阵：${path.relative(root, path.join(outputRoot, "release-matrix.json"))}`);
} finally {
  fs.rmSync(extractedRoot, { recursive: true, force: true });
}
