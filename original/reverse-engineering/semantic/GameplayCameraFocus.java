// 研究性语义重建：来源为 UP9 a.class / a.H()、a.M()、a.P()、a.Q()、a.J()、a.W()/Y()。
// 本文件记录原版 camera focus 与 input gate 的共享状态，不作为产品源码。

public final class GameplayCameraFocus {
    private static final int FIREBALL_FOCUS_STEPS = 16;
    private static final int WIND_FOCUS_STEPS = 64;

    /** 对应 `aT`。0 表示无机制强制 camera focus。 */
    private int focusSteps;

    /** 对应 `aE`，>=0 时表示 Camera 正在跟踪某个 moving entity。 */
    private int trackedMovingEntity = -1;

    /** 对应 `aZ`，Wind switch 刚打开后等待第一朵被该方向吹动的 Cloud。 */
    private int pendingWindDirection = -1;

    /** 对应 `bO/bP`：camera target pixel。 */
    private int targetPixelX;
    private int targetPixelY;

    /**
     * Dragon Fireball `Q()` 每次 gameplay step 都先：
     * `aT=16; d(fireballPixelX, fireballPixelY)`。
     * 因为每步重置 countdown，只要火球还在飞，Camera target 就持续跟着火球刷新。
     */
    void focusFireballEveryStep(int fireballPixelX, int fireballPixelY) {
        focusSteps = FIREBALL_FOCUS_STEPS;
        setCameraTargetCentered(fireballPixelX, fireballPixelY);
    }

    /**
     * Fireball 消失的那次 Q() 也已经先设过 aT=16，所以消失后仍保留最多 16 gameplay step
     * 的 focus countdown；待 Camera 到 target 后 H() 继续消耗，归零再恢复 Bobby。
     */
    void onFireballEnded() {
        // 不立即清 focusSteps，这是原版重要时序。
    }

    /** Wind Off->On：先聚焦 Windmill，并等待 Cloud handoff。 */
    void focusNewlyEnabledWind(int direction, int windmillPixelX, int windmillPixelY) {
        pendingWindDirection = direction;
        focusSteps = WIND_FOCUS_STEPS;
        setCameraTargetCentered(windmillPixelX, windmillPixelY);
    }

    /** 第一朵真正被刚打开的风改向的 Cloud 接管 Camera。 */
    void handoffWindFocusToCloud(int entityIndex, int direction, int cloudPixelX, int cloudPixelY) {
        if (pendingWindDirection != direction) return;
        pendingWindDirection = -1;
        trackedMovingEntity = entityIndex;
        focusSteps = WIND_FOCUS_STEPS;
        setCameraTargetCentered(cloudPixelX, cloudPixelY);
    }

    /** P() 对 tracked Cloud 每步刷新 target，并在 countdown>1 时递减。 */
    void followCloudStep(int entityIndex, int pixelX, int pixelY) {
        if (trackedMovingEntity != entityIndex || focusSteps <= 1) return;
        setCameraTargetCentered(pixelX, pixelY);
        focusSteps--;
    }

    /**
     * H() 开头：只有 Camera 已经到达 target (`bO==bI && bP==bJ`) 时才额外消耗 aT。
     * 到 0 后清 pending/tracked 状态并调用 W()，重新以 Bobby 为 camera target。
     */
    void onCameraReachedTarget() {
        if (focusSteps <= 0) return;
        focusSteps--;
        if (focusSteps == 0) {
            pendingWindDirection = -1;
            trackedMovingEntity = -1;
            restoreTargetToBobby();
        }
    }

    /**
     * 原版 `M()` 的普通 input 分支前明确：`if (aT != 0) return false`。
     * 所以 mechanism camera focus 同时是普通 Bobby input gate。
     *
     * 注意 Speed continuation、Ice 自动续滑、airborne 等分支位于这个检查之前，
     * 因此不能把它简单理解成“aT>0 时 World 完全暂停”；它只挡落到普通方向输入的路径。
     */
    boolean blocksOrdinaryDirectionInput() {
        return focusSteps != 0;
    }

    /**
     * `W()` 不是瞬间把 camera pixel teleport 到 Bobby，而是重设 target/加速度状态；
     * 后续 `Y()` 继续平滑追踪。所以 focus 结束和画面完全回到 Bobby 不是同一时刻。
     */
    private void restoreTargetToBobby() {}

    private void setCameraTargetCentered(int pixelX, int pixelY) {
        targetPixelX = pixelX;
        targetPixelY = pixelY;
    }
}
