# `a.bi` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L846

```java
                            if (!this.bh) {
                                this.az = -1;
                            }
                            this.bg = true;
                            if (!this.bi && !this.bm) {
                                this.av = 3;
                            }
                            break block74;
                        } else if (this.aC == 0 && !this.bi && !this.bm && this.bc == 0) {
```

## L850

```java
                            if (!this.bi && !this.bm) {
                                this.av = 3;
                            }
                            break block74;
                        } else if (this.aC == 0 && !this.bi && !this.bm && this.bc == 0) {
                            this.av = 3;
                        }
                    }
                    break block74;
```

## L963

```java
                        this.aX = (byte)false;
                        this.cv[this.as][this.ar] = (byte)-1;
                        this.f(this.bI, this.bJ);
                        this.aN = 0;
                        this.bi = true;
                        this.av = 0;
                        this.b(this.I());
                        break;
                    }
```

## L970

```java
                        break;
                    }
                    case 2: {
                        this.aX = (byte)false;
                        this.bi = false;
                        this.aN = 0;
                        this.cv[this.as][this.ar] = (byte)-36;
                        this.f(this.bI, this.bJ);
                        ++this.ar;
```

## L985

```java
                        break;
                    }
                }
            }
        } else if (!(this.bi || this.bj || this.bm || this.bc != 0 || this.aw >= 4)) {
            this.aC = var14_13 = this.aC + 1;
            if (var14_13 >= 160) {
                this.aw = 4;
                this.av = 0;
```

## L1051

```java
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final String I() {
        if (this.bi) {
            return "/mow.mid";
        }
        if (this.bV != 0) {
            if (!this.cV) {
```

## L1126

```java
            this.ds = (byte)0;
            this.aQ = 6;
        }
        this.bj = false;
        if (!this.bi) {
            if (by2 == -51) {
                this.de = false;
                if (this.cV && !this.df) {
                    this.df = true;
```

## L1220

```java
            this.aF = this.ar;
            this.aG = this.as;
            return;
        }
        if (!this.bi && (by & 0xFF) >= 185 && (by & 0xFF) <= 190) {
            this.aH = this.ar;
            this.aI = this.as;
            return;
        }
```

## L1225

```java
            this.aH = this.ar;
            this.aI = this.as;
            return;
        }
        if (!this.bi && (by & 0xFF) >= 177 && (by & 0xFF) <= 180) {
            this.aU = this.ar;
            this.aV = this.as;
            return;
        }
```

## L1230

```java
            this.aU = this.ar;
            this.aV = this.as;
            return;
        }
        if (!this.bi && by == -97) {
            this.cZ = true;
            this.cu[this.as][this.ar] = (byte)124;
            this.f(this.bI, this.bJ);
            return;
```

## L1288

```java
            this.aT = 64;
            this.d(this.cQ * this.h, this.cR * this.i);
            return;
        }
        if (!this.bi && by == -81) {
            this.K();
            return;
        }
        if (!this.bi && this.cC == 0 && by == -106) {
```

## L1292

```java
        if (!this.bi && by == -81) {
            this.K();
            return;
        }
        if (!this.bi && this.cC == 0 && by == -106) {
            this.d(false);
            this.l();
            this.ax = this.aw;
            this.aw = 6;
```

## L1301

```java
            this.av = 0;
            this.be = true;
            return;
        }
        if (this.bi && by == -96) {
            this.aX = (byte)2;
            return;
        }
        if ((by & 0xFF) < 151) return;
```

## L1515

```java
                    by2 = by3;
                }
            }
            if (!bl) {
                if (this.bi && this.c(this.ar, this.as) == -19) {
                    this.cv[this.as][this.ar] = (byte)-1;
                    this.f(this.bI, this.bJ);
                    this.aO = 8;
                }
```

## L1575

```java
            if (by2 == 0) {
                this.ay = this.h;
                this.bn = true;
                this.av = 1;
                if (this.bi) return true;
                if (!this.F) return true;
                this.bl = true;
                return true;
            }
```

## L1588

```java
            if (!this.a(-1, 0, false)) return false;
            --this.ar;
            this.aw = 0;
            this.ay = this.h;
            if (this.bi) return true;
            if (!this.F) return true;
            this.bl = true;
            return true;
        }
```

## L1598

```java
            if (!this.a(1, 0, false)) return false;
            ++this.ar;
            this.aw = 1;
            this.ay = this.h;
            if (this.bi) return true;
            if (!this.F) return true;
            this.bl = true;
            return true;
        }
```

## L1608

```java
            if (!this.a(0, -1, false)) return false;
            --this.as;
            this.aw = 2;
            this.ay = this.h;
            if (this.bi) return true;
            if (!this.F) return true;
            this.bl = true;
            return true;
        }
```

## L1618

