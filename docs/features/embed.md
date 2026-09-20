# Embed

第三方页面通过单文件 `/embed/v1/bc5r.js` 挂载地图。标准代码先写入配置 queue，再以 `async` 加载 standalone runtime，避免 HTML parser 等待脚本下载：

```html
<div id="bc5r" style="width:100%;height:520px;display:grid;place-items:center;
  border:1px solid #254868;background:#071522;color:#c9e6f7">Loading Bobby Carrot 5 Remake…</div>

<script>
window.BC5R = window.BC5R || { queue: [] };
BC5R.queue.push({
  target: "#bc5r",
  mapUrl: "/demo.bc5r.json",
  hud: {
    timer: true,
    steps: true
  }
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

`map` 与 `mapUrl` 互斥且必须提供一个。`mapUrl` 只负责下载文本，两者随后都交给 `@bobby/exchange`，接受 Plain LevelMap / MapDocument JSON、裸 payload 和完整 `/import/v1#<payload>` URL。Payload 可以是 Base64 / Base64URL(JSON)，也可以是 Base64 / Base64URL(gzip(JSON))。Adventure / Explore 存档会明确报告为存档而非地图。

`hud.timer` 与 `hud.steps` 分别控制计时器和计步器，二者默认关闭。Embed 仍由 Engine 渲染 Gameplay HUD；这里的参数只选择需要展示的项目。

第三方来源使用 `mapUrl` 时，该地图服务器需要允许 Embed 宿主页跨源读取。宿主页若配置 Content Security Policy，也需要放行 `bc5r.js` 的 `script-src`，以及站点资源根的 `font-src`、`img-src` 和 `connect-src`。

当前仍发布一个 `bc5r.js`。`async` 消除 parser 的下载等待；只有确认 JavaScript evaluate 本身形成明显长任务时，才考虑拆分 loader 与 runtime。

`bc5r.js` 执行时从自身脚本 URL 推导站点资源根，图片、音频与 Jersey 10 字体都通过该资源根加载。字体使用 `FontFace` 注册到宿主文档，并计入 `handle.ready`，因此第三方页面不需要预先加载 Web 站点样式。公开脚本与 `/assets/` 资源提供跨源读取响应头，支持在其它站点直接嵌入。


## 加载与错误状态

standalone 脚本尚未执行时，推荐宿主 `div` 使用一行轻量占位文本和最少的边框、背景样式，避免 `async` 加载期间出现纯空白区域；脚本执行后由 Shadow DOM 接管显示。

`mount()` 始终创建 Embed shell。Runtime 在地图下载、解码和 Engine 初始化期间显示加载状态；成功后隐藏状态层。空输入、`map` / `mapUrl` 同时提供、网络请求失败、Exchange 解码失败、存档误作地图和非法地图都会在 Embed 内部显示本地化错误，同时 `handle.ready` 仍保持 rejection，queue 模式也继续向 console 报告失败。
