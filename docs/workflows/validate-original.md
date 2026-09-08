# 用原版 JAR 验证自定义测试地图

当字节码分析还不足以确认机关细节时，用同一张最小地图分别运行 bc5r 与原版 Java ME Engine。

## 按坐标查找 `ts.png` 素材

`original/decoded/` 中的 terrain 和 object 标签均以 `ts-<row>-<column>:` 开头。
对素材语义或命名不确定时，直接全局搜索坐标前缀即可定位所有原版地图引用，
例如搜索 `ts-4-13:`。Engine 使用的机关帧与 Surface 归类集中维护在
`model/src/map/entity/original-tile-visuals.json`；Editor Surface 的每个 atlas 单元均为单格 Entity。

## 1. 做最小地图

在 `/edit` 创建地图，尽量只保留要验证的机关、Bobby 起点、必要目标/出口。先用 Editor Play Test 记录 bc5r 行为，然后导出 JSON。

## 2. 生成验证 JAR

```bash
node tools/cli.mjs original patch \
  --in custom-maps/original-patch \
  --out tmp/original-patch
```

省略参数时，默认输入与输出目录也是这两个路径。输入目录中的每个 `.json` 文件使用文件名作为 Campaign public ID，例如 `1-1.json`、`1-bonus-1.json`、`40-10.json`。工具按照 Catalog provenance 自动定位原始 JAR、DAT 包和 record slot，并将同一 JAR 的全部替换合并到一个输出文件：

```text
tmp/original-patch/base-patched-20260831-114500.jar
tmp/original-patch/up01-patched-20260831-114500.jar
...
```

输入目录内只放入需要验证的地图。每次执行都会清空输出目录后重建；`assets/original/official-hd/` 永远不会被写入。

例如只验证 `1-1.json`：

```bash
node tools/cli.mjs original patch
```

当前 Entity Map 会经 Original Adapter 还原为 DAT 可表达的地图；覆盖地形下的默认地面、隐藏目标和原版对象内部形态遵循 Adapter 的规范化规则。

## 3. 工具自动验证的内容

生成前后会保证：
- `assets/original` 从不被写入；
- 只替换输入目录中目标地图的 DAT record；
- DAT metadata 与其它关卡 record 原字节保留；
- JAR 其它 entry 尽可能原 local ZIP block 保留；
- 失效签名 entry 被移除；
- 输出 JAR 再读取后的目标 DAT record 与反向 Adapter 输出一致。

## 4. 在原版模拟器运行

把输出 JAR 放入 KEmulator/J2ME Loader 等环境。进入被替换的目标关，记录移动、Tick、触发条件、动画/阻挡/死亡等结果。

## 5. 回到 Engine

如果原版与 bc5r 不同：
1. 先确认自定义 map 的 DAT record 写入校验已通过；
2. 查看原版字节码与 `docs/reference/`；
3. 修改 Engine Definition/World；
4. 增加自动回归测试；
5. 再分别运行 Editor Play Test 与原版验证 JAR。

不要把“模拟器里看到了什么”直接写成未经区分的代码常量；确认程度仍需记录为 confirmed / inferred。
