# 开发

要求 Node.js 20+ 与 npm。

```bash
npm install
npm run dev          # 构建并启动 Web :5173
npm run dev:editor   # 构建并直接打开 Editor :5175/edit
npm run build
npm test
npm run verify
```

资产管线：

```bash
npm run assets:extract
npm run assets:decode
npm run assets:build
```

## Engine 调试

不再维护独立 Engine Playground。机关、碰撞、动态实体与 Debug Inspector 都通过正式 Editor + Engine 链路调试。

推荐两种入口：

```text
/edit/<public-id>                    复制官方关卡后调试
editor/examples/mechanics-smoke.json  综合机关测试地图，可直接 Import
```

Editor 的 Play Test 始终调用唯一的 `@bobby/engine`，因此这里验证到的就是正式游戏使用的 Engine，而不是另一套测试壳。

## 构建输出

正式构建只有一个站点根目录：

```text
dist/
```

`/levels`、`/settings`、`/play/<public-id>`、`/edit/<public-id>` 都是客户端 SPA 路由，不会在 `dist/` 中生成对应目录或重复的 `index.html`。部署服务器必须把不存在的应用路由回落到 `/index.html`；开发服务器和 browser smoke test 已按这个规则工作。
