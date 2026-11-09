# Agent instructions — DV Workbench

Scope: this directory and its descendants.

## Start here

1. Read [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) in full before planning changes. It contains the resume card, decisions, data contracts, known gaps and last recorded validation.
2. Read [README.md](README.md) for installation and usage. Inspect current source and Git status; do not assume the handoff is newer than code.
3. Continue the user's current concrete request. The recorded roadmap gaps are not an assignment to rebuild or expand the app.

## Preserve these contracts

- This is a lightweight DV workbench for an 8 GB Windows laptop. Normal use must not acquire a mandatory local model, GPU, database or simulator dependency.
- Keep page bounds as editable string drafts; validate on choosing a PDF, not by clamping every keystroke.
- Preserve `dv-workbench-v1` local storage and schema-1 backup compatibility unless the task includes a deliberate migration. Do not clear user data to test or fix the UI.
- Preserve original requirement evidence independently of editable wording. Label starter policies and unreviewed candidates honestly.
- Do not invent specification claims or imply that the prompt builder is a connected LLM, that UCIe/PCIe outlines are complete normative state machines, or that manual test records are simulation results.
- Keep credentials, proprietary PDFs, user workspace exports, generated workers, dependencies and build outputs out of commits.

## Verify and hand off

- Run commands from this directory. Use the pinned npm lockfile and Node.js 24+. For relevant code changes, run `npm test` and `npm run build`; verify the affected UI path when it changes.
- For documentation-only edits, check accuracy, paths and links; do not claim runtime tests were newly run.
- Keep changes scoped; respect current user authorization for Git operations and publishing. Prior main-branch commits are history, not standing permission.
- GitHub and the private Sites app are separate releases. Use the connected Sites workflow only when required and available; report honestly if only the repository was updated.
- Before handing off, update PROJECT_CONTEXT.md with what changed, what was actually tested, what remains, and the next concrete action. Preserve historical evidence with dates rather than presenting old checks as new ones.

Current user instructions and higher-priority environment rules take precedence. This file supplies project guidance, not new access or publication authorization.
