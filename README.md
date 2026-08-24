# Bobby Carrot 5 Web

Bobby Carrot 5（兔子波比 5）的现代 Web 重制与原版机制研究工程。

目标不是套 Java ME 模拟器，而是保留第五代原始关卡、高清像素美术、MIDI 与谜题机制，重新实现现代 Web Engine；同时保留一条可把**同一张自定义语义地图重新打回原版 JAR** 的验证链路，用原版模拟器确认逆向逻辑。

## 内容

正式发行线：Base / Forever + UP1～UP9。10 个 HD JAR 共 530 条 source level，去重后 485 个唯一关卡。

玩家编号保持原发行结构：
```text
base-0-1
base-1-1
up1-2-7
up9-4-12
```
内部 `001...485` 只用于内容关联，不是 URL。

## 架构

```text
Original JAR / DAT ⇄ @bobby/dat ⇄ @bobby/model::LevelMap
                                           ↑       ↑
                                         Engine <- Editor <- Web
Original JAR validation tool <-------------┘
```

- `model/`：Terrain/Object semantic IDs 与纯 `LevelMap`；
- `dat/`：唯一原版 DAT byte mapping、record/package codec；
- `engine/`：唯一 gameplay/runtime 实现；
- `editor/`：JSON authoring、Play Test、分享；
- `web/`：SPA 产品壳、选关、Play、Settings；
- `tools/`：JAR 解包、Catalog/资产构建、原版验证 JAR patch。

Engine 不知道 Catalog、JAR、DAT byte、release 或 HTTP。Editor/Web 也不维护 DAT mapping；分享与 Debug provenance 调用 `@bobby/dat`。

## Editor

```text
/edit
/edit/base-1-1
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
  --target up9-4-12
```

默认生成：
```text
tmp/original-validation/dragon-test-up9-4-12.jar
```

工具从不可变的官方 JAR 复制，只替换目标 public ID 对应 DAT slot；其它 DAT record 原字节保留，JAR 未改 entry 直接复用原 ZIP local block。修改后失效的签名 entry 会移除。输出后自动重新读取并确认 `LevelMap` 与输入 JSON 严格相等。

于是同一测试输入可以分别跑：
```text
Editor Play Test -> bc5r Engine
patched JAR      -> original Java ME Engine
```
非常适合确认 Dragon、藤蔓、云、荷叶、开关等逆向细节。详见 `docs/workflows/validate-original.md`。

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
输出只有：
```text
dist/
```
SPA 深链接由服务器 fallback 到 `/index.html`，构建不生成逐路由静态页面、旧 canonical-ID route 或 `404.html`。

## 验证

```bash
npm run verify
```
会重建 10 个发行包、验证 485 关、DAT record round-trip、全部 gameplay/editor tests、`dynamic_slots` 派生、原版 JAR patch round-trip、发布结构和浏览器 smoke。

## Git

生成物不提交：
```text
node_modules/
dist/
model/dist/
dat/dist/
engine/dist/
editor/dist/
web/dist-src/
assets/extracted/
assets/generated/
tmp/
```

## 原始资产说明

本工程包含用户提供的 Bobby Carrot 5 原始游戏 JAR 与资源用于重制/研究。公开分发前应自行确认游戏名称、美术、音乐和二进制资源的授权。
