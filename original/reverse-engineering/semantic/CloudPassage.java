// 研究性语义重建：来源为 UP9 a.class /
// a.a(int gridX, int gridY, int direction, byte entityType) 的 javap 字节码。
//
// Cloud 的“能否进入下一格”与 `CloudWind.forcedDirectionAt()` 是两件事：
// 这里负责基础天空通行与逆风阻挡；到达格后的风向接管由 a.P() 处理。

public final class CloudPassage {
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    // 原版 moving-entity helper 对非 Leaf 动态实体只接受 0x47..0x4C。
    private static final int SKY_MIN = 0x47;
    private static final int SKY_MAX = 0x4C;

    private boolean windUpEnabled;
    private boolean windDownEnabled;
    private boolean windLeftEnabled;
    private boolean windRightEnabled;

    private int windmillUpX;
    private int windmillUpY;
    private int windmillDownX;
    private int windmillDownY;
    private int windmillLeftX;
    private int windmillLeftY;
    private int windmillRightX;
    private int windmillRightY;

    boolean canEnter(int x, int y, int direction, int targetTerrain) {
        if ((targetTerrain & 0xFF) < SKY_MIN || (targetTerrain & 0xFF) > SKY_MAX) {
            return false;
        }

        // 向左移动时，不能闯入 Right Windmill 正在向右吹的三格风区。
        if (direction == LEFT
                && windRightEnabled
                && y == windmillRightY
                && x >= windmillRightX + 1
                && x <= windmillRightX + 3) {
            return false;
        }

        // 向右移动时，不能闯入 Left Windmill 正在向左吹的三格风区。
        if (direction == RIGHT
                && windLeftEnabled
                && y == windmillLeftY
                && x >= windmillLeftX - 3
                && x <= windmillLeftX - 1) {
            return false;
        }

        // 向上移动时，不能闯入 Down Windmill 正在向下吹的三格风区。
        if (direction == UP
                && windDownEnabled
                && x == windmillDownX
                && y >= windmillDownY + 1
                && y <= windmillDownY + 3) {
            return false;
        }

        // 向下移动时，不能闯入 Up Windmill 正在向上吹的三格风区。
        if (direction == DOWN
                && windUpEnabled
                && x == windmillUpX
                && y >= windmillUpY - 3
                && y <= windmillUpY - 1) {
            return false;
        }

        return true;
    }
}
