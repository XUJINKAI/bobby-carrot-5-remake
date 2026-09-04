# UP9 Text Audit

审计 `EN/DE/FR/IT/SP/PG.dat` 与 `a.class` 中直接硬编码的字符串，补足仅查看 `EN.dat` 会漏掉的文字。

## Locale resource shape

| locale | string count | IDs match EN 0..122 |
|---|---:|---|
| EN | 123 | yes |
| DE | 123 | yes |
| FR | 123 | yes |
| IT | 123 | yes |
| SP | 123 | yes |
| PG | 123 | yes |

结论：semantic string ID 以 EN 名称命名，但同一 ID 可直接索引其它五个原版 locale。完整原文仍留在只读 JAR；本报告不重复提交六份完整翻译正文。

## User-facing strings hardcoded in class

- L754 · **user-facing/hardcoded** · `private final boolean H()`
  - `DO YOU WANT TO ENABLE THE CHEAT?`
- L759 · **user-facing/hardcoded** · `private final boolean H()`
  - `DO YOU WANT TO FORMAT THE RMS AND COMPLETELY RESET THE GAME?`
- L5837 · **user-facing/hardcoded** · `private final void c()`
  - `Error`
- L6002 · **user-facing/hardcoded** · `private final void c(byte var1_1, byte var2_2)`
  - `CHEAT!`
- L7759 · **possible-user-facing** · `private final void u()`
  - `0000 0000 0000 0000##`
- L8367 · **possible-user-facing** · `public final void paint(Graphics var1_1)`
  - `EXTRA-LEVELPACK 9`

`Decompilation failed` 被标为 `decompiler-synthetic`，是 CFR 伪源码，不属于原版可见文本。

## All class string literals by category

