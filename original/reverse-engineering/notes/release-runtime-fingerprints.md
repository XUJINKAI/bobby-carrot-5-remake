# 原版 10 JAR Runtime 指纹

本报告机械比较 `base.jar` 与 `up01..up09.jar`。`layout` 指纹只去除 constant-pool 序号；`structural` 进一步去除 bytecode offset、branch target、local-variable slot 与 exception-table offset，用来识别“同一控制流被重新编译布局”的情况。

## Class 指纹

| JAR | MIDlet | Version | JAR bytes | a.class bytes | a.class SHA | Bobby.class SHA |
|---|---|---|---:|---:|---|---|
| base | Bobby Carrot 5 | 1.0.3 | 456460 | 85241 | `fd48251bc9fa` | `961846a46d81` |
| up01 | Bobby 5 Up 1 | 1.2.3 | 460822 | 85934 | `a04cc827fb2d` | `961846a46d81` |
| up02 | Bobby 5 Up 2 | 1.2.9 | 455106 | 66057 | `cd591a4abd4d` | `9b3ce737c0b4` |
| up03 | Bobby 5 Up 3 | 1.3.1 | 457297 | 66097 | `74ca5cad25d2` | `9b3ce737c0b4` |
| up04 | Bobby 5 Up 4 | 1.3.3 | 455290 | 66043 | `5c598203222a` | `9b3ce737c0b4` |
| up05 | Bobby 5 Up 5 | 1.3.3 | 457629 | 66065 | `f6472d8c4d9e` | `9b3ce737c0b4` |
| up06 | Bobby 5 Up 6 | 1.3.3 | 455719 | 66066 | `e0e602f3f581` | `9b3ce737c0b4` |
| up07 | Bobby 5 Up 7 | 1.3.4 | 455525 | 66114 | `37223ec82c25` | `9b3ce737c0b4` |
| up08 | Bobby 5 Up 8 | 1.3.5 | 453991 | 66156 | `a9493cbed075` | `9b3ce737c0b4` |
| up09 | Bobby 5 Up 9 | 1.3.5 | 453375 | 66101 | `205ec33cf7c5` | `9b3ce737c0b4` |

## 核心方法 structural 指纹

| Method | base | up01 | up02 | up03 | up04 | up05 | up06 | up07 | up08 | up09 |
|---|---|---|---|---|---|---|---|---|---|---|
| gameplay-H | `missing` | `2c13e64440e7` | `be52368f897c` | `be52368f897c` | `be52368f897c` | `be52368f897c` | `be52368f897c` | `be52368f897c` | `be52368f897c` | `be52368f897c` |
| movement-M | `missing` | `906ed2f75ab0` | `a0d5aea0f0ac` | `a0d5aea0f0ac` | `a0d5aea0f0ac` | `a0d5aea0f0ac` | `a0d5aea0f0ac` | `a0d5aea0f0ac` | `a0d5aea0f0ac` | `a0d5aea0f0ac` |
| pixel-N | `ca055bb59bd5` | `e51476e0ef5c` | `ef1e0aa1766a` | `ef1e0aa1766a` | `ef1e0aa1766a` | `ef1e0aa1766a` | `ef1e0aa1766a` | `ef1e0aa1766a` | `ef1e0aa1766a` | `ef1e0aa1766a` |
| midpoint-J | `missing` | `7e40a3eb1389` | `b449d006615e` | `b449d006615e` | `b449d006615e` | `b449d006615e` | `b449d006615e` | `b449d006615e` | `b449d006615e` | `b449d006615e` |
| moving-P | `62ecfcf5ca46` | `5e2300ae8f55` | `87a40c8b2546` | `87a40c8b2546` | `87a40c8b2546` | `87a40c8b2546` | `87a40c8b2546` | `87a40c8b2546` | `87a40c8b2546` | `87a40c8b2546` |
| fireball-Q | `2e12a4977016` | `a17a074188ab` | `2ba8040f1364` | `2ba8040f1364` | `2ba8040f1364` | `2ba8040f1364` | `2ba8040f1364` | `2ba8040f1364` | `2ba8040f1364` | `2ba8040f1364` |
| ice-R | `237de3604bec` | `def3c850b7fd` | `ffdd7fcdad02` | `ffdd7fcdad02` | `ffdd7fcdad02` | `ffdd7fcdad02` | `ffdd7fcdad02` | `ffdd7fcdad02` | `ffdd7fcdad02` | `ffdd7fcdad02` |
| bean-S | `5e76f759f561` | `c4eb86b42413` | `a07a279cafb6` | `a07a279cafb6` | `a07a279cafb6` | `a07a279cafb6` | `a07a279cafb6` | `a07a279cafb6` | `a07a279cafb6` | `a07a279cafb6` |
| collision | `21cea40139f7` | `5ca1ca9d9144` | `29a325e575e0` | `29a325e575e0` | `29a325e575e0` | `29a325e575e0` | `29a325e575e0` | `29a325e575e0` | `29a325e575e0` | `29a325e575e0` |
| moving-grid-pass | `37edb7145af9` | `bfdeb643d8cf` | `336848c0c146` | `336848c0c146` | `336848c0c146` | `336848c0c146` | `336848c0c146` | `336848c0c146` | `336848c0c146` | `336848c0c146` |
| loader | `63289414d37f` | `e130192ff4d0` | `e840ff6fe73d` | `e840ff6fe73d` | `e840ff6fe73d` | `e840ff6fe73d` | `e840ff6fe73d` | `e840ff6fe73d` | `e840ff6fe73d` | `e840ff6fe73d` |
| runtime-b | `2c8bdef36627` | `cc86e240c91b` | `ce3740f90fd8` | `ce3740f90fd8` | `ce3740f90fd8` | `ce3740f90fd8` | `ce3740f90fd8` | `ce3740f90fd8` | `ce3740f90fd8` | `ce3740f90fd8` |
| run | `50b536aebc27` | `50b536aebc27` | `d23c98787c02` | `d23c98787c02` | `d23c98787c02` | `d23c98787c02` | `d23c98787c02` | `d23c98787c02` | `d23c98787c02` | `d23c98787c02` |

