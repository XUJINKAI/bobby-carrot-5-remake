// 研究性语义重建：来源为 UP9 a.class / a.a(int,int,boolean)、a.J()、a.H()、a.M()。
// 本文件用于表达已经确认的原版控制流，不作为可直接编译的产品源码。

public final class KiteFlight {
    private static final int OBJECT_EMPTY = 0xFF;
    private static final int KITE = 0xF3;
    private static final int WHIRLWIND = 0xF4;
    private static final int LANDING = 0xF5;

    private static final int TILE_SIZE = 48;
    private static final int FLIGHT_PIXEL_OFFSET = 24;
    private static final int TAKEOFF_OFFSET_PER_STEP = 6;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    /** 对应 `cY`。 */
    private boolean hasKite;

    /** 对应 `bm`。 */
    private boolean airborne;

    /** 对应 `bb`：0 none, 1 takeoff, 2 landing。 */
    private int transition;

    /** 对应 `aW`：人物飞行表现使用的垂直/高度偏移。 */
    private int flightPixelOffset;

    /** 对应 `aN`；起飞完成后保持为 1，使 `N()` 每 step 移动 6px。 */
    private int speedContinuation;

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
     * 每 gameplay step +6，期间仍绘制普通方向人物：
     * - 普通 3px/step 移动在后半格执行 8 次，抵达结算前内部 offset 到 48；
     * - 快速 6px/step 移动在后半格执行 4 次，offset 到 24。
     * 本格移动完全结束后切 `airborne=true`、改绘 b9.png 并固定 offset=24。
     */
    void advanceTakeoffOffset() {
        if (transition == 1) {
            flightPixelOffset += TAKEOFF_OFFSET_PER_STEP;
        }
    }

    void finishTakeoff() {
        if (transition != 1) {
            return;
        }
        transition = 0;
        airborne = true;
        flightPixelOffset = FLIGHT_PIXEL_OFFSET;
        speedContinuation = 1;
    }

    /**
     * airborne 时原版 `M()` 在读取当前格后直接进入独立分支：
     * - 不调用普通 `canPlayerMove()`；
     * - 不检查目标 terrain/object；
     * - 不检查目标 X/Y 边界；
     * - 只按当前方向把 grid 坐标推进一格并令 ay=48；
     * - airborne 分支不递减 `aN`，因此 `N()` 持续以 6px/step 完成每格。
     *
     * 所以飞行不是“ignore blocking 但保留 edge collision”，而是真正绕过普通格碰撞。
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
     * `J()` 在 airborne 时跳过普通格互动；唯一识别的 gameplay object 是 F5 Landing。
     */
    void handleAirborneMidpointObject(int rawObject) {
        if (airborne && (rawObject & 0xFF) == LANDING) {
            transition = 2;
        }
    }

    void advanceLandingOffset() {
        if (transition == 2) {
            flightPixelOffset -= TAKEOFF_OFFSET_PER_STEP;
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

    /**
     * Landing 完成后 `aN` 仍为 1，下一次 `M()` 因此会按当前方向尝试续行一格。
     * 未持续按住同方向时，`M()` 在建立移动后把 `aN` 减为 0，所以 `N()` 使用
     * 3px/step 的普通速度。受阻则清除 `aN` 并设置 `aO=8` 启动镜头震动。
     */
    boolean tryLandingRunout(PlayerPosition player, int direction) {
        if (speedContinuation <= 0) {
            return false;
        }
        if (!canPlayerMoveForward(direction)) {
            speedContinuation = 0;
            startImpactShake(8);
            return false;
        }
        advanceGroundedGrid(player, direction);
        speedContinuation--;
        return true;
    }

    /**
     * 原版 class 中没有“飞到地图边缘自动降落/自动停止”的路径。
     *
     * 反而 `M()` 开头会先读取 `terrainGrid[playerY][playerX]` 与 objectGrid；如果官方地图
     * 让 airborne Bobby 真正越过数组边界，下一 movement cycle 就会触发越界异常，最终被
     * 顶层 `b()` 的 Throwable catch 当成 runtime error 处理。
     *
     * 因此可确认的原版关卡契约是：正常 flight path 必须在出界以前用 F5 Landing 收尾。
     * 这里描述的是 class 控制流，不额外断言所有官方 DAT 都满足该约束；地图数据可另做验证。
     */
    boolean hasAutomaticMapEdgeLanding() {
        return false;
    }

    private boolean canPlayerMoveForward(int direction) {
        throw new UnsupportedOperationException("see PlayerCollisionRules.java");
    }

    private void advanceGroundedGrid(PlayerPosition player, int direction) {}

    private void startImpactShake(int steps) {}

    static final class PlayerPosition {
        int gridX;
        int gridY;
        int movePixelsRemaining;
    }
}
