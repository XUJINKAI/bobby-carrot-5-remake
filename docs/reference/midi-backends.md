# MIDI playback backends

Bobby Carrot 5 的 JAR 使用 MIDI。Web 版保留原始 `.mid`，音色引擎作为可切换实现。

## WebAudio TinySynth（当前默认）

特点：

- 单文件、无需 SoundFont/PCM；
- 内建 SMF sequencer；
- 静态站点部署简单；
- 算法 GM 合成，不使用真实采样音源；
- `quality=0` 使用 1 oscillator/note 的 chip 风格；
- `quality=1` 使用多 oscillator/FM 风格；
- 支持 master volume、reverb、voices 和自定义 timbre。

项目默认使用 `quality=1`；设置页允许在 FM / chip 两套 TinySynth timbre set 间切换，并调节 reverb。

## SpessaSynth + SoundFont

SpessaSynth (`spessasynth_lib`) 支持浏览器 WebAudio/AudioWorklet，并直接播放 MIDI + SF2/SF3/DLS。播放器和音色库相互独立，适合使用 GM SoundFont 提供采样音色。

集成边界：

1. Engine 的 `AudioBackend` 只定义播放能力，具体 MIDI 库实现在 `web/`；
2. SoundFont 作为独立音色资产放在 `assets/audio/soundfonts/`，也可以由用户设置 URL；
3. 随构建发布的 SoundFont 必须具有明确的再分发许可；
4. 设置项保存 `midiBackend` 与 backend-specific preset；切换后可以从当前曲目重新开始，普通输入保持当前 sequencer 状态。

## AudioBackend 稳定边界

当前 TinySynth 实现与后续可选 MIDI 后端都通过同一个 Engine `AudioBackend` 接口接入。原始 MIDI 文件保持独立资产，具体合成器、timbre 和 SoundFont 属于 Web 音频实现层。
