# 分享图预览

`og-preview.html` 使用 1200 × 630 画布，原始游戏截图为同目录的
`screenshot-18-8.png`。通过 URL 参数选择固定文案：

- `og-preview.html?lang=en`：英文，也是省略参数时的默认语言。
- `og-preview.html?lang=zh-CN`：中文。

用 Chromium 打开对应地址，等待图片与字体加载完成后截图；正式图片保存为
`assets/seo/og-preview-en.png` 和 `assets/seo/og-preview-zh-CN.png`。

英文使用项目共享的 Jersey 10。中文使用 `fonts/NotoSansSC-Share.woff2`，由
[Google Fonts 的 Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc)
按字重 800 和固定文案提取 WOFF2 子集，继续适用随附的 `fonts/OFL.txt`。
字体来源为 Google Fonts CSS API 的 `family=Noto Sans SC:wght@800`，`text` 参数为
`重制版480 关卡+浏览器畅玩地图编辑器`；增加中文文案时需要同步更新字体子集。

Logo、游戏截图及其派生分享图的第三方权利边界见根目录 `THIRD_PARTY_ASSETS.md`。
