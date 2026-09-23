import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { parseMapDocument } from "@bobby/model";
import { root } from "../../../tools/lib/fs.mjs";
import {
  originalExploreFilters as buildOriginalExploreFilters,
} from "../../../tools/original/explore-filter-tags.mjs";

test("生成资产保持 collection、Original 与 Adventure 内容合同", () => {
const collectionsIndex = readJson("assets/maps/index.json");
assertSchemaV1(collectionsIndex, "assets/maps/index.json");
for (const collection of collectionsIndex.collections) {
  if (
    !collection ||
    typeof collection.id !== "string" || !collection.id ||
    typeof collection.name !== "string" || !collection.name ||
    Object.keys(collection).sort().join(",") !== "id,name"
  )
    throw new Error(
      "Runtime collection discovery 项只能包含非空的 id 与 name",
    );
}
if (!collectionsIndex.collections.some((collection) => collection.id === "original"))
  throw new Error("Runtime collection index 必须包含 original");
if (
  collectionsIndex.collections.some(
    (collection) => collection.id === "original-patch",
  )
)
  throw new Error("生产 collection index 不应展示开发集合 original-patch");
if (collectionsIndex.collections.at(-1)?.id !== "engine-lab")
  throw new Error("Engine Lab 必须位于 collection discovery index 末尾");
const robo2Summary = collectionsIndex.collections.find(
  (collection) => collection.id === "robo2",
);
if (robo2Summary?.name !== "Robo2")
  throw new Error("Robo2 collection 必须使用固定展示名称");

const cardSizes = new Set(["small", "medium", "big"]);
const collectionIndexes = collectionsIndex.collections.map((summary) => {
  const relative = `assets/maps/${summary.id}/index.json`;
  const collection = readJson(relative);
  assertSchemaV1(collection, relative);
  if (
    Object.hasOwn(collection, "id") ||
    !cardSizes.has(collection.cardSize) ||
    !Array.isArray(collection.filters) ||
    !Array.isArray(collection.chapters) ||
    !Array.isArray(collection.maps)
  )
    throw new Error(`${relative}: collection 合同不完整`);
  assertCollectionFilters(collection, relative);
  for (const chapter of collection.chapters) {
    if (typeof chapter.name !== "string" || !chapter.name)
      throw new Error(`${relative}: chapter name 必须是非空字符串`);
  }
  for (const map of collection.maps) {
    const mapRelative = `assets/maps/${summary.id}/${map.id}.json`;
    const document = readJson(mapRelative);
    assertMapDocument(document, mapRelative);
    if (map.name !== document.meta.name)
      throw new Error(
        `${mapRelative}: collection map name 必须来自 MapDocument meta.name`,
      );
  }
  return { id: summary.id, ...collection };
});

const original = collectionIndexes.find((collection) => collection.id === "original");
if (!original) throw new Error("缺少 Original collection index");
for (const collection of collectionIndexes) {
  for (const map of collection.maps) {
    if (map.verified !== undefined && map.verified !== true)
      throw new Error(`${collection.id}/${map.id}: verified 只能为 true`);
  }
}
if (original.cardSize !== "small")
  throw new Error("Original collection cardSize 必须为 small");
const originalCampaignChapters = original.chapters.filter(
  (chapter) => chapter.id !== "special-scenes",
);
const originalSpecialChapter = original.chapters.find(
  (chapter) => chapter.id === "special-scenes",
);
if (
  originalCampaignChapters.length !== 40 ||
  original.maps.length !== 485 ||
  original.chapters.at(-1) !== originalSpecialChapter
)
  throw new Error(
    "Original collection 必须依次包含 40 章、480 张 Campaign map 与尾部 Special Scene 分组",
  );
if (original.filters.length === 0)
  throw new Error("Original collection 必须提供 Explore filters");
assertOriginalExploreFilters(original);
const novoban = collectionIndexes.find(
  (collection) => collection.id === "novoban-pushbox",
);
if (novoban?.cardSize !== "medium")
  throw new Error("Novoban collection cardSize 必须为 medium");
const engineLab = collectionIndexes.find(
  (collection) => collection.id === "engine-lab",
);
if (!engineLab) throw new Error("缺少 Engine Lab collection");
if (engineLab.cardSize !== "medium")
  throw new Error("Engine Lab collection cardSize 必须为 medium");
if (engineLab.chapters.length !== 0 || engineLab.maps.length !== 2)
  throw new Error("Engine Lab 必须包含两张根目录地图且不声明 chapter");
if (
  engineLab.maps[0]?.id !== "00-intro" ||
  engineLab.maps[1]?.id !== "01-control2" ||
  engineLab.maps[0]?.chapter !== undefined ||
  engineLab.maps[1]?.chapter !== undefined
) {
  throw new Error("Engine Lab 地图顺序必须为 intro、control2");
}
assertLomaCollection(collectionIndexes);
assertNovobanCollection(collectionIndexes);
assertRobo2Collection(collectionIndexes);

const expectedFirstChapter = [
  "1-1",
  "1-2",
  "1-3",
  "1-bonus-1",
  "1-4",
  "1-5",
  "1-6",
  "1-bonus-2",
  "1-7",
  "1-8",
  "1-9",
  "1-10",
];
const actualFirstChapter = original.maps
  .filter((map) => map.chapter === "1")
  .map((map) => map.id);
if (JSON.stringify(actualFirstChapter) !== JSON.stringify(expectedFirstChapter))
  throw new Error(
    `Original Chapter 1 Explore 顺序错误：${actualFirstChapter.join(",")}`,
  );
for (const map of original.maps.filter(
  (entry) => entry.chapter !== originalSpecialChapter.id,
)) {
  const relative = `assets/maps/original/${map.id}.json`;
  const document = readJson(relative);
  assertOriginalMapName(map, document, relative);
  assertOriginalStartContract(document, relative);
  assertOriginalMusicContract(
    document,
    map.id.includes("-bonus-") ? "shop" : undefined,
    relative,
  );
  if (map.id.includes("-bonus-"))
    assertOriginalBonusLockContract(document, relative);
  assertOriginalWinRule(document, relative);
}
const adventure = readJson("assets/adventure/index.json");
assertSchemaV1(adventure, "assets/adventure/index.json");
if (adventure.chapters.length !== 40)
  throw new Error("Adventure index 必须包含 40 章");
const adventureLevels = adventure.chapters.flatMap((chapter) => chapter.levels);
if (adventureLevels.length !== 480 || adventure.specialScenes.length !== 5)
  throw new Error("Adventure index 必须包含 480 个 Campaign node / 5 Special Scene");
for (const chapter of adventure.chapters) {
  const exploreChapter = originalCampaignChapters.find(
    (entry) => entry.id === chapter.id,
  );
  if (exploreChapter?.name !== `${chapter.id} · ${chapter.name}`)
    throw new Error(
      `Original Explore Chapter ${chapter.id} 名称必须包含编号与原版标题`,
    );
}
const exploreSpecialScenes = original.maps.filter(
  (map) => map.chapter === originalSpecialChapter.id,
);
const originalSpecialSceneMusic = new Map([
  ["beaver-shop", "shop"],
  ["cloud-9", "sandman"],
  ["dream-machine", "shop"],
  ["dreamland-reward", "sandman"],
  ["campaign-intro", "sandman"],
]);
if (
  JSON.stringify(exploreSpecialScenes.map((map) => map.id)) !==
    JSON.stringify(adventure.specialScenes.map((scene) => scene.id)) ||
  exploreSpecialScenes.length !== 5
)
  throw new Error("Original Explore 必须在 40 章后按 catalog 顺序展示 5 个 Special Scene");
for (const chapter of adventure.chapters) {
  const exploreIds = original.maps
    .filter((map) => map.chapter === chapter.id)
    .map((map) => map.id);
  const adventureIds = chapter.levels.map((level) => level.id);
  if (JSON.stringify(exploreIds) !== JSON.stringify(adventureIds))
    throw new Error(`Explore / Adventure Chapter ${chapter.id} 顺序不一致`);
}
for (const scene of adventure.specialScenes) {
  const ref = parseMapRef(scene.map);
  if (!ref) throw new Error(`无效 Adventure Special Scene map ref：${scene.map}`);
  const relative = `assets/maps/${ref.collection}/${ref.id}.json`;
  const document = readJson(relative);
  assertMapDocument(document, relative);
  if (ref.collection === "original") {
    assertOriginalStartContract(document, relative);
    const expectedMusic = originalSpecialSceneMusic.get(scene.id);
    if (!expectedMusic)
      throw new Error(`缺少 Original Special Scene 音乐合同：${scene.id}`);
    assertOriginalMusicContract(document, expectedMusic, relative);
  }
}
});

