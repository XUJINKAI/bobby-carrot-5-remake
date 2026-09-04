// 研究性语义重建：来源为 UP9 a.class / a.b(byte,byte) 与 a.R()。
// Dragon Fireball 命中 Ice Block 后启动该任务。

public final class IceMelting {
    private static final int OBJECT_EMPTY = 0xFF;
    private static final int ICE_BLOCK = 0xE3;
    private static final int ICE_MELT_1 = 0xE4;
    private static final int ICE_MELT_2 = 0xE5;
    private static final int ICE_MELT_3 = 0xE6;

    private static final int MAX_TASKS = 5;
    private static final int PHASE_TICKS = 6;

    private byte[][] objectGrid;

    /** 对应原版 `dr/dl/dm/dn`。 */
    private int taskCount;
    private byte[] taskX = new byte[MAX_TASKS];
    private byte[] taskY = new byte[MAX_TASKS];
    private byte[] taskCountdown = new byte[MAX_TASKS];

    /**
     * 对应原版 `a.b(byte x, byte y)`。
     *
     * 队列已满时原版会立即清除最老的一块正在融化的冰，再移除最老任务。
     * 新任务会把 0xE3 Ice Block 立刻改成 0xE4，并以 6 tick 倒计时开始。
     */
    void start(int x, int y) {
        if (taskCount >= MAX_TASKS) {
            int oldestX = taskX[0] & 0xFF;
            int oldestY = taskY[0] & 0xFF;
            objectGrid[oldestY][oldestX] = (byte)OBJECT_EMPTY;
            removeTask(0);
        }

        taskX[taskCount] = (byte)x;
        taskY[taskCount] = (byte)y;
        taskCountdown[taskCount] = PHASE_TICKS;
        taskCount++;

        objectGrid[y][x] = (byte)ICE_MELT_1;
    }

    /**
     * 对应原版 `a.R()`：
     *
     * E4 --6 ticks--> E5 --6 ticks--> E6 --6 ticks--> empty
     */
    void tick() {
        for (int task = 0; task < taskCount; task++) {
            int remaining = taskCountdown[task];
            if (remaining > 0) {
                taskCountdown[task] = (byte)(remaining - 1);
                continue;
            }

            int x = taskX[task] & 0xFF;
            int y = taskY[task] & 0xFF;
            int object = objectGrid[y][x] & 0xFF;

            switch (object) {
                case ICE_MELT_1:
                    objectGrid[y][x] = (byte)ICE_MELT_2;
                    taskCountdown[task] = PHASE_TICKS;
                    break;
                case ICE_MELT_2:
                    objectGrid[y][x] = (byte)ICE_MELT_3;
                    taskCountdown[task] = PHASE_TICKS;
                    break;
                case ICE_MELT_3:
                    objectGrid[y][x] = (byte)OBJECT_EMPTY;
                    removeTask(task--);
                    break;
                default:
                    // 原版正常路径不会进入其它 object state；语义层保留任务退出。
                    removeTask(task--);
                    break;
            }
        }
    }

    private void removeTask(int index) {
        for (int i = index; i < taskCount - 1; i++) {
            taskX[i] = taskX[i + 1];
            taskY[i] = taskY[i + 1];
            taskCountdown[i] = taskCountdown[i + 1];
        }
        taskCount--;
    }
}
