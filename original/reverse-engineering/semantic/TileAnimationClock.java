// 研究性语义重建：来源为 UP9 a.class / V() ambient counters 与 a(byte,int,int) tile visual resolver。
// 原版大量动态 tile 不拥有独立计时器，而是共享全局 ambient phase，因此同类 tile 同步动画。

public final class TileAnimationClock {
    private static final int ANIMATED_WATER = 0x56;
    private static final int TIDE_DOWN = 0x57;
    private static final int TIDE_UP = 0x58;
    private static final int TIDE_RIGHT = 0x59;
    private static final int TIDE_LEFT = 0x5A;
    private static final int FALL_START = 0x5B;
    private static final int FALL_MIDDLE = 0x5C;
    private static final int FALL_END = 0x5D;
    private static final int EXIT = 0x96;

    private static final int SPEED_UP = 0xB5;
    private static final int SPEED_DOWN = 0xB6;
    private static final int SPEED_LEFT = 0xB7;
    private static final int SPEED_RIGHT = 0xB8;

    private static final int WINDMILL_UP = 0xD0;
    private static final int WINDMILL_DOWN = 0xD1;
    private static final int WINDMILL_LEFT = 0xD2;
    private static final int WINDMILL_RIGHT = 0xD3;

    private static final int WHIRLWIND = 0xF4;
    private static final int BONUS_COIN = 0xF8;

    /** bC = 0..7：静态帧 + 7 张 Animated Water ta 帧。 */
    private int waterPhase;

    /** bD = 0..5：静态帧 + 5 张 Whirlwind ta 帧。 */
    private int whirlwindPhase;

    /** bE = 0..3：静态帧 + 3 张 Exit / Speed / Bonus Coin ta 帧。 */
    private int fourPhase;

    /** bF = 0..2：静态帧 + 2 张 Tide / Fall / Windmill ta 帧。 */
    private int shortPhase;

    /** 对应 bG：0..3 的四步 ambient 分频器。 */
    private int ambientSubstep;

    private boolean bonusCoinSparkleGate;
    private int remainingObjectives;
    private boolean windUpEnabled;
    private boolean windDownEnabled;
    private boolean windLeftEnabled;
    private boolean windRightEnabled;

    /**
     * 精确对应 `V()`：
     *
     * 1. 只有进入 step 时 bG==0 才推进 bC/bD/bE/bF；
     * 2. phase 推进后，原版立即重绘当前 cache 中需要动画的格；
     * 3. 随后只要 bE==0，每个 step 都更新 Bonus Coin 的 bH gate；
     * 4. 最后 bG=(bG+1)%4。
     *
     * 因此四组 phase 每 4 个 gameplay step 才前进一步，而不是每 step 推进。
     * bH 在 bE==0 保持的整个四步窗口中会被连续检查四次。
     */
    void gameplayStep(RandomSource random) {
        if (ambientSubstep == 0) {
            waterPhase = (waterPhase + 1) % 8;
            whirlwindPhase = (whirlwindPhase + 1) % 6;
            fourPhase = (fourPhase + 1) % 4;
            shortPhase = (shortPhase + 1) % 3;

            // 原版此时按新 phase 重绘 animation cache；必须早于下面的 bH 更新。
            redrawAnimatedCachedCells();
        }

        if (fourPhase == 0) {
            if (bonusCoinSparkleGate) {
                bonusCoinSparkleGate = false;
            } else if (random.nextInt(7) == 0) {
                bonusCoinSparkleGate = true;
            }
        }

        ambientSubstep = (ambientSubstep + 1) % 4;
    }

