# `a.df` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L740

```java
    private final boolean H() {
        block74: {
            block75: {
                block73: {
                    if (this.cV && this.df && this.aw != 5 && (var1_1 = this.cb == false ? 60000L - (System.currentTimeMillis() - this.ca + this.bZ) : 60000L - this.bZ) <= 0L) {
                        this.ba = (byte)false;
                        this.K();
                    }
                    if (this.aT > 0 && this.bO == this.bI && this.bP == this.bJ) {
```

## L1059

```java
            if (!this.cV) {
                if (this.H == -1) return new StringBuffer().append("/ingame").append(this.b(this.D[4] + 1)).append(".mid").toString();
                return new StringBuffer().append("/ingame").append(this.H).append(".mid").toString();
            }
            if (this.df) return "/bonus.mid";
            return "/shop.mid";
        }
        if (this.bU == 1) {
            return "/shop.mid";
```

## L1129

```java
        this.bj = false;
        if (!this.bi) {
            if (by2 == -51) {
                this.de = false;
                if (this.cV && !this.df) {
                    this.df = true;
                    this.b(this.I());
                    this.m();
                    this.bZ = 0L;
```

## L1130

```java
        if (!this.bi) {
            if (by2 == -51) {
                this.de = false;
                if (this.cV && !this.df) {
                    this.df = true;
                    this.b(this.I());
                    this.m();
                    this.bZ = 0L;
                }
```

## L4106

```java
            case -22: 
            case -9: {
                if (!this.cV) ** GOTO lbl184
                var2_2 = 0;
                if (this.df) ** GOTO lbl176
                if (this.D[2] <= 0) ** GOTO lbl165
                var1_1 = -1;
                var8_8 = new StringBuffer().append(this.a[113]).append(this.a[114]).toString();
                ** GOTO lbl178
```

## L4319

```java
        this.bq = -1;
        this.bX = 0;
        this.dg = false;
        this.de = false;
        this.df = false;
        this.cD = 0;
        this.cb = true;
        this.bZ = 0L;
        this.bC = 0;
```

## L5650

```java
        if (this.bV != 0) {
            long l = !this.cb ? System.currentTimeMillis() - this.ca + this.bZ : this.bZ;
            long l2 = l;
            if (this.cV) {
                if (this.df) {
                    l2 = l = 60000L - l;
                    if (l < 0L) {
                        l2 = 0L;
                    }
```

