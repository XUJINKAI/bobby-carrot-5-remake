# Bobby

## 基础方向

原版方向与角色资源对应：

- Left：`b0`
- Right：`b1`
- Up / Back：`b2`
- Down / Front：`b3`

正常移动使用对应资源的 8 帧，并以第 4 帧作为起止点循环：`4 -> 5 -> 6 -> 7 -> 8 -> 1 -> 2 -> 3 -> 4`。停止后保持第 4 帧。Editor 中固定使用正面站立姿势，即 `b3(1,4)`。

原版走路帧不是独立毫秒 timer，而是和 gameplay step、移动像素速度共同推进：

- 普通移动一格需要 16 个 gameplay step（3px/step）；走路帧隔一个 gameplay step 推进一次，因此一格正好推进 8 帧并回到第 4 帧；
- Speed / Speed Shoes 的快速移动一格需要 8 个 gameplay step（6px/step）；快速状态下走路帧每个 gameplay step 都推进，因此同样一格正好完成 8 帧循环。

所以原版的“每格一整轮走路动画”是 movement cadence 与 animation gate 自然配平的结果，不是两套独立参数手调出来的。

## 待机

Bobby 连续静止 160 个 gameplay step 后进入 `b4` 待机动画；按稳态约 31ms/gameplay step 换算约 **4.96 秒**。

`b4` 为 3 帧 ping-pong 动画。待机帧仍受原版 `bf` 隔次门控，约每 2 个 gameplay step（约 62ms）变化一次，并不是独立固定 50ms timer。

## 死亡

死亡使用 `b5` 的 8 帧动画，结束后保持最后一帧。陷阱等“进入目标格时死亡”的情况，视觉上应先向目标格移动到 midpoint 再启动死亡，而不是瞬间停在原格。

## 关卡进入 / 通关过渡

`b6.png` 为 8 帧 Bobby transition：

- 关卡初始化后从第 8 帧向第 1 帧反向推进，结束后恢复普通 Down / Front 站立；
- 通关时从第 1 帧向第 8 帧正向推进，随后进入结果 / campaign 流程。

原版 `av` 计数器实际使用 10 个逻辑槽，其中 `8/9` 位于素材范围外并显示为空白。
进入状态在当轮 animation advance 之后建立，持续约 10×31ms = 310ms；通关状态
在当轮 advance 之前建立并立即推进一次，持续约 9×31ms = 279ms。两条路径复用
同一套 8 帧资源，但具有独立时长。

## 特殊状态

- Ice：滑行时固定使用普通移动资源的滑行帧；连续多个 Ice 格之间保持同一姿势，撞停/离开后恢复普通移动流程。
- Speed：加速移动仍使用普通 8 帧走路循环；由于移动一格和帧推进都变为 8 gameplay step，一格仍完整循环 8 帧。
- 割草机：`b7`，2×4 帧；四列对应 Left / Right / Up / Down，两行组成循环。
- 雪铲：`b8`，3×4 帧；四列对应方向，三行表示动作阶段。
- 风筝：`b9`，1×4 帧；四列对应 Left / Right / Up / Down。
- 攀爬藤蔓：使用 Up / Back 的 Bobby 表现。

Bobby 的资源语义、偏移和动画调试参数应集中在 `engine/src/entities/player/bobby.ts`，World 中的位置和碰撞不能因为 sprite 偏移而改变。
