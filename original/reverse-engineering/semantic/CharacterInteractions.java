// 研究性语义重建：来源为 UP9 a.class / player collision、dialog action dispatcher
// 与 EN.dat 100..122 精准字符串索引。
// 本文件表达原版 runtime 的角色型 object 交互边界，不作为可直接编译的产品源码。

public final class CharacterInteractions {
    private static final int OBJECT_SANDMAN_HEAD = 0xDA;
    private static final int OBJECT_DREAM_MACHINE_HEAD = 0xDB;
    private static final int OBJECT_BEAVER_HEAD = 0xE7;

    private static final int OBJECT_SANDMAN_BODY = 0xEA;
    private static final int OBJECT_DREAM_MACHINE_BODY = 0xEB;
    private static final int OBJECT_BEAVER_BODY = 0xF7;

    private static final int ACTION_TEMP_LOCK_PERMIT = 7;
    private static final int ACTION_GENERATE_MAGIC_CODE = 9;
    private static final int ACTION_UNIVERSE_REWARD = 10;

    // bV==0 时 bU=1..5 是五个 shared Special Scene。
    private static final int MODE_BEAVER_SHOP = 1;
    private static final int MODE_CLOUD_9 = 2;
    private static final int MODE_DREAM_MACHINE = 3;
    private static final int MODE_DREAMLAND_REWARD = 4;
    private static final int MODE_CAMPAIGN_INTRO = 5;

    private boolean timedBonusMap;
    private boolean timedBonusRunning;
    private boolean temporaryLockPermit;
    private boolean permanentSuperKeyUpgrade;
    private int globalCurrency;
    private int goldenCarrotCount;

    /** 对应原版 `bU`。 */
    private int campaignSceneMode;

    /**
     * Loader 事实：三类对象都只在 DAT 保存 Head anchor，Body 由 Loader 自动补到 y+1。
     * Head 都是纯 blocking；真正的角色交互入口是 Body。
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
     * `0xEA` Sandman Body 与 `0xF7` Beaver Body 在 collision switch 中共用同一 case。
     * 原版根据当前 shared scene mode 决定对话，而不是根据 Body raw ID 决定业务。
     *
     * EN.dat 已给出足够直接的 scene 文案：
     * - mode 1: Beaver Shop，介绍购买物品并显示 Bonus Coin 余额；
     * - mode 2: Cloud 9，用 Golden Carrot 生成 Magic Code；
     * - mode 3: Dream Machine，授予使用 Dream Machine 的说明；
     * - mode 4: Dreamland Reward，提供 Universe of 1000 Voices 飞行奖励；
     * - mode 5: Campaign Intro，欢迎进入 Dreamland 并引导开始冒险。
     */
    private void interactWithSharedCharacterBody() {
        if (timedBonusMap) {
            interactWithBonusLockCharacter();
            return;
        }

        switch (campaignSceneMode) {
            case MODE_BEAVER_SHOP:
                showInfoDialog(-1);
                return;

            case MODE_CLOUD_9:
                if (goldenCarrotCount > 0) {
                    showInfoDialog(ACTION_GENERATE_MAGIC_CODE);
                } else {
                    showInfoDialog(-1);
                }
                return;

            case MODE_DREAM_MACHINE:
                showInfoDialog(-1);
                return;

            case MODE_DREAMLAND_REWARD:
                showInfoDialog(ACTION_UNIVERSE_REWARD);
                return;

            case MODE_CAMPAIGN_INTRO:
                showInfoDialog(-1);
                return;

            default:
                return;
        }
    }

    /**
     * Timed Bonus map 中 shared Body 改作一次性 Lock permit 入口。
     * EN.dat 明确说明目标是 1 分钟内取得 Golden Carrot；没有 Super Key 时临时 key
     * 价格为 3 Bonus Coins，不足 3 时原版仍允许请求免费例外。
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

        showInfoDialog(ACTION_TEMP_LOCK_PERMIT);
    }

    /**
     * Dream Machine Body `0xEB` 不共用上述 handler；它直接调用原版 `D()`：
     * 暂停当前 gameplay/计时，释放部分当前场景资源，打开独立 dialog，
     * 并把顶层 runtime state 切到 16。
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
