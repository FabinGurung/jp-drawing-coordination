import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {PROJECTS} from '../../public/assets/js/project-workspace-config.mjs';
import {createAADWorkspace} from '../../public/assets/js/aad-unified-workspace.mjs';
const folder='public/data/projects/ashok-adhikari/',load=n=>JSON.parse(fs.readFileSync(folder+n,'utf8'));
const base=load('aad-building-v3-4-review.json'),bad=load('aad-building-v3-5-review.json'),cur=load('aad-building-v3-6-review.json');
const gf0=load('aad-gf-model-v3-grid-review.json'),ff0=load('aad-ff-model-v3-3-review.json');
const gf=load('aad-gf-model-v3-6-review.json'),ff=load('aad-ff-model-v3-6-review.json'),site=load('coordinate-grid-v3-6-review.json');
const eq=(a,b,k)=>assert.deepEqual(a,b,k),cl=x=>Math.round(x*1e6)/1e6;
assert.equal(PROJECTS['ashok-adhikari'].editions[0].id,'v3-6');
eq(PROJECTS['ashok-adhikari'].editions.slice(1,4).map(x=>x.id),['v3-5','v3-4','v3-3']);
assert.equal(cur.release.previous,'v3-5-review');assert.equal(cur.release.version,'v3-6-review');
assert.equal(cur.restrictions.issueForConstruction,false);assert.equal(cur.restrictions.engineeringApproval,'HOLD');
assert.equal(cur.ownerRevision20261116.status,'SUPERSEDED_BY_V3_6_CORRECTION_ROOMS_WERE_STRETCHED_IN_ERROR');
eq(cur.presentation.outerBounds,[0,0,7.2,13.638]);
eq(site.building.boundsMm,[0,762,7200,14400]);
eq(site.plot.buildingOriginInPlotMm,[1817,3126]);
eq([site.plot.frontSetbackMm,site.plot.rearSetbackMm,site.plot.leftSetbackMm,site.plot.rightSetbackMm],[3126,1524,1817,127]);
assert.equal(18288-3126-13638,1524);assert.equal(9144-1817-7200,127);
eq(cur.services.siteFrame.plinthRect,[1817,3126,9017,16764]);
eq(Object.fromEntries(cur.presentation.columnAxisGrid.numberAxes.map(a=>[a.label,a.zMm])),{'1':13488,'2':11438,'3':8038,'4':4238,'5':150});
eq(Object.fromEntries(bad.presentation.columnAxisGrid.numberAxes.map(a=>[a.label,a.zMm])),{'1':14250,'2':12200,'3':8800,'4':4238,'5':150});
for(const [old,now,cut,count] of [[gf0,gf,5,15],[ff0,ff,4.8,16]]){
 assert.equal(old.floorGraph.nodes.length,now.floorGraph.nodes.length);
 let moved=0;
 for(const n of now.floorGraph.nodes){const p=old.floorGraph.nodes.find(x=>x.id===n.id);assert.ok(p);assert.equal(n.x,p.x);const target=p.z>=cut?cl(p.z-.762):p.z;assert.ok(Math.abs(n.z-target)<.000001,n.id+' should move together');if(n.z!==p.z)moved++}
 assert.ok(moved>=10);
 for(const w of old.floorGraph.walls)eq(now.floorGraph.walls.find(x=>x.id===w.id),w,'Wall immutable ID/host/width '+w.id);
 for(const r of now.roomEnvelopes){const before=old.roomEnvelopes.find(x=>x.id===r.id);assert.ok(before);
  eq(r.bbox,[before.bbox[0],before.bbox[1]<14400?before.bbox[1]+762:before.bbox[1],before.bbox[2],before.bbox[3]<14400?before.bbox[3]+762:before.bbox[3]],'Room translates, never stretches '+r.id);
  const beforeSpan=before.bbox[3]-before.bbox[1],nowSpan=r.bbox[3]-r.bbox[1];assert.equal(nowSpan,beforeSpan-(before.bbox[3]===14400?762:0),'Only rear room shrinks '+r.id);
 }
 const nodes=Object.fromEntries(now.floorGraph.nodes.map(n=>[n.id,n]));
 for(const o of now.floorGraph.openings){const w=now.floorGraph.walls.find(w=>w.id===o.wallId);assert.ok(w,'Opening orphan '+o.id);const a=nodes[w.a],b=nodes[w.b],len=Math.hypot(a.x-b.x,a.z-b.z);assert.ok(o.offset>=0&&o.offset+o.width<=len+1e-6,'Aperture past wall '+o.id)}
}
const gfw=gf.floorGraph.openings.find(o=>o.id==='GF-W008-C4-C2-OWNER-20261116');
const ffw=ff.floorGraph.openings.find(o=>o.id==='FF-W009-C4-C2-OWNER-20261112');
assert.ok(gfw&&ffw);for(const w of [gfw,ffw]){eq([w.width,w.height,w.sill,w.offset],[2.1,1.5,.9,2.435]);assert.match(w.status,/FIRE_PRIVACY_MUNICIPAL_HOLD/);}
eq(cur.presentation.roomEnvelopes.GF,gf.roomEnvelopes);eq(cur.presentation.roomEnvelopes.FF,ff.roomEnvelopes);
const windows=[gfw,ffw].map(w=>11.323-(w.offset+w.width/2));assert.ok(windows.every(z=>Math.abs(z-7.838)<1e-6));
eq(cur.presentation.roofAccess,base.presentation.roofAccess);
eq(cur.presentation.stairBay,base.presentation.stairBay);
for(const e of cur.presentation.elements.filter(e=>e.kind==='column')){const row=e.id.split('-').at(-1);assert.ok(Math.abs(e.z-cur.presentation.columnAxisGrid.numberAxes.find(a=>a.label===row).zMm/1000)<1e-6,e.id)}
for(const k of ['GF-FLOOR-PLATE','FF-FLOOR-PLATE','FF-ROOF-TERRACE']){
 const e=cur.presentation.elements.find(e=>e.id===k);assert.ok(e);assert.equal(e.dz,13.638);
}
const txt=JSON.stringify({gf:gf.floorGraph,ff:ff.floorGraph,site:{originInPlotMm:[1817,3126],gridWorldZmm:{1:13488,2:11438,3:8038,4:4238,5:150}}});
assert.equal(cur.presentation.sourceGeometryHash,createHash('sha256').update(txt,'utf8').digest('hex'),'SHA256 matches corrected linked graphs');
const assembly=createAADWorkspace(cur,{gf,ff}).snapshot().assembly;
assert.ok(assembly.elements.length>100);
for(const w of [gfw,ffw])assert.ok(assembly.elements.some(e=>e.id.endsWith(w.id)),'Window should render in shared 2D/3D assembly '+w.id);
assert.ok(cur.reviewHolds.some(h=>h.code==='V3_6_CASCADE_CORRECTION'));
console.log('ASHOK_V3_6_CASCADING_ROOM_AND_SETBACK_PASS',JSON.stringify({gridRows:cur.presentation.columnAxisGrid.numberAxes.map(x=>[x.label,x.zMm]),frontMm:3126,rearMm:1524,rightMm:127,footprintDepthMm:13638,gfWindows:gf.floorGraph.openings.length,ffWindows:ff.floorGraph.openings.length,assembly:assembly.elements.length}));
