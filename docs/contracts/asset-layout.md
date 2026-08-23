# 资产目录契约

```text
assets/
├── original/
│   └── official-hd/
│       ├── base.jar
│       ├── up01.jar
│       └── ... up09.jar
├── extracted/
│   ├── base/
│   └── up01/ ... up09/
└── generated/
    ├── catalog.json
    ├── source-index.json
    ├── levels/
    ├── sources/
    ├── art/hd/
    └── audio/midi/
```

`original` 不可修改；`extracted` 与 `generated` 必须可由工具重新生成。Web/Engine 运行时只读取 `generated`，禁止直接依赖原始 JAR 或 DAT。
