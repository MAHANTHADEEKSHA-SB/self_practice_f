# AXI Field Guides (Issue L)

Plain-English study guides for the **AMBA AXI Protocol Specification, ARM IHI 0022 Issue L (August 2025)**, plus a hub page that links them. Each guide explains why a rule exists, ties every fact to a spec section and page, shows what changed from Issue H.c (AXI3/AXI4/ACE), and lets you step through waveforms of the flows that matter.

The guides are static HTML files. They work offline, need no install and no server, and are laid out for both desktop and phone screens.

> These are unofficial study notes. They are not affiliated with or endorsed by Arm. The specification itself is not included; get it from [developer.arm.com](https://developer.arm.com/documentation/ihi0022/latest/). For sign-off, always check the cited page of the spec.

## Quick start

Download or clone the repository and open `axi-field-guides/index.html` in a browser. Every link between guides is relative, so the folder can be moved or shared as a ZIP.

```shell
git clone https://github.com/MAHANTHADEEKSHA-SB/self_practice_f.git
cd self_practice_f/axi-field-guides
```

JavaScript must be enabled for the waveform viewer, filters, calculators and quizzes. Fonts load from Google Fonts when online and fall back to system fonts offline.

## Guides

| # | Guide | Spec chapters | Interactive tool |
| --- | --- | --- | --- |
| – | [Hub](index.html) | all | request map, spec notes |
| 1 | [Channels & Handshake](guides/channels-handshake.html) | A1–A2 | – |
| 2 | [Bursts & Addressing](guides/bursts-addressing.html) | A3 | burst calculator |
| 3 | [Request Attributes](guides/request-attributes.html) | A4 | memory-type and protection decoders |
| 4 | [IDs & Ordering](guides/ids-ordering.html) | A5 | ordering resolver |
| 5 | [Responses, Exclusives & Atomics](guides/responses-exclusives-atomics.html) | A3.3, A6, A7 | exclusive monitor simulator |
| 6 | [Caches & CMOs](guides/caches-cmos.html) | A8–A9 | cache decoder |
| 7 | [Qualifiers, Debug & User](guides/qualifiers-debug-user.html) | A10–A12 | MPAM packer |
| 8 | [Untranslated & DVM](guides/untranslated-dvm.html) | A13, A15 | DVM message encoder |

Still to come: Power, Reset & Protection; Signals & Interface Classes; Interconnect & Bridges; AXI-Stream.

## How to read a citation

- `§A2.3, p.29` is a section and printed page of Issue L.
- `H.c §A3.3.1, p.A3-44` is Issue H.c, used in the "what changed" sections.
- Tags: **Spec** (stated by the spec), **Derived** (worked out from spec rules), **Illustrative** (example values), **Background** (general engineering practice, not from the spec).

## Layout

```
index.html            generated hub
guides/*.html         generated guides, one self-contained file each
src/series.json       guide order, names and output paths
src/template/         shared CSS and the page engine (tables, waveforms, quiz)
src/guides/<key>/     per-guide source: content.html, data.js, optional extra.js, meta.json
tools/build.py        builds src/ into the generated pages
```

## Rebuilding

Edit files under `src/`, never the generated pages, then:

```shell
python tools/build.py           # rebuild
python tools/build.py --check   # exit 1 if generated pages are out of date
```

Python 3.8 or later, standard library only. To add a guide, create `src/guides/<key>/` and set its output path in `src/series.json`.
