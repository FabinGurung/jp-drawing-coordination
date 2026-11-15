#!/usr/bin/env python3
"""Harisharan source-linked footing review drawings; never approved site cutting orders.
Run from CAD repository root (python3 tools/site/harisharan_footing_working_drawings.py).
Generated files use only public/data/projects/harisharan-adhikari/takeoff.json.
"""
from __future__ import annotations
import math, json, pathlib, hashlib, html, csv, zipfile

ROOT=pathlib.Path(__file__).resolve().parent
# Portable: in CAD repo under tools/site; local run can use --source override.
import argparse
ap=argparse.ArgumentParser()
ap.add_argument('--source',default=None)
ap.add_argument('--out',default=None)
args=ap.parse_args()
source=pathlib.Path(args.source) if args.source else ROOT.parents[1]/'public/data/projects/harisharan-adhikari/takeoff.json'
out=pathlib.Path(args.out) if args.out else ROOT.parents[1]/'public/projects/harisharan-adhikari/working-drawings/footings'
out.mkdir(parents=True,exist_ok=True)
d=json.loads(source.read_text()); assert d['logicalId']=='INTAKE-20260826-HARISHARAN';assert len(d['rows'])==6
bar_d=16; cover_mm=round(d['defaults']['footCover']*1000); spacing=150; mats=d['defaults']['footingMats']; footing_depth=round(d['dimensions']['footingDepth']*1000)
assert cover_mm==50 and mats==2 and footing_depth==600
h=html.escape
navy='#182b44'; subtle='#677a89'; line='#b5c7d0'; teal='#007c88'; coral='#d85e4b'; magenta='#9b4f9d'; cobalt='#1965b8'; paper='#f8fafb'

def fmt(v):return f'{v:,}'
def tx(x,y,s,size=16,fill=navy,weight='500',anchor='start',extra=''):
 return f'<text x="{x}" y="{y}" font-family="Arial,Helvetica,sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" {extra}>{h(str(s))}</text>'
def rect(x,y,w,h,fill='white',stroke=line,r=10,sw=1.4):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def ln(x1,y1,x2,y2,stroke=line,sw=1.5,dash=None):return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" '+(f'stroke-dasharray="{dash}" ' if dash else '')+'/>'
def page(w,hh,children):return f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{hh}" viewBox="0 0 {w} {hh}" role="img">\n<rect width="{w}" height="{hh}" fill="{paper}"/>\n'+''.join(children)+'\n</svg>\n'

def bar_schedule(length_mm,breadth_mm):
 # Bars run along X & Y and their quantity is set by the orthogonal dimension.
 def set_for(run_len,across):
  # first/last steel centerlines cover + phi/2 from concrete face.
  avail=across-2*(cover_mm+bar_d/2)
  n=math.ceil(avail/spacing)+1
  pitch=avail/(n-1)
  cut=run_len-2*cover_mm  # theoretical straight cut with clear cover at both ends; no bends/anchorage
  return {'each_mat':n,'each_layer_pitch':pitch,'per_footing':n*mats,'straight_mm':cut,'mass':n*mats*cut/1000*(bar_d**2/162)}
 return set_for(length_mm,breadth_mm),set_for(breadth_mm,length_mm)

nodes=[]
for row in d['rows']:
  yy=round(row['z']*1000)
  for axis,x,typ,orient in [('A',0,'F2','left'),('B',round(d['dimensions']['leftBay']*1000),'F1','center'),(row['rightGrid'],round((d['dimensions']['leftBay']+row['rightBay'])*1000),'F2','right')]:
   # SOURCE: F1 square 2550; F2 2700 x 2100; F2 eccentric placement subject to source plot verification.
   l,w=(2550,2550) if typ=='F1' else (2700,2100)
   nodes.append({'id':f'{axis}{row["row"]}','axis':axis,'row':row['row'],'x':x,'y':yy,'type':typ,'length':l,'width':w,'orient':orient,'basis':row['basis']})
assert len(nodes)==18 and sum(n['type']=='F1' for n in nodes)==6

