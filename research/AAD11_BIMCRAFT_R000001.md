# AAD_11 — BIMcraft source preservation and interoperability R000001

Research only; issue #154. Baseline: 4b7dc8dd8bf30b046f3df2a266fb3bc80516f980. No client source, A7 writes, Pages or model changes.

## Source identity
- Upstream: https://github.com/getcadcraft/bimcraft
- Commit: 79b603f6683f2f000b9e8346c1fc92cf466ab01d
- Tree: cfa7297e33e7c8762581dc586fc2c39fa91d94bb
- Pinned tree inspection: 36,535 blobs; no submodules; approximately 1.93 GB uncompressed.
- Upstream exact-commit Tests run: https://github.com/getcadcraft/bimcraft/actions/runs/45129229068 (success; not an independent JP test).
- Preserve LICENSE, NOTICE, THIRD_PARTY.md, PROVENANCE.md, TRADEMARKS.md, BUILDING.md; inspect dependency-specific notices before reuse. No upstream code or branding is shipped.

## R02 acceptance
Download pinned archive from codeload; verify every file against the complete upstream Git tree by Git blob SHA-1 and size, and record SHA-256 of archive. Fail on missing/extra files or mismatched tree. Keep archive outside Git; transfer verified artifact to controlled Drive and read back the digest before closing R02. A temporary Actions artifact is not permanent Drive preservation. If the archive exceeds artifact quota or has export exclusions, preserve a verified Git checkout/pack instead.

## R03–R05 acceptance (pending)
Use existing synthetic models/open-architecture-engine-v0.2/poc-model.json only. Baseline geometry: one 6000 x 4000 mm storey, 3000 mm height, 230 mm walls, 125 mm slab, one hosted 1000 x 2100 door and one hosted 1500 x 1200 window. No client geometry.

- Native upstream tests: npm test -- --oracles in disposable environment; record skips and dependency failures separately.
- IFC round trip: element identity and GlobalId preservation; matching units, bounds, storey and host relations. JP IFC/geometry readers remain independent oracles. Define coordinate tolerances before comparison.
- Mutation: widen window by 100 mm; require derived SVG/DXF/glTF and dimensions change, stable room/element IDs, and undo restores geometry. Compare opening removal, undo/redo, sections, schedules and BCF issue references.
- Clash: include disjoint, partial overlap, touching and fully contained cases; report known containment limitation, not an approval.
- Any adapter needs a separate reviewed PR; the Drive human source and existing Standard Studio remain authoritative.

R02/R03 are not complete merely because this document or workflow exists.
