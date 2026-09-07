# 用原版 JAR 验证自定义测试地图

当字节码分析还不足以确认机关细节时，用同一张最小地图分别运行 bc5r 与原版 Java ME Engine。

## 反查 `ts.png` 素材引用

对素材语义或命名不确定时，可以按 atlas 行列坐标反查正式原版地图：

```bash
npm run original:usage -- ts-4-13
```

命令也接受 `ts(4,13)` 和临时 Entity 名 `surface-4-13`。输出包含：

- canonical Entity selector；
- 玩家关卡 ID 和地图内 `(x,y)` anchor；
- Base / UP release、DAT 包和 one-based record slot；
- 可直接打开的 Explore 路径。

Dragon 吐火帧等 runtime visual 也会反查到使用该视觉的 semantic Entity 和地图；同一 atlas 单元被直接当作地形摆放时，两类引用会同时列出。

需要给脚本继续处理时使用 JSON 输出：

```bash
npm run original:usage -- ts-4-13 --json
```

最终命名前可以先列出所有仍使用坐标型临时名的 Surface：

```bash
npm run original:usage -- --temporary
```

反查读取 `original/adapted/` 生成物。缺少生成物时先执行 `npm run assets`。
未确认语义的 `ts.png` 单元使用 `surface-<row>-<column>` 作为临时 Entity 名；已归类素材通过 semantic type 与 `ts-<row>-<column>` variant 精确匹配。Editor Surface 的每个 atlas 单元都是一个单格 Entity。

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
- 输出 JAR 再读取后得到的 Entity Map 与输入地图的 Adapter 规范化结果一致。

## 4. 在原版模拟器运行

把输出 JAR 放入 KEmulator/J2ME Loader 等环境。进入被替换的目标关，记录移动、Tick、触发条件、动画/阻挡/死亡等结果。

## 5. 回到 Engine

如果原版与 bc5r 不同：
1. 先确认自定义 map 的 JAR round-trip 已通过；
2. 查看原版字节码与 `docs/reference/`；
3. 修改 Engine Definition/World；
4. 增加自动回归测试；
5. 再分别运行 Editor Play Test 与原版验证 JAR。

不要把“模拟器里看到了什么”直接写成未经区分的代码常量；确认程度仍需记录为 confirmed / inferred。
