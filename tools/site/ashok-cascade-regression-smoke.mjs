import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cascadeGridAndRooms,cascadeReviewAxes,computePlotAfterFrontRetreat} from './ashok-cascade-engine.mjs';
const base='public/data/projects/ashok-adhikari/';
const load=n=>JSON.parse(readFileSync(base+n,'utf8'));
for(const [prior,current,cut] of [
 ['aad-gf-model-v3-grid-review.json','aad-gf-model-v3-6-review.json',5],
 ['aad-ff-model-v3-3-review.json','aad-ff-model-v3-6-review.json',4.8]
]){
 const source=load(prior),target=load(current),derived=cascadeGridAndRooms(source,{shiftMm:762,firstShiftedWorldZm:cut});
 assert.deepEqual(derived.model.floorGraph.nodes,target.floorGraph.nodes,'Cascade reproducible from prior source nodes');
 assert.deepEqual(derived.model.roomEnvelopes,target.roomEnvelopes,'No stretched middle rooms; same room bboxes from source transform');
 assert.deepEqual(derived.model.floorGraph.walls,target.floorGraph.walls,'Stable member IDs and connected topology');
 const before=source.roomEnvelopes,after=target.roomEnvelopes;
 for(const room of after){const p=before.find(x=>x.id===room.id);
  const oldSpan=p.bbox[3]-p.bbox[1],nowSpan=room.bbox[3]-room.bbox[1];
  assert.equal(nowSpan,oldSpan-(p.bbox[3]===14400?762:0),'Only rear block shrinks: '+room.id);
 }
 assert.ok(derived.evidence.movedNodes.length>9);
}
const old=load('aad-building-v3-4-review.json'),actual=load('aad-building-v3-6-review.json');
const rows=cascadeReviewAxes(old.presentation.columnAxisGrid.numberAxes,{shiftMm:762});
assert.deepEqual(rows.map(x=>x.zMm),actual.presentation.columnAxisGrid.numberAxes.map(x=>x.zMm));
assert.deepEqual(computePlotAfterFrontRetreat(),{frontSetbackMm:3126,rearSetbackMm:1524,buildingDepthMm:13638,sourceLocalFrontYmm:762});
console.log('ASHOK_DEPENDENCY_CASCADE_REPRODUCIBLE_PASS');
