/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.nokia.mid.ui.FullCanvas
 *  javax.microedition.lcdui.Alert
 *  javax.microedition.lcdui.AlertType
 *  javax.microedition.lcdui.Displayable
 *  javax.microedition.lcdui.Graphics
 *  javax.microedition.lcdui.Image
 *  javax.microedition.media.Manager
 *  javax.microedition.media.Player
 *  javax.microedition.media.control.VolumeControl
 *  javax.microedition.rms.RecordStore
 */
import com.nokia.mid.ui.FullCanvas;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.FilterInputStream;
import java.io.FilterOutputStream;
import java.io.InputStream;
import java.util.Random;
import javax.microedition.lcdui.Alert;
import javax.microedition.lcdui.AlertType;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import javax.microedition.media.Manager;
import javax.microedition.media.Player;
import javax.microedition.media.control.VolumeControl;
import javax.microedition.rms.RecordStore;

/*
 * Illegal identifiers - consider using --renameillegalidents true
 */
public final class a
extends FullCanvas
implements Runnable {
    private int g = 20;
    private int h = 48;
    private int i = 48;
    private int j = 24;
    private int k = 24;
    private int l = 12;
    private int m = 12;
    private int n = 6;
    private int o = 6;
    private int p = 5;
    private int q = 5;
    private int r = 4;
    public String[] a = null;
    public String b = null;
    private Player s = null;
    public byte c;
    private Bobby t;
    private int u;
    private int v;
    private int w;
    private int x;
    private String y = "EN";
    private Random z;
    public boolean d = false;
    public boolean e = false;
    public boolean f;
    private byte[] A = new byte[4];
    private boolean[] B = new boolean[4];
    private boolean C;
    private byte[] D = new byte[7];
    private boolean E;
    private boolean F;
    private boolean G;
    private byte H;
    private short I;
    private short J;
    private long K;
    private int L;
    private String[] M = new String[5];
    private boolean N;
    private boolean O;
    private boolean P;
    private boolean Q;
    private boolean R;
    private boolean S;
    private boolean T;
    private boolean U;
    private int[] V = new int[]{49, 49, 51, 51, 55, 55, 57, 57};
    private int W = 0;
    private boolean X = false;
    private boolean Y = false;
    private short[] Z = new short[5];
    private short[] aa = new short[5];
    private byte[] ab = new byte[5];
    private int ac;
    private byte ad;
    private String ae;
    private char[] af;
    private int ag;
    private int ah;
    private String ai;
    private String aj;
    private int ak;
    private int al;
    private int am;
    private int an;
    private int ao;
    private int ap;
    private int aq;
    private int ar;
    private int as;
    private int at;
    private int au;
    private int av;
    private int aw;
    private int ax;
    private int ay;
    private int az;
    private int aA;
    private int aB;
    private int aC;
    private int aD;
    private int aE;
    private int aF;
    private int aG;
    private int aH;
    private int aI;
    private int aJ;
    private int aK;
    private int aL;
    private int aM;
    private int aN;
    private int aO;
    private int aP;
    private int aQ;
    private int aR;
    private int aS;
    private int aT;
    private byte aU;
    private byte aV;
    private byte aW;
    private byte aX;
    private byte aY;
    private byte aZ;
    private boolean ba;
    private boolean bb;
    private boolean bc;
    private boolean bd;
    private boolean be;
    private boolean bf;
    private boolean bg;
    private boolean bh;
    private boolean bi;
    private boolean bj;
    private boolean bk;
    private boolean bl;
    private int bm;
    private int bn;
    private int bo;
    private static final byte[] bp = new byte[]{94, 95, -112, -111};
    private byte bq = (byte)3;
    private final byte[] br = new byte[]{5, 10, 30, 20, 10, 25, 10};
    private byte bs;
    private int bt;
    private int bu;
    private int bv;
    private int bw;
    private byte bx;
    private boolean by;
    private int bz;
    private int bA;
    private int bB;
    private int bC;
    private int bD;
    private boolean bE;
    private int bF;
    private int bG;
    private int bH;
    private int bI;
    private int bJ;
    private int bK;
    private int bL;
    private int bM;
    private int bN;
    private int bO;
    private int bP;
    private int bQ;
    private int bR;
    private int bS;
    private int bT;
    private int bU;
    private int bV;
    private long bW;
    private long bX;
    private boolean bY;
    private int bZ;
    private int ca;
    private byte cb;
    private int cc;
    private int[] cd = new int[5];
    private int[] ce = new int[5];
    private Image cf;
    private Image cg;
    private Image ch;
    private Image ci;
    private Image cj;
    private Image ck;
    private Image cl;
    private Image cm;
    private Image cn;
    private Image[] co = new Image[10];
    private Image cp;
    private byte[][] cq;
    private byte[][] cr;
    private String cs;
    private String ct;
    private byte cu;
    private String[] cv = new String[4];
    private byte[] cw = new byte[4];
    private int cx;
    private int cy;
    private int cz;
    private byte[] cA;
    private byte[] cB;
    private byte[] cC;
    private boolean[] cD;
    private short[] cE;
    private short[] cF;
    private short cG;
    private short cH;
    private short cI;
    private short cJ;
    private short cK;
    private short cL;
    private short cM;
    private short cN;
    private short cO;
    private short cP;
    private boolean cQ;
    private boolean cR;
    private boolean cS;
    private boolean cT;
    private boolean cU;
    private boolean cV;
    private boolean cW;
    private boolean cX;
    private boolean cY;
    private boolean cZ;
    private boolean da;
    private boolean db;
    private boolean dc;
    private byte[] dd;
    private byte[] de;
    private byte[] df;
    private byte[] dg;
    private byte[] dh = new byte[5];
    private byte[] di = new byte[5];
    private byte[] dj = new byte[5];
    private int dk;
    private int dl;
    private int dm;
    private int dn;
    private byte do;
    private byte dp;
    private byte dq;
    private byte dr;
    private int ds;
    private int dt;
    private int du;
    private int dv;
    private int dw;
    private int dx;
    private int dy;
    private int dz;
    private int dA;
    private int dB;
    private boolean dC;
    private byte[][] dD;
    private byte[][] dE;
    private Image dF;
    private Graphics dG;
    private Image dH;
    private Image dI = null;
    private int dJ;
    private boolean dK;
    private int dL;
    private byte dM;
    private byte dN;
    private final short[] dO = new short[]{0, 0, 1, 3, 5, 8, 12, 17, 23, 31, 41, 53, 70, 91, 118, 153, 198, 256, 256};
    private boolean dP = false;
    private boolean dQ = false;
    private boolean dR = false;
    private boolean dS = false;
    private boolean dT = false;
    private String[] dU;
    private short[] dV;
    private byte dW;
    private byte dX;
    private byte dY;
    private byte dZ;
    private byte ea;
    private byte eb;
    private byte ec;
    private byte ed;
    private String ee;
    private int ef;
    private int eg;
    private int eh;
    private int ei;
    private String ej;
    private int ek;
    private int el;
    private int em;
    private int en;
    private int eo;
    private int ep;
    private int eq;
    private int er;
    private int es;
    private int et;
    private boolean eu;
    private byte ev;
    private String ew;
    private byte ex = 0;
    private short[] ey = new short[]{59, 58, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80};
    private byte[][] ez = new byte[][]{new byte[0], new byte[0], {-54, -52}, {-57, -56}, {-106}, {-36, -96, -35}, {-72, -74, -94}, {-19}, {-61, -58, -65, -62}, {-80, -81}, {-71, -69, -66, -67, -92}, {89, 87, -90}, {-20}, {-13}, {-12, -11}, {-29, -24, -40, -39}, {-79, -78, -76, -77}, {-44, -43, -42}, {-32, -30, -14, -15}, {-48, -45, -87, -86}, {-49, -33}, {-97, 124}, {-10}};
    private byte eA;

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public final void a(String string) {
        int n = 0;
        FilterInputStream filterInputStream = null;
        this.a = null;
        try {
            filterInputStream = new DataInputStream(this.getClass().getResourceAsStream(string));
            n = ((DataInputStream)filterInputStream).readShort();
            this.a = new String[n];
            for (int i = 0; i < n; ++i) {
                this.a[i] = ((DataInputStream)filterInputStream).readUTF();
            }
        }
        catch (Exception exception) {
            this.c();
        }
        finally {
            if (filterInputStream != null) {
                try {
                    filterInputStream.close();
                }
                catch (Exception exception) {}
            }
        }
    }

    public final void a(String string, int n, boolean bl) {
        if (bl) {
            if (this.b != null && this.b.compareTo(string) == 0) {
                return;
            }
        } else {
            this.b = null;
        }
        this.a();
        try {
            InputStream inputStream = this.getClass().getResourceAsStream(string);
            this.s = Manager.createPlayer((InputStream)inputStream, (String)"audio/midi");
            this.s.setLoopCount(bl ? -1 : 1);
            this.s.realize();
            try {
                VolumeControl volumeControl = (VolumeControl)this.s.getControl("VolumeControl");
                if (volumeControl != null) {
                    volumeControl.setLevel(n > 0 ? n * 25 - (5 - n) * 5 : 0);
                }
            }
            catch (Exception exception) {
                // empty catch block
            }
            this.s.prefetch();
            this.s.start();
            this.b = string;
            try {
                Thread.sleep(250L);
            }
            catch (Exception exception) {}
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    public final void a() {
        if (this.s != null) {
            try {
                this.s.stop();
                this.s.deallocate();
                this.s.close();
                try {
                    Thread.sleep(250L);
                }
                catch (Throwable throwable) {}
            }
            catch (Throwable throwable) {
                // empty catch block
            }
            this.s = null;
        }
        this.b = null;
    }

    public a(Bobby bobby) {
        this.t = bobby;
        this.a(this.y + ".dat");
        this.z = new Random(System.currentTimeMillis());
        this.c = 1;
        this.u = this.getWidth();
        this.v = this.getHeight();
        this.w = this.v - 2 - 16 - 6;
        this.b(this.u, this.v, true);
        this.cf = this.a(this.cf, "/font.png");
        this.dH = this.a(this.dH, "/logo.png");
        this.bZ = 0;
        this.cb = (byte)-1;
        this.a(true, 0);
        this.x = 10;
    }

    private final void c() {
        Alert alert = new Alert("Error", this.a[51], null, AlertType.ERROR);
        alert.setTimeout(-2);
        this.t.a.setCurrent(alert, (Displayable)this);
        while (!this.R) {
            try {
                Thread.sleep(50L);
            }
            catch (Exception exception) {}
        }
        this.t.destroyApp(true);
    }

    public void hideNotify() {
        if (this.d) {
            this.d = false;
            if (this.c == 1 && this.x != 16) {
                this.a();
                this.c = 0;
            }
        }
        if (!this.dQ) {
            this.U = false;
            this.dQ = true;
            this.k();
        }
    }

    public void showNotify() {
        if (!this.d && this.dU != null) {
            for (int i = 0; i < this.dY; ++i) {
                if (this.dV[i] != 11) continue;
                this.dU[i] = this.a[4] + this.a[this.c == 1 ? 2 : 3];
            }
        }
        this.d = true;
    }

    public void run() {
        boolean bl = true;
        while (!this.e) {
            long l = System.currentTimeMillis();
            if (this.d && (bl |= this.b())) {
                bl = false;
                this.repaint();
                this.serviceRepaints();
            }
            bl |= this.b();
            long l2 = System.currentTimeMillis() - l + 10L;
            if (l2 >= 62L) continue;
            try {
                Thread.sleep(62L - l2);
            }
            catch (Exception exception) {}
        }
        if (this.c == 1) {
            this.a();
        }
        this.t.notifyDestroyed();
    }

    private final void d() {
        this.dZ = (byte)((this.w - 26) / 31);
        this.C = false;
        this.e();
        String string = this.y;
        this.f();
        if (string.compareTo(this.y) != 0) {
            this.a(this.y + ".dat");
        }
        this.aa();
        this.i();
        this.cg = this.a(this.cg, "/numbers.png");
        this.ch = this.a(this.ch, "/arrows.png");
        this.cj = this.a(this.cj, "/misc.png");
        this.ck = this.a(this.ck, "/ts.png");
        this.cl = this.a(this.cl, "/mow.png");
        this.ac();
        if (!this.f) {
            this.d((byte)2);
        } else {
            this.R = false;
            this.T = false;
            this.S = false;
            this.x = 11;
            this.c((byte)2, (byte)-1);
        }
    }

    private final void e() {
        this.f = false;
        try {
            RecordStore recordStore = null;
            int n = -1;
            try {
                recordStore = RecordStore.openRecordStore((String)"BC5Data", (boolean)true);
                n = recordStore.getNumRecords();
            }
            catch (Exception exception) {
                // empty catch block
            }
            if (n != 1) {
                int n2;
                this.f = true;
                if (n != 0) {
                    if (recordStore != null) {
                        recordStore.closeRecordStore();
                    }
                    RecordStore.deleteRecordStore((String)"BC5Data");
                    recordStore = RecordStore.openRecordStore((String)"BC5Data", (boolean)true);
                }
                for (n2 = 0; n2 < 4; ++n2) {
                    this.A[n2] = 0;
                    this.B[n2] = false;
                }
                for (n2 = 0; n2 < this.D.length; ++n2) {
                    this.D[n2] = 0;
                }
                this.E = false;
                this.F = false;
                this.H = 0;
                this.I = 0;
                this.J = 0;
                this.K = 0L;
                this.L = this.z.nextInt();
                for (n2 = 0; n2 < this.M.length; ++n2) {
                    this.M[n2] = "";
                }
                this.G = false;
                byte[] byArray = this.h();
                recordStore.addRecord(byArray, 0, byArray.length);
            }
            recordStore.closeRecordStore();
        }
        catch (Exception exception) {
            this.c();
        }
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private final void f() {
        ByteArrayInputStream byteArrayInputStream = null;
        FilterInputStream filterInputStream = null;
        try {
            int n;
            byteArrayInputStream = new ByteArrayInputStream(this.a("BC5Data", 1));
            filterInputStream = new DataInputStream(byteArrayInputStream);
            this.y = ((DataInputStream)filterInputStream).readUTF();
            this.bq = ((DataInputStream)filterInputStream).readByte();
            for (n = 0; n < 4; ++n) {
                this.A[n] = ((DataInputStream)filterInputStream).readByte();
                this.B[n] = ((DataInputStream)filterInputStream).readBoolean();
            }
            for (n = 0; n < this.D.length; ++n) {
                this.D[n] = ((DataInputStream)filterInputStream).readByte();
            }
            this.E = ((DataInputStream)filterInputStream).readBoolean();
            this.F = ((DataInputStream)filterInputStream).readBoolean();
            this.H = ((DataInputStream)filterInputStream).readByte();
            this.I = ((DataInputStream)filterInputStream).readShort();
            this.J = ((DataInputStream)filterInputStream).readShort();
            this.K = ((DataInputStream)filterInputStream).readLong();
            this.L = ((DataInputStream)filterInputStream).readInt();
            for (n = 0; n < this.M.length; ++n) {
                this.M[n] = ((DataInputStream)filterInputStream).readUTF();
            }
            this.G = ((DataInputStream)filterInputStream).readBoolean();
        }
        catch (Exception exception) {
            this.c();
        }
        finally {
            if (filterInputStream != null) {
                try {
                    filterInputStream.close();
                }
                catch (Exception exception) {}
                filterInputStream = null;
            }
            if (byteArrayInputStream != null) {
                try {
                    byteArrayInputStream.close();
                }
                catch (Exception exception) {}
                byteArrayInputStream = null;
            }
        }
    }

    private final void g() {
        this.a("BC5Data", 1, this.h());
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private final byte[] h() {
        byte[] byArray = null;
        ByteArrayOutputStream byteArrayOutputStream = null;
        FilterOutputStream filterOutputStream = null;
        try {
            int n;
            byteArrayOutputStream = new ByteArrayOutputStream();
            filterOutputStream = new DataOutputStream(byteArrayOutputStream);
            ((DataOutputStream)filterOutputStream).writeUTF(this.y);
            ((DataOutputStream)filterOutputStream).writeByte(this.bq);
            for (n = 0; n < 4; ++n) {
                ((DataOutputStream)filterOutputStream).writeByte(this.A[n]);
                ((DataOutputStream)filterOutputStream).writeBoolean(this.B[n]);
            }
            for (n = 0; n < this.D.length; ++n) {
                ((DataOutputStream)filterOutputStream).writeByte(this.D[n]);
            }
            ((DataOutputStream)filterOutputStream).writeBoolean(this.E);
            ((DataOutputStream)filterOutputStream).writeBoolean(this.F);
            ((DataOutputStream)filterOutputStream).writeByte(this.H);
            ((DataOutputStream)filterOutputStream).writeShort(this.I);
            ((DataOutputStream)filterOutputStream).writeShort(this.J);
            ((DataOutputStream)filterOutputStream).writeLong(this.K);
            ((DataOutputStream)filterOutputStream).writeInt(this.L);
            for (n = 0; n < this.M.length; ++n) {
                ((DataOutputStream)filterOutputStream).writeUTF(this.M[n]);
            }
            ((DataOutputStream)filterOutputStream).writeBoolean(this.G);
            byArray = byteArrayOutputStream.toByteArray();
        }
        catch (Exception exception) {
            this.c();
        }
        finally {
            if (filterOutputStream != null) {
                try {
                    filterOutputStream.close();
                }
                catch (Exception exception) {}
                filterOutputStream = null;
            }
            if (byteArrayOutputStream != null) {
                try {
                    byteArrayOutputStream.close();
                }
                catch (Exception exception) {}
                byteArrayOutputStream = null;
            }
        }
        return byArray;
    }

    private final byte[] a(String string, int n) {
        byte[] byArray = null;
        try {
            RecordStore recordStore = RecordStore.openRecordStore((String)string, (boolean)false);
            byArray = recordStore.getRecord(n);
            recordStore.closeRecordStore();
        }
        catch (Exception exception) {
            try {
                RecordStore.deleteRecordStore((String)string);
            }
            catch (Exception exception2) {
                // empty catch block
            }
            this.c();
        }
        return byArray;
    }

    private final void a(String string, int n, byte[] byArray) {
        try {
            RecordStore recordStore = RecordStore.openRecordStore((String)string, (boolean)false);
            recordStore.setRecord(n, byArray, 0, byArray.length);
            recordStore.closeRecordStore();
        }
        catch (Exception exception) {
            try {
                RecordStore.deleteRecordStore((String)string);
            }
            catch (Exception exception2) {
                // empty catch block
            }
            this.c();
        }
    }

    private final void i() {
        this.x = 6;
        this.repaint();
        this.serviceRepaints();
    }

    public final void keyPressed(int n) {
        if (n == 0) {
            return;
        }
        if (!this.X) {
            if (n == this.V[this.W]) {
                ++this.W;
                if (this.W >= this.V.length) {
                    this.W = 0;
                    this.X = true;
                }
            } else {
                this.W = 0;
            }
        }
        if (this.x == 1 && this.C) {
            if (n == 42) {
                this.Y = true;
            } else if (n == 35) {
                if (this.Y) {
                    this.Y = false;
                    this.I = (short)(this.I + 5);
                }
            } else {
                this.Y = false;
            }
        }
        this.U = true;
        if (n == -6) {
            this.S = true;
            return;
        }
        if (n == -7) {
            this.T = true;
            return;
        }
        if (n == 50) {
            this.N = true;
        } else if (n == 56) {
            this.O = true;
        } else if (n == 52) {
            this.P = true;
        } else if (n == 54) {
            this.Q = true;
        } else if (n == 53) {
            this.R = true;
        } else if (n == -1) {
            this.N = true;
        } else if (n == -2) {
            this.O = true;
        } else if (n == -3) {
            this.P = true;
        } else if (n == -4) {
            this.Q = true;
        } else if (n == -5) {
            this.R = true;
        }
    }

    public final void keyReleased(int n) {
        if (n == 0) {
            return;
        }
        if (n == -6) {
            this.S = false;
            return;
        }
        if (n == -7) {
            this.T = false;
            return;
        }
        if (n == 50) {
            this.N = false;
        } else if (n == 56) {
            this.O = false;
        } else if (n == 52) {
            this.P = false;
        } else if (n == 54) {
            this.Q = false;
        } else if (n == 53) {
            this.R = false;
        } else if (n == -1) {
            this.N = false;
        } else if (n == -2) {
            this.O = false;
        } else if (n == -3) {
            this.P = false;
        } else if (n == -4) {
            this.Q = false;
        } else if (n == -5) {
            this.R = false;
        }
    }

    private final void a(Graphics graphics) {
        int n;
        this.d(graphics, this.bF, this.bG);
        this.c(graphics, this.bF, this.bG);
        if (this.bn != -1 && this.bm % 8 >= 4) {
            this.a(graphics, true, (byte)-8, this.bn - this.bF, this.bo - this.bG);
        }
        this.b(graphics, this.bF, this.bG);
        if (this.cW) {
            for (n = 0; n < 3; ++n) {
                this.a(graphics, false, (byte)(52 + this.bC), this.cG * this.h - this.bF, this.cH * this.i - this.k - this.i * n - this.bG);
            }
        }
        if (this.cX) {
            for (n = 0; n < 3; ++n) {
                this.a(graphics, false, (byte)(52 + this.bC), this.cI * this.h - this.bF, this.cJ * this.i + this.k + this.i * n - this.bG);
            }
        }
        if (this.cY) {
            for (n = 0; n < 3; ++n) {
                this.a(graphics, false, (byte)(55 + this.bC), this.cK * this.h - this.j - this.h * n - this.bF, this.cL * this.i - this.bG);
            }
        }
        if (this.cZ) {
            for (n = 0; n < 3; ++n) {
                this.a(graphics, false, (byte)(55 + this.bC), this.cM * this.h + this.j + this.h * n - this.bF, this.cN * this.i - this.bG);
            }
        }
        this.a(graphics, this.bF, this.bG);
        if (this.do > 0) {
            this.b(graphics, this.ci, this.bs < 4 ? 282 : 310, 0, 28, 28, this.dl - 14 - this.bF, this.dm - 14 - this.bG);
        }
        if (this.ax > 0 && this.ay >= 4) {
            int n2;
            int n3;
            int n4;
            switch (this.aV) {
                case 0: {
                    n4 = 82;
                    n3 = 39;
                    n2 = 37;
                    break;
                }
                case 1: {
                    n4 = 121;
                    n3 = 22;
                    n2 = 35;
                    break;
                }
                case 2: {
                    n4 = 143;
                    n3 = 36;
                    n2 = 36;
                    break;
                }
                case 3: {
                    n4 = 179;
                    n3 = 37;
                    n2 = 38;
                    break;
                }
                default: {
                    n4 = 247;
                    n3 = 35;
                    n2 = 36;
                }
            }
            n = this.am + (this.h - n3 >> 1);
            int n5 = this.an - 1 + -36 - n2;
            if (n5 - this.bG < 0) {
                n5 += n2 + 72 + 2;
            }
            this.b(graphics, this.ci, n4, 0, n3, n2, n - this.bF, n5 - this.bG);
        }
        if (this.cS) {
            for (n = 0; n < 5; ++n) {
                this.b(graphics, this.ci, 338, 0, 12, 8, this.cd[n] >> this.r, this.ce[n] >> this.r);
            }
        } else {
            this.b(graphics, this.cm, 0, this.bx / 3 * 24, 24, 24, (this.bt >> this.r) - this.bF, (this.bu >> this.r) - this.bG);
        }
        this.b(graphics);
        if (this.aX != -1) {
            this.b(graphics, this.cn, this.aX * 48, 0, 48, 48, this.u - 48 >> 1, this.v - 48 >> 1);
        }
        if (this.cb > 0) {
            this.c(graphics);
        }
        if (!this.dS) {
            if (this.dQ) {
                this.a(graphics, this.a[37], (byte)1, 0);
            } else if (this.ec > 0) {
                this.a(graphics, this.ee, this.ed, 0);
            } else if (this.at == 5) {
                this.a(graphics, this.a[this.aX == -1 ? 53 : 54], (byte)(this.aX != -1 ? 1 : 0), 0);
            }
        }
    }

    private final void b(Graphics graphics) {
        int n = 2;
        int n2 = 2;
        if (this.bS != 0) {
            long l = !this.bY ? System.currentTimeMillis() - this.bX + this.bW : this.bW;
            if (this.cR) {
                if (this.db) {
                    if ((l = 60000L - l) < 0L) {
                        l = 0L;
                    }
                } else {
                    l = 60000L;
                }
            }
            int n3 = (int)l / 60000;
            long l2 = l % 60000L;
            this.a(graphics, n, n2, n3, 2);
            int n4 = (int)l2 / 1000;
            this.a(graphics, n += 32, n2, n4, 2);
            if (this.bY || n4 % 2 == 0) {
                graphics.setClip(n -= 6, n2, 5, 13);
                graphics.drawImage(this.cg, n - 120, n2, 20);
            }
            n = this.u - (this.cQ ? 40 : 31) - 2;
            graphics.setClip(n, n2, this.cQ ? 40 : 31, this.cQ ? 38 : 38);
            graphics.drawImage(this.ci, n - (this.cQ ? 42 : 216), n2, 20);
            this.a(graphics, n -= 28, n2 + ((this.cQ ? 40 : 31) - 13 >> 1), this.cy, 2);
        }
        if (this.dR) {
            n = this.u - 42 >> 1;
            graphics.setClip(n, n2, 42, 38);
            graphics.drawImage(this.ci, n - 0, n2, 20);
        }
        if (this.bS != 0) {
            n = this.u;
            n2 += (this.cQ ? 38 : 38) + 2;
            if (this.cT) {
                graphics.setClip(n -= 41, n2, 39, 37);
                graphics.drawImage(this.ci, n - 82, n2, 20);
            }
            if (this.cU) {
                graphics.setClip(n -= 38, n2, 36, 36);
                graphics.drawImage(this.ci, n - 143, n2, 20);
            }
            if (this.cV) {
                graphics.setClip(n -= 39, n2, 37, 38);
                graphics.drawImage(this.ci, n - 179, n2, 20);
            }
            if (this.cz > 0) {
                graphics.setClip(n -= 37, n2, 35, 36);
                graphics.drawImage(this.ci, n - 247, n2, 20);
            }
            if (this.da || this.D[2] > 0) {
                graphics.setClip(n -= 24, n2, 22, 35);
                graphics.drawImage(this.ci, n - 121, n2, 20);
            }
        }
    }

    private final void a(Graphics graphics, Image image, int n, int n2, int n3, int n4, int n5, int n6) {
        this.b(graphics, image, n, n2, n3, n4, n5, n6);
        if (n3 + n5 < this.u) {
            this.b(graphics, image, n, n2, n3, n4, 384 + n5, n6);
        }
    }

    public final void paint(Graphics graphics) {
        try {
            block1 : switch (this.x) {
                case 1: {
                    this.a(graphics);
                    break;
                }
                case 2: {
                    this.a(graphics);
                    this.a(graphics, 22935, 10370, true, false, true, true);
                    this.a(graphics, this.ai, this.aj, true);
                    return;
                }
                case 4: {
                    this.d(graphics, this.bF, this.bG);
                    this.c(graphics, 0, 0);
                    this.a(graphics, 0, 0);
                    graphics.setClip(0, 0, this.u, this.v);
                    graphics.drawImage(this.dH, this.u >> 1, this.w - this.dH.getHeight() - this.i - 72 >> 1, 17);
                    if (!this.dS && this.dK) {
                        this.a(graphics, this.a[81], (byte)3, this.v - (this.g + 10) - 5);
                    }
                    if (this.cb <= 0) break;
                    this.c(graphics);
                    break;
                }
                case 5: {
                    this.a(graphics, 22935, 10370, true, true, true, true);
                    this.a(graphics, this.ev == 0 ? this.a[31] : null, this.ev != 0 ? this.a[29] : null, true);
                    break;
                }
                case 6: {
                    graphics.setClip(0, 0, this.u, this.v);
                    graphics.setColor(0);
                    graphics.fillRect(0, 0, this.u, this.v);
                    this.a(graphics, this.a[38], (byte)0, 0);
                    return;
                }
                case 7: {
                    if (this.cb > 0) {
                        this.a(graphics);
                    } else {
                        graphics.setColor(0);
                        graphics.fillRect(0, 0, this.u, this.v);
                    }
                    if (this.ej == null) break;
                    this.d(graphics);
                    this.a(graphics, this.a[31], null, true);
                    break;
                }
                case 8: {
                    this.e(graphics);
                    break;
                }
                case 9: {
                    this.a(graphics, 22935, 10370, true, true, true, true);
                    switch (this.eA) {
                        case 0: 
                        case 1: 
                        case 2: {
                            this.a(graphics, this.a[32], this.a[33], true);
                            break block1;
                        }
                    }
                    this.a(graphics, this.a[30], null, true);
                    break;
                }
                case 10: {
                    graphics.setColor(0xFFFFFF);
                    graphics.fillRect(0, 0, this.u, this.v);
                    this.b(graphics, this.dH, 0, this.bZ * 100, 176, 100, (this.u - 176 >> 1) + (this.dM == 1 ? -this.e(this.u) : this.e(this.u)), this.v - 100 >> 1);
                    break;
                }
                case 11: {
                    graphics.setColor(0);
                    graphics.fillRect(0, 0, this.u, this.v);
                    break;
                }
                case 12: {
                    graphics.setClip(0, 0, this.u, this.v);
                    graphics.setColor(1259130);
                    graphics.fillRect(0, 0, this.u, this.v);
                    this.b(graphics, this.dI, 0, 0, 384, 96, 0, 0);
                    this.a(graphics, this.dI, 0, 96, 384, 37, -(this.ag >> 4), 59);
                    this.b(graphics, this.dI, 0, 153, 384, 54, 0, 34);
                    this.a(graphics, this.dI, 0, 133, 384, 20, -(this.ah >> 4), 76);
                    if (this.cb > 0) {
                        this.c(graphics);
                    }
                    if (this.dY > 0) {
                        this.a(graphics, true);
                    } else {
                        this.a(graphics, 22935, 10370, false, false, true, true);
                        this.a(graphics, null, this.a[29], false);
                    }
                    return;
                }
                case 13: {
                    this.d(graphics, this.bF, this.bG);
                    this.c(graphics, 0, 0);
                    graphics.setClip(0, 0, this.u, this.v);
                    graphics.drawImage(this.dH, this.u >> 1, this.v, 33);
                    int n = this.u - this.h - ((this.ae.length() - 1) * 12 + 10) >> 1;
                    int n2 = this.i >> 1;
                    this.a(graphics, true, (byte)-10, n, n2);
                    this.a(this.ae, graphics, n + this.h, n2 + (this.i - 16 >> 1), false);
                    this.a(graphics, 22935, 10370, false, false, false, false);
                    if (this.cb > 0) {
                        this.c(graphics);
                    }
                    return;
                }
                case 14: {
                    this.d(graphics, this.bF, this.bG);
                    this.c(graphics, 0, 0);
                    if (this.ao == -1) {
                        this.a(graphics, 0, 0);
                        this.a(graphics, 22935, 10370, false, false, false, true);
                    } else {
                        this.a(graphics, true, (byte)-10, this.ao, this.ap);
                        this.a(graphics, 0, 0);
                    }
                    if (this.cb > 0) {
                        this.c(graphics);
                    }
                    return;
                }
                case 15: {
                    graphics.setClip(0, 0, this.u, this.v);
                    graphics.setColor(1259130);
                    graphics.fillRect(0, 0, this.u, this.v);
                    this.a(graphics, 22935, 10370, false, false, true, true);
                    this.a(graphics, true, (byte)-10, this.u - this.h >> 1, this.i >> 1);
                    if (this.cb > 0) {
                        this.c(graphics);
                    }
                    this.a(graphics, this.a[31], null, false);
                    return;
                }
                case 16: {
                    this.a(graphics, 22935, 10370, true, true, true, true);
                    this.a(graphics, this.ai, this.aj, true);
                    return;
                }
            }
            if (this.dS) {
                this.a(graphics, true);
            }
            if (this.dT && this.cb == 0) {
                this.b(graphics, this.ch, 0, 9, 17, 9, 2, this.v - 9 - 2);
            }
        }
        catch (Throwable throwable) {
            // empty catch block
        }
    }

    private final void a(Graphics graphics, boolean bl, byte by, int n, int n2) {
        int n3 = bl ? 4 : 2;
        int n4 = (by & 0xFF) >> n3;
        int n5 = n4 * this.i;
        int n6 = ((by & 0xFF) - (n4 << n3)) * this.h;
        this.b(graphics, bl ? this.ck : this.cp, n6, n5, this.h, this.i, n, n2);
    }

    private final void c(Graphics graphics) {
        int n = this.bZ;
        int n2 = this.bZ;
        int n3 = (this.v + this.i - 1) / this.i;
        int n4 = (this.u + this.h - 1) / this.h;
        graphics.setClip(0, 0, this.u, this.v);
        graphics.setColor(0);
        switch (this.cb) {
            case 1: {
                int n5;
                int n6 = (n3 - 1) * this.i;
                int n7 = 0;
                for (n5 = 0; n5 < n4; ++n5) {
                    graphics.fillRect(n7, 0, this.h - n2, this.v);
                    if ((n2 -= 3) < 0) {
                        n2 = 0;
                    }
                    n7 += this.h;
                }
                for (n5 = 0; n5 < n3; ++n5) {
                    graphics.fillRect(0, n6, this.u, this.i - n);
                    if ((n -= 3) < 0) {
                        n = 0;
                    }
                    n6 -= this.i;
                }
                if (n < this.i || n2 < this.h) break;
                this.cb = 0;
                break;
            }
            case 2: {
                int n8;
                int n9 = 0;
                int n10 = (n4 - 1) * this.h;
                for (n8 = 0; n8 < n4; ++n8) {
                    graphics.fillRect(n10, 0, n2, this.v);
                    if ((n2 -= 3) < 0) {
                        n2 = 0;
                    }
                    n10 -= this.h;
                }
                for (n8 = 0; n8 < n3; ++n8) {
                    graphics.fillRect(0, n9, this.u, n);
                    if ((n -= 3) < 0) {
                        n = 0;
                    }
                    n9 += this.i;
                }
                if (n < this.i || n2 < this.h) break;
                this.cb = 0;
            }
        }
    }

    private final void j() {
        this.bZ += 3;
    }

    private final void a(Graphics graphics, int n, int n2) {
        if (this.bf) {
            int n3;
            int n4;
            int n5;
            boolean bl = true;
            int n6 = 0;
            switch (this.at) {
                case 0: {
                    n5 = 60;
                    n4 = -6;
                    n3 = 0;
                    n6 = this.h;
                    break;
                }
                case 1: {
                    n5 = 60;
                    n4 = -6;
                    n3 = n5;
                    n6 = -this.h;
                    break;
                }
                case 2: {
                    n5 = 48;
                    n4 = 0;
                    n3 = 120;
                    bl = false;
                    break;
                }
                default: {
                    n5 = 48;
                    n4 = 0;
                    n3 = 120 + n5;
                }
            }
            int n7 = 83;
            int n8 = -48;
            if ((this.aK > 0 || this.bh) && bl) {
                this.a(graphics, n6, n, n2);
            }
            this.b(graphics, this.co[7], n3, this.as * n7, n5, n7, this.am + n4 - n, this.an + n8 - n2);
            if ((this.aK > 0 || this.bh) && !bl) {
                this.a(graphics, n6, n, n2);
            }
        } else if (this.bj) {
            int n9;
            switch (this.at) {
                case 0: {
                    n9 = 0;
                    break;
                }
                case 1: {
                    n9 = 120;
                    break;
                }
                case 2: {
                    n9 = 240;
                    break;
                }
                default: {
                    n9 = 360;
                }
            }
            this.b(graphics, this.co[9], n9, 0, 120, 72, this.am + -36 - n, this.an + -36 - this.aT - n2);
        } else if (this.aZ > 0) {
            int n10;
            switch (this.at) {
                case 0: {
                    n10 = 0;
                    break;
                }
                case 1: {
                    n10 = 72;
                    break;
                }
                case 2: {
                    n10 = 144;
                    break;
                }
                default: {
                    n10 = 216;
                }
            }
            this.b(graphics, this.co[8], n10, this.as / 3 * 72, 72, 72, this.am + -12 - n, this.an + -36 - this.aT - n2);
        } else {
            int n11;
            int n12;
            int n13;
            int n14;
            boolean bl = false;
            int n15 = 0;
            if (this.at == 5) {
                n14 = 48;
                n13 = 72;
                n12 = 0;
                n11 = -36;
            } else {
                n14 = 48;
                n13 = 72;
                n12 = 0;
                n11 = -36;
                if (this.aK > 0) {
                    switch (!this.bg ? this.at : 2) {
                        case 0: {
                            n15 = this.h - this.l;
                            break;
                        }
                        case 1: {
                            n15 = -this.h + this.l;
                            break;
                        }
                        case 3: {
                            bl = true;
                        }
                    }
                }
            }
            int n16 = this.am + n12;
            int n17 = this.an + n11 - this.aT;
            if (this.aK > 0 && bl) {
                this.a(graphics, n15, n, n2);
            }
            this.b(graphics, this.co[!this.bg ? this.at : 2], this.as * n14, 0, n14, n13, n16 - n, n17 - n2);
            if (this.aK > 0 && !bl) {
                this.a(graphics, n15, n, n2);
            }
        }
    }

    private final void a(Graphics graphics, int n, int n2, int n3) {
        this.b(graphics, this.cl, this.aA / 3 * this.h, this.bh ? 0 : this.i, this.h, this.i, this.am + n - n2, this.an - this.m - n3);
    }

    private final void b(Graphics graphics, int n, int n2) {
        for (int i = 0; i < this.cx; ++i) {
            int n3 = this.cA[i] & 0xFF;
            int n4 = n3 >> 4;
            int n5 = n4 * this.i;
            int n6 = (n3 - (n4 << 4)) * this.h;
            int n7 = this.cE[i] - n;
            int n8 = this.cF[i] - n2;
            this.b(graphics, this.ck, n6, n5, this.h, this.i, n7, n8);
        }
    }

    private final void b(Graphics graphics, Image image, int n, int n2, int n3, int n4, int n5, int n6) {
        graphics.setClip(n5, n6, n3, n4);
        graphics.drawImage(image, n5 - n, n6 - n2, 20);
    }

    private final void a(byte by, byte by2, int n, int n2) {
        this.dG.setClip(n, n2, this.h, this.i);
        this.a(by, n, n2);
        if (by == -1 || by == -57) {
            return;
        }
        this.a(by2, n, n2);
    }

    private final void a(byte by, int n, int n2) {
        int n3;
        boolean bl = false;
        if (this.bB != 0 && by == -106 && this.cy == 0) {
            n3 = 0 + this.bB - 1;
        } else if (this.bB != 0 && by == -8 && this.bE) {
            n3 = 15 + this.bB - 1;
        } else if (this.bA != 0 && by == -12) {
            n3 = 26 + this.bA - 1;
        } else if (this.bz != 0 && by == 86) {
            n3 = 39 + this.bz - 1;
        } else if (this.bC != 0 && (by == 88 || by == 87 || by == 90 || by == 89 || by == 91 || by == 92 || by == 93)) {
            switch (by) {
                case 88: {
                    n3 = 31;
                    break;
                }
                case 87: {
                    n3 = 33;
                    break;
                }
                case 90: {
                    n3 = 35;
                    break;
                }
                case 89: {
                    n3 = 37;
                    break;
                }
                case 91: {
                    n3 = 46;
                    break;
                }
                case 92: {
                    n3 = 48;
                    break;
                }
                default: {
                    n3 = 50;
                }
            }
            n3 += this.bC - 1;
        } else if (this.bB != 0 && (by == -75 || by == -74 || by == -73 || by == -72)) {
            switch (by) {
                case -75: {
                    n3 = 3;
                    break;
                }
                case -74: {
                    n3 = 6;
                    break;
                }
                case -73: {
                    n3 = 9;
                    break;
                }
                default: {
                    n3 = 12;
                }
            }
            n3 += this.bB - 1;
        } else if (this.cW && this.bC != 0 && by == -48) {
            n3 = 18 + this.bC - 1;
        } else if (this.cX && this.bC != 0 && by == -47) {
            n3 = 20 + this.bC - 1;
        } else if (this.cY && this.bC != 0 && by == -46) {
            n3 = 22 + this.bC - 1;
        } else if (this.cZ && this.bC != 0 && by == -45) {
            n3 = 24 + this.bC - 1;
        } else {
            bl = true;
            n3 = by & 0xFF;
        }
        int n4 = bl ? 4 : 2;
        int n5 = n3 >> n4;
        int n6 = n5 * this.i;
        int n7 = (n3 - (n5 << n4)) * this.h;
        this.dG.drawImage(bl ? this.ck : this.cp, n - n7, n2 - n6, 20);
    }

    private final void k() {
        this.bW += System.currentTimeMillis() - this.bX;
        this.bY = true;
    }

    private final void l() {
        this.bX = System.currentTimeMillis();
        this.bY = false;
    }

    public final boolean b() {
        try {
            if (this.cb > 0) {
                this.j();
            }
            if (this.dS) {
                return this.ag() || this.cb > 0;
            }
            switch (this.x) {
                case 0: {
                    this.d();
                    return true;
                }
                case 1: {
                    if (this.dT && this.S && this.cb == 0) {
                        this.S = false;
                        this.c((byte)1, (byte)-1);
                        return true;
                    }
                    if (this.dQ) {
                        if (this.U) {
                            this.S = false;
                            this.T = false;
                            this.R = false;
                            this.P = false;
                            this.Q = false;
                            this.N = false;
                            this.O = false;
                            this.dQ = false;
                            this.l();
                            return true;
                        }
                        return this.cb > 0;
                    }
                    if (this.ec > 0) {
                        this.ec = (byte)(this.ec - 1);
                    }
                    if (!this.ba && this.aQ == 0 && this.at != 5 && this.R) {
                        this.R = false;
                        boolean bl = this.dR = !this.dR;
                        if (!this.dR) {
                            this.T();
                        }
                    }
                    if (this.ax > 0) {
                        this.ay = (this.ay + 1) % 8;
                        if (this.ay == 0) {
                            --this.ax;
                        }
                    }
                    if (this.E()) {
                        if (this.x != 1) {
                            return true;
                        }
                        if (this.do > 0) {
                            this.N();
                        }
                        this.M();
                        this.P();
                        this.S();
                        if (this.cS) {
                            this.Q();
                        } else {
                            this.R();
                        }
                        this.D();
                        if (this.E) {
                            this.C();
                        } else {
                            this.bn = -1;
                        }
                        if (this.dR) {
                            if (this.P) {
                                this.bL -= 24;
                            } else if (this.Q) {
                                this.bL += 24;
                            } else if (this.N) {
                                this.bM -= 24;
                            } else if (this.O) {
                                this.bM += 24;
                            }
                            this.U();
                        }
                        if (this.bL != this.bF || this.bM != this.bG && this.aL == 0) {
                            this.V();
                        }
                    }
                    return true;
                }
                case 2: {
                    return this.z();
                }
                case 3: {
                    this.t.destroyApp(true);
                    return false;
                }
                case 4: {
                    return this.af() || this.cb > 0;
                }
                case 5: {
                    return this.ak();
                }
                case 7: {
                    return this.an() || this.cb > 0;
                }
                case 8: {
                    return this.ap();
                }
                case 9: {
                    return this.aq();
                }
                case 10: {
                    if (this.cb == -1) {
                        --this.dL;
                        if (this.dL < 0) {
                            this.dM = 0;
                            this.dL = 0;
                            this.cb = (byte)-2;
                        }
                    } else if (this.cb == -2) {
                        ++this.az;
                        if (this.az >= 3) {
                            this.az = 0;
                            ++this.bZ;
                            if (this.bZ >= 3) {
                                this.cb = (byte)-3;
                            }
                        }
                    } else if (this.cb == -3) {
                        ++this.az;
                        if (this.az >= 40) {
                            this.a(false, 0);
                            this.cb = (byte)-4;
                        }
                    } else {
                        --this.dL;
                        if (this.dL < 0) {
                            this.dM = 0;
                            this.dL = 0;
                            this.cb = 0;
                            this.bZ = 0;
                            this.dH = null;
                            this.x = 0;
                        }
                    }
                    return true;
                }
                case 12: {
                    return this.y();
                }
                case 13: {
                    return this.v();
                }
                case 14: {
                    return this.q();
                }
                case 15: {
                    return this.s();
                }
                case 16: {
                    return this.B();
                }
            }
        }
        catch (Throwable throwable) {
            this.c();
        }
        return false;
    }

    private final void c(Graphics graphics, int n, int n2) {
        for (int i = 0; i < 5; ++i) {
            byte by = this.ab[i];
            if (by < 0) continue;
            int n3 = by / 6;
            int n4 = n3 * 16;
            int n5 = (by - n3 * 6) * 16;
            this.b(graphics, this.cp, 96 + n5, 672 + n4, 16, 16, this.Z[i] - n - 8, this.aa[i] - n2 - 8);
        }
    }

    private final void m() {
        int n;
        int n2;
        this.cq = null;
        this.cr = null;
        int n3 = this.u / this.h + 1;
        this.ds = n3 * 3;
        this.dt = this.v / this.i + 1;
        this.cq = new byte[this.dt][this.ds];
        this.cr = new byte[this.dt][this.ds];
        this.bG = 0;
        this.bF = 0;
        for (n2 = 0; n2 < this.dt; ++n2) {
            for (n = 0; n < n3 * 2; ++n) {
                int n4 = this.b(10);
                int n5 = n4 == 9 ? 71 : (n4 >= 7 ? 72 : 73);
                this.cq[n2][n] = n5;
                this.cr[n2][n] = -1;
                this.cq[n2][n + n3] = n5;
                this.cr[n2][n + n3] = -1;
            }
        }
        for (n2 = 0; n2 < this.dt; ++n2) {
            for (n = 0; n < n3; ++n) {
                this.cq[n2][n + n3 * 2] = this.cq[n2][n];
                this.cr[n2][n + n3 * 2] = this.cr[n2][n];
            }
        }
        this.ad();
        this.f(this.bF, this.bG);
        this.aq = this.ds * this.h - 1;
        this.ar = this.dt * this.i - 1;
        this.bH = (n3 << 1) * this.h - 1;
        this.bI = this.ar - this.dv;
        if (this.bH < 0) {
            this.bH = 0;
        }
        if (this.bI < 0) {
            this.bI = 0;
        }
        for (int i = 0; i < 5; ++i) {
            this.ab[i] = (byte)this.b(8);
            this.Z[i] = (short)(this.h + this.b(this.u));
            this.aa[i] = -16;
        }
    }

    private final void n() {
        int n = 3;
        this.bF += n;
        if (this.bF > this.bH) {
            this.bF -= this.bF / this.h * this.h;
            this.f(this.bF, this.bG);
        }
        this.g(this.bF, this.bG);
        for (int i = 0; i < 5; ++i) {
            byte by = this.ab[i];
            if (this.bD == 0) {
                by = (byte)(by + 1);
            }
            short s = (short)(this.Z[i] - n);
            if (by >= 8 || s <= -16) {
                by = 0;
                s = (short)(this.h + this.b(this.u));
                this.aa[i] = (short)this.b(this.v);
            }
            this.ab[i] = by;
            this.Z[i] = s;
        }
        ++this.bD;
        if (this.bD >= 4) {
            this.bD = 0;
        }
    }

    private final void o() {
        this.d(false);
        this.bf = false;
        this.bg = false;
        this.aT = 0;
        this.aK = 0;
        this.bj = true;
        this.as = 0;
        this.av = 1;
        this.at = 1;
        this.am = (this.u >> 1) - (this.h >> 1);
        this.an = this.v / 3;
        this.ao = -1;
        this.ap = this.an;
        this.d(this.bT);
        this.ac = 0;
        this.p();
        this.m();
        this.b(true, -1);
        this.x = 14;
        this.b("/fly.mid");
    }

    private final void p() {
        int n = this.ct.indexOf(35, this.ac);
        if (n == -1) {
            n = this.ct.length();
        }
        String string = this.ct.substring(this.ac, n);
        this.ac = n + 1;
        this.ew = string;
        this.ep = 0;
        this.en = this.an + this.i;
        this.eo = 0;
        this.er = this.u;
        this.a(null, 0, 0, false, false, false, true);
        this.aN = 192;
    }

    private final boolean q() {
        if (this.cb == 0) {
            if (this.ca == 0) {
                this.r();
                return true;
            }
            if (this.ao == -1) {
                --this.aN;
                if (this.aN < 0) {
                    if (this.ac < this.ct.length()) {
                        this.p();
                    } else {
                        this.ao = this.u;
                    }
                }
            } else if (this.ao > this.am) {
                this.ao -= 3;
            } else {
                this.J = (short)(this.J + 1);
                this.a(true, this.bT, 10);
                this.g();
                this.b(false, 0);
            }
        }
        if (this.cb != 2) {
            this.L();
            this.n();
        }
        return true;
    }

    private final void r() {
        this.ew = this.a[120] + this.J + this.a[121];
        this.ep = 0;
        this.en = this.i << 1;
        this.eo = 0;
        this.er = this.u;
        this.a(null, 0, 0, false, false, true, true);
        if (this.c == 1) {
            this.a("/cleared.mid", (int)this.bq, false);
        }
        this.b(true, -1);
        this.x = 15;
    }

    private final boolean s() {
        if (this.cb == 0) {
            if (this.ca == 0) {
                if (this.bS == 0) {
                    this.ae();
                } else {
                    this.f(true);
                }
            } else {
                if (this.S || this.R) {
                    this.R = false;
                    this.S = false;
                    this.b(false, 0);
                    return true;
                }
                if (this.N) {
                    this.N = false;
                    if (this.ep > 0) {
                        this.ep -= 2;
                        if (this.ep < 0) {
                            this.ep = 0;
                        }
                        return true;
                    }
                } else if (this.O) {
                    this.O = false;
                    if (this.ep < this.eq) {
                        this.ep += 2;
                        if (this.ep > this.eq) {
                            this.ep = this.eq;
                        }
                        return true;
                    }
                }
            }
            return false;
        }
        return true;
    }

    private final void t() {
        this.d(false);
        this.ad = (byte)(this.J > 100 ? 100 : (int)this.J);
        this.ae = " X " + this.ad;
        this.aN = 256;
        this.ew = "0000 0000 0000 0000##" + this.a[105];
        this.af = this.ew.toCharArray();
        this.ep = 0;
        this.en = this.i << 1;
        this.eo = 0;
        this.er = this.u;
        this.u();
        this.a(null, 0, 0, false, false, false, false);
        this.m();
        this.b(true, -1);
        this.dH = this.a(null, "/sleep.png");
        this.x = 13;
        this.b("/universe.mid");
    }

    private final void u() {
        int n = 0;
        for (int i = 1; i <= 16; ++i) {
            int n2 = this.b(32);
            this.af[n] = (char)(n2 < 10 ? n2 + 48 : n2 - 10 + 65);
            ++n;
            if (i % 4 != 0) continue;
            ++n;
        }
        this.ew = new String(this.af);
    }

    private final boolean v() {
        if (this.cb == 0) {
            if (this.ca == 0) {
                this.dH = null;
                if (this.M[1].length() > 0) {
                    this.ae();
                } else {
                    this.a(this.a[107] + this.ad + this.a[108], 0, (byte)0);
                }
            } else if (this.aN > 0) {
                --this.aN;
                if (this.aN == 0) {
                    String string = this.w();
                    for (int i = this.M.length - 1; i > 0; --i) {
                        this.M[i] = this.M[i - 1];
                    }
                    this.M[0] = string;
                    this.ew = string + "##" + this.a[106];
                    this.af = null;
                    this.ep = 0;
                    this.en = this.i << 1;
                    this.eo = 0;
                    this.er = this.u;
                    this.a(null, 0, 0, false, false, false, false);
                    this.J = (short)(this.J - this.ad);
                    this.g();
                } else {
                    this.u();
                }
            } else if (this.R || this.S) {
                this.S = false;
                this.R = false;
                this.b(false, 0);
            }
        }
        this.n();
        return true;
    }

    private final String w() {
        byte[] byArray = new byte[10];
        this.a(byArray, 0, this.L);
        byArray[5] = this.ad;
        this.a(byArray, 6, (int)System.currentTimeMillis());
        int n = 76;
        for (int i = 0; i < 10; ++i) {
            if (i == 4) continue;
            n = (byte)(n + ~((byte)(byArray[i] + i)));
        }
        byArray[4] = n;
        String string = this.a(byArray, byArray.length << 3);
        string = string.substring(0, 4) + ' ' + string.substring(4, 8) + ' ' + string.substring(8, 12) + ' ' + string.substring(12);
        return string;
    }

    private final void a(byte[] byArray, int n, int n2) {
        int n3 = 24;
        for (int i = 0; i < 4; ++i) {
            byArray[n + i] = (byte)(0xFF & n2 >>> n3);
            n3 -= 8;
        }
    }

    private final String a(byte[] byArray, int n) {
        StringBuffer stringBuffer = new StringBuffer(19);
        String string = "";
        int n2 = 0;
        boolean bl = false;
        int n3 = 0;
        for (int i = 0; i < n; ++i) {
            int n4 = byArray[i >> 3] >> 7 - i % 8 & 1;
            n2 |= n4 << 4 - n3;
            if (++n3 <= 4) continue;
            stringBuffer.append(this.a(n2));
            n3 = 0;
            n2 = 0;
        }
        if (n3 > 0) {
            stringBuffer.append(this.a(n2));
        }
        return stringBuffer.toString();
    }

    private final char a(int n) {
        if (n < 10) {
            return (char)(n + 48);
        }
        return (char)(n - 10 + 65);
    }

    private final void x() {
        this.c((byte)4, (byte)-1);
        this.dS = false;
        if (this.dY == 0) {
            this.ew = this.a[119];
            this.ep = 0;
            this.en = 96;
            this.eo = 0;
            this.er = this.u;
            this.a(null, 0, 0, false, false, true, true);
        }
        this.ah = 0;
        this.ag = 0;
        this.dI = this.a(this.dI, "/train.png");
        this.b(true, -1);
        this.a(true, 0);
        this.x = 12;
        this.b("/train.mid");
    }

    private final boolean y() {
        if (this.dM == 0) {
            if (this.dY > 0) {
                if (this.N) {
                    this.N = false;
                    this.dX = this.dX > 0 ? (byte)(this.dX - 1) : (byte)(this.dY - 1);
                    if (this.dX < this.ea) {
                        this.ea = this.dX;
                    } else if (this.dX >= this.ea + this.dZ) {
                        this.ea = (byte)(this.dX - this.dZ + 1);
                    }
                } else if (this.O) {
                    this.O = false;
                    this.Q = false;
                    this.dX = this.dX < this.dY - 1 ? (byte)(this.dX + 1) : (byte)0;
                    if (this.dX < this.ea) {
                        this.ea = this.dX;
                    } else if (this.dX >= this.ea + this.dZ) {
                        this.ea = (byte)(this.dX - this.dZ + 1);
                    }
                } else if (this.R || this.S) {
                    this.S = false;
                    this.R = false;
                    this.b(false, -1);
                    this.a(false, 2);
                }
            } else if (this.N) {
                this.N = false;
                if (this.ep > 0) {
                    this.ep -= 2;
                    if (this.ep < 0) {
                        this.ep = 0;
                    }
                }
            } else if (this.O) {
                this.O = false;
                if (this.ep < this.eq) {
                    this.ep += 2;
                    if (this.ep > this.eq) {
                        this.ep = this.eq;
                    }
                }
            }
            if (this.T) {
                this.T = false;
                this.b(false, -1);
                this.a(false, 1);
            }
        } else {
            --this.dL;
            if (this.dL < 0) {
                this.dL = 0;
                if (this.dM == 2) {
                    this.dM = 0;
                    switch (this.dN) {
                        case 0: {
                            break;
                        }
                        case 1: {
                            this.ae();
                            this.dI = null;
                            return true;
                        }
                        case 2: {
                            this.i();
                            if (this.c == 1) {
                                this.a();
                            }
                            this.bS = 0;
                            this.bR = this.dV[this.dX] == 1 ? 3 : 2;
                            this.X();
                            this.x = 1;
                            this.d(true);
                            this.dI = null;
                        }
                    }
                } else {
                    this.dM = 0;
                }
            }
        }
        this.ag += 24;
        if (this.ag >> 4 >= 384) {
            this.ag -= 6144;
        }
        this.ah += 64;
        if (this.ah >> 4 >= 384) {
            this.ah -= 6144;
        }
        return true;
    }

    private final void a(int n, String string, String string2, String string3) {
        this.ak = n;
        this.ai = string2;
        this.aj = string3;
        this.ew = string;
        this.ep = 0;
        this.en = this.k;
        this.eo = this.k;
        this.er = this.u - this.h;
        this.a(null, 0, 0, true, false, true, true);
        if (this.et > this.es) {
            int n2 = (this.et - this.es) * this.g;
            this.en += n2 >> 1;
            this.eo += n2 >> 1;
            this.eq = 0;
        }
        this.x = 2;
        this.a(true, -1);
    }

    private final boolean z() {
        boolean bl = false;
        if (this.dM == 0) {
            if (this.N) {
                this.N = false;
                if (this.ep > 0) {
                    this.ep -= 2;
                    if (this.ep < 0) {
                        this.ep = 0;
                    }
                    bl = true;
                }
            } else if (this.O) {
                this.O = false;
                if (this.ep < this.eq) {
                    this.ep += 2;
                    if (this.ep > this.eq) {
                        this.ep = this.eq;
                    }
                    bl = true;
                }
            } else if (this.ai != null && this.S) {
                this.S = false;
                this.a(false, 0);
            } else if (this.aj != null && this.T) {
                this.T = false;
                this.a(false, 1);
            }
        } else {
            --this.dL;
            if (this.dL < 0) {
                this.dL = 0;
                if (this.dM == 2) {
                    this.dM = 0;
                    switch (this.dN) {
                        case 0: {
                            bl = this.a(true);
                            break;
                        }
                        case 1: {
                            bl = this.a(false);
                        }
                    }
                } else {
                    this.dM = 0;
                }
            }
            bl = true;
        }
        return bl;
    }

    private final boolean a(boolean bl) {
        this.x = 1;
        if (this.ak == -1) {
            return true;
        }
        if (!bl) {
            if (this.ak == 10) {
                this.ae();
            }
            return true;
        }
        if (this.ak == 8) {
            this.C = true;
        } else if (this.ak == 7) {
            if (this.I < 3) {
                this.dc = true;
            } else {
                this.I = (short)(this.I - 3);
            }
            this.da = true;
        } else if (this.ak == 9) {
            this.t();
        } else if (this.ak == 10) {
            this.o();
        } else {
            this.I = (short)(this.I - this.br[this.ak]);
            this.cq[this.ap][this.ao] = -98;
            this.f(this.bF, this.bG);
            int n = this.ak;
            this.D[n] = (byte)(this.D[n] + 1);
            if (this.ak == 4) {
                this.H = this.D[4];
            }
            this.g();
        }
        return true;
    }

    private final void A() {
        this.d(false);
        this.dH = null;
        this.c(false);
        this.b(0, this.a[111], this.a[30], null);
        this.x = 16;
    }

    private final void b(int n, String string, String string2, String string3) {
        this.b("/universe.mid");
        this.ai = string2;
        this.aj = string3;
        this.al = n;
        this.ew = string;
        this.ep = 0;
        this.eo = 0;
        this.er = this.u;
        this.en = 0;
        this.a(null, 0, 0, true, true, true, true);
        this.a(true, -1);
    }

    private final boolean B() {
        boolean bl = false;
        if (this.dM == 0) {
            if (this.N) {
                this.N = false;
                if (this.al != 5 && this.ep > 0) {
                    this.ep -= 2;
                    if (this.ep < 0) {
                        this.ep = 0;
                    }
                    bl = true;
                }
            } else if (this.O) {
                this.O = false;
                if (this.al != 5 && this.ep < this.eq) {
                    this.ep += 2;
                    if (this.ep > this.eq) {
                        this.ep = this.eq;
                    }
                    bl = true;
                }
            } else if (this.ai != null && this.S) {
                this.S = false;
                this.a(false, 0);
            } else if (this.aj != null && this.T) {
                this.T = false;
                this.a(false, 1);
            }
        } else {
            --this.dL;
            if (this.dL < 0) {
                this.dL = 0;
                this.dP = false;
                if (this.dM == 2) {
                    this.dM = 0;
                    switch (this.dN) {
                        case 0: {
                            bl = this.b(true);
                            break;
                        }
                        case 1: {
                            bl = this.b(false);
                        }
                    }
                } else {
                    this.dM = 0;
                }
            }
            bl = true;
        }
        return bl;
    }

    private final boolean b(boolean bl) {
        this.ai = null;
        this.aj = null;
        boolean bl2 = false;
        switch (this.al) {
            case 0: {
                bl2 = true;
            }
        }
        if (bl2) {
            this.dH = null;
            this.ae();
        }
        return true;
    }

    private final int b(int n) {
        int n2 = this.z.nextInt();
        if (n2 < 0) {
            n2 = -n2;
        }
        return n2 % n;
    }

    private final void C() {
        if (this.bn != -1) {
            --this.bm;
            if (this.bm <= 0) {
                this.bn = -1;
            }
        } else {
            int n = (this.bF + this.b(this.du)) / this.h;
            int n2 = (this.bG + this.b(this.dv)) / this.i;
            if (n < this.ds && n2 < this.dt && this.cr[n2][n] == -8 && (this.cq[n2][n] == -57 || this.cq[n2][n] == -56)) {
                this.bn = n * this.h;
                this.bo = n2 * this.i;
                this.bm = 32;
            }
        }
    }

    private final void D() {
        if (this.aL > 0) {
            --this.aL;
            int n = this.h * this.aL / 8;
            int n2 = this.b(n + 1) - (n >> 1);
            int n3 = this.b(n + 1) - (n >> 1);
            this.bF += n2;
            this.bG += n3;
            if (this.bF < 0) {
                this.bF = 0;
            } else if (this.bF > this.bH) {
                this.bF = this.bH;
            }
            if (this.bG < 0) {
                this.bG = 0;
            } else if (this.bG > this.bI) {
                this.bG = this.bI;
            }
            this.g(this.bF, this.bG);
        }
    }

    private final boolean E() {
        int n;
        long l;
        if (this.cR && this.db && this.at != 5 && (l = !this.bY ? 60000L - (System.currentTimeMillis() - this.bX + this.bW) : 60000L - this.bW) <= 0L) {
            this.aX = 0;
            this.H();
        }
        if (this.aQ > 0 && this.bL == this.bF && this.bM == this.bG) {
            --this.aQ;
            if (this.aQ == 0) {
                this.aW = (byte)-1;
                this.aB = -1;
                this.T();
            }
        }
        if (this.bS == 0 && this.bR == 1 && !this.C && this.X) {
            this.X = false;
            this.a(8, "DO YOU WANT TO ENABLE THE CHEAT?", this.a[32], this.a[33]);
            return false;
        }
        int n2 = this.bF;
        int n3 = this.bG;
        if (this.at <= 4 && this.av == 0 && this.aZ == 0) {
            this.bk = false;
            if (this.be) {
                this.be = false;
                this.aK = 0;
                n = 0;
                boolean bl = true;
                byte by = this.cA[this.aw];
                short s = this.cE[this.aw];
                short s2 = this.cF[this.aw];
                if (by == -20) {
                    int n4 = s2 / this.i;
                    int n5 = s / this.h;
                    byte by2 = this.cq[n4][n5];
                    if ((by2 == 87 || by2 == 91 || by2 == 92 || by2 == 93) && this.at == 2) {
                        bl = false;
                    } else if (by2 == 88 && this.at == 3) {
                        bl = false;
                    } else if (by2 == 89 && this.at == 0) {
                        bl = false;
                    } else if (by2 == 90 && this.at == 1) {
                        bl = false;
                    }
                    if (bl) {
                        switch (this.at) {
                            case 0: {
                                if (!this.a(n5 - 1, n4, this.at, by) || this.a(s - this.h, (int)s2, this.aw, 0)) break;
                                n = 1;
                                break;
                            }
                            case 1: {
                                if (!this.a(n5 + 1, n4, this.at, by) || this.a(s + this.h, (int)s2, this.aw, 1)) break;
                                n = 1;
                                break;
                            }
                            case 2: {
                                if (!this.a(n5, n4 - 1, this.at, by) || this.a((int)s, s2 - this.i, this.aw, 2)) break;
                                n = 1;
                                break;
                            }
                            case 3: {
                                if (!this.a(n5, n4 + 1, this.at, by) || this.a((int)s, s2 + this.i, this.aw, 3)) break;
                                n = 1;
                            }
                        }
                    }
                    if (n != 0) {
                        this.cC[this.aw] = (byte)this.h;
                        this.cB[this.aw] = (byte)this.at;
                        this.cD[this.aw] = false;
                    }
                }
            }
            if (this.aw == -1 || this.cB[this.aw] == 4) {
                if (this.J()) {
                    if (!this.be) {
                        this.aw = -1;
                    }
                    this.bd = true;
                    if (!this.bf && !this.bj) {
                        this.as = 3;
                    }
                } else if (this.az == 0 && !this.bf && !this.bj && this.aZ == 0) {
                    this.as = 3;
                }
            }
        } else if (this.aZ > 0) {
            this.aZ = (byte)(this.aZ - 1);
            if (this.aZ <= 0) {
                this.aZ = 0;
                n = this.ao;
                int n6 = this.ap;
                switch (this.at) {
                    case 0: {
                        --n;
                        break;
                    }
                    case 1: {
                        ++n;
                        break;
                    }
                    case 2: {
                        --n6;
                        break;
                    }
                    case 3: {
                        ++n6;
                    }
                }
                this.cq[n6][n] = 124;
                this.f(this.bF, this.bG);
                this.as = 3;
                this.az = 0;
                this.bl = true;
            }
        }
        if (this.L()) {
            return false;
        }
        if (this.at == 5 && (this.R || this.S || this.T)) {
            this.T = false;
            this.S = false;
            this.R = false;
            if (!this.dc) {
                this.Y();
                this.d(true);
            } else {
                this.f(false);
            }
            return true;
        }
        if (this.av != 0) {
            if (this.bd && this.av <= this.j) {
                this.bd = false;
                this.G();
                if (this.aY == 0 && !this.bj) {
                    this.aT = this.aw != -1 ? this.m : 0;
                }
            }
            switch (this.aY) {
                case 1: {
                    this.aT += 6;
                    break;
                }
                case 2: {
                    this.aT -= 6;
                }
            }
            this.az = 0;
            this.K();
            if (this.av == 0) {
                switch (this.aY) {
                    case 1: {
                        this.aY = 0;
                        this.bj = true;
                        this.aT = this.k;
                        this.as = 0;
                        this.aK = 1;
                        break;
                    }
                    case 2: {
                        this.aY = 0;
                        this.bj = false;
                        this.aT = 0;
                        this.as = 0;
                    }
                }
                this.az = 0;
                this.bi = false;
                if (this.bh) {
                    this.bh = false;
                    if (this.cq[this.ap][this.ao] == -56) {
                        this.cr[this.ap][this.ao] = (byte)(this.cQ ? 202 : 203);
                    }
                    this.cq[this.ap][this.ao] = bp[this.b(4)];
                    this.f(this.bF, this.bG);
                }
                switch (this.aU) {
                    case 1: {
                        this.aU = 0;
                        this.cr[this.ap][this.ao] = -1;
                        this.f(this.bF, this.bG);
                        this.aK = 0;
                        this.bf = true;
                        this.as = 0;
                        this.b(this.F());
                        break;
                    }
                    case 2: {
                        this.aU = 0;
                        this.bf = false;
                        this.aK = 0;
                        this.cr[this.ap][this.ao] = -36;
                        this.f(this.bF, this.bG);
                        ++this.ao;
                        this.am += this.h;
                        this.b(this.F());
                        this.O = false;
                        this.N = false;
                        this.Q = false;
                        this.P = false;
                    }
                }
            }
        } else if (!(this.bf || this.bg || this.bj || this.aZ != 0 || this.at >= 4 || ++this.az < 160)) {
            this.at = 4;
            this.as = 0;
            this.bb = true;
        }
        if (this.aI != -1) {
            --this.aM;
            if (this.aM <= 0) {
                if (this.cr[this.aJ][this.aI] == -43) {
                    this.cr[this.aJ][this.aI] = -42;
                    this.aM = 6;
                } else {
                    this.cr[this.aJ][this.aI] = -1;
                    this.aI = -1;
                }
                this.f(this.bF, this.bG);
            }
        }
        if (this.dn > 0) {
            this.O();
        }
        if (this.do == 0) {
            --this.aN;
            if (this.aN <= 0) {
                n = this.cr[this.cP][this.cO];
                switch (n) {
                    case -41: {
                        n = -24;
                        break;
                    }
                    case -24: {
                        n = -23;
                        break;
                    }
                    default: {
                        n = -41;
                        this.dl = this.cO * this.h;
                        this.dm = this.cP * this.i + (this.i >> 1);
                        this.dp = 0;
                        this.dq = (byte)-1;
                        this.dr = (byte)4;
                        this.do = 1;
                    }
                }
                this.cr[this.cP][this.cO] = n;
                this.aN = 6;
                this.f(this.bF, this.bG);
            }
        }
        if (!this.dR && this.aQ == 0) {
            this.d(this.am, this.an);
        }
        if (this.bF != n2 || this.bG != n3) {
            this.g(this.bF, this.bG);
        }
        return true;
    }

    private final String F() {
        if (this.bf) {
            return "/mow.mid";
        }
        if (this.bS != 0) {
            if (!this.cR) {
                if (this.H != -1) {
                    return "/ingame" + this.H + ".mid";
                }
                return "/ingame" + this.b(this.D[4] + 1) + ".mid";
            }
            if (!this.db) {
                return "/shop.mid";
            }
            return "/bonus.mid";
        }
        if (this.bR == 1) {
            return "/shop.mid";
        }
        if (this.bR == 2 || this.bR == 4 || this.bR == 5) {
            return "/sandman.mid";
        }
        return "/shop.mid";
    }

    private final void b(String string) {
        if (this.c == 1) {
            this.a(string, (int)this.bq, true);
        }
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final void G() {
        byte by = this.cq[this.ap][this.ao];
        byte by2 = this.cr[this.ap][this.ao];
        if (this.aC != -1) {
            this.cq[this.aD][this.aC] = -81;
            this.f(this.bF, this.bG);
            this.aC = -1;
        } else if (this.aE != -1) {
            this.cq[this.aF][this.aE] = this.b(this.cq[this.aF][this.aE]);
            this.f(this.bF, this.bG);
            this.aE = -1;
        } else if (this.aR != -1) {
            this.cq[this.aS][this.aR] = this.c(this.cq[this.aS][this.aR]);
            this.f(this.bF, this.bG);
            this.aR = -1;
        } else if (this.aG != -1) {
            if (this.aI != -1) {
                this.cr[this.aJ][this.aI] = -1;
                this.f(this.bF, this.bG);
            }
            this.cr[this.aH][this.aG] = -43;
            this.f(this.bF, this.bG);
            this.aI = this.aG;
            this.aJ = this.aH;
            this.aM = 6;
            this.aG = -1;
        } else if (this.aO != -1) {
            --this.cy;
            this.cr[this.aP][this.aO] = -52;
            this.f(this.bF, this.bG);
            this.aO = -1;
        }
        if (this.bj) {
            if (by2 != -11) return;
            this.aY = (byte)2;
        } else if (by2 == -12) {
            this.aY = 1;
            this.aT = 0;
            return;
        }
        if (by2 == -44) {
            this.aG = this.ao;
            this.aH = this.ap;
            return;
        }
        if (by2 == -39 && this.cO != -1 && this.do == -1) {
            this.do = 0;
            this.aN = 6;
        }
        this.bg = false;
        if (!this.bf) {
            if (by2 == -51) {
                this.da = false;
                if (this.cR && !this.db) {
                    this.db = true;
                    this.b(this.F());
                    this.l();
                    this.bW = 0L;
                }
                this.cr[this.ap][this.ao] = -1;
                this.f(this.bF, this.bG);
            } else if (by2 == -8) {
                ++this.bU;
                this.cr[this.ap][this.ao] = -1;
                this.f(this.bF, this.bG);
            } else if (by2 == -35) {
                this.ax = 0;
                this.cT = true;
                this.cr[this.ap][this.ao] = -1;
                this.f(this.bF, this.bG);
            } else if (by2 == -13) {
                this.ax = 0;
                this.cU = true;
                this.cr[this.ap][this.ao] = -1;
                this.f(this.bF, this.bG);
            } else if (by2 == -49) {
                ++this.cz;
                this.cr[this.ap][this.ao] = -1;
                this.f(this.bF, this.bG);
            } else if (by2 == -54) {
                --this.cy;
                this.cr[this.ap][this.ao] = -55;
                this.f(this.bF, this.bG);
            } else if (by2 == -53) {
                this.aO = this.ao;
                this.aP = this.ap;
            } else if (by2 == -33) {
                if (this.cz > 0) {
                    --this.cz;
                    this.dd[this.dk] = (byte)this.ao;
                    this.de[this.dk] = (byte)this.ap;
                    this.df[this.dk] = 1;
                    this.dg[this.dk] = 16;
                    ++this.dk;
                    this.cr[this.ap][this.ao] = -17;
                    this.f(this.bF, this.bG);
                } else {
                    this.aV = (byte)4;
                    this.ax = 4;
                }
            } else if (by2 == -18 || by2 == -34 || by2 == -50) {
                this.bg = true;
            } else if (by2 == -36) {
                this.aU = 1;
            } else if (by2 == -10) {
                this.J = (short)(this.J + 1);
                this.cr[this.ap][this.ao] = -1;
                this.f(this.bF, this.bG);
                this.a(true, this.bS, this.bR);
                this.I = (short)(this.I + this.bU);
                this.ec = 0;
                this.g();
                this.d(false);
                this.k();
                this.r();
                return;
            }
        }
        if (by == -92) {
            this.I();
            return;
        } else if (by == -94) {
            this.c(0);
            return;
        } else if (by == -108) {
            this.bk = true;
            this.as = 1;
            return;
        } else if ((by & 0xFF) >= 191 && (by & 0xFF) <= 194) {
            this.a(by);
            return;
        } else if (by == -90) {
            this.c(1);
            return;
        } else if (by == -80) {
            this.aC = this.ao;
            this.aD = this.ap;
            return;
        } else if (!this.bf && (by & 0xFF) >= 185 && (by & 0xFF) <= 190) {
            this.aE = this.ao;
            this.aF = this.ap;
            return;
        } else if (!this.bf && (by & 0xFF) >= 177 && (by & 0xFF) <= 180) {
            this.aR = this.ao;
            this.aS = this.ap;
            return;
        } else if (!this.bf && by == -97) {
            this.cV = true;
            this.cq[this.ap][this.ao] = 124;
            this.f(this.bF, this.bG);
            return;
        } else if (by == -89) {
            this.cW = false;
            this.a((byte)-89, (byte)-88);
            return;
        } else if (by == -87) {
            this.cX = false;
            this.a((byte)-87, (byte)-86);
            return;
        } else if (by == -85) {
            this.cY = false;
            this.a((byte)-85, (byte)-84);
            return;
        } else if (by == -83) {
            this.cZ = false;
            this.a((byte)-83, (byte)-82);
            return;
        } else if (by == -88) {
            this.cW = true;
            this.aW = (byte)2;
            this.a((byte)-88, (byte)-89);
            this.aQ = 64;
            this.d(this.cG * this.h, this.cH * this.i);
            return;
        } else if (by == -86) {
            this.cX = true;
            this.aW = (byte)3;
            this.a((byte)-86, (byte)-87);
            this.aQ = 64;
            this.d(this.cI * this.h, this.cJ * this.i);
            return;
        } else if (by == -84) {
            this.cY = true;
            this.aW = 0;
            this.a((byte)-84, (byte)-85);
            this.aQ = 64;
            this.d(this.cK * this.h, this.cL * this.i);
            return;
        } else if (by == -82) {
            this.cZ = true;
            this.aW = 1;
            this.a((byte)-82, (byte)-83);
            this.aQ = 64;
            this.d(this.cM * this.h, this.cN * this.i);
            return;
        } else if (!this.bf && by == -81) {
            this.H();
            return;
        } else if (!this.bf && this.cy == 0 && by == -106) {
            this.d(false);
            this.k();
            this.au = this.at;
            this.at = 6;
            this.as = 0;
            this.bb = true;
            return;
        } else if (this.bf && by == -96) {
            this.aU = (byte)2;
            return;
        } else {
            if ((by & 0xFF) < 151 || (by & 0xFF) > 157) return;
            int n = (by & 0xFF) - 151;
            boolean bl = this.I >= this.br[n];
            this.a(bl ? n : -1, this.a[82 + n] + this.a[91 + n] + (bl ? this.a[99] : this.a[98]), bl ? this.a[32] : this.a[30], bl ? this.a[33] : null);
        }
    }

    private final void H() {
        this.d(false);
        this.k();
        this.av = 0;
        this.at = 5;
        this.bj = false;
        this.bg = false;
        this.as = 0;
        if (this.dR) {
            this.dR = false;
            this.T();
        }
        if (this.c == 1) {
            this.a(this.aX == -1 ? "/death.mid" : "/alarm.mid", (int)this.bq, false);
        }
        this.U = false;
    }

    private final void I() {
        for (int i = 0; i < this.dt; ++i) {
            for (int j = 0; j < this.ds; ++j) {
                this.cq[i][j] = this.b(this.cq[i][j]);
            }
        }
        this.f(this.bF, this.bG);
    }

    private final void c(int n) {
        byte by;
        byte by2;
        byte by3;
        byte by4;
        byte by5;
        byte by6;
        switch (n) {
            case 0: {
                by6 = -73;
                by5 = -72;
                by4 = -75;
                by3 = -74;
                by2 = -95;
                by = -94;
                break;
            }
            default: {
                by6 = 90;
                by5 = 89;
                by4 = 88;
                by3 = 87;
                by2 = -91;
                by = -90;
            }
        }
        for (int i = 0; i < this.dt; ++i) {
            for (int j = 0; j < this.ds; ++j) {
                this.cq[i][j] = this.a(this.cq[i][j], by6, by4, by5, by3, by2, by);
            }
        }
        this.f(this.bF, this.bG);
    }

    private final void a(byte by) {
        byte by2;
        byte by3;
        byte by4;
        byte by5;
        switch (by) {
            case -65: 
            case -64: {
                by5 = -65;
                by4 = -64;
                by3 = -61;
                by2 = -60;
                break;
            }
            case -63: 
            case -62: {
                by5 = -63;
                by4 = -62;
                by3 = -59;
                by2 = -58;
                break;
            }
            default: {
                return;
            }
        }
        for (int i = 0; i < this.dt; ++i) {
            for (int j = 0; j < this.ds; ++j) {
                by = this.cq[i][j];
                if (by == by5) {
                    this.cq[i][j] = by4;
                    continue;
                }
                if (by == by4) {
                    this.cq[i][j] = by5;
                    continue;
                }
                if (by == by3) {
                    this.cq[i][j] = by2;
                    continue;
                }
                if (by != by2) continue;
                this.cq[i][j] = by3;
            }
        }
        this.f(this.bF, this.bG);
    }

    private final void a(byte by, byte by2) {
        for (int i = 0; i < this.dt; ++i) {
            for (int j = 0; j < this.ds; ++j) {
                if (this.cq[i][j] != by) continue;
                this.cq[i][j] = by2;
            }
        }
        this.f(this.bF, this.bG);
    }

    private final byte a(byte by, byte by2, byte by3, byte by4, byte by5, byte by6, byte by7) {
        if (by == by6) {
            return by7;
        }
        if (by == by7) {
            return by6;
        }
        if (by == by5) {
            return by3;
        }
        if (by == by3) {
            return by5;
        }
        if (by == by4) {
            return by2;
        }
        if (by == by2) {
            return by4;
        }
        return by;
    }

    private final byte b(byte by) {
        switch (by) {
            case -93: {
                return -92;
            }
            case -92: {
                return -93;
            }
            case -71: {
                return -68;
            }
            case -70: {
                return -71;
            }
            case -69: {
                return -70;
            }
            case -68: {
                return -69;
            }
            case -67: {
                return -66;
            }
            case -66: {
                return -67;
            }
        }
        return by;
    }

    private final byte c(byte by) {
        switch (by) {
            case -79: {
                return -78;
            }
            case -78: {
                return -76;
            }
            case -77: {
                return -79;
            }
            case -76: {
                return -77;
            }
        }
        return by;
    }

    private final boolean a(int n, int n2) {
        n *= this.h;
        n2 *= this.i;
        for (int i = 0; i < this.cx; ++i) {
            if (this.cB[i] != 4 || this.cE[i] != n || this.cF[i] != n2) continue;
            this.be = true;
            this.aw = (byte)i;
            return true;
        }
        return false;
    }

    private final boolean J() {
        boolean bl;
        byte by = this.cq[this.ap][this.ao];
        byte by2 = this.cr[this.ap][this.ao];
        if (this.bl) {
            this.bl = false;
            switch (this.at) {
                case 0: {
                    if (!this.a(-1, 0, false)) break;
                    --this.ao;
                    this.av = this.h;
                    if (this.F) {
                        this.bi = true;
                    }
                    return true;
                }
                case 1: {
                    if (!this.a(1, 0, false)) break;
                    ++this.ao;
                    this.av = this.h;
                    if (this.F) {
                        this.bi = true;
                    }
                    return true;
                }
                case 2: {
                    if (!this.a(0, -1, false)) break;
                    --this.ap;
                    this.av = this.i;
                    if (this.F) {
                        this.bi = true;
                    }
                    return true;
                }
                case 3: {
                    if (!this.a(0, 1, false)) break;
                    ++this.ap;
                    this.av = this.i;
                    if (this.F) {
                        this.bi = true;
                    }
                    return true;
                }
            }
        }
        if (this.bj) {
            switch (this.at) {
                case 0: {
                    --this.ao;
                    this.av = this.h;
                    break;
                }
                case 1: {
                    ++this.ao;
                    this.av = this.h;
                    break;
                }
                case 2: {
                    --this.ap;
                    this.av = this.i;
                    break;
                }
                case 3: {
                    ++this.ap;
                    this.av = this.i;
                }
            }
            return true;
        }
        if (by2 != -44) {
            if (by == -73 && this.a(-1, 0, true)) {
                this.at = 0;
                this.aK = 3;
            } else if (by == -72 && this.a(1, 0, true)) {
                this.at = 1;
                this.aK = 3;
            } else if (by == -75 && this.a(0, -1, true)) {
                this.at = 2;
                this.aK = 3;
            } else if (by == -74 && this.a(0, 1, true)) {
                this.at = 3;
                this.aK = 3;
            }
        }
        if (this.aK > 0) {
            bl = true;
            boolean bl2 = false;
            switch (this.at) {
                case 0: {
                    if (this.a(-1, 0, false)) {
                        --this.ao;
                        if (this.dR || !this.P) break;
                        bl = false;
                        break;
                    }
                    bl2 = true;
                    break;
                }
                case 1: {
                    if (this.a(1, 0, false)) {
                        ++this.ao;
                        if (this.dR || !this.Q) break;
                        bl = false;
                        break;
                    }
                    bl2 = true;
                    break;
                }
                case 2: {
                    if (this.a(0, -1, false)) {
                        --this.ap;
                        if (this.dR || !this.N) break;
                        bl = false;
                        break;
                    }
                    bl2 = true;
                    break;
                }
                case 3: {
                    if (this.a(0, 1, false)) {
                        ++this.ap;
                        if (this.dR || !this.O) break;
                        bl = false;
                        break;
                    }
                    bl2 = true;
                }
            }
            if (!bl2) {
                if (this.bf && this.c(this.ao, this.ap) == -19) {
                    this.cr[this.ap][this.ao] = -1;
                    this.f(this.bF, this.bG);
                    this.aL = 8;
                }
                this.aK = !bl || by == -108 ? 3 : --this.aK;
                if (by == -108) {
                    this.bk = true;
                    this.aK = 3;
                }
                this.av = this.h;
                return true;
            }
            this.aK = 0;
            this.aL = 8;
            this.bc = false;
        }
        if (this.av == 0 && by == -108) {
            bl = false;
            switch (this.at) {
                case 0: {
                    if (this.a(-1, 0, false)) {
                        --this.ao;
                        break;
                    }
                    bl = true;
                    break;
                }
                case 1: {
                    if (this.a(1, 0, false)) {
                        ++this.ao;
                        break;
                    }
                    bl = true;
                    break;
                }
                case 2: {
                    if (this.a(0, -1, false)) {
                        --this.ap;
                        break;
                    }
                    bl = true;
                    break;
                }
                case 3: {
                    if (this.a(0, 1, false)) {
                        ++this.ap;
                        break;
                    }
                    bl = true;
                    break;
                }
                default: {
                    bl = true;
                }
            }
            if (!bl) {
                this.av = this.h;
                this.bk = true;
                this.as = 1;
                if (!this.bf && this.F) {
                    this.bi = true;
                }
                return true;
            }
        }
        if (!this.dR && this.aQ == 0) {
            if (this.P) {
                if (this.a(-1, 0, false)) {
                    --this.ao;
                    this.at = 0;
                    this.av = this.h;
                    if (!this.bf && this.F) {
                        this.bi = true;
                    }
                    return true;
                }
            } else if (this.Q) {
                if (this.a(1, 0, false)) {
                    ++this.ao;
                    this.at = 1;
                    this.av = this.h;
                    if (!this.bf && this.F) {
                        this.bi = true;
                    }
                    return true;
                }
            } else if (this.N) {
                if (this.a(0, -1, false)) {
                    --this.ap;
                    this.at = 2;
                    this.av = this.h;
                    if (!this.bf && this.F) {
                        this.bi = true;
                    }
                    return true;
                }
            } else if (this.O && this.a(0, 1, false)) {
                ++this.ap;
                this.at = 3;
                this.av = this.h;
                if (!this.bf && this.F) {
                    this.bi = true;
                }
                return true;
            }
        }
        return false;
    }

    private final byte b(int n, int n2) {
        if (n < 0 || n2 < 0 || n >= this.ds || n2 >= this.dt) {
            return -1;
        }
        return this.cq[n2][n];
    }

    private final byte c(int n, int n2) {
        if (n < 0 || n2 < 0 || n >= this.ds || n2 >= this.dt) {
            return -1;
        }
        return this.cr[n2][n];
    }

    private final boolean a(int n, int n2, boolean bl) {
        int n3 = this.ao + n;
        int n4 = this.ap + n2;
        this.aZ = 0;
        if (n3 < 0 || n4 < 0 || n3 >= this.ds || n4 >= this.dt) {
            return false;
        }
        if (this.bj) {
            return true;
        }
        byte by = this.cq[this.ap][this.ao];
        byte by2 = this.cq[n4][n3];
        byte by3 = this.cr[n4][n3];
        boolean bl2 = true;
        if (by == -66) {
            bl2 = n != 0;
        } else if (by == -67) {
            bl2 = n2 != 0;
        } else if (by == -68) {
            bl2 = n == 1 || n2 == 1;
        } else if (by == -69) {
            bl2 = n == -1 || n2 == 1;
        } else if (by == -70) {
            bl2 = n == -1 || n2 == -1;
        } else if (by == -71) {
            boolean bl3 = bl2 = n == 1 || n2 == -1;
        }
        if (!bl2) {
            return false;
        }
        if (!this.bf && this.a(this.ao + n, this.ap + n2)) {
            return true;
        }
        boolean bl4 = bl2 = (by2 & 0xFF) >= 94 && (by2 & 0xFF) <= 200;
        if (bl2) {
            if ((by2 & 0xFF) >= 185 && (by2 & 0xFF) <= 190) {
                if (!this.bf) {
                    switch (by2) {
                        case -71: {
                            bl2 = n == -1 || n2 == 1;
                            break;
                        }
                        case -70: {
                            bl2 = n == 1 || n2 == 1;
                            break;
                        }
                        case -69: {
                            bl2 = n == 1 || n2 == -1;
                            break;
                        }
                        case -68: {
                            bl2 = n == -1 || n2 == -1;
                            break;
                        }
                        case -67: {
                            bl2 = n2 != 0;
                            break;
                        }
                        case -66: {
                            bl2 = n != 0;
                        }
                    }
                } else {
                    bl2 = false;
                }
            } else if ((by2 & 0xFF) >= 177 && (by2 & 0xFF) <= 180) {
                bl2 = !this.bf;
            } else if (by2 == -57 || by2 == -56) {
                if (this.bf) {
                    this.bh = true;
                } else {
                    bl2 = false;
                }
            } else if (by2 == -61 || by2 == -59) {
                bl2 = false;
            }
        } else if (by2 == 77 && !this.bf) {
            if (this.cV) {
                this.aZ = (byte)32;
                this.as = 0;
                this.at = n != 0 ? (n < 0 ? 0 : 1) : (n2 < 0 ? 2 : 3);
                this.bi = false;
                this.aK = 0;
                this.az = 0;
            } else {
                this.aV = (byte)3;
                this.ax = 4;
            }
        }
        if (!bl2) {
            switch (by3) {
                case -50: 
                case -44: 
                case -34: {
                    bl2 = !this.bf;
                    break;
                }
                default: {
                    bl2 = false;
                }
            }
            if (!bl2) {
                return false;
            }
        } else {
            switch (by3) {
                case -54: {
                    bl2 = !this.bf;
                    break;
                }
                case -52: 
                case -48: 
                case -47: 
                case -46: 
                case -45: 
                case -41: 
                case -40: 
                case -38: 
                case -37: 
                case -29: 
                case -25: 
                case -7: 
                case -6: 
                case -5: 
                case -4: 
                case -3: 
                case -2: {
                    bl2 = false;
                    break;
                }
                case -51: {
                    if (!this.bf) {
                        if (!this.da && this.D[2] == 0) {
                            this.aV = 1;
                            this.ax = 4;
                            bl2 = false;
                            break;
                        }
                        bl2 = true;
                        break;
                    }
                    bl2 = false;
                    break;
                }
                case -36: {
                    if (!this.cT) {
                        this.aV = 0;
                        this.ax = 4;
                        bl2 = false;
                        break;
                    }
                    bl2 = true;
                    break;
                }
                case -22: 
                case -9: {
                    if (this.cR) {
                        String string;
                        int n5;
                        boolean bl5 = false;
                        if (!this.db) {
                            if (this.D[2] > 0) {
                                n5 = -1;
                                string = this.a[113] + this.a[114];
                            } else if (!this.da) {
                                n5 = 7;
                                if (this.I >= 3) {
                                    string = this.a[113] + this.a[115] + this.I + this.a[116];
                                } else {
                                    string = this.a[113] + this.a[117];
                                    bl5 = true;
                                }
                            } else {
                                n5 = -1;
                                string = this.a[118];
                            }
                        } else {
                            n5 = -1;
                            string = this.a[118];
                        }
                        this.a(n5, string, this.a[n5 != -1 ? (bl5 ? 34 : 32) : 30], n5 != -1 ? this.a[33] : null);
                    } else if (this.bS == 0) {
                        if (this.bR == 1) {
                            this.a(-1, this.a[100] + this.I + this.a[101], this.a[30], null);
                        } else if (this.bR == 2) {
                            if (this.J > 0) {
                                this.a(9, this.a[102] + this.J + this.a[103], this.a[32], this.a[33]);
                            } else {
                                this.a(-1, this.a[102] + this.a[104], this.a[30], null);
                            }
                        } else if (this.bR == 3) {
                            this.a(-1, this.a[109], this.a[30], null);
                        } else if (this.bR == 4) {
                            this.a(10, this.a[112], this.a[32], this.a[33]);
                        } else if (this.bR == 5) {
                            this.a(-1, this.a[110], this.a[30], null);
                        }
                    }
                    bl2 = false;
                    break;
                }
                case -21: {
                    this.A();
                    bl2 = false;
                    break;
                }
                case -19: {
                    bl2 = this.bf && (this.aK > 0 || bl);
                    break;
                }
                case -12: {
                    if (!this.bf) {
                        if (this.cU) {
                            bl2 = true;
                            break;
                        }
                        this.aV = (byte)2;
                        this.ax = 4;
                        bl2 = false;
                        break;
                    }
                    bl2 = false;
                    break;
                }
                default: {
                    bl2 = true;
                }
            }
            if (!bl2) {
                return false;
            }
        }
        return true;
    }

    private final void K() {
        int n = this.at;
        int n2 = this.aK > 0 || this.bi ? 6 : 3;
        this.av -= n2;
        if (this.at == 6) {
            n = this.au;
        }
        switch (n) {
            case 0: {
                this.am -= n2;
                break;
            }
            case 1: {
                this.am += n2;
                break;
            }
            case 2: {
                this.an -= n2;
                break;
            }
            case 3: {
                this.an += n2;
            }
        }
    }

    private final boolean L() {
        if (!this.bc || this.at <= 3 && !this.bj && (this.aK > 0 || this.F && !this.bf && this.aZ <= 0)) {
            this.aA = (this.aA + 1) % 12;
            if (this.bf) {
                this.as = (this.as + 1) % 2;
            } else if (this.bj) {
                this.as = 0;
            } else if (this.aZ > 0) {
                this.as = (this.as + 1) % 9;
            } else {
                switch (this.at) {
                    case 0: 
                    case 1: 
                    case 2: 
                    case 3: {
                        if (this.av == 0) break;
                        if (!this.bk) {
                            this.as = (this.as + 1) % 8;
                            break;
                        }
                        this.as = 1;
                        break;
                    }
                    case 4: {
                        if (this.bb) {
                            ++this.as;
                            if (this.as < 3) break;
                            this.as = 1;
                            this.bb = false;
                            break;
                        }
                        --this.as;
                        if (this.as >= 0) break;
                        this.as = 1;
                        this.bb = true;
                        break;
                    }
                    case 5: {
                        if (this.as >= 7) break;
                        ++this.as;
                        break;
                    }
                    case 6: {
                        if (this.bb) {
                            ++this.as;
                            if (this.as < 10) break;
                            if (this.bS != 0) {
                                this.am();
                            } else if (this.bR == 1) {
                                this.ae();
                                this.aL = 0;
                                this.bL = this.bF;
                                this.bM = this.bG;
                            } else if (this.bR == 5) {
                                this.G = true;
                                this.g();
                                this.bS = this.bT;
                                this.bR = 1;
                                this.X();
                                this.d(true);
                            } else {
                                this.x();
                            }
                            return true;
                        }
                        --this.as;
                        if (this.as >= 0) break;
                        this.at = 3;
                        this.as = 3;
                        this.l();
                    }
                }
            }
            if (this.aX != -1) {
                this.aX = (byte)((this.aX + 1) % 2);
            }
            this.bc = true;
        } else {
            this.bc = false;
        }
        if (this.at <= 3 && this.bk) {
            this.as = 1;
        }
        return false;
    }

    private final void M() {
        short s = 3;
        for (int i = 0; i < this.cx; ++i) {
            short s2;
            short s3;
            byte by = this.cA[i];
            int n = this.cB[i];
            int n2 = this.cE[i];
            int n3 = this.cF[i];
            int n4 = this.cC[i];
            boolean bl = this.cD[i];
            boolean bl2 = false;
            if (n4 > 0) {
                s3 = 0;
                s2 = 0;
                switch (n) {
                    case 0: {
                        s2 = bl ? (short)-6 : -s;
                        break;
                    }
                    case 1: {
                        s2 = bl ? (short)6 : s;
                        break;
                    }
                    case 2: {
                        s3 = bl ? (short)-6 : -s;
                        break;
                    }
                    case 3: {
                        short s4 = s3 = bl ? (short)6 : s;
                    }
                }
                if (!bl || !this.a(n2 + s2, n3 + s3, i, 4)) {
                    this.cE[i] = (short)(n2 += s2);
                    this.cF[i] = (short)(n3 += s3);
                    if (this.aw == i) {
                        this.am += s2;
                        this.an += s3;
                        this.ao = this.am / this.h;
                        this.ap = this.an / this.i;
                    }
                    n4 -= bl ? (short)6 : s;
                }
            }
            if (i == this.aB && this.aQ > 1) {
                this.d(n2, n3);
                --this.aQ;
            }
            if (n4 <= 0) {
                s3 = n3 / this.i;
                s2 = n2 / this.h;
                byte by2 = this.cq[s3][s2];
                byte by3 = this.cr[s3][s2];
                n4 = 0;
                bl = false;
                if (by == -20) {
                    if (by2 == 90) {
                        if (this.a(s2 - 1, (int)s3, 0, by) && !this.a(n2 - this.h, n3, i, 0)) {
                            n = 0;
                            n4 = this.h;
                        }
                    } else if (by2 == 89) {
                        if (this.a(s2 + 1, (int)s3, 1, by) && !this.a(n2 + this.h, n3, i, 1)) {
                            n = 1;
                            n4 = this.h;
                        }
                    } else if (by2 == 88) {
                        if (this.a((int)s2, s3 - 1, 2, by) && !this.a(n2, n3 - this.i, i, 2)) {
                            n = 2;
                            n4 = this.i;
                        }
                    } else if (by2 == 87) {
                        if (this.a((int)s2, s3 + 1, 3, by) && !this.a(n2, n3 + this.i, i, 3)) {
                            n = 3;
                            n4 = this.i;
                        }
                    } else if ((by2 == 91 || by2 == 92 || by2 == 93) && this.a((int)s2, s3 + 1, 3, by) && !this.a(n2, n3 + this.i, i, 3)) {
                        n = 3;
                        n4 = this.i;
                        bl = true;
                    }
                } else if (by == -32 && by3 == -16 || by == -31 && by3 == -15 || by == -30 && by3 == -14) {
                    bl2 = true;
                } else if (this.aQ == 0 || this.bL == this.bF && this.bM == this.bG || this.aB != -1) {
                    if (this.cW && n != 2 && s2 == this.cG && s3 >= this.cH - 3 && s3 <= this.cH - 1 && this.a((int)s2, s3 - 1, 2, by) && !this.a(n2, n3 - this.i, i, 2)) {
                        n = 2;
                        n4 = this.i;
                    } else if (this.cX && n != 3 && s2 == this.cI && s3 >= this.cJ + 1 && s3 <= this.cJ + 3 && this.a((int)s2, s3 + 1, 3, by) && !this.a(n2, n3 + this.i, i, 3)) {
                        n = 3;
                        n4 = this.i;
                    } else if (this.cY && n != 0 && s3 == this.cL && s2 >= this.cK - 3 && s2 <= this.cK - 1 && this.a(s2 - 1, (int)s3, 0, by) && !this.a(n2 - this.h, n3, i, 0)) {
                        n = 0;
                        n4 = this.h;
                    } else if (this.cZ && n != 1 && s3 == this.cN && s2 >= this.cM + 1 && s2 <= this.cM + 3 && this.a(s2 + 1, (int)s3, 1, by) && !this.a(n2 + this.h, n3, i, 1)) {
                        n = 1;
                        n4 = this.h;
                    }
                    if (n4 != 0 && this.aW == n) {
                        this.aW = (byte)-1;
                        this.aB = i;
                        this.aQ = 64;
                        this.d(s2 * this.h, s3 * this.i);
                    }
                }
                if (!bl2 && n4 == 0) {
                    switch (n) {
                        case 0: {
                            if (!this.a(s2 - 1, (int)s3, 0, by) || this.a(n2 - this.h, n3, i, 0)) break;
                            n4 = this.h;
                            break;
                        }
                        case 1: {
                            if (!this.a(s2 + 1, (int)s3, 1, by) || this.a(n2 + this.h, n3, i, 1)) break;
                            n4 = this.h;
                            break;
                        }
                        case 2: {
                            if (!this.a((int)s2, s3 - 1, 2, by) || this.a(n2, n3 - this.i, i, 2)) break;
                            n4 = this.i;
                            break;
                        }
                        case 3: {
                            if (!this.a((int)s2, s3 + 1, 3, by) || this.a(n2, n3 + this.i, i, 3)) break;
                            n4 = this.i;
                        }
                    }
                }
                if (n4 == 0) {
                    n = 4;
                }
            }
            this.cC[i] = (byte)n4;
            this.cB[i] = (byte)n;
            this.cD[i] = bl;
        }
    }

    private final boolean a(int n, int n2, int n3, int n4) {
        for (int i = 0; i < this.cx; ++i) {
            if (i == n3) continue;
            if (n3 != -1) {
                if (this.cB[i] == n4 || !this.b(n, n2, this.cE[i], this.cF[i])) continue;
                return true;
            }
            byte by = this.cC[i];
            short s = this.cE[i];
            short s2 = this.cF[i];
            switch (this.cB[i]) {
                case 0: {
                    s = (short)(s - by);
                    break;
                }
                case 1: {
                    s = (short)(s + by);
                    break;
                }
                case 2: {
                    s2 = (short)(s2 - by);
                    break;
                }
                case 3: {
                    s2 = (short)(s2 + by);
                }
            }
            if (!this.b(n, n2, s, s2)) continue;
            return true;
        }
        return false;
    }

    private final boolean b(int n, int n2, int n3, int n4) {
        int n5 = n + this.h - 1;
        int n6 = n3 + this.h - 1;
        int n7 = n2 + this.i - 1;
        int n8 = n4 + this.i - 1;
        if (n7 < n4) {
            return false;
        }
        if (n2 > n8) {
            return false;
        }
        if (n5 < n3) {
            return false;
        }
        return n <= n6;
    }

    private final boolean a(int n, int n2, int n3, byte by) {
        if (n < 0 || n2 < 0 || n >= this.ds || n2 >= this.dt) {
            return false;
        }
        byte by2 = this.cr[n2][n];
        switch (by2) {
            case -44: 
            case -43: 
            case -42: 
            case -29: 
            case -28: 
            case -27: 
            case -26: 
            case -19: 
            case -7: 
            case -6: 
            case -5: 
            case -4: 
            case -3: 
            case -2: {
                return false;
            }
        }
        by2 = this.cq[n2][n];
        if (by == -20) {
            switch (by2) {
                case 88: {
                    return n3 != 3;
                }
                case 87: {
                    return n3 != 2;
                }
                case 90: {
                    return n3 != 1;
                }
                case 89: {
                    return n3 != 0;
                }
                case 85: 
                case 86: {
                    return true;
                }
                case 91: 
                case 92: 
                case 93: {
                    return n3 != 2;
                }
            }
        } else {
            switch (n3) {
                case 0: {
                    if (!this.cZ || n2 != this.cN || n < this.cM + 1 || n > this.cM + 3) break;
                    return false;
                }
                case 1: {
                    if (!this.cY || n2 != this.cL || n < this.cK - 3 || n > this.cK - 1) break;
                    return false;
                }
                case 2: {
                    if (!this.cX || n != this.cI || n2 < this.cJ + 1 || n2 > this.cJ + 3) break;
                    return false;
                }
                case 3: {
                    if (!this.cW || n != this.cG || n2 < this.cH - 3 || n2 > this.cH - 1) break;
                    return false;
                }
            }
            if ((by2 & 0xFF) >= 71 && (by2 & 0xFF) <= 76) {
                return true;
            }
        }
        return false;
    }

    private final void N() {
        int n;
        this.bs = (byte)((this.bs + 1) % 8);
        this.aQ = 16;
        this.d(this.dl, this.dm);
        if (this.dr == 3) {
            boolean bl;
            n = this.dl / this.h;
            int n2 = this.dm / this.i;
            if (n < 0 || n2 < 0 || n >= this.ds || n2 >= this.dt) {
                this.do = (byte)-1;
                return;
            }
            byte by = this.cq[n2][n];
            byte by2 = this.cr[n2][n];
            boolean bl2 = bl = (by & 0xFF) >= 94 && (by & 0xFF) <= 200 || (by & 0xFF) >= 85 && (by & 0xFF) <= 93 || (by & 0xFF) >= 71 && (by & 0xFF) <= 76;
            if (bl) {
                switch (by) {
                    case -61: 
                    case -59: {
                        bl = false;
                    }
                }
            }
            if (bl) {
                switch (by2) {
                    case -41: 
                    case -40: {
                        bl = false;
                        break;
                    }
                    case -29: {
                        this.b((byte)n, (byte)n2);
                        break;
                    }
                    case -19: {
                        bl = false;
                    }
                }
            }
            if (bl) {
                switch (by) {
                    case -79: {
                        if (this.dp == 0) {
                            this.dq = (byte)3;
                            break;
                        }
                        if (this.dp == 2) {
                            this.dq = 1;
                            break;
                        }
                        bl = false;
                        break;
                    }
                    case -78: {
                        if (this.dp == 1) {
                            this.dq = (byte)3;
                            break;
                        }
                        if (this.dp == 2) {
                            this.dq = 0;
                            break;
                        }
                        bl = false;
                        break;
                    }
                    case -77: {
                        if (this.dp == 0) {
                            this.dq = (byte)2;
                            break;
                        }
                        if (this.dp == 3) {
                            this.dq = 1;
                            break;
                        }
                        bl = false;
                        break;
                    }
                    case -76: {
                        if (this.dp == 1) {
                            this.dq = (byte)2;
                            break;
                        }
                        if (this.dp == 3) {
                            this.dq = 0;
                            break;
                        }
                        bl = false;
                    }
                }
            }
            if (!bl) {
                this.do = (byte)-1;
                return;
            }
        } else if (this.dr == 0) {
            this.dr = (byte)8;
            if (this.dq != -1) {
                this.dp = this.dq;
                this.dq = (byte)-1;
            }
        }
        this.dr = (byte)(this.dr - 1);
        n = 6;
        switch (this.dp) {
            case 0: {
                this.dl -= n;
                break;
            }
            case 1: {
                this.dl += n;
                break;
            }
            case 2: {
                this.dm -= n;
                break;
            }
            default: {
                this.dm += n;
            }
        }
    }

    private final void b(byte by, byte by2) {
        if (this.dn >= 5) {
            this.cr[this.di[0]][this.dh[0]] = -1;
            for (int i = 0; i < this.dn - 1; ++i) {
                this.dh[i] = this.dh[i + 1];
                this.di[i] = this.di[i + 1];
                this.dj[i] = this.dj[i + 1];
            }
            --this.dn;
        }
        this.dh[this.dn] = by;
        this.di[this.dn] = by2;
        this.dj[this.dn] = 6;
        ++this.dn;
        this.cr[by2][by] = -28;
        this.f(this.bF, this.bG);
    }

    private final void O() {
        boolean bl = false;
        for (int i = 0; i < this.dn; ++i) {
            byte by = this.dj[i];
            if (by <= 0) {
                byte by2 = this.dh[i];
                byte by3 = this.di[i];
                int n = this.cr[by3][by2];
                boolean bl2 = false;
                bl = true;
                switch (n) {
                    case -28: {
                        n = -27;
                        break;
                    }
                    case -27: {
                        n = -26;
                        break;
                    }
                    case -26: {
                        n = -1;
                        bl2 = true;
                    }
                }
                this.dj[i] = 6;
                this.cr[by3][by2] = n;
                if (!bl2) continue;
                for (int j = i; j < this.dn - 1; ++j) {
                    this.dh[j] = this.dh[j + 1];
                    this.di[j] = this.di[j + 1];
                    this.dj[j] = this.dj[j + 1];
                }
                --this.dn;
                --i;
                continue;
            }
            this.dj[i] = (byte)(by - 1);
        }
        if (bl) {
            this.f(this.bF, this.bG);
        }
    }

    private final void P() {
        boolean bl = false;
        for (int i = 0; i < this.dk; ++i) {
            byte by = this.dg[i];
            if (by <= 0) {
                byte by2;
                byte by3 = this.dd[i];
                byte by4 = this.de[i];
                byte by5 = this.df[i];
                boolean bl2 = true;
                if (by4 - by5 >= 0 && this.cr[by4 - by5][by3] == -1 && ((by2 = this.cq[by4 - by5][by3]) & 0xFF) >= 0 && (by2 & 0xFF) <= 93) {
                    this.cr[by4 - by5 + 1][by3] = -34;
                    if (by5 <= 1) {
                        this.cr[by4][by3] = -18;
                    }
                    this.cr[by4 - by5][by3] = -50;
                    this.df[i] = (byte)(by5 + 1);
                    this.dg[i] = 16;
                    bl2 = false;
                    bl = true;
                }
                if (!bl2) continue;
                for (int j = i; j < this.dk - 1; ++j) {
                    this.dd[j] = this.dd[j + 1];
                    this.de[j] = this.de[j + 1];
                    this.dg[j] = this.dg[j + 1];
                }
                --this.dk;
                --i;
                continue;
            }
            this.dg[i] = (byte)(by - 1);
        }
        if (bl) {
            this.f(this.bF, this.bG);
        }
    }

    private final void Q() {
        int n = 48;
        if (this.cc < this.bG) {
            n -= 24;
        } else if (this.cc > this.bG) {
            n += 24;
        }
        int n2 = 0;
        while (n2 < 5) {
            if (this.ce[n2] >> this.r > this.v) {
                this.cd[n2] = this.b(this.u) << this.r;
                this.ce[n2] = -(this.b(10) << this.r);
            }
            int n3 = n2;
            this.cd[n3] = this.cd[n3] + (this.b(3) - 1 << this.r);
            int n4 = n2++;
            this.ce[n4] = this.ce[n4] + n;
        }
        this.cc = this.bG;
    }

    private final void R() {
        if (this.by) {
            this.bx = (byte)(this.bx + 1);
            if (this.bx >= 8) {
                this.by = false;
                this.bx = (byte)8;
            }
        } else {
            this.bx = (byte)(this.bx - 1);
            if (this.bx <= 0) {
                this.by = true;
                this.bx = 0;
            }
        }
        int n = this.bt >> this.r;
        int n2 = this.bu >> this.r;
        if (n == this.bv) {
            this.bv = this.b(this.aq + 1 - 24);
        }
        if (n2 == this.bw) {
            this.bw = this.b(this.ar + 1 - 24);
        }
        int n3 = this.b(48);
        this.bt += n < this.bv ? n3 : -n3;
        n3 = this.b(24);
        this.bu += n2 < this.bw ? n3 : -n3;
    }

    private final void S() {
        if (this.bD == 0) {
            int n;
            int n2;
            this.bz = (this.bz + 1) % 8;
            this.bA = (this.bA + 1) % 6;
            this.bB = (this.bB + 1) % 4;
            this.bC = (this.bC + 1) % 3;
            for (int i = 0; i < 3; ++i) {
                int n3 = this.ab[i] + 1;
                if (n3 == 0 || n3 >= 8) {
                    n2 = this.b(this.u) + this.bF;
                    if (this.c(n2 / this.h, (n = this.b(this.v) + this.bG) / this.i) == -1) {
                        int n4 = this.b(n2 / this.h, n / this.i) & 0xFF;
                        if (n4 < 71 || n4 > 76) {
                            n3 = -1;
                        }
                    } else {
                        n3 = -1;
                    }
                    this.Z[i] = (short)n2;
                    this.aa[i] = (short)n;
                }
                this.ab[i] = n3;
            }
            for (n = 0; n < this.dB; ++n) {
                for (n2 = 0; n2 < this.dA; ++n2) {
                    boolean bl = false;
                    byte by = this.dD[n][n2];
                    byte by2 = this.dE[n][n2];
                    switch (by) {
                        case -75: 
                        case -74: 
                        case -73: 
                        case -72: 
                        case 86: 
                        case 87: 
                        case 88: 
                        case 89: 
                        case 90: 
                        case 91: 
                        case 92: 
                        case 93: {
                            bl = true;
                            break;
                        }
                        case -106: {
                            if (this.cy != 0) break;
                            bl = true;
                        }
                    }
                    if (!bl) {
                        switch (by2) {
                            case -48: {
                                bl = this.cW;
                                break;
                            }
                            case -47: {
                                bl = this.cX;
                                break;
                            }
                            case -46: {
                                bl = this.cY;
                                break;
                            }
                            case -45: {
                                bl = this.cZ;
                                break;
                            }
                            case -12: {
                                bl = true;
                                break;
                            }
                            case -8: {
                                bl = this.bE;
                            }
                        }
                    }
                    if (!bl) continue;
                    this.a(by, by2, n2 * this.h, n * this.i);
                }
            }
        }
        if (this.bB == 0) {
            if (this.bE) {
                this.bE = false;
            } else if (this.b(7) == 0) {
                this.bE = true;
            }
        }
        ++this.bD;
        if (this.bD >= 4) {
            this.bD = 0;
        }
    }

    private final void T() {
        this.bJ = 0;
        this.bK = 0;
        this.d(this.am, this.an);
        this.bO = 0;
        this.bN = 0;
        this.bQ = 0;
        this.bP = 0;
        this.ba = true;
        this.V();
    }

    private final void d(int n, int n2) {
        this.bL = n + this.j - (this.du >> 1) + this.bJ;
        this.bM = n2 + this.k - (this.dv >> 1) + this.bK;
        this.U();
    }

    private final void U() {
        if (this.bL < 0) {
            this.bL = 0;
        } else if (this.bL > this.bH) {
            this.bL = this.bH;
        }
        if (this.bM < 0) {
            this.bM = 0;
        } else if (this.bM > this.bI) {
            this.bM = this.bI;
        }
    }

    private final void V() {
        int n = this.bL - this.bF;
        int n2 = this.bM - this.bG;
        boolean bl = true;
        boolean bl2 = true;
        if (n < 0) {
            n = -n;
            bl = false;
        }
        if (n2 < 0) {
            n2 = -n2;
            bl2 = false;
        }
        if (n != 0) {
            if (n > this.bP + this.bN) {
                if (this.bN < (this.ba || this.dR || this.aQ > 0 ? 24 : 6)) {
                    ++this.bN;
                    this.bP += this.bN;
                }
            } else if (n < this.bP + this.bN && this.bN > 1) {
                this.bP -= this.bN;
                --this.bN;
            }
        } else {
            this.bP = 0;
            this.bN = 0;
        }
        if (n2 != 0) {
            if (n2 > this.bQ + this.bO) {
                if (this.bO < (this.ba || this.dR || this.aQ > 0 ? 24 : 6)) {
                    ++this.bO;
                    this.bQ += this.bO;
                }
            } else if (n2 < this.bQ + this.bO && this.bO > 1) {
                this.bQ -= this.bO;
                --this.bO;
            }
        } else {
            this.bQ = 0;
            this.bO = 0;
        }
        if (n - this.bN < 0) {
            this.bN = n;
        }
        if (n2 - this.bO < 0) {
            this.bO = n2;
        }
        this.bF += bl ? this.bN : -this.bN;
        this.bG += bl2 ? this.bO : -this.bO;
        this.g(this.bF, this.bG);
        if (this.ba && this.bL == this.bF && this.bM == this.bG) {
            this.ba = false;
        }
    }

    private final void W() {
        for (int i = 0; i < this.co.length; ++i) {
            this.co[i] = this.a(this.co[i], "/b" + i + ".png");
        }
        this.cp = this.a(this.cp, "/ta.png");
        this.ci = this.a(this.ci, "/hud.png");
        this.cm = this.a(this.cm, "/bf.png");
        this.cn = this.a(this.cn, "/alarm.png");
    }

    private final void c(boolean bl) {
        for (int i = 0; i < (bl ? 9 : 10); ++i) {
            this.co[i] = null;
        }
        if (!bl) {
            this.cp = null;
        }
        this.cm = null;
        this.cn = null;
    }

    private final void X() {
        this.W();
        this.Y();
    }

    private final void Y() {
        String string;
        int n;
        this.X = false;
        this.b(true, -1);
        this.cM = (short)-1;
        this.cK = (short)-1;
        this.cI = (short)-1;
        this.cG = (short)-1;
        this.cZ = false;
        this.cY = false;
        this.cX = false;
        this.cW = false;
        this.cO = (short)-1;
        this.dl = -1;
        this.do = (byte)-1;
        this.cS = false;
        if (this.bS == 0) {
            this.E = false;
            this.F = false;
        }
        this.e(this.bS, this.bR);
        this.ab();
        if (this.cS) {
            for (n = 0; n < 5; ++n) {
                this.cd[n] = this.b(this.u) << this.r;
                this.ce[n] = this.b(this.v) << this.r;
            }
        } else {
            this.bv = this.b(2) == 0 ? -24 : this.aq + 1;
            this.bw = this.b(this.ar + 1 - 24);
            this.bt = this.bv << this.r;
            this.bu = this.bw << this.r;
        }
        this.bn = -1;
        this.bU = 0;
        this.dc = false;
        this.da = false;
        this.db = false;
        this.cz = 0;
        this.bY = true;
        this.bW = 0L;
        this.bz = 0;
        this.bA = 0;
        this.bB = 0;
        this.bC = 0;
        this.dQ = false;
        this.av = 0;
        this.at = 6;
        this.bb = false;
        this.bc = false;
        this.as = 9;
        this.bd = false;
        this.be = false;
        this.cV = false;
        this.cU = false;
        this.cT = false;
        this.aK = 0;
        this.aL = 0;
        this.aw = -1;
        this.bf = false;
        this.bg = false;
        this.bj = false;
        this.aY = 0;
        this.bl = false;
        this.bk = false;
        this.aU = 0;
        this.bh = false;
        this.aZ = 0;
        this.bi = false;
        this.ax = 0;
        this.az = 0;
        this.aT = 0;
        this.aX = (byte)-1;
        this.aQ = 0;
        this.aX = (byte)-1;
        this.aW = (byte)-1;
        this.aB = -1;
        this.aC = -1;
        this.aO = -1;
        this.aE = -1;
        this.aR = -1;
        this.aI = -1;
        this.aG = -1;
        for (n = 0; n < 5; ++n) {
            this.ab[n] = (byte)(-this.b(8) - 1);
        }
        this.aq = this.ds * this.h - 1;
        this.ar = this.dt * this.i - 1;
        this.bH = this.aq - this.du;
        this.bI = this.ar - this.dv;
        if (this.bH < 0) {
            this.bH = 0;
        }
        if (this.bI < 0) {
            this.bI = 0;
        }
        this.dR = false;
        this.ba = false;
        this.bJ = 0;
        this.bK = 0;
        this.d(this.am, this.an);
        this.bF = this.bL;
        this.bG = this.bM;
        this.ad();
        this.f(this.bF, this.bG);
        if (this.bS != 0) {
            string = this.bR == 11 || this.bR == 12 ? this.a[42] : this.a[39] + this.bS + '-' + this.bR;
        } else {
            switch (this.bR) {
                case 1: {
                    string = this.a[22];
                    break;
                }
                case 2: {
                    string = this.a[40];
                    break;
                }
                case 3: {
                    string = this.a[41];
                    break;
                }
                case 4: {
                    string = this.a[42];
                    break;
                }
                default: {
                    string = this.a[43];
                }
            }
        }
        this.a((byte)75, string, (byte)1);
        this.b(this.F());
    }

    private final void a(byte by, String string, byte by2) {
        this.ec = by;
        this.ee = string;
        this.ed = by2;
    }

    private final Image a(Image image, String string) {
        if (image != null) {
            return image;
        }
        try {
            return Image.createImage((String)string);
        }
        catch (Throwable throwable) {
            this.c();
            return null;
        }
    }

    private final void Z() {
        this.cq = null;
        this.cr = null;
        this.cA = null;
        this.cB = null;
        this.cC = null;
        this.cE = null;
        this.cF = null;
        this.cD = null;
        this.dd = null;
        this.de = null;
        this.df = null;
        this.dg = null;
    }

    private final void aa() {
        int n = 0;
        for (int i = 1; i <= 4; ++i) {
            this.d(i);
            this.cv[n] = this.cs;
            this.cw[n] = this.cu;
            ++n;
        }
    }

    private final void d(int n) {
        int n2 = 1;
        if (this.y.compareTo("DE") == 0) {
            n2 = 0;
        } else if (this.y.compareTo("EN") == 0) {
            n2 = 1;
        } else if (this.y.compareTo("FR") == 0) {
            n2 = 2;
        } else if (this.y.compareTo("IT") == 0) {
            n2 = 3;
        } else if (this.y.compareTo("SP") == 0) {
            n2 = 4;
        } else if (this.y.compareTo("PG") == 0) {
            n2 = 5;
        }
        try {
            InputStream inputStream = this.getClass().getResourceAsStream((n < 10 ? "0" : "") + n + ".dat");
            DataInputStream dataInputStream = new DataInputStream(inputStream);
            dataInputStream.readShort();
            this.cu = dataInputStream.readByte();
            for (int i = 0; i <= n2; ++i) {
                this.cs = dataInputStream.readUTF();
                this.ct = dataInputStream.readUTF();
            }
            dataInputStream.close();
            dataInputStream = null;
        }
        catch (Exception exception) {
            this.c();
        }
    }

    private final void e(int n, int n2) {
        this.Z();
        this.bV = 0;
        try {
            int n3;
            int n4;
            int n5;
            int n6;
            InputStream inputStream = this.getClass().getResourceAsStream((n < 10 ? "0" : "") + n + ".dat");
            DataInputStream dataInputStream = new DataInputStream(inputStream);
            for (n6 = 0; n6 < n2; ++n6) {
                int n7;
                for (n5 = dataInputStream.readShort(); (n7 = dataInputStream.skipBytes(n5)) < n5; n5 -= n7) {
                }
            }
            dataInputStream.readShort();
            this.ds = dataInputStream.readByte();
            this.dt = dataInputStream.readByte();
            this.cq = new byte[this.dt][this.ds];
            for (n6 = 0; n6 < this.dt; ++n6) {
                dataInputStream.readFully(this.cq[n6]);
            }
            this.cr = new byte[this.dt][this.ds];
            for (n4 = 0; n4 < this.dt; ++n4) {
                for (n3 = 0; n3 < this.ds; ++n3) {
                    this.cr[n4][n3] = -1;
                }
            }
            this.cx = dataInputStream.readByte();
            this.cA = new byte[this.cx];
            this.cB = new byte[this.cx];
            this.cC = new byte[this.cx];
            this.cE = new short[this.cx];
            this.cF = new short[this.cx];
            this.cD = new boolean[this.cx];
            n5 = dataInputStream.readShort();
            int n8 = 0;
            for (n6 = 0; n6 < n5; ++n6) {
                byte by = dataInputStream.readByte();
                n3 = dataInputStream.readByte();
                n4 = dataInputStream.readByte();
                boolean bl = false;
                switch (by) {
                    case -32: 
                    case -31: 
                    case -30: 
                    case -20: {
                        this.cE[n8] = (short)(n3 * this.h);
                        this.cF[n8] = (short)(n4 * this.i);
                        this.cB[n8] = 4;
                        this.cC[n8] = 0;
                        this.cA[n8] = by;
                        ++n8;
                        bl = true;
                        break;
                    }
                    case -41: {
                        this.cr[n4][n3 + 1] = -40;
                        this.cr[n4][n3 + 2] = -39;
                        break;
                    }
                    case -38: {
                        this.cr[n4 + 1][n3] = -22;
                        break;
                    }
                    case -37: {
                        this.cr[n4 + 1][n3] = -21;
                        break;
                    }
                    case -25: {
                        this.cr[n4 + 1][n3] = -9;
                        break;
                    }
                    case -8: {
                        ++this.bV;
                    }
                }
                if (bl) continue;
                this.cr[n4][n3] = by;
            }
            dataInputStream.close();
            dataInputStream = null;
        }
        catch (Exception exception) {
            this.c();
        }
    }

    private final void ab() {
        byte[] byArray = new byte[]{0, 0, 0, 0, 0, 0, 0};
        if (this.bS == 0 && this.bR == 1) {
            byArray[6] = (byte)(1 - this.D[6]);
            byArray[4] = (byte)(2 - this.D[4]);
            byArray[5] = (byte)(1 - this.D[5]);
            byArray[2] = (byte)(1 - this.D[2]);
            byArray[3] = (byte)(1 - this.D[3]);
            byArray[0] = (byte)(1 - this.D[0]);
            byArray[1] = (byte)(1 - this.D[1]);
        }
        this.cy = 0;
        int n = 0;
        this.cR = this.bS != 0 && (this.bR == 11 || this.bR == 12);
        for (int i = 0; i < this.dt; ++i) {
            for (int j = 0; j < this.ds; ++j) {
                byte by = this.cq[i][j];
                byte by2 = this.cr[i][j];
                if (by == -107) {
                    this.ao = j;
                    this.ap = i;
                    this.am = j * this.h;
                    this.an = i * this.i;
                } else if (by == -56) {
                    ++this.cy;
                } else if (by == 77) {
                    this.cS = true;
                } else if (this.bS == 0 && this.bR == 1 && (by & 0xFF) >= 151 && (by & 0xFF) <= 157) {
                    int n2 = (by & 0xFF) - 151;
                    if (byArray[n2] > 0) {
                        int n3 = n2;
                        byArray[n3] = (byte)(byArray[n3] - 1);
                    } else {
                        this.cq[i][j] = -98;
                    }
                }
                if (by2 == -54) {
                    this.cQ = true;
                    ++this.cy;
                    continue;
                }
                if (by2 == -53) {
                    this.cQ = false;
                    ++this.cy;
                    continue;
                }
                if (by2 == -33) {
                    ++n;
                    continue;
                }
                if (by2 == -48) {
                    this.cG = (short)j;
                    this.cH = (short)i;
                    continue;
                }
                if (by2 == -47) {
                    this.cI = (short)j;
                    this.cJ = (short)i;
                    continue;
                }
                if (by2 == -46) {
                    this.cK = (short)j;
                    this.cL = (short)i;
                    continue;
                }
                if (by2 == -45) {
                    this.cM = (short)j;
                    this.cN = (short)i;
                    continue;
                }
                if (by2 != -41) continue;
                this.cO = (short)j;
                this.cP = (short)i;
            }
        }
        this.dk = 0;
        this.dd = new byte[n];
        this.de = new byte[n];
        this.df = new byte[n];
        this.dg = new byte[n];
        this.dn = 0;
    }

    private final void b(int n, int n2, boolean bl) {
        this.du = n;
        this.dv = n2;
        this.dC = bl;
        this.dw = (n + this.h - 1) / this.h;
        this.dx = (n2 + this.i - 1) / this.i;
        int n3 = !this.dC ? 3 : 1;
        this.dA = this.dw + n3;
        this.dB = this.dx + n3;
        this.dy = this.dA * this.h;
        this.dz = this.dB * this.i;
    }

    private final void ac() {
        this.dG = null;
        this.dF = null;
        this.dF = Image.createImage((int)this.dy, (int)this.dz);
        this.dG = this.dF.getGraphics();
        this.dE = null;
        this.dD = this.dE;
        this.dD = new byte[this.dB][this.dA];
        this.dE = new byte[this.dB][this.dA];
        for (int i = 0; i < this.dB; ++i) {
            for (int j = 0; j < this.dA; ++j) {
                this.dD[i][j] = -1;
                this.dE[i][j] = 0;
            }
        }
    }

    private final void ad() {
        this.dG.setColor(0);
        this.dG.setClip(0, 0, this.dy, this.dz);
        this.dG.fillRect(0, 0, this.dy, this.dz);
        for (int i = 0; i < this.dB; ++i) {
            for (int j = 0; j < this.dA; ++j) {
                this.dD[i][j] = -1;
                this.dE[i][j] = 0;
            }
        }
    }

    private final void f(int n, int n2) {
        int n3 = !this.dC ? 1 : 0;
        int n4 = n / this.h - n3;
        int n5 = n2 / this.i - n3;
        int n6 = n4 + this.dw + n3;
        int n7 = n5 + this.dx + n3;
        if (n4 < 0) {
            n4 = 0;
        }
        if (n6 >= this.ds) {
            n6 = this.ds - 1;
        }
        if (n5 < 0) {
            n5 = 0;
        }
        if (n7 >= this.dt) {
            n7 = this.dt - 1;
        }
        int n8 = n4 % this.dA;
        int n9 = n5 % this.dB;
        for (int i = n5; i <= n7; ++i) {
            int n10 = n8;
            for (int j = n4; j <= n6; ++j) {
                this.c(j, i, n10, n9);
                if (++n10 < this.dA) continue;
                n10 = 0;
            }
            if (++n9 < this.dB) continue;
            n9 = 0;
        }
    }

    private final void g(int n, int n2) {
        int n3;
        int n4 = !this.dC ? 1 : 0;
        int n5 = n / this.h - n4;
        int n6 = n2 / this.i - n4;
        int n7 = n5 + this.dw + n4;
        int n8 = n6 + this.dx + n4;
        int n9 = n5 >= 0 ? n5 : 0;
        int n10 = n7 < this.ds ? n7 : this.ds - 1;
        int n11 = n6 % this.dB;
        int n12 = n8 % this.dB;
        int n13 = n9 % this.dA;
        for (n3 = n9; n3 <= n10; ++n3) {
            if (n6 >= 0) {
                this.c(n3, n6, n13, n11);
            }
            if (n8 < this.dt) {
                this.c(n3, n8, n13, n12);
            }
            if (++n13 < this.dA) continue;
            n13 = 0;
        }
        n9 = n6 >= 0 ? n6 : 0;
        n10 = n8 < this.dt ? n8 : this.dt - 1;
        n11 = n5 % this.dA;
        n12 = n7 % this.dA;
        int n14 = n9 % this.dB;
        for (n3 = n9; n3 <= n10; ++n3) {
            if (n5 >= 0) {
                this.c(n5, n3, n11, n14);
            }
            if (n7 < this.ds) {
                this.c(n7, n3, n12, n14);
            }
            if (++n14 < this.dB) continue;
            n14 = 0;
        }
    }

    private final void c(int n, int n2, int n3, int n4) {
        byte by = this.cq[n2][n];
        byte by2 = this.cr[n2][n];
        if (this.dD[n4][n3] == by && this.dE[n4][n3] == by2) {
            return;
        }
        this.dD[n4][n3] = by;
        this.dE[n4][n3] = by2;
        this.a(by, by2, n3 * this.h, n4 * this.i);
    }

    private final void d(Graphics graphics, int n, int n2) {
        if (this.dF != null) {
            boolean bl = false;
            boolean bl2 = false;
            int n3 = n % this.dy;
            int n4 = n2 % this.dz;
            if (n3 + this.du > this.dy) {
                bl = true;
            }
            if (n4 + this.dv > this.dz) {
                bl2 = true;
            }
            graphics.drawImage(this.dF, -n3, -n4, 20);
            if (bl) {
                graphics.drawImage(this.dF, this.dy - n3, -n4, 20);
            }
            if (bl2) {
                graphics.drawImage(this.dF, -n3, this.dz - n4, 20);
            }
            if (bl && bl2) {
                graphics.drawImage(this.dF, this.dy - n3, this.dz - n4, 20);
            }
        }
    }

    private final void d(boolean bl) {
        this.dT = bl;
    }

    private final void ae() {
        this.i();
        this.c(true);
        this.co[9] = this.a(this.co[9], "/b9.png");
        this.cp = this.a(this.cp, "/ta.png");
        this.dH = this.a(this.dH, "/title.png");
        this.bf = false;
        this.bg = false;
        this.aT = 0;
        this.aK = 0;
        this.bj = true;
        this.as = 0;
        this.av = 1;
        this.az = 0;
        this.at = 1;
        this.au = 0;
        this.aC = 0;
        this.aD = 0;
        this.aF = (this.w - this.dH.getHeight() - this.i - 72 >> 1) + this.dH.getHeight() + this.i + (this.i >> 1);
        this.am = -120;
        this.an = this.w;
        this.ao = this.am << this.r;
        this.ap = this.an << this.r;
        this.m();
        this.b(true, -1);
        this.x = 4;
        this.b("/title.mid");
        this.dJ = 0;
        this.dK = true;
        this.d(false);
        this.U = false;
    }

    private final boolean af() {
        if (this.cb == 0 && this.U) {
            this.T = false;
            this.S = false;
            this.R = false;
            this.c((byte)0, (byte)-1);
            return true;
        }
        ++this.dJ;
        if (this.dJ >= 20) {
            this.dJ = 0;
            this.dK = !this.dK;
        }
        this.ao += this.aC;
        this.am = this.ao >> this.r;
        this.ap += this.aD;
        this.an = this.ap >> this.r;
        if (this.an <= this.aF) {
            this.aD = 0;
        }
        switch (this.au) {
            case 0: {
                ++this.az;
                if (this.az < 64) break;
                this.aC = 3 << this.r + 1;
                this.aD = -(1 << this.r);
                ++this.au;
                break;
            }
            case 1: {
                if (this.am <= this.u - this.h >> 1) break;
                ++this.au;
                break;
            }
            case 2: {
                if (this.aC > 0) {
                    this.aC -= 4;
                    break;
                }
                ++this.au;
                break;
            }
            case 3: {
                if (this.aC > -(2 << this.r)) {
                    this.aC -= 4;
                }
                if (this.am > (this.u - this.h >> 1) + this.j) break;
                ++this.au;
                break;
            }
            case 4: {
                if (this.aC < 0) {
                    this.aC += 4;
                    break;
                }
                this.aC = 0;
                ++this.au;
            }
        }
        this.L();
        this.n();
        return true;
    }

    private final int e(int n) {
        switch (this.dM) {
            case 0: {
                return 0;
            }
            case 1: {
                return this.dO[this.dL] * n >> 8;
            }
        }
        return this.dO[18 - this.dL] * n >> 8;
    }

    private final void a(boolean bl, int n) {
        this.dM = (byte)(bl ? 1 : 2);
        this.dN = (byte)n;
        this.dL = 18;
    }

    private final void c(byte by, byte by2) {
        int n;
        int n2;
        int n3 = 0;
        int n4 = -1;
        this.dW = by;
        this.eb = by2;
        if (!this.dS) {
            if (!this.dQ) {
                this.k();
            }
            this.d(false);
            this.dS = true;
        }
        this.dU = new String[20];
        this.dV = new short[20];
        this.ea = 0;
        this.dX = 0;
        switch (by) {
            case 0: {
                for (n2 = 0; n2 < 4; ++n2) {
                    if (this.A[n2] <= 0) continue;
                    this.dU[n3] = this.a[1];
                    this.dV[n3++] = 1;
                    break;
                }
                this.dU[n3] = this.a[0];
                this.dV[n3++] = 0;
                this.dU[n3] = this.a[22];
                this.dV[n3++] = 20;
                this.dU[n3] = this.a[23];
                this.dV[n3++] = 14;
                if (this.M[0].length() > 0) {
                    this.dU[n3] = this.a[24];
                    this.dV[n3++] = 15;
                }
                this.dU[n3] = this.a[18];
                this.dV[n3++] = 10;
                this.dU[n3] = this.a[4] + this.a[this.c == 1 ? 2 : 3];
                this.dV[n3++] = 11;
                this.dU[n3] = this.a[5] + this.bq;
                this.dV[n3++] = 13;
                if (this.D[3] > 0) {
                    this.dU[n3] = this.a[6];
                    this.dV[n3++] = 16;
                }
                this.dU[n3] = this.a[17];
                this.dV[n3++] = 12;
                this.dU[n3] = this.a[19];
                this.dV[n3++] = 3;
                this.dU[n3] = this.a[21];
                this.dV[n3++] = 4;
                break;
            }
            case 1: {
                if (this.bS != 0) {
                    if (this.C) {
                        this.dU[n3] = "CHEAT!";
                        this.dV[n3++] = 99;
                    }
                    if (this.D[5] > 0) {
                        this.dU[n3] = this.a[87] + this.a[this.F ? 2 : 3];
                        this.dV[n3++] = 30;
                    }
                    if (this.D[6] > 0) {
                        this.dU[n3] = this.a[88] + this.a[this.E ? 2 : 3];
                        this.dV[n3++] = 31;
                    }
                    if (!this.dc) {
                        this.dU[n3] = this.a[27];
                        this.dV[n3++] = 6;
                    }
                    this.dU[n3] = this.a[18];
                    this.dV[n3++] = 10;
                }
                this.dU[n3] = this.a[4] + this.a[this.c == 1 ? 2 : 3];
                this.dV[n3++] = 11;
                if (this.bS != 0 && this.D[4] > 0) {
                    this.dU[n3] = this.a[89] + (this.H != -1 ? Integer.toString(this.H + 1) : this.a[90]);
                    this.dV[n3++] = 32;
                    n4 = this.a[89].length() + this.a[90].length();
                }
                this.dU[n3] = this.a[20];
                this.dV[n3++] = 8;
                break;
            }
            case 2: {
                int n5;
                n = 0;
                int n6 = 0;
                while ((n5 = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(59, n6)) != -1) {
                    ++n;
                    n6 = n5 + 1;
                }
                n6 = 0;
                for (n2 = 0; n2 < n; ++n2) {
                    n5 = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(61, n6);
                    this.dU[n3] = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(n6, n5);
                    n6 = n5 + 1;
                    this.dV[n3++] = (short)n6;
                    n5 = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(59, n6);
                    if (this.y.compareTo("DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(n6, n5)) == 0) {
                        this.dX = (byte)n2;
                    }
                    n6 = n5 + 1;
                }
                break;
            }
            case 3: {
                int n5 = 0;
                for (n2 = 1; n2 <= 4; ++n2) {
                    if (by2 == 0 || by2 == 1 && this.A[n5] > 0) {
                        this.dU[n3] = this.cv[n5];
                        this.dV[n3++] = (short)n2;
                    }
                    ++n5;
                }
                break;
            }
            case 4: {
                if (this.D[0] > 0) {
                    this.dU[n3] = this.a[25];
                    this.dV[n3++] = 1;
                }
                if (this.D[1] <= 0) break;
                this.dU[n3] = this.a[26];
                this.dV[n3++] = 2;
                break;
            }
            case 5: {
                this.dU[n3] = this.a[7];
                this.dV[n3++] = 0;
                this.dU[n3] = this.a[8];
                this.dV[n3++] = 1;
                this.dU[n3] = this.a[9];
                this.dV[n3++] = 2;
                this.dU[n3] = this.a[12];
                this.dV[n3++] = 3;
                this.dU[n3] = this.a[13];
                this.dV[n3++] = 4;
                this.dU[n3] = this.a[14];
                this.dV[n3++] = 5;
                this.dU[n3] = this.a[15];
                this.dV[n3++] = 6;
                this.dU[n3] = this.a[16];
                this.dV[n3++] = 7;
                this.dU[n3] = this.a[10];
                this.dV[n3++] = 8;
                this.dU[n3] = this.a[11];
                this.dV[n3++] = 9;
            }
        }
        this.dY = (byte)n3;
        this.ef = this.w - Math.min(this.dZ, n3) * 31 >> 1;
        if (this.dX >= n3) {
            this.dX = (byte)(n3 - 1);
        }
        if (this.ea > this.dX) {
            this.ea = this.dX;
        }
        if (this.dX >= this.ea + this.dZ) {
            this.ea = (byte)(this.dX - this.dZ + 1);
        }
        this.eg = n4 == -1 ? 0 : n4;
        for (n2 = 0; n2 < n3; ++n2) {
            n = this.dU[n2].length();
            if (n <= this.eg) continue;
            this.eg = n;
        }
        this.eg = (this.eg + 1) * 12 + 10;
        if (this.dW == 2) {
            this.eh = (this.u - this.eg >> 1) - 27;
            this.eg += 78;
        } else if (this.dW == 3) {
            this.eh = (this.u - this.eg >> 1) - 31;
            this.ei = this.u - this.eh - 31;
            this.eg += 86;
        }
        this.eg = Math.max((this.u << 1) / 3, this.eg);
        this.a(true, -1);
    }

    private final boolean ag() {
        boolean bl = false;
        if (this.dM == 0) {
            if (this.N) {
                this.N = false;
                this.dX = this.dX > 0 ? (byte)(this.dX - 1) : (byte)(this.dY - 1);
                if (this.dX < this.ea) {
                    this.ea = this.dX;
                } else if (this.dX >= this.ea + this.dZ) {
                    this.ea = (byte)(this.dX - this.dZ + 1);
                }
                bl = true;
            } else if (this.O) {
                this.O = false;
                this.Q = false;
                this.dX = this.dX < this.dY - 1 ? (byte)(this.dX + 1) : (byte)0;
                if (this.dX < this.ea) {
                    this.ea = this.dX;
                } else if (this.dX >= this.ea + this.dZ) {
                    this.ea = (byte)(this.dX - this.dZ + 1);
                }
                bl = true;
            } else if (this.Q || this.P) {
                bl = this.e(this.P);
                this.P = false;
                this.Q = false;
            } else if (this.S || this.R) {
                this.U = false;
                this.R = false;
                this.S = false;
                short s = this.dV[this.dX];
                if (this.dW == 5 || this.dW != 2 && (s == 11 || s == 13 || s == 30 || s == 31 || s == 32 || s == 101)) {
                    bl = this.ah();
                } else {
                    if (this.dW == 0 && s != 0 && s != 1 && s != 16 && s != 12 || this.dW == 1 && s != 99 && s != 100 || this.dW == 3) {
                        this.b(false, -1);
                    }
                    this.a(false, 0);
                }
            } else if (this.T) {
                this.U = false;
                this.T = false;
                if (this.x != 11) {
                    this.a(false, 1);
                }
            }
        } else {
            --this.dL;
            if (this.dL < 0) {
                this.dL = 0;
                if (this.cb <= 0) {
                    if (this.dM == 2) {
                        this.dM = 0;
                        switch (this.dN) {
                            case 0: {
                                this.ah();
                                break;
                            }
                            case 1: {
                                this.ai();
                            }
                        }
                    } else {
                        this.dM = 0;
                    }
                }
            }
            bl = true;
        }
        return bl;
    }

    private final boolean e(boolean bl) {
        boolean bl2 = false;
        if (this.dW == 0 && this.dV[this.dX] == 13) {
            if (bl && this.bq > 1) {
                bl2 = true;
                this.bq = (byte)(this.bq - 1);
            } else if (!bl && this.bq < 5) {
                bl2 = true;
                this.bq = (byte)(this.bq + 1);
            }
            if (bl2) {
                if (this.c == 1) {
                    this.a();
                    this.b("/title.mid");
                }
                this.g();
                this.dU[this.dX] = this.a[5] + this.bq;
            }
        }
        return bl2;
    }

    private final boolean ah() {
        boolean bl = false;
        boolean bl2 = false;
        int n = this.dV[this.dX];
        switch (this.dW) {
            case 0: 
            case 1: {
                switch (n) {
                    case 0: 
                    case 1: {
                        this.c((byte)3, (byte)n);
                        bl = true;
                        break;
                    }
                    case 3: {
                        this.a(this.a[52], 0, (byte)-1);
                        this.dS = false;
                        bl = true;
                        break;
                    }
                    case 4: {
                        this.d((byte)1);
                        return true;
                    }
                    case 6: {
                        this.i();
                        this.Y();
                        this.x = 1;
                        this.d(true);
                        bl2 = true;
                        break;
                    }
                    case 8: {
                        if (this.bS != 0 || this.bR == 4) {
                            this.d((byte)0);
                        } else {
                            this.aj();
                            if (this.bR == 1 || this.bR == 5) {
                                this.ae();
                            } else if (this.bR == 2 || this.bR == 3) {
                                this.x();
                            }
                        }
                        return true;
                    }
                    case 10: {
                        this.ao();
                        this.dS = false;
                        bl = true;
                        break;
                    }
                    case 11: {
                        this.c = this.c == 1 ? (byte)0 : 1;
                        if (this.x == 4) {
                            if (this.c == 0) {
                                this.a();
                            } else {
                                this.b("/title.mid");
                            }
                        } else if (this.c == 0) {
                            this.a();
                        } else {
                            this.b(this.F());
                        }
                        this.g();
                        this.dU[this.dX] = this.a[4] + this.a[this.c == 1 ? 2 : 3];
                        bl = true;
                        break;
                    }
                    case 12: {
                        this.c((byte)2, (byte)-1);
                        bl = true;
                        break;
                    }
                    case 13: {
                        this.bq = (byte)(this.bq + 1);
                        if (this.bq > 5) {
                            this.bq = 1;
                        }
                        if (this.c == 1) {
                            this.a();
                            this.b("/title.mid");
                        }
                        this.g();
                        this.dU[this.dX] = this.a[5] + this.bq;
                        bl = true;
                        break;
                    }
                    case 14: {
                        this.x();
                        this.dH = null;
                        break;
                    }
                    case 15: {
                        String string = this.a[122];
                        for (int i = 0; i < this.M.length && this.M[i].length() > 0; ++i) {
                            string = string + this.M[i] + '#';
                            if (i != 0) continue;
                            string = string + '#';
                        }
                        this.a(string, 0, (byte)-1);
                        this.dS = false;
                        bl = true;
                        break;
                    }
                    case 16: {
                        this.c((byte)5, (byte)0);
                        bl = true;
                        break;
                    }
                    case 20: {
                        this.i();
                        this.dH = null;
                        if (this.c == 1) {
                            this.a();
                        }
                        this.bS = 0;
                        this.bR = 1;
                        this.X();
                        this.x = 1;
                        bl2 = true;
                        break;
                    }
                    case 30: {
                        this.F = !this.F;
                        this.g();
                        this.dU[this.dX] = this.a[87] + this.a[this.F ? 2 : 3];
                        bl = true;
                        break;
                    }
                    case 31: {
                        this.E = !this.E;
                        this.g();
                        this.dU[this.dX] = this.a[88] + this.a[this.E ? 2 : 3];
                        bl = true;
                        break;
                    }
                    case 32: {
                        this.H = (byte)(this.H + 1);
                        if (this.H > this.D[4]) {
                            this.H = (byte)-1;
                        }
                        this.b(this.F());
                        this.g();
                        this.dU[this.dX] = this.a[89] + (this.H != -1 ? Integer.toString(this.H + 1) : this.a[90]);
                        bl = true;
                        break;
                    }
                    case 99: {
                        this.aj();
                        this.cy = 0;
                        this.d(false);
                        this.k();
                        if (this.dR) {
                            this.dR = false;
                            this.T();
                        }
                        this.au = this.at;
                        this.at = 6;
                        this.as = 0;
                        this.bb = true;
                        this.am();
                        bl = true;
                    }
                }
                break;
            }
            case 2: {
                String string = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(n, "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(59, n));
                if (string.compareTo(this.y) != 0) {
                    this.y = string;
                    this.a(this.y + ".dat");
                    this.g();
                    this.aa();
                }
                if (this.x != 11) {
                    this.c((byte)0, (byte)-1);
                } else {
                    this.aj();
                    this.d((byte)2);
                }
                bl = true;
                break;
            }
            case 3: {
                this.i();
                this.dH = null;
                if (this.c == 1) {
                    this.a();
                }
                if (this.G) {
                    this.bS = n;
                    if (this.eb == 0) {
                        this.bR = 1;
                    } else {
                        this.bR = this.A[n - 1];
                        if (this.bR == 11 && this.i(this.bS, 11)) {
                            this.bR = 3;
                        } else if (this.bR == 12 && this.i(this.bS, 12)) {
                            this.bR = 6;
                        }
                    }
                } else {
                    this.bT = n;
                    this.bS = 0;
                    this.bR = 5;
                }
                this.X();
                this.x = 1;
                bl2 = true;
                break;
            }
            case 5: {
                String string;
                switch (n) {
                    case 0: 
                    case 1: 
                    case 2: {
                        string = "/ingame" + n + ".mid";
                        break;
                    }
                    case 3: {
                        string = "/mow.mid";
                        break;
                    }
                    case 4: {
                        string = "/sandman.mid";
                        break;
                    }
                    case 5: {
                        string = "/shop.mid";
                        break;
                    }
                    case 6: {
                        string = "/universe.mid";
                        break;
                    }
                    case 7: {
                        string = "/fly.mid";
                        break;
                    }
                    case 8: {
                        string = "/bonus.mid";
                        break;
                    }
                    default: {
                        string = "/cleared.mid";
                    }
                }
                this.a(string, (int)this.bq, false);
            }
        }
        if (bl2) {
            this.aj();
            bl = true;
        }
        return bl;
    }

    private final boolean ai() {
        boolean bl = false;
        boolean bl2 = false;
        switch (this.dW) {
            case 0: 
            case 1: {
                bl2 = true;
                break;
            }
            case 2: 
            case 5: {
                this.a();
                this.b("/title.mid");
            }
            case 3: {
                this.c((byte)0, (byte)-1);
                bl = true;
            }
        }
        if (bl2) {
            this.aj();
            bl = true;
        }
        return bl;
    }

    private final void aj() {
        this.dS = false;
        if (this.x != 4 && this.x != 11) {
            this.d(true);
        }
        this.dU = null;
        this.dV = null;
        if (!this.dQ) {
            this.l();
        }
    }

    private final void a(Graphics graphics, boolean bl) {
        int n = 0;
        int n2 = this.ea;
        int n3 = this.ef;
        n3 -= this.e(this.v);
        int n4 = 31 - this.e(31);
        if (this.ea > 0) {
            this.b(graphics, this.ch, 0, 0, 17, 9, this.u - 17 >> 1, n3 - 9 - 2);
        }
        while (n < this.dZ && n2 < this.dY) {
            int n5;
            if (bl) {
                this.a(graphics, this.u - this.eg >> 1, n3, this.eg, 26, n2 == this.dX ? 41658 : 22935, 10370);
            }
            this.a(this.dU[n2], graphics, this.u - (this.dU[n2].length() - 1) * 12 - 10 >> 1, n3 + 3 + 2, false);
            if (this.dW == 2) {
                n5 = -1;
                String string = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(this.dV[n2], "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(59, (int)this.dV[n2]));
                if (string.compareTo("DE") == 0) {
                    n5 = 0;
                } else if (string.compareTo("EN") == 0) {
                    n5 = 1;
                } else if (string.compareTo("FR") == 0) {
                    n5 = 2;
                } else if (string.compareTo("IT") == 0) {
                    n5 = 3;
                } else if (string.compareTo("SP") == 0) {
                    n5 = 4;
                } else if (string.compareTo("PG") == 0) {
                    n5 = 5;
                }
                if (n5 != -1) {
                    this.b(graphics, this.cj, 72 + n5 * 27, 0, 27, 18, this.eh, n3 + 3 + 2 + -1);
                }
            } else if (this.dW == 3) {
                int n6;
                int n7;
                int n8;
                n5 = this.dV[n2];
                boolean bl2 = this.B[n5 - 1];
                if (bl2) {
                    this.b(graphics, this.cj, 18, 0, 31, 18, this.eh, n3 + 3 + 2 + -1);
                } else {
                    this.b(graphics, this.cj, 0, 0, 18, 18, this.eh + 6, n3 + 3 + 2 + -1);
                }
                byte by = this.cw[n5 - 1];
                switch (by) {
                    case 1: {
                        n8 = 9;
                        n7 = 11;
                        n6 = 9;
                        break;
                    }
                    case 2: {
                        n8 = 9;
                        n7 = 23;
                        n6 = 9;
                        break;
                    }
                    default: {
                        n8 = 0;
                        n7 = 23;
                        n6 = 18;
                    }
                }
                this.b(graphics, this.cj, 49, n8, n7, n7, this.ei + (31 - n7 >> 1), n3 + 3 + 2 + (16 - n6 >> 1));
            }
            n3 += n4;
            ++n2;
            ++n;
        }
        if (this.ea + this.dZ < this.dY) {
            this.b(graphics, this.ch, 0, 9, 17, 9, this.u - 17 >> 1, n3 + 2);
        }
        this.a(graphics, this.a[30], this.x != 11 ? this.a[29] : null, bl);
    }

    private final void d(Graphics graphics) {
        int n = 0;
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        int n5 = this.ej.length();
        int n6 = 0;
        int n7 = 0;
        if (graphics != null) {
            n = this.u - this.ek >> 1;
            n2 = this.w - this.el >> 1;
            this.a(graphics, n, n2, this.ek, this.el, 22935, 10370);
            n2 += 6;
        }
        while (n3 < n5) {
            char c = this.ej.charAt(n3);
            if (c == '#' || n3 == n5 - 1) {
                int n8;
                if (c != '#') {
                    ++n3;
                }
                if ((n8 = n3 - n4) > n6) {
                    n6 = n8;
                }
                if (graphics != null) {
                    n = this.u - n8 * 12 >> 1;
                    for (int i = n4; i < n3; ++i) {
                        this.a(graphics, n, n2, this.ej.charAt(i));
                        n += 12;
                    }
                    n2 += this.g;
                }
                n4 = n3 + 1;
                ++n7;
            }
            ++n3;
        }
        if (graphics == null) {
            this.ek = n6 * 12 + 16;
            this.el = n7 * this.g + 10;
        }
    }

    private final void a(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6) {
        graphics.setClip(n, n2, n3, n4);
        graphics.setColor(n6);
        graphics.fillRect(n, n2 + 1, n3, n4 - 2);
        graphics.fillRect(n + 1, n2, n3 - 2, n4);
        graphics.setColor(n5);
        graphics.fillRect(n + 3, n2 + 2, n3 - 6, n4 - 4);
        graphics.drawLine(n + 2, n2 + 3, n + 2, n2 + n4 - 4);
        graphics.drawLine(n + n3 - 3, n2 + 3, n + n3 - 3, n2 + n4 - 4);
    }

    private final void a(Graphics graphics, String string, byte by, int n) {
        int n2 = string.length() * 12 + 16;
        int n3 = this.g + 10;
        int n4 = this.u - n2 >> 1;
        if (by != 3) {
            n = by == 0 ? this.w - n3 >> 1 : (by == 1 ? 45 : this.w - n3 - 5);
        }
        this.a(graphics, n4, n, n2, n3, 22935, 10370);
        this.a(string, graphics, this.u >> 1, n + 6, true);
    }

    private final int a(String string, Graphics graphics, int n, int n2, boolean bl) {
        int n3 = string.length();
        int n4 = (n3 - 1) * 12 + 10;
        if (bl) {
            n -= n4 >> 1;
        }
        int n5 = n;
        for (int i = 0; i < n3; ++i) {
            this.a(graphics, n, n2, string.charAt(i));
            n += 12;
        }
        return n5;
    }

    private final void a(Graphics graphics, int n, int n2, int n3, int n4) {
        int n5 = 10;
        int n6 = 1;
        n += 13 * (n4 - 1);
        for (int i = 0; i < n4; ++i) {
            graphics.setClip(n, n2, 12, 13);
            graphics.drawImage(this.cg, n - n3 % n5 / n6 * 12, n2, 20);
            n -= 13;
            n6 = n5;
            n5 *= 10;
        }
    }

    private final void a(Graphics graphics, int n, int n2, char c) {
        int n3;
        int n4 = -1;
        if (graphics != null) {
            graphics.setClip(n, n2, 10, 16);
        }
        if (c >= '0' && c <= '9') {
            n3 = c - 48;
        } else if (c >= 'A' && c <= 'Z') {
            n3 = 10 + c - 65;
        } else {
            switch (c) {
                case '.': {
                    n3 = 36;
                    break;
                }
                case ',': {
                    n3 = 37;
                    break;
                }
                case '-': {
                    n3 = 38;
                    break;
                }
                case ':': {
                    n3 = 39;
                    break;
                }
                case '!': {
                    n3 = 40;
                    break;
                }
                case '?': {
                    n3 = 41;
                    break;
                }
                case '*': {
                    n3 = 42;
                    break;
                }
                case '\'': {
                    n3 = 43;
                    break;
                }
                case '\u00a9': {
                    n3 = 44;
                    break;
                }
                case '@': {
                    n3 = 45;
                    break;
                }
                case '\u00c0': {
                    n3 = 46;
                    n4 = 0;
                    break;
                }
                case '\u00c8': {
                    n3 = 47;
                    n4 = 0;
                    break;
                }
                case '\u00cc': {
                    n3 = 48;
                    n4 = 0;
                    break;
                }
                case '\u00d2': {
                    n3 = 49;
                    n4 = 0;
                    break;
                }
                case '\u00d9': {
                    n3 = 50;
                    n4 = 0;
                    break;
                }
                case '\u00c2': {
                    n3 = 46;
                    n4 = 2;
                    break;
                }
                case '\u00ca': {
                    n3 = 47;
                    n4 = 2;
                    break;
                }
                case '\u00ce': {
                    n3 = 48;
                    n4 = 2;
                    break;
                }
                case '\u00d4': {
                    n3 = 49;
                    n4 = 2;
                    break;
                }
                case '\u00db': {
                    n3 = 50;
                    n4 = 2;
                    break;
                }
                case '\u00c1': {
                    n3 = 46;
                    n4 = 4;
                    break;
                }
                case '\u00c9': {
                    n3 = 47;
                    n4 = 4;
                    break;
                }
                case '\u00cd': {
                    n3 = 48;
                    n4 = 4;
                    break;
                }
                case '\u00d3': {
                    n3 = 49;
                    n4 = 4;
                    break;
                }
                case '\u00da': {
                    n3 = 50;
                    n4 = 4;
                    break;
                }
                case '\u00c4': {
                    n3 = 46;
                    n4 = 1;
                    break;
                }
                case '\u00cb': {
                    n3 = 47;
                    n4 = 1;
                    break;
                }
                case '\u00cf': {
                    n3 = 48;
                    n4 = 1;
                    break;
                }
                case '\u00d6': {
                    n3 = 49;
                    n4 = 1;
                    break;
                }
                case '\u00dc': {
                    n3 = 50;
                    n4 = 1;
                    break;
                }
                case '\u00c3': {
                    n3 = 46;
                    n4 = 3;
                    break;
                }
                case '\u00d1': {
                    n3 = 51;
                    n4 = 3;
                    break;
                }
                case '\u00d5': {
                    n3 = 49;
                    n4 = 3;
                    break;
                }
                case '\u00c7': {
                    n3 = 12;
                    n4 = 5;
                    break;
                }
                default: {
                    return;
                }
            }
        }
        if (graphics != null) {
            int n5 = n3 / 18;
            int n6 = n3 % 18;
            graphics.drawImage(this.cf, n - n6 * 10, n2 - n5 * 16, 20);
            if (n4 != -1) {
                graphics.setClip(n, n2 + (n4 != 5 ? -3 : 16), 10, 3);
                n5 = n4 / 2;
                n6 = n4 % 2;
                graphics.drawImage(this.cf, n - (160 + n6 * 10), n2 + (n4 != 5 ? -3 : 16) - (32 + n5 * 3), 20);
            }
        }
    }

    private final void a(String string, int n, byte by) {
        this.eu = this.dS;
        this.ew = string;
        this.ep = 0;
        this.en = n;
        this.eo = 0;
        this.er = this.u;
        this.ev = by;
        this.a(null, 0, 0, true, true, true, true);
        this.em = this.x;
        this.x = 5;
        this.a(true, -1);
    }

    private final boolean ak() {
        boolean bl = false;
        if (this.dM == 0) {
            if (this.N) {
                this.N = false;
                if (this.ep > 0) {
                    this.ep -= 2;
                    if (this.ep < 0) {
                        this.ep = 0;
                    }
                    bl = true;
                }
            } else if (this.O) {
                this.O = false;
                if (this.ep < this.eq) {
                    this.ep += 2;
                    if (this.ep > this.eq) {
                        this.ep = this.eq;
                    }
                    bl = true;
                }
            } else if (this.S || this.T || this.R) {
                this.R = false;
                this.T = false;
                this.S = false;
                this.a(false, 0);
            }
        } else {
            --this.dL;
            if (this.dL < 0) {
                this.dL = 0;
                if (this.dM == 2) {
                    this.dM = 0;
                    switch (this.dN) {
                        case 0: {
                            this.al();
                        }
                    }
                } else {
                    this.dM = 0;
                }
            }
            bl = true;
        }
        return bl;
    }

    private final void al() {
        if (this.ev == -1) {
            this.x = this.em;
            this.dS = this.eu;
            this.b(true, -1);
            this.a(true, -1);
        } else if (this.ev == 0) {
            this.ae();
        }
    }

    private final void a(Graphics graphics, int n, int n2, boolean bl, boolean bl2, boolean bl3, boolean bl4) {
        int n3 = 0;
        int n4 = 0;
        int n5 = this.w - this.en - this.eo;
        if (graphics != null && bl) {
            if (bl2) {
                graphics.setClip(0, 0, this.u, this.v);
                graphics.setColor(0);
                graphics.fillRect(0, 0, this.u, this.v);
            }
            int n6 = this.er - this.e(this.er);
            int n7 = n5 - this.e(n5);
            this.a(graphics, this.u - n6 >> 1, this.en + (n5 - n7 >> 1), n6, n7, n, n2);
        }
        int n8 = (this.er - 7) / 12;
        this.et = (n5 - 19) / this.g;
        int n9 = this.ep + this.et;
        int n10 = this.ew.length();
        int n11 = 0;
        this.es = 0;
        int n12 = 0;
        int n13 = -1;
        n4 = this.e(this.u);
        if (graphics != null) {
            n3 = 5 + this.en + (n5 - (bl ? 19 : 7) - this.et * this.g >> 1);
            if (this.eq < 0 && bl4) {
                n3 -= this.eq * this.g >> 1;
            }
        }
        while (n12 < n10) {
            char c = this.ew.charAt(n12);
            ++n11;
            if (c == ' ' || c == '.' || c == ',' || c == '-' || c == ':' || c == ':' || c == '#') {
                n13 = n12;
            }
            if (n11 >= n8 || c == '#' || n12 >= n10 - 1) {
                if (n13 == -1 || n12 >= n10 - 1) {
                    n13 = n12;
                }
                if (graphics != null && this.es >= this.ep) {
                    if (this.dM == 0 || !bl) {
                        c = this.ew.charAt(n13);
                        int n14 = c != ' ' && c != '#' ? this.u - (n13 - (n12 - n11 + 1) + 1) * 12 >> 1 : this.u - (n13 - (n12 - n11 + 1)) * 12 >> 1;
                        for (int i = n12 - n11 + 1; i <= n13; ++i) {
                            this.a(graphics, n14 - n4, n3, this.ew.charAt(i));
                            n14 += 12;
                        }
                    }
                    n3 += this.g;
                }
                n11 = n12 - n13;
                if (n13 + 1 < n10 && this.ew.charAt(n13 + 1) == ' ') {
                    ++n12;
                }
                n13 = -1;
                ++this.es;
                if (graphics != null && this.es >= n9) break;
            }
            ++n12;
        }
        if (graphics != null) {
            if (bl3 && this.dM == 0) {
                if (this.ep > 0) {
                    this.b(graphics, this.ch, 0, 0, 17, 9, (this.u >> 1) - 17 + 1, this.en + n5 - 9 - 4);
                }
                if (this.ep < this.eq) {
                    this.b(graphics, this.ch, 0, 9, 17, 9, (this.u >> 1) - 1, this.en + n5 - 9 - 4);
                }
            }
        } else {
            if (n11 > 0) {
                ++this.es;
            }
            this.eq = this.es - this.et;
        }
    }

    private final void b(boolean bl, int n) {
        this.bZ = 0;
        this.cb = (byte)(bl ? 1 : 2);
        this.ca = n;
    }

    private final void am() {
        this.I = (short)(this.I + this.bU);
        this.ec = 0;
        this.d(false);
        if (this.c == 1) {
            this.a("/cleared.mid", (int)this.bq, false);
        }
        this.b(false, -1);
        if (this.bR != 11 && this.bR != 12) {
            int n = 2 + this.a[48].length();
            int n2 = (int)this.bW / 1000;
            int n3 = n2 / 60;
            int n4 = n2 - n3 * 60;
            StringBuffer stringBuffer = new StringBuffer(100);
            stringBuffer.append(this.a[44]);
            stringBuffer.append("##");
            stringBuffer.append(this.a[45]);
            int n5 = stringBuffer.length();
            if (n3 <= 9) {
                stringBuffer.append('0');
            }
            stringBuffer.append(n3);
            stringBuffer.append(':');
            if (n4 <= 9) {
                stringBuffer.append('0');
            }
            stringBuffer.append(n4);
            this.a(stringBuffer, "", n - (stringBuffer.length() - n5), ' ', false);
            stringBuffer.append("#");
            stringBuffer.append(this.a[46]);
            n5 = stringBuffer.length();
            stringBuffer.append(this.bU);
            stringBuffer.append(this.a[48]);
            stringBuffer.append(this.bV);
            this.a(stringBuffer, "", n - (stringBuffer.length() - n5), ' ', false);
            stringBuffer.append("#");
            stringBuffer.append(this.a[47]);
            this.a(stringBuffer, String.valueOf(this.I), n, ' ', false);
            this.ej = stringBuffer.toString();
            this.d(null);
        } else {
            this.ej = null;
        }
        this.x = 7;
    }

    private final void a(StringBuffer stringBuffer, String string, int n, char c, boolean bl) {
        int n2 = string.length();
        if (!bl) {
            stringBuffer.append(string);
        }
        for (int i = n2; i < n; ++i) {
            stringBuffer.append(c);
        }
        if (bl) {
            stringBuffer.append(string);
        }
    }

    private final boolean an() {
        if (this.cb <= 0) {
            if (this.ej != null && (this.S || this.R)) {
                this.R = false;
                this.T = false;
                this.S = false;
                this.f(true);
                return true;
            }
            if (this.ej == null) {
                this.f(true);
                return true;
            }
            return false;
        }
        return true;
    }

    private final void f(boolean bl) {
        this.bT = this.bS;
        int n = this.bR + 1;
        int n2 = this.bS;
        boolean bl2 = true;
        boolean bl3 = false;
        switch (this.bR) {
            case 3: {
                if (this.i(this.bS, 11)) break;
                n = 11;
                break;
            }
            case 6: {
                if (this.i(this.bS, 12)) break;
                n = 12;
                break;
            }
            case 11: {
                n = 4;
                break;
            }
            case 12: {
                n = 7;
                break;
            }
            case 10: {
                this.B[this.bS - 1] = true;
                bl3 = true;
                if (!this.i(this.bS, 10)) {
                    n2 = 0;
                    n = 4;
                    break;
                }
                bl2 = false;
                break;
            }
        }
        this.A[this.bS - 1] = (byte)(!bl3 ? n : 0);
        this.g();
        if (bl2) {
            this.bS = n2;
            this.bR = n;
            if (bl) {
                this.i();
            }
            this.Y();
            this.x = 1;
            this.d(true);
        } else {
            this.ae();
        }
    }

    private final int h(int n, int n2) {
        int n3 = (n - 1) * 3;
        if (n2 == 12) {
            ++n3;
        } else if (n2 == 10) {
            n3 += 2;
        } else if (n2 != 11) {
            return -1;
        }
        return n3;
    }

    private final boolean i(int n, int n2) {
        int n3 = this.h(n, n2);
        if (n3 == -1) {
            return true;
        }
        return (this.K & 1L << n3) != 0L;
    }

    private final void a(boolean bl, int n, int n2) {
        int n3 = this.h(n, n2);
        if (n3 == -1) {
            return;
        }
        this.K = bl ? (this.K |= 1L << n3) : (this.K &= 1L << n3 ^ 0xFFFFFFFFFFFFFFFFL);
    }

    private final void ao() {
        this.a(this.a[this.ey[this.ex]], this.i + 12, (byte)-1);
        this.x = 8;
    }

    private final boolean ap() {
        boolean bl = false;
        if (this.Q) {
            this.Q = false;
            this.ex = (byte)(this.ex + 1);
            if (this.ex >= this.ey.length) {
                this.ex = 0;
            }
            this.ep = 0;
            this.ew = this.a[this.ey[this.ex]];
            this.er = this.u;
            this.a(null, 0, 0, true, true, true, true);
            bl = true;
        } else if (this.P) {
            this.P = false;
            this.ex = (byte)(this.ex - 1);
            if (this.ex < 0) {
                this.ex = (byte)(this.ey.length - 1);
            }
            this.ep = 0;
            this.ew = this.a[this.ey[this.ex]];
            this.er = this.u;
            this.a(null, 0, 0, true, true, true, true);
            bl = true;
        }
        return bl |= this.ak();
    }

    private final void e(Graphics graphics) {
        this.a(graphics, 22935, 10370, true, true, true, true);
        int n = this.i + 10;
        int n2 = this.u - this.e(this.u);
        int n3 = n - this.e(n);
        this.a(graphics, this.u - n2 >> 1, n - n3 >> 1, n2, n3, 22935, 10370);
        if (this.dM == 0) {
            if (this.ez[this.ex].length == 0) {
                String string = this.ex == 0 ? this.a[49] : this.a[50];
                this.a(string, graphics, this.u >> 1, 6 + (this.i - this.g >> 1), true);
            } else {
                int n4 = this.ez[this.ex].length;
                int n5 = this.u - n4 * (this.h + this.l) + this.l >> 1;
                int n6 = n - this.i >> 1;
                for (int i = 0; i < n4; ++i) {
                    byte by = this.ez[this.ex][i];
                    this.a(graphics, true, by, n5, n6);
                    n5 += this.h + (by != -24 && by != -40 && by != -39 ? this.l : 0);
                }
            }
            this.b(graphics, this.ch, 17, 0, 9, 17, 5, n - 17 >> 1);
            this.b(graphics, this.ch, 26, 0, 9, 17, this.u - 9 - 5, n - 17 >> 1);
        }
        this.a(graphics, null, this.a[29], true);
    }

    private final void a(Graphics graphics, String string, String string2, boolean bl) {
        int n = !this.dP ? this.e(22) : 0;
        if (bl) {
            graphics.setClip(0, 0, this.u, this.v);
            graphics.setColor(22935);
            graphics.fillRect(0, this.w + 2 + n, this.u, 22);
        }
        if (string != null) {
            this.a(string, graphics, 3, this.w + 2 + 3 + n, false);
        }
        if (string2 != null) {
            this.a(string2, graphics, this.u - ((string2.length() - 1) * 12 + 10) - 3, this.w + 2 + 3 + n, false);
        }
    }

    private final void d(byte by) {
        this.eA = by;
        this.ep = 0;
        this.en = 0;
        this.eo = 0;
        this.er = this.u;
        this.dS = false;
        switch (this.eA) {
            case 0: {
                this.ew = this.a[55];
                break;
            }
            case 1: {
                this.ew = this.a[56];
                break;
            }
            case 2: {
                this.ew = this.a[57];
            }
        }
        this.x = 9;
        this.a(null, 0, 0, true, true, true, true);
        this.a(true, -1);
    }

    private final boolean aq() {
        if (this.dM == 0) {
            if (this.S) {
                this.S = false;
                this.a(false, 0);
                return true;
            }
            if (this.T) {
                this.T = false;
                this.a(false, 1);
                return true;
            }
            if (this.N) {
                this.N = false;
                if (this.ep > 0) {
                    this.ep -= 2;
                    if (this.ep < 0) {
                        this.ep = 0;
                    }
                    return true;
                }
            } else if (this.O) {
                this.O = false;
                if (this.ep < this.eq) {
                    this.ep += 2;
                    if (this.ep > this.eq) {
                        this.ep = this.eq;
                    }
                    return true;
                }
            }
            return false;
        }
        --this.dL;
        if (this.dL < 0) {
            this.dL = 0;
            if (this.dM == 2) {
                this.dM = 0;
                switch (this.dN) {
                    case 0: {
                        this.g(true);
                        break;
                    }
                    case 1: {
                        this.g(false);
                    }
                }
            } else {
                this.dM = 0;
            }
        }
        return true;
    }

    private final void g(boolean bl) {
        switch (this.eA) {
            case 0: {
                if (bl) {
                    this.ae();
                    break;
                }
                this.x = 1;
                this.dS = true;
                this.b(true, -1);
                this.a(true, -1);
                break;
            }
            case 1: {
                if (bl) {
                    this.x = 3;
                    this.dS = false;
                    break;
                }
                this.x = 4;
                this.dS = true;
                this.b(true, -1);
                this.a(true, -1);
                break;
            }
            case 2: {
                this.c = (byte)(bl ? 1 : 0);
                this.ae();
            }
        }
    }
}

