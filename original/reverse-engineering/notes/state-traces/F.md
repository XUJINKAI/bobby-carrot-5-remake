# `a.F` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L1366

```java
                case 0: {
                    if (!this.a(-1, 0, false)) break;
                    --this.ar;
                    this.ay = this.h;
                    if (!this.F) return true;
                    this.bl = true;
                    return true;
                }
                case 1: {
```

## L1374

```java
                case 1: {
                    if (!this.a(1, 0, false)) break;
                    ++this.ar;
                    this.ay = this.h;
                    if (!this.F) return true;
                    this.bl = true;
                    return true;
                }
                case 2: {
```

## L1382

```java
                case 2: {
                    if (!this.a(0, -1, false)) break;
                    --this.as;
                    this.ay = this.i;
                    if (!this.F) return true;
                    this.bl = true;
                    return true;
                }
                case 3: {
```

## L1390

```java
                case 3: {
                    if (!this.a(0, 1, false)) break;
                    ++this.as;
                    this.ay = this.i;
                    if (!this.F) return true;
                    this.bl = true;
                    return true;
                }
            }
```

## L1576

```java
                this.ay = this.h;
                this.bn = true;
                this.av = 1;
                if (this.bi) return true;
                if (!this.F) return true;
                this.bl = true;
                return true;
            }
        }
```

## L1589

```java
            --this.ar;
            this.aw = 0;
            this.ay = this.h;
            if (this.bi) return true;
            if (!this.F) return true;
            this.bl = true;
            return true;
        }
        if (this.Q) {
```

## L1599

```java
            ++this.ar;
            this.aw = 1;
            this.ay = this.h;
            if (this.bi) return true;
            if (!this.F) return true;
            this.bl = true;
            return true;
        }
        if (this.N) {
```

## L1609

```java
            --this.as;
            this.aw = 2;
            this.ay = this.h;
            if (this.bi) return true;
            if (!this.F) return true;
            this.bl = true;
            return true;
        }
        if (!this.O) return false;
```

## L1619

```java
        ++this.as;
        this.aw = 3;
        this.ay = this.h;
        if (this.bi) return true;
        if (!this.F) return true;
        this.bl = true;
        return true;
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

## L4299

```java
        this.ds = (byte)-1;
        this.cW = false;
        if (this.bV == 0) {
            this.E = false;
            this.F = false;
        }
        this.e(this.bV, this.bU);
        this.ae();
        if (this.cW) {
```

## L4996

```java
                        var6_6 = var1_1;
                        ** GOTO lbl12
                    }
                    case 30: {
                        if (this.F) ** GOTO lbl166
                        var6_6 = true;
lbl152:
                        // 2 sources

```

## L5002

```java
lbl152:
                        // 2 sources

                        while (true) {
                            this.F = var6_6;
                            this.h();
                            var8_9 = this.dY;
                            var4_4 = this.eb;
                            var9_14 = new StringBuffer().append(this.a[87]);
```

## L5008

```java
                            var8_9 = this.dY;
                            var4_4 = this.eb;
                            var9_14 = new StringBuffer().append(this.a[87]);
                            var10_19 = this.a;
                            if (!this.F) ** GOTO lbl168
                            var7_7 = 2;
lbl161:
                            // 2 sources

```

## L6012

```java
                    if (this.D[5] <= 0) ** GOTO lbl134
                    var12_12 = this.dY;
                    var13_13 = new StringBuffer().append(this.a[87]);
                    var11_11 /* !! */  = (short[])this.a;
                    if (!this.F) ** GOTO lbl189
                    var1_1 = 2;
lbl129:
                    // 2 sources

```

## L6702

```java
            this.D[var4_6] = (byte)false;
        }
        try {
            this.E = false;
            this.F = false;
            this.H = (byte)false;
            this.I = (short)false;
            this.J = (short)false;
            this.K = 0L;
```

## L7072

```java
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.F = var4_4.readBoolean();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
```

## L7395

```java
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeBoolean(this.F);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
```

## L8071

```java
                        this.U();
                    }
                    this.G();
                    if (this.E) {
                        this.F();
                    } else {
                        this.bq = -1;
                    }
                    if (this.dV) {
```

