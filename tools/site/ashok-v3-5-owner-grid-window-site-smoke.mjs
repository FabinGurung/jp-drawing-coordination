import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {PROJECTS} from '../../public/assets/js/project-workspace-config.mjs';
import {createAADWorkspace} from '../../public/assets/js/aad-unified-workspace.mjs';
import {inspectColumnAxisGrid} from '../../public/assets/js/aad-column-axis-grid.mjs';
const dir='public/data/projects/ashok-adhikari/',read=p=>JSON.parse(fs.readFileSync(dir+p,'utf8'));
const prev=read('aad-building-v3-4-review.json'),next=read('aad-building-v3-5-review.json');
const pg=read('aad-gf-model-v3-grid-review.json'),ng=read('aad-gf-model-v3-5-review.json');
const pf=read('aad-ff-model-v3-3-review.json'),nf=read('aad-ff-model-v3-5-review.json');
const oldSite=read('coordinate-grid-v3-4-site-review.json'),site=read('coordinate-grid-v3-5-review.json');
const eq=(a,b,msg)=>assert.deepEqual(a,b,msg);
assert.equal(PROJECTS['ashok-adhikari'].editions[0].id,'v3-5');
assert.equal(PROJECTS['ashok-adhikari'].editions[0].predecessorId,'v3-4');
assert.equal(PROJECTS['ashok-adhikari'].editions[1].id,'v3-4');
assert.equal(next.release.version,'v3-5-review');assert.equal(next.release.previous,'v3-4-review');
assert.equal(next.restrictions.issueForConstruction,false);
assert.equal(next.restrictions.engineeringApproval,'HOLD');
eq(next.levels.map(l=>l.model),['aad-gf-model-v3-5-review.json','aad-ff-model-v3-5-review.json']);
eq(next.presentation.roofAccess,prev.presentation.roofAccess,'Stair and roof unchanged');
eq(next.presentation.stairBay,prev.presentation.stairBay,'Stair bay unchanged');
eq([site.plot.widthMm,site.plot.depthMm],[9144,18288],'Plot dimensions unchanged');
eq(site.plot.buildingOriginInPlotMm,[1817,2364]);
eq([site.plot.leftSetbackMm,site.plot.rightSetbackMm,site.plot.frontSetbackMm,site.plot.rearSetbackMm],[1817,127,2364,1524]);
assert.equal(9144-1817-7200,127);assert.equal(18288-2364-14400,1524);
eq(oldSite.plot.buildingOriginInPlotMm,[1944,2364]);
assert.equal(next.services.siteFrame.buildingOffsetX,1817);
eq(next.services.siteFrame.plinthRect,[1817,2364,9017,16764]);
eq(next.presentation.plotBounds,[-1.817,-1.524,7.327,16.764]);
eq(next.presentation.coordinateGrid.plotOriginMm,[1817,2364]);
assert.equal(next.presentation.columnAxisGrid.numberAxes.find(x=>x.label==='4').zMm,4238);
assert.equal(prev.presentation.columnAxisGrid.numberAxes.find(x=>x.label==='4').zMm,5000);
eq(site.constraints[0].zRangesMetres,[[.115,4.238],[4.238,8.8],[8.8,12.2]]);
assert.equal(site.coordinateTransform.localToPlotXmm,'1817 + localXmm');
assert.equal(next.presentation.sourceGeometryHash,createHash('sha256').update(JSON.stringify({gf:ng.floorGraph,ff:nf.floorGraph,site:{originInPlotMm:[1817,2364],grid4Zmm:4238}}),'utf8').digest('hex'));

