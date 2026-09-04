/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Display
 *  javax.microedition.lcdui.Displayable
 *  javax.microedition.midlet.MIDlet
 */
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.midlet.MIDlet;

public final class Bobby
extends MIDlet {
    public Display a = Display.getDisplay((MIDlet)this);
    private a b = new a(this);
    private Thread c = null;

    public final void destroyApp(boolean bl) {
        this.b.e = true;
    }

    public final void pauseApp() {
    }

    public final void startApp() {
        this.a.setCurrent((Displayable)this.b);
        if (this.c == null) {
            this.c = new Thread(this.b);
            this.c.start();
        }
    }
}

