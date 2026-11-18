/* CAD client view: source-preserving, read-only presentation of geometry.
 * Never sum floor-graph wall objects with visual presentation envelopes as if
 * they were two independent orders. This is an unpriced measured-item index.
 */
const known=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
export const METRES_TO_FEET=3.280839895013123;
export function unitLabel(unit='m'){return unit==='ft'?'ft':'m';}
export function measure(value,unit='m',power=1){
 if(!known(value))return '—';
 const converted=unit==='ft'?value*METRES_TO_FEET**power:value;
 return converted.toFixed(power===1?2:2)+' '+unitLabel(unit)+(power===2?'²':power===3?'³':'');
}
const names={wall:'Wall',door:'Door',window:'Window',floor:'Floor finish',fixture:'Fixture',
 furniture:'Furniture',beam:'Beam',column:'Column',slab:'Slab',landing:'Landing',stair:'Stair',
 guard:'Guard',roof:'Roof',site:'Site item',landscape:'Landscape',auxiliary:'Service item',footing:'Footing'};
export const humanKind=kind=>names[kind]||'Drawing item';
export function takeoffRows(manifest,floorGraphs={}){
 const rows=[],floors=manifest.levels||[];
 for(const f of floors){
  const graph=floorGraphs[f.id];
  if(!graph?.floorGraph)continue;
  const nodes=new Map(graph.floorGraph.nodes.map(n=>[n.id,n]));
  const walls=new Map(graph.floorGraph.walls.map(w=>[w.id,w]));
  for(const w of graph.floorGraph.walls){
   const a=nodes.get(w.a),b=nodes.get(w.b);if(!a||!b)continue;
   const length=Math.hypot(b.x-a.x,b.z-a.z),height=known(graph.height)?graph.height-.18:null;
   rows.push({key:f.id+':'+w.id,id:w.id,elementId:manifest.projectId+':'+f.id+':'+w.id,
    floor:f.id,type:'wall',name:w.id.includes('EXT')?'External wall':'Internal wall',
    L:length,B:w.thickness,H:height,area:known(height)?length*height:null,volume:known(height)&&known(w.thickness)?length*height*w.thickness:null,
    center:{x:(a.x+b.x)/2,z:(a.z+b.z)/2,y:(f.elevation||0)+(height||0)/2},
    geom:{ax:a.x,az:a.z,bx:b.x,bz:b.z},technical:{id:w.id,source:w.source,status:w.status,host:'—',provenance:w.provenance?.basis||'',nodeA:w.a,nodeB:w.b}});
  }
  for(const o of graph.floorGraph.openings){
   const host=walls.get(o.wallId),a=nodes.get(host?.a),b=nodes.get(host?.b);
   if(!a||!b)continue;
   const len=Math.hypot(b.x-a.x,b.z-a.z),fraction=(o.offset+o.width/2)/len;
   const x=a.x+(b.x-a.x)*fraction,z=a.z+(b.z-a.z)*fraction;
   rows.push({key:f.id+':'+o.id,id:o.id,elementId:manifest.projectId+':'+f.id+':'+o.id,
    floor:f.id,type:o.kind,name:humanKind(o.kind),L:o.width,B:null,H:o.height,
    area:known(o.width)&&known(o.height)?o.width*o.height:null,volume:null,
    center:{x,z,y:(f.elevation||0)+(o.sill||0)+(o.height||0)/2},
    technical:{id:o.id,source:o.source,status:o.status,host:o.wallId,provenance:o.provenance?.basis||'',sill:o.sill,offset:o.offset}});
  }
 }
 for(const e of manifest.presentation?.elements||[]){
  if(!['gf','ff','roof'].includes(e.level))continue;
  const L=known(e.dx)?e.dx:null,B=known(e.dz)?e.dz:null,H=known(e.dy)?e.dy:null;
  rows.push({key:e.level+':'+e.id,id:e.id,elementId:manifest.projectId+':'+e.level+':'+e.id,
   floor:e.level,type:e.kind,name:((e.name||'').replace(/^(GF|FF)\s+/i,'').replace(/[-_]+/g,' ').trim()||humanKind(e.kind)),
   L,B,H,area:known(L)&&known(B)?L*B:null,volume:known(L)&&known(B)&&known(H)?L*B*H:null,
   center:{x:e.x,z:e.z,y:e.y},technical:{id:e.id,source:e.source,status:e.status,host:e.roomId||'—',ifcType:e.ifcType,provenance:e.provenance?.basis||''}});
 }
 return rows.sort((a,b)=>String(a.floor).localeCompare(String(b.floor))||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
export function dimensionsFor(row,unit='m'){
 if(!row)return [];
 const dims=[['Length',measure(row.L,unit)],['Breadth',measure(row.B,unit)],['Height',measure(row.H,unit)]];
 const area=row.type==='door'||row.type==='window'?'Opening area':row.type==='wall'?'Wall face area':'Plan area';
 dims.push([area,measure(row.area,unit,2)]);
 if(known(row.volume))dims.push(['Envelope volume',measure(row.volume,unit,3)]);
 return dims;
}
const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
export function miniPlanSvg(row,width=7.2,depth=13.638){
 if(!row?.center||!Number.isFinite(row.center.x)||!Number.isFinite(row.center.z))return '<p>Location not available in model.</p>';
 const x=24+clamp(row.center.x/width,0,1)*192,y=18+clamp(1-row.center.z/depth,0,1)*138;
 let shape=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#ea795c" stroke="#fff" stroke-width="2"/>`;
 if(row.geom){const a=row.geom,b={x:row.geom.bx,z:row.geom.bz};
  const ax=24+clamp(a.ax/width,0,1)*192,ay=18+clamp(1-a.az/depth,0,1)*138,
   bx=24+clamp(b.x/width,0,1)*192,by=18+clamp(1-b.z/depth,0,1)*138;
  shape=`<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="#ea795c" stroke-width="5" stroke-linecap="round"/>`+shape;
 }
 return `<svg viewBox="0 0 240 177" role="img" aria-label="Selected item location within the building plan">
 <rect x="24" y="18" width="192" height="138" fill="#edf4f2" stroke="#4d7b78" stroke-width="2" rx="3"/>
 <path d="M120 18v138 M24 87h192" stroke="#b8d0cc" stroke-dasharray="4 5"/>${shape}
 <text x="120" y="171" text-anchor="middle" fill="#576e75" font-size="10">Front / entry direction</text></svg>`;
}
export function miniVolumeSvg(row){
 if(!row)return '<p>Choose an item.</p>';
 // An isometric selection glyph, deliberately a schematic envelope rather than
 // an asserted structural section or an independent 3D model renderer.
 const L=known(row.L)?row.L:1,B=known(row.B)?row.B:.6,H=known(row.H)?row.H:1;
 const k=clamp(76/Math.max(L,B,H),10,46),ax=clamp(L*k,24,98),bz=clamp(B*k*.45,13,48),hy=clamp(H*k,21,88);
 const px=100,py=119;
 return `<svg viewBox="0 0 240 177" role="img" aria-label="Isometric size preview of selected object">
 <path d="M${px} ${py-hy} l${ax} 0 l${bz} -${bz} l-${ax} 0 Z" fill="#ecc6a8" stroke="#986b53" stroke-width="1.6"/>
 <path d="M${px} ${py-hy} l${ax} 0 v${hy} l-${ax} 0 Z" fill="#d99e78" stroke="#986b53" stroke-width="1.6"/>
 <path d="M${px+ax} ${py-hy} l${bz} -${bz} v${hy} l-${bz} ${bz} Z" fill="#b77e62" stroke="#986b53" stroke-width="1.6"/>
 <text x="120" y="168" text-anchor="middle" fill="#576e75" font-size="10">Schematic selected-element envelope</text></svg>`;
}
export function toDisplayPosition(row,unit='m'){
 if(!row?.center)return 'Location unavailable';
 return 'X '+measure(row.center.x,unit)+' · Y '+measure(row.center.y,unit)+' · Plan '+measure(row.center.z,unit);
}
