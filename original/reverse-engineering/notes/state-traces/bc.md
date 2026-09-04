# `a.bc` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L764

```java
                        return false;
                    }
                    var4_3 = this.bI;
                    var5_4 = this.bJ;
                    if (this.aw > 4 || this.ay != 0 || this.bc != 0) break block73;
                    this.bn = false;
                    if (this.bh) {
                        this.bh = false;
                        this.aN = 0;
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

## L856

```java
                        }
                    }
                    break block74;
                }
                if (this.bc <= 0) break block74;
                this.bc = (byte)(this.bc - 1);
                if (this.bc > 0) break block74;
                this.bc = (byte)false;
                var14_13 = this.ar;
```

## L857

```java
                    }
                    break block74;
                }
                if (this.bc <= 0) break block74;
                this.bc = (byte)(this.bc - 1);
                if (this.bc > 0) break block74;
                this.bc = (byte)false;
                var14_13 = this.ar;
                var7_6 = this.as;
```

## L858

```java
                    break block74;
                }
                if (this.bc <= 0) break block74;
                this.bc = (byte)(this.bc - 1);
                if (this.bc > 0) break block74;
                this.bc = (byte)false;
                var14_13 = this.ar;
                var7_6 = this.as;
                switch (this.aw) {
```

## L859

```java
                }
                if (this.bc <= 0) break block74;
                this.bc = (byte)(this.bc - 1);
                if (this.bc > 0) break block74;
                this.bc = (byte)false;
                var14_13 = this.ar;
                var7_6 = this.as;
                switch (this.aw) {
                    case 0: {
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

## L1664

```java
            if (this.bi) {
                this.av = (this.av + 1) % 2;
            } else if (this.bm) {
                this.av = 0;
            } else if (this.bc > 0) {
                this.av = (this.av + 1) % 9;
            } else {
                switch (this.aw) {
                    default: {
```

## L3185

```java
            }
            this.b(graphics, this.cs[9], n9, 0, 120, 72, this.ap - 36 - n, this.aq - 36 - this.aW - n2);
            return;
        }
        if (this.bc > 0) {
            int n10;
            switch (this.aw) {
                default: {
                    n10 = 216;
```

## L3898

```java
                        block69: {
                            block68: {
                                var4_4 = this.ar + var1_1;
                                var5_5 = this.as + var2_2;
                                this.bc = (byte)false;
                                if (var4_4 < 0) return false;
                                if (var5_5 < 0) return false;
                                if (var4_4 >= this.dw) return false;
                                if (var5_5 >= this.dx) {
```

## L4027

```java
            if (var7_7 == 77) {
                var5_5 = var6_6;
                if (!this.bi) {
                    if (this.cZ) {
                        this.bc = (byte)32;
                        this.av = 0;
                        if (var1_1 != 0) {
                            var1_1 = var1_1 < 0 ? 0 : 1;
                            this.aw = var1_1;
```

## L4349

```java
        this.bo = false;
        this.bn = false;
        this.aX = (byte)0;
        this.bk = false;
        this.bc = (byte)0;
        this.bl = false;
        this.aA = 0;
        this.aC = 0;
        this.aW = 0;
```

