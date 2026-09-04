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
    private int[] Z = new int[]{57, 49, 51, 51, 55};
    private int aa = 0;
    private boolean ab = false;
    private short[] ac = new short[5];
    private short[] ad = new short[5];
    private byte[] ae = new byte[5];
    private int af;
    private byte ag;
    private String ah;
    private char[] ai;
    private int aj;
    private int ak;
    private String al;
    private String am;
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
    private int aU;
    private int aV;
    private int aW;
    private byte aX;
    private byte aY;
    private byte aZ;
    private byte ba;
    private byte bb;
    private byte bc;
    private boolean bd;
    private boolean be;
    private boolean bf;
    private boolean bg;
    private boolean bh;
    private boolean bi;
    private boolean bj;
    private boolean bk;
    private boolean bl;
    private boolean bm;
    private boolean bn;
    private boolean bo;
    private int bp;
    private int bq;
    private int br;
    private static final byte[] bs = new byte[]{94, 95, -112, -111};
    private byte bt = (byte)3;
    private final byte[] bu = new byte[]{5, 10, 30, 20, 10, 25, 10};
    private byte bv;
    private int bw;
    private int bx;
    private int by;
    private int bz;
    private byte bA;
    private boolean bB;
    private int bC;
    private int bD;
    private int bE;
    private int bF;
    private int bG;
    private boolean bH;
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
    private int bW;
    private int bX;
    private int bY;
    private long bZ;
    private long ca;
    private boolean cb;
    private int cc;
    private int cd;
    private byte ce;
    private int cf;
    private int[] cg = new int[5];
    private int[] ch = new int[5];
    private int[] ci = new int[]{5, 6, 7, 8};
    private Image cj;
    private Image ck;
    private Image cl;
    private Image cm;
    private Image cn;
    private Image co;
    private Image cp;
    private Image cq;
    private Image cr;
    private Image[] cs = new Image[10];
    private Image ct;
    private byte[][] cu;
    private byte[][] cv;
    private String cw;
    private String cx;
    private byte cy;
    private String[] cz = new String[4];
    private byte[] cA = new byte[4];
    private int cB;
    private int cC;
    private int cD;
    private byte[] cE;
    private byte[] cF;
    private byte[] cG;
    private boolean[] cH;
    private short[] cI;
    private short[] cJ;
    private short cK;
    private short cL;
    private short cM;
    private short cN;
    private short cO;
    private short cP;
    private short cQ;
    private short cR;
    private short cS;
    private short cT;
    private boolean cU;
    private boolean cV;
    private boolean cW;
    private boolean cX;
    private boolean cY;
    private boolean cZ;
    private boolean da;
    private boolean db;
    private boolean dc;
    private boolean dd;
    private boolean de;
    private boolean df;
    private boolean dg;
    private byte[] dh;
    private byte[] di;
    private byte[] dj;
    private byte[] dk;
    private byte[] dl = new byte[5];
    private byte[] dm = new byte[5];
    private byte[] dn = new byte[5];
    private int do;
    private int dp;
    private int dq;
    private int dr;
    private byte ds;
    private byte dt;
    private byte du;
    private byte dv;
    private int dw;
    private int dx;
    private int dy;
    private int dz;
    private int dA;
    private int dB;
    private int dC;
    private int dD;
    private int dE;
    private int dF;
    private boolean dG;
    private byte[][] dH;
    private byte[][] dI;
    private Image dJ;
    private Graphics dK;
    private Image dL;
    private Image dM = null;
    private int dN;
    private boolean dO;
    private int dP;
    private byte dQ;
    private byte dR;
    private final short[] dS = new short[]{0, 0, 1, 3, 5, 8, 12, 17, 23, 31, 41, 53, 70, 91, 118, 153, 198, 256, 256};
    private boolean dT = false;
    private boolean dU = false;
    private boolean dV = false;
    private boolean dW = false;
    private boolean dX = false;
    private String[] dY;
    private short[] dZ;
    private byte ea;
    private byte eb;
    private byte ec;
    private byte ed;
    private byte ee;
    private byte ef;
    private byte eg;
    private byte eh;
    private String ei;
    private int ej;
    private int ek;
    private int el;
    private int em;
    private String en;
    private int eo;
    private int ep;
    private int eq;
    private int er;
    private int es;
    private int et;
    private int eu;
    private int ev;
    private int ew;
    private int ex;
    private boolean ey;
    private byte ez;
    private String eA;
    private byte eB = 0;
    private short[] eC = new short[]{59, 58, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80};
    private byte[][] eD = new byte[][]{new byte[0], new byte[0], {-54, -52}, {-57, -56}, {-106}, {-36, -96, -35}, {-72, -74, -94}, {-19}, {-61, -58, -65, -62}, {-80, -81}, {-71, -69, -66, -67, -92}, {89, 87, -90}, {-20}, {-13}, {-12, -11}, {-29, -24, -40, -39}, {-79, -78, -76, -77}, {-44, -43, -42}, {-32, -30, -14, -15}, {-48, -45, -87, -86}, {-49, -33}, {-97, 124}, {-10}};
    private byte eE;

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
        this.cj = this.a(this.cj, "/font.png");
        this.dL = this.a(this.dL, "/logo.png");
        this.cc = 0;
        this.ce = (byte)-1;
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
        if (!this.dU) {
            this.U = false;
            this.dU = true;
            this.l();
        }
    }

    public void showNotify() {
        if (!this.d && this.dY != null) {
            for (int i = 0; i < this.ec; ++i) {
                if (this.dZ[i] != 11) continue;
                this.dY[i] = this.a[4] + this.a[this.c == 1 ? 2 : 3];
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
        this.ed = (byte)((this.w - 26) / 31);
        this.C = false;
        this.e();
        String string = this.y;
        this.g();
        if (string.compareTo(this.y) != 0) {
            this.a(this.y + ".dat");
        }
        this.ad();
        this.j();
        this.ck = this.a(this.ck, "/numbers.png");
        this.cl = this.a(this.cl, "/arrows.png");
        this.cn = this.a(this.cn, "/misc.png");
        this.co = this.a(this.co, "/ts.png");
        this.cp = this.a(this.cp, "/mow.png");
        this.af();
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
                byte[] byArray = this.i();
                recordStore.addRecord(byArray, 0, byArray.length);
            }
            recordStore.closeRecordStore();
        }
        catch (Exception exception) {
            this.c();
        }
    }

    private final void f() {
        try {
            RecordStore.deleteRecordStore((String)"BC5Data");
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private final void g() {
        ByteArrayInputStream byteArrayInputStream = null;
        FilterInputStream filterInputStream = null;
        try {
            int n;
            byteArrayInputStream = new ByteArrayInputStream(this.a("BC5Data", 1));
            filterInputStream = new DataInputStream(byteArrayInputStream);
            this.y = ((DataInputStream)filterInputStream).readUTF();
            this.bt = ((DataInputStream)filterInputStream).readByte();
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

    private final void h() {
        this.a("BC5Data", 1, this.i());
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private final byte[] i() {
        byte[] byArray = null;
        ByteArrayOutputStream byteArrayOutputStream = null;
        FilterOutputStream filterOutputStream = null;
        try {
            int n;
            byteArrayOutputStream = new ByteArrayOutputStream();
            filterOutputStream = new DataOutputStream(byteArrayOutputStream);
            ((DataOutputStream)filterOutputStream).writeUTF(this.y);
            ((DataOutputStream)filterOutputStream).writeByte(this.bt);
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

    private final void j() {
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
        if (!this.ab) {
            if (n == this.Z[this.aa]) {
                ++this.aa;
                if (this.aa >= this.Z.length) {
                    this.aa = 0;
                    this.ab = true;
                }
            } else {
                this.aa = 0;
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
        this.d(graphics, this.bI, this.bJ);
        this.c(graphics, this.bI, this.bJ);
        if (this.bq != -1 && this.bp % 8 >= 4) {
            this.a(graphics, true, (byte)-8, this.bq - this.bI, this.br - this.bJ);
        }
        this.b(graphics, this.bI, this.bJ);
        if (this.da) {
            for (n = 0; n < 3; ++n) {
                this.a(graphics, false, (byte)(52 + this.bF), this.cK * this.h - this.bI, this.cL * this.i - this.k - this.i * n - this.bJ);
            }
        }
        if (this.db) {
            for (n = 0; n < 3; ++n) {
                this.a(graphics, false, (byte)(52 + this.bF), this.cM * this.h - this.bI, this.cN * this.i + this.k + this.i * n - this.bJ);
            }
        }
        if (this.dc) {
            for (n = 0; n < 3; ++n) {
                this.a(graphics, false, (byte)(55 + this.bF), this.cO * this.h - this.j - this.h * n - this.bI, this.cP * this.i - this.bJ);
            }
        }
        if (this.dd) {
            for (n = 0; n < 3; ++n) {
                this.a(graphics, false, (byte)(55 + this.bF), this.cQ * this.h + this.j + this.h * n - this.bI, this.cR * this.i - this.bJ);
            }
        }
        this.a(graphics, this.bI, this.bJ);
        if (this.ds > 0) {
            this.b(graphics, this.cm, this.bv < 4 ? 282 : 310, 0, 28, 28, this.dp - 14 - this.bI, this.dq - 14 - this.bJ);
        }
        if (this.aA > 0 && this.aB >= 4) {
            int n2;
            int n3;
            int n4;
            switch (this.aY) {
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
            n = this.ap + (this.h - n3 >> 1);
            int n5 = this.aq - 1 + -36 - n2;
            if (n5 - this.bJ < 0) {
                n5 += n2 + 72 + 2;
            }
            this.b(graphics, this.cm, n4, 0, n3, n2, n - this.bI, n5 - this.bJ);
        }
        if (this.cW) {
            for (n = 0; n < 5; ++n) {
                this.b(graphics, this.cm, 338, 0, 12, 8, this.cg[n] >> this.r, this.ch[n] >> this.r);
            }
        } else {
            this.b(graphics, this.cq, 0, this.bA / 3 * 24, 24, 24, (this.bw >> this.r) - this.bI, (this.bx >> this.r) - this.bJ);
        }
        this.b(graphics);
        if (this.ba != -1) {
            this.b(graphics, this.cr, this.ba * 48, 0, 48, 48, this.u - 48 >> 1, this.v - 48 >> 1);
        }
        if (this.ce > 0) {
            this.c(graphics);
        }
        if (!this.dW) {
            if (this.dU) {
                this.a(graphics, this.a[37], (byte)1, 0);
            } else if (this.eg > 0) {
                this.a(graphics, this.ei, this.eh, 0);
            } else if (this.aw == 5) {
                this.a(graphics, this.a[this.ba == -1 ? 53 : 54], (byte)(this.ba != -1 ? 1 : 0), 0);
            }
        }
    }

    private final void b(Graphics graphics) {
        int n = 2;
        int n2 = 2;
        if (this.bV != 0) {
            long l = !this.cb ? System.currentTimeMillis() - this.ca + this.bZ : this.bZ;
            if (this.cV) {
                if (this.df) {
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
            if (this.cb || n4 % 2 == 0) {
                graphics.setClip(n -= 6, n2, 5, 13);
                graphics.drawImage(this.ck, n - 120, n2, 20);
            }
            n = this.u - (this.cU ? 40 : 31) - 2;
            graphics.setClip(n, n2, this.cU ? 40 : 31, this.cU ? 38 : 38);
            graphics.drawImage(this.cm, n - (this.cU ? 42 : 216), n2, 20);
            this.a(graphics, n -= 28, n2 + ((this.cU ? 40 : 31) - 13 >> 1), this.cC, 2);
        }
        if (this.dV) {
            n = this.u - 42 >> 1;
            graphics.setClip(n, n2, 42, 38);
            graphics.drawImage(this.cm, n - 0, n2, 20);
        }
        if (this.bV != 0) {
            n = this.u;
            n2 += (this.cU ? 38 : 38) + 2;
            if (this.cX) {
                graphics.setClip(n -= 41, n2, 39, 37);
                graphics.drawImage(this.cm, n - 82, n2, 20);
            }
            if (this.cY) {
                graphics.setClip(n -= 38, n2, 36, 36);
                graphics.drawImage(this.cm, n - 143, n2, 20);
            }
            if (this.cZ) {
                graphics.setClip(n -= 39, n2, 37, 38);
                graphics.drawImage(this.cm, n - 179, n2, 20);
            }
            if (this.cD > 0) {
                graphics.setClip(n -= 37, n2, 35, 36);
                graphics.drawImage(this.cm, n - 247, n2, 20);
            }
            if (this.de || this.D[2] > 0) {
                graphics.setClip(n -= 24, n2, 22, 35);
                graphics.drawImage(this.cm, n - 121, n2, 20);
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
                    this.a(graphics, this.al, this.am, true);
                    return;
                }
                case 4: {
                    this.d(graphics, this.bI, this.bJ);
                    this.c(graphics, 0, 0);
                    this.a(graphics, 0, 0);
                    graphics.setClip(0, 0, this.u, this.v);
                    int n = this.w - this.dL.getHeight() - this.i - 72 >> 1;
                    graphics.drawImage(this.dL, this.u >> 1, n, 17);
                    this.a("EXTRA-LEVELPACK 1", graphics, this.u >> 1, n + this.dL.getHeight(), true);
                    if (!this.dW && this.dO) {
                        this.a(graphics, this.a[81], (byte)3, this.v - (this.g + 10) - 5);
                    }
                    if (this.ce <= 0) break;
                    this.c(graphics);
                    break;
                }
                case 5: {
                    this.a(graphics, 22935, 10370, true, true, true, true);
                    this.a(graphics, this.ez == 0 ? this.a[31] : null, this.ez != 0 ? this.a[29] : null, true);
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
                    if (this.ce > 0) {
                        this.a(graphics);
                    } else {
                        graphics.setColor(0);
                        graphics.fillRect(0, 0, this.u, this.v);
                    }
                    if (this.en == null) break;
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
                    switch (this.eE) {
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
                    this.b(graphics, this.dL, 0, this.cc * 100, 176, 100, (this.u - 176 >> 1) + (this.dQ == 1 ? -this.e(this.u) : this.e(this.u)), this.v - 100 >> 1);
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
                    this.b(graphics, this.dM, 0, 0, 384, 96, 0, 0);
                    this.a(graphics, this.dM, 0, 96, 384, 37, -(this.aj >> 4), 59);
                    this.b(graphics, this.dM, 0, 153, 384, 54, 0, 34);
                    this.a(graphics, this.dM, 0, 133, 384, 20, -(this.ak >> 4), 76);
                    if (this.ce > 0) {
                        this.c(graphics);
                    }
                    if (this.ec > 0) {
                        this.a(graphics, true);
                    } else {
                        this.a(graphics, 22935, 10370, false, false, true, true);
                        this.a(graphics, null, this.a[29], false);
                    }
                    return;
                }
                case 13: {
                    this.d(graphics, this.bI, this.bJ);
                    this.c(graphics, 0, 0);
                    graphics.setClip(0, 0, this.u, this.v);
                    graphics.drawImage(this.dL, this.u >> 1, this.v, 33);
                    int n = this.u - this.h - ((this.ah.length() - 1) * 12 + 10) >> 1;
                    int n2 = this.i >> 1;
                    this.a(graphics, true, (byte)-10, n, n2);
                    this.a(this.ah, graphics, n + this.h, n2 + (this.i - 16 >> 1), false);
                    this.a(graphics, 22935, 10370, false, false, false, false);
                    if (this.ce > 0) {
                        this.c(graphics);
                    }
                    return;
                }
                case 14: {
                    this.d(graphics, this.bI, this.bJ);
                    this.c(graphics, 0, 0);
                    if (this.ar == -1) {
                        this.a(graphics, 0, 0);
                        this.a(graphics, 22935, 10370, false, false, false, true);
                    } else {
                        this.a(graphics, true, (byte)-10, this.ar, this.as);
                        this.a(graphics, 0, 0);
                    }
                    if (this.ce > 0) {
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
                    if (this.ce > 0) {
                        this.c(graphics);
                    }
                    this.a(graphics, this.a[31], null, false);
                    return;
                }
                case 16: {
                    this.a(graphics, 22935, 10370, true, true, true, true);
                    this.a(graphics, this.al, this.am, true);
                    return;
                }
            }
            if (this.dW) {
                this.a(graphics, true);
            }
            if (this.dX && this.ce == 0) {
                this.b(graphics, this.cl, 0, 9, 17, 9, 2, this.v - 9 - 2);
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
        this.b(graphics, bl ? this.co : this.ct, n6, n5, this.h, this.i, n, n2);
    }

    private final void c(Graphics graphics) {
        int n = this.cc;
        int n2 = this.cc;
        int n3 = (this.v + this.i - 1) / this.i;
        int n4 = (this.u + this.h - 1) / this.h;
        graphics.setClip(0, 0, this.u, this.v);
        graphics.setColor(0);
        switch (this.ce) {
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
                this.ce = 0;
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
                this.ce = 0;
            }
        }
    }

    private final void k() {
        this.cc += 3;
    }

    private final void a(Graphics graphics, int n, int n2) {
        if (this.bi) {
            int n3;
            int n4;
            int n5;
            boolean bl = true;
            int n6 = 0;
            switch (this.aw) {
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
            if ((this.aN > 0 || this.bk) && bl) {
                this.a(graphics, n6, n, n2);
            }
            this.b(graphics, this.cs[7], n3, this.av * n7, n5, n7, this.ap + n4 - n, this.aq + n8 - n2);
            if ((this.aN > 0 || this.bk) && !bl) {
                this.a(graphics, n6, n, n2);
            }
        } else if (this.bm) {
            int n9;
            switch (this.aw) {
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
            this.b(graphics, this.cs[9], n9, 0, 120, 72, this.ap + -36 - n, this.aq + -36 - this.aW - n2);
        } else if (this.bc > 0) {
            int n10;
            switch (this.aw) {
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
            this.b(graphics, this.cs[8], n10, this.av / 3 * 72, 72, 72, this.ap + -12 - n, this.aq + -36 - this.aW - n2);
        } else {
            int n11;
            int n12;
            int n13;
            int n14;
            boolean bl = false;
            int n15 = 0;
            if (this.aw == 5) {
                n14 = 48;
                n13 = 72;
                n12 = 0;
                n11 = -36;
            } else {
                n14 = 48;
                n13 = 72;
                n12 = 0;
                n11 = -36;
                if (this.aN > 0) {
                    switch (!this.bj ? this.aw : 2) {
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
            int n16 = this.ap + n12;
            int n17 = this.aq + n11 - this.aW;
            if (this.aN > 0 && bl) {
                this.a(graphics, n15, n, n2);
            }
            this.b(graphics, this.cs[!this.bj ? this.aw : 2], this.av * n14, 0, n14, n13, n16 - n, n17 - n2);
            if (this.aN > 0 && !bl) {
                this.a(graphics, n15, n, n2);
            }
        }
    }

    private final void a(Graphics graphics, int n, int n2, int n3) {
        this.b(graphics, this.cp, this.aD / 3 * this.h, this.bk ? 0 : this.i, this.h, this.i, this.ap + n - n2, this.aq - this.m - n3);
    }

    private final void b(Graphics graphics, int n, int n2) {
        for (int i = 0; i < this.cB; ++i) {
            int n3 = this.cE[i] & 0xFF;
            int n4 = n3 >> 4;
            int n5 = n4 * this.i;
            int n6 = (n3 - (n4 << 4)) * this.h;
            int n7 = this.cI[i] - n;
            int n8 = this.cJ[i] - n2;
            this.b(graphics, this.co, n6, n5, this.h, this.i, n7, n8);
        }
    }

    private final void b(Graphics graphics, Image image, int n, int n2, int n3, int n4, int n5, int n6) {
        graphics.setClip(n5, n6, n3, n4);
        graphics.drawImage(image, n5 - n, n6 - n2, 20);
    }

    private final void a(byte by, byte by2, int n, int n2) {
        this.dK.setClip(n, n2, this.h, this.i);
        this.a(by, n, n2);
        if (by == -1 || by == -57) {
            return;
        }
        this.a(by2, n, n2);
    }

    private final void a(byte by, int n, int n2) {
        int n3;
        boolean bl = false;
        if (this.bE != 0 && by == -106 && this.cC == 0) {
            n3 = 0 + this.bE - 1;
        } else if (this.bE != 0 && by == -8 && this.bH) {
            n3 = 15 + this.bE - 1;
        } else if (this.bD != 0 && by == -12) {
            n3 = 26 + this.bD - 1;
        } else if (this.bC != 0 && by == 86) {
            n3 = 39 + this.bC - 1;
        } else if (this.bF != 0 && (by == 88 || by == 87 || by == 90 || by == 89 || by == 91 || by == 92 || by == 93)) {
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
            n3 += this.bF - 1;
        } else if (this.bE != 0 && (by == -75 || by == -74 || by == -73 || by == -72)) {
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
            n3 += this.bE - 1;
        } else if (this.da && this.bF != 0 && by == -48) {
            n3 = 18 + this.bF - 1;
        } else if (this.db && this.bF != 0 && by == -47) {
            n3 = 20 + this.bF - 1;
        } else if (this.dc && this.bF != 0 && by == -46) {
            n3 = 22 + this.bF - 1;
        } else if (this.dd && this.bF != 0 && by == -45) {
            n3 = 24 + this.bF - 1;
        } else {
            bl = true;
            n3 = by & 0xFF;
        }
        int n4 = bl ? 4 : 2;
        int n5 = n3 >> n4;
        int n6 = n5 * this.i;
        int n7 = (n3 - (n5 << n4)) * this.h;
        this.dK.drawImage(bl ? this.co : this.ct, n - n7, n2 - n6, 20);
    }

    private final void l() {
        this.bZ += System.currentTimeMillis() - this.ca;
        this.cb = true;
    }

    private final void m() {
        this.ca = System.currentTimeMillis();
        this.cb = false;
    }

    public final boolean b() {
        try {
            if (this.ce > 0) {
                this.k();
            }
            if (this.dW) {
                return this.aj() || this.ce > 0;
            }
            switch (this.x) {
                case 0: {
                    this.d();
                    return true;
                }
                case 1: {
                    if (this.dX && this.S && this.ce == 0) {
                        this.S = false;
                        this.c((byte)1, (byte)-1);
                        return true;
                    }
                    if (this.dU) {
                        if (this.U) {
                            this.S = false;
                            this.T = false;
                            this.R = false;
                            this.P = false;
                            this.Q = false;
                            this.N = false;
                            this.O = false;
                            this.dU = false;
                            this.m();
                            return true;
                        }
                        return this.ce > 0;
                    }
                    if (this.eg > 0) {
                        this.eg = (byte)(this.eg - 1);
                    }
                    if (!this.bd && this.aT == 0 && this.aw != 5 && this.R) {
                        this.R = false;
                        boolean bl = this.dV = !this.dV;
                        if (!this.dV) {
                            this.W();
                        }
                    }
                    if (this.aA > 0) {
                        this.aB = (this.aB + 1) % 8;
                        if (this.aB == 0) {
                            --this.aA;
                        }
                    }
                    if (this.H()) {
                        if (this.x != 1) {
                            return true;
                        }
                        if (this.ds > 0) {
                            this.Q();
                        }
                        this.P();
                        this.S();
                        this.V();
                        if (this.cW) {
                            this.T();
                        } else {
                            this.U();
                        }
                        this.G();
                        if (this.E) {
                            this.F();
                        } else {
                            this.bq = -1;
                        }
                        if (this.dV) {
                            if (this.P) {
                                this.bO -= 24;
                            } else if (this.Q) {
                                this.bO += 24;
                            } else if (this.N) {
                                this.bP -= 24;
                            } else if (this.O) {
                                this.bP += 24;
                            }
                            this.X();
                        }
                        if (this.bO != this.bI || this.bP != this.bJ && this.aO == 0) {
                            this.Y();
                        }
                    }
                    return true;
                }
                case 2: {
                    return this.C();
                }
                case 3: {
                    this.t.destroyApp(true);
                    return false;
                }
                case 4: {
                    return this.ai() || this.ce > 0;
                }
                case 5: {
                    return this.an();
                }
                case 7: {
                    return this.aq() || this.ce > 0;
                }
                case 8: {
                    return this.as();
                }
                case 9: {
                    return this.at();
                }
                case 10: {
                    if (this.ce == -1) {
                        --this.dP;
                        if (this.dP < 0) {
                            this.dQ = 0;
                            this.dP = 0;
                            this.ce = (byte)-2;
                        }
                    } else if (this.ce == -2) {
                        ++this.aC;
                        if (this.aC >= 3) {
                            this.aC = 0;
                            ++this.cc;
                            if (this.cc >= 3) {
                                this.ce = (byte)-3;
                            }
                        }
                    } else if (this.ce == -3) {
                        ++this.aC;
                        if (this.aC >= 40) {
                            this.a(false, 0);
                            this.ce = (byte)-4;
                        }
                    } else {
                        --this.dP;
                        if (this.dP < 0) {
                            this.dQ = 0;
                            this.dP = 0;
                            this.ce = 0;
                            this.cc = 0;
                            this.dL = null;
                            this.x = 0;
                        }
                    }
                    return true;
                }
                case 12: {
                    return this.B();
                }
                case 13: {
                    return this.w();
                }
                case 14: {
                    return this.r();
                }
                case 15: {
                    return this.t();
                }
                case 16: {
                    return this.E();
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
            byte by = this.ae[i];
            if (by < 0) continue;
            int n3 = by / 6;
            int n4 = n3 * 16;
            int n5 = (by - n3 * 6) * 16;
            this.b(graphics, this.ct, 96 + n5, 672 + n4, 16, 16, this.ac[i] - n - 8, this.ad[i] - n2 - 8);
        }
    }

    private final void n() {
        int n;
        int n2;
        this.cu = null;
        this.cv = null;
        int n3 = this.u / this.h + 1;
        this.dw = n3 * 3;
        this.dx = this.v / this.i + 1;
        this.cu = new byte[this.dx][this.dw];
        this.cv = new byte[this.dx][this.dw];
        this.bJ = 0;
        this.bI = 0;
        for (n2 = 0; n2 < this.dx; ++n2) {
            for (n = 0; n < n3 * 2; ++n) {
                int n4 = this.b(10);
                int n5 = n4 == 9 ? 71 : (n4 >= 7 ? 72 : 73);
                this.cu[n2][n] = n5;
                this.cv[n2][n] = -1;
                this.cu[n2][n + n3] = n5;
                this.cv[n2][n + n3] = -1;
            }
        }
        for (n2 = 0; n2 < this.dx; ++n2) {
            for (n = 0; n < n3; ++n) {
                this.cu[n2][n + n3 * 2] = this.cu[n2][n];
                this.cv[n2][n + n3 * 2] = this.cv[n2][n];
            }
        }
        this.ag();
        this.f(this.bI, this.bJ);
        this.at = this.dw * this.h - 1;
        this.au = this.dx * this.i - 1;
        this.bK = (n3 << 1) * this.h - 1;
        this.bL = this.au - this.dz;
        if (this.bK < 0) {
            this.bK = 0;
        }
        if (this.bL < 0) {
            this.bL = 0;
        }
        for (int i = 0; i < 5; ++i) {
            this.ae[i] = (byte)this.b(8);
            this.ac[i] = (short)(this.h + this.b(this.u));
            this.ad[i] = -16;
        }
    }

    private final void o() {
        int n = 3;
        this.bI += n;
        if (this.bI > this.bK) {
            this.bI -= this.bI / this.h * this.h;
            this.f(this.bI, this.bJ);
        }
        this.g(this.bI, this.bJ);
        for (int i = 0; i < 5; ++i) {
            byte by = this.ae[i];
            if (this.bG == 0) {
                by = (byte)(by + 1);
            }
            short s = (short)(this.ac[i] - n);
            if (by >= 8 || s <= -16) {
                by = 0;
                s = (short)(this.h + this.b(this.u));
                this.ad[i] = (short)this.b(this.v);
            }
            this.ae[i] = by;
            this.ac[i] = s;
        }
        ++this.bG;
        if (this.bG >= 4) {
            this.bG = 0;
        }
    }

    private final void p() {
        this.d(false);
        this.bi = false;
        this.bj = false;
        this.aW = 0;
        this.aN = 0;
        this.bm = true;
        this.av = 0;
        this.ay = 1;
        this.aw = 1;
        this.ap = (this.u >> 1) - (this.h >> 1);
        this.ar = -1;
        this.as = this.aq = this.v / 3;
        this.d(this.bW);
        this.af = 0;
        this.q();
        this.n();
        this.b(true, -1);
        this.x = 14;
        this.b("/fly.mid");
    }

    private final void q() {
        int n = this.cx.indexOf(35, this.af);
        if (n == -1) {
            n = this.cx.length();
        }
        String string = this.cx.substring(this.af, n);
        this.af = n + 1;
        this.eA = string;
        this.et = 0;
        this.er = this.aq + this.i;
        this.es = 0;
        this.ev = this.u;
        this.a(null, 0, 0, false, false, false, true);
        this.aQ = 192;
    }

    private final boolean r() {
        if (this.ce == 0) {
            if (this.cd == 0) {
                this.s();
                return true;
            }
            if (this.ar == -1) {
                --this.aQ;
                if (this.aQ < 0) {
                    if (this.af < this.cx.length()) {
                        this.q();
                    } else {
                        this.ar = this.u;
                    }
                }
            } else if (this.ar > this.ap) {
                this.ar -= 3;
            } else {
                this.J = (short)(this.J + 1);
                this.a(true, this.bW, 10);
                this.h();
                this.b(false, 0);
            }
        }
        if (this.ce != 2) {
            this.O();
            this.o();
        }
        return true;
    }

    private final void s() {
        this.eA = this.a[120] + this.J + this.a[121];
        this.et = 0;
        this.er = this.i << 1;
        this.es = 0;
        this.ev = this.u;
        this.a(null, 0, 0, false, false, true, true);
        if (this.c == 1) {
            this.a("/cleared.mid", (int)this.bt, false);
        }
        this.b(true, -1);
        this.x = 15;
    }

    private final boolean t() {
        if (this.ce == 0) {
            if (this.cd == 0) {
                if (this.bV == 0) {
                    this.ah();
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
                    if (this.et > 0) {
                        this.et -= 2;
                        if (this.et < 0) {
                            this.et = 0;
                        }
                        return true;
                    }
                } else if (this.O) {
                    this.O = false;
                    if (this.et < this.eu) {
                        this.et += 2;
                        if (this.et > this.eu) {
                            this.et = this.eu;
                        }
                        return true;
                    }
                }
            }
            return false;
        }
        return true;
    }

    private final void u() {
        this.d(false);
        this.ag = (byte)(this.J > 100 ? 100 : (int)this.J);
        this.ah = " X " + this.ag;
        this.aQ = 256;
        this.eA = "0000 0000 0000 0000##" + this.a[105];
        this.ai = this.eA.toCharArray();
        this.et = 0;
        this.er = this.i << 1;
        this.es = 0;
        this.ev = this.u;
        this.v();
        this.a(null, 0, 0, false, false, false, false);
        this.n();
        this.b(true, -1);
        this.dL = this.a(null, "/sleep.png");
        this.x = 13;
        this.b("/universe.mid");
    }

    private final void v() {
        int n = 0;
        for (int i = 1; i <= 16; ++i) {
            int n2 = this.b(32);
            this.ai[n] = (char)(n2 < 10 ? n2 + 48 : n2 - 10 + 65);
            ++n;
            if (i % 4 != 0) continue;
            ++n;
        }
        this.eA = new String(this.ai);
    }

    private final boolean w() {
        if (this.ce == 0) {
            if (this.cd == 0) {
                this.y();
                if (this.M[1].length() > 0) {
                    this.ah();
                } else {
                    this.a(this.a[107] + this.ag + this.a[108], 0, (byte)0);
                }
            } else if (this.aQ > 0) {
                --this.aQ;
                if (this.aQ == 0) {
                    String string = this.x();
                    for (int i = this.M.length - 1; i > 0; --i) {
                        this.M[i] = this.M[i - 1];
                    }
                    this.M[0] = string;
                    this.eA = string + "##" + this.a[106];
                    this.ai = null;
                    this.et = 0;
                    this.er = this.i << 1;
                    this.es = 0;
                    this.ev = this.u;
                    this.a(null, 0, 0, false, false, false, false);
                    this.J = (short)(this.J - this.ag);
                    this.h();
                } else {
                    this.v();
                }
            } else if (this.R || this.S) {
                this.S = false;
                this.R = false;
                this.b(false, 0);
            }
        }
        this.o();
        return true;
    }

    private final String x() {
        byte[] byArray = new byte[10];
        this.a(byArray, 0, this.L);
        byArray[5] = this.ag;
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

    private final void y() {
        this.dL = null;
        System.gc();
    }

    private final void z() {
        this.dM = null;
        System.gc();
    }

    private final void A() {
        this.j();
        this.y();
        this.c((byte)4, (byte)-1);
        this.dW = false;
        if (this.ec == 0) {
            this.eA = this.a[119];
            this.et = 0;
            this.er = 96;
            this.es = 0;
            this.ev = this.u;
            this.a(null, 0, 0, false, false, true, true);
        }
        this.ak = 0;
        this.aj = 0;
        this.dM = this.a(this.dM, "/train.png");
        this.b(true, -1);
        this.a(true, 0);
        this.x = 12;
        this.b("/train.mid");
    }

    private final boolean B() {
        if (this.dQ == 0) {
            if (this.ec > 0) {
                if (this.N) {
                    this.N = false;
                    this.eb = this.eb > 0 ? (byte)(this.eb - 1) : (byte)(this.ec - 1);
                    if (this.eb < this.ee) {
                        this.ee = this.eb;
                    } else if (this.eb >= this.ee + this.ed) {
                        this.ee = (byte)(this.eb - this.ed + 1);
                    }
                } else if (this.O) {
                    this.O = false;
                    this.Q = false;
                    this.eb = this.eb < this.ec - 1 ? (byte)(this.eb + 1) : (byte)0;
                    if (this.eb < this.ee) {
                        this.ee = this.eb;
                    } else if (this.eb >= this.ee + this.ed) {
                        this.ee = (byte)(this.eb - this.ed + 1);
                    }
                } else if (this.R || this.S) {
                    this.S = false;
                    this.R = false;
                    this.b(false, -1);
                    this.a(false, 2);
                }
            } else if (this.N) {
                this.N = false;
                if (this.et > 0) {
                    this.et -= 2;
                    if (this.et < 0) {
                        this.et = 0;
                    }
                }
            } else if (this.O) {
                this.O = false;
                if (this.et < this.eu) {
                    this.et += 2;
                    if (this.et > this.eu) {
                        this.et = this.eu;
                    }
                }
            }
            if (this.T) {
                this.T = false;
                this.b(false, -1);
                this.a(false, 1);
            }
        } else {
            --this.dP;
            if (this.dP < 0) {
                this.dP = 0;
                if (this.dQ == 2) {
                    this.dQ = 0;
                    switch (this.dR) {
                        case 0: {
                            break;
                        }
                        case 1: {
                            this.j();
                            this.z();
                            this.ah();
                            return true;
                        }
                        case 2: {
                            this.j();
                            if (this.c == 1) {
                                this.a();
                            }
                            this.bV = 0;
                            this.bU = this.dZ[this.eb] == 1 ? 3 : 2;
                            this.j();
                            this.z();
                            this.aa();
                            this.x = 1;
                            this.d(true);
                        }
                    }
                } else {
                    this.dQ = 0;
                }
            }
        }
        this.aj += 24;
        if (this.aj >> 4 >= 384) {
            this.aj -= 6144;
        }
        this.ak += 64;
        if (this.ak >> 4 >= 384) {
            this.ak -= 6144;
        }
        return true;
    }

    private final void a(int n, String string, String string2, String string3) {
        this.an = n;
        this.al = string2;
        this.am = string3;
        this.eA = string;
        this.et = 0;
        this.er = this.k;
        this.es = this.k;
        this.ev = this.u - this.h;
        this.a(null, 0, 0, true, false, true, true);
        if (this.ex > this.ew) {
            int n2 = (this.ex - this.ew) * this.g;
            this.er += n2 >> 1;
            this.es += n2 >> 1;
            this.eu = 0;
        }
        this.x = 2;
        this.a(true, -1);
    }

    private final boolean C() {
        boolean bl = false;
        if (this.dQ == 0) {
            if (this.N) {
                this.N = false;
                if (this.et > 0) {
                    this.et -= 2;
                    if (this.et < 0) {
                        this.et = 0;
                    }
                    bl = true;
                }
            } else if (this.O) {
                this.O = false;
                if (this.et < this.eu) {
                    this.et += 2;
                    if (this.et > this.eu) {
                        this.et = this.eu;
                    }
                    bl = true;
                }
            } else if (this.al != null && this.S) {
                this.S = false;
                this.a(false, 0);
            } else if (this.am != null && this.T) {
                this.T = false;
                this.a(false, 1);
            }
        } else {
            --this.dP;
            if (this.dP < 0) {
                this.dP = 0;
                if (this.dQ == 2) {
                    this.dQ = 0;
                    switch (this.dR) {
                        case 0: {
                            bl = this.a(true);
                            break;
                        }
                        case 1: {
                            bl = this.a(false);
                        }
                    }
                } else {
                    this.dQ = 0;
                }
            }
            bl = true;
        }
        return bl;
    }

    private final boolean a(boolean bl) {
        this.x = 1;
        if (this.an == -1) {
            return true;
        }
        if (!bl) {
            if (this.an == 10) {
                this.ah();
            }
            return true;
        }
        if (this.an == 8) {
            this.C = true;
        } else if (this.an == 7) {
            if (this.I < 3) {
                this.dg = true;
            } else {
                this.I = (short)(this.I - 3);
            }
            this.de = true;
        } else if (this.an == 9) {
            this.u();
        } else if (this.an == 10) {
            this.p();
        } else if (this.an == 11) {
            this.f();
            this.x = 3;
        } else {
            this.I = (short)(this.I - this.bu[this.an]);
            this.cu[this.as][this.ar] = -98;
            this.f(this.bI, this.bJ);
            int n = this.an;
            this.D[n] = (byte)(this.D[n] + 1);
            if (this.an == 4) {
                this.H = this.D[4];
            }
            this.h();
        }
        return true;
    }

    private final void D() {
        this.d(false);
        this.y();
        this.c(false);
        this.b(0, this.a[111], this.a[30], null);
        this.x = 16;
    }

    private final void b(int n, String string, String string2, String string3) {
        this.b("/universe.mid");
        this.al = string2;
        this.am = string3;
        this.ao = n;
        this.eA = string;
        this.et = 0;
        this.es = 0;
        this.ev = this.u;
        this.er = 0;
        this.a(null, 0, 0, true, true, true, true);
        this.a(true, -1);
    }

    private final boolean E() {
        boolean bl = false;
        if (this.dQ == 0) {
            if (this.N) {
                this.N = false;
                if (this.ao != 5 && this.et > 0) {
                    this.et -= 2;
                    if (this.et < 0) {
                        this.et = 0;
                    }
                    bl = true;
                }
            } else if (this.O) {
                this.O = false;
                if (this.ao != 5 && this.et < this.eu) {
                    this.et += 2;
                    if (this.et > this.eu) {
                        this.et = this.eu;
                    }
                    bl = true;
                }
            } else if (this.al != null && this.S) {
                this.S = false;
                this.a(false, 0);
            } else if (this.am != null && this.T) {
                this.T = false;
                this.a(false, 1);
            }
        } else {
            --this.dP;
            if (this.dP < 0) {
                this.dP = 0;
                this.dT = false;
                if (this.dQ == 2) {
                    this.dQ = 0;
                    switch (this.dR) {
                        case 0: {
                            bl = this.b(true);
                            break;
                        }
                        case 1: {
                            bl = this.b(false);
                        }
                    }
                } else {
                    this.dQ = 0;
                }
            }
            bl = true;
        }
        return bl;
    }

    private final boolean b(boolean bl) {
        this.al = null;
        this.am = null;
        boolean bl2 = false;
        switch (this.ao) {
            case 0: {
                bl2 = true;
            }
        }
        if (bl2) {
            this.y();
            this.ah();
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

    private final void F() {
        if (this.bq != -1) {
            --this.bp;
            if (this.bp <= 0) {
                this.bq = -1;
            }
        } else {
            int n = (this.bI + this.b(this.dy)) / this.h;
            int n2 = (this.bJ + this.b(this.dz)) / this.i;
            if (n < this.dw && n2 < this.dx && this.cv[n2][n] == -8 && (this.cu[n2][n] == -57 || this.cu[n2][n] == -56)) {
                this.bq = n * this.h;
                this.br = n2 * this.i;
                this.bp = 32;
            }
        }
    }

    private final void G() {
        if (this.aO > 0) {
            --this.aO;
            int n = this.h * this.aO / 8;
            int n2 = this.b(n + 1) - (n >> 1);
            int n3 = this.b(n + 1) - (n >> 1);
            this.bI += n2;
            this.bJ += n3;
            if (this.bI < 0) {
                this.bI = 0;
            } else if (this.bI > this.bK) {
                this.bI = this.bK;
            }
            if (this.bJ < 0) {
                this.bJ = 0;
            } else if (this.bJ > this.bL) {
                this.bJ = this.bL;
            }
            this.g(this.bI, this.bJ);
        }
    }

    private final boolean H() {
        int n;
        long l;
        if (this.cV && this.df && this.aw != 5 && (l = !this.cb ? 60000L - (System.currentTimeMillis() - this.ca + this.bZ) : 60000L - this.bZ) <= 0L) {
            this.ba = 0;
            this.K();
        }
        if (this.aT > 0 && this.bO == this.bI && this.bP == this.bJ) {
            --this.aT;
            if (this.aT == 0) {
                this.aZ = (byte)-1;
                this.aE = -1;
                this.W();
            }
        }
        if (this.bV == 0 && this.bU == 1 && !this.C && this.X) {
            this.X = false;
            this.a(8, "DO YOU WANT TO ENABLE THE CHEAT?", this.a[32], this.a[33]);
            return false;
        }
        if (this.bV == 0 && this.bU == 1 && this.ab) {
            this.ab = false;
            this.a(11, "DO YOU WANT TO FORMAT THE RMS AND COMPLETELY RESET THE GAME?", this.a[32], this.a[33]);
            return false;
        }
        int n2 = this.bI;
        int n3 = this.bJ;
        if (this.aw <= 4 && this.ay == 0 && this.bc == 0) {
            this.bn = false;
            if (this.bh) {
                this.bh = false;
                this.aN = 0;
                n = 0;
                boolean bl = true;
                byte by = this.cE[this.az];
                short s = this.cI[this.az];
                short s2 = this.cJ[this.az];
                if (by == -20) {
                    int n4 = s2 / this.i;
                    int n5 = s / this.h;
                    byte by2 = this.cu[n4][n5];
                    if ((by2 == 87 || by2 == 91 || by2 == 92 || by2 == 93) && this.aw == 2) {
                        bl = false;
                    } else if (by2 == 88 && this.aw == 3) {
                        bl = false;
                    } else if (by2 == 89 && this.aw == 0) {
                        bl = false;
                    } else if (by2 == 90 && this.aw == 1) {
                        bl = false;
                    }
                    if (bl) {
                        switch (this.aw) {
                            case 0: {
                                if (!this.a(n5 - 1, n4, this.aw, by) || this.a(s - this.h, (int)s2, this.az, 0)) break;
                                n = 1;
                                break;
                            }
                            case 1: {
                                if (!this.a(n5 + 1, n4, this.aw, by) || this.a(s + this.h, (int)s2, this.az, 1)) break;
                                n = 1;
                                break;
                            }
                            case 2: {
                                if (!this.a(n5, n4 - 1, this.aw, by) || this.a((int)s, s2 - this.i, this.az, 2)) break;
                                n = 1;
                                break;
                            }
                            case 3: {
                                if (!this.a(n5, n4 + 1, this.aw, by) || this.a((int)s, s2 + this.i, this.az, 3)) break;
                                n = 1;
                            }
                        }
                    }
                    if (n != 0) {
                        this.cG[this.az] = (byte)this.h;
                        this.cF[this.az] = (byte)this.aw;
                        this.cH[this.az] = false;
                    }
                }
            }
            if (this.az == -1 || this.cF[this.az] == 4) {
                if (this.M()) {
                    if (!this.bh) {
                        this.az = -1;
                    }
                    this.bg = true;
                    if (!this.bi && !this.bm) {
                        this.av = 3;
                    }
                } else if (this.aC == 0 && !this.bi && !this.bm && this.bc == 0) {
                    this.av = 3;
                }
            }
        } else if (this.bc > 0) {
            this.bc = (byte)(this.bc - 1);
            if (this.bc <= 0) {
                this.bc = 0;
                n = this.ar;
                int n6 = this.as;
                switch (this.aw) {
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
                this.cu[n6][n] = 124;
                this.f(this.bI, this.bJ);
                this.av = 3;
                this.aC = 0;
                this.bo = true;
            }
        }
        if (this.O()) {
            return false;
        }
        if (this.aw == 5 && (this.R || this.S || this.T)) {
            this.T = false;
            this.S = false;
            this.R = false;
            if (!this.dg) {
                this.ab();
                this.d(true);
            } else {
                this.f(false);
            }
            return true;
        }
        if (this.ay != 0) {
            if (this.bg && this.ay <= this.j) {
                this.bg = false;
                this.J();
                if (this.bb == 0 && !this.bm) {
                    this.aW = this.az != -1 ? this.m : 0;
                }
            }
            switch (this.bb) {
                case 1: {
                    this.aW += 6;
                    break;
                }
                case 2: {
                    this.aW -= 6;
                }
            }
            this.aC = 0;
            this.N();
            if (this.ay == 0) {
                switch (this.bb) {
                    case 1: {
                        this.bb = 0;
                        this.bm = true;
                        this.aW = this.k;
                        this.av = 0;
                        this.aN = 1;
                        break;
                    }
                    case 2: {
                        this.bb = 0;
                        this.bm = false;
                        this.aW = 0;
                        this.av = 0;
                    }
                }
                this.aC = 0;
                this.bl = false;
                if (this.bk) {
                    this.bk = false;
                    if (this.cu[this.as][this.ar] == -56) {
                        this.cv[this.as][this.ar] = (byte)(this.cU ? 202 : 203);
                    }
                    this.cu[this.as][this.ar] = bs[this.b(4)];
                    this.f(this.bI, this.bJ);
                }
                switch (this.aX) {
                    case 1: {
                        this.aX = 0;
                        this.cv[this.as][this.ar] = -1;
                        this.f(this.bI, this.bJ);
                        this.aN = 0;
                        this.bi = true;
                        this.av = 0;
                        this.b(this.I());
                        break;
                    }
                    case 2: {
                        this.aX = 0;
                        this.bi = false;
                        this.aN = 0;
                        this.cv[this.as][this.ar] = -36;
                        this.f(this.bI, this.bJ);
                        ++this.ar;
                        this.ap += this.h;
                        this.b(this.I());
                        this.O = false;
                        this.N = false;
                        this.Q = false;
                        this.P = false;
                    }
                }
            }
        } else if (!(this.bi || this.bj || this.bm || this.bc != 0 || this.aw >= 4 || ++this.aC < 160)) {
            this.aw = 4;
            this.av = 0;
            this.be = true;
        }
        if (this.aL != -1) {
            --this.aP;
            if (this.aP <= 0) {
                if (this.cv[this.aM][this.aL] == -43) {
                    this.cv[this.aM][this.aL] = -42;
                    this.aP = 6;
                } else {
                    this.cv[this.aM][this.aL] = -1;
                    this.aL = -1;
                }
                this.f(this.bI, this.bJ);
            }
        }
        if (this.dr > 0) {
            this.R();
        }
        if (this.ds == 0) {
            --this.aQ;
            if (this.aQ <= 0) {
                n = this.cv[this.cT][this.cS];
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
                        this.dp = this.cS * this.h;
                        this.dq = this.cT * this.i + (this.i >> 1);
                        this.dt = 0;
                        this.du = (byte)-1;
                        this.dv = (byte)4;
                        this.ds = 1;
                    }
                }
                this.cv[this.cT][this.cS] = n;
                this.aQ = 6;
                this.f(this.bI, this.bJ);
            }
        }
        if (!this.dV && this.aT == 0) {
            this.d(this.ap, this.aq);
        }
        if (this.bI != n2 || this.bJ != n3) {
            this.g(this.bI, this.bJ);
        }
        return true;
    }

    private final String I() {
        if (this.bi) {
            return "/mow.mid";
        }
        if (this.bV != 0) {
            if (!this.cV) {
                if (this.H != -1) {
                    return "/ingame" + this.H + ".mid";
                }
                return "/ingame" + this.b(this.D[4] + 1) + ".mid";
            }
            if (!this.df) {
                return "/shop.mid";
            }
            return "/bonus.mid";
        }
        if (this.bU == 1) {
            return "/shop.mid";
        }
        if (this.bU == 2 || this.bU == 4 || this.bU == 5) {
            return "/sandman.mid";
        }
        return "/shop.mid";
    }

    private final void b(String string) {
        if (this.c == 1) {
            this.a(string, (int)this.bt, true);
        }
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final void J() {
        byte by = this.cu[this.as][this.ar];
        byte by2 = this.cv[this.as][this.ar];
        if (this.aF != -1) {
            this.cu[this.aG][this.aF] = -81;
            this.f(this.bI, this.bJ);
            this.aF = -1;
        } else if (this.aH != -1) {
            this.cu[this.aI][this.aH] = this.b(this.cu[this.aI][this.aH]);
            this.f(this.bI, this.bJ);
            this.aH = -1;
        } else if (this.aU != -1) {
            this.cu[this.aV][this.aU] = this.c(this.cu[this.aV][this.aU]);
            this.f(this.bI, this.bJ);
            this.aU = -1;
        } else if (this.aJ != -1) {
            if (this.aL != -1) {
                this.cv[this.aM][this.aL] = -1;
                this.f(this.bI, this.bJ);
            }
            this.cv[this.aK][this.aJ] = -43;
            this.f(this.bI, this.bJ);
            this.aL = this.aJ;
            this.aM = this.aK;
            this.aP = 6;
            this.aJ = -1;
        } else if (this.aR != -1) {
            --this.cC;
            this.cv[this.aS][this.aR] = -52;
            this.f(this.bI, this.bJ);
            this.aR = -1;
        }
        if (this.bm) {
            if (by2 != -11) return;
            this.bb = (byte)2;
        } else if (by2 == -12) {
            this.bb = 1;
            this.aW = 0;
            return;
        }
        if (by2 == -44) {
            this.aJ = this.ar;
            this.aK = this.as;
            return;
        }
        if (by2 == -39 && this.cS != -1 && this.ds == -1) {
            this.ds = 0;
            this.aQ = 6;
        }
        this.bj = false;
        if (!this.bi) {
            if (by2 == -51) {
                this.de = false;
                if (this.cV && !this.df) {
                    this.df = true;
                    this.b(this.I());
                    this.m();
                    this.bZ = 0L;
                }
                this.cv[this.as][this.ar] = -1;
                this.f(this.bI, this.bJ);
            } else if (by2 == -8) {
                ++this.bX;
                this.cv[this.as][this.ar] = -1;
                this.f(this.bI, this.bJ);
            } else if (by2 == -35) {
                this.aA = 0;
                this.cX = true;
                this.cv[this.as][this.ar] = -1;
                this.f(this.bI, this.bJ);
            } else if (by2 == -13) {
                this.aA = 0;
                this.cY = true;
                this.cv[this.as][this.ar] = -1;
                this.f(this.bI, this.bJ);
            } else if (by2 == -49) {
                ++this.cD;
                this.cv[this.as][this.ar] = -1;
                this.f(this.bI, this.bJ);
            } else if (by2 == -54) {
                --this.cC;
                this.cv[this.as][this.ar] = -55;
                this.f(this.bI, this.bJ);
            } else if (by2 == -53) {
                this.aR = this.ar;
                this.aS = this.as;
            } else if (by2 == -33) {
                if (this.cD > 0) {
                    --this.cD;
                    this.dh[this.do] = (byte)this.ar;
                    this.di[this.do] = (byte)this.as;
                    this.dj[this.do] = 1;
                    this.dk[this.do] = 16;
                    ++this.do;
                    this.cv[this.as][this.ar] = -17;
                    this.f(this.bI, this.bJ);
                } else {
                    this.aY = (byte)4;
                    this.aA = 4;
                }
            } else if (by2 == -18 || by2 == -34 || by2 == -50) {
                this.bj = true;
            } else if (by2 == -36) {
                this.aX = 1;
            } else if (by2 == -10) {
                this.J = (short)(this.J + 1);
                this.cv[this.as][this.ar] = -1;
                this.f(this.bI, this.bJ);
                this.a(true, this.bV, this.bU);
                this.I = (short)(this.I + this.bX);
                this.eg = 0;
                this.h();
                this.d(false);
                this.l();
                this.s();
                return;
            }
        }
        if (by == -92) {
            this.L();
            return;
        } else if (by == -94) {
            this.c(0);
            return;
        } else if (by == -108) {
            this.bn = true;
            this.av = 1;
            return;
        } else if ((by & 0xFF) >= 191 && (by & 0xFF) <= 194) {
            this.a(by);
            return;
        } else if (by == -90) {
            this.c(1);
            return;
        } else if (by == -80) {
            this.aF = this.ar;
            this.aG = this.as;
            return;
        } else if (!this.bi && (by & 0xFF) >= 185 && (by & 0xFF) <= 190) {
            this.aH = this.ar;
            this.aI = this.as;
            return;
        } else if (!this.bi && (by & 0xFF) >= 177 && (by & 0xFF) <= 180) {
            this.aU = this.ar;
            this.aV = this.as;
            return;
        } else if (!this.bi && by == -97) {
            this.cZ = true;
            this.cu[this.as][this.ar] = 124;
            this.f(this.bI, this.bJ);
            return;
        } else if (by == -89) {
            this.da = false;
            this.a((byte)-89, (byte)-88);
            return;
        } else if (by == -87) {
            this.db = false;
            this.a((byte)-87, (byte)-86);
            return;
        } else if (by == -85) {
            this.dc = false;
            this.a((byte)-85, (byte)-84);
            return;
        } else if (by == -83) {
            this.dd = false;
            this.a((byte)-83, (byte)-82);
            return;
        } else if (by == -88) {
            this.da = true;
            this.aZ = (byte)2;
            this.a((byte)-88, (byte)-89);
            this.aT = 64;
            this.d(this.cK * this.h, this.cL * this.i);
            return;
        } else if (by == -86) {
            this.db = true;
            this.aZ = (byte)3;
            this.a((byte)-86, (byte)-87);
            this.aT = 64;
            this.d(this.cM * this.h, this.cN * this.i);
            return;
        } else if (by == -84) {
            this.dc = true;
            this.aZ = 0;
            this.a((byte)-84, (byte)-85);
            this.aT = 64;
            this.d(this.cO * this.h, this.cP * this.i);
            return;
        } else if (by == -82) {
            this.dd = true;
            this.aZ = 1;
            this.a((byte)-82, (byte)-83);
            this.aT = 64;
            this.d(this.cQ * this.h, this.cR * this.i);
            return;
        } else if (!this.bi && by == -81) {
            this.K();
            return;
        } else if (!this.bi && this.cC == 0 && by == -106) {
            this.d(false);
            this.l();
            this.ax = this.aw;
            this.aw = 6;
            this.av = 0;
            this.be = true;
            return;
        } else if (this.bi && by == -96) {
            this.aX = (byte)2;
            return;
        } else {
            if ((by & 0xFF) < 151 || (by & 0xFF) > 157) return;
            int n = (by & 0xFF) - 151;
            boolean bl = this.I >= this.bu[n];
            this.a(bl ? n : -1, this.a[82 + n] + this.a[91 + n] + (bl ? this.a[99] : this.a[98]), bl ? this.a[32] : this.a[30], bl ? this.a[33] : null);
        }
    }

    private final void K() {
        this.d(false);
        this.l();
        this.ay = 0;
        this.aw = 5;
        this.bm = false;
        this.bj = false;
        this.av = 0;
        if (this.dV) {
            this.dV = false;
            this.W();
        }
        if (this.c == 1) {
            this.a(this.ba == -1 ? "/death.mid" : "/alarm.mid", (int)this.bt, false);
        }
        this.U = false;
    }

    private final void L() {
        for (int i = 0; i < this.dx; ++i) {
            for (int j = 0; j < this.dw; ++j) {
                this.cu[i][j] = this.b(this.cu[i][j]);
            }
        }
        this.f(this.bI, this.bJ);
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
        for (int i = 0; i < this.dx; ++i) {
            for (int j = 0; j < this.dw; ++j) {
                this.cu[i][j] = this.a(this.cu[i][j], by6, by4, by5, by3, by2, by);
            }
        }
        this.f(this.bI, this.bJ);
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
        for (int i = 0; i < this.dx; ++i) {
            for (int j = 0; j < this.dw; ++j) {
                by = this.cu[i][j];
                if (by == by5) {
                    this.cu[i][j] = by4;
                    continue;
                }
                if (by == by4) {
                    this.cu[i][j] = by5;
                    continue;
                }
                if (by == by3) {
                    this.cu[i][j] = by2;
                    continue;
                }
                if (by != by2) continue;
                this.cu[i][j] = by3;
            }
        }
        this.f(this.bI, this.bJ);
    }

    private final void a(byte by, byte by2) {
        for (int i = 0; i < this.dx; ++i) {
            for (int j = 0; j < this.dw; ++j) {
                if (this.cu[i][j] != by) continue;
                this.cu[i][j] = by2;
            }
        }
        this.f(this.bI, this.bJ);
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
        for (int i = 0; i < this.cB; ++i) {
            if (this.cF[i] != 4 || this.cI[i] != n || this.cJ[i] != n2) continue;
            this.bh = true;
            this.az = (byte)i;
            return true;
        }
        return false;
    }

    private final boolean M() {
        boolean bl;
        byte by = this.cu[this.as][this.ar];
        byte by2 = this.cv[this.as][this.ar];
        if (this.bo) {
            this.bo = false;
            switch (this.aw) {
                case 0: {
                    if (!this.a(-1, 0, false)) break;
                    --this.ar;
                    this.ay = this.h;
                    if (this.F) {
                        this.bl = true;
                    }
                    return true;
                }
                case 1: {
                    if (!this.a(1, 0, false)) break;
                    ++this.ar;
                    this.ay = this.h;
                    if (this.F) {
                        this.bl = true;
                    }
                    return true;
                }
                case 2: {
                    if (!this.a(0, -1, false)) break;
                    --this.as;
                    this.ay = this.i;
                    if (this.F) {
                        this.bl = true;
                    }
                    return true;
                }
                case 3: {
                    if (!this.a(0, 1, false)) break;
                    ++this.as;
                    this.ay = this.i;
                    if (this.F) {
                        this.bl = true;
                    }
                    return true;
                }
            }
        }
        if (this.bm) {
            switch (this.aw) {
                case 0: {
                    --this.ar;
                    this.ay = this.h;
                    break;
                }
                case 1: {
                    ++this.ar;
                    this.ay = this.h;
                    break;
                }
                case 2: {
                    --this.as;
                    this.ay = this.i;
                    break;
                }
                case 3: {
                    ++this.as;
                    this.ay = this.i;
                }
            }
            return true;
        }
        if (by2 != -44) {
            if (by == -73 && this.a(-1, 0, true)) {
                this.aw = 0;
                this.aN = 3;
            } else if (by == -72 && this.a(1, 0, true)) {
                this.aw = 1;
                this.aN = 3;
            } else if (by == -75 && this.a(0, -1, true)) {
                this.aw = 2;
                this.aN = 3;
            } else if (by == -74 && this.a(0, 1, true)) {
                this.aw = 3;
                this.aN = 3;
            }
        }
        if (this.aN > 0) {
            bl = true;
            boolean bl2 = false;
            switch (this.aw) {
                case 0: {
                    if (this.a(-1, 0, false)) {
                        --this.ar;
                        if (this.dV || !this.P) break;
                        bl = false;
                        break;
                    }
                    bl2 = true;
                    break;
                }
                case 1: {
                    if (this.a(1, 0, false)) {
                        ++this.ar;
                        if (this.dV || !this.Q) break;
                        bl = false;
                        break;
                    }
                    bl2 = true;
                    break;
                }
                case 2: {
                    if (this.a(0, -1, false)) {
                        --this.as;
                        if (this.dV || !this.N) break;
                        bl = false;
                        break;
                    }
                    bl2 = true;
                    break;
                }
                case 3: {
                    if (this.a(0, 1, false)) {
                        ++this.as;
                        if (this.dV || !this.O) break;
                        bl = false;
                        break;
                    }
                    bl2 = true;
                }
            }
            if (!bl2) {
                if (this.bi && this.c(this.ar, this.as) == -19) {
                    this.cv[this.as][this.ar] = -1;
                    this.f(this.bI, this.bJ);
                    this.aO = 8;
                }
                this.aN = !bl || by == -108 ? 3 : --this.aN;
                if (by == -108) {
                    this.bn = true;
                    this.aN = 3;
                }
                this.ay = this.h;
                return true;
            }
            this.aN = 0;
            this.aO = 8;
            this.bf = false;
        }
        if (this.ay == 0 && by == -108) {
            bl = false;
            switch (this.aw) {
                case 0: {
                    if (this.a(-1, 0, false)) {
                        --this.ar;
                        break;
                    }
                    bl = true;
                    break;
                }
                case 1: {
                    if (this.a(1, 0, false)) {
                        ++this.ar;
                        break;
                    }
                    bl = true;
                    break;
                }
                case 2: {
                    if (this.a(0, -1, false)) {
                        --this.as;
                        break;
                    }
                    bl = true;
                    break;
                }
                case 3: {
                    if (this.a(0, 1, false)) {
                        ++this.as;
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
                this.ay = this.h;
                this.bn = true;
                this.av = 1;
                if (!this.bi && this.F) {
                    this.bl = true;
                }
                return true;
            }
        }
        if (!this.dV && this.aT == 0) {
            if (this.P) {
                if (this.a(-1, 0, false)) {
                    --this.ar;
                    this.aw = 0;
                    this.ay = this.h;
                    if (!this.bi && this.F) {
                        this.bl = true;
                    }
                    return true;
                }
            } else if (this.Q) {
                if (this.a(1, 0, false)) {
                    ++this.ar;
                    this.aw = 1;
                    this.ay = this.h;
                    if (!this.bi && this.F) {
                        this.bl = true;
                    }
                    return true;
                }
            } else if (this.N) {
                if (this.a(0, -1, false)) {
                    --this.as;
                    this.aw = 2;
                    this.ay = this.h;
                    if (!this.bi && this.F) {
                        this.bl = true;
                    }
                    return true;
                }
            } else if (this.O && this.a(0, 1, false)) {
                ++this.as;
                this.aw = 3;
                this.ay = this.h;
                if (!this.bi && this.F) {
                    this.bl = true;
                }
                return true;
            }
        }
        return false;
    }

    private final byte b(int n, int n2) {
        if (n < 0 || n2 < 0 || n >= this.dw || n2 >= this.dx) {
            return -1;
        }
        return this.cu[n2][n];
    }

    private final byte c(int n, int n2) {
        if (n < 0 || n2 < 0 || n >= this.dw || n2 >= this.dx) {
            return -1;
        }
        return this.cv[n2][n];
    }

    private final boolean a(int n, int n2, boolean bl) {
        int n3 = this.ar + n;
        int n4 = this.as + n2;
        this.bc = 0;
        if (n3 < 0 || n4 < 0 || n3 >= this.dw || n4 >= this.dx) {
            return false;
        }
        if (this.bm) {
            return true;
        }
        byte by = this.cu[this.as][this.ar];
        byte by2 = this.cu[n4][n3];
        byte by3 = this.cv[n4][n3];
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
        if (!this.bi && this.a(this.ar + n, this.as + n2)) {
            return true;
        }
        boolean bl4 = bl2 = (by2 & 0xFF) >= 94 && (by2 & 0xFF) <= 200;
        if (bl2) {
            if ((by2 & 0xFF) >= 185 && (by2 & 0xFF) <= 190) {
                if (!this.bi) {
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
                bl2 = !this.bi;
            } else if (by2 == -57 || by2 == -56) {
                if (this.bi) {
                    this.bk = true;
                } else {
                    bl2 = false;
                }
            } else if (by2 == -61 || by2 == -59) {
                bl2 = false;
            }
        } else if (by2 == 77 && !this.bi) {
            if (this.cZ) {
                this.bc = (byte)32;
                this.av = 0;
                this.aw = n != 0 ? (n < 0 ? 0 : 1) : (n2 < 0 ? 2 : 3);
                this.bl = false;
                this.aN = 0;
                this.aC = 0;
            } else {
                this.aY = (byte)3;
                this.aA = 4;
            }
        }
        if (!bl2) {
            switch (by3) {
                case -50: 
                case -44: 
                case -34: {
                    bl2 = !this.bi;
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
                    bl2 = !this.bi;
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
                    if (!this.bi) {
                        if (!this.de && this.D[2] == 0) {
                            this.aY = 1;
                            this.aA = 4;
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
                    if (!this.cX) {
                        this.aY = 0;
                        this.aA = 4;
                        bl2 = false;
                        break;
                    }
                    bl2 = true;
                    break;
                }
                case -22: 
                case -9: {
                    if (this.cV) {
                        String string;
                        int n5;
                        boolean bl5 = false;
                        if (!this.df) {
                            if (this.D[2] > 0) {
                                n5 = -1;
                                string = this.a[113] + this.a[114];
                            } else if (!this.de) {
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
                    } else if (this.bV == 0) {
                        if (this.bU == 1) {
                            this.a(-1, this.a[100] + this.I + this.a[101], this.a[30], null);
                        } else if (this.bU == 2) {
                            if (this.J > 0) {
                                this.a(9, this.a[102] + this.J + this.a[103], this.a[32], this.a[33]);
                            } else {
                                this.a(-1, this.a[102] + this.a[104], this.a[30], null);
                            }
                        } else if (this.bU == 3) {
                            this.a(-1, this.a[109], this.a[30], null);
                        } else if (this.bU == 4) {
                            this.a(10, this.a[112], this.a[32], this.a[33]);
                        } else if (this.bU == 5) {
                            this.a(-1, this.a[110], this.a[30], null);
                        }
                    }
                    bl2 = false;
                    break;
                }
                case -21: {
                    this.D();
                    bl2 = false;
                    break;
                }
                case -19: {
                    bl2 = this.bi && (this.aN > 0 || bl);
                    break;
                }
                case -12: {
                    if (!this.bi) {
                        if (this.cY) {
                            bl2 = true;
                            break;
                        }
                        this.aY = (byte)2;
                        this.aA = 4;
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

    private final void N() {
        int n = this.aw;
        int n2 = this.aN > 0 || this.bl ? 6 : 3;
        this.ay -= n2;
        if (this.aw == 6) {
            n = this.ax;
        }
        switch (n) {
            case 0: {
                this.ap -= n2;
                break;
            }
            case 1: {
                this.ap += n2;
                break;
            }
            case 2: {
                this.aq -= n2;
                break;
            }
            case 3: {
                this.aq += n2;
            }
        }
    }

    private final boolean O() {
        if (!this.bf || this.aw <= 3 && !this.bm && (this.aN > 0 || this.F && !this.bi && this.bc <= 0)) {
            this.aD = (this.aD + 1) % 12;
            if (this.bi) {
                this.av = (this.av + 1) % 2;
            } else if (this.bm) {
                this.av = 0;
            } else if (this.bc > 0) {
                this.av = (this.av + 1) % 9;
            } else {
                switch (this.aw) {
                    case 0: 
                    case 1: 
                    case 2: 
                    case 3: {
                        if (this.ay == 0) break;
                        if (!this.bn) {
                            this.av = (this.av + 1) % 8;
                            break;
                        }
                        this.av = 1;
                        break;
                    }
                    case 4: {
                        if (this.be) {
                            ++this.av;
                            if (this.av < 3) break;
                            this.av = 1;
                            this.be = false;
                            break;
                        }
                        --this.av;
                        if (this.av >= 0) break;
                        this.av = 1;
                        this.be = true;
                        break;
                    }
                    case 5: {
                        if (this.av >= 7) break;
                        ++this.av;
                        break;
                    }
                    case 6: {
                        if (this.be) {
                            ++this.av;
                            if (this.av < 10) break;
                            if (this.bV != 0) {
                                this.ap();
                            } else if (this.bU == 1) {
                                this.ah();
                                this.aO = 0;
                                this.bO = this.bI;
                                this.bP = this.bJ;
                            } else if (this.bU == 5) {
                                this.G = true;
                                this.h();
                                this.bV = this.bW;
                                this.bU = 1;
                                this.aa();
                                this.d(true);
                            } else {
                                this.A();
                            }
                            return true;
                        }
                        --this.av;
                        if (this.av >= 0) break;
                        this.aw = 3;
                        this.av = 3;
                        this.m();
                    }
                }
            }
            if (this.ba != -1) {
                this.ba = (byte)((this.ba + 1) % 2);
            }
            this.bf = true;
        } else {
            this.bf = false;
        }
        if (this.aw <= 3 && this.bn) {
            this.av = 1;
        }
        return false;
    }

    private final void P() {
        for (int i = 0; i < this.cB; ++i) {
            short s;
            short s2;
            byte by = this.cE[i];
            int n = this.cF[i];
            int n2 = this.cI[i];
            int n3 = this.cJ[i];
            int n4 = this.cG[i];
            boolean bl = this.cH[i];
            short s3 = 3;
            boolean bl2 = false;
            if (n4 > 0) {
                s2 = 0;
                s = 0;
                switch (n) {
                    case 0: {
                        s = bl ? (short)-6 : -s3;
                        break;
                    }
                    case 1: {
                        s = bl ? (short)6 : s3;
                        break;
                    }
                    case 2: {
                        s2 = bl ? (short)-6 : -s3;
                        break;
                    }
                    case 3: {
                        short s4 = s2 = bl ? (short)6 : s3;
                    }
                }
                if (!bl || !this.a(n2 + s, n3 + s2, i, 4)) {
                    this.cI[i] = (short)(n2 += s);
                    this.cJ[i] = (short)(n3 += s2);
                    if (this.az == i) {
                        this.ap += s;
                        this.aq += s2;
                        this.ar = this.ap / this.h;
                        this.as = this.aq / this.i;
                    }
                    n4 -= bl ? (short)6 : s3;
                }
            }
            if (i == this.aE && this.aT > 1) {
                this.d(n2, n3);
                --this.aT;
            }
            if (n4 <= 0) {
                s2 = n3 / this.i;
                s = n2 / this.h;
                byte by2 = this.cu[s2][s];
                byte by3 = this.cv[s2][s];
                n4 = 0;
                bl = false;
                if (by == -20) {
                    if (by2 == 90) {
                        if (this.a(s - 1, (int)s2, 0, by) && !this.a(n2 - this.h, n3, i, 0)) {
                            n = 0;
                            n4 = this.h;
                        }
                    } else if (by2 == 89) {
                        if (this.a(s + 1, (int)s2, 1, by) && !this.a(n2 + this.h, n3, i, 1)) {
                            n = 1;
                            n4 = this.h;
                        }
                    } else if (by2 == 88) {
                        if (this.a((int)s, s2 - 1, 2, by) && !this.a(n2, n3 - this.i, i, 2)) {
                            n = 2;
                            n4 = this.i;
                        }
                    } else if (by2 == 87) {
                        if (this.a((int)s, s2 + 1, 3, by) && !this.a(n2, n3 + this.i, i, 3)) {
                            n = 3;
                            n4 = this.i;
                        }
                    } else if ((by2 == 91 || by2 == 92 || by2 == 93) && this.a((int)s, s2 + 1, 3, by) && !this.a(n2, n3 + this.i, i, 3)) {
                        n = 3;
                        n4 = this.i;
                        bl = true;
                    }
                } else if (by == -32 && by3 == -16 || by == -31 && by3 == -15 || by == -30 && by3 == -14) {
                    bl2 = true;
                } else if (this.aT == 0 || this.bO == this.bI && this.bP == this.bJ || this.aE != -1) {
                    if (this.da && n != 2 && s == this.cK && s2 >= this.cL - 3 && s2 <= this.cL - 1 && this.a((int)s, s2 - 1, 2, by) && !this.a(n2, n3 - this.i, i, 2)) {
                        n = 2;
                        n4 = this.i;
                    } else if (this.db && n != 3 && s == this.cM && s2 >= this.cN + 1 && s2 <= this.cN + 3 && this.a((int)s, s2 + 1, 3, by) && !this.a(n2, n3 + this.i, i, 3)) {
                        n = 3;
                        n4 = this.i;
                    } else if (this.dc && n != 0 && s2 == this.cP && s >= this.cO - 3 && s <= this.cO - 1 && this.a(s - 1, (int)s2, 0, by) && !this.a(n2 - this.h, n3, i, 0)) {
                        n = 0;
                        n4 = this.h;
                    } else if (this.dd && n != 1 && s2 == this.cR && s >= this.cQ + 1 && s <= this.cQ + 3 && this.a(s + 1, (int)s2, 1, by) && !this.a(n2 + this.h, n3, i, 1)) {
                        n = 1;
                        n4 = this.h;
                    }
                    if (n4 != 0 && this.aZ == n) {
                        this.aZ = (byte)-1;
                        this.aE = i;
                        this.aT = 64;
                        this.d(s * this.h, s2 * this.i);
                    }
                }
                if (!bl2 && n4 == 0) {
                    switch (n) {
                        case 0: {
                            if (!this.a(s - 1, (int)s2, 0, by) || this.a(n2 - this.h, n3, i, 0)) break;
                            n4 = this.h;
                            break;
                        }
                        case 1: {
                            if (!this.a(s + 1, (int)s2, 1, by) || this.a(n2 + this.h, n3, i, 1)) break;
                            n4 = this.h;
                            break;
                        }
                        case 2: {
                            if (!this.a((int)s, s2 - 1, 2, by) || this.a(n2, n3 - this.i, i, 2)) break;
                            n4 = this.i;
                            break;
                        }
                        case 3: {
                            if (!this.a((int)s, s2 + 1, 3, by) || this.a(n2, n3 + this.i, i, 3)) break;
                            n4 = this.i;
                        }
                    }
                }
                if (n4 == 0) {
                    n = 4;
                }
            }
            this.cG[i] = (byte)n4;
            this.cF[i] = (byte)n;
            this.cH[i] = bl;
        }
    }

    private final boolean a(int n, int n2, int n3, int n4) {
        for (int i = 0; i < this.cB; ++i) {
            if (i == n3) continue;
            if (n3 != -1) {
                if (this.cF[i] == n4 || !this.b(n, n2, this.cI[i], this.cJ[i])) continue;
                return true;
            }
            byte by = this.cG[i];
            short s = this.cI[i];
            short s2 = this.cJ[i];
            switch (this.cF[i]) {
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
        if (n < 0 || n2 < 0 || n >= this.dw || n2 >= this.dx) {
            return false;
        }
        byte by2 = this.cv[n2][n];
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
        by2 = this.cu[n2][n];
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
                    if (!this.dd || n2 != this.cR || n < this.cQ + 1 || n > this.cQ + 3) break;
                    return false;
                }
                case 1: {
                    if (!this.dc || n2 != this.cP || n < this.cO - 3 || n > this.cO - 1) break;
                    return false;
                }
                case 2: {
                    if (!this.db || n != this.cM || n2 < this.cN + 1 || n2 > this.cN + 3) break;
                    return false;
                }
                case 3: {
                    if (!this.da || n != this.cK || n2 < this.cL - 3 || n2 > this.cL - 1) break;
                    return false;
                }
            }
            if ((by2 & 0xFF) >= 71 && (by2 & 0xFF) <= 76) {
                return true;
            }
        }
        return false;
    }

    private final void Q() {
        int n;
        this.bv = (byte)((this.bv + 1) % 8);
        this.aT = 16;
        this.d(this.dp, this.dq);
        if (this.dv == 3) {
            boolean bl;
            n = this.dp / this.h;
            int n2 = this.dq / this.i;
            if (n < 0 || n2 < 0 || n >= this.dw || n2 >= this.dx) {
                this.ds = (byte)-1;
                return;
            }
            byte by = this.cu[n2][n];
            byte by2 = this.cv[n2][n];
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
                        if (this.dt == 0) {
                            this.du = (byte)3;
                            break;
                        }
                        if (this.dt == 2) {
                            this.du = 1;
                            break;
                        }
                        bl = false;
                        break;
                    }
                    case -78: {
                        if (this.dt == 1) {
                            this.du = (byte)3;
                            break;
                        }
                        if (this.dt == 2) {
                            this.du = 0;
                            break;
                        }
                        bl = false;
                        break;
                    }
                    case -77: {
                        if (this.dt == 0) {
                            this.du = (byte)2;
                            break;
                        }
                        if (this.dt == 3) {
                            this.du = 1;
                            break;
                        }
                        bl = false;
                        break;
                    }
                    case -76: {
                        if (this.dt == 1) {
                            this.du = (byte)2;
                            break;
                        }
                        if (this.dt == 3) {
                            this.du = 0;
                            break;
                        }
                        bl = false;
                    }
                }
            }
            if (!bl) {
                this.ds = (byte)-1;
                return;
            }
        } else if (this.dv == 0) {
            this.dv = (byte)8;
            if (this.du != -1) {
                this.dt = this.du;
                this.du = (byte)-1;
            }
        }
        this.dv = (byte)(this.dv - 1);
        n = 6;
        switch (this.dt) {
            case 0: {
                this.dp -= n;
                break;
            }
            case 1: {
                this.dp += n;
                break;
            }
            case 2: {
                this.dq -= n;
                break;
            }
            default: {
                this.dq += n;
            }
        }
    }

    private final void b(byte by, byte by2) {
        if (this.dr >= 5) {
            this.cv[this.dm[0]][this.dl[0]] = -1;
            for (int i = 0; i < this.dr - 1; ++i) {
                this.dl[i] = this.dl[i + 1];
                this.dm[i] = this.dm[i + 1];
                this.dn[i] = this.dn[i + 1];
            }
            --this.dr;
        }
        this.dl[this.dr] = by;
        this.dm[this.dr] = by2;
        this.dn[this.dr] = 6;
        ++this.dr;
        this.cv[by2][by] = -28;
        this.f(this.bI, this.bJ);
    }

    private final void R() {
        boolean bl = false;
        for (int i = 0; i < this.dr; ++i) {
            byte by = this.dn[i];
            if (by <= 0) {
                byte by2 = this.dl[i];
                byte by3 = this.dm[i];
                int n = this.cv[by3][by2];
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
                this.dn[i] = 6;
                this.cv[by3][by2] = n;
                if (!bl2) continue;
                for (int j = i; j < this.dr - 1; ++j) {
                    this.dl[j] = this.dl[j + 1];
                    this.dm[j] = this.dm[j + 1];
                    this.dn[j] = this.dn[j + 1];
                }
                --this.dr;
                --i;
                continue;
            }
            this.dn[i] = (byte)(by - 1);
        }
        if (bl) {
            this.f(this.bI, this.bJ);
        }
    }

    private final void S() {
        boolean bl = false;
        for (int i = 0; i < this.do; ++i) {
            byte by = this.dk[i];
            if (by <= 0) {
                byte by2;
                byte by3 = this.dh[i];
                byte by4 = this.di[i];
                byte by5 = this.dj[i];
                boolean bl2 = true;
                if (by4 - by5 >= 0 && this.cv[by4 - by5][by3] == -1 && ((by2 = this.cu[by4 - by5][by3]) & 0xFF) >= 0 && (by2 & 0xFF) <= 93) {
                    this.cv[by4 - by5 + 1][by3] = -34;
                    if (by5 <= 1) {
                        this.cv[by4][by3] = -18;
                    }
                    this.cv[by4 - by5][by3] = -50;
                    this.dj[i] = (byte)(by5 + 1);
                    this.dk[i] = 16;
                    bl2 = false;
                    bl = true;
                }
                if (!bl2) continue;
                for (int j = i; j < this.do - 1; ++j) {
                    this.dh[j] = this.dh[j + 1];
                    this.di[j] = this.di[j + 1];
                    this.dk[j] = this.dk[j + 1];
                }
                --this.do;
                --i;
                continue;
            }
            this.dk[i] = (byte)(by - 1);
        }
        if (bl) {
            this.f(this.bI, this.bJ);
        }
    }

    private final void T() {
        int n = 48;
        if (this.cf < this.bJ) {
            n -= 24;
        } else if (this.cf > this.bJ) {
            n += 24;
        }
        int n2 = 0;
        while (n2 < 5) {
            if (this.ch[n2] >> this.r > this.v) {
                this.cg[n2] = this.b(this.u) << this.r;
                this.ch[n2] = -(this.b(10) << this.r);
            }
            int n3 = n2;
            this.cg[n3] = this.cg[n3] + (this.b(3) - 1 << this.r);
            int n4 = n2++;
            this.ch[n4] = this.ch[n4] + n;
        }
        this.cf = this.bJ;
    }

    private final void U() {
        if (this.bB) {
            this.bA = (byte)(this.bA + 1);
            if (this.bA >= 8) {
                this.bB = false;
                this.bA = (byte)8;
            }
        } else {
            this.bA = (byte)(this.bA - 1);
            if (this.bA <= 0) {
                this.bB = true;
                this.bA = 0;
            }
        }
        int n = this.bw >> this.r;
        int n2 = this.bx >> this.r;
        if (n == this.by) {
            this.by = this.b(this.at + 1 - 24);
        }
        if (n2 == this.bz) {
            this.bz = this.b(this.au + 1 - 24);
        }
        int n3 = this.b(48);
        this.bw += n < this.by ? n3 : -n3;
        n3 = this.b(24);
        this.bx += n2 < this.bz ? n3 : -n3;
    }

    private final void V() {
        if (this.bG == 0) {
            int n;
            int n2;
            this.bC = (this.bC + 1) % 8;
            this.bD = (this.bD + 1) % 6;
            this.bE = (this.bE + 1) % 4;
            this.bF = (this.bF + 1) % 3;
            for (int i = 0; i < 3; ++i) {
                int n3 = this.ae[i] + 1;
                if (n3 == 0 || n3 >= 8) {
                    n2 = this.b(this.u) + this.bI;
                    if (this.c(n2 / this.h, (n = this.b(this.v) + this.bJ) / this.i) == -1) {
                        int n4 = this.b(n2 / this.h, n / this.i) & 0xFF;
                        if (n4 < 71 || n4 > 76) {
                            n3 = -1;
                        }
                    } else {
                        n3 = -1;
                    }
                    this.ac[i] = (short)n2;
                    this.ad[i] = (short)n;
                }
                this.ae[i] = n3;
            }
            for (n = 0; n < this.dF; ++n) {
                for (n2 = 0; n2 < this.dE; ++n2) {
                    boolean bl = false;
                    byte by = this.dH[n][n2];
                    byte by2 = this.dI[n][n2];
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
                            if (this.cC != 0) break;
                            bl = true;
                        }
                    }
                    if (!bl) {
                        switch (by2) {
                            case -48: {
                                bl = this.da;
                                break;
                            }
                            case -47: {
                                bl = this.db;
                                break;
                            }
                            case -46: {
                                bl = this.dc;
                                break;
                            }
                            case -45: {
                                bl = this.dd;
                                break;
                            }
                            case -12: {
                                bl = true;
                                break;
                            }
                            case -8: {
                                bl = this.bH;
                            }
                        }
                    }
                    if (!bl) continue;
                    this.a(by, by2, n2 * this.h, n * this.i);
                }
            }
        }
        if (this.bE == 0) {
            if (this.bH) {
                this.bH = false;
            } else if (this.b(7) == 0) {
                this.bH = true;
            }
        }
        ++this.bG;
        if (this.bG >= 4) {
            this.bG = 0;
        }
    }

    private final void W() {
        this.bM = 0;
        this.bN = 0;
        this.d(this.ap, this.aq);
        this.bR = 0;
        this.bQ = 0;
        this.bT = 0;
        this.bS = 0;
        this.bd = true;
        this.Y();
    }

    private final void d(int n, int n2) {
        this.bO = n + this.j - (this.dy >> 1) + this.bM;
        this.bP = n2 + this.k - (this.dz >> 1) + this.bN;
        this.X();
    }

    private final void X() {
        if (this.bO < 0) {
            this.bO = 0;
        } else if (this.bO > this.bK) {
            this.bO = this.bK;
        }
        if (this.bP < 0) {
            this.bP = 0;
        } else if (this.bP > this.bL) {
            this.bP = this.bL;
        }
    }

    private final void Y() {
        int n = this.bO - this.bI;
        int n2 = this.bP - this.bJ;
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
            if (n > this.bS + this.bQ) {
                if (this.bQ < (this.bd || this.dV || this.aT > 0 ? 24 : 6)) {
                    ++this.bQ;
                    this.bS += this.bQ;
                }
            } else if (n < this.bS + this.bQ && this.bQ > 1) {
                this.bS -= this.bQ;
                --this.bQ;
            }
        } else {
            this.bS = 0;
            this.bQ = 0;
        }
        if (n2 != 0) {
            if (n2 > this.bT + this.bR) {
                if (this.bR < (this.bd || this.dV || this.aT > 0 ? 24 : 6)) {
                    ++this.bR;
                    this.bT += this.bR;
                }
            } else if (n2 < this.bT + this.bR && this.bR > 1) {
                this.bT -= this.bR;
                --this.bR;
            }
        } else {
            this.bT = 0;
            this.bR = 0;
        }
        if (n - this.bQ < 0) {
            this.bQ = n;
        }
        if (n2 - this.bR < 0) {
            this.bR = n2;
        }
        this.bI += bl ? this.bQ : -this.bQ;
        this.bJ += bl2 ? this.bR : -this.bR;
        this.g(this.bI, this.bJ);
        if (this.bd && this.bO == this.bI && this.bP == this.bJ) {
            this.bd = false;
        }
    }

    private final void Z() {
        for (int i = 0; i < this.cs.length; ++i) {
            this.cs[i] = this.a(this.cs[i], "/b" + i + ".png");
        }
        this.ct = this.a(this.ct, "/ta.png");
        this.cm = this.a(this.cm, "/hud.png");
        this.cq = this.a(this.cq, "/bf.png");
        this.cr = this.a(this.cr, "/alarm.png");
    }

    private final void c(boolean bl) {
        for (int i = 0; i < (bl ? 9 : 10); ++i) {
            this.cs[i] = null;
        }
        if (!bl) {
            this.ct = null;
        }
        this.cq = null;
        this.cr = null;
    }

    private final void aa() {
        this.Z();
        this.ab();
    }

    private final void ab() {
        String string;
        int n;
        this.X = false;
        this.ab = false;
        this.b(true, -1);
        this.cQ = (short)-1;
        this.cO = (short)-1;
        this.cM = (short)-1;
        this.cK = (short)-1;
        this.dd = false;
        this.dc = false;
        this.db = false;
        this.da = false;
        this.cS = (short)-1;
        this.dp = -1;
        this.ds = (byte)-1;
        this.cW = false;
        if (this.bV == 0) {
            this.E = false;
            this.F = false;
        }
        this.e(this.bV, this.bU);
        this.ae();
        if (this.cW) {
            for (n = 0; n < 5; ++n) {
                this.cg[n] = this.b(this.u) << this.r;
                this.ch[n] = this.b(this.v) << this.r;
            }
        } else {
            this.by = this.b(2) == 0 ? -24 : this.at + 1;
            this.bz = this.b(this.au + 1 - 24);
            this.bw = this.by << this.r;
            this.bx = this.bz << this.r;
        }
        this.bq = -1;
        this.bX = 0;
        this.dg = false;
        this.de = false;
        this.df = false;
        this.cD = 0;
        this.cb = true;
        this.bZ = 0L;
        this.bC = 0;
        this.bD = 0;
        this.bE = 0;
        this.bF = 0;
        this.dU = false;
        this.ay = 0;
        this.aw = 6;
        this.be = false;
        this.bf = false;
        this.av = 9;
        this.bg = false;
        this.bh = false;
        this.cZ = false;
        this.cY = false;
        this.cX = false;
        this.aN = 0;
        this.aO = 0;
        this.az = -1;
        this.bi = false;
        this.bj = false;
        this.bm = false;
        this.bb = 0;
        this.bo = false;
        this.bn = false;
        this.aX = 0;
        this.bk = false;
        this.bc = 0;
        this.bl = false;
        this.aA = 0;
        this.aC = 0;
        this.aW = 0;
        this.ba = (byte)-1;
        this.aT = 0;
        this.ba = (byte)-1;
        this.aZ = (byte)-1;
        this.aE = -1;
        this.aF = -1;
        this.aR = -1;
        this.aH = -1;
        this.aU = -1;
        this.aL = -1;
        this.aJ = -1;
        for (n = 0; n < 5; ++n) {
            this.ae[n] = (byte)(-this.b(8) - 1);
        }
        this.at = this.dw * this.h - 1;
        this.au = this.dx * this.i - 1;
        this.bK = this.at - this.dy;
        this.bL = this.au - this.dz;
        if (this.bK < 0) {
            this.bK = 0;
        }
        if (this.bL < 0) {
            this.bL = 0;
        }
        this.dV = false;
        this.bd = false;
        this.bM = 0;
        this.bN = 0;
        this.d(this.ap, this.aq);
        this.bI = this.bO;
        this.bJ = this.bP;
        this.ag();
        this.f(this.bI, this.bJ);
        if (this.bV != 0) {
            if (this.bU == 11 || this.bU == 12) {
                string = this.a[42];
            } else {
                int n2 = this.bV;
                if (this.bV <= this.ci.length) {
                    n2 = this.ci[this.bV - 1];
                }
                string = this.a[39] + n2 + '-' + this.bU;
            }
        } else {
            switch (this.bU) {
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
        this.b(this.I());
    }

    private final void a(byte by, String string, byte by2) {
        this.eg = by;
        this.ei = string;
        this.eh = by2;
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

    private final void ac() {
        this.cu = null;
        this.cv = null;
        this.cE = null;
        this.cF = null;
        this.cG = null;
        this.cI = null;
        this.cJ = null;
        this.cH = null;
        this.dh = null;
        this.di = null;
        this.dj = null;
        this.dk = null;
    }

    private final void ad() {
        int n = 0;
        for (int i = 1; i <= 4; ++i) {
            this.d(i);
            this.cz[n] = this.cw;
            this.cA[n] = this.cy;
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
            this.cy = dataInputStream.readByte();
            for (int i = 0; i <= n2; ++i) {
                this.cw = dataInputStream.readUTF();
                this.cx = dataInputStream.readUTF();
            }
            dataInputStream.close();
            dataInputStream = null;
        }
        catch (Exception exception) {
            this.c();
        }
    }

    private final void e(int n, int n2) {
        this.ac();
        this.bY = 0;
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
            this.dw = dataInputStream.readByte();
            this.dx = dataInputStream.readByte();
            this.cu = new byte[this.dx][this.dw];
            for (n6 = 0; n6 < this.dx; ++n6) {
                dataInputStream.readFully(this.cu[n6]);
            }
            this.cv = new byte[this.dx][this.dw];
            for (n4 = 0; n4 < this.dx; ++n4) {
                for (n3 = 0; n3 < this.dw; ++n3) {
                    this.cv[n4][n3] = -1;
                }
            }
            this.cB = dataInputStream.readByte();
            this.cE = new byte[this.cB];
            this.cF = new byte[this.cB];
            this.cG = new byte[this.cB];
            this.cI = new short[this.cB];
            this.cJ = new short[this.cB];
            this.cH = new boolean[this.cB];
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
                        this.cI[n8] = (short)(n3 * this.h);
                        this.cJ[n8] = (short)(n4 * this.i);
                        this.cF[n8] = 4;
                        this.cG[n8] = 0;
                        this.cE[n8] = by;
                        ++n8;
                        bl = true;
                        break;
                    }
                    case -41: {
                        this.cv[n4][n3 + 1] = -40;
                        this.cv[n4][n3 + 2] = -39;
                        break;
                    }
                    case -38: {
                        this.cv[n4 + 1][n3] = -22;
                        break;
                    }
                    case -37: {
                        this.cv[n4 + 1][n3] = -21;
                        break;
                    }
                    case -25: {
                        this.cv[n4 + 1][n3] = -9;
                        break;
                    }
                    case -8: {
                        ++this.bY;
                    }
                }
                if (bl) continue;
                this.cv[n4][n3] = by;
            }
            dataInputStream.close();
            dataInputStream = null;
        }
        catch (Exception exception) {
            this.c();
        }
    }

    private final void ae() {
        byte[] byArray = new byte[]{0, 0, 0, 0, 0, 0, 0};
        if (this.bV == 0 && this.bU == 1) {
            byArray[6] = (byte)(1 - this.D[6]);
            byArray[4] = (byte)(2 - this.D[4]);
            byArray[3] = (byte)(1 - this.D[3]);
            byArray[5] = (byte)(1 - this.D[5]);
            byArray[2] = (byte)(1 - this.D[2]);
            byArray[0] = (byte)(1 - this.D[0]);
            byArray[1] = (byte)(1 - this.D[1]);
        }
        this.cC = 0;
        int n = 0;
        this.cV = this.bV != 0 && (this.bU == 11 || this.bU == 12);
        for (int i = 0; i < this.dx; ++i) {
            for (int j = 0; j < this.dw; ++j) {
                byte by = this.cu[i][j];
                byte by2 = this.cv[i][j];
                if (by == -107) {
                    this.ar = j;
                    this.as = i;
                    this.ap = j * this.h;
                    this.aq = i * this.i;
                } else if (by == -56) {
                    ++this.cC;
                } else if (by == 77) {
                    this.cW = true;
                } else if (this.bV == 0 && this.bU == 1 && (by & 0xFF) >= 151 && (by & 0xFF) <= 157) {
                    int n2 = (by & 0xFF) - 151;
                    if (byArray[n2] > 0) {
                        int n3 = n2;
                        byArray[n3] = (byte)(byArray[n3] - 1);
                    } else {
                        this.cu[i][j] = -98;
                    }
                }
                if (by2 == -54) {
                    this.cU = true;
                    ++this.cC;
                    continue;
                }
                if (by2 == -53) {
                    this.cU = false;
                    ++this.cC;
                    continue;
                }
                if (by2 == -33) {
                    ++n;
                    continue;
                }
                if (by2 == -48) {
                    this.cK = (short)j;
                    this.cL = (short)i;
                    continue;
                }
                if (by2 == -47) {
                    this.cM = (short)j;
                    this.cN = (short)i;
                    continue;
                }
                if (by2 == -46) {
                    this.cO = (short)j;
                    this.cP = (short)i;
                    continue;
                }
                if (by2 == -45) {
                    this.cQ = (short)j;
                    this.cR = (short)i;
                    continue;
                }
                if (by2 != -41) continue;
                this.cS = (short)j;
                this.cT = (short)i;
            }
        }
        this.do = 0;
        this.dh = new byte[n];
        this.di = new byte[n];
        this.dj = new byte[n];
        this.dk = new byte[n];
        this.dr = 0;
    }

    private final void b(int n, int n2, boolean bl) {
        this.dy = n;
        this.dz = n2;
        this.dG = bl;
        this.dA = (n + this.h - 1) / this.h;
        this.dB = (n2 + this.i - 1) / this.i;
        int n3 = !this.dG ? 3 : 1;
        this.dE = this.dA + n3;
        this.dF = this.dB + n3;
        this.dC = this.dE * this.h;
        this.dD = this.dF * this.i;
    }

    private final void af() {
        this.dK = null;
        this.dJ = null;
        this.dJ = Image.createImage((int)this.dC, (int)this.dD);
        this.dK = this.dJ.getGraphics();
        this.dI = null;
        this.dH = this.dI;
        this.dH = new byte[this.dF][this.dE];
        this.dI = new byte[this.dF][this.dE];
        for (int i = 0; i < this.dF; ++i) {
            for (int j = 0; j < this.dE; ++j) {
                this.dH[i][j] = -1;
                this.dI[i][j] = 0;
            }
        }
    }

    private final void ag() {
        this.dK.setColor(0);
        this.dK.setClip(0, 0, this.dC, this.dD);
        this.dK.fillRect(0, 0, this.dC, this.dD);
        for (int i = 0; i < this.dF; ++i) {
            for (int j = 0; j < this.dE; ++j) {
                this.dH[i][j] = -1;
                this.dI[i][j] = 0;
            }
        }
    }

    private final void f(int n, int n2) {
        int n3 = !this.dG ? 1 : 0;
        int n4 = n / this.h - n3;
        int n5 = n2 / this.i - n3;
        int n6 = n4 + this.dA + n3;
        int n7 = n5 + this.dB + n3;
        if (n4 < 0) {
            n4 = 0;
        }
        if (n6 >= this.dw) {
            n6 = this.dw - 1;
        }
        if (n5 < 0) {
            n5 = 0;
        }
        if (n7 >= this.dx) {
            n7 = this.dx - 1;
        }
        int n8 = n4 % this.dE;
        int n9 = n5 % this.dF;
        for (int i = n5; i <= n7; ++i) {
            int n10 = n8;
            for (int j = n4; j <= n6; ++j) {
                this.c(j, i, n10, n9);
                if (++n10 < this.dE) continue;
                n10 = 0;
            }
            if (++n9 < this.dF) continue;
            n9 = 0;
        }
    }

    private final void g(int n, int n2) {
        int n3;
        int n4 = !this.dG ? 1 : 0;
        int n5 = n / this.h - n4;
        int n6 = n2 / this.i - n4;
        int n7 = n5 + this.dA + n4;
        int n8 = n6 + this.dB + n4;
        int n9 = n5 >= 0 ? n5 : 0;
        int n10 = n7 < this.dw ? n7 : this.dw - 1;
        int n11 = n6 % this.dF;
        int n12 = n8 % this.dF;
        int n13 = n9 % this.dE;
        for (n3 = n9; n3 <= n10; ++n3) {
            if (n6 >= 0) {
                this.c(n3, n6, n13, n11);
            }
            if (n8 < this.dx) {
                this.c(n3, n8, n13, n12);
            }
            if (++n13 < this.dE) continue;
            n13 = 0;
        }
        n9 = n6 >= 0 ? n6 : 0;
        n10 = n8 < this.dx ? n8 : this.dx - 1;
        n11 = n5 % this.dE;
        n12 = n7 % this.dE;
        int n14 = n9 % this.dF;
        for (n3 = n9; n3 <= n10; ++n3) {
            if (n5 >= 0) {
                this.c(n5, n3, n11, n14);
            }
            if (n7 < this.dw) {
                this.c(n7, n3, n12, n14);
            }
            if (++n14 < this.dF) continue;
            n14 = 0;
        }
    }

    private final void c(int n, int n2, int n3, int n4) {
        byte by = this.cu[n2][n];
        byte by2 = this.cv[n2][n];
        if (this.dH[n4][n3] == by && this.dI[n4][n3] == by2) {
            return;
        }
        this.dH[n4][n3] = by;
        this.dI[n4][n3] = by2;
        this.a(by, by2, n3 * this.h, n4 * this.i);
    }

    private final void d(Graphics graphics, int n, int n2) {
        if (this.dJ != null) {
            boolean bl = false;
            boolean bl2 = false;
            int n3 = n % this.dC;
            int n4 = n2 % this.dD;
            if (n3 + this.dy > this.dC) {
                bl = true;
            }
            if (n4 + this.dz > this.dD) {
                bl2 = true;
            }
            graphics.drawImage(this.dJ, -n3, -n4, 20);
            if (bl) {
                graphics.drawImage(this.dJ, this.dC - n3, -n4, 20);
            }
            if (bl2) {
                graphics.drawImage(this.dJ, -n3, this.dD - n4, 20);
            }
            if (bl && bl2) {
                graphics.drawImage(this.dJ, this.dC - n3, this.dD - n4, 20);
            }
        }
    }

    private final void d(boolean bl) {
        this.dX = bl;
    }

    private final void ah() {
        this.j();
        this.c(true);
        this.cs[9] = this.a(this.cs[9], "/b9.png");
        this.ct = this.a(this.ct, "/ta.png");
        this.dL = this.a(this.dL, "/title.png");
        this.bi = false;
        this.bj = false;
        this.aW = 0;
        this.aN = 0;
        this.bm = true;
        this.av = 0;
        this.ay = 1;
        this.aC = 0;
        this.aw = 1;
        this.ax = 0;
        this.aF = 0;
        this.aG = 0;
        this.aI = (this.w - this.dL.getHeight() - this.i - 72 >> 1) + this.dL.getHeight() + this.i + (this.i >> 1);
        this.ap = -120;
        this.aq = this.w;
        this.ar = this.ap << this.r;
        this.as = this.aq << this.r;
        this.n();
        this.b(true, -1);
        this.x = 4;
        this.b("/title.mid");
        this.dN = 0;
        this.dO = true;
        this.d(false);
        this.U = false;
    }

    private final boolean ai() {
        if (this.ce == 0 && this.U) {
            this.T = false;
            this.S = false;
            this.R = false;
            this.c((byte)0, (byte)-1);
            return true;
        }
        ++this.dN;
        if (this.dN >= 20) {
            this.dN = 0;
            this.dO = !this.dO;
        }
        this.ar += this.aF;
        this.ap = this.ar >> this.r;
        this.as += this.aG;
        this.aq = this.as >> this.r;
        if (this.aq <= this.aI) {
            this.aG = 0;
        }
        switch (this.ax) {
            case 0: {
                ++this.aC;
                if (this.aC < 64) break;
                this.aF = 3 << this.r + 1;
                this.aG = -(1 << this.r);
                ++this.ax;
                break;
            }
            case 1: {
                if (this.ap <= this.u - this.h >> 1) break;
                ++this.ax;
                break;
            }
            case 2: {
                if (this.aF > 0) {
                    this.aF -= 4;
                    break;
                }
                ++this.ax;
                break;
            }
            case 3: {
                if (this.aF > -(2 << this.r)) {
                    this.aF -= 4;
                }
                if (this.ap > (this.u - this.h >> 1) + this.j) break;
                ++this.ax;
                break;
            }
            case 4: {
                if (this.aF < 0) {
                    this.aF += 4;
                    break;
                }
                this.aF = 0;
                ++this.ax;
            }
        }
        this.O();
        this.o();
        return true;
    }

    private final int e(int n) {
        switch (this.dQ) {
            case 0: {
                return 0;
            }
            case 1: {
                return this.dS[this.dP] * n >> 8;
            }
        }
        return this.dS[18 - this.dP] * n >> 8;
    }

    private final void a(boolean bl, int n) {
        this.dQ = (byte)(bl ? 1 : 2);
        this.dR = (byte)n;
        this.dP = 18;
    }

    private final void c(byte by, byte by2) {
        int n;
        int n2;
        int n3 = 0;
        int n4 = -1;
        this.ea = by;
        this.ef = by2;
        if (!this.dW) {
            if (!this.dU) {
                this.l();
            }
            this.d(false);
            this.dW = true;
        }
        this.dY = new String[20];
        this.dZ = new short[20];
        this.ee = 0;
        this.eb = 0;
        switch (by) {
            case 0: {
                for (n2 = 0; n2 < 4; ++n2) {
                    if (this.A[n2] <= 0) continue;
                    this.dY[n3] = this.a[1];
                    this.dZ[n3++] = 1;
                    break;
                }
                this.dY[n3] = this.a[0];
                this.dZ[n3++] = 0;
                this.dY[n3] = this.a[22];
                this.dZ[n3++] = 20;
                this.dY[n3] = this.a[23];
                this.dZ[n3++] = 14;
                if (this.M[0].length() > 0) {
                    this.dY[n3] = this.a[24];
                    this.dZ[n3++] = 15;
                }
                this.dY[n3] = this.a[18];
                this.dZ[n3++] = 10;
                this.dY[n3] = this.a[4] + this.a[this.c == 1 ? 2 : 3];
                this.dZ[n3++] = 11;
                this.dY[n3] = this.a[5] + this.bt;
                this.dZ[n3++] = 13;
                if (this.D[3] > 0) {
                    this.dY[n3] = this.a[6];
                    this.dZ[n3++] = 16;
                }
                this.dY[n3] = this.a[17];
                this.dZ[n3++] = 12;
                this.dY[n3] = this.a[19];
                this.dZ[n3++] = 3;
                this.dY[n3] = this.a[21];
                this.dZ[n3++] = 4;
                break;
            }
            case 1: {
                if (this.bV != 0) {
                    if (this.C) {
                        this.dY[n3] = "CHEAT!";
                        this.dZ[n3++] = 99;
                    }
                    if (this.D[5] > 0) {
                        this.dY[n3] = this.a[87] + this.a[this.F ? 2 : 3];
                        this.dZ[n3++] = 30;
                    }
                    if (this.D[6] > 0) {
                        this.dY[n3] = this.a[88] + this.a[this.E ? 2 : 3];
                        this.dZ[n3++] = 31;
                    }
                    if (!this.dg) {
                        this.dY[n3] = this.a[27];
                        this.dZ[n3++] = 6;
                    }
                    this.dY[n3] = this.a[18];
                    this.dZ[n3++] = 10;
                }
                this.dY[n3] = this.a[4] + this.a[this.c == 1 ? 2 : 3];
                this.dZ[n3++] = 11;
                if (this.bV != 0 && this.D[4] > 0) {
                    this.dY[n3] = this.a[89] + (this.H != -1 ? Integer.toString(this.H + 1) : this.a[90]);
                    this.dZ[n3++] = 32;
                    n4 = this.a[89].length() + this.a[90].length();
                }
                this.dY[n3] = this.a[20];
                this.dZ[n3++] = 8;
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
                    this.dY[n3] = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(n6, n5);
                    n6 = n5 + 1;
                    this.dZ[n3++] = (short)n6;
                    n5 = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(59, n6);
                    if (this.y.compareTo("DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(n6, n5)) == 0) {
                        this.eb = (byte)n2;
                    }
                    n6 = n5 + 1;
                }
                break;
            }
            case 3: {
                int n5 = 0;
                for (n2 = 1; n2 <= 4; ++n2) {
                    if (by2 == 0 || by2 == 1 && this.A[n5] > 0) {
                        this.dY[n3] = this.cz[n5];
                        this.dZ[n3++] = (short)n2;
                    }
                    ++n5;
                }
                break;
            }
            case 4: {
                if (this.D[0] > 0) {
                    this.dY[n3] = this.a[25];
                    this.dZ[n3++] = 1;
                }
                if (this.D[1] <= 0) break;
                this.dY[n3] = this.a[26];
                this.dZ[n3++] = 2;
                break;
            }
            case 5: {
                this.dY[n3] = this.a[7];
                this.dZ[n3++] = 0;
                this.dY[n3] = this.a[8];
                this.dZ[n3++] = 1;
                this.dY[n3] = this.a[9];
                this.dZ[n3++] = 2;
                this.dY[n3] = this.a[12];
                this.dZ[n3++] = 3;
                this.dY[n3] = this.a[13];
                this.dZ[n3++] = 4;
                this.dY[n3] = this.a[14];
                this.dZ[n3++] = 5;
                this.dY[n3] = this.a[15];
                this.dZ[n3++] = 6;
                this.dY[n3] = this.a[16];
                this.dZ[n3++] = 7;
                this.dY[n3] = this.a[10];
                this.dZ[n3++] = 8;
                this.dY[n3] = this.a[11];
                this.dZ[n3++] = 9;
            }
        }
        this.ec = (byte)n3;
        this.ej = this.w - Math.min(this.ed, n3) * 31 >> 1;
        if (this.eb >= n3) {
            this.eb = (byte)(n3 - 1);
        }
        if (this.ee > this.eb) {
            this.ee = this.eb;
        }
        if (this.eb >= this.ee + this.ed) {
            this.ee = (byte)(this.eb - this.ed + 1);
        }
        this.ek = n4 == -1 ? 0 : n4;
        for (n2 = 0; n2 < n3; ++n2) {
            n = this.dY[n2].length();
            if (n <= this.ek) continue;
            this.ek = n;
        }
        this.ek = (this.ek + 1) * 12 + 10;
        if (this.ea == 2) {
            this.el = (this.u - this.ek >> 1) - 27;
            this.ek += 78;
        } else if (this.ea == 3) {
            this.el = (this.u - this.ek >> 1) - 31;
            this.em = this.u - this.el - 31;
            this.ek += 86;
        }
        this.ek = Math.max((this.u << 1) / 3, this.ek);
        this.a(true, -1);
    }

    private final boolean aj() {
        boolean bl = false;
        if (this.dQ == 0) {
            if (this.N) {
                this.N = false;
                this.eb = this.eb > 0 ? (byte)(this.eb - 1) : (byte)(this.ec - 1);
                if (this.eb < this.ee) {
                    this.ee = this.eb;
                } else if (this.eb >= this.ee + this.ed) {
                    this.ee = (byte)(this.eb - this.ed + 1);
                }
                bl = true;
            } else if (this.O) {
                this.O = false;
                this.Q = false;
                this.eb = this.eb < this.ec - 1 ? (byte)(this.eb + 1) : (byte)0;
                if (this.eb < this.ee) {
                    this.ee = this.eb;
                } else if (this.eb >= this.ee + this.ed) {
                    this.ee = (byte)(this.eb - this.ed + 1);
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
                short s = this.dZ[this.eb];
                if (this.ea == 5 || this.ea != 2 && (s == 11 || s == 13 || s == 30 || s == 31 || s == 32 || s == 101)) {
                    bl = this.ak();
                } else {
                    if (this.ea == 0 && s != 0 && s != 1 && s != 16 && s != 12 || this.ea == 1 && s != 99 && s != 100 || this.ea == 3) {
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
            --this.dP;
            if (this.dP < 0) {
                this.dP = 0;
                if (this.ce <= 0) {
                    if (this.dQ == 2) {
                        this.dQ = 0;
                        switch (this.dR) {
                            case 0: {
                                this.ak();
                                break;
                            }
                            case 1: {
                                this.al();
                            }
                        }
                    } else {
                        this.dQ = 0;
                    }
                }
            }
            bl = true;
        }
        return bl;
    }

    private final boolean e(boolean bl) {
        boolean bl2 = false;
        if (this.ea == 0 && this.dZ[this.eb] == 13) {
            if (bl && this.bt > 1) {
                bl2 = true;
                this.bt = (byte)(this.bt - 1);
            } else if (!bl && this.bt < 5) {
                bl2 = true;
                this.bt = (byte)(this.bt + 1);
            }
            if (bl2) {
                if (this.c == 1) {
                    this.a();
                    this.b("/title.mid");
                }
                this.h();
                this.dY[this.eb] = this.a[5] + this.bt;
            }
        }
        return bl2;
    }

    private final boolean ak() {
        boolean bl = false;
        boolean bl2 = false;
        int n = this.dZ[this.eb];
        switch (this.ea) {
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
                        this.dW = false;
                        bl = true;
                        break;
                    }
                    case 4: {
                        this.d((byte)1);
                        return true;
                    }
                    case 6: {
                        this.j();
                        this.ab();
                        this.x = 1;
                        this.d(true);
                        bl2 = true;
                        break;
                    }
                    case 8: {
                        if (this.bV != 0 || this.bU == 4) {
                            this.d((byte)0);
                        } else {
                            this.am();
                            if (this.bU == 1 || this.bU == 5) {
                                this.ah();
                            } else if (this.bU == 2 || this.bU == 3) {
                                this.A();
                            }
                        }
                        return true;
                    }
                    case 10: {
                        this.ar();
                        this.dW = false;
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
                            this.b(this.I());
                        }
                        this.h();
                        this.dY[this.eb] = this.a[4] + this.a[this.c == 1 ? 2 : 3];
                        bl = true;
                        break;
                    }
                    case 12: {
                        this.c((byte)2, (byte)-1);
                        bl = true;
                        break;
                    }
                    case 13: {
                        this.bt = (byte)(this.bt + 1);
                        if (this.bt > 5) {
                            this.bt = 1;
                        }
                        if (this.c == 1) {
                            this.a();
                            this.b("/title.mid");
                        }
                        this.h();
                        this.dY[this.eb] = this.a[5] + this.bt;
                        bl = true;
                        break;
                    }
                    case 14: {
                        this.A();
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
                        this.dW = false;
                        bl = true;
                        break;
                    }
                    case 16: {
                        this.c((byte)5, (byte)0);
                        bl = true;
                        break;
                    }
                    case 20: {
                        this.j();
                        this.y();
                        if (this.c == 1) {
                            this.a();
                        }
                        this.bV = 0;
                        this.bU = 1;
                        this.aa();
                        this.x = 1;
                        bl2 = true;
                        break;
                    }
                    case 30: {
                        this.F = !this.F;
                        this.h();
                        this.dY[this.eb] = this.a[87] + this.a[this.F ? 2 : 3];
                        bl = true;
                        break;
                    }
                    case 31: {
                        this.E = !this.E;
                        this.h();
                        this.dY[this.eb] = this.a[88] + this.a[this.E ? 2 : 3];
                        bl = true;
                        break;
                    }
                    case 32: {
                        this.H = (byte)(this.H + 1);
                        if (this.H > this.D[4]) {
                            this.H = (byte)-1;
                        }
                        this.b(this.I());
                        this.h();
                        this.dY[this.eb] = this.a[89] + (this.H != -1 ? Integer.toString(this.H + 1) : this.a[90]);
                        bl = true;
                        break;
                    }
                    case 99: {
                        this.am();
                        this.cC = 0;
                        this.d(false);
                        this.l();
                        if (this.dV) {
                            this.dV = false;
                            this.W();
                        }
                        this.ax = this.aw;
                        this.aw = 6;
                        this.av = 0;
                        this.be = true;
                        this.ap();
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
                    this.h();
                    this.ad();
                }
                if (this.x != 11) {
                    this.c((byte)0, (byte)-1);
                } else {
                    this.am();
                    this.d((byte)2);
                }
                bl = true;
                break;
            }
            case 3: {
                this.j();
                this.y();
                if (this.c == 1) {
                    this.a();
                }
                if (this.G) {
                    this.bV = n;
                    if (this.ef == 0) {
                        this.bU = 1;
                    } else {
                        this.bU = this.A[n - 1];
                        if (this.bU == 11 && this.i(this.bV, 11)) {
                            this.bU = 3;
                        } else if (this.bU == 12 && this.i(this.bV, 12)) {
                            this.bU = 6;
                        }
                    }
                } else {
                    this.bW = n;
                    this.bV = 0;
                    this.bU = 5;
                }
                this.aa();
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
                this.a(string, (int)this.bt, false);
            }
        }
        if (bl2) {
            this.am();
            bl = true;
        }
        return bl;
    }

    private final boolean al() {
        boolean bl = false;
        boolean bl2 = false;
        switch (this.ea) {
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
            this.am();
            bl = true;
        }
        return bl;
    }

    private final void am() {
        this.dW = false;
        if (this.x != 4 && this.x != 11) {
            this.d(true);
        }
        this.dY = null;
        this.dZ = null;
        if (!this.dU) {
            this.m();
        }
    }

    private final void a(Graphics graphics, boolean bl) {
        int n = 0;
        int n2 = this.ee;
        int n3 = this.ej;
        n3 -= this.e(this.v);
        int n4 = 31 - this.e(31);
        if (this.ee > 0) {
            this.b(graphics, this.cl, 0, 0, 17, 9, this.u - 17 >> 1, n3 - 9 - 2);
        }
        while (n < this.ed && n2 < this.ec) {
            int n5;
            if (bl) {
                this.a(graphics, this.u - this.ek >> 1, n3, this.ek, 26, n2 == this.eb ? 41658 : 22935, 10370);
            }
            this.a(this.dY[n2], graphics, this.u - (this.dY[n2].length() - 1) * 12 - 10 >> 1, n3 + 3 + 2, false);
            if (this.ea == 2) {
                n5 = -1;
                String string = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(this.dZ[n2], "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(59, (int)this.dZ[n2]));
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
                    this.b(graphics, this.cn, 72 + n5 * 27, 0, 27, 18, this.el, n3 + 3 + 2 + -1);
                }
            } else if (this.ea == 3) {
                n5 = this.dZ[n2];
                boolean bl2 = this.B[n5 - 1];
                if (bl2) {
                    this.b(graphics, this.cn, 18, 0, 31, 18, this.el, n3 + 3 + 2 + -1);
                } else {
                    this.b(graphics, this.cn, 0, 0, 18, 18, this.el + 6, n3 + 3 + 2 + -1);
                }
                int n6 = -1;
                int n7 = -1;
                int n8 = -1;
                byte by = this.cA[n5 - 1];
                switch (by) {
                    case 1: {
                        n6 = 9;
                        n7 = 11;
                        n8 = 9;
                        break;
                    }
                    case 2: {
                        n6 = 9;
                        n7 = 23;
                        n8 = 9;
                        break;
                    }
                    case 3: {
                        n6 = 0;
                        n7 = 23;
                        n8 = 18;
                    }
                }
                if (n6 != -1) {
                    this.b(graphics, this.cn, 49, n6, n7, n7, this.em + (31 - n7 >> 1), n3 + 3 + 2 + (16 - n8 >> 1));
                }
            }
            n3 += n4;
            ++n2;
            ++n;
        }
        if (this.ee + this.ed < this.ec) {
            this.b(graphics, this.cl, 0, 9, 17, 9, this.u - 17 >> 1, n3 + 2);
        }
        this.a(graphics, this.a[30], this.x != 11 ? this.a[29] : null, bl);
    }

    private final void d(Graphics graphics) {
        int n = 0;
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        int n5 = this.en.length();
        int n6 = 0;
        int n7 = 0;
        if (graphics != null) {
            n = this.u - this.eo >> 1;
            n2 = this.w - this.ep >> 1;
            this.a(graphics, n, n2, this.eo, this.ep, 22935, 10370);
            n2 += 6;
        }
        while (n3 < n5) {
            char c = this.en.charAt(n3);
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
                        this.a(graphics, n, n2, this.en.charAt(i));
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
            this.eo = n6 * 12 + 16;
            this.ep = n7 * this.g + 10;
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
            graphics.drawImage(this.ck, n - n3 % n5 / n6 * 12, n2, 20);
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
            graphics.drawImage(this.cj, n - n6 * 10, n2 - n5 * 16, 20);
            if (n4 != -1) {
                graphics.setClip(n, n2 + (n4 != 5 ? -3 : 16), 10, 3);
                n5 = n4 / 2;
                n6 = n4 % 2;
                graphics.drawImage(this.cj, n - (160 + n6 * 10), n2 + (n4 != 5 ? -3 : 16) - (32 + n5 * 3), 20);
            }
        }
    }

    private final void a(String string, int n, byte by) {
        this.ey = this.dW;
        this.eA = string;
        this.et = 0;
        this.er = n;
        this.es = 0;
        this.ev = this.u;
        this.ez = by;
        this.a(null, 0, 0, true, true, true, true);
        this.eq = this.x;
        this.x = 5;
        this.a(true, -1);
    }

    private final boolean an() {
        boolean bl = false;
        if (this.dQ == 0) {
            if (this.N) {
                this.N = false;
                if (this.et > 0) {
                    this.et -= 2;
                    if (this.et < 0) {
                        this.et = 0;
                    }
                    bl = true;
                }
            } else if (this.O) {
                this.O = false;
                if (this.et < this.eu) {
                    this.et += 2;
                    if (this.et > this.eu) {
                        this.et = this.eu;
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
            --this.dP;
            if (this.dP < 0) {
                this.dP = 0;
                if (this.dQ == 2) {
                    this.dQ = 0;
                    switch (this.dR) {
                        case 0: {
                            this.ao();
                        }
                    }
                } else {
                    this.dQ = 0;
                }
            }
            bl = true;
        }
        return bl;
    }

    private final void ao() {
        if (this.ez == -1) {
            this.x = this.eq;
            this.dW = this.ey;
            this.b(true, -1);
            this.a(true, -1);
        } else if (this.ez == 0) {
            this.ah();
        }
    }

    private final void a(Graphics graphics, int n, int n2, boolean bl, boolean bl2, boolean bl3, boolean bl4) {
        int n3 = 0;
        int n4 = 0;
        int n5 = this.w - this.er - this.es;
        if (graphics != null && bl) {
            if (bl2) {
                graphics.setClip(0, 0, this.u, this.v);
                graphics.setColor(0);
                graphics.fillRect(0, 0, this.u, this.v);
            }
            int n6 = this.ev - this.e(this.ev);
            int n7 = n5 - this.e(n5);
            this.a(graphics, this.u - n6 >> 1, this.er + (n5 - n7 >> 1), n6, n7, n, n2);
        }
        int n8 = (this.ev - 7) / 12;
        this.ex = (n5 - 19) / this.g;
        int n9 = this.et + this.ex;
        int n10 = this.eA.length();
        int n11 = 0;
        this.ew = 0;
        int n12 = 0;
        int n13 = -1;
        n4 = this.e(this.u);
        if (graphics != null) {
            n3 = 5 + this.er + (n5 - (bl ? 19 : 7) - this.ex * this.g >> 1);
            if (this.eu < 0 && bl4) {
                n3 -= this.eu * this.g >> 1;
            }
        }
        while (n12 < n10) {
            char c = this.eA.charAt(n12);
            ++n11;
            if (c == ' ' || c == '.' || c == ',' || c == '-' || c == ':' || c == ':' || c == '#') {
                n13 = n12;
            }
            if (n11 >= n8 || c == '#' || n12 >= n10 - 1) {
                if (n13 == -1 || n12 >= n10 - 1) {
                    n13 = n12;
                }
                if (graphics != null && this.ew >= this.et) {
                    if (this.dQ == 0 || !bl) {
                        c = this.eA.charAt(n13);
                        int n14 = c != ' ' && c != '#' ? this.u - (n13 - (n12 - n11 + 1) + 1) * 12 >> 1 : this.u - (n13 - (n12 - n11 + 1)) * 12 >> 1;
                        for (int i = n12 - n11 + 1; i <= n13; ++i) {
                            this.a(graphics, n14 - n4, n3, this.eA.charAt(i));
                            n14 += 12;
                        }
                    }
                    n3 += this.g;
                }
                n11 = n12 - n13;
                if (n13 + 1 < n10 && this.eA.charAt(n13 + 1) == ' ') {
                    ++n12;
                }
                n13 = -1;
                ++this.ew;
                if (graphics != null && this.ew >= n9) break;
            }
            ++n12;
        }
        if (graphics != null) {
            if (bl3 && this.dQ == 0) {
                if (this.et > 0) {
                    this.b(graphics, this.cl, 0, 0, 17, 9, (this.u >> 1) - 17 + 1, this.er + n5 - 9 - 4);
                }
                if (this.et < this.eu) {
                    this.b(graphics, this.cl, 0, 9, 17, 9, (this.u >> 1) - 1, this.er + n5 - 9 - 4);
                }
            }
        } else {
            if (n11 > 0) {
                ++this.ew;
            }
            this.eu = this.ew - this.ex;
        }
    }

    private final void b(boolean bl, int n) {
        this.cc = 0;
        this.ce = (byte)(bl ? 1 : 2);
        this.cd = n;
    }

    private final void ap() {
        this.I = (short)(this.I + this.bX);
        this.eg = 0;
        this.d(false);
        if (this.c == 1) {
            this.a("/cleared.mid", (int)this.bt, false);
        }
        this.b(false, -1);
        if (this.bU != 11 && this.bU != 12) {
            int n = 2 + this.a[48].length();
            int n2 = (int)this.bZ / 1000;
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
            stringBuffer.append(this.bX);
            stringBuffer.append(this.a[48]);
            stringBuffer.append(this.bY);
            this.a(stringBuffer, "", n - (stringBuffer.length() - n5), ' ', false);
            stringBuffer.append("#");
            stringBuffer.append(this.a[47]);
            this.a(stringBuffer, String.valueOf(this.I), n, ' ', false);
            this.en = stringBuffer.toString();
            this.d(null);
        } else {
            this.en = null;
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

    private final boolean aq() {
        if (this.ce <= 0) {
            if (this.en != null && (this.S || this.R)) {
                this.R = false;
                this.T = false;
                this.S = false;
                this.f(true);
                return true;
            }
            if (this.en == null) {
                this.f(true);
                return true;
            }
            return false;
        }
        return true;
    }

    private final void f(boolean bl) {
        this.bW = this.bV;
        int n = this.bU + 1;
        int n2 = this.bV;
        boolean bl2 = true;
        boolean bl3 = false;
        switch (this.bU) {
            case 3: {
                if (this.i(this.bV, 11)) break;
                n = 11;
                break;
            }
            case 6: {
                if (this.i(this.bV, 12)) break;
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
                this.B[this.bV - 1] = true;
                bl3 = true;
                if (!this.i(this.bV, 10)) {
                    n2 = 0;
                    n = 4;
                    break;
                }
                bl2 = false;
                break;
            }
        }
        this.A[this.bV - 1] = (byte)(!bl3 ? n : 0);
        this.h();
        if (bl2) {
            this.bV = n2;
            this.bU = n;
            if (bl) {
                this.j();
            }
            this.ab();
            this.x = 1;
            this.d(true);
        } else {
            this.ah();
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

    private final void ar() {
        this.a(this.a[this.eC[this.eB]], this.i + 12, (byte)-1);
        this.x = 8;
    }

    private final boolean as() {
        boolean bl = false;
        if (this.Q) {
            this.Q = false;
            this.eB = (byte)(this.eB + 1);
            if (this.eB >= this.eC.length) {
                this.eB = 0;
            }
            this.et = 0;
            this.eA = this.a[this.eC[this.eB]];
            this.ev = this.u;
            this.a(null, 0, 0, true, true, true, true);
            bl = true;
        } else if (this.P) {
            this.P = false;
            this.eB = (byte)(this.eB - 1);
            if (this.eB < 0) {
                this.eB = (byte)(this.eC.length - 1);
            }
            this.et = 0;
            this.eA = this.a[this.eC[this.eB]];
            this.ev = this.u;
            this.a(null, 0, 0, true, true, true, true);
            bl = true;
        }
        return bl |= this.an();
    }

    private final void e(Graphics graphics) {
        this.a(graphics, 22935, 10370, true, true, true, true);
        int n = this.i + 10;
        int n2 = this.u - this.e(this.u);
        int n3 = n - this.e(n);
        this.a(graphics, this.u - n2 >> 1, n - n3 >> 1, n2, n3, 22935, 10370);
        if (this.dQ == 0) {
            if (this.eD[this.eB].length == 0) {
                String string = this.eB == 0 ? this.a[49] : this.a[50];
                this.a(string, graphics, this.u >> 1, 6 + (this.i - this.g >> 1), true);
            } else {
                int n4 = this.eD[this.eB].length;
                int n5 = this.u - n4 * (this.h + this.l) + this.l >> 1;
                int n6 = n - this.i >> 1;
                for (int i = 0; i < n4; ++i) {
                    byte by = this.eD[this.eB][i];
                    this.a(graphics, true, by, n5, n6);
                    n5 += this.h + (by != -24 && by != -40 && by != -39 ? this.l : 0);
                }
            }
            this.b(graphics, this.cl, 17, 0, 9, 17, 5, n - 17 >> 1);
            this.b(graphics, this.cl, 26, 0, 9, 17, this.u - 9 - 5, n - 17 >> 1);
        }
        this.a(graphics, null, this.a[29], true);
    }

    private final void a(Graphics graphics, String string, String string2, boolean bl) {
        int n = !this.dT ? this.e(22) : 0;
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
        this.eE = by;
        this.et = 0;
        this.er = 0;
        this.es = 0;
        this.ev = this.u;
        this.dW = false;
        switch (this.eE) {
            case 0: {
                this.eA = this.a[55];
                break;
            }
            case 1: {
                this.eA = this.a[56];
                break;
            }
            case 2: {
                this.eA = this.a[57];
            }
        }
        this.x = 9;
        this.a(null, 0, 0, true, true, true, true);
        this.a(true, -1);
    }

    private final boolean at() {
        if (this.dQ == 0) {
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
                if (this.et > 0) {
                    this.et -= 2;
                    if (this.et < 0) {
                        this.et = 0;
                    }
                    return true;
                }
            } else if (this.O) {
                this.O = false;
                if (this.et < this.eu) {
                    this.et += 2;
                    if (this.et > this.eu) {
                        this.et = this.eu;
                    }
                    return true;
                }
            }
            return false;
        }
        --this.dP;
        if (this.dP < 0) {
            this.dP = 0;
            if (this.dQ == 2) {
                this.dQ = 0;
                switch (this.dR) {
                    case 0: {
                        this.g(true);
                        break;
                    }
                    case 1: {
                        this.g(false);
                    }
                }
            } else {
                this.dQ = 0;
            }
        }
        return true;
    }

    private final void g(boolean bl) {
        switch (this.eE) {
            case 0: {
                if (bl) {
                    this.ah();
                    break;
                }
                this.x = 1;
                this.dW = true;
                this.b(true, -1);
                this.a(true, -1);
                break;
            }
            case 1: {
                if (bl) {
                    this.x = 3;
                    this.dW = false;
                    break;
                }
                this.x = 4;
                this.dW = true;
                this.b(true, -1);
                this.a(true, -1);
                break;
            }
            case 2: {
                this.c = (byte)(bl ? 1 : 0);
                this.ah();
            }
        }
    }
}

