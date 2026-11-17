#!/usr/bin/env python3
"""Independent geometry and entity-count audit for Ashok v3.6 R2007 exchange.

This is NOT a native Autodesk AutoCAD test, licensed engineering review,
survey check, legal setback approval or IFC construction clearance.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import ezdxf

SOURCE_DIR = Path("public/data/projects/ashok-adhikari")
PLOT_MM = (9144, 18288)
BUILDING_SITE_BOUNDS = (1817, 3126, 9017, 16764)
SOURCE_WORLD_DEPTH_MM = 14400
ROWS_Z_MM = (150, 4238, 8038, 11438, 13488)
AXES_X_MM = (150, 3600, 7050)
FILES = {
    "GF": "Ashok_Adhikari_v3.6_GF_AutoCAD2007_Review.dxf",
    "FF": "Ashok_Adhikari_v3.6_FF_AutoCAD2007_Review.dxf",
    "SITE": "Ashok_Adhikari_v3.6_Site_30x60_AutoCAD2007_Review.dxf",
    "COMPLETE": "Ashok_Adhikari_v3.6_Complete_Site_GF_FF_AutoCAD2007.dxf",
}

def require(condition, message):
    if not condition:
        raise AssertionError(message)

def nearly(a, b):
    return abs(a - b) < 0.01

def poly_bounds(msp, layer):
    polygons = [e for e in msp.query("LWPOLYLINE") if e.dxf.layer == layer]
    require(len(polygons) == 1, f"{layer} needs one complete rectangular polyline; found {len(polygons)}")
    poly = polygons[0]
    require(poly.closed, f"{layer} must be closed")
    xy = [tuple(p[:2]) for p in poly.get_points()]
    require(len(xy) == 4, f"{layer}: four corners expected")
    return min(p[0] for p in xy), min(p[1] for p in xy), max(p[0] for p in xy), max(p[1] for p in xy)

def audit_file(path):
    require(path.exists() and path.stat().st_size > 1024, f"Missing/empty DXF {path.name}")
    doc = ezdxf.readfile(path)
    require(doc.dxfversion == "AC1021", f"{path.name}: not AutoCAD 2007 AC1021")
    require(doc.units == 4 and doc.header["$INSUNITS"] == 4, f"{path.name}: units not mm")
    errors = doc.audit().errors
    require(not errors, f"{path.name}: {len(errors)} DXF audit errors")
    msp = doc.modelspace()
    require(len(msp.query("DIMENSION")) >= 1, f"{path.name}: no native DIMENSION entities")
    return doc, msp

def audit_plot(msp):
    # The site sheet shows a bounding envelope, not the plan source perimeter.
    plot = poly_bounds(msp, "A-PLOT-BOUNDARY")
    building = poly_bounds(msp, "A-BUILDING-OUTLINE")
    require(all(nearly(a, b) for a, b in zip(plot, (3500, 0, 3500 + PLOT_MM[0], PLOT_MM[1]))),
            f"Site plot polyline incorrect: {plot}")
    expected = (3500 + BUILDING_SITE_BOUNDS[0], BUILDING_SITE_BOUNDS[1],
                3500 + BUILDING_SITE_BOUNDS[2], BUILDING_SITE_BOUNDS[3])
    require(all(nearly(a, b) for a, b in zip(building, expected)),
            f"Building envelope incorrect: {building}")
    require(nearly(building[2] - building[0], 7200), "Envelope width changed")
    require(nearly(building[3] - building[1], 13638), "Envelope depth changed")
    require(nearly(building[0]-plot[0], 1817) and nearly(plot[2]-building[2], 127), "Site side clearances changed")
    require(nearly(building[1]-plot[1], 3126) and nearly(plot[3]-building[3], 1524), "Site front/rear setbacks changed")
    return {"plot": plot, "envelope": building}

def audit_floor(msp, model, offset_x, label):
    graph = model["floorGraph"]
    axes = list(msp.query("LINE[layer=='A-GRID']"))
    require(len(axes) == 8, f"{label}: expected A-C + 1-5 grid lines, got {len(axes)}")
    vertical_x = sorted(round(e.dxf.start.x, 2) for e in axes
                        if nearly(e.dxf.start.x, e.dxf.end.x))
    horizontal_y = sorted(round(e.dxf.start.y, 2) for e in axes
                          if nearly(e.dxf.start.y, e.dxf.end.y))
    require(len(vertical_x) == 3 and len(horizontal_y) == 5, f"{label}: grid directions incorrect")
    expected_x = sorted(offset_x + n for n in AXES_X_MM)
    expected_y = sorted(SOURCE_WORLD_DEPTH_MM - z for z in ROWS_Z_MM)
    require(all(nearly(a,b) for a,b in zip(vertical_x, expected_x)), f"{label}: letter axes displaced: {vertical_x}")
    require(all(nearly(a,b) for a,b in zip(horizontal_y, expected_y)), f"{label}: number axes displaced: {horizontal_y}")
    require(len(msp.query("CIRCLE[layer=='A-AXIS-BUBBLES']")) == 8, f"{label}: axis circles missing")
    windows = sum(o["kind"] == "window" for o in graph["openings"])
    doors = sum(o["kind"] == "door" for o in graph["openings"])
    # The exporter draws three parallel window strokes and two door-jamb lines per
    # hosted opening; verify against model rather than guessing the expected count.
    require(len(msp.query("LINE[layer=='A-WINDOWS']")) == 3*windows,
            f"{label}: missing / duplicated window strokes")
    require(len(msp.query("LINE[layer=='A-DOORS']")) == 2*doors,
            f"{label}: missing / duplicated door jambs")
    require(any(e.dxf.layer == "A-REVISION-HOLDS" for e in msp.query("TEXT")),
            f"{label}: review/hold watermark missing")
    return {"windows": windows, "doors": doors, "grids": len(axes), "axisBubbles": 8}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder", type=Path, default=Path("out/ashok-v3-6-cad"))
    args = parser.parse_args()
    gf = json.loads((SOURCE_DIR / "aad-gf-model-v3-6-review.json").read_text())
    ff = json.loads((SOURCE_DIR / "aad-ff-model-v3-6-review.json").read_text())
    report = {}
    for key, name in FILES.items():
        _, msp = audit_file(args.folder / name)
        if key == "SITE":
            report[key] = audit_plot(msp)
        elif key in ("GF", "FF"):
            report[key] = audit_floor(msp, gf if key=="GF" else ff, 3000, key)
        else:
            # The combined exchange must include the current site, GF and FF,
            # with independent viewport offsets, not three coincident drawings.
            report[key] = {"site": audit_plot(msp)}
            # audit_plot uses standard 3500 offset in both site and combined.
            require(len(msp.query("LINE[layer=='A-GRID']")) == 16,
                    "COMPLETE: missing two full A-C/1-5 grids")
            require(len(msp.query("CIRCLE[layer=='A-AXIS-BUBBLES']")) == 16,
                    "COMPLETE: missing two independent axis-bubble sets")
            require(len(msp.query("LINE[layer=='A-WINDOWS']")) ==
                    3*sum(o["kind"] == "window" for model in [gf,ff] for o in model["floorGraph"]["openings"]),
                    "COMPLETE: one floor's windows are missing")
            require(len(msp.query("LINE[layer=='A-DOORS']")) ==
                    2*sum(o["kind"] == "door" for model in [gf,ff] for o in model["floorGraph"]["openings"]),
                    "COMPLETE: one floor's doors are missing")
    require(report["GF"]["windows"] > 0 and report["FF"]["windows"] > 0, "Windows are absent")
    require(report["GF"]["windows"] + report["GF"]["doors"] == 17, "GF openings count mismatch")
    require(report["FF"]["windows"] + report["FF"]["doors"] == 18, "FF openings count mismatch")
    print("ASHOK_V36_R2007_DXF_SEMANTIC_AUDIT_PASS", json.dumps(report, sort_keys=True))
    print("NATIVE_AUTODESK_APPLICATION_QA_NOT_PERFORMED")

if __name__ == "__main__":
    main()
