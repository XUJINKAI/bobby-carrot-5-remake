// 研究性语义重建：来源为 UP9 a.class / a.J() 与 a.a(byte)。
// raw ID 由 docs/system/original/mechanics.md 的 atlas 坐标交叉确认。

public final class ColorSwitch {
    private static final int YELLOW_SWITCH_A = 0xBF;
    private static final int YELLOW_SWITCH_B = 0xC0;
    private static final int PINK_SWITCH_A = 0xC1;
    private static final int PINK_SWITCH_B = 0xC2;

    private static final int YELLOW_BLOCK_RAISED = 0xC3;
    private static final int YELLOW_BLOCK_LOWERED = 0xC4;
    private static final int PINK_BLOCK_RAISED = 0xC5;
    private static final int PINK_BLOCK_LOWERED = 0xC6;

    private byte[][] terrainGrid;

    /**
     * 对应原版 `a.a(byte)`。
     * Bobby 到达任意黄色/粉色 Switch 后，原版扫描整张 terrain grid，
     * 同时翻转该颜色的全部 Switch 与全部 Block。
     */
    void toggleForSteppedSwitch(int rawSwitch) {
        switch (rawSwitch & 0xFF) {
            case YELLOW_SWITCH_A:
            case YELLOW_SWITCH_B:
                toggleGlobalPairs(
                        YELLOW_SWITCH_A,
                        YELLOW_SWITCH_B,
                        YELLOW_BLOCK_RAISED,
                        YELLOW_BLOCK_LOWERED);
                return;

            case PINK_SWITCH_A:
            case PINK_SWITCH_B:
                toggleGlobalPairs(
                        PINK_SWITCH_A,
                        PINK_SWITCH_B,
                        PINK_BLOCK_RAISED,
                        PINK_BLOCK_LOWERED);
                return;

            default:
                return;
        }
    }

    private void toggleGlobalPairs(int switchA, int switchB, int blockA, int blockB) {
        for (int y = 0; y < terrainGrid.length; y++) {
            for (int x = 0; x < terrainGrid[y].length; x++) {
                int tile = terrainGrid[y][x] & 0xFF;
                if (tile == switchA) {
                    terrainGrid[y][x] = (byte)switchB;
                } else if (tile == switchB) {
                    terrainGrid[y][x] = (byte)switchA;
                } else if (tile == blockA) {
                    terrainGrid[y][x] = (byte)blockB;
                } else if (tile == blockB) {
                    terrainGrid[y][x] = (byte)blockA;
                }
            }
        }
    }
}
