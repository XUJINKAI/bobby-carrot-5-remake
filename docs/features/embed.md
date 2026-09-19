# Embed

第三方页面通过单文件 `/embed/v1/bc5r.js` 挂载地图。标准代码先写入配置 queue，再以 `async` 加载 standalone runtime，避免 HTML parser 等待脚本下载：

```html
<div id="bc5r" style="width:100%;height:520px"></div>

<script>
window.BC5R = window.BC5R || { queue: [] };
BC5R.queue.push({
  target: "#bc5r",
  mapUrl: "/demo.bc5r.json"
});
</script>

<script async src="https://bc5r.xujinkai.net/embed/v1/bc5r.js"></script>
```

standalone 启动时读取脚本加载前已有的 `BC5R.queue`，安装正式的 `BC5R.mount()` 与可继续接收配置的 `BC5R.queue.push()`，然后按顺序启动每项配置。单项同步失败或 `handle.ready` rejection 只报告该项错误，不阻止后续 mount。

`mount.ts` 不知道 queue，模块消费者和站内 `/embed` preview 可以继续直接调用：

```ts
const handle = BC5R.mount({ target: "#bc5r", map });
await handle.ready;
```

`map` 与 `mapUrl` 互斥且必须提供一个。`mapUrl` 只负责下载文本，两者随后都交给 `@bobby/exchange`，接受 Plain LevelMap JSON、MapDocument JSON、`BC5R1:` 和完整 `/import/v1#` URL。Adventure / Explore 存档会明确报告为存档而非地图。

当前仍发布一个 `bc5r.js`。`async` 消除 parser 的下载等待；只有确认 JavaScript evaluate 本身形成明显长任务时，才考虑拆分 loader 与 runtime。
