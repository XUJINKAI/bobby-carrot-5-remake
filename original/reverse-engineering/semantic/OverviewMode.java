// 研究性语义重建：来源为 UP9 a.class / gameplay state、M()、W()、HUD 与 EN.dat a[58]。
// Overview 是 gameplay 内的手动相机浏览模式，不是另一张地图/缩放模式。

public final class OverviewMode {
    /** 原版 `dV`。 */
    private boolean overviewActive;

    /** 原版 `aT`：其它 cinematic camera focus 正在占用相机时不能切 Overview。 */
    private int cameraFocusStepsRemaining;

    /** 原版 `aw==5` 为 death state。 */
    private boolean playerDead;

    private boolean inputFireHeld;
    private boolean inputLeftHeld;
    private boolean inputRightHeld;
    private boolean inputUpHeld;
    private boolean inputDownHeld;

    /** 原版 bO/bP：相机目标像素；实际 Camera 还有平滑追赶状态。 */
    private int cameraTargetPixelX;
    private int cameraTargetPixelY;

    private int playerPixelX;
    private int playerPixelY;

    /**
     * Gameplay state 每个 step 在进入 Bobby movement phase 前处理 Fire。
     * 只有没有其它 camera focus、Bobby 未死亡时允许切换。
     */
    void handleToggle() {
        if (cameraFocusStepsRemaining != 0 || playerDead || !inputFireHeld) {
            return;
        }

        inputFireHeld = false;
        overviewActive = !overviewActive;

        if (!overviewActive) {
            restoreCameraToPlayer();
        }
    }

    /**
     * 原版 `M()` 在 ordinary input 前直接 `if (dV) return false`，
     * 因而 Overview 期间方向键不会启动 Bobby 格移动。
     */
    boolean blocksPlayerMovement() {
        return overviewActive;
    }

    /**
     * 顶层 gameplay update 的 Overview 分支：每 gameplay step 按住方向键使相机目标移动 24px。
     * 48px tile 下即半格/step；随后仍通过原版 Camera 平滑/边界逻辑 `X()/Y()` 更新实际镜头。
     */
    void advanceCameraTarget() {
        if (!overviewActive) return;

        if (inputLeftHeld) {
            cameraTargetPixelX -= 24;
        } else if (inputRightHeld) {
            cameraTargetPixelX += 24;
        } else if (inputUpHeld) {
            cameraTargetPixelY -= 24;
        } else if (inputDownHeld) {
            cameraTargetPixelY += 24;
        }
    }

    /**
     * 对应 `W()` 的核心语义：退出 Overview / death 等路径都把 camera target 重新指向 Bobby，
     * 并清空 Camera 的额外追赶速度/累计量。
     */
    private void restoreCameraToPlayer() {
        cameraTargetPixelX = playerPixelX;
        cameraTargetPixelY = playerPixelY;
        clearCameraInterpolationVelocity();
    }

    /** HUD 在 `dV=true` 时绘制单独的 Overview 图标。 */
    boolean showOverviewHudIndicator() {
        return overviewActive;
    }

    private void clearCameraInterpolationVelocity() {}
}
