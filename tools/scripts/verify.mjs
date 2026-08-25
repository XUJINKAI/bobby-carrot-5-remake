import fs from "node:fs";
import path from "node:path";
import { root, run, tscCommand } from "./util.mjs";
import { resolveDistRequest } from "./static-server.mjs";

run(process.execPath, ["tools/scripts/build.mjs"]);
// 产品构建不会发布 DAT，但验证测试和原版一致性检查需要其本地编译产物。
run(tscCommand(), ["-b", "dat", "--force"]);
run(
  process.execPath,
  [
    "--test",
    "dat/tests/*.test.mjs",
    "adventure/tests/*.test.mjs",
    "engine/tests/*.test.mjs",
    "editor/tests/*.test.mjs",
  ],
  { shell: true },
);

const { deriveDatDynamicSlots, splitDatPackage, decodeDatLevelRecord } =
  await import("../../dat/dist/index.js");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "assets/generated/catalog.json"), "utf8"),
);

if (catalog.totalSourceLevels !== 530)
  throw new Error(
    `Expected 530 source levels, got ${catalog.totalSourceLevels}`,
  );
if (catalog.uniqueMaps !== 485)
  throw new Error(`Expected 485 unique source maps, got ${catalog.uniqueMaps}`);
if (catalog.uniqueLevels !== 480 || catalog.levels.length !== 480)
  throw new Error(
    `Expected 480 Adventure/Explore levels, got ${catalog.uniqueLevels}`,
  );
if (catalog.specialSceneCount !== 5 || catalog.specialScenes.length !== 5)
  throw new Error("Expected five shared original special scenes");
if (catalog.schemaVersion !== 4)
  throw new Error(`Expected catalog schema 4, got ${catalog.schemaVersion}`);
if (catalog.sourceReleases.length !== 10)
  throw new Error(
    `Expected 10 archive releases, got ${catalog.sourceReleases.length}`,
  );
if (catalog.chapters.length !== 40)
  throw new Error(
    `Expected 40 original chapters, got ${catalog.chapters.length}`,
  );
if (catalog.difficulty.historicalNonTutorialLevels !== 288)
  throw new Error("Expected 288 historical per-level difficulty labels");
if (catalog.difficulty.estimatedLevels !== 192)
  throw new Error("Expected 192 estimated per-level difficulty labels");
if (
  catalog.levels[0]?.publicId !== "1-1" ||
  !catalog.levels.some((level) => level.publicId === "1-bonus-1") ||
  catalog.levels.at(-1)?.publicId !== "40-bonus-2"
)
  throw new Error("Continuous 1-40 public ID boundaries changed");
if (
  catalog.chapters[0]?.difficultyStars !== 1 ||
  catalog.chapters[1]?.difficultyStars !== 2 ||
  catalog.chapters[2]?.difficultyStars !== 3 ||
  catalog.chapters[3]?.difficultyStars !== 1 ||
  catalog.chapters.at(-1)?.difficultyStars !== 1
)
  throw new Error("Original DAT chapter star ratings changed");

for (const chapter of catalog.chapters) {
  if (![1, 2, 3].includes(chapter.difficultyStars))
    throw new Error(
      `Chapter ${chapter.number} has invalid original star difficulty`,
    );
  if (chapter.levelPublicIds.length !== 12)
    throw new Error(
      `Chapter ${chapter.number} must contain 10 main + 2 bonus nodes`,
    );
  const expected = [
    `${chapter.number}-1`,
    `${chapter.number}-2`,
    `${chapter.number}-3`,
    `${chapter.number}-bonus-1`,
    `${chapter.number}-4`,
    `${chapter.number}-5`,
    `${chapter.number}-6`,
    `${chapter.number}-bonus-2`,
    `${chapter.number}-7`,
    `${chapter.number}-8`,
    `${chapter.number}-9`,
    `${chapter.number}-10`,
  ];
  if (JSON.stringify(chapter.levelPublicIds) !== JSON.stringify(expected))
    throw new Error(`Chapter ${chapter.number} campaign order changed`);
}

