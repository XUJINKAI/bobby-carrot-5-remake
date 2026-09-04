// 研究性语义重建：来源为 UP9 a.class / a.H()、a.M()、a.N()、a.J()。
// 该文件描述原版一次格移动的时序边界，供其它机制判断 on-enter / on-leave 的真实触发点。

public final class PlayerMoveLifecycle {
    private static final int TILE_PIXELS = 48;
    private static final int INTERACTION_THRESHOLD_PIXELS = 24;
    private static final int NORMAL_PIXELS_PER_TICK = 3;
    private static final int FAST_PIXELS_PER_TICK = 6;

    private int playerGridX;
    private int playerGridY;
    private int playerPixelX;
    private int playerPixelY;

    /** 对应 `ay`。 */
    private int movePixelsRemaining;

    /** 对应 `bg`：本次移动的 midpoint interaction 尚未执行。 */
    private boolean interactionPending;

    /**
     * 对应 `a.M()` 成功路径。
     * 原版 gameplay grid truth 在视觉移动开始时就切到目标格。
     */
    void beginMove(int dx, int dy) {
        playerGridX += dx;
        playerGridY += dy;
        movePixelsRemaining = TILE_PIXELS;
        interactionPending = true;
    }

    /**
     * 对应 `a.H()` 中 `ay != 0` 分支。
     *
     * 注意：`J()` 在剩余像素 <= 24 时执行，也就是一格视觉移动的中点。
     * 它会先结算上一格挂起的 leave-trigger，再处理当前 grid 格的 enter-trigger。
     */
    void tickMove(boolean fast) {
        if (interactionPending && movePixelsRemaining <= INTERACTION_THRESHOLD_PIXELS) {
            interactionPending = false;
            settlePreviousTileLeaveTriggers();
            handleCurrentTileMidpointInteraction();
        }

        int pixels = fast ? FAST_PIXELS_PER_TICK : NORMAL_PIXELS_PER_TICK;
        advancePlayerPixels(pixels);
        movePixelsRemaining -= pixels;

        if (movePixelsRemaining == 0) {
            finishMove();
        }
    }

    private void settlePreviousTileLeaveTriggers() {
        // Trap / Carousel / Mirror / Plank 等通过 a.J() 开头保存的旧坐标在这里结算。
    }

    private void handleCurrentTileMidpointInteraction() {
        // Pickup / Switch / Beanfield / Dragon Tail / Ice / mount markers 等在 a.J() 中结算。
    }

    private void finishMove() {
        // a.H() 在 ay==0 后处理 mower mount/dismount、mowing、flight enter/landing 等收尾状态。
    }

    private void advancePlayerPixels(int pixels) {
        // 具体方向更新见 PlayerMovement.advancePixelMotion()。
    }
}
