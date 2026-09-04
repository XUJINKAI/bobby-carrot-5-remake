# `a.D` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L1056

```java
            return "/mow.mid";
        }
        if (this.bV != 0) {
            if (!this.cV) {
                if (this.H == -1) return new StringBuffer().append("/ingame").append(this.b(this.D[4] + 1)).append(".mid").toString();
                return new StringBuffer().append("/ingame").append(this.H).append(".mid").toString();
            }
            if (this.df) return "/bonus.mid";
            return "/shop.mid";
```

## L4091

```java
            }
            case -51: {
                if (this.bi != false) return false;
                if (this.de != false) return true;
                if (this.D[2] != 0) return true;
                this.aY = (byte)true;
                this.aA = 4;
                return false;
            }
```

## L4107

```java
            case -9: {
                if (!this.cV) ** GOTO lbl184
                var2_2 = 0;
                if (this.df) ** GOTO lbl176
                if (this.D[2] <= 0) ** GOTO lbl165
                var1_1 = -1;
                var8_8 = new StringBuffer().append(this.a[113]).append(this.a[114]).toString();
                ** GOTO lbl178
lbl165:
```

## L4173

```java
                }
                return false;
            }
            case -21: {
                this.D();
                return false;
            }
            case -19: {
                if (this.bi == false) return false;
```

## L4236

```java
        }
        this.I = (short)(this.I - this.bu[this.an]);
        this.cu[this.as][this.ar] = (byte)-98;
        this.f(this.bI, this.bJ);
        byte[] byArray = this.D;
        int n = this.an;
        byArray[n] = (byte)(byArray[n] + 1);
        if (this.an == 4) {
            this.H = this.D[4];
```

## L4240

```java
        byte[] byArray = this.D;
        int n = this.an;
        byArray[n] = (byte)(byArray[n] + 1);
        if (this.an == 4) {
            this.H = this.D[4];
        }
        this.h();
        return true;
    }
```

## L4463

```java
        byArray2[4] = 0;
        byArray2[5] = 0;
        byArray2[6] = 0;
        if (this.bV == 0 && this.bU == 1) {
            byArray[6] = (byte)(1 - this.D[6]);
            byArray[4] = (byte)(2 - this.D[4]);
            byArray[3] = (byte)(1 - this.D[3]);
            byArray[5] = (byte)(1 - this.D[5]);
            byArray[2] = (byte)(1 - this.D[2]);
```

## L4464

```java
        byArray2[5] = 0;
        byArray2[6] = 0;
        if (this.bV == 0 && this.bU == 1) {
            byArray[6] = (byte)(1 - this.D[6]);
            byArray[4] = (byte)(2 - this.D[4]);
            byArray[3] = (byte)(1 - this.D[3]);
            byArray[5] = (byte)(1 - this.D[5]);
            byArray[2] = (byte)(1 - this.D[2]);
            byArray[0] = (byte)(1 - this.D[0]);
```

## L4465

```java
        byArray2[6] = 0;
        if (this.bV == 0 && this.bU == 1) {
            byArray[6] = (byte)(1 - this.D[6]);
            byArray[4] = (byte)(2 - this.D[4]);
            byArray[3] = (byte)(1 - this.D[3]);
            byArray[5] = (byte)(1 - this.D[5]);
            byArray[2] = (byte)(1 - this.D[2]);
            byArray[0] = (byte)(1 - this.D[0]);
            byArray[1] = (byte)(1 - this.D[1]);
```

## L4466

```java
        if (this.bV == 0 && this.bU == 1) {
            byArray[6] = (byte)(1 - this.D[6]);
            byArray[4] = (byte)(2 - this.D[4]);
            byArray[3] = (byte)(1 - this.D[3]);
            byArray[5] = (byte)(1 - this.D[5]);
            byArray[2] = (byte)(1 - this.D[2]);
            byArray[0] = (byte)(1 - this.D[0]);
            byArray[1] = (byte)(1 - this.D[1]);
        }
```

## L4467

```java
            byArray[6] = (byte)(1 - this.D[6]);
            byArray[4] = (byte)(2 - this.D[4]);
            byArray[3] = (byte)(1 - this.D[3]);
            byArray[5] = (byte)(1 - this.D[5]);
            byArray[2] = (byte)(1 - this.D[2]);
            byArray[0] = (byte)(1 - this.D[0]);
            byArray[1] = (byte)(1 - this.D[1]);
        }
        this.cC = 0;
```

## L4468

```java
            byArray[4] = (byte)(2 - this.D[4]);
            byArray[3] = (byte)(1 - this.D[3]);
            byArray[5] = (byte)(1 - this.D[5]);
            byArray[2] = (byte)(1 - this.D[2]);
            byArray[0] = (byte)(1 - this.D[0]);
            byArray[1] = (byte)(1 - this.D[1]);
        }
        this.cC = 0;
        int n = 0;
```

