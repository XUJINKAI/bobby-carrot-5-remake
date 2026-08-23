# Bobby Carrot 5 Web

Bobby Carrot 5（兔子波比 5）的现代 Web 重制工程。

目标不是在浏览器中套 Java ME 模拟器，而是保留第五代原始关卡、高清像素美术、MIDI 与谜题机制，重新实现适合桌面和手机的游戏引擎、Camera、操作方式和选关界面。

## 内容结构

第五代正式发行线按资料校验为：

```text
Base / Forever
UP1
UP2
...
UP9
```

10 个正式高清 JAR 一共包含 530 条 source level，其中每个版本都重复携带 5 个公共教学关。按完整 level record SHA-256 精确去重后得到：

```text
485 个唯一关卡
```

玩家界面尊重原始发行结构，不再平铺 `001...485`：

```text
发行包 → 章节 → 关卡

base-0-1      # Base 教学关 1
base-1-1      # Base / Chapter 1 / Level 1
up1-2-7       # UP1 / Chapter 2 / Level 7
up9-4-12      # UP9 / Chapter 4 / Level 12
```

`001...485` 仍保留为内部 canonical ID，用于内容去重和旧存档兼容，不作为主 UI 编号。这个命名空间也方便以后增加 `custom-*` 自定义关卡。

## 当前功能

- Base + UP1~UP9 十个高清发行包自动解包、DAT 解码、去重；
- 485 关经典层级选关；
- “继续游玩”和“随机一个关卡”；
- 原始章节名和章节内关卡序号；
- 历史 A/B/C=简单、D/E=中等、F=困难的难度资料映射；
- 288 个非教学关直接使用历史难度，剩余 192 关基于历史样本做 KNN 估算并用 `≈` 明确标记；
- UP9 HD 48px 原版美术；
- `ts.png` 静态图集与 `ta.png` 原版动态格动画；
- Bobby 四方向原版动画；
- 平滑格间移动、Camera、Zoom；
- WASD / 方向键 / Swipe / Pinch；
- Undo / Restart / Debug Tile Inspector；
- 通关、死亡提示和本地完成进度；
- 原始 MIDI 浏览器播放；
- Bonus Round 60 秒倒计时、Beaver 一次性钥匙 / Super Key 接口；
- Bonus Coin / Golden Carrot 本地档案；
- Engine / Editor / Web 分层：Web 同时调用 Engine 和 Editor，Editor Play Test 仍使用唯一的 Engine；
- 内置 JSON 地图编辑器、官方关卡复制编辑、Import/Export 与 `#map=` URL 分享。

已经恢复的运行时机制包括胡萝卜/蛋巢、割草机/汽油/高草、雪铲/雪、冰面、加速格、双色机关、陷阱、旋转地板、魔法镜、木板、魔豆与分段生长藤蔓、荷叶、风筝、龙火/融冰、风车、动态云等。复杂机关仍以“字节码确认优先”的方式继续补全；无法确认的规则会在代码/文档中明确标记推断，而不是伪装成原版事实。

## 地图编辑器

Editor 是游戏本身的一项能力，不分 Inspect/Edit 两套模式，也不碰 DAT。

```text
/edit                  新建 JSON 地图
/edit/base-1-1         复制官方关卡后编辑
/edit#map=...          打开分享地图继续编辑
/play#map=...          直接游玩分享地图
```

当前功能保持克制：Terrain/Object、画笔、擦除、吸管、Undo/Redo、Resize、JSON Import/Export、Play/Stop 和 URL Share。

点 **Play** 时 Editor 会克隆当前 Draft，转换成标准 `LevelData` 后交给 `@bobby/engine`。Runtime 中的胡萝卜消失、开关变化、藤蔓生长、云/荷叶移动等状态都不会反写 Editor Draft。

分享链接使用 URL Fragment `#map=`：Terrain 先 RLE，Object 压成三元组，再优先 `deflate-raw + base64url`。实测正式关卡通常只有约 500～900 个分享字符；超过约 8KB 时 Editor 会建议改用 JSON 文件。

`editor/examples/mechanics-smoke.json` 是用于 Engine 开发的综合机关测试地图，可直接 Import。

## MIDI

原始 `.mid` 不转换成 MP3/OGG。

浏览器使用 `webaudio-tinysynth@1.1.4`：它是单文件 WebAudio GM-like 合成器，自带 MIDI-SMF sequencer，Apache-2.0。

正常执行：

```bash
npm install
npm run build
```

构建脚本会把 TinySynth 从 `node_modules` 复制进 `dist/web/vendor/`，所以正式发布后音乐不依赖 CDN。只有在没有安装 npm dependency 的受限开发环境中，运行时才回退到固定版本 jsDelivr URL。

## 开发

要求 Node.js 20+。

```bash
npm install
npm run dev
```

默认：

```text
http://localhost:5173
```

只调试 Engine：

```bash
npm run dev:engine
npm run dev:editor   # http://localhost:5175/edit
```

例如：

```text
http://localhost:5174/?level=001&debug=1
```

## 构建

```bash
npm run build
```

`build` 会从仓库中保留的 10 个原始 HD JAR 自动执行：

```text
JAR 解包
  ↓
DAT 解码
  ↓
530 source level
  ↓ SHA-256 去重
485 canonical level
  ↓
难度 / public ID / 章节 catalog
  ↓
TypeScript Engine + Editor + Web
  ↓
dist/web
```

发布目录：

```text
dist/web/
```

构建会同时生成 `/levels`、`/settings`、全部 `/play/<public-id>/` 静态入口以及 `404.html`，普通静态服务器无需额外 SPA fallback 也能直接刷新关卡 URL。

## 验证

```bash
npm run verify
```

它会从原始 JAR 重新构建全部数据、编译 Engine/Web、运行机关回归测试并校验 10 个发行包、41 个可见章节、485 关 public ID 和发布文件。

## Git

仓库只保留源码、文档、原始 JAR 与逆向参考数据。以下内容全部由构建生成并已写入 `.gitignore`：

```text
dist/
engine/dist/
editor/dist/
web/dist-src/
assets/extracted/
assets/generated/
node_modules/
```

因此 clone 后先执行 `npm install`，之后 `npm run dev` / `npm run build` 即可。

## 文档

先阅读：

```text
AGENTS.md
docs/design.md
docs/architecture.md
docs/contracts/
docs/reference/
```

尤其是 `docs/reference/runtime-animation.md` 和 `docs/reference/tile-ids.md`，里面记录了已经从原版 UP9 字节码确认的动画 Tick、图集帧、藤蔓、荷叶、对象 ID 等事实。

## 原始资产说明

本工程包含用户提供的 Bobby Carrot 5 原始游戏 JAR 与资源用于重制/研究。若将仓库公开发布，应自行确认对原游戏名称、美术、音乐和二进制资源拥有相应的分发权限。
