// 研究性语义重建：来源为 UP9 a.class / a.F()、gameplay b() 与 HUD renderer。
// 本文件记录 Coin Radar 的原版随机扫描模型，不作为可直接编译的产品源码。

public final class CoinRadar {
    private static final int BONUS_COIN = 0xF8;
    private static final int HIGH_GRASS = 0xC7;
    private static final int HIGH_GRASS_OBJECTIVE = 0xC8;
    private static final int INDICATOR_STEPS = 32;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    /** 对应原版 `E`。 */
    private boolean enabled;

    /** 对应当前 camera top-left `bI/bJ`。 */
    private int cameraPixelX;
    private int cameraPixelY;

    /** 对应 viewport `dy/dz`。 */
    private int viewportWidthPx;
    private int viewportHeightPx;

    /** 对应 `bq/br/bp`。 */
    private int indicatorPixelX = -1;
    private int indicatorPixelY;
    private int indicatorStepsRemaining;

    /**
     * gameplay 顶层只有 enabled 时才调用该 update；否则每步把 indicatorPixelX 清回 -1。
     *
     * 重要：原版不是全地图或全视口遍历。没有 active indicator 时，每次 gameplay step
     * 只随机抽当前相机视口内的一个像素位置，再换算成 tile。
     */
    void gameplayStep() {
        if (!enabled) {
            indicatorPixelX = -1;
            return;
        }

        if (indicatorPixelX != -1) {
            indicatorStepsRemaining--;
            if (indicatorStepsRemaining <= 0) {
                indicatorPixelX = -1;
            }
            return;
        }

        int tileX = (cameraPixelX + randomInt(viewportWidthPx)) / 48;
        int tileY = (cameraPixelY + randomInt(viewportHeightPx)) / 48;

        if (tileY < 0 || tileY >= objectGrid.length || tileX < 0 || tileX >= objectGrid[tileY].length) {
            return;
        }

        if ((objectGrid[tileY][tileX] & 0xFF) != BONUS_COIN) {
            return;
        }

        int terrain = terrainGrid[tileY][tileX] & 0xFF;
        if (terrain != HIGH_GRASS && terrain != HIGH_GRASS_OBJECTIVE) {
            return;
        }

        indicatorPixelX = tileX * 48;
        indicatorPixelY = tileY * 48;
        indicatorStepsRemaining = INDICATOR_STEPS;
    }

    /**
     * Renderer 只在 indicator active 且 `bp % 8 >= 4` 时画提示图，所以 32-step 生命周期内
     * 是 4 step on / 4 step off 的闪烁节奏。约 31ms/gameplay step 时，一次 active window
     * 总长约 992ms，闪烁半周期约 124ms。
     */
    boolean indicatorVisibleThisStep() {
        return indicatorPixelX != -1 && indicatorStepsRemaining % 8 >= 4;
    }

    private int randomInt(int bound) {
        throw new UnsupportedOperationException("original Random.nextInt wrapper");
    }
}
