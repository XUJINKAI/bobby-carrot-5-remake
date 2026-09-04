// 研究性语义重建：来源为 UP9 a.class / a.P()。
// 重点恢复 Cloud / Leaf 共用的 runtime moving entity 模型。

public final class MovingEntities {
    private static final int STOPPED = 4;
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    private static final int NORMAL_PIXELS_PER_TICK = 3;
    private static final int FAST_PIXELS_PER_TICK = 6;
    private static final int TILE_SIZE = 48;

    private static final int CLOUD_RED = 0xE0;
    private static final int CLOUD_PURPLE = 0xE1;
    private static final int CLOUD_GREEN = 0xE2;
    private static final int LEAF = 0xEC;

    private int movingEntityCount;
    private byte[] type;
    private byte[] direction;
    private byte[] pixelsRemaining;
    private short[] pixelX;
    private short[] pixelY;
    private boolean[] fastMotion;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    private int mountedEntityIndex = -1;
    private int playerPixelX;
    private int playerPixelY;
    private int playerGridX;
    private int playerGridY;

    /**
     * 对应原版 `a.P()` 已经确认的公共运动主干。
     *
     * 实体移动中，Bobby 若挂载在该实体上，会应用完全相同的 dx/dy；随后
     * Bobby 的 grid 坐标由 pixel 坐标除以 tile size 反算。
     */
    void tick() {
        for (int index = 0; index < movingEntityCount; index++) {
            if ((pixelsRemaining[index] & 0xFF) > 0) {
                advanceCurrentTile(index);
            }

            if ((pixelsRemaining[index] & 0xFF) == 0) {
                chooseNextTile(index);
            }
        }
    }

    private void advanceCurrentTile(int index) {
        int pixels = fastMotion[index] ? FAST_PIXELS_PER_TICK : NORMAL_PIXELS_PER_TICK;
        int dx = 0;
        int dy = 0;

        switch (direction[index]) {
            case LEFT:
                dx = -pixels;
                break;
            case RIGHT:
                dx = pixels;
                break;
            case UP:
                dy = -pixels;
                break;
            case DOWN:
                dy = pixels;
                break;
            default:
                return;
        }

        pixelX[index] = (short)(pixelX[index] + dx);
        pixelY[index] = (short)(pixelY[index] + dy);

        if (mountedEntityIndex == index) {
            playerPixelX += dx;
            playerPixelY += dy;
            playerGridX = playerPixelX / TILE_SIZE;
            playerGridY = playerPixelY / TILE_SIZE;
        }

        pixelsRemaining[index] = (byte)((pixelsRemaining[index] & 0xFF) - pixels);
    }

    /**
     * 原版 `a.P()` 在跨完一格后统一决定下一格。
     *
     * 已确认规则：
     * - Leaf 会读取 Tide / Water Fall terrain 改变方向；
     * - Cloud 会响应四向 Windmill 的三格作用范围；
     * - 不能继续前进时 direction 变为 4（停止）；
     * - 下一格启动时 pixelsRemaining 设为 48；
     * - 特定水流路径会把 fastMotion 置 true，从而使用 6px/tick。
     *
     * 具体分支正在从原版方法继续拆出，暂不在这里把未完成条件伪装成确定实现。
     */
    private void chooseNextTile(int index) {
        throw new UnsupportedOperationException("moving entity routing reconstruction in progress");
    }

    private boolean isCloud(int rawType) {
        return rawType == CLOUD_RED || rawType == CLOUD_PURPLE || rawType == CLOUD_GREEN;
    }

    private boolean isLeaf(int rawType) {
        return rawType == LEAF;
    }
}
