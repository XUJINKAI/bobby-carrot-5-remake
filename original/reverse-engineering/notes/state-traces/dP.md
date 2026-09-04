# `a.dP` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L498

```java
                    if (this.et <= this.eu) ** GOTO lbl9
                    this.et = this.eu;
                    ** while (true)
                }
                --this.dP;
                if (this.dP >= 0) ** GOTO lbl14
                this.dP = 0;
                if (this.dQ != 2) break block25;
                this.dQ = (byte)false;
```

## L499

```java
                    this.et = this.eu;
                    ** while (true)
                }
                --this.dP;
                if (this.dP >= 0) ** GOTO lbl14
                this.dP = 0;
                if (this.dQ != 2) break block25;
                this.dQ = (byte)false;
                switch (this.dR) lbl-1000:
```

## L500

```java
                    ** while (true)
                }
                --this.dP;
                if (this.dP >= 0) ** GOTO lbl14
                this.dP = 0;
                if (this.dQ != 2) break block25;
                this.dQ = (byte)false;
                switch (this.dR) lbl-1000:
                // 2 sources
```

## L587

```java
            this.T = false;
            this.a(false, 1);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
```

## L588

```java
            this.a(false, 1);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
```

## L589

```java
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
```

## L660

```java
            this.T = false;
            this.a(false, 1);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        this.dT = false;
        if (this.dQ == 2) {
```

## L661

```java
            this.a(false, 1);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        this.dT = false;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
```

## L662

```java
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        this.dT = false;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
```

## L3772

```java
    private final void a(boolean bl, int n) {
        int n2 = bl ? 1 : 2;
        this.dQ = (byte)n2;
        this.dR = (byte)n;
        this.dP = 18;
    }

    /*
     * Enabled force condition propagation
```

## L4750

```java
            }
            this.a(false, 0);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.ce > 0) return true;
        if (this.dQ == 2) {
```

## L4751

```java
            this.a(false, 0);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.ce > 0) return true;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
```

## L4752

```java
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.ce > 0) return true;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
```

## L5330

```java
            this.S = false;
            this.a(false, 0);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
```

## L5331

```java
            this.a(false, 0);
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
```

## L5332

```java
            return bl;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                default: {
```

## L5498

```java
            if (this.et <= this.eu) return true;
            this.et = this.eu;
            return true;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
```

## L5499

```java
            this.et = this.eu;
            return true;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
```

## L5500

```java
            return true;
        }
        --this.dP;
        if (this.dP >= 0) return true;
        this.dP = 0;
        if (this.dQ == 2) {
            this.dQ = (byte)0;
            switch (this.dR) {
                case 0: {
```

## L6654

```java
     */
    private final int e(int n) {
        switch (this.dQ) {
            default: {
                return this.dS[18 - this.dP] * n >> 8;
            }
            case 0: {
                return 0;
            }
```

## L6661

```java
                return 0;
            }
            case 1: 
        }
        return this.dS[this.dP] * n >> 8;
    }

    /*
     * Unable to fully structure code
```

## L8122

```java
                    return this.at();
                }
                case 10: {
                    if (this.ce == -1) {
                        --this.dP;
                        if (this.dP >= 0) return true;
                        this.dQ = (byte)false;
                        this.dP = 0;
                        this.ce = (byte)-2;
```

## L8123

```java
                }
                case 10: {
                    if (this.ce == -1) {
                        --this.dP;
                        if (this.dP >= 0) return true;
                        this.dQ = (byte)false;
                        this.dP = 0;
                        this.ce = (byte)-2;
                        return true;
```

## L8125

```java
                    if (this.ce == -1) {
                        --this.dP;
                        if (this.dP >= 0) return true;
                        this.dQ = (byte)false;
                        this.dP = 0;
                        this.ce = (byte)-2;
                        return true;
                    } else if (this.ce == -2) {
                        ++this.aC;
```

## L8143

```java
                        this.a(false, 0);
                        this.ce = (byte)-4;
                        return true;
                    } else {
                        --this.dP;
                        if (this.dP >= 0) return true;
                        this.dQ = (byte)false;
                        this.dP = 0;
                        this.ce = (byte)false;
```

## L8144

```java
                        this.ce = (byte)-4;
                        return true;
                    } else {
                        --this.dP;
                        if (this.dP >= 0) return true;
                        this.dQ = (byte)false;
                        this.dP = 0;
                        this.ce = (byte)false;
                        this.cc = 0;
```

## L8146

```java
                    } else {
                        --this.dP;
                        if (this.dP >= 0) return true;
                        this.dQ = (byte)false;
                        this.dP = 0;
                        this.ce = (byte)false;
                        this.cc = 0;
                        this.dL = null;
                        this.x = 0;
```

