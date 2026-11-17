#!/usr/bin/env python3
"""Ashok Adhikari v3.6 — editable AutoCAD 2007 DXF export.

Source: public/data/projects/ashok-adhikari/aad-{gf,ff}-model-v3-6-review.json
Coordinates remain model-accurate millimetres. Owner's displayed dimensions
are foot/inch labels. This is architectural REVIEW, NOT FOR CONSTRUCTION.
"""
from __future__ import annotations
import argparse
import json
import math
from fractions import Fraction
from pathlib import Path
import ezdxf
from ezdxf.enums import TextEntityAlignment

PLOT_WIDTH = 9144
PLOT_DEPTH = 18288
BUILDING_X = 1817
BUILDING_Y = 3126
BUILDING_WIDTH = 7200
BUILDING_DEPTH = 13638
ROW_WORLD_Z = {'5':150,'4':4238,'3':8038,'2':11438,'1':13488}
SOURCE_WORLD_DEPTH_MM = 14400


def ftinch(mm: float) -> str:
    sixteenths = round(mm / 25.4 * 16)
    feet, units = divmod(sixteenths, 12 * 16)
    whole, frac = divmod(units, 16)
    if frac:
        q=Fraction(frac,16)
        inches=f'{whole} {q.numerator}/{q.denominator}' if whole else f'{q.numerator}/{q.denominator}'
    else:
        inches=str(whole)
    return f'{feet}\'-{inches}"'


def new_document():
    doc=ezdxf.new('R2007',setup=True)
    doc.units=4 # mm, AutoCAD INSUNITS 4
    doc.header['$INSUNITS']=4
    doc.header['$MEASUREMENT']=1
    layerdefs={
        'A-PLOT-BOUNDARY':(7,50), 'A-BUILDING-OUTLINE':(7,50),
        'A-WALLS':(7,35), 'A-WALL-CENTER':(8,13),
        'A-DOORS':(7,25), 'A-WINDOWS':(7,25),
        'A-GRID':(8,18), 'A-AXIS-BUBBLES':(7,25),
        'A-ROOM-NAMES':(7,13), 'A-DIMENSIONS':(7,13),
        'A-OPENING-TAGS':(8,13), 'A-REVISION-HOLDS':(7,18),
        'A-SITE-REFERENCE':(8,18), 'A-TITLES':(7,35),
    }
    for name,(color,weight) in layerdefs.items():
        doc.layers.new(name,dxfattribs={'color':color,'lineweight':weight})
    return doc


def line(msp,a,b,layer):
    msp.add_line(a,b,dxfattribs={'layer':layer})


def rect(msp,x0,y0,x1,y1,layer):
    msp.add_lwpolyline([(x0,y0),(x1,y0),(x1,y1),(x0,y1)],close=True,dxfattribs={'layer':layer})


def text(msp,value,x,y,height=160,layer='A-ROOM-NAMES',align='middle'):
    value=value.replace('·','-').replace('–','-').replace('²','2')
    t=msp.add_text(value,dxfattribs={'layer':layer,'height':height,'style':'Standard'})
    alignment=TextEntityAlignment.MIDDLE_CENTER if align=='middle' else TextEntityAlignment.LEFT
    t.set_placement((x,y),align=alignment)
    return t


def dim(msp,p1,p2,dist=None,orientation='h',label=None):
    x1,y1=p1;x2,y2=p2
    if dist is None: dist=(min(y1,y2)-500 if orientation=='h' else min(x1,x2)-500)
    base=((x1+x2)/2,dist) if orientation=='h' else (dist,(y1+y2)/2)
    angle=0 if orientation=='h' else 90
    length=math.dist(p1,p2)
    try:
        msp.add_linear_dim(base=base,p1=p1,p2=p2,angle=angle,
            text=label or ftinch(length),dxfattribs={'layer':'A-DIMENSIONS'},
            override={'dimtxt':140,'dimasz':90,'dimexo':65,'dimexe':90,'dimclrd':7,'dimclrt':7,'dimclre':7}).render()
    except Exception as exc:
        # Still show a source coordinate-based explicit dimension if a viewer rejects a DIM style.
        line(msp,p1,p2,'A-DIMENSIONS')
        text(msp,label or ftinch(length),(x1+x2)/2,(y1+y2)/2+150,125,'A-DIMENSIONS')


