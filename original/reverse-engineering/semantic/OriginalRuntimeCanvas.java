import com.nokia.mid.ui.FullCanvas;

/**
 * `a.class` 的第一层语义骨架。
 *
 * 该文件只表达 MIDlet/Canvas 主循环骨架；状态、Gameplay、资源与持久化语义
 * 分别拆在 RuntimeStateMachine、各机制 semantic、MusicCatalog/DialogCatalog
 * 与 PersistentSaveFormat 中。
 */
public final class OriginalRuntimeCanvas extends FullCanvas implements Runnable {
    private final OriginalGameMidlet midlet;

    /** 对应 `a.e`。由 MIDlet destroyApp() 写入，也是主循环退出条件。 */
    public boolean shutdownRequested = false;

    /** 对应 `a.d`。hideNotify/showNotify 控制，表示 Canvas 当前可见。 */
    private boolean canvasVisible = false;

    /**
     * 对应 `a.c`：0=Music Off，1=Music On。
     * 新进程默认 1；该字段不写入 BC5Data RMS，hideNotify 也会临时关闭并释放 Player。
     */
    private byte audioEnabled;

    /** 对应 `a.aw`：0 左、1 右、2 上、3 下。 */
    private int playerDirection;

    /** 对应 `a.bC`：原版动态格 8 相循环。 */
    private int ambientPhase8;

    /** 对应 `a.bD`：原版动态格 6 相循环。 */
    private int ambientPhase6;

    /** 对应 `a.bE`：原版动态格 4 相循环。 */
    private int ambientPhase4;

    /** 对应 `a.bF`：原版动态格 3 相循环。 */
    private int ambientPhase3;

    public OriginalRuntimeCanvas(OriginalGameMidlet midlet) {
        this.midlet = midlet;
    }

    /**
     * 对应原始 `a.b()`。
     *
     * 它按当前 `a.x` 分派 RuntimeStateMachine，并以 boolean 表示本轮是否需要刷新。
     * `x==1` 的完整子系统顺序见 GameplayStepOrder / 各机制 semantic。
     */
    private boolean advanceRuntimeState() {
        throw new UnsupportedOperationException("semantic reconstruction in progress");
    }

    /** 对应原始 `a.a()`：停止、deallocate、close 当前 MIDI Player 并清 track path。 */
    private void cleanupAudioPlayer() {
        throw new UnsupportedOperationException("semantic reconstruction in progress");
    }

    /**
     * 对应 `a.run()` 的等价控制流。
     *
     * 原版每轮把实际处理耗时额外计入 10ms，再补 sleep 到 62ms；
     * 因此主循环目标周期约 62ms。
     */
    @Override
    public void run() {
        boolean needsRepaint = true;

        while (!shutdownRequested) {
            long startedAtMs = System.currentTimeMillis();

            boolean changedBeforePaint = needsRepaint | advanceRuntimeState();
            needsRepaint = changedBeforePaint;

            if (canvasVisible && changedBeforePaint) {
                needsRepaint = false;
                repaint();
                serviceRepaints();
            }

            needsRepaint = needsRepaint | advanceRuntimeState();

            long elapsedWithOriginalOverheadMs =
                System.currentTimeMillis() - startedAtMs + 10L;

            if (elapsedWithOriginalOverheadMs < 62L) {
                try {
                    Thread.sleep(62L - elapsedWithOriginalOverheadMs);
                } catch (Exception ignored) {
                    // 原版吞掉 sleep 异常并继续主循环。
                }
            }
        }

        if (audioEnabled == 1) {
            cleanupAudioPlayer();
        }
        midlet.notifyDestroyed();
    }
}
