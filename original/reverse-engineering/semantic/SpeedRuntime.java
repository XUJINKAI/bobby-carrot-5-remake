// 研究性语义重建：来源为 UP9 a.class / a.M() 与 a.N()。
// 该文件刻意保留原版 aN countdown 的真实语义，不引入 full/normal/slow 近似阶段。

public final class SpeedRuntime {
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    private static final int SPEED_UP = 0xB5;
    private static final int SPEED_DOWN = 0xB6;
    private static final int SPEED_LEFT = 0xB7;
    private static final int SPEED_RIGHT = 0xB8;

    private static final int TILE_SIZE = 48;
    private static final int FAST_PIXELS_PER_TICK = 6;

    private byte[][] terrainGrid;

    private int playerGridX;
    private int playerGridY;
    private int playerDirection;
    private int movePixelsRemaining;

    /**
     * 对应原版 `aN`。
     * 进入 Speed 时设 3；每成功跨完一个自动格后，若没有同向 held input 则减 1。
     */
    private int continuationTiles;

    private boolean inputUpHeld;
    private boolean inputDownHeld;
    private boolean inputLeftHeld;
    private boolean inputRightHeld;

    /**
     * 对应 `a.M()` 在 forced continuation 分支之前对当前 terrain 的检查。
     * 每次站在 Speed tile 上都会用 tile 方向覆盖当前方向，并把 countdown 重置为 3。
     */
    void refreshFromCurrentSpeedTile() {
        switch (terrainGrid[playerGridY][playerGridX] & 0xFF) {
            case SPEED_LEFT:
                if (canPlayerMove(-1, 0, true)) {
                    playerDirection = LEFT;
                    continuationTiles = 3;
                }
                break;
            case SPEED_RIGHT:
                if (canPlayerMove(1, 0, true)) {
                    playerDirection = RIGHT;
                    continuationTiles = 3;
                }
                break;
            case SPEED_UP:
                if (canPlayerMove(0, -1, true)) {
                    playerDirection = UP;
                    continuationTiles = 3;
                }
                break;
            case SPEED_DOWN:
                if (canPlayerMove(0, 1, true)) {
                    playerDirection = DOWN;
                    continuationTiles = 3;
                }
                break;
            default:
                break;
        }
    }

    /**
     * 对应 `a.M()` 的 aN > 0 分支。
     *
     * 成功后：
     * - grid truth 立即前进一格；
     * - 48px visual move 使用 6px/tick；
     * - 同方向 held 时 countdown 直接续回 3；
     * - 未 held 时 countdown 3→2→1→0；
     * - 撞停时 countdown 立即清 0。
     */
    boolean tryForcedStep() {
        if (continuationTiles <= 0) {
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
                continuationTiles = 0;
                return false;
        }

        if (!canPlayerMove(dx, dy, false)) {
            continuationTiles = 0;
            onSpeedImpact();
            return false;
        }

        playerGridX += dx;
        playerGridY += dy;
        movePixelsRemaining = TILE_SIZE;

        if (isCurrentDirectionHeld()) {
            continuationTiles = 3;
        } else {
            continuationTiles--;
        }
        return true;
    }

    /** aN > 0 时 `a.N()` 固定使用 6px/tick，即 48px / 8 tick。 */
    int pixelsPerTick() {
        return continuationTiles > 0 ? FAST_PIXELS_PER_TICK : 3;
    }

    private boolean isCurrentDirectionHeld() {
        switch (playerDirection) {
            case LEFT:
                return inputLeftHeld;
            case RIGHT:
                return inputRightHeld;
            case UP:
                return inputUpHeld;
            case DOWN:
                return inputDownHeld;
            default:
                return false;
        }
    }

    private boolean canPlayerMove(int dx, int dy, boolean specialMode) {
        throw new UnsupportedOperationException("shared collision reconstruction lives elsewhere");
    }

    private void onSpeedImpact() {
        // 原版还触发 8 tick 的 camera shake (`aO=8`)；gameplay continuation 到此结束。
    }
}
