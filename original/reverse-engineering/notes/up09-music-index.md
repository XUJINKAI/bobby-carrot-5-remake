# UP9 Music Resource Index

机械列出 JAR 中 MIDI 资源，以及 `a.java` 中所有直接 MIDI 字符串引用。

## JAR MIDI resources

- `alarm.mid`
- `bonus.mid`
- `cleared.mid`
- `death.mid`
- `fly.mid`
- `ingame0.mid`
- `ingame1.mid`
- `ingame2.mid`
- `mow.mid`
- `sandman.mid`
- `shop.mid`
- `title.mid`
- `train.mid`
- `universe.mid`

## Direct runtime usages

- `/train.mid` · L387 · `private final void A()`
  - `this.b("/train.mid");`
- `/mow.mid` · L1052 · `private final String I()`
  - `return "/mow.mid";`
- `/bonus.mid` · L1059 · `private final String I()`
  - `if (this.df) return "/bonus.mid";`
- `/shop.mid` · L1060 · `private final String I()`
  - `return "/shop.mid";`
- `/shop.mid` · L1063 · `private final String I()`
  - `return "/shop.mid";`
- `/sandman.mid` · L1065 · `private final String I()`
  - `if (this.bU == 2) return "/sandman.mid";`
- `/sandman.mid` · L1066 · `private final String I()`
  - `if (this.bU == 4) return "/sandman.mid";`
- `/shop.mid` · L1067 · `private final String I()`
  - `if (this.bU != 5) return "/shop.mid";`
- `/sandman.mid` · L1068 · `private final String I()`
  - `return "/sandman.mid";`
- `/death.mid` · L1338 · `private final void K()`
  - `String string = this.ba == -1 ? "/death.mid" : "/alarm.mid";`
- `/alarm.mid` · L1338 · `private final void K()`
  - `String string = this.ba == -1 ? "/death.mid" : "/alarm.mid";`
- `/title.mid` · L4605 · `private final void ah()`
  - `this.b("/title.mid");`
- `/title.mid` · L4916 · `private final boolean ak()`
  - `this.b("/title.mid");`
- `/title.mid` · L4948 · `private final boolean ak()`
  - `this.b("/title.mid");`
- `/cleared.mid` · L5190 · `private final boolean ak()`
  - `var10_23 = "/cleared.mid";`
- `/mow.mid` · L5209 · `private final boolean ak()`
  - `var10_23 = "/mow.mid";`
- `/sandman.mid` · L5213 · `private final boolean ak()`
  - `var10_23 = "/sandman.mid";`
- `/shop.mid` · L5217 · `private final boolean ak()`
  - `var10_23 = "/shop.mid";`
- `/universe.mid` · L5221 · `private final boolean ak()`
  - `var10_23 = "/universe.mid";`
- `/fly.mid` · L5225 · `private final boolean ak()`
  - `var10_23 = "/fly.mid";`
- `/bonus.mid` · L5230 · `private final boolean ak()`
  - `var10_23 = "/bonus.mid";`
- `/title.mid` · L5266 · `private final boolean al()`
  - `this.b("/title.mid");`
- `/cleared.mid` · L5371 · `private final void ap()`
  - `this.a("/cleared.mid", (int)this.bt, false);`
- `/universe.mid` · L5621 · `private final void b(int n, String string, String string2, String string3)`
  - `this.b("/universe.mid");`
- `/title.mid` · L6824 · `private final boolean e(boolean bl)`
  - `this.b("/title.mid");`
- `/fly.mid` · L7646 · `private final void p()`
  - `this.b("/fly.mid");`
- `/cleared.mid` · L7707 · `private final void s()`
  - `this.a("/cleared.mid", (int)this.bt, false);`
- `/universe.mid` · L7771 · `private final void u()`
  - `this.b("/universe.mid");`
