# CAD Memory Wall — Level 1 (2026-11-18)

> Source owner: `FabinGurung/jp-drawing-coordination`. A7 is an external
> catalogue: `FabinGurung/jp-a7-system-registry`. Do not mirror its full
> registry or private Drive records into public CAD.

## 1. Why this record lives here

The user wants the CAD assistant to find the right project UI, data and
version rules quickly, without searching through every A7 conversation. The
CAD Memory Wall already exists at `public/memory-wall/`; the new short Level 1
page is `public/memory-wall/level-1/`, with machine index
`public/data/cad/memory-palace-level-1.v1.json`. The existing
`public/projects/{slug}/memory-wall/` contains deeper project and engineering
posters. Source-custody and platform architecture remain A7 catalogue pointers.

## 2. Client-first presentation contract

**01 Drawings:** select floor and 2D/3D. Click an actual model object: the
persistent right inspector shows **2D plan location above 3D envelope**, human
dimensions, a metric/feet switch and a single pinned position. Expanded
`Technical record` shows full source ID, host relation, source and provenance.
No developer editing or duplicated hover/pinned text appears in the client UI.

**02 Quantity takeoff:** simple numbered item rows grouped by floor with
length, breadth, height, area and volume as actually sourced. Unknown dimension
is blank/dash, not zero. This is an unpriced measured-object index: do not
aggregate duplicated presentation meshes with floor-graph walls as separate
procurement quantities. Internal IDs, evidence, graph nodes and PK/FK-style
relations remain in the original data, and are inspected per selected item.

**04 Packages:** source-linked site/WBS workbenches. **05 Sources & records:**
original drawings, source versions, evidence and detailed file records.
**More:** Memory Palace, codes, restrictions, client guide, knowledge centre,
other-module links and historical technical workflow.

**03 Programme/Gantt:** removed from the CAD client navigation; scheduling
authority is the separate Scheduling / Primavera module. The old activity data
and Git history are preserved, not replaced with CAD-owned planning records.

## 3. Versioning / geometry protection

Numbered architectural editions are each complete and immutable as snapshots.
Ashok v3.7 is final for its architectural drawing scope; v3.6 remains an
independent previous edition, with the earlier site assets. Neither edition
becomes structural design approval merely through a UI label.

Never overwrite source floor graphs for a client UI change. Keep CAD project
entity IDs, host-wall FKs, IFC-type candidates and source provenance stable.
Changes to visible client records must not mutate the source geometry.

## 4. Archive instead of visible editing

The previous browser change-request pane, editing studio link, edit history,
axis-review banner, checkpoint carousel, coordinate hover preview and component
audit register are excluded from the **client-facing project workspace**. Their
code and history remain in older commits or the documented
`governance/aad/browser-edit-handover.v1.md` for technical maintenance.
The client needs to view drawings and measured items, not record speculative
source-edit requests. No automatic back-end edit history is promised.

## 5. Module ownership and safety

- Google Drive: original documents and native maintained records.
- CAD GitHub: drawings, geometry, derived source-safe item indexes and CAD rules.
- GitHub Actions: regression/build checks.
- GitHub Pages: approved, public-safe client presentation.
- A7: constellation catalogue and cross-module links, read-only from CAD.
- Scheduling and resources: programmes, Gantt and calendars.
- Cost Estimation: rates, contracts and cost BOQ, separate from CAD measurements.
- Structural Analysis: structural calculation/approval, separate from architecture.

Do not copy private provider IDs or restricted records into public memory.
Only claim successful live publication after exact-commit Pages and readback.

## 6. Maintainer acceptance

Run source-level `node tools/site/cad-client-workspace-smoke.mjs`, the shared
workspace tests, staging browser tests for desktop/mobile and project versions,
plus Pages and independent readback. Preserve separate technical/full editor
route as archived developer functionality, not part of the client portal.

### Links
- Local poster: `public/memory-wall/level-1/index.html`
- Machine map: `public/data/cad/memory-palace-level-1.v1.json`
- CAD core Memory Wall: `public/memory-wall/index.html`
- Project memory poster engine: `public/assets/js/cad-project-memory-palace.mjs`
- A7 catalogue: https://github.com/FabinGurung/jp-a7-system-registry
