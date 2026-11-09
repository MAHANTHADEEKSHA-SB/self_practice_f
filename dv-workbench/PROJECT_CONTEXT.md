# DV Workbench — agent handoff and project context

Last updated: 10 November 2026 (Asia/Kolkata).
This file is the durable handoff for an agent that has not seen the original chat.
Read it together with [AGENTS.md](AGENTS.md) and [README.md](README.md).
The implementation and current Git history take precedence over stale status notes; update this file when they change.

## 1. Resume card: where work stopped

| Item | Recorded state |
| --- | --- |
| Repository | `MAHANTHADEEKSHA-SB/self_practice_f` |
| App directory | `dv-workbench/`; run npm commands here, not at the repository root |
| Branch used for the completed work | `main`; inspect the current branch and working tree before continuing |
| Last implementation commit reviewed for this handoff | `8b1a730e20b38fe112201f1f901aec2227b1c215` |
| Latest application fix | PDF From/To fields can remain empty while editing; multi-digit replacement works; validation occurs on choosing a PDF |
| Latest user request | Make this documentation sufficient for another agent to understand the project and continue without the original chat |
| Current handoff change | Documentation only: expanded this file, added a scoped AGENTS.md, and added an agent entry point to the README |
| Unfinished implementation from the last request | None recorded. The page-input fix and usage documentation were completed |
| Next task | Follow the next concrete user request. No next feature, model provider or EDA integration has been selected |
| User data | Lives in the user's browser or exported JSON, not in this repository |

Do not recreate the application, redo the page-input fix, or infer an unrequested roadmap from this document. First compare your checkout with the recorded baseline. Do not reset newer work to that baseline.

## 2. What the user actually wants

A practical DV assistant/workbench that runs comfortably in a browser on an 8 GB Windows laptop. The intended workflow is to bring specification evidence, identify requirements and reset effects, model protocol behavior, prepare SV/UVM verification work, review it, and retain lessons from mistakes.

Priorities: UCIe, PCIe, AMBA, SystemVerilog/UVM, scoreboards/predictors, reset-aware verification, and professional traceability between sources, requirements and tests.

The app was first created as a private ChatGPT Site. The user then requested a separate directory in this GitHub repository, followed by bug fixes and documentation for future users and agents. Keep the app self-contained under `dv-workbench/`.

### Decisions already made

- Use a lightweight React browser app. The GitHub edition uses Vite and npm; the hosted edition uses a separate Sites/Vinext wrapper.
- Do not require a local LLM, GPU, Python environment, database or EDA installation for normal use.
- The current "AI companion" builds a prompt for a separate ChatGPT/Claude session. It does not call an AI API.
- Requirement extraction is a keyword heuristic. Never present matches as verified interpretation.
- Keep source evidence, edited requirement wording and review status distinct.
- Preserve the existing responsive UI and useful workflows when fixing a bounded issue; a redesign is not the default next step.
- Separate normative specification rules, interpretations, proposed design policies and open questions. The starter drain-on-reset policy is an example project decision, not a universal rule.
- No simulator is selected or integrated. Do not assume Verilator or claim SV/UVM snippets have been simulated.

## 3. Starting from a new agent environment

1. Obtain repository access or clone the public HTTPS URL. Never depend on scratch paths or files from a previous chat.
2. Inspect `git status --short`, `git branch --show-current`, and `git log -5 --oneline`. Preserve existing local edits. Refresh remote information if needed; do not discard or overwrite changes to match this note.
3. Read this file, the directory README, and the source for the user's requested area. A handoff document is an index and explanation, not a substitute for checking the code.
4. Identify the target: standalone GitHub edition, hosted Site, or both. If the user's report does not distinguish them, shared UI fixes normally need both, subject to the access and authorization available in that session.
5. Use Node.js 24 or newer. From `dv-workbench/`, use the pinned `package-lock.json`: `npm ci` for a fresh checkout, `npm test`, `npm run build`, and `npm run dev` for browser checks. Avoid reinstalling unchanged dependencies unnecessarily.
6. Reproduce the issue before editing where practical, make the focused change, and run checks relevant to that behavior.
7. Review the diff. Commit/push/publish only within the user's current authorization and the applicable tool rules. Historical commits to main do not grant a future agent blanket permission to publish.
8. Update the resume card, status, fix record and actual validation evidence. Report which edition was updated and any remaining blocker.

