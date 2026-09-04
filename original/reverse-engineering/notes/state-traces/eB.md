# `a.eB` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L340

```java
        this.dl = new byte[5];
        this.dm = new byte[5];
        this.dn = new byte[5];
        this.dS = new short[]{0, 0, 1, 3, 5, 8, 12, 17, 23, 31, 41, 53, 70, 91, 118, 153, 198, 256, 256};
        this.eB = (byte)0;
        this.eC = new short[]{59, 58, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80};
        byte[] byArray = new byte[]{};
        byte[] byArray2 = new byte[]{-54, -52};
        byte[] byArray3 = new byte[]{-36, -96, -35};
```

## L5431

```java
        return true;
    }

    private final void ar() {
        this.a(this.a[this.eC[this.eB]], this.i + 12, (byte)-1);
        this.x = 8;
    }

    /*
```

## L5442

```java
    private final boolean as() {
        boolean bl = false;
        if (this.Q) {
            this.Q = false;
            this.eB = (byte)(this.eB + 1);
            if (this.eB >= this.eC.length) {
                this.eB = (byte)0;
            }
            this.et = 0;
```

## L5443

```java
        boolean bl = false;
        if (this.Q) {
            this.Q = false;
            this.eB = (byte)(this.eB + 1);
            if (this.eB >= this.eC.length) {
                this.eB = (byte)0;
            }
            this.et = 0;
            this.eA = this.a[this.eC[this.eB]];
```

## L5444

```java
        if (this.Q) {
            this.Q = false;
            this.eB = (byte)(this.eB + 1);
            if (this.eB >= this.eC.length) {
                this.eB = (byte)0;
            }
            this.et = 0;
            this.eA = this.a[this.eC[this.eB]];
            this.ev = this.u;
```

## L5447

```java
            if (this.eB >= this.eC.length) {
                this.eB = (byte)0;
            }
            this.et = 0;
            this.eA = this.a[this.eC[this.eB]];
            this.ev = this.u;
            this.a(null, 0, 0, true, true, true, true);
            bl = true;
            return bl | this.an();
```

## L5455

```java
            return bl | this.an();
        }
        if (!this.P) return bl | this.an();
        this.P = false;
        this.eB = (byte)(this.eB - 1);
        if (this.eB < 0) {
            this.eB = (byte)(this.eC.length - 1);
        }
        this.et = 0;
```

## L5456

```java
        }
        if (!this.P) return bl | this.an();
        this.P = false;
        this.eB = (byte)(this.eB - 1);
        if (this.eB < 0) {
            this.eB = (byte)(this.eC.length - 1);
        }
        this.et = 0;
        this.eA = this.a[this.eC[this.eB]];
```

## L5457

```java
        if (!this.P) return bl | this.an();
        this.P = false;
        this.eB = (byte)(this.eB - 1);
        if (this.eB < 0) {
            this.eB = (byte)(this.eC.length - 1);
        }
        this.et = 0;
        this.eA = this.a[this.eC[this.eB]];
        this.ev = this.u;
```

## L5460

```java
        if (this.eB < 0) {
            this.eB = (byte)(this.eC.length - 1);
        }
        this.et = 0;
        this.eA = this.a[this.eC[this.eB]];
        this.ev = this.u;
        this.a(null, 0, 0, true, true, true, true);
        bl = true;
        return bl | this.an();
```

## L6770

```java
                        block3: {
                            block5: {
                                if (!bl || (bl = false)) break block3;
                                if (this.dQ != 0) break block4;
                                if (this.eD[this.eB].length != 0) break block5;
                                String string = this.eB == 0 ? this.a[49] : this.a[50];
                                this.a(string, graphics, this.u >> 1, 6 + (this.i - this.g >> 1), true);
                                break block6;
                            }
```

## L6771

```java
                            block5: {
                                if (!bl || (bl = false)) break block3;
                                if (this.dQ != 0) break block4;
                                if (this.eD[this.eB].length != 0) break block5;
                                String string = this.eB == 0 ? this.a[49] : this.a[50];
                                this.a(string, graphics, this.u >> 1, 6 + (this.i - this.g >> 1), true);
                                break block6;
                            }
                            n5 = this.eD[this.eB].length;
```

## L6775

```java
                                String string = this.eB == 0 ? this.a[49] : this.a[50];
                                this.a(string, graphics, this.u >> 1, 6 + (this.i - this.g >> 1), true);
                                break block6;
                            }
                            n5 = this.eD[this.eB].length;
                            n2 = this.u - n5 * (this.h + this.l) + this.l >> 1;
                            n4 = this.i;
                            n3 = 0;
                        }
```

## L6788

```java
                }
                this.a(graphics, null, this.a[29], true);
                return;
            }
            byte by = this.eD[this.eB][n3];
            this.a(graphics, true, by, n2, n - n4 >> 1);
            int n6 = this.h;
            int n7 = by != -24 && by != -40 && by != -39 ? this.l : 0;
            n2 += n6 + n7;
```

