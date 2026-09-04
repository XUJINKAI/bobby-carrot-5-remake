# `a.bV` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L525

```java
                this.j();
                if (this.c == 1) {
                    this.a();
                }
                this.bV = 0;
                if (this.dZ[this.eb] != 1) break block26;
                var1_1 = 3;
lbl94:
                // 2 sources
```

## L752

```java
                            this.aE = -1;
                            this.W();
                        }
                    }
                    if (this.bV == 0 && this.bU == 1 && !this.C && this.X) {
                        this.X = false;
                        this.a(8, "DO YOU WANT TO ENABLE THE CHEAT?", this.a[32], this.a[33]);
                        return false;
                    }
```

## L757

```java
                        this.X = false;
                        this.a(8, "DO YOU WANT TO ENABLE THE CHEAT?", this.a[32], this.a[33]);
                        return false;
                    }
                    if (this.bV == 0 && this.bU == 1 && this.ab) {
                        this.ab = false;
                        this.a(11, "DO YOU WANT TO FORMAT THE RMS AND COMPLETELY RESET THE GAME?", this.a[32], this.a[33]);
                        return false;
                    }
```

## L1054

```java
    private final String I() {
        if (this.bi) {
            return "/mow.mid";
        }
        if (this.bV != 0) {
            if (!this.cV) {
                if (this.H == -1) return new StringBuffer().append("/ingame").append(this.b(this.D[4] + 1)).append(".mid").toString();
                return new StringBuffer().append("/ingame").append(this.H).append(".mid").toString();
            }
```

## L1184

```java
            } else if (by2 == -10) {
                this.J = (short)(this.J + 1);
                this.cv[this.as][this.ar] = (byte)-1;
                this.f(this.bI, this.bJ);
                this.a(true, this.bV, this.bU);
                this.I = (short)(this.I + this.bX);
                this.eg = (byte)0;
                this.h();
                this.d(false);
```

## L1706

```java
                    case 6: {
                        if (this.be) {
                            ++this.av;
                            if (this.av < 10) break;
                            if (this.bV != 0) {
                                this.ap();
                                return true;
                            } else if (this.bU == 1) {
                                this.ah();
```

## L1718

```java
                                return true;
                            } else if (this.bU == 5) {
                                this.G = true;
                                this.h();
                                this.bV = this.bW;
                                this.bU = 1;
                                this.aa();
                                this.d(true);
                                return true;
```

## L4146

```java
                return false;
lbl184:
                // 1 sources

                if (this.bV != 0) return false;
                if (this.bU == 1) {
                    this.a(-1, new StringBuffer().append(this.a[100]).append(this.I).append(this.a[101]).toString(), this.a[30], null);
                    return false;
                }
```

## L4297

```java
        this.cS = (short)-1;
        this.dp = -1;
        this.ds = (byte)-1;
        this.cW = false;
        if (this.bV == 0) {
            this.E = false;
            this.F = false;
        }
        this.e(this.bV, this.bU);
```

## L4301

```java
        if (this.bV == 0) {
            this.E = false;
            this.F = false;
        }
        this.e(this.bV, this.bU);
        this.ae();
        if (this.cW) {
            for (n = 0; n < 5; ++n) {
                this.cg[n] = this.b(this.u) << this.r;
```

## L4387

```java
        this.bI = this.bO;
        this.bJ = this.bP;
        this.ag();
        this.f(this.bI, this.bJ);
        if (this.bV != 0) {
            if (this.bU == 11 || this.bU == 12) {
                string = this.a[42];
            } else {
                n = this.bV;
```

## L4391

```java
        if (this.bV != 0) {
            if (this.bU == 11 || this.bU == 12) {
                string = this.a[42];
            } else {
                n = this.bV;
                if (this.bV <= this.ci.length) {
                    n = this.ci[this.bV - 1];
                }
                string = new StringBuffer().append(this.a[39]).append(n).append('-').append(this.bU).toString();
```

## L4392

```java
            if (this.bU == 11 || this.bU == 12) {
                string = this.a[42];
            } else {
                n = this.bV;
                if (this.bV <= this.ci.length) {
                    n = this.ci[this.bV - 1];
                }
                string = new StringBuffer().append(this.a[39]).append(n).append('-').append(this.bU).toString();
            }
```

## L4393

```java
                string = this.a[42];
            } else {
                n = this.bV;
                if (this.bV <= this.ci.length) {
                    n = this.ci[this.bV - 1];
                }
                string = new StringBuffer().append(this.a[39]).append(n).append('-').append(this.bU).toString();
            }
        } else {
```

## L4462

```java
        byArray2[3] = 0;
        byArray2[4] = 0;
        byArray2[5] = 0;
        byArray2[6] = 0;
        if (this.bV == 0 && this.bU == 1) {
            byArray[6] = (byte)(1 - this.D[6]);
            byArray[4] = (byte)(2 - this.D[4]);
            byArray[3] = (byte)(1 - this.D[3]);
            byArray[5] = (byte)(1 - this.D[5]);
```

## L4473

```java
            byArray[1] = (byte)(1 - this.D[1]);
        }
        this.cC = 0;
        int n = 0;
        boolean bl = this.bV != 0 && (this.bU == 11 || this.bU == 12);
        this.cV = bl;
        int n2 = 0;
        while (true) {
            if (n2 >= this.dx) {
```

## L4498

