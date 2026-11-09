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
