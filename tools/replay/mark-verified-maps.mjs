import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { root } from "../lib/fs.mjs";
import { replayFixtureFiles } from "./fixture-files.mjs";
import { replayMapRef } from "./replay-fixture.mjs";

export async function markVerifiedMaps({ repositoryRoot = root } = {}) {
  const { verifyReplayFixture } = await import("./verify-fixtures.mjs");
  const winningMapIds = new Set();
  const replayFiles = replayFixtureFiles(repositoryRoot);
  for (const replayFile of replayFiles) {
    const { mapRef, winning } = verifyReplayFixture(
      replayFile,
      repositoryRoot,
    );
    if (winning) winningMapIds.add(`${mapRef.collection}/${mapRef.id}`);
  }

  const foundMapIds = writeVerifiedMaps(winningMapIds, repositoryRoot);
  for (const mapId of winningMapIds) {
    if (!foundMapIds.has(mapId))
      throw new Error(`获胜 Replay 指向的地图不在 collection index 中：${mapId}`);
  }
  console.log(
    `Replay 验真：${replayFiles.length} 条录像，${winningMapIds.size} 张地图可通关。`,
  );
  return winningMapIds;
}

export function markReplayFilesAsVerified({ repositoryRoot = root } = {}) {
  const replayFiles = replayFixtureFiles(repositoryRoot);
  const replayMapIds = new Set();
  for (const replayFile of replayFiles) {
    const replay = readJson(replayFile);
    const mapRef = replayMapRef(replay);
    replayMapIds.add(`${mapRef.collection}/${mapRef.id}`);
  }
  const foundMapIds = writeVerifiedMaps(replayMapIds, repositoryRoot);
  for (const mapId of replayMapIds) {
    if (!foundMapIds.has(mapId)) {
      throw new Error(`Replay 指向的地图不在 collection index 中：${mapId}`);
    }
  }
  console.log(
    `Replay 文件标记：${replayFiles.length} 条录像，${replayMapIds.size} 张地图。`,
  );
  return replayMapIds;
}

export function clearVerifiedMaps({ repositoryRoot = root } = {}) {
  writeVerifiedMaps(new Set(), repositoryRoot);
}

function writeVerifiedMaps(winningMapIds, repositoryRoot) {
  const mapsRoot = path.join(repositoryRoot, "assets/maps");
  const foundMapIds = new Set();
  for (const entry of fs.readdirSync(mapsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexFile = path.join(mapsRoot, entry.name, "index.json");
    if (!fs.existsSync(indexFile)) continue;
    const index = JSON.parse(fs.readFileSync(indexFile, "utf8"));
    for (const map of index.maps) {
      const mapId = `${entry.name}/${map.id}`;
      delete map.verified;
      if (!winningMapIds.has(mapId)) continue;
      map.verified = true;
      foundMapIds.add(mapId);
    }
    fs.writeFileSync(indexFile, `${JSON.stringify(index, null, 2)}\n`);
  }
  return foundMapIds;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--clear")) clearVerifiedMaps();
  else if (process.argv.includes("--presence")) markReplayFilesAsVerified();
  else await markVerifiedMaps();
}
