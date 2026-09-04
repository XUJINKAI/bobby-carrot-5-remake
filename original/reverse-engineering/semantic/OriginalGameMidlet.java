import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.midlet.MIDlet;

/**
 * `Bobby.class` 的语义化整理版本。
 *
 * 来源：decompiled/up09/Bobby.java。
 * 这里只做名称恢复和等价结构整理，不引入 BC5R Engine 设计。
 */
public final class OriginalGameMidlet extends MIDlet {
    public Display display = Display.getDisplay(this);
    private OriginalRuntimeCanvas runtime = new OriginalRuntimeCanvas(this);
    private Thread runtimeThread = null;

    public final void destroyApp(boolean unconditional) {
        runtime.shutdownRequested = true;
    }

    public final void pauseApp() {
    }

    public final void startApp() {
        display.setCurrent((Displayable) runtime);
        if (runtimeThread == null) {
            runtimeThread = new Thread(runtime);
            runtimeThread.start();
        }
    }
}
