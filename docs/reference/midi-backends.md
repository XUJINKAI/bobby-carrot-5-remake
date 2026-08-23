# MIDI playback backends

Bobby Carrot 5 的 JAR 使用 MIDI。Web 版应保留原始 `.mid`，音色引擎作为可切换实现，而不是重编曲。

## WebAudio TinySynth（当前默认）

优点：

- 单文件、无需 SoundFont/PCM；
- 内建 SMF sequencer；
- 静态站点部署简单。

限制：

- 它是算法 GM 合成器，不是真实采样音源；
- `quality=0` 是 1 oscillator/note 的 chip 风格；
- `quality=1` 是多 oscillator/FM 风格；
- 可调 master volume、reverb、voices，也可自定义 timbre，但没有“换一套真实 GM 音色库”这种能力。

项目默认使用 `quality=1`；设置页允许在 FM / chip 两套 TinySynth timbre set 间切换，并调 reverb。FM 仍觉得尖锐时，不应该继续靠 EQ 猜原作音色。

## SpessaSynth + SoundFont（推荐的第二后端）

SpessaSynth (`spessasynth_lib`) 支持浏览器 WebAudio/AudioWorklet，并直接播放 MIDI + SF2/SF3/DLS。它的价值是“播放器”和“音色库”解耦：用户可以选择真正的 GM SoundFont，音色会比 TinySynth 更接近硬件/软件 MIDI 合成器。

工程要求：

1. Engine 的 `AudioBackend` 不感知具体 MIDI 库；实现留在 `web/`。
2. SoundFont 不和原 JAR 混为一类资产，放到 `assets/audio/soundfonts/` 或由用户设置 URL。
3. 只有许可证明确允许再分发的 SoundFont 才能随仓库/构建发布。
4. 设置项保存 `midiBackend` 与 backend-specific preset；切换后从当前曲目重新开始可以接受，但普通输入绝不能重启 sequencer。

## 当前优先级

1. 修复 TinySynth 每次按键都重播的 bug；
2. 暴露 TinySynth FM/chip + reverb；
3. 保留 `AudioBackend` 接口，下一阶段接入 SpessaSynth；
4. 不为了解决音色问题把原 MIDI 转成 MP3/OGG 固化。
