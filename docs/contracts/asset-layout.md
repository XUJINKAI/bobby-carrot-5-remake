# 资产目录契约

```text
assets/
├── maps/
│   ├── index.json
│   ├── original/
│   │   ├── index.json
│   │   └── <map-id>.json
│   └── <collection>/
│       ├── index.json
│       └── <map-id>.json
├── i18n/
├── art/
└── audio/
```

`assets/` 是网站 `/assets/` 的静态资源源树，允许 Git 托管的人工资源与生成资源共存。`assets/maps/index.json` 负责 collection discovery，`assets/maps/<collection>/index.json` 负责展示、搜索和筛选 metadata，`assets/maps/<collection>/<map-id>.json` 是可直接交给 Engine 的地图。

`build` 将该目录原样复制到 `dist/assets/`。`npm run assets` 只清理其中未被 Git 跟踪的生成物，再从 `original/` 与 `custom-maps/` 重建。
