# `a.cW` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L3081

```java
                n7 = n2 + (n3 + 72 + 2);
            }
            this.b(graphics, this.cm, n, 0, n4, n3, n5 + (n6 - n4 >> 1) - this.bI, n7 - this.bJ);
        }
        if (this.cW) {
            for (n = 0; n < 5; ++n) {
                this.b(graphics, this.cm, 338, 0, 12, 8, this.cg[n] >> this.r, this.ch[n] >> this.r);
            }
        } else {
```

## L4296

```java
        this.da = false;
        this.cS = (short)-1;
        this.dp = -1;
        this.ds = (byte)-1;
        this.cW = false;
        if (this.bV == 0) {
            this.E = false;
            this.F = false;
        }
```

## L4303

```java
            this.F = false;
        }
        this.e(this.bV, this.bU);
        this.ae();
        if (this.cW) {
            for (n = 0; n < 5; ++n) {
                this.cg[n] = this.b(this.u) << this.r;
                this.ch[n] = this.b(this.v) << this.r;
            }
```

## L4497

```java
                    this.aq = n2 * this.i;
                } else if (n3 == -56) {
                    ++this.cC;
                } else if (n3 == 77) {
                    this.cW = true;
                } else if (this.bV == 0 && this.bU == 1 && (n3 & 0xFF) >= 151 && (n3 & 0xFF) <= 157) {
                    if (byArray[n3 = (n3 & 0xFF) - 151] > 0) {
                        byArray[n3] = (byte)(byArray[n3] - 1);
                    } else {
```

## L8064

```java
                    }
                    this.P();
                    this.S();
                    this.V();
                    if (this.cW) {
                        this.T();
                    } else {
                        this.U();
                    }
```

