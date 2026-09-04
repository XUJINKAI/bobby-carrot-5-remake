# `a.bA` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2415

```java
     * Enabled aggressive block sorting
     */
    private final void U() {
        if (this.bB) {
            this.bA = (byte)(this.bA + 1);
            if (this.bA >= 8) {
                this.bB = false;
                this.bA = (byte)8;
            }
```

## L2416

```java
     */
    private final void U() {
        if (this.bB) {
            this.bA = (byte)(this.bA + 1);
            if (this.bA >= 8) {
                this.bB = false;
                this.bA = (byte)8;
            }
        } else {
```

## L2418

```java
        if (this.bB) {
            this.bA = (byte)(this.bA + 1);
            if (this.bA >= 8) {
                this.bB = false;
                this.bA = (byte)8;
            }
        } else {
            this.bA = (byte)(this.bA - 1);
            if (this.bA <= 0) {
```

## L2421

```java
                this.bB = false;
                this.bA = (byte)8;
            }
        } else {
            this.bA = (byte)(this.bA - 1);
            if (this.bA <= 0) {
                this.bB = true;
                this.bA = (byte)0;
            }
```

## L2422

```java
                this.bA = (byte)8;
            }
        } else {
            this.bA = (byte)(this.bA - 1);
            if (this.bA <= 0) {
                this.bB = true;
                this.bA = (byte)0;
            }
        }
```

## L2424

```java
        } else {
            this.bA = (byte)(this.bA - 1);
            if (this.bA <= 0) {
                this.bB = true;
                this.bA = (byte)0;
            }
        }
        int n = this.bw >> this.r;
        int n2 = this.bx >> this.r;
```

## L3086

```java
            for (n = 0; n < 5; ++n) {
                this.b(graphics, this.cm, 338, 0, 12, 8, this.cg[n] >> this.r, this.ch[n] >> this.r);
            }
        } else {
            this.b(graphics, this.cq, 0, this.bA / 3 * 24, 24, 24, (this.bw >> this.r) - this.bI, (this.bx >> this.r) - this.bJ);
        }
        this.b(graphics);
        if (this.ba != -1) {
            this.b(graphics, this.cr, this.ba * 48, 0, 48, 48, this.u - 48 >> 1, this.v - 48 >> 1);
```

