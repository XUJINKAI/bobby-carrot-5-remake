# 003 — Canonical 去重与经典发行结构并存

**决定：** 内部继续维护 485 个 canonical 唯一关，但玩家选关和 URL 使用 Base/UP → Chapter → Level 的原作结构。

**原因：** canonical ID 对内容去重和存档稳定性非常好，但 `#001...#485` 对玩家没有原作语义，也不利于以后加入自定义关卡。

**结果：** 每关有两个身份：

```text
canonicalId: 006
publicId:    base-1-1
```

Web 只展示 public ID；Engine/资产工具可继续用 canonical ID 定位生成 JSON。
