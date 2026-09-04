# `a.A` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L1724

```java
                                this.aa();
                                this.d(true);
                                return true;
                            } else {
                                this.A();
                            }
                            return true;
                        }
                        --this.av;
```

## L4864

```java
lbl58:
                        // 1 sources

                        if (this.bU != 2 && this.bU != 3) ** GOTO lbl51
                        this.A();
                        ** continue;
                    }
                    case 10: {
                        this.ar();
```

## L4957

```java
                        var7_7 = var3_3;
                        ** GOTO lbl12
                    }
                    case 14: {
                        this.A();
                        var6_6 = var1_1;
                        var7_7 = var3_3;
                        ** GOTO lbl12
                    }
```

## L5168

```java
                }
lbl256:
                // 1 sources

                this.bU = this.A[var5_5 - 1];
                if (this.bU != 11 || !this.i(this.bV, 11)) ** GOTO lbl260
                this.bU = 3;
                ** GOTO lbl250
lbl260:
```

## L5918

```java
                    var2_2 = 0;
                    while (true) {
                        var1_1 = var3_3;
                        if (var2_2 >= 4) ** GOTO lbl53
                        if (this.A[var2_2] <= 0) ** GOTO lbl109
                        this.dY[var9_9] = this.a[1];
                        var11_11 /* !! */  = this.dZ;
                        var1_1 = var9_9 + 1;
                        var11_11 /* !! */ [var9_9] = (short)true;
```

## L6169

```java
                        if (var2_2 == 0) ** GOTO lbl237
                        var1_1 = var9_9;
                        if (var2_2 != 1) ** GOTO lbl241
                        var1_1 = var9_9;
                        if (this.A[var3_3] <= 0) ** GOTO lbl241
lbl237:
                        // 2 sources

                        this.dY[var9_9] = this.cz[var3_3];
```

## L6694

```java
            RecordStore.deleteRecordStore((String)"BC5Data");
            var3_4 = RecordStore.openRecordStore((String)"BC5Data", (boolean)true);
        }
        for (var4_6 = 0; var4_6 < 4; ++var4_6) {
            this.A[var4_6] = (byte)false;
            this.B[var4_6] = false;
        }
        for (var4_6 = 0; var4_6 < this.D.length; ++var4_6) {
            this.D[var4_6] = (byte)false;
```

## L6977

```java
                case 9: 
            }
            break;
        } while (true);
        byte[] byArray = this.A;
        n3 = this.bV;
        n8 = n8 == 0 ? n5 : 0;
        byArray[n3 - 1] = (byte)n8;
        this.h();
```

## L7039

```java
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
                this.A[var10_18] = var4_4.readByte();
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
```

## L7362

```java
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
                var5_5.writeByte(this.A[var11_19]);
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
```