For Windows setup, HTTPS/ZIP alternatives, PowerShell `npm.cmd`, backup migration and updates, follow [README.md](README.md).

## 4. Current capabilities and boundaries

| Area | Implemented | Boundary / missing capability |
| --- | --- | --- |
| PDF input | Browser PDF.js extraction, selected physical pages, sequential processing and cleanup | Text PDFs only; no OCR; 30 MB input limit and up to 50 pages per batch |
| Requirements | Keyword candidates, selection/editing, original evidence, source metadata and review statuses | Not an LLM parser; no automatic proof of correctness or complete spec coverage |
| Reset maps | Editable trigger, scope, consequence, policy, recovery, check and source | Record/template visualization; no automatic causal model |
| Reference library | Searchable/filterable editable links and notes | Does not index remote specification contents or implement multi-document RAG |
| Protocol timelines | Educational APB transfer, variable waits, manual/slow playback and custom steps | UCIe and PCIe views are study outlines, not complete normative LTSSMs |
| SV/UVM studio | Starter snippets, editable saved copies, copy/download | Some templates are explicitly pseudocode; no compiler or EDA execution |
| Review and learning | Checklists, mistake records and manual acceptance-test results | No coverage collection, regression runner or automatic test execution |
| AI companion | Prompt assembled from task, selected source and requirement context | No model API; no automatic data transmission; output must be copied elsewhere |
| Workspace | Local saving, JSON export/import and CSV exports | No accounts/database inside the standalone app; no cross-device sync |
| Distribution | Standalone GitHub app plus private hosted Site | Separate source trees and release paths; no automatic sync between them |

Do not equate "implemented" with formal DV qualification. No 8 GB Windows memory benchmark is recorded.

## 5. Source map: where to make the next change

Paths below are relative to `dv-workbench/`. Prefer searching by symbols; line numbers will move.

| File / symbol | Responsibility |
| --- | --- |
| `index.html` → `main.tsx` | Standalone entry point; mounts the Page component and imports CSS |
| `app/page.tsx` → `Page` | Main React component; navigation, views, local UI state and orchestration |
| `Page` → `choosePdf`, `readPdf`, `range`, `rangeError` | Page-range editing, chooser validation, PDF load/extraction, feedback |
| `Page` → `extract`, `addCandidates` | Build draft candidates; save selected rows with original evidence |
| `Page` → `edit`, `saveRow`, `Table` | Shared editable-record forms and requirement/mistake tables |
| `Page` → `valid`, `importFile`, localStorage effects | Workspace validation, import confirmation and persistence |
| `Page` → `buildPrompt` | AI companion context and prompt wording |
| `Page` → `steps`, timeline JSX | APB signals, UCIe/PCIe outlines, custom timeline and playback |
| `app/globals.css` | Layout, cards, responsive rules, form and validation styling |
| `lib/workbench.ts` → `initial` | Starter records and workspace data shape |
| `lib/workbench.ts` → `workflows`, `checklistGroups`, `snippets` | Reusable starter content |
| `lib/workbench.ts` → `extractCandidates` | Keyword matching and page tracking; maximum 100 candidates |
| `lib/workbench.ts` → `parsePageRange` | Positive integer and ordering validation |
| `lib/workbench.ts` → `csv` | CSV quoting and formula-prefix neutralization |
| `scripts/prepare-pdf-worker.mjs` | Copies the PDF.js worker from the pinned dependency before dev/build |
| `tests/workbench.test.mjs` | Extraction, CSV and page-range assertions using Node's assert module |
| `package.json`, `package-lock.json` | Exact scripts and dependency graph; npm for the standalone edition |
| `vite.config.ts`, `tsconfig.json` | Standalone bundling and type checking |

