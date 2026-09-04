// 研究性语义重建：来源为 UP9 a.class / a.P() 与
// a.a(int gridX, int gridY, int direction, byte entityType) 的 javap 字节码。

public final class LeafWater {
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    private static final int WATER = 0x55;
    private static final int WATER_ANIMATED = 0x56;
    private static final int TIDE_DOWN = 0x57;
    private static final int TIDE_UP = 0x58;
    private static final int TIDE_RIGHT = 0x59;
    private static final int TIDE_LEFT = 0x5A;
    private static final int WATER_FALL_START = 0x5B;
    private static final int WATER_FALL_MIDDLE = 0x5C;
    private static final int WATER_FALL_END = 0x5D;

    /**
     * 对应原版 moving-entity grid-pass helper 的 Leaf 专用分支。
     * direction 是 Leaf 正准备进入目标格时的运动方向。
     */
    boolean canEnter(int targetTerrain, int direction) {
        switch (targetTerrain & 0xFF) {
            case WATER:
            case WATER_ANIMATED:
                return true;

            case TIDE_UP:
                return direction != DOWN;
            case TIDE_DOWN:
                return direction != UP;
            case TIDE_LEFT:
                return direction != RIGHT;
            case TIDE_RIGHT:
                return direction != LEFT;

            case WATER_FALL_START:
            case WATER_FALL_MIDDLE:
            case WATER_FALL_END:
                return direction != UP;

            default:
                return false;
        }
    }

    /**
     * 对应 `a.P()` 在 Leaf 跨完一格后的 terrain routing。
     * 返回 -1 表示保持原方向；Fall 始终改为 Down。
     */
    int forcedDirection(int terrain) {
        switch (terrain & 0xFF) {
            case TIDE_UP:
                return UP;
            case TIDE_DOWN:
                return DOWN;
            case TIDE_LEFT:
                return LEFT;
            case TIDE_RIGHT:
                return RIGHT;
            case WATER_FALL_START:
            case WATER_FALL_MIDDLE:
            case WATER_FALL_END:
                return DOWN;
            default:
                return -1;
        }
    }

    /** 原版 Water Fall 路段使用 6px/tick；其它 Leaf 漂流默认 3px/tick。 */
    boolean isFastFlow(int terrain) {
        int raw = terrain & 0xFF;
        return raw == WATER_FALL_START || raw == WATER_FALL_MIDDLE || raw == WATER_FALL_END;
    }
}
