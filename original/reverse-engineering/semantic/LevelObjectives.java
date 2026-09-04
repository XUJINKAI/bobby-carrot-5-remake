// 研究性语义重建：来源为 UP9 a.class / a.ae()、a.J()、a.H()。

public final class LevelObjectives {
    private static final int TERRAIN_EXIT = 0x96;
    private static final int TERRAIN_HIGH_GRASS_OBJECTIVE = 0xC8;

    private static final int OBJECT_CONSUMED_CARROT = 0xC9;
    private static final int OBJECT_CARROT = 0xCA;
    private static final int OBJECT_EGG_NEST_EMPTY = 0xCB;
    private static final int OBJECT_EGG_NEST_FILLED = 0xCC;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    /** 对应原版 `cC`。 */
    private int remainingObjectiveCount;

    /**
     * 对应原版 `cU`。
     * 原版关卡数据假定普通目标类型一致；CA 会置 true，CB 会置 false。
     * C8 隐藏目标被 mower 揭开时用该值决定恢复 CA 还是 CB。
     */
    private boolean carrotObjective;

    /** 对应 `ae()` 的 level initialization 扫描。 */
    void initialize() {
        remainingObjectiveCount = 0;

        for (int y = 0; y < terrainGrid.length; y++) {
            for (int x = 0; x < terrainGrid[y].length; x++) {
                int terrain = terrainGrid[y][x] & 0xFF;
                int object = objectGrid[y][x] & 0xFF;

                if (terrain == TERRAIN_HIGH_GRASS_OBJECTIVE) {
                    remainingObjectiveCount++;
                }

                if (object == OBJECT_CARROT) {
                    carrotObjective = true;
                    remainingObjectiveCount++;
                } else if (object == OBJECT_EGG_NEST_EMPTY) {
                    carrotObjective = false;
                    remainingObjectiveCount++;
                }
            }
        }
    }

    /** 原版 Carrot 在 midpoint interaction 立即消耗计数，并留下 C9 consumed sprite。 */
    void collectCarrot(int x, int y) {
        if ((objectGrid[y][x] & 0xFF) != OBJECT_CARROT) {
            return;
        }
        remainingObjectiveCount--;
        objectGrid[y][x] = (byte)OBJECT_CONSUMED_CARROT;
    }

    /**
     * Empty Egg Nest 的完成是 leave-trigger：进入时只登记坐标，下一次移动跨中点时
     * 才把 CB 改为 CC 并减少 remainingObjectiveCount。
     */
    void fillEggNestOnLeave(int x, int y) {
        if ((objectGrid[y][x] & 0xFF) != OBJECT_EGG_NEST_EMPTY) {
            return;
        }
        remainingObjectiveCount--;
        objectGrid[y][x] = (byte)OBJECT_EGG_NEST_FILLED;
    }

    /** C8 已在 initialize() 中计入目标，所以割草恢复隐藏 object 时不再加计数。 */
    void revealHighGrassObjective(int x, int y) {
        if ((terrainGrid[y][x] & 0xFF) != TERRAIN_HIGH_GRASS_OBJECTIVE) {
            return;
        }
        objectGrid[y][x] = (byte)(carrotObjective ? OBJECT_CARROT : OBJECT_EGG_NEST_EMPTY);
    }

    boolean canCompleteAt(int x, int y) {
        return remainingObjectiveCount == 0
                && (terrainGrid[y][x] & 0xFF) == TERRAIN_EXIT;
    }
}
