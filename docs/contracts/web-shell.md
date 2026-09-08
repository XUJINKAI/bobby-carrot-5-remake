# Web Shell 契约

Web Shell 是页面和产品功能无关的 Chrome/Layout Renderer。它只消费 `ShellConfig`，负责 TopBar、BottomBar、Content 容器、固定布局、响应式折叠和控件呈现。

Shell 不持有当前页面或模式，不识别 Home、Explore、Adventure、Editor、Gameplay、Music、Settings、Help、Undo、Palette 等业务语义。Router、页面适配器和 `BobbyApp` 生成最终配置并解释 action ID。

## ShellConfig

```ts
interface ShellConfig {
  topBar?: {
    visible?: boolean;
    fixed?: boolean;
    identity?: ShellIdentity;
    back?: ShellAction;
    leading?: ShellAction[];
    commands?: ShellAction[];
    actions?: ShellAction[];
  };
  bottomBar?: {
    visible?: boolean;
    fixed?: boolean;
    leading?: ShellAction[];
    info?: ShellInfo[];
    trailing?: ShellAction[];
  };
}
```

页面通过 `configureShell(config, helpDescriptor)` 提交当前页面配置。Content DOM 由 Vue 页面直接挂载到 App Root 提供的容器，ShellConfig 不携带 HTML 字符串。

## TopBar

TopBar 使用固定三列：

```text
Identity + Back + Leading | Commands | Actions / Overflow
```

三列分别使用 `minmax(0, 1fr) auto minmax(0, 1fr)`，保证 Commands 在桌面视觉居中。移动端仍使用同一套 DOM 和三列结构。

`ShellIdentity` 可以声明 icon、产品名、上下文名、首页链接和导航 menu。CSS 按可用宽度依次收敛产品名、上下文名和 menu 指示，不由页面判断 viewport。

## Action 与 Overflow

```ts
interface ShellAction {
  id: string;
  label?: string;
  icon?: ShellIcon;
  title?: string;
  href?: string;
  collapse?: "keep" | "overflow" | "hide";
  disabled?: boolean;
  pressed?: boolean;
  badge?: ShellBadge;
}
```

Shell 只派发 action ID 或执行声明式导航。`collapse=keep` 在移动端保留，`overflow` 收入自动生成的菜单，`hide` 在移动端隐藏。Overflow 菜单由当前配置自动派生。

`href` 可以声明站内路径或外部链接；外部链接使用 `external=true`，由浏览器按原生链接语义打开。`leading` 用于紧邻 Back 的同组导航动作，例如同一 collection 内的前后关切换。

## BottomBar

BottomBar 使用固定三段：

```text
Leading | Info | Trailing
```

`leading` 和 `trailing` 使用普通 `ShellAction`；`info` 使用文本或链接。Palette、Inspector、Screen Control 等 action 的结果由页面或 App 层处理，Shell 不创建业务 Drawer、Dialog 或 Engine 控件。

## 全局功能与 Help

Music、Settings、Help 和全局 Dialog 归 `BobbyApp` / App Root 所有。它们以普通 action 进入 Shell，App Root 收到 action ID 后执行产品逻辑。

Help 内容由当前页面以 `HelpDescriptor` 提供。Help Dialog 只渲染标题、分区和说明文本，不根据页面或模式选择内容。

## 所有权边界

```text
BobbyApp / Page
       │ ShellConfig + HelpDescriptor
       ▼
Generic Shell
├── TopBar
├── Content slot
├── BottomBar
└── responsive / overflow / theme
```

页面负责配置和 action 语义；Shell 负责布局、响应式、菜单呈现、固定滚动区域和 Bobby Carrot 5 视觉主题。