# OVERVIEW — pale colored concrete footprints / central grid markers; cell views scaled using source takeoff dimensions.
p=[rect(42,30,1516,1040,'white',line,15),rect(65,52,1470,72,'#eaf1f5','#eaf1f5'),tx(83,97,'HARISHARAN ADHIKARI  |  FOOTING LOCATION PLAN',32,navy,'700'),tx(83,149,'18 FOOTINGS  •  PROJECT SETTING-OUT REVIEW  •  ALL DIMENSIONS IN mm',17,subtle,'600'),rect(65,173,930,815,'#ffffff',line,12),rect(1021,173,514,815,'#f7fafc',line,12)]
sc=.024
# y increases down on paper; north positive at top
X=lambda x: 370+sc*x
Y=lambda y: 850-sc*y
# main level axes
p.append(tx(92,206,'GRID  ·  6 ROWS × 3 SUPPORTED FOOTING POSITIONS',16,navy,'700'))
for row in d['rows']:
 yy=round(row['z']*1000); y=Y(yy)
 p.append(ln(168,y,800,y,'#c7d4db',1,'6 5'))
 p.append(f'<circle cx="142" cy="{y}" r="21" fill="white" stroke="{navy}" stroke-width="1.7"/>')
 p.append(tx(142,y+6,row['row'],18,navy,'700','middle'))
 if row['row']<6:
  mid=(y+Y(yy+5000))/2
  p.append(tx(95,mid+5,'5,000',14,subtle,'600','middle'))
  p.append(ln(119,y,119,Y(yy+5000),'#7f93a1',1.1))
for axis,x in [('A',0),('B',5722)]:
 p.append(ln(X(x),220,X(x),907,'#c7d4db',1,'6 5'))
 p.append(f'<circle cx="{X(x)}" cy="921" r="20" fill="white" stroke="{navy}" stroke-width="1.7"/>')
 p.append(tx(X(x),927,axis,17,navy,'700','middle'))
# right grid varies by row: line segments rather than fictitious continuous C–F grid
for row in d['rows']:
 xx=round((d['dimensions']['leftBay']+row['rightBay'])*1000);yy=round(row['z']*1000)
 p.append(tx(X(xx)+75,Y(yy)+6,row['rightGrid']+str(row['row']),14,subtle,'600'))
for n in nodes:
 l,w=n['length'],n['width']
 # All rectangles are type symbols centred on source grid; F2 real eccentric offsets are not admitted.
 off=0
 px=X(n['x']+off-l/2);py=Y(n['y']+w/2)
 ww=l*sc;hh=w*sc
 color=teal if n['type']=='F1' else coral
 p.append(rect(round(px,2),round(py,2),round(ww,2),round(hh,2),('#d6f0ef' if n['type']=='F1' else '#ffded9'),color,4,2.5))
 p.append(ln(X(n['x'])-4,Y(n['y']),X(n['x'])+4,Y(n['y']),navy,1.2))
 p.append(ln(X(n['x']),Y(n['y'])-4,X(n['x']),Y(n['y'])+4,navy,1.2))
 p.append(tx(X(n['x']+off),Y(n['y'])-9,n['id'],13,navy,'700','middle'))
 p.append(tx(X(n['x']+off),Y(n['y'])+18,n['type'],11,color,'700','middle'))
p.extend([tx(175,969,'SOURCE COORDINATE GRID — DO NOT USE FOOTPRINT EDGES FOR SITE SETTING-OUT',12,subtle,'600'),
 tx(1043,220,'FOOTING SCHEDULE',21,navy,'700'),rect(1043,247,470,94,'#e2f3f3',teal),tx(1062,278,'F1  ·  CENTRAL / ISOLATED',18,teal,'700'),tx(1062,310,'6 × 2,550 × 2,550 × 600',19,navy,'600'),rect(1043,357,470,94,'#ffede7',coral),tx(1062,388,'F2  ·  PERIMETER / ECCENTRIC',18,coral,'700'),tx(1062,421,'12 × 2,700 × 2,100 × 600',19,navy,'600'),tx(1043,486,'REINFORCEMENT (SOURCE SCHEDULE)',17,navy,'700'),tx(1043,518,'Ø16 @ 150 c/c, both directions',17,navy),tx(1043,548,'Top and bottom — subject to section review',15,subtle),tx(1043,588,'Nominal footing cover: 50 mm',16,navy),tx(1043,617,'Column footprint: 450 × 450 mm',16,navy),tx(1043,655,'DRAWING LIMITS',17,navy,'700'),tx(1043,684,'F1/F2 types and row labels follow STR-01.',14,subtle),tx(1043,707,'Middle/right bay values vary near rows 4–6.',14,subtle),tx(1043,730,'F2 eccentric footprint offset is indicative;',14,subtle),tx(1043,753,'confirm source orientation and edge offsets.',14,subtle),tx(1043,785,'Slope, edge thickness and BBS still require',14,subtle),tx(1043,808,'approval by the responsible structural engineer.',14,subtle),rect(1043,851,470,100,'#fff4e8','#e6b98f'),tx(1059,881,'FOR ENGINEERING REVIEW ONLY',17,'#935624','700'),tx(1059,908,'NOT FOR CONSTRUCTION / CUTTING',17,'#935624','700'),tx(1059,935,'STR-01 / STR-02 · 15 Nov 2026 · Rev FD-01',12,subtle)])
