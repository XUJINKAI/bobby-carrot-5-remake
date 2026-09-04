// 研究性语义重建：来源为 UP9 a.class / player collision、Beanfield midpoint、gameplay counter 与 HUD renderer。

public final class MissingItemHint {
    static final int GAS = 0;
    static final int KEY = 1;
    static final int KITE = 2;
    static final int SHOVEL = 3;
    static final int BEAN = 4;

    /** 原版 aY。 */
    private int kind;

    /** 原版 aA：不是直接 frame count，而是还剩多少个 8-step blink cycle。 */
    private int cyclesRemaining;

    /** 原版 aB：0..7。 */
    private int blinkPhase;

    /**
     * 触发来源：
     * - Mower 没 Gas -> kind 0；
     * - Lock 没 temporary/permanent key -> kind 1；
     * - Whirlwind 没 Kite -> kind 2；
     * - Snow 没 Shovel -> kind 3；
     * - Beanfield 没 Bean -> kind 4。
     *
     * 每次触发统一设 cyclesRemaining=4。
     */
    void show(int itemKind) {
        kind = itemKind;
        cyclesRemaining = 4;
    }

    /** 顶层 gameplay 每 step 推进。 */
    void gameplayStep() {
        if (cyclesRemaining <= 0) return;
        blinkPhase = (blinkPhase + 1) % 8;
        if (blinkPhase == 0) {
            cyclesRemaining--;
        }
    }

    /** Renderer 只有 aA>0 且 aB>=4 才画。 */
    boolean visible() {
        return cyclesRemaining > 0 && blinkPhase >= 4;
    }

    /**
     * 一次提示持续 4 * 8 = 32 gameplay step，稳态约 992ms；
     * 每 8-step 周期只显示后 4 step，因此约 50% duty cycle 闪烁。
     */
    int totalLifetimeGameplaySteps() {
        return 32;
    }

    /**
     * HUD source rect 均来自 hud.png；原版不是文字 tooltip。
     * 返回 {x,width,height}，Y 都为 0。
     */
    int[] hudSourceRect() {
        switch (kind) {
            case GAS:    return new int[]{82, 39, 37};
            case KEY:    return new int[]{121, 22, 35};
            case KITE:   return new int[]{143, 36, 36};
            case SHOVEL: return new int[]{179, 37, 38};
            default:     return new int[]{247, 35, 36}; // Bean
        }
    }
}
