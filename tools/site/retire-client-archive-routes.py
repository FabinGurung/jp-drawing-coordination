"""Retire explicitly archived internal HTML pages from the published artifact only.
Original HTML is preserved in Git and the verified Drive archive R000001.
Do not remove drawings, geometry assets, approval boundaries or model dependencies.
"""
from pathlib import Path
import argparse, html, os
SLUGS = ("narayani-parajuli","ashok-adhikari","harisharan-adhikari","14-amrit-hardware-1","js-buddha-jewelers","ramachandra-devkota","example-empty")
ROUTES = {p: "projects/index.html" for p in ("memory-wall/index.html","memory-wall/level-1/index.html","memory-wall/pages/index.html","releases/index.html","knowledge-centre/index.html","source/index.html")}
ROUTES.update({f"projects/{s}/memory-wall/index.html": f"projects/{s}/index.html" for s in SLUGS})
ROUTES.update({f"projects/{s}/record.html": f"projects/{s}/index.html" for s in ("narayani-parajuli","ashok-adhikari","ramachandra-devkota")})
def retire(root):
    for src,dest in ROUTES.items():
        if not (root/src).is_file() or not (root/dest).is_file():
            raise SystemExit(f"Missing expected archive route or redirect destination: {src} -> {dest}")
    for src,dest in ROUTES.items():
        p=root/src
        url=html.escape(os.path.relpath(root/dest,p.parent).replace(os.sep,"/"),quote=True)
        p.write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url={url}"><title>JP Drawings</title></head><body><a href="{url}">Open drawings</a></body></html>\n',encoding="utf-8")
        assert p.stat().st_size < 500
    print(f"CAD_CLIENT_ARCHIVE_REDIRECT_PASS {len(ROUTES)} archived HTML routes; geometry unchanged")
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("root",type=Path);retire(p.parse_args().root)
