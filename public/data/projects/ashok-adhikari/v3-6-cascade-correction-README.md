# Ashok Adhikari — v3.6 corrected cascade and AutoCAD exchange (17 November 2026)

## Abstract
The owner clarified that v3.5 incorrectly **stretched** front/middle rooms after grid row 4 moved 2 ft 6 in toward row 5. v3.6 is a new immutable architectural review edition. Grid rows 1, 2, 3, 4, connected walls, room contents, stairs, roof and provisional column markers move together rearward; row 5 remains. Intervening room depths are preserved, so the entire modeled front edge recedes 762 mm, increasing the front yard by 762 mm. v3.5 remains selectable as superseded review evidence. No engineering approval is implied.

## Source authority and dimensions
- Plot: 9,144 × 18,288 mm nominal (30 ft × 60 ft), NOT survey verified.
- Model-local footprint bounds after correction: X=0..7,200 mm; Y=762..14,400 mm; width 7,200, depth **13,638 mm**.
- Grid Z (world-coordinate mm from rear): **5=150, 4=4,238, 3=8,038, 2=11,438, 1=13,488**.
- Span 5–4 shrinks 762 mm; spans 4–3, 3–2 and 2–1 **remain unchanged** relative to the pre-error source.
- Plot setbacks: front **3,126 mm**, rear **1,524 mm**, left **1,817 mm**, right **127 mm**.
- Per-floor source-perimeter polygon area **87.05176 m²** (previous 92.3629 m²). This does NOT establish gross built-up or municipal area.
- Proposed GF right lounge window matches FF right lounge opening: 2,100 × 1,500 mm, sill 900 mm, center world Z=7,838 mm; FIRE/PRIVACY/MUNICIPAL and lintel engineering HOLD.

## Provenance / snapshot rules
- Prior v3.4 remains the pre-error reference for original room depths.
- v3.5 is preserved, with the mistaken room stretching visibly superseded.
- New source files: `aad-building-v3-6-review.json`, `aad-gf-model-v3-6-review.json`, `aad-ff-model-v3-6-review.json`, `coordinate-grid-v3-6-review.json`.
- `tools/site/ashok-cascade-engine.mjs` regenerates connected floor nodes, room envelopes and grid row controls from the pre-error source.
- `tools/site/ashok-cascade-regression-smoke.mjs` verifies source-to-target repeatability and unchanged intervening room sizes.
- `tools/site/export-ashok-v36-autocad.py` generates editable AutoCAD 2007 DXF (AC1021) from the current JSON, with the coordinates in millimetres and drawing labels in feet/inches.
- `ashok-v36-autocad-exchange.yml` builds and independently audits DXF as a GitHub Actions artifact. CAD files are also in the existing Rohini/Ashok Drive resource hierarchy.

## Client exchange
- [Unzipped editable AutoCAD folder](https://drive.google.com/drive/folders/1BOc4hFnoeZdZJwCeoJuoA6Vo_U2xpnq8)
- [Combined editable site, ground and first DXF](https://drive.google.com/file/d/1vTx5rjpel05iCLebBEi-0q6TbOm8ADcp/view)

## Important limits
Architectural review, **NOT FOR CONSTRUCTION**. A grid line or provisional column marker is NOT a designed RCC/ribbed beam. The export does not supply verified reinforcement, foundations, seismic support, sanctioned setback/window clearance, MEP services, real surveyed property lines or construction-issued levels. Only the relevant architectural model, code and AutoCAD interchange files were changed—no PDFs or PNGs.
