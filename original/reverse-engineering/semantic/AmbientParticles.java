// 研究性语义重建：来源为 UP9 a.class / a.ae()、a.T()、a.U() 与 gameplay renderer。
// 本文件只表达原版 Presentation 随机状态，不作为可直接编译的产品源码。

public final class AmbientParticles {
    private static final int TERRAIN_SNOW = 0x4D;
    private static final int SNOW_PARTICLE_COUNT = 5;
    private static final int FIXED_POINT_SHIFT = 4;

    private byte[][] terrainGrid;

    /** 对应 `cW`：level scan 只要遇到任意 0x4D Snow 就置 true。 */
    private boolean snowWeather;

    /** 对应 `cg/ch`，使用 4-bit fixed-point。 */
    private int[] snowX = new int[SNOW_PARTICLE_COUNT];
    private int[] snowY = new int[SNOW_PARTICLE_COUNT];

    /** 对应 `cf`：上一 gameplay step 的 camera world Y。 */
    private int previousCameraY;

    /** Butterfly: `bw/bx` fixed-point，`by/bz` 为随机 viewport target。 */
    private int butterflyX;
    private int butterflyY;
    private int butterflyTargetX;
    private int butterflyTargetY;

    /** 对应 `bA/bB`：0..8..0 ping-pong，再通过 `/3` 映射到 bf.png 三帧。 */
    private int butterflyPhase;
    private boolean butterflyPhaseIncreasing;

    void scanLevelForWeather() {
        snowWeather = false;
        for (byte[] row : terrainGrid) {
            for (byte raw : row) {
                if ((raw & 0xFF) == TERRAIN_SNOW) {
                    snowWeather = true;
                    return;
                }
            }
        }
    }

    /**
     * 对应 `a.T()`。雪花固定 5 粒。
     *
     * 原版根据当前 cameraY 与上一 step 的 cameraY 调整雪花 world-relative 下落：
     * - camera 向上：vertical delta = 24 fixed units；
     * - camera Y 不变：48；
     * - camera 向下：72。
     *
     * 横向每 step 追加 random(3)-1，即 -1/0/+1 pixel 的 fixed-point 增量。
     * 超过屏幕底部后从随机 X、屏幕上方 0..9px 重新生成。
     */
    void tickSnow(int cameraY, int screenWidth, int screenHeight, RandomSource random) {
        if (!snowWeather) {
            return;
        }

        int verticalDelta = 48;
        if (previousCameraY < cameraY) {
            verticalDelta = 24;
        } else if (previousCameraY > cameraY) {
            verticalDelta = 72;
        }

        for (int i = 0; i < SNOW_PARTICLE_COUNT; i++) {
            if ((snowY[i] >> FIXED_POINT_SHIFT) > screenHeight) {
                snowX[i] = random.nextInt(screenWidth) << FIXED_POINT_SHIFT;
                snowY[i] = -(random.nextInt(10) << FIXED_POINT_SHIFT);
            }
            snowX[i] += (random.nextInt(3) - 1) << FIXED_POINT_SHIFT;
            snowY[i] += verticalDelta;
        }

        previousCameraY = cameraY;
    }

    /**
     * 对应 `a.U()`。没有 Snow weather 时原版始终更新单只 Butterfly。
     *
     * Butterfly 在 viewport 范围内选择随机 target；到达当前 target 后重新选择。
     * 每 step X 使用 random(48) 的 fixed-point 小步、Y 使用 random(24)，
     * 根据当前位置在 target 两侧决定正负方向。
     */
    void tickButterfly(int viewportWidth, int viewportHeight, RandomSource random) {
        if (snowWeather) {
            return;
        }

        if (butterflyPhaseIncreasing) {
            butterflyPhase++;
            if (butterflyPhase >= 8) {
                butterflyPhase = 8;
                butterflyPhaseIncreasing = false;
            }
        } else {
            butterflyPhase--;
            if (butterflyPhase <= 0) {
                butterflyPhase = 0;
                butterflyPhaseIncreasing = true;
            }
        }

        int x = butterflyX >> FIXED_POINT_SHIFT;
        int y = butterflyY >> FIXED_POINT_SHIFT;

        if (x == butterflyTargetX) {
            butterflyTargetX = random.nextInt(viewportWidth + 1 - 24);
        }
        if (y == butterflyTargetY) {
            butterflyTargetY = random.nextInt(viewportHeight + 1 - 24);
        }

        int dx = random.nextInt(48);
        if (x >= butterflyTargetX) {
            dx = -dx;
        }
        butterflyX += dx;

        int dy = random.nextInt(24);
        if (y >= butterflyTargetY) {
            dy = -dy;
        }
        butterflyY += dy;
    }

    /** renderer 使用 `butterflyPhase / 3`，因此得到 frame 0/1/2。 */
    int butterflyFrame() {
        return butterflyPhase / 3;
    }

    interface RandomSource {
        int nextInt(int bound);
    }
}
