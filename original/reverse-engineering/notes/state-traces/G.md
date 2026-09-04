# `a.G` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L1716

```java
                                this.bO = this.bI;
                                this.bP = this.bJ;
                                return true;
                            } else if (this.bU == 5) {
                                this.G = true;
                                this.h();
                                this.bV = this.bW;
                                this.bU = 1;
                                this.aa();
```

## L5150

```java
                this.y();
                if (this.c == 1) {
                    this.a();
                }
                if (!this.G) ** GOTO lbl263
                this.bV = var5_5;
                if (this.ef != 0) ** GOTO lbl256
                this.bU = 1;
lbl250:
```

## L6716

```java
        catch (Exception var1_2) {
            this.c();
            return;
        }
        this.G = false;
        var1_1 /* !! */  = (RecordStore)this.i();
        var3_4.addRecord((byte[])var1_1 /* !! */ , 0, ((RecordStore)var1_1 /* !! */ ).length);
lbl47:
        // 2 sources
```

## L7118

```java
            var5_5 = var2_2;
            var6_7 /* !! */  = var4_4;
            var7_9 = var2_2;
            var8_16 /* !! */  = var4_4;
            this.G = var4_4.readBoolean();
            if (var4_4 == null) break block45;
            try {
                var4_4.close();
            }
```

## L7441

```java
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
            var5_5.writeBoolean(this.G);
            var6_6 = var10_18;
            var7_9 /* !! */  = var5_5;
            var8_11 = var10_18;
            var9_17 /* !! */  = var5_5;
```

## L8069

```java
                        this.T();
                    } else {
                        this.U();
                    }
                    this.G();
                    if (this.E) {
                        this.F();
                    } else {
                        this.bq = -1;
```

