# `a.H` 引用上下文

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

## L1057

```java
        }
        if (this.bV != 0) {
            if (!this.cV) {
                if (this.H == -1) return new StringBuffer().append("/ingame").append(this.b(this.D[4] + 1)).append(".mid").toString();
                return new StringBuffer().append("/ingame").append(this.H).append(".mid").toString();
            }
            if (this.df) return "/bonus.mid";
            return "/shop.mid";
        }
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

## L5072

```java
                        var7_7 = 3;
                        ** continue;
                    }
                    case 32: {
                        this.H = (byte)(this.H + 1);
                        if (this.H > this.D[4]) {
                            this.H = (byte)-1;
                        }
                        this.b(this.I());
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

## L5074

```java
                    }
                    case 32: {
                        this.H = (byte)(this.H + 1);
                        if (this.H > this.D[4]) {
                            this.H = (byte)-1;
                        }
                        this.b(this.I());
                        this.h();
                        var8_11 = this.dY;
```

## L5081

```java
                        this.h();
                        var8_11 = this.dY;
                        var7_7 = this.eb;
                        var9_16 = new StringBuffer().append(this.a[89]);
                        if (this.H == -1) ** GOTO lbl207
                        var10_21 = Integer.toString(this.H + 1);
lbl202:
                        // 2 sources

```

## L5082

```java
                        var8_11 = this.dY;
                        var7_7 = this.eb;
                        var9_16 = new StringBuffer().append(this.a[89]);
                        if (this.H == -1) ** GOTO lbl207
                        var10_21 = Integer.toString(this.H + 1);
lbl202:
                        // 2 sources

                        while (true) {
```

## L6079

```java
                                var6_6 = var10_10;
                                if (this.D[4] <= 0) ** GOTO lbl183
                                var12_12 = this.dY;
                                var13_13 = new StringBuffer().append(this.a[89]);
                                if (this.H == -1) ** GOTO lbl195
                                var11_11 /* !! */  = (short[])Integer.toString(this.H + 1);
lbl177:
                                // 2 sources

```

## L6080

```java
                                if (this.D[4] <= 0) ** GOTO lbl183
                                var12_12 = this.dY;
                                var13_13 = new StringBuffer().append(this.a[89]);
                                if (this.H == -1) ** GOTO lbl195
                                var11_11 /* !! */  = (short[])Integer.toString(this.H + 1);
lbl177:
                                // 2 sources

                                while (true) {
```

## L6703

```java
        }
        try {
            this.E = false;
            this.F = false;
            this.H = (byte)false;
            this.I = (short)false;
            this.J = (short)false;
            this.K = 0L;
            this.L = this.z.nextInt();
```

## L7077

```java
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.H = var4_4.readByte();
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
```

## L7400

```java
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeByte(this.H);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
```

## L8054

```java
                        if (this.aB == 0) {
                            --this.aA;
                        }
                    }
                    if (this.H() == false) return true;
                    if (this.x != 1) {
                        return true;
                    }
                    if (this.ds > 0) {
```

