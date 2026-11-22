#!/usr/bin/env python3
"""A7/A9 Plot 150 v005: verified native Google Docs SVG + Three.js to reviewed Git snapshots.
No direct GitHub Pages mutation; never publish Google credentials. This is a source reviewer,
not an architectural, structural, cadastral or sanitation approval system.
"""
import argparse,hashlib,json,os,pathlib,re,sys
from xml.etree import ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[2]
PROJECT=ROOT/'public/data/projects/14-amrit-hardware-1'
SVGNS='{http://www.w3.org/2000/svg}'
V5='AAD-14-AMRIT-P150-V005'
def die(text):raise ValueError(text)
def inside(p,poly):
 x,y=p
 for a,b in zip(poly,poly[1:]+poly[:1]):
  dx,dy=b[0]-a[0],b[1]-a[1]
  if abs((x-a[0])*dy-(y-a[1])*dx)<.005 and min(a[0],b[0])-.005<=x<=max(a[0],b[0])+.005 and min(a[1],b[1])-.005<=y<=max(a[1],b[1])+.005:return True
 state=False
 for a,b in zip(poly,poly[1:]+poly[:1]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:state=not state
 return state
def validate_svg(source):
 if len(source.encode('utf8'))>250000:die('SVG exceeds safe size')
 if '<!DOCTYPE' in source.upper() or '<!ENTITY' in source.upper():die('SVG entities forbidden')
 try:svg=ET.fromstring(source)
 except ET.ParseError as e:die('Invalid SVG: '+str(e))
 if svg.tag!=SVGNS+'svg':die('Root must be SVG')
 for elem in svg.iter():
  name=elem.tag.rsplit('}',1)[-1]
  if name in {'script','foreignObject','iframe','image','use','animate','set','animateTransform','animateMotion'}:die('Unsafe SVG element '+name)
  if name=='style' and re.search(r'url\s*\(|@import',elem.text or '',re.I):die('CSS external resource forbidden')
  for k,v in elem.attrib.items():
   attr=k.rsplit('}',1)[-1]
   if attr.lower().startswith('on') or (attr in {'href','src'} and not v.startswith('#')):die('SVG event/external resource forbidden')
 nodes=[el for el in svg if el.tag==SVGNS+'metadata' and el.attrib.get('id')=='jp-cad-model']
 if len(nodes)!=1:die('Exactly one canonical JSON metadata node required')
 try:model=json.loads(nodes[0].text or '')
 except Exception as e:die('Metadata must be JSON '+str(e))
 if model.get('schema')!='jp-cad://site-plot-boundary/2.0' or model.get('project',{}).get('slug')!='14-amrit-hardware-1' or model.get('project',{}).get('plotNumber')!='150':die('Wrong source model')
 if model.get('edition',{}).get('enumeration')!=V5:die('Wrong edition: please produce reviewed next-version migration')
 if model.get('display',{}).get('palette')!=['#000000','#ffffff'] or model.get('display',{}).get('dimensionUnits')!='feet-inches' or model.get('display',{}).get('areaUnits')!='sq ft':die('V005 monochrome/imperial contract invalid')
 g=model['geometry'];baseline=json.loads((PROJECT/'plot-150-pdf-trace-v1.json').read_text())
 if g['outer']['vertices']!=baseline['geometry']['outer']['vertices'] or g['outer']['edgeLabels']!=baseline['geometry']['outer']['edgeLabels']:die('Original plot dimensions must not change')
 if g.get('georeferenced') is not False or g.get('surveyVerified') is not False:die('Unsupported survey claim')
 if g.get('reservedUndergroundZones')!=[]:die('v005 forbids water/septic/soak reservations')
 if {x['id'] for x in g['house']['plan']['rooms']}!={'LIVING','KITCHEN','STAIRS','PASSAGE','REARHALL','BED-01','BED-02','BATH-01'}:die('Required room set differs from approved concept')
 house=g['house'];plan=house['plan'];frame=plan['frameMm']
 if house['widthMm']!=6300 or house['depthMm']!=10100 or abs(house['floorAreaSqm']-63.63)>.001:die('Concept dimensions inconsistent')
 if len(plan['wallSegments'])!=20 or len(plan['doorOpenings'])!=8:die('Room-to-3D walls/doors differ')
 if not all(inside(p,g['outer']['vertices']) and inside(p,g['buildablePolygonMm']) for p in house['polygonMm']):die('House must be inside original lot and behind front line')
 bath=next(x for x in plan['rooms'] if x['id']=='BATH-01')
 if bath.get('containedIn')!='BED-01':die('Attached bath room relationship invalid')
 ids={e.attrib.get('id') for e in svg.iter()}
 for key in ['SITE_BOUNDARY','FRONT_WEST_SETBACK_ONLY','HOUSE_RECTANGULAR_CONCEPT','STAIR_FLIGHT_GRAPHIC','ROOM_FOOTPRINTS','BATH-01','BED-01','BED-02','LIVING','KITCHEN','STAIRS']:
  if key not in ids:die('Missing 2D SVG room/wall layer '+key)
 for key in ['UWT-01','ST-01','SP-01']:
  if key in ids:die('Underground service still shown in v005')
 visible=source.split('</metadata>')[-1]
 if re.search(r'\d+(?:\.\d+)?\s*m²|\d+(?:\.\d+)?\s*m(?![a-z])',visible):die('Metric dimensions leaked into public drawing')
 for token in re.findall(r'#[0-9a-fA-F]{3,8}\b',source):
  if token.lower() not in ('#000000','#ffffff'):die('Non-monochrome SVG color '+token)
 return model
def validate_three(code):
 if len(code.encode('utf8'))>120000:die('Three source too large')
 for expect in ["from 'three'","from 'three/addons/controls/OrbitControls.js'",'export function mountPlot150Three','plan.wallSegments','plan.rooms','AAD-14-AMRIT-P150-V005']:
  if expect not in code:die('Invalid Three.js source: '+expect)
 if re.search(r'\b(?:eval|new Function|XMLHttpRequest|fetch\s*\(|import\s*\(\s*["\']https?://)\b',code):die('Unexpected remote or dynamic execution in Three source')
 for token in re.findall(r'#[0-9a-fA-F]{3,8}\b',code):
  if token.lower() not in ('#000000','#ffffff'):die('Non-monochrome Three.js source '+token)
 return True
def google_doc_text(doc_env):
 doc=os.getenv(doc_env,'').strip();credentials=os.getenv('CAD_GOOGLE_SERVICE_ACCOUNT_JSON','').strip()
 if not (doc and credentials):die('Authenticated Google Docs secrets missing: '+doc_env)
 try:
  import google.oauth2.service_account,google.auth.transport.requests
 except ImportError:die('Install google-auth and requests')
 info=json.loads(credentials)
 cred=google.oauth2.service_account.Credentials.from_service_account_info(info,scopes=['https://www.googleapis.com/auth/documents.readonly'])
 session=google.auth.transport.requests.AuthorizedSession(cred)
 response=session.get('https://docs.googleapis.com/v1/documents/'+doc,params={'includeTabsContent':'true'},timeout=40)
 if not response.ok:die('Cannot read private Google Doc '+doc_env+' status '+str(response.status_code))
 tabs=response.json().get('tabs') or []
 if len(tabs)!=1:die('One code tab per permanent source doc required')
 text=[]
 for row in tabs[0]['documentTab']['body']['content']:
  if 'sectionBreak' in row:continue
  if 'paragraph' not in row:die('Only literal code text allowed in source doc')
  for element in row['paragraph'].get('elements',[]):
   if 'textRun' not in element:die('Non-text element in source code')
   text.append(element['textRun']['content'])
 return ''.join(text).lstrip('\ufeff').rstrip('\n')+'\n'
def main():
 p=argparse.ArgumentParser();g=p.add_mutually_exclusive_group(required=True)
 g.add_argument('--source',type=pathlib.Path);g.add_argument('--google-doc',action='store_true');g.add_argument('--threejs-google-doc',action='store_true');p.add_argument('--write',action='store_true');args=p.parse_args()
 if args.threejs_google_doc:
  code=google_doc_text('CAD_PLOT150_THREEJS_DOC_ID');validate_three(code)
  sha=hashlib.sha256(code.encode()).hexdigest();print('PLOT150_V005_THREEJS_SOURCE_VERIFIED sha256='+sha)
  if args.write:
   dst=ROOT/'src/plot150-three.mjs';dst.parent.mkdir(exist_ok=True);dst.write_text(code)
   snap=PROJECT/'snapshots';snap.mkdir(exist_ok=True);file=snap/('threejs-'+sha[:16]+'.mjs')
   if file.exists() and file.read_text()!=code:die('Immutable Three.js snapshot was changed')
   file.write_text(code)
   prov=PROJECT/'plot-150-source-provenance.json'
   data=json.loads(prov.read_text()) if prov.exists() else {}
   data['threeJsSourceSha256']=sha;data['threeJsSnapshotPath']=str(file.relative_to(ROOT))
   prov.write_text(json.dumps(data,indent=2)+'\n')
  return
 code=google_doc_text('CAD_PLOT150_GOOGLE_DOC_ID') if args.google_doc else args.source.read_text(encoding='utf8')
 code=code.lstrip('\ufeff').rstrip('\n')+'\n';model=validate_svg(code)
 sha=hashlib.sha256(code.encode('utf8')).hexdigest();print('AMRIT_SVG_SOURCE_VERIFIED sha256='+sha+' bytes='+str(len(code.encode())))
 if not args.write:return
 PROJECT.mkdir(parents=True,exist_ok=True)
 (PROJECT/'plot-150-working.svg').write_text(code,encoding='utf8')
 (PROJECT/'plot-150-working.json').write_text(json.dumps(model,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 snapshots=PROJECT/'snapshots';snapshots.mkdir(exist_ok=True)
 snapshot=snapshots/(sha[:16]+'.svg')
 if snapshot.exists() and snapshot.read_bytes()!=code.encode():die('Immutable SVG hash collision')
 snapshot.write_text(code,encoding='utf8')
 (snapshots/(sha[:16]+'.json')).write_text(json.dumps(model,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 prov_file=PROJECT/'plot-150-source-provenance.json'
 prior=json.loads(prov_file.read_text()) if prov_file.exists() else {}
 jssource=ROOT/'src/plot150-three.mjs'
 threehash=hashlib.sha256(jssource.read_bytes()).hexdigest() if jssource.exists() else prior.get('threeJsSourceSha256')
 prior.update({'schema':'jp-cad://google-doc-svg-import/2','projectSlug':'14-amrit-hardware-1','sourceKind':'AUTHENTICATED_NATIVE_GOOGLE_DOC__STABLE_ID_IN_REPOSITORY_SECRET','sourceSha256':sha,'sourceBytes':len(code.encode()),'sourceRevisionSnapshot':sha[:16],'sourceSnapshotPath':str(snapshot.relative_to(ROOT)),'originalPdfSha256':model['source']['sha256'],'surveyVerified':False,'constructionApproved':False,'aadEdition':model['edition']['enumeration'],'previousEdition':model['edition']['predecessor'],'threeJsSourceSha256':threehash,'publishPolicy':'REVIEW_PULL_REQUEST_ONLY_DO_NOT_BYPASS_MAIN_STAGING_QA'})
 prov_file.write_text(json.dumps(prior,indent=2)+'\n')
if __name__=='__main__':
 try:main()
 except (ValueError,KeyError,TypeError,IOError) as e:
  print('ERROR: '+str(e),file=sys.stderr);sys.exit(2)
