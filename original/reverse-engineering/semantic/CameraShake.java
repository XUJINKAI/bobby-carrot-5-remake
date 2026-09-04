// 研究性语义重建：来源为 UP9 a.class / G() 与 Speed/Mower impact 写点。

public final class CameraShake {
    private static final int TILE_SIZE = 48;

    /** 原版 aO；Speed/Mower impact 设为 8。 */
    private int stepsRemaining;

    private int cameraPixelX;
    private int cameraPixelY;
    private int maxCameraX;
    private int maxCameraY;

    void startImpactShake() {
        stepsRemaining = 8;
    }

    /**
     * 对应 `G()`：先递减 aO，再按剩余量线性缩小随机窗口。
     */
    void gameplayStep() {
        if (stepsRemaining <= 0) return;

        stepsRemaining--;
        int span = TILE_SIZE * stepsRemaining / 8;

        // 原版 `b(span + 1)` 得到 0..span，再减 span/2；X/Y 独立采样。
        cameraPixelX += randomInt(span + 1) - (span >> 1);
        cameraPixelY += randomInt(span + 1) - (span >> 1);

        cameraPixelX = clamp(cameraPixelX, 0, maxCameraX);
        cameraPixelY = clamp(cameraPixelY, 0, maxCameraY);

        invalidateVisibleTileCacheForCamera();
    }

    /**
     * aO=8 的第一次 G() 会先变 7，所以实际随机 span 序列为：
     * 42, 36, 30, 24, 18, 12, 6, 0 px。
     * 稳态总生命周期 8 gameplay step ≈ 248ms。
     */
    int currentStepsRemaining() {
        return stepsRemaining;
    }

    private int randomInt(int bound) {
        throw new UnsupportedOperationException("original random helper");
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private void invalidateVisibleTileCacheForCamera() {}
}
