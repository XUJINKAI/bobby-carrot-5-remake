# 开发

要求 Node.js 20+ 与 npm。

```bash
npm install
npm run dev          # 构建并启动 Web :5173
npm run dev:engine   # 构建并启动 Engine Playground :5174
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

Engine 调试：

```text
http://localhost:5174/?level=001
http://localhost:5174/?level=037&debug=1
```

Debug 模式会显示原始 terrain/object ID 与坐标。逆向机关时优先使用 Playground，不要先在 Web UI 里补丁式修行为。

发布输出：

```text
dist/web/
dist/engine-playground/
```
