# DV Workbench — context, status and fixes

Last updated: 10 November 2026 (Asia/Kolkata).

## Purpose and scope

A practical design-verification workbench for an 8 GB Windows laptop, focused on UCIe, PCIe, AMBA, SystemVerilog/UVM, scoreboards/predictors, and reset-aware verification. It organizes evidence and review intent without requiring a local model or EDA installation.

## Architecture and ownership

- `app/page.tsx`: React UI, guided extraction, editable records, page-range drafts, local persistence and prompt preparation.
- `lib/workbench.ts`: starter content, keyword extraction, page-range validation and safe CSV serialization.
- `app/globals.css`: responsive styling.
- `scripts/prepare-pdf-worker.mjs`: copies the pinned PDF.js worker for local dev/build.
- `tests/workbench.test.mjs`: extraction, CSV and page-range regression checks.
- `README.md`: installation, first-use workflow, backups, updates and troubleshooting.

This GitHub directory is the standalone React/Vite edition. The hosted Sites edition uses a separate source repository and hosting wrapper. A GitHub commit does not automatically update the hosted site; fixes to shared app logic must be applied and published there separately. Keep runtime-specific imports and the PDF worker URL appropriate to each edition.

## Current status

| Area | Status |
| --- | --- |
| Text-based PDF extraction | Implemented; 30 MB input limit, sequential processing, up to 50 pages per batch |
| Requirement extraction | Keyword candidates with source/page context; human interpretation and review required |
| Editable records | Requirements, references, reset maps, snippets, mistakes and acceptance-test definitions |
| Protocol timelines | Educational APB handshake, UCIe/PCIe study outlines, custom steps |
| SV/UVM assistance | Editable illustrative snippets and architecture/review checklists |
| AI companion | Evidence-bound prompt builder; no model API integration |
| Storage | Browser localStorage with schema-1 JSON backups, confirmed replacement on import, CSV exports |
| EDA execution | Not implemented; test results are entered manually |
| Page-number editing | Fixed: empty drafts and multi-digit replacement supported; validate when choosing a PDF |

## Recent fix — page-number editing (10 November 2026)

**Symptom:** Clearing `From page` immediately restored `1`, so entering a two-digit number required typing around that digit and deleting it afterward. `To page` used the same problematic handler.

**Root cause:** Each keystroke was converted to a number and clamped with `Math.max(1, +value)`. An empty string became zero, which was immediately replaced by one.

**Change:** Store the draft values as strings. Do not clamp or restore defaults while typing or on blur. Parse and validate the range before opening the PDF chooser, and validate again at extraction. Reject empty/non-digit values, non-positive or unsafe integers, and an end below the start. Show an inline accessible error without changing the draft. Clear that error when the user edits the inputs. Preserve PDF-bound checks, the 50-page batch cap, and the existing 1/20 initial defaults.

**Automated validation:** Extraction/CSV tests, page-range regression checks, TypeScript checking and the standalone production build passed. Cases cover `12–25`, one-page ranges, leading zeros, both empty fields, zero, negatives, decimals, exponent notation, non-numeric input, unsafe integers and reversed bounds.

**Browser validation:** Confirmed in the hosted-development preview that both fields remain empty after clearing, typed digits produce exactly `12` and `25`, an empty range shows the validation error, reversed `25–12` shows the ordering error, and correcting the fields clears the error. No data migration or workspace reset is required.

**UI regression procedure:** In Extract requirements, select all in From page and delete; it must remain empty. Type `12` and verify the field reads exactly `12`. Repeat for To page with `25`. Leave a field blank and click Choose PDF: an error must appear without opening the picker. Enter `25–12` and verify an ordering error; correct it and confirm that choosing a PDF is available. Test with a document whose physical page count covers the selected range.

## Known limitations and development guardrails

- OCR is not included. Scanned documents require an external OCR step; table extraction can scramble reading order.
- Only the latest source excerpt is held in the source editor. Added requirements retain their source metadata and evidence, but this is not a multi-document search index or RAG service.
- UCIe/PCIe views are study outlines, not complete normative LTSSMs. Exact encodings, timers and clause numbers must come from the chosen specification revision.
- Starter examples are illustrative project decisions, including the drain-on-reset policy. Do not present them as universal protocol rules.
- SV/UVM snippets are not EDA-qualified. No simulator, coverage collection or automated acceptance-test execution is connected.
- localStorage is browser/origin specific and quota limited. No cross-device synchronization or server database is implemented. Export backups; do not change or clear stored data to ship a UI fix.
- Do not commit proprietary PDFs, extracted workspace backups, credentials, `.env` files, generated PDF workers, build output or dependencies.
- No measured 8 GB Windows memory benchmark is claimed. PDF work is lazy-loaded and batched to keep normal use lightweight.

## Maintaining this handoff

For each meaningful change, update the status table if behavior changes and add a dated fix entry with symptom, cause, resolution and actual validation. Keep environment-specific setup in the README. Preserve the schema-1 backup format or provide an explicit migration if the data model changes. Check both standalone and hosted editions when modifying shared UI logic.
