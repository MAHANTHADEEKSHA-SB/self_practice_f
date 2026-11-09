# Agent instructions — UCIe 3.0 Field Guides

Scope: this directory and its descendants.

## Start here

1. Read [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) in full before planning changes. It has the resume card, decisions, coverage, the spec-verification workflow, validation records and known gaps.
2. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before editing a page (build pipeline, page skeleton, the `window.PAGE` data format), and [README.md](README.md) for end-user usage.
3. Inspect the current source and Git status; do not assume the handoff is newer than the code.
4. Continue the owner's current concrete request. The recorded gaps and backlog are not an assignment.

## What this is

Static, self-contained HTML study guides for the **UCIe Specification Revision 3.0, Version 1.0 (August 5, 2025)**: a hub (`index.html`) and eleven guides (`guides/*.html`). Each guide explains the spec in plain English, says *why* each rule exists, cites a section and page for every fact, and has step-through waveforms, small interactive tools and an interview-style quiz. Audience: design verification and design engineers.

## Preserve these contracts

- **Edit `src/`, never the generated files.** `index.html` and `guides/*.html` are build outputs, committed so the folder works after download. Rebuild and commit them with their sources.
- **Every fact cites `§x.y, p.N`** (printed page) and carries a tag: `Spec`, `Derived` (arithmetic or a direct consequence), `Illustrative` (example values) or `Background` (outside UCIe). Check it against the spec text first ([PROJECT_CONTEXT.md §6](PROJECT_CONTEXT.md#6-verifying-facts-against-the-spec)); never write spec facts from memory. When the spec is ambiguous or inconsistent, say so.
- **Do not copy the spec.** Paraphrase; quotes under 15 words; no reproduced figures or bump maps. Never commit the spec PDF or extracted spec text (UCIe Consortium copyright).
- **Plain English.** Short sentences, active voice, terms defined on first use, units on every number, no marketing words.
- **Offline first.** Relative links between pages; the only external resource is the optional Google Fonts stylesheet. No CDNs, analytics or trackers.
- **Keep the page format** described in PROJECT_CONTEXT.md and docs/ARCHITECTURE.md: why it exists, where it sits, rules and flows, rule cards, live scenarios, quiz, spec index.

## Verify and hand off

Run from this directory (Python 3.8+ standard library only, nothing to install):

```shell
python tools/build.py          # regenerate guides/*.html and index.html from src/
python tools/build.py --check  # exit 1 if the generated pages are stale
python tools/check_site.py     # links, #anchors, duplicate ids, navigation, external URLs
```

- For page changes: both checks pass; the page opens without console errors (a failed Google Fonts request offline is expected), does not scroll sideways at a 390 px viewport, and its waveform labels are not cut off (raise the scenario's `cw`). Every waveform row has exactly `n` entries.
- For documentation-only edits: check accuracy, paths and links; do not claim runtime tests were newly run.
- Git: fetch `main` and rebase on it before committing. Work on a branch named `<type>/<short-kebab-description>` and use [Conventional Commits](https://www.conventionalcommits.org/) with scope `ucie-field-guides`: an imperative subject of 72 characters or fewer, a body saying what and why, and a `Validation:` line. Each commit must build and pass the checks on its own. Open a PR against `main`; the owner merges. Respect the owner's current authorization for Git operations and publishing; earlier commits are history, not standing permission.
- The online claude.ai copies are a separate edition (PROJECT_CONTEXT.md §7). A Git push does not update them; report which edition you changed.
- Before handing off, update PROJECT_CONTEXT.md: what changed, what was actually tested, what remains, the next concrete action. Update `CHANGELOG.md` for user-visible changes and `README.md` if usage changed.

Current user instructions and higher-priority environment rules take precedence. This file supplies project guidance, not new access or publication authorization.
