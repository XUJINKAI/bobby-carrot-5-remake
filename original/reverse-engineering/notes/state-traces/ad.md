# `a.ad` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2480

```java
                    } else {
                        n = -1;
                    }
                    this.ac[n2] = (short)n4;
                    this.ad[n2] = (short)n3;
                    n3 = n;
                }
                this.ae[n2] = (byte)n3;
            }
```

## L5124

```java
                if (var10_22.compareTo(this.y) != 0) {
                    this.y = var10_22;
                    this.a(new StringBuffer().append(this.y).append(".dat").toString());
                    this.h();
                    this.ad();
                }
                if (this.x == 11) ** GOTO lbl238
                this.c((byte)0, (byte)-1);
lbl234:
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

## L6448

```java
        this.g();
        if (string.compareTo(this.y) != 0) {
            this.a(new StringBuffer().append(this.y).append(".dat").toString());
        }
        this.ad();
        this.j();
        this.ck = this.a(this.ck, "/numbers.png");
        this.cl = this.a(this.cl, "/arrows.png");
        this.cn = this.a(this.cn, "/misc.png");
```

## L7587

```java
        n2 = 0;
        while (n2 < 5) {
            this.ae[n2] = (byte)this.b(8);
            this.ac[n2] = (short)(this.h + this.b(this.u));
            this.ad[n2] = (short)-16;
            ++n2;
        }
        return;
    }
```

## L7616

```java
                    if (s3 > -16) break block8;
                }
                s = 0;
                s2 = (short)(this.h + this.b(this.u));
                this.ad[i] = (short)this.b(this.v);
            }
            this.ae[i] = (byte)s;
            this.ac[i] = s2;
        }
```

