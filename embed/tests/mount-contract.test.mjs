import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Embed 配置不包含未实现的主题入口", async () => {
  const [typesSource, mountSource] = await Promise.all([
    readFile(new URL("../src/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/mount.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(typesSource, /\btheme\??:/);
  assert.doesNotMatch(mountSource, /dataset\.theme/);
});

test("Embed 把 Pointer 与键盘缩放能力交给 Engine Input", async () => {
  const [typesSource, mountSource] = await Promise.all([
    readFile(new URL("../src/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/mount.ts", import.meta.url), "utf8"),
  ]);

  assert.match(typesSource, /pointer\?: boolean/);
  assert.match(typesSource, /EmbedKeyboardMode = "focus" \| "global"/);
  assert.doesNotMatch(typesSource, /EmbedKeyboardMode = [^;]*false/);
  assert.match(
    mountSource,
    /options\.input\?\.keyboard === "global" \? "global" : "focus"/,
  );
  assert.match(mountSource, /options\.input\?\.pointer \?\? true/);
  assert.match(mountSource, /\bpointer,/);
  assert.match(mountSource, /zoom: true/);
});

test("Embed HUD 只公开计时器与计步器，且默认关闭", async () => {
  const [typesSource, mountSource] = await Promise.all([
    readFile(new URL("../src/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/mount.ts", import.meta.url), "utf8"),
  ]);

  assert.match(typesSource, /interface EmbedHudOptions/);
  assert.match(typesSource, /timer\?: boolean/);
  assert.match(typesSource, /steps\?: boolean/);
  assert.match(typesSource, /hud\?: EmbedHudOptions/);
  assert.doesNotMatch(typesSource, /objective\?: boolean/);
  assert.doesNotMatch(typesSource, /items\?: boolean/);
  assert.match(mountSource, /timer: options\.hud\?\.timer \?\? false/);
  assert.match(mountSource, /steps: options\.hud\?\.steps \?\? false/);
});

test("Embed 框架使用固定首页、地图打开动作与操作提示", async () => {
  const mountSource = await readFile(
    new URL("../src/mount.ts", import.meta.url),
    "utf8",
  );

  assert.match(mountSource, /https:\/\/bc5r\.xujinkai\.net\//);
  assert.match(mountSource, /frameControls\.open\.href = playUrl/);
  assert.match(mountSource, /encodeExchangeText\(JSON\.stringify\(level\)/);
  assert.doesNotMatch(mountSource, /CompressionStream|\bbtoa\(/);
  assert.match(mountSource, /runtime\.game\.restart\(\)/);
  assert.match(
    mountSource,
    /createOriginalGameplayImageManager\(embedArtUrl\)/,
  );
  assert.doesNotMatch(mountSource, /"bobby-left":/);
  assert.match(mountSource, /embedRuntimeText\(locale, "embedRuntime\.movementHint"\)/);
});

test("Embed 终局卡片使用框架配色，并把官网主页操作放在重新开始左侧", async () => {
  const [mountSource, zhCNSource, enSource] = await Promise.all([
    readFile(new URL("../src/mount.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../../i18n/src/locales/embed-runtime/zh-CN.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../i18n/src/locales/embed-runtime/en.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(mountSource, /official\.href = homePageUrl/);
  assert.doesNotMatch(mountSource, /terminal\.official\.href = playUrl/);
  assert.match(mountSource, /actions\.append\(official, restart\)/);
  assert.match(mountSource, /background: #0d2b46; color: #eef5ff/);
  assert.match(zhCNSource, /"embedRuntime\.won": "已完成"/);
  assert.match(enSource, /"embedRuntime\.won": "Completed"/);
});

test("Embed 服从 LevelMap 的地图音乐选择", async () => {
  const mountSource = await readFile(
    new URL("../src/mount.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(mountSource, /playMusic\(["']ingame1["']\)/);
});


test("Embed 接受浏览器 locale tag，并在 mount 开头只解析一次 locale 贯穿全部 UI", async () => {
  const [typesSource, mountSource] = await Promise.all([
    readFile(new URL("../src/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/mount.ts", import.meta.url), "utf8"),
  ]);

  assert.match(typesSource, /lang\?: string/);
  assert.match(mountSource, /const locale = resolveEmbedLocale\(options\.lang\)/);
  assert.match(mountSource, /root\.dataset\.lang = locale/);
  assert.match(mountSource, /createFrameControls\(audio\.enabled, locale\)/);
  assert.match(mountSource, /createTerminalOverlay\(locale\)/);
  assert.match(mountSource, /createInfoFooter\(options\.info, locale\)/);
  assert.match(mountSource, /installTerminalOverlay\(runtime, terminal, canvasWrap, locale, cleanup\)/);
  assert.equal((mountSource.match(/resolveEmbedLocale\(/g) ?? []).length, 2);
  assert.match(mountSource, /function resolveEmbedLocale\(lang: string \| undefined\): Locale/);
  assert.doesNotMatch(mountSource, /options\.lang \?\? "zh-CN"/);
});


test("Embed runtime 自己显示加载与失败状态，ready 契约保持不变", async () => {
  const [mountSource, statusSource] = await Promise.all([
    readFile(new URL("../src/mount.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/status.ts", import.meta.url), "utf8"),
  ]);

  assert.match(mountSource, /createEmbedStatus\(locale\)/);
  assert.match(mountSource, /status\.loading\(\)/);
  assert.match(mountSource, /status\.hide\(\)/);
  assert.match(mountSource, /status\.error\(error\)/);
  assert.match(statusSource, /EXCHANGE_ERROR_CODES\.invalidMap/);
  assert.match(statusSource, /EmbedMapInputError/);
});
