/**
 * Ashok architect-only cascading grid source transform.
 * A grid position is a constraint anchor, NOT a verified ribbed beam or RCC member.
 * Ground and first floor wall/node/room geometry can be regenerated without
 * manually stretching the rooms between axes 4–3, 3–2, and 2–1.
 *
 * Input z: model world metres, positive toward FRONT.
 * Input room bbox Y: source-local millimetres, positive toward REAR.
 */
export function cascadeGridAndRooms(source,{shiftMm=762,firstShiftedWorldZm,sourceWorldDepthMm=14400}={}){
 if(!source?.floorGraph||!Array.isArray(source.roomEnvelopes))throw new Error('A floor graph and source room envelopes are required.');
 if(!(shiftMm>0&&shiftMm<=1524))throw new Error('Site-grid change must be positive and within reviewed bounds.');
 if(!(firstShiftedWorldZm>0))throw new Error('Missing rearmost affected wall anchor');
 const out=structuredClone(source),deltaM=shiftMm/1000;
 const movedNodes=[];
 for(const n of out.floorGraph.nodes)if(n.z>=firstShiftedWorldZm-1e-9){
  n.z=Math.round((n.z-deltaM)*1e6)/1e6;movedNodes.push(n.id);
 }
 let roomEdges=0;
 for(const room of out.roomEnvelopes)for(const coord of [1,3]){
  if(room.bbox[coord]<sourceWorldDepthMm){room.bbox[coord]+=shiftMm;roomEdges++}
 }
 const nodeSet=new Set(out.floorGraph.nodes.map(n=>n.id));
 if(nodeSet.size!==out.floorGraph.nodes.length)throw new Error('Duplicate node IDs');
 for(const wall of out.floorGraph.walls)if(!nodeSet.has(wall.a)||!nodeSet.has(wall.b))throw new Error('Unconnected wall '+wall.id);
 const walls=new Map(out.floorGraph.walls.map(w=>[w.id,w]));
 for(const opening of out.floorGraph.openings){
  const wall=walls.get(opening.wallId);
  if(!wall)throw new Error('Orphan opening '+opening.id);
  const a=out.floorGraph.nodes.find(n=>n.id===wall.a),b=out.floorGraph.nodes.find(n=>n.id===wall.b);
  const distance=Math.hypot(a.x-b.x,a.z-b.z);
  if(opening.offset<0||opening.offset+opening.width>distance+1e-5)throw new Error('Opening exceeds host '+opening.id);
 }
 return {model:out,evidence:{shiftMm,firstShiftedWorldZm,movedNodes,roomEdges}};
}
export function cascadeReviewAxes(sourceRows,{shiftMm=762,moveRows=['1','2','3','4']}={}){
 const out=structuredClone(sourceRows);
 for(const row of out)if(moveRows.includes(String(row.label)))row.zMm-=shiftMm;
 if(new Set(out.map(x=>x.label)).size!==out.length)throw new Error('Duplicate grid station');
 return out;
}
export function computePlotAfterFrontRetreat({plotDepthMm=18288,buildingOriginYmm=2364,buildingDepthMm=14400,moveFrontMm=762}={}){
 const newFront=buildingOriginYmm+moveFrontMm,newDepth=buildingDepthMm-moveFrontMm,rear=plotDepthMm-newFront-newDepth;
 if(newDepth<=0||rear<0)throw new Error('Invalid plot geometry');
 return {frontSetbackMm:newFront,rearSetbackMm:rear,buildingDepthMm:newDepth,sourceLocalFrontYmm:moveFrontMm};
}
