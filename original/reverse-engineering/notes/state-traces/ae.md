# `a.ae` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2466

```java
                int n3;
                block28: {
                    int n4;
                    block27: {
                        n = (byte)(this.ae[n2] + 1);
                        if (n == 0) break block27;
                        n3 = n;
                        if (n < 8) break block28;
                    }
```

## L2483

```java
                    this.ac[n2] = (short)n4;
                    this.ad[n2] = (short)n3;
                    n3 = n;
                }
                this.ae[n2] = (byte)n3;
            }
            for (n = 0; n < this.dF; ++n) {
                for (n2 = 0; n2 < this.dE; ++n2) {
                    boolean bl = false;
```

## L4302

```java
            this.E = false;
            this.F = false;
        }
        this.e(this.bV, this.bU);
        this.ae();
        if (this.cW) {
            for (n = 0; n < 5; ++n) {
                this.cg[n] = this.b(this.u) << this.r;
                this.ch[n] = this.b(this.v) << this.r;
```

## L4366

```java
        this.aU = -1;
        this.aL = -1;
        this.aJ = -1;
        for (n = 0; n < 5; ++n) {
            this.ae[n] = (byte)(-this.b(8) - 1);
        }
        this.at = this.dw * this.h - 1;
        this.au = this.dx * this.i - 1;
        this.bK = this.at - this.dy;
```

## L6413

```java
    }

    private final void c(Graphics graphics, int n, int n2) {
        for (int i = 0; i < 5; ++i) {
            byte by = this.ae[i];
            if (by < 0) continue;
            int n3 = by / 6;
            this.b(graphics, this.ct, 96 + (by - n3 * 6) * 16, 672 + n3 * 16, 16, 16, this.ac[i] - n - 8, this.ad[i] - n2 - 8);
        }
```

## L7585

```java
            this.bL = 0;
        }
        n2 = 0;
        while (n2 < 5) {
            this.ae[n2] = (byte)this.b(8);
            this.ac[n2] = (short)(this.h + this.b(this.u));
            this.ad[n2] = (short)-16;
            ++n2;
        }
```

## L7605

```java
            short s;
            short s2;
            block8: {
                block7: {
                    s = s2 = this.ae[i];
                    if (this.bG == 0) {
                        s = (byte)(s2 + 1);
                    }
                    short s3 = (short)(this.ac[i] - 3);
```

## L7618

```java
                s = 0;
                s2 = (short)(this.h + this.b(this.u));
                this.ad[i] = (short)this.b(this.v);
            }
            this.ae[i] = (byte)s;
            this.ac[i] = s2;
        }
        ++this.bG;
        if (this.bG >= 4) {
```