- L331 · `other` · `EN` · `<field-initializer>`
- L353 · `resource` · `.dat` · `public a(Bobby bobby)`
- L360 · `resource` · `/font.png` · `public a(Bobby bobby)`
- L361 · `resource` · `/logo.png` · `public a(Bobby bobby)`
- L383 · `resource` · `/train.png` · `private final void A()`
- L387 · `resource` · `/train.mid` · `private final void A()`
- L754 · `user-facing/hardcoded` · `DO YOU WANT TO ENABLE THE CHEAT?` · `private final boolean H()`
- L759 · `user-facing/hardcoded` · `DO YOU WANT TO FORMAT THE RMS AND COMPLETELY RESET THE GAME?` · `private final boolean H()`
- L1052 · `resource` · `/mow.mid` · `private final String I()`
- L1056 · `resource` · `/ingame` · `private final String I()`
- L1056 · `resource` · `.mid` · `private final String I()`
- L1057 · `resource` · `/ingame` · `private final String I()`
- L1057 · `resource` · `.mid` · `private final String I()`
- L1059 · `resource` · `/bonus.mid` · `private final String I()`
- L1060 · `resource` · `/shop.mid` · `private final String I()`
- L1063 · `resource` · `/shop.mid` · `private final String I()`
- L1065 · `resource` · `/sandman.mid` · `private final String I()`
- L1066 · `resource` · `/sandman.mid` · `private final String I()`
- L1067 · `resource` · `/shop.mid` · `private final String I()`
- L1068 · `resource` · `/sandman.mid` · `private final String I()`
- L1338 · `resource` · `/death.mid` · `private final void K()`
- L1338 · `resource` · `/alarm.mid` · `private final void K()`
- L2676 · `resource` · `/b` · `private final void Z()`
- L2676 · `resource` · `.png` · `private final void Z()`
- L2678 · `resource` · `/ta.png` · `private final void Z()`
- L2679 · `resource` · `/hud.png` · `private final void Z()`
- L2680 · `resource` · `/bf.png` · `private final void Z()`
- L2681 · `resource` · `/alarm.png` · `private final void Z()`
- L3690 · `language-menu-table` · `DEUTSCH=DE;ENGLISH=EN;FRANÇAIS=FR;ITALIANO=IT;ESPAÑOL=SP;PORTUGUÊS=PG;` · `private final void a(Graphics graphics, boolean bl)`
- L3690 · `language-menu-table` · `DEUTSCH=DE;ENGLISH=EN;FRANÇAIS=FR;ITALIANO=IT;ESPAÑOL=SP;PORTUGUÊS=PG;` · `private final void a(Graphics graphics, boolean bl)`
- L3691 · `other` · `DE` · `private final void a(Graphics graphics, boolean bl)`
- L3693 · `other` · `EN` · `private final void a(Graphics graphics, boolean bl)`
- L3695 · `other` · `FR` · `private final void a(Graphics graphics, boolean bl)`
- L3697 · `other` · `IT` · `private final void a(Graphics graphics, boolean bl)`
- L3699 · `other` · `SP` · `private final void a(Graphics graphics, boolean bl)`
- L3701 · `other` · `PG` · `private final void a(Graphics graphics, boolean bl)`
- L3840 · `decompiler-synthetic` · `Decompilation failed` · `private final boolean a(int var1_1, int var2_2, int var3_3, byte var4_4)`
- L4582 · `resource` · `/b9.png` · `private final void ah()`
- L4583 · `resource` · `/ta.png` · `private final void ah()`
- L4584 · `resource` · `/title.png` · `private final void ah()`
- L4605 · `resource` · `/title.mid` · `private final void ah()`
- L4916 · `resource` · `/title.mid` · `private final boolean ak()`
- L4948 · `resource` · `/title.mid` · `private final boolean ak()`
- L5119 · `language-menu-table` · `DEUTSCH=DE;ENGLISH=EN;FRANÇAIS=FR;ITALIANO=IT;ESPAÑOL=SP;PORTUGUÊS=PG;` · `private final boolean ak()`
- L5119 · `language-menu-table` · `DEUTSCH=DE;ENGLISH=EN;FRANÇAIS=FR;ITALIANO=IT;ESPAÑOL=SP;PORTUGUÊS=PG;` · `private final boolean ak()`
- L5122 · `resource` · `.dat` · `private final boolean ak()`
- L5190 · `resource` · `/cleared.mid` · `private final boolean ak()`
- L5205 · `resource` · `/ingame` · `private final boolean ak()`
- L5205 · `resource` · `.mid` · `private final boolean ak()`
- L5209 · `resource` · `/mow.mid` · `private final boolean ak()`
- L5213 · `resource` · `/sandman.mid` · `private final boolean ak()`
- L5217 · `resource` · `/shop.mid` · `private final boolean ak()`
- L5221 · `resource` · `/universe.mid` · `private final boolean ak()`
- L5225 · `resource` · `/fly.mid` · `private final boolean ak()`
- L5230 · `resource` · `/bonus.mid` · `private final boolean ak()`
- L5266 · `resource` · `/title.mid` · `private final boolean al()`
- L5371 · `resource` · `/cleared.mid` · `private final void ap()`
- L5381 · `format/runtime` · `##` · `private final void ap()`
- L5393 · `format/runtime` · `` · `private final void ap()`
- L5394 · `other` · `#` · `private final void ap()`
- L5400 · `format/runtime` · `` · `private final void ap()`
- L5401 · `other` · `#` · `private final void ap()`
- L5621 · `resource` · `/universe.mid` · `private final void b(int n, String string, String string2, String string3)`
- L5837 · `user-facing/hardcoded` · `Error` · `private final void c()`
- L6002 · `user-facing/hardcoded` · `CHEAT!` · `private final void c(byte var1_1, byte var2_2)`
- L6131 · `language-menu-table` · `DEUTSCH=DE;ENGLISH=EN;FRANÇAIS=FR;ITALIANO=IT;ESPAÑOL=SP;PORTUGUÊS=PG;` · `private final void c(byte var1_1, byte var2_2)`
- L6142 · `language-menu-table` · `DEUTSCH=DE;ENGLISH=EN;FRANÇAIS=FR;ITALIANO=IT;ESPAÑOL=SP;PORTUGUÊS=PG;` · `private final void c(byte var1_1, byte var2_2)`
- L6143 · `language-menu-table` · `DEUTSCH=DE;ENGLISH=EN;FRANÇAIS=FR;ITALIANO=IT;ESPAÑOL=SP;PORTUGUÊS=PG;` · `private final void c(byte var1_1, byte var2_2)`
- L6148 · `language-menu-table` · `DEUTSCH=DE;ENGLISH=EN;FRANÇAIS=FR;ITALIANO=IT;ESPAÑOL=SP;PORTUGUÊS=PG;` · `private final void c(byte var1_1, byte var2_2)`
- L6149 · `language-menu-table` · `DEUTSCH=DE;ENGLISH=EN;FRANÇAIS=FR;ITALIANO=IT;ESPAÑOL=SP;PORTUGUÊS=PG;` · `private final void c(byte var1_1, byte var2_2)`
- L6446 · `resource` · `.dat` · `private final void d()`
- L6450 · `resource` · `/numbers.png` · `private final void d()`
- L6451 · `resource` · `/arrows.png` · `private final void d()`
- L6452 · `resource` · `/misc.png` · `private final void d()`
- L6453 · `resource` · `/ts.png` · `private final void d()`
- L6454 · `resource` · `/mow.png` · `private final void d()`
- L6503 · `other` · `DE` · `private final void d(int n)`
- L6505 · `other` · `EN` · `private final void d(int n)`
- L6507 · `other` · `FR` · `private final void d(int n)`
- L6509 · `other` · `IT` · `private final void d(int n)`
- L6511 · `other` · `SP` · `private final void d(int n)`
- L6513 · `other` · `PG` · `private final void d(int n)`
- L6519 · `format/runtime` · `0` · `private final void d(int n)`
- L6519 · `format/runtime` · `` · `private final void d(int n)`
- L6520 · `resource` · `.dat` · `private final void d(int n)`
- L6675 · `other` · `BC5Data` · `private final void e()`
- L6690 · `other` · `BC5Data` · `private final void e()`
- L6691 · `other` · `BC5Data` · `private final void e()`
- L6709 · `format/runtime` · `` · `private final void e()`
- L6746 · `decompiler-synthetic` · `Decompilation failed` · `private final void e(int var1_1, int var2_2)`
- L6824 · `resource` · `/title.mid` · `private final boolean e(boolean bl)`
- L6837 · `other` · `BC5Data` · `private final void f()`
- L7014 · `other` · `BC5Data` · `private final void g()`
- L7301 · `other` · `BC5Data` · `private final void h()`
- L7646 · `resource` · `/fly.mid` · `private final void p()`
- L7707 · `resource` · `/cleared.mid` · `private final void s()`
- L7757 · `other` · ` X ` · `private final void u()`
- L7759 · `possible-user-facing` · `0000 0000 0000 0000##` · `private final void u()`
- L7769 · `resource` · `/sleep.png` · `private final void u()`
- L7771 · `resource` · `/universe.mid` · `private final void u()`
- L7817 · `format/runtime` · `##` · `private final boolean w()`
- L7965 · `format/runtime` · `audio/midi` · `public final void a(String string, int n, boolean bl)`
- L7970 · `other` · `VolumeControl` · `public final void a(String string, int n, boolean bl)`
- L8367 · `possible-user-facing` · `EXTRA-LEVELPACK 9` · `public final void paint(Graphics var1_1)`
