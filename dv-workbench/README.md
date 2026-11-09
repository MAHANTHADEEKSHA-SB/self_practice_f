# DV Workbench

A standalone, lightweight edition of the DV Workbench Sites app, with the same React UI and workflow logic. It uses Vite instead of the Sites hosting runtime so it can run directly on a Windows laptop.

## Run on Windows

Install Node.js 24 (with npm), then open PowerShell:

```powershell
git clone git@github.com:MAHANTHADEEKSHA-SB/self_practice_f.git
cd self_practice_f\dv-workbench
npm ci
npm run dev
```

Open the local URL printed by Vite. The development server binds to `127.0.0.1`. Keep the terminal open while using it; press Ctrl+C to stop. No GPU, Python, Ollama or local language model is required.

```powershell
npm test
npm run build
npm run preview
```

`npm run build` checks TypeScript and generates `dist/`. `npm run preview` serves that production build locally. Serve the files through HTTP rather than opening `index.html` directly. PDF.js and its worker are loaded only when PDF extraction is requested. The worker is copied from the installed, pinned package automatically for dev/build; it is not checked into this repository.

## Included workflows

- Extract text from selected PDF pages and find keyword-based requirement candidates.
- Preserve source names, revisions, page markers and original candidate evidence.
- Edit requirement tables, reset maps, reference entries, code snippets, mistake logs and Given/When/Then acceptance tests.
- Step through an educational APB handshake with configurable wait cycles.
- Use UCIe / PCIe study outlines or create your own source-backed timeline.
- Review reset handling, scoreboards/predictors, UVC architecture and closure checklists.
- Generate evidence-bound prompts to paste into ChatGPT or Claude.
- Save browser-local work; export/import JSON backups and export CSV tables.

The AI companion is a prompt builder, not an integrated model. Extraction is a keyword heuristic, not specification interpretation. Acceptance results are recorded manually; the browser does not run a simulator. Snippets are illustrative templates and require EDA validation. UCIe and PCIe exact encodings, LTSSM transitions, timers and citations must come from your chosen specification.

## Storage and migration from Sites

Edits and extracted text are saved in localStorage for the browser and origin you use. The source repository contains only starter examples, not your browser workspace. The hosted Sites app and localhost have separate storage:

1. In the hosted app, select **Export workspace**.
2. In the local app, open **Workspace settings → Import backup**.
3. Review and confirm replacing the local workspace.

Export backups regularly. Import replaces the current workspace after confirmation. Scanned PDFs need external OCR. Text-based PDFs are limited to 30 MB and 50 selected pages per extraction batch; table reading order must be checked manually. No measured 8 GB Windows memory benchmark is claimed.

## Extend the app

| File | Purpose |
| --- | --- |
| `app/page.tsx` | Navigation, forms, PDF flow, local saving and all interactive views |
| `app/globals.css` | Responsive visual design |
| `lib/workbench.ts` | Starter data, workflows, checklists, snippets, extraction and CSV helpers |
| `tests/workbench.test.mjs` | Candidate extraction and safe CSV export checks |
| `scripts/prepare-pdf-worker.mjs` | Copy the matching PDF.js worker before dev/build |

You can add most project content directly in the UI. Starter-code changes do not overwrite existing browser data. No Sites project IDs, hosting credentials or platform helper scripts are included.

The parent repository's LICENSE applies to this project's original source. Third-party dependencies retain their own licenses.

## First-time setup without SSH

You need Git, Node.js 24 (including npm), and an internet connection for the initial dependency download. Check `git --version`, `node --version`, and `npm --version` in a new terminal after installing them. A GitHub account or SSH key is not required to read this public repository: use HTTPS instead of the SSH clone command above if you have not configured SSH:

```powershell
git clone https://github.com/MAHANTHADEEKSHA-SB/self_practice_f.git
cd self_practice_f\dv-workbench
npm ci
npm run dev
```

Alternatively, download **Code → Download ZIP** on GitHub, extract it, and open a terminal in the extracted `dv-workbench` directory before running the npm commands. Run every npm command from this directory, where `package.json` is located. Normal local use does not require a ChatGPT login or an API key; the hosted private Sites app has separate access controls.

If PowerShell blocks `npm.ps1`, use `npm.cmd ci` and `npm.cmd run dev` (or run the commands in Command Prompt). You do not need to change the system execution policy. If a port is already occupied, open the exact alternative URL Vite prints. Keep the same local hostname and port when you want to reuse the same saved browser workspace.

## First workflow: from PDF to a reviewable requirement

1. Select **Start a workflow → Bring your source**, or **Explore an example** to try the built-in bridge-reset excerpt without a PDF.
2. Set **From page** and **To page**, then select **Choose PDF**. Both fields can be cleared and retyped, including multi-digit numbers such as `12` and `25`. Empty, non-integer, zero/negative or reversed ranges show an error when you choose a PDF.
3. Page numbers refer to the PDF's physical pages, starting at 1, not the printed page labels inside a specification. The end is capped at the PDF length and at 50 pages per extraction; a start beyond the document is rejected. Split larger ranges into batches.
4. Fill in the source revision and section/table after uploading. Inspect the extracted text against the PDF, particularly tables and footnotes.
5. Select **Find requirement candidates**. Review/edit the candidates and add selected items to the requirements table. The original matched statement is retained as evidence.
6. Open **Requirements → Edit** to set the verification method, review status and acceptance-test ID. Starter rows are review prompts; extracted candidates are unreviewed until you check them.
7. Use **Reset maps** to record trigger, in-flight behavior, recovery and checker obligations. Use **Acceptance tests** for Given/When/Then definitions and manual result recording.
8. Open **AI companion** to build and copy a grounded review prompt into your chosen assistant. Nothing is sent to a model automatically.
9. Select **Export workspace** before changing machines, browsers or ports, and periodically as a backup.

Only the latest extracted source text is retained in the source editor. Requirements already added to the table remain saved. The app does not retain PDF bytes, perform OCR, run EDA tools, or automatically treat extracted text as verified protocol behavior.

## Get fixes and contribute

If you cloned with Git, export a workspace backup, stop the dev server, and run these commands from `dv-workbench`:

```powershell
git pull --ff-only
npm ci
npm test
npm run dev
```

If Git reports local modifications or a merge conflict, preserve your edits before resolving it; do not discard them merely to update. ZIP users should download/extract the updated archive and import their workspace backup. Browser storage may be cleared by private browsing or browser cleanup, so keep exported JSON files outside the browser.

For bug reports, include the view/button, steps to reproduce, expected versus actual behavior, browser, Node version, and any visible error. Use a small non-confidential fixture rather than uploading a proprietary specification.

See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for architecture, current status, limitations, and the recent fix history. Before submitting code changes, run `npm test` and `npm run build`, then exercise the affected UI path.
