# 自定义地图

这里保存 Bobby Carrot 5 Remake 内置的语义 JSON 地图。`collections.json` 定义 Explore 展示的集合名称、顺序和说明；`collections[]` 的数组顺序就是展示顺序，目录名与 collection ID 对应。

没有章节的地图直接放在 `custom-maps/<collection>/<map>.json`。有章节的集合使用 `chapters` 对象声明章节目录，并把地图放在 `custom-maps/<collection>/<chapter>/<map>.json`，例如 `custom-maps/loma-pushbox/01/01-01.json`。地图 JSON 不再重复保存 collection、chapter 或 map ID，这些身份都由路径决定。

构建工具把 collection discovery 写入 `assets/maps/index.json`，并把地图与展示 metadata 写入 `assets/maps/<collection>/`。地图可由 Editor 导入并直接 Play Test。

`test/` 中的小地图同时作为 Portal、Pushbox 和最大步数规则的人工验证入口。
