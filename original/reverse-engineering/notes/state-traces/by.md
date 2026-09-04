# `a.by` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2429

```java
            }
        }
        int n = this.bw >> this.r;
        int n2 = this.bx >> this.r;
        if (n == this.by) {
            this.by = this.b(this.at + 1 - 24);
        }
        if (n2 == this.bz) {
            this.bz = this.b(this.au + 1 - 24);
```

## L2430

```java
        }
        int n = this.bw >> this.r;
        int n2 = this.bx >> this.r;
        if (n == this.by) {
            this.by = this.b(this.at + 1 - 24);
        }
        if (n2 == this.bz) {
            this.bz = this.b(this.au + 1 - 24);
        }
```

## L2437

```java
            this.bz = this.b(this.au + 1 - 24);
        }
        int n3 = this.b(48);
        int n4 = this.bw;
        if (n >= this.by) {
            n3 = -n3;
        }
        this.bw = n4 + n3;
        n3 = this.b(24);
```

## L4310

```java
                this.ch[n] = this.b(this.v) << this.r;
            }
        } else {
            n = this.b(2) == 0 ? -24 : this.at + 1;
            this.by = n;
            this.bz = this.b(this.au + 1 - 24);
            this.bw = this.by << this.r;
            this.bx = this.bz << this.r;
        }
```

## L4312

```java
        } else {
            n = this.b(2) == 0 ? -24 : this.at + 1;
            this.by = n;
            this.bz = this.b(this.au + 1 - 24);
            this.bw = this.by << this.r;
            this.bx = this.bz << this.r;
        }
        this.bq = -1;
        this.bX = 0;
```

