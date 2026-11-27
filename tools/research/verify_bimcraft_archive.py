#!/usr/bin/env python3
"""Research only: preserve pinned public source and verify each Git blob.
No upstream code is executed; no client files or credentials are used.
"""
import hashlib
import json
import pathlib
import stat
import sys
import urllib.request
import zipfile

PIN = "79b603f6683f2f000b9e8346c1fc92cf466ab01d"
TREE = "cfa7297e33e7c8762581dc586fc2c39fa91d94bb"
API = "https://api.github.com/repos/getcadcraft/bimcraft"
REQUIRED = {"LICENSE", "NOTICE", "THIRD_PARTY.md", "PROVENANCE.md",
            "TRADEMARKS.md", "BUILDING.md", "package.json"}
def fetch_json(url):
    with urllib.request.urlopen(url, timeout=120) as response:
        return json.load(response)

def verify(archive, expected):
    seen = set()
    with zipfile.ZipFile(archive) as z:
        for item in z.infolist():
            if item.is_dir():
                continue
            root, sep, name = item.filename.partition("/")
            if not sep or not root or not name or name in seen:
                raise ValueError("Invalid or duplicate archive entry: " + item.filename)
            if name not in expected:
                raise ValueError("Unexpected archive entry: " + name)
            row = expected[name]
            if item.file_size != row["size"]:
                raise ValueError("Size mismatch: " + name)
            h = hashlib.sha1()
            h.update(f"blob {item.file_size}\0".encode())
            with z.open(item) as stream:
                for data in iter(lambda: stream.read(1024 * 1024), b""):
                    h.update(data)
            if h.hexdigest() != row["sha"]:
                raise ValueError("Git blob hash mismatch: " + name)
            seen.add(name)
    if seen != set(expected):
        raise ValueError(f"Missing entries: {len(set(expected) - seen)}")
    if not REQUIRED <= seen:
        raise ValueError("Required licensing/build documents absent")
    return len(seen)

def main():
    archive, output = map(pathlib.Path, sys.argv[1:])
    commit = fetch_json(f"{API}/commits/{PIN}")
    if commit["sha"] != PIN or commit["commit"]["tree"]["sha"] != TREE:
        raise ValueError("Pinned commit or tree mismatch")
    tree = fetch_json(f"{API}/git/trees/{TREE}?recursive=1")
    if tree.get("truncated") or tree["sha"] != TREE:
        raise ValueError("Git tree incomplete or mismatched")
    if any(row["type"] not in {"blob", "tree"} for row in tree["tree"]):
        raise ValueError("Unsupported submodule or tree entry")
    expected = {row["path"]: row for row in tree["tree"] if row["type"] == "blob"}
    count = verify(archive, expected)
    with archive.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    output.write_text(json.dumps({"source_commit": PIN, "source_tree": TREE,
        "verified_git_blobs": count, "archive_bytes": archive.stat().st_size,
        "archive_sha256": digest, "license_documents": sorted(REQUIRED),
        "scope": "public source preservation only; not runtime or engineering validation"},
        indent=2) + "\n")
    print(output.read_text())

if __name__ == "__main__":
    main()
