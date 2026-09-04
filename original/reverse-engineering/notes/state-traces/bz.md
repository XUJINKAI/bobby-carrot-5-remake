# `a.bz` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2432

```java
        int n2 = this.bx >> this.r;
        if (n == this.by) {
            this.by = this.b(this.at + 1 - 24);
        }
        if (n2 == this.bz) {
            this.bz = this.b(this.au + 1 - 24);
        }
        int n3 = this.b(48);
        int n4 = this.bw;
```

## L2433

```java
        if (n == this.by) {
            this.by = this.b(this.at + 1 - 24);
        }
        if (n2 == this.bz) {
            this.bz = this.b(this.au + 1 - 24);
        }
        int n3 = this.b(48);
        int n4 = this.bw;
        if (n >= this.by) {
```

## L2443

```java
        }
        this.bw = n4 + n3;
        n3 = this.b(24);
        n4 = this.bx;
        if (n2 >= this.bz) {
            n3 = -n3;
        }
        this.bx = n4 + n3;
    }
```

## L4311

```java
            }
        } else {
            n = this.b(2) == 0 ? -24 : this.at + 1;
            this.by = n;
            this.bz = this.b(this.au + 1 - 24);
            this.bw = this.by << this.r;
            this.bx = this.bz << this.r;
        }
        this.bq = -1;
```

## L4313

```java
            n = this.b(2) == 0 ? -24 : this.at + 1;
            this.by = n;
            this.bz = this.b(this.au + 1 - 24);
            this.bw = this.by << this.r;
            this.bx = this.bz << this.r;
        }
        this.bq = -1;
        this.bX = 0;
        this.dg = false;
```

