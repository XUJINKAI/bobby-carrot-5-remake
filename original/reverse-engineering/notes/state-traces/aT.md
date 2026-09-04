# `a.aT` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L744

```java
                    if (this.cV && this.df && this.aw != 5 && (var1_1 = this.cb == false ? 60000L - (System.currentTimeMillis() - this.ca + this.bZ) : 60000L - this.bZ) <= 0L) {
                        this.ba = (byte)false;
                        this.K();
                    }
                    if (this.aT > 0 && this.bO == this.bI && this.bP == this.bJ) {
                        --this.aT;
                        if (this.aT == 0) {
                            this.aZ = (byte)-1;
                            this.aE = -1;
```

## L745

```java
                        this.ba = (byte)false;
                        this.K();
                    }
                    if (this.aT > 0 && this.bO == this.bI && this.bP == this.bJ) {
                        --this.aT;
                        if (this.aT == 0) {
                            this.aZ = (byte)-1;
                            this.aE = -1;
                            this.W();
```

## L746

```java
                        this.K();
                    }
                    if (this.aT > 0 && this.bO == this.bI && this.bP == this.bJ) {
                        --this.aT;
                        if (this.aT == 0) {
                            this.aZ = (byte)-1;
                            this.aE = -1;
                            this.W();
                        }
```

## L1036

```java
                this.aQ = 6;
                this.f(this.bI, this.bJ);
            }
        }
        if (!this.dV && this.aT == 0) {
            this.d(this.ap, this.aq);
        }
        if (this.bI == var4_3) {
            if (this.bJ == var5_4) return true;
```

## L1260

```java
        if (by == -88) {
            this.da = true;
            this.aZ = (byte)2;
            this.a((byte)-88, (byte)-89);
            this.aT = 64;
            this.d(this.cK * this.h, this.cL * this.i);
            return;
        }
        if (by == -86) {
```

## L1268

```java
        if (by == -86) {
            this.db = true;
            this.aZ = (byte)3;
            this.a((byte)-86, (byte)-87);
            this.aT = 64;
            this.d(this.cM * this.h, this.cN * this.i);
            return;
        }
        if (by == -84) {
```

## L1276

```java
        if (by == -84) {
            this.dc = true;
            this.aZ = (byte)0;
            this.a((byte)-84, (byte)-85);
            this.aT = 64;
            this.d(this.cO * this.h, this.cP * this.i);
            return;
        }
        if (by == -82) {
```

## L1284

```java
        if (by == -82) {
            this.dd = true;
            this.aZ = (byte)1;
            this.a((byte)-82, (byte)-83);
            this.aT = 64;
            this.d(this.cQ * this.h, this.cR * this.i);
            return;
        }
        if (!this.bi && by == -81) {
```

## L1582

```java
                return true;
            }
        }
        if (this.dV) return false;
        if (this.aT != 0) return false;
        if (this.P) {
            if (!this.a(-1, 0, false)) return false;
            --this.ar;
            this.aw = 0;
```

## L1850

```java
                                                        }
                                                        n2 = bl ? 6 : 3;
                                                        n7 = n3 - n2;
                                                    }
                                                    if (n == this.aE && this.aT > 1) {
                                                        this.d(n9, n8);
                                                        --this.aT;
                                                    }
                                                    n2 = n13;
```

## L1852

```java
                                                        n7 = n3 - n2;
                                                    }
                                                    if (n == this.aE && this.aT > 1) {
                                                        this.d(n9, n8);
                                                        --this.aT;
                                                    }
                                                    n2 = n13;
                                                    n3 = n7;
                                                    if (n7 > 0) break block60;
```

## L1973

```java
                            n7 = n6;
                            bl2 = bl;
                            break block63;
                        }
                        if (this.aT == 0 || this.bO == this.bI && this.bP == this.bJ) break block69;
                        n2 = n13;
                        n7 = n6;
                        n10 = n11;
                        bl2 = bl;
```

## L2033

```java
                        bl2 = bl;
                        if (this.aZ == n6) {
                            this.aZ = (byte)-1;
                            this.aE = n;
                            this.aT = 64;
                            this.d(n4 * this.h, n5 * this.i);
                            n2 = n6;
                            n7 = n3;
                            n10 = n11;
```

## L2107

```java
     * Enabled aggressive block sorting
     */
    private final void Q() {
        this.bv = (byte)((this.bv + 1) % 8);
        this.aT = 16;
        this.d(this.dp, this.dq);
        if (this.dv == 3) {
            var1_1 = this.dp / this.h;
            var2_2 = this.dq / this.i;
```

## L2623

```java
                        }
                        if (n == 0) break block13;
                        if (n > this.bS + this.bQ) {
                            n4 = this.bQ;
                            n5 = this.bd || this.dV || this.aT > 0 ? 24 : 6;
                            if (n4 < n5) {
                                ++this.bQ;
                                this.bS += this.bQ;
                            }
```

## L2641

```java
                }
                if (n3 == 0) break block15;
                if (n3 > this.bT + this.bR) {
                    n4 = this.bR;
                    n5 = this.bd || this.dV || this.aT > 0 ? 24 : 6;
                    if (n4 < n5) {
                        ++this.bR;
                        this.bT += this.bR;
                    }
```

## L4355

```java
        this.aA = 0;
        this.aC = 0;
        this.aW = 0;
        this.ba = (byte)-1;
        this.aT = 0;
        this.ba = (byte)-1;
        this.aZ = (byte)-1;
        this.aE = -1;
        this.aF = -1;
```

## L8040

```java
                    }
                    if (this.eg > 0) {
                        this.eg = (byte)(this.eg - 1);
                    }
                    if (!this.bd && this.aT == 0 && this.aw != 5 && this.R) {
                        this.R = false;
                        var1_1 = this.dV == false;
                        this.dV = var1_1;
                        if (!this.dV) {
```

