// 研究性语义重建：来源为 UP9 a.class / keyPressed()、H()、generic dialog action 与 menu action 99。
// 这些是原版隐藏/debug 行为，不属于正常机关规则。

public final class HiddenCheats {
    /** ASCII key codes -> "11337799"。 */
    private static final int[] ENABLE_CHEAT_SEQUENCE = {49, 49, 51, 51, 55, 55, 57, 57};

    /** ASCII key codes -> "91337"。 */
    private static final int[] RESET_RMS_SEQUENCE = {57, 49, 51, 51, 55};

    private boolean cheatEnabled;
    private boolean starWasPressed;
    private int globalBonusCoins;
    private int remainingObjectives;

    /**
     * 两个隐藏 sequence 只在 shared Beaver Shop gameplay（archive=0, recordSlot=1）被 H() 消费。
     */
    HiddenAction consumeCompletedSequence(
        boolean inSharedBeaverShop,
        boolean cheatSequenceComplete,
        boolean resetSequenceComplete
    ) {
        if (!inSharedBeaverShop) return HiddenAction.NONE;

        if (!cheatEnabled && cheatSequenceComplete) {
            // 硬编码文本："DO YOU WANT TO ENABLE THE CHEAT?"
            return HiddenAction.CONFIRM_ENABLE_CHEAT;
        }
        if (resetSequenceComplete) {
            // 硬编码文本："DO YOU WANT TO FORMAT THE RMS AND COMPLETELY RESET THE GAME?"
            return HiddenAction.CONFIRM_FORMAT_RMS;
        }
        return HiddenAction.NONE;
    }

    /** Generic dialog action 8。 */
    void confirmEnableCheat() {
        cheatEnabled = true;
    }

    /**
     * cheatEnabled 后，release gameplay 的 pause/menu 中追加硬编码 `CHEAT!` action 99。
     * action 99 直接把剩余目标清零，并走普通 level-completion presentation/result 流程。
     */
    void activateMenuLevelCompleteCheat() {
        if (!cheatEnabled) return;
        remainingObjectives = 0;
        beginOrdinaryLevelCompletion();
    }

    /**
     * cheatEnabled 且处于 gameplay state 时：`*` 后紧接 `#` 会增加 5 个全局 Bonus Coins。
     * 任意其它键会清掉等待中的 `*` 标记。
     */
    void keyPressed(int keyCode) {
        if (!cheatEnabled) return;

        if (keyCode == 42) { // '*'
            starWasPressed = true;
            return;
        }
        if (keyCode == 35 && starWasPressed) { // '#'
            starWasPressed = false;
            globalBonusCoins += 5;
            return;
        }
        starWasPressed = false;
    }

    int[] enableSequence() {
        return ENABLE_CHEAT_SEQUENCE.clone();
    }

    int[] resetRmsSequence() {
        return RESET_RMS_SEQUENCE.clone();
    }

    private void beginOrdinaryLevelCompletion() {}

    enum HiddenAction {
        NONE,
        CONFIRM_ENABLE_CHEAT,
        CONFIRM_FORMAT_RMS,
    }
}
