# 第五代版本关系

## 正式主线

第五代正式主线按内容可视为：

```text
Forever / Base
UP1
UP2
...
UP9
```

工程同时保留资料包中的普通版与高清版 JAR，并按证据类别使用：普通版是 Java gameplay 控制流与资源加载的第一逆向基准，高清版是 48px 运行时美术与 presentation 的第一基准。两版的详细差异和复核规则见 [`official-release-provenance.md`](official-release-provenance.md)。

每个 JAR 都包含 5 个完全重复的 `00.dat` 教学关和 48 个该版本独有关卡，因此：

```text
10 × 53 = 530 source records
530 - 9 × 5 = 485 unique levels
```

普通英文版、高清版和中文“永恒之夜/进阶1~9”与对应正式包的 DAT 可一一校验；相同地图不重复进入主库。简单/中等/困难 A~F 属于重新编排的历史精选集合，也不产生新 canonical level。

## 高清差异

普通版使用 32px tile；高清构建使用 48px tile。例如 `ts.png` 从 512×512 提升到 768×768，但地图 byte ID 模型保持一致。UP9 两版的五个关卡 DAT 和 14 个 MIDI 逐字节一致，25 个 PNG 中有 21 个不同。

高清 UP2～UP9 的 classfile 50.0、`ContextHolder` 资源入口、2019 年 class 时间与分发标记表明这些 JAR 经过兼容转换和重新打包。机关、碰撞、存档和 Campaign 逆向先读普通版；图集坐标、Sprite 裁切、HUD 和动画尺度先读高清版。
