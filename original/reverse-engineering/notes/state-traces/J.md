# `a.J` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L909

```java
        }
        if (this.ay != 0) {
            if (this.bg && this.ay <= this.j) {
                this.bg = false;
                this.J();
                if (this.bb == 0 && !this.bm) {
                    var14_13 = this.az != -1 ? this.m : 0;
                    this.aW = var14_13;
                }
```

## L1181

```java
                this.bj = true;
            } else if (by2 == -36) {
                this.aX = (byte)1;
            } else if (by2 == -10) {
                this.J = (short)(this.J + 1);
                this.cv[this.as][this.ar] = (byte)-1;
                this.f(this.bI, this.bJ);
                this.a(true, this.bV, this.bU);
                this.I = (short)(this.I + this.bX);
```

## L4152

```java
                    this.a(-1, new StringBuffer().append(this.a[100]).append(this.I).append(this.a[101]).toString(), this.a[30], null);
                    return false;
                }
                if (this.bU == 2) {
                    if (this.J > 0) {
                        this.a(9, new StringBuffer().append(this.a[102]).append(this.J).append(this.a[103]).toString(), this.a[32], this.a[33]);
                        return false;
                    } else {
                        this.a(-1, new StringBuffer().append(this.a[102]).append(this.a[104]).toString(), this.a[30], null);
```

## L4153

```java
                    return false;
                }
                if (this.bU == 2) {
                    if (this.J > 0) {
                        this.a(9, new StringBuffer().append(this.a[102]).append(this.J).append(this.a[103]).toString(), this.a[32], this.a[33]);
                        return false;
                    } else {
                        this.a(-1, new StringBuffer().append(this.a[102]).append(this.a[104]).toString(), this.a[30], null);
                    }
```

## L6705

```java
            this.E = false;
            this.F = false;
            this.H = (byte)false;
            this.I = (short)false;
            this.J = (short)false;
            this.K = 0L;
            this.L = this.z.nextInt();
            for (var4_6 = 0; var4_6 < this.M.length; ++var4_6) {
                this.M[var4_6] = "";
```

## L7087

```java
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.J = var4_4.readShort();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
```

## L7410

```java
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeShort(this.J);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
```

## L7687

```java
                }
            } else if (this.ar > this.ap) {
                this.ar -= 3;
            } else {
                this.J = (short)(this.J + 1);
                this.a(true, this.bW, 10);
                this.h();
                this.b(false, 0);
            }
```

## L7700

```java
        return true;
    }

    private final void s() {
        this.eA = new StringBuffer().append(this.a[120]).append(this.J).append(this.a[121]).toString();
        this.et = 0;
        this.er = this.i << 1;
        this.es = 0;
        this.ev = this.u;
```

## L7755

```java
     * Enabled aggressive block sorting
     */
    private final void u() {
        this.d(false);
        int n = this.J > 100 ? 100 : (int)this.J;
        this.ag = (byte)n;
        this.ah = new StringBuffer().append(" X ").append(this.ag).toString();
        this.aQ = 256;
        this.eA = new StringBuffer().append("0000 0000 0000 0000##").append(this.a[105]).toString();
```

## L7824

```java
                    this.er = this.i << 1;
                    this.es = 0;
                    this.ev = this.u;
                    this.a(null, 0, 0, false, false, false, false);
                    this.J = (short)(this.J - this.ag);
                    this.h();
                } else {
                    this.v();
                }
```

