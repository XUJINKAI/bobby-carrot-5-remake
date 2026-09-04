// 研究性语义重建：来源为 UP9 a.class / a.J()、a.P()、a.a(byte,byte)。
// raw ID 由 docs/system/original/mechanics.md 的 atlas 坐标交叉确认。

public final class CloudWind {
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    private static final int CLOUD_RED = 0xE0;
    private static final int CLOUD_PURPLE = 0xE1;
    private static final int CLOUD_GREEN = 0xE2;

    private static final int CLOUD_RED_PARKING = 0xF0;
    private static final int CLOUD_PURPLE_PARKING = 0xF1;
    private static final int CLOUD_GREEN_PARKING = 0xF2;

    private static final int WINDMILL_UP = 0xD0;
    private static final int WINDMILL_DOWN = 0xD1;
    private static final int WINDMILL_LEFT = 0xD2;
    private static final int WINDMILL_RIGHT = 0xD3;

    private static final int SWITCH_UP_ON = 0xA7;
    private static final int SWITCH_UP_OFF = 0xA8;
    private static final int SWITCH_DOWN_ON = 0xA9;
    private static final int SWITCH_DOWN_OFF = 0xAA;
    private static final int SWITCH_LEFT_ON = 0xAB;
    private static final int SWITCH_LEFT_OFF = 0xAC;
    private static final int SWITCH_RIGHT_ON = 0xAD;
    private static final int SWITCH_RIGHT_OFF = 0xAE;

    private byte[][] terrainGrid;

    private boolean windUpEnabled;
    private boolean windDownEnabled;
    private boolean windLeftEnabled;
    private boolean windRightEnabled;

    private int windmillUpX;
    private int windmillUpY;
    private int windmillDownX;
    private int windmillDownY;
    private int windmillLeftX;
    private int windmillLeftY;
    private int windmillRightX;
    private int windmillRightY;

    /**
     * 对应 `a.J()` 的 Wind Switch 分支。
     * 同方向的全部 Switch 会被统一替换成同一状态，而不是只修改当前格。
     */
    void stepWindSwitch(int rawSwitch) {
        switch (rawSwitch & 0xFF) {
            case SWITCH_UP_ON:
                windUpEnabled = false;
                replaceAll(SWITCH_UP_ON, SWITCH_UP_OFF);
                return;
            case SWITCH_UP_OFF:
                windUpEnabled = true;
                replaceAll(SWITCH_UP_OFF, SWITCH_UP_ON);
                return;
            case SWITCH_DOWN_ON:
                windDownEnabled = false;
                replaceAll(SWITCH_DOWN_ON, SWITCH_DOWN_OFF);
                return;
            case SWITCH_DOWN_OFF:
                windDownEnabled = true;
                replaceAll(SWITCH_DOWN_OFF, SWITCH_DOWN_ON);
                return;
            case SWITCH_LEFT_ON:
                windLeftEnabled = false;
                replaceAll(SWITCH_LEFT_ON, SWITCH_LEFT_OFF);
                return;
            case SWITCH_LEFT_OFF:
                windLeftEnabled = true;
                replaceAll(SWITCH_LEFT_OFF, SWITCH_LEFT_ON);
                return;
            case SWITCH_RIGHT_ON:
                windRightEnabled = false;
                replaceAll(SWITCH_RIGHT_ON, SWITCH_RIGHT_OFF);
                return;
            case SWITCH_RIGHT_OFF:
                windRightEnabled = true;
                replaceAll(SWITCH_RIGHT_OFF, SWITCH_RIGHT_ON);
                return;
            default:
                return;
        }
    }

    /**
     * 对应 `a.P()` 已确认的 Windmill 三格作用域。
     * 返回 -1 表示当前格未受到开启 Windmill 的强制改向。
     */
    int forcedDirectionAt(int x, int y, int currentDirection) {
        if (windUpEnabled
                && currentDirection != UP
                && x == windmillUpX
                && y >= windmillUpY - 3
                && y <= windmillUpY - 1) {
            return UP;
        }
        if (windDownEnabled
                && currentDirection != DOWN
                && x == windmillDownX
                && y >= windmillDownY + 1
                && y <= windmillDownY + 3) {
            return DOWN;
        }
        if (windLeftEnabled
                && currentDirection != LEFT
                && y == windmillLeftY
                && x >= windmillLeftX - 3
                && x <= windmillLeftX - 1) {
            return LEFT;
        }
        if (windRightEnabled
                && currentDirection != RIGHT
                && y == windmillRightY
                && x >= windmillRightX + 1
                && x <= windmillRightX + 3) {
            return RIGHT;
        }
        return -1;
    }

    /** 原版 Cloud 只有停在同色 Parking object 上才命中特殊停车条件。 */
    boolean isMatchingParking(int cloudType, int objectType) {
        return (cloudType == CLOUD_RED && objectType == CLOUD_RED_PARKING)
                || (cloudType == CLOUD_PURPLE && objectType == CLOUD_PURPLE_PARKING)
                || (cloudType == CLOUD_GREEN && objectType == CLOUD_GREEN_PARKING);
    }

    private void replaceAll(int from, int to) {
        for (int y = 0; y < terrainGrid.length; y++) {
            for (int x = 0; x < terrainGrid[y].length; x++) {
                if ((terrainGrid[y][x] & 0xFF) == from) {
                    terrainGrid[y][x] = (byte)to;
                }
            }
        }
    }
}
