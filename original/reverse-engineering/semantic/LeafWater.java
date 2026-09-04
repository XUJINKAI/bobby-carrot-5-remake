// 研究性语义重建：来源为 UP9 a.class / a.H()、a.P() 与
// a.a(int gridX, int gridY, int direction, byte entityType) 的 javap 字节码。

public final class LeafWater {
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;
    private static final int STOPPED = 4;

    private static final int LEAF = 0xEC;

    private static final int WATER = 0x55;
    private static final int WATER_ANIMATED = 0x56;
    private static final int TIDE_DOWN = 0x57;
    private static final int TIDE_UP = 0x58;
    private static final int TIDE_RIGHT = 0x59;
    private static final int TIDE_LEFT = 0x5A;
    private static final int WATER_FALL_START = 0x5B;
    private static final int WATER_FALL_MIDDLE = 0x5C;
    private static final int WATER_FALL_END = 0x5D;

    private static final int TILE_PIXELS = 48;

    /**
     * 对应原版 moving-entity grid-pass helper 的 Leaf 专用分支。
     * direction 是 Leaf 正准备进入目标格时的运动方向。
     */
    boolean canEnter(int targetTerrain, int direction) {
        switch (targetTerrain & 0xFF) {
            case WATER:
            case WATER_ANIMATED:
                return true;

            case TIDE_UP:
                return direction != DOWN;
            case TIDE_DOWN:
                return direction != UP;
            case TIDE_LEFT:
                return direction != RIGHT;
            case TIDE_RIGHT:
                return direction != LEFT;

            case WATER_FALL_START:
            case WATER_FALL_MIDDLE:
            case WATER_FALL_END:
                return direction != UP;

            default:
                return false;
        }
    }

    /**
     * 对应 `a.H()` 中 `bh == true` 的刚登上 moving entity 分支。
     *
     * `justMounted` 只会由 player collision 在进入一个 `direction==4` 的停止动态实体时设置。
     * H() 消费这个标志后，Leaf 仅有一次机会按 Bobby 当前方向启动。
     */
    boolean tryStartImmediatelyAfterBoarding(
        MovingLeaf leaf,
        int bobbyDirection,
        boolean justMounted
    ) {
        if (!justMounted || leaf.type != LEAF || leaf.direction != STOPPED) {
            return false;
        }

        int terrainUnderLeaf = terrainAt(leaf.pixelX / TILE_PIXELS, leaf.pixelY / TILE_PIXELS);

        // 当前 Tide/Fall 不允许 Bobby 用逆流方向从静止状态启动 Leaf。
        if (!canDepartCurrentTerrain(terrainUnderLeaf, bobbyDirection)) {
            return false;
        }

        int nextX = leaf.pixelX / TILE_PIXELS + dx(bobbyDirection);
        int nextY = leaf.pixelY / TILE_PIXELS + dy(bobbyDirection);
        if (!canEnter(terrainAt(nextX, nextY), bobbyDirection)) {
            return false;
        }
        if (movingEntityPixelCollision(leaf, nextX, nextY, bobbyDirection)) {
            return false;
        }

        leaf.direction = bobbyDirection;
        leaf.pixelsRemaining = TILE_PIXELS;
        leaf.fast = false;
        return true;
    }

    /**
     * 关键 lifecycle：漂流中的 Leaf 自己撞停时只会 `direction=4`，不会重新产生 `bh`。
     * 因此 Bobby 此时仍 mounted，但下一次方向输入走普通 Bobby `M()`，会从 Leaf 下去；
     * 不会把当前方向重新解释为“启动 Leaf”。只有离开后再进入该停止 Leaf，碰撞函数才再次
     * 设置 `justMounted=true`，从而再次进入上述启动分支。
     */
    boolean canRestartWithoutDismount(boolean justMounted) {
        return justMounted;
    }

    /**
     * 对应 `a.P()` 在 Leaf 跨完一格后的 terrain routing。
     * 返回 -1 表示保持原方向；Fall 始终改为 Down。
     */
    int forcedDirection(int terrain) {
        switch (terrain & 0xFF) {
            case TIDE_UP:
                return UP;
            case TIDE_DOWN:
                return DOWN;
            case TIDE_LEFT:
                return LEFT;
            case TIDE_RIGHT:
                return RIGHT;
            case WATER_FALL_START:
            case WATER_FALL_MIDDLE:
            case WATER_FALL_END:
                return DOWN;
            default:
                return -1;
        }
    }

    /** 原版 Water Fall 路段使用 6px/gameplay step；其它 Leaf 漂流默认 3px/step。 */
    boolean isFastFlow(int terrain) {
        int raw = terrain & 0xFF;
        return raw == WATER_FALL_START || raw == WATER_FALL_MIDDLE || raw == WATER_FALL_END;
    }

    private boolean canDepartCurrentTerrain(int terrain, int direction) {
        switch (terrain & 0xFF) {
            case TIDE_DOWN:
            case WATER_FALL_START:
            case WATER_FALL_MIDDLE:
            case WATER_FALL_END:
                return direction != UP;
            case TIDE_UP:
                return direction != DOWN;
            case TIDE_RIGHT:
                return direction != LEFT;
            case TIDE_LEFT:
                return direction != RIGHT;
            default:
                return true;
        }
    }

    private int dx(int direction) {
        if (direction == LEFT) return -1;
        if (direction == RIGHT) return 1;
        return 0;
    }

    private int dy(int direction) {
        if (direction == UP) return -1;
        if (direction == DOWN) return 1;
        return 0;
    }

    private int terrainAt(int x, int y) {
        throw new UnsupportedOperationException();
    }

    private boolean movingEntityPixelCollision(MovingLeaf leaf, int x, int y, int direction) {
        throw new UnsupportedOperationException();
    }

    static final class MovingLeaf {
        int type;
        int direction;
        int pixelsRemaining;
        int pixelX;
        int pixelY;
        boolean fast;
    }
}
