# 新增 / 校正机关流程

1. 在 `docs/reference/` 记录原版事实、字节码位置和仍未确认的问题。
2. 原版 Java gameplay 逻辑默认从普通版 `original/official/up09.jar` 开始逆向，再核对高清版同方法；UP9 属于稳定的 UP2+ 代码家族，适合作为当前通用机关行为的第一参考。纯显示问题以高清版 class 和 48px 资源为第一基准。如果行为存在疑问、两版观察不同、与早期关卡表现冲突，或需要判断某项规则何时引入，先沿普通版 UP8 → ... → UP2 → UP1 → Base 追查，再用高清序列检查兼容转换边界。代码与资产谱系依据见 [`官方发行包、代码与资产谱系`](../reference/official-release-provenance.md)。
3. 先判断事实属于即时 mutation、连续 World gameplay 过程还是纯 Presentation。不要按原版 task / class 名直接照搬；使用 [`World Runtime 契约`](../contracts/world-runtime.md) 的“后续 gameplay 是否依赖过程进度”准则。
4. 按 [`Engine 机制合同`](../contracts/engine-mechanisms.md) 确定 Entity Type、对象整体与各 Presence 的 Fact、可复用 Mechanism 和对象专属 Behavior；状态经 World 的 mutation 路径提交。在 Engine 唯一实现规则，不在 Web/Editor 复制。
5. 增加最小 Node 回归测试。
6. 在 Editor 建最小测试地图并 Play Test。
7. 如果行为仍有疑问，将地图导出为 `custom-maps/original-patch/<public-id>.json`，执行 `node tools/cli.mjs original patch`，在原版模拟器跑同一输入。
8. 对比原版与 Bobby Carrot 5 Remake，再回到字节码解释差异。
9. `npm run verify` 全量验证后再完成任务。

持续移动或动画的原版校准还需要：

- 分别记录每 step 位移/帧相位、完整路径墙钟实测和 Engine 毫秒配置；
- 实测注明地图、起止事件、格数或像素距离，并尽量使用长路径降低人工计时误差；
- gameplay 重复分段动作在 `30 / 60 / 120Hz` 下验证长距离总时长；
- 纯 Presentation 动画在任意采样时点验证帧边界，不使用渲染帧数表达时长。

原版验证不是另一个 Engine Playground：测试地图仍由 Editor authoring，Bobby Carrot 5 Remake 侧仍调用正式 Engine；JAR 工具只负责原版格式互操作。
