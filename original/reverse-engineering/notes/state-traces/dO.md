# `a.dO` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L4607

```java
        this.b(true, -1);
        this.x = 4;
        this.b("/title.mid");
        this.dN = 0;
        this.dO = true;
        this.d(false);
        this.U = false;
    }

```

## L4626

```java
        }
        ++this.dN;
        if (this.dN >= 20) {
            this.dN = 0;
            boolean bl = !this.dO;
            this.dO = bl;
        }
        this.ar += this.aF;
        this.ap = this.ar >> this.r;
```

## L4627

```java
        ++this.dN;
        if (this.dN >= 20) {
            this.dN = 0;
            boolean bl = !this.dO;
            this.dO = bl;
        }
        this.ar += this.aF;
        this.ap = this.ar >> this.r;
        this.as += this.aG;
```

## L8368

```java
                    var1_1.setClip(0, 0, this.u, this.v);
                    var2_3 = this.w - this.dL.getHeight() - this.i - 72 >> 1;
                    var1_1.drawImage(this.dL, this.u >> 1, var2_3, 17);
                    this.a("EXTRA-LEVELPACK 9", var1_1, this.u >> 1, var2_3 + this.dL.getHeight(), true);
                    if (!this.dW && this.dO) {
                        this.a(var1_1, this.a[81], (byte)3, this.v - (this.g + 10) - 5);
                    }
                    if (this.ce > 0) {
                        this.c(var1_1);
```