    /**
     * 原版 visual resolver 的核心：phase==0 画 static `ts.png`；phase>0 改写成
     * `ta.png` flattened index。flattened index 为 zero-based，每行 4 帧。
     */
    DynamicFrame resolve(int rawTile) {
        int raw = rawTile & 0xFF;

        // fourPhase: static + 3 dynamic frames
        if (fourPhase != 0) {
            if (raw == EXIT && remainingObjectives == 0) {
                return DynamicFrame.ta(0 + fourPhase - 1);   // ta(1,1)..ta(1,3)
            }
            if (raw == SPEED_UP) {
                return DynamicFrame.ta(3 + fourPhase - 1);   // ta(1,4)..ta(2,2)
            }
            if (raw == SPEED_DOWN) {
                return DynamicFrame.ta(6 + fourPhase - 1);   // ta(2,3)..ta(3,1)
            }
            if (raw == SPEED_LEFT) {
                return DynamicFrame.ta(9 + fourPhase - 1);   // ta(3,2)..ta(3,4)
            }
            if (raw == SPEED_RIGHT) {
                return DynamicFrame.ta(12 + fourPhase - 1);  // ta(4,1)..ta(4,3)
            }
            if (raw == BONUS_COIN && bonusCoinSparkleGate) {
                return DynamicFrame.ta(15 + fourPhase - 1);  // ta(4,4)..ta(5,2)
            }
        }

        // shortPhase: static + 2 dynamic frames
        if (shortPhase != 0) {
            if (raw == WINDMILL_UP && windUpEnabled) {
                return DynamicFrame.ta(18 + shortPhase - 1); // ta(5,3)..ta(5,4)
            }
            if (raw == WINDMILL_DOWN && windDownEnabled) {
                return DynamicFrame.ta(20 + shortPhase - 1); // ta(6,1)..ta(6,2)
            }
            if (raw == WINDMILL_LEFT && windLeftEnabled) {
                return DynamicFrame.ta(22 + shortPhase - 1); // ta(6,3)..ta(6,4)
            }
            if (raw == WINDMILL_RIGHT && windRightEnabled) {
                return DynamicFrame.ta(24 + shortPhase - 1); // ta(7,1)..ta(7,2)
            }

            if (raw == TIDE_UP) {
                return DynamicFrame.ta(31 + shortPhase - 1); // ta(8,4)..ta(9,1)
            }
            if (raw == TIDE_DOWN) {
                return DynamicFrame.ta(33 + shortPhase - 1); // ta(9,2)..ta(9,3)
            }
            if (raw == TIDE_LEFT) {
                return DynamicFrame.ta(35 + shortPhase - 1); // ta(9,4)..ta(10,1)
            }
            if (raw == TIDE_RIGHT) {
                return DynamicFrame.ta(37 + shortPhase - 1); // ta(10,2)..ta(10,3)
            }

            if (raw == FALL_START) {
                return DynamicFrame.ta(46 + shortPhase - 1); // ta(12,3)..ta(12,4)
            }
            if (raw == FALL_MIDDLE) {
                return DynamicFrame.ta(48 + shortPhase - 1); // ta(13,1)..ta(13,2)
            }
            if (raw == FALL_END) {
                return DynamicFrame.ta(50 + shortPhase - 1); // ta(13,3)..ta(13,4)
            }
        }

        // whirlwindPhase: static + 5 dynamic frames
        if (raw == WHIRLWIND && whirlwindPhase != 0) {
            return DynamicFrame.ta(26 + whirlwindPhase - 1); // ta(7,3)..ta(8,3)
        }

        // waterPhase: static + 7 dynamic frames
        if (raw == ANIMATED_WATER && waterPhase != 0) {
            return DynamicFrame.ta(39 + waterPhase - 1); // ta(10,4)..ta(12,2)
        }

        return DynamicFrame.staticTs(raw);
    }

    /**
     * 所有 phase 都是 runtime 全局字段；同类 tile 没有 per-cell phase offset。
     * 因而同一类型的 Water / Speed / Tide / Windmill / Exit 会严格同步切帧。
     */
    boolean sameTypeTilesAnimateInSync() {
        return true;
    }

    private void redrawAnimatedCachedCells() {}

    interface RandomSource {
        int nextInt(int bound);
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
