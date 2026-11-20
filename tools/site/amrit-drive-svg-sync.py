#!/usr/bin/env python3
"""Controlled native Google Doc SVG -> verified CAD model and immutable Git snapshots.
Use --source for offline validation. --google-doc requires service-account auth and shared Doc.
No permit, survey, structural or construction approval is implied by successful import.
"""
import argparse, hashlib, json, os, pathlib, re, sys
from xml.etree import ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROJECT = ROOT / 'public' / 'data' / 'projects' / '14-amrit-hardware-1'
NS = '{http://www.w3.org/2000/svg}'

def die(s):
    raise ValueError(s)

def polygon_area(points):
    return abs(sum(p[0]*points[(i+1)%len(points)][1]-points[(i+1)%len(points)][0]*p[1] for i,p in enumerate(points)))/2

def inside_polygon(p, pts):
    # inclusive polygon-edge check, local PDF units are mm
    x,y = p
    for a,b in zip(pts,pts[1:]+pts[:1]):
        u=b[0]-a[0];v=b[1]-a[1]
        cross=(x-a[0])*v-(y-a[1])*u
        if abs(cross)<.001 and min(a[0],b[0])-.001<=x<=max(a[0],b[0])+.001 and min(a[1],b[1])-.001<=y<=max(a[1],b[1])+.001:
            return True
    status=False
    for a,b in zip(pts,pts[1:]+pts[:1]):
        if (a[1]>y) != (b[1]>y):
            xx=(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]
            if x<xx: status=not status
    return status

def rects_overlap(a,b):
    return max(a[0],b[0]) < min(a[2],b[2])-0.01 and max(a[1],b[1]) < min(a[3],b[3])-0.01

def rect_vertices(a):
    return [[a[0],a[1]],[a[2],a[1]],[a[2],a[3]],[a[0],a[3]]]

def validate_svg(svg_text):
    if len(svg_text.encode())>250000: die('SVG source exceeds 250 KB source-code limit')
    if '<!DOCTYPE' in svg_text.upper() or '<!ENTITY' in svg_text.upper(): die('DTD/entities forbidden in SVG')
    try: root=ET.fromstring(svg_text)
    except ET.ParseError as e: die('SVG XML parse error: '+str(e))
    if root.tag!=NS+'svg':die('Root must be SVG')
    forbidden={'script','foreignObject','iframe','image','use','animate','set','animateTransform','animateMotion'}
    for el in root.iter():
        local=el.tag.split('}')[-1]
        if local in forbidden:die('Disallowed SVG element: '+local)
        for k,v in el.attrib.items():
            ak=k.split('}')[-1]
            if ak.lower().startswith('on'):die('SVG event handlers forbidden')
            if ak in ('href','src') and v and not v.startswith('#'):die('External SVG resources forbidden')
            if ak=='style' and re.search(r'url\s*\(\s*["\']?\s*(?:https?:|data:)',v,re.I):die('External style resource forbidden')
        if local=='style' and re.search(r'@import|url\s*\(\s*["\']?\s*(?:https?:|data:)',el.text or '',re.I):die('CSS imports/external resources forbidden')
    nodes=[el for el in root if el.tag==NS+'metadata' and el.attrib.get('id')=='jp-cad-model']
    if len(nodes)!=1:die('Exactly one jp-cad-model metadata block required')
    try: data=json.loads(nodes[0].text or '')
    except json.JSONDecodeError as e:die('Invalid JSON in SVG metadata: '+str(e))
    if data.get('schema')!='jp-cad://site-plot-boundary/2.0':die('Unsupported CAD model schema')
    if data.get('project',{}).get('plotNumber')!='150' or data.get('project',{}).get('slug')!='14-amrit-hardware-1':die('Wrong project/plot')
    g=data['geometry'];outer=g['outer']['vertices'];buildable=g['buildablePolygonMm'];front=g['frontOnlySetback']['polygonMm'];
    if not (len(outer)==len(buildable)==len(front)==4):die('Four-sided source footprint/setback required')
    baseline=json.loads((PROJECT/'plot-150-pdf-trace-v1.json').read_text())
    if outer!=baseline['geometry']['outer']['vertices'] or g['outer']['edgeLabels']!=baseline['geometry']['outer']['edgeLabels']:
        die('Source cadastral boundary changed; hold for separate survey-controlled admission')
    if g.get('georeferenced') is not False or g.get('surveyVerified') is not False:die('Unverified source claims survey approval')
    orientation=g.get('orientation',{})
    if any(orientation.get(k)!=v for k,v in {'leftBoundary':'NORTH','topBoundary':'EAST_REAR','rightBoundary':'SOUTH','bottomBoundary':'WEST_FRONT_ROAD'}.items()):die('Owner orientation record inconsistent')
    if orientation.get('geographicBearingVerified') is not False:die('Cannot claim verified survey bearing')
    if not all(p in front for p in outer[2:4]):die('Front-only setback must include both original road vertices')
    if not all(p in buildable for p in outer[:2]):die('Rear boundary changed or rear setback silently added')
    if polygon_area(outer)<100e6 or not(5e6<polygon_area(front)<40e6):die('Source-derived area out of expected review bounds')
    house=g['house'];r=house['rectMm'];zones=g['reservedUndergroundZones'];features=[house]+zones
    if house.get('constructionApproved') is not False or house.get('heightAndStoreysAssumed') is not True:die('House must remain concept only')
    if {x['id'] for x in zones}!={'UWT-01','ST-01','SP-01'}:die('All three distinct underground reservations required')
    for feature in features:
        r=feature['rectMm']
        if not(len(r)==4 and all(isinstance(z,(int,float)) for z in r) and r[2]>r[0] and r[3]>r[1]):die('Invalid rectangle')
        if not all(inside_polygon(p,buildable) for p in rect_vertices(r)):die(feature['id']+' outside front-only buildable area')
        if feature is not house and (feature.get('capacityL') is not None or feature.get('depthMm') is not None):die('Unverified tank capacity or depth asserted')
    for i,a in enumerate(features):
        for b in features[i+1:]:
            if rects_overlap(a['rectMm'],b['rectMm']):die(a['id']+' intersects '+b['id'])
    # SVG must carry actual layers, not only a JSON assertion
    ids={el.attrib.get('id') for el in root.iter()}
    for k in ['SITE_BOUNDARY','FRONT_WEST_SETBACK_ONLY','HOUSE_RECTANGULAR_CONCEPT','UWT-01','ST-01','SP-01']:
        if k not in ids:die('Missing SVG drawing layer '+k)
    if not any(k in svg_text for k in ['NORTH · LEFT','NORTH &#183; LEFT']):die('North label missing')
    return data

