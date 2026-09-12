# 已批注 Entity fidelity Engine 机制实施设计

本文把 `fidelity-discrepancies.md` 第 1～9 节中已经确认、且属于 Engine 机制重排的批注意见整理为可实施设计。尚未批注的差异不进入本轮实现范围。地图内提示由独立的 [`world-callout-plan.md`](world-callout-plan.md) 规划和实施。

## 1. 已确认行为

以下行为已有明确结论，可作为后续重构的回归基线：

- Bobby 攀爬时使用 `bobby-up` 动画条带。
- Ice 上移动时显示第 7 帧，静止时恢复普通站立帧。
- Bobby 出生在 Speed 上时，第一个 World tick 即触发传送。
- `speed-impact` 与 `crumbly-rock-smashed` 使用确定性的 `248ms / 42 source px` 镜头震动。
- Lock 打开后从公开 Entity 集合删除；倒计时由私有 Runtime Entity 继续持有。
- Plank 与 Kite 保持各自的产品语义，不为了复用实现而合并为同一种 Entity。

这些行为应保留现有测试，并在本设计涉及的重构中继续成立。

## 2. Engine 空间层与 Editor 放置分类

Engine 的空间层描述运行时实体怎样占据格子；Editor 的放置分类描述作者从哪个工具区选择素材。两者是不同维度，使用不同命名。

### 2.1 Engine 空间层

```ts
type EngineSpatialLayer = "substrate" | "occupant" | "cover";
```

- `substrate`：格子的承载面，例如 Grass、Water、Tide、Speed。
- `occupant`：位于承载面上的主体，例如 Carrot、Mirror、Lock、Beaver。
- `cover`：覆盖主体、并可能改变通行或交互结果的表层，例如 High Grass、Snow。

现有 Engine 中使用 `surface / object / cover` 表达空间层的代码，统一迁移为 `substrate / occupant / cover`。`surface` 容易同时指代视觉表面、地形和 Editor 分类，`object` 也无法表达 Engine 中“占据格子的主体”这一具体含义。

### 2.2 Editor 放置分类

```ts
type EditorPlacementKind = "terrain" | "object";
```

Editor 界面中的两个素材页签命名为：

- `Terrain`：绘制基础地形。
- `Objects`：放置机关、物品、角色和特殊格子对象。

Editor authoring 相关命名完整迁移为 `Terrain / Objects`：

- `Surface*` 类型、模块和函数按职责改为 `Terrain*`；
- `Palette*` 类型、模块和函数按职责改为 `Object*`；
- authoring metadata 使用 `terrain`、`objectPlacement` 等领域字段；
- Bottom Bar、Inspector、工具提示、快捷键说明和 Editor 文档使用 `Terrain / Objects`；
- 只表示素材格显示尺寸的设置使用 `materialSize`，不再借用某个分类名称。

原版资料中明确引用源程序面板名称时保留原文，Editor 的公共合同和实现不使用来源界面的分类名。`Palette` 只说明一种界面形态，没有说明其中素材的领域含义。

Editor 分类不决定 Engine 空间层。例如 Tide 和 Speed 可以位于 Editor 的 `Objects` 中，但加载到 Engine 后属于 `substrate`。

### 2.3 数据边界

`LevelMap` 继续只保存语义 Entity。Engine 空间层由 Entity Definition 推导，Editor 放置分类由 authoring metadata 推导；两者都不写入地图 JSON，避免把运行时和编辑器组织方式固化进关卡格式。

## 3. Trait 与 Behavior 的集中定义

目前 Entity Definition 同时承担身份、物理特征、交互能力和运行行为，容易出现同一个概念在多个 Entity 模块中以布尔字段重复声明。重构后分别建立两个集中目录：

- `engine/src/mechanics/definition/traitCatalog.ts`：登记可组合的静态能力与物理特征。
- `engine/src/mechanics/definition/behaviorCatalog.ts`：登记会执行状态转换的运行行为。

Entity 模块只引用登记过的 trait ID 和 behavior，不自行发明同义字段。验证脚本检查：

1. 每个被使用的 trait 与 behavior 都已登记；
2. catalog 中不存在无人使用的临时定义；
3. 互斥的空间属性不能以多个布尔字段同时成立。

空间占用不拆成 `isSurface / isObject / isCover` 三个 trait，而使用一个结构化属性：

```ts
interface SpatialProfile {
  layer: EngineSpatialLayer;
  elevation: "flat" | "raised";
  occludesLowerOccupants?: boolean;
}
```

`layer` 表达实体所在层，`elevation` 表达能否形成高位阻挡，`occludesLowerOccupants` 表达是否遮蔽同格较低的 occupant。其余能力继续使用可组合 trait，例如 `mowable`、`acceptsOverlay`、`collectible`。

## 4. 通行判定与有效格子栈

通行判定不能只选取“格子最上层 Entity”。同一个格子可能同时包含承载面、主体和覆盖物，不同 actor 也会读取不同信息。

加载关卡时保留完整的格子 Entity 顺序；查询通行时生成有效格子栈：

```ts
interface EffectiveCellStack {
  substrate: readonly EntityPresence[];
  exposedOccupants: readonly EntityPresence[];
  covers: readonly EntityPresence[];
}
```

生成规则：

1. `substrate` 始终保留，覆盖物不会抹掉 Water、Tide、Speed 等承载面事实。
2. `occupant` 与 `cover` 按地图堆叠顺序处理。
3. 遇到带 `occludesLowerOccupants` 的 raised cover 后，更低的 occupant 不参与本次通行和 touch 判定。
4. 被遮蔽 Entity 仍存在于世界中，仍参与目标数量、保存、通用查询和渲染；遮蔽只影响指定的空间交互视图。

