import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import {
  musicActionIcon,
  repositoryAction,
} from "../../../web/src/app/pageChrome.ts";

test("音乐操作根据开关状态使用扬声器图标", () => {
  assert.equal(musicActionIcon(true), "sound-on");
  assert.equal(musicActionIcon(false), "sound-off");
});

test("首页 GitHub 入口在移动端保持外露", () => {
  assert.equal(repositoryAction().collapse, "keep");
});

test("首页开发状态在移动端保持显示", () => {
  const source = readFileSync(
    new URL("../../../web/src/shell/ShellIdentity.vue", import.meta.url),
    "utf8",
  );
  const compactRule = source.match(
    /@media \(max-width: 900px\) \{([\s\S]*?)\n\}/,
  )?.[1] ?? "";

  assert.match(compactRule, /\.shell-product-name/);
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

test("Adventure 隐藏产品名并统一返回文案", () => {
  const source = readFileSync(
    new URL(
      "../../../web/src/pages/adventure/mountAdventurePages.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /pageIdentity\(webT\("nav\.adventure"\), "\/adventure", false\)/);
  assert.match(source, /back:\s*\{[\s\S]*?label: webT\("shell\.back"\)/);
});
