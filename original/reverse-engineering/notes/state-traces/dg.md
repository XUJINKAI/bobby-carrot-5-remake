# `a.dg` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L897

```java
        if (this.aw == 5 && (this.R || this.S || this.T)) {
            this.T = false;
            this.S = false;
            this.R = false;
            if (!this.dg) {
                this.ab();
                this.d(true);
                return true;
            } else {
```

## L4213

```java
            return true;
        }
        if (this.an == 7) {
            if (this.I < 3) {
                this.dg = true;
            } else {
                this.I = (short)(this.I - 3);
            }
            this.de = true;
```

## L4317

```java
            this.bx = this.bz << this.r;
        }
        this.bq = -1;
        this.bX = 0;
        this.dg = false;
        this.de = false;
        this.df = false;
        this.cD = 0;
        this.cb = true;
```

## L6044

```java
lbl146:
                            // 2 sources

                            var1_1 = var2_2;
                            if (!this.dg) {
                                this.dY[var2_2] = this.a[27];
                                var11_11 /* !! */  = this.dZ;
                                var1_1 = var2_2 + 1;
                                var11_11 /* !! */ [var2_2] = (short)6;
```