for(const [before,after,oldZ,newZ,oldY,newY,count] of [[pg,ng,5,4.238,9400,10162,5],[pf,nf,4.8,4.038,9600,10362,4]]){
 const changed=after.floorGraph.nodes.filter(n=>before.floorGraph.nodes.find(p=>p.id===n.id)?.z!==n.z);
 assert.equal(changed.length,count);assert.ok(changed.every(n=>n.z===newZ));
 for(const n of after.floorGraph.nodes){const p=before.floorGraph.nodes.find(x=>x.id===n.id);assert.ok(p);assert.equal(p.x,n.x);if(p.z!==oldZ)assert.equal(p.z,n.z);}
 for(const w of after.floorGraph.walls)assert.deepEqual(w,before.floorGraph.walls.find(x=>x.id===w.id),'Wall IDs/hosts/width unchanged');
 const m=Object.fromEntries(after.floorGraph.nodes.map(n=>[n.id,n]));
 for(const w of after.floorGraph.walls)assert.ok(m[w.a]&&m[w.b]&&Math.hypot(m[w.a].x-m[w.b].x,m[w.a].z-m[w.b].z)>0.01,'Connected nonzero wall '+w.id);
 let roomBoundaryChanges=0;
 for(const e of after.roomEnvelopes){let p=before.roomEnvelopes.find(r=>r.id===e.id);assert.ok(p);for(let i=0;i<4;i++){const wanted=p.bbox[i]===oldY?(roomBoundaryChanges++,newY):p.bbox[i];assert.equal(e.bbox[i],wanted,e.id+' bbox '+i)}}
 assert.equal(roomBoundaryChanges,4);
 for(const o of after.floorGraph.openings){const wall=after.floorGraph.walls.find(x=>x.id===o.wallId);assert.ok(wall,'Opening wall host missing '+o.id);const a=m[wall.a],b=m[wall.b],length=Math.hypot(a.x-b.x,a.z-b.z);assert.ok(o.offset>=0&&o.offset+o.width<=length+.001,'Window/door beyond wall host '+o.id)}
}
assert.equal(ng.floorGraph.openings.length,pg.floorGraph.openings.length+1);
const gfWindow=ng.floorGraph.openings.find(x=>x.id==='GF-W008-C4-C2-OWNER-20261116');
const ffWindow=nf.floorGraph.openings.find(x=>x.id==='FF-W009-C4-C2-OWNER-20261112');
assert.ok(gfWindow&&ffWindow);
for(const o of [gfWindow,ffWindow]){assert.equal(o.kind,'window');eq([o.width,o.height,o.sill,o.offset],[2.1,1.5,.9,2.816]);assert.match(o.status,/FIRE_PRIVACY_MUNICIPAL_HOLD/);assert.ok(Math.abs(12.085-o.offset-o.width/2-8.219)<0.000001)}
assert.equal(gfWindow.wallId,'GF-EXT-04-1');assert.equal(ffWindow.wallId,'FF-EXT-04-1');
for(const o of pf.floorGraph.openings){const now=nf.floorGraph.openings.find(n=>n.id===o.id);assert.ok(now);if(o.id!=='FF-W009-C4-C2-OWNER-20261112')eq(now,o,'Other existing FF windows and doors frozen');}
const markers=next.presentation.elements.filter(e=>e.kind==='column'&&/-4$/.test(e.id));
assert.equal(markers.length,6);assert.ok(markers.every(e=>e.z===4.238));
for(const e of markers){const old=prev.presentation.elements.find(x=>x.id===e.id);assert.equal(old.z,5);assert.equal(old.x,e.x)}
for(const [id,sign] of Object.entries({'GF-BED1-FINISH':-1,'GF-KITCHEN-FINISH':-1,'GF-BATH-FINISH':1,'GF-LOUNGE-FINISH':1,'GF-HALL-REV04-001-FINISH':1,'FF-MAIN-FINISH':-1,'FF-ENS-FINISH':1,'FF-WIR-FINISH':1,'FF-LOUNGE-FINISH':1})){
 const e=next.presentation.elements.find(x=>x.id===id),o=prev.presentation.elements.find(x=>x.id===id);assert.ok(e&&o);assert.ok(Math.abs(e.z-(o.z-.381))<.0001);assert.ok(Math.abs(e.dz-(o.dz+sign*.762))<.0001)
}
const wardrobe=next.presentation.elements.find(x=>x.id==='GF-BED1-WARDROBE');assert.ok(wardrobe.z+wardrobe.dz/2<4.238);
const siteIds=/^(SITE-|EXT-WC-|PLANT-|FIX-GF-EXT-PAN$|MEP-SOAK$)/;
for(const e of next.presentation.elements){const o=prev.presentation.elements.find(x=>x.id===e.id);assert.ok(o,'No deleted/published member '+e.id);if(siteIds.test(e.id)){assert.ok(Math.abs(e.x-o.x-.127)<.0001,'Fixed plot context needs plot-relative shift: '+e.id)}else if(e.kind!=='column'&&!Object.hasOwn({'GF-BED1-WARDROBE':1,'GF-BED1-FINISH':1,'GF-KITCHEN-FINISH':1,'GF-BATH-FINISH':1,'GF-LOUNGE-FINISH':1,'GF-HALL-REV04-001-FINISH':1,'FF-MAIN-FINISH':1,'FF-ENS-FINISH':1,'FF-WIR-FINISH':1,'FF-LOUNGE-FINISH':1},e.id))eq(e,o,'Other building element must remain immutable: '+e.id);
assert.equal(e.dx,o.dx);
if(!['GF-BED1-FINISH','GF-KITCHEN-FINISH','GF-BATH-FINISH','GF-LOUNGE-FINISH','GF-HALL-REV04-001-FINISH','FF-MAIN-FINISH','FF-ENS-FINISH','FF-WIR-FINISH','FF-LOUNGE-FINISH'].includes(e.id))assert.equal(e.dz,o.dz);}
const analysis=inspectColumnAxisGrid(next);assert.equal(analysis.grid.numberAxes.find(x=>x.label==='4').zMm,4238);
const assembly=createAADWorkspace(next,{gf:ng,ff:nf}).snapshot().assembly;
assert.ok(assembly.elements.some(x=>x.id.endsWith(gfWindow.id)),'GF right window must render as a shared model object');
assert.ok(assembly.elements.some(x=>x.id.endsWith(ffWindow.id)),'FF reference window must still render');
assert.ok(assembly.elements.length>100);
assert.ok(next.reviewHolds.some(x=>x.code==='20261116_GF_RIGHT_WINDOW_HOLD'));
console.log('ASHOK_V3_5_OWNER_SITE_GRID_WINDOWS_PASS',JSON.stringify({axis4Mm:4238,deltaMm:-762,GFWindow:gfWindow.id,FFWindow:ffWindow.id,rightClearanceMm:127,plotMm:[9144,18288],components:assembly.elements.length,notForConstruction:true}));
