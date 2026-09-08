# 开发与构建

README 只负责项目概览。本地环境、开发、构建和部署相关命令统一维护在本文档。

## 环境

要求 Node.js 20+。

安装依赖：

```bash
npm install
```

## 本地开发

启动完整 Web：

```bash
npm run dev
```

默认地址：`http://localhost:5173`。

开发服务器由 Vite 提供源码级热更新。`web/src`、`engine/src`、`editor/src`、`adventure/src` 和 `model/src` 的修改会直接参与下一次模块编译；Vue 组件支持 HMR，游戏运行时模块更新后可能触发整页刷新。

Editor 使用同一个 Web 开发入口，可直接打开：

```text
http://localhost:5173/edit
```

如果只需要预览已有 `dist/`：

```bash
npm run preview
```

该命令使用项目自带静态服务器，不监听源码变化，也不会重新构建。预览服务器按照正式构建的 route shell 提供页面：合法路径读取对应的 `dist/<path>/index.html`，不存在的路径返回 404。

## Workspace

```text
model      纯 semantic LevelMap / IDs
engine     gameplay / runtime
adventure  Campaign / Save / Adventure runtime rule
editor     authoring + share boundary
web        product SPA
tools      assets / Original DAT / original JAR validation
```

TypeScript 使用 project references。依赖顺序由 `tsc -b` 与 package dependencies 表达，不在 `tsconfig` paths 中指向兄弟包的 `dist` 声明文件。

更完整的模块职责和依赖方向见 [`architecture.md`](architecture.md)。

## 构建

```bash
npm run build
```

正式构建只生成一个发布根：

```text
dist/
```

Web 仍使用同一套 SPA bundle。构建会根据 Map / Adventure Catalog 为合法公开路径生成静态 route shell，并同时生成 `sitemap.xml`、`robots.txt` 与 `404.html`。每个 route shell 只提供该 URL 对应的 HTML `<head>` 和 SPA 挂载入口，页面交互继续由 Web SPA 接管。

以下目录均为生成物，不提交 Git：

```text
node_modules/
dist/
model/dist/
adventure/dist/
engine/dist/
editor/dist/
original/extracted/
original/decoded/
original/adapted/
assets/maps/
assets/art/hd/
assets/audio/midi/
tmp/
```

## 部署

正式站点为 `https://bc5r.xujinkai.net`。

部署服务器应优先提供实际静态文件。对于无扩展名的页面路径，例如 `/explore/play/original/1-1`，应定位到对应的 `/explore/play/original/1-1/index.html`；对应 route shell 不存在时返回真正的 404。

Vercel 的规则维护在根目录 `vercel.json`。其他静态服务器应采用等价语义，不应把任意未知路径统一 fallback 到根 `/index.html`。

## 机关与 Editor 调试

Engine 机关调试统一通过 Editor Play Test。打开 Catalog 地图时使用 Editor fragment：

```text
/edit#map=<collection>/<map-id>
```

例如：

```text
/edit#map=original/1-1
```

也可以通过 Data Exchange 导入测试地图。

新增或修改机制的完整流程见 [`workflows/add-mechanic.md`](workflows/add-mechanic.md)。

## 原版差分验证

需要确认 Bobby Carrot 5 原版行为时，可将语义地图 patch 回原版 JAR：

```bash
node tools/cli.mjs original patch \
  --in custom-maps/original-patch \
  --out tmp/original-patch
```

工具以输入目录内 JSON 文件名匹配 Campaign public ID，根据 Catalog provenance 找到所属原始 JAR、DAT 与 record slot；同一 JAR 的多个目标会合并输出，并在输出后重新读取目标 DAT record，确认内容与反向 Adapter 的输出一致。

详细流程见 [`workflows/validate-original.md`](workflows/validate-original.md)。

## 完成前验证

```bash
npm run verify
```

完整验证内容见 [`verification.md`](verification.md)。任何任务在 verify 失败时都不能视为完成。
