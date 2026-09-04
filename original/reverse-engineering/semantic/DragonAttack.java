// 研究性语义重建：来源为 UP9 a.class / a.ae()、a.J() 与 a.H()。
// Dragon Head / Body / Tail 由 DAT loader 展开为 D7/D8/D9。

public final class DragonAttack {
    private static final int DRAGON_HEAD_BASE = 0xD7;
    private static final int DRAGON_BODY = 0xD8;
    private static final int DRAGON_TAIL = 0xD9;
    private static final int DRAGON_HEAD_FIRE_1 = 0xE8;
    private static final int DRAGON_HEAD_FIRE_2 = 0xE9;

    private static final int PHASE_TICKS = 6;
    private static final int FIREBALL_LEFT = 0;
    private static final int TILE_SIZE = 48;

    private byte[][] objectGrid;

    /** 对应原版 `cS/cT`，由 level initialization 扫描 D7 得到。 */
    private int dragonHeadX = -1;
    private int dragonHeadY = -1;

    /** 对应 `ds/aQ`：-1 idle，0 wind-up，1 fireball active。 */
    private int attackState = -1;
    private int phaseCountdown;

    private int fireballPixelX;
    private int fireballPixelY;
    private int fireballDirection;

    void locateDragonHead(int x, int y) {
        if ((objectGrid[y][x] & 0xFF) == DRAGON_HEAD_BASE) {
            dragonHeadX = x;
            dragonHeadY = y;
        }
    }

    /** 原版 `J()` 在 Bobby 到达 Dragon Tail D9 时触发准备阶段。 */
    void onEnterObject(int rawObject) {
        if ((rawObject & 0xFF) != DRAGON_TAIL || dragonHeadX < 0 || attackState != -1) {
            return;
        }
        attackState = 0;
        phaseCountdown = PHASE_TICKS;
    }

    /** 对应 `H()` 中 `ds == 0` 的 Dragon Head 分帧状态机。 */
    void tickWindUp() {
        if (attackState != 0) {
            return;
        }

        phaseCountdown--;
        if (phaseCountdown > 0) {
            return;
        }

        int head = objectGrid[dragonHeadY][dragonHeadX] & 0xFF;
        if (head == DRAGON_HEAD_BASE) {
            objectGrid[dragonHeadY][dragonHeadX] = (byte)DRAGON_HEAD_FIRE_1;
            phaseCountdown = PHASE_TICKS;
            return;
        }
        if (head == DRAGON_HEAD_FIRE_1) {
            objectGrid[dragonHeadY][dragonHeadX] = (byte)DRAGON_HEAD_FIRE_2;
            phaseCountdown = PHASE_TICKS;
            return;
        }

        objectGrid[dragonHeadY][dragonHeadX] = (byte)DRAGON_HEAD_BASE;
        fireballPixelX = dragonHeadX * TILE_SIZE;
        fireballPixelY = dragonHeadY * TILE_SIZE + TILE_SIZE / 2;
        fireballDirection = FIREBALL_LEFT;
        attackState = 1;
    }
}
