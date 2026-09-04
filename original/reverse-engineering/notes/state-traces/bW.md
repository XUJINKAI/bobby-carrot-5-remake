# `a.bW` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L1718

```java
                                return true;
                            } else if (this.bU == 5) {
                                this.G = true;
                                this.h();
                                this.bV = this.bW;
                                this.bU = 1;
                                this.aa();
                                this.d(true);
                                return true;
```

## L5181

```java
                ** GOTO lbl250
lbl263:
                // 1 sources

                this.bW = var5_5;
                this.bV = 0;
                this.bU = 5;
                ** continue;
            }
```

## L6897

```java
     * Handled duff style switch with additional control
     * Enabled aggressive block sorting
     */
    private final void f(boolean bl) {
        this.bW = this.bV;
        int n = this.bU + 1;
        int n2 = this.bV;
        int n3 = 1;
        int n4 = 0;
```

## L7640

```java
        this.aw = 1;
        this.ap = (this.u >> 1) - (this.h >> 1);
        this.ar = -1;
        this.as = this.aq = this.v / 3;
        this.d(this.bW);
        this.af = 0;
        this.q();
        this.n();
        this.b(true, -1);
```

## L7688

```java
            } else if (this.ar > this.ap) {
                this.ar -= 3;
            } else {
                this.J = (short)(this.J + 1);
                this.a(true, this.bW, 10);
                this.h();
                this.b(false, 0);
            }
        }
```

