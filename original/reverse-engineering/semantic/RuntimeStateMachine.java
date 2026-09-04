// 研究性语义重建：来源为 UP9 a.class / a.b() 以及所有已确认的 x=... 写点。
// 本文件是顶层导航图，不作为可直接编译的产品源码。

public final class RuntimeStateMachine {
    // 原版字段 `a.x`。
    static final int STATE_BOOT = 0;
    static final int STATE_GAMEPLAY = 1;
    static final int STATE_DIALOG = 2;
    static final int STATE_TERMINATE = 3;
    static final int STATE_TITLE = 4;
    static final int STATE_TEXT_MODAL = 5;
    static final int STATE_LOADING_REPAINT = 6;
    static final int STATE_LEVEL_RESULT = 7;
    static final int STATE_HELP_PAGES = 8;
    static final int STATE_CONFIRM = 9;
    static final int STATE_TRANSITION = 10;
    static final int STATE_MENU = 11;
    static final int STATE_TRAIN_SCENE = 12;
    static final int STATE_CODE_SCENE = 13;
    static final int STATE_FLIGHT_SCENE = 14;
    static final int STATE_SPECIAL_RESULT = 15;
    static final int STATE_DREAM_MACHINE_DIALOG = 16;

    int runtimeState;

    /** 对应原版 `a.b()` 的顶层分派。 */
    boolean advance() {
        switch (runtimeState) {
            case STATE_BOOT:
                initializeRuntimeAndMenu();
                return true;

            case STATE_GAMEPLAY:
                return advanceGameplay();

            case STATE_DIALOG:
                return advanceGenericDialog();

            case STATE_TERMINATE:
                destroyMidlet();
                return false;

            case STATE_TITLE:
                return advanceTitleScene();

            case STATE_TEXT_MODAL:
                return advanceTextModal();

            // STATE_LOADING_REPAINT 没有常驻 update case。
            // `j()` 只临时切到 6，立即 repaint + serviceRepaints；调用者随后再进入目标 state。
            case STATE_LOADING_REPAINT:
                return false;

            case STATE_LEVEL_RESULT:
                return advanceLevelResult();

            case STATE_HELP_PAGES:
                return advanceHelpPages();

            case STATE_CONFIRM:
                return advanceConfirmScreen();

            case STATE_TRANSITION:
                return advanceTransition();

            // state 11 的列表菜单由 `dW` 分支在 switch 之前调用 `aj()`，
            // 因而正常情况下不会真正落到这个 switch case。
            case STATE_MENU:
                return false;

            case STATE_TRAIN_SCENE:
                return advanceTrainScene();

            case STATE_CODE_SCENE:
                return advanceCodeScene();

            case STATE_FLIGHT_SCENE:
                return advanceFlightScene();

            case STATE_SPECIAL_RESULT:
                return advanceSpecialResult();

            case STATE_DREAM_MACHINE_DIALOG:
                return advanceDreamMachineDialog();

            default:
                return false;
        }
    }

    /*
     * 已确认进入点：
     *
     * STATE_GAMEPLAY:
     *   level reset `ab()` 完成后由外层流程进入。
     *
     * STATE_DIALOG:
     *   `a(int action, String text, String left, String right)`。
     *
     * STATE_TITLE:
     *   `ah()`；加载 title.png，播放 title.mid。
     *
     * STATE_TEXT_MODAL:
     *   `a(String text, int top, byte completion)`。
     *
     * STATE_LOADING_REPAINT:
     *   `j()`；只负责同步绘制 Loading 文案。
     *
     * STATE_LEVEL_RESULT:
     *   `ap()`；普通关 clear 结果，构造 time / bonus / global count 文本。
     *
     * STATE_HELP_PAGES:
     *   `ar()`；进入帮助文本页。
     *
     * STATE_CONFIRM:
     *   `d(byte)`；通用 Yes/No confirm。
     *
     * STATE_MENU:
     *   初始化/暂停菜单相关流程。
     *
     * STATE_TRAIN_SCENE:
     *   `A()`；加载 train.png，播放 train.mid。
     *
     * STATE_CODE_SCENE:
     *   `u()`；加载 sleep.png、播放 universe.mid，维护 16 字符 code 与数量。
     *
     * STATE_FLIGHT_SCENE:
     *   `p()`；把 Bobby 切 airborne，播放 fly.mid，并逐段显示当前 archive 文本。
     *
     * STATE_SPECIAL_RESULT:
     *   `s()`；显示特殊 scene 完成统计。
     *
     * STATE_DREAM_MACHINE_DIALOG:
     *   `D()`；由 Dream Machine Body 0xEB 碰撞直接进入。
     */

    private void initializeRuntimeAndMenu() {}
    private boolean advanceGameplay() { return true; }
    private boolean advanceGenericDialog() { return true; }
    private void destroyMidlet() {}
    private boolean advanceTitleScene() { return true; }
    private boolean advanceTextModal() { return true; }
    private boolean advanceLevelResult() { return true; }
    private boolean advanceHelpPages() { return true; }
    private boolean advanceConfirmScreen() { return true; }
    private boolean advanceTransition() { return true; }
    private boolean advanceTrainScene() { return true; }
    private boolean advanceCodeScene() { return true; }
    private boolean advanceFlightScene() { return true; }
    private boolean advanceSpecialResult() { return true; }
    private boolean advanceDreamMachineDialog() { return true; }
}
