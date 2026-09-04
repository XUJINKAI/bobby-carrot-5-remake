// 研究性语义重建：来源为 UP9 a.class / a.a(int,int,boolean)、a.J()、a.H() 与 a.M()。

public final class MowerRuntime {
    private static final int OBJECT_EMPTY = 0xFF;
    private static final int OBJECT_CARROT = 0xCA;
    private static final int OBJECT_EGG_NEST_EMPTY = 0xCB;
    private static final int OBJECT_BEANSTALK_TIP = 0xCE;
    private static final int OBJECT_BEANSTALK_MID = 0xDE;
    private static final int OBJECT_BEANSTALK_BASE = 0xEE;
    private static final int OBJECT_PLANK = 0xD4;
    private static final int OBJECT_MOWER = 0xDC;
    private static final int OBJECT_GAS = 0xDD;
    private static final int OBJECT_CRUMBLY_ROCK = 0xED;

    private static final int TERRAIN_MOWER_PARKING = 0xA0;
    private static final int TERRAIN_HIGH_GRASS = 0xC7;
    private static final int TERRAIN_HIGH_GRASS_OBJECTIVE = 0xC8;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    /** 对应原版 `cX`。 */
    private boolean hasGas;

    /** 对应原版 `bi`。 */
    private boolean ridingMower;

    /** 对应原版 `bk`：本次移动结束时需要割掉当前高草。 */
    private boolean mowCurrentTileOnFinish;

    /** 对应 `aN`。 */
    private int speedContinuation;

    /** 原版关卡当前目标类型：true 时 C8 草下生成 Carrot，否则生成 Empty Egg Nest。 */
    private boolean carrotObjective;

    void collectGas(int x, int y) {
        if ((objectGrid[y][x] & 0xFF) != OBJECT_GAS || ridingMower) {
            return;
        }
        hasGas = true;
        objectGrid[y][x] = (byte)OBJECT_EMPTY;
    }

    /**
     * `DC Mower` 只有持有 Gas 时才允许 Bobby 进入；移动完全结束后原版删除该 object，
     * 将 `bi=true`，从此 Bobby movement state machine 直接进入 mower 模式。
     */
    boolean canEnterMower() {
        return !ridingMower && hasGas;
    }

    void finishMount(int x, int y) {
        objectGrid[y][x] = (byte)OBJECT_EMPTY;
        ridingMower = true;
        speedContinuation = 0;
    }

    /**
     * 原版在 mower 模式跨过 A0 Mower Parking 的移动中点时登记 dismount；
     * 该格视觉移动结束后放回 DC Mower，并把 Bobby 直接移到 parking 右边一格。
     */
    void finishDismount(int parkingX, int parkingY, PlayerPosition player) {
        if (!ridingMower || (terrainGrid[parkingY][parkingX] & 0xFF) != TERRAIN_MOWER_PARKING) {
            return;
        }

        ridingMower = false;
        speedContinuation = 0;
        objectGrid[parkingY][parkingX] = (byte)OBJECT_MOWER;
        player.gridX += 1;
        player.pixelX += 48;
    }

    /** 从原版 player collision 分支直接恢复。 */
    boolean canEnterTerrain(int terrain) {
        int raw = terrain & 0xFF;
        if (raw == TERRAIN_HIGH_GRASS || raw == TERRAIN_HIGH_GRASS_OBJECTIVE) {
            if (!ridingMower) {
                return false;
            }
            mowCurrentTileOnFinish = true;
            return true;
        }
        return true;
    }

    /**
     * 原版 Crumbly Rock ED 只在 mower + Speed forced movement 两个条件同时成立时可通过。
     * `specialMode` 对应 `canPlayerMove(..., true)`，普通方向输入传 false。
     */
    boolean canEnterCrumblyRock(boolean specialMode) {
        return ridingMower && speedContinuation > 0 && specialMode;
    }

    /** 原版 mower 对这些普通 Bobby 可用 object 明确阻挡。 */
    boolean mowerBlocksObject(int object) {
        if (!ridingMower) {
            return false;
        }
        switch (object & 0xFF) {
            case OBJECT_CARROT:
            case OBJECT_BEANSTALK_TIP:
            case OBJECT_BEANSTALK_MID:
            case OBJECT_BEANSTALK_BASE:
            case OBJECT_PLANK:
                return true;
            default:
                return false;
        }
    }

    /**
     * 对应 `H()` 中 `bk` 的移动完成结算。
     * C8 High Grass 还会在割草后恢复隐藏的关卡目标 object。
     */
    void finishMowing(int x, int y, int replacementGroundRaw) {
        if (!mowCurrentTileOnFinish) {
            return;
        }
        mowCurrentTileOnFinish = false;

        if ((terrainGrid[y][x] & 0xFF) == TERRAIN_HIGH_GRASS_OBJECTIVE) {
            objectGrid[y][x] = (byte)(carrotObjective ? OBJECT_CARROT : OBJECT_EGG_NEST_EMPTY);
        }
        terrainGrid[y][x] = (byte)replacementGroundRaw;
    }

    static final class PlayerPosition {
        int gridX;
        int pixelX;
    }
}