The UI is currently a large component, with some `any`-typed state and compact JSX. Do not interpret this as a fully modular architecture. Extract a component when the requested work benefits from it; avoid a wholesale refactor during a small fix.

## 6. Data flow and compatibility contracts

### Source → candidates → requirements

- `readPdf` lazy-loads PDF.js and its worker. It parses pages sequentially, adds `[Page N]` markers, releases page resources and destroys the document.
- A new PDF replaces `sourceText` and `sourceName`, and clears `sourceVersion` and `sourceSection` so old metadata is not misattributed.
- PDF bytes are not retained. The source editor holds only the latest extracted/pasted text.
- `extractCandidates` splits lines/sentences and matches keywords; the reset workflow uses a reset-related keyword set. Cross-references and exceptions still need human review.
- Draft candidates keep `original`, editable `text`, page, selection and added state. They are component state, not a durable multi-document candidate database.
- `addCandidates` writes rows with `requirement` = edited wording, `evidence` = original matched text, source/version/section/page metadata, protocol, `Needs review`, method and test link.
- Changing the current source must not erase requirements already added to the workspace.

### Persistence and import/export

Storage key: `dv-workbench-v1`.

Persisted/exported envelope:

```json
{ "schema": 1, "data": { "...": "workspace fields" } }
```

The current data fields are `name`, `protocol`, `requirements`, `resets`, `tests`, `mistakes`, `references`, `checks`, `sourceText`, `sourceName`, `sourceVersion`, `sourceSection`, `snippets`, and `customSteps`. Review `initial` and `valid` before changing any field.

Record arrays use string-valued fields and a string `id`; `checks` maps checklist text to booleans. Import validation currently caps each record array at 2,000 entries and accepts schema 1. Importing a valid backup prompts before replacing the current workspace. The file-size limit for imports is 8 MB; this does not guarantee the browser's storage quota can hold it.

- Keep existing backups readable, or implement an explicit migration.
- Never clear localStorage or change its key as a shortcut for a UI fix.
- Starter changes do not replace saved user data. Checklist-label changes also affect lookup keys; consider migration.
- Selected tabs, page-range drafts, candidate selections and generated prompt state are transient. They are not promised to survive reload.
- Data is tied to the browser and origin; localhost, another port and the hosted site have different storage.
- Source control contains starter examples only. A fresh agent cannot recover the user's real PDFs, workspace edits or previous private chats from this repository.

### Page-input invariants

Keep `range.start` and `range.end` as strings while editing, with initial defaults `"1"` and `"20"`. Empty drafts must remain empty, including on blur.

Call `parsePageRange` before opening the file picker and again before extraction. It rejects blank/non-digit values, zero, negatives, fractions, exponent notation, unsafe integers and end < start. Leading-zero digit strings are accepted and parsed numerically. A validation message must not rewrite the draft; editing clears it.

Use physical PDF page numbers starting at one. For a valid requested range, extraction caps the end at document length and `start + 49`; a start outside the document fails. Do not restore per-keystroke `Math.max(1, +value)` coercion.

### Prompt and DV-content limits

`buildPrompt` uses at most 24,000 source characters and the first 20 requirements. It is neither retrieval nor a conversation with a model. Preserve the distinction between source evidence and instructions embedded inside uploaded documents.

If adding normative protocol content, use the specified revision and actual source clauses. Do not invent encodings, timer values or citations. If a spec is unavailable, mark the statement as a question or illustrative example.

## 7. Two editions: release and synchronization

