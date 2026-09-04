// 研究性语义重建：来源为 UP9 a.class / a.J()、a.c(byte) 以及 atlas raw ID。
// 原版通过“记住当前格坐标，下一次移动跨过中点时再修改上一格”实现这些 on-leave 机制。

public final class LeaveTriggeredTiles {
    private static final int MIRROR_RIGHT_DOWN = 0xB1;
    private static final int MIRROR_LEFT_DOWN = 0xB2;
    private static final int MIRROR_RIGHT_UP = 0xB3;
    private static final int MIRROR_LEFT_UP = 0xB4;

    private static final int TRAP_ACTIVE = 0xAF;
    private static final int TRAP_INACTIVE = 0xB0;

    /** 对应原版 `a.c(byte)`。 */
    int rotateMirrorClockwiseOnLeave(int rawTile) {
        switch (rawTile & 0xFF) {
            case MIRROR_RIGHT_UP:
                return MIRROR_RIGHT_DOWN;
            case MIRROR_RIGHT_DOWN:
                return MIRROR_LEFT_DOWN;
            case MIRROR_LEFT_DOWN:
                return MIRROR_LEFT_UP;
            case MIRROR_LEFT_UP:
                return MIRROR_RIGHT_UP;
            default:
                return rawTile & 0xFF;
        }
    }

    /**
     * 原版 `a.J()` 在 Bobby 跨过 Inactive Trap 所在移动的中点时记录坐标；
     * 下一次移动跨过中点、再次执行 `J()` 时把该旧格写成 Active Trap。
     */
    int activateTrapOnLeave(int rawTile) {
        if ((rawTile & 0xFF) == TRAP_INACTIVE) {
            return TRAP_ACTIVE;
        }
        return rawTile & 0xFF;
    }
}
