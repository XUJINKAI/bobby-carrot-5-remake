// 研究性语义重建：来源为 UP9 a.class / a.Q()。
// Mirror raw ID 由 ts(12,2..5) 与原版分支 0xB1..0xB4 交叉确认；
// Ice Block raw ID 0xE3 由 ts(15,4) 与原版 object 分支交叉确认。

public final class DragonFireball {
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    private static final int PIXELS_PER_TICK = 6;
    private static final int TILE_SIZE = 48;
    private static final int TICKS_PER_TILE = TILE_SIZE / PIXELS_PER_TICK;

    private static final int MIRROR_RIGHT_DOWN = 0xB1;
    private static final int MIRROR_LEFT_DOWN = 0xB2;
    private static final int MIRROR_RIGHT_UP = 0xB3;
    private static final int MIRROR_LEFT_UP = 0xB4;
    private static final int ICE_BLOCK = 0xE3;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    private int pixelX;
    private int pixelY;
    private int direction;
    private int pendingDirection = -1;
    private int ticksUntilTileBoundary = TICKS_PER_TILE;
    private boolean active;

    /**
     * 对应原版 `a.Q()` 的火球主干。
     * 火球固定 6px/tick，因此 48px 一格需要 8 tick。
     */
    void tick() {
        if (!active) {
            return;
        }

        // 原版在接近格边界时检查将要进入的 terrain/object，并提前决定镜面转向。
        if (ticksUntilTileBoundary == 3 && !resolveUpcomingTile()) {
            active = false;
            return;
        }

        if (ticksUntilTileBoundary == 0) {
            ticksUntilTileBoundary = TICKS_PER_TILE;
            if (pendingDirection != -1) {
                direction = pendingDirection;
                pendingDirection = -1;
            }
        }

        ticksUntilTileBoundary--;
        switch (direction) {
            case LEFT:
                pixelX -= PIXELS_PER_TICK;
                break;
            case RIGHT:
                pixelX += PIXELS_PER_TICK;
                break;
            case UP:
                pixelY -= PIXELS_PER_TICK;
                break;
            case DOWN:
                pixelY += PIXELS_PER_TICK;
                break;
            default:
                active = false;
                break;
        }
    }

    /**
     * 原版先检查地图边界、可穿 terrain 与 blocking object，然后处理 Mirror / Ice。
     * 这里保留已确认的 Mirror 转向真值；其它 blocking 集合继续从同一原版方法拆解。
     */
    private boolean resolveUpcomingTile() {
        int tileX = pixelX / TILE_SIZE;
        int tileY = pixelY / TILE_SIZE;
        if (tileX < 0 || tileY < 0 || tileY >= terrainGrid.length || tileX >= terrainGrid[0].length) {
            return false;
        }

        int terrain = terrainGrid[tileY][tileX] & 0xFF;
        int object = objectGrid[tileY][tileX] & 0xFF;

        if (object == ICE_BLOCK) {
            startIceMelting(tileX, tileY);
        }

        switch (terrain) {
            case MIRROR_RIGHT_DOWN:
                if (direction == LEFT) {
                    pendingDirection = DOWN;
                    return true;
                }
                if (direction == UP) {
                    pendingDirection = RIGHT;
                    return true;
                }
                return false;

            case MIRROR_LEFT_DOWN:
                if (direction == RIGHT) {
                    pendingDirection = DOWN;
                    return true;
                }
                if (direction == UP) {
                    pendingDirection = LEFT;
                    return true;
                }
                return false;

            case MIRROR_RIGHT_UP:
                if (direction == LEFT) {
                    pendingDirection = UP;
                    return true;
                }
                if (direction == DOWN) {
                    pendingDirection = RIGHT;
                    return true;
                }
                return false;

            case MIRROR_LEFT_UP:
                if (direction == RIGHT) {
                    pendingDirection = UP;
                    return true;
                }
                if (direction == DOWN) {
                    pendingDirection = LEFT;
                    return true;
                }
                return false;

            default:
                return isFireballPassable(tileX, tileY, terrain, object);
        }
    }

    private boolean isFireballPassable(int x, int y, int terrain, int object) {
        throw new UnsupportedOperationException("fireball collision set reconstruction in progress");
    }

    private void startIceMelting(int x, int y) {
        // 原版 `Q()` 调用 `b((byte)x,(byte)y)`；该任务的分帧状态机继续恢复。
    }
}
