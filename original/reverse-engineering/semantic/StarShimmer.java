// 研究性语义重建：来源为 UP9 a.class / level initialization、a.V() 与 c(Graphics,... )。
// 本文件表达 gameplay 星空 shimmer 的原版 Presentation 状态。

public final class StarShimmer {
    private static final int ALLOCATED_SLOT_COUNT = 5;
    private static final int GAMEPLAY_UPDATED_SLOT_COUNT = 3;
    private static final int FRAME_COUNT = 8;
    private static final int SKY_MIN = 0x47;
    private static final int SKY_MAX = 0x4C;
    private static final int OBJECT_EMPTY = 0xFF;

    /** 对应 ac/ad/ae。 */
    private short[] worldX = new short[ALLOCATED_SLOT_COUNT];
    private short[] worldY = new short[ALLOCATED_SLOT_COUNT];
    private byte[] phase = new byte[ALLOCATED_SLOT_COUNT];

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    /** 对应 bG：V() 的环境节拍分频器，0..3。 */
    private int ambientDivider;

    /**
     * Gameplay level setup 对全部 5 个 slot 设随机负延迟：`-random(8)-1`。
     * V() 实际只更新前 3 个，因此 gameplay 中后两个一直保持 inactive。
     */
    void initialize(RandomSource random) {
        for (int i = 0; i < ALLOCATED_SLOT_COUNT; i++) {
            phase[i] = (byte)(-random.nextInt(8) - 1);
        }
    }

    /**
     * 对应 `a.V()`。只有 ambientDivider==0 时推进，因此每 4 gameplay step 更新一次。
     *
     * 每个 active gameplay slot：
     * - phase 从负延迟逐步增长；
     * - 0..7 显示 8 帧 shimmer；
     * - phase 到 8 后重新随机选择当前 camera viewport 中的一个 world point；
     * - 候选格必须 object 为空且 terrain 为 0x47..0x4C 星空；
     * - 候选无效时 phase 退回 -1，下一次环境节拍再次尝试。
     */
    void tick(
        int cameraX,
        int cameraY,
        int viewportWidth,
        int viewportHeight,
        int tileWidth,
        int tileHeight,
        RandomSource random
    ) {
        if (ambientDivider == 0) {
            for (int i = 0; i < GAMEPLAY_UPDATED_SLOT_COUNT; i++) {
                int next = (byte)(phase[i] + 1);

                if (next == 0 || next >= FRAME_COUNT) {
                    int candidateX = random.nextInt(viewportWidth) + cameraX;
                    int candidateY = random.nextInt(viewportHeight) + cameraY;
                    int tileX = candidateX / tileWidth;
                    int tileY = candidateY / tileHeight;

                    boolean valid = objectAt(tileX, tileY) == OBJECT_EMPTY;
                    if (valid) {
                        int terrain = terrainAt(tileX, tileY);
                        valid = terrain >= SKY_MIN && terrain <= SKY_MAX;
                    }

                    if (valid) {
                        worldX[i] = (short)candidateX;
                        worldY[i] = (short)candidateY;
                    } else {
                        next = -1;
                    }
                }

                phase[i] = (byte)next;
            }
        }

        ambientDivider++;
        if (ambientDivider >= 4) {
            ambientDivider = 0;
        }
    }

    /**
     * renderer 对所有 5 个 slot 扫描，但只画 phase>=0 的项。
     * phase 0..7 直接映射为 8 个 16x16 sprite frame，绘制中心为 worldX/worldY。
     */
    boolean visible(int slot) {
        return phase[slot] >= 0;
    }

    int frame(int slot) {
        return phase[slot] & 0xFF;
    }

    private int terrainAt(int x, int y) {
        if (y < 0 || y >= terrainGrid.length || x < 0 || x >= terrainGrid[y].length) {
            return -1;
        }
        return terrainGrid[y][x] & 0xFF;
    }

    private int objectAt(int x, int y) {
        if (y < 0 || y >= objectGrid.length || x < 0 || x >= objectGrid[y].length) {
            return -1;
        }
        return objectGrid[y][x] & 0xFF;
    }

    interface RandomSource {
        int nextInt(int bound);
    }
}
