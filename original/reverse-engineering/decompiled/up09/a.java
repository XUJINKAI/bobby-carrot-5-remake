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
 *  javax.microedition.util.ContextHolder
 */
import com.nokia.mid.ui.FullCanvas;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.FilterInputStream;
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
import javax.microedition.util.ContextHolder;

/*
 * Illegal identifiers - consider using --renameillegalidents true
 */
public final class a
extends FullCanvas
implements Runnable {
    private static final byte[] bs = new byte[]{94, 95, -112, -111};
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
    public String[] a = null;
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
    public String b = null;
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
    private byte bt = (byte)3;
    private final byte[] bu = new byte[]{5, 10, 30, 20, 10, 25, 10};
    private byte bv;
    private int bw;
    private int bx;
    private int by;
    private int bz;
    public byte c;
    private byte[] cA;
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
    public boolean d = false;
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
    private final short[] dS;
    private boolean dT = false;
    private boolean dU = false;
    private boolean dV = false;
    private boolean dW = false;
    private boolean dX = false;
    private String[] dY;
    private short[] dZ;
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
    private byte[] dl;
    private byte[] dm;
    private byte[] dn;
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
    public boolean e = false;
    private String eA;
    private byte eB;
    private short[] eC;
    private byte[][] eD;
    private byte eE;
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
    public boolean f;
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
    private Player s = null;
    private Bobby t;
    private int u;
    private int v;
    private int w;
    private int x;
    private String y = "EN";
    private Random z;

    public a(Bobby bobby) {
        this.cA = new byte[4];
        this.dl = new byte[5];
        this.dm = new byte[5];
        this.dn = new byte[5];
        this.dS = new short[]{0, 0, 1, 3, 5, 8, 12, 17, 23, 31, 41, 53, 70, 91, 118, 153, 198, 256, 256};
        this.eB = (byte)0;
        this.eC = new short[]{59, 58, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80};
        byte[] byArray = new byte[]{};
        byte[] byArray2 = new byte[]{-54, -52};
        byte[] byArray3 = new byte[]{-36, -96, -35};
        byte[] byArray4 = new byte[]{-72, -74, -94};
        byte[] byArray5 = new byte[]{-19};
        byte[] byArray6 = new byte[]{-12, -11};
        byte[] byArray7 = new byte[]{-79, -78, -76, -77};
        byte[] byArray8 = new byte[]{-48, -45, -87, -86};
        byte[] byArray9 = new byte[]{-10};
        this.eD = new byte[][]{new byte[0], byArray, byArray2, {-57, -56}, {-106}, byArray3, byArray4, byArray5, {-61, -58, -65, -62}, {-80, -81}, {-71, -69, -66, -67, -92}, {89, 87, -90}, {-20}, {-13}, byArray6, {-29, -24, -40, -39}, byArray7, {-44, -43, -42}, {-32, -30, -14, -15}, byArray8, {-49, -33}, {-97, 124}, byArray9};
        this.t = bobby;
        this.a(new StringBuffer().append(this.y).append(".dat").toString());
        this.z = new Random(System.currentTimeMillis());
        this.c = (byte)1;
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

    /*
     * Unable to fully structure code
     */
    private final boolean B() {
        block25: {
            block26: {
                block16: {
                    block24: {
                        block17: {
                            block21: {
                                block23: {
                                    block22: {
                                        block18: {
                                            block20: {
                                                block19: {
                                                    if (this.dQ != 0) break block16;
                                                    if (this.ec <= 0) break block17;
                                                    if (!this.N) break block18;
                                                    this.N = false;
                                                    if (this.eb <= 0) break block19;
                                                    this.eb = (byte)(this.eb - 1);
lbl7:
                                                    // 2 sources

                                                    while (this.eb < this.ee) {
                                                        this.ee = this.eb;
lbl9:
                                                        // 15 sources

                                                        while (true) {
                                                            if (this.T) {
                                                                this.T = false;
                                                                this.b(false, -1);
                                                                this.a(false, 1);
                                                            }
lbl14:
                                                            // 7 sources

                                                            while (true) {
                                                                this.aj += 24;
                                                                if (this.aj >> 4 >= 384) {
                                                                    this.aj -= 6144;
                                                                }
                                                                this.ak += 64;
                                                                if (this.ak >> 4 >= 384) {
                                                                    this.ak -= 6144;
                                                                }
lbl21:
                                                                // 4 sources

                                                                return true;
                                                            }
                                                            break;
                                                        }
                                                    }
                                                    break block20;
                                                }
                                                this.eb = (byte)(this.ec - 1);
                                                ** GOTO lbl7
                                            }
                                            if (this.eb < this.ee + this.ed) ** GOTO lbl9
                                            this.ee = (byte)(this.eb - this.ed + 1);
                                            ** GOTO lbl9
                                        }
                                        if (!this.O) break block21;
                                        this.O = false;
                                        this.Q = false;
                                        if (this.eb >= this.ec - 1) break block22;
                                        this.eb = (byte)(this.eb + 1);
lbl37:
                                        // 2 sources

                                        while (this.eb < this.ee) {
                                            this.ee = this.eb;
                                            ** GOTO lbl9
                                        }
                                        break block23;
                                    }
                                    this.eb = (byte)false;
                                    ** GOTO lbl37
                                }
                                if (this.eb < this.ee + this.ed) ** GOTO lbl9
                                this.ee = (byte)(this.eb - this.ed + 1);
                                ** GOTO lbl9
                            }
                            if (!this.R && !this.S) ** GOTO lbl9
                            this.S = false;
                            this.R = false;
                            this.b(false, -1);
                            this.a(false, 2);
                            ** GOTO lbl9
                        }
                        if (!this.N) break block24;
                        this.N = false;
                        if (this.et <= 0) ** GOTO lbl9
                        this.et -= 2;
                        if (this.et >= 0) ** GOTO lbl9
                        this.et = 0;
                        ** GOTO lbl9
                    }
                    if (!this.O) ** GOTO lbl9
                    this.O = false;
                    if (this.et >= this.eu) ** GOTO lbl9
                    this.et += 2;
                    if (this.et <= this.eu) ** GOTO lbl9
                    this.et = this.eu;
                    ** while (true)
                }
                --this.dP;
                if (this.dP >= 0) ** GOTO lbl14
                this.dP = 0;
                if (this.dQ != 2) break block25;
                this.dQ = (byte)false;
                switch (this.dR) lbl-1000:
                // 2 sources

                {
                    default: {
                        ** GOTO lbl14
                    }
                    case 0: {
                        ** GOTO lbl-1000
                    }
                    case 1: {
                        this.j();
                        this.z();
                        this.ah();
                        ** continue;
                    }
                    case 2: 
                }
                this.j();
                if (this.c == 1) {
                    this.a();
                }
                this.bV = 0;
                if (this.dZ[this.eb] != 1) break block26;
                var1_1 = 3;
lbl94:
                // 2 sources

                while (true) {
                    this.bU = var1_1;
                    this.j();
                    this.z();
                    this.aa();
                    this.x = 1;
                    this.d(true);
                    ** GOTO lbl14
                    break;
                }
            }
            var1_1 = 2;
            ** while (true)
        }
        this.dQ = (byte)false;
        ** while (true)
    }

    /*
     * Enabled aggressive block sorting
     */
    private final boolean C() {
        boolean bl = false;
        if (this.dQ == 0) {
            boolean bl2;
            if (this.N) {
                this.N = false;
                bl2 = bl;
                if (this.et <= 0) return bl2;
                this.et -= 2;
                if (this.et >= 0) return true;
                this.et = 0;
                return true;
            }
            if (this.O) {
                this.O = false;
                bl2 = bl;
                if (this.et >= this.eu) return bl2;
                this.et += 2;
                if (this.et <= this.eu) return true;
                this.et = this.eu;
                return true;
            }
            if (this.al != null && this.S) {
                this.S = false;
                this.a(false, 0);
                return bl;
            }
            bl2 = bl;
            if (this.am == null) return bl2;
            bl2 = bl;
            if (!this.T) return bl2;
            this.T = false;
            this.a(false, 1);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.a(true);
                }
                default: {
                    return true;
                }
                case 1: {
                    this.a(false);
                    return true;
                }
            }
        } else {
            this.dQ = (byte)0;
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

    /*
     * Enabled aggressive block sorting
     */
    private final boolean E() {
        boolean bl = false;
        if (this.dQ == 0) {
            boolean bl2;
            if (this.N) {
                this.N = false;
                bl2 = bl;
                if (this.ao == 5) return bl2;
                bl2 = bl;
                if (this.et <= 0) return bl2;
                this.et -= 2;
                if (this.et >= 0) return true;
                this.et = 0;
                return true;
            }
            if (this.O) {
                this.O = false;
                bl2 = bl;
                if (this.ao == 5) return bl2;
                bl2 = bl;
                if (this.et >= this.eu) return bl2;
                this.et += 2;
                if (this.et <= this.eu) return true;
                this.et = this.eu;
                return true;
            }
            if (this.al != null && this.S) {
                this.S = false;
                this.a(false, 0);
                return bl;
            }
            bl2 = bl;
            if (this.am == null) return bl2;
            bl2 = bl;
            if (!this.T) return bl2;
            this.T = false;
            this.a(false, 1);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        this.dT = false;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.b(true);
                }
                default: {
                    return true;
                }
                case 1: {
                    this.b(false);
                    return true;
                }
            }
        } else {
            this.dQ = (byte)0;
        }
        return true;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void F() {
        if (this.bq != -1) {
            --this.bp;
            if (this.bp > 0) return;
            this.bq = -1;
            return;
        }
        int n = (this.bI + this.b(this.dy)) / this.h;
        int n2 = (this.bJ + this.b(this.dz)) / this.i;
        if (n >= this.dw) return;
        if (n2 >= this.dx) return;
        if (this.cv[n2][n] != -8) return;
        if (this.cu[n2][n] != -57) {
            if (this.cu[n2][n] != -56) return;
        }
        this.bq = n * this.h;
        this.br = n2 * this.i;
        this.bp = 32;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void G() {
        if (this.aO > 0) {
            --this.aO;
            int n = this.h * this.aO / 8;
            int n2 = this.b(n + 1);
            int n3 = this.b(n + 1);
            this.bI += n2 - (n >> 1);
            this.bJ += n3 - (n >> 1);
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

    /*
     * Unable to fully structure code
     * Enabled aggressive block sorting
     */
    private final boolean H() {
        block74: {
            block75: {
                block73: {
                    if (this.cV && this.df && this.aw != 5 && (var1_1 = this.cb == false ? 60000L - (System.currentTimeMillis() - this.ca + this.bZ) : 60000L - this.bZ) <= 0L) {
                        this.ba = (byte)false;
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
                    var4_3 = this.bI;
                    var5_4 = this.bJ;
                    if (this.aw > 4 || this.ay != 0 || this.bc != 0) break block73;
                    this.bn = false;
                    if (this.bh) {
                        this.bh = false;
                        this.aN = 0;
                        var6_5 = 0;
                        var7_6 = 1;
                        var8_7 = this.cE[this.az];
                        var9_8 = this.cI[this.az];
                        var10_9 = this.cJ[this.az];
                        if (var8_7 == -20) {
                            var11_10 = var10_9 / this.i;
                            var12_11 = var9_8 / this.h;
                            var13_12 = this.cu[var11_10][var12_11];
                            if ((var13_12 == 87 || var13_12 == 91 || var13_12 == 92 || var13_12 == 93) && this.aw == 2) {
                                var14_13 = 0;
                            } else if (var13_12 == 88 && this.aw == 3) {
                                var14_13 = 0;
                            } else if (var13_12 == 89 && this.aw == 0) {
                                var14_13 = 0;
                            } else {
                                var14_13 = var7_6;
                                if (var13_12 == 90) {
                                    var14_13 = var7_6;
                                    if (this.aw == 1) {
                                        var14_13 = 0;
                                    }
                                }
                            }
                            var7_6 = var6_5;
                            if (var14_13 != 0) {
                                switch (this.aw) {
                                    default: {
                                        var7_6 = var6_5;
                                        break;
                                    }
                                    case 0: {
                                        var7_6 = var6_5;
                                        if (!this.a(var12_11 - 1, var11_10, this.aw, var8_7)) break;
                                        var7_6 = var6_5;
                                        if (this.a(var9_8 - this.h, (int)var10_9, this.az, 0)) break;
                                        var7_6 = 1;
                                        break;
                                    }
                                    case 1: {
                                        var7_6 = var6_5;
                                        if (!this.a(var12_11 + 1, var11_10, this.aw, var8_7)) break;
                                        var7_6 = var6_5;
                                        if (this.a(var9_8 + this.h, (int)var10_9, this.az, 1)) break;
                                        var7_6 = 1;
                                        break;
                                    }
                                    case 2: {
                                        var7_6 = var6_5;
                                        if (!this.a(var12_11, var11_10 - 1, this.aw, var8_7)) break;
                                        var7_6 = var6_5;
                                        if (this.a((int)var9_8, var10_9 - this.i, this.az, 2)) break;
                                        var7_6 = 1;
                                        break;
                                    }
                                    case 3: {
                                        var7_6 = var6_5;
                                        if (!this.a(var12_11, var11_10 + 1, this.aw, var8_7)) break;
                                        var7_6 = var6_5;
                                        if (this.a((int)var9_8, var10_9 + this.i, this.az, 3)) break;
                                        var7_6 = 1;
                                    }
                                }
                            }
                            if (var7_6 != 0) {
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
                            break block74;
                        } else if (this.aC == 0 && !this.bi && !this.bm && this.bc == 0) {
                            this.av = 3;
                        }
                    }
                    break block74;
                }
                if (this.bc <= 0) break block74;
                this.bc = (byte)(this.bc - 1);
                if (this.bc > 0) break block74;
                this.bc = (byte)false;
                var14_13 = this.ar;
                var7_6 = this.as;
                switch (this.aw) {
                    case 0: {
                        --var14_13;
                        ** break;
                    }
                    case 1: {
                        ++var14_13;
                        ** break;
                    }
                    case 2: {
                        --var7_6;
                    }
lbl112:
                    // 4 sources

                    default: {
                        break block75;
                    }
                    case 3: 
                }
                ++var7_6;
            }
            this.cu[var7_6][var14_13] = (byte)124;
            this.f(this.bI, this.bJ);
            this.av = 3;
            this.aC = 0;
            this.bo = true;
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
                return true;
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
                    var14_13 = this.az != -1 ? this.m : 0;
                    this.aW = var14_13;
                }
            }
            switch (this.bb) {
                case 1: {
                    this.aW += 6;
                    break;
                }
                case 2: {
                    this.aW -= 6;
                    break;
                }
            }
            this.aC = 0;
            this.N();
            if (this.ay == 0) {
                switch (this.bb) {
                    case 1: {
                        this.bb = (byte)false;
                        this.bm = true;
                        this.aW = this.k;
                        this.av = 0;
                        this.aN = 1;
                        break;
                    }
                    case 2: {
                        this.bb = (byte)false;
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
                        var15_14 = this.cv[this.as];
                        var7_6 = this.ar;
                        var14_13 = this.cU != false ? 202 : 203;
                        var15_14[var7_6] = (byte)var14_13;
                    }
                    this.cu[this.as][this.ar] = a.bs[this.b(4)];
                    this.f(this.bI, this.bJ);
                }
                switch (this.aX) {
                    case 1: {
                        this.aX = (byte)false;
                        this.cv[this.as][this.ar] = (byte)-1;
                        this.f(this.bI, this.bJ);
                        this.aN = 0;
                        this.bi = true;
                        this.av = 0;
                        this.b(this.I());
                        break;
                    }
                    case 2: {
                        this.aX = (byte)false;
                        this.bi = false;
                        this.aN = 0;
                        this.cv[this.as][this.ar] = (byte)-36;
                        this.f(this.bI, this.bJ);
                        ++this.ar;
                        this.ap += this.h;
                        this.b(this.I());
                        this.O = false;
                        this.N = false;
                        this.Q = false;
                        this.P = false;
                        break;
                    }
                }
            }
        } else if (!(this.bi || this.bj || this.bm || this.bc != 0 || this.aw >= 4)) {
            this.aC = var14_13 = this.aC + 1;
            if (var14_13 >= 160) {
                this.aw = 4;
                this.av = 0;
                this.be = true;
            }
        }
        if (this.aL != -1) {
            --this.aP;
            if (this.aP <= 0) {
                if (this.cv[this.aM][this.aL] == -43) {
                    this.cv[this.aM][this.aL] = (byte)-42;
                    this.aP = 6;
                } else {
                    this.cv[this.aM][this.aL] = (byte)-1;
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
                switch (this.cv[this.cT][this.cS]) {
                    default: {
                        var14_13 = -41;
                        this.dp = this.cS * this.h;
                        this.dq = this.cT * this.i + (this.i >> 1);
                        this.dt = (byte)false;
                        this.du = (byte)-1;
                        this.dv = (byte)4;
                        this.ds = (byte)true;
                        break;
                    }
                    case -41: {
                        var14_13 = -24;
                        break;
                    }
                    case -24: {
                        var14_13 = -23;
                    }
                }
                this.cv[this.cT][this.cS] = (byte)var14_13;
                this.aQ = 6;
                this.f(this.bI, this.bJ);
            }
        }
        if (!this.dV && this.aT == 0) {
            this.d(this.ap, this.aq);
        }
        if (this.bI == var4_3) {
            if (this.bJ == var5_4) return true;
        }
        this.g(this.bI, this.bJ);
        return true;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final String I() {
        if (this.bi) {
            return "/mow.mid";
        }
        if (this.bV != 0) {
            if (!this.cV) {
                if (this.H == -1) return new StringBuffer().append("/ingame").append(this.b(this.D[4] + 1)).append(".mid").toString();
                return new StringBuffer().append("/ingame").append(this.H).append(".mid").toString();
            }
            if (this.df) return "/bonus.mid";
            return "/shop.mid";
        }
        if (this.bU == 1) {
            return "/shop.mid";
        }
        if (this.bU == 2) return "/sandman.mid";
        if (this.bU == 4) return "/sandman.mid";
        if (this.bU != 5) return "/shop.mid";
        return "/sandman.mid";
    }

    /*
     * WARNING - void declaration
     * Enabled aggressive block sorting
     */
    private final void J() {
        void var5_7;
        byte by = this.cu[this.as][this.ar];
        byte by2 = this.cv[this.as][this.ar];
        if (this.aF != -1) {
            this.cu[this.aG][this.aF] = (byte)-81;
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
                this.cv[this.aM][this.aL] = (byte)-1;
                this.f(this.bI, this.bJ);
            }
            this.cv[this.aK][this.aJ] = (byte)-43;
            this.f(this.bI, this.bJ);
            this.aL = this.aJ;
            this.aM = this.aK;
            this.aP = 6;
            this.aJ = -1;
        } else if (this.aR != -1) {
            --this.cC;
            this.cv[this.aS][this.aR] = (byte)-52;
            this.f(this.bI, this.bJ);
            this.aR = -1;
        }
        if (this.bm) {
            if (by2 != -11) return;
            this.bb = (byte)2;
        } else if (by2 == -12) {
            this.bb = (byte)1;
            this.aW = 0;
            return;
        }
        if (by2 == -44) {
            this.aJ = this.ar;
            this.aK = this.as;
            return;
        }
        if (by2 == -39 && this.cS != -1 && this.ds == -1) {
            this.ds = (byte)0;
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
                this.cv[this.as][this.ar] = (byte)-1;
                this.f(this.bI, this.bJ);
            } else if (by2 == -8) {
                ++this.bX;
                this.cv[this.as][this.ar] = (byte)-1;
                this.f(this.bI, this.bJ);
            } else if (by2 == -35) {
                this.aA = 0;
                this.cX = true;
                this.cv[this.as][this.ar] = (byte)-1;
                this.f(this.bI, this.bJ);
            } else if (by2 == -13) {
                this.aA = 0;
                this.cY = true;
                this.cv[this.as][this.ar] = (byte)-1;
                this.f(this.bI, this.bJ);
            } else if (by2 == -49) {
                ++this.cD;
                this.cv[this.as][this.ar] = (byte)-1;
                this.f(this.bI, this.bJ);
            } else if (by2 == -54) {
                --this.cC;
                this.cv[this.as][this.ar] = (byte)-55;
                this.f(this.bI, this.bJ);
            } else if (by2 == -53) {
                this.aR = this.ar;
                this.aS = this.as;
            } else if (by2 == -33) {
                if (this.cD > 0) {
                    --this.cD;
                    this.dh[this.do] = (byte)this.ar;
                    this.di[this.do] = (byte)this.as;
                    this.dj[this.do] = (byte)1;
                    this.dk[this.do] = (byte)16;
                    ++this.do;
                    this.cv[this.as][this.ar] = (byte)-17;
                    this.f(this.bI, this.bJ);
                } else {
                    this.aY = (byte)4;
                    this.aA = 4;
                }
            } else if (by2 == -18 || by2 == -34 || by2 == -50) {
                this.bj = true;
            } else if (by2 == -36) {
                this.aX = (byte)1;
            } else if (by2 == -10) {
                this.J = (short)(this.J + 1);
                this.cv[this.as][this.ar] = (byte)-1;
                this.f(this.bI, this.bJ);
                this.a(true, this.bV, this.bU);
                this.I = (short)(this.I + this.bX);
                this.eg = (byte)0;
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
        }
        if (by == -94) {
            this.c(0);
            return;
        }
        if (by == -108) {
            this.bn = true;
            this.av = 1;
            return;
        }
        if ((by & 0xFF) >= 191 && (by & 0xFF) <= 194) {
            this.a(by);
            return;
        }
        if (by == -90) {
            this.c(1);
            return;
        }
        if (by == -80) {
            this.aF = this.ar;
            this.aG = this.as;
            return;
        }
        if (!this.bi && (by & 0xFF) >= 185 && (by & 0xFF) <= 190) {
            this.aH = this.ar;
            this.aI = this.as;
            return;
        }
        if (!this.bi && (by & 0xFF) >= 177 && (by & 0xFF) <= 180) {
            this.aU = this.ar;
            this.aV = this.as;
            return;
        }
        if (!this.bi && by == -97) {
            this.cZ = true;
            this.cu[this.as][this.ar] = (byte)124;
            this.f(this.bI, this.bJ);
            return;
        }
        if (by == -89) {
            this.da = false;
            this.a((byte)-89, (byte)-88);
            return;
        }
        if (by == -87) {
            this.db = false;
            this.a((byte)-87, (byte)-86);
            return;
        }
        if (by == -85) {
            this.dc = false;
            this.a((byte)-85, (byte)-84);
            return;
        }
        if (by == -83) {
            this.dd = false;
            this.a((byte)-83, (byte)-82);
            return;
        }
        if (by == -88) {
            this.da = true;
            this.aZ = (byte)2;
            this.a((byte)-88, (byte)-89);
            this.aT = 64;
            this.d(this.cK * this.h, this.cL * this.i);
            return;
        }
        if (by == -86) {
            this.db = true;
            this.aZ = (byte)3;
            this.a((byte)-86, (byte)-87);
            this.aT = 64;
            this.d(this.cM * this.h, this.cN * this.i);
            return;
        }
        if (by == -84) {
            this.dc = true;
            this.aZ = (byte)0;
            this.a((byte)-84, (byte)-85);
            this.aT = 64;
            this.d(this.cO * this.h, this.cP * this.i);
            return;
        }
        if (by == -82) {
            this.dd = true;
            this.aZ = (byte)1;
            this.a((byte)-82, (byte)-83);
            this.aT = 64;
            this.d(this.cQ * this.h, this.cR * this.i);
            return;
        }
        if (!this.bi && by == -81) {
            this.K();
            return;
        }
        if (!this.bi && this.cC == 0 && by == -106) {
            this.d(false);
            this.l();
            this.ax = this.aw;
            this.aw = 6;
            this.av = 0;
            this.be = true;
            return;
        }
        if (this.bi && by == -96) {
            this.aX = (byte)2;
            return;
        }
        if ((by & 0xFF) < 151) return;
        if ((by & 0xFF) > 157) return;
        int n = (by & 0xFF) - 151;
        by2 = this.I >= this.bu[n] ? (byte)1 : 0;
        int n2 = by2 != 0 ? n : -1;
        StringBuffer stringBuffer = new StringBuffer().append(this.a[82 + n]).append(this.a[91 + n]);
        String string = by2 != 0 ? this.a[99] : this.a[98];
        String string2 = stringBuffer.append(string).toString();
        string = by2 != 0 ? this.a[32] : this.a[30];
        if (by2 != 0) {
            String string3 = this.a[33];
        } else {
            Object var5_8 = null;
        }
        this.a(n2, string2, string, (String)var5_7);
    }

    /*
     * Enabled aggressive block sorting
     */
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
            String string = this.ba == -1 ? "/death.mid" : "/alarm.mid";
            this.a(string, (int)this.bt, false);
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

    /*
     * Enabled aggressive block sorting
     */
    private final boolean M() {
        byte by = this.cu[this.as][this.ar];
        byte by2 = this.cv[this.as][this.ar];
        if (this.bo) {
            this.bo = false;
            switch (this.aw) {
                case 0: {
                    if (!this.a(-1, 0, false)) break;
                    --this.ar;
                    this.ay = this.h;
                    if (!this.F) return true;
                    this.bl = true;
                    return true;
                }
                case 1: {
                    if (!this.a(1, 0, false)) break;
                    ++this.ar;
                    this.ay = this.h;
                    if (!this.F) return true;
                    this.bl = true;
                    return true;
                }
                case 2: {
                    if (!this.a(0, -1, false)) break;
                    --this.as;
                    this.ay = this.i;
                    if (!this.F) return true;
                    this.bl = true;
                    return true;
                }
                case 3: {
                    if (!this.a(0, 1, false)) break;
                    ++this.as;
                    this.ay = this.i;
                    if (!this.F) return true;
                    this.bl = true;
                    return true;
                }
            }
        }
        if (this.bm) {
            switch (this.aw) {
                case 0: {
                    --this.ar;
                    this.ay = this.h;
                    return true;
                }
                case 1: {
                    ++this.ar;
                    this.ay = this.h;
                    return true;
                }
                case 2: {
                    --this.as;
                    this.ay = this.i;
                    return true;
                }
                case 3: {
                    ++this.as;
                    this.ay = this.i;
                    return true;
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
            boolean bl;
            byte by3 = 1;
            boolean bl2 = false;
            switch (this.aw) {
                default: {
                    bl = bl2;
                    by2 = by3;
                    break;
                }
                case 0: {
                    if (this.a(-1, 0, false)) {
                        --this.ar;
                        by2 = by3;
                        bl = bl2;
                        if (this.dV) break;
                        by2 = by3;
                        bl = bl2;
                        if (!this.P) break;
                        by2 = 0;
                        bl = bl2;
                        break;
                    }
                    bl = true;
                    by2 = by3;
                    break;
                }
                case 1: {
                    if (this.a(1, 0, false)) {
                        ++this.ar;
                        by2 = by3;
                        bl = bl2;
                        if (this.dV) break;
                        by2 = by3;
                        bl = bl2;
                        if (!this.Q) break;
                        by2 = 0;
                        bl = bl2;
                        break;
                    }
                    bl = true;
                    by2 = by3;
                    break;
                }
                case 2: {
                    if (this.a(0, -1, false)) {
                        --this.as;
                        by2 = by3;
                        bl = bl2;
                        if (this.dV) break;
                        by2 = by3;
                        bl = bl2;
                        if (!this.N) break;
                        by2 = 0;
                        bl = bl2;
                        break;
                    }
                    bl = true;
                    by2 = by3;
                    break;
                }
                case 3: {
                    if (this.a(0, 1, false)) {
                        ++this.as;
                        by2 = by3;
                        bl = bl2;
                        if (this.dV) break;
                        by2 = by3;
                        bl = bl2;
                        if (!this.O) break;
                        by2 = 0;
                        bl = bl2;
                        break;
                    }
                    bl = true;
                    by2 = by3;
                }
            }
            if (!bl) {
                if (this.bi && this.c(this.ar, this.as) == -19) {
                    this.cv[this.as][this.ar] = (byte)-1;
                    this.f(this.bI, this.bJ);
                    this.aO = 8;
                }
                this.aN = by2 == 0 || by == -108 ? 3 : --this.aN;
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
            by2 = 0;
            switch (this.aw) {
                default: {
                    by2 = 1;
                    break;
                }
                case 0: {
                    if (this.a(-1, 0, false)) {
                        --this.ar;
                        break;
                    }
                    by2 = 1;
                    break;
                }
                case 1: {
                    if (this.a(1, 0, false)) {
                        ++this.ar;
                        break;
                    }
                    by2 = 1;
                    break;
                }
                case 2: {
                    if (this.a(0, -1, false)) {
                        --this.as;
                        break;
                    }
                    by2 = 1;
                    break;
                }
                case 3: {
                    if (this.a(0, 1, false)) {
                        ++this.as;
                        break;
                    }
                    by2 = 1;
                }
            }
            if (by2 == 0) {
                this.ay = this.h;
                this.bn = true;
                this.av = 1;
                if (this.bi) return true;
                if (!this.F) return true;
                this.bl = true;
                return true;
            }
        }
        if (this.dV) return false;
        if (this.aT != 0) return false;
        if (this.P) {
            if (!this.a(-1, 0, false)) return false;
            --this.ar;
            this.aw = 0;
            this.ay = this.h;
            if (this.bi) return true;
            if (!this.F) return true;
            this.bl = true;
            return true;
        }
        if (this.Q) {
            if (!this.a(1, 0, false)) return false;
            ++this.ar;
            this.aw = 1;
            this.ay = this.h;
            if (this.bi) return true;
            if (!this.F) return true;
            this.bl = true;
            return true;
        }
        if (this.N) {
            if (!this.a(0, -1, false)) return false;
            --this.as;
            this.aw = 2;
            this.ay = this.h;
            if (this.bi) return true;
            if (!this.F) return true;
            this.bl = true;
            return true;
        }
        if (!this.O) return false;
        if (!this.a(0, 1, false)) return false;
        ++this.as;
        this.aw = 3;
        this.ay = this.h;
        if (this.bi) return true;
        if (!this.F) return true;
        this.bl = true;
        return true;
    }

    /*
     * Enabled aggressive block sorting
     */
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
                return;
            }
            case 1: {
                this.ap += n2;
                return;
            }
            case 2: {
                this.aq -= n2;
                return;
            }
            case 3: {
                this.aq += n2;
                return;
            }
        }
    }

    /*
     * Enabled aggressive block sorting
     */
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
                    default: {
                        break;
                    }
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
                                return true;
                            } else if (this.bU == 1) {
                                this.ah();
                                this.aO = 0;
                                this.bO = this.bI;
                                this.bP = this.bJ;
                                return true;
                            } else if (this.bU == 5) {
                                this.G = true;
                                this.h();
                                this.bV = this.bW;
                                this.bU = 1;
                                this.aa();
                                this.d(true);
                                return true;
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
        if (this.aw > 3) return false;
        if (!this.bn) return false;
        this.av = 1;
        return false;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void P() {
        int n = 0;
        while (true) {
            int n2;
            boolean bl;
            int n3;
            block60: {
                boolean bl2;
                int n4;
                int n5;
                int n6;
                int n7;
                int n8;
                int n9;
                int n10;
                byte by;
                block63: {
                    int n11;
                    int n12;
                    int n13;
                    block69: {
                        block68: {
                            block61: {
                                block67: {
                                    block66: {
                                        block65: {
                                            block64: {
                                                block62: {
                                                    block58: {
                                                        block59: {
                                                            if (n >= this.cB) {
                                                                return;
                                                            }
                                                            by = this.cE[n];
                                                            n13 = this.cF[n];
                                                            n12 = this.cI[n];
                                                            n10 = this.cJ[n];
                                                            n3 = this.cG[n];
                                                            bl = this.cH[n];
                                                            n11 = 0;
                                                            n9 = n12;
                                                            n8 = n10;
                                                            n7 = n3;
                                                            if (n3 <= 0) break block58;
                                                            n6 = 0;
                                                            n7 = 0;
                                                            switch (n13) {
                                                                default: {
                                                                    n2 = n7;
                                                                    break;
                                                                }
                                                                case 0: {
                                                                    if (bl) {
                                                                        n2 = -6;
                                                                        break;
                                                                    }
                                                                    n2 = -3;
                                                                    break;
                                                                }
                                                                case 1: {
                                                                    if (bl) {
                                                                        n2 = 6;
                                                                        break;
                                                                    }
                                                                    n2 = 3;
                                                                    break;
                                                                }
                                                                case 2: {
                                                                    n2 = bl ? -6 : -3;
                                                                    n6 = n2;
                                                                    n2 = n7;
                                                                    break;
                                                                }
                                                                case 3: {
                                                                    n2 = bl ? 6 : 3;
                                                                    n6 = n2;
                                                                    n2 = n7;
                                                                }
                                                            }
                                                            if (!bl) break block59;
                                                            n9 = n12;
                                                            n8 = n10;
                                                            n7 = n3;
                                                            if (this.a(n12 + n2, n10 + n6, n, 4)) break block58;
                                                        }
                                                        n9 = n12 + n2;
                                                        n8 = n10 + n6;
                                                        this.cI[n] = (short)n9;
                                                        this.cJ[n] = (short)n8;
                                                        if (this.az == n) {
                                                            this.ap += n2;
                                                            this.aq += n6;
                                                            this.ar = this.ap / this.h;
                                                            this.as = this.aq / this.i;
                                                        }
                                                        n2 = bl ? 6 : 3;
                                                        n7 = n3 - n2;
                                                    }
                                                    if (n == this.aE && this.aT > 1) {
                                                        this.d(n9, n8);
                                                        --this.aT;
                                                    }
                                                    n2 = n13;
                                                    n3 = n7;
                                                    if (n7 > 0) break block60;
                                                    n5 = n8 / this.i;
                                                    n4 = n9 / this.h;
                                                    n3 = this.cu[n5][n4];
                                                    n2 = this.cv[n5][n4];
                                                    n12 = 0;
                                                    n6 = 0;
                                                    bl = false;
                                                    if (by != -20) break block61;
                                                    if (n3 != 90) break block62;
                                                    n2 = n13;
                                                    n7 = n6;
                                                    n10 = n11;
                                                    bl2 = bl;
                                                    if (this.a(n4 - 1, n5, 0, by)) {
                                                        n2 = n13;
                                                        n7 = n6;
                                                        n10 = n11;
                                                        bl2 = bl;
                                                        if (!this.a(n9 - this.h, n8, n, 0)) {
                                                            n2 = 0;
                                                            n7 = this.h;
                                                            bl2 = bl;
                                                            n10 = n11;
                                                        }
                                                    }
                                                    break block63;
                                                }
                                                if (n3 != 89) break block64;
                                                n2 = n13;
                                                n7 = n6;
                                                n10 = n11;
                                                bl2 = bl;
                                                if (this.a(n4 + 1, n5, 1, by)) {
                                                    n2 = n13;
                                                    n7 = n6;
                                                    n10 = n11;
                                                    bl2 = bl;
                                                    if (!this.a(n9 + this.h, n8, n, 1)) {
                                                        n2 = 1;
                                                        n7 = this.h;
                                                        n10 = n11;
                                                        bl2 = bl;
                                                    }
                                                }
                                                break block63;
                                            }
                                            if (n3 != 88) break block65;
                                            n2 = n13;
                                            n7 = n6;
                                            n10 = n11;
                                            bl2 = bl;
                                            if (this.a(n4, n5 - 1, 2, by)) {
                                                n2 = n13;
                                                n7 = n6;
                                                n10 = n11;
                                                bl2 = bl;
                                                if (!this.a(n9, n8 - this.i, n, 2)) {
                                                    n2 = 2;
                                                    n7 = this.i;
                                                    n10 = n11;
                                                    bl2 = bl;
                                                }
                                            }
                                            break block63;
                                        }
                                        if (n3 != 87) break block66;
                                        n2 = n13;
                                        n7 = n6;
                                        n10 = n11;
                                        bl2 = bl;
                                        if (this.a(n4, n5 + 1, 3, by)) {
                                            n2 = n13;
                                            n7 = n6;
                                            n10 = n11;
                                            bl2 = bl;
                                            if (!this.a(n9, n8 + this.i, n, 3)) {
                                                n2 = 3;
                                                n7 = this.i;
                                                n10 = n11;
                                                bl2 = bl;
                                            }
                                        }
                                        break block63;
                                    }
                                    if (n3 == 91 || n3 == 92) break block67;
                                    n2 = n13;
                                    n7 = n6;
                                    n10 = n11;
                                    bl2 = bl;
                                    if (n3 != 93) break block63;
                                }
                                n2 = n13;
                                n7 = n6;
                                n10 = n11;
                                bl2 = bl;
                                if (this.a(n4, n5 + 1, 3, by)) {
                                    n2 = n13;
                                    n7 = n6;
                                    n10 = n11;
                                    bl2 = bl;
                                    if (!this.a(n9, n8 + this.i, n, 3)) {
                                        n2 = 3;
                                        n7 = this.i;
                                        bl2 = true;
                                        n10 = n11;
                                    }
                                }
                                break block63;
                            }
                            if (!(by == -32 && n2 == -16 || by == -31 && n2 == -15) && (by != -30 || n2 != -14)) break block68;
                            n10 = 1;
                            n2 = n13;
                            n7 = n6;
                            bl2 = bl;
                            break block63;
                        }
                        if (this.aT == 0 || this.bO == this.bI && this.bP == this.bJ) break block69;
                        n2 = n13;
                        n7 = n6;
                        n10 = n11;
                        bl2 = bl;
                        if (this.aE == -1) break block63;
                    }
                    if (this.da && n13 != 2 && n4 == this.cK && n5 >= this.cL - 3 && n5 <= this.cL - 1 && this.a(n4, n5 - 1, 2, by) && !this.a(n9, n8 - this.i, n, 2)) {
                        n6 = 2;
                        n3 = this.i;
                    } else if (this.db && n13 != 3 && n4 == this.cM && n5 >= this.cN + 1 && n5 <= this.cN + 3 && this.a(n4, n5 + 1, 3, by) && !this.a(n9, n8 + this.i, n, 3)) {
                        n6 = 3;
                        n3 = this.i;
                    } else if (this.dc && n13 != 0 && n5 == this.cP && n4 >= this.cO - 3 && n4 <= this.cO - 1 && this.a(n4 - 1, n5, 0, by) && !this.a(n9 - this.h, n8, n, 0)) {
                        n6 = 0;
                        n3 = this.h;
                    } else {
                        n6 = n13;
                        n3 = n12;
                        if (this.dd) {
                            n6 = n13;
                            n3 = n12;
                            if (n13 != 1) {
                                n6 = n13;
                                n3 = n12;
                                if (n5 == this.cR) {
                                    n6 = n13;
                                    n3 = n12;
                                    if (n4 >= this.cQ + 1) {
                                        n6 = n13;
                                        n3 = n12;
                                        if (n4 <= this.cQ + 3) {
                                            n6 = n13;
                                            n3 = n12;
                                            if (this.a(n4 + 1, n5, 1, by)) {
                                                n6 = n13;
                                                n3 = n12;
                                                if (!this.a(n9 + this.h, n8, n, 1)) {
                                                    n6 = 1;
                                                    n3 = this.h;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    n2 = n6;
                    n7 = n3;
                    n10 = n11;
                    bl2 = bl;
                    if (n3 != 0) {
                        n2 = n6;
                        n7 = n3;
                        n10 = n11;
                        bl2 = bl;
                        if (this.aZ == n6) {
                            this.aZ = (byte)-1;
                            this.aE = n;
                            this.aT = 64;
                            this.d(n4 * this.h, n5 * this.i);
                            n2 = n6;
                            n7 = n3;
                            n10 = n11;
                            bl2 = bl;
                        }
                    }
                }
                n6 = n7;
                if (n10 == 0) {
                    n6 = n7;
                    if (n7 == 0) {
                        switch (n2) {
                            default: {
                                n6 = n7;
                                break;
                            }
                            case 0: {
                                n6 = n7;
                                if (!this.a(n4 - 1, n5, 0, by)) break;
                                n6 = n7;
                                if (this.a(n9 - this.h, n8, n, 0)) break;
                                n6 = this.h;
                                break;
                            }
                            case 1: {
                                n6 = n7;
                                if (!this.a(n4 + 1, n5, 1, by)) break;
                                n6 = n7;
                                if (this.a(n9 + this.h, n8, n, 1)) break;
                                n6 = this.h;
                                break;
                            }
                            case 2: {
                                n6 = n7;
                                if (!this.a(n4, n5 - 1, 2, by)) break;
                                n6 = n7;
                                if (this.a(n9, n8 - this.i, n, 2)) break;
                                n6 = this.i;
                                break;
                            }
                            case 3: {
                                n6 = n7;
                                if (!this.a(n4, n5 + 1, 3, by)) break;
                                n6 = n7;
                                if (this.a(n9, n8 + this.i, n, 3)) break;
                                n6 = this.i;
                            }
                        }
                    }
                }
                n3 = n6;
                bl = bl2;
                if (n6 == 0) {
                    n2 = 4;
                    bl = bl2;
                    n3 = n6;
                }
            }
            this.cG[n] = (byte)n3;
            this.cF[n] = (byte)n2;
            this.cH[n] = bl;
            ++n;
        }
    }

    /*
     * Handled duff style switch with additional control
     * Unable to fully structure code
     * Enabled aggressive block sorting
     */
    private final void Q() {
        this.bv = (byte)((this.bv + 1) % 8);
        this.aT = 16;
        this.d(this.dp, this.dq);
        if (this.dv == 3) {
            var1_1 = this.dp / this.h;
            var2_2 = this.dq / this.i;
            if (var1_1 < 0 || var2_2 < 0 || var1_1 >= this.dw || var2_2 >= this.dx) {
                this.ds = (byte)-1;
                return;
            }
            var3_3 = this.cu[var2_2][var1_1];
            var4_4 = this.cv[var2_2][var1_1];
            var5_5 = (var3_3 & 255) >= 94 && (var3_3 & 255) <= 200 || (var3_3 & 255) >= 85 && (var3_3 & 255) <= 93 || (var3_3 & 255) >= 71 && (var3_3 & 255) <= 76;
            var5_5 = var6_6 = var5_5;
            if (var6_6) {
                var5_5 = var6_6;
                cfr_temp_0 = 0;
                block20: do {
                    switch (cfr_temp_0 == 0 ? var3_3 : cfr_temp_0) {
                        default: {
                            var5_5 = var6_6;
                            cfr_temp_0 = -60;
                            continue block20;
                        }
                        case -61: 
                        case -59: {
                            var5_5 = false;
                            ** break;
                        }
lbl26:
                        // 2 sources

                        case -60: 
                    }
                    break;
                } while (true);
            }
            var6_6 = var5_5;
            if (var5_5) {
                switch (var4_4) {
                    default: {
                        var6_6 = var5_5;
                        break;
                    }
                    case -41: 
                    case -40: {
                        var6_6 = false;
                        break;
                    }
                    case -29: {
                        this.b((byte)var1_1, (byte)var2_2);
                        var6_6 = var5_5;
                        break;
                    }
                    case -19: {
                        var6_6 = false;
                        break;
                    }
                }
            }
            var5_5 = var6_6;
            if (var6_6) {
                switch (var3_3) {
                    default: {
                        var5_5 = var6_6;
                        break;
                    }
                    case -79: {
                        if (this.dt == 0) {
                            this.du = (byte)3;
                            var5_5 = var6_6;
                            break;
                        }
                        if (this.dt == 2) {
                            this.du = (byte)true;
                            var5_5 = var6_6;
                            break;
                        }
                        var5_5 = false;
                        break;
                    }
                    case -78: {
                        if (this.dt == 1) {
                            this.du = (byte)3;
                            var5_5 = var6_6;
                            break;
                        }
                        if (this.dt == 2) {
                            this.du = (byte)false;
                            var5_5 = var6_6;
                            break;
                        }
                        var5_5 = false;
                        break;
                    }
                    case -77: {
                        if (this.dt == 0) {
                            this.du = (byte)2;
                            var5_5 = var6_6;
                            break;
                        }
                        if (this.dt == 3) {
                            this.du = (byte)true;
                            var5_5 = var6_6;
                            break;
                        }
                        var5_5 = false;
                        break;
                    }
                    case -76: {
                        if (this.dt == 1) {
                            this.du = (byte)2;
                            var5_5 = var6_6;
                            break;
                        }
                        if (this.dt == 3) {
                            this.du = (byte)false;
                            var5_5 = var6_6;
                            break;
                        }
                        var5_5 = false;
                        break;
                    }
                }
            }
            if (!var5_5) {
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
        switch (this.dt) {
            default: {
                this.dq += 6;
                return;
            }
            case 0: {
                this.dp -= 6;
                return;
            }
            case 1: {
                this.dp += 6;
                return;
            }
            case 2: 
        }
        this.dq -= 6;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void R() {
        int n = 0;
        int n2 = 0;
        while (n < this.dr) {
            int n3;
            byte by = this.dn[n];
            if (by <= 0) {
                n3 = this.dl[n];
                byte by2 = this.dm[n];
                n2 = this.cv[by2][n3];
                by = 0;
                int n4 = 1;
                switch (n2) {
                    case -28: {
                        n2 = -27;
                        break;
                    }
                    case -27: {
                        n2 = -26;
                        break;
                    }
                    case -26: {
                        n2 = -1;
                        by = 1;
                    }
                }
                this.dn[n] = (byte)6;
                this.cv[by2][n3] = (byte)n2;
                n3 = n;
                n2 = n4;
                if (by != 0) {
                    for (n2 = n; n2 < this.dr - 1; ++n2) {
                        this.dl[n2] = this.dl[n2 + 1];
                        this.dm[n2] = this.dm[n2 + 1];
                        this.dn[n2] = this.dn[n2 + 1];
                    }
                    --this.dr;
                    n3 = n - 1;
                    n2 = n4;
                }
            } else {
                this.dn[n] = (byte)(by - 1);
                n3 = n;
            }
            n = n3 + 1;
        }
        if (n2 != 0) {
            this.f(this.bI, this.bJ);
        }
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void S() {
        int n = 0;
        int n2 = 0;
        while (n < this.do) {
            int n3;
            int n4 = this.dk[n];
            if (n4 <= 0) {
                byte by = this.dh[n];
                byte by2 = this.di[n];
                byte by3 = this.dj[n];
                n3 = 1;
                n4 = n2;
                int n5 = n3;
                if (by2 - by3 >= 0) {
                    n4 = n2;
                    n5 = n3;
                    if (this.cv[by2 - by3][by] == -1) {
                        byte by4 = this.cu[by2 - by3][by];
                        n4 = n2;
                        n5 = n3;
                        if ((by4 & 0xFF) >= 0) {
                            n4 = n2;
                            n5 = n3;
                            if ((by4 & 0xFF) <= 93) {
                                this.cv[by2 - by3 + 1][by] = (byte)-34;
                                if (by3 <= 1) {
                                    this.cv[by2][by] = (byte)-18;
                                }
                                this.cv[by2 - by3][by] = (byte)-50;
                                this.dj[n] = (byte)(by3 + 1);
                                this.dk[n] = (byte)16;
                                n5 = 0;
                                n4 = 1;
                            }
                        }
                    }
                }
                n3 = n;
                n2 = n4;
                if (n5 != 0) {
                    for (n2 = n; n2 < this.do - 1; ++n2) {
                        this.dh[n2] = this.dh[n2 + 1];
                        this.di[n2] = this.di[n2 + 1];
                        this.dk[n2] = this.dk[n2 + 1];
                    }
                    --this.do;
                    n3 = n - 1;
                    n2 = n4;
                }
            } else {
                this.dk[n] = (byte)(n4 - 1);
                n3 = n;
            }
            n = n3 + 1;
        }
        if (n2 != 0) {
            this.f(this.bI, this.bJ);
        }
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void T() {
        int n;
        int n2 = 48;
        if (this.cf < this.bJ) {
            n = n2 - 24;
        } else {
            n = n2;
            if (this.cf > this.bJ) {
                n = n2 + 24;
            }
        }
        n2 = 0;
        while (true) {
            if (n2 >= 5) {
                this.cf = this.bJ;
                return;
            }
            if (this.ch[n2] >> this.r > this.v) {
                this.cg[n2] = this.b(this.u) << this.r;
                this.ch[n2] = -(this.b(10) << this.r);
            }
            int[] nArray = this.cg;
            nArray[n2] = nArray[n2] + (this.b(3) - 1 << this.r);
            nArray = this.ch;
            nArray[n2] = nArray[n2] + n;
            ++n2;
        }
    }

    /*
     * Enabled aggressive block sorting
     */
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
                this.bA = (byte)0;
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
        int n4 = this.bw;
        if (n >= this.by) {
            n3 = -n3;
        }
        this.bw = n4 + n3;
        n3 = this.b(24);
        n4 = this.bx;
        if (n2 >= this.bz) {
            n3 = -n3;
        }
        this.bx = n4 + n3;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void V() {
        block26: {
            int n;
            int n2;
            if (this.bG != 0) break block26;
            this.bC = (this.bC + 1) % 8;
            this.bD = (this.bD + 1) % 6;
            this.bE = (this.bE + 1) % 4;
            this.bF = (this.bF + 1) % 3;
            for (n2 = 0; n2 < 3; ++n2) {
                int n3;
                block28: {
                    int n4;
                    block27: {
                        n = (byte)(this.ae[n2] + 1);
                        if (n == 0) break block27;
                        n3 = n;
                        if (n < 8) break block28;
                    }
                    if (this.c((n4 = this.b(this.u) + this.bI) / this.h, (n3 = this.b(this.v) + this.bJ) / this.i) == -1) {
                        int n5 = this.b(n4 / this.h, n3 / this.i) & 0xFF;
                        if (n5 < 71 || n5 > 76) {
                            n = -1;
                        }
                    } else {
                        n = -1;
                    }
                    this.ac[n2] = (short)n4;
                    this.ad[n2] = (short)n3;
                    n3 = n;
                }
                this.ae[n2] = (byte)n3;
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
                        }
                        default: {
                            break;
                        }
                        case -106: {
                            if (this.cC != 0) break;
                            bl = true;
                        }
                    }
                    boolean bl2 = bl;
                    if (!bl) {
                        switch (by2) {
                            default: {
                                bl2 = bl;
                                break;
                            }
                            case -48: {
                                bl2 = this.da;
                                break;
                            }
                            case -47: {
                                bl2 = this.db;
                                break;
                            }
                            case -46: {
                                bl2 = this.dc;
                                break;
                            }
                            case -45: {
                                bl2 = this.dd;
                                break;
                            }
                            case -12: {
                                bl2 = true;
                                break;
                            }
                            case -8: {
                                bl2 = this.bH;
                            }
                        }
                    }
                    if (!bl2) continue;
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

    /*
     * Enabled aggressive block sorting
     */
    private final void X() {
        if (this.bO < 0) {
            this.bO = 0;
        } else if (this.bO > this.bK) {
            this.bO = this.bK;
        }
        if (this.bP < 0) {
            this.bP = 0;
            return;
        }
        if (this.bP <= this.bL) return;
        this.bP = this.bL;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void Y() {
        int n;
        boolean bl;
        int n2;
        int n3;
        block16: {
            block15: {
                int n4;
                int n5;
                block14: {
                    block13: {
                        n3 = this.bO - this.bI;
                        n5 = this.bP - this.bJ;
                        n2 = 1;
                        bl = true;
                        n = n3;
                        if (n3 < 0) {
                            n = -n3;
                            n2 = 0;
                        }
                        n3 = n5;
                        if (n5 < 0) {
                            n3 = -n5;
                            bl = false;
                        }
                        if (n == 0) break block13;
                        if (n > this.bS + this.bQ) {
                            n4 = this.bQ;
                            n5 = this.bd || this.dV || this.aT > 0 ? 24 : 6;
                            if (n4 < n5) {
                                ++this.bQ;
                                this.bS += this.bQ;
                            }
                            break block14;
                        } else if (n < this.bS + this.bQ && this.bQ > 1) {
                            this.bS -= this.bQ;
                            --this.bQ;
                        }
                        break block14;
                    }
                    this.bS = 0;
                    this.bQ = 0;
                }
                if (n3 == 0) break block15;
                if (n3 > this.bT + this.bR) {
                    n4 = this.bR;
                    n5 = this.bd || this.dV || this.aT > 0 ? 24 : 6;
                    if (n4 < n5) {
                        ++this.bR;
                        this.bT += this.bR;
                    }
                    break block16;
                } else if (n3 < this.bT + this.bR && this.bR > 1) {
                    this.bT -= this.bR;
                    --this.bR;
                }
                break block16;
            }
            this.bT = 0;
            this.bR = 0;
        }
        if (n - this.bQ < 0) {
            this.bQ = n;
        }
        if (n3 - this.bR < 0) {
            this.bR = n3;
        }
        n = this.bI;
        n2 = n2 != 0 ? this.bQ : -this.bQ;
        this.bI = n + n2;
        n = this.bJ;
        n2 = bl ? this.bR : -this.bR;
        this.bJ = n + n2;
        this.g(this.bI, this.bJ);
        if (this.bd && this.bO == this.bI && this.bP == this.bJ) {
            this.bd = false;
        }
    }

    private final void Z() {
        for (int i = 0; i < this.cs.length; ++i) {
            this.cs[i] = this.a(this.cs[i], new StringBuffer().append("/b").append(i).append(".png").toString());
        }
        this.ct = this.a(this.ct, "/ta.png");
        this.cm = this.a(this.cm, "/hud.png");
        this.cq = this.a(this.cq, "/bf.png");
        this.cr = this.a(this.cr, "/alarm.png");
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
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
        if (by != by2) return by;
        return by4;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final char a(int n) {
        if (n >= 10) return (char)(n = (int)((char)(n - 10 + 65)));
        return (char)(n = (int)((char)(n + 48)));
    }

    private final int a(String string, Graphics graphics, int n, int n2, boolean bl) {
        int n3 = n;
        int n4 = string.length();
        n = n3;
        if (bl) {
            n = n3 - ((n4 - 1) * 12 + 10 >> 1);
        }
        n3 = n;
        for (int i = 0; i < n4; ++i) {
            this.a(graphics, n3, n2, string.charAt(i));
            n3 += 12;
        }
        return n;
    }

    private final String a(byte[] byArray, int n) {
        StringBuffer stringBuffer = new StringBuffer(19);
        int n2 = 0;
        int n3 = 0;
        for (int i = 0; i < n; ++i) {
            int n4 = n2 | (byArray[i >> 3] >> 7 - i % 8 & 1) << 4 - n3;
            int n5 = n3 + 1;
            n2 = n4;
            n3 = n5;
            if (n5 <= 4) continue;
            stringBuffer.append(this.a(n4));
            n3 = 0;
            n2 = 0;
        }
        if (n3 > 0) {
            stringBuffer.append(this.a(n2));
        }
        return stringBuffer.toString();
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
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

    /*
     * Enabled aggressive block sorting
     */
    private final void a(byte by) {
        byte by2;
        byte by3;
        byte by4;
        switch (by) {
            default: {
                return;
            }
            case -65: 
            case -64: {
                by = (byte)-65;
                by4 = -64;
                by3 = -61;
                by2 = -60;
                break;
            }
            case -63: 
            case -62: {
                by = (byte)-63;
                by4 = -62;
                by3 = -59;
                by2 = -58;
            }
        }
        for (int i = 0; i < this.dx; ++i) {
            for (int j = 0; j < this.dw; ++j) {
                byte by5 = this.cu[i][j];
                if (by5 == by) {
                    this.cu[i][j] = by4;
                    continue;
                }
                if (by5 == by4) {
                    this.cu[i][j] = by;
                    continue;
                }
                if (by5 == by3) {
                    this.cu[i][j] = by2;
                    continue;
                }
                if (by5 != by2) continue;
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

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final void a(byte by, byte by2, int n, int n2) {
        this.dK.setClip(n, n2, this.h, this.i);
        this.a(by, n, n2);
        if (by == -1 || by == -57) {
            return;
        }
        this.a(by2, n, n2);
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void a(byte by, int n, int n2) {
        boolean bl = false;
        if (this.bE != 0 && by == -106 && this.cC == 0) {
            by = (byte)(0 + this.bE - 1);
        } else if (this.bE != 0 && by == -8 && this.bH) {
            by = (byte)(15 + this.bE - 1);
        } else if (this.bD != 0 && by == -12) {
            by = (byte)(26 + this.bD - 1);
        } else if (this.bC != 0 && by == 86) {
            by = (byte)(39 + this.bC - 1);
        } else if (this.bF != 0 && (by == 88 || by == 87 || by == 90 || by == 89 || by == 91 || by == 92 || by == 93)) {
            switch (by) {
                default: {
                    by = (byte)50;
                    break;
                }
                case 88: {
                    by = (byte)31;
                    break;
                }
                case 87: {
                    by = (byte)33;
                    break;
                }
                case 90: {
                    by = (byte)35;
                    break;
                }
                case 89: {
                    by = (byte)37;
                    break;
                }
                case 91: {
                    by = (byte)46;
                    break;
                }
                case 92: {
                    by = (byte)48;
                }
            }
            by = (byte)(by + (this.bF - 1));
        } else if (this.bE != 0 && (by == -75 || by == -74 || by == -73 || by == -72)) {
            switch (by) {
                default: {
                    by = (byte)12;
                    break;
                }
                case -75: {
                    by = (byte)3;
                    break;
                }
                case -74: {
                    by = (byte)6;
                    break;
                }
                case -73: {
                    by = (byte)9;
                }
            }
            by = (byte)(by + (this.bE - 1));
        } else if (this.da && this.bF != 0 && by == -48) {
            by = (byte)(18 + this.bF - 1);
        } else if (this.db && this.bF != 0 && by == -47) {
            by = (byte)(20 + this.bF - 1);
        } else if (this.dc && this.bF != 0 && by == -46) {
            by = (byte)(22 + this.bF - 1);
        } else if (this.dd && this.bF != 0 && by == -45) {
            by = (byte)(24 + this.bF - 1);
        } else {
            bl = true;
            by = (byte)(by & 0xFF);
        }
        int n3 = bl ? 4 : 2;
        int n4 = by >> n3;
        int n5 = this.i;
        int n6 = this.h;
        Graphics graphics = this.dK;
        Image image = bl ? this.co : this.ct;
        graphics.drawImage(image, n - (by - (n4 << n3)) * n6, n2 - n4 * n5, 20);
    }

    private final void a(byte by, String string, byte by2) {
        this.eg = by;
        this.ei = string;
        this.eh = by2;
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
            n = (this.ex - this.ew) * this.g;
            this.er += n >> 1;
            this.es += n >> 1;
            this.eu = 0;
        }
        this.x = 2;
        this.a(true, -1);
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

    /*
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    private final void a(String string, int n, byte[] byArray) {
        try {
            RecordStore recordStore = RecordStore.openRecordStore((String)string, (boolean)false);
            recordStore.setRecord(n, byArray, 0, byArray.length);
            recordStore.closeRecordStore();
            return;
        }
        catch (Exception exception) {
            try {
                RecordStore.deleteRecordStore((String)string);
            }
            catch (Exception exception2) {}
            this.c();
            return;
        }
    }

    private final void a(StringBuffer stringBuffer, String string, int n, char c, boolean bl) {
        int n2 = string.length();
        if (!bl) {
            stringBuffer.append(string);
        }
        while (n2 < n) {
            stringBuffer.append(c);
            ++n2;
        }
        if (bl) {
            stringBuffer.append(string);
        }
    }

    /*
     * Enabled aggressive block sorting
     */
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
            Image image = this.cm;
            n = this.bv < 4 ? 282 : 310;
            this.b(graphics, image, n, 0, 28, 28, this.dp - 14 - this.bI, this.dq - 14 - this.bJ);
        }
        if (this.aA > 0 && this.aB >= 4) {
            int n2;
            int n3;
            int n4;
            switch (this.aY) {
                default: {
                    n = 247;
                    n4 = 35;
                    n3 = 36;
                    break;
                }
                case 0: {
                    n = 82;
                    n4 = 39;
                    n3 = 37;
                    break;
                }
                case 1: {
                    n = 121;
                    n4 = 22;
                    n3 = 35;
                    break;
                }
                case 2: {
                    n = 143;
                    n4 = 36;
                    n3 = 36;
                    break;
                }
                case 3: {
                    n = 179;
                    n4 = 37;
                    n3 = 38;
                }
            }
            int n5 = this.ap;
            int n6 = this.h;
            int n7 = n2 = this.aq - 1 - 36 - n3;
            if (n2 - this.bJ < 0) {
                n7 = n2 + (n3 + 72 + 2);
            }
            this.b(graphics, this.cm, n, 0, n4, n3, n5 + (n6 - n4 >> 1) - this.bI, n7 - this.bJ);
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
        if (this.dW) return;
        if (this.dU) {
            this.a(graphics, this.a[37], (byte)1, 0);
            return;
        }
        if (this.eg > 0) {
            this.a(graphics, this.ei, this.eh, 0);
            return;
        }
        if (this.aw != 5) return;
        String[] stringArray = this.a;
        n = this.ba == -1 ? 53 : 54;
        String string = stringArray[n];
        n = this.ba == -1 ? 0 : 1;
        this.a(graphics, string, (byte)n, 0);
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void a(Graphics graphics, int n, int n2) {
        int n3;
        int n4;
        if (this.bi) {
            int n5;
            int n6;
            int n7;
            boolean bl = true;
            int n8 = 0;
            switch (this.aw) {
                default: {
                    n7 = 48;
                    n6 = 0;
                    n5 = 120 + n7;
                    break;
                }
                case 0: {
                    n7 = 60;
                    n6 = -6;
                    n5 = 0;
                    n8 = this.h;
                    break;
                }
                case 1: {
                    n7 = 60;
                    n6 = -6;
                    n5 = n7;
                    n8 = -this.h;
                    break;
                }
                case 2: {
                    n7 = 48;
                    n6 = 0;
                    n5 = 120;
                    bl = false;
                }
            }
            if ((this.aN > 0 || this.bk) && bl) {
                this.a(graphics, n8, n, n2);
            }
            this.b(graphics, this.cs[7], n5, this.av * 83, n7, 83, this.ap + n6 - n, this.aq - 48 - n2);
            if (this.aN <= 0) {
                if (!this.bk) return;
            }
            if (bl) return;
            this.a(graphics, n8, n, n2);
            return;
        }
        if (this.bm) {
            int n9;
            switch (this.aw) {
                default: {
                    n9 = 360;
                    break;
                }
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
                }
            }
            this.b(graphics, this.cs[9], n9, 0, 120, 72, this.ap - 36 - n, this.aq - 36 - this.aW - n2);
            return;
        }
        if (this.bc > 0) {
            int n10;
            switch (this.aw) {
                default: {
                    n10 = 216;
                    break;
                }
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
                }
            }
            this.b(graphics, this.cs[8], n10, this.av / 3 * 72, 72, 72, this.ap - 12 - n, this.aq - 36 - this.aW - n2);
            return;
        }
        int n11 = 0;
        int n12 = 0;
        if (this.aw == 5) {
            n4 = n12;
            n3 = n11;
        } else {
            n3 = n11;
            n4 = n12;
            if (this.aN > 0) {
                n4 = !this.bj ? this.aw : 2;
                switch (n4) {
                    default: {
                        n3 = n11;
                        n4 = n12;
                        break;
                    }
                    case 0: {
                        n4 = this.h - this.l;
                        n3 = n11;
                        break;
                    }
                    case 1: {
                        n4 = -this.h + this.l;
                        n3 = n11;
                        break;
                    }
                    case 3: {
                        n3 = 1;
                        n4 = n12;
                    }
                }
            }
        }
        n12 = this.ap;
        int n13 = this.aq;
        int n14 = this.aW;
        if (this.aN > 0 && n3 != 0) {
            this.a(graphics, n4, n, n2);
        }
        Image[] imageArray = this.cs;
        n11 = !this.bj ? this.aw : 2;
        this.b(graphics, imageArray[n11], this.av * 48, 0, 48, 72, n12 + 0 - n, n13 - 36 - n14 - n2);
        if (this.aN <= 0) return;
        if (n3 != 0) return;
        this.a(graphics, n4, n, n2);
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void a(Graphics graphics, int n, int n2, char c) {
        int n3 = -1;
        if (graphics != null) {
            graphics.setClip(n, n2, 10, 16);
        }
        if (c >= '0' && c <= '9') {
            c = (char)(c - 48);
        } else if (c >= 'A' && c <= 'Z') {
            c = (char)(10 + c - 65);
        } else {
            switch (c) {
                default: {
                    return;
                }
                case '.': {
                    c = (char)36;
                    break;
                }
                case ',': {
                    c = (char)37;
                    break;
                }
                case '-': {
                    c = (char)38;
                    break;
                }
                case ':': {
                    c = (char)39;
                    break;
                }
                case '!': {
                    c = (char)40;
                    break;
                }
                case '?': {
                    c = (char)41;
                    break;
                }
                case '*': {
                    c = (char)42;
                    break;
                }
                case '\'': {
                    c = (char)43;
                    break;
                }
                case '\u00a9': {
                    c = (char)44;
                    break;
                }
                case '@': {
                    c = (char)45;
                    break;
                }
                case '\u00c0': {
                    c = (char)46;
                    n3 = 0;
                    break;
                }
                case '\u00c8': {
                    c = (char)47;
                    n3 = 0;
                    break;
                }
                case '\u00cc': {
                    c = (char)48;
                    n3 = 0;
                    break;
                }
                case '\u00d2': {
                    c = (char)49;
                    n3 = 0;
                    break;
                }
                case '\u00d9': {
                    c = (char)50;
                    n3 = 0;
                    break;
                }
                case '\u00c2': {
                    c = (char)46;
                    n3 = 2;
                    break;
                }
                case '\u00ca': {
                    c = (char)47;
                    n3 = 2;
                    break;
                }
                case '\u00ce': {
                    c = (char)48;
                    n3 = 2;
                    break;
                }
                case '\u00d4': {
                    c = (char)49;
                    n3 = 2;
                    break;
                }
                case '\u00db': {
                    c = (char)50;
                    n3 = 2;
                    break;
                }
                case '\u00c1': {
                    c = (char)46;
                    n3 = 4;
                    break;
                }
                case '\u00c9': {
                    c = (char)47;
                    n3 = 4;
                    break;
                }
                case '\u00cd': {
                    c = (char)48;
                    n3 = 4;
                    break;
                }
                case '\u00d3': {
                    c = (char)49;
                    n3 = 4;
                    break;
                }
                case '\u00da': {
                    c = (char)50;
                    n3 = 4;
                    break;
                }
                case '\u00c4': {
                    c = (char)46;
                    n3 = 1;
                    break;
                }
                case '\u00cb': {
                    c = (char)47;
                    n3 = 1;
                    break;
                }
                case '\u00cf': {
                    c = (char)48;
                    n3 = 1;
                    break;
                }
                case '\u00d6': {
                    c = (char)49;
                    n3 = 1;
                    break;
                }
                case '\u00dc': {
                    c = (char)50;
                    n3 = 1;
                    break;
                }
                case '\u00c3': {
                    c = (char)46;
                    n3 = 3;
                    break;
                }
                case '\u00d1': {
                    c = (char)51;
                    n3 = 3;
                    break;
                }
                case '\u00d5': {
                    c = (char)49;
                    n3 = 3;
                    break;
                }
                case '\u00c7': {
                    c = (char)12;
                    n3 = 5;
                }
            }
        }
        if (graphics == null) return;
        int n4 = c / 18;
        graphics.drawImage(this.cj, n - c % 18 * 10, n2 - n4 * 16, 20);
        if (n3 == -1) return;
        c = n3 != 5 ? (char)-3 : (char)16;
        graphics.setClip(n, n2 + c, 10, 3);
        n4 = n3 / 2;
        Image image = this.cj;
        c = n3 != 5 ? (char)-3 : (char)16;
        graphics.drawImage(image, n - (160 + n3 % 2 * 10), n2 + c - (32 + n4 * 3), 20);
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void a(Graphics graphics, int n, int n2, int n3) {
        Image image = this.cp;
        int n4 = this.aD / 3;
        int n5 = this.h;
        int n6 = this.bk ? 0 : this.i;
        this.b(graphics, image, n4 * n5, n6, this.h, this.i, this.ap + n - n2, this.aq - this.m - n3);
    }

    private final void a(Graphics graphics, int n, int n2, int n3, int n4) {
        int n5 = 10;
        int n6 = 1;
        int n7 = n + 13 * (n4 - 1);
        n = n5;
        for (int i = 0; i < n4; ++i) {
            graphics.setClip(n7, n2, 12, 13);
            graphics.drawImage(this.ck, n7 - n3 % n / n6 * 12, n2, 20);
            n7 -= 13;
            n6 = n;
            n *= 10;
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

    /*
     * Enabled aggressive block sorting
     */
    private final void a(Graphics graphics, int n, int n2, boolean bl, boolean bl2, boolean bl3, boolean bl4) {
        int n3;
        int n4;
        int n5;
        int n6 = 0;
        int n7 = this.w - this.er - this.es;
        if (graphics != null && bl) {
            if (bl2) {
                graphics.setClip(0, 0, this.u, this.v);
                graphics.setColor(0);
                graphics.fillRect(0, 0, this.u, this.v);
            }
            n5 = this.ev - this.e(this.ev);
            n4 = n7 - this.e(n7);
            this.a(graphics, this.u - n5 >> 1, this.er + (n7 - n4 >> 1), n5, n4, n, n2);
        }
        int n8 = (this.ev - 7) / 12;
        this.ex = (n7 - 19) / this.g;
        int n9 = this.et;
        int n10 = this.ex;
        int n11 = this.eA.length();
        n4 = 0;
        this.ew = 0;
        int n12 = 0;
        int n13 = -1;
        int n14 = this.e(this.u);
        n2 = n6;
        n6 = n4;
        n = n12;
        n5 = n13;
        if (graphics != null) {
            n2 = this.er;
            n = bl ? 19 : 7;
            n2 = n3 = 5 + n2 + (n7 - n - this.ex * this.g >> 1);
            n6 = n4;
            n = n12;
            n5 = n13;
            if (this.eu < 0) {
                n2 = n3;
                n6 = n4;
                n = n12;
                n5 = n13;
                if (bl4) {
                    n2 = n3 - (this.eu * this.g >> 1);
                    n5 = n13;
                    n = n12;
                    n6 = n4;
                }
            }
        }
        while (true) {
            block27: {
                block23: {
                    block29: {
                        block28: {
                            block26: {
                                block25: {
                                    block24: {
                                        n3 = n6;
                                        if (n >= n11) break block23;
                                        n4 = this.eA.charAt(n);
                                        n3 = n6 + 1;
                                        if (n4 == 32 || n4 == 46 || n4 == 44 || n4 == 45 || n4 == 58 || n4 == 58) break block24;
                                        n6 = n5;
                                        if (n4 != 35) break block25;
                                    }
                                    n6 = n;
                                }
                                if (n3 >= n8 || n4 == 35) break block26;
                                n12 = n2;
                                n4 = n3;
                                n13 = n;
                                n5 = n6;
                                if (n < n11 - 1) break block27;
                            }
                            if (n6 == -1) break block28;
                            n5 = n6;
                            if (n < n11 - 1) break block29;
                        }
                        n5 = n;
                    }
                    n6 = n2;
                    if (graphics != null) {
                        n6 = n2;
                        if (this.ew >= this.et) {
                            if (this.dQ == 0 || !bl) {
                                n6 = this.eA.charAt(n5);
                                n6 = n6 != 32 && n6 != 35 ? this.u - (n5 - (n - n3 + 1) + 1) * 12 >> 1 : this.u - (n5 - (n - n3 + 1)) * 12 >> 1;
                                n12 = n - n3 + 1;
                                n4 = n6;
                                for (n6 = n12; n6 <= n5; n4 += 12, ++n6) {
                                    this.a(graphics, n4 - n14, n2, this.eA.charAt(n6));
                                }
                            }
                            n6 = n2 + this.g;
                        }
                    }
                    n3 = n - n5;
                    n2 = n;
                    if (n5 + 1 < n11) {
                        n2 = n;
                        if (this.eA.charAt(n5 + 1) == ' ') {
                            n2 = n + 1;
                        }
                    }
                    n = -1;
                    ++this.ew;
                    n12 = n6;
                    n4 = n3;
                    n13 = n2;
                    n5 = n;
                    if (graphics == null) break block27;
                    n12 = n6;
                    n4 = n3;
                    n13 = n2;
                    n5 = n;
                    if (this.ew < n9 + n10) break block27;
                }
                if (graphics == null) break;
                if (!bl3) return;
                if (this.dQ != 0) return;
                if (this.et > 0) {
                    this.b(graphics, this.cl, 0, 0, 17, 9, (this.u >> 1) - 17 + 1, this.er + n7 - 9 - 4);
                }
                if (this.et >= this.eu) return;
                this.b(graphics, this.cl, 0, 9, 17, 9, (this.u >> 1) - 1, this.er + n7 - 9 - 4);
                return;
            }
            n = n13 + 1;
            n2 = n12;
            n6 = n4;
        }
        if (n3 > 0) {
            ++this.ew;
        }
        this.eu = this.ew - this.ex;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void a(Graphics graphics, String string, byte by, int n) {
        int n2 = string.length() * 12 + 16;
        int n3 = this.g + 10;
        int n4 = this.u;
        if (by != 3) {
            n = by == 0 ? this.w - n3 >> 1 : (by == 1 ? 45 : this.w - n3 - 5);
        }
        this.a(graphics, n4 - n2 >> 1, n, n2, n3, 22935, 10370);
        this.a(string, graphics, this.u >> 1, n + 6, true);
    }

    /*
     * Enabled aggressive block sorting
     */
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

    private final void a(Graphics graphics, Image image, int n, int n2, int n3, int n4, int n5, int n6) {
        this.b(graphics, image, n, n2, n3, n4, n5, n6);
        if (n3 + n5 < this.u) {
            this.b(graphics, image, n, n2, n3, n4, 384 + n5, n6);
        }
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void a(Graphics graphics, boolean bl) {
        String string;
        int n = 0;
        int n2 = this.ee;
        int n3 = this.ej - this.e(this.v);
        int n4 = this.e(31);
        int n5 = n;
        int n6 = n2;
        int n7 = n3;
        if (this.ee > 0) {
            this.b(graphics, this.cl, 0, 0, 17, 9, this.u - 17 >> 1, n3 - 9 - 2);
            n7 = n3;
            n6 = n2;
            n5 = n;
        }
        while (n5 < this.ed && n6 < this.ec) {
            int n8;
            if (bl) {
                n3 = this.u;
                n8 = this.ek;
                n2 = this.ek;
                n = n6 == this.eb ? 41658 : 22935;
                this.a(graphics, n3 - n8 >> 1, n7, n2, 26, n, 10370);
            }
            this.a(this.dY[n6], graphics, this.u - (this.dY[n6].length() - 1) * 12 - 10 >> 1, n7 + 3 + 2, false);
            if (this.ea == 2) {
                n = -1;
                string = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(this.dZ[n6], "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(59, (int)this.dZ[n6]));
                if (string.compareTo("DE") == 0) {
                    n = 0;
                } else if (string.compareTo("EN") == 0) {
                    n = 1;
                } else if (string.compareTo("FR") == 0) {
                    n = 2;
                } else if (string.compareTo("IT") == 0) {
                    n = 3;
                } else if (string.compareTo("SP") == 0) {
                    n = 4;
                } else if (string.compareTo("PG") == 0) {
                    n = 5;
                }
                if (n != -1) {
                    this.b(graphics, this.cn, 72 + n * 27, 0, 27, 18, this.el, n7 + 3 + 2 - 1);
                }
            } else if (this.ea == 3) {
                n8 = this.dZ[n6];
                if (this.B[n8 - 1]) {
                    this.b(graphics, this.cn, 18, 0, 31, 18, this.el, n7 + 3 + 2 - 1);
                } else {
                    this.b(graphics, this.cn, 0, 0, 18, 18, this.el + 6, n7 + 3 + 2 - 1);
                }
                n = -1;
                n2 = -1;
                n3 = -1;
                switch (this.cA[n8 - 1]) {
                    case 1: {
                        n = 9;
                        n2 = 11;
                        n3 = 9;
                        break;
                    }
                    case 2: {
                        n = 9;
                        n2 = 23;
                        n3 = 9;
                        break;
                    }
                    case 3: {
                        n = 0;
                        n2 = 23;
                        n3 = 18;
                        break;
                    }
                }
                if (n != -1) {
                    this.b(graphics, this.cn, 49, n, n2, n2, this.em + (31 - n2 >> 1), n7 + 3 + 2 + (16 - n3 >> 1));
                }
            }
            n7 += 31 - n4;
            ++n6;
            ++n5;
        }
        if (this.ee + this.ed < this.ec) {
            this.b(graphics, this.cl, 0, 9, 17, 9, this.u - 17 >> 1, n7 + 2);
        }
        String string2 = this.a[30];
        string = this.x != 11 ? this.a[29] : null;
        this.a(graphics, string2, string, bl);
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void a(Graphics graphics, boolean bl, byte by, int n, int n2) {
        int n3 = bl ? 4 : 2;
        int n4 = (by & 0xFF) >> n3;
        int n5 = this.i;
        int n6 = this.h;
        Image image = bl ? this.co : this.ct;
        this.b(graphics, image, ((by & 0xFF) - (n4 << n3)) * n6, n4 * n5, this.h, this.i, n, n2);
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void a(boolean bl, int n) {
        int n2 = bl ? 1 : 2;
        this.dQ = (byte)n2;
        this.dR = (byte)n;
        this.dP = 18;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final void a(boolean bl, int n, int n2) {
        if ((n = this.h(n, n2)) == -1) {
            return;
        }
        if (bl) {
            this.K |= 1L << n;
            return;
        }
        this.K &= 1L << n ^ 0xFFFFFFFFFFFFFFFFL;
    }

    private final void a(byte[] byArray, int n, int n2) {
        int n3 = 24;
        for (int i = 0; i < 4; ++i) {
            byArray[n + i] = (byte)(0xFF & n2 >>> n3);
            n3 -= 8;
        }
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final boolean a(int n, int n2) {
        int n3 = this.h;
        int n4 = this.i;
        int n5 = 0;
        while (n5 < this.cB) {
            if (this.cF[n5] == 4 && this.cI[n5] == n * n3 && this.cJ[n5] == n2 * n4) {
                this.bh = true;
                this.az = (byte)n5;
                return true;
            }
            ++n5;
        }
        return false;
    }

    /*
     * Exception decompiling
     */
    private final boolean a(int var1_1, int var2_2, int var3_3, byte var4_4) {
        /*
         * This method has failed to decompile.  When submitting a bug report, please provide this stack trace, and (if you hold appropriate legal rights) the relevant class file.
         * 
         * org.benf.cfr.reader.util.ConfusedCFRException: Tried to end blocks [0[SWITCH]], but top level block is 3[SWITCH]
         *     at org.benf.cfr.reader.bytecode.analysis.opgraph.Op04StructuredStatement.processEndingBlocks(Op04StructuredStatement.java:435)
         *     at org.benf.cfr.reader.bytecode.analysis.opgraph.Op04StructuredStatement.buildNestedBlocks(Op04StructuredStatement.java:484)
         *     at org.benf.cfr.reader.bytecode.analysis.opgraph.Op03SimpleStatement.createInitialStructuredBlock(Op03SimpleStatement.java:736)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysisInner(CodeAnalyser.java:850)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysisOrWrapFail(CodeAnalyser.java:278)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysis(CodeAnalyser.java:201)
         *     at org.benf.cfr.reader.entities.attributes.AttributeCode.analyse(AttributeCode.java:94)
         *     at org.benf.cfr.reader.entities.Method.analyse(Method.java:531)
         *     at org.benf.cfr.reader.entities.ClassFile.analyseMid(ClassFile.java:1055)
         *     at org.benf.cfr.reader.entities.ClassFile.analyseTop(ClassFile.java:942)
         *     at org.benf.cfr.reader.Driver.doJarVersionTypes(Driver.java:257)
         *     at org.benf.cfr.reader.Driver.doJar(Driver.java:139)
         *     at org.benf.cfr.reader.CfrDriverImpl.analyse(CfrDriverImpl.java:76)
         *     at org.benf.cfr.reader.Main.main(Main.java:54)
         */
        throw new IllegalStateException("Decompilation failed");
    }

    /*
     * Enabled aggressive block sorting
     */
    private final boolean a(int n, int n2, int n3, int n4) {
        int n5 = 0;
        while (n5 < this.cB) {
            if (n5 != n3) {
                if (n3 != -1) {
                    if (this.cF[n5] != n4 && this.b(n, n2, this.cI[n5], this.cJ[n5])) {
                        return true;
                    }
                } else {
                    byte by = this.cG[n5];
                    short s = this.cI[n5];
                    short s2 = this.cJ[n5];
                    switch (this.cF[n5]) {
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
                    if (this.b(n, n2, s, s2)) {
                        return true;
                    }
                }
            }
            ++n5;
        }
        return false;
    }

    /*
     * Unable to fully structure code
     * Enabled aggressive block sorting
     */
    private final boolean a(int var1_1, int var2_2, boolean var3_3) {
        block66: {
            block67: {
                block71: {
                    block70: {
                        block69: {
                            block68: {
                                var4_4 = this.ar + var1_1;
                                var5_5 = this.as + var2_2;
                                this.bc = (byte)false;
                                if (var4_4 < 0) return false;
                                if (var5_5 < 0) return false;
                                if (var4_4 >= this.dw) return false;
                                if (var5_5 >= this.dx) {
                                    return false;
                                }
                                if (this.bm) {
                                    return true;
                                }
                                var6_6 = this.cu[this.as][this.ar];
                                var7_7 = this.cu[var5_5][var4_4];
                                var4_4 = this.cv[var5_5][var4_4];
                                var5_5 = 1;
                                if (var6_6 == -66) {
                                    if (var1_1 == 0) return false;
                                    var5_5 = 1;
                                } else if (var6_6 == -67) {
                                    if (var2_2 == 0) return false;
                                    var5_5 = 1;
                                } else if (var6_6 == -68) {
                                    if (var1_1 != 1) {
                                        if (var2_2 != 1) return false;
                                    }
                                    var5_5 = 1;
                                } else if (var6_6 == -69) {
                                    if (var1_1 != -1) {
                                        if (var2_2 != 1) return false;
                                    }
                                    var5_5 = 1;
                                } else if (var6_6 == -70) {
                                    if (var1_1 != -1) {
                                        if (var2_2 != -1) return false;
                                    }
                                    var5_5 = 1;
                                } else if (var6_6 == -71) {
                                    if (var1_1 != 1) {
                                        if (var2_2 != -1) return false;
                                    }
                                    var5_5 = 1;
                                }
                                if (var5_5 == 0) {
                                    return false;
                                }
                                if (!this.bi && this.a(this.ar + var1_1, this.as + var2_2)) {
                                    return true;
                                }
                                var5_5 = (var7_7 & 255) >= 94 && (var7_7 & 255) <= 200 ? 1 : 0;
                                var6_6 = var5_5;
                                if (var6_6 == 0) break block67;
                                if ((var7_7 & 255) < 185 || (var7_7 & 255) > 190) break block68;
                                if (!this.bi) {
                                    switch (var7_7) {
                                        default: {
                                            var5_5 = var6_6;
                                            break;
                                        }
                                        case -71: {
                                            var1_1 = var1_1 == -1 || var2_2 == 1 ? 1 : 0;
                                            var5_5 = var1_1;
                                            break;
                                        }
                                        case -70: {
                                            var1_1 = var1_1 == 1 || var2_2 == 1 ? 1 : 0;
                                            var5_5 = var1_1;
                                            break;
                                        }
                                        case -69: {
                                            var1_1 = var1_1 == 1 || var2_2 == -1 ? 1 : 0;
                                            var5_5 = var1_1;
                                            break;
                                        }
                                        case -68: {
                                            var1_1 = var1_1 == -1 || var2_2 == -1 ? 1 : 0;
                                            var5_5 = var1_1;
                                            break;
                                        }
                                        case -67: {
                                            var1_1 = var2_2 != 0 ? 1 : 0;
                                            var5_5 = var1_1;
                                            break;
                                        }
                                        case -66: {
                                            if (var1_1 != 0) {
                                                var1_1 = 1;
                                            } else {
                                                var1_1 = 0;
                                                ** break;
                                            }
lbl81:
                                            // 2 sources

                                            var5_5 = var1_1;
                                            break;
                                        }
                                    }
                                    break block66;
                                } else {
                                    var5_5 = 0;
                                }
                                break block66;
                            }
                            if ((var7_7 & 255) < 177 || (var7_7 & 255) > 180) break block69;
                            var1_1 = this.bi == false ? 1 : 0;
                            var5_5 = var1_1;
                            break block66;
                        }
                        if (var7_7 != -57 && var7_7 != -56) break block70;
                        if (this.bi) {
                            this.bk = true;
                            var5_5 = var6_6;
                            break block66;
                        } else {
                            var5_5 = 0;
                        }
                        break block66;
                    }
                    if (var7_7 == -61) break block71;
                    var5_5 = var6_6;
                    if (var7_7 != -59) break block66;
                }
                var5_5 = 0;
                break block66;
            }
            var5_5 = var6_6;
            if (var7_7 == 77) {
                var5_5 = var6_6;
                if (!this.bi) {
                    if (this.cZ) {
                        this.bc = (byte)32;
                        this.av = 0;
                        if (var1_1 != 0) {
                            var1_1 = var1_1 < 0 ? 0 : 1;
                            this.aw = var1_1;
                        } else {
                            var1_1 = var2_2 < 0 ? 2 : 3;
                            this.aw = var1_1;
                        }
                        this.bl = false;
                        this.aN = 0;
                        this.aC = 0;
                        var5_5 = var6_6;
                    } else {
                        this.aY = (byte)3;
                        this.aA = 4;
                        var5_5 = var6_6;
                    }
                }
            }
        }
        if (var5_5 == 0) {
            switch (var4_4) {
                default: {
                    return false;
                }
                case -50: 
                case -44: 
                case -34: {
                    if (this.bi != false) return false;
                    return true;
                }
            }
        }
        switch (var4_4) {
            default: {
                return true;
            }
            case -54: {
                if (this.bi != false) return false;
                return true;
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
                return false;
            }
            case -51: {
                if (this.bi != false) return false;
                if (this.de != false) return true;
                if (this.D[2] != 0) return true;
                this.aY = (byte)true;
                this.aA = 4;
                return false;
            }
            case -36: {
                if (this.cX != false) return true;
                this.aY = (byte)false;
                this.aA = 4;
                return false;
            }
            case -22: 
            case -9: {
                if (!this.cV) ** GOTO lbl184
                var2_2 = 0;
                if (this.df) ** GOTO lbl176
                if (this.D[2] <= 0) ** GOTO lbl165
                var1_1 = -1;
                var8_8 = new StringBuffer().append(this.a[113]).append(this.a[114]).toString();
                ** GOTO lbl178
lbl165:
                // 1 sources

                if (this.de) ** GOTO lbl173
                var1_1 = 7;
                if (this.I >= 3) {
                    var8_8 = new StringBuffer().append(this.a[113]).append(this.a[115]).append(this.I).append(this.a[116]).toString();
                } else {
                    var8_8 = new StringBuffer().append(this.a[113]).append(this.a[117]).toString();
                    var2_2 = 1;
                }
                ** GOTO lbl178
lbl173:
                // 1 sources

                var1_1 = -1;
                var8_8 = this.a[118];
                ** GOTO lbl178
lbl176:
                // 1 sources

                var1_1 = -1;
                var8_8 = this.a[118];
lbl178:
                // 5 sources

                var9_9 /* !! */  = this.a;
                var2_2 = var1_1 != -1 ? (var2_2 != 0 ? 34 : 32) : 30;
                var10_10 = var9_9 /* !! */ [var2_2];
                var9_9 /* !! */  = var1_1 != -1 ? this.a[33] : null;
                this.a(var1_1, var8_8, var10_10, (String)var9_9 /* !! */ );
                return false;
lbl184:
                // 1 sources

                if (this.bV != 0) return false;
                if (this.bU == 1) {
                    this.a(-1, new StringBuffer().append(this.a[100]).append(this.I).append(this.a[101]).toString(), this.a[30], null);
                    return false;
                }
                if (this.bU == 2) {
                    if (this.J > 0) {
                        this.a(9, new StringBuffer().append(this.a[102]).append(this.J).append(this.a[103]).toString(), this.a[32], this.a[33]);
                        return false;
                    } else {
                        this.a(-1, new StringBuffer().append(this.a[102]).append(this.a[104]).toString(), this.a[30], null);
                    }
                    return false;
                }
                if (this.bU == 3) {
                    this.a(-1, this.a[109], this.a[30], null);
                    return false;
                } else if (this.bU == 4) {
                    this.a(10, this.a[112], this.a[32], this.a[33]);
                    return false;
                } else {
                    if (this.bU != 5) return false;
                    this.a(-1, this.a[110], this.a[30], null);
                }
                return false;
            }
            case -21: {
                this.D();
                return false;
            }
            case -19: {
                if (this.bi == false) return false;
                if (this.aN > 0) return true;
                if (var3_3 == false) return false;
                return true;
            }
            case -12: {
                if (this.bi != false) return false;
                if (this.cY) {
                    return true;
                }
                this.aY = (byte)2;
                this.aA = 4;
                return false;
            }
        }
    }

    /*
     * Enabled aggressive block sorting
     */
    private final boolean a(boolean bl) {
        this.x = 1;
        if (this.an == -1) {
            return true;
        }
        if (!bl) {
            if (this.an != 10) return true;
            this.ah();
            return true;
        }
        if (this.an == 8) {
            this.C = true;
            return true;
        }
        if (this.an == 7) {
            if (this.I < 3) {
                this.dg = true;
            } else {
                this.I = (short)(this.I - 3);
            }
            this.de = true;
            return true;
        }
        if (this.an == 9) {
            this.u();
            return true;
        }
        if (this.an == 10) {
            this.p();
            return true;
        }
        if (this.an == 11) {
            this.f();
            this.x = 3;
            return true;
        }
        this.I = (short)(this.I - this.bu[this.an]);
        this.cu[this.as][this.ar] = (byte)-98;
        this.f(this.bI, this.bJ);
        byte[] byArray = this.D;
        int n = this.an;
        byArray[n] = (byte)(byArray[n] + 1);
        if (this.an == 4) {
            this.H = this.D[4];
        }
        this.h();
        return true;
    }

    /*
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    private final byte[] a(String string, int n) {
        byte[] byArray;
        byte[] byArray2 = byArray = null;
        try {
            RecordStore recordStore = RecordStore.openRecordStore((String)string, (boolean)false);
            byArray2 = byArray;
            byArray2 = byArray = recordStore.getRecord(n);
            recordStore.closeRecordStore();
            return byArray;
        }
        catch (Exception exception) {
            try {
                RecordStore.deleteRecordStore((String)string);
            }
            catch (Exception exception2) {}
            this.c();
            return byArray2;
        }
    }

    private final void aa() {
        this.Z();
        this.ab();
    }

    /*
     * Enabled aggressive block sorting
     */
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
            n = this.b(2) == 0 ? -24 : this.at + 1;
            this.by = n;
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
        this.bb = (byte)0;
        this.bo = false;
        this.bn = false;
        this.aX = (byte)0;
        this.bk = false;
        this.bc = (byte)0;
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
                n = this.bV;
                if (this.bV <= this.ci.length) {
                    n = this.ci[this.bV - 1];
                }
                string = new StringBuffer().append(this.a[39]).append(n).append('-').append(this.bU).toString();
            }
        } else {
            switch (this.bU) {
                default: {
                    string = this.a[43];
                    break;
                }
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
                }
            }
        }
        this.a((byte)75, string, (byte)1);
        this.b(this.I());
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

    /*
     * Enabled aggressive block sorting
     */
    private final void ae() {
        byte[] byArray;
        byte[] byArray2 = byArray = new byte[7];
        byArray[0] = 0;
        byArray2[1] = 0;
        byArray2[2] = 0;
        byArray2[3] = 0;
        byArray2[4] = 0;
        byArray2[5] = 0;
        byArray2[6] = 0;
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
        boolean bl = this.bV != 0 && (this.bU == 11 || this.bU == 12);
        this.cV = bl;
        int n2 = 0;
        while (true) {
            if (n2 >= this.dx) {
                this.do = 0;
                this.dh = new byte[n];
                this.di = new byte[n];
                this.dj = new byte[n];
                this.dk = new byte[n];
                this.dr = 0;
                return;
            }
            for (int i = 0; i < this.dw; ++i) {
                int n3 = this.cu[n2][i];
                byte by = this.cv[n2][i];
                if (n3 == -107) {
                    this.ar = i;
                    this.as = n2;
                    this.ap = i * this.h;
                    this.aq = n2 * this.i;
                } else if (n3 == -56) {
                    ++this.cC;
                } else if (n3 == 77) {
                    this.cW = true;
                } else if (this.bV == 0 && this.bU == 1 && (n3 & 0xFF) >= 151 && (n3 & 0xFF) <= 157) {
                    if (byArray[n3 = (n3 & 0xFF) - 151] > 0) {
                        byArray[n3] = (byte)(byArray[n3] - 1);
                    } else {
                        this.cu[n2][i] = (byte)-98;
                    }
                }
                if (by == -54) {
                    this.cU = true;
                    ++this.cC;
                    n3 = n;
                } else if (by == -53) {
                    this.cU = false;
                    ++this.cC;
                    n3 = n;
                } else if (by == -33) {
                    n3 = n + 1;
                } else if (by == -48) {
                    this.cK = (short)i;
                    this.cL = (short)n2;
                    n3 = n;
                } else if (by == -47) {
                    this.cM = (short)i;
                    this.cN = (short)n2;
                    n3 = n;
                } else if (by == -46) {
                    this.cO = (short)i;
                    this.cP = (short)n2;
                    n3 = n;
                } else if (by == -45) {
                    this.cQ = (short)i;
                    this.cR = (short)n2;
                    n3 = n;
                } else {
                    n3 = n;
                    if (by == -41) {
                        this.cS = (short)i;
                        this.cT = (short)n2;
                        n3 = n;
                    }
                }
                n = n3;
            }
            ++n2;
        }
    }

    private final void af() {
        this.dK = null;
        this.dJ = null;
        this.dJ = Image.createImage((int)this.dC, (int)this.dD);
        this.dK = this.dJ.getGraphics();
        byte[][] byArray = null;
        this.dI = byArray;
        this.dH = byArray;
        int n = this.dF;
        int n2 = this.dE;
        this.dH = new byte[n][n2];
        n2 = this.dF;
        n = this.dE;
        this.dI = new byte[n2][n];
        for (n = 0; n < this.dF; ++n) {
            for (n2 = 0; n2 < this.dE; ++n2) {
                this.dH[n][n2] = (byte)-1;
                this.dI[n][n2] = (byte)0;
            }
        }
    }

    private final void ag() {
        this.dK.setColor(0);
        this.dK.setClip(0, 0, this.dC, this.dD);
        this.dK.fillRect(0, 0, this.dC, this.dD);
        for (int i = 0; i < this.dF; ++i) {
            for (int j = 0; j < this.dE; ++j) {
                this.dH[i][j] = (byte)-1;
                this.dI[i][j] = (byte)0;
            }
        }
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

    /*
     * Enabled aggressive block sorting
     */
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
            boolean bl = !this.dO;
            this.dO = bl;
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
                break;
            }
        }
        this.O();
        this.o();
        return true;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final boolean aj() {
        boolean bl = false;
        if (this.dQ == 0) {
            boolean bl2;
            if (this.N) {
                this.N = false;
                this.eb = this.eb > 0 ? (byte)((byte)(this.eb - 1)) : (byte)((byte)(this.ec - 1));
                if (this.eb < this.ee) {
                    this.ee = this.eb;
                    return true;
                } else {
                    if (this.eb < this.ee + this.ed) return true;
                    this.ee = (byte)(this.eb - this.ed + 1);
                }
                return true;
            }
            if (this.O) {
                this.O = false;
                this.Q = false;
                this.eb = this.eb < this.ec - 1 ? (byte)((byte)(this.eb + 1)) : (byte)0;
                if (this.eb < this.ee) {
                    this.ee = this.eb;
                    return true;
                } else {
                    if (this.eb < this.ee + this.ed) return true;
                    this.ee = (byte)(this.eb - this.ed + 1);
                }
                return true;
            }
            if (this.Q || this.P) {
                bl2 = this.e(this.P);
                this.P = false;
                this.Q = false;
                return bl2;
            }
            if (!this.S && !this.R) {
                bl2 = bl;
                if (!this.T) return bl2;
                this.U = false;
                this.T = false;
                bl2 = bl;
                if (this.x == 11) return bl2;
                this.a(false, 1);
                return bl;
            }
            this.U = false;
            this.R = false;
            this.S = false;
            short s = this.dZ[this.eb];
            if (this.ea == 5) return this.ak();
            if (this.ea != 2) {
                if (s == 11) return this.ak();
                if (s == 13) return this.ak();
                if (s == 30) return this.ak();
                if (s == 31) return this.ak();
                if (s == 32) return this.ak();
                if (s == 101) {
                    return this.ak();
                }
            }
            if (this.ea == 0 && s != 0 && s != 1 && s != 16 && s != 12 || this.ea == 1 && s != 99 && s != 100 || this.ea == 3) {
                this.b(false, -1);
            }
            this.a(false, 0);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.ce > 0) return true;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.ak();
                }
                default: {
                    return true;
                }
                case 1: {
                    this.al();
                    return true;
                }
            }
        } else {
            this.dQ = (byte)0;
        }
        return true;
    }

    /*
     * Unable to fully structure code
     */
    private final boolean ak() {
        var1_1 = false;
        var2_2 = false;
        var3_3 = 0;
        var4_4 = 0;
        var5_5 = this.dZ[this.eb];
        var6_6 = var2_2;
        var7_7 = var4_4;
        switch (this.ea) {
            default: {
                var7_7 = var4_4;
                var6_6 = var2_2;
            }
lbl12:
            // 20 sources

            case 4: lbl-1000:
            // 2 sources

            {
                while (true) {
                    if (var7_7 != 0) {
                        this.am();
                        var6_6 = true;
                    }
lbl17:
                    // 5 sources

                    return var6_6;
                }
            }
            case 0: 
            case 1: {
                switch (var5_5) {
                    default: {
                        var7_7 = var3_3;
                        var6_6 = var1_1;
                        ** GOTO lbl12
                    }
                    case 0: 
                    case 1: {
                        this.c((byte)3, (byte)var5_5);
                        var6_6 = true;
                        var7_7 = var3_3;
                        ** GOTO lbl12
                    }
                    case 3: {
                        this.a(this.a[52], 0, (byte)-1);
                        this.dW = false;
                        var6_6 = true;
                        var7_7 = var3_3;
                        ** GOTO lbl12
                    }
                    case 4: {
                        this.d((byte)1);
                        var6_6 = true;
                        ** GOTO lbl17
                    }
                    case 6: {
                        this.j();
                        this.ab();
                        this.x = 1;
                        this.d(true);
                        var7_7 = 1;
                        var6_6 = var1_1;
                        ** GOTO lbl12
                    }
                    case 8: {
                        if (this.bV != 0 || this.bU == 4) {
                            this.d((byte)0);
lbl51:
                            // 4 sources

                            while (true) {
                                var6_6 = true;
                                ** continue;
                                break;
                            }
                        }
                        this.am();
                        if (this.bU != 1 && this.bU != 5) ** GOTO lbl58
                        this.ah();
                        ** GOTO lbl51
lbl58:
                        // 1 sources

                        if (this.bU != 2 && this.bU != 3) ** GOTO lbl51
                        this.A();
                        ** continue;
                    }
                    case 10: {
                        this.ar();
                        this.dW = false;
                        var6_6 = true;
                        var7_7 = var3_3;
                        ** GOTO lbl12
                    }
                    case 11: {
                        if (this.c != 1) ** GOTO lbl87
                        this.c = (byte)false;
lbl70:
                        // 2 sources

                        while (this.x == 4) {
                            if (this.c != 0) ** GOTO lbl89
                            this.a();
lbl73:
                            // 4 sources

                            while (true) {
                                this.h();
                                var8_8 = this.dY;
                                var4_4 = this.eb;
                                var9_12 = new StringBuffer().append(this.a[4]);
                                var10_17 = this.a;
                                if (this.c != 1) ** GOTO lbl96
                                var7_7 = 2;
lbl81:
                                // 2 sources

                                while (true) {
                                    var8_8[var4_4] = var9_12.append(var10_17[var7_7]).toString();
                                    var6_6 = true;
                                    var7_7 = var3_3;
                                    ** GOTO lbl12
                                    break;
                                }
                                break;
                            }
                        }
                        ** GOTO lbl91
lbl87:
                        // 1 sources

                        this.c = (byte)true;
                        ** GOTO lbl70
lbl89:
                        // 1 sources

                        this.b("/title.mid");
                        ** GOTO lbl73
lbl91:
                        // 1 sources

                        if (this.c != 0) ** GOTO lbl94
                        this.a();
                        ** GOTO lbl73
lbl94:
                        // 1 sources

                        this.b(this.I());
                        ** continue;
lbl96:
                        // 1 sources

                        var7_7 = 3;
                        ** continue;
                    }
                    case 12: {
                        this.c((byte)2, (byte)-1);
                        var6_6 = true;
                        var7_7 = var3_3;
                        ** GOTO lbl12
                    }
                    case 13: {
                        this.bt = (byte)(this.bt + 1);
                        if (this.bt > 5) {
                            this.bt = (byte)true;
                        }
                        if (this.c == 1) {
                            this.a();
                            this.b("/title.mid");
                        }
                        this.h();
                        this.dY[this.eb] = new StringBuffer().append(this.a[5]).append(this.bt).toString();
                        var6_6 = true;
                        var7_7 = var3_3;
                        ** GOTO lbl12
                    }
                    case 14: {
                        this.A();
                        var6_6 = var1_1;
                        var7_7 = var3_3;
                        ** GOTO lbl12
                    }
                    case 15: {
                        var10_18 = this.a[122];
                        for (var7_7 = 0; var7_7 < this.M.length && this.M[var7_7].length() > 0; ++var7_7) {
                            var10_18 = var9_13 = new StringBuffer().append(var10_18).append(this.M[var7_7]).append('#').toString();
                            if (var7_7 != 0) continue;
                            var10_18 = new StringBuffer().append(var9_13).append('#').toString();
                        }
                        this.a(var10_18, 0, (byte)-1);
                        this.dW = false;
                        var6_6 = true;
                        var7_7 = var3_3;
                        ** GOTO lbl12
                    }
                    case 16: {
                        this.c((byte)5, (byte)0);
                        var6_6 = true;
                        var7_7 = var3_3;
                        ** GOTO lbl12
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
                        var7_7 = 1;
                        var6_6 = var1_1;
                        ** GOTO lbl12
                    }
                    case 30: {
                        if (this.F) ** GOTO lbl166
                        var6_6 = true;
lbl152:
                        // 2 sources

                        while (true) {
                            this.F = var6_6;
                            this.h();
                            var8_9 = this.dY;
                            var4_4 = this.eb;
                            var9_14 = new StringBuffer().append(this.a[87]);
                            var10_19 = this.a;
                            if (!this.F) ** GOTO lbl168
                            var7_7 = 2;
lbl161:
                            // 2 sources

                            while (true) {
                                var8_9[var4_4] = var9_14.append(var10_19[var7_7]).toString();
                                var6_6 = true;
                                var7_7 = var3_3;
                                ** GOTO lbl12
                                break;
                            }
                            break;
                        }
lbl166:
                        // 1 sources

                        var6_6 = false;
                        ** continue;
lbl168:
                        // 1 sources

                        var7_7 = 3;
                        ** continue;
                    }
                    case 31: {
                        if (this.E) ** GOTO lbl187
                        var6_6 = true;
lbl173:
                        // 2 sources

                        while (true) {
                            this.E = var6_6;
                            this.h();
                            var10_20 = this.dY;
                            var4_4 = this.eb;
                            var9_15 = new StringBuffer().append(this.a[88]);
                            var8_10 = this.a;
                            if (!this.E) ** GOTO lbl189
                            var7_7 = 2;
lbl182:
                            // 2 sources

                            while (true) {
                                var10_20[var4_4] = var9_15.append(var8_10[var7_7]).toString();
                                var6_6 = true;
                                var7_7 = var3_3;
                                ** GOTO lbl12
                                break;
                            }
                            break;
                        }
lbl187:
                        // 1 sources

                        var6_6 = false;
                        ** continue;
lbl189:
                        // 1 sources

                        var7_7 = 3;
                        ** continue;
                    }
                    case 32: {
                        this.H = (byte)(this.H + 1);
                        if (this.H > this.D[4]) {
                            this.H = (byte)-1;
                        }
                        this.b(this.I());
                        this.h();
                        var8_11 = this.dY;
                        var7_7 = this.eb;
                        var9_16 = new StringBuffer().append(this.a[89]);
                        if (this.H == -1) ** GOTO lbl207
                        var10_21 = Integer.toString(this.H + 1);
lbl202:
                        // 2 sources

                        while (true) {
                            var8_11[var7_7] = var9_16.append(var10_21).toString();
                            var6_6 = true;
                            var7_7 = var3_3;
                            ** GOTO lbl12
                            break;
                        }
lbl207:
                        // 1 sources

                        var10_21 = this.a[90];
                        ** continue;
                    }
                    case 99: 
                }
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
                var6_6 = true;
                var7_7 = var3_3;
                ** GOTO lbl12
            }
            case 2: {
                var10_22 = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(var5_5, "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(59, var5_5));
                if (var10_22.compareTo(this.y) != 0) {
                    this.y = var10_22;
                    this.a(new StringBuffer().append(this.y).append(".dat").toString());
                    this.h();
                    this.ad();
                }
                if (this.x == 11) ** GOTO lbl238
                this.c((byte)0, (byte)-1);
lbl234:
                // 2 sources

                while (true) {
                    var6_6 = true;
                    var7_7 = var4_4;
                    ** GOTO lbl12
                    break;
                }
lbl238:
                // 1 sources

                this.am();
                this.d((byte)2);
                ** continue;
            }
            case 3: {
                this.j();
                this.y();
                if (this.c == 1) {
                    this.a();
                }
                if (!this.G) ** GOTO lbl263
                this.bV = var5_5;
                if (this.ef != 0) ** GOTO lbl256
                this.bU = 1;
lbl250:
                // 5 sources

                while (true) {
                    this.aa();
                    this.x = 1;
                    var7_7 = 1;
                    var6_6 = var2_2;
                    ** GOTO lbl12
                    break;
                }
lbl256:
                // 1 sources

                this.bU = this.A[var5_5 - 1];
                if (this.bU != 11 || !this.i(this.bV, 11)) ** GOTO lbl260
                this.bU = 3;
                ** GOTO lbl250
lbl260:
                // 1 sources

                if (this.bU != 12 || !this.i(this.bV, 12)) ** GOTO lbl250
                this.bU = 6;
                ** GOTO lbl250
lbl263:
                // 1 sources

                this.bW = var5_5;
                this.bV = 0;
                this.bU = 5;
                ** continue;
            }
            case 5: 
        }
        switch (var5_5) {
            default: {
                var10_23 = "/cleared.mid";
lbl271:
                // 8 sources

                while (true) {
                    this.a(var10_23, (int)this.bt, false);
                    var6_6 = var2_2;
                    var7_7 = var4_4;
                    ** continue;
                    break;
                }
            }
            case 0: 
            case 1: 
            case 2: {
                var10_23 = new StringBuffer().append("/ingame").append(var5_5).append(".mid").toString();
                ** GOTO lbl271
            }
            case 3: {
                var10_23 = "/mow.mid";
                ** GOTO lbl271
            }
            case 4: {
                var10_23 = "/sandman.mid";
                ** GOTO lbl271
            }
            case 5: {
                var10_23 = "/shop.mid";
                ** GOTO lbl271
            }
            case 6: {
                var10_23 = "/universe.mid";
                ** GOTO lbl271
            }
            case 7: {
                var10_23 = "/fly.mid";
                ** GOTO lbl271
            }
            case 8: 
        }
        var10_23 = "/bonus.mid";
        ** while (true)
    }

    /*
     * Handled duff style switch with additional control
     * Enabled aggressive block sorting
     */
    private final boolean al() {
        boolean bl;
        boolean bl2;
        block7: {
            boolean bl3 = false;
            boolean bl4 = false;
            bl2 = bl3;
            bl = bl4;
            int n = Integer.MIN_VALUE;
            block6: do {
                switch (n == Integer.MIN_VALUE ? this.ea : n) {
                    default: {
                        bl = bl4;
                        bl2 = bl3;
                        n = 4;
                        continue block6;
                    }
                    case 0: 
                    case 1: {
                        bl = true;
                        bl2 = bl3;
                    }
                    case 4: {
                        break block7;
                    }
                    case 2: 
                    case 5: {
                        this.a();
                        this.b("/title.mid");
                        break;
                    }
                    case 3: 
                }
                break;
            } while (true);
            this.c((byte)0, (byte)-1);
            bl2 = true;
            bl = bl4;
        }
        if (!bl) return bl2;
        this.am();
        return true;
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

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final boolean an() {
        boolean bl = false;
        if (this.dQ == 0) {
            boolean bl2;
            if (this.N) {
                this.N = false;
                bl2 = bl;
                if (this.et <= 0) return bl2;
                this.et -= 2;
                if (this.et >= 0) return true;
                this.et = 0;
                return true;
            }
            if (this.O) {
                this.O = false;
                bl2 = bl;
                if (this.et >= this.eu) return bl2;
                this.et += 2;
                if (this.et <= this.eu) return true;
                this.et = this.eu;
                return true;
            }
            if (!this.S && !this.T) {
                bl2 = bl;
                if (!this.R) return bl2;
            }
            this.R = false;
            this.T = false;
            this.S = false;
            this.a(false, 0);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                default: {
                    return true;
                }
                case 0: 
            }
            this.ao();
            return true;
        }
        this.dQ = (byte)0;
        return true;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void ao() {
        if (this.ez == -1) {
            this.x = this.eq;
            this.dW = this.ey;
            this.b(true, -1);
            this.a(true, -1);
            return;
        }
        if (this.ez != 0) return;
        this.ah();
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void ap() {
        this.I = (short)(this.I + this.bX);
        this.eg = (byte)0;
        this.d(false);
        if (this.c == 1) {
            this.a("/cleared.mid", (int)this.bt, false);
        }
        this.b(false, -1);
        if (this.bU != 11 && this.bU != 12) {
            int n = 2 + this.a[48].length();
            int n2 = (int)this.bZ / 1000;
            int n3 = n2 / 60;
            n2 -= n3 * 60;
            StringBuffer stringBuffer = new StringBuffer(100);
            stringBuffer.append(this.a[44]);
            stringBuffer.append("##");
            stringBuffer.append(this.a[45]);
            int n4 = stringBuffer.length();
            if (n3 <= 9) {
                stringBuffer.append('0');
            }
            stringBuffer.append(n3);
            stringBuffer.append(':');
            if (n2 <= 9) {
                stringBuffer.append('0');
            }
            stringBuffer.append(n2);
            this.a(stringBuffer, "", n - (stringBuffer.length() - n4), ' ', false);
            stringBuffer.append("#");
            stringBuffer.append(this.a[46]);
            n3 = stringBuffer.length();
            stringBuffer.append(this.bX);
            stringBuffer.append(this.a[48]);
            stringBuffer.append(this.bY);
            this.a(stringBuffer, "", n - (stringBuffer.length() - n3), ' ', false);
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

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final boolean aq() {
        if (this.ce > 0) return true;
        if (this.en != null && (this.S || this.R)) {
            this.R = false;
            this.T = false;
            this.S = false;
            this.f(true);
            return true;
        }
        if (this.en != null) return false;
        this.f(true);
        return true;
    }

    private final void ar() {
        this.a(this.a[this.eC[this.eB]], this.i + 12, (byte)-1);
        this.x = 8;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final boolean as() {
        boolean bl = false;
        if (this.Q) {
            this.Q = false;
            this.eB = (byte)(this.eB + 1);
            if (this.eB >= this.eC.length) {
                this.eB = (byte)0;
            }
            this.et = 0;
            this.eA = this.a[this.eC[this.eB]];
            this.ev = this.u;
            this.a(null, 0, 0, true, true, true, true);
            bl = true;
            return bl | this.an();
        }
        if (!this.P) return bl | this.an();
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
        return bl | this.an();
    }

    /*
     * Enabled aggressive block sorting
     */
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
                if (this.et <= 0) return false;
                this.et -= 2;
                if (this.et >= 0) return true;
                this.et = 0;
                return true;
            }
            if (!this.O) return false;
            this.O = false;
            if (this.et >= this.eu) return false;
            this.et += 2;
            if (this.et <= this.eu) return true;
            this.et = this.eu;
            return true;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.g(true);
                }
                default: {
                    return true;
                }
                case 1: {
                    this.g(false);
                    return true;
                }
            }
        } else {
            this.dQ = (byte)0;
        }
        return true;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final byte b(byte by) {
        switch (by) {
            default: {
                return by;
            }
            case -93: {
                by = (byte)-92;
                return by;
            }
            case -92: {
                by = (byte)-93;
                return by;
            }
            case -71: {
                by = (byte)-68;
                return by;
            }
            case -70: {
                by = (byte)-71;
                return by;
            }
            case -69: {
                by = (byte)-70;
                return by;
            }
            case -68: {
                by = (byte)-69;
                return by;
            }
            case -67: {
                by = (byte)-66;
                return by;
            }
            case -66: 
        }
        by = (byte)-67;
        return by;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final byte b(int n, int n2) {
        if (n < 0) return (byte)n;
        n = -1;
        if (n2 < 0) return (byte)n;
        if (n >= this.dw) return (byte)n;
        if (n2 < this.dx) return (byte)(n = this.cu[n2][n]);
        return (byte)n;
    }

    private final int b(int n) {
        int n2;
        int n3 = n2 = this.z.nextInt();
        if (n2 < 0) {
            n3 = -n2;
        }
        return n3 % n;
    }

    private final void b(byte by, byte by2) {
        if (this.dr >= 5) {
            this.cv[this.dm[0]][this.dl[0]] = (byte)-1;
            for (int i = 0; i < this.dr - 1; ++i) {
                this.dl[i] = this.dl[i + 1];
                this.dm[i] = this.dm[i + 1];
                this.dn[i] = this.dn[i + 1];
            }
            --this.dr;
        }
        this.dl[this.dr] = by;
        this.dm[this.dr] = by2;
        this.dn[this.dr] = (byte)6;
        ++this.dr;
        this.cv[by2][by] = (byte)-28;
        this.f(this.bI, this.bJ);
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void b(int n, int n2, boolean bl) {
        this.dy = n;
        this.dz = n2;
        this.dG = bl;
        this.dA = (n + this.h - 1) / this.h;
        this.dB = (n2 + this.i - 1) / this.i;
        n = !this.dG ? 3 : 1;
        this.dE = this.dA + n;
        this.dF = this.dB + n;
        this.dC = this.dE * this.h;
        this.dD = this.dF * this.i;
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

    private final void b(String string) {
        if (this.c == 1) {
            this.a(string, (int)this.bt, true);
        }
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void b(Graphics graphics) {
        int n;
        int n2;
        if (this.bV != 0) {
            long l = !this.cb ? System.currentTimeMillis() - this.ca + this.bZ : this.bZ;
            long l2 = l;
            if (this.cV) {
                if (this.df) {
                    l2 = l = 60000L - l;
                    if (l < 0L) {
                        l2 = 0L;
                    }
                } else {
                    l2 = 60000L;
                }
            }
            this.a(graphics, 2, 2, (int)l2 / 60000, 2);
            n2 = 2 + 32;
            n = (int)(l2 % 60000L) / 1000;
            this.a(graphics, n2, 2, n, 2);
            if (this.cb || n % 2 == 0) {
                n = n2 - 6;
                graphics.setClip(n, 2, 5, 13);
                graphics.drawImage(this.ck, n - 120, 2, 20);
            }
            n2 = this.u;
            n = this.cU ? 40 : 31;
            n2 = n2 - n - 2;
            n = this.cU ? 40 : 31;
            if (this.cU) {
                // empty if block
            }
            graphics.setClip(n2, 2, n, 38);
            Image image = this.cm;
            n = this.cU ? 42 : 216;
            graphics.drawImage(image, n2 - n, 2, 20);
            n = this.cU ? 40 : 31;
            this.a(graphics, n2 - 28, 2 + (n - 13 >> 1), this.cC, 2);
        }
        if (this.dV) {
            n = this.u - 42 >> 1;
            graphics.setClip(n, 2, 42, 38);
            graphics.drawImage(this.cm, n + 0, 2, 20);
        }
        if (this.bV != 0) {
            n2 = this.u;
            if (this.cU) {
                // empty if block
            }
            int n3 = 2 + (38 + 2);
            n = n2;
            if (this.cX) {
                n = n2 - 41;
                graphics.setClip(n, n3, 39, 37);
                graphics.drawImage(this.cm, n - 82, n3, 20);
            }
            n2 = n;
            if (this.cY) {
                n2 = n - 38;
                graphics.setClip(n2, n3, 36, 36);
                graphics.drawImage(this.cm, n2 - 143, n3, 20);
            }
            n = n2;
            if (this.cZ) {
                n = n2 - 39;
                graphics.setClip(n, n3, 37, 38);
                graphics.drawImage(this.cm, n - 179, n3, 20);
            }
            n2 = n;
            if (this.cD > 0) {
                n2 = n - 37;
                graphics.setClip(n2, n3, 35, 36);
                graphics.drawImage(this.cm, n2 - 247, n3, 20);
            }
            if (this.de || this.D[2] > 0) {
                n = n2 - 24;
                graphics.setClip(n, n3, 22, 35);
                graphics.drawImage(this.cm, n - 121, n3, 20);
            }
        }
    }

    private final void b(Graphics graphics, int n, int n2) {
        for (int i = 0; i < this.cB; ++i) {
            int n3 = this.cE[i] & 0xFF;
            int n4 = n3 >> 4;
            int n5 = this.i;
            int n6 = this.h;
            short s = this.cI[i];
            short s2 = this.cJ[i];
            this.b(graphics, this.co, (n3 - (n4 << 4)) * n6, n4 * n5, this.h, this.i, s - n, s2 - n2);
        }
    }

    private final void b(Graphics graphics, Image image, int n, int n2, int n3, int n4, int n5, int n6) {
        graphics.setClip(n5, n6, n3, n4);
        graphics.drawImage(image, n5 - n, n6 - n2, 20);
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void b(boolean bl, int n) {
        this.cc = 0;
        int n2 = bl ? 1 : 2;
        this.ce = (byte)n2;
        this.cd = n;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final boolean b(int n, int n2, int n3, int n4) {
        int n5 = this.h;
        int n6 = this.h;
        int n7 = this.i;
        int n8 = this.i;
        if (n2 + n7 - 1 < n4) {
            return false;
        }
        if (n2 > n4 + n8 - 1) {
            return false;
        }
        if (n + n5 - 1 < n3) {
            return false;
        }
        if (n <= n3 + n6 - 1) return true;
        return false;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final boolean b(boolean bl) {
        this.al = null;
        this.am = null;
        boolean bl2 = false;
        switch (this.ao) {
            default: {
                break;
            }
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

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final byte c(byte by) {
        switch (by) {
            default: {
                return by;
            }
            case -79: {
                by = (byte)-78;
                return by;
            }
            case -78: {
                by = (byte)-76;
                return by;
            }
            case -77: {
                by = (byte)-79;
                return by;
            }
            case -76: 
        }
        by = (byte)-77;
        return by;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final byte c(int n, int n2) {
        if (n < 0) return (byte)n;
        n = -1;
        if (n2 < 0) return (byte)n;
        if (n >= this.dw) return (byte)n;
        if (n2 < this.dx) return (byte)(n = this.cv[n2][n]);
        return (byte)n;
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

    /*
     * Unable to fully structure code
     * Could not resolve type clashes
     */
    private final void c(byte var1_1, byte var2_2) {
        block36: {
            var3_3 = 0;
            var4_4 = 0;
            var5_5 = 0;
            var6_6 = 0;
            var7_7 = 0;
            var8_8 = 0;
            var9_9 = 0;
            var10_10 = -1;
            this.ea = (byte)var1_1;
            this.ef = (byte)var2_2;
            if (!this.dW) {
                if (!this.dU) {
                    this.l();
                }
                this.d(false);
                this.dW = true;
            }
            this.dY = new String[20];
            this.dZ = new short[20];
            this.ee = (byte)false;
            this.eb = (byte)false;
            block0 : switch (var1_1) {
                default: {
                    var6_6 = var10_10;
                    var1_1 = var9_9;
lbl24:
                    // 8 sources

                    while (true) {
                        this.ec = (byte)var1_1;
                        this.ej = this.w - Math.min(this.ed, var1_1) * 31 >> 1;
                        if (this.eb >= var1_1) {
                            this.eb = (byte)(var1_1 - 1);
                        }
                        if (this.ee > this.eb) {
                            this.ee = this.eb;
                        }
                        if (this.eb >= this.ee + this.ed) {
                            this.ee = (byte)(this.eb - this.ed + 1);
                        }
                        if (var6_6 != -1) break block0;
                        var2_2 = 0;
lbl35:
                        // 2 sources

                        while (true) {
                            this.ek = var2_2;
                            for (var2_2 = 0; var2_2 < var1_1; ++var2_2) {
                                var6_6 = this.dY[var2_2].length();
                                if (var6_6 <= this.ek) continue;
                                this.ek = var6_6;
                            }
                            break block36;
                            break;
                        }
                        break;
                    }
                }
                case 0: {
                    var2_2 = 0;
                    while (true) {
                        var1_1 = var3_3;
                        if (var2_2 >= 4) ** GOTO lbl53
                        if (this.A[var2_2] <= 0) ** GOTO lbl109
                        this.dY[var9_9] = this.a[1];
                        var11_11 /* !! */  = this.dZ;
                        var1_1 = var9_9 + 1;
                        var11_11 /* !! */ [var9_9] = (short)true;
lbl53:
                        // 2 sources

                        this.dY[var1_1] = this.a[0];
                        var11_11 /* !! */  = this.dZ;
                        var2_2 = var1_1 + 1;
                        var11_11 /* !! */ [var1_1] = (short)false;
                        this.dY[var2_2] = this.a[22];
                        var11_11 /* !! */  = this.dZ;
                        var1_1 = var2_2 + 1;
                        var11_11 /* !! */ [var2_2] = (short)20;
                        this.dY[var1_1] = this.a[23];
                        var11_11 /* !! */  = this.dZ;
                        var2_2 = var1_1 + 1;
                        var11_11 /* !! */ [var1_1] = (short)14;
                        var1_1 = var2_2;
                        if (this.M[0].length() > 0) {
                            this.dY[var2_2] = this.a[24];
                            var11_11 /* !! */  = this.dZ;
                            var1_1 = var2_2 + 1;
                            var11_11 /* !! */ [var2_2] = (short)15;
                        }
                        this.dY[var1_1] = this.a[18];
                        var11_11 /* !! */  = this.dZ;
                        var2_2 = var1_1 + 1;
                        var11_11 /* !! */ [var1_1] = (short)10;
                        var12_12 = this.dY;
                        var11_11 /* !! */  = (short[])new StringBuffer().append(this.a[4]);
                        var13_13 = this.a;
                        if (this.c != 1) break;
                        var1_1 = 2;
lbl80:
                        // 2 sources

                        while (true) {
                            var12_12[var2_2] = var11_11 /* !! */ .append((String)var13_13[var1_1]).toString();
                            var11_11 /* !! */  = this.dZ;
                            var1_1 = var2_2 + 1;
                            var11_11 /* !! */ [var2_2] = (short)11;
                            this.dY[var1_1] = new StringBuffer().append(this.a[5]).append(this.bt).toString();
                            var11_11 /* !! */  = this.dZ;
                            var2_2 = var1_1 + 1;
                            var11_11 /* !! */ [var1_1] = (short)13;
                            var1_1 = var2_2;
                            if (this.D[3] > 0) {
                                this.dY[var2_2] = this.a[6];
                                var11_11 /* !! */  = this.dZ;
                                var1_1 = var2_2 + 1;
                                var11_11 /* !! */ [var2_2] = (short)16;
                            }
                            this.dY[var1_1] = this.a[17];
                            var11_11 /* !! */  = this.dZ;
                            var2_2 = var1_1 + 1;
                            var11_11 /* !! */ [var1_1] = (short)12;
                            this.dY[var2_2] = this.a[19];
                            var11_11 /* !! */  = this.dZ;
                            var6_6 = var2_2 + 1;
                            var11_11 /* !! */ [var2_2] = (short)3;
                            this.dY[var6_6] = this.a[21];
                            var11_11 /* !! */  = this.dZ;
                            var1_1 = var6_6 + 1;
                            var11_11 /* !! */ [var6_6] = (short)4;
                            var6_6 = var10_10;
                            ** GOTO lbl24
                            break;
                        }
lbl109:
                        // 1 sources

                        var2_2 = var2_2 + 1;
                    }
                    var1_1 = 3;
                    ** continue;
                }
                case 1: {
                    var1_1 = var5_5;
                    if (this.bV == 0) ** GOTO lbl157
                    var2_2 = var4_4;
                    if (this.C) {
                        this.dY[var9_9] = "CHEAT!";
                        var11_11 /* !! */  = this.dZ;
                        var2_2 = var9_9 + 1;
                        var11_11 /* !! */ [var9_9] = (short)99;
                    }
                    var1_1 = var2_2;
                    if (this.D[5] <= 0) ** GOTO lbl134
                    var12_12 = this.dY;
                    var13_13 = new StringBuffer().append(this.a[87]);
                    var11_11 /* !! */  = (short[])this.a;
                    if (!this.F) ** GOTO lbl189
                    var1_1 = 2;
lbl129:
                    // 2 sources

                    while (true) {
                        var12_12[var2_2] = var13_13.append((String)var11_11 /* !! */ [var1_1]).toString();
                        var11_11 /* !! */  = this.dZ;
                        var1_1 = var2_2 + 1;
                        var11_11 /* !! */ [var2_2] = (short)30;
lbl134:
                        // 2 sources

                        var2_2 = var1_1;
                        if (this.D[6] <= 0) ** GOTO lbl146
                        var13_13 = this.dY;
                        var12_12 = new StringBuffer().append(this.a[88]);
                        var11_11 /* !! */  = (short[])this.a;
                        if (!this.E) ** GOTO lbl191
                        var2_2 = 2;
lbl141:
                        // 2 sources

                        while (true) {
                            var13_13[var1_1] = var12_12.append((String)var11_11 /* !! */ [var2_2]).toString();
                            var11_11 /* !! */  = this.dZ;
                            var2_2 = var1_1 + 1;
                            var11_11 /* !! */ [var1_1] = (short)31;
lbl146:
                            // 2 sources

                            var1_1 = var2_2;
                            if (!this.dg) {
                                this.dY[var2_2] = this.a[27];
                                var11_11 /* !! */  = this.dZ;
                                var1_1 = var2_2 + 1;
                                var11_11 /* !! */ [var2_2] = (short)6;
                            }
                            this.dY[var1_1] = this.a[18];
                            var11_11 /* !! */  = this.dZ;
                            var2_2 = var1_1 + 1;
                            var11_11 /* !! */ [var1_1] = (short)10;
                            var1_1 = var2_2;
lbl157:
                            // 2 sources

                            var12_12 = this.dY;
                            var13_13 = new StringBuffer().append(this.a[4]);
                            var11_11 /* !! */  = (short[])this.a;
                            if (this.c != 1) ** GOTO lbl193
                            var2_2 = 2;
lbl162:
                            // 2 sources

                            while (true) {
                                var12_12[var1_1] = var13_13.append((String)var11_11 /* !! */ [var2_2]).toString();
                                var11_11 /* !! */  = this.dZ;
                                var2_2 = var1_1 + 1;
                                var11_11 /* !! */ [var1_1] = (short)11;
                                var1_1 = var2_2;
                                var6_6 = var10_10;
                                if (this.bV == 0) ** GOTO lbl183
                                var1_1 = var2_2;
                                var6_6 = var10_10;
                                if (this.D[4] <= 0) ** GOTO lbl183
                                var12_12 = this.dY;
                                var13_13 = new StringBuffer().append(this.a[89]);
                                if (this.H == -1) ** GOTO lbl195
                                var11_11 /* !! */  = (short[])Integer.toString(this.H + 1);
lbl177:
                                // 2 sources

                                while (true) {
                                    var12_12[var2_2] = var13_13.append((String)var11_11 /* !! */ ).toString();
                                    var11_11 /* !! */  = this.dZ;
                                    var1_1 = var2_2 + 1;
                                    var11_11 /* !! */ [var2_2] = (short)32;
                                    var6_6 = this.a[89].length() + this.a[90].length();
lbl183:
                                    // 3 sources

                                    this.dY[var1_1] = this.a[20];
                                    var11_11 /* !! */  = this.dZ;
                                    var2_2 = var1_1 + 1;
                                    var11_11 /* !! */ [var1_1] = (short)8;
                                    var1_1 = var2_2;
                                    ** GOTO lbl24
                                    break;
                                }
                                break;
                            }
                            break;
                        }
                        break;
                    }
lbl189:
                    // 1 sources

                    var1_1 = 3;
                    ** continue;
lbl191:
                    // 1 sources

                    var2_2 = 3;
                    ** continue;
lbl193:
                    // 1 sources

                    var2_2 = 3;
                    ** continue;
lbl195:
                    // 1 sources

                    var11_11 /* !! */  = (short[])this.a[90];
                    ** continue;
                }
                case 2: {
                    var2_2 = 0;
                    var1_1 = 0;
                    while ((var1_1 = (int)"DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(59, var1_1)) != -1) {
                        var2_2 = var2_2 + 1;
                        var1_1 = var1_1 + 1;
                    }
                    var3_3 = 0;
                    var9_9 = 0;
                    var1_1 = var6_6;
                    while (true) {
                        var1_1 = var7_7 = var1_1;
                        var6_6 = var10_10;
                        if (var9_9 >= var2_2) ** GOTO lbl24
                        var1_1 = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(61, var3_3);
                        this.dY[var7_7] = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(var3_3, var1_1);
                        var6_6 = var1_1 + 1;
                        var11_11 /* !! */  = this.dZ;
                        var1_1 = var7_7 + 1;
                        var11_11 /* !! */ [var7_7] = (short)var6_6;
                        var3_3 = "DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".indexOf(59, var6_6);
                        if (this.y.compareTo("DEUTSCH=DE;ENGLISH=EN;FRAN\u00c7AIS=FR;ITALIANO=IT;ESPA\u00d1OL=SP;PORTUGU\u00caS=PG;".substring(var6_6, var3_3)) == 0) {
                            this.eb = (byte)var9_9;
                        }
                        ++var3_3;
                        ++var9_9;
                    }
                }
                case 3: {
                    var3_3 = 0;
                    var1_1 = 1;
                    var9_9 = var7_7;
                    var7_7 = var1_1;
                    while (true) {
                        var1_1 = var9_9;
                        var6_6 = var10_10;
                        if (var7_7 > 4) ** GOTO lbl24
                        if (var2_2 == 0) ** GOTO lbl237
                        var1_1 = var9_9;
                        if (var2_2 != 1) ** GOTO lbl241
                        var1_1 = var9_9;
                        if (this.A[var3_3] <= 0) ** GOTO lbl241
lbl237:
                        // 2 sources

                        this.dY[var9_9] = this.cz[var3_3];
                        var11_11 /* !! */  = this.dZ;
                        var1_1 = var9_9 + 1;
                        var11_11 /* !! */ [var9_9] = (short)var7_7;
lbl241:
                        // 3 sources

                        ++var3_3;
                        ++var7_7;
                        var9_9 = var1_1;
                    }
                }
                case 4: {
                    var2_2 = var8_8;
                    if (this.D[0] > 0) {
                        this.dY[var9_9] = this.a[25];
                        var11_11 /* !! */  = this.dZ;
                        var2_2 = var9_9 + 1;
                        var11_11 /* !! */ [var9_9] = (short)true;
                    }
                    var1_1 = var2_2;
                    var6_6 = var10_10;
                    if (this.D[1] <= 0) ** GOTO lbl24
                    this.dY[var2_2] = this.a[26];
                    var11_11 /* !! */  = this.dZ;
                    var1_1 = var2_2 + 1;
                    var11_11 /* !! */ [var2_2] = (short)2;
                    var6_6 = var10_10;
                    ** GOTO lbl24
                }
                case 5: {
                    this.dY[var9_9] = this.a[7];
                    var11_11 /* !! */  = this.dZ;
                    var2_2 = var9_9 + 1;
                    var11_11 /* !! */ [var9_9] = (short)false;
                    this.dY[var2_2] = this.a[8];
                    var11_11 /* !! */  = this.dZ;
                    var1_1 = var2_2 + 1;
                    var11_11 /* !! */ [var2_2] = (short)true;
                    this.dY[var1_1] = this.a[9];
                    var11_11 /* !! */  = this.dZ;
                    var2_2 = var1_1 + 1;
                    var11_11 /* !! */ [var1_1] = (short)2;
                    this.dY[var2_2] = this.a[12];
                    var11_11 /* !! */  = this.dZ;
                    var1_1 = var2_2 + 1;
                    var11_11 /* !! */ [var2_2] = (short)3;
                    this.dY[var1_1] = this.a[13];
                    var11_11 /* !! */  = this.dZ;
                    var6_6 = var1_1 + 1;
                    var11_11 /* !! */ [var1_1] = (short)4;
                    this.dY[var6_6] = this.a[14];
                    var11_11 /* !! */  = this.dZ;
                    var2_2 = var6_6 + 1;
                    var11_11 /* !! */ [var6_6] = (short)5;
                    this.dY[var2_2] = this.a[15];
                    var11_11 /* !! */  = this.dZ;
                    var1_1 = var2_2 + 1;
                    var11_11 /* !! */ [var2_2] = (short)6;
                    this.dY[var1_1] = this.a[16];
                    var11_11 /* !! */  = this.dZ;
                    var2_2 = var1_1 + 1;
                    var11_11 /* !! */ [var1_1] = (short)7;
                    this.dY[var2_2] = this.a[10];
                    var11_11 /* !! */  = this.dZ;
                    var6_6 = var2_2 + 1;
                    var11_11 /* !! */ [var2_2] = (short)8;
                    this.dY[var6_6] = this.a[11];
                    var11_11 /* !! */  = this.dZ;
                    var1_1 = var6_6 + 1;
                    var11_11 /* !! */ [var6_6] = (short)9;
                    var6_6 = var10_10;
                    ** continue;
                }
            }
            var2_2 = var6_6;
            ** while (true)
        }
        this.ek = (this.ek + 1) * 12 + 10;
        if (this.ea == 2) {
            this.el = (this.u - this.ek >> 1) - 27;
            this.ek += 78;
lbl311:
            // 3 sources

            while (true) {
                this.ek = Math.max((this.u << 1) / 3, this.ek);
                this.a(true, -1);
                return;
            }
        }
        if (this.ea != 3) ** GOTO lbl311
        this.el = (this.u - this.ek >> 1) - 31;
        this.em = this.u - this.el - 31;
        this.ek += 86;
        ** while (true)
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void c(int by) {
        byte by2;
        int n;
        byte by3;
        byte by4;
        byte by5;
        byte by6;
        int n2;
        switch (by) {
            default: {
                byte by7;
                byte by8 = 90;
                n2 = 89;
                by = (byte)88;
                byte by9 = 87;
                byte by10 = -91;
                by6 = by7 = -90;
                by5 = by10;
                by4 = by9;
                by3 = by;
                n = n2;
                by2 = by8;
                break;
            }
            case 0: {
                byte by10 = -73;
                n2 = -72;
                byte by9 = -75;
                byte by7 = -74;
                byte by8 = -95;
                by = (byte)-94;
                by2 = by10;
                n = n2;
                by3 = by9;
                by4 = by7;
                by5 = by8;
                by6 = by;
            }
        }
        for (by = 0; by < this.dx; by = (byte)(by + 1)) {
            for (n2 = 0; n2 < this.dw; ++n2) {
                this.cu[by][n2] = this.a(this.cu[by][n2], by2, by3, (byte)n, by4, by5, by6);
            }
        }
        this.f(this.bI, this.bJ);
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
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

    /*
     * Enabled aggressive block sorting
     */
    private final void c(Graphics graphics) {
        int n;
        int n2;
        int n3 = this.cc;
        int n4 = this.cc;
        int n5 = (this.v + this.i - 1) / this.i;
        int n6 = (this.u + this.h - 1) / this.h;
        graphics.setClip(0, 0, this.u, this.v);
        graphics.setColor(0);
        switch (this.ce) {
            case 1: {
                int n7;
                int n8;
                int n9 = (n5 - 1) * this.i;
                int n10 = 0;
                for (n8 = 0; n8 < n6; n10 += this.h, ++n8) {
                    graphics.fillRect(n10, 0, this.h - n4, this.v);
                    n7 = n4 -= 3;
                    if (n4 < 0) {
                        n7 = 0;
                    }
                    n4 = n7;
                }
                n8 = 0;
                n10 = n9;
                n7 = n3;
                for (n3 = n8; n3 < n5; n10 -= this.i, ++n3) {
                    graphics.fillRect(0, n10, this.u, this.i - n7);
                    n7 = n8 = n7 - 3;
                    if (n8 >= 0) continue;
                    n7 = 0;
                }
                if (n7 < this.i) return;
                if (n4 < this.h) return;
                this.ce = (byte)0;
            }
            default: {
                return;
            }
            case 2: 
        }
        int n11 = 0;
        int n12 = (n6 - 1) * this.h;
        for (n2 = 0; n2 < n6; n12 -= this.h, ++n2) {
            graphics.fillRect(n12, 0, n4, this.v);
            n = n4 -= 3;
            if (n4 < 0) {
                n = 0;
            }
            n4 = n;
        }
        n2 = 0;
        n12 = n11;
        n = n3;
        n3 = n2;
        while (true) {
            if (n3 >= n5) {
                if (n < this.i) return;
                if (n4 < this.h) return;
                this.ce = (byte)0;
                return;
            }
            graphics.fillRect(0, n12, this.u, n);
            n = n2 = n - 3;
            if (n2 < 0) {
                n = 0;
            }
            n12 += this.i;
            ++n3;
        }
    }

    private final void c(Graphics graphics, int n, int n2) {
        for (int i = 0; i < 5; ++i) {
            byte by = this.ae[i];
            if (by < 0) continue;
            int n3 = by / 6;
            this.b(graphics, this.ct, 96 + (by - n3 * 6) * 16, 672 + n3 * 16, 16, 16, this.ac[i] - n - 8, this.ad[i] - n2 - 8);
        }
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void c(boolean bl) {
        int n;
        for (int i = 0; i < (n = bl ? 9 : 10); ++i) {
            this.cs[i] = null;
        }
        if (!bl) {
            this.ct = null;
        }
        this.cq = null;
        this.cr = null;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final void d() {
        this.ed = (byte)((this.w - 26) / 31);
        this.C = false;
        this.e();
        String string = this.y;
        this.g();
        if (string.compareTo(this.y) != 0) {
            this.a(new StringBuffer().append(this.y).append(".dat").toString());
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
            return;
        }
        this.R = false;
        this.T = false;
        this.S = false;
        this.x = 11;
        this.c((byte)2, (byte)-1);
    }

    /*
     * Enabled aggressive block sorting
     */
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
                break;
            }
        }
        this.x = 9;
        this.a(null, 0, 0, true, true, true, true);
        this.a(true, -1);
    }

    /*
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
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
            Object object = this.getClass();
            StringBuffer stringBuffer = new StringBuffer();
            Object object2 = n < 10 ? "0" : "";
            object2 = ContextHolder.getResourceAsStream(object, (String)stringBuffer.append((String)object2).append(n).append(".dat").toString());
            object = new DataInputStream((InputStream)object2);
            ((DataInputStream)object).readShort();
            this.cy = ((DataInputStream)object).readByte();
            for (n = 0; n <= n2; ++n) {
                this.cw = ((DataInputStream)object).readUTF();
                this.cx = ((DataInputStream)object).readUTF();
            }
            ((FilterInputStream)object).close();
            return;
        }
        catch (Exception exception) {
            this.c();
            return;
        }
    }

    private final void d(int n, int n2) {
        this.bO = n + this.j - (this.dy >> 1) + this.bM;
        this.bP = n2 + this.k - (this.dz >> 1) + this.bN;
        this.X();
    }

    private final void d(Graphics graphics) {
        int n = 0;
        int n2 = 0;
        int n3 = 0;
        int n4 = this.en.length();
        int n5 = 0;
        int n6 = 0;
        int n7 = n2;
        int n8 = n3;
        int n9 = n5;
        int n10 = n6;
        if (graphics != null) {
            n8 = this.u;
            n7 = this.eo;
            n = this.w - this.ep >> 1;
            this.a(graphics, n8 - n7 >> 1, n, this.eo, this.ep, 22935, 10370);
            n += 6;
            n10 = n6;
            n9 = n5;
            n8 = n3;
            n7 = n2;
        }
        while (n7 < n4) {
            int n11;
            block11: {
                char c;
                block10: {
                    c = this.en.charAt(n7);
                    if (c == '#') break block10;
                    n6 = n;
                    n11 = n7;
                    n3 = n8;
                    n5 = n9;
                    n2 = n10;
                    if (n7 != n4 - 1) break block11;
                }
                n6 = n7;
                if (c != '#') {
                    n6 = n7 + 1;
                }
                n2 = n6 - n8;
                n7 = n9;
                if (n2 > n9) {
                    n7 = n2;
                }
                n9 = n;
                if (graphics != null) {
                    n9 = this.u - n2 * 12 >> 1;
                    while (n8 < n6) {
                        this.a(graphics, n9, n, this.en.charAt(n8));
                        n9 += 12;
                        ++n8;
                    }
                    n9 = n + this.g;
                }
                n3 = n6 + 1;
                n2 = n10 + 1;
                n5 = n7;
                n11 = n6;
                n6 = n9;
            }
            n7 = n11 + 1;
            n = n6;
            n8 = n3;
            n9 = n5;
            n10 = n2;
        }
        if (graphics == null) {
            this.eo = n9 * 12 + 16;
            this.ep = n10 * this.g + 10;
        }
    }

    private final void d(Graphics graphics, int n, int n2) {
        if (this.dJ != null) {
            int n3 = 0;
            int n4 = 0;
            int n5 = n % this.dC;
            int n6 = n2 % this.dD;
            n = n3;
            if (n5 + this.dy > this.dC) {
                n = 1;
            }
            n2 = n4;
            if (n6 + this.dz > this.dD) {
                n2 = 1;
            }
            graphics.drawImage(this.dJ, -n5, -n6, 20);
            if (n != 0) {
                graphics.drawImage(this.dJ, this.dC - n5, -n6, 20);
            }
            if (n2 != 0) {
                graphics.drawImage(this.dJ, -n5, this.dD - n6, 20);
            }
            if (n != 0 && n2 != 0) {
                graphics.drawImage(this.dJ, this.dC - n5, this.dD - n6, 20);
            }
        }
    }

    private final void d(boolean bl) {
        this.dX = bl;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final int e(int n) {
        switch (this.dQ) {
            default: {
                return this.dS[18 - this.dP] * n >> 8;
            }
            case 0: {
                return 0;
            }
            case 1: 
        }
        return this.dS[this.dP] * n >> 8;
    }

    /*
     * Unable to fully structure code
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    private final void e() {
        this.f = false;
        var1_1 /* !! */  = null;
        var2_3 = -1;
        try {
            var1_1 /* !! */  = var3_4 = RecordStore.openRecordStore((String)"BC5Data", (boolean)true);
            var4_6 = var3_4.getNumRecords();
            var1_1 /* !! */  = var3_4;
        }
        catch (Exception var3_5) {
            var4_6 = var2_3;
        }
        var3_4 = var1_1 /* !! */ ;
        if (var4_6 == 1) ** GOTO lbl47
        this.f = true;
        var3_4 = var1_1 /* !! */ ;
        if (var4_6 != 0) {
            if (var1_1 /* !! */  != null) {
                var1_1 /* !! */ .closeRecordStore();
            }
            RecordStore.deleteRecordStore((String)"BC5Data");
            var3_4 = RecordStore.openRecordStore((String)"BC5Data", (boolean)true);
        }
        for (var4_6 = 0; var4_6 < 4; ++var4_6) {
            this.A[var4_6] = (byte)false;
            this.B[var4_6] = false;
        }
        for (var4_6 = 0; var4_6 < this.D.length; ++var4_6) {
            this.D[var4_6] = (byte)false;
        }
        try {
            this.E = false;
            this.F = false;
            this.H = (byte)false;
            this.I = (short)false;
            this.J = (short)false;
            this.K = 0L;
            this.L = this.z.nextInt();
            for (var4_6 = 0; var4_6 < this.M.length; ++var4_6) {
                this.M[var4_6] = "";
            }
        }
        catch (Exception var1_2) {
            this.c();
            return;
        }
        this.G = false;
        var1_1 /* !! */  = (RecordStore)this.i();
        var3_4.addRecord((byte[])var1_1 /* !! */ , 0, ((RecordStore)var1_1 /* !! */ ).length);
lbl47:
        // 2 sources

        var3_4.closeRecordStore();
    }

    /*
     * Exception decompiling
     */
    private final void e(int var1_1, int var2_2) {
        /*
         * This method has failed to decompile.  When submitting a bug report, please provide this stack trace, and (if you hold appropriate legal rights) the relevant class file.
         * 
         * org.benf.cfr.reader.util.ConfusedCFRException: Back jump on a try block [egrp 13[TRYBLOCK] [18 : 647->655)] java.lang.Exception
         *     at org.benf.cfr.reader.bytecode.analysis.opgraph.Op02WithProcessedDataAndRefs.insertExceptionBlocks(Op02WithProcessedDataAndRefs.java:2283)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysisInner(CodeAnalyser.java:415)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysisOrWrapFail(CodeAnalyser.java:278)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysis(CodeAnalyser.java:201)
         *     at org.benf.cfr.reader.entities.attributes.AttributeCode.analyse(AttributeCode.java:94)
         *     at org.benf.cfr.reader.entities.Method.analyse(Method.java:531)
         *     at org.benf.cfr.reader.entities.ClassFile.analyseMid(ClassFile.java:1055)
         *     at org.benf.cfr.reader.entities.ClassFile.analyseTop(ClassFile.java:942)
         *     at org.benf.cfr.reader.Driver.doJarVersionTypes(Driver.java:257)
         *     at org.benf.cfr.reader.Driver.doJar(Driver.java:139)
         *     at org.benf.cfr.reader.CfrDriverImpl.analyse(CfrDriverImpl.java:76)
         *     at org.benf.cfr.reader.Main.main(Main.java:54)
         */
        throw new IllegalStateException("Decompilation failed");
    }

    /*
     * Handled impossible loop by adding 'first' condition
     * Enabled aggressive block sorting
     */
    private final void e(Graphics graphics) {
        this.a(graphics, 22935, 10370, true, true, true, true);
        int n = this.i + 10;
        int n2 = this.u - this.e(this.u);
        int n3 = n - this.e(n);
        this.a(graphics, this.u - n2 >> 1, n - n3 >> 1, n2, n3, 22935, 10370);
        boolean bl = true;
        while (true) {
            int n4;
            block7: {
                block4: {
                    block6: {
                        int n5;
                        block3: {
                            block5: {
                                if (!bl || (bl = false)) break block3;
                                if (this.dQ != 0) break block4;
                                if (this.eD[this.eB].length != 0) break block5;
                                String string = this.eB == 0 ? this.a[49] : this.a[50];
                                this.a(string, graphics, this.u >> 1, 6 + (this.i - this.g >> 1), true);
                                break block6;
                            }
                            n5 = this.eD[this.eB].length;
                            n2 = this.u - n5 * (this.h + this.l) + this.l >> 1;
                            n4 = this.i;
                            n3 = 0;
                        }
                        if (n3 < n5) break block7;
                    }
                    this.b(graphics, this.cl, 17, 0, 9, 17, 5, n - 17 >> 1);
                    this.b(graphics, this.cl, 26, 0, 9, 17, this.u - 9 - 5, n - 17 >> 1);
                }
                this.a(graphics, null, this.a[29], true);
                return;
            }
            byte by = this.eD[this.eB][n3];
            this.a(graphics, true, by, n2, n - n4 >> 1);
            int n6 = this.h;
            int n7 = by != -24 && by != -40 && by != -39 ? this.l : 0;
            n2 += n6 + n7;
            ++n3;
        }
    }

    /*
     * Enabled aggressive block sorting
     */
    private final boolean e(boolean bl) {
        boolean bl2 = false;
        boolean bl3 = false;
        boolean bl4 = bl2;
        if (this.ea != 0) return bl4;
        bl4 = bl2;
        if (this.dZ[this.eb] != 13) return bl4;
        if (bl && this.bt > 1) {
            bl2 = true;
            this.bt = (byte)(this.bt - 1);
        } else {
            bl2 = bl3;
            if (!bl) {
                bl2 = bl3;
                if (this.bt < 5) {
                    bl2 = true;
                    this.bt = (byte)(this.bt + 1);
                }
            }
        }
        bl4 = bl2;
        if (!bl2) return bl4;
        if (this.c == 1) {
            this.a();
            this.b("/title.mid");
        }
        this.h();
        this.dY[this.eb] = new StringBuffer().append(this.a[5]).append(this.bt).toString();
        return bl2;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final void f() {
        try {
            RecordStore.deleteRecordStore((String)"BC5Data");
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void f(int n, int n2) {
        int n3 = !this.dG ? 1 : 0;
        int n4 = n / this.h - n3;
        int n5 = n2 / this.i - n3;
        n2 = n4 + this.dA + n3;
        int n6 = n5 + this.dB + n3;
        n = n4;
        if (n4 < 0) {
            n = 0;
        }
        n3 = n2;
        if (n2 >= this.dw) {
            n3 = this.dw - 1;
        }
        n2 = n5;
        if (n5 < 0) {
            n2 = 0;
        }
        n5 = n6;
        if (n6 >= this.dx) {
            n5 = this.dx - 1;
        }
        int n7 = this.dE;
        n4 = n2 % this.dF;
        n6 = n2;
        while (n6 <= n5) {
            n2 = n % n7;
            for (int i = n; i <= n3; ++i) {
                int n8;
                this.c(i, n6, n2, n4);
                n2 = n8 = n2 + 1;
                if (n8 < this.dE) continue;
                n2 = 0;
            }
            n2 = ++n4;
            if (n4 >= this.dF) {
                n2 = 0;
            }
            ++n6;
            n4 = n2;
        }
        return;
    }

    /*
     * Handled duff style switch with additional control
     * Enabled aggressive block sorting
     */
    private final void f(boolean bl) {
        this.bW = this.bV;
        int n = this.bU + 1;
        int n2 = this.bV;
        int n3 = 1;
        int n4 = 0;
        int n5 = n;
        int n6 = n2;
        int n7 = n3;
        int n8 = n4;
        int n9 = 0;
        block8: do {
            switch (n9 == 0 ? this.bU : n9) {
                default: {
                    n8 = n4;
                    n7 = n3;
                    n6 = n2;
                    n5 = n;
                    break;
                }
                case 3: {
                    n5 = n;
                    n6 = n2;
                    n7 = n3;
                    n8 = n4;
                    n9 = 4;
                    if (this.i(this.bV, 11)) continue block8;
                    n5 = 11;
                    n6 = n2;
                    n7 = n3;
                    n8 = n4;
                    break;
                }
                case 6: {
                    n5 = n;
                    n6 = n2;
                    n7 = n3;
                    n8 = n4;
                    n9 = 4;
                    if (this.i(this.bV, 12)) continue block8;
                    n5 = 12;
                    n6 = n2;
                    n7 = n3;
                    n8 = n4;
                    break;
                }
                case 11: {
                    n5 = 4;
                    n6 = n2;
                    n7 = n3;
                    n8 = n4;
                    break;
                }
                case 12: {
                    n5 = 7;
                    n6 = n2;
                    n7 = n3;
                    n8 = n4;
                    break;
                }
                case 10: {
                    this.B[this.bV - 1] = true;
                    n8 = 1;
                    if (!this.i(this.bV, 10)) {
                        n6 = 0;
                        n5 = 4;
                        n7 = n3;
                        break;
                    }
                    n7 = 0;
                    n5 = n;
                    n6 = n2;
                }
                case 4: 
                case 5: 
                case 7: 
                case 8: 
                case 9: 
            }
            break;
        } while (true);
        byte[] byArray = this.A;
        n3 = this.bV;
        n8 = n8 == 0 ? n5 : 0;
        byArray[n3 - 1] = (byte)n8;
        this.h();
        if (n7 != 0) {
            this.bV = n6;
            this.bU = n5;
            if (bl) {
                this.j();
            }
            this.ab();
            this.x = 1;
            this.d(true);
            return;
        }
        this.ah();
    }

    /*
     * Unable to fully structure code
     * Could not resolve type clashes
     */
    private final void g() {
        block45: {
            var1_1 = null;
            var2_2 = null;
            var3_3 = null;
            var4_4 = null;
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var1_1;
            var8_16 /* !! */  = var3_3;
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var1_1;
            var8_16 /* !! */  = var3_3;
            var5_5 = var2_2 = (var9_17 /* !! */  = new ByteArrayInputStream(this.a("BC5Data", 1)));
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var3_3;
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var3_3;
            var9_17 /* !! */  = new DataInputStream(var2_2);
            var4_4 = var9_17 /* !! */ ;
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.y = var4_4.readUTF();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.bt = var4_4.readByte();
            for (var10_18 = 0; var10_18 < 4; ++var10_18) {
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
                this.A[var10_18] = var4_4.readByte();
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
                this.B[var10_18] = var4_4.readBoolean();
                continue;
            }
            var10_18 = 0;
            while (true) {
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
                if (var10_18 >= this.D.length) break;
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
                this.D[var10_18] = var4_4.readByte();
                ++var10_18;
                continue;
                break;
            }
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.E = var4_4.readBoolean();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.F = var4_4.readBoolean();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.H = var4_4.readByte();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.I = var4_4.readShort();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.J = var4_4.readShort();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.K = var4_4.readLong();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.L = var4_4.readInt();
            var10_18 = 0;
            while (true) {
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
                if (var10_18 >= this.M.length) break;
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
                this.M[var10_18] = var4_4.readUTF();
                ++var10_18;
                continue;
                break;
            }
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.G = var4_4.readBoolean();
            if (var4_4 == null) break block45;
            try {
                var4_4.close();
            }
            catch (Exception var7_10) {
                ** continue;
            }
        }
lbl135:
        // 2 sources

        while (true) {
            if (var2_2 == null) ** GOTO lbl139
            var2_2.close();
lbl139:
            // 5 sources

            return;
            break;
        }
        catch (Exception var7_11) {
            ** GOTO lbl139
        }
        catch (Exception var7_12) {
            block46: {
                var7_9 = var5_5;
                var8_16 /* !! */  = var6_7 /* !! */ ;
                try {
                    this.c();
                    if (var6_7 /* !! */  == null) break block46;
                }
                catch (Throwable var5_6) {
                    if (var8_16 /* !! */  != null) {
                        var8_16 /* !! */ .close();
                    }
lbl155:
                    // 4 sources

                    while (true) {
                        if (var7_9 != null) {
                            var7_9.close();
                        }
lbl159:
                        // 4 sources

                        throw var5_6;
                    }
                    catch (Exception var6_8) {
                        ** continue;
                    }
                    catch (Exception var7_15) {
                        ** continue;
                    }
                }
                try {
                    var6_7 /* !! */ .close();
                }
                catch (Exception var7_13) {
                    ** continue;
                }
            }
lbl170:
            // 2 sources

            while (true) {
                if (var5_5 == null) ** GOTO lbl139
                var5_5.close();
                break;
            }
            catch (Exception var7_14) {}
            ** continue;
        }
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void g(int n, int n2) {
        int n3 = !this.dG ? 1 : 0;
        int n4 = n / this.h - n3;
        int n5 = n2 / this.i - n3;
        int n6 = n4 + this.dA + n3;
        int n7 = n5 + this.dB + n3;
        n = n4 >= 0 ? n4 : 0;
        n2 = n6 < this.dw ? n6 : this.dw - 1;
        int n8 = this.dF;
        int n9 = this.dF;
        int n10 = n % this.dE;
        n3 = n;
        n = n10;
        while (n3 <= n2) {
            if (n5 >= 0) {
                this.c(n3, n5, n, n5 % n8);
            }
            if (n7 < this.dx) {
                this.c(n3, n7, n, n7 % n9);
            }
            n = n10 = n + 1;
            if (n10 >= this.dE) {
                n = 0;
            }
            ++n3;
        }
        n = n5 >= 0 ? n5 : 0;
        n2 = n7 < this.dx ? n7 : this.dx - 1;
        n5 = this.dE;
        n10 = this.dE;
        n7 = n % this.dF;
        n3 = n;
        n = n7;
        while (n3 <= n2) {
            if (n4 >= 0) {
                this.c(n4, n3, n4 % n5, n);
            }
            if (n6 < this.dw) {
                this.c(n6, n3, n6 % n10, n);
            }
            n = n7 = n + 1;
            if (n7 >= this.dF) {
                n = 0;
            }
            ++n3;
        }
        return;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void g(boolean bl) {
        switch (this.eE) {
            case 0: {
                if (bl) {
                    this.ah();
                    return;
                }
                this.x = 1;
                this.dW = true;
                this.b(true, -1);
                this.a(true, -1);
                return;
            }
            case 1: {
                if (bl) {
                    this.x = 3;
                    this.dW = false;
                    return;
                }
                this.x = 4;
                this.dW = true;
                this.b(true, -1);
                this.a(true, -1);
                return;
            }
            case 2: {
                boolean bl2 = bl;
                this.c = (byte)(bl2 ? 1 : 0);
                this.ah();
                return;
            }
        }
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final int h(int n, int n2) {
        n = (n - 1) * 3;
        if (n2 == 12) {
            ++n;
            return n;
        }
        if (n2 == 10) {
            n += 2;
            return n;
        }
        if (n2 == 11) return n;
        return -1;
    }

    private final void h() {
        this.a("BC5Data", 1, this.i());
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final boolean i(int n, int n2) {
        if ((n = this.h(n, n2)) == -1) {
            return true;
        }
        if ((this.K & 1L << n) == 0L) return false;
        return true;
    }

    /*
     * Unable to fully structure code
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final byte[] i() {
        block46: {
            var1_1 = null;
            var2_2 = null;
            var3_3 /* !! */  = null;
            var4_4 = null;
            var5_5 = null;
            var6_6 = var3_3 /* !! */ ;
            var7_9 /* !! */  = var5_5;
            var8_11 = var2_2;
            var9_17 /* !! */  = var4_4;
            var6_6 = var3_3 /* !! */ ;
            var7_9 /* !! */  = var5_5;
            var8_11 = var2_2;
            var9_17 /* !! */  = var4_4;
            var10_18 = new ByteArrayOutputStream();
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var4_4;
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var4_4;
            var3_3 /* !! */  = new DataOutputStream(var10_18);
            var5_5 = var3_3 /* !! */ ;
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeUTF(this.y);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeByte(this.bt);
            for (var11_19 = 0; var11_19 < 4; ++var11_19) {
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
                var5_5.writeByte(this.A[var11_19]);
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
                var5_5.writeBoolean(this.B[var11_19]);
                continue;
            }
            var11_19 = 0;
            while (true) {
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
                if (var11_19 >= this.D.length) break;
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
                var5_5.writeByte(this.D[var11_19]);
                ++var11_19;
                continue;
                break;
            }
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeBoolean(this.E);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeBoolean(this.F);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeByte(this.H);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeShort(this.I);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeShort(this.J);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeLong(this.K);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeInt(this.L);
            var11_19 = 0;
            while (true) {
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
                if (var11_19 >= this.M.length) break;
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
                var5_5.writeUTF(this.M[var11_19]);
                ++var11_19;
                continue;
                break;
            }
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeBoolean(this.G);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var6_6 = var4_4 = (Object)var10_18.toByteArray();
            if (var5_5 == null) break block46;
            try {
                var5_5.close();
            }
            catch (Exception var8_12) {
                ** continue;
            }
        }
lbl145:
        // 2 sources

        while (true) {
            var8_11 = var6_6;
            if (var10_18 == null) return var8_11;
            var10_18.close();
            return var6_6;
            break;
        }
        catch (Exception var8_13) {
            return var6_6;
        }
        catch (Exception var8_14) {
            block47: {
                var8_11 = var6_6;
                var9_17 /* !! */  = var7_9 /* !! */ ;
                try {
                    this.c();
                    if (var7_9 /* !! */  == null) break block47;
                }
                catch (Throwable var6_8) {
                    if (var9_17 /* !! */  != null) {
                        var9_17 /* !! */ .close();
                    }
lbl164:
                    // 4 sources

                    while (true) {
                        if (var8_11 == null) throw var6_8;
                        var8_11.close();
                        throw var6_8;
                    }
                    catch (Exception var7_10) {
                        ** continue;
                    }
                    catch (Exception var8_16) {
                        throw var6_8;
                    }
                }
                try {
                    var7_9 /* !! */ .close();
                }
                catch (Exception var8_15) {
                    ** continue;
                }
            }
lbl179:
            // 2 sources

            while (true) {
                if (var6_6 == null) return var1_1;
                var6_6.close();
                return var1_1;
            }
            catch (Exception var6_7) {
                return var1_1;
            }
        }
    }

    private final void j() {
        this.x = 6;
        this.repaint();
        this.serviceRepaints();
    }

    private final void k() {
        this.cc += 3;
    }

    private final void l() {
        this.bZ += System.currentTimeMillis() - this.ca;
        this.cb = true;
    }

    private final void m() {
        this.ca = System.currentTimeMillis();
        this.cb = false;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void n() {
        this.cu = null;
        this.cv = null;
        int n = this.u / this.h + 1;
        this.dw = n * 3;
        int n2 = this.dx = this.v / this.i + 1;
        int n3 = this.dw;
        this.cu = new byte[n2][n3];
        n3 = this.dx;
        n2 = this.dw;
        this.cv = new byte[n3][n2];
        this.bJ = 0;
        this.bI = 0;
        n3 = 0;
        while (true) {
            if (n3 >= this.dx) break;
            for (int i = 0; i < n * 2; ++i) {
                n2 = this.b(10);
                n2 = n2 == 9 ? 71 : (n2 >= 7 ? 72 : 73);
                this.cu[n3][i] = (byte)n2;
                this.cv[n3][i] = (byte)-1;
                this.cu[n3][i + n] = (byte)n2;
                this.cv[n3][i + n] = (byte)-1;
            }
            ++n3;
        }
        for (n2 = 0; n2 < this.dx; ++n2) {
            for (n3 = 0; n3 < n; ++n3) {
                this.cu[n2][n3 + n * 2] = this.cu[n2][n3];
                this.cv[n2][n3 + n * 2] = this.cv[n2][n3];
            }
        }
        this.ag();
        this.f(this.bI, this.bJ);
        this.at = this.dw * this.h - 1;
        this.au = this.dx * this.i - 1;
        this.bK = (n << 1) * this.h - 1;
        this.bL = this.au - this.dz;
        if (this.bK < 0) {
            this.bK = 0;
        }
        if (this.bL < 0) {
            this.bL = 0;
        }
        n2 = 0;
        while (n2 < 5) {
            this.ae[n2] = (byte)this.b(8);
            this.ac[n2] = (short)(this.h + this.b(this.u));
            this.ad[n2] = (short)-16;
            ++n2;
        }
        return;
    }

    private final void o() {
        this.bI += 3;
        if (this.bI > this.bK) {
            this.bI -= this.bI / this.h * this.h;
            this.f(this.bI, this.bJ);
        }
        this.g(this.bI, this.bJ);
        for (int i = 0; i < 5; ++i) {
            short s;
            short s2;
            block8: {
                block7: {
                    s = s2 = this.ae[i];
                    if (this.bG == 0) {
                        s = (byte)(s2 + 1);
                    }
                    short s3 = (short)(this.ac[i] - 3);
                    if (s >= 8) break block7;
                    s2 = s3;
                    if (s3 > -16) break block8;
                }
                s = 0;
                s2 = (short)(this.h + this.b(this.u));
                this.ad[i] = (short)this.b(this.v);
            }
            this.ae[i] = (byte)s;
            this.ac[i] = s2;
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
        int n;
        int n2 = n = this.cx.indexOf(35, this.af);
        if (n == -1) {
            n2 = this.cx.length();
        }
        String string = this.cx.substring(this.af, n2);
        this.af = n2 + 1;
        this.eA = string;
        this.et = 0;
        this.er = this.aq + this.i;
        this.es = 0;
        this.ev = this.u;
        this.a(null, 0, 0, false, false, false, true);
        this.aQ = 192;
    }

    /*
     * Enabled aggressive block sorting
     */
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
        if (this.ce == 2) return true;
        this.O();
        this.o();
        return true;
    }

    private final void s() {
        this.eA = new StringBuffer().append(this.a[120]).append(this.J).append(this.a[121]).toString();
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

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final boolean t() {
        if (this.ce != 0) return true;
        if (this.cd == 0) {
            if (this.bV == 0) {
                this.ah();
                return false;
            }
            this.f(true);
            return false;
        }
        if (this.S || this.R) {
            this.R = false;
            this.S = false;
            this.b(false, 0);
            return true;
        }
        if (this.N) {
            this.N = false;
            if (this.et <= 0) return false;
            this.et -= 2;
            if (this.et >= 0) return true;
            this.et = 0;
            return true;
        }
        if (!this.O) return false;
        this.O = false;
        if (this.et >= this.eu) return false;
        this.et += 2;
        if (this.et <= this.eu) return true;
        this.et = this.eu;
        return true;
    }

    /*
     * Enabled aggressive block sorting
     */
    private final void u() {
        this.d(false);
        int n = this.J > 100 ? 100 : (int)this.J;
        this.ag = (byte)n;
        this.ah = new StringBuffer().append(" X ").append(this.ag).toString();
        this.aQ = 256;
        this.eA = new StringBuffer().append("0000 0000 0000 0000##").append(this.a[105]).toString();
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

    /*
     * Enabled aggressive block sorting
     */
    private final void v() {
        int n = 0;
        int n2 = 1;
        while (true) {
            if (n2 > 16) {
                this.eA = new String(this.ai);
                return;
            }
            int n3 = this.b(32);
            char[] cArray = this.ai;
            n3 = n3 < 10 ? (n3 += 48) : n3 - 10 + 65;
            cArray[n] = (char)n3;
            n = n3 = n + 1;
            if (n2 % 4 == 0) {
                n = n3 + 1;
            }
            ++n2;
        }
    }

    /*
     * Enabled aggressive block sorting
     */
    private final boolean w() {
        if (this.ce == 0) {
            if (this.cd == 0) {
                this.y();
                if (this.M[1].length() > 0) {
                    this.ah();
                } else {
                    this.a(new StringBuffer().append(this.a[107]).append(this.ag).append(this.a[108]).toString(), 0, (byte)0);
                }
            } else if (this.aQ > 0) {
                --this.aQ;
                if (this.aQ == 0) {
                    String string = this.x();
                    for (int i = this.M.length - 1; i > 0; --i) {
                        this.M[i] = this.M[i - 1];
                    }
                    this.M[0] = string;
                    this.eA = new StringBuffer().append(string).append("##").append(this.a[106]).toString();
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
        Object object = new byte[10];
        this.a((byte[])object, 0, this.L);
        object[5] = this.ag;
        this.a((byte[])object, 6, (int)System.currentTimeMillis());
        int n = 76;
        for (int i = 0; i < 10; ++i) {
            int n2 = n;
            if (i != 4) {
                n2 = (byte)(n + ~((byte)(object[i] + i)));
            }
            n = n2;
        }
        object[4] = (byte)n;
        object = this.a((byte[])object, ((byte[])object).length << 3);
        return new StringBuffer().append(((String)object).substring(0, 4)).append(' ').append(((String)object).substring(4, 8)).append(' ').append(((String)object).substring(8, 12)).append(' ').append(((String)object).substring(12)).toString();
    }

    private final void y() {
        this.dL = null;
        System.gc();
    }

    private final void z() {
        this.dM = null;
        System.gc();
    }

    /*
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    public final void a() {
        block4: {
            if (this.s == null) break block4;
            try {
                this.s.stop();
                this.s.deallocate();
                this.s.close();
            }
            catch (Throwable throwable) {}
            try {
                Thread.sleep(250L);
            }
            catch (Throwable throwable) {}
            this.s = null;
        }
        this.b = null;
    }

    /*
     * Loose catch block
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    public final void a(String object) {
        FilterInputStream filterInputStream = null;
        FilterInputStream filterInputStream2 = null;
        this.a = null;
        Object object2 = filterInputStream2;
        Object object3 = filterInputStream;
        object2 = filterInputStream2;
        object3 = filterInputStream;
        DataInputStream dataInputStream = new DataInputStream(ContextHolder.getResourceAsStream(this.getClass(), (String)object));
        object2 = object = dataInputStream;
        object3 = object;
        int n = ((DataInputStream)object).readShort();
        object2 = object;
        object3 = object;
        this.a = new String[n];
        for (int i = 0; i < n; ++i) {
            object2 = object;
            object3 = object;
            this.a[i] = ((DataInputStream)object).readUTF();
        }
        if (object == null) return;
        try {
            ((FilterInputStream)object).close();
            return;
        }
        catch (Exception exception) {
            return;
        }
        catch (Exception exception) {
            object3 = object2;
            try {
                this.c();
                if (object2 == null) return;
            }
            catch (Throwable throwable) {
                if (object3 == null) throw throwable;
                try {
                    ((FilterInputStream)object3).close();
                }
                catch (Exception exception2) {
                    throw throwable;
                }
                throw throwable;
            }
            try {
                ((FilterInputStream)object2).close();
                return;
            }
            catch (Exception exception3) {
                return;
            }
        }
    }

    /*
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    public final void a(String string, int n, boolean bl) {
        block11: {
            if (bl) {
                if (this.b != null && this.b.compareTo(string) == 0) {
                    return;
                }
            } else {
                this.b = null;
            }
            this.a();
            Player player = this.s = Manager.createPlayer((InputStream)ContextHolder.getResourceAsStream(this.getClass(), (String)string), (String)"audio/midi");
            int n2 = bl ? -1 : 1;
            player.setLoopCount(n2);
            this.s.realize();
            try {
                player = (VolumeControl)this.s.getControl("VolumeControl");
                if (player == null) break block11;
                n = n > 0 ? n * 25 - (5 - n) * 5 : 0;
            }
            catch (Exception exception) {}
            player.setLevel(n);
        }
        try {
            this.s.prefetch();
            this.s.start();
            this.b = string;
        }
        catch (Exception exception) {
            return;
        }
        try {
            Thread.sleep(250L);
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    /*
     * Unable to fully structure code
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    public final boolean b() {
        try {
            if (this.ce > 0) {
                this.k();
            }
            if (this.dW) {
                if (this.aj() != false) return true;
                if (this.ce > 0) return true;
                return false;
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
                        if (this.ce <= 0) return false;
                        return true;
                    }
                    if (this.eg > 0) {
                        this.eg = (byte)(this.eg - 1);
                    }
                    if (!this.bd && this.aT == 0 && this.aw != 5 && this.R) {
                        this.R = false;
                        var1_1 = this.dV == false;
                        this.dV = var1_1;
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
                    if (this.H() == false) return true;
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
                    if (this.bO == this.bI) {
                        if (this.bP == this.bJ) return true;
                        if (this.aO != 0) return true;
                    }
                    this.Y();
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
                    if (this.ai() != false) return true;
                    if (this.ce > 0) return true;
                    return false;
                }
                case 5: {
                    return this.an();
                }
                case 7: {
                    if (this.aq() != false) return true;
                    if (this.ce > 0) return true;
                    return false;
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
                        if (this.dP >= 0) return true;
                        this.dQ = (byte)false;
                        this.dP = 0;
                        this.ce = (byte)-2;
                        return true;
                    } else if (this.ce == -2) {
                        ++this.aC;
                        if (this.aC < 3) return true;
                        this.aC = 0;
                        ++this.cc;
                        if (this.cc < 3) return true;
                        this.ce = (byte)-3;
                        return true;
                    } else if (this.ce == -3) {
                        ++this.aC;
                        if (this.aC < 40) return true;
                        this.a(false, 0);
                        this.ce = (byte)-4;
                        return true;
                    } else {
                        --this.dP;
                        if (this.dP >= 0) return true;
                        this.dQ = (byte)false;
                        this.dP = 0;
                        this.ce = (byte)false;
                        this.cc = 0;
                        this.dL = null;
                        this.x = 0;
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
lbl138:
            // 2 sources

            return false;
        }
        catch (Throwable var2_2) {
            this.c();
            ** GOTO lbl138
        }
    }

    public void hideNotify() {
        if (this.d) {
            this.d = false;
            if (this.c == 1 && this.x != 16) {
                this.a();
                this.c = (byte)0;
            }
        }
        if (!this.dU) {
            this.U = false;
            this.dU = true;
            this.l();
        }
    }

    /*
     * Enabled aggressive block sorting
     */
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
            return;
        }
        if (n == 56) {
            this.O = true;
            return;
        }
        if (n == 52) {
            this.P = true;
            return;
        }
        if (n == 54) {
            this.Q = true;
            return;
        }
        if (n == 53) {
            this.R = true;
            return;
        }
        if (n == -1) {
            this.N = true;
            return;
        }
        if (n == -2) {
            this.O = true;
            return;
        }
        if (n == -3) {
            this.P = true;
            return;
        }
        if (n == -4) {
            this.Q = true;
            return;
        }
        if (n != -5) return;
        this.R = true;
    }

    /*
     * Enabled aggressive block sorting
     */
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
            return;
        }
        if (n == 56) {
            this.O = false;
            return;
        }
        if (n == 52) {
            this.P = false;
            return;
        }
        if (n == 54) {
            this.Q = false;
            return;
        }
        if (n == 53) {
            this.R = false;
            return;
        }
        if (n == -1) {
            this.N = false;
            return;
        }
        if (n == -2) {
            this.O = false;
            return;
        }
        if (n == -3) {
            this.P = false;
            return;
        }
        if (n == -4) {
            this.Q = false;
            return;
        }
        if (n != -5) return;
        this.R = false;
    }

    /*
     * Unable to fully structure code
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    public final void paint(Graphics var1_1) {
        try {
            switch (this.x) {
                case 1: {
                    this.a(var1_1);
                    ** break;
                }
                case 2: {
                    this.a(var1_1);
                    this.a(var1_1, 22935, 10370, true, false, true, true);
                    this.a(var1_1, this.al, this.am, true);
                    return;
                }
                case 4: {
                    this.d(var1_1, this.bI, this.bJ);
                    this.c(var1_1, 0, 0);
                    this.a(var1_1, 0, 0);
                    var1_1.setClip(0, 0, this.u, this.v);
                    var2_3 = this.w - this.dL.getHeight() - this.i - 72 >> 1;
                    var1_1.drawImage(this.dL, this.u >> 1, var2_3, 17);
                    this.a("EXTRA-LEVELPACK 9", var1_1, this.u >> 1, var2_3 + this.dL.getHeight(), true);
                    if (!this.dW && this.dO) {
                        this.a(var1_1, this.a[81], (byte)3, this.v - (this.g + 10) - 5);
                    }
                    if (this.ce > 0) {
                        this.c(var1_1);
                        ** break;
                    }
                    ** GOTO lbl73
                }
                case 5: {
                    this.a(var1_1, 22935, 10370, true, true, true, true);
                    var3_6 = this.ez == 0 ? this.a[31] : null;
                    var4_8 = this.ez != 0 ? this.a[29] : null;
                    this.a(var1_1, var3_6, var4_8, true);
                    ** break;
                }
                case 6: {
                    var1_1.setClip(0, 0, this.u, this.v);
                    var1_1.setColor(0);
                    var1_1.fillRect(0, 0, this.u, this.v);
                    this.a(var1_1, this.a[38], (byte)0, 0);
                    return;
                }
                case 7: {
                    if (this.ce > 0) {
                        this.a(var1_1);
                    } else {
                        var1_1.setColor(0);
                        var1_1.fillRect(0, 0, this.u, this.v);
                    }
                    if (this.en != null) {
                        this.d(var1_1);
                        this.a(var1_1, this.a[31], null, true);
                        ** break;
                    }
                    ** GOTO lbl73
                }
                case 8: {
                    this.e(var1_1);
                    ** break;
                }
                case 9: {
                    this.a(var1_1, 22935, 10370, true, true, true, true);
                    switch (this.eE) {
                        default: {
                            this.a(var1_1, this.a[30], null, true);
                            ** break;
                        }
                        case 0: 
                        case 1: 
                        case 2: 
                    }
                    this.a(var1_1, this.a[32], this.a[33], true);
                    ** break;
                }
                case 10: {
                    var1_1.setColor(0xFFFFFF);
                    var1_1.fillRect(0, 0, this.u, this.v);
                    var3_7 = this.dL;
                    var5_9 = this.cc;
                    var6_11 = this.u;
                    var2_4 = this.dQ == 1 ? -this.e(this.u) : this.e(this.u);
                    this.b(var1_1, var3_7, 0, var5_9 * 100, 176, 100, (var6_11 - 176 >> 1) + var2_4, this.v - 100 >> 1);
                    ** break;
                }
                case 11: {
                    var1_1.setColor(0);
                    var1_1.fillRect(0, 0, this.u, this.v);
                }
lbl73:
                // 12 sources

                default: {
                    if (this.dW) {
                        this.a(var1_1, true);
                    }
                    if (this.dX == false) return;
                    if (this.ce != 0) return;
                    this.b(var1_1, this.cl, 0, 9, 17, 9, 2, this.v - 9 - 2);
                    return;
                }
                case 12: {
                    var1_1.setClip(0, 0, this.u, this.v);
                    var1_1.setColor(1259130);
                    var1_1.fillRect(0, 0, this.u, this.v);
                    this.b(var1_1, this.dM, 0, 0, 384, 96, 0, 0);
                    this.a(var1_1, this.dM, 0, 96, 384, 37, -(this.aj >> 4), 59);
                    this.b(var1_1, this.dM, 0, 153, 384, 54, 0, 34);
                    this.a(var1_1, this.dM, 0, 133, 384, 20, -(this.ak >> 4), 76);
                    if (this.ce > 0) {
                        this.c(var1_1);
                    }
                    if (this.ec > 0) {
                        this.a(var1_1, true);
                        return;
                    }
                    this.a(var1_1, 22935, 10370, false, false, true, true);
                    this.a(var1_1, null, this.a[29], false);
                    return;
                }
                case 13: {
                    this.d(var1_1, this.bI, this.bJ);
                    this.c(var1_1, 0, 0);
                    var1_1.setClip(0, 0, this.u, this.v);
                    var1_1.drawImage(this.dL, this.u >> 1, this.v, 33);
                    var5_10 = this.u - this.h - ((this.ah.length() - 1) * 12 + 10) >> 1;
                    var2_5 = this.i >> 1;
                    this.a(var1_1, true, (byte)-10, var5_10, var2_5);
                    this.a(this.ah, var1_1, var5_10 + this.h, var2_5 + (this.i - 16 >> 1), false);
                    this.a(var1_1, 22935, 10370, false, false, false, false);
                    if (this.ce <= 0) return;
                    this.c(var1_1);
                    return;
                }
                case 14: {
                    this.d(var1_1, this.bI, this.bJ);
                    this.c(var1_1, 0, 0);
                    if (this.ar == -1) {
                        this.a(var1_1, 0, 0);
                        this.a(var1_1, 22935, 10370, false, false, false, true);
                    } else {
                        this.a(var1_1, true, (byte)-10, this.ar, this.as);
                        this.a(var1_1, 0, 0);
                    }
                    if (this.ce <= 0) return;
                    this.c(var1_1);
                    return;
                }
                case 15: {
                    var1_1.setClip(0, 0, this.u, this.v);
                    var1_1.setColor(1259130);
                    var1_1.fillRect(0, 0, this.u, this.v);
                    this.a(var1_1, 22935, 10370, false, false, true, true);
                    this.a(var1_1, true, (byte)-10, this.u - this.h >> 1, this.i >> 1);
                    if (this.ce > 0) {
                        this.c(var1_1);
                    }
                    this.a(var1_1, this.a[31], null, false);
                    return;
                }
                case 16: 
            }
            this.a(var1_1, 22935, 10370, true, true, true, true);
            this.a(var1_1, this.al, this.am, true);
            return;
        }
        catch (Throwable var1_2) {
            return;
        }
    }

    @Override
    public void run() {
        boolean bl = true;
        while (!this.e) {
            boolean bl2;
            long l = System.currentTimeMillis();
            bl = bl2 = bl | this.b();
            if (this.d) {
                bl = bl2;
                if (bl2) {
                    bl = false;
                    this.repaint();
                    this.serviceRepaints();
                }
            }
            bl2 = bl | this.b();
            l = System.currentTimeMillis() - l + 10L;
            bl = bl2;
            if (l >= 62L) continue;
            try {
                Thread.sleep(62L - l);
                bl = bl2;
            }
            catch (Exception exception) {
                bl = bl2;
            }
        }
        if (this.c == 1) {
            this.a();
        }
        this.t.notifyDestroyed();
    }

    /*
     * Enabled aggressive block sorting
     */
    public void showNotify() {
        if (!this.d && this.dY != null) {
            for (int i = 0; i < this.ec; ++i) {
                if (this.dZ[i] != 11) continue;
                String[] stringArray = this.dY;
                StringBuffer stringBuffer = new StringBuffer().append(this.a[4]);
                String[] stringArray2 = this.a;
                int n = this.c == 1 ? 2 : 3;
                stringArray[i] = stringBuffer.append(stringArray2[n]).toString();
            }
        }
        this.d = true;
    }
}

