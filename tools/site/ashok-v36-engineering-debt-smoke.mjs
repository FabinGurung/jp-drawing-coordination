import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root='public/data/projects/ashok-adhikari/';
const load=name=>JSON.parse(readFileSync(root+name,'utf8'));
const manifest=load('aad-building-v3-6-review.json');
const grid=load('coordinate-grid-v3-6-review.json');
const gf=load('aad-gf-model-v3-6-review.json'),ff=load('aad-ff-model-v3-6-review.json');
const report=load('v3-6-engineering-debt-review-20261117.json');
const eq=(a,b,label)=>assert.deepEqual(a,b,label);
const p=manifest.services.siteFrame;
const building=p.plinthRect;
const wr=p.outsideWCRect;
const toRect=a=>[a.xMm-a.widthMm/2,a.yMm-a.lengthMm/2,a.xMm+a.widthMm/2,a.yMm+a.lengthMm/2];
const intersect=(a,b)=>[Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0])),Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]))];
const asset=id=>manifest.services.assets.find(a=>a.id===id);
eq(p.plinthRect,[1817,3126,9017,16764],'v3.6 house rectangle in plot coordinates');
eq(grid.plot.buildingOriginInPlotMm,[1817,3126],'v3.6 grid and model site offsets agree');
eq([grid.plot.frontSetbackMm,grid.plot.rearSetbackMm,grid.plot.leftSetbackMm,grid.plot.rightSetbackMm],[3126,1524,1817,127],'setbacks');
eq(report.qa.setbacksMm,{front:3126,rear:1524,left:1817,right:127},'review report setbacks');
eq(report.qa.buildingSiteRectMm,p.plinthRect,'review report site rectangle');
eq([p.widthMm,p.lengthMm],[9144,18288],'plot size');
const envelopeArea=(building[2]-building[0])*(building[3]-building[1])/1e6;
assert.equal(envelopeArea,98.1936);
assert.equal(report.qa.envelopeAreaM2,envelopeArea);
for(const level of manifest.levels)assert.equal(level.sourceArea,87.05176);
assert.equal(report.qa.sourcePerimeterAreaPerLevelM2,87.05176);
assert.ok(report.qa.sourcePerimeterAreaPerLevelM2<envelopeArea,'perimeter != bounding area');
for(const [model,kind] of [[gf,'gf'],[ff,'ff']]){
  const n=Object.fromEntries(model.floorGraph.nodes.map(v=>[v.id,v]));
  const w=Object.fromEntries(model.floorGraph.walls.map(v=>[v.id,v]));
  const c=report.qa.floors[kind];
  eq([model.floorGraph.nodes.length,model.floorGraph.walls.length,model.floorGraph.openings.length,model.roomEnvelopes.length],[c.nodes,c.walls,c.openings,c.roomEnvelopes],kind+' inventory');
  assert.equal(new Set(Object.keys(n)).size,model.floorGraph.nodes.length);
  for(const op of model.floorGraph.openings){
    const wall=w[op.wallId];assert.ok(wall,'orphan opening '+op.id);
    const a=n[wall.a],b=n[wall.b];assert.ok(a&&b,'orphan wall '+wall.id);
    assert.ok(op.offset>=0&&op.offset+op.width<=Math.hypot(a.x-b.x,a.z-b.z)+1e-6,'opening host length '+op.id);
  }
}
const gfw=gf.floorGraph.openings.find(x=>x.id==='GF-W008-C4-C2-OWNER-20261116');
const ffw=ff.floorGraph.openings.find(x=>x.id==='FF-W009-C4-C2-OWNER-20261112');
assert.ok(gfw&&ffw);
eq([gfw.width,gfw.height,gfw.sill,gfw.offset],[ffw.width,ffw.height,ffw.sill,ffw.offset],'right windows match');
assert.equal(Math.round((11.323-(gfw.offset+gfw.width/2))*1000),7838);
assert.equal(report.qa.alignedRightWindowCentreWorldZmm,7838);
for(const row of manifest.presentation.columnAxisGrid.numberAxes)assert.equal(row.zMm,report.qa.gridsWorldZmm[row.label]);
const expected=[['SERV-01','SEPTIC',building,[579,2300]],['SERV-02','SOAK',wr,[1097,1090]],['SERV-03','SOAK',building,[213,611]]];
for(const [id,which,against,depth] of expected){
  const flag=report.collisionFlags.find(r=>r.id===id);
  assert.ok(flag,'missing collision '+id);
  eq(flag.assetRectMm,toRect(asset(which)),id+' asset rectangle');
  eq(flag.overlapMm,intersect(toRect(asset(which)),against),id+' intersection');
  eq(flag.overlapMm,depth,id+' baseline overlap');
  assert.match(flag.status,/HOLD/);
}
assert.ok(manifest.restrictions.issueForConstruction===false);
assert.equal(report.constructionIssued,false);
assert.equal(report.autocadAcceptance.nativeAutodesk,'NOT_RUN');
assert.equal(report.detectedDraftingConflicts.length,5);
assert.ok(report.externalEngineeringHolds.every(h=>h.status.startsWith('HOLD')));
console.log('ASHOK_V36_ENGINEERING_DEBT_READBACK_PASS',JSON.stringify({envelopeAreaM2:envelopeArea,planAreaPerLevelM2:87.05176,apertures:gf.floorGraph.openings.length+ff.floorGraph.openings.length,collisions:report.collisionFlags.map(c=>[c.id,c.overlapMm]),nativeAutocad:'NOT_RUN'}));
