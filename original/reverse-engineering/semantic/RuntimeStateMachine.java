// 研究性语义重建：来源为 UP9 a.class / a.b() 以及所有已确认的 x=... 写点。
// 本文件是顶层导航图，不作为可直接编译的产品源码。

public final class RuntimeStateMachine {
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
    static final int STATE_UNSUPPORTED_LEVEL_DOWNLOAD_NOTICE = 16;

    int runtimeState;

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
            case STATE_UNSUPPORTED_LEVEL_DOWNLOAD_NOTICE:
                return advanceUnsupportedLevelDownloadNotice();
            default:
                return false;
        }
    }

    /*
     * STATE_UNSUPPORTED_LEVEL_DOWNLOAD_NOTICE 的进入点是 `D()`，由 object 0xEB
     * 的碰撞直接调用。D() 使用 EN.dat a[111]，其原文明确说明当前 Bobby Carrot 5
     * 版本不支持 level downloads，并建议向 provider / support 查询 extra level packs。
     * 因此 state 16 在 UP9 中可以直接命名为“不支持关卡下载”滚动提示，而不是未知的
     * Dream Machine gameplay state。
     *
     * 其它已确认特殊 state：
     * - 12: Night Train scene (`A()`, train.png/train.mid)
     * - 13: Magic Code generation (`u()/w()`, sleep.png/universe.mid)
     * - 14: Universe flight reward (`p()/r()`, fly.mid)
     * - 15: special result (`s()`)
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
    private boolean advanceUnsupportedLevelDownloadNotice() { return true; }
}
