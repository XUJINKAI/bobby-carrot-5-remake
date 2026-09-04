# `a.bm` 引用上下文

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

## L910

```java
        if (this.ay != 0) {
            if (this.bg && this.ay <= this.j) {
                this.bg = false;
                this.J();
                if (this.bb == 0 && !this.bm) {
                    var14_13 = this.az != -1 ? this.m : 0;
                    this.aW = var14_13;
                }
            }
```

## L931

```java
            if (this.ay == 0) {
                switch (this.bb) {
                    case 1: {
                        this.bb = (byte)false;
                        this.bm = true;
                        this.aW = this.k;
                        this.av = 0;
                        this.aN = 1;
                        break;
```

## L939

```java
                        break;
                    }
                    case 2: {
                        this.bb = (byte)false;
                        this.bm = false;
                        this.aW = 0;
                        this.av = 0;
                    }
                }
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

## L1108

```java
            this.cv[this.aS][this.aR] = (byte)-52;
            this.f(this.bI, this.bJ);
            this.aR = -1;
        }
        if (this.bm) {
            if (by2 != -11) return;
            this.bb = (byte)2;
        } else if (by2 == -12) {
            this.bb = (byte)1;
```

## L1330

```java
        this.d(false);
        this.l();
        this.ay = 0;
        this.aw = 5;
        this.bm = false;
        this.bj = false;
        this.av = 0;
        if (this.dV) {
            this.dV = false;
```

## L1396

```java
                    return true;
                }
            }
        }
        if (this.bm) {
            switch (this.aw) {
                case 0: {
                    --this.ar;
                    this.ay = this.h;
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

## L1662

```java
        if (!this.bf || this.aw <= 3 && !this.bm && (this.aN > 0 || this.F && !this.bi && this.bc <= 0)) {
            this.aD = (this.aD + 1) % 12;
            if (this.bi) {
                this.av = (this.av + 1) % 2;
            } else if (this.bm) {
                this.av = 0;
            } else if (this.bc > 0) {
                this.av = (this.av + 1) % 9;
            } else {
```

## L3163

```java
            if (bl) return;
            this.a(graphics, n8, n, n2);
            return;
        }
        if (this.bm) {
            int n9;
            switch (this.aw) {
                default: {
                    n9 = 360;
```

## L3905

```java
                                if (var4_4 >= this.dw) return false;
                                if (var5_5 >= this.dx) {
                                    return false;
                                }
                                if (this.bm) {
                                    return true;
                                }
                                var6_6 = this.cu[this.as][this.ar];
                                var7_7 = this.cu[var5_5][var4_4];
```

## L4343

```java
        this.aO = 0;
        this.az = -1;
        this.bi = false;
        this.bj = false;
        this.bm = false;
        this.bb = (byte)0;
        this.bo = false;
        this.bn = false;
        this.aX = (byte)0;
```

## L4589

```java
        this.bi = false;
        this.bj = false;
        this.aW = 0;
        this.aN = 0;
        this.bm = true;
        this.av = 0;
        this.ay = 1;
        this.aC = 0;
        this.aw = 1;
```

## L7633

```java
        this.bi = false;
        this.bj = false;
        this.aW = 0;
        this.aN = 0;
        this.bm = true;
        this.av = 0;
        this.ay = 1;
        this.aw = 1;
        this.ap = (this.u >> 1) - (this.h >> 1);
```

