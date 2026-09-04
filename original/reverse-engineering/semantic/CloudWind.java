// 研究性语义重建：来源为 UP9 a.class / a.J()、a.H()、a.P()、a.a(byte,byte)。
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

    private static final int SWITCH_UP_ON = 0xA7;
    private static final int SWITCH_UP_OFF = 0xA8;
    private static final int SWITCH_DOWN_ON = 0xA9;
    private static final int SWITCH_DOWN_OFF = 0xAA;
    private static final int SWITCH_LEFT_ON = 0xAB;
    private static final int SWITCH_LEFT_OFF = 0xAC;
    private static final int SWITCH_RIGHT_ON = 0xAD;
    private static final int SWITCH_RIGHT_OFF = 0xAE;

    private static final int CAMERA_HOLD_STEPS = 64;

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

    /** 对应原版 `aZ`：刚由 Off→On 打开的风向，等待捕获第一朵被该风改向的 Cloud。 */
    private int pendingCameraWindDirection = -1;

    /** 对应原版 `aE`：被镜头跟踪的 moving entity index。 */
    private int cameraTrackedMovingEntity = -1;

    /** 对应原版 `aT`。 */
    private int cameraHoldSteps;

    /**
     * 对应 `a.J()` 的 Wind Switch 分支。
     * 同方向的全部 Switch 会被统一替换成同一状态，而不是只修改当前格。
     *
     * On→Off 只关风并换图；Off→On 还会立即把镜头目标切到对应 Windmill，
     * 并保存刚开启的方向，等待 P() 中第一朵真正被这股风改向的 Cloud。
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
                beginWindCameraHandoff(UP, windmillUpX, windmillUpY);
                return;
            case SWITCH_DOWN_ON:
                windDownEnabled = false;
                replaceAll(SWITCH_DOWN_ON, SWITCH_DOWN_OFF);
                return;
            case SWITCH_DOWN_OFF:
                windDownEnabled = true;
                replaceAll(SWITCH_DOWN_OFF, SWITCH_DOWN_ON);
                beginWindCameraHandoff(DOWN, windmillDownX, windmillDownY);
                return;
            case SWITCH_LEFT_ON:
                windLeftEnabled = false;
                replaceAll(SWITCH_LEFT_ON, SWITCH_LEFT_OFF);
                return;
            case SWITCH_LEFT_OFF:
                windLeftEnabled = true;
                replaceAll(SWITCH_LEFT_OFF, SWITCH_LEFT_ON);
                beginWindCameraHandoff(LEFT, windmillLeftX, windmillLeftY);
                return;
            case SWITCH_RIGHT_ON:
                windRightEnabled = false;
                replaceAll(SWITCH_RIGHT_ON, SWITCH_RIGHT_OFF);
                return;
            case SWITCH_RIGHT_OFF:
                windRightEnabled = true;
                replaceAll(SWITCH_RIGHT_OFF, SWITCH_RIGHT_ON);
                beginWindCameraHandoff(RIGHT, windmillRightX, windmillRightY);
                return;
            default:
                return;
        }
    }

    private void beginWindCameraHandoff(int direction, int windmillX, int windmillY) {
        pendingCameraWindDirection = direction;
        cameraHoldSteps = CAMERA_HOLD_STEPS;
        setCameraTarget(windmillX * 48, windmillY * 48);
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

    /**
     * 当 P() 真正给一朵 Cloud 施加 wind forced direction 后调用。
     * 若这正是刚按开的风向，原版把镜头从 Windmill 转移到该 Cloud。
     */
    void onCloudForcedByWind(int movingEntityIndex, int newDirection, int pixelX, int pixelY) {
        if (pendingCameraWindDirection != newDirection) {
            return;
        }

        pendingCameraWindDirection = -1;
        cameraTrackedMovingEntity = movingEntityIndex;
        cameraHoldSteps = CAMERA_HOLD_STEPS;
        setCameraTarget(pixelX, pixelY);
    }

    /**
     * P() 在被跟踪 Cloud 每次移动后都会更新 Camera target，并在 `aT > 1` 时减一。
     * 64 gameplay step 约 1.98s；实际观感还要加镜头飞到 Windmill、转移到 Cloud、
     * 最后回 Bobby 的平滑移动时间，所以不能把“约 3 秒”当成固定 timer 常量。
     */
    void followTrackedCloudStep(int movingEntityIndex, int pixelX, int pixelY) {
        if (cameraTrackedMovingEntity != movingEntityIndex || cameraHoldSteps <= 1) {
            return;
        }

        setCameraTarget(pixelX, pixelY);
        cameraHoldSteps--;
    }

    /**
     * H() 在 Camera 已追上当前 target 时也会消耗 aT；到 0 后清掉 pending/tracked 状态，
     * 调 W() 把 Camera target 恢复到 Bobby。
     */
    void onCameraReachedTarget() {
        if (cameraHoldSteps <= 0) {
            return;
        }

        cameraHoldSteps--;
        if (cameraHoldSteps == 0) {
            pendingCameraWindDirection = -1;
            cameraTrackedMovingEntity = -1;
            restoreCameraToBobby();
        }
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

    private void setCameraTarget(int pixelX, int pixelY) {}
    private void restoreCameraToBobby() {}
}
