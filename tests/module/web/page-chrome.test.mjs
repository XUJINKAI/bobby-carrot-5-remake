import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import {
  globalActions,
  localizeGlobalActions,
  musicActionIcon,
  repositoryAction,
} from "../../../web/src/app/pageChrome.ts";
import { narrowBottomTrailingActions } from "../../../web/src/shell/responsiveActions.ts";
import { initializeWebI18n } from "../../../web/src/i18n/webI18n.ts";

test("语言入口按页面启用，位于音乐左侧并随语言更新提示", async () => {
  await initializeWebI18n("zh-CN");
  assert.deepEqual(globalActions().map((action) => action.id), ["music", "settings", "help"]);
  const actions = globalActions({ languageSwitch: true });
  assert.deepEqual(actions.map((action) => action.id), ["language", "music", "settings", "help"]);
  assert.equal(actions[0].icon, "language");
  assert.equal(actions[0].collapse, "keep");
  assert.equal(actions[0].label, "English");
  assert.equal(actions[0].title, "Switch to English");
  try {
    await initializeWebI18n("en");
    localizeGlobalActions(actions);
    assert.equal(actions[0].label, "中文");
    assert.equal(actions[0].title, "切换到中文");
  } finally {
    await initializeWebI18n("zh-CN");
  }
});

test("音乐操作根据开关状态使用扬声器图标", () => {
  assert.equal(musicActionIcon(true), "sound-on");
  assert.equal(musicActionIcon(false), "sound-off");
});

test("首页 GitHub 入口在移动端保持外露", () => {
  assert.equal(repositoryAction().collapse, "keep");
});

test("首页与顶栏共用模式文案，并把 Explore 排在 Adventure 前", () => {
  const chrome = readFileSync(
    new URL("../../../web/src/app/pageChrome.ts", import.meta.url),
    "utf8",
  );
  const home = readFileSync(
    new URL("../../../web/src/pages/home/HomeModeMenu.vue", import.meta.url),
    "utf8",
  );

  assert.ok(
    chrome.indexOf('webT("nav.explore")')
      < chrome.indexOf('webT("nav.adventure")'),
  );
  assert.match(home, /webT\("nav\.explore"\)/);
  assert.match(home, /webT\("nav\.adventure"\)/);
  assert.match(home, /webT\("nav\.editor"\)/);
  assert.doesNotMatch(home, /webT\("home\.(?:explore|adventure|editor)"\)/);
});

