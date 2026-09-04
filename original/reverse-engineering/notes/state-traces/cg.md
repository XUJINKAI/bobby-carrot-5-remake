# `a.cg` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2399

```java
                this.cf = this.bJ;
                return;
            }
            if (this.ch[n2] >> this.r > this.v) {
                this.cg[n2] = this.b(this.u) << this.r;
                this.ch[n2] = -(this.b(10) << this.r);
            }
            int[] nArray = this.cg;
            nArray[n2] = nArray[n2] + (this.b(3) - 1 << this.r);
```

## L2402

```java
            if (this.ch[n2] >> this.r > this.v) {
                this.cg[n2] = this.b(this.u) << this.r;
                this.ch[n2] = -(this.b(10) << this.r);
            }
            int[] nArray = this.cg;
            nArray[n2] = nArray[n2] + (this.b(3) - 1 << this.r);
            nArray = this.ch;
            nArray[n2] = nArray[n2] + n;
            ++n2;
```

## L3083

```java
            this.b(graphics, this.cm, n, 0, n4, n3, n5 + (n6 - n4 >> 1) - this.bI, n7 - this.bJ);
        }
        if (this.cW) {
            for (n = 0; n < 5; ++n) {
                this.b(graphics, this.cm, 338, 0, 12, 8, this.cg[n] >> this.r, this.ch[n] >> this.r);
            }
        } else {
            this.b(graphics, this.cq, 0, this.bA / 3 * 24, 24, 24, (this.bw >> this.r) - this.bI, (this.bx >> this.r) - this.bJ);
        }
```

## L4305

```java
        this.e(this.bV, this.bU);
        this.ae();
        if (this.cW) {
            for (n = 0; n < 5; ++n) {
                this.cg[n] = this.b(this.u) << this.r;
                this.ch[n] = this.b(this.v) << this.r;
            }
        } else {
            n = this.b(2) == 0 ? -24 : this.at + 1;
```