## Structural 分组

### gameplay-H

- `missing`: base
- `2c13e64440e7`: up01
- `be52368f897c`: up02, up03, up04, up05, up06, up07, up08, up09

### movement-M

- `missing`: base
- `906ed2f75ab0`: up01
- `a0d5aea0f0ac`: up02, up03, up04, up05, up06, up07, up08, up09

### pixel-N

- `ca055bb59bd5`: base
- `e51476e0ef5c`: up01
- `ef1e0aa1766a`: up02, up03, up04, up05, up06, up07, up08, up09

### midpoint-J

- `missing`: base
- `7e40a3eb1389`: up01
- `b449d006615e`: up02, up03, up04, up05, up06, up07, up08, up09

### moving-P

- `62ecfcf5ca46`: base
- `5e2300ae8f55`: up01
- `87a40c8b2546`: up02, up03, up04, up05, up06, up07, up08, up09

### fireball-Q

- `2e12a4977016`: base
- `a17a074188ab`: up01
- `2ba8040f1364`: up02, up03, up04, up05, up06, up07, up08, up09

### ice-R

- `237de3604bec`: base
- `def3c850b7fd`: up01
- `ffdd7fcdad02`: up02, up03, up04, up05, up06, up07, up08, up09

### bean-S

- `5e76f759f561`: base
- `c4eb86b42413`: up01
- `a07a279cafb6`: up02, up03, up04, up05, up06, up07, up08, up09

### collision

- `21cea40139f7`: base
- `5ca1ca9d9144`: up01
- `29a325e575e0`: up02, up03, up04, up05, up06, up07, up08, up09

### moving-grid-pass

- `37edb7145af9`: base
- `bfdeb643d8cf`: up01
- `336848c0c146`: up02, up03, up04, up05, up06, up07, up08, up09

### loader

- `63289414d37f`: base
- `e130192ff4d0`: up01
- `e840ff6fe73d`: up02, up03, up04, up05, up06, up07, up08, up09

### runtime-b

- `2c8bdef36627`: base
- `cc86e240c91b`: up01
- `ce3740f90fd8`: up02, up03, up04, up05, up06, up07, up08, up09

### run

- `50b536aebc27`: base, up01
- `d23c98787c02`: up02, up03, up04, up05, up06, up07, up08, up09

## Layout-only 分叉提示

- `ice-R`: layout 4 组 → structural 3 组。
- `collision`: layout 4 组 → structural 3 组。
- `loader`: layout 8 组 → structural 3 组。
