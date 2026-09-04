// 研究性语义重建：来源为 UP9 a.class / a.a(int,int,boolean)、a.J()、a.H() 与 a.M()。
// 本文件用于表达已经确认的原版控制流，不作为可直接编译的产品源码。

public final class MowerRuntime {
    private static final int OBJECT_EMPTY = 0xFF;
    private static final int OBJECT_CARROT = 0xCA;
    private static final int OBJECT_EGG_NEST_EMPTY = 0xCB;
    private static final int OBJECT_EGG_NEST_FILLED = 0xCC;
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

    /** `a.bs`：割草后随机恢复为四种普通地面之一。 */
    private static final int[] MOWED_GROUND = {0x5E, 0x5F, 0x90, 0x91};

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
     * `DC Mower` 有 Gas 时允许普通 Bobby 进入；移动完全结束后原版删除该 object，
     * 将 `bi=true`，从此 Bobby movement state machine 进入 mower 模式。
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

    /**
     * High Grass 是 terrain 级特殊规则：只有 mower 能进入；一旦允许，本次移动完成时割掉。
     */
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
     * 原版 `ED Crumbly Rock` 的准确条件：
     *
     * - 不是 mower：一定 blocking；
     * - mower 且已经有 `speedContinuation > 0`：允许；
     * - mower 还没进入 continuation，但当前是 Speed tile 用 `specialMode=true` 预探下一格：也允许。
     *
     * 因此这里是 OR，不是 `speedContinuation > 0 && specialMode`。
     */
    boolean canEnterCrumblyRock(boolean speedProbe) {
        return ridingMower && (speedContinuation > 0 || speedProbe);
    }

    /**
     * 原版不能把 Mower object 规则简化成一个固定 blacklist。
     *
     * player collision 先决定 target terrain 是否可走，再由 object 覆盖：
     * - CE/DE/D4 只在 terrain 本来不可走时给普通 Bobby 提供 bridge override；mower 不享受该 override；
     * - 如果底下 terrain 本来就可走，则 CE/DE/D4 并不会额外挡 mower；
     * - EE Base 从来没有 bridge override，但在普通可走 terrain 上也不是 blocking；
     * - CA Carrot 是明确的 mower blocking object；
     * - CC Filled Egg Nest 明确 blocking；CB Empty Egg Nest 本身不挡 mower，但 mower 也不会填它。
     */
    boolean objectAllowsMowerOnAlreadyPassableTerrain(int object) {
        if (!ridingMower) {
            return true;
        }

        switch (object & 0xFF) {
            case OBJECT_CARROT:
            case OBJECT_EGG_NEST_FILLED:
                return false;
            case OBJECT_BEANSTALK_TIP:
            case OBJECT_BEANSTALK_MID:
            case OBJECT_BEANSTALK_BASE:
            case OBJECT_PLANK:
            case OBJECT_EGG_NEST_EMPTY:
                return true;
            default:
                return true;
        }
    }

    /**
     * 对应 `H()` 中 `bk` 的移动完成结算。
     * C8 High Grass 在割草后恢复隐藏目标 object；objective 已在初始扫描时计数，
     * 因此此处不会再次增加 remainingObjectives。
     */
    void finishMowing(int x, int y) {
        if (!mowCurrentTileOnFinish) {
            return;
        }
        mowCurrentTileOnFinish = false;

        if ((terrainGrid[y][x] & 0xFF) == TERRAIN_HIGH_GRASS_OBJECTIVE) {
            objectGrid[y][x] = (byte)(carrotObjective ? OBJECT_CARROT : OBJECT_EGG_NEST_EMPTY);
        }

        terrainGrid[y][x] = (byte)MOWED_GROUND[randomIndex(4)];
    }

    /**
     * `M()` 在 mower + Speed movement 成功进入 ED 后立即删除 ED，并设 8-step camera shake。
     */
    void smashCrumblyRock(int x, int y) {
        if (!ridingMower || (objectGrid[y][x] & 0xFF) != OBJECT_CRUMBLY_ROCK) {
            return;
        }
        objectGrid[y][x] = (byte)OBJECT_EMPTY;
        startCameraShake(8);
    }

    private int randomIndex(int bound) {
        throw new UnsupportedOperationException("original Random.nextInt wrapper");
    }

    private void startCameraShake(int steps) {}

    static final class PlayerPosition {
        int gridX;
        int pixelX;
    }
}
