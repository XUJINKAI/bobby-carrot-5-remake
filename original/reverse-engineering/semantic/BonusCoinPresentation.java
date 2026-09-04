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
     * 精确对应 a.V() 的执行顺序。phase 只在 ambientSubstep==0 时推进；
     * cache 使用推进后的 phase 和推进前的 bH 重绘。随后，bE==0 的每个 step
     * 都会对 bH 做一次“active 则关闭，否则 1/7 开启”的更新。
     */
    void gameplayStep(RandomSource random) {
        if (ambientSubstep == 0) {
            ambientPhase4 = (ambientPhase4 + 1) % 4;
            redrawCachedBonusCoins();
        }

        if (ambientPhase4 == 0) {
            if (bonusCoinSparkleEnabled) {
                bonusCoinSparkleEnabled = false;
            } else if (random.nextInt(7) == 0) {
                bonusCoinSparkleEnabled = true;
            }
        }

        ambientSubstep = (ambientSubstep + 1) % 4;
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
     * bE==0 的四步窗口结束时，bH 是否恰好为 true 决定下一轮是否可见。
     * 进入窗口时 bH=false 的精确概率是 300/2401；bH=true 时是 43/343；
     * 长期稳态两者收敛到 1/8。可见后 bH 在 bE=1/2/3 期间保持 true，
     * 所以三张动态帧各保持 4 step，总可见时长固定 12 step，约 372ms。
     */
    int visibleSparkleGameplaySteps() {
        return 12;
    }

    private void redrawCachedBonusCoins() {}

    interface RandomSource {
        int nextInt(int bound);
    }

}
