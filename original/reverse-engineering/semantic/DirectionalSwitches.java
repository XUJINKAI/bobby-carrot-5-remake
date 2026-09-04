// 研究性语义重建：来源为 UP9 a.class / a.J()、a.L()、a.c(int)、a.b(byte)。
// 三类原版 Switch 都通过扫描整张 terrainGrid 完成全局状态变换。

public final class DirectionalSwitches {
    private static final int SPEED_SWITCH_PRESSED = 0xA1;
    private static final int SPEED_SWITCH_RAISED = 0xA2;
    private static final int CAROUSEL_SWITCH_PRESSED = 0xA3;
    private static final int CAROUSEL_SWITCH_RAISED = 0xA4;
    private static final int TIDE_SWITCH_PRESSED = 0xA5;
    private static final int TIDE_SWITCH_RAISED = 0xA6;

    private static final int SPEED_UP = 0xB5;
    private static final int SPEED_DOWN = 0xB6;
    private static final int SPEED_LEFT = 0xB7;
    private static final int SPEED_RIGHT = 0xB8;

    private static final int CAROUSEL_RIGHT_UP = 0xB9;
    private static final int CAROUSEL_LEFT_UP = 0xBA;
    private static final int CAROUSEL_LEFT_DOWN = 0xBB;
    private static final int CAROUSEL_RIGHT_DOWN = 0xBC;
    private static final int CAROUSEL_VERTICAL = 0xBD;
    private static final int CAROUSEL_HORIZONTAL = 0xBE;

    private static final int TIDE_DOWN = 0x57;
    private static final int TIDE_UP = 0x58;
    private static final int TIDE_RIGHT = 0x59;
    private static final int TIDE_LEFT = 0x5A;

    private byte[][] terrainGrid;

    /** 对应 `J()` 踩到 Raised Speed Switch 0xA2 后调用 `c(0)`。 */
    void pressSpeedSwitch() {
        forEachTerrain((tile) -> {
            if (tile == SPEED_SWITCH_PRESSED) return SPEED_SWITCH_RAISED;
            if (tile == SPEED_SWITCH_RAISED) return SPEED_SWITCH_PRESSED;
            if (tile == SPEED_UP) return SPEED_DOWN;
            if (tile == SPEED_DOWN) return SPEED_UP;
            if (tile == SPEED_LEFT) return SPEED_RIGHT;
            if (tile == SPEED_RIGHT) return SPEED_LEFT;
            return tile;
        });
    }

    /** 对应 `J()` 踩到 Raised Tide Switch 0xA6 后调用 `c(1)`。 */
    void pressTideSwitch() {
        forEachTerrain((tile) -> {
            if (tile == TIDE_SWITCH_PRESSED) return TIDE_SWITCH_RAISED;
            if (tile == TIDE_SWITCH_RAISED) return TIDE_SWITCH_PRESSED;
            if (tile == TIDE_UP) return TIDE_DOWN;
            if (tile == TIDE_DOWN) return TIDE_UP;
            if (tile == TIDE_LEFT) return TIDE_RIGHT;
            if (tile == TIDE_RIGHT) return TIDE_LEFT;
            return tile;
        });
    }

    /** 对应 `J()` 踩到 Raised Carousel Switch 0xA4 后调用 `L()`。 */
    void pressCarouselSwitch() {
        forEachTerrain((tile) -> {
            if (tile == CAROUSEL_SWITCH_PRESSED) return CAROUSEL_SWITCH_RAISED;
            if (tile == CAROUSEL_SWITCH_RAISED) return CAROUSEL_SWITCH_PRESSED;

            if (tile == CAROUSEL_RIGHT_UP) return CAROUSEL_RIGHT_DOWN;
            if (tile == CAROUSEL_RIGHT_DOWN) return CAROUSEL_LEFT_DOWN;
            if (tile == CAROUSEL_LEFT_DOWN) return CAROUSEL_LEFT_UP;
            if (tile == CAROUSEL_LEFT_UP) return CAROUSEL_RIGHT_UP;
            if (tile == CAROUSEL_VERTICAL) return CAROUSEL_HORIZONTAL;
            if (tile == CAROUSEL_HORIZONTAL) return CAROUSEL_VERTICAL;
            return tile;
        });
    }

    private void forEachTerrain(TileTransform transform) {
        for (int y = 0; y < terrainGrid.length; y++) {
            for (int x = 0; x < terrainGrid[y].length; x++) {
                int oldTile = terrainGrid[y][x] & 0xFF;
                terrainGrid[y][x] = (byte)transform.apply(oldTile);
            }
        }
    }

    private interface TileTransform {
        int apply(int rawTile);
    }
}
