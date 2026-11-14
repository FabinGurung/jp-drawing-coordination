# Harisharan below-plinth source-kernel SVG review candidate

This directory has **115 editable monochrome SVG sheets** with one source-linked physical-member ID per sheet: 27 PB, 12 ST, 18 COL, 18 PAD, 18 PCC, 18 DOWEL and four unlocated HOLD studies.

**Critical provenance:** These were reconstructed deterministically on 2026-11-14 from the existing CAD `takeoff.json` and the source-linked node/beam scheme. They are **not byte-for-byte recoveries** of the previous conversation's `Harisharan_Below_Plinth_SVG_R000001.zip`. Do not substitute the files for that original ZIP's manifest in Drive. The SHA-256 manifest here attests *only this reconstruction*.

All drawings are **ENGINEERING HOLD — NOT FOR CONSTRUCTION**. The 18 source grid marks include provisional coordinates, especially vector-scaled row 4/5 candidates. Native takeoff `z` is horizontal plan northing; the sheets use `x,y` plan millimetres and separate vertical `z` elevations referenced to DGL=0. Vertical levels are source interpretations, not surveyed field levels.

Bar schedules are illustrative theoretical families, never fabrication-ready BBS. Sloped footing geometry, columns' competing ties, lap/anchorage, junctions, soil assumptions and 16000 L tank redesign remain unresolved. No source originals, existing releases, project models or signed schedules were modified.

View `index.html` for search/preview; `registry.json` for structured member metadata; `DRAWING_INDEX.csv` for the human-friendly register; `manifest.json` for SHA-256 verification. CI runs `tools/site/harisharan-svg-index-smoke.mjs` via the existing Harisharan material acceptance test.
