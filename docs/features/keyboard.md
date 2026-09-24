# 键盘与焦点

## 职责与生命周期

Engine `KeyboardRuntime` 是浏览器 `keydown / keyup / blur` 的统一语义入口，处理物理
按键所有权、作用域和重复事件。Web 的 `BobbyApp` 持有共享实例；页面通过上下文与
Vue 注入取得 `WebKeyboard`。Web Session、首页 Demo 和 Embed 预览使用同一个 Runtime。
Engine 独立运行时由 `InputController` 持有自己的 Runtime。实例创建者负责销毁，消费者
只注销作用域。AudioContext 的首次交互恢复与焦点可视性是独立的只读 keyboard observer。

Runtime 不认识页面或 Campaign；层名和顺序由宿主声明。Web 的普通层从高到低是
Page、Global、Gameplay。模态作用域高于普通层，最后激活的模态拥有输入，未处理的键
也不向下层传递。Engine 对话 consumer 使用同一种模态能力。

输入范围支持全局与焦点区域。Runtime 的 `range` 是默认范围，注册项可独立覆盖。
焦点范围包括指定 HTMLElement 及其后代，包含 Shadow DOM 内的焦点。Web 页面、全局
命令和普通游玩注册为全局；首页 Demo 使用画布所属区域的焦点范围。Embed 根据
`input.keyboard` 选择 `focus / global`，通过 Engine 的 `keyboardRange` 执行。
宿主可向 `BC5RMountOptions.keyboardRuntime` 传入共享实例。

## 按键规则

- 离散命令默认不重复，也不接受 Ctrl、Cmd、Alt、Shift；消费者可显式选择重复或修饰键。
- 页面方向选择支持长按，系统重复事件按 100ms 间隔节流；每次选择将条目滚动到可见区域。
  方向作用域通过 `retainOnFocusChange` 保留自身同步移动焦点的按键，外部焦点变化仍取消长按。
- input、textarea、select 和可编辑内容默认保留浏览器编辑行为，输入法组合事件不触发快捷键。
- 每次 keydown 记录原接收者，keyup 交还原接收者；注销后不再回调已销毁对象。
- 作用域变化、焦点移动和输入法组合开始时取消持续键盘输入。物理记录保留到 keyup，
  防止按住 Enter 打开新页面后再次激活新按钮。
- 窗口 blur 清理物理状态；重新获得焦点后收到的孤立 repeat 不会重启动作。
- Gameplay 的 Keyboard、Pointer 与外部方向输入分别维护状态；键盘取消只清理键盘方向。
  窗口失焦通过 blur 同时释放 Engine 的指针与外部方向状态。
- Engine 对话使用方向键、Enter、Esc；Tab 在 Engine 模态输入期间被消费，保持地图对话输入归属。

## 焦点数据

唯一页面焦点配置在 `web/src/app/keyboard/focusPlans.ts`。每个 `FocusPlan` 声明：

- `initial`：页面挂载后的默认焦点候选。
- `tabNavigation: false`：Editor 使用快捷键，Tab 不轮换控件焦点。
- `groups`：数组顺序就是 Tab 组顺序；`selector` 明确限定允许聚焦的控件。
- `tab: "each"`：每个可用控件都是停靠点。
- `tab: "group"`：整组只保留一个停靠点，记住最近选择的条目。
- `arrows`：纵向、横向或按实际布局寻找相邻控件。
- `defaultArrowGroup`：首页与 Explore 在空白处失去焦点后，方向键恢复该组最近选择；Demo 和字段仍使用各自输入。
- 页面 `tabAction`：Explore 的 Tab / Shift+Tab 直接循环切换 Collection；输入字段保留焦点导航。

配置决定哪些按钮能取得指针或程序化焦点，未登记按钮保持 `tabIndex=-1` 并取消按钮焦点。
隐藏、禁用、inert 和 aria-hidden 内容从焦点候选中剔除。Tab / Shift+Tab 在当前页面的
配置顺序中循环，方向键在相应组内选择；普通链接和按钮由浏览器执行 Enter 激活。
表单的输入行为继续由原生控件负责。

Shell 操作使用指针或全局快捷键。页面 Tab 顺序完全由内容区域的 FocusPlan 声明。

