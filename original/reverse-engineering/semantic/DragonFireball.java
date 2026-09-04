// 研究性语义重建：来源为 UP9 a.class / a.Q() 与 gameplay renderer。
// 本文件用于表达已经确认的原版控制流，不作为可直接编译的产品源码。

public final class DragonFireball {
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    private static final int PIXELS_PER_STEP = 6;
    private static final int TILE_SIZE = 48;
    private static final int STEPS_PER_TILE = TILE_SIZE / PIXELS_PER_STEP;

    private static final int TERRAIN_SKY_MIN = 0x47;
    private static final int TERRAIN_SKY_MAX = 0x4C;
    private static final int TERRAIN_WATER_MIN = 0x55;
    private static final int TERRAIN_WATER_MAX = 0x5D;
    private static final int TERRAIN_GROUND_MIN = 0x5E;
    private static final int TERRAIN_GROUND_MAX = 0xC8;

    private static final int MIRROR_RIGHT_DOWN = 0xB1;
    private static final int MIRROR_LEFT_DOWN = 0xB2;
    private static final int MIRROR_RIGHT_UP = 0xB3;
    private static final int MIRROR_LEFT_UP = 0xB4;
    private static final int YELLOW_BLOCK_RAISED = 0xC3;
    private static final int PINK_BLOCK_RAISED = 0xC5;

    private static final int DRAGON_HEAD = 0xD7;
    private static final int DRAGON_BODY = 0xD8;
    private static final int ICE_BLOCK = 0xE3;
    private static final int CRUMBLY_ROCK = 0xED;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    private int pixelX;
    private int pixelY;
    private int direction;
    private int pendingDirection = -1;
    private int stepsUntilTileBoundary = STEPS_PER_TILE;
    private boolean active;

    /** 原版 `bv=0..7`；renderer 0..3 使用 hud 第一火球帧，4..7 使用第二帧。 */
    private int presentationPhase;

    /** 原版共享 `aT`，Fireball 每次 Q() 都刷新为 16。 */
    private int cameraFocusStepsRemaining;

    /**
     * 对应原版 `a.Q()`。
     * 火球固定 6px/gameplay-step，因此 48px 一格需要 8 次 Q() 更新。
     */
    void gameplayStep() {
        if (!active) return;

        presentationPhase = (presentationPhase + 1) % 8;

        // Fireball 存活期间每 step 都刷新 camera focus，并把 target 更新到火球当前像素。
        // 因而 Bobby 普通移动输入持续被共享 camera/input lock 挡住。
        cameraFocusStepsRemaining = 16;
        focusCameraAt(pixelX, pixelY);

        // 原版在当前 8-step tile phase 剩 3 时检查格内容；Mirror 转向先写入
        // pendingDirection，到 phase 重置时才成为实际 direction。
        if (stepsUntilTileBoundary == 3 && !resolveCurrentTileCollision()) {
            active = false;
            return;
        }

        if (stepsUntilTileBoundary == 0) {
            stepsUntilTileBoundary = STEPS_PER_TILE;
            if (pendingDirection != -1) {
                direction = pendingDirection;
                pendingDirection = -1;
            }
        }

        stepsUntilTileBoundary--;
        switch (direction) {
            case LEFT:
                pixelX -= PIXELS_PER_STEP;
                return;
            case RIGHT:
                pixelX += PIXELS_PER_STEP;
                return;
            case UP:
                pixelY -= PIXELS_PER_STEP;
                return;
            case DOWN:
                pixelY += PIXELS_PER_STEP;
                return;
            default:
                active = false;
        }
    }

    /**
     * 火球视觉不是按 ms 单独计时：每 4 gameplay-step 换一帧。
     * 稳态约 31ms/step，因此单帧约 124ms，完整两帧循环约 248ms。
     */
    int hudFireballFrame() {
        return presentationPhase < 4 ? 0 : 1;
    }

    /**
     * `Q()` 的碰撞优先级：
     * 1. 地图边界；
     * 2. terrain 是否属于三个允许传播的 raw 区间；
     * 3. Raised Color Block；
     * 4. 少数明确阻挡 object / Ice melting；
     * 5. Mirror 入射真值表。
     *
     * 原版没有在这里检测 Bobby 像素框，因此当前已恢复代码中“火球碰 Bobby”
     * 不是 death cause。若其它方法存在额外检测，需要另行补证据。
     */
    private boolean resolveCurrentTileCollision() {
        int tileX = pixelX / TILE_SIZE;
        int tileY = pixelY / TILE_SIZE;
        if (tileX < 0 || tileY < 0 || tileY >= terrainGrid.length || tileX >= terrainGrid[0].length) {
            return false;
        }

        int terrain = terrainGrid[tileY][tileX] & 0xFF;
        int object = objectGrid[tileY][tileX] & 0xFF;

        if (!isFireballTerrainBasePassable(terrain)) return false;
        if (terrain == YELLOW_BLOCK_RAISED || terrain == PINK_BLOCK_RAISED) return false;

        switch (object) {
            case DRAGON_HEAD:
            case DRAGON_BODY:
            case CRUMBLY_ROCK:
                return false;
            case ICE_BLOCK:
                // 命中 Ice 只启动融化，不让火球消失。
                startIceMelting(tileX, tileY);
                break;
            default:
                break;
        }

        switch (terrain) {
            case MIRROR_RIGHT_DOWN:
                if (direction == LEFT) { pendingDirection = DOWN; return true; }
                if (direction == UP) { pendingDirection = RIGHT; return true; }
                return false;
            case MIRROR_LEFT_DOWN:
                if (direction == RIGHT) { pendingDirection = DOWN; return true; }
                if (direction == UP) { pendingDirection = LEFT; return true; }
                return false;
            case MIRROR_RIGHT_UP:
                if (direction == LEFT) { pendingDirection = UP; return true; }
                if (direction == DOWN) { pendingDirection = RIGHT; return true; }
                return false;
            case MIRROR_LEFT_UP:
                if (direction == RIGHT) { pendingDirection = UP; return true; }
                if (direction == DOWN) { pendingDirection = LEFT; return true; }
                return false;
            default:
                return true;
        }
    }

    private boolean isFireballTerrainBasePassable(int terrain) {
        return (terrain >= TERRAIN_SKY_MIN && terrain <= TERRAIN_SKY_MAX)
            || (terrain >= TERRAIN_WATER_MIN && terrain <= TERRAIN_WATER_MAX)
            || (terrain >= TERRAIN_GROUND_MIN && terrain <= TERRAIN_GROUND_MAX);
    }

    private void startIceMelting(int x, int y) {
        // 立即 E3→E4，并加入最多 5 个任务；后续见 IceMelting.java。
    }

    private void focusCameraAt(int x, int y) {}
}
