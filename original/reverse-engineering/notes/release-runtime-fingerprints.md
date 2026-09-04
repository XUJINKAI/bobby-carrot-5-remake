# 原版 10 JAR Runtime 指纹

本报告机械比较 `base.jar` 与 `up01..up09.jar`。方法指纹来自 `javap -c -p -s`，仅归一化 constant-pool 序号；相同 hash 表示该方法字节码控制流在该归一化下相同。

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

## 核心方法归一化指纹

| Method | base | up01 | up02 | up03 | up04 | up05 | up06 | up07 | up08 | up09 |
|---|---|---|---|---|---|---|---|---|---|---|
| gameplay-H | `missing` | `a7f46c925e81` | `a6187ea2d0a6` | `a6187ea2d0a6` | `a6187ea2d0a6` | `a6187ea2d0a6` | `a6187ea2d0a6` | `a6187ea2d0a6` | `a6187ea2d0a6` | `a6187ea2d0a6` |
| movement-M | `missing` | `ba295c4f1579` | `59c6ff442312` | `59c6ff442312` | `59c6ff442312` | `59c6ff442312` | `59c6ff442312` | `59c6ff442312` | `59c6ff442312` | `59c6ff442312` |
| pixel-N | `baba51f30996` | `13244bc61d94` | `329dc7555309` | `329dc7555309` | `329dc7555309` | `329dc7555309` | `329dc7555309` | `329dc7555309` | `329dc7555309` | `329dc7555309` |
| midpoint-J | `missing` | `f6f6029b8621` | `1f42922657fd` | `1f42922657fd` | `1f42922657fd` | `1f42922657fd` | `1f42922657fd` | `1f42922657fd` | `1f42922657fd` | `1f42922657fd` |
| moving-P | `bbbedf048083` | `f82e9fa774ed` | `1a4db2c7d55b` | `1a4db2c7d55b` | `1a4db2c7d55b` | `1a4db2c7d55b` | `1a4db2c7d55b` | `1a4db2c7d55b` | `1a4db2c7d55b` | `1a4db2c7d55b` |
| fireball-Q | `45714a1170c9` | `74b52dcd3870` | `23db03613616` | `23db03613616` | `23db03613616` | `23db03613616` | `23db03613616` | `23db03613616` | `23db03613616` | `23db03613616` |
| ice-R | `f2bef73038db` | `387c0f9e2ee1` | `9a6ebce1b43d` | `d99c1b0ba305` | `d99c1b0ba305` | `9a6ebce1b43d` | `9a6ebce1b43d` | `d99c1b0ba305` | `9a6ebce1b43d` | `9a6ebce1b43d` |
| bean-S | `70dc359c7a66` | `704e9b211fbf` | `5e05605bddbc` | `5e05605bddbc` | `5e05605bddbc` | `5e05605bddbc` | `5e05605bddbc` | `5e05605bddbc` | `5e05605bddbc` | `5e05605bddbc` |
| collision | `3b8a214785f7` | `fd28371e3405` | `87279ab89a7d` | `87279ab89a7d` | `88432af4d53c` | `88432af4d53c` | `87279ab89a7d` | `88432af4d53c` | `87279ab89a7d` | `88432af4d53c` |
| moving-grid-pass | `afd0da8501e0` | `a26e2459a82b` | `0a1515c82f24` | `0a1515c82f24` | `0a1515c82f24` | `0a1515c82f24` | `0a1515c82f24` | `0a1515c82f24` | `0a1515c82f24` | `0a1515c82f24` |
| loader | `640d3f432d5f` | `0e088fd36f54` | `128e416498f1` | `95e748bdd306` | `d84dc79d2968` | `4ec384e38364` | `b26a4f218259` | `95e748bdd306` | `4ec384e38364` | `6e8fe1f26258` |
| runtime-b | `08e3e8e36941` | `d4d0823d94af` | `26e5158ec132` | `26e5158ec132` | `26e5158ec132` | `26e5158ec132` | `26e5158ec132` | `26e5158ec132` | `26e5158ec132` | `26e5158ec132` |
| run | `9bdbf7778991` | `9bdbf7778991` | `d58bfe2e609d` | `d58bfe2e609d` | `d58bfe2e609d` | `d58bfe2e609d` | `d58bfe2e609d` | `d58bfe2e609d` | `d58bfe2e609d` | `d58bfe2e609d` |

## 机械分组

### gameplay-H

- `missing`: base
- `a7f46c925e81`: up01
- `a6187ea2d0a6`: up02, up03, up04, up05, up06, up07, up08, up09

### movement-M

- `missing`: base
- `ba295c4f1579`: up01
- `59c6ff442312`: up02, up03, up04, up05, up06, up07, up08, up09

### pixel-N

- `baba51f30996`: base
- `13244bc61d94`: up01
- `329dc7555309`: up02, up03, up04, up05, up06, up07, up08, up09

### midpoint-J

- `missing`: base
- `f6f6029b8621`: up01
- `1f42922657fd`: up02, up03, up04, up05, up06, up07, up08, up09

### moving-P

- `bbbedf048083`: base
- `f82e9fa774ed`: up01
- `1a4db2c7d55b`: up02, up03, up04, up05, up06, up07, up08, up09

### fireball-Q

- `45714a1170c9`: base
- `74b52dcd3870`: up01
- `23db03613616`: up02, up03, up04, up05, up06, up07, up08, up09

### ice-R

- `f2bef73038db`: base
- `387c0f9e2ee1`: up01
- `9a6ebce1b43d`: up02, up05, up06, up08, up09
- `d99c1b0ba305`: up03, up04, up07

### bean-S

- `70dc359c7a66`: base
- `704e9b211fbf`: up01
- `5e05605bddbc`: up02, up03, up04, up05, up06, up07, up08, up09

### collision

- `3b8a214785f7`: base
- `fd28371e3405`: up01
- `87279ab89a7d`: up02, up03, up06, up08
- `88432af4d53c`: up04, up05, up07, up09

### moving-grid-pass

- `afd0da8501e0`: base
- `a26e2459a82b`: up01
- `0a1515c82f24`: up02, up03, up04, up05, up06, up07, up08, up09

### loader

- `640d3f432d5f`: base
- `0e088fd36f54`: up01
- `128e416498f1`: up02
- `95e748bdd306`: up03, up07
- `d84dc79d2968`: up04
- `4ec384e38364`: up05, up08
- `b26a4f218259`: up06
- `6e8fe1f26258`: up09

### runtime-b

- `08e3e8e36941`: base
- `d4d0823d94af`: up01
- `26e5158ec132`: up02, up03, up04, up05, up06, up07, up08, up09

### run

- `9bdbf7778991`: base, up01
- `d58bfe2e609d`: up02, up03, up04, up05, up06, up07, up08, up09