function assertLomaCollection(collections) {
  const loma = collections.find((collection) => collection.id === "loma-pushbox");
  if (!loma) throw new Error("缺少 LOMA Pushbox collection");
  if (loma.cardSize !== "small")
    throw new Error("LOMA Pushbox collection cardSize 必须为 small");
  if (loma.chapters.length !== 10 || loma.maps.length !== 137)
    throw new Error("LOMA Pushbox 必须包含 10 个 Pattern / 137 张地图");
  const expectedChapters = Array.from({ length: 10 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );
  if (
    JSON.stringify(loma.chapters.map((chapter) => chapter.id)) !==
    JSON.stringify(expectedChapters)
  )
    throw new Error("LOMA Pushbox chapter 必须保持 01~10 Pattern 顺序");
  if (loma.maps[0]?.id !== "01-01" || loma.maps.at(-1)?.id !== "10-13")
    throw new Error("LOMA Pushbox map 顺序必须保持源文件编号");
  for (const map of loma.maps) {
    if (map.chapter !== map.id.slice(0, 2))
      throw new Error(`${map.id}: LOMA chapter 与源 Title pattern 不一致`);
    const relative = `assets/maps/loma-pushbox/${map.id}.json`;
    const document = readJson(relative);
    if (typeof document.meta.author !== "string" || !document.meta.author)
      throw new Error(`${relative}: 必须保留 LOMA Author`);
    const { pushables, goals } = assertPushboxWinRule(document, relative);
    if (pushables !== 3 || goals !== 3)
      throw new Error(`${relative}: LOMA 必须保持 3 箱 / 3 目标`);
  }
}

function assertNovobanCollection(collections) {
  const novoban = collections.find(
    (collection) => collection.id === "novoban-pushbox",
  );
  if (!novoban) throw new Error("缺少 Novoban collection");
  if (novoban.cardSize !== "medium")
    throw new Error("Novoban collection cardSize 必须为 medium");
  if (novoban.chapters.length !== 0 || novoban.maps.length !== 50)
    throw new Error("Novoban 必须是无章节的 50 张地图 collection");
  if (novoban.maps[0]?.id !== "01" || novoban.maps.at(-1)?.id !== "50")
    throw new Error("Novoban map 顺序必须保持源文件 01~50");
  const boxCounts = new Set();
  for (const map of novoban.maps) {
    if (map.chapter !== undefined)
      throw new Error(`${map.id}: Novoban 不应生成 chapter`);
    const relative = `assets/maps/novoban-pushbox/${map.id}.json`;
    const document = readJson(relative);
    if (document.meta.author !== "François Marques")
      throw new Error(`${relative}: 必须保留 François Marques 作者信息`);
    const { pushables, goals } = assertPushboxWinRule(document, relative);
    if (pushables !== goals || goals <= 0)
      throw new Error(`${relative}: Novoban 箱子数必须与目标数一致`);
    boxCounts.add(pushables);
  }
  if (boxCounts.size <= 1)
    throw new Error("Novoban 应保留不同关卡的可变箱子数量");

  const surrounded = readJson("assets/maps/novoban-pushbox/07.json");
  const bobby = surrounded.entities.find((entity) => entity.type === "bobby");
  if (
    !bobby ||
    !surrounded.entities.some(
      (entity) =>
        entity.type === "push-goal" && entity.x === bobby.x && entity.y === bobby.y,
    )
  )
    throw new Error("Novoban 07 必须把 XSB + 保留为 Bobby 位于 push-goal 上");
}

function assertRobo2Collection(collections) {
  const robo2 = collections.find((collection) => collection.id === "robo2");
  if (!robo2) throw new Error("缺少 Robo 2 collection");
  if (robo2.name !== "Robo2") {
    throw new Error("Robo2 collection index 必须使用固定展示名称");
  }
  if (robo2.cardSize !== "medium") {
    throw new Error("Robo 2 collection cardSize 必须为 medium");
  }
  if (robo2.chapters.length !== 0 || robo2.maps.length !== 25) {
    throw new Error("Robo 2 必须是无章节的 25 张地图 collection");
  }
  if (robo2.maps[0]?.id !== "01" || robo2.maps.at(-1)?.id !== "25") {
    throw new Error("Robo 2 map 顺序必须保持来源关卡 01~25");
  }

  const objectTypes = new Set();
  const mirrorVariants = new Set();
  const cannonDirections = new Set();
  for (const map of robo2.maps) {
    const relative = `assets/maps/robo2/${map.id}.json`;
    const document = readJson(relative);
    if (
      Object.hasOwn(document.meta, "author") ||
      Object.hasOwn(document.meta, "note")
    ) {
      throw new Error(`${relative}: 不应生成作者或注记`);
    }
    const bobbies = document.entities.filter((entity) => entity.type === "bobby");
    const exits = document.entities.filter((entity) => entity.type === "exit");
    const surfaces = document.entities.filter((entity) =>
      entity.stackOrder !== 1
    );
    if (bobbies.length !== 1 || exits.length !== 1) {
      throw new Error(`${relative}: 必须恰好包含一个 Bobby 和一个 Exit`);
    }
    if (surfaces.length !== document.width * document.height) {
      throw new Error(`${relative}: 每格必须恰好包含一个基础 Surface`);
    }
    if (
      JSON.stringify(document.rules?.win) !==
      JSON.stringify({
        type: "all",
        conditions: [{ type: "exit" }],
      })
    ) {
      throw new Error(`${relative}: 获胜条件必须是到达 Exit`);
    }
    for (const entity of document.entities) {
      objectTypes.add(entity.type);
      if (entity.type === "laser-mirror") mirrorVariants.add(entity.variant);
      if (entity.type === "laser-cannon") {
        cannonDirections.add(entity.direction);
      }
    }
  }

  for (const type of [
    "laser-stone",
    "laser-bomb",
    "laser-mirror",
    "laser-cannon",
  ]) {
    if (!objectTypes.has(type)) throw new Error(`Robo 2 缺少机关 ${type}`);
  }
  if ([...mirrorVariants].sort().join(",") !== "backslash,slash") {
    throw new Error("Robo 2 必须包含 slash 与 backslash 两种镜面");
  }
  if ([...cannonDirections].sort().join(",") !== "down,left,right,up") {
    throw new Error("Robo 2 必须包含四个方向的激光炮");
  }
}

function assertOriginalMapName(map, document, relative) {
  const bonus = /^(\d+)-bonus-([12])$/.exec(map.id);
  const level = /^(\d+)-(\d+)$/.exec(map.id);
  const expected = bonus ? `BONUS ${bonus[2]}` : level?.[2];
  if (!expected || document.meta.name !== expected || map.name !== expected)
    throw new Error(`${relative}: Original 地图名称必须是章节内关卡名称`);
}

function assertPushboxWinRule(document, relative) {
  const expected = { type: "push-goal" };
  if (JSON.stringify(document.rules?.win) !== JSON.stringify(expected))
    throw new Error(`${relative}: 获胜条件必须只有 push-goal`);
  const bobbies = document.entities.filter((entity) => entity.type === "bobby");
  if (bobbies.length !== 1)
    throw new Error(`${relative}: Sokoban 必须恰好包含一个 Bobby Entity`);
  if (document.entities.some((entity) => entity.type === "start"))
    throw new Error(`${relative}: Sokoban 不使用 Start surface`);
  const pushables = document.entities.filter((entity) =>
    entity.type === "pushable-box",
  ).length;
  const goals = document.entities.filter((entity) => entity.type === "push-goal").length;
  if (document.entities.some((entity) => entity.type === "exit"))
    throw new Error(`${relative}: Sokoban collection 不使用 exit 获胜条件`);
  return { pushables, goals };
}

function assertSchemaV1(value, relative) {
  if (!value || typeof value !== "object" || value.schemaVersion !== 1)
    throw new Error(`${relative}: schemaVersion 必须严格为 1`);
}

function assertMapDocument(document, relative) {
  try {
    parseMapDocument(document);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`${relative}: ${detail}`, { cause });
  }
}

