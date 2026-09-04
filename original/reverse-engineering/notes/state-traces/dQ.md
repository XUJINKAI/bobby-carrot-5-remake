# `a.dQ` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L405

```java
                                    block22: {
                                        block18: {
                                            block20: {
                                                block19: {
                                                    if (this.dQ != 0) break block16;
                                                    if (this.ec <= 0) break block17;
                                                    if (!this.N) break block18;
                                                    this.N = false;
                                                    if (this.eb <= 0) break block19;
```

## L501

```java
                }
                --this.dP;
                if (this.dP >= 0) ** GOTO lbl14
                this.dP = 0;
                if (this.dQ != 2) break block25;
                this.dQ = (byte)false;
                switch (this.dR) lbl-1000:
                // 2 sources

```

## L502

```java
                --this.dP;
                if (this.dP >= 0) ** GOTO lbl14
                this.dP = 0;
                if (this.dQ != 2) break block25;
                this.dQ = (byte)false;
                switch (this.dR) lbl-1000:
                // 2 sources

                {
```

## L545

```java
            }
            var1_1 = 2;
            ** while (true)
        }
        this.dQ = (byte)false;
        ** while (true)
    }

    /*
```

## L554

```java
     * Enabled aggressive block sorting
     */
    private final boolean C() {
        boolean bl = false;
        if (this.dQ == 0) {
            boolean bl2;
            if (this.N) {
                this.N = false;
                bl2 = bl;
```

## L590

```java
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.a(true);
```

## L591

```java
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.a(true);
                }
```

## L605

```java
                    return true;
                }
            }
        } else {
            this.dQ = (byte)0;
        }
        return true;
    }

```

## L623

```java
     * Enabled aggressive block sorting
     */
    private final boolean E() {
        boolean bl = false;
        if (this.dQ == 0) {
            boolean bl2;
            if (this.N) {
                this.N = false;
                bl2 = bl;
```

## L664

```java
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        this.dT = false;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.b(true);
```

## L665

```java
        if (this.dP >= 0) return true;
        this.dP = 0;
        this.dT = false;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.b(true);
                }
```

## L679

```java
                    return true;
                }
            }
        } else {
            this.dQ = (byte)0;
        }
        return true;
    }

```

## L3568

```java
                    n6 = n2;
                    if (graphics != null) {
                        n6 = n2;
                        if (this.ew >= this.et) {
                            if (this.dQ == 0 || !bl) {
                                n6 = this.eA.charAt(n5);
                                n6 = n6 != 32 && n6 != 35 ? this.u - (n5 - (n - n3 + 1) + 1) * 12 >> 1 : this.u - (n5 - (n - n3 + 1)) * 12 >> 1;
                                n12 = n - n3 + 1;
                                n4 = n6;
```

## L3603

```java
                    if (this.ew < n9 + n10) break block27;
                }
                if (graphics == null) break;
                if (!bl3) return;
                if (this.dQ != 0) return;
                if (this.et > 0) {
                    this.b(graphics, this.cl, 0, 0, 17, 9, (this.u >> 1) - 17 + 1, this.er + n7 - 9 - 4);
                }
                if (this.et >= this.eu) return;
```

## L3770

```java
     * Enabled aggressive block sorting
     */
    private final void a(boolean bl, int n) {
        int n2 = bl ? 1 : 2;
        this.dQ = (byte)n2;
        this.dR = (byte)n;
        this.dP = 18;
    }

```

## L4686

```java
     * Enabled aggressive block sorting
     */
    private final boolean aj() {
        boolean bl = false;
        if (this.dQ == 0) {
            boolean bl2;
            if (this.N) {
                this.N = false;
                this.eb = this.eb > 0 ? (byte)((byte)(this.eb - 1)) : (byte)((byte)(this.ec - 1));
```

## L4754

```java
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.ce > 0) return true;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.ak();
```

## L4755

```java
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.ce > 0) return true;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.ak();
                }
```

## L4769

```java
                    return true;
                }
            }
        } else {
            this.dQ = (byte)0;
        }
        return true;
    }

```

## L5300

```java
     * Lifted jumps to return sites
     */
    private final boolean an() {
        boolean bl = false;
        if (this.dQ == 0) {
            boolean bl2;
            if (this.N) {
                this.N = false;
                bl2 = bl;
```

## L5333

```java
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                default: {
                    return true;
```

## L5334

```java
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                default: {
                    return true;
                }
```

## L5344

```java
            }
            this.ao();
            return true;
        }
        this.dQ = (byte)0;
        return true;
    }

    /*
```

## L5471

```java
    /*
     * Enabled aggressive block sorting
     */
    private final boolean at() {
        if (this.dQ == 0) {
            if (this.S) {
                this.S = false;
                this.a(false, 0);
                return true;
```

## L5501

```java
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.g(true);
```

## L5502

```java
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
                    this.g(true);
                }
```

## L5516

```java
                    return true;
                }
            }
        } else {
            this.dQ = (byte)0;
        }
        return true;
    }

```

## L6652

```java
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private final int e(int n) {
        switch (this.dQ) {
            default: {
                return this.dS[18 - this.dP] * n >> 8;
            }
            case 0: {
```

## L6769

```java
                        int n5;
                        block3: {
                            block5: {
                                if (!bl || (bl = false)) break block3;
                                if (this.dQ != 0) break block4;
                                if (this.eD[this.eB].length != 0) break block5;
                                String string = this.eB == 0 ? this.a[49] : this.a[50];
                                this.a(string, graphics, this.u >> 1, 6 + (this.i - this.g >> 1), true);
                                break block6;
```

## L8124

```java
                case 10: {
                    if (this.ce == -1) {
                        --this.dP;
                        if (this.dP >= 0) return true;
                        this.dQ = (byte)false;
                        this.dP = 0;
                        this.ce = (byte)-2;
                        return true;
                    } else if (this.ce == -2) {
```

## L8145

```java
                        return true;
                    } else {
                        --this.dP;
                        if (this.dP >= 0) return true;
                        this.dQ = (byte)false;
                        this.dP = 0;
                        this.ce = (byte)false;
                        this.cc = 0;
                        this.dL = null;
```

## L8429

```java
                    var1_1.fillRect(0, 0, this.u, this.v);
                    var3_7 = this.dL;
                    var5_9 = this.cc;
                    var6_11 = this.u;
                    var2_4 = this.dQ == 1 ? -this.e(this.u) : this.e(this.u);
                    this.b(var1_1, var3_7, 0, var5_9 * 100, 176, 100, (var6_11 - 176 >> 1) + var2_4, this.v - 100 >> 1);
                    ** break;
                }
                case 11: {
```

