# 自定义地图

这里保存 Bobby Carrot 5 Remake 内置的语义 JSON 地图。`collections.json` 定义 Explore 展示的集合名称、顺序和说明，目录名与 collection ID 对应。

构建工具把这些源码生成到 `assets/generated/custom-maps.json` 与 `assets/generated/custom-maps/`，Web 只消费生成后的产品资产。地图可由 Editor 导入并直接 Play Test。

`test/` 中的小地图同时作为 Portal、Pushbox 和最大步数规则的人工验证入口。
