// 研究性语义重建：来源为 UP9 a.class / a.H()、a.N()、a.O()。
// 本文件解释 Bobby movement / idle animation 与 gameplay step 的耦合，不作为产品源码。

public final class BobbyAnimationCadence {
    private static final int WALK_FRAME_COUNT = 8;
    private static final int IDLE_ENTER_STEPS = 160;

    /** 对应原版 `aC`：连续无动作 gameplay step 数。 */
    private int idleSteps;

    /** 对应 `bf`：presentation update 的隔次门控。 */
    private boolean animationGate;

    /** 对应 `av`。 */
    private int frame = 3; // 正常站立第 4 帧，zero-based=3。

    /**
     * 普通走路（无 Speed、无 Speed Shoes）：O() 只有 `bf=false` 时推进帧，
     * 下一 gameplay step 只把 bf 清回 false，不推进。因此约每 2 gameplay step 变一帧。
     *
     * 一格普通移动 = 16 gameplay step：
     * 16 / 2 = 8 次 frame advance，恰好走完 b0..b3 的 8 帧并回到 frame 3。
     */
    void ordinaryWalkingStep() {
        if (!animationGate) {
            frame = (frame + 1) % WALK_FRAME_COUNT;
            animationGate = true;
        } else {
            animationGate = false;
        }
    }

    /**
     * Speed continuation 或 Speed Shoes 条件下，O() 的前置判断允许连续每个 gameplay step
     * 都推进 walk frame，不再被 bf 隔次跳过。
     *
     * 同时 fast movement 一格只需 8 gameplay step，因此仍然正好 8 帧一轮。
     */
    void fastWalkingStep() {
        frame = (frame + 1) % WALK_FRAME_COUNT;
        animationGate = true;
    }

    /**
     * H() 在 Bobby 完全静止、非 mower、非 airborne、非 shovel、方向 state<4 时每 step `aC++`。
     * 到 160 后进入 `aw=4` Idle。
     *
     * 平均 31ms/gameplay step -> 160 × 31ms ≈ 4.96s。
     */
    boolean shouldEnterIdle() {
        idleSteps++;
        return idleSteps >= IDLE_ENTER_STEPS;
    }

    /**
     * Idle `b4` 仍受 bf 隔次门控，因此 frame 变化约每 2 gameplay step ≈ 62ms，
     * 不是一个独立固定 50ms timer。
     *
     * b4 的 3 帧按 ping-pong 方式变化：0→1→2→1→0→1...。
     */
    int advanceIdleFrame(int current, boolean increasing) {
        if (!animationGate) {
            animationGate = true;
            if (increasing) {
                current++;
                if (current >= 3) current = 1;
            } else {
                current--;
                if (current < 0) current = 1;
            }
        } else {
            animationGate = false;
        }
        return current;
    }

    /**
     * Level transition、Death、普通 Mower 等不满足 O() 的 fast bypass 条件，
     * 同样只能在 animationGate=false 的 gameplay step 推进一帧。
     * 因而 b6 的逻辑槽也约每 2 gameplay step 推进，不是每 step 一帧。
     */
    boolean transitionAdvancesThisStep() {
        return !animationGate;
    }

    void resetIdleCounter() {
        idleSteps = 0;
    }
}
