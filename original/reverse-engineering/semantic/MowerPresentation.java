// 研究性语义重建：来源为 UP9 a.class / player renderer、a.O() 与 mow.png renderer。
// 本文件记录非规则网格素材的裁切和节拍；不是可直接编译的产品源码。

public final class MowerPresentation {
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    /** b7.png 为 216x166：两行各 83px，但四个方向并非等宽列。 */
    SourceRect mowerFrame(int direction, int animationFrame) {
        int y = Math.max(0, Math.min(1, animationFrame)) * 83;
        switch (direction) {
            case LEFT:
                return new SourceRect(0, y, 60, 83, -6, -48);
            case RIGHT:
                return new SourceRect(60, y, 60, 83, -6, -48);
            case UP:
                return new SourceRect(120, y, 48, 83, 0, -48);
            case DOWN:
            default:
                return new SourceRect(168, y, 48, 83, 0, -48);
        }
    }

    /**
     * 普通 Mower 的 av 两帧仍受 bf 隔次门控，约每 2 gameplay step 切换一次；
     * Speed continuation 使 O() 绕过该门控，约每 gameplay step 切换一次。
     */
    int mowerFrameDurationGameplaySteps(boolean speedContinuation) {
        return speedContinuation ? 1 : 2;
    }

    /**
     * mow.png 为 240x96，即 5列x2行；原版 aD=(aD+1)%12，再使用 aD/3，
     * 所以只会取第 0..3 列，第 5 列不参与 gameplay renderer。
     * row 0 用于正在割 High Grass，row 1 用于 Speed continuation 尾迹。
     */
    SourceRect mowTrailFrame(boolean cuttingHighGrass, int animationCounter) {
        int frame = Math.floorMod(animationCounter, 12) / 3;
        return new SourceRect(frame * 48, cuttingHighGrass ? 0 : 48, 48, 48, 0, -36);
    }

    /** 普通割草约每 6 step 换 trail 帧；Speed 下约每 3 step 换帧。 */
    int mowTrailFrameDurationGameplaySteps(boolean speedContinuation) {
        return speedContinuation ? 3 : 6;
    }

    static final class SourceRect {
        final int x;
        final int y;
        final int width;
        final int height;
        final int offsetX;
        final int offsetY;

        SourceRect(int x, int y, int width, int height, int offsetX, int offsetY) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.offsetX = offsetX;
            this.offsetY = offsetY;
        }
    }
}
