# `a.bB` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2414

```java
    /*
     * Enabled aggressive block sorting
     */
    private final void U() {
        if (this.bB) {
            this.bA = (byte)(this.bA + 1);
            if (this.bA >= 8) {
                this.bB = false;
                this.bA = (byte)8;
```

## L2417

```java
    private final void U() {
        if (this.bB) {
            this.bA = (byte)(this.bA + 1);
            if (this.bA >= 8) {
                this.bB = false;
                this.bA = (byte)8;
            }
        } else {
            this.bA = (byte)(this.bA - 1);
```

## L2423

```java
            }
        } else {
            this.bA = (byte)(this.bA - 1);
            if (this.bA <= 0) {
                this.bB = true;
                this.bA = (byte)0;
            }
        }
        int n = this.bw >> this.r;
```

