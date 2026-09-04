// 研究性语义重建：来源为 UP9 a.class / a.J() 与 a.H() 中 aL/aM/aP 分支。

public final class PlankDecay {
    private static final int OBJECT_EMPTY = 0xFF;
    private static final int PLANK = 0xD4;
    private static final int PLANK_CRUMBLING = 0xD5;
    private static final int PLANK_FRAGMENT = 0xD6;
    private static final int PHASE_TICKS = 6;

    private byte[][] objectGrid;

    /** 对应 `aJ/aK`：Bobby 当前站过、等待 on-leave 的 Plank。 */
    private int pendingLeaveX = -1;
    private int pendingLeaveY = -1;

    /** 对应 `aL/aM/aP`：当前唯一一个正在播放碎裂阶段的旧 Plank。 */
    private int decayingX = -1;
    private int decayingY = -1;
    private int countdown;

    /** 原版 `J()` 到达 D4 Plank 时只登记坐标。 */
    void onEnter(int x, int y) {
        if ((objectGrid[y][x] & 0xFF) == PLANK) {
            pendingLeaveX = x;
            pendingLeaveY = y;
        }
    }

    /**
     * 原版下一次 move-complete 进入别格时，在 `J()` 开头结算上一块 Plank。
     * 如果已有更旧的 fragment 正在 tracked，先直接删除它。
     */
    void settlePreviousLeave() {
        if (pendingLeaveX < 0) {
            return;
        }

        if (decayingX >= 0) {
            objectGrid[decayingY][decayingX] = (byte)OBJECT_EMPTY;
        }

        objectGrid[pendingLeaveY][pendingLeaveX] = (byte)PLANK_CRUMBLING;
        decayingX = pendingLeaveX;
        decayingY = pendingLeaveY;
        countdown = PHASE_TICKS;
        pendingLeaveX = -1;
        pendingLeaveY = -1;
    }

    /** 对应 `H()` 中的持续碎裂推进。 */
    void tick() {
        if (decayingX < 0) {
            return;
        }

        countdown--;
        if (countdown > 0) {
            return;
        }

        int object = objectGrid[decayingY][decayingX] & 0xFF;
        if (object == PLANK_CRUMBLING) {
            objectGrid[decayingY][decayingX] = (byte)PLANK_FRAGMENT;
            countdown = PHASE_TICKS;
            return;
        }

        objectGrid[decayingY][decayingX] = (byte)OBJECT_EMPTY;
        decayingX = -1;
        decayingY = -1;
    }
}
