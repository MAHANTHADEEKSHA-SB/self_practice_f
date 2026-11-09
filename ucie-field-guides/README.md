# UCIe 3.0 Field Guides

Eleven plain-English study guides for the **UCIe Specification Revision 3.0, Version 1.0 (August 5, 2025)**, plus a hub page that links them. Each guide explains why a rule exists, ties every fact to a spec section and page, and lets you step through waveforms of the flows that matter.

The guides are static HTML files. They work offline, need no install, no server and no build step, and run in any modern browser.

> These are unofficial study notes. They are not affiliated with or endorsed by the UCIe Consortium. The specification itself is not included; get it from [uciexpress.org](https://www.uciexpress.org/). For sign-off, always check the cited page of the spec.

## Quick start

### Option 1: download the ZIP (no Git needed)

1. On the repository page, select **Code → Download ZIP**.
2. Extract the ZIP anywhere (for example your Desktop).
3. Open `self_practice_f-main/ucie-field-guides/index.html` by double-clicking it.

That opens the hub in your default browser. Every link between guides is relative, so the folder can be moved, copied to a USB stick or shared as a ZIP.

### Option 2: clone with Git

Windows (PowerShell), macOS or Linux:

```shell
git clone https://github.com/MAHANTHADEEKSHA-SB/self_practice_f.git
cd self_practice_f/ucie-field-guides
```

Then open `index.html`:

| OS | Command |
| --- | --- |
| Windows (PowerShell) | `start index.html` |
| macOS | `open index.html` |
| Linux | `xdg-open index.html` |

### Option 3: fetch only this folder

The repository contains other projects. To download just the guides (Git 2.25 or later):

```shell
git clone --filter=blob:none --sparse https://github.com/MAHANTHADEEKSHA-SB/self_practice_f.git
cd self_practice_f
git sparse-checkout set ucie-field-guides
cd ucie-field-guides
```

### Optional: serve over HTTP

Opening the files directly is fine. If your browser or company policy blocks scripts on `file://` pages, serve the folder locally instead (Python 3):

```shell
cd ucie-field-guides
python -m http.server 8000
```

Then browse to <http://127.0.0.1:8000/>. Press Ctrl+C to stop. On some systems the command is `python3`.

## Requirements

- A current Chrome, Edge, Firefox or Safari. JavaScript must be enabled for the waveform viewer, filters, decoders and quizzes; the text and tables read fine without it.
- Internet is optional. When online, the pages load the IBM Plex fonts from Google Fonts; offline, they fall back to your system fonts with no loss of content.
- Python 3.8+ only if you want to rebuild or check the pages (see [Editing and rebuilding](#editing-and-rebuilding)).

## The guides

Start at `index.html`: it has a clickable layer map, reading paths and a topic finder.

| Guide | File | Spec coverage | Interactive parts |
| --- | --- | --- | --- |
| FDI | `guides/fdi.html` | Ch 10.2–10.3 | Waveforms for bring-up, traffic, CRC replay, PM, retrain, errors |
| RDI | `guides/rdi.html` | Ch 10.1, 10.3 | Waveforms; filterable signal table |
| D2D Adapter | `guides/d2d-adapter.html` | Ch 3 | Flit-format byte map; format truth-table resolver; retry waveforms |
| Link Training (LTSM) | `guides/link-training.html` | Ch 4.5–4.7 | Retrain resolver; state walk-throughs |
| Logical PHY | `guides/logical-phy.html` | Ch 4.1–4.4 | Byte-to-lane map; lane-repair grid |
| Sideband | `guides/sideband.html` | Ch 7 | Mailbox and credit waveforms |
| Protocol Mappings | `guides/protocol-mappings.html` | Ch 2 | Protocol × data-rate format matrix |
| Manageability & UDA | `guides/manageability-uda.html` | Ch 8 | Management-path setup waveform |
| Registers & Discovery | `guides/registers-discovery.html` | Ch 9, Appendix A | Link Status decoder; mailbox index calculator; error waveform |
| Retimers & Compliance | `guides/retimers-compliance.html` | §1.3, Ch 11, §9.5.4 | Retry-injection register builder; credit and Vref-sweep waveforms |
| Electrical & UCIe-3D | `guides/electrical-ucie-3d.html` | Ch 5–6 | Per-rate spec lookup; UCIe-3D repair calculator; UI-level waveforms |

Suggested order for a first read: Protocol Mappings → FDI → D2D Adapter → RDI → Logical PHY → Link Training → Sideband. For bring-up and debug, start with Link Training and Sideband.

## How to read a guide

Every guide follows the same layout:

1. **Why it exists**: the problem the layer solves.
2. **Where it sits and what it carries**: diagrams, signal or register tables.
3. **Rules and flows**: state machines, handshakes, encodings.
4. **Why each rule exists**: cards with the rule, the reason, a real-time example, what breaks if you violate it, and where to check it in the spec. Use the chips above the cards to filter by area.
5. **Live scenarios**: pick a tab, then use **Previous / Next** to step through a waveform. The highlighted columns match the step text.
6. **Test yourself**: interview-style questions (Basic, Intermediate, Advanced). Click a question to reveal its answer, or use **Show all answers**. The FDI guide has a verification section instead.
7. **Spec index**: every section, table and page the guide cites.

Citations use § for section and p. for the printed page of the spec PDF. Every fact is tagged:

| Tag | Meaning |
| --- | --- |
| Spec | Stated in the specification |
| Derived | Worked out from spec values (arithmetic or a direct consequence) |
| Illustrative | Example values chosen to make a point |
| Background | General engineering knowledge from outside UCIe |

## Spec notes found while building

- Link width uses three different encodings: code `2h` means x64 in Link Capability (Table 9-8) but x16 in Link Control (Table 9-9) and Link Status (Table 9-10).
- On UCIe ports the PCIe Link Capabilities and Link Status registers report a fixed 8 GT/s and x16 (Appendix A.2, Table A-2). The real values are in the UCIe Link DVSEC.
- At exactly 48 GT/s, §4.1.2.1 allows retrain-on-any-error for retimer Valid framing, while §5.11 requires single-error correction at 48 and 64 GT/s.
- §11.3 refers to the UHM DVSEC as §9.5.3.36; in Revision 3.0 it is §9.5.3.40.

Not covered in depth: individual bump-map figures, every register bit outside the main registers, and Appendix B (AIB interoperability).

## Folder layout

```text
ucie-field-guides/
├── index.html              Hub page (open this first)
├── guides/                 Built guides, one self-contained HTML file each
├── src/
│   ├── template/           Shared <head>, CSS and the waveform engine
│   ├── guides/<slug>/      Page sources: body*.html, data.js (FDI: standalone.html)
│   └── hub/                Hub page source
├── tools/
│   ├── build.py            Rebuilds guides/ and index.html from src/
│   └── check_site.py       Offline link and navigation checks
├── docs/
│   └── ARCHITECTURE.md     Page anatomy, data format, adding a guide
├── AGENTS.md               Instructions for AI agents and new maintainers
├── CLAUDE.md               Imports AGENTS.md for Claude Code
├── PROJECT_CONTEXT.md      Handoff: status, decisions, validation, open items
├── CHANGELOG.md
└── README.md
```

The files in `guides/` and `index.html` are generated, but they are committed so the guides work straight after download.

## Editing and rebuilding

Edit files under `src/`, never the generated pages, then rebuild and check (standard library only, nothing to install):

```shell
python tools/build.py          # regenerate guides/ and index.html
python tools/build.py --check  # fail if the generated pages are stale
python tools/check_site.py     # broken links, anchors, navigation, external URLs
```

Where things live:

- **Text and cards**: `src/guides/<slug>/body*.html`. Bodies are joined in file-name order.
- **Navigation bar**: generated from the `GUIDES` list in `tools/build.py`. Each body has a `<!-- @nav -->` marker where it is inserted. To add a guide, add a folder under `src/guides/` and an entry to `GUIDES`.
- **Waveform scenarios and widgets**: `src/guides/<slug>/data.js` sets `window.PAGE`. A scenario has `id`, `tab`, `title`, `desc`, `ref`, `unit`, `n` (number of columns), optional `cw` (column width in px) and `gaps`, `sig` (rows) and `steps`. A row is `{ name, d: "lp"|"pl"|"sb"|"note", t: "bit"|"bus"|"note", v }`, where `v` is a `"0101…"` string for `bit` rows or an array of labels for `bus` and `note` rows. A step is `{ r: [first, last], t: title, x: text, w: optional note, s: spec reference }`.
- **Look and feel**: `src/template/style.css` and `extra.css`; colors are CSS variables at the top of `style.css`, with a dark theme that follows the OS setting.

## Contributing

New maintainers and AI agents: start with [AGENTS.md](AGENTS.md), then [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

- Branch from `main` as `<type>/<short-description>`, for example `feat/ucie-field-guides-pcie-gen6` or `fix/ucie-field-guides-broken-anchor`.
- Use [Conventional Commits](https://www.conventionalcommits.org/) with the folder as scope: `feat(ucie-field-guides): …`, `fix(…)`, `docs(…)`, `build(…)`.
- Run the three commands above before pushing and record changes in `CHANGELOG.md`.
- Keep spec quotations short; paraphrase and cite § and page instead of copying spec text or figures.

## License

The original text and code in this folder are covered by the repository's [Apache License 2.0](../LICENSE). The UCIe Specification is the property of the UCIe Consortium; these guides cite and paraphrase it and do not reproduce it.
