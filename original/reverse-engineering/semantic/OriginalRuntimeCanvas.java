import com.nokia.mid.ui.FullCanvas;

/**
 * `a.class` 的第一层语义骨架。
 *
 * 该文件只收录已经确认的职责和字段；未知部分继续保留在
 * `decompiled/up09/a.java` 中，不在这里提前猜测。
 */
public final class OriginalRuntimeCanvas extends FullCanvas implements Runnable {
    private final OriginalGameMidlet midlet;

    /** 对应 `a.e`。由 MIDlet destroyApp() 写入。 */
    public boolean shutdownRequested = false;

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

    @Override
    public void run() {
        // 待从 `a.run()` 逐段恢复：主循环、输入、世界更新、绘制与约 62ms 节拍。
        throw new UnsupportedOperationException("semantic reconstruction in progress");
    }
}
