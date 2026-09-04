# `a.ac` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2479

```java
                        }
                    } else {
                        n = -1;
                    }
                    this.ac[n2] = (short)n4;
                    this.ad[n2] = (short)n3;
                    n3 = n;
                }
                this.ae[n2] = (byte)n3;
```

## L6416

```java
        for (int i = 0; i < 5; ++i) {
            byte by = this.ae[i];
            if (by < 0) continue;
            int n3 = by / 6;
            this.b(graphics, this.ct, 96 + (by - n3 * 6) * 16, 672 + n3 * 16, 16, 16, this.ac[i] - n - 8, this.ad[i] - n2 - 8);
        }
    }

    /*
```

## L7586

```java
        }
        n2 = 0;
        while (n2 < 5) {
            this.ae[n2] = (byte)this.b(8);
            this.ac[n2] = (short)(this.h + this.b(this.u));
            this.ad[n2] = (short)-16;
            ++n2;
        }
        return;
```

## L7609

```java
                    s = s2 = this.ae[i];
                    if (this.bG == 0) {
                        s = (byte)(s2 + 1);
                    }
                    short s3 = (short)(this.ac[i] - 3);
                    if (s >= 8) break block7;
                    s2 = s3;
                    if (s3 > -16) break block8;
                }
```

## L7619

```java
                s2 = (short)(this.h + this.b(this.u));
                this.ad[i] = (short)this.b(this.v);
            }
            this.ae[i] = (byte)s;
            this.ac[i] = s2;
        }
        ++this.bG;
        if (this.bG >= 4) {
            this.bG = 0;
```

