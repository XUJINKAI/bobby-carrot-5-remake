// 研究性语义重建：来源为 UP9 a.class / a.M() 与 a.a(int,int,boolean)。
// 本文件用于表达已经确认的原版控制流，不作为可直接编译的产品源码。

public final class PlayerMovement {
    private static final int DIR_LEFT = 0;
    private static final int DIR_RIGHT = 1;
    private static final int DIR_UP = 2;
    private static final int DIR_DOWN = 3;

    private static final int TERRAIN_SPEED_UP = 0xB5;
    private static final int TERRAIN_SPEED_DOWN = 0xB6;
    private static final int TERRAIN_SPEED_LEFT = 0xB7;
    private static final int TERRAIN_SPEED_RIGHT = 0xB8;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    private int playerGridX;
    private int playerGridY;
    private int playerMotionState;
    private int playerMovePixelsRemaining;
    private int speedContinuation;

    private boolean inputUpHeld;
    private boolean inputDownHeld;
    private boolean inputLeftHeld;
    private boolean inputRightHeld;

    /**
     * 对应原版 `a.M()` 中已经确认的普通移动与 Speed 主干。
     *
     * 原版在格坐标上先完成移动，再用 `ay` 保存剩余像素过渡量；因此 gameplay
     * truth 与视觉位移不是同一个状态。
     */
    boolean advancePlayerMovement() {
        int terrain = terrainGrid[playerGridY][playerGridX] & 0xFF;

        if (terrain == TERRAIN_SPEED_LEFT && canPlayerMove(-1, 0, true)) {
            playerMotionState = DIR_LEFT;
            speedContinuation = 3;
        } else if (terrain == TERRAIN_SPEED_RIGHT && canPlayerMove(1, 0, true)) {
            playerMotionState = DIR_RIGHT;
            speedContinuation = 3;
        } else if (terrain == TERRAIN_SPEED_UP && canPlayerMove(0, -1, true)) {
            playerMotionState = DIR_UP;
            speedContinuation = 3;
        } else if (terrain == TERRAIN_SPEED_DOWN && canPlayerMove(0, 1, true)) {
            playerMotionState = DIR_DOWN;
            speedContinuation = 3;
        }

        if (speedContinuation > 0) {
            if (moveInCurrentDirection()) {
                // 原版随后根据输入同向保持、碰撞和当前 terrain 继续调整 aN。
                // 这些分支继续在后续 semantic pass 中恢复。
                playerMovePixelsRemaining = 48;
                return true;
            }
            speedContinuation = 0;
        }

        if (inputLeftHeld && tryMove(-1, 0, DIR_LEFT)) {
            return true;
        }
        if (inputRightHeld && tryMove(1, 0, DIR_RIGHT)) {
            return true;
        }
        if (inputUpHeld && tryMove(0, -1, DIR_UP)) {
            return true;
        }
        if (inputDownHeld && tryMove(0, 1, DIR_DOWN)) {
            return true;
        }

        return false;
    }

    private boolean tryMove(int dx, int dy, int direction) {
        if (!canPlayerMove(dx, dy, false)) {
            return false;
        }

        playerGridX += dx;
        playerGridY += dy;
        playerMotionState = direction;
        playerMovePixelsRemaining = 48;
        return true;
    }

    private boolean moveInCurrentDirection() {
        switch (playerMotionState) {
            case DIR_LEFT:
                return tryMove(-1, 0, DIR_LEFT);
            case DIR_RIGHT:
                return tryMove(1, 0, DIR_RIGHT);
            case DIR_UP:
                return tryMove(0, -1, DIR_UP);
            case DIR_DOWN:
                return tryMove(0, 1, DIR_DOWN);
            default:
                return false;
        }
    }

    /**
     * 对应原版 `a.a(int,int,boolean)`。
     * 该函数已经确认是 Bobby 的统一格通行判定，但其全部 terrain/object 分支仍在拆解。
     */
    private boolean canPlayerMove(int dx, int dy, boolean specialMode) {
        throw new UnsupportedOperationException("collision reconstruction in progress");
    }
}
