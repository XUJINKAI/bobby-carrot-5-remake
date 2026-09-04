# `a.I` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L965

```java
                        this.f(this.bI, this.bJ);
                        this.aN = 0;
                        this.bi = true;
                        this.av = 0;
                        this.b(this.I());
                        break;
                    }
                    case 2: {
                        this.aX = (byte)false;
```

## L976

```java
                        this.cv[this.as][this.ar] = (byte)-36;
                        this.f(this.bI, this.bJ);
                        ++this.ar;
                        this.ap += this.h;
                        this.b(this.I());
                        this.O = false;
                        this.N = false;
                        this.Q = false;
                        this.P = false;
```

## L1131

```java
            if (by2 == -51) {
                this.de = false;
                if (this.cV && !this.df) {
                    this.df = true;
                    this.b(this.I());
                    this.m();
                    this.bZ = 0L;
                }
                this.cv[this.as][this.ar] = (byte)-1;
```

## L1185

```java
                this.J = (short)(this.J + 1);
                this.cv[this.as][this.ar] = (byte)-1;
                this.f(this.bI, this.bJ);
                this.a(true, this.bV, this.bU);
                this.I = (short)(this.I + this.bX);
                this.eg = (byte)0;
                this.h();
                this.d(false);
                this.l();
```

## L1308

```java
        }
        if ((by & 0xFF) < 151) return;
        if ((by & 0xFF) > 157) return;
        int n = (by & 0xFF) - 151;
        by2 = this.I >= this.bu[n] ? (byte)1 : 0;
        int n2 = by2 != 0 ? n : -1;
        StringBuffer stringBuffer = new StringBuffer().append(this.a[82 + n]).append(this.a[91 + n]);
        String string = by2 != 0 ? this.a[99] : this.a[98];
        String string2 = stringBuffer.append(string).toString();
```

## L4116

```java
                // 1 sources

                if (this.de) ** GOTO lbl173
                var1_1 = 7;
                if (this.I >= 3) {
                    var8_8 = new StringBuffer().append(this.a[113]).append(this.a[115]).append(this.I).append(this.a[116]).toString();
                } else {
                    var8_8 = new StringBuffer().append(this.a[113]).append(this.a[117]).toString();
                    var2_2 = 1;
```

## L4117

```java

                if (this.de) ** GOTO lbl173
                var1_1 = 7;
                if (this.I >= 3) {
                    var8_8 = new StringBuffer().append(this.a[113]).append(this.a[115]).append(this.I).append(this.a[116]).toString();
                } else {
                    var8_8 = new StringBuffer().append(this.a[113]).append(this.a[117]).toString();
                    var2_2 = 1;
                }
```

## L4148

```java
                // 1 sources

                if (this.bV != 0) return false;
                if (this.bU == 1) {
                    this.a(-1, new StringBuffer().append(this.a[100]).append(this.I).append(this.a[101]).toString(), this.a[30], null);
                    return false;
                }
                if (this.bU == 2) {
                    if (this.J > 0) {
```

## L4212

```java
            this.C = true;
            return true;
        }
        if (this.an == 7) {
            if (this.I < 3) {
                this.dg = true;
            } else {
                this.I = (short)(this.I - 3);
            }
```

## L4215

```java
        if (this.an == 7) {
            if (this.I < 3) {
                this.dg = true;
            } else {
                this.I = (short)(this.I - 3);
            }
            this.de = true;
            return true;
        }
```

## L4233

```java
            this.f();
            this.x = 3;
            return true;
        }
        this.I = (short)(this.I - this.bu[this.an]);
        this.cu[this.as][this.ar] = (byte)-98;
        this.f(this.bI, this.bJ);
        byte[] byArray = this.D;
        int n = this.an;
```

## L4421

```java
                }
            }
        }
        this.a((byte)75, string, (byte)1);
        this.b(this.I());
    }

    private final void ac() {
        this.cu = null;
```

## L4927

```java
                        ** GOTO lbl73
lbl94:
                        // 1 sources

                        this.b(this.I());
                        ** continue;
lbl96:
                        // 1 sources

```

## L5076

```java
                        this.H = (byte)(this.H + 1);
                        if (this.H > this.D[4]) {
                            this.H = (byte)-1;
                        }
                        this.b(this.I());
                        this.h();
                        var8_11 = this.dY;
                        var7_7 = this.eb;
                        var9_16 = new StringBuffer().append(this.a[89]);
```

## L5367

```java
    /*
     * Enabled aggressive block sorting
     */
    private final void ap() {
        this.I = (short)(this.I + this.bX);
        this.eg = (byte)0;
        this.d(false);
        if (this.c == 1) {
            this.a("/cleared.mid", (int)this.bt, false);
```

## L5403

```java
            stringBuffer.append(this.bY);
            this.a(stringBuffer, "", n - (stringBuffer.length() - n3), ' ', false);
            stringBuffer.append("#");
            stringBuffer.append(this.a[47]);
            this.a(stringBuffer, String.valueOf(this.I), n, ' ', false);
            this.en = stringBuffer.toString();
            this.d(null);
        } else {
            this.en = null;
```

## L6704

```java
        try {
            this.E = false;
            this.F = false;
            this.H = (byte)false;
            this.I = (short)false;
            this.J = (short)false;
            this.K = 0L;
            this.L = this.z.nextInt();
            for (var4_6 = 0; var4_6 < this.M.length; ++var4_6) {
```

## L7082

```java
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.I = var4_4.readShort();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
```

## L7405

```java
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeShort(this.I);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
```

## L8231

```java
                this.Y = true;
            } else if (n == 35) {
                if (this.Y) {
                    this.Y = false;
                    this.I = (short)(this.I + 5);
                }
            } else {
                this.Y = false;
            }
```

