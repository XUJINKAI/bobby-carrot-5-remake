// 研究性语义重建：来源为 UP9 a.class / a.V() 与 tile renderer a(byte,int,int)。
// 这是原版 presentation runtime 事实，不作为可直接编译的产品源码。

public final class BonusCoinPresentation {
    private static final int BONUS_COIN = 0xF8;

    /** 对应 `bE`：0..3 四相 ambient phase。 */
    private int ambientPhase4;

    /** 对应 `bG`：每 4 次 gameplay step 才推进一次 ambient phase。 */
    private int ambientSubstep;

    /** 对应 `bH`：全场 Bonus Coin 共用的 sparkle gate。 */
    private boolean bonusCoinSparkleEnabled;

    /**
     * 对应 `a.V()` 的精确门控。
     *
     * 每次 gameplay step：
     * 1. 只有 ambientSubstep==0 时才推进 ambientPhase4；
     * 2. ambientPhase4 回到 0 时才评估 Bonus Coin gate；
     * 3. gate 已开启 -> 无条件关闭；
     * 4. gate 未开启 -> Random(7)==0 才开启。
     *
     * 所以这不是“50% 等 1 秒 / 30% 等 3 秒 / 20% 等 6 秒”的三档定时器。
     */
    void gameplayStep() {
        if (ambientSubstep == 0) {
            ambientPhase4 = (ambientPhase4 + 1) % 4;
        }

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
        }
    }

    /**
     * 所有 F8 Coin 共用同一个 `bH`，因此同一时刻会一起进入/退出 sparkle。
     * gate 开启期间，renderer 用 bE 的 1..3 相去索引 `ta.png` base 15；
     * phase 0 仍是 `ts.png` 静态帧。
     */
    boolean useAnimatedBonusCoinFrame(int objectRaw) {
        return (objectRaw & 0xFF) == BONUS_COIN
            && bonusCoinSparkleEnabled
            && ambientPhase4 != 0;
    }

    int animatedFrameIndex() {
        // 原版 `15 + bE - 1`。
        return 15 + ambientPhase4 - 1;
    }

    /**
     * 时基：ambientPhase4 每 4 gameplay step 前进一步；完整四相一轮 16 step。
     * 稳态约 31ms/step，所以一次 gate 评估约每 496ms。
     *
     * 未开启时每次评估独立 1/7 概率开启，等待时间是几何分布；
     * 开启后到下一次评估必定关闭，因此一次 sparkle gate 固定持续约 496ms。
     */
    double expectedIdleMilliseconds() {
        return 7.0 * 16.0 * 31.0; // 约 3472ms，仅为稳态期望值。
    }

    private int randomInt(int bound) {
        throw new UnsupportedOperationException("original Random.nextInt wrapper");
    }
}