def draw_grid(msp,offset):
    ox,oy=offset
    for k,x in [('A',150),('B',3600),('C',7050)]:
        xx=ox+x
        line(msp,(xx,oy+250),(xx,oy+14800),'A-GRID')
        msp.add_circle((xx,oy+15300),210,dxfattribs={'layer':'A-AXIS-BUBBLES'})
        text(msp,k,xx,oy+15300,205,'A-AXIS-BUBBLES')
    for name,z in ROW_WORLD_Z.items():
        yy=oy+SOURCE_WORLD_DEPTH_MM-z
        line(msp,(ox-450,yy),(ox+BUILDING_WIDTH+450,yy),'A-GRID')
        msp.add_circle((ox-850,yy),210,dxfattribs={'layer':'A-AXIS-BUBBLES'})
        text(msp,name,ox-850,yy,180,'A-AXIS-BUBBLES')


def wall_openings(source,wall):
    return sorted((o for o in source['floorGraph']['openings'] if o['wallId']==wall['id']),key=lambda x:x['offset'])


def draw_wall(msp,a,b,thickness,openings,origin):
    ox,oy=origin
    ax=ox+a['x']*1000; ay=oy+SOURCE_WORLD_DEPTH_MM-a['z']*1000
    bx=ox+b['x']*1000; by=oy+SOURCE_WORLD_DEPTH_MM-b['z']*1000
    length=math.hypot(bx-ax,by-ay)
    if length<.1:return
    dx=(bx-ax)/length;dy=(by-ay)/length
    nx=-dy*thickness*500;ny=dx*thickness*500
    def point(v,side=0):return ax+dx*v+nx*side,ay+dy*v+ny*side
    cursor=0
    for op in openings:
        at=max(cursor,op['offset']*1000);finish=min(length,(op['offset']+op['width'])*1000)
        if at>cursor:
            for side in (-1,1):line(msp,point(cursor,side),point(at,side),'A-WALLS')
        if finish<=at:continue
        kind=op['kind']
        layer='A-DOORS' if kind=='door' else 'A-WINDOWS'
        if kind=='window':
            for f in (-.35,0,.35):line(msp,point(at,f),point(finish,f),layer)
        else:
            line(msp,point(at,-1),point(at,1),layer)
            line(msp,point(finish,-1),point(finish,1),layer)
        tag=op['id'].split('-OWNER-')[0].replace('GF-','').replace('FF-','')
        text(msp,tag,point((at+finish)/2)[0],point((at+finish)/2)[1]+(210 if abs(dx)>.5 else 70),95,'A-OPENING-TAGS')
        cursor=finish
    if length>cursor:
        for side in (-1,1):line(msp,point(cursor,side),point(length,side),'A-WALLS')
    line(msp,point(0),point(length),'A-WALL-CENTER')


