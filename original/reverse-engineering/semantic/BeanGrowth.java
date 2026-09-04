// 研究性语义重建：来源为 UP9 a.class / a.S()。
// 本文件只表达已由原版控制流确认的魔豆生长任务。

public final class BeanGrowth {
    private static final int OBJECT_EMPTY = 0xFF;
    private static final int OBJECT_BEAN_TOP = 0xCE;
    private static final int OBJECT_BEAN_MIDDLE = 0xDE;
    private static final int OBJECT_BEAN_BASE = 0xEE;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    /** 对应原版 `do`：当前并行生长任务数量。 */
    private int taskCount;

    /** 对应 `dh/di/dj/dk`。 */
    private byte[] taskX;
    private byte[] taskBaseY;
    private byte[] taskHeight;
    private byte[] taskCountdown;

    /**
     * 对应原版 `a.S()`，由 gameplay tick 调用。
     *
     * 每个任务的 countdown 初值为 16。归零时尝试向上长一格：
     * - 目标不能越界；
     * - 目标 object 必须为空；
     * - 目标 terrain unsigned ID 必须 <= 0x5D；
     * - 旧顶端改成 middle；
     * - 第一段同时建立 base；
     * - 新顶端写到更上一格；
     * - countdown 重置为 16。
     */
    void tick() {
        for (int task = 0; task < taskCount; task++) {
            int remaining = taskCountdown[task];
            if (remaining > 0) {
                taskCountdown[task] = (byte)(remaining - 1);
                continue;
            }

            int x = taskX[task] & 0xFF;
            int baseY = taskBaseY[task] & 0xFF;
            int height = taskHeight[task] & 0xFF;
            int nextY = baseY - height;

            boolean canGrow = nextY >= 0
                    && (objectGrid[nextY][x] & 0xFF) == OBJECT_EMPTY
                    && (terrainGrid[nextY][x] & 0xFF) <= 0x5D;

            if (!canGrow) {
                removeTask(task--);
                continue;
            }

            objectGrid[nextY + 1][x] = (byte)OBJECT_BEAN_MIDDLE;
            if (height <= 1) {
                objectGrid[baseY][x] = (byte)OBJECT_BEAN_BASE;
            }
            objectGrid[nextY][x] = (byte)OBJECT_BEAN_TOP;

            taskHeight[task] = (byte)(height + 1);
            taskCountdown[task] = 16;
        }
    }

    private void removeTask(int index) {
        for (int i = index; i < taskCount - 1; i++) {
            taskX[i] = taskX[i + 1];
            taskBaseY[i] = taskBaseY[i + 1];
            taskHeight[i] = taskHeight[i + 1];
            taskCountdown[i] = taskCountdown[i + 1];
        }
        taskCount--;
    }
}
