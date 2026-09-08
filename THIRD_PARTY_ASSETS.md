# 第三方资产与版权声明

Bobby Carrot 5 Remake 是一个非官方的重制、研究与互操作工程。

## 原版 Bobby Carrot 内容

本仓库包含、引用、解析、转换或可生成部分来源于原版 Bobby Carrot 5 游戏的内容，包括但不限于：

- 原版 JAR 与其中的程序、资源和数据；
- 美术、Sprite、动画、图标及其他视觉资源；
- 音频、音乐、MIDI 及其衍生内容；
- 地图、关卡数据、DAT 数据与相关元数据；
- 角色、名称、Logo、商标及其他原版游戏内容；
- 从上述原版内容提取、解码、转换、重建或生成的派生数据和资源。

这些内容**不属于本项目 `LICENSE` 的授权范围**。本项目作者不主张拥有原版 Bobby Carrot 游戏内容的版权、商标权或其他相关权利。

上述内容的版权、商标及其他权利归其各自权利人所有。本项目的代码许可证不能、也不会替代原权利人对这些内容的授权。

## LOMA Sokoban 关卡

`tools/custom/LOMA.txt` 保存 **LOMA (Levels Of Many Authors)** Sokoban 关卡集的源数据。LOMA 于 2004 年开始，由 Aymeric du Peloux 与多位关卡作者共同维护；本仓库采用的 2021 版本包含 137 张关卡，并保留每张地图原文件中的 `Author`、`Title` 与可选 `Comment` 信息。

LOMA 官方页面：

```text
https://aymericdupeloux.wixsite.com/sokoban/post/_loma
```

该页面明确说明 LOMA collection 可以在任何地方自由发布，不需要另行取得作者许可。本仓库据此保存原始文本，并在生成的语义地图中继续保留对应作者信息。

LOMA 关卡文本及由它生成的 `custom-maps/loma-pushbox/`、runtime MapDocument 均属于第三方关卡内容，**不属于本项目 `LICENSE` 的授权范围**；各关卡的著作权仍归原作者所有。本项目的生成工具代码本身仍按根目录 `LICENSE` 授权。

## Novoban Sokoban 关卡

`tools/custom/NOVOBAN.txt` 保存 **Novoban** Sokoban 关卡集的源数据。该 collection 由 François Marques 创作，原始文本保留以下版权与联系信息：

```text
Copyright: François Marques
E-Mail: sokoban@online.fr
Web Site: http://sokoban.online.fr
```

原始下载地址：

```text
http://sokoban.online.fr/levels/novoban/novoban.txt
```

公开 collection 页面将 Novoban 描述为 50 张面向初学者、难度逐渐增加的关卡，并标明 Copyright 为 François Marques。本仓库未找到像 LOMA 那样明确的额外自由再发布授权文本，因此**不把“公开提供下载”解释为宽松许可证**。

Novoban 原始文本及由它生成的 `custom-maps/novoban-pushbox/`、runtime MapDocument 均属于第三方关卡内容，**不属于本项目 `LICENSE` 的授权范围**。本仓库保留原始 copyright/source 信息；任何进一步分发仍应自行确认 François Marques 对相应关卡内容的授权条件。本项目的生成工具代码本身仍按根目录 `LICENSE` 授权。

## Phosphor Icons

Web 界面通过 `@phosphor-icons/vue` 使用 Phosphor Icons。该图标库由 Phosphor Icons 项目提供，并按 MIT License 发布；业务组件只通过 `web/src/shared/icons/` 的项目适配层使用它。

项目地址：

```text
https://github.com/phosphor-icons/vue
```

Phosphor Icons 的版权与许可条件以其随包发布的许可证为准。

## 许可证边界

`LICENSE` 仅授权 Bobby Carrot 5 Remake 项目自身原创的源代码、文档及其他由相应作者有权许可的原创材料。

因此，即使某项行为符合本项目代码许可证，也不代表该行为已经取得原版 Bobby Carrot 内容或其他第三方内容的使用、复制、修改或分发许可。任何人分发包含第三方内容的构建、压缩包、镜像、网站或其他副本时，都应自行确认相应第三方授权条件。

## 生成目录

以下目录中的内容尤其可能包含第三方游戏内容或其派生物：

```text
assets/original/
assets/extracted/
assets/generated/
custom-maps/loma-pushbox/
custom-maps/novoban-pushbox/
dist/
tmp/original-validation/
```

其中部分目录为构建或验证过程生成，不代表这些生成结果因技术转换而获得新的版权授权状态。

## 项目身份

Bobby Carrot 5 Remake 并非 Bobby Carrot 原权利人的官方产品，也不表示获得其认可、赞助或背书。