def google_doc_text():
    doc=os.getenv('CAD_PLOT150_GOOGLE_DOC_ID','').strip()
    raw=os.getenv('CAD_GOOGLE_SERVICE_ACCOUNT_JSON','').strip()
    if not (doc and raw):die('Set CAD_PLOT150_GOOGLE_DOC_ID and CAD_GOOGLE_SERVICE_ACCOUNT_JSON secrets. Source is NOT publicly readable.')
    try:
        import google.oauth2.service_account
        import google.auth.transport.requests
        import requests
    except ImportError:die('Install google-auth and requests for authenticated Docs fetch')
    info=json.loads(raw)
    cred=google.oauth2.service_account.Credentials.from_service_account_info(info,scopes=['https://www.googleapis.com/auth/documents.readonly'])
    session=google.auth.transport.requests.AuthorizedSession(cred)
    resp=session.get('https://docs.googleapis.com/v1/documents/'+doc,params={'includeTabsContent':'true'},timeout=40)
    if not resp.ok:die('Cannot read stable Google Doc with service account ('+str(resp.status_code)+'). Share Doc with service-account client_email.')
    resource=resp.json();tabs=resource.get('tabs') or []
    if len(tabs)!=1:die('Expected one SVG-code tab; tabs and rich embeds are not supported')
    body=tabs[0].get('documentTab',{}).get('body',{}).get('content',[])
    texts=[]
    for structure in body:
        if 'sectionBreak' in structure:continue
        para=structure.get('paragraph')
        if not para:die('Non-text Docs content is forbidden in SVG source')
        for el in para.get('elements',[]):
            t=el.get('textRun')
            if not t:die('Non-text element found in code source')
            texts.append(t['content'])
    raw=''.join(texts)
    return raw.rstrip('\n')+'\n'

def main():
    pa=argparse.ArgumentParser();pa.add_argument('--source',type=pathlib.Path);pa.add_argument('--google-doc',action='store_true');pa.add_argument('--write',action='store_true');args=pa.parse_args()
    if args.google_doc==bool(args.source):die('Choose exactly one of --source or --google-doc')
    code=google_doc_text() if args.google_doc else args.source.read_text(encoding='utf8')
    code=code.lstrip('\ufeff').rstrip('\n')+'\n'
    model=validate_svg(code)
    sha=hashlib.sha256(code.encode()).hexdigest();print('AMRIT_SVG_SOURCE_VERIFIED sha256='+sha+' bytes='+str(len(code.encode())))
    if not args.write:return
    PROJECT.mkdir(parents=True,exist_ok=True)
    (PROJECT/'plot-150-working.svg').write_text(code,encoding='utf8')
    # The current working file uses the exact metadata in the stable Google Doc.
    (PROJECT/'plot-150-working.json').write_text(json.dumps(model,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    snap=PROJECT/'snapshots';snap.mkdir(exist_ok=True)
    snapshotSvg=snap/(sha[:16]+'.svg')
    if snapshotSvg.exists() and snapshotSvg.read_bytes()!=code.encode():die('Immutable SVG snapshot hash collision/mutation')
    snapshotSvg.write_text(code,encoding='utf8')
    snapshotModel=snap/(sha[:16]+'.json');snapshotModel.write_text(json.dumps(model,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    provenance={'schema':'jp-cad://google-doc-svg-import/1','projectSlug':'14-amrit-hardware-1','sourceKind':'AUTHENTICATED_NATIVE_GOOGLE_DOC__STABLE_ID_IN_REPOSITORY_SECRET','sourceSha256':sha,'sourceBytes':len(code.encode()),'sourceRevisionSnapshot':sha[:16],'sourceSnapshotPath':str(snapshotSvg.relative_to(ROOT)),'originalPdfSha256':model['source']['sha256'],'surveyVerified':False,'constructionApproved':False,'publishPolicy':'GENERATE_REVIEW_PULL_REQUEST_ONLY__DO_NOT_BYPASS_MAIN_STAGING_QA'}
    (PROJECT/'plot-150-source-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
    print('AMRIT_DRIVE_SVG_PUBLISH_ARTIFACTS_READY '+str(snap))
if __name__=='__main__':
 try:main()
 except (ValueError,KeyError,TypeError,IOError) as ex:
    print('ERROR: '+str(ex),file=sys.stderr);sys.exit(2)
