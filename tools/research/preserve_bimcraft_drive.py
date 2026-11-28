"""Transfer only the verified public-source artifact to the existing controlled Drive folder."""
import hashlib,json,os,pathlib,sys
from google.oauth2.service_account import Credentials
from google.auth.transport.requests import AuthorizedSession

FOLDER="16dbAQXelgymaCavzMjMrJXtDJ9zMze6B"
NAME="BIMcraft-79b603f-verified-source-and-receipt.zip"
EXPECTED="fdbceebc6e8a1b230b8ae49695fe23ab48677b81e73e79efb4f21b2a78cd8be9"
SIZE=403940981
BASE="https://www.googleapis.com/drive/v3"
p=pathlib.Path(sys.argv[1])
def digest(stream):
    h=hashlib.sha256()
    for chunk in iter(lambda:stream.read(8*1024*1024),b""):h.update(chunk)
    return h.hexdigest()
with p.open("rb") as f: assert digest(f)==EXPECTED and p.stat().st_size==SIZE
raw=os.environ.get("CAD_GOOGLE_SERVICE_ACCOUNT_JSON","")
if not raw: raise SystemExit("Drive transfer blocked: existing credential unavailable in this run.")
session=AuthorizedSession(Credentials.from_service_account_info(json.loads(raw),scopes=["https://www.googleapis.com/auth/drive"]))
def checked(r,stage):
    if not r.ok:
        try: error=r.json()["error"]; reasons=[x.get("reason") for x in error.get("errors",[])]
        except Exception: reasons=[]
        raise SystemExit(f"{stage}: HTTP {r.status_code}; reasons={reasons}")
    return r
folder=checked(session.get(f"{BASE}/files/{FOLDER}",params={"fields":"id,mimeType,driveId,capabilities(canAddChildren)","supportsAllDrives":"true"},timeout=45),"Folder permission").json()
if folder.get("mimeType")!="application/vnd.google-apps.folder" or not folder.get("capabilities",{}).get("canAddChildren"):
    raise SystemExit("Drive transfer blocked: existing identity cannot add children to registered folder.")
q=f"'{FOLDER}' in parents and name = '{NAME}' and trashed = false"
found=checked(session.get(f"{BASE}/files",params={"q":q,"fields":"files(id,size,sha256Checksum,parents),nextPageToken","supportsAllDrives":"true","includeItemsFromAllDrives":"true"},timeout=45),"Duplicate check").json()
items=found.get("files",[])
if found.get("nextPageToken") or len(items)>1:raise SystemExit("Ambiguous existing archive; no overwrite.")
if items:
    item=items[0]
    if item.get("sha256Checksum")!=EXPECTED or int(item.get("size",0))!=SIZE: raise SystemExit("Existing same-name file differs; no overwrite.")
else:
    r=checked(session.post("https://www.googleapis.com/upload/drive/v3/files",params={"uploadType":"resumable","supportsAllDrives":"true","fields":"id,size,sha256Checksum,parents"},json={"name":NAME,"parents":[FOLDER],"mimeType":"application/zip"},headers={"X-Upload-Content-Type":"application/zip","X-Upload-Content-Length":str(SIZE)},timeout=60),"Initiate Drive resumable upload")
    with p.open("rb") as f:
        item=checked(session.put(r.headers["Location"],data=f,headers={"Content-Type":"application/zip","Content-Length":str(SIZE)},timeout=900),"Upload verified archive").json()
meta=checked(session.get(f"{BASE}/files/{item['id']}",params={"fields":"id,size,sha256Checksum,parents","supportsAllDrives":"true"},timeout=60),"Metadata readback").json()
assert FOLDER in meta["parents"] and int(meta["size"])==SIZE and meta["sha256Checksum"]==EXPECTED
with checked(session.get(f"{BASE}/files/{item['id']}",params={"alt":"media","supportsAllDrives":"true"},stream=True,timeout=120),"Binary readback") as r:
    assert digest(r.raw)==EXPECTED
print(json.dumps({"status":"verified_permanent_drive_archive","drive_file_id":item["id"],"size":SIZE,"sha256":EXPECTED}))