overview=out/'HAR-FD-00_FOOTING_OVERVIEW.svg';overview.write_text(page(1600,1100,p),encoding='utf-8')

files=[];totals={}
for n in nodes:
 id=n['id'];ft=n['type'];l=n['length'];w=n['width'];color=teal if ft=='F1' else coral
 xbar,ybar=bar_schedule(l,w)
 # page view
 q=[rect(35,28,1530,1078,'white',line,14),rect(55,44,1490,76,'#eaf1f5','#eaf1f5'),tx(78,89,f'HARISHARAN  /  FOOTING {id}  /  {ft}',30,navy,'700'),tx(79,148,f'FOUNDATION REINFORCEMENT   |   {fmt(l)} × {fmt(w)} × 600 mm   |   Ø16 @ ≤150 mm c/c',17,subtle,'600')]
 q.append(rect(55,168,719,420,'white',line));q.append(rect(792,168,751,420,'white',line))
 q.append(tx(76,200,'01  BOTTOM-MAT REINFORCEMENT PLAN',18,navy,'700'))
 q.append(tx(814,200,'02  TOP-MAT REINFORCEMENT PLAN',18,navy,'700'))
 # top and bottom mesh plan, scaled geometrically
 def mesh_plan(leftx, topy, panelW, show_top):
  scale=min(0.125,565/l,300/w)
  W=l*scale;H=w*scale
  cx=leftx+panelW/2;cy=topy+170
  x0=cx-W/2;y0=cy-H/2
  q.append(rect(round(x0,2),round(y0,2),round(W,2),round(H,2),'#f6f9fa',color,3,3))
  q.append(rect(round(x0+cover_mm*scale,2),round(y0+cover_mm*scale,2),round(W-2*cover_mm*scale,2),round(H-2*cover_mm*scale,2),'none','#9ab1c0',0,1.4))
  # X runs horizontally, count across width, bar centre cover+half-dia
  for k in range(xbar['each_mat']):
   yy=y0+(cover_mm+bar_d/2+k*xbar['each_layer_pitch'])*scale
   q.append(ln(x0+cover_mm*scale,round(yy,2),x0+W-cover_mm*scale,round(yy,2),cobalt if not show_top else '#4385cb',1.9))
  for k in range(ybar['each_mat']):
   xx=x0+(cover_mm+bar_d/2+k*ybar['each_layer_pitch'])*scale
   q.append(ln(round(xx,2),y0+cover_mm*scale,round(xx,2),y0+H-cover_mm*scale,magenta if not show_top else '#b264b8',1.7))
  # Central F1 column symbol only. F2 eccentric column coordinate is unverified: DO NOT invent.
  if ft=='F1':
   colx=cx
   q.append(rect(round(colx-225*scale,2),round(cy-225*scale,2),450*scale,450*scale,'#fdf5d6','#a98129',1,2.2))
   q.append(ln(colx-12,cy,colx+12,cy,navy,1.4));q.append(ln(colx,cy-12,colx,cy+12,navy,1.4))
  # Overall plan dimensions. Place labels BELOW arrow line to avoid overlaps.
  dimY=y0+H+14
  q.append(ln(x0,y0+H,x0,dimY+6,'#607888',1.1))
  q.append(ln(x0+W,y0+H,x0+W,dimY+6,'#607888',1.1))
  q.append(ln(x0,dimY,x0+W,dimY,'#607888',1.15))
  q.append(f'<path d="M{x0+6} {dimY-4} L{x0} {dimY} L{x0+6} {dimY+4} M{x0+W-6} {dimY-4} L{x0+W} {dimY} L{x0+W-6} {dimY+4}" stroke="#607888" fill="none"/>')
  # Separate technical labels from dimension arrow. Never cross dimension lines.
  q.append(tx(cx,topy+362,fmt(l)+' overall  •  X-direction bars',13,subtle,'600','middle'))
  q.append(tx(cx,topy+382,(fmt(w)+' overall  •  Y-direction bars' if ft=='F1' else 'Y: '+fmt(w)+' overall  •  eccentric column set-out HOLD'),13,subtle,'600','middle'))
 mesh_plan(55,190,719,False);mesh_plan(792,190,751,True)
 # sections
 q.append(rect(55,606,719,246,'#ffffff',line));q.append(rect(792,606,751,246,'#ffffff',line))
 q.append(tx(75,636,'03  LONGITUDINAL SECTION  X–X',17,navy,'700'))
 q.append(tx(812,636,'04  TRANSVERSE SECTION  Y–Y',17,navy,'700'))
 def section(leftx,top,boxW,span,secname):
  ss=min(0.178,(boxW-154)/span)
  sw=span*ss; sh=600*0.195
  cx=leftx+boxW/2; y0=top+32;x0=cx-sw/2
  q.append(rect(round(x0,2),round(y0,2),round(sw,2),round(sh,2),'#f2f6f7',color,1,2))
  # approximate top/bottom projected cross-bar layers
  for z in [50,66,534,550]:
   yy=y0+z*0.195
   q.append(ln(x0+8,round(yy,2),x0+sw-8,round(yy,2),cobalt if z in [50,550] else magenta,2.2,('4 4' if z in [66,534] else None)))
  q.append(ln(x0-22,y0,x0-22,y0+sh,'#607888',1.2))
  q.append(ln(x0-26,y0,x0-8,y0,'#607888',1.2));q.append(ln(x0-26,y0+sh,x0-8,y0+sh,'#607888',1.2))
  q.append(tx(x0-31,y0+sh/2+5,'600',13,navy,'700','end'))
  q.append(tx(cx,top+182,f'{fmt(span)} mm overall  ·  50 mm cover',13,subtle,'600','middle'))
  q.append(tx(cx,top+203,'Top surface/profile is unconfirmed; rectangular study shown',12,subtle,'500','middle'))
 section(55,642,719,l,'X');section(792,642,751,w,'Y')
 # BBS
 q.append(rect(55,870,1488,200,'#fbfdfe',line))
 q.append(tx(75,899,'05  PRELIMINARY STRAIGHT-BAR SCHEDULE  (ONE FOOTING; BOTH MATS)',17,navy,'700'))
 cols=[76,217,560,735,934,1112,1302]
 hd=['MARK / MAT','BAR RUN','Ø (mm)','QTY','CUT* (mm)','PITCH (mm)','MASS (kg)']
 for x,s in zip(cols,hd):q.append(tx(x,932,s,13,subtle,'700'))
 q.append(ln(74,944,1523,944,'#dbe3e8',1))
 for rr,(mark,run,sch) in enumerate([('B1 + B3','X →',xbar),('B2 + B4','Y ↑',ybar)]):
  y=971+rr*36
  vals=[mark,run,16,sch['per_footing'],fmt(sch['straight_mm']),f'{sch["each_layer_pitch"]:.1f}',f'{sch["mass"]:.1f}']
  for x,s in zip(cols,vals):q.append(tx(x,y,str(s),16,navy,'600'))
  q.append(ln(74,y+11,1523,y+11,'#e7edf1',1))
 q.append(tx(76,1055,'*Straight bar only, no bends/anchorage/laps. Mats, slope, support chairs and eccentric set-out require engineer acceptance.',13,'#925b32','500'))
 q.append(tx(1230,1090,'REVIEW ISSUE  ·  FD-01  ·  2026-11-15',12,subtle,'600'))
 f=out/f'HAR-FD-{id}_{ft}_REBAR.svg';f.write_text(page(1600,1140,q),encoding='utf-8')
 files.append({'node':id,'type':ft,'f':f.name,'size':f'{l} × {w} × 600','xcount':xbar['per_footing'],'ycount':ybar['per_footing'],'xcut':xbar['straight_mm'],'ycut':ybar['straight_mm'],'xspacing':round(xbar['each_layer_pitch'],2),'yspacing':round(ybar['each_layer_pitch'],2),'mass':round(xbar['mass']+ybar['mass'],2),'xmass':round(xbar['mass'],2),'ymass':round(ybar['mass'],2)})

