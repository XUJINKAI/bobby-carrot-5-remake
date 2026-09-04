# `a.de` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L1128

```java
        }
        this.bj = false;
        if (!this.bi) {
            if (by2 == -51) {
                this.de = false;
                if (this.cV && !this.df) {
                    this.df = true;
                    this.b(this.I());
                    this.m();
```

## L4090

```java
                return false;
            }
            case -51: {
                if (this.bi != false) return false;
                if (this.de != false) return true;
                if (this.D[2] != 0) return true;
                this.aY = (byte)true;
                this.aA = 4;
                return false;
```

## L4114

```java
                ** GOTO lbl178
lbl165:
                // 1 sources

                if (this.de) ** GOTO lbl173
                var1_1 = 7;
                if (this.I >= 3) {
                    var8_8 = new StringBuffer().append(this.a[113]).append(this.a[115]).append(this.I).append(this.a[116]).toString();
                } else {
```

## L4217

```java
                this.dg = true;
            } else {
                this.I = (short)(this.I - 3);
            }
            this.de = true;
            return true;
        }
        if (this.an == 9) {
            this.u();
```

## L4318

```java
        }
        this.bq = -1;
        this.bX = 0;
        this.dg = false;
        this.de = false;
        this.df = false;
        this.cD = 0;
        this.cb = true;
        this.bZ = 0L;
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

