# `a.bf` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L1530

```java
                return true;
            }
            this.aN = 0;
            this.aO = 8;
            this.bf = false;
        }
        if (this.ay == 0 && by == -108) {
            by2 = 0;
            switch (this.aw) {
```

## L1658

```java
    /*
     * Enabled aggressive block sorting
     */
    private final boolean O() {
        if (!this.bf || this.aw <= 3 && !this.bm && (this.aN > 0 || this.F && !this.bi && this.bc <= 0)) {
            this.aD = (this.aD + 1) % 12;
            if (this.bi) {
                this.av = (this.av + 1) % 2;
            } else if (this.bm) {
```

## L1739

```java
            }
            if (this.ba != -1) {
                this.ba = (byte)((this.ba + 1) % 2);
            }
            this.bf = true;
        } else {
            this.bf = false;
        }
        if (this.aw > 3) return false;
```

## L1741

```java
                this.ba = (byte)((this.ba + 1) % 2);
            }
            this.bf = true;
        } else {
            this.bf = false;
        }
        if (this.aw > 3) return false;
        if (!this.bn) return false;
        this.av = 1;
```

## L4331

```java
        this.dU = false;
        this.ay = 0;
        this.aw = 6;
        this.be = false;
        this.bf = false;
        this.av = 9;
        this.bg = false;
        this.bh = false;
        this.cZ = false;
```

