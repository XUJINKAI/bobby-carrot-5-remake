# `a.aN` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L768

```java
                    if (this.aw > 4 || this.ay != 0 || this.bc != 0) break block73;
                    this.bn = false;
                    if (this.bh) {
                        this.bh = false;
                        this.aN = 0;
                        var6_5 = 0;
                        var7_6 = 1;
                        var8_7 = this.cE[this.az];
                        var9_8 = this.cI[this.az];
```

## L934

```java
                        this.bb = (byte)false;
                        this.bm = true;
                        this.aW = this.k;
                        this.av = 0;
                        this.aN = 1;
                        break;
                    }
                    case 2: {
                        this.bb = (byte)false;
```

## L962

```java
                    case 1: {
                        this.aX = (byte)false;
                        this.cv[this.as][this.ar] = (byte)-1;
                        this.f(this.bI, this.bJ);
                        this.aN = 0;
                        this.bi = true;
                        this.av = 0;
                        this.b(this.I());
                        break;
```

## L971

```java
                    }
                    case 2: {
                        this.aX = (byte)false;
                        this.bi = false;
                        this.aN = 0;
                        this.cv[this.as][this.ar] = (byte)-36;
                        this.f(this.bI, this.bJ);
                        ++this.ar;
                        this.ap += this.h;
```

## L1424

```java
        }
        if (by2 != -44) {
            if (by == -73 && this.a(-1, 0, true)) {
                this.aw = 0;
                this.aN = 3;
            } else if (by == -72 && this.a(1, 0, true)) {
                this.aw = 1;
                this.aN = 3;
            } else if (by == -75 && this.a(0, -1, true)) {
```

## L1427

```java
                this.aw = 0;
                this.aN = 3;
            } else if (by == -72 && this.a(1, 0, true)) {
                this.aw = 1;
                this.aN = 3;
            } else if (by == -75 && this.a(0, -1, true)) {
                this.aw = 2;
                this.aN = 3;
            } else if (by == -74 && this.a(0, 1, true)) {
```

## L1430

```java
                this.aw = 1;
                this.aN = 3;
            } else if (by == -75 && this.a(0, -1, true)) {
                this.aw = 2;
                this.aN = 3;
            } else if (by == -74 && this.a(0, 1, true)) {
                this.aw = 3;
                this.aN = 3;
            }
```

## L1433

```java
                this.aw = 2;
                this.aN = 3;
            } else if (by == -74 && this.a(0, 1, true)) {
                this.aw = 3;
                this.aN = 3;
            }
        }
        if (this.aN > 0) {
            boolean bl;
```

## L1436

```java
                this.aw = 3;
                this.aN = 3;
            }
        }
        if (this.aN > 0) {
            boolean bl;
            byte by3 = 1;
            boolean bl2 = false;
            switch (this.aw) {
```

## L1520

```java
                    this.cv[this.as][this.ar] = (byte)-1;
                    this.f(this.bI, this.bJ);
                    this.aO = 8;
                }
                this.aN = by2 == 0 || by == -108 ? 3 : --this.aN;
                if (by == -108) {
                    this.bn = true;
                    this.aN = 3;
                }
```

## L1523

```java
                }
                this.aN = by2 == 0 || by == -108 ? 3 : --this.aN;
                if (by == -108) {
                    this.bn = true;
                    this.aN = 3;
                }
                this.ay = this.h;
                return true;
            }
```

## L1528

```java
                }
                this.ay = this.h;
                return true;
            }
            this.aN = 0;
            this.aO = 8;
            this.bf = false;
        }
        if (this.ay == 0 && by == -108) {
```

## L1629

```java
     * Enabled aggressive block sorting
     */
    private final void N() {
        int n = this.aw;
        int n2 = this.aN > 0 || this.bl ? 6 : 3;
        this.ay -= n2;
        if (this.aw == 6) {
            n = this.ax;
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

## L3152

```java
                    n5 = 120;
                    bl = false;
                }
            }
            if ((this.aN > 0 || this.bk) && bl) {
                this.a(graphics, n8, n, n2);
            }
            this.b(graphics, this.cs[7], n5, this.av * 83, n7, 83, this.ap + n6 - n, this.aq - 48 - n2);
            if (this.aN <= 0) {
```

## L3156

```java
            if ((this.aN > 0 || this.bk) && bl) {
                this.a(graphics, n8, n, n2);
            }
            this.b(graphics, this.cs[7], n5, this.av * 83, n7, 83, this.ap + n6 - n, this.aq - 48 - n2);
            if (this.aN <= 0) {
                if (!this.bk) return;
            }
            if (bl) return;
            this.a(graphics, n8, n, n2);
```

## L3215

```java
            n3 = n11;
        } else {
            n3 = n11;
            n4 = n12;
            if (this.aN > 0) {
                n4 = !this.bj ? this.aw : 2;
                switch (n4) {
                    default: {
                        n3 = n11;
```

## L3243

```java
        }
        n12 = this.ap;
        int n13 = this.aq;
        int n14 = this.aW;
        if (this.aN > 0 && n3 != 0) {
            this.a(graphics, n4, n, n2);
        }
        Image[] imageArray = this.cs;
        n11 = !this.bj ? this.aw : 2;
```

## L3249

```java
        }
        Image[] imageArray = this.cs;
        n11 = !this.bj ? this.aw : 2;
        this.b(graphics, imageArray[n11], this.av * 48, 0, 48, 72, n12 + 0 - n, n13 - 36 - n14 - n2);
        if (this.aN <= 0) return;
        if (n3 != 0) return;
        this.a(graphics, n4, n, n2);
    }

```

## L4037

```java
                            var1_1 = var2_2 < 0 ? 2 : 3;
                            this.aw = var1_1;
                        }
                        this.bl = false;
                        this.aN = 0;
                        this.aC = 0;
                        var5_5 = var6_6;
                    } else {
                        this.aY = (byte)3;
```

## L4178

```java
                return false;
            }
            case -19: {
                if (this.bi == false) return false;
                if (this.aN > 0) return true;
                if (var3_3 == false) return false;
                return true;
            }
            case -12: {
```

## L4338

```java
        this.bh = false;
        this.cZ = false;
        this.cY = false;
        this.cX = false;
        this.aN = 0;
        this.aO = 0;
        this.az = -1;
        this.bi = false;
        this.bj = false;
```

## L4588

```java
        this.dL = this.a(this.dL, "/title.png");
        this.bi = false;
        this.bj = false;
        this.aW = 0;
        this.aN = 0;
        this.bm = true;
        this.av = 0;
        this.ay = 1;
        this.aC = 0;
```

## L7632

```java
        this.d(false);
        this.bi = false;
        this.bj = false;
        this.aW = 0;
        this.aN = 0;
        this.bm = true;
        this.av = 0;
        this.ay = 1;
        this.aw = 1;
```

