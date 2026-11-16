# Changelog

All notable changes to the UCIe 3.0 Field Guides are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-11-16

### Added

- FDI guide: a "Test yourself" section with seven interview-style questions, so every guide now ends with a quiz.
- GitHub Actions workflow (`.github/workflows/ucie-field-guides.yml`) that runs `build.py --check` and `check_site.py` on pull requests and pushes to `main` that touch this folder.
- Project index in the repository root `README.md`.

### Changed

- Hub "Interview prep" card and README now say every guide has a quiz.
- `PROJECT_CONTEXT.md` updated after the merge of pull request #1.

## [1.0.0] - 2026-11-10

### Added

- Hub page (`index.html`) with a clickable layer map, guide list, reading paths, topic finder and spec notes.
- Eleven guides covering UCIe Specification Revision 3.0, Version 1.0:
  FDI, RDI, D2D Adapter, Link Training (LTSM), Logical PHY, Sideband, Protocol Mappings,
  Manageability & UDA, Registers & Discovery, Retimers & Compliance, and Electrical & UCIe-3D.
- Step-through waveform viewer with per-scenario column width.
- Interactive tools: flit-format byte map, format truth-table resolver, retrain resolver,
  byte-to-lane map, lane-repair grid, protocol × rate matrix, Link Status decoder,
  mailbox index calculator, retry-injection register builder, per-rate electrical lookup
  and UCIe-3D bundle-repair calculator.
- Shared navigation bar on every guide, generated at build time with relative links so the
  folder works offline.
- `tools/build.py` to regenerate the pages from `src/`, with a `--check` mode.
- `tools/check_site.py` for offline link, anchor, navigation and external-URL checks.
- Maintainer and agent handoff documents: `AGENTS.md` (with a `CLAUDE.md` import), `PROJECT_CONTEXT.md` and `docs/ARCHITECTURE.md`.

[1.1.0]: https://github.com/MAHANTHADEEKSHA-SB/self_practice_f/tree/main/ucie-field-guides
[1.0.0]: https://github.com/MAHANTHADEEKSHA-SB/self_practice_f/tree/fa6d19f/ucie-field-guides
