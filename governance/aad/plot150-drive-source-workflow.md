# Plot 150 — Live SVG and Three.js Docs for the shared CAD workspace

Project `14_Amrit_Hardware_1`, Plot 150, Rohini Engineering and Builders, Pokhara Ward 14, Nepal.

## Authorities and file locations

- **Original sources:** the cadastral photograph (SOURCE-0001) and dimensional vector PDF (SOURCE-0002) stay in the restricted Desk Resources Drive gallery under Rohini Engineering and Builders. Their hashes, references, and limitations remain in the CAD source ledger.
- **Editable CAD sources:** the two existing native Google Docs are under Drawing Coordination → Rohini Engineering and Builders → 02 Project 2D and 3D Sources → 14 Amrit Hardware 1 — Plot 150. Each retains its document ID. The SVG Doc holds literal UTF-8 XML with exactly one `<metadata id="jp-cad-model">` JSON block. The Three.js Doc holds the browser renderer source.
- **Versions:** Google Docs revision history + generated immutable SVG/JSON files named by source SHA under `public/data/projects/14-amrit-hardware-1/snapshots/` + reviewed GitHub commits. The CAD repository owns domain versioning and A7 indexes it read-only; no A7 registry is silently overwritten.
- **Live Pages:** the shared CAD project workspace uses `public/assets/js/project-workspace.mjs`, and its Plot 150 site renderer uses `public/assets/js/plot-boundary-engine.mjs`. The 2D view embeds the imported SVG, and the 3D view reads geometry from the **same SVG's embedded model**, materialized as `plot-150-working.json`. GitHub Pages is a *static published frontend*, not the primary editing surface.

## Initial one-time access configuration (required)

1. Use a Google Cloud service account with the Google Docs API enabled. Grant it **Viewer** permission on the two stable code Docs and keep both Docs private.
2. Set the existing repository Actions secrets `CAD_PLOT150_GOOGLE_DOC_ID` for the SVG Doc, `CAD_PLOT150_THREEJS_DOC_ID` for the Three.js Doc, and `CAD_GOOGLE_SERVICE_ACCOUNT_JSON` for the service account credential.
3. Enable repository GitHub Actions to create pull requests with `GITHUB_TOKEN` if that organization/repository policy allows it. Otherwise provide a narrowly scoped authorized GitHub App token and adjust the workflow accordingly; do not broadly grant unreviewed main writes.
4. Run the **CAD Plot 150 — Google Docs SVG source review** workflow once with `workflow_dispatch`. The workflow also checks the Doc approximately hourly at UTC minute 17, subject to GitHub's scheduled-run delays. It creates or updates a **review pull request** only if source bytes change.
5. Validate the source hash, dimensions, semantics and cross-project CI, then merge the generated PR. Existing CAD main-commit Pages deployment/QA publishes the imported drawing; the site reads its own static assets and never gets private Google credentials. No immediate-on-edit webhook is claimed.

## Geometry and drawing-status rules

- The PDF trace remains the original plot-boundary reference. The current plan uses the edition identified in [the published source provenance](../../public/data/projects/14-amrit-hardware-1/plot-150-source-provenance.json).
- The SVG and linked 3D model use the same registered site and building geometry. The source adapter validates the edition, original plot corners, display units and plan contents before writing a review update.
- Earlier concepts preserve their own drawings and source files. Requests to change boundary vertices need separate survey reconciliation.
- The current project view preserves the recorded survey and construction approval statuses.

## End-to-end data flow

`SVG and Three.js Docs → authenticated Docs API → SVG, geometry and renderer checks → SHA-named Git snapshots and current assets → review PR → CAD main branch tests → GitHub Pages.`

**22 November 2026 sync status:** the scheduled workflow reached its setup check, then skipped the Docs reads because its private integration was incomplete. GitHub Pages serves the reviewed repository assets.
