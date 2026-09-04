# `a.bo` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L888

```java
            this.cu[var7_6][var14_13] = (byte)124;
            this.f(this.bI, this.bJ);
            this.av = 3;
            this.aC = 0;
            this.bo = true;
        }
        if (this.O()) {
            return false;
        }
```

## L1359

```java
     */
    private final boolean M() {
        byte by = this.cu[this.as][this.ar];
        byte by2 = this.cv[this.as][this.ar];
        if (this.bo) {
            this.bo = false;
            switch (this.aw) {
                case 0: {
                    if (!this.a(-1, 0, false)) break;
```

## L1360

```java
    private final boolean M() {
        byte by = this.cu[this.as][this.ar];
        byte by2 = this.cv[this.as][this.ar];
        if (this.bo) {
            this.bo = false;
            switch (this.aw) {
                case 0: {
                    if (!this.a(-1, 0, false)) break;
                    --this.ar;
```

## L4345

```java
        this.bi = false;
        this.bj = false;
        this.bm = false;
        this.bb = (byte)0;
        this.bo = false;
        this.bn = false;
        this.aX = (byte)0;
        this.bk = false;
        this.bc = (byte)0;
```

