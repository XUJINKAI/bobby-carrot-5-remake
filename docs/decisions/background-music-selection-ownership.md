# 背景音乐选曲职责

## 状态

待决策。2026-09-09 记录现状与合同冲突；在形成完整方案前维持当前运行方式。

## 背景

音频系统同时涉及三类职责：

- `LevelMap.music` 保存地图声明的语义音乐 ID、`random` 或 `none`；
- Engine `AudioRuntime` 负责浏览器音频加载、解码、缓存、播放和设置；
- Web 根据当前产品页面调用共享的 `AudioRuntime`。

当前 [`gameMusic.ts`](../../web/src/pages/game/gameMusic.ts) 在 Web 中解析
`LevelMap.music`，并为普通地图选择 `ingame0..2`。游戏页和其它页面均由 Web
发出背景音乐播放请求。Engine 的 `Game.loadLevel()` 与
`createGameplayRuntime()` 不根据 `LevelMap.music` 自动播放背景音乐。

`BobbyApp` 在整个应用生命周期中只创建一个共享 `AudioRuntime`。因此当前实现中
背景音乐只有 Web 一个选曲者；`AudioRuntime` 负责让切曲遵循最后一次请求，并阻止
已经过期的异步加载结果重新接管播放。

## 合同冲突

现有文档包含两种尚未统一的边界表述：

1. Engine 总原则要求仅凭纯语义 `LevelMap` 和少量运行配置即可独立运行地图；
   `LevelMap.music` 又被定义为地图内音乐字段。严格解释时，Engine 应当消费该字段。
2. 音频功能文档把“播放哪首曲子”列为 Web / Adventure / Embed 的产品层职责，
   与当前实现一致。

这里的分歧是背景音乐选曲是否属于“完整运行一张地图”，而不是浏览器播放器的归属。
`AudioRuntime` 属于 Engine 这一点没有争议。

## 暂行决定

在最终边界确定前维持当前运行方式：

- Web 是背景音乐的唯一选曲者；
- Engine 提供 `AudioRuntime`，不在 `Game.loadLevel()` 中自动解析
  `LevelMap.music`；
- 不单独引入“仅空闲时播放”作为所有权补丁；该行为无法阻止 Play 页先播放页面
  默认音乐、随后再被地图音乐替换；
- 涉及背景音乐所有权的改动必须作为一次完整迁移处理，不能让同一 Play 页面同时由
  Web 和 Engine 选曲。

这项暂行决定只描述决策期间的稳定实现边界，不裁定最终架构。

## 待评估方案

### 宿主统一选曲

Web / Embed 等宿主解析 `LevelMap.music`，Engine 只提供音频能力。该方案保持单一
选曲者和简单页面生命周期，但需要重新界定“Engine 独立运行”的音频范围。

### Engine 管理地图音乐

Engine 在加载地图时解析 `LevelMap.music`；Web 只为没有地图 runtime 的页面选曲。
该方案让独立地图天然遵守音乐字段，但必须同时定义共享播放器的接管、释放、加载失败、
Home Demo、Editor Play Test 和页面切换行为。

### 带所有者的音乐协调器

由统一协调器接收页面与地图的音乐意图，通过 owner token 或 scope 管理优先级和释放。
该方案能显式处理并发生命周期，但会增加 API 与状态管理成本。

## 作出最终决定的条件

后续方案至少需要同时验证：

- 直接加载一张带 `music` 的地图时行为明确；
- 进入 Play 页面时不会短暂播放另一首默认音乐；
- 页面切换、异步加载取消和 runtime 销毁不会留下旧音乐；
- Home Demo 与 Editor Play Test 的嵌套生命周期有唯一选曲者；
- `none`、`random` 和明确曲目 ID 的语义在所有宿主中一致；
- 音乐开关、音量、风格和首次交互恢复仍由共享播放器统一维护。
