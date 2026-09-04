# `a.bd` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2571

```java
        this.bR = 0;
        this.bQ = 0;
        this.bT = 0;
        this.bS = 0;
        this.bd = true;
        this.Y();
    }

    /*
```

## L2623

```java
                        }
                        if (n == 0) break block13;
                        if (n > this.bS + this.bQ) {
                            n4 = this.bQ;
                            n5 = this.bd || this.dV || this.aT > 0 ? 24 : 6;
                            if (n4 < n5) {
                                ++this.bQ;
                                this.bS += this.bQ;
                            }
```

## L2641

```java
                }
                if (n3 == 0) break block15;
                if (n3 > this.bT + this.bR) {
                    n4 = this.bR;
                    n5 = this.bd || this.dV || this.aT > 0 ? 24 : 6;
                    if (n4 < n5) {
                        ++this.bR;
                        this.bT += this.bR;
                    }
```

## L2669

```java
        n = this.bJ;
        n2 = bl ? this.bR : -this.bR;
        this.bJ = n + n2;
        this.g(this.bI, this.bJ);
        if (this.bd && this.bO == this.bI && this.bP == this.bJ) {
            this.bd = false;
        }
    }

```

## L2670

```java
        n2 = bl ? this.bR : -this.bR;
        this.bJ = n + n2;
        this.g(this.bI, this.bJ);
        if (this.bd && this.bO == this.bI && this.bP == this.bJ) {
            this.bd = false;
        }
    }

    private final void Z() {
```

## L4379

```java
        if (this.bL < 0) {
            this.bL = 0;
        }
        this.dV = false;
        this.bd = false;
        this.bM = 0;
        this.bN = 0;
        this.d(this.ap, this.aq);
        this.bI = this.bO;
```

## L8040

```java
                    }
                    if (this.eg > 0) {
                        this.eg = (byte)(this.eg - 1);
                    }
                    if (!this.bd && this.aT == 0 && this.aw != 5 && this.R) {
                        this.R = false;
                        var1_1 = this.dV == false;
                        this.dV = var1_1;
                        if (!this.dV) {
```

