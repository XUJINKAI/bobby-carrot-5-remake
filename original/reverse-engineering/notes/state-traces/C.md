# `a.C` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L752

```java
                            this.aE = -1;
                            this.W();
                        }
                    }
                    if (this.bV == 0 && this.bU == 1 && !this.C && this.X) {
                        this.X = false;
                        this.a(8, "DO YOU WANT TO ENABLE THE CHEAT?", this.a[32], this.a[33]);
                        return false;
                    }
```

## L4208

```java
            this.ah();
            return true;
        }
        if (this.an == 8) {
            this.C = true;
            return true;
        }
        if (this.an == 7) {
            if (this.I < 3) {
```

## L6001

```java
                case 1: {
                    var1_1 = var5_5;
                    if (this.bV == 0) ** GOTO lbl157
                    var2_2 = var4_4;
                    if (this.C) {
                        this.dY[var9_9] = "CHEAT!";
                        var11_11 /* !! */  = this.dZ;
                        var2_2 = var9_9 + 1;
                        var11_11 /* !! */ [var9_9] = (short)99;
```

## L6441

```java
     * Lifted jumps to return sites
     */
    private final void d() {
        this.ed = (byte)((this.w - 26) / 31);
        this.C = false;
        this.e();
        String string = this.y;
        this.g();
        if (string.compareTo(this.y) != 0) {
```

## L8095

```java
                    this.Y();
                    return true;
                }
                case 2: {
                    return this.C();
                }
                case 3: {
                    this.t.destroyApp(true);
                    return false;
```

## L8225

```java
            } else {
                this.aa = 0;
            }
        }
        if (this.x == 1 && this.C) {
            if (n == 42) {
                this.Y = true;
            } else if (n == 35) {
                if (this.Y) {
```

