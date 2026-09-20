# 音频

## Runtime 资产

运行时音乐只使用预转换 OGG，不保留 MIDI 播放链：

```text
assets/audio/original/
├── modern/
│   ├── title.ogg
│   ├── ingame0.ogg
│   └── ...
└── 8bit/
    ├── title.ogg
    ├── ingame0.ogg
    └── ...
```

`modern` 与 `8bit` 必须具有完全相同的曲目 ID。地图只保存语义音乐 ID，例如 `title`、`ingame1`、`bonus`，不知道文件格式和音乐风格。

## Engine ownership

浏览器音频 runtime 属于 Engine。`AudioRuntime` 负责：

- OGG fetch / decode / buffer cache；
- 音乐播放、停止与循环；
- `modern` / `8bit` 风格切换；
- 切换风格时从当前播放位置继续；
- 短 crossfade，并在浏览器空闲期预加载当前曲目的另一风格；
- 音乐和音效 gain，允许超过 `1.0`（100%）。

`createGameplayRuntime()` 未显式传入 audio 时会自行创建并销毁 `AudioRuntime`，因此 Engine 仍满足“给一张 LevelMap 和少量配置即可独立运行”的原则。宿主如果需要跨页面共享音乐状态，也可以注入实现 `AudioBackend` 的 Engine audio 实例；runtime 不拥有外部注入实例的生命周期。

`LevelMusicController` 负责一局地图的基础曲目、机关覆盖与终局曲目。`won / dead` 分别选择
一次性 `cleared / death`；Restart、Undo 与 Replay 恢复游玩状态时重新选择当前地图音乐。

## 产品层职责

Web / Adventure / Embed 负责地图外页面音乐、显式场景覆盖和产品设置，不实现播放器。例如：

```ts
audio.playMusic("title");
audio.setMusicStyle("modern");
audio.setMusicGain(1.35);
```

设置页提供：

- 音乐开关；
- `8bit` / `modern` 风格；
- 音乐 gain，Web Shell 与 Embed 配置界面的范围为 0～300%；
- 音效 gain。

Game / World / Entity behavior 只依赖 `AudioBackend` 语义接口，不知道 OGG URL、Web Audio node 或产品设置 UI。地图内选曲职责详见[背景音乐选曲职责 ADR](../decisions/background-music-selection-ownership.md)。
