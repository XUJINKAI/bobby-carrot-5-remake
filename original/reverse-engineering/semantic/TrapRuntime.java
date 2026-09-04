// 研究性语义重建：来源为 UP9 a.class / a.J() 与 a.K()。

public final class TrapRuntime {
    private static final int TRAP_ACTIVE = 0xAF;
    private static final int TRAP_INACTIVE = 0xB0;

    private byte[][] terrainGrid;

    /**
     * 对应原版 `aF/aG`：Bobby 跨过 Inactive Trap 所在移动中点后，
     * 保存该格，等待下一次 midpoint interaction 结算 leave-trigger。
     */
    private int pendingTrapX = -1;
    private int pendingTrapY = -1;

    void onMidpointEnter(int x, int y) {
        int terrain = terrainGrid[y][x] & 0xFF;
        if (terrain == TRAP_INACTIVE) {
            pendingTrapX = x;
            pendingTrapY = y;
            return;
        }

        if (terrain == TRAP_ACTIVE) {
            startDeathSequence();
        }
    }

    /**
     * `a.J()` 每次 midpoint interaction 开头先执行这一段。
     * 上一次登记的 B0 会在 Bobby 已离开后变成 AF。
     */
    void settlePreviousLeave() {
        if (pendingTrapX < 0) {
            return;
        }
        terrainGrid[pendingTrapY][pendingTrapX] = (byte)TRAP_ACTIVE;
        pendingTrapX = -1;
        pendingTrapY = -1;
    }

    private void startDeathSequence() {
        // 原版 `a.K()` 负责统一 Bobby death 动画/状态转换；具体 death pipeline 继续恢复。
    }
}
