# Bobby Carrot 5 Remake

[中文](README.md)

![title](docs/screenshot/title.png)

A modern web remake of **Bobby Carrot 5**.

The project uses a fully rewritten game engine. It aims to preserve the original level experience while adding a map editor, map sharing, and extension points for new map mechanics.

Play online: <https://bc5r.xujinkai.net>

## Features

- **Adventure**: Play the full 40-chapter campaign following the original Forever + 9 UP-pack structure, with chapter progression, saves, bonus levels, shops, and other adventure systems.
- **Explore**: Freely browse the original 400 regular levels and 80 Bonus levels, with filters, debug tools, map editing, and free camera zoom.
- **Editor**: Combine map elements to create, play-test, and share your own levels.
- **Modern engine**: A complete rewrite rather than a direct translation of the original code, with Debug and Inspector tools for analysis and learning.
- **Replay recording**: Record solutions, slow down playback, and load built-in solutions.
- **Extensible mechanics**: The engine exposes extension points for adding mechanics beyond the original game.
- **Development tools**: Editor-created maps can be packed back into a JAR for verification in an emulator.

More detailed product design, architecture, formats, and mechanic notes are maintained in [docs/](docs/README.md). The project documentation is primarily maintained in Chinese.

## Contributing

Custom maps, Issues, and Pull Requests are welcome.

Before changing code, read [AGENTS.md](AGENTS.md) and [docs/](docs/README.md), or have your AI agent read them.

The project has explicit rules around module boundaries, separating original-game facts from design decisions, source readability, and verification. New or changed game mechanics should include regression tests and, when necessary, be verified against the original JAR.

Development, build, verification, and original-runtime verification commands are maintained in [docs/development.md](docs/development.md) and [docs/verification.md](docs/verification.md).

## Assets and Copyright

This repository contains or can generate JARs, artwork, audio, music, maps, DAT data, and other material originating from the original Bobby Carrot 5. These materials are **not covered by this project's license**. Their copyrights, trademarks, and other rights remain with their respective owners.

This project does not claim copyright over the original Bobby Carrot game content and does not grant third parties rights to use that original content. See [THIRD_PARTY_ASSETS.md](THIRD_PARTY_ASSETS.md) for details.

## License

Original source code, documentation, and other material that can be licensed by this project's authors are released under the **Bobby Carrot 5 Remake Non-Commercial Copyleft License 1.0**.

You may view, study, modify, and redistribute the project for non-commercial purposes. Modified distributions must provide the complete corresponding source code and remain under the same license. Closed-source distribution, paid distribution, and commercial use that monetizes the software itself are prohibited.

The full Chinese and English license terms are available in [LICENSE](LICENSE).
