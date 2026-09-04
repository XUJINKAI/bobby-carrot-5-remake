// 研究性语义重建：来源为 UP9 a.class / player collision、a.J()、a.a(boolean)。
// 本文件只表达已经确认的原版字段关系，不作为可直接编译的产品源码。

public final class LockRuntime {
    private static final int OBJECT_LOCK = 0xCD;
    private static final int PERMANENT_SUPER_KEY_SLOT = 2;
    private static final int TEMP_KEY_DIALOG_ACTION = 7;
    private static final int TEMP_KEY_COST = 3;

    private byte[][] objectGrid;

    /** 对应原版 `de`：本关的一次性临时开锁许可。 */
    private boolean temporaryLockPermit;

    /** 对应原版持久化数组 `D[]`；slot 2 被 Lock 碰撞直接读取。 */
    private byte[] purchasedUpgrades;

    /** 对应原版 `I`：跨关保存的可消费全局计数。 */
    private int globalCurrency;

    /** 对应 `dg`；不足 3 时由 action 7 置位，其完整 campaign 后果另行恢复。 */
    private boolean specialInsufficientFundsState;

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
     *
     * 无论本次是靠临时许可还是持久 upgrade 通过，Lock 都从 objectGrid 删除；
     * 临时许可同时无条件清零，因此只能消费一次。
     */
    void onLockMidpointEnter(int x, int y, boolean timedBonusMap) {
        temporaryLockPermit = false;
        objectGrid[y][x] = (byte)0xFF;

        if (timedBonusMap && !isTimedChallengeRunning()) {
            startSixtySecondChallenge();
        }
    }

    /**
     * 对应通用确认对话 `a.a(boolean)` 的 action 7。
     *
     * 原版在 currency >= 3 时扣除 3 并授予本关临时许可；不足 3 时仍授予许可，
     * 但额外设置 `dg=true`。`dg` 会改变后续 death/关卡流程，因此这里保留原字段
     * 的独立语义，不把它解释成普通“免费钥匙”。
     */
    void acceptTemporaryKeyDialogAction(int action) {
        if (action != TEMP_KEY_DIALOG_ACTION) {
            return;
        }

        if (globalCurrency < TEMP_KEY_COST) {
            specialInsufficientFundsState = true;
        } else {
            globalCurrency -= TEMP_KEY_COST;
        }
        temporaryLockPermit = true;
    }

    private boolean isTimedChallengeRunning() {
        return false;
    }

    private void startSixtySecondChallenge() {
        // 见 TimedBonusChallenge.java。
    }
}
