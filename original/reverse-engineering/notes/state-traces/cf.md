# `a.cf` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2384

```java
     */
    private final void T() {
        int n;
        int n2 = 48;
        if (this.cf < this.bJ) {
            n = n2 - 24;
        } else {
            n = n2;
            if (this.cf > this.bJ) {
```

## L2388

```java
        if (this.cf < this.bJ) {
            n = n2 - 24;
        } else {
            n = n2;
            if (this.cf > this.bJ) {
                n = n2 + 24;
            }
        }
        n2 = 0;
```

## L2395

```java
        }
        n2 = 0;
        while (true) {
            if (n2 >= 5) {
                this.cf = this.bJ;
                return;
            }
            if (this.ch[n2] >> this.r > this.v) {
                this.cg[n2] = this.b(this.u) << this.r;
```

