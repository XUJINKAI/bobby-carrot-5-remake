// 研究性语义重建：来源为 UP9 a.class / player collision、a.J()、a.H()、a.a(boolean)、a.f(boolean)。
// 本文件只表达已经确认的原版字段关系，不作为可直接编译的产品源码。

public final class LockRuntime {
    private static final int OBJECT_LOCK = 0xCD;
    private static final int PERMANENT_SUPER_KEY_SLOT = 2;
    private static final int TEMP_KEY_DIALOG_ACTION = 7;
    private static final int TEMP_KEY_COST = 3;

    private static final int BONUS_MODE_11 = 11;
    private static final int BONUS_MODE_12 = 12;

    private byte[][] objectGrid;

    /** 对应原版 `de`：本关的一次性临时开锁许可。 */
    private boolean temporaryLockPermit;

    /** 对应原版持久化数组 `D[]`；slot 2 被 Lock 碰撞直接读取。 */
    private byte[] purchasedUpgrades;

    /** 对应原版 `I`：跨关保存的可消费全局计数。 */
    private int globalCurrency;

    /**
     * 对应原版 `dg`。
     *
     * Timed Bonus challenge 因 currency<3 免费获得临时 Lock permit 后，若挑战死亡，
     * 不再重开当前 Bonus mode，而是允许退出到后续正常 campaign mode。
     */
    private boolean bonusChallengeNoRetryOnDeath;

    /** 对应当前 `bU`。 */
    private int campaignMode;

    boolean canEnterLock(boolean ridingMower) {
        if (ridingMower) {
            return false;
        }
        if (temporaryLockPermit) {
            return true;
        }
        return purchasedUpgrades[PERMANENT_SUPER_KEY_SLOT] != 0;
    }

    /**
     * 对应 `a.J()` 在移动中点进入 `0xCD` 后的处理。
     * 无论靠临时 permit 还是持久 Super Key 通过，Lock 都删除；临时 permit 同时清零。
     */
    void onLockMidpointEnter(int x, int y, boolean timedBonusMap) {
        temporaryLockPermit = false;
        objectGrid[y][x] = (byte)0xFF;

        if (timedBonusMap && !isTimedChallengeRunning()) {
            startSixtySecondChallenge();
        }
    }

    /**
     * action 7：
     * - currency >= 3：扣 3，授予临时 permit，死亡仍重试当前 Bonus map；
     * - currency < 3：不扣成负数，仍授予 permit，但置 dg=true。
     */
    void acceptTemporaryKeyDialogAction(int action) {
        if (action != TEMP_KEY_DIALOG_ACTION) {
            return;
        }

        if (globalCurrency < TEMP_KEY_COST) {
            bonusChallengeNoRetryOnDeath = true;
        } else {
            globalCurrency -= TEMP_KEY_COST;
        }
        temporaryLockPermit = true;
    }

    /**
     * 对应 `H()` 的 death input：
     * - dg=false -> `ab()`，重载当前关；
     * - dg=true  -> `f(false)`，按 campaign progression 离开当前 Bonus mode。
     *
     * 已确认：11 -> 4，12 -> 7，并把 next mode 写入 `A[release-1]`。
     */
    void handleTimedBonusDeath() {
        if (!bonusChallengeNoRetryOnDeath) {
            reloadCurrentLevel();
            return;
        }

        switch (campaignMode) {
            case BONUS_MODE_11:
                campaignMode = 4;
                break;
            case BONUS_MODE_12:
                campaignMode = 7;
                break;
            default:
                throw new IllegalStateException("dg is only confirmed for timed bonus modes");
        }
        persistCampaignResumeMode(campaignMode);
        reloadCurrentCampaignMode();
    }

    private boolean isTimedChallengeRunning() {
        return false;
    }

    private void startSixtySecondChallenge() {
        // 见 TimedBonusChallenge.java。
    }

    private void reloadCurrentLevel() {}
    private void persistCampaignResumeMode(int mode) {}
    private void reloadCurrentCampaignMode() {}
}