def draw_floor(msp,model,offset,level):
    ox,oy=offset
    title='GROUND FLOOR' if level=='GF' else 'FIRST FLOOR'
    text(msp,f'ASHOK ADHIKARI v3.6  -  {title}',ox+BUILDING_WIDTH/2,oy+17550,310,'A-TITLES')
    text(msp,'CORRECTED GRID 1-4 CASCADE; 5 STATIONARY; ROOM DEPTHS PRESERVED',ox+BUILDING_WIDTH/2,oy+16900,150,'A-REVISION-HOLDS')
    text(msp,'MONOCHROME - 1 CAD UNIT = 1 MM - REVIEW ONLY',ox+BUILDING_WIDTH/2,oy+16450,150,'A-REVISION-HOLDS')
    draw_grid(msp,offset)
    nodes={n['id']:n for n in model['floorGraph']['nodes']}
    for wall in model['floorGraph']['walls']:
        draw_wall(msp,nodes[wall['a']],nodes[wall['b']],wall['thickness'],wall_openings(model,wall),offset)
    for room in model['roomEnvelopes']:
        x0,y0,x1,y1=room['bbox']
        x=ox+(x0+x1)/2;y=oy+(y0+y1)/2
        label=room['name'].split(' - ')[0].replace(' · ACCESSIBILITY HOLD','')
        if len(label)>26:label=label[:26]
        text(msp,label,x,y+140,170 if x1-x0>2500 else 115,'A-ROOM-NAMES')
        if (x1-x0)>1350 and (y1-y0)>1800:
            text(msp,f'{ftinch(x1-x0)} x {ftinch(y1-y0)}  (NOMINAL)',x,y-160,115,'A-ROOM-NAMES')
    dim(msp,(ox,oy+762),(ox+7200,oy+762),oy-350,'h',ftinch(BUILDING_WIDTH)+'  BUILDING WIDTH')
    dim(msp,(ox,oy+762),(ox,oy+14400),ox-1300,'v',ftinch(BUILDING_DEPTH)+'  BUILDING DEPTH')
    row_positions=[(k,SOURCE_WORLD_DEPTH_MM-z) for k,z in ROW_WORLD_Z.items()]
    for i in range(len(row_positions)-1):
        left_label,y1=row_positions[i];right_label,y2=row_positions[i+1]
        dim(msp,(ox-250,y1+oy),(ox-250,y2+oy),ox-1850,'v',f'{left_label}-{right_label}: {ftinch(abs(y2-y1))}')
    text(msp,'FRONT / ROAD',ox+3600,oy+350,155,'A-SITE-REFERENCE')
    text(msp,'REAR',ox+3600,oy+14880,155,'A-SITE-REFERENCE')
    text(msp,'RIGHT WINDOW GF / FF ALIGNED; FIRE / MUNICIPAL HOLD',ox+3600,oy-1800,120,'A-REVISION-HOLDS')


def draw_plot(msp,offset=(400,0)):
    ox,oy=offset
    rect(msp,ox,oy,ox+PLOT_WIDTH,oy+PLOT_DEPTH,'A-PLOT-BOUNDARY')
    rect(msp,ox+BUILDING_X,oy+BUILDING_Y,
         ox+BUILDING_X+BUILDING_WIDTH,oy+BUILDING_Y+BUILDING_DEPTH,'A-BUILDING-OUTLINE')
    text(msp,'SITE PLAN - 30 FT x 60 FT (NOMINAL)',ox+PLOT_WIDTH/2,oy+19900,310,'A-TITLES')
    text(msp,'BUILDING FRONT RECEDES 2 FT 6 IN; NO SURVEY AUTHORITY',ox+PLOT_WIDTH/2,oy+19300,155,'A-REVISION-HOLDS')
    text(msp,'BUILDING BOUNDING ENVELOPE (NOT PLAN AREA)',ox+BUILDING_X+BUILDING_WIDTH/2,oy+BUILDING_Y+BUILDING_DEPTH/2+160,160,'A-ROOM-NAMES')
    text(msp,f'{ftinch(BUILDING_WIDTH)} x {ftinch(BUILDING_DEPTH)}',ox+BUILDING_X+BUILDING_WIDTH/2,oy+BUILDING_Y+BUILDING_DEPTH/2-220,180,'A-ROOM-NAMES')
    text(msp,'GF/FF SOURCE PERIMETER AREA 87.05176 m2 EACH - REVIEW ONLY',ox+BUILDING_X+BUILDING_WIDTH/2,oy+BUILDING_Y+BUILDING_DEPTH/2-520,125,'A-REVISION-HOLDS')
    dim(msp,(ox,oy+PLOT_DEPTH),(ox+PLOT_WIDTH,oy+PLOT_DEPTH),oy+PLOT_DEPTH+560,'h','30 FT 0 IN (PLOT WIDTH)')
    dim(msp,(ox,oy),(ox,oy+PLOT_DEPTH),ox-800,'v','60 FT 0 IN (PLOT LENGTH)')
    dim(msp,(ox+PLOT_WIDTH,oy),(ox+PLOT_WIDTH,oy+BUILDING_Y),ox+PLOT_WIDTH+600,'v',ftinch(BUILDING_Y)+' FRONT SETBACK')
    dim(msp,(ox+PLOT_WIDTH,oy+BUILDING_Y+BUILDING_DEPTH),(ox+PLOT_WIDTH,oy+PLOT_DEPTH),ox+PLOT_WIDTH+600,'v','5 FT 0 IN REAR')
    dim(msp,(ox,oy+BUILDING_Y),(ox+BUILDING_X,oy+BUILDING_Y),oy+BUILDING_Y-540,'h',ftinch(BUILDING_X)+' LEFT')
    dim(msp,(ox+BUILDING_X+BUILDING_WIDTH,oy+BUILDING_Y),(ox+PLOT_WIDTH,oy+BUILDING_Y),oy+BUILDING_Y-540,'h','5 IN RIGHT')
    text(msp,'SE / ROAD FRONT',ox+PLOT_WIDTH/2,oy-500,185,'A-SITE-REFERENCE')
    text(msp,'NW / REAR',ox+PLOT_WIDTH/2,oy+PLOT_DEPTH+1000,185,'A-SITE-REFERENCE')
    text(msp,'NOT SURVEYED - NOT FOR CONSTRUCTION',ox+PLOT_WIDTH/2,oy-1400,180,'A-REVISION-HOLDS')


