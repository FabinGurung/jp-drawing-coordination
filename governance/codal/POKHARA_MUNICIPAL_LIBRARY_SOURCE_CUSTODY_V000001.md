# Pokhara municipal codal source custody — V000001
Date: 2026-11-17. Scope: **metadata and source routes**, not validated CAD approval.

## Ownership and exact Google Drive tree

```
05_AEC_Knowledge/
└── 01_AEC_Control_Library/
    └── 02_LOCAL_BYLAWS/                             [CANONICAL CROSS-PROJECT CODAL HOME]
        ├── 00_LOCAL_BYLAW_JURISDICTION_RULE.md        [existing]
        ├── 00_local_bylaw_overlay_template.json       [existing; not permit-ready]
        └── 01_POKHARA_METROPOLITAN_CITY/
            ├── POKHARA_CODAL_LIBRARY — Source & Amendment Index — V000001 [new Google Doc]
            ├── 00_OFFICIAL_SOURCE/
            │   ├── POKHARA_OFFICIAL_SOURCE_REGISTER_v0.1.json [unchanged]
            │   └── OFFICIAL__POKHARA_BUILDING_INFRA_2080_FIRST_AMENDMENT_2081__139P.pdf
            ├── 01_EXTRACTED_CONSTRAINTS_PENDING_VERIFICATION/
            │   └── POKHARA_2080_2081 — English ROW and Setback Reading Guide — V000001 DRAFT
            └── 02_MACHINE_DATA_DRAFT__NOT_PERMIT_APPROVED/
                ├── POKHARA_2080_2081_SOURCE_MANIFEST_V000001.json
                ├── POKHARA_2080_2081_139P_RAW_TEXT_EVIDENCE_V000001.jsonl
                ├── POKHARA_2080_2081_CLAUSES_V000001.jsonl
                ├── POKHARA_2080_2081_CLAUSE_REGISTER_V000001.json
                └── POKHARA_2080_2081_CODAL_QA_REPORT_V000001.txt
```

[Source-index Google Doc](https://docs.google.com/document/d/17FlIn4nd3_2ejsftRcm1_tGmZkUmpZj8LM2u7--UmvQ/edit) · [English reading guide](https://docs.google.com/document/d/1aX9D6O8C1ai-bUY5Vaqsie6CCdpnCUDBpPx5R2gGJao/edit) · [Official original uploaded PDF](https://drive.google.com/file/d/1VVklkANVN8a37AR-jiT_e2CXyFyCW-Bc/view) · [Full machine folder](https://drive.google.com/drive/folders/1BKLwVgyaiamTOf50-0asj2Q7DeVHqec9).

## Source evidence

- User-supplied Pokhara 2080 standards (first amendment 2081): **139 pages**, exact SHA-256 `f8f25a43f15ae55574c4f01a2dbb1704df523803532da66d1019d4e4587cb731`.
- Section **19** setback begins PDF page **29** / printed **28**.
- Section **20** road/right-of-way begins PDF page **31** / printed **30**.
- Source glyph layer is legacy-encoded, **not a verified Unicode transcription**. 139/139 page records are raw extraction, **not 139 reviewed clauses**.
- 44 proposed machine records include 12 road-class values, 12 neighbor-height bands × 2 classes, front setback and procedural navigation; only source tables p29 and p31 have been visually checked.
- The 2083 third amendment was officially listed on 2026-10-14, but its PDF clauses have **not been reconciled**; zero numeric municipal rules are activated as current code.
- The 2080 original was identified from an external mirror; official binary is not archived or authenticated in this run.

## Application boundary

The CAD/AAD code library [`public/codes/pokhara/`](../../public/codes/pokhara/index.html) is a **read-only consumer** of source references. Do not change current project geometry or issue IFC/permit approval from this draft. The project's municipality, ward, road authority/class, cadastral width, centreline, boundary, building use and height must be verified, and current amendments resolved.

The unrelated research/thesis repository holds manuscripts and research, not the canonical municipal codes. The Field & Desk Resource Library can discover the Drive source index; it need not duplicate the official PDF. A7 routes the system registry and historical version policy.

No existing Drive original was moved or deleted; original legacy standards remain in the separate historical [Building Bylaws and Mapdanda](https://drive.google.com/drive/folders/1PjWo8K6qJxUXK9M1Il4HGOOr0eO_B9PT) folder.

## A7 release gate

`RESOLVE → SCOPE → CHANGE → VERIFY → HAND OFF`:
Source SHA, page and clause ID are required for every machine fact; initial status `HOLD_PENDING_2083_RECONCILIATION_AND_SITE_AUTHORITY`. Any change to law, source edition, exception, or project geometry requires a reviewed new release, exact QA and separate engineering authorization.
