# Changelog

All notable changes to the UCIe 3.0 Field Guides are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

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

[1.0.0]: https://github.com/MAHANTHADEEKSHA-SB/self_practice_f/tree/main/ucie-field-guides