| 页面 | Tab 组顺序 | 方向键与确认 | 默认不聚焦的按钮 |
| --- | --- | --- | --- |
| 首页 | 模式菜单 ⇄ Demo，仅两个停靠点 | ↑↓ 选择四个模式按钮及内嵌链接，Enter 打开；Demo 聚焦后方向键/WASD 试玩 | Demo 重开、摇杆按钮及 Shell |
| Explore | Tab / Shift+Tab 切换下一个／上一个 Collection | ↑↓←→ 按实际布局选关，Enter 打开；Shift+S 随机，P 继续 | Collection 链接、随机、继续及 Shell |
| Adventure | 当前菜单或关卡组 → 章节组 | 菜单/关卡 ↑↓，章节按布局选择，Enter 打开；跳过锁定条目 | 不可用入口 |
| 游玩 | 画布 → Replay 可见控件 | Gameplay 输入；`[` / `]` 换关，Esc 返回；Z 切换录制面板，X 切换屏幕摇杆 | 顶栏换关、重开、撤销、调试等工具按钮 |
| Editor | Tab 不轮换控件焦点 | Z 切换 Palette/Surface；X 切换 Inspector/Level；字段由指针选择 | Palette 素材、Canvas resize handle、其它工具按钮 |
| Settings | 存档 Tab 组 → 字段 → 数据交换按钮 | Tab 组 ←→ 选择；Enter 激活 | 未登记辅助按钮 |
| Import | 字段 → 导入确认操作 | Enter 激活，Esc 返回；地图导入成功后使用游玩配置 | 未登记辅助按钮 |
| Embed | 配置字段 → 页面操作 | 表单原生键盘；预览按 Embed 的输入范围配置运行 | 预览内部焦点由 Embed 持有 |
| Web 弹窗 | 配置内的按钮、链接和字段，按 DOM 顺序循环 | Esc 关闭当前层；结算 ←→ 选择按钮、Enter 确认 | 弹窗以外所有按钮 |

Shell 的 Music 使用 M，Help 使用 ?；Shell 按钮不参与 Tab。焦点边框使用主题高亮色。
页面初次加载只设置逻辑焦点；Tab、方向键或确认键激活焦点边框，鼠标或触屏 pointerdown
隐藏焦点边框。键盘导航期间的页面跳转延续当前交互方式。
首页 Demo 通过 Tab / Shift+Tab 选中时，边框包围整个 Demo 面板；内部画布承担 Engine 输入焦点。
指针操作隐藏 Demo 边框，随后使用方向键游玩保持隐藏；再次通过 Tab 导航选中时显示。
首页 Demo 每次进入默认显示屏幕摇杆，面板上的摇杆按钮可手动开关。
Explore 已完成关卡以右上角金色对勾标记；选择边框只表示键盘焦点。
带快捷键的按钮通过悬停 tooltip 展示键位，页面正文与按钮标签保持原有内容。
ShellAction 的 `shortcut` 字段与按钮标题组合生成 tooltip；音乐、帮助和 Explore 命令的
匹配与提示共用 `shortcuts.ts` 定义。

## 结算与返回

Explore 的 `[` / `]` 与顶栏换关按钮执行相同动作，边界处不跳转。Adventure 的结算
“下一关”沿已有 Campaign 完成与解锁流程执行。页面 Esc 使用语义父页面，Editor
Play Test 使用既有返回编辑路径。

胜利结算默认聚焦可用的下一关按钮，失败结算默认聚焦重试按钮；主要按钮不可用时聚焦返回。
结算焦点始终显示边框，包括触屏触发的结果。左右键循环选择可用按钮，Enter 确认当前选择；
直接按 Enter 执行默认主要操作。Esc 返回列表，Editor Play Test 的 Esc 返回编辑。
结果界面与点击操作复用同一动作入口。

游玩、Editor Play Test 与聚焦的首页 Demo 使用 Shift+R 重新开始，复用各自重开按钮的操作。

Web 弹窗通过组件生命周期注册模态作用域、设置初始焦点和限定 Tab 范围；关闭后恢复
原控件，原控件已销毁时使用当前页面的默认焦点。动态内容更新由组件显式通知焦点管理器。

## 验证

`tests/module/engine/keyboard-runtime.test.mjs` 验证层次、范围、输入法、修饰键、长按、
keyup 所有权和销毁；Engine 输入测试覆盖取消与非键盘方向源的边界。
浏览器回归验证首页焦点配置、Tab 组顺序、弹窗恢复、文本输入隔离、换关与真实地图结算。
`npm run verify` 同时检查 Web 产品命令通过共享 Runtime 注册。
