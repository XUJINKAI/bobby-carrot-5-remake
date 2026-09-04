// 研究性语义重建：来源为 UP9 a.class / player collision 与 dialog action dispatcher。
// 本文件表达原版 runtime 的角色型 object 交互边界，不作为可直接编译的产品源码。

public final class CharacterInteractions {
    private static final int OBJECT_SANDMAN_HEAD = 0xDA;
    private static final int OBJECT_DREAM_MACHINE_HEAD = 0xDB;
    private static final int OBJECT_BEAVER_HEAD = 0xE7;

    private static final int OBJECT_SANDMAN_BODY = 0xEA;
    private static final int OBJECT_DREAM_MACHINE_BODY = 0xEB;
    private static final int OBJECT_BEAVER_BODY = 0xF7;

    private static final int ACTION_TEMP_LOCK_PERMIT = 7;
    private static final int ACTION_SPECIAL_9 = 9;
    private static final int ACTION_SPECIAL_10 = 10;

    private boolean timedBonusMap;
    private boolean timedBonusRunning;
    private boolean temporaryLockPermit;
    private boolean permanentSuperKeyUpgrade;
    private int globalCurrency;
    private int goldenCarrotCount;

    /** 对应原版 `bU`。其完整 scene 枚举还在恢复。 */
    private int campaignSceneMode;

    /**
     * Loader 事实：三类对象都只在 DAT 保存 Head anchor，Body 由 Loader 自动补到 y+1。
     *
     * 碰撞事实：Head 都是纯 blocking；真正的角色交互入口是 Body。
     */
    boolean interactWithObject(int objectType) {
        switch (objectType) {
            case OBJECT_SANDMAN_HEAD:
            case OBJECT_DREAM_MACHINE_HEAD:
            case OBJECT_BEAVER_HEAD:
                return false;

            case OBJECT_SANDMAN_BODY:
            case OBJECT_BEAVER_BODY:
                interactWithSharedCharacterBody();
                return false;

            case OBJECT_DREAM_MACHINE_BODY:
                enterDreamMachineDialogState();
                return false;

            default:
                return true;
        }
    }

    /**
     * `0xEA` 与 `0xF7` 在原版 collision switch 中共用同一个 case。
     * 因而 handler 的业务语义由当前 campaign scene mode 决定，而不是由 Body raw ID 决定。
     */
    private void interactWithSharedCharacterBody() {
        if (timedBonusMap) {
            interactWithBonusLockCharacter();
            return;
        }

        switch (campaignSceneMode) {
            case 1:
                // 只显示当前 globalCurrency 数量，不提供确认 action。
                showInfoDialog(-1);
                return;

            case 2:
                // 只有已有 golden carrot 时才出现 action 9。
                if (goldenCarrotCount > 0) {
                    showInfoDialog(ACTION_SPECIAL_9);
                } else {
                    showInfoDialog(-1);
                }
                return;

            case 3:
                showInfoDialog(-1);
                return;

            case 4:
                showInfoDialog(ACTION_SPECIAL_10);
                return;

            case 5:
                showInfoDialog(-1);
                return;

            default:
                return;
        }
    }

    /**
     * Timed Bonus map 中，Sandman/Beaver Body 不再走普通 scene mode；它们统一充当
     * Lock permit 交互入口。
     */
    private void interactWithBonusLockCharacter() {
        if (timedBonusRunning || temporaryLockPermit) {
            showInfoDialog(-1);
            return;
        }

        if (permanentSuperKeyUpgrade) {
            showInfoDialog(-1);
            return;
        }

        // 无永久 Super Key、也没有临时 permit 时，原版提供 action 7。
        // globalCurrency >= 3 时文案显示余额/消费信息；不足 3 时是另一条文案，
        // 但确认后仍进入同一个 action 7，具体后果见 LockRuntime.java。
        showInfoDialog(ACTION_TEMP_LOCK_PERMIT);
    }

    /**
     * Dream Machine Body `0xEB` 不共用上述角色 handler；它直接调用原版 `D()`：
     * 暂停当前 gameplay/计时，释放部分当前场景资源，打开一条独立 dialog，
     * 并把顶层 runtime state 切到 16。state 16 的完整 campaign 去向继续恢复。
     */
    private void enterDreamMachineDialogState() {
        pauseGameplay();
        unloadCurrentScenePresentation();
        openDreamMachineDialog();
        setRuntimeState(16);
    }

    private void showInfoDialog(int action) {}
    private void pauseGameplay() {}
    private void unloadCurrentScenePresentation() {}
    private void openDreamMachineDialog() {}
    private void setRuntimeState(int state) {}
}
