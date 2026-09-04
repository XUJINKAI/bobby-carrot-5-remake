# `a.bx` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2428

```java
                this.bA = (byte)0;
            }
        }
        int n = this.bw >> this.r;
        int n2 = this.bx >> this.r;
        if (n == this.by) {
            this.by = this.b(this.at + 1 - 24);
        }
        if (n2 == this.bz) {
```

## L2442

```java
            n3 = -n3;
        }
        this.bw = n4 + n3;
        n3 = this.b(24);
        n4 = this.bx;
        if (n2 >= this.bz) {
            n3 = -n3;
        }
        this.bx = n4 + n3;
```

## L2446

```java
        n4 = this.bx;
        if (n2 >= this.bz) {
            n3 = -n3;
        }
        this.bx = n4 + n3;
    }

    /*
     * Enabled aggressive block sorting
```

## L3086

```java
            for (n = 0; n < 5; ++n) {
                this.b(graphics, this.cm, 338, 0, 12, 8, this.cg[n] >> this.r, this.ch[n] >> this.r);
            }
        } else {
            this.b(graphics, this.cq, 0, this.bA / 3 * 24, 24, 24, (this.bw >> this.r) - this.bI, (this.bx >> this.r) - this.bJ);
        }
        this.b(graphics);
        if (this.ba != -1) {
            this.b(graphics, this.cr, this.ba * 48, 0, 48, 48, this.u - 48 >> 1, this.v - 48 >> 1);
```

## L4313

```java
            n = this.b(2) == 0 ? -24 : this.at + 1;
            this.by = n;
            this.bz = this.b(this.au + 1 - 24);
            this.bw = this.by << this.r;
            this.bx = this.bz << this.r;
        }
        this.bq = -1;
        this.bX = 0;
        this.dg = false;
```