def save(doc,path):
    path.parent.mkdir(parents=True,exist_ok=True)
    doc.saveas(path)
    test=ezdxf.readfile(path)
    audit=test.audit()
    if audit.has_errors:
        raise RuntimeError(f'{path.name}: DXF validation found {len(audit.errors)} errors: {[str(e) for e in audit.errors[:5]]}')
    assert test.dxfversion=='AC1021'
    assert test.units==4
    assert len(test.modelspace())>10
    return {'file':str(path),'bytes':path.stat().st_size,'entities':len(test.modelspace()),'format':test.dxfversion,'layers':len(test.layers)}


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--source-dir',type=Path,default=Path('public/data/projects/ashok-adhikari'))
    p.add_argument('--output-dir',type=Path,default=Path('out/ashok-v3-6-cad'))
    a=p.parse_args()
    gf=json.loads((a.source_dir/'aad-gf-model-v3-6-review.json').read_text())
    ff=json.loads((a.source_dir/'aad-ff-model-v3-6-review.json').read_text())
    assert gf['floorGraph']['nodes'][0]['z']==13.523
    assert ff['floorGraph']['nodes'][0]['z']==13.523
    records=[]
    for kind,source in [('GF',gf),('FF',ff)]:
        doc=new_document();draw_floor(doc.modelspace(),source,(3000,0),kind)
        records.append(save(doc,a.output_dir/f'Ashok_Adhikari_v3.6_{kind}_AutoCAD2007_Review.dxf'))
    doc=new_document();draw_plot(doc.modelspace(),(3500,0))
    records.append(save(doc,a.output_dir/'Ashok_Adhikari_v3.6_Site_30x60_AutoCAD2007_Review.dxf'))
    doc=new_document();msp=doc.modelspace()
    draw_plot(msp,(3500,0));draw_floor(msp,gf,(20500,0),'GF');draw_floor(msp,ff,(35300,0),'FF')
    records.append(save(doc,a.output_dir/'Ashok_Adhikari_v3.6_Complete_Site_GF_FF_AutoCAD2007.dxf'))
    (a.output_dir/'DXF_VALIDATION_R000001.json').write_text(json.dumps({'source':'v3.6 architectural review JSON','nativeUnits':'millimetres','displayDimensionLabels':'feet and inches','AutoCADVersion':'R2007 AC1021','reviewOnly':True,'notForConstruction':True,'files':records},indent=2)+'\n')
    print(json.dumps(records,indent=2))

if __name__=='__main__':main()
