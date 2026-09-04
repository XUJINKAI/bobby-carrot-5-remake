// 研究性语义重建：来源为 UP9 a.class / a.H()、a.J()、a.M()、a.N()。

public final class IceSliding {
    private static final int ICE = 0x94;
    private static final int TILE_SIZE = 48;

    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    private byte[][] terrainGrid;

    /** 对应 `bn`。每次准备新 movement step 时先清 false。 */
    private boolean slidingOnIce;

    private int playerGridX;
    private int playerGridY;
    private int playerDirection;
    private int movePixelsRemaining;

    /**
     * 对应 `a.M()` 在普通输入之前的 Ice 分支。
     *
     * 当前所在格是 0x94 Ice 时，原版先尝试沿当前朝向自动走下一格；
     * 成功后直接开始 48px move，并跳过本次普通方向选择。
     * 若前方不可通行，则返回 false，随后 M() 才继续处理 held direction。
     */
    boolean tryContinueSlide() {
        if ((terrainGrid[playerGridY][playerGridX] & 0xFF) != ICE) {
            return false;
        }

        int dx = 0;
        int dy = 0;
        switch (playerDirection) {
            case LEFT:
                dx = -1;
                break;
            case RIGHT:
                dx = 1;
                break;
            case UP:
                dy = -1;
                break;
            case DOWN:
                dy = 1;
                break;
            default:
                return false;
        }

        if (!canPlayerMove(dx, dy)) {
            return false;
        }

        playerGridX += dx;
        playerGridY += dy;
        movePixelsRemaining = TILE_SIZE;
        slidingOnIce = true;
        return true;
    }

    /**
     * `a.H()` 在一次 move 已完全结束、准备调用 M() 前先执行 `bn=false`。
     * 因此 slidingOnIce 不是跨任意地形永久保持，而是每一步由当前 Ice 再次续期。
     */
    void beginNextMovementDecision() {
        slidingOnIce = false;
    }

    /**
     * `a.J()` 在移动中点跨过 0x94 时也把 bn 置 true；`a.N()` 看到 bn 后固定
     * Bobby 的 movement frame，不推进普通 walk-cycle。
     */
    void markMidpointIceInteraction(int terrain) {
        if ((terrain & 0xFF) == ICE) {
            slidingOnIce = true;
        }
    }

    private boolean canPlayerMove(int dx, int dy) {
        throw new UnsupportedOperationException("shared player collision reconstruction lives elsewhere");
    }
}
