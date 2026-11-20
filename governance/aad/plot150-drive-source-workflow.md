# Plot 150 — Single live Google Doc to shared CAD 2D/3D workspace

Project `14_Amrit_Hardware_1`, Plot 150, Rohini Engineering and Builders, Pokhara Ward 14, Nepal.

## Authorities and file locations

- **Original sources:** cadastral photograph (SOURCE-0001) and dimensional vector PDF (SOURCE-0002) are unmodified in restricted Rohini project Google Drive. Their original hash/reference and limitations remain in the CAD source ledger.
- **Editable canonical design input:** one **native Google Doc** containing literal UTF-8 SVG source, preserved at the **same document ID for every author revision**. The SVG contains exactly one `<metadata id="jp-cad-model">` JSON block. The text must remain valid unwrapped XML and source layers must remain distinct.
- **Versions:** Google Docs revision history + generated immutable SVG/JSON files named by source SHA under `public/data/projects/14-amrit-hardware-1/snapshots/` + reviewed GitHub commits. The CAD repository owns domain versioning and A7 indexes it read-only; no A7 registry is silently overwritten.
- **Live Pages:** the shared CAD project workspace uses `public/assets/js/project-workspace.mjs`, and its Plot 150 site renderer uses `public/assets/js/plot-boundary-engine.mjs`. The 2D view embeds the imported SVG, and the 3D view reads geometry from the **same SVG's embedded model**, materialized as `plot-150-working.json`. GitHub Pages is a *static published frontend*, not the primary editing surface.

## Initial one-time access configuration (required)

1. Create a Google Cloud service account with the Google Docs API enabled. Grant it **Viewer** permission on the stable code document only (and, optionally, its necessary parent folder). Keep source Drive private; never make it publicly readable just to make automation work.
2. Set two encrypted repository **Actions secrets**: `CAD_PLOT150_GOOGLE_DOC_ID` (the stable Google Docs document ID) and `CAD_GOOGLE_SERVICE_ACCOUNT_JSON` (the complete service account JSON credential). No credentials are stored in code, SVG, pull requests or Pages. Prefer workload identity federation in a later security-hardening version.
3. Enable repository GitHub Actions to create pull requests with `GITHUB_TOKEN` if that organization/repository policy allows it. Otherwise provide a narrowly scoped authorized GitHub App token and adjust the workflow accordingly; do not broadly grant unreviewed main writes.
4. Run the **CAD Plot 150 — Google Docs SVG source review** workflow once with `workflow_dispatch`. The workflow also checks the Doc approximately hourly at UTC minute 17, subject to GitHub's scheduled-run delays. It creates or updates a **review pull request** only if source bytes change.
5. Validate the source hash, dimensions, semantics and cross-project CI, then merge the generated PR. Existing CAD main-commit Pages deployment/QA publishes the imported drawing; the site reads its own static assets and never gets private Google credentials. No immediate-on-edit webhook is claimed.

## Geometry and drawing-status rules

- Original four PDF sides: east/rear 21'-6", south/right 41'-10", west/road/front 37'-2", north/left 58'-1". Directions reflect **owner statements**, not a verified survey bearing.
- **Only west/front road boundary** has a drawn setback band; north, south and east have **no setback marked in the owner concept**. This is not a determination of Pokhara municipal setback legality.
- The front line was extended from the original PDF's internally drawn front boundary; its approximately 1.98 m displayed offset is a PDF drawing interpretation only. The original text `6.5"` remains an unresolved annotation requiring clarification.
- Rectangular house: concept `4.50 × 9.50 m` (42.75 m² footprint). The display-only G+1 mass 6 m high does not specify approved storeys, architectural room layout, structural member sizes or construction heights.
- Blue dashed footprints reserve an underground water tank, septic tank and soak pit. **Capacities, depths, soil absorption, drinking-water separation, contamination risk, groundwater and footing clearances are not validated.** They are not field setting-out or construction instructions.
- `amrit-drive-svg-sync.py` rejects changes to the original plot boundary and malformed/externally linked SVG. For new cadastral measurements, open a separate source-controlled survey-reconciliation review instead of changing source vertices silently.

## End-to-end data flow

`Google Doc (stable ID, literal SVG + embedded JSON) → authenticated Docs API → strict SVG/geometry validator → SHA-named Git snapshots + current SVG/JSON → generated review PR → CAD main branch tests → main-commit Pages publication → linked 2D/3D website.`

**Current availability is distinct from readiness:** the code and Docs file can exist before Google Actions credentials are configured. Without those secrets, the workflow only displays a setup notice and does not claim a Google Drive sync. This is intentionally fail-closed for private source files.
