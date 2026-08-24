# Bobby Carrot 5 Remake 自制资产源

此目录只存放 Bobby Carrot 5 Remake 项目自行制作、且不来源于原版 JAR 的资产源文件。

用途包括未来的 Portal 等 BC5R-only 美术。构建工具可以从这里生成 `assets/generated/` 中的运行时资源。

来源边界：

- `assets/original/`：原版官方证据，只读；
- `assets/extracted/`：从官方 JAR 解包得到的生成物；
- `assets/project/`：BC5R 自制资产源；
- `assets/generated/`：统一运行时生成物。

自制资产不得放进 `assets/extracted/`，也不得以官方 JAR provenance 标记。
