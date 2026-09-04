# `a.bU` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L532

```java
lbl94:
                // 2 sources

                while (true) {
                    this.bU = var1_1;
                    this.j();
                    this.z();
                    this.aa();
                    this.x = 1;
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

## L1062

```java
            }
            if (this.df) return "/bonus.mid";
            return "/shop.mid";
        }
        if (this.bU == 1) {
            return "/shop.mid";
        }
        if (this.bU == 2) return "/sandman.mid";
        if (this.bU == 4) return "/sandman.mid";
```

## L1065

```java
        }
        if (this.bU == 1) {
            return "/shop.mid";
        }
        if (this.bU == 2) return "/sandman.mid";
        if (this.bU == 4) return "/sandman.mid";
        if (this.bU != 5) return "/shop.mid";
        return "/sandman.mid";
    }
```

## L1066

```java
        if (this.bU == 1) {
            return "/shop.mid";
        }
        if (this.bU == 2) return "/sandman.mid";
        if (this.bU == 4) return "/sandman.mid";
        if (this.bU != 5) return "/shop.mid";
        return "/sandman.mid";
    }

```

## L1067

```java
            return "/shop.mid";
        }
        if (this.bU == 2) return "/sandman.mid";
        if (this.bU == 4) return "/sandman.mid";
        if (this.bU != 5) return "/shop.mid";
        return "/sandman.mid";
    }

    /*
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

## L1709

```java
                            if (this.av < 10) break;
                            if (this.bV != 0) {
                                this.ap();
                                return true;
                            } else if (this.bU == 1) {
                                this.ah();
                                this.aO = 0;
                                this.bO = this.bI;
                                this.bP = this.bJ;
```

## L1715

```java
                                this.aO = 0;
                                this.bO = this.bI;
                                this.bP = this.bJ;
                                return true;
                            } else if (this.bU == 5) {
                                this.G = true;
                                this.h();
                                this.bV = this.bW;
                                this.bU = 1;
```

## L1719

```java
                            } else if (this.bU == 5) {
                                this.G = true;
                                this.h();
                                this.bV = this.bW;
                                this.bU = 1;
                                this.aa();
                                this.d(true);
                                return true;
                            } else {
```

## L4147

```java
lbl184:
                // 1 sources

                if (this.bV != 0) return false;
                if (this.bU == 1) {
                    this.a(-1, new StringBuffer().append(this.a[100]).append(this.I).append(this.a[101]).toString(), this.a[30], null);
                    return false;
                }
                if (this.bU == 2) {
```

## L4151

```java
                if (this.bU == 1) {
                    this.a(-1, new StringBuffer().append(this.a[100]).append(this.I).append(this.a[101]).toString(), this.a[30], null);
                    return false;
                }
                if (this.bU == 2) {
                    if (this.J > 0) {
                        this.a(9, new StringBuffer().append(this.a[102]).append(this.J).append(this.a[103]).toString(), this.a[32], this.a[33]);
                        return false;
                    } else {
```

## L4160

```java
                        this.a(-1, new StringBuffer().append(this.a[102]).append(this.a[104]).toString(), this.a[30], null);
                    }
                    return false;
                }
                if (this.bU == 3) {
                    this.a(-1, this.a[109], this.a[30], null);
                    return false;
                } else if (this.bU == 4) {
                    this.a(10, this.a[112], this.a[32], this.a[33]);
```

## L4163

```java
                }
                if (this.bU == 3) {
                    this.a(-1, this.a[109], this.a[30], null);
                    return false;
                } else if (this.bU == 4) {
                    this.a(10, this.a[112], this.a[32], this.a[33]);
                    return false;
                } else {
                    if (this.bU != 5) return false;
```

## L4167

```java
                } else if (this.bU == 4) {
                    this.a(10, this.a[112], this.a[32], this.a[33]);
                    return false;
                } else {
                    if (this.bU != 5) return false;
                    this.a(-1, this.a[110], this.a[30], null);
                }
                return false;
            }
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

## L4388

```java
        this.bJ = this.bP;
        this.ag();
        this.f(this.bI, this.bJ);
        if (this.bV != 0) {
            if (this.bU == 11 || this.bU == 12) {
                string = this.a[42];
            } else {
                n = this.bV;
                if (this.bV <= this.ci.length) {
```

## L4395

```java
                n = this.bV;
                if (this.bV <= this.ci.length) {
                    n = this.ci[this.bV - 1];
                }
                string = new StringBuffer().append(this.a[39]).append(n).append('-').append(this.bU).toString();
            }
        } else {
            switch (this.bU) {
                default: {
```

## L4398

```java
                }
                string = new StringBuffer().append(this.a[39]).append(n).append('-').append(this.bU).toString();
            }
        } else {
            switch (this.bU) {
                default: {
                    string = this.a[43];
                    break;
                }
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

## L4857

```java
                                break;
                            }
                        }
                        this.am();
                        if (this.bU != 1 && this.bU != 5) ** GOTO lbl58
                        this.ah();
                        ** GOTO lbl51
lbl58:
                        // 1 sources
```

## L4863

```java
                        ** GOTO lbl51
lbl58:
                        // 1 sources

                        if (this.bU != 2 && this.bU != 3) ** GOTO lbl51
                        this.A();
                        ** continue;
                    }
                    case 10: {
```

## L4988

```java
                        if (this.c == 1) {
                            this.a();
                        }
                        this.bV = 0;
                        this.bU = 1;
                        this.aa();
                        this.x = 1;
                        var7_7 = 1;
                        var6_6 = var1_1;
```

## L5153

```java
                }
                if (!this.G) ** GOTO lbl263
                this.bV = var5_5;
                if (this.ef != 0) ** GOTO lbl256
                this.bU = 1;
lbl250:
                // 5 sources

                while (true) {
```

## L5168

```java
                }
lbl256:
                // 1 sources

                this.bU = this.A[var5_5 - 1];
                if (this.bU != 11 || !this.i(this.bV, 11)) ** GOTO lbl260
                this.bU = 3;
                ** GOTO lbl250
lbl260:
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

## L5170

```java
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

## L5176

```java
lbl260:
                // 1 sources

                if (this.bU != 12 || !this.i(this.bV, 12)) ** GOTO lbl250
                this.bU = 6;
                ** GOTO lbl250
lbl263:
                // 1 sources

```

## L5183

```java
                // 1 sources

                this.bW = var5_5;
                this.bV = 0;
                this.bU = 5;
                ** continue;
            }
            case 5: 
        }
```

## L5374

```java
        if (this.c == 1) {
            this.a("/cleared.mid", (int)this.bt, false);
        }
        this.b(false, -1);
        if (this.bU != 11 && this.bU != 12) {
            int n = 2 + this.a[48].length();
            int n2 = (int)this.bZ / 1000;
            int n3 = n2 / 60;
            n2 -= n3 * 60;
```

## L6898

```java
     * Enabled aggressive block sorting
     */
    private final void f(boolean bl) {
        this.bW = this.bV;
        int n = this.bU + 1;
        int n2 = this.bV;
        int n3 = 1;
        int n4 = 0;
        int n5 = n;
```

## L6908

```java
        int n7 = n3;
        int n8 = n4;
        int n9 = 0;
        block8: do {
            switch (n9 == 0 ? this.bU : n9) {
                default: {
                    n8 = n4;
                    n7 = n3;
                    n6 = n2;
```

## L6984

```java
        byArray[n3 - 1] = (byte)n8;
        this.h();
        if (n7 != 0) {
            this.bV = n6;
            this.bU = n5;
            if (bl) {
                this.j();
            }
            this.ab();
```

