# 手动工具

本目录保存维护者按需运行的工作台脚本和人工参考资料，不进入 `tools/cli.mjs`、
`npm run dev`、资产缓存或正式构建流程。

## MIDI 与 OGG

`midi-ogg.sh` 使用 FluidSynth 和 FFmpeg，把指定目录根层的 MIDI 文件分别渲染到
`modern/` 与 `8bit/` 子目录，也可以递归分析 OGG 文件的 LUFS 与 true peak：

```sh
tools/manual/midi-ogg.sh render <midi-directory>
tools/manual/midi-ogg.sh volume <ogg-directory>
```

渲染需要把 `Microsoft_gm.sf2` 与 `8bitsf.SF2` 放在脚本同目录。SoundFont 不属于
仓库内容；其来源、授权和使用条件由操作者自行确认。`render` 会完整重建目标目录中的
`modern/` 与 `8bit/`，需要保留的试听或中间文件应先放到其它位置。

## 图集参考

`ts-note.png` 是原版 Bobby Carrot 5 `ts.png` 的行列标注参考图，只供人工核对 atlas
坐标。图片及其原版美术内容属于第三方内容，版权边界遵循根目录
`THIRD_PARTY_ASSETS.md`，不属于本项目 `LICENSE` 的授权范围。