function assertOriginalStartContract(document, relative) {
  const starts = document.entities.filter((entity) => entity.type === "start");
  const bobbies = document.entities.filter((entity) => entity.type === "bobby");
  if (starts.length !== 1 || bobbies.length !== 1)
    throw new Error(`${relative}: Original 必须恰好包含一个 Start surface 与一个 Bobby`);
  if (starts[0].x !== bobbies[0].x || starts[0].y !== bobbies[0].y)
    throw new Error(`${relative}: Original 初始 Bobby 必须与 Start surface 同格`);
}

function assertOriginalMusicContract(document, expected, relative) {
  if (document.music !== expected)
    throw new Error(
      `${relative}: Original music 应为 ${expected ?? "未指定"}`,
    );
}

function assertOriginalBonusLockContract(document, relative) {
  const locks = document.entities.filter((entity) => entity.type === "lock");
  if (locks.length !== 1)
    throw new Error(`${relative}: Bonus map 必须恰好包含一个 Lock`);
  if (locks[0].deathCountdownSeconds !== 60)
    throw new Error(`${relative}: Bonus Lock deathCountdownSeconds 必须为 60`);
}

function assertOriginalWinRule(document, relative) {
  const types = new Set(document.entities.map((entity) => entity.type));
  const exit = types.has("exit") ? { type: "exit" } : null;
  let expected;
  if (types.has("golden-carrot")) {
    const goldenCarrot = { type: "golden-carrot" };
    expected = exit
      ? {
          type: "any",
          conditions: [goldenCarrot, exit],
        }
      : goldenCarrot;
  } else if (types.has("carrot")) {
    const carrots = { type: "carrot" };
    expected = exit ? { type: "all", conditions: [carrots, exit] } : carrots;
  } else if (types.has("egg")) {
    const eggs = { type: "egg" };
    expected = exit ? { type: "all", conditions: [eggs, exit] } : eggs;
  } else if (exit) {
    expected = exit;
  } else {
    throw new Error(`${relative}: Original Campaign map 缺少可识别获胜目标`);
  }
  if (JSON.stringify(document.rules?.win) !== JSON.stringify(expected))
    throw new Error(`${relative}: Original rules.win 与 canonical Entity 目标不一致`);
}

