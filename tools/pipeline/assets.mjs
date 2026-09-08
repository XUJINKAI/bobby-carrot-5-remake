import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { prepareCustomCollections } from "../custom/prepare.mjs";
import { levelFeatures } from "../original/explore-filter-tags.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const original = path.join(root, "original");
const assets = path.join(root, "assets");
const originalCollection = {
  id: "original",
  name: "原版关卡",
  description:
    "原版 400 个关卡、80 个奖励关、及 5 个特殊场景。",
};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

export function rebuildAssets(options = {}) {
  for (const directory of [
    "original/extracted",
    "original/decoded",
    "original/adapted",
    "assets",
  ])
    cleanUntracked(directory);
  prepareAssets(options);
}

export function prepareAssets({ includeDevCollections = false } = {}) {
  run(process.execPath, ["tools/cli.mjs", "original", "prepare"]);
  fs.mkdirSync(assets, { recursive: true });
  run(process.execPath, ["tools/custom/loma-pushbox.mjs"]);
  run(process.execPath, ["tools/custom/novoban-pushbox.mjs"]);
  const customCollections = prepareCustomCollections({
    development: includeDevCollections,
  });
  buildOriginalCollection();
  buildCollectionDiscoveryIndex([
    { id: originalCollection.id, name: originalCollection.name },
    ...customCollections,
  ]);
  buildAdventureIndex();
  fs.rmSync(path.join(assets, "art/hd"), { recursive: true, force: true });
  copyTree(path.join(original, "adapted/art"), path.join(assets, "art"));
}

function buildOriginalCollection() {
  const catalog = readJson(path.join(original, "adapted/catalog.json"));
  const target = path.join(assets, "maps/original");
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  const maps = catalog.maps.map((entry) => {
    const document = readJson(path.join(original, "adapted", entry.path));
    fs.writeFileSync(
      path.join(target, `${entry.id}.json`),
      `${JSON.stringify(document, null, 2)}\n`,
    );
    const features = levelFeatures(document);
    return {
      id: entry.id,
      name: document.meta.name,
      description: "",
      chapter: entry.chapter,
      kind: entry.kind,
      filters: {
        carrots: [carrotBucket(features.carrotCount)],
        items: features.specialItems,
        scenes: features.scenes,
        mechanics: features.mechanics,
      },
    };
  });
  for (const scene of catalog.specialScenes) {
    const document = readJson(path.join(original, "adapted", scene.path));
    fs.writeFileSync(
      path.join(target, `${scene.id}.json`),
      `${JSON.stringify(document, null, 2)}\n`,
    );
    const features = levelFeatures(document);
    maps.push({
      id: scene.id,
      name: document.meta.name,
      description: "",
      chapter: "special-scenes",
      kind: "special-scene",
      filters: {
        carrots: [carrotBucket(features.carrotCount)],
        items: features.specialItems,
        scenes: features.scenes,
        mechanics: features.mechanics,
      },
    });
  }
  fs.writeFileSync(
    path.join(target, "index.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      name: originalCollection.name,
      description: originalCollection.description,
      cardSize: "small",
      filters: originalFilters(),
      chapters: catalog.chapters.map((chapter) => ({
        id: chapter.id,
        name: chapter.name,
        description: chapter.description,
        difficulty: chapter.difficulty,
      })).concat({
        id: "special-scenes",
        name: "Special Scenes",
        description: "Beaver Shop、Cloud 9、Dream Machine、Dreamland Reward 与 Campaign Intro。",
        kind: "special-scenes",
      }),
      maps,
    }, null, 2)}\n`,
  );
}

function buildCollectionDiscoveryIndex(collections) {
  const target = path.join(assets, "maps/index.json");
  fs.writeFileSync(
    target,
    `${JSON.stringify({ schemaVersion: 1, collections }, null, 2)}\n`,
  );
  console.log(`构建 Collection discovery index：${collections.length} 个集合。`);
}

function buildAdventureIndex() {
  const source = path.join(original, "adapted/adventure.json");
  const target = path.join(assets, "adventure/index.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function originalFilters() {
  return [
    {
      id: "carrots",
      name: "萝卜数",
      selection: "single",
      options: ["0", "1-5", "6-10", "11-20", "21+"].map((id) => ({
        id,
        name: id,
        icon: entityIcon("carrot"),
      })),
    },
    {
      id: "items",
      name: "特殊道具",
      selection: "multiple",
      options: [
        ["shovel", "雪铲", "shovel-pickup"],
        ["gas", "汽油", "gas"],
        ["bean", "魔豆", "bean"],
        ["kite", "风筝", "kite"],
        ["golden-carrot", "金胡萝卜", "golden-carrot"],
        ["bonus-coin", "Bonus Coin", "bonus-coin"],
      ].map(([id, name, entityType]) => ({
        id,
        name,
        icon: entityIcon(entityType),
      })),
    },
    {
      id: "scenes",
      name: "场景",
      selection: "multiple",
      options: [
        ["grassland", "草地", "grass", { variant: "ts-10-1" }],
        ["water", "水域", "water", { variant: "ripple" }],
        ["snow", "雪地", "snow"],
        ["starfield", "星空", "starfield", { variant: "large-star" }],
        ["desert", "沙漠", "sand"],
      ].map(([id, name, entityType, fields]) => ({
        id,
        name,
        icon: entityIcon(entityType, fields),
      })),
    },
    {
      id: "mechanics",
      name: "机关",
      selection: "multiple",
      options: [
        ["tide", "潮汐", entityIcon("tide", { direction: "right" })],
        ["speed", "加速带", entityIcon("speed", { direction: "right" })],
        [
          "carousel",
          "旋转通道",
          entityIcon("carousel", { variant: "right-top" }),
        ],
        ["wind", "风车 / 云", entityIcon("windmill", { direction: "right" })],
        ["mirror", "魔法镜", entityIcon("mirror", { variant: "right-bottom" })],
        ["trap", "陷阱", entityIcon("trap", { active: true })],
        [
          "color-switch",
          "彩色开关",
          entityIcon("color-switch", { color: "yellow", state: "state-1" }),
        ],
        ["mower", "割草机", entityIcon("mower")],
        ["beanstalk", "魔豆藤", entityIcon("beanstalk")],
        ["dragon", "龙", entityIcon("dragon", { direction: "left" })],
        ["plank", "木板", entityIcon("plank")],
        ["whirlwind", "龙卷风 / 风筝", entityIcon("whirlwind")],
        ["ice-block", "冰块", entityIcon("ice-block")],
      ].map(([id, name, icon]) => ({ id, name, icon })),
    },
  ];
}

function entityIcon(type, fields = {}) {
  return { type: "entity", entity: { type, ...fields } };
}

function carrotBucket(count) {
  if (count === 0) return "0";
  if (count <= 5) return "1-5";
  if (count <= 10) return "6-10";
  if (count <= 20) return "11-20";
  return "21+";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function cleanUntracked(directory) {
  run("git", ["clean", "-fdX", "--", directory]);
}

function copyTree(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  prepareAssets();
