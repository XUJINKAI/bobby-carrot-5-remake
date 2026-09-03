import com.nokia.mid.ui.FullCanvas;

/**
 * `a.class` 的第一层语义骨架。
 *
 * 该文件只收录已经确认的职责和字段；未知部分继续保留在
 * `decompiled/up09/a.java` 中，不在这里提前猜测。
 */
public final class OriginalRuntimeCanvas extends FullCanvas implements Runnable {
    private final OriginalGameMidlet midlet;

    /** 对应 `a.e`。由 MIDlet destroyApp() 写入，也是主循环退出条件。 */
    public boolean shutdownRequested = false;

    /** 对应 `a.d`。hideNotify/showNotify 控制，表示 Canvas 当前可见。 */
    private boolean canvasVisible = false;

    /** 对应 `a.c`。目前只确认值 1 在退出时触发清理。 */
    private byte runtimeMode;

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
     * 已确认它按当前 `a.x` 状态推进游戏/菜单状态机，并以 boolean 表示
     * 本轮是否产生需要刷新的变化。内部 gameplay 方法名仍待继续拆解。
     */
    private boolean advanceRuntimeState() {
        throw new UnsupportedOperationException("semantic reconstruction in progress");
    }

    /** 对应原始 `a.a()`；退出时在特定 runtimeMode 下执行。 */
    private void cleanupRuntime() {
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

        if (runtimeMode == 1) {
            cleanupRuntime();
        }
        midlet.notifyDestroyed();
    }
}
