# `a.B` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L3709

```java
                    this.b(graphics, this.cn, 72 + n * 27, 0, 27, 18, this.el, n7 + 3 + 2 - 1);
                }
            } else if (this.ea == 3) {
                n8 = this.dZ[n6];
                if (this.B[n8 - 1]) {
                    this.b(graphics, this.cn, 18, 0, 31, 18, this.el, n7 + 3 + 2 - 1);
                } else {
                    this.b(graphics, this.cn, 0, 0, 18, 18, this.el + 6, n7 + 3 + 2 - 1);
                }
```

## L6695

```java
            var3_4 = RecordStore.openRecordStore((String)"BC5Data", (boolean)true);
        }
        for (var4_6 = 0; var4_6 < 4; ++var4_6) {
            this.A[var4_6] = (byte)false;
            this.B[var4_6] = false;
        }
        for (var4_6 = 0; var4_6 < this.D.length; ++var4_6) {
            this.D[var4_6] = (byte)false;
        }
```

## L6957

```java
                    n8 = n4;
                    break;
                }
                case 10: {
                    this.B[this.bV - 1] = true;
                    n8 = 1;
                    if (!this.i(this.bV, 10)) {
                        n6 = 0;
                        n5 = 4;
```

## L7044

```java
                var5_5 = var2_2;
                var6_7 /* !! */  = var4_4;
                var7_9 = var2_2;
                var8_16 /* !! */  = var4_4;
                this.B[var10_18] = var4_4.readBoolean();
                continue;
            }
            var10_18 = 0;
            while (true) {
```

## L7367

```java
                var6_6 = var10_18;
                var7_9 /* !! */  = var5_5;
                var8_11 = var10_18;
                var9_17 /* !! */  = var5_5;
                var5_5.writeBoolean(this.B[var11_19]);
                continue;
            }
            var11_19 = 0;
            while (true) {
```

## L8155

```java
                    }
                    return true;
                }
                case 12: {
                    return this.B();
                }
                case 13: {
                    return this.w();
                }
```

