# 开发

要求 Node.js 20+。

```bash
npm install
npm run dev           # http://localhost:5173
npm run dev:editor    # http://localhost:5175/edit
```

Workspace：
```text
model   纯 semantic LevelMap/IDs
dat     原版 DAT 互操作
engine  gameplay/runtime
editor  authoring + share boundary
web     product SPA
tools   assets/catalog/original JAR validation
```

TypeScript 使用 project references，依赖顺序由 `tsc -b` 与 package dependencies 表达，不在 tsconfig paths 里指向兄弟包的 dist 声明文件。

Engine 机关调试统一通过 Editor Play Test：打开 `/edit/<public-id>` 或 Import `editor/examples/mechanics-smoke.json`。

需要原版差分验证：
```bash
npm run original:patch -- --map test.json --target up9-4-12
```

构建：
```bash
npm run build
```
只生成一个发布根 `dist/`。`/levels`、`/settings`、`/play/*`、`/edit/*` 是 SPA 路由，部署服务器应只对应用路由 fallback 到 `index.html`；缺失静态资源应返回 404。
