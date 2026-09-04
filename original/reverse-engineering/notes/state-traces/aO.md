# `a.aO` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L711

```java
    /*
     * Enabled aggressive block sorting
     */
    private final void G() {
        if (this.aO > 0) {
            --this.aO;
            int n = this.h * this.aO / 8;
            int n2 = this.b(n + 1);
            int n3 = this.b(n + 1);
```

## L712

```java
     * Enabled aggressive block sorting
     */
    private final void G() {
        if (this.aO > 0) {
            --this.aO;
            int n = this.h * this.aO / 8;
            int n2 = this.b(n + 1);
            int n3 = this.b(n + 1);
            this.bI += n2 - (n >> 1);
```

## L713

```java
     */
    private final void G() {
        if (this.aO > 0) {
            --this.aO;
            int n = this.h * this.aO / 8;
            int n2 = this.b(n + 1);
            int n3 = this.b(n + 1);
            this.bI += n2 - (n >> 1);
            this.bJ += n3 - (n >> 1);
```

## L1518

```java
            if (!bl) {
                if (this.bi && this.c(this.ar, this.as) == -19) {
                    this.cv[this.as][this.ar] = (byte)-1;
                    this.f(this.bI, this.bJ);
                    this.aO = 8;
                }
                this.aN = by2 == 0 || by == -108 ? 3 : --this.aN;
                if (by == -108) {
                    this.bn = true;
```

## L1529

```java
                this.ay = this.h;
                return true;
            }
            this.aN = 0;
            this.aO = 8;
            this.bf = false;
        }
        if (this.ay == 0 && by == -108) {
            by2 = 0;
```

## L1711

```java
                                this.ap();
                                return true;
                            } else if (this.bU == 1) {
                                this.ah();
                                this.aO = 0;
                                this.bO = this.bI;
                                this.bP = this.bJ;
                                return true;
                            } else if (this.bU == 5) {
```

## L4339

```java
        this.cZ = false;
        this.cY = false;
        this.cX = false;
        this.aN = 0;
        this.aO = 0;
        this.az = -1;
        this.bi = false;
        this.bj = false;
        this.bm = false;
```

## L8089

```java
                        this.X();
                    }
                    if (this.bO == this.bI) {
                        if (this.bP == this.bJ) return true;
                        if (this.aO != 0) return true;
                    }
                    this.Y();
                    return true;
                }
```

