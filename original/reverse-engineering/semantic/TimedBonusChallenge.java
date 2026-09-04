// 研究性语义重建：来源为 UP9 a.class / a.ae()、a.J()、a.H()。
// 这里只描述地图内计时挑战；Campaign 存档/奖励落盘仍属于原版外层流程。

public final class TimedBonusChallenge {
    private static final int OBJECT_EMPTY = 0xFF;
    private static final int LOCK = 0xCD;
    private static final int GOLDEN_CARROT = 0xF6;
    private static final int BONUS_COIN = 0xF8;
    private static final long TIME_LIMIT_MS = 60_000L;

    private byte[][] objectGrid;

    /** 对应 `cV`：当前地图带 timed bonus challenge 语义。 */
    private boolean timedChallengeEnabled;

    /** 对应 `df`：Lock 已打开，60 秒倒计时已经开始。 */
    private boolean timerStarted;

    /** 对应 `ca/bZ/cb` 的原版计时组合。 */
    private long runningSinceMs;
    private long accumulatedMs;
    private boolean timerPaused;

    /** 对应 `bX`：本关 Bonus Coin 数。 */
    private int collectedBonusCoins;

    /**
     * 对应 `a.J()` 的 Lock midpoint interaction。
     * 原版先清除 Lock object；只有 timedChallengeEnabled 且尚未开始时才启动 60 秒计时。
     */
    void openLockAtMidpoint(int x, int y, long nowMs) {
        if ((objectGrid[y][x] & 0xFF) != LOCK) {
            return;
        }

        if (timedChallengeEnabled && !timerStarted) {
            timerStarted = true;
            accumulatedMs = 0L;
            runningSinceMs = nowMs;
            timerPaused = false;
            switchToBonusMusic();
        }

        objectGrid[y][x] = (byte)OBJECT_EMPTY;
    }

    /**
     * 对应 `a.H()` 顶部的真实毫秒检查。
     * 原版不是按 16Hz tick 数倒计时，而是直接使用 System.currentTimeMillis()。
     */
    void tick(long nowMs) {
        if (!timedChallengeEnabled || !timerStarted) {
            return;
        }

        long elapsed = timerPaused
                ? accumulatedMs
                : nowMs - runningSinceMs + accumulatedMs;

        if (TIME_LIMIT_MS - elapsed <= 0L) {
            startDeathSequence();
        }
    }

    /** F8 Bonus Coin 只增加本关奖励计数并从 objectGrid 删除。 */
    void collectBonusCoin(int x, int y) {
        if ((objectGrid[y][x] & 0xFF) != BONUS_COIN) {
            return;
        }
        collectedBonusCoins++;
        objectGrid[y][x] = (byte)OBJECT_EMPTY;
    }

    /**
     * F6 Golden Carrot 在 `J()` 中直接进入奖励保存 / level completion 流程，
     * 因而 timed challenge 随 gameplay 结束，不再继续检查 timeout。
     */
    void collectGoldenCarrot(int x, int y) {
        if ((objectGrid[y][x] & 0xFF) != GOLDEN_CARROT) {
            return;
        }
        timerStarted = false;
        completeBonusLevel(collectedBonusCoins);
    }

    private void switchToBonusMusic() {
        // 原版重选 `I()` 后可得到 /bonus.mid。
    }

    private void startDeathSequence() {
        // 原版统一调用 a.K()。
    }

    private void completeBonusLevel(int bonusCoins) {
        // 原版这里继续保存 Campaign 奖励；现代 Engine 只需报告地图内完成事件。
    }
}
