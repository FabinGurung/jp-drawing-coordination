/** A7/A9 Plot 150 shared 2D SVG / Three.js 3D reader (V005).
 * SVG embeds canonical JSON; a single serialized model controls SVG hit regions,
 * Three.js walls/rooms, measurements, inspector and edition history.
 * The complete Three.js implementation lives in a separate permanent Google Doc,
 * with an exact Git source mirrored into Vite's pinned assets bundle.
 */
const $=id=>document.getElementById(id);
const root=new URL('../../../',location.href);
const params=new URL(location.href).searchParams;
const sourcePath=params.get('manifest')||'data/projects/14-amrit-hardware-1/plot-150-working.json';
const sourceUrl=new URL(sourcePath.startsWith('/')?sourcePath:new URL(sourcePath,root).href,location.origin);
const svgUrl=new URL(sourceUrl.href.replace(/\.json(?:\?.*)?$/,'.svg'));
const NS='http://www.w3.org/2000/svg';
const svgEl=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
const fmt=(n,d=2)=>Number(n).toFixed(d);
const ftIn=(mm)=>{const total=Math.round(mm/25.4);return `${Math.floor(total/12)}′-${total%12}″`;};
const sqFt=(sqm)=>`${(sqm*10.76391041671).toFixed(1)} sq ft`; 
const area=pts=>Math.abs(pts.reduce((s,p,i)=>s+p[0]*pts[(i+1)%pts.length][1]-pts[(i+1)%pts.length][0]*p[1],0)/2)/1e6;
const rectCorners=r=>[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]];
let model=null,outer=[],selectedId='HOUSE-01',layout='split',panel='views',phase='site',three=null,threeStatus='NOT_LOADED';
const isNew=()=>Boolean(model?.geometry?.house?.plan?.wallSegments);
const side=i=>['East · Rear','South · Right','West · Road/front','North · Left'][i]||'Boundary';
const rooms=()=>model?.geometry?.house?.plan?.rooms||[];
const elements=()=>[
 ...outer.map((_,i)=>({id:`boundary-${i}`,name:side(i),kind:'plot-boundary'})),
 ...(model?.geometry?.house?[{id:model.geometry.house.id,name:model.geometry.house.label,kind:'house'}]:[]),
 ...rooms().map(r=>({id:r.id,name:r.label,kind:'room'})),
 ...(model?.geometry?.reservedUndergroundZones||[]).map(r=>({id:r.id,name:r.label,kind:'historic-reservation'}))
];
const event=()=>document.dispatchEvent(new CustomEvent('project-drawing-state'));
function checked(m){
 if(!['jp-cad://site-plot-boundary/1.0','jp-cad://site-plot-boundary/2.0'].includes(m?.schema))throw Error('Unsupported source model');
 if(m.geometry.units!=='mm'||m.geometry.georeferenced||m.geometry.surveyVerified)throw Error('Unknown or falsely certified coordinates');
 if(m.geometry.outer.vertices.length!==4)throw Error('Plot vertices missing');
 if(isNew()&&!m.geometry.house?.plan?.wallSegments)throw Error('V005 room/wall model missing');
}
function pos(p){const t=model.geometry.svgView.transform;return[t.xZero+p[0]*t.scale,t.yZero-p[1]*t.scale];}
function fromLocal(p){const f=model.geometry.house.plan.frameMm;return[f.origin[0]+p[0]*f.uAxis[0]+p[1]*f.vAxis[0],f.origin[1]+p[0]*f.uAxis[1]+p[1]*f.vAxis[1]];}
function hitPolygon(svg,pts,id){const e=svgEl('polygon',{points:pts.map(x=>pos(x).join(',')).join(' '),fill:'transparent',stroke:'transparent','stroke-width':2,cursor:'pointer','pointer-events':'all'});e.addEventListener('click',()=>select(id));svg.append(e);}
function select(id){selectedId=id;three?.setSelection(id);renderInspector();renderPlan();event();}
function renderPlan(){
 const svg=$('plan');svg.replaceChildren();
 if(!model)return;
 if(model.schema==='jp-cad://site-plot-boundary/2.0'){
  svg.setAttribute('viewBox',model.geometry.svgView.viewBox.join(' '));
  svg.append(svgEl('image',{href:svgUrl.href,x:0,y:0,width:940,height:1370,'pointer-events':'none'}));
  if(isNew()){
   hitPolygon(svg,model.geometry.house.polygonMm,'HOUSE-01');
   for(const r of rooms())hitPolygon(svg,rectCorners(r.rectLocalMm).map(fromLocal),r.id);
  }else if(model.geometry.house){
   hitPolygon(svg,rectCorners(model.geometry.house.rectMm),'HOUSE-01');
   for(const z of model.geometry.reservedUndergroundZones||[])hitPolygon(svg,rectCorners(z.rectMm),z.id);
  }
  for(let i=0;i<4;i++){const a=pos(outer[i]),b=pos(outer[(i+1)%4]);const h=svgEl('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'transparent','stroke-width':22,'pointer-events':'stroke',cursor:'pointer'});h.addEventListener('click',()=>select(`boundary-${i}`));svg.append(h);}
  return;
 }
 svg.setAttribute('viewBox','0 0 600 560');const x=outer.map(p=>p[0]),y=outer.map(p=>p[1]);const cx=(Math.min(...x)+Math.max(...x))/2,cy=(Math.min(...y)+Math.max(...y))/2,sc=Math.min(470/(Math.max(...x)-Math.min(...x)),435/(Math.max(...y)-Math.min(...y)));
 const p=v=>[300+(v[0]-cx)*sc,280-(v[1]-cy)*sc];svg.append(svgEl('polygon',{points:outer.map(o=>p(o).join(',')).join(' '),fill:'#f6f6f3',stroke:'#b63d4b','stroke-width':3}));svg.append(svgEl('polygon',{points:model.geometry.inner.vertices.map(o=>p(o).join(',')).join(' '),fill:'#cfe8e0',stroke:'#18768a','stroke-width':2}));
}
function renderInspector(){
 if(!model)return;
 const g=model.geometry;
 let title='',desc='',rows=[];
 if(selectedId.startsWith('boundary-')){
  const i=Number(selectedId.slice(9)),a=outer[i],b=outer[(i+1)%4];
  title=side(i)+' · '+g.outer.edgeLabels[i];desc='Printed dimension from original vector PDF; owner-stated compass side, not a surveyed bearing.';
  rows=[['Original PDF length',g.outer.edgeLabels[i]],['Measurement units','Feet and inches only']];
 }else{
  const room=rooms().find(x=>x.id===selectedId);
  const item=room||((g.reservedUndergroundZones||[]).find(x=>x.id===selectedId))||g.house;
  title=item.label||'House';
  if(room){const r=room.rectLocalMm;rows=[['Concept dimensions',`${ftIn(r[2]-r[0])} × ${ftIn(r[3]-r[1])}`],['Gross zone area',sqFt(room.areaSqmGross)]];if(room.containedIn)rows.push(['Access','Attached to Bedroom 1 only']);desc='Corresponding 2D zone and genuine Three.js 3D floor, enclosed by identical wall coordinates.';}
  else if(item.rectMm){const r=item.rectMm;rows=[['Concept dimensions',`${ftIn(r[2]-r[0])} × ${ftIn(r[3]-r[1])}`]];desc='Historical design reservation; not present in v004.';}
  else{rows=[['House footprint',sqFt(g.house.floorAreaSqm)]];desc='Rectangular ground-floor design option; no construction clearance or structural plan.';}
 }
 rows.push(['Survey status','Not verified'],['Design status','Concept · Engineering HOLD']);
 $('selected-title').textContent=title;$('selected-description').textContent=desc;$('selected-register').replaceChildren();
 for(const [key,val] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=val;$('selected-register').append(dt,dd);}
 $('measurements').replaceChildren();g.outer.edgeLabels.forEach((label,i)=>{const tr=document.createElement('tr');tr.setAttribute('aria-selected',String(selectedId===`boundary-${i}`));const a=document.createElement('td'),b=document.createElement('td'),c=document.createElement('td'),button=document.createElement('button');button.textContent=side(i);button.addEventListener('click',()=>select(`boundary-${i}`));a.append(button);b.textContent=label;c.textContent=i===2?'Front-only offset (unverified)':'No setback drawn';tr.append(a,b,c);$('measurements').append(tr);});
 $('area').textContent=`PDF-derived plot ≈ ${sqFt(area(outer))} · front band ≈ ${sqFt(area(g.frontOnlySetback?.polygonMm||[]))} · house ≈ ${sqFt(g.house?.floorAreaSqm||0)}. Not surveyed or approved.`;
}
function buttons(){document.querySelectorAll('[data-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layout===layout)));$('views').className='views '+(layout==='source'?'plan':layout);$('plan-pane').hidden=layout==='building';$('model-pane').hidden=layout==='plan'||layout==='source';three?.resize();}
function setPanel(p){panel=p;event();}
function setLevel(p){phase=p==='all'?'site':p;event();}
function setLayout(p){layout=['split','plan','building','source'].includes(p)?p:'split';buttons();event();}
function fit(){three?.fit();}
async function start(){
 try{
  const r=await fetch(sourceUrl,{cache:'no-store'});if(!r.ok)throw Error('Source model HTTP '+r.status);
  model=await r.json();outer=model.geometry.outer.vertices;checked(model);
  $('svg-export').href=svgUrl.href;
  if(model.links?.sourceDxf){$('dxf-export').href=new URL(model.links.sourceDxf,root).href;}
  else $('dxf-export').hidden=true;
  document.querySelectorAll('[data-layout]').forEach(b=>b.addEventListener('click',()=>setLayout(b.dataset.layout)));
  $('fit').addEventListener('click',fit);
  buttons();renderPlan();renderInspector();
  try{
   // This is a local Vite output of installed npm three@0.181.2, not a remote CDN.
   const module=await import(new URL('assets/plot150-three.v005.js',root).href);
   if(typeof module.mountPlot150Three!=='function')throw Error('Bundled Three.js entry is missing');
   three=module.mountPlot150Three({canvas:$('model3d'),model,onSelect:select});
   three.setSelection(selectedId);threeStatus='THREEJS';
  }catch(e){threeStatus='THREEJS_NOT_AVAILABLE';$('three-status').textContent='3D WebGL unavailable: '+String(e.message||e);$('three-status').hidden=false;}
  window.ProjectDrawing={getState:()=>({ready:true,phase,panel,layout,selectedId,threeStatus,componentCount:elements().length,elements:elements().map(x=>({...x,status:'CONCEPT_REVIEW_ONLY'}))}),setPanel,setLevel,setLayout,fit,select};
  event();
 }catch(error){const p=document.createElement('p');p.setAttribute('role','alert');p.className='warn';p.textContent='Unable to load Plot 150 SVG-based model: '+String(error.message||error);$('plot-app').prepend(p);}
}
void start();