```java
                } else if (n3 == -56) {
                    ++this.cC;
                } else if (n3 == 77) {
                    this.cW = true;
                } else if (this.bV == 0 && this.bU == 1 && (n3 & 0xFF) >= 151 && (n3 & 0xFF) <= 157) {
                    if (byArray[n3 = (n3 & 0xFF) - 151] > 0) {
                        byArray[n3] = (byte)(byArray[n3] - 1);
                    } else {
                        this.cu[n2][i] = (byte)-98;
```

## L4845

```java
                        var6_6 = var1_1;
                        ** GOTO lbl12
                    }
                    case 8: {
                        if (this.bV != 0 || this.bU == 4) {
                            this.d((byte)0);
lbl51:
                            // 4 sources

```

## L4987

```java
                        this.y();
                        if (this.c == 1) {
                            this.a();
                        }
                        this.bV = 0;
                        this.bU = 1;
                        this.aa();
                        this.x = 1;
                        var7_7 = 1;
```

## L5151

```java
                if (this.c == 1) {
                    this.a();
                }
                if (!this.G) ** GOTO lbl263
                this.bV = var5_5;
                if (this.ef != 0) ** GOTO lbl256
                this.bU = 1;
lbl250:
                // 5 sources
```

## L5169

```java
lbl256:
                // 1 sources

                this.bU = this.A[var5_5 - 1];
                if (this.bU != 11 || !this.i(this.bV, 11)) ** GOTO lbl260
                this.bU = 3;
                ** GOTO lbl250
lbl260:
                // 1 sources
```

## L5175

```java
                ** GOTO lbl250
lbl260:
                // 1 sources

                if (this.bU != 12 || !this.i(this.bV, 12)) ** GOTO lbl250
                this.bU = 6;
                ** GOTO lbl250
lbl263:
                // 1 sources
```

## L5182

```java
lbl263:
                // 1 sources

                this.bW = var5_5;
                this.bV = 0;
                this.bU = 5;
                ** continue;
            }
            case 5: 
```

## L5646

```java
     */
    private final void b(Graphics graphics) {
        int n;
        int n2;
        if (this.bV != 0) {
            long l = !this.cb ? System.currentTimeMillis() - this.ca + this.bZ : this.bZ;
            long l2 = l;
            if (this.cV) {
                if (this.df) {
```

## L5687

```java
            n = this.u - 42 >> 1;
            graphics.setClip(n, 2, 42, 38);
            graphics.drawImage(this.cm, n + 0, 2, 20);
        }
        if (this.bV != 0) {
            n2 = this.u;
            if (this.cU) {
                // empty if block
            }
```

## L5999

```java
                    ** continue;
                }
                case 1: {
                    var1_1 = var5_5;
                    if (this.bV == 0) ** GOTO lbl157
                    var2_2 = var4_4;
                    if (this.C) {
                        this.dY[var9_9] = "CHEAT!";
                        var11_11 /* !! */  = this.dZ;
```

## L6073

```java
                                var2_2 = var1_1 + 1;
                                var11_11 /* !! */ [var1_1] = (short)11;
                                var1_1 = var2_2;
                                var6_6 = var10_10;
                                if (this.bV == 0) ** GOTO lbl183
                                var1_1 = var2_2;
                                var6_6 = var10_10;
                                if (this.D[4] <= 0) ** GOTO lbl183
                                var12_12 = this.dY;
```

## L6897

```java
     * Handled duff style switch with additional control
     * Enabled aggressive block sorting
     */
    private final void f(boolean bl) {
        this.bW = this.bV;
        int n = this.bU + 1;
        int n2 = this.bV;
        int n3 = 1;
        int n4 = 0;
```

## L6899

```java
     */
    private final void f(boolean bl) {
        this.bW = this.bV;
        int n = this.bU + 1;
        int n2 = this.bV;
        int n3 = 1;
        int n4 = 0;
        int n5 = n;
        int n6 = n2;
```

## L6922

```java
                    n6 = n2;
                    n7 = n3;
                    n8 = n4;
                    n9 = 4;
                    if (this.i(this.bV, 11)) continue block8;
                    n5 = 11;
                    n6 = n2;
                    n7 = n3;
                    n8 = n4;
```

## L6935

```java
                    n6 = n2;
                    n7 = n3;
                    n8 = n4;
                    n9 = 4;
                    if (this.i(this.bV, 12)) continue block8;
                    n5 = 12;
                    n6 = n2;
                    n7 = n3;
                    n8 = n4;
```

## L6957

```java
                    n8 = n4;
                    break;
                }
                case 10: {
                    this.B[this.bV - 1] = true;
                    n8 = 1;
                    if (!this.i(this.bV, 10)) {
                        n6 = 0;
                        n5 = 4;
```

## L6959

```java
                }
                case 10: {
                    this.B[this.bV - 1] = true;
                    n8 = 1;
                    if (!this.i(this.bV, 10)) {
                        n6 = 0;
                        n5 = 4;
                        n7 = n3;
                        break;
```

## L6978

```java
            }
            break;
        } while (true);
        byte[] byArray = this.A;
        n3 = this.bV;
        n8 = n8 == 0 ? n5 : 0;
        byArray[n3 - 1] = (byte)n8;
        this.h();
        if (n7 != 0) {
```

## L6983

```java
        n8 = n8 == 0 ? n5 : 0;
        byArray[n3 - 1] = (byte)n8;
        this.h();
        if (n7 != 0) {
            this.bV = n6;
            this.bU = n5;
            if (bl) {
                this.j();
            }
```

## L7720

```java
     */
    private final boolean t() {
        if (this.ce != 0) return true;
        if (this.cd == 0) {
            if (this.bV == 0) {
                this.ah();
                return false;
            }
            this.f(true);
```

