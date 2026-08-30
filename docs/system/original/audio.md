# 原版音频使用

原版 JAR 中共有 14 个稳定的语义曲目名：

```text
alarm
bonus
cleared
death
fly
ingame0
ingame1
ingame2
mow
sandman
shop
title
train
universe
```

BC5R 运行时使用同名 OGG，并在 `modern` / `8bit` 两套风格之间保持完全一致的 track ID。音频播放机制本身见 `docs/features/audio.md`；这里仅描述 Original 内容如何选择曲目。

## 使用原则

- 地图只引用语义 track ID，不引用文件路径或音乐风格。
- `ingame0` / `ingame1` / `ingame2` 为普通关卡背景音乐候选。
- `bonus` 用于 Bonus 内容。
- `title` 用于标题或特殊场景。
- `cleared`、`death`、`alarm` 属于事件型声音，不循环。
- `mow`、`fly`、`sandman`、`shop`、`train`、`universe` 对应特殊玩法或场景，具体触发点应在相应机制实现时保持语义化。

当前普通 campaign 转换默认使用 `ingame1`；这不是 AudioRuntime 的限制，地图可独立选择其它语义音乐 ID。
