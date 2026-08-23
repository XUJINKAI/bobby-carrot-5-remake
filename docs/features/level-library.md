# 关卡浏览与身份

## 两套 ID

每关同时有：

1. **public ID**：玩家可见，尊重原版发行结构；
2. **canonical ID**：内部去重/旧存档兼容。

例如：

```text
public:    up3-2-7
canonical: 160
```

不要在新 UI、分享链接或未来自定义关卡 API 中重新暴露 canonical ID。

## 浏览层级

```text
发行包 → 章节 → 关卡
```

Base 包含 5 个公共 Tutorial 关和 4×12 个正式章节关；UP1~UP9 各显示 4×12 个本包关卡，重复的 Tutorial 不重复展示。

总计：

```text
Base: 53
UP1~UP9: 9 × 48
= 485
```

## 快捷入口

- **继续游玩**：读取 `bobby.lastLevel` 的 public ID；
- **随机一个关卡**：从 485 个 canonical 唯一关中均匀选择；
- 完成状态仍按 canonical ID 保存，避免未来 public 命名规则微调破坏存档。
