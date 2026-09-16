# 已确认的 Fidelity 实施清单

本文只记录目标行为已经确认、但当前 Engine 尚未完成的差异。优先级描述对官方地图解法、
输入控制和画面正确性的影响，不代表必须在一个提交中实现。

原版事实是否可靠与是否决定修改是两个维度。下列条目均已有实施结论；仍需决定的细节链接
到 [`fidelity-open-questions.md`](fidelity-open-questions.md)，不会在实现时擅自补全。

## P0：会改变通行或持续状态

## P1：输入生命周期和画面校准

### A6. Dragon 从踩 Tail 起锁定普通输入

**现象差异**

当前 Bobby 踩下 Dragon Tail 后，在 Dragon 准备喷火的间隔里仍能继续移动；Fireball
消失后也立即释放控制。原版从 Tail 触发开始，到 Fireball 生命周期结束并经过短暂收尾前，
普通方向输入保持锁定。

**可能影响**

玩家可以在喷火准备阶段离开预期位置，降低机关约束；镜头跟随和输入恢复的先后也会显得
突然。

**目标行为**

Tail 触发时立即建立输入锁，贯穿 Dragon wind-up 和 Fireball 飞行，并在 Fireball 消失后
保留明确的收尾时间再释放。强制移动和其它 World 子系统继续按各自规则推进。

**原理说明**

输入锁属于持续 gameplay 过程，由 RuntimeAction 声明；Camera 使用同一过程提供的 focus，
但平滑移动仍由 Presentation 负责。

**证据**

- `semantic/DragonAttack.java`
- `semantic/GameplayCameraFocus.java`
- `engine/src/entities/original/dragon.ts`

## 实施约束

1. 每项修改必须先建立最小 Engine 回归测试；涉及组合关系时再增加组合地图。
2. 持续过程影响通行、输入或碰撞时进入 RuntimeAction；纯画面变化留在 Presentation。
3. 未解决的开放问题不得在实现中顺便作出产品决定。
4. 每个逻辑阶段独立提交，并执行 `npm run verify`。
