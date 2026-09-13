import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { root } from "../lib/fs.mjs";
import {
  replayFixtureFiles,
  verifyReplayFixture,
} from "./verify-fixtures.mjs";

const mapsRoot = path.join(root, "assets/maps");

export function markVerifiedMaps() {
  const winningMapIds = new Set();
  const replayFiles = replayFixtureFiles();
  for (const replayFile of replayFiles) {
    const { mapRef, winning } = verifyReplayFixture(replayFile);
    if (winning) winningMapIds.add(`${mapRef.collection}/${mapRef.id}`);
  }

  const foundMapIds = writeVerifiedMaps(winningMapIds);
  for (const mapId of winningMapIds) {
    if (!foundMapIds.has(mapId))
      throw new Error(`获胜 Replay 指向的地图不在 collection index 中：${mapId}`);
  }
  console.log(
    `Replay 验真：${replayFiles.length} 条录像，${winningMapIds.size} 张地图可通关。`,
  );
  return winningMapIds;
}

export function clearVerifiedMaps() {
  writeVerifiedMaps(new Set());
}

function writeVerifiedMaps(winningMapIds) {
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--clear")) clearVerifiedMaps();
  else markVerifiedMaps();
}
