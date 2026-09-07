# Semantic level schema

The project runtime model uses semantic identifiers. Original DAT byte values are a transport/codec concern only.

Rules:

- Engine, Editor, Web, generated JSON, gameplay tests, and runtime Debug output use semantic terrain/object identifiers.
- Raw DAT bytes are confined to DAT import/export codec code, reverse-engineering reference material, and explicit codec round-trip tests.
- No compatibility reader for the old raw-id JSON/share schema is kept. Generated assets are regenerated to the semantic schema.
- Terrain and Object remain separate layers.
- Confirmed mechanics get meaningful names such as `tide-left`, `speed-switch-raised`, and `leaf`.
- 尚未确认准确语义的 terrain byte 在 decoded archive 中使用可逆的 `ts-<row>-<column>` atlas 坐标；Adapter 再将其转换为 semantic Surface 或 `surface-<row>-<column>` 临时 Entity。Engine 规则不依赖 DAT byte。
- Original art atlas coordinates are a separate rendering mapping and must not be inferred from DAT codes in Engine or Editor logic.

The DAT codec is the only runtime/tooling boundary that maps semantic level identifiers to/from original DAT bytes.
