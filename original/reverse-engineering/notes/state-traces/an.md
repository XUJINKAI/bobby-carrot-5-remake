# `a.an` 引用上下文

机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。

## L2932

```java
        this.eh = by2;
    }

    private final void a(int n, String string, String string2, String string3) {
        this.an = n;
        this.al = string2;
        this.am = string3;
        this.eA = string;
        this.et = 0;
```

## L4199

```java
     * Enabled aggressive block sorting
     */
    private final boolean a(boolean bl) {
        this.x = 1;
        if (this.an == -1) {
            return true;
        }
        if (!bl) {
            if (this.an != 10) return true;
```

## L4203

```java
        if (this.an == -1) {
            return true;
        }
        if (!bl) {
            if (this.an != 10) return true;
            this.ah();
            return true;
        }
        if (this.an == 8) {
```

## L4207

```java
            if (this.an != 10) return true;
            this.ah();
            return true;
        }
        if (this.an == 8) {
            this.C = true;
            return true;
        }
        if (this.an == 7) {
```

## L4211

```java
        if (this.an == 8) {
            this.C = true;
            return true;
        }
        if (this.an == 7) {
            if (this.I < 3) {
                this.dg = true;
            } else {
                this.I = (short)(this.I - 3);
```

## L4220

```java
            }
            this.de = true;
            return true;
        }
        if (this.an == 9) {
            this.u();
            return true;
        }
        if (this.an == 10) {
```

## L4224

```java
        if (this.an == 9) {
            this.u();
            return true;
        }
        if (this.an == 10) {
            this.p();
            return true;
        }
        if (this.an == 11) {
```

## L4228

```java
        if (this.an == 10) {
            this.p();
            return true;
        }
        if (this.an == 11) {
            this.f();
            this.x = 3;
            return true;
        }
```

## L4233

```java
            this.f();
            this.x = 3;
            return true;
        }
        this.I = (short)(this.I - this.bu[this.an]);
        this.cu[this.as][this.ar] = (byte)-98;
        this.f(this.bI, this.bJ);
        byte[] byArray = this.D;
        int n = this.an;
```

## L4237

```java
        this.I = (short)(this.I - this.bu[this.an]);
        this.cu[this.as][this.ar] = (byte)-98;
        this.f(this.bI, this.bJ);
        byte[] byArray = this.D;
        int n = this.an;
        byArray[n] = (byte)(byArray[n] + 1);
        if (this.an == 4) {
            this.H = this.D[4];
        }
```

## L4239

```java
        this.f(this.bI, this.bJ);
        byte[] byArray = this.D;
        int n = this.an;
        byArray[n] = (byte)(byArray[n] + 1);
        if (this.an == 4) {
            this.H = this.D[4];
        }
        this.h();
        return true;
```

## L5451

```java
            this.eA = this.a[this.eC[this.eB]];
            this.ev = this.u;
            this.a(null, 0, 0, true, true, true, true);
            bl = true;
            return bl | this.an();
        }
        if (!this.P) return bl | this.an();
        this.P = false;
        this.eB = (byte)(this.eB - 1);
```

## L5453

```java
            this.a(null, 0, 0, true, true, true, true);
            bl = true;
            return bl | this.an();
        }
        if (!this.P) return bl | this.an();
        this.P = false;
        this.eB = (byte)(this.eB - 1);
        if (this.eB < 0) {
            this.eB = (byte)(this.eC.length - 1);
```

## L5464

```java
        this.eA = this.a[this.eC[this.eB]];
        this.ev = this.u;
        this.a(null, 0, 0, true, true, true, true);
        bl = true;
        return bl | this.an();
    }

    /*
     * Enabled aggressive block sorting
```

## L8107

```java
                    if (this.ce > 0) return true;
                    return false;
                }
                case 5: {
                    return this.an();
                }
                case 7: {
                    if (this.aq() != false) return true;
                    if (this.ce > 0) return true;
```

