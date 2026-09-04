// 研究性语义重建：来源为 UP9 a.class / b(Graphics)、O() 与 gameplay paint a(Graphics)。
// 本文件记录原版 HUD 的条件、布局与时序，不作为可直接编译的产品源码。

public final class GameplayHud {
    static final int TIMER_LIMIT_MILLIS = 60_000;

    /** hud.png source rect；所有 rect 的 sourceY 都是 0。 */
    static final Rect OVERVIEW = new Rect(0, 42, 38);
    static final Rect CARROT_OBJECTIVE = new Rect(42, 40, 38);
    static final Rect GAS = new Rect(82, 39, 37);
    static final Rect KEY = new Rect(121, 22, 35);
    static final Rect KITE = new Rect(143, 36, 36);
    static final Rect SHOVEL = new Rect(179, 37, 38);
    static final Rect EGG_OBJECTIVE = new Rect(216, 31, 38);
    static final Rect BEAN = new Rect(247, 35, 36);

    /**
     * bV != 0 才画 release archive 的 timer、objective 与 inventory。
     * archive 00.dat 的 Beaver Shop / Cloud 9 / Dream Machine / Welcome / Reward
     * 等 shared scene 不画这三组 HUD。
     *
     * Overview 图标例外：只由 dV 控制，位于屏幕顶部中央，不受 bV gate 限制。
     */
    boolean showsReleaseLevelHud(int archiveNumber) {
        return archiveNumber != 0;
    }

    long displayedMillis(
            boolean timedBonus,
            boolean timedBonusCountdownStarted,
            boolean timerFrozen,
            long timerStartedAtMillis,
            long frozenElapsedMillis,
            long nowMillis) {
        long elapsed = timerFrozen
                ? frozenElapsedMillis
                : nowMillis - timerStartedAtMillis + frozenElapsedMillis;

        if (!timedBonus) return elapsed;
        if (!timedBonusCountdownStarted) return TIMER_LIMIT_MILLIS;
        return Math.max(0L, TIMER_LIMIT_MILLIS - elapsed);
    }

    /**
     * numbers.png：
     * - minutes 两位，左上 (2,2)；
     * - seconds 两位，左上 (34,2)；
     * - colon 是 source (120,0,5,13)，screen x=28、y=2。
     *
     * colon 在 timer 已冻结时常亮；运行时按“显示秒数为偶数”闪烁。
     */
    boolean colonVisible(boolean timerFrozen, int displayedSecondsWithinMinute) {
        return timerFrozen || displayedSecondsWithinMinute % 2 == 0;
    }

    /**
     * objective 固定在右上：
     * - carrot mode (cU=true)：hud source x=42，40x38；
     * - egg mode：hud source x=216，31x38。
     * 剩余量 cC 以两位数字画在图标左侧。
     */
    Rect objectiveRect(boolean carrotObjective) {
        return carrotObjective ? CARROT_OBJECTIVE : EGG_OBJECTIVE;
    }

    /**
     * inventory 从右向左紧排，统一位于 y=42：
     * Gas -> Kite -> Shovel -> Bean -> Key。
     *
     * 每项之间原版固定保留 2px：
     * Gas 消耗 41px、Kite 38px、Shovel 39px、Bean 37px、Key 24px。
     */
    Rect[] visibleInventory(
            boolean hasGas,
            boolean hasKite,
            boolean hasShovel,
            int beanCount,
            boolean temporaryKey,
            int permanentSuperKeyLevel) {
        RectList result = new RectList();
        if (hasGas) result.add(GAS);
        if (hasKite) result.add(KITE);
        if (hasShovel) result.add(SHOVEL);
        if (beanCount > 0) result.add(BEAN);
        if (temporaryKey || permanentSuperKeyLevel > 0) result.add(KEY);
        return result.toArray();
    }

    /**
     * alarm.png 是 2x48 横排两帧；ba==-1 表示无 overlay。
     * Timed Bonus timeout 后 O() 每隔一个 gameplay step 令 ba=(ba+1)%2，
     * 所以约每 62ms 换帧。画面居中，位于普通 HUD 之后、消息层之前。
     */
    int alarmFrame(boolean alarmActive, int previousFrame, boolean animationCadenceStep) {
        if (!alarmActive) return -1;
        return animationCadenceStep ? (previousFrame + 1) % 2 : previousFrame;
    }

    static final class Rect {
        final int sourceX;
        final int width;
        final int height;

        Rect(int sourceX, int width, int height) {
            this.sourceX = sourceX;
            this.width = width;
            this.height = height;
        }
    }

    /** 仅用于把反编译出来的顺序表达清楚。 */
    private static final class RectList {
        private final Rect[] values = new Rect[5];
        private int size;

        void add(Rect value) {
            values[size++] = value;
        }

        Rect[] toArray() {
            Rect[] result = new Rect[size];
            System.arraycopy(values, 0, result, 0, size);
            return result;
        }
    }
}
