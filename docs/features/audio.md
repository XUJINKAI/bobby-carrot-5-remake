# 音频

## 原始素材

原始 JAR 中的 MIDI 保留为 `.mid`，构建时复制到：

```text
assets/audio/midi/
```

包括 `title.mid`、`ingame0~2.mid`、`bonus.mid`、`mow.mid`、`fly.mid`、`death.mid`、`cleared.mid` 等。

## 浏览器后端

Web 使用 `webaudio-tinysynth@1.1.3`：

- 单文件 WebAudio GM-like 合成器；
- 自带 MIDI-SMF sequencer；
- 无需额外 SoundFont / PCM 样本；
- Apache-2.0。

正常 `npm install && npm run build` 后，构建脚本会将依赖复制到 `dist/vendor/`，最终静态站本地播放。没有安装 dependency 的受限开发环境才回退固定版本 CDN。

Engine 仍只依赖 `AudioBackend`：

```ts
playMusic(id)
stopMusic()
playSound(id)
setMusicVolume(value)
setSoundVolume(value)
```

游戏规则不得直接依赖 TinySynth。

## UI 边界

TopBar Music 操作直接切换静音。音乐音量、音效音量、MIDI 音色和混响集中在全局 Settings；设置由 Web 持久化并调用 `AudioBackend` 或具体浏览器后端。GameStage 和机关规则只通过 Engine 音频抽象请求音乐或音效。