function parseMapRef(value) {
  if (typeof value !== "string") return null;
  const [collection, id, extra] = value.split("/");
  return collection && id && extra === undefined ? { collection, id } : null;
}

function assertCollectionFilters(collection, relative) {
  const filterIds = new Set();
  const optionsByFilter = new Map();
  for (const filter of collection.filters) {
    if (
      !filter ||
      typeof filter.id !== "string" ||
      !filter.id ||
      typeof filter.name !== "string" ||
      !filter.name ||
      !["single", "multiple"].includes(filter.selection) ||
      !Array.isArray(filter.options) ||
      filter.options.length === 0 ||
      filterIds.has(filter.id)
    )
      throw new Error(`${relative}: filter 定义无效`);
    filterIds.add(filter.id);
    const optionIds = new Set();
    for (const option of filter.options) {
      if (
        !option ||
        typeof option.id !== "string" ||
        !option.id ||
        typeof option.name !== "string" ||
        !option.name ||
        optionIds.has(option.id)
      )
        throw new Error(`${relative}: filter option 定义无效`);
      optionIds.add(option.id);
    }
    optionsByFilter.set(filter.id, optionIds);
  }
  for (const map of collection.maps) {
    for (const [filterId, values] of Object.entries(map.filters ?? {})) {
      const options = optionsByFilter.get(filterId);
      if (
        !options ||
        !Array.isArray(values) ||
        values.some((value) => !options.has(value))
      )
        throw new Error(`${relative}: map ${map.id} 使用了未定义的 filter 标签`);
    }
  }
}

function assertOriginalExploreFilters(collection) {
  const expected = buildOriginalExploreFilters();
  if (JSON.stringify(collection.filters) !== JSON.stringify(expected))
    throw new Error("Original filter 必须由统一定义生成");
}

function readJson(relative) {
  const file = path.isAbsolute(relative) ? relative : path.join(root, relative);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
