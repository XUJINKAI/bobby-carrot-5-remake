# 自定义地图

这里保存 Bobby Carrot 5 Remake 内置的语义 JSON 地图。`collections.json` 定义 Explore 展示的集合名称、顺序和说明；`collections[]` 的数组顺序就是展示顺序，目录名与 collection ID 对应。

没有章节的地图直接放在 `custom-maps/<collection>/<map>.json`。章节地图放在 `custom-maps/<collection>/<chapter>/<map>.json`，例如 `custom-maps/loma-pushbox/01/01-01.json`。构建工具始终扫描 collection 根目录与一级 chapter 目录；混合使用两种布局时，根目录地图先按无章节网格展示，后面再按 chapter 顺序展示章节地图。chapter 目录内禁止继续嵌套目录。

`collections.json` 中的 `chapters` 是可选的展示信息，只能为实际存在的 chapter 目录补充 `name` 和 `description`；未补充的字段不会写入生成的 chapter。Explore 始终按原值显示 `name`。`visible` 可取 `true`、`false` 或 `"dev"`，缺省时按 `true` 处理；`"dev"` 只在 `npm run dev` 生成的 discovery index 中展示。collection、chapter 和 map ID 都由路径决定，地图 JSON 不重复保存这些身份。

构建工具把 collection discovery 写入 `assets/maps/index.json`，并把地图与展示 metadata 写入 `assets/maps/<collection>/`。地图可由 Editor 导入并直接 Play Test。

Engine 机制集合测试地图位于 `tools/pipeline/mechanics-smoke.json`，供同目录的浏览器冒烟脚本读取。
