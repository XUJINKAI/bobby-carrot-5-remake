# Base / UP01 Legacy Runtime 摘要

本页只记录 Base / UP01 与当前 UP09 语义基准之间的大致代际关系，不作为后续逆向主线。

## 结论

- `base.jar`：MIDlet-Version `1.0.3`。
- `up01.jar`：MIDlet-Version `1.2.3`。
- `up02.jar` 开始进入稳定 generation；UP02～UP09 的核心 gameplay 方法在 structural bytecode fingerprint 下完全一致。
- 当前 `semantic/` 以 **UP09** 为唯一主基准；由于 UP02～UP09 同结构，它同时代表这 8 个 update 的核心 runtime。
- Base / UP01 的字段、方法布局和核心方法指纹与稳定代不同，但第一轮观察仍能看到相同的大框架：48×48 tile、Shop upgrade 槽、持久 currency / Golden Carrot / completion bitset 等。
- 用户体感上 Base / UP01 的玩法并无需要 BC5R 单独复刻的差异，因此本 PR 不继续为它们建立完整 semantic 分支。

## 指纹边界

`notes/release-runtime-fingerprints.md` 已证明：

- UP02～UP09：movement、pixel movement、midpoint、moving entities、fireball、ice melt、bean、collision、moving-grid passage、loader、runtime state 与 main loop 均为同一 structural hash。
- Base / UP01：属于更早 generation，需要不同方法角色关联；当前只保留机械反编译基准：
  - `decompiled/base/`
  - `decompiled/up01/`

## 后续原则

只有当 Base / UP01 出现以下情况时才继续追：

1. 能解释 UP09 中仍无法理解的字段 / 资源 / scene；
2. 证明某个 UP09 机制是后期加入并影响原版 collection provenance；
3. 当前 UP09 semantic 与官方地图/运行实测出现无法解释的矛盾。

除此之外，所有机制、音乐、对话、Campaign 与 Presentation 逆向继续以 UP09 为准。