```java
        if (!this.a(0, 1, false)) return false;
        ++this.as;
        this.aw = 3;
        this.ay = this.h;
        if (this.bi) return true;
        if (!this.F) return true;
        this.bl = true;
        return true;
    }
```

## L1658

```java
    /*
     * Enabled aggressive block sorting
     */
    private final boolean O() {
        if (!this.bf || this.aw <= 3 && !this.bm && (this.aN > 0 || this.F && !this.bi && this.bc <= 0)) {
            this.aD = (this.aD + 1) % 12;
            if (this.bi) {
                this.av = (this.av + 1) % 2;
            } else if (this.bm) {
```

## L1660

```java
     */
    private final boolean O() {
        if (!this.bf || this.aw <= 3 && !this.bm && (this.aN > 0 || this.F && !this.bi && this.bc <= 0)) {
            this.aD = (this.aD + 1) % 12;
            if (this.bi) {
                this.av = (this.av + 1) % 2;
            } else if (this.bm) {
                this.av = 0;
            } else if (this.bc > 0) {
```

## L3118

```java
     */
    private final void a(Graphics graphics, int n, int n2) {
        int n3;
        int n4;
        if (this.bi) {
            int n5;
            int n6;
            int n7;
            boolean bl = true;
```

## L3942

```java
                                }
                                if (var5_5 == 0) {
                                    return false;
                                }
                                if (!this.bi && this.a(this.ar + var1_1, this.as + var2_2)) {
                                    return true;
                                }
                                var5_5 = (var7_7 & 255) >= 94 && (var7_7 & 255) <= 200 ? 1 : 0;
                                var6_6 = var5_5;
```

## L3949

```java
                                var5_5 = (var7_7 & 255) >= 94 && (var7_7 & 255) <= 200 ? 1 : 0;
                                var6_6 = var5_5;
                                if (var6_6 == 0) break block67;
                                if ((var7_7 & 255) < 185 || (var7_7 & 255) > 190) break block68;
                                if (!this.bi) {
                                    switch (var7_7) {
                                        default: {
                                            var5_5 = var6_6;
                                            break;
```

## L4001

```java
                                }
                                break block66;
                            }
                            if ((var7_7 & 255) < 177 || (var7_7 & 255) > 180) break block69;
                            var1_1 = this.bi == false ? 1 : 0;
                            var5_5 = var1_1;
                            break block66;
                        }
                        if (var7_7 != -57 && var7_7 != -56) break block70;
```

## L4006

```java
                            var5_5 = var1_1;
                            break block66;
                        }
                        if (var7_7 != -57 && var7_7 != -56) break block70;
                        if (this.bi) {
                            this.bk = true;
                            var5_5 = var6_6;
                            break block66;
                        } else {
```

## L4025

```java
            }
            var5_5 = var6_6;
            if (var7_7 == 77) {
                var5_5 = var6_6;
                if (!this.bi) {
                    if (this.cZ) {
                        this.bc = (byte)32;
                        this.av = 0;
                        if (var1_1 != 0) {
```

## L4056

```java
                }
                case -50: 
                case -44: 
                case -34: {
                    if (this.bi != false) return false;
                    return true;
                }
            }
        }
```

## L4066

```java
            default: {
                return true;
            }
            case -54: {
                if (this.bi != false) return false;
                return true;
            }
            case -52: 
            case -48: 
```

## L4089

```java
            case -2: {
                return false;
            }
            case -51: {
                if (this.bi != false) return false;
                if (this.de != false) return true;
                if (this.D[2] != 0) return true;
                this.aY = (byte)true;
                this.aA = 4;
```

## L4177

```java
                this.D();
                return false;
            }
            case -19: {
                if (this.bi == false) return false;
                if (this.aN > 0) return true;
                if (var3_3 == false) return false;
                return true;
            }
```

## L4183

```java
                if (var3_3 == false) return false;
                return true;
            }
            case -12: {
                if (this.bi != false) return false;
                if (this.cY) {
                    return true;
                }
                this.aY = (byte)2;
```

## L4341

```java
        this.cX = false;
        this.aN = 0;
        this.aO = 0;
        this.az = -1;
        this.bi = false;
        this.bj = false;
        this.bm = false;
        this.bb = (byte)0;
        this.bo = false;
```

## L4585

```java
        this.c(true);
        this.cs[9] = this.a(this.cs[9], "/b9.png");
        this.ct = this.a(this.ct, "/ta.png");
        this.dL = this.a(this.dL, "/title.png");
        this.bi = false;
        this.bj = false;
        this.aW = 0;
        this.aN = 0;
        this.bm = true;
```

## L7629

```java
    }

    private final void p() {
        this.d(false);
        this.bi = false;
        this.bj = false;
        this.aW = 0;
        this.aN = 0;
        this.bm = true;
```

