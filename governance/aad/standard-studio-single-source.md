# A7/A9 CAD — Standard Studio as a single-source engine
19 November 2026 · Client presentation contract 1.5 (engine remains 1.4 compatible)

## One engine, project-specific sources

The six current project reader front doors (Ashok, Narayani, Harisharan, Ramachandra, JS Buddhal Jewelers and synthetic Empty) load the exact same source module `public/assets/js/project-workspace.mjs` and stylesheet `public/assets/css/project-workspace.css`. The CSS selector `data-studio-template="standard-client-v1"` selects one common interface, not one copy per project.

`public/assets/js/project-workspace-config.mjs` supplies only allowed project-specific edition, floor, model/source, status, package and reference data. Source documents are kept as separate edition-versioned files in `public/data/projects/<slug>/`; Drive originals remain authoritative.

A shared engine change is deployed **once** across all front doors in the same repository build. No project-by-project reapplication. Existing project specialist modules, historical routes and technical editor remain intact (not placed in default client navigation). Harisharan uses its qualified independent drawing adapter until mapped accurately to AAD floor graphs. Unadmitted geometry, cost, material quantities and engineering approvals remain HOLD/unknown.

## Adding a new project

Register a public-safe project once in `ALL_WORKSPACE_PROJECTS` using documented editions/source links. `tools/site/generate-standard-studio-entries.mjs` automatically creates its initial `public/projects/<slug>/index.html` from `governance/aad/studio-project-entry.v1.html` during dev/build if absent. Existing routes are not overwritten; no project-specific JS/CSS templates are copied. Keep technical source documents and project-owned specialist pages unchanged.

## Validation and controlled release

`node tools/site/cad-standard-studio-smoke.mjs` enforces reader identity for all registered projects. CI also executes the existing workspace, source-control, construction package and mobile/desktop smoke/browser tests. A single code update requires **cross-project testing**, not manual reintegration. A model-data update still requires independent evidence and engineering acceptance.

Publish through protected PR, CI, GitHub Pages build and actual live readback. This note is not certification of merge, live deployment, design approval or permission to edit any Drive source.
