// 研究性语义重建：来源为 UP9 a.class / a.a(int,int,boolean)、a.J() 与 a.b(byte)。
// raw ID 由 docs/system/original/mechanics.md 的 ts(12,10..15) 与 bytecode 交叉确认。

public final class CarouselPassage {
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    private static final int RIGHT_UP = 0xB9;
    private static final int LEFT_UP = 0xBA;
    private static final int LEFT_DOWN = 0xBB;
    private static final int RIGHT_DOWN = 0xBC;
    private static final int VERTICAL = 0xBD;
    private static final int HORIZONTAL = 0xBE;

    /**
     * 对应玩家离开“当前所在 Carousel”时的方向约束。
     * 参数 dx/dy 是 Bobby 本次移动向量。
     */
    boolean canLeave(int rawTile, int dx, int dy) {
        switch (rawTile & 0xFF) {
            case HORIZONTAL:
                return dx != 0;
            case VERTICAL:
                return dy != 0;
            case RIGHT_DOWN:
                return dx == 1 || dy == 1;
            case LEFT_DOWN:
                return dx == -1 || dy == 1;
            case LEFT_UP:
                return dx == -1 || dy == -1;
            case RIGHT_UP:
                return dx == 1 || dy == -1;
            default:
                return true;
        }
    }

    /**
     * 对应 Bobby 从相邻格进入目标 Carousel 时的方向约束。
     *
     * 原版使用“移动向量”表达进入边，因此进入方向与该 Carousel 可离开的方向
     * 在符号上正好相反。
     */
    boolean canEnter(int rawTile, int dx, int dy) {
        switch (rawTile & 0xFF) {
            case HORIZONTAL:
                return dx != 0;
            case VERTICAL:
                return dy != 0;
            case RIGHT_UP:
                return dx == -1 || dy == 1;
            case LEFT_UP:
                return dx == 1 || dy == 1;
            case LEFT_DOWN:
                return dx == 1 || dy == -1;
            case RIGHT_DOWN:
                return dx == -1 || dy == -1;
            default:
                return true;
        }
    }

    /**
     * 对应原版 `a.b(byte)`。
     * Bobby 第一次跨过 Carousel 的移动中点时，`a.J()` 记住该格坐标；
     * 下一次移动跨过中点、再次执行 `J()` 时，函数开头才对上一格调用该转换。
     * 因此 gameplay 语义是 rotate-on-leave，但原版实际结算点位于下一次视觉移动的中点。
     */
    int rotateClockwiseOnLeave(int rawTile) {
        switch (rawTile & 0xFF) {
            case RIGHT_UP:
                return RIGHT_DOWN;
            case RIGHT_DOWN:
                return LEFT_DOWN;
            case LEFT_DOWN:
                return LEFT_UP;
            case LEFT_UP:
                return RIGHT_UP;
            case VERTICAL:
                return HORIZONTAL;
            case HORIZONTAL:
                return VERTICAL;
            default:
                return rawTile & 0xFF;
        }
    }
}
