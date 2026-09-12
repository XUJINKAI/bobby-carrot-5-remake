# 数据交换

Data Exchange 是 Bobby Carrot 5 Remake 面向地图、Adventure Save、Explore Save 及后续 JSON 数据的统一交换能力。文件、TextBox、剪贴板和分享 URL 先还原同一份 JSON；统一导入 pipeline 再判断业务类型并执行对应导入。

## 用户约定

用户可以直接编辑或粘贴以下任一表示，并使用同一个导入动作：

- Plain JSON；
- `BC5R1:<payload>` 压缩文本；
- 以 `/import/v1#<payload>` 结尾的完整分享 URL；
- 内容为上述任一表示的文本文件；文件扩展名不参与格式判断。

`.bc5r` 是 UTF-8 文本文件，MIME 为 `text/plain;charset=utf-8`。压缩状态下载的文件内容与 TextBox 当前内容完全一致；正式站点配置 `publicBaseUrl` 后，该内容通常是可点击的完整分享 URL。Plain 状态下载 `.json`。

压缩开关只转换 TextBox 当前 draft：Plain 状态显示格式化 JSON，Compressed 状态显示 Share URL 或 `BC5R1:` raw representation。TextBox 对长串文本使用软折行与 `break-all` 字符断行，显示折行不会改变 draft 内容；通过点击获得焦点时自动全选，随后仍可直接输入、粘贴、选择局部文本或调整光标。导入会自动识别表示形式，不依赖开关状态。复制与下载均使用 TextBox 的准确文本。

Editor 的地图文件弹窗默认使用 Compressed 状态，打开后可以直接复制分享 URL。其它消费页面可按场景选择初始表示。

Settings 的存档管理读取浏览器中实际存在的 `bc5r:adventure` 和 `bc5r:explore/<collection>` records，并为每条存档生成一个 Tab。所有 Tab 共用一个 `DataExchangePanel`；选择 Adventure 时交换完整 Adventure Save，选择 Explore 时只交换当前 collection 的 `ExploreCollectionStorage`，导入也只覆盖当前 Tab 对应的 record。

Home 导入弹窗接受 Plain JSON、`BC5R1`、完整分享 URL 和任意扩展名的文本文件。`/import/v1` 只接受 URL fragment 中的 gzip + Base64URL payload。两者在 transport 解码后共用相同的 JSON 识别顺序：

```text
MapDocument / LevelMap → 创建 imported Explore gameplay session
Adventure Save         → 确认后覆盖 Adventure 存档
Explore Save           → 确认后覆盖 Explore 存档
其它 JSON              → 报告无法识别并保持原始文本
```

地图可以携带 `meta`，也可以是纯 `LevelMap`；纯地图会生成 Editor 文档名称。Home 在弹窗内确认存档导入，`/import/v1` 在具有统一 TopBar identity 的导入页面确认。

## Transport V1

`BC5R1` 表示 Data Exchange Transport Version 1，不表示地图或 Profile schema 版本。编码过程为：

```text
JSON text → UTF-8 → gzip → Base64URL payload
```

Base64URL 只使用 `A-Z a-z 0-9 - _`，省略尾部 padding。raw representation 为 `BC5R1:<payload>`。分享地址为：

```text
<publicBaseUrl>/import/v1#<payload>
```

Payload 位于 fragment，浏览器只在客户端读取。Decoder 只还原 `unknown` JSON；Map、Adventure Save、Explore Save 等 schema 识别由统一 import pipeline 完成。

## 站点根地址

`publicBaseUrl` 是包含 scheme、host、port 和可选 pathname 的完整 Web App 根地址。URL 拼接统一先清除 query/fragment、保留并规范化 pathname 尾部，再用相对路径 `import/v1` 构造。

```text
https://bc5r.xujinkai.net
→ https://bc5r.xujinkai.net/import/v1#PAYLOAD
```

Vite `base` 负责构建资源路径，`publicBaseUrl` 负责分享地址。构建通过 `BC5R_BASE_PATH` 配置前者，通过 `VITE_PUBLIC_BASE_URL` 配置后者；未配置分享根地址时使用 `document.baseURI`。

正式构建会为 `/import/v1` 生成独立 route shell，保证 fragment 分享 URL 的 pathname 可以从新导航直接加载应用。

## 公共层职责

`web/src/shared/data-exchange/` 提供 gzip、Base64URL、`BC5R1`、格式识别、分享 URL、文本文件 I/O，以及可配置左右 toolbar、label 和 placeholder 的 `DataExchangePanel`。

公共层不知道 Map、Editor 或 Save。`web/src/services/import/importPipeline.ts` 在其上组织领域识别与存档应用；Home 和 `/import/v1` 共享该 pipeline，只分别提供文本/文件输入和 URL fragment 输入。地图游玩、确认 UI 与页面导航仍由消费页面负责。

Transport 区分 JSON 格式错误、未知表示、无效 Base64URL、损坏 gzip 与不支持的 transport 版本。领域 parser 提供业务类型错误；解析失败时保留 TextBox draft，且不修改业务数据。
