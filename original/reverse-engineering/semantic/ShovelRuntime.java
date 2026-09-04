// 研究性语义重建：来源为 UP9 a.class / a.a(int,int,boolean)、a.H()、a.M()、a.J()。

public final class ShovelRuntime {
    private static final int TERRAIN_SNOW = 0x4D;
    private static final int TERRAIN_SHOVEL_CLEARED = 0x7C;
    private static final int TERRAIN_SHOVEL_PICKUP = 0x9F;

    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    private static final int SHOVEL_ACTION_TICKS = 32;

    private byte[][] terrainGrid;

    /** 对应 `cZ`。 */
    private boolean hasShovel;

    /** 对应 `bc`。 */
    private int shovelActionCountdown;

    /** 对应 `bo`：铲雪结束后下一次 M() 自动重试原方向。 */
    private boolean retryMoveAfterShovel;

    private int playerGridX;
    private int playerGridY;
    private int playerDirection;

    /** `J()` 跨过 0x9F pickup 所在移动中点时立即获得 Shovel，并把该格变成 0x7C。 */
    void collectShovelAtCurrentTile() {
        if ((terrainGrid[playerGridY][playerGridX] & 0xFF) != TERRAIN_SHOVEL_PICKUP) {
            return;
        }
        hasShovel = true;
        terrainGrid[playerGridY][playerGridX] = (byte)TERRAIN_SHOVEL_CLEARED;
    }

    /**
     * 对应 player collision 对 0x4D Snow 的特殊分支。
     * 返回 false：这一拍不会进入目标格，而是启动 32 tick 阻塞动作。
     */
    boolean tryStartShoveling(int dx, int dy) {
        int targetX = playerGridX + dx;
        int targetY = playerGridY + dy;
        if ((terrainGrid[targetY][targetX] & 0xFF) != TERRAIN_SNOW) {
            return false;
        }

        if (!hasShovel) {
            return false;
        }

        shovelActionCountdown = SHOVEL_ACTION_TICKS;
        playerDirection = directionFromDelta(dx, dy);
        return true;
    }

    /** 对应 `H()` 中 bc > 0 的持续阶段。 */
    void tick() {
        if (shovelActionCountdown <= 0) {
            return;
        }

        shovelActionCountdown--;
        if (shovelActionCountdown > 0) {
            return;
        }

        int targetX = playerGridX;
        int targetY = playerGridY;
        switch (playerDirection) {
            case LEFT:
                targetX--;
                break;
            case RIGHT:
                targetX++;
                break;
            case UP:
                targetY--;
                break;
            case DOWN:
                targetY++;
                break;
            default:
                return;
        }

        terrainGrid[targetY][targetX] = (byte)TERRAIN_SHOVEL_CLEARED;
        retryMoveAfterShovel = true;
    }

    /**
     * 对应 `M()` 最前面的 `bo` 分支：只消费一次，并按保存方向重新执行普通碰撞移动。
     */
    boolean consumeRetryMove() {
        if (!retryMoveAfterShovel) {
            return false;
        }
        retryMoveAfterShovel = false;
        return true;
    }

    private int directionFromDelta(int dx, int dy) {
        if (dx < 0) return LEFT;
        if (dx > 0) return RIGHT;
        if (dy < 0) return UP;
        return DOWN;
    }
}
