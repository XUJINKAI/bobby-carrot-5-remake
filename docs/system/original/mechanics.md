# 原版机关与关卡机制

## 通关目标

原版关卡可组合三类目标：

- 收集全部胡萝卜；
- 填充全部 Easter Egg Nest；
- 到达 Exit。

Exit 只有在其它目标已经完成、剩余目标为 `reach-exit` 时进入动态开启状态。纯 `reach-exit` 关卡从开始即视为可用。

## 移动类机关

- **Speed**：Up / Down / Left / Right 四方向强制移动。
- **Tide**：Up / Down / Left / Right 四方向水流。
- **Carousel**：四种旋转状态，以及 Vertical / Horizontal 两种直向状态。
- **Whirlwind / Kite**：进入飞行流程，风筝按方向显示。
- **Leaf**：按 Bobby 登上时的进入方向漂流；停止后，Bobby 必须先离开再重新登上才能再次启动。

## 开关与状态机关

这些内容应建模为同一个 Entity 的 state，而不是按状态拆成不同 EntityType：

- Speed Switch：Raised / Pressed
- Tide Switch：Raised / Pressed
- Carousel Switch：Raised / Pressed
- Wind Switch：4 个 channel，各自 On / Off
- Yellow / Pink Switch：Raised / Pressed
- Yellow / Pink Block：Raised / Lowered
- Trap：Active / Inactive
- Mirror：1 / 2 / 3 / 4

Color Block 在 Lowered 时可通行，Raised 时阻挡。

## 可变化对象

- **Plank**：完整 → 崩塌中 → 碎片。
- **Ice Block**：完整冰块及多个融化阶段，可被 Dragon fire 影响。
- **Bean / Beanstalk**：Bean 种入 Bean Field 后先成为 sprout，再逐段向上生长；藤蔓 base / mid / tip 均可用于攀爬。
- **High Grass**：可被割草机清除；Objective grass 同时承担隐藏目标语义。
- **Water**：普通动态水、三种 water variant 以及 Tide 均只通过通用 Entity/Visual 机制实现。

## 收集物与道具

Carrot、Easter Egg Nest、Golden Carrot、Bonus Coin、Mower、Gas、Shovel、Kite 等都应以语义 Entity 表示。动画只属于 Presentation，不应把动画帧或资源编号写入地图数据。

具体帧坐标见 `assets.md`。
