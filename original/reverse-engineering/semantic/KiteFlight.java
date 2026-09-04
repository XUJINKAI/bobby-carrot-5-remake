// 研究性语义重建：来源为 UP9 a.class / a.a(int,int,boolean)、a.J()、a.H()、a.M()。

public final class KiteFlight {
    private static final int OBJECT_EMPTY = 0xFF;
    private static final int KITE = 0xF3;
    private static final int WHIRLWIND = 0xF4;
    private static final int LANDING = 0xF5;

    private static final int TILE_SIZE = 48;
    private static final int FLIGHT_PIXEL_OFFSET = 24;
    private static final int TAKEOFF_OFFSET_PER_TICK = 6;

    private byte[][] objectGrid;

    /** 对应 `cY`。 */
    private boolean hasKite;

    /** 对应 `bm`。 */
    private boolean airborne;

    /** 对应 `bb`：0 none, 1 takeoff, 2 landing。 */
    private int transition;

    /** 对应 `aW`：人物飞行表现使用的垂直/高度偏移。 */
    private int flightPixelOffset;

    void collectKite(int x, int y) {
        if ((objectGrid[y][x] & 0xFF) != KITE || airborne) {
            return;
        }
        hasKite = true;
        objectGrid[y][x] = (byte)OBJECT_EMPTY;
    }

    /** 原版普通 Bobby 只有已经取得 Kite 才能进入 Whirlwind。 */
    boolean canEnterWhirlwind() {
        return !airborne && hasKite;
    }

    /** 对应 `J()` 到达 F4 Whirlwind 时的 midpoint interaction。 */
    void startTakeoff() {
        if (!airborne && hasKite) {
            transition = 1;
            flightPixelOffset = 0;
        }
    }

    /**
     * 对应 `H()` 在本格剩余视觉移动期间的 takeoff offset。
     * 每 tick +6；本格移动完全结束后切换 `airborne=true` 并固定 offset=24。
     */
    void tickTakeoffOffset() {
        if (transition == 1) {
            flightPixelOffset += TAKEOFF_OFFSET_PER_TICK;
        }
    }

    void finishTakeoff() {
        if (transition != 1) {
            return;
        }
        transition = 0;
        airborne = true;
        flightPixelOffset = FLIGHT_PIXEL_OFFSET;
    }

    /**
     * airborne 时原版 `M()` 不调用普通 terrain/object collision，直接按当前方向
     * 将 Bobby 的 grid 坐标推进一格并开始新的 48px 视觉移动。
     */
    void advanceAirborneGrid(PlayerPosition player, int direction) {
        if (!airborne) {
            return;
        }
        switch (direction) {
            case 0:
                player.gridX--;
                break;
            case 1:
                player.gridX++;
                break;
            case 2:
                player.gridY--;
                break;
            case 3:
                player.gridY++;
                break;
            default:
                return;
        }
        player.movePixelsRemaining = TILE_SIZE;
    }

    /**
     * `J()` 在 airborne 时跳过普通格互动；只有当前 object 为 F5 Landing 时开始降落。
     */
    void handleAirborneMidpointObject(int rawObject) {
        if (airborne && (rawObject & 0xFF) == LANDING) {
            transition = 2;
        }
    }

    void tickLandingOffset() {
        if (transition == 2) {
            flightPixelOffset -= TAKEOFF_OFFSET_PER_TICK;
        }
    }

    void finishLanding() {
        if (transition != 2) {
            return;
        }
        transition = 0;
        airborne = false;
        flightPixelOffset = 0;
    }

    // 地图边缘的原版收尾路径仍需继续追踪，不在这里根据表现猜测。

    static final class PlayerPosition {
        int gridX;
        int gridY;
        int movePixelsRemaining;
    }
}
