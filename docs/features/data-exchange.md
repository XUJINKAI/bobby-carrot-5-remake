# 数据交换

Data Exchange 是 Bobby Carrot 5 Remake 面向地图、Adventure Profile 及后续 JSON 数据的统一文本交换能力。文件、TextBox、剪贴板和分享 URL 只负责搬运同一段文本；数据所属业务由消费页面判断。

## 用户约定

用户可以直接编辑或粘贴以下任一表示，并使用同一个导入动作：

- Plain JSON；
- `BC5R1:<payload>` 压缩文本；
- 以 `/import/v1#<payload>` 结尾的完整分享 URL；
- 内容为上述任一表示的 `.json`、`.bc5r` 或 `.txt` 文件。

`.bc5r` 是 UTF-8 文本文件，MIME 为 `text/plain;charset=utf-8`。压缩状态下载的文件内容与 TextBox 当前内容完全一致；正式站点配置 `publicBaseUrl` 后，该内容通常是可点击的完整分享 URL。Plain 状态下载 `.json`。

压缩开关只转换 TextBox 当前 draft：Plain 状态显示格式化 JSON，Compressed 状态显示 Share URL 或 `BC5R1:` raw representation。TextBox 通过点击获得焦点时自动全选，随后仍可直接输入、粘贴、选择局部文本或调整光标。导入会自动识别表示形式，不依赖开关状态。复制与下载均使用 TextBox 的准确文本。

Home 通过独立弹窗导入地图且只接受语义地图；Settings 的 Adventure Profile 导入只接受存档并在写入前要求用户确认覆盖。`/import/v1` 对地图直接创建临时游戏 session，对 Adventure Profile 显示覆盖确认，对未知数据只展示错误和原始文本。

## Transport V1

`BC5R1` 表示 Data Exchange Transport Version 1，不表示地图或 Profile schema 版本。编码过程为：

```text
JSON text → UTF-8 → gzip → Base64URL payload
```

Base64URL 只使用 `A-Z a-z 0-9 - _`，省略尾部 padding。raw representation 为 `BC5R1:<payload>`。分享地址为：

```text
<publicBaseUrl>/import/v1#<payload>
```

Payload 位于 fragment，浏览器只在客户端读取。Decoder 只还原 `unknown` JSON；Map、Adventure Profile 等 schema 校验由调用方 parser 或 dispatcher detector 完成。

## 站点根地址

`publicBaseUrl` 是包含 scheme、host、port 和可选 pathname 的完整 Web App 根地址。URL 拼接统一先清除 query/fragment、保留并规范化 pathname 尾部，再用相对路径 `import/v1` 构造。

```text
https://xujinkai.github.io/bobby-carrot-5-remake
→ https://xujinkai.github.io/bobby-carrot-5-remake/import/v1#PAYLOAD
```

Vite `base` 负责构建资源路径，`publicBaseUrl` 负责分享地址。构建通过 `BC5R_BASE_PATH` 配置前者，通过 `VITE_PUBLIC_BASE_URL` 配置后者；未配置分享根地址时使用 `document.baseURI`。

静态构建生成 `dist/import/v1/index.html`，保证 fragment 分享 URL 的 pathname 可以从新导航直接加载应用。

## 公共层职责

`web/src/shared/data-exchange/` 提供 gzip、Base64URL、`BC5R1`、格式识别、分享 URL、文本文件 I/O，以及可配置左右 toolbar、label 和 placeholder 的 `DataExchangePanel`。

公共层不知道 Map、Editor 或 Adventure Profile。页面只提供 serializer、parser、apply handler、文件名与 toolbar 配置。Profile 存储、地图游玩和 Editor Draft 更新仍由各自消费层负责。

Transport 区分 JSON 格式错误、未知表示、无效 Base64URL、损坏 gzip 与不支持的 transport 版本。领域 parser 提供业务类型错误；解析失败时保留 TextBox draft，且不修改业务数据。
