# 原版游戏事实

本文件只记录从用户提供的 JAR、资源和字节码恢复出的事实，不代表现代 Web 产品必须保留所有历史 UI。

专项事实文档：

- [`beaver-shop.md`](beaver-shop.md)：Beaver Shop 商品、价格、对话、持久状态与运行效果。

## 平台

Base JAR Manifest：

```text
MIDlet-Name: Bobby Carrot 5
MIDlet-Version: 1.0.3
MicroEdition-Profile: MIDP-2.0
MicroEdition-Configuration: CLDC-1.0
```

UP9 高清版 Manifest：

```text
MIDlet-Name: Bobby 5 Up 9
MIDlet-Version: 1.3.5
MicroEdition-Profile: MIDP-2.0
MicroEdition-Configuration: CLDC-1.0
```

两者都以 `Bobby.class` 为薄入口，绝大部分游戏实现位于经过混淆的 `a.class`。

## 地图运行时表示

原版运行时有两层 byte Grid：

- terrain layer：原反编译字段曾记作 `cu/cq[][]`；
- object layer：由 DAT 的紧凑对象表展开得到，空对象为 signed `-1`。

Loader 读取 unsigned width/height、完整 terrain rows，再初始化 object grid 并展开特殊多格对象/动态实体。

## 图集寻址

`ts.png` 是 16×16 的 byte-addressable 图集，原始 byte ID 可直接转换为格坐标：

```text
unsignedId = signedByte & 255
row        = unsignedId >> 4
column     = unsignedId - (row << 4)
```

普通版源 Tile 为 32×32；后期高清版为 48×48，但 byte ID 模型不变。因此游戏世界坐标与像素尺寸必须彻底解耦。

## Bobby 出生点

初始化扫描遇到 terrain signed ID `-107` 时设置 Bobby 地图/像素坐标：

```text
raw U8: 149
hex:    0x95
signed: -107
```

Canonical `001` 中该标记位于 `(7,16)`。
