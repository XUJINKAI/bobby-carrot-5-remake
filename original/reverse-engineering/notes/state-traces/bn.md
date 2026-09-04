# `a.bn` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L765

```java
                    }
                    var4_3 = this.bI;
                    var5_4 = this.bJ;
                    if (this.aw > 4 || this.ay != 0 || this.bc != 0) break block73;
                    this.bn = false;
                    if (this.bh) {
                        this.bh = false;
                        this.aN = 0;
                        var6_5 = 0;
```

## L1203

```java
            this.c(0);
            return;
        }
        if (by == -108) {
            this.bn = true;
            this.av = 1;
            return;
        }
        if ((by & 0xFF) >= 191 && (by & 0xFF) <= 194) {
```

## L1522

```java
                    this.aO = 8;
                }
                this.aN = by2 == 0 || by == -108 ? 3 : --this.aN;
                if (by == -108) {
                    this.bn = true;
                    this.aN = 3;
                }
                this.ay = this.h;
                return true;
```

## L1573

```java
                }
            }
            if (by2 == 0) {
                this.ay = this.h;
                this.bn = true;
                this.av = 1;
                if (this.bi) return true;
                if (!this.F) return true;
                this.bl = true;
```

## L1676

```java
                    case 1: 
                    case 2: 
                    case 3: {
                        if (this.ay == 0) break;
                        if (!this.bn) {
                            this.av = (this.av + 1) % 8;
                            break;
                        }
                        this.av = 1;
```

## L1744

```java
        } else {
            this.bf = false;
        }
        if (this.aw > 3) return false;
        if (!this.bn) return false;
        this.av = 1;
        return false;
    }

```

## L4346

```java
        this.bj = false;
        this.bm = false;
        this.bb = (byte)0;
        this.bo = false;
        this.bn = false;
        this.aX = (byte)0;
        this.bk = false;
        this.bc = (byte)0;
        this.bl = false;
```