test("仅首页应用名在窄屏保持显示", () => {
  const identitySource = readFileSync(
    new URL("../../../web/src/shell/ShellIdentity.vue", import.meta.url),
    "utf8",
  );
  const chromeSource = readFileSync(
    new URL("../../../web/src/app/pageChrome.ts", import.meta.url),
    "utf8",
  );
  const settingsSource = readFileSync(
    new URL(
      "../../../web/src/pages/settings/mountSettingsPage.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const compactRule = identitySource.match(
    /@media \(max-width: 900px\) \{([\s\S]*?)\n\}/,
  )?.[1] ?? "";

  assert.match(identitySource, /identity\.productNameVisibleOnNarrow/);
  assert.match(compactRule, /\.shell-product-name:not\(\.narrow-visible\)/);
  assert.match(chromeSource, /productNameVisibleOnNarrow: true/);
  assert.match(settingsSource, /productNameVisibleOnNarrow: false/);
  assert.doesNotMatch(compactRule, /\.shell-status-text/);
});

test("游戏顶栏把 Restart 排在左侧导航之后", () => {
  const source = readFileSync(
    new URL("../../../web/src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );
  const configSource = source.slice(source.indexOf("function gameShellConfig"));
  const leadingSource = configSource.slice(
    configSource.indexOf("leading: ["),
    configSource.indexOf("commands:"),
  );
  const commandsSource = configSource.slice(
    configSource.indexOf("commands:"),
    configSource.indexOf("actions:"),
  );

  assert.ok(leadingSource.indexOf('id: "previous-level"') >= 0);
  assert.ok(
    leadingSource.indexOf('id: "previous-level"')
      < leadingSource.indexOf('id: "next-level"'),
  );
  assert.ok(
    leadingSource.indexOf('id: "next-level"')
      < leadingSource.indexOf('id: "restart"'),
  );
  assert.doesNotMatch(commandsSource, /id: "restart"/);
  assert.match(configSource, /back:\s*\{[\s\S]*?label: webT\("shell\.back"\)/);
});

test("Explore 前后关在移动端保持显示", () => {
  const gameSource = readFileSync(
    new URL("../../../web/src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    gameSource,
    /id: "previous-level"[\s\S]*?collapse: "keep"[\s\S]*?id: "next-level"[\s\S]*?collapse: "keep"/,
  );
});

test("窄屏把游戏 Undo 和 Redo 移到摇杆左侧", () => {
  const gameSource = readFileSync(
    new URL("../../../web/src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );
  const editorSource = readFileSync(
    new URL("../../../web/src/pages/editor/editorShell.ts", import.meta.url),
    "utf8",
  );
  const bottomBarSource = readFileSync(
    new URL("../../../web/src/shell/AppBottomBar.vue", import.meta.url),
    "utf8",
  );
  const actionSource = readFileSync(
    new URL("../../../web/src/shell/ShellActionButton.vue", import.meta.url),
    "utf8",
  );

  assert.match(
    gameSource,
    /id: "undo"[\s\S]*?narrow: \{ placement: "bottom-trailing" as const \}[\s\S]*?id: "redo"[\s\S]*?narrow: \{ placement: "bottom-trailing" as const \}/,
  );
  assert.match(
    editorSource,
    /id: "editor-undo"[\s\S]*?narrow: \{ placement: "bottom-trailing" \}[\s\S]*?id: "editor-redo"[\s\S]*?narrow: \{ placement: "bottom-trailing" \}/,
  );
  const relocated = narrowBottomTrailingActions({
    topBar: {
      leading: [{ id: "previous" }],
      commands: [
        { id: "undo", narrow: { placement: "bottom-trailing" } },
        { id: "redo", narrow: { placement: "bottom-trailing" } },
      ],
      actions: [{ id: "settings" }],
    },
  });
  assert.deepEqual(relocated.map((action) => action.id), ["undo", "redo"]);
  assert.ok(
    bottomBarSource.indexOf("narrowTrailing ?? []")
      < bottomBarSource.indexOf("config.trailing ?? []"),
  );
  assert.match(bottomBarSource, /:dom-id="`narrow-\$\{item\.id\}`"/);
  assert.match(actionSource, /narrow-icon-only/);
  assert.match(gameSource, /id: "screen-control"[\s\S]*?narrow: \{ iconOnly: true \}/);
  assert.match(editorSource, /id: "screen-control"[\s\S]*?narrow: \{ iconOnly: true \}/);
});

test("移动端顶栏按左侧、中央、右侧顺序排列", () => {
  const source = readFileSync(
    new URL("../../../web/src/shell/AppTopBar.vue", import.meta.url),
    "utf8",
  );
  const compactRule = source.slice(
    source.indexOf("@media (max-width: 700px)"),
    source.indexOf("</style>"),
  );

  assert.match(compactRule, /\.app-topbar\s*\{[\s\S]*?display: flex/);
  assert.match(
    compactRule,
    /\.shell-topbar-right\s*\{[\s\S]*?margin-left: auto/,
  );
  assert.doesNotMatch(compactRule, /grid-template-columns/);
});

test("Adventure 在宽屏显示产品名并统一返回文案", () => {
  const adventureSource = readFileSync(
    new URL(
      "../../../web/src/pages/adventure/mountAdventurePages.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const gameSource = readFileSync(
    new URL("../../../web/src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    adventureSource,
    /pageIdentity\(webT\("nav\.adventure"\), "\/adventure"\)/,
  );
  assert.match(
    adventureSource,
    /back:\s*\{[\s\S]*?label: webT\("shell\.back"\)/,
  );
  assert.match(gameSource, /source === "adventure"/);
});