## L4469

```java
            byArray[3] = (byte)(1 - this.D[3]);
            byArray[5] = (byte)(1 - this.D[5]);
            byArray[2] = (byte)(1 - this.D[2]);
            byArray[0] = (byte)(1 - this.D[0]);
            byArray[1] = (byte)(1 - this.D[1]);
        }
        this.cC = 0;
        int n = 0;
        boolean bl = this.bV != 0 && (this.bU == 11 || this.bU == 12);
```

## L5073

```java
                        ** continue;
                    }
                    case 32: {
                        this.H = (byte)(this.H + 1);
                        if (this.H > this.D[4]) {
                            this.H = (byte)-1;
                        }
                        this.b(this.I());
                        this.h();
```

## L5717

```java
                n2 = n - 37;
                graphics.setClip(n2, n3, 35, 36);
                graphics.drawImage(this.cm, n2 - 247, n3, 20);
            }
            if (this.de || this.D[2] > 0) {
                n = n2 - 24;
                graphics.setClip(n, n3, 22, 35);
                graphics.drawImage(this.cm, n - 121, n3, 20);
            }
```

## L5967

```java
                            var11_11 /* !! */  = this.dZ;
                            var2_2 = var1_1 + 1;
                            var11_11 /* !! */ [var1_1] = (short)13;
                            var1_1 = var2_2;
                            if (this.D[3] > 0) {
                                this.dY[var2_2] = this.a[6];
                                var11_11 /* !! */  = this.dZ;
                                var1_1 = var2_2 + 1;
                                var11_11 /* !! */ [var2_2] = (short)16;
```

## L6008

```java
                        var2_2 = var9_9 + 1;
                        var11_11 /* !! */ [var9_9] = (short)99;
                    }
                    var1_1 = var2_2;
                    if (this.D[5] <= 0) ** GOTO lbl134
                    var12_12 = this.dY;
                    var13_13 = new StringBuffer().append(this.a[87]);
                    var11_11 /* !! */  = (short[])this.a;
                    if (!this.F) ** GOTO lbl189
```

## L6026

```java
lbl134:
                        // 2 sources

                        var2_2 = var1_1;
                        if (this.D[6] <= 0) ** GOTO lbl146
                        var13_13 = this.dY;
                        var12_12 = new StringBuffer().append(this.a[88]);
                        var11_11 /* !! */  = (short[])this.a;
                        if (!this.E) ** GOTO lbl191
```

## L6076

```java
                                var6_6 = var10_10;
                                if (this.bV == 0) ** GOTO lbl183
                                var1_1 = var2_2;
                                var6_6 = var10_10;
                                if (this.D[4] <= 0) ** GOTO lbl183
                                var12_12 = this.dY;
                                var13_13 = new StringBuffer().append(this.a[89]);
                                if (this.H == -1) ** GOTO lbl195
                                var11_11 /* !! */  = (short[])Integer.toString(this.H + 1);
```

## L6187

```java
                    }
                }
                case 4: {
                    var2_2 = var8_8;
                    if (this.D[0] > 0) {
                        this.dY[var9_9] = this.a[25];
                        var11_11 /* !! */  = this.dZ;
                        var2_2 = var9_9 + 1;
                        var11_11 /* !! */ [var9_9] = (short)true;
```

## L6195

```java
                        var11_11 /* !! */ [var9_9] = (short)true;
                    }
                    var1_1 = var2_2;
                    var6_6 = var10_10;
                    if (this.D[1] <= 0) ** GOTO lbl24
                    this.dY[var2_2] = this.a[26];
                    var11_11 /* !! */  = this.dZ;
                    var1_1 = var2_2 + 1;
                    var11_11 /* !! */ [var2_2] = (short)2;
```

## L6697

```java
        for (var4_6 = 0; var4_6 < 4; ++var4_6) {
            this.A[var4_6] = (byte)false;
            this.B[var4_6] = false;
        }
        for (var4_6 = 0; var4_6 < this.D.length; ++var4_6) {
            this.D[var4_6] = (byte)false;
        }
        try {
            this.E = false;
```

## L6698

```java
            this.A[var4_6] = (byte)false;
            this.B[var4_6] = false;
        }
        for (var4_6 = 0; var4_6 < this.D.length; ++var4_6) {
            this.D[var4_6] = (byte)false;
        }
        try {
            this.E = false;
            this.F = false;
```

## L7053

```java
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
                if (var10_18 >= this.D.length) break;
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
```

## L7058

```java
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
                this.D[var10_18] = var4_4.readByte();
                ++var10_18;
                continue;
                break;
            }
```

## L7376

```java
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
                if (var11_19 >= this.D.length) break;
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
```

## L7381

```java
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
                var5_5.writeByte(this.D[var11_19]);
                ++var11_19;
                continue;
                break;
            }
```

