// 研究性语义重建：来源为 UP9 a.class / a.V() 与 tile renderer a(byte,int,int).
// 这是原版 presentation runtime 事实，不作为可直接编译的产品源码。

public final class BonusCoinPresentation {
    private static final int BONUS_COIN = 0xF8;

    /** 对应 bE：0..3 四相 ambient phase。 */
    private int ambientPhase4;

    /** 对应 bG：ambient phase 的四步门控。 */
    private int ambientSubstep;

    /** 对应 bH：全场 Bonus Coin 共用 sparkle gate。 */
    private boolean bonusCoinSparkleEnabled;

    /**
     * 精确对应 a.V() 的时序：
     *
     * 每个 gameplay step：
     * 1. 先处理 bE==0 时的 bH sparkle gate；
     * 2. 然后推进 bG；
     * 3. 只有 bG 回到 0 时，下一次 V() 才推进 bE/bC/bD/bF。
     *
     * 注意：bH 检查不是每 16 step 一次。bE 保持为 0 的窗口内，
     * 每个 gameplay step 都可能关闭当前 sparkle 或重新随机开启。
     */
    void gameplayStep() {
        if (ambientPhase4 == 0) {
            if (bonusCoinSparkleEnabled) {
                bonusCoinSparkleEnabled = false;
            } else if (randomInt(7) == 0) {
                bonusCoinSparkleEnabled = true;
            }
        }

        ambientSubstep++;
        if (ambientSubstep >= 4) {
            ambientSubstep = 0;
            ambientPhase4 = (ambientPhase4 + 1) % 4;
        }
    }

    boolean useAnimatedBonusCoinFrame(int objectRaw) {
        return (objectRaw & 0xFF) == BONUS_COIN
            && bonusCoinSparkleEnabled
            && ambientPhase4 != 0;
    }

    int animatedFrameIndex() {
        // 原版 renderer: base 15 + bE - 1。
        return 15 + ambientPhase4 - 1;
    }

    /**
     * 统计含义：
     * - ambient phase 每 4 gameplay step 推进；
     * - bH 只在 phase=0 窗口处理；
     * - sparkle 持续时间不是固定 496ms。
     *
     * 具体可见持续时间取决于 bG/bE 当前相位和下一次 gate 处理。
     */
    private int randomInt(int bound) {
        throw new UnsupportedOperationException("original Random.nextInt wrapper");
    }
}
