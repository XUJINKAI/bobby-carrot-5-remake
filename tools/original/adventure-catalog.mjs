import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const adapted = path.join(root, "original/adapted");
const catalog = JSON.parse(
  fs.readFileSync(path.join(adapted, "catalog.json"), "utf8"),
);
if (catalog.schemaVersion !== 1)
  throw new Error("Original adapted catalog schemaVersion 必须为 1");

const adventure = {
  schemaVersion: 1,
  name: "Bobby Carrot 5 Remake",
  chapters: catalog.chapters.map((chapter) => ({
    id: chapter.id,
    name: chapter.name,
    description: chapter.description,
    difficulty: chapter.difficulty,
    levels: chapter.maps.map((id) => ({
      id,
      map: `original/${id}`,
    })),
  })),
  specialScenes: catalog.specialScenes.map((scene) => ({
    id: scene.id,
    name: scene.name,
    map: `original/${scene.id}`,
  })),
};

fs.writeFileSync(
  path.join(adapted, "adventure.json"),
  `${JSON.stringify(adventure, null, 2)}\n`,
);
console.log("构建 Adventure Index：40 章 / 480 个 Campaign node / 5 Special Scene。");
