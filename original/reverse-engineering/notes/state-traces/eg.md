# `a.eg` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L1186

```java
                this.cv[this.as][this.ar] = (byte)-1;
                this.f(this.bI, this.bJ);
                this.a(true, this.bV, this.bU);
                this.I = (short)(this.I + this.bX);
                this.eg = (byte)0;
                this.h();
                this.d(false);
                this.l();
                this.s();
```

## L2926

```java
        graphics.drawImage(image, n - (by - (n4 << n3)) * n6, n2 - n4 * n5, 20);
    }

    private final void a(byte by, String string, byte by2) {
        this.eg = by;
        this.ei = string;
        this.eh = by2;
    }

```

## L3100

```java
        if (this.dU) {
            this.a(graphics, this.a[37], (byte)1, 0);
            return;
        }
        if (this.eg > 0) {
            this.a(graphics, this.ei, this.eh, 0);
            return;
        }
        if (this.aw != 5) return;
```

## L5368

```java
     * Enabled aggressive block sorting
     */
    private final void ap() {
        this.I = (short)(this.I + this.bX);
        this.eg = (byte)0;
        this.d(false);
        if (this.c == 1) {
            this.a("/cleared.mid", (int)this.bt, false);
        }
```

## L8037

```java
                        }
                        if (this.ce <= 0) return false;
                        return true;
                    }
                    if (this.eg > 0) {
                        this.eg = (byte)(this.eg - 1);
                    }
                    if (!this.bd && this.aT == 0 && this.aw != 5 && this.R) {
                        this.R = false;
```

## L8038

```java
                        if (this.ce <= 0) return false;
                        return true;
                    }
                    if (this.eg > 0) {
                        this.eg = (byte)(this.eg - 1);
                    }
                    if (!this.bd && this.aT == 0 && this.aw != 5 && this.R) {
                        this.R = false;
                        var1_1 = this.dV == false;
```