# A compact human-readable per-footing BBS, explicit arithmetic status in the sheet itself.
with (out/'FOOTING_REBAR_SCHEDULE_REVIEW.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.writer(f);w.writerow(['Footing','Type','Overall size (mm)','Bar diameter','Direction','Bars per mat','Total bars (2 mats)','Straight cutting length (mm)*','Actual pitch (mm)','Calculated mass (kg)'])
 for n in files:
  for axis in ('x','y'):
   w.writerow([n['node'],n['type'],n['size'],16,axis.upper(),n[axis+'count']//2,n[axis+'count'],n[axis+'cut'],n[axis+'spacing'],n[axis+'mass']])
# Index: links to static SVGs independent of web templates.
index=['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Harisharan | Footing Working Drawings — Review</title><style>body{font:16px/1.5 system-ui;background:#f5f8fa;color:#162e43;max-width:1100px;padding:26px;margin:auto}h1{font-size:clamp(25px,4vw,40px)}.tip{background:#fff1e1;border-left:4px solid #d58b31;padding:12px 16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:24px 0}.card{background:#fff;border:1px solid #cbd9df;border-radius:12px;padding:17px}.card strong{display:block}.card a{display:inline-block;margin-top:10px;color:#005f96}a{color:#005f96}</style></head><body><p>Harisharan Adhikari · Foundation drawing series FD-01</p><h1>Footing location and reinforcement</h1><p class="tip"><strong>For engineering review only.</strong> The exact structural BBS is not yet accepted. The displayed straight lengths assume 50 mm clear cover, flat rectangular envelope and two mats. Confirm slope, bends, anchorage, chairs and setting out before cutting steel.</p><p><a href="HAR-FD-00_FOOTING_OVERVIEW.svg">Open color-coded 18-footing location plan</a> · <a href="FOOTING_REBAR_SCHEDULE_REVIEW.csv">Bar schedule CSV</a></p><div class="grid">']
for n in files:index.append(f'<div class="card"><strong>{n["node"]} · {n["type"]}</strong><span>{n["size"]} mm</span><br>Ø16, two mats; X {n["xcount"]} bars, Y {n["ycount"]} bars<br><a href="{n["f"]}">Open 4-view detail &amp; bar table</a></div>')
index.append('</div><p>Source: STR-01/02 footing schedule, current CAD takeoff.json; no engineering approval implied.</p></body></html>');(out/'index.html').write_text(''.join(index),encoding='utf-8')
# Write a small stats file for reproducibility, not visible on drawings.
manifest={'project':d['logicalId'],'source_repo_file':'public/data/projects/harisharan-adhikari/takeoff.json','source_git_blob':'d4ab4a534c6a5bd795c3399005ff19ba78ef6c6a','cover_mm':cover_mm,'diameter_mm':bar_d,'spacing_nominal_mm':spacing,'footing_count':len(files),'F1_count':6,'F2_count':12,'status':'REVIEW_ONLY_NOT_APPROVED_BBS','members':files,'sha256':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(out.glob('*.svg'))}}
(out/'footing_review_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
zip_path=out.parent/'Harisharan_Footing_Drawings_FD01_REVIEW.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
 for f in sorted(out.iterdir()):z.write(f,f.name)
print('DRAWINGS',len(files)+1,'F1',6,'F2',12,'ZIP',zip_path)
print('F1 X/Y',bar_schedule(2550,2550),'F2 X/Y',bar_schedule(2700,2100))
