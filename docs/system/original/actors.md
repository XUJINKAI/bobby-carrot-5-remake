# 原版角色型对象

这些对象虽然在原版 DAT 中可能由多个格子和多个 byte ID 组成，但在 BC5R 中应优先建模为一个 Entity + footprint / presence，而不是拆成多个互不关联的 Entity。

## Dragon

Dragon 是三格对象：Head / Body / Tail。

- Head / Body 阻挡移动并参与 fire blocking。
- Tail 可进入，并作为触发喷火的交互区域。
- 方向变化应作用于整个 footprint。
- 喷火属于运行时行为；火焰路径、命中与 Ice Block 融化应通过通用 Behavior / RuntimeAction 表达。

## Sandman

Sandman 是两格角色型对象，由 Head / Body 共同组成一个 Entity。视觉和碰撞都应从 footprint 展开，Editor 不应把它伪装成一张单格大图。

## Dream Machine

Dream Machine 同样是两格对象，采用单 Entity + footprint。其特殊场景行为与普通 Entity runtime 共用同一套机制。

## Beaver

Beaver 是两格对象，Head / Body 属于同一个 Entity。方向、交互和视觉都不应通过两个独立地图对象维持同步。

## Editor

Editor Canvas 和 Palette 在预览这些多格 Entity 时，应渲染完整 footprint，而不是只显示第一个 Presence。Palette 可以缩放完整 mini-scene 以适应单个素材按钮。
