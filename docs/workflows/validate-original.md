# 用原版 JAR 验证自定义测试地图

当字节码分析还不足以确认机关细节时，用同一张最小地图分别运行 bc5r 与原版 Java ME Engine。

## 1. 做最小地图

在 `/edit` 创建地图，尽量只保留要验证的机关、Bobby 起点、必要目标/出口。先用 Editor Play Test 记录 bc5r 行为，然后导出 JSON。

## 2. 生成验证 JAR

```bash
npm run original:patch -- \
  --map ./dragon-test.json \
  --target 40-10
```

默认输出到：

```text
tmp/original-validation/
```

也可指定：

```bash
npm run original:patch -- \
  --map ./dragon-test.json \
  --target 40-10 \
  --out ./tmp/original-validation/dragon.jar
```

`--target` 使用玩家 Campaign public ID（例如 `1-1`、`1-bonus-1`、`40-10`）。工具通过 Catalog provenance 找回真正的 Base/UP JAR、DAT 包与原始 level slot；不会要求自定义地图与目标官方关尺寸相同。

Base/UP、`00.dat`～`04.dat`、record index 都只属于 archive identity，不再作为公开 target ID。

## 3. 工具自动验证的内容

生成前后会保证：
- `assets/original` 从不被写入；
- 只替换目标 DAT record；
- DAT metadata 与其它关卡 record 原字节保留；
- JAR 其它 entry 尽可能原 local ZIP block 保留；
- 失效签名 entry 被移除；
- 输出 JAR 再读取后得到的 LevelMap 与输入 JSON 完全一致。

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
