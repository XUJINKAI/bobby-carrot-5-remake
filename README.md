# Bobby Carrot 5 Remake

**Bobby Carrot 5 Remake**（兔子波比 5）的现代 Web 重制与原版机制研究工程。

目标不是套 Java ME 模拟器，而是保留第五代原始关卡、高清像素美术、MIDI 与谜题机制，重新实现现代 Web Engine；同时保留一条可把**同一张自定义语义地图重新打回原版 JAR** 的验证链路，用原版模拟器确认逆向逻辑。

## 原版内容

10 个 HD JAR（Base / Forever + UP1～UP9）共包含 530 条 source level record；去重后是：

```text
480 个正式 Campaign 地图
  = 40 章 × (10 个普通关 + 2 个 Bonus)

5 个共享特殊场景
  = Beaver Shop / Cloud 9 / Dream Machine / Dreamland Reward / Campaign Intro

合计 485 个唯一 DAT map
```

玩家可见的正式关卡身份尊重原游戏连续章节编号：

```text
1-1
1-2
1-3
1-bonus-1
1-4
...
40-10
```

`base / up01 ... up09`、DAT 文件名和 record slot 只属于原始档案 provenance，不再成为玩家 ID。

每章原版章节选择界面的 1～3 星难度直接来自 DAT chapter metadata 的 `packType`，不做估算。

## 两种官方地图体验

### Explore / 自由选关

- 40 章全部平铺开放；
- 不锁关；
- 支持难度、萝卜数、道具、场景和机关筛选；
- 允许自由缩放、DEBUG 和在 Editor 中打开；
- 用于找关、研究机制和快速测试。

### Adventure / 原版冒险

- 独立 `@bobby/adventure` domain；
- 按原版章内顺序推进，例如 `1-3 -> 1-bonus-1 -> 1-4`；
- 章节选择显示原版 1～3 星难度；
- 独立 Adventure Save、全局经济、永久道具和一次性奖励；
- PC 上仍使用受限竖屏视野，避免横屏/缩小后直接看完整张原版谜题地图；
- 特殊场景、商店和历史在线功能继续作为 Adventure 内容逐步还原。

自定义地图、分享地图和 Editor Play Test **不进入 Adventure Campaign**。

## 架构

```text
Original JAR / DAT ⇄ @bobby/dat ⇄ @bobby/model::LevelMap
                                           ↑      ↑
                                      @bobby/engine
                                           ↑
                                  generic WorldEvent port
                                           ↑
                                    @bobby/adventure
                                           ↑
                                          Web

Editor -------------------------------> Engine
Tools ----> DAT / archive provenance / original JAR patch
```

- `model/`：Terrain/Object semantic IDs 与纯 `LevelMap`；
- `dat/`：唯一原版 DAT byte mapping、record/package codec；
- `engine/`：唯一 gameplay/runtime 实现；
- `adventure/`：原版 Campaign identity/order、Save、全局奖励、Adventure runtime rule；
- `editor/`：JSON authoring、Play Test、分享；
- `web/`：SPA 产品壳、怀旧首页、Explore、Adventure UI、Settings；
- `tools/`：JAR 解包、Catalog/资产构建、原版验证 JAR patch。

Engine 不知道 Catalog、JAR、DAT byte、release、chapter 或 Adventure Bonus。它只暴露通用 WorldEvent 流和通用 `killPlayer()` 等运行时能力。

例如原版 Bonus 的 60 秒规则由 Adventure 完成：Engine 报告通用 `object-interaction`；Adventure 发现 `objectType=LOCK` 且 `action=open` 后启动自己的倒计时；收到 `complete/death` 后结束计时；超时只调用 Engine 的 `killPlayer()`。Explore、Editor 和分享地图没有这个规则。

## Adventure Save

Adventure 存档是版本化 JSON，浏览器默认保存在本地，也可在 Settings 直接导入/导出：

```text
campaign progress
completed one-shot events
Bonus Coin / Golden Carrot balance
Speed Shoes / Magnifying Glass / Golden Key
claimed persistent reward positions
legacy Magic Codes
```

官方持久奖励按“关卡 ID + Object 类型 + 地图坐标”记录，重玩不会无限刷；原始 `LevelMap` 本身始终不被存档状态修改。

## Editor

```text
/edit
/edit/1-1
/edit#map=...
/play#map=...
```

编辑交互：左键放置、右键/Del 删除完整 Object、中键平移、滚轮缩放、Q/E 变换支持 authoring variant 的 Object、Undo/Redo、Resize、JSON Import/Export、Play/Stop、URL Share。没有 Eyedropper，也没有独立 Eraser mode。

multi-cell Object 只保存 anchor；Dragon 尾部被指向时仍 resolve 到整条 Dragon owner。

分享 payload 为 metadata envelope + `@bobby/dat` 生成的原版 DAT level record，再进行 deflate/base64url；不存在第二套 DAT table，也不继续兼容早期 `j./z.` 分享格式。

## 用原版模拟器验证自定义地图

先从 Editor 导出 JSON：

```bash
npm run original:patch -- \
  --map ./dragon-test.json \
  --target 40-10
```

默认输出到 `tmp/original-validation/`。工具通过 Catalog provenance 找回目标 public ID 对应的原始 JAR / DAT / record slot，只替换该 level record；其它 DAT record 原字节保留，修改后失效的签名 entry 会移除。输出后自动重新读取并确认 `LevelMap` 与输入 JSON 严格相等。

于是同一测试输入可以分别跑：

```text
Editor Play Test -> Bobby Carrot 5 Remake Engine
patched JAR      -> original Java ME Engine
```

详见 `docs/workflows/validate-original.md`。

## 开发

```bash
npm install
npm run dev
npm run dev:editor
```

## 构建

```bash
npm run build
```

正式输出只有一个站点根：

```text
dist/
```

SPA 深链接由服务器 fallback 到 `/index.html`，缺失静态资源仍必须返回真正的 404。

## 验证

```bash
npm run verify
```

会重建 10 个原始发行包，验证 530 条 source record / 485 个唯一 DAT map / 480 个 Campaign level、全部 source `dynamic_slots` 派生、DAT round-trip、Adventure/Engine/Editor tests、原版 JAR patch round-trip、静态路由与浏览器 Explore/Adventure smoke，以及源码质量门禁。

## Git

生成物不提交：

```text
node_modules/
dist/
model/dist/
dat/dist/
adventure/dist/
engine/dist/
editor/dist/
web/dist-src/
assets/extracted/
assets/generated/
tmp/
```

## 原始资产说明

本工程包含用户提供的 Bobby Carrot 5 原始游戏 JAR 与资源用于重制/研究。公开分发前应自行确认游戏名称、美术、音乐和二进制资源的授权。