for (const level of catalog.levels) {
  const file = path.join(root, "assets/generated", level.path);
  if (!fs.existsSync(file)) throw new Error(`Missing canonical level ${file}`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (data.schemaVersion !== 2 || data.terrainEncoding !== "semantic-row-major")
    throw new Error(`Level ${level.id} is not semantic schema v2`);
  if (
    data.publicId !== level.publicId ||
    data.chapter !== level.chapter ||
    data.contentKind !== level.contentKind
  )
    throw new Error(`Generated level identity mismatch for ${level.publicId}`);
  if (
    data.terrain.length !== data.height ||
    data.terrain.some((row) => row.length !== data.width)
  )
    throw new Error(`Bad terrain dimensions in ${level.id}`);
  if (
    data.terrain.some((row) => row.some((type) => typeof type !== "string")) ||
    data.objects.some((object) => typeof object.type !== "string")
  )
    throw new Error(`Raw DAT values leaked into ${level.id}`);
  if (
    data.objects.some(
      (object) => "id" in object || "signedId" in object || "hexId" in object,
    )
  )
    throw new Error(`Legacy DAT object fields leaked into ${level.id}`);
  if (deriveDatDynamicSlots(data) !== data.dynamicSlots)
    throw new Error(`dynamicSlots is not derivable for ${level.publicId}`);
}

verifyAllSourceDynamicSlots(
  deriveDatDynamicSlots,
  splitDatPackage,
  decodeDatLevelRecord,
);

const filterIndex = JSON.parse(
  fs.readFileSync(
    path.join(root, "assets/generated/level-filters.json"),
    "utf8",
  ),
);
if (filterIndex.schemaVersion !== 1 || filterIndex.levelCount !== 480)
  throw new Error("Bad generated level filter index");
for (const level of catalog.levels) {
  const features = filterIndex.levels?.[level.publicId];
  if (!features)
    throw new Error(`Missing filter features for ${level.publicId}`);
  if (!Number.isInteger(features.carrotCount) || features.carrotCount < 0)
    throw new Error(`Bad carrot count for ${level.publicId}`);
  for (const key of ["specialItems", "scenes", "mechanics"])
    if (
      !Array.isArray(features[key]) ||
      features[key].some((value) => typeof value !== "string")
    )
      throw new Error(`Bad ${key} for ${level.publicId}`);
}

verifySourceBoundaries();
verifyUnifiedUiShell();

for (const file of [
  "dist/index.html",
  "dist/model/index.js",
  "dist/adventure/index.js",
  "dist/engine/index.js",
  "dist/editor/index.js",
  "dist/assets/catalog.json",
  "dist/assets/level-filters.json",
  "dist/assets/art/hd/ts.png",
  "dist/assets/art/hd/ta.png",
  "dist/assets/art/hd/b0.png",
  "dist/assets/art/hd/b1.png",
  "dist/assets/art/hd/b2.png",
  "dist/assets/art/hd/b3.png",
])
  if (!fs.existsSync(path.join(root, file)))
    throw new Error(`Missing build artifact: ${file}`);

for (const removed of [
  "dist/dat",
  "dist/shared-game.js",
  "dist/web",
  "dist/engine-playground",
  "dist/play",
  "dist/edit",
  "dist/levels",
  "dist/settings",
  "dist/404.html",
  "dist/debug-layout.js",
  "dist/main.js",
])
  if (fs.existsSync(path.join(root, removed)))
    throw new Error(`Obsolete build artifact still exists: ${removed}`);

verifyWebModuleEntry(path.join(root, "dist"));
verifySpaVsStaticRouting(path.join(root, "dist"));

const jarOut = path.join(root, "tmp/original-validation/verify.jar");
run(process.execPath, [
  "tools/src/patch-original-jar.mjs",
  "--map",
  "editor/examples/mechanics-smoke.json",
  "--target",
  "1-1",
  "--out",
  jarOut,
]);
if (!fs.existsSync(jarOut))
  throw new Error("Original JAR validation artifact was not created");
fs.rmSync(path.join(root, "tmp"), { recursive: true, force: true });

if (process.env.CI) run(process.execPath, ["tools/scripts/browser-smoke.mjs"]);

console.log(
  "verify: OK — JSON-only user maps, LevelObject properties, self-contained Engine gameplay rules, configurable gameplay input, Adventure map augmentation, DAT-free Web/Editor boundaries, original-JAR validation and Explore/Adventure SPA routing all passed.",
);

function verifyAllSourceDynamicSlots(derive, split, decode) {
  const sourceIndex = JSON.parse(
    fs.readFileSync(
      path.join(root, "assets/generated/source-index.json"),
      "utf8",
    ),
  );
  let count = 0;
  for (const release of sourceIndex.releases)
    for (const pack of release.packs) {
      const bytes = fs.readFileSync(
        path.join(root, "assets/extracted", release.id, `${pack.packFile}.dat`),
      );
      for (const record of split(bytes).levelRecords) {
        const decoded = decode(record);
        if (derive(decoded.map) !== decoded.dynamicSlots)
          throw new Error(
            `dynamicSlots mismatch in ${release.id}/${pack.packFile} source record ${count + 1}`,
          );
        count++;
      }
    }
  if (count !== 530)
    throw new Error(
      `Expected to verify dynamicSlots on all 530 source records, got ${count}`,
    );
}

function verifySourceBoundaries() {
  for (const removed of [
    "tools/src/dat-codec.mjs",
    "editor/src/share.ts",
    "web/src/shared-game.ts",
    "web/src/main.ts",
    "adventure/src/runtime.ts",
  ])
    if (fs.existsSync(path.join(root, removed)))
      throw new Error(`Legacy source still exists: ${removed}`);
  if (!fs.existsSync(path.join(root, "web/src/app.ts")))
    throw new Error("Modular web app entry is missing");

  const allowed = new Map([
    ["model/src", new Set()],
    ["dat/src", new Set(["@bobby/model"])],
    ["engine/src", new Set(["@bobby/model"])],
    ["editor/src", new Set(["@bobby/model", "@bobby/engine"])],
    ["adventure/src", new Set(["@bobby/model"])],
    [
      "web/src",
      new Set([
        "@bobby/model",
        "@bobby/adventure",
        "@bobby/engine",
        "@bobby/editor",
      ]),
    ],
  ]);
  for (const [sourcePath, packages] of allowed)
    walkSource(path.join(root, sourcePath), (file, text) => {
      for (const match of text.matchAll(/from\s+['"](@bobby\/[^'"]+)['"]/g))
        if (!packages.has(match[1]))
          throw new Error(
            `Forbidden package dependency ${match[1]} in ${path.relative(root, file)}`,
          );
    });

  for (const relative of [
    "editor/package.json",
    "editor/tsconfig.json",
    "web/package.json",
    "web/tsconfig.json",
  ]) {
    const text = fs.readFileSync(path.join(root, relative), "utf8");
    if (/@bobby\/dat|\.\.\/dat/.test(text))
      throw new Error(`DAT dependency leaked into product config: ${relative}`);
  }

  for (const sourcePath of ["editor/src", "web/src"])
    walkSource(path.join(root, sourcePath), (file, text) => {
      if (
        /\b(?:encodeShareLevel|decodeShareLevel|shareValueFromHash)\b|#map=/.test(
          text,
        )
      )
        throw new Error(
          `Legacy URL/DAT share code leaked into product source: ${path.relative(root, file)}`,
        );
    });

  walkSource(path.join(root, "model/src"), (file, text) => {
    if (
      /\b(?:schemaVersion|recordSha256|recordLength|dynamicSlots|chapterLevel|terrainEncoding)\b/.test(
        text,
      )
    )
      throw new Error(
        `Official/DAT metadata leaked into pure model: ${path.relative(root, file)}`,
      );
  });

  walkSource(path.join(root, "engine/src"), (file, text) => {
    if (
      /\b(?:TERRAIN_BY_DAT|OBJECT_BY_DAT|DAT_BY_TERRAIN|DAT_BY_OBJECT|datHexIds|datSourceForTerrain|datSourceForObject|chapterLevel|recordSha256|releaseSourceId|bonusTimeMs|bonusTimeLimitMs|bonusTimeRemainingMs|lock-opened)\b/.test(
        text,
      )
    )
      throw new Error(
        `Original-format/catalog/Campaign metadata leaked into Engine: ${path.relative(root, file)}`,
      );
  });

  walkSource(path.join(root, "adventure/src"), (file, text) => {
    if (
      /\b(?:DAT_BY_|TERRAIN_BY_DAT|OBJECT_BY_DAT|recordSha256|releaseSourceId|packFile|localStorage|document|window)\b/.test(
        text,
      )
    )
      throw new Error(
        `Archive/browser implementation leaked into Adventure domain: ${path.relative(root, file)}`,
      );
  });

  const officialGame = fs.readFileSync(
      path.join(root, "web/src/pages/game/mountOfficialGame.ts"),
      "utf8",
    ),
    gameSession = fs.readFileSync(
      path.join(root, "web/src/runtime/game/createGameSession.ts"),
      "utf8",
    ),
    world = fs.readFileSync(
      path.join(root, "engine/src/world/World.ts"),
      "utf8",
    ),
    game = fs.readFileSync(path.join(root, "engine/src/core/Game.ts"), "utf8"),
    timedChallenge = fs.readFileSync(
      path.join(root, "engine/src/core/TimedChallenge.ts"),
      "utf8",
    ),
    inputController = fs.readFileSync(
      path.join(root, "engine/src/input/InputController.ts"),
      "utf8",
    ),
    screenJoystick = fs.readFileSync(
      path.join(root, "engine/src/input/ScreenJoystick.ts"),
      "utf8",
    ),
    adventureRewards = fs.readFileSync(
      path.join(root, "adventure/src/rewards.ts"),
      "utf8",
    ),
    objectTouch = fs.readFileSync(
      path.join(root, "engine/src/core/object-touch.ts"),
      "utf8",
    );

  if (
    !/planAdventureSession\(meta\.publicId/.test(officialGame) ||
    /meta\.chapterLevel\s*>\s*10/.test(officialGame)
  )
    throw new Error(
      "Official Adventure identity must come from Adventure session planning, not archive chapterLevel",
    );
  if (/createAdventureRuntime|adventureRuntime/.test(officialGame))
    throw new Error(
      "Web must not host a second Adventure gameplay runtime beside Engine",
    );
  if (!/prepareAdventureLevel\(meta\.publicId/.test(officialGame))
    throw new Error(
      "Adventure play must prepare/augment a LevelMap before passing it to Engine",
    );
  if (!/augmentAdventureLevel\(withOriginalBonusRule\s*,\s*propertyPatches\)/.test(adventureRewards))
    throw new Error(
      "Adventure preparation must expose a pure LevelMap augmentation seam",
    );
  if (
    !/isBonusLevelId\(levelId\)/.test(adventureRewards) ||
    !/timedChallengeMs\s*:\s*object\.properties\?\.timedChallengeMs\s*\?\?\s*["']60000["']/.test(
      adventureRewards,
    )
  )
    throw new Error(
      "Original Bonus identity must be encoded into generic Lock timedChallengeMs properties before Engine",
    );

  if (
    !/createGameplayRuntime\(\{[\s\S]*level:\s*options\.level/.test(
      gameSession,
    ) ||
    /\bloadOptions\b/.test(gameSession)
  )
    throw new Error(
      "Web game session must load a pure LevelMap without product-specific gameplay options",
    );
  if (
    !/screenJoystick\?:\s*boolean\s*\|\s*ScreenJoystickOptions/.test(
      inputController,
    ) ||
    !/new ScreenJoystick\(/.test(inputController) ||
    !/directionForJoystickVector\(/.test(screenJoystick)
  )
    throw new Error(
      "Engine ScreenJoystick must enter gameplay through InputController",
    );
  if (
    !/event\.type\s*!==\s*["']dialog["']/.test(gameSession) ||
    !/event\.text\s*\?\?\s*["']\.\.\.["']/.test(gameSession)
  )
    throw new Error(
      "Web game session must present generic Engine dialog events, including empty dialogue",
    );

  if (
    !/type\s*:\s*["']object-interaction["']\s*,\s*objectType\s*:\s*ObjectId\.LOCK\s*,\s*action\s*:\s*["']open["']/.test(
      world,
    ) ||
    /type\s*:\s*["']open-lock["']/.test(world)
  )
    throw new Error(
      "Engine World must report lock behavior through the generic object-interaction event shape",
    );
  if (
    !/onWorldEvent\(listener\s*:\s*WorldEventListener\)/.test(game) ||
    /lock-opened/.test(game) ||
    !/worldEventForObjectTouch\(object\)/.test(game) ||
    !/new TimedChallenge\(\)/.test(game) ||
    !/timedChallengeRemainingMs/.test(game)
  )
    throw new Error(
      "Engine Game must own generic world events, object-touch translation and map-internal TimedChallenge state",
    );
  if (
    !/properties\?\.timedChallengeMs/.test(timedChallenge) ||
    !/collect-golden-carrot/.test(timedChallenge) ||
    !/event\.type\s*===\s*["']death["']/.test(timedChallenge) ||
    !/event\.type\s*===\s*["']complete["']/.test(timedChallenge)
  )
    throw new Error(
      "Engine TimedChallenge must be driven by generic LevelObject properties and WorldEvents",
    );

  for (const capability of [
    "keyboard",
    "pointer",
    "movement",
    "undo",
    "restart",
    "pan",
    "zoom",
    "debug",
  ])
    if (!new RegExp(`${capability}\\?: boolean`).test(inputController))
      throw new Error(`InputController is missing configurable ${capability} capability`);
  if (!/setHeldDirection\(direction\s*:\s*Direction\s*\|\s*null\)/.test(inputController))
    throw new Error(
      "InputController must expose a generic held-direction entry for host controls",
    );

  if (!/type\s*:\s*["']dialog["']/.test(objectTouch))
    throw new Error(
      "Engine object-touch adapter must translate Definition touch results into dialog events",
    );
}

function verifyUnifiedUiShell() {
  const webSourceRoot = path.join(root, "web/src"),
    allowedRootFiles = new Set(["app.ts", "vue-env.d.ts"]),
    unexpectedRootSources = fs
      .readdirSync(webSourceRoot, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() &&
          /\.(?:ts|vue)$/.test(entry.name) &&
          !allowedRootFiles.has(entry.name),
      );
  if (unexpectedRootSources.length > 0)
    throw new Error(
      `Web source files must live in responsibility folders: ${unexpectedRootSources
        .map((entry) => entry.name)
        .join(", ")}`,
    );

  const application = fs.readFileSync(
      path.join(root, "web/src/app/BobbyApp.ts"),
      "utf8",
    ),
    shell = fs.readFileSync(
      path.join(root, "web/src/shell/shellBridge.ts"),
      "utf8",
    ),
    appRoot = fs.readFileSync(
      path.join(root, "web/src/app/AppRoot.vue"),
      "utf8",
    ),
    modeSelector = fs.readFileSync(
      path.join(root, "web/src/shell/ModeSelector.vue"),
      "utf8",
    ),
    dialogLayer = fs.readFileSync(
      path.join(root, "web/src/shell/dialogs/GlobalDialogLayer.vue"),
      "utf8",
    ),
    settingsDialog = fs.readFileSync(
      path.join(root, "web/src/shell/dialogs/SettingsDialog.vue"),
      "utf8",
    ),
    homePage = ["HomeDemo.vue", "HomeModeMenu.vue", "ProjectIntro.vue"]
      .map((file) =>
        fs.readFileSync(path.join(root, "web/src/pages/home", file), "utf8"),
      )
      .join("\n"),
    officialGame = fs.readFileSync(
      path.join(root, "web/src/pages/game/mountOfficialGame.ts"),
      "utf8",
    ),
    pageAdapters = [
      "web/src/pages/home/mountHomePage.ts",
      "web/src/pages/explore/mountExplorePage.ts",
      "web/src/pages/adventure/mountAdventurePages.ts",
      "web/src/pages/editor/mountEditorPage.ts",
      "web/src/pages/game/mountOfficialGame.ts",
    ]
      .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
      .join("\n");

  for (const region of ["home-demo-panel", "home-mode-panel", "home-about"])
    if (!homePage.includes(region))
      throw new Error(`Home is missing required region: ${region}`);
  if (
    !/createApp\(AppRoot/.test(application) ||
    !/installShellBridge/.test(application) ||
    !/root\.value\?\.contains\(target\)/.test(modeSelector)
  )
    throw new Error("Vue App Root must own routing shell and outside-dismiss modes");
  if (
    !/@click\.self=["']emit\('close'\)["']/.test(dialogLayer) ||
    !/class=["']global-dialog settings-dialog["']/.test(settingsDialog)
  )
    throw new Error("Vue global settings dialog must close through its backdrop");
  if (/renderSettingsDialog|settings-card/.test(officialGame))
    throw new Error("Gameplay pages must use the shared application settings dialog");
  if (!/Vue App Shell/.test(shell) || !/renderAppShell/.test(shell))
    throw new Error("Web page adapters must submit state to the Vue App Shell");
  if (/template\s*:/.test(appRoot) || !/AppTopBar/.test(appRoot))
    throw new Error("Vue UI must use responsibility-focused .vue SFC files");
  for (const fixedOption of ["topBarFixed", "bottomBarFixed"]) {
    const configuredPages = pageAdapters.match(
      new RegExp(`${fixedOption}\\s*:\\s*true`, "g"),
    )?.length;
    if (!configuredPages || configuredPages < 4)
      throw new Error(`Internal pages must explicitly configure ${fixedOption}`);
  }
  if (!/app-scroll-region/.test(appRoot))
    throw new Error("Fixed Shell bars must leave scrolling to the content region");
  for (const component of [
    "HomePage.vue",
    "ExplorePage.vue",
    "AdventureHomePage.vue",
    "OfficialGamePage.vue",
    "EditorPage.vue",
  ])
    if (!pageAdapters.includes(component))
      throw new Error(`Web page adapter is missing Vue component: ${component}`);
}

function verifySpaVsStaticRouting(distRoot) {
  for (const route of [
    "/levels",
    "/play/1-1",
    "/adventure",
    "/adventure/chapters",
    "/adventure/chapter/1",
    "/adventure/play/1-1",
    "/edit",
  ]) {
    const result = resolveDistRequest(distRoot, route);
    if (
      result.status !== 200 ||
      !result.spaFallback ||
      path.basename(result.file ?? "") !== "index.html"
    )
      throw new Error(`SPA route did not fall back to index.html: ${route}`);
  }
  for (const missing of [
    "/assets/missing.png",
    "/engine/missing.js",
    "/model/missing",
    "/adventure/missing.js",
    "/vendor/missing",
  ]) {
    const result = resolveDistRequest(distRoot, missing);
    if (result.status !== 404 || result.file)
      throw new Error(
        `Missing static resource incorrectly fell back to SPA: ${missing}`,
      );
  }
}

function verifyWebModuleEntry(webRoot) {
  const html = fs.readFileSync(path.join(webRoot, "index.html"), "utf8"),
    baseHref = html.match(/<base\s+href=["']([^"']+)["']/i)?.[1] ?? "/";
  if (/type=["']importmap["']/.test(html))
    throw new Error("Vite Web build must bundle dependencies without an import map");
  if (!/assets\/[^"]+\.js/.test(html) || !/assets\/[^"]+\.css/.test(html))
    throw new Error("Vite Web build is missing bundled JavaScript or CSS assets");
  for (const match of html.matchAll(
    /<script\s+type=["']module["'][^>]*\ssrc=["']([^"']+)["']/gi,
  ))
    verifyLocal(webRoot, baseHref, match[1], "module script");
}

function verifyLocal(webRoot, baseHref, target, label) {
  const origin = "https://verify.invalid",
    baseUrl = new URL(baseHref, `${origin}/index.html`),
    resolved = new URL(target, baseUrl);
  if (resolved.origin !== origin) return;
  const relative = decodeURIComponent(resolved.pathname).replace(/^\/+/, ""),
    file = path.resolve(webRoot, relative),
    normalizedRoot = `${path.resolve(webRoot)}${path.sep}`;
  if (file !== path.resolve(webRoot) && !file.startsWith(normalizedRoot))
    throw new Error(`${label} escapes dist: ${target}`);
  if (!fs.existsSync(file))
    throw new Error(`${label} resolves to missing build artifact: ${target}`);
}

function walkSource(directory, visitor) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walkSource(file, visitor);
    else if (/\.(?:ts|js|mjs)$/.test(entry.name))
      visitor(file, fs.readFileSync(file, "utf8"));
  }
}
