# Tile / Object ID 参考

这里只记录已经通过 UP9 高清版 a.class、资源或 Help 文本确认的事实。所有数值同时给出 unsigned 与 Java signed byte，避免 DAT / Adapter 交叉检查时混淆。

## Terrain ID

| U8 / Hex | Signed | 已确认含义与 runtime 角色 |
|---:|---:|---|
| 71–76 / 0x47–0x4C | 71–76 | Sky variants；Bobby 默认不可走，Cloud / Fireball 使用独立 passage，空格可出现 gameplay star shimmer |
| 77 / 0x4D | 77 | Snow；不可直接进入，有 Shovel 时启动 32-step action |
| 78–84 / 0x4E–0x54 | 78–84 | 低段背景变体；不在 Bobby 默认可走区，没有独立机关分支 |
| 85 / 0x55 | 85 | 静态 Water；Bobby 不可走，Leaf 可走 |
| 86 / 0x56 | 86 | animated Water；通行同 0x55，使用 ta.png |
| 87 / 0x57 | 87 | Tide Down |
| 88 / 0x58 | 88 | Tide Up |
| 89 / 0x59 | 89 | Tide Right |
| 90 / 0x5A | 90 | Tide Left |
| 91–93 / 0x5B–0x5D | 91–93 | Water Fall Start / Middle / End；Leaf 强制 Down、6px/step |
| 94–147 / 0x5E–0x93 | 94–147 或 -128…-109 | 普通 walkable surface variants；仍受 object override |
| 148 / 0x94 | -108 | Ice；midpoint 标记，下一 movement cycle 优先沿当前方向续滑 |
| 149 / 0x95 | -107 | Start；Loader 初始化 Bobby |
| 150 / 0x96 | -106 | Exit；objective 清零后动画并允许完成 |
| 151 / 0x97 | -105 | Dream Machine Night Train Ticket shop |
| 152 / 0x98 | -104 | Cloud 9 Night Train Ticket shop |
| 153 / 0x99 | -103 | Super Key shop |
| 154 / 0x9A | -102 | Sound Test shop |
| 155 / 0x9B | -101 | Extra Music shop |
| 156 / 0x9C | -100 | Speed Shoes shop |
| 157 / 0x9D | -99 | Coin Radar shop |
| 158 / 0x9E | -98 | 已购/不可再购买的 Shop 静态结果 |
| 159 / 0x9F | -97 | Shovel pickup |
| 160 / 0xA0 | -96 | Mower Parking |
| 161–162 / 0xA1–0xA2 | -95…-94 | Speed Switch pressed / raised-triggerable |
| 163–164 / 0xA3–0xA4 | -93…-92 | Carousel Switch pressed / raised-triggerable |
| 165–166 / 0xA5–0xA6 | -91…-90 | Tide Switch pressed / raised-triggerable |
| 167–174 / 0xA7–0xAE | -89…-82 | Wind Switch Up/Down/Left/Right，每方向依次 On / Off-triggerable |
| 175–176 / 0xAF–0xB0 | -81…-80 | Trap active / inactive |
| 177–180 / 0xB1–0xB4 | -79…-76 | Mirror Right-Down / Left-Down / Right-Up / Left-Up |
| 181–184 / 0xB5–0xB8 | -75…-72 | Speed Up / Down / Left / Right |
| 185–188 / 0xB9–0xBC | -71…-68 | Carousel Right-Up / Left-Up / Left-Down / Right-Down |
| 189–190 / 0xBD–0xBE | -67…-66 | Carousel Vertical / Horizontal |
| 191–192 / 0xBF–0xC0 | -65…-64 | Yellow Switch pair |
| 193–194 / 0xC1–0xC2 | -63…-62 | Pink Switch pair |
| 195–196 / 0xC3–0xC4 | -61…-60 | Yellow Block raised / lowered |
| 197–198 / 0xC5–0xC6 | -59…-58 | Pink Block raised / lowered |
| 199–200 / 0xC7–0xC8 | -57…-56 | High Grass / hidden-objective High Grass |

原版 Bobby terrain 默认分支只把 unsigned 0x5E..0xC8 当作主要可走区，再叠加 Snow、directional tile、block state 与 object override。不能只用 atlas 的视觉类别推导碰撞。

## Object ID

| U8 / Hex | Signed | 已确认含义与 runtime 角色 |
|---:|---:|---|
| 201 / 0xC9 | -55 | Consumed Carrot |
| 202 / 0xCA | -54 | Carrot |
| 203–204 / 0xCB–0xCC | -53…-52 | Egg Nest empty / filled |
| 205 / 0xCD | -51 | Lock |
| 206 / 0xCE | -50 | Beanstalk Tip；可覆盖不可走 terrain |
| 207 / 0xCF | -49 | Bean pickup |
| 208–211 / 0xD0–0xD3 | -48…-45 | Windmill Up / Down / Left / Right |
| 212–214 / 0xD4–0xD6 | -44…-42 | Plank / crumbling / fragment；仅 D4 覆盖不可走 terrain |
| 215–217 / 0xD7–0xD9 | -41…-39 | Dragon Head / Body / Tail |
| 218 / 0xDA | -38 | Sandman Head；原版 DAT 定位单元 |
| 219 / 0xDB | -37 | Dream Machine Head；原版 DAT 定位单元 |
| 220 / 0xDC | -36 | Mower |
| 221 / 0xDD | -35 | Gas |
| 222 / 0xDE | -34 | Beanstalk Middle；可覆盖不可走 terrain |
| 223 / 0xDF | -33 | Bean Field |
| 224–226 / 0xE0–0xE2 | -32…-30 | Red / Purple / Green Cloud；Loader 转为 moving entity |
| 227 / 0xE3 | -29 | Ice Block |
| 228–230 / 0xE4–0xE6 | -28…-26 | Ice melt phase 1 / 2 / 3 |
| 231 / 0xE7 | -25 | Beaver Head；原版 DAT 定位单元 |
| 232–233 / 0xE8–0xE9 | -24…-23 | Dragon Head wind-up frames；原版 player collision 不阻挡 |
| 234 / 0xEA | -22 | Sandman Body |
| 235 / 0xEB | -21 | Dream Machine Body |
| 236 / 0xEC | -20 | Leaf；Loader 转为 moving entity |
| 237 / 0xED | -19 | Crumbly Rock |
| 238 / 0xEE | -18 | Beanstalk Base；仅 terrain 本身可走时可进入 |
| 239 / 0xEF | -17 | Bean Sprout |
| 240–242 / 0xF0–0xF2 | -16…-14 | Red / Purple / Green Cloud Parking |
| 243 / 0xF3 | -13 | Kite |
| 244 / 0xF4 | -12 | Whirlwind |
| 245 / 0xF5 | -11 | Landing |
| 246 / 0xF6 | -10 | Golden Carrot |
| 247 / 0xF7 | -9 | Beaver Body |
| 248 / 0xF8 | -8 | Bonus Coin |
| 249–254 / 0xF9–0xFE | -7…-2 | Fence variants；Bobby blocking |
| 255 / 0xFF | -1 | Empty object |

## 三个容易写错的边界

1. 0xCE Tip 与 0xDE Middle 可以 override 不可走 terrain；0xEE Base 不可以。
2. D5/D6 是 Plank 消亡表现，不再具有 D4 的 bridge override。
3. E8/E9 是 Dragon Head 的攻击帧，但不在 Bobby blocking object 集合；这是 UP9 原版 quirk。

逐 raw byte 的碰撞、midpoint、task、camera 与 Campaign 入口见 original/reverse-engineering/notes/runtime-entity-matrix.md。
