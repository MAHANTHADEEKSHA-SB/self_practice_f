# UCIe 3.0 Field Guides — agent handoff and project context

Last updated: 10 November 2026 (Asia/Kolkata).
This file is the durable handoff for an agent that has not seen the original chat.
Read it together with [AGENTS.md](AGENTS.md), [README.md](README.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
The source files and current Git history take precedence over stale status notes; update this file when they change.

## 1. Resume card: where work stopped

| Item | Recorded state |
| --- | --- |
| Repository | `MAHANTHADEEKSHA-SB/self_practice_f` |
| Directory | `ucie-field-guides/`; run the Python tools from here |
| Branch | `feat/ucie-field-guides`, rebased onto `main` at `a22385d` on 10 November 2026 |
| Pull request | [#1](https://github.com/MAHANTHADEEKSHA-SB/self_practice_f/pull/1), open, waiting for the owner to review and merge |
| Content state | Version 1.0.0: hub plus eleven guides, built and checked |
| Latest user request | Rebase onto the latest `main` before committing again; before that, write handoff docs another agent can work from |
| Current handoff change | Documentation only: this file (aligned with the repo's `dv-workbench` convention), `AGENTS.md`, `CLAUDE.md` and `docs/ARCHITECTURE.md` |
| Unfinished work from the last request | None |
| Next task | The owner merges PR #1. No content work has been selected after that |
| Spec | `UCIE_3.0.pdf` in the owner's claude.ai Project "UCIE_3.0". Never commit it |

Do not rebuild the guides from scratch or treat the backlog in section 10 as an assignment. Compare your checkout with this card first and do not reset newer work to it.

## 2. What the user actually wants

Plain-English learning pages for the UCIe 3.0 specification, because the spec "has it all jumbled". Every page follows the format of the owner's original **FDI Field Guide**: it explains why each rule exists, cites a section and page for every fact, and has step-through waveforms and an interview-style quiz. Audience: design verification and design engineers.

History of requests: (1) the same treatment as FDI for every part of the spec, with scope "everything" (Electrical and UCIe-3D included) and build order left to the agent; (2) a hub linking all guides; (3) a separate directory in this repository with a README for people who download it, and industry-standard branch names and commits; (4) handoff docs for another agent; (5) rebase onto the latest `main` before committing again.

The owner prefers honest, rigorous assessment over agreement. Flag doubts, spec inconsistencies and unverified values instead of smoothing them over.

### Decisions already made

| Decision | Reason |
| --- | --- |
| Static HTML, one self-contained file per page (CSS and JS inline) | Opens by double-click, works offline, no install or framework, shareable as a ZIP |
| Generated pages committed | People downloading the folder should not need Python |
| Template + per-guide `data.js` | One look and one waveform engine; a guide's content is data, not code |
| FDI kept as `src/guides/fdi/standalone.html` | It was the prototype the template came from; rebuilding it through the template risked changing a page the owner already liked |
| Navigation generated at build time, relative links | One list to maintain; works offline and inside a ZIP |
| Build includes only guides whose source exists | Every commit in a series builds and passes the checks (bisectable) |
| Spec PDF and extracted text never committed | Copyright of the UCIe Consortium |
| Conventional Commits with scope `ucie-field-guides`, feature branch and PR | Matches the repo's `feat(dv-workbench): …` style; the owner merges |
| Google Fonts optional | Nicer type online; system fonts offline with no loss of content |

## 3. Starting from a new agent environment

1. Get repository access or clone the public HTTPS URL. Never depend on scratch paths from a previous chat; the sandbox used to build 1.0.0 is gone.
2. Check `git status --short`, `git branch --show-current` and `git log -10 --oneline`. Keep existing local edits. Fetch `main` and rebase your branch on it before committing.
3. Read [AGENTS.md](AGENTS.md), this file and the sources for the area you are changing. This file is an index, not a substitute for the code.
4. Get the spec text (section 6). Do not write spec facts from memory.
5. Make the focused change in `src/`, run `python tools/build.py`, `python tools/build.py --check` and `python tools/check_site.py`, and look at the changed page in a browser.
6. Commit, push and open a PR only within the owner's current authorization. Earlier commits are history, not standing permission.
7. Update the resume card, change history and validation in this file before you hand off.

## 4. Current coverage and boundaries

| Guide | File | Spec | Interactive parts |
| --- | --- | --- | --- |
| Hub | `index.html` | all | layer map, guide cards, reading paths, topic finder (37 topics), spec notes |
| FDI | `guides/fdi.html` | Ch 10.2–10.3 | 9 waveform tabs, 4 mini handshakes, signal table; verification section instead of a quiz |
| RDI | `guides/rdi.html` | Ch 10.1, 10.3 | 7 tabs, 3 minis, signal table |
| D2D Adapter | `guides/d2d-adapter.html` | Ch 3 | flit-format byte map, truth-table resolver, 4 tabs |
| Link Training | `guides/link-training.html` | Ch 4.5–4.7 | retrain resolver, 4 tabs |
| Logical PHY | `guides/logical-phy.html` | Ch 4.1–4.4 | byte map, lane-repair grid, 3 tabs |
| Sideband | `guides/sideband.html` | Ch 7 | signal/opcode table, 3 tabs |
| Protocol Mappings | `guides/protocol-mappings.html` | Ch 2 | protocol × rate matrix, 2 tabs |
| Manageability & UDA | `guides/manageability-uda.html` | Ch 8 | 1 tab, 8 rule cards |
| Registers & Discovery | `guides/registers-discovery.html` | Ch 9, Appendix A | width-encoding chips, Link Status decoder, mailbox calculator, 3 tabs, 11 cards |
| Retimers & Compliance | `guides/retimers-compliance.html` | §1.3, Ch 3, 4, 11, §9.5.4 | retry-injection register builder, 3 tabs, 10 cards |
| Electrical & UCIe-3D | `guides/electrical-ucie-3d.html` | Ch 5–6 | per-rate lookup, 3D bundle-repair calculator, 3 tabs, 12 cards |

Later guides are deliberately leaner (about 8 to 14 rule cards and 1 to 4 scenarios). Not covered in depth: bump maps and module naming (§5.7.2.2–5.7.3.4), every PHY register bit (§9.5.3.22–9.5.3.39), the §10.3.5 example flows, Streaming protocol specifics, Chapter 8 details (UMAP, security, firmware download), §4.4 test modes, Appendix B (AIB).

These are study notes. They are not a normative restatement of the spec and not a substitute for checking the cited page.

## 5. Source map

Paths are relative to `ucie-field-guides/`. Details and data formats are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| Path | Responsibility |
| --- | --- |
| `tools/build.py` (`GUIDES`) | Builds every page; the `GUIDES` list sets navigation order and titles |
| `tools/check_site.py` | Links, anchors, duplicate ids, allowed external hosts, navigation completeness |
| `src/template/` | Shared head, CSS (colors as variables, dark mode) and the waveform engine |
| `src/guides/<slug>/body*.html` | Page text, cards, tables, SVG diagrams |
| `src/guides/<slug>/data.js` | `window.PAGE`: waveform scenarios, filters, page widgets |
| `src/guides/fdi/standalone.html` | The FDI page as one document (own CSS and engine copy) |
| `src/hub/body.html`, `src/hub/hub.js` | Hub layout; guide cards (`G`) and topic finder (`T`) arrays |

## 6. Verifying facts against the spec

Every number and rule must be checked against the spec text, not recalled.

1. Get text: read `UCIE_3.0.pdf` through the claude.ai Project (it returns extracted text), or run `pdftotext UCIE_3.0.pdf spec.txt` (poppler-utils), which separates pages with a form feed.
2. Map to printed page numbers (the same as PDF page numbers in this file). In the Project's extraction each page starts with the line `UCIe Specification Revision 3.0, Version 1.0 <N>`.
3. Search, then read the whole paragraph or table before writing. Confirm § numbers in the table of contents.

```python
# page-aware search; usage: python find.py spec.txt "REPLAY_TIMEOUT"
import re, sys
text = open(sys.argv[1], encoding="utf-8").read()
if "\f" in text:                                   # pdftotext output
    rows = [(n + 1, l) for n, p in enumerate(text.split("\f")) for l in p.split("\n")]
else:                                              # header-marked extraction
    page, rows = 0, []
    for l in text.split("\n"):
        m = re.match(r"UCIe Specification Revision 3\.0, Version 1\.0 (\d+)$", l.strip())
        page = int(m.group(1)) if m else page
        rows.append((page, l))
for page, l in rows:
    if re.search(sys.argv[2], l):
        print(f"p.{page}: {l.strip()[:140]}")
```

Traps: tables come out scrambled (Table 5-10 on p.197 extracted as `12 3 / 85 / 4 10`, read as 12 GT/s ≤ 3 mm, 8 GT/s ≤ 5 mm, 4 GT/s ≤ 10 mm); figures leak text into paragraphs; cross-references can be stale, so trust the defining section.

## 7. Two editions: repository and online copies

| Item | Repository (this folder) | Online copies |
| --- | --- | --- |
| Source | `src/`, built by `tools/build.py` | Built from the same sources before the repo existed |
| Links | Relative (`fdi.html`, `../index.html`) | Absolute claude.ai artifact URLs; hub opens guides in new tabs |
| Audience | Anyone who downloads the repository | The owner only (private claude.ai artifacts) |
| FDI navigation bar | Present | Missing: the session that pushed the repo was not allowed to edit that artifact |
| Publishing | A Git push (after PR merge) | claude.ai artifact tools: `get_artifact`, then `publish_files` with `slug` and `base_version` |

| Page | Artifact URL | Slug |
| --- | --- | --- |
| Hub | https://claude.ai/artifact/7chShzJf9JzLfXEsmqSyyj | `3592c9b5-b847-4ea9-88b6-d65381a74422` |
| FDI | https://claude.ai/artifact/M798v9JqPq9f3Kbu7C1sum | `a2d24007-17e0-4d80-a40d-2485025ed66c` |
| RDI | https://claude.ai/artifact/BiH5r2eENTNccnp9rzY1Ff | `56becb02-47a3-45b7-9194-f0fb36a3c8da` |
| D2D Adapter | https://claude.ai/artifact/DNjM1S52bsDAqfrq6MxTAM | `6436610c-73c3-4262-8fd6-08b24f6d803e` |
| Link Training | https://claude.ai/artifact/Fh6KiFeJvxEV8ysGysDWca | `76f8f8e2-fa72-4214-b15a-2dee19e327e3` |
| Logical PHY | https://claude.ai/artifact/S5XznLjB49UX3GCe5XVG9g | `cb168b2f-3884-4906-89a8-af13f6eccf93` |
| Sideband | https://claude.ai/artifact/8zJfjwW5ugreS1eS2eJC7E | `40b040f6-9ac0-428f-92fb-d44b49027e4d` |
| Protocol Mappings | https://claude.ai/artifact/18PbtHC6WrzkkJm8zY7wwG | `01082291-3dbc-4b0b-84c3-36f84b448123` |
| Manageability & UDA | https://claude.ai/artifact/XcuEJud8iJJhsyjLXWFB1A | `f7f56119-b8fc-40a6-9516-51af1053a8f1` |
| Registers & Discovery | https://claude.ai/artifact/QjHgXqUo14UP9Uos98Qv8R | `c029b539-8335-47be-a526-59dad85802aa` |
| Retimers & Compliance | https://claude.ai/artifact/2QTGRv6CUpsbHnJK8L6hiL | `0b5f6eb0-bdad-4e50-ac05-5797190fe155` |
| Electrical & UCIe-3D | https://claude.ai/artifact/VSX4ykV8mGfRPiECEH7BGh | `e65001d5-2d0e-48da-97bc-bdb3cae30046` |

To republish an online copy from the repo: build, then in the output rewrite `href="<slug>.html"` and `href="guides/<slug>.html"` to the artifact URL above and `href="../index.html"` to the hub URL, and publish that file. The two editions do not sync automatically. If you update only one, say so.

## 8. Validation: what is proven and what to run

| Check | Last recorded result (10 November 2026) | What it does NOT establish |
| --- | --- | --- |
| `python tools/build.py --check` | Passed on every commit of the branch, re-run on each commit during the rebase onto `main` | Content correctness |
| `python tools/check_site.py` | Passed on every commit; final state 12 pages, 336 links | Links generated by JavaScript at runtime |
| Headless Chromium from `file://` | Every page loaded with no script errors (only the expected Google Fonts failure offline) and no horizontal overflow at 390 px; hub ↔ guide navigation clicked through | Firefox, Safari, real Windows or mobile devices, screen readers |
| Spec facts | Checked against the extracted spec text while each guide was written | An independent second review; tables read from scrambled extraction (see section 6) |
| Online copies | Republished on 9–10 November 2026 with the series links (FDI excepted) | That they match later repo changes |
| This handoff revision | Paths, relative links and heading anchors in the Markdown files checked | No runtime change; no new browser test claimed |

The browser checks used Playwright outside the repository; there is no automated browser harness in the repo yet.

## 9. Spec notes found while building

1. Link width has three encodings: code `2h` is x64 in Link Capability (Table 9-8, p.466) but x16 in Link Control (Table 9-9, p.468) and Link Status (Table 9-10, p.470).
2. On UCIe ports the PCIe Link Capabilities and Link Status registers report a fixed 8 GT/s and x16 (Appendix A.2, Table A-2, p.583); the real values are in the UCIe Link DVSEC.
3. At exactly 48 GT/s, §4.1.2.1 (p.101) allows retrain-on-any-error for retimer Valid framing, while §5.11 (p.253) requires single-error correction at 48 and 64 GT/s.
4. §11.3 (p.581) cites the UHM DVSEC as §9.5.3.36; in Revision 3.0 it is §9.5.3.40 (p.505).

## 10. Change history

Branch `feat/ucie-field-guides` (PR #1), oldest first. Hashes change on rebase, so use `git log` for them:

1. `build(ucie-field-guides): add page template and build tooling`
2. `feat(ucie-field-guides): add FDI and RDI interface guides`
3. `feat(ucie-field-guides): add D2D Adapter guide`
4. `feat(ucie-field-guides): add Physical Layer guides`
5. `feat(ucie-field-guides): add Sideband and Protocol Mappings guides`
6. `feat(ucie-field-guides): add system-level guides`
7. `feat(ucie-field-guides): add hub page with layer map and topic finder`
8. `docs(ucie-field-guides): add README and changelog`
9. `docs(ucie-field-guides): add agent handoff documents`

10 November 2026: rebased onto `main` (`a22385d`, which brought two `dv-workbench` commits). No conflicts; checks re-run on every commit. The handoff was then aligned with the `dv-workbench` convention (`AGENTS.md` + `PROJECT_CONTEXT.md`).

Commits are authored as `Claude <noreply@anthropic.com>` with `Co-Authored-By` and `Claude-Session` trailers. Rewrite authorship to the owner's identity only if they ask, using the identity they choose.

## 11. Known gaps and unselected future work

No work is currently assigned beyond merging PR #1. The items below are possible future tasks, not permission to do them:

- Online FDI artifact lacks the navigation bar (repo copy has it).
- FDI has a verification section but no quiz; the other guides have quizzes.
- Re-verify Table 5-10 (p.197) against the rendered PDF.
- CI workflow running `build.py --check` and `check_site.py` on PRs that touch `ucie-field-guides/**` (changes the repo root, so ask first).
- An optional `tools/browser_check.py` (Playwright, dev-only) for console errors, 390 px overflow and label truncation.
- Self-hosted IBM Plex fonts (SIL OFL) for an identical offline look.
- More rule cards in the leaner guides; the uncovered areas in section 4; a glossary, per-layer cheat sheets, a combined quiz.

## 12. Pitfalls already hit (and fixed)

- Consecutive identical labels in a waveform `bus` or `note` row merge into one bar; make labels unique (`#44·S`, `#45·S`) to show separate bars. Long labels are cut; raise the scenario's `cw`.
- Every waveform row needs exactly `n` entries. Columns in `gaps` hide their content.
- Long `<code>` and wide grid children caused sideways scrolling at 390 px; fixed globally in `extra.css`. Put wide tables in `.tbl-wrap`.
- `style.css` is injected inside `<style>`; never put `<style>` tags in it.
- SVG labels overlapped arrows several times; always look at a screenshot.
- A derived interval was once wrong in a draft; recompute every derived number and tag it `Derived`.
- Keep the scope a spec sentence gives (for example sideband redundancy exists on Advanced Package only).

## 13. Keep this handoff useful after your turn

Before ending a meaningful task, update:

- **Resume card:** latest completed task, real unfinished work, next concrete action (or "none selected").
- **Coverage and decisions:** only when they change what the next agent should do.
- **Change history:** dated, by commit subject.
- **Validation:** exact checks run, results, environment and what was not tested.
- **Editions:** repository and online copies separately; never claim one updated the other.
- **Blockers:** what is missing, why it blocks, the smallest next step.

Keep one authoritative handoff here. Do not create competing status files unless the owner asks for a different convention.

## 14. Prompt to give another agent

> Work in MAHANTHADEEKSHA-SB/self_practice_f, directory ucie-field-guides. First read ucie-field-guides/AGENTS.md, PROJECT_CONTEXT.md, README.md and docs/ARCHITECTURE.md, then inspect the current branch, working-tree changes and the relevant files under src/. Use them to recover the context; do not rebuild the guides. My next task is: [describe the change]. Check every spec fact against the UCIe 3.0 spec text and cite § and page. Edit src/ only, rebuild, run both checks, update PROJECT_CONTEXT.md, and work on a feature branch with Conventional Commits.

These files carry documented project knowledge. They do not carry repository permissions, the spec PDF, the claude.ai artifacts or the original conversation. If a tool does not read AGENTS.md automatically, give it the prompt above.
