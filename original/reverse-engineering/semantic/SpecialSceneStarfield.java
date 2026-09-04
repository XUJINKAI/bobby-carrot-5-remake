// 研究性语义重建：来源为 UP9 a.class / n()、o() 及 Title、Magic Code、Flight 入口。
// 本文件与 gameplay StarShimmer 分开：两者复用字段，但初始化和活跃 slot 数不同。

public final class SpecialSceneStarfield {
    private static final int STAR_COUNT = 5;
    private static final int STAR_FRAME_COUNT = 8;
    private static final int SCROLL_PIXELS_PER_STEP = 3;
    private static final int AMBIENT_DIVIDER = 4;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;
    private byte[] starPhase = new byte[STAR_COUNT];
    private short[] starScreenX = new short[STAR_COUNT];
    private short[] starScreenY = new short[STAR_COUNT];

    private int cameraX;
    private int cameraWrapX;
    private int phaseDivider;

    /**
     * Title (state 4)、Magic Code (state 13) 与 Flight reward (state 14)
     * 都调用同一个 n() 初始化器。
     *
     * 地图宽度为 visibleColumns * 3，高度为 visibleRows。
     * 最终三段横向 panel 是 A / B / A，保证滚动 wrap 时首尾一致。
     */
    void initialize(
            int viewportWidth,
            int viewportHeight,
            int tileWidth,
            int tileHeight,
            RandomSource random) {
        int visibleColumns = viewportWidth / tileWidth + 1;
        int visibleRows = viewportHeight / tileHeight + 1;
        terrainGrid = new byte[visibleRows][visibleColumns * 3];
        objectGrid = new byte[visibleRows][visibleColumns * 3];

        for (int y = 0; y < visibleRows; y++) {
            for (int x = 0; x < visibleColumns * 2; x++) {
                int roll = random.nextInt(10);
                int terrain = roll == 9 ? 0x47 : roll >= 7 ? 0x48 : 0x49;
                terrainGrid[y][x] = (byte)terrain;
                objectGrid[y][x] = (byte)0xFF;
                terrainGrid[y][x + visibleColumns] = (byte)terrain;
                objectGrid[y][x + visibleColumns] = (byte)0xFF;
            }
            for (int x = 0; x < visibleColumns; x++) {
                terrainGrid[y][x + visibleColumns * 2] = terrainGrid[y][x];
                objectGrid[y][x + visibleColumns * 2] = objectGrid[y][x];
            }
        }

        cameraX = 0;
        cameraWrapX = visibleColumns * 2 * tileWidth - 1;
        for (int i = 0; i < STAR_COUNT; i++) {
            starPhase[i] = (byte)random.nextInt(STAR_FRAME_COUNT);
            starScreenX[i] = (short)(tileWidth + random.nextInt(viewportWidth));
            starScreenY[i] = -16;
        }
    }

    /**
     * o() 每个对应 runtime state step 调用：
     * - camera 水平 +3px，到两 panel 边界后按 tile 余数 wrap；
     * - 全部 5 颗星每拍向左 3px；
     * - phase 只在共享 bG==0 时推进，即每 4 step 一帧；
     * - phase 到 8 或 x<=-16 时从右侧重生，y 随机落在 viewport 内。
     */
    void step(
            int viewportWidth,
            int viewportHeight,
            int tileWidth,
            RandomSource random) {
        cameraX += SCROLL_PIXELS_PER_STEP;
        if (cameraX > cameraWrapX) {
            cameraX -= cameraX / tileWidth * tileWidth;
        }

        for (int i = 0; i < STAR_COUNT; i++) {
            int nextPhase = starPhase[i];
            if (phaseDivider == 0) {
                nextPhase++;
            }

            int nextX = starScreenX[i] - SCROLL_PIXELS_PER_STEP;
            if (nextPhase >= STAR_FRAME_COUNT || nextX <= -16) {
                nextPhase = 0;
                nextX = tileWidth + random.nextInt(viewportWidth);
                starScreenY[i] = (short)random.nextInt(viewportHeight);
            }

            starPhase[i] = (byte)nextPhase;
            starScreenX[i] = (short)nextX;
        }

        phaseDivider = (phaseDivider + 1) % AMBIENT_DIVIDER;
    }

    /**
     * 与 StarShimmer 的边界：
     * - gameplay setup：5 slot 分配、只更新前 3 个，位置必须落在可见 Sky 空格；
     * - special scene n()/o()：5 slot 全部更新，按 screen-space 从右向左飞过。
     */
    int activeSlotCount() {
        return STAR_COUNT;
    }

    interface RandomSource {
        int nextInt(int bound);
    }
}
