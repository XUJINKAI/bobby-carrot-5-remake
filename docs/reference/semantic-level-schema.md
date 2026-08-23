# Semantic level schema

The project runtime model uses semantic identifiers. Original DAT byte values are a transport/codec concern only.

Rules:

- Engine, Editor, Web, generated JSON, and gameplay tests use semantic terrain/object identifiers.
- Raw DAT bytes are allowed only in DAT codec code, reverse-engineering reference material, explicit codec tests, and Debug output.
- No compatibility reader for the old raw-id JSON schema is kept. Generated assets are regenerated to the semantic schema.
- Terrain and Object remain separate layers.
- Confirmed mechanics get meaningful names (`tide-left`, `speed-switch-raised`, `leaf`). Bytes whose game meaning is not yet confirmed get stable opaque semantic symbols (`terrain-001`, `object-001`) rather than leaking `0xNN` into the runtime model.

The codec is the only place that maps those identifiers to/from original DAT bytes.