High Grass 的空间定义为 `cover + raised + occludesLowerOccupants + mowable`。Mower 进入该格时先接触 High Grass，不接触其下的 Carrot；到达后清除 High Grass。Snow 同样可以遮蔽低层 occupant，但由 Shovel 行为决定是否能够进入。

通行系统为不同 actor 使用明确策略：

- Bobby：读取 substrate、暴露的 occupant 和 cover，执行常规阻挡与 touch。
- Mower：读取 mowable cover，并把割草作为到达后的动作。
- Flight：保留飞行单位所需的 substrate 例外，不复用 Bobby 的地面规则。

至少建立以下组合测试矩阵：

- Water + High Grass + Carrot；
- Grass + High Grass + Carrot；
- Tide + High Grass；
- Grass + Snow + occupant；
- Mower、Bobby 与 Flight 分别进入上述格子。

## 5. Bean 生长与通用覆盖物放置

Bean 不应依赖专属的 `bean-growth-space` 分类。它需要的是一个通用的“当前格子能否放置 raised overlay”查询：

```ts
interface OverlayPlacementQuery {
  inBounds: boolean;
  substrate: readonly EntityPresence[];
  exposedRaisedEntities: readonly EntityPresence[];
  acceptsOverlay: boolean;
}
```

其中 `acceptsOverlay` 是 substrate 的通用能力，可供 Beanstalk、Plank 或未来同类机制复用。Bean 生长条件为：

1. 目标格在地图范围内；
2. 目标 substrate 接受 overlay；
3. 目标格不存在暴露的 raised entity；
4. 目标格不存在已生成的 Beanstalk。

需要根据原版验证结果建立 substrate 能力表，至少覆盖：

| 组合 | 预期设计含义 |
| --- | --- |
| Grass | 普通可生长承载面 |
| Water | 由原版事实决定是否接受 overlay |
| Waterfall | 作为独立 substrate 明确登记 |
| Tide | Engine 中属于 substrate，Editor 中属于 object |
| Sky | 明确登记其悬空放置规则 |
| Snow + 可生长 substrate | Snow 是 cover；是否生长由底层 substrate 与 raised 遮挡共同决定 |

通行查询与 overlay 放置查询必须保持独立：一个格子是否能走，不能直接推导它是否能长出 Beanstalk。

完成标准：

- Bean 的机制代码只依赖 `OverlayPlacementQuery`；
- 所有相关 substrate 都有集中定义和组合测试；
- 迁移完成后删除 `bean-growth-space` 及其专属分支。

## 6. Snow 与 Shovel 动作

Shovel 使用 Engine 内的 `RuntimeAction` 表达，动作总时长为 `992ms`，并由触发动作的 Bobby 持有。

流程如下：

1. Bobby 尝试进入 Snow 格；
2. 通行判定阻止这次移动，同时触发 `shovel` RuntimeAction；
3. 动作期间锁定该 Bobby 的新移动输入；
4. 动作结束时重新校验目标格和 Snow Entity；
5. 删除 Snow，并生成 `shovel-cleared-ground`（`ts-8-13`）；
6. Engine 通过正常碰撞流程强制重试原移动，不直接修改坐标。

缺少 Shovel 时的事件与表现由独立的地图内 Callout 任务闭环。动作表现通过通用事件通知 Presentation：

```ts
interface ActorActionCue {
  type: "actor-action";
  actorId: number;
  action: "shovel";
  direction: Direction;
  durationMs: number;
}
```

Visual Runtime 收到事件后播放 `b8`。视觉动画完成不驱动世界状态；世界只以 RuntimeAction 的游戏时间为准，保证 replay 重建不依赖渲染帧率。

测试覆盖：动作时间、输入锁定、目标被提前改变时的重校验、清雪后的强制重试、replay 在不同渲染帧率下得到相同 final state。

## 7. 实施批次

### 批次 A：定义目录与命名迁移

1. 建立 trait catalog、behavior catalog 和完整性验证。
2. 为全部 Entity 补齐 `SpatialProfile`。
3. Engine 的空间层迁移为 `substrate / occupant / cover`。
4. Editor 的 authoring 类型、catalog、metadata、设置、UI 和文档迁移为 `Terrain / Objects` 领域命名。
5. 更新 Engine API、Editor 文档及相关测试名称，并增加旧命名残留检查。

### 批次 B：有效格子栈、Mower 与 Bean

1. 实现 `EffectiveCellStack` 和 actor passage policy。
2. 让 High Grass、Snow 的遮蔽规则走统一空间查询。
3. 修正 Mower 到达、割草和被遮蔽 occupant 的触发顺序。
4. 实现 `OverlayPlacementQuery`，迁移 Bean 生长。
5. 建立 substrate、cover、occupant 的组合矩阵测试。

### 批次 C：Snow 与 Shovel

1. 实现 Shovel RuntimeAction 与 `actor-action` cue。
2. 接入 `b8` 视觉和 `shovel-cleared-ground`。
3. 补齐确定性与 replay 回归测试。

依赖关系为：批次 B 依赖批次 A，批次 C 依赖批次 B。每个批次独立提交，并执行完整 `npm run verify`。

## 8. 审阅检查点

开始实现前需要依次确认：

1. 所有相关 Entity 的 `SpatialProfile` 清单和 Editor `terrain / object` 分类清单。
2. Water、Waterfall、Tide、Sky、Snow 组合对 overlay 放置的原版事实。
3. Mower、Bobby、Flight 的有效格子栈读取策略。
4. Shovel 动作期间 World tick、输入、动画和 replay 的时间关系。

确认后的结论进入相应合同或机制文档；本文件保留为实施顺序和审阅入口，不复制稳定 API 的完整说明。
