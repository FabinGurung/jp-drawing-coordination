# A7/A9 Memory Palace — Plot 150, AAD-14-AMRIT-P150-V004

Project: Rohini Engineering and Builders / Pokhara Ward 14 / `14_Amrit_Hardware_1`, cadastral plot 150 (१५०).
Edition: **AAD-14-AMRIT-P150-V004** (2026-11-20), predecessor V003. No approvals inferred.

## Durable, permanent Google Docs code authority

1. **SVG / 2D plan & embedded JSON room and wall geometry** — same canonical ID across V003 → V004 → future editions:
   https://docs.google.com/document/d/1pRhzmnOoKTDxcGhiMyjoVaN1LOQ-0F9uDMJUEGJ4smA/edit
2. **Three.js source / actual 3D renderer code** — dedicated permanent live code document, never a screenshot:
   https://docs.google.com/document/d/1o9FJvRHjgY_6fFOIMZSp_oEtKX7qEBylNUpY7Vh8v2Q/edit

Both native Docs remain restricted; their source bytes must be reviewed, validated, SHA-versioned and merged into Git before Pages publication. Code is literal UTF-8, not Markdown backticks. Docs version history preserves edits. The Three.js renderer is **code**, but it must never keep a second independent set of room dimensions; it draws `geometry.house.plan` from the canonical SVG metadata.

## Release evidence

SVG SHA-256: `bff13c3203749783acab72b17880d5fef14a892c16deedaf9f0fe4ff323344ab`
Three source SHA-256: `e85febeeb94287b91cf5cda3e504e74a47e7def3fac78b1e666ed52557e42a41`
Source PDF SHA-256 (unchanged): `bb5921eb47275f5652b8e9378d05bc048e1e220752a395a90874fac640f8c4ba`
Sources: SVG `plot-150-working.svg`, JSON `plot-150-working.json`, Three.js `src/plot150-three.mjs`, Vite-compiled JS bundle `assets/plot150-three.v004.js`. Pinned installed library `three@0.181.2` from npm — no unversioned CDN script.

Saved immutable snapshots in `public/data/projects/14-amrit-hardware-1/snapshots/`. Frozen historical V001/V002/V003 sources remain in Git and Google Drive archive. Do **not** overwrite source cadastral photo/PDF.

## V004 geometry / design-only logic

- Plot outer vertices & labelled lengths identical to original PDF-derived baseline.
- West/road front setback only; the drawing's approximate setback was not legally verified.
- Rectangular house aligned with the east/rear line, 6.30m east-face width × 10.10m depth = 63.63m² conceptual gross footprint. Original east PDF edge ≈6.558m, not a certified building line.
- Ground-floor 2 bedrooms (second compact ~8.61m²), master-attached bath, living room, kitchen, staircase, rear lobby and circulation; concept door openings explicitly subtracted from shared SVG/3D wall segments.
- **No underground tanks/septic/soak footprints drawn**. Infrastructure requirements still unresolved, no assumption they are unnecessary.
- One conceptual above-ground floor only, display wall height 2.8m; original V003 6m mass not used as architecture design evidence.

## Source-to-site flow and gates

`2 live Google Docs → authenticated importer (when repo secrets are configured) → strict source validations + frozen SHA snapshots → Git review PR → cross-project staging QA → merge to main → exact-commit audited GitHub Pages deploy → live readback.`

Code/doc changes are **not** automatically live without Git review/merge, and GitHub Actions credentials have not been confirmed configured. The initial V004 source was directly admitted after readback to this reviewed branch. The render uses the same room arrays in 2D SVG and real Three.js WebGL mesh/wall geometry.

Owner-facing website must not display internal IDs, database jargon, raw coordinates, developer code, or editing controls. Historical source files remain accessible in A7 governance, not shown as confusing working editions. Engineering, municipal, drainage and georeference approvals remain on HOLD.
