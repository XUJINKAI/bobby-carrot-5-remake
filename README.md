# Bobby Carrot 5 Remake

**Bobby Carrot 5 Remake**（兔子波比 5）是 Bobby Carrot 第五代的现代 Web 重制与原版机制研究项目。

项目不使用 Java ME 模拟器运行游戏，而是重新实现现代 Web Engine，在保留原始关卡、高清像素美术、MIDI 与谜题机制的基础上，提供更适合现代浏览器的游玩、研究和地图创作体验。同时保留 DAT/JAR 互操作与原版验证链路，用于核对逆向得到的机制行为。

## 功能

- **Adventure**：按原版 Campaign 结构游玩 40 章，包含章内进度、存档、Bonus、全局经济、永久道具与特殊场景等原版冒险系统。
- **Explore**：自由浏览全部正式关卡，支持筛选、调试和自由缩放，适合找关与研究机制。
- **Editor**：编辑语义地图，支持 Undo/Redo、Object 变换、Play Test、JSON 导入导出和 URL 分享。
- **现代 Web Engine**：重新实现移动、碰撞、机关、动画和地图内胜负规则，不依赖原版 Java ME Runtime。
- **原版数据互操作**：解析和生成 Bobby Carrot 5 DAT 关卡数据，并可将自定义地图 patch 回原版 JAR 进行差分验证。
- **原版内容还原**：整合 Base / Forever 与 UP1～UP9，共 480 个正式 Campaign 地图和 5 个共享特殊场景。

更完整的产品设计、架构、格式与机制说明见 [`docs/`](docs/README.md)。

## 贡献

欢迎提交 Issue、机制研究结果、文档修正和 Pull Request。

修改代码前请先阅读 [`AGENTS.md`](AGENTS.md) 和 [`docs/`](docs/README.md)。项目对模块边界、原版事实与设计决定的区分、源码可读性和验证流程都有明确约束；新增或修改游戏机制时，应提供相应回归测试，并在需要时通过原版 JAR 验证行为。

开发环境、构建、验证和原版验证命令统一维护在 [`docs/development.md`](docs/development.md) 与 [`docs/verification.md`](docs/verification.md)，README 不重复维护这些步骤。

## 资产与版权

本项目包含或能够生成来自原版 Bobby Carrot 5 的 JAR、美术、音频、音乐、地图、DAT 数据及其他相关内容。这些内容**不属于本项目许可证的授权范围**，相关版权、商标及其他权利归其各自权利人所有。

本项目不主张拥有 Bobby Carrot 原版游戏内容的版权，也不授予任何第三方使用这些原版内容的权利。详细范围见 [`THIRD_PARTY_ASSETS.md`](THIRD_PARTY_ASSETS.md)。

## License

本项目自身原创的源代码、文档及其他可由项目作者授权的原创材料采用 **Bobby Carrot 5 Remake Non-Commercial Copyleft License 1.0**。

允许查看、学习、修改和非商业分发；分发修改版时必须提供完整对应源代码并继续采用相同许可证。禁止闭源分发、收费分发以及以本软件本身获利的商业化使用。

完整中英文条款见 [`LICENSE`](LICENSE)。
