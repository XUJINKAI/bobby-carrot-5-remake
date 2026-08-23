# 原版运行时层次：Terrain / Object / Dynamic

> 工作记录。只记录已经由原版数据格式、Loader 或已确认运行时行为支持的结构事实；具体机关行为仍需逐项对照 `a.class`。

## 结论

Bobby Carrot 5 的关卡不是“每格一个最终 Tile”。运行时至少同时存在：

1. **Terrain layer**：底层地形，始终保留；
2. **Object layer**：静态覆盖对象，可被取得、破坏、替换或移除；
3. **Dynamic entities**：云、荷叶等从 object grid 抽出的移动实体；
4. **Runtime state**：按钮状态、陷阱状态、临时动画/生长任务等。

因此机关变化通常只修改其中一层，不应把格子压扁成单一视觉/碰撞状态。

## 典型叠加

### 水面 + 木板

水属于 Terrain；木板 `0xD4` 属于 Object。木板存在时对象规则覆盖底层水面的普通不可步行规则；木板坍塌并最终从 Object layer 删除后，底层水面仍然存在，因此该格自然恢复为不可步行水面。

### 高草 + 可收集对象

高草 `0xC7/0xC8` 属于 Terrain；金币、金胡萝卜等仍可同时存在于 Object layer。高草未割除时视觉层应遮挡被草覆盖的对象；割草只替换 Terrain，不应顺手删除或覆盖已有 Object。随后 Object 才按自身规则继续存在/被收集。

`0xC8` 自身还承担“草中隐藏主要目标”的历史语义。Engine 在把这种隐式目标显式化时，只有目标格原本没有对象时才能生成胡萝卜/蛋巢；绝不能覆盖原 DAT 已存在的对象。

## Editor

Editor 当前的 `terrain[][] + objects[]` 数据结构本身已经能表示叠加，问题不在存储格式，而在：

- 画布总把 Object 画在 Terrain 上方，导致本应被高草遮住的对象提前可见；
- Inspector / 交互没有把一格明确展示为“Terrain + Object”的组合；
- Runtime 机关逻辑有少量代码把 Terrain 变化和 Object 生成混在一起，可能破坏已有叠加。

因此不应新增第三个“overlay JSON layer”去复制原版模型；应恢复每层独立的可见性、碰撞与生命周期语义。
