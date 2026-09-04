// 研究性语义重建：来源为 UP9 a.class / V() ambient counters 与 a(byte,int,int) tile visual resolver。
// 原版大量动态 tile 不拥有独立计时器，而是共享全局 ambient phase，因此同类 tile 同步动画。

public final class TileAnimationClock {
    private static final int EXIT = 0x96;
    private static final int ANIMATED_WATER = 0x56;
    private static final int WHIRLWIND = 0xF4;
    private static final int BONUS_COIN = 0xF8;
    private static final int WINDMILL_UP = 0xD0;
    private static final int WINDMILL_DOWN = 0xD1;
    private static final int WINDMILL_LEFT = 0xD2;
    private static final int WINDMILL_RIGHT = 0xD3;

    /** 原版 bC：Animated Water 使用的长 ambient phase。0 表示静态 ts 帧。 */
    private int waterPhase;

    /** 原版 bD：Whirlwind 使用的 ambient phase。0 表示静态 ts 帧。 */
    private int whirlwindPhase;

    /** 原版 bE：Exit / Bonus Coin 等四相动画使用。0 表示静态 ts 帧。 */
    private int fourPhase;

    /** 原版 bF：Windmill / Tide / Fall 等短周期动画使用。0 表示静态 ts 帧。 */
    private int shortPhase;

    private boolean bonusCoinSparkleGate;
    private int remainingObjectives;
    private boolean windUpEnabled;
    private boolean windDownEnabled;
    private boolean windLeftEnabled;
    private boolean windRightEnabled;

    /**
     * 原版 renderer 的关键结构：phase==0 时继续画 static `ts.png` raw tile；
     * phase>0 时把 raw byte 改写成 `ta.png` 的 flattened dynamic frame index。
     * 因而“静态帧 + N 张 ta 帧”共同组成一个周期。
     */
    DynamicFrame resolve(int rawTile) {
        int raw = rawTile & 0xFF;

        // Exit 只有目标全部完成以后才接入 bE 动画，否则永远保持静态 0x96。
        if (raw == EXIT && remainingObjectives == 0 && fourPhase != 0) {
            // ta flattened 0..2 -> 文档 ta(1,1)..ta(1,3)
            return DynamicFrame.ta(fourPhase - 1);
        }

        // Bonus Coin 的四相 animation 还受全局 sparkle gate 控制。
        if (raw == BONUS_COIN && bonusCoinSparkleGate && fourPhase != 0) {
            // flattened 15..17 -> ta(4,4), ta(5,1), ta(5,2)
            return DynamicFrame.ta(15 + fourPhase - 1);
        }

        // Whirlwind: static F4 + bD 动态帧序列。
        if (raw == WHIRLWIND && whirlwindPhase != 0) {
            // flattened base 26，具体 atlas 序列见 mechanics.md。
            return DynamicFrame.ta(26 + whirlwindPhase - 1);
        }

        // Animated Water: static 0x56 + 8 个共享动态帧。
        if (raw == ANIMATED_WATER && waterPhase != 0) {
            // flattened base 39 -> ta(10,4) ... ta(12,2)
            return DynamicFrame.ta(39 + waterPhase - 1);
        }

        // Windmill 只有对应风已启用时才使用短周期动态帧；关闭时保持 static ts。
        if (raw == WINDMILL_UP && windUpEnabled && shortPhase != 0) {
            return DynamicFrame.ta(18 + shortPhase - 1);
        }
        if (raw == WINDMILL_DOWN && windDownEnabled && shortPhase != 0) {
            return DynamicFrame.ta(20 + shortPhase - 1);
        }
        if (raw == WINDMILL_LEFT && windLeftEnabled && shortPhase != 0) {
            return DynamicFrame.ta(22 + shortPhase - 1);
        }
        if (raw == WINDMILL_RIGHT && windRightEnabled && shortPhase != 0) {
            return DynamicFrame.ta(24 + shortPhase - 1);
        }

        return DynamicFrame.staticTs(raw);
    }

    /**
     * 重要 fidelity 结论：这些 phase 是 runtime 全局字段，不是按格随机偏移。
     * 因而所有 Animated Water、所有已开启 Windmill、所有可用 Exit 等同类 tile 会同步切帧。
     */
    boolean sameTypeTilesAnimateInSync() {
        return true;
    }

    static final class DynamicFrame {
        final boolean dynamicAtlas;
        final int flattenedIndex;

        private DynamicFrame(boolean dynamicAtlas, int flattenedIndex) {
            this.dynamicAtlas = dynamicAtlas;
            this.flattenedIndex = flattenedIndex;
        }

        static DynamicFrame ta(int flattenedIndex) {
            return new DynamicFrame(true, flattenedIndex);
        }

        static DynamicFrame staticTs(int rawTile) {
            return new DynamicFrame(false, rawTile);
        }
    }
}