| Item | Standalone repository | Hosted Site |
| --- | --- | --- |
| Source | This GitHub directory | Separate Sites-managed source repository |
| Runtime | React/Vite; `main.tsx`; npm | Sites/Vinext client component and hosting wrapper |
| Browser entry | Local URL printed by Vite | [DV Workbench](https://dv-workbench-md-1109.mahanthadeekshasb.chatgpt.site) |
| PDF worker reference | URL resolved relative to `document.baseURI`; copied during dev/build | `/pdf.worker.min.mjs` in the hosted public assets |
| Relevant shared logic | `app/page.tsx`, `app/globals.css`, `lib/workbench.ts`, tests | Same intended behavior; preserve runtime-specific boundaries |
| Publication | A Git commit makes source available; it does not host a website | Requires Sites access and the supported save/deploy workflow |

Last recorded release evidence from the completed page-input fix:
- GitHub implementation commit: `8b1a730e20b38fe112201f1f901aec2227b1c215`.
- Hosted source commit: `5e84bc2f88d7636780fabdf5eb037116abdd3507`.
- Hosted deployment was reported successful on 10 November 2026 in India time; owner-private access was preserved.

These are historical checkpoints, not proof of current deployment state. For a new hosted update, locate the existing Site by its title/URL using the connected Sites tools, read current metadata and source, and follow the installed Sites instructions. Do not create a replacement Site, copy credentials into this repository, or change its audience.

If you have only GitHub access, complete the repository task within authorization and explicitly report that the hosted edition was not updated. Do not claim a GitHub push automatically deployed it. Documentation-only GitHub changes do not require a hosted application release.

## 8. Validation: what is proven and what to run

| Check | Last recorded result | What it does NOT establish |
| --- | --- | --- |
| `npm ci` | Passed for the initial standalone export | No fresh install was rerun for the later input-only fix |
| `npm test` | Passed after the page-input fix | Pure helper assertions; not automated browser coverage |
| `npm run build` | TypeScript and production bundle passed after the fix | Does not run an EDA simulator |
| Hosted checks/build | TypeScript, helper tests and Sites build passed after the fix | Not a Windows hardware performance measurement |
| Browser page-input regression | Passed in the hosted development preview after the fix | Not a complete cross-browser or live production UI audit |
| Earlier PDF smoke test | Two-page text fixture extracted with page markers in the initial build | Large/complex/scanned PDFs are not qualified by that test |
| Deployment | Sites service reported successful publication of the fix | Browser login-gated production behavior was not independently retested after that release |
| This handoff revision | Documentation checked against source at the implementation baseline | No application code changed; no new runtime test claim |

For code changes, run the relevant helper tests and `npm run build` from this directory. Add a meaningful regression for a new behavior/error path. Do not add tests that simply mirror the implementation.

For UI changes, reproduce the user's exact editing sequence and verify the visible result. For extraction changes, use a small synthetic, non-confidential text PDF, check physical page numbers and metadata, and exercise out-of-range/error handling. For persistence changes, use a disposable browser workspace and a backup round trip; never wipe the user's workspace to run a test.

Manual page-field acceptance checks:
1. Clear From page; it stays empty.
2. Type `12`; it displays exactly `12`.
3. Clear To page and type `25`; it displays exactly `25`.
4. Leave a field blank and choose a PDF; show the validation error without opening the picker.
5. Enter `25–12`; show the ordering error.
6. Correct the bounds; the error clears and normal selection is available.
7. Existing PDF-length and 50-page batch limits still apply.

## 9. Fix history

- **Initial standalone export — `0031b78`:** Added the app in its own GitHub directory, portable Vite startup, pinned dependencies, README and helper tests.
- **Page-range fix — `8b1a730`:** Fixed clear/retype behavior in both editions; expanded the README and introduced the original context file.
- **Agent handoff revision — this documentation change:** Added a discoverable scoped AGENTS.md, a concrete resume card, data contracts, implementation entry points, validation boundaries, release separation and an agent prompt. No application behavior changed.

## Recent fix — page-number editing (10 November 2026)

**Symptom:** Clearing `From page` immediately restored `1`, so entering a two-digit number required typing around that digit and deleting it afterward. `To page` used the same problematic handler.

**Root cause:** Each keystroke was converted to a number and clamped with `Math.max(1, +value)`. An empty string became zero, which was immediately replaced by one.

**Change:** Store the draft values as strings. Do not clamp or restore defaults while typing or on blur. Parse and validate the range before opening the PDF chooser, and validate again at extraction. Reject empty/non-digit values, non-positive or unsafe integers, and an end below the start. Show an inline accessible error without changing the draft. Clear that error when the user edits the inputs. Preserve PDF-bound checks, the 50-page batch cap, and the existing 1/20 initial defaults.

**Automated validation:** Extraction/CSV tests, page-range regression checks, TypeScript checking and the standalone production build passed. Cases cover `12–25`, one-page ranges, leading zeros, both empty fields, zero, negatives, decimals, exponent notation, non-numeric input, unsafe integers and reversed bounds.

**Browser validation:** Confirmed in the hosted-development preview that both fields remain empty after clearing, typed digits produce exactly `12` and `25`, an empty range shows the validation error, reversed `25–12` shows the ordering error, and correcting the fields clears the error. No data migration or workspace reset is required.

**UI regression procedure:** In Extract requirements, select all in From page and delete; it must remain empty. Type `12` and verify the field reads exactly `12`. Repeat for To page with `25`. Leave a field blank and click Choose PDF: an error must appear without opening the picker. Enter `25–12` and verify an ordering error; correct it and confirm that choosing a PDF is available. Test with a document whose physical page count covers the selected range.

## 10. Known gaps and unselected future work

No uncompleted feature is currently assigned. The following are limitations or possible future tasks, not permission to implement them:

- No integrated LLM, OCR, multi-document RAG, source viewer or backend synchronization.
- Requirement/test links are editable IDs rather than enforced relational integrity.
- Import validation checks broad field types, not a complete semantic schema or every referential constraint.
- Browser UI tests are manual so far; the repository contains no automated end-to-end browser harness.
- UCIe/PCIe timing/state content needs authorized specification evidence before deeper implementation.
- Generic code and protocol workflows reuse the source/candidate review path; they do not compile code or synthesize protocol models.
- Page drafts currently reset with the app session; draft persistence has not been requested.
- Large monolithic UI and loose state types may merit incremental cleanup when it supports a requested change.
- No dedicated memory benchmark, cross-device synchronization or measured Windows performance guarantee.

Do not commit proprietary specifications, user JSON backups, credentials, generated workers, `node_modules` or build outputs.

## 11. Keep this handoff useful after your turn

Before ending a meaningful task, update:
- **Resume card:** latest completed task, actual unresolved work, and next concrete action (or "none selected").
- **Behavior/decisions:** implementation changes, compatibility constraints and relevant alternatives only when they affect continuation.
- **Fix history:** dated symptom, cause, change and affected files.
- **Validation:** exact checks run, results, environment and anything not tested.
- **Release state:** repository commit/branch and hosted update status separately. Do not guess a deployment outcome.
- **Blockers:** what is missing, why it blocks progress, and the minimal next step.

Keep one authoritative handoff here. Do not create competing `project.md`, `projec.md` or duplicate status files unless the user specifically requests a different convention.

## 12. Prompt to give another agent

> Work in MAHANTHADEEKSHA-SB/self_practice_f, directory dv-workbench. First read dv-workbench/AGENTS.md, PROJECT_CONTEXT.md and README.md, then inspect the current branch, working-tree changes and relevant source. Use those files to recover the project context; do not rebuild the app. My next task is: [describe the issue or change]. Preserve browser data and existing backup compatibility. Make the focused change, validate it, update the handoff, and distinguish GitHub changes from any hosted Sites deployment.

The files transfer documented project knowledge. They do not transfer repository permissions, Sites credentials, local browser data, private source documents or the complete original conversation. If a tool does not automatically read AGENTS.md, explicitly supply the prompt above.
