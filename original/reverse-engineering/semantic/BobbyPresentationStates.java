// 研究性语义重建：来源为 UP9 a.class / player renderer a(Graphics,int,int) 与 a.O()。
// 本文件记录 b0.png..b9.png 在 runtime 中的角色状态映射，不作为产品源码。

public final class BobbyPresentationStates {
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;
    private static final int IDLE = 4;
    private static final int DEAD = 5;
    private static final int LEVEL_TRANSITION = 6;

    /**
     * 普通 Bobby renderer 的核心就是 `cs[climbing ? 2 : aw]`，因此：
     *
     * b0.png = Left, 8 帧
     * b1.png = Right, 8 帧
     * b2.png = Up, 8 帧（Beanstalk climbing 也强制用它）
     * b3.png = Down, 8 帧
     * b4.png = Idle, 3 帧
     * b5.png = Death, 8 帧（0..7，最后停在 7）
     * b6.png = Level enter/clear transition, 10 帧（0..9）
     * b7.png = Mower，四方向 × 2 帧
     * b8.png = Shovel，四方向 × 3 帧
     * b9.png = Kite airborne，四方向单帧
     */
    String spriteForMotionState(int motionState, boolean climbingBeanstalk) {
        if (climbingBeanstalk) return "b2.png";
        return "b" + motionState + ".png";
    }

    /**
     * `aw=6` 同一套 b6 帧被双向复用：
     *
     * - level load/reset：`av=9, be=false`，O() 在共享 animation gate 放行时 --av；
     *   降到 -1 后恢复 `aw=DOWN,av=3`；
     * - level clear：`av=0, be=true`，O() 在共享 animation gate 放行时 ++av；
     *   达到 10 时立即进入 result/campaign flow，
     *   因此实际可绘制帧为 0..9。
     *
     * b6 不满足 fast-motion bypass 条件，因此逻辑槽约每 2 gameplay step 推进一次。
     */
    int advanceLevelTransitionFrame(int frame, boolean clearing) {
        if (clearing) {
            return frame < 9 ? frame + 1 : -1; // -1 表示触发完成后的 scene transition。
        }
        return frame > 0 ? frame - 1 : -1; // -1 表示回到普通 gameplay。
    }

    /** Death `aw=5` 只增到 7，不循环。 */
    int advanceDeathFrame(int frame) {
        return Math.min(7, frame + 1);
    }

    /** Ice sliding 固定人物 animation frame 1（即图片中的第 2 帧索引）。 */
    int iceSlidingFrame() {
        return 1;
    }

    int normalDirectionImageIndex(int direction) {
        switch (direction) {
            case LEFT: return 0;
            case RIGHT: return 1;
            case UP: return 2;
            case DOWN: return 3;
            default: return IDLE;
        }
    }
}
