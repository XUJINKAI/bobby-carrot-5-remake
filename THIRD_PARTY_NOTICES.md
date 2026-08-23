# 第三方软件说明

## WebAudio TinySynth

- 项目：`webaudio-tinysynth`
- 固定版本：`1.1.4`
- 作者：Tatsuya Shinyagaito / g200kg
- 许可证：Apache License 2.0
- 上游：`https://github.com/g200kg/webaudio-tinysynth`

本项目使用其 WebAudio GM-like 合成器和内置 MIDI-SMF sequencer 播放 Bobby Carrot 5 原始 MIDI。

正常 `npm install && npm run build` 会从 npm dependency 将对应 JavaScript 文件复制到最终静态发布目录；受限开发环境下可回退到固定版本 jsDelivr CDN。
