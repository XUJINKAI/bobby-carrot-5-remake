# Bobby Carrot 5 Remake Runtime Assets

此目录就是网站 `/assets/` 的静态资源源树。Git 托管的人工资源与构建生成资源可以按各自目录边界共存，`build` 将整棵目录原样发布到 `dist/assets/`。

`maps/` 与 `art/hd/` 由资产流水线生成；`audio/original/modern/` 与 `audio/original/8bit/` 是 Git 托管的运行时 OGG 音乐库，不由 Original JAR adapter 重新生成。两套音乐库使用相同曲目 ID，以支持播放中无缝切换风格。

国际化文本和 Bobby Carrot 5 Remake 自制美术等人工资源直接在此维护。原版 JAR 与研究数据位于 `original/`。
