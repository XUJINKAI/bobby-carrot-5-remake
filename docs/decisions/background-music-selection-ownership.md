# 背景音乐选曲职责

## 状态

已决定。Engine 管理地图运行期音乐；宿主页面可以通过显式覆盖表达页面场景。

## 决定

`Game.loadLevel()` 解析 `LevelMap.music` 并通过注入的 `AudioBackend` 播放基础曲目：

- `none` 停止音乐；
- 明确 ID 播放对应曲目；
- `random` 或省略字段时，从 `ingame0..2` 选择一首。

`runtime.levelMusicOverride` 允许宿主在创建 runtime 时覆盖基础曲目。字符串表示页面指定曲目，
`null` 表示页面保持静音，省略则完全服从地图。Home Demo 与 Adventure Special Scene 使用
`title`，Editor Play Test 使用静音；普通 Game 与 Embed 直接使用地图音乐。

## 地图内覆盖

Entity 行为通过通用 `music-state` WorldEvent 声明地图内覆盖：

- Mower mount 设置 `mower → mow`，Parking unmount 清除 `mower`；
- 带倒计时的 Lock 打开后设置 `timed-bonus → bonus`；
- Mower 优先于 Timed Bonus，所以下车后会恢复 `bonus`，普通关卡则恢复基础曲目。

`LevelMusicController` 保存基础曲目和当前覆盖。Undo / Redo 从 World 中的 Timed Challenge 与
Bobby mount 状态重建覆盖，Restart 清除地图内覆盖。该状态属于表现协调，不进入 World
Snapshot；产生它的 gameplay 状态仍完整进入 Snapshot、Undo 与 Replay。

## 宿主覆盖

页面仍可为结算、导航等产品状态直接播放 `cleared`、`death` 或 `title`。产品覆盖结束后调用
`Game.resumeMusicState()`，恢复 Engine 当前计算出的地图音乐，而不是重新解析或复制地图规则。

共享 `AudioRuntime` 继续负责加载、缓存、播放、音量、风格、首次交互恢复和过期异步请求
取消。选曲状态与浏览器音频资源生命周期因此保持分离。
