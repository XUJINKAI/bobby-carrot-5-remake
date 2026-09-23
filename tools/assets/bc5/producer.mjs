import fs from "node:fs";
import path from "node:path";
import {
  adaptOriginal,
  buildOriginalAdventure,
  decodeOriginal,
  extractOriginal,
} from "../../original/lib/pipeline.mjs";
import {
  originalExploreFilters,
  originalExploreMapFilters,
} from "../../original/lib/explore.mjs";
import {
  publishDirectoryAtomically,
  publishFileAtomically,
} from "../orchestrator/atomic-output.mjs";

export function extractBc5(repositoryRoot) {
  extractOriginal({ repositoryRoot });
}

export function decodeBc5(repositoryRoot) {
  decodeOriginal({ repositoryRoot });
}

export function adaptBc5(repositoryRoot) {
  adaptOriginal({ repositoryRoot });
  buildOriginalAdventure({ repositoryRoot });
}

export function prepareBc5Collection(repositoryRoot) {
  const adaptedRoot = path.join(repositoryRoot, "tmp/assets/bc5/adapted");
  const catalog = readJson(path.join(adaptedRoot, "catalog.json"));
  const maps = catalog.maps.map((entry) => {
    const document = readJson(path.join(adaptedRoot, entry.path));
    return {
      id: entry.id,
      chapter: entry.chapter,
      filters: originalExploreMapFilters(document),
      document,
    };
  });
  for (const scene of catalog.specialScenes) {
    const document = readJson(path.join(adaptedRoot, scene.path));
    maps.push({
      id: scene.id,
      chapter: "special-scenes",
      filters: originalExploreMapFilters(document),
      document,
    });
  }
  return {
    filters: originalExploreFilters(),
    chapters: catalog.chapters.map((chapter) => ({
      id: chapter.id,
      name: `${chapter.id} · ${chapter.name}`,
      description: chapter.description,
      difficulty: chapter.difficulty,
    })).concat({
      id: "special-scenes",
      name: "Special Scenes",
      description:
        "Beaver Shop、Cloud 9、Dream Machine、Dreamland Reward 与 Campaign Intro。",
    }),
    maps,
  };
}

export function publishBc5Adventure({ repositoryRoot, stagingRoot }) {
  const source = path.join(
    repositoryRoot,
    "tmp/assets/bc5/adapted/adventure.json",
  );
  const target = path.join(repositoryRoot, "assets/adventure/index.json");
  publishFileAtomically({ target, content: fs.readFileSync(source) });
  void stagingRoot;
}

export function publishBc5Art({ repositoryRoot, stagingRoot }) {
  const source = path.join(
    repositoryRoot,
    "tmp/assets/bc5/adapted/art/hd",
  );
  const target = path.join(repositoryRoot, "assets/art/hd");
  publishDirectoryAtomically({
    stagingRoot,
    target,
    write(directory) {
      copyDirectoryContents(source, directory);
    },
  });
}

function copyDirectoryContents(source, target) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    fs.cpSync(path.join(source, entry.name), path.join(target, entry.name), {
      recursive: entry.isDirectory(),
    });
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
