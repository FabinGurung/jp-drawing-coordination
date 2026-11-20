/** CAD project plot adapter v2: one SVG/JSON model drives 2D, 3D, inspector.
 * SVG is authored in controlled Google Doc. CI imports a reviewed copy from Drive.
 * All heights and tanks are conceptual, not permit-ready engineering. */
const $=id=>document.getElementById(id);
const root=new URL('../../../',location.href);
const urlParams=new URL(location.href).searchParams;
const sourcePath=urlParams.get('manifest')||'data/projects/14-amrit-hardware-1/plot-150-working.json';
const sourceUrl=new URL(sourcePath.startsWith('/')?sourcePath:new URL(sourcePath,root).href,location.origin);
const svgUrl=new URL(sourceUrl.href.replace(/\.json(?:\?.*)?$/,'.svg'));
let model,outer,selectedKey='boundary-2',layout='split',panel='views',phase='site';
let azimuth=-.5,elevation=.77,zoom=1,drag=null,drawnEdges=[];
const NS='http://www.w3.org/2000/svg';
const svgEl=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;};
const round=(v,dp=2)=>Number(v).toFixed(dp);
const asM=pt=>pt.map(v=>v/1000);
const area=poly=>Math.abs(poly.reduce((s,p,i)=>s+p[0]*poly[(i+1)%poly.length][1]-poly[(i+1)%poly.length][0]*p[1],0)/2)/1e6;
const rectCorners=r=>[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]];
const current=()=>model?.schema==='jp-cad://site-plot-boundary/2.0';
const labelSide=i=>current()?['East · Rear','South · Right','West · Road/front','North · Left'][i]:['Top','Right','Bottom · road adjacent','Left'][i];
const allElements=()=>[
 ...outer.map((_,i)=>({id:`boundary-${i}`,name:labelSide(i),kind:'plot-boundary'})),
 ...(current()?[{id:model.geometry.house.id,name:'Rectangular house concept',kind:'house'},...model.geometry.reservedUndergroundZones.map(z=>({id:z.id,name:z.label,kind:'service-reservation'}))]:[])
];
function checked(m){
 if(!['jp-cad://site-plot-boundary/1.0','jp-cad://site-plot-boundary/2.0'].includes(m?.schema))throw Error('Unknown CAD plot model schema');
 if(m.geometry.units!=='mm'||m.geometry.surveyVerified||m.geometry.georeferenced)throw Error('Only source-qualified local plot geometry admitted');
 if(m.geometry.outer.vertices.length!==4||m.geometry.inner.vertices.length!==4)throw Error('Required four surveyed-source trace points missing');
 if(!m.geometry.outer.vertices.every(p=>p.length===2&&p.every(Number.isFinite)))throw Error('Invalid boundary coordinates');
 if(current()&&!m.geometry.frontOnlySetback?.polygonMm?.length)throw Error('Front-only setback not present');
}
const notify=()=>document.dispatchEvent(new CustomEvent('project-drawing-state'));
function select(id){selectedKey=id;renderPlan();render3d();renderInspector();notify();}
function buttons(){document.querySelectorAll('[data-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layout===layout)));$('views').className='views '+(layout==='source'?'plan':layout);$('plan-pane').hidden=layout==='building';$('model-pane').hidden=layout==='plan'||layout==='source';}
function renderPlan(){
 const svg=$('plan');svg.replaceChildren();
 if(current()){
  const t=model.geometry.svgView.transform, pos=p=>[t.xZero+p[0]*t.scale,t.yZero-p[1]*t.scale];
  svg.setAttribute('viewBox',model.geometry.svgView.viewBox.join(' '));
  svg.append(svgEl('image',{href:svgUrl.href,x:0,y:0,width:940,height:1370,'pointer-events':'none'}));
  outer.forEach((p,i)=>{const a=pos(p),b=pos(outer[(i+1)%4]);const hit=svgEl('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'transparent','stroke-width':35,'pointer-events':'stroke',cursor:'pointer'});hit.addEventListener('click',()=>select(`boundary-${i}`));svg.append(hit);});
  const house=model.geometry.house;
  const hitRect=(rect,id)=>{const x=pos([rect[0],rect[3]]),q=pos([rect[2],rect[1]]);const e=svgEl('rect',{x:x[0],y:x[1],width:q[0]-x[0],height:q[1]-x[1],fill:'transparent',cursor:'pointer','pointer-events':'all'});e.addEventListener('click',()=>select(id));svg.append(e);};
  hitRect(house.rectMm,house.id);
  model.geometry.reservedUndergroundZones.forEach(z=>hitRect(z.rectMm,z.id));
  return;
 }
 svg.setAttribute('viewBox','0 0 600 560');const minx=Math.min(...outer.map(p=>p[0])),maxx=Math.max(...outer.map(p=>p[0])),miny=Math.min(...outer.map(p=>p[1])),maxy=Math.max(...outer.map(p=>p[1]));const sc=Math.min(470/(maxx-minx),435/(maxy-miny));const pos=p=>[300+(p[0]-(maxx+minx)/2)*sc,280-(p[1]-(maxy+miny)/2)*sc];
 const poly=pts=>pts.map(p=>pos(p).join(',')).join(' ');
 svg.append(svgEl('polygon',{points:poly(outer),fill:'#f7f7f4',stroke:'#b63d4b','stroke-width':3}));
 svg.append(svgEl('polygon',{points:poly(model.geometry.inner.vertices),fill:'#e5f1ef',stroke:'#1a7888','stroke-width':2}));
 outer.forEach((p,i)=>{const a=pos(p),b=pos(outer[(i+1)%4]);const l=svgEl('text',{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,'text-anchor':'middle',fill:'#a33d4b','font-size':12});l.textContent=model.geometry.outer.edgeLabels[i];svg.append(l);const hit=svgEl('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'transparent','stroke-width':24,'pointer-events':'stroke'});hit.addEventListener('click',()=>select('boundary-'+i));svg.append(hit);});
}
function projector(canvas){const r=canvas.getBoundingClientRect(),w=Math.max(300,r.width),h=Math.max(330,r.height),sc=Math.min(w/18,h/25)*1.6*zoom;const px=outer.map(asM),mx=(Math.min(...px.map(x=>x[0]))+Math.max(...px.map(x=>x[0])))/2,my=(Math.min(...px.map(x=>x[1]))+Math.max(...px.map(x=>x[1])))/2;
 return {w,h,point:(p,z=0)=>{const x=p[0]/1000-mx,y=p[1]/1000-my;return [w/2+(x*Math.cos(azimuth)-y*Math.sin(azimuth))*sc,h*.61+((x*Math.sin(azimuth)+y*Math.cos(azimuth))*Math.sin(elevation)-z*Math.cos(elevation))*sc];}};
}
function render3d(){
 const cv=$('model3d'),ctx=cv.getContext('2d');if(!ctx||!model)return;
 const {w,h,point}=projector(cv),dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const poly=(pts)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();};
 const trace=(coords)=>coords.map(p=>point(p));
 const plot=trace(outer);poly(plot);ctx.fillStyle='#e5f1f4';ctx.fill();ctx.strokeStyle='#b63d4b';ctx.lineWidth=2.7;ctx.stroke();
 if(current()){
  poly(trace(model.geometry.frontOnlySetback.polygonMm));ctx.fillStyle='#f9e9cb';ctx.fill();ctx.strokeStyle='#c2924e';ctx.setLineDash([6,5]);ctx.lineWidth=1.7;ctx.stroke();ctx.setLineDash([]);
  for(const z of model.geometry.reservedUndergroundZones){const pp=trace(rectCorners(z.rectMm));poly(pp);ctx.fillStyle=selectedKey===z.id?'#98c3df':'#d6ebf7';ctx.fill();ctx.strokeStyle='#226da5';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);let x=pp.reduce((s,p)=>s+p[0],0)/4,y=pp.reduce((s,p)=>s+p[1],0)/4;ctx.font='bold 11px system-ui';ctx.fillStyle='#19547a';ctx.textAlign='center';ctx.fillText(z.shortLabel,x,y);}
  const b=model.geometry.house,base=trace(rectCorners(b.rectMm)),roof=rectCorners(b.rectMm).map(p=>point(p,b.displayHeightMm/1000));
  // Conceptual mass only; no columns, room layout, structural member sizes or surveyed levels.
  for(const i of [0,1,2,3]){const j=(i+1)%4;poly([base[i],base[j],roof[j],roof[i]]);ctx.fillStyle=i%2===0?'#a9c7b5':'#91b7a0';ctx.fill();ctx.strokeStyle='#4d8061';ctx.lineWidth=1.3;ctx.stroke();}
  poly(roof);ctx.fillStyle=selectedKey===b.id?'#b6d18d':'#d8e8dc';ctx.fill();ctx.strokeStyle='#45724e';ctx.lineWidth=2.2;ctx.stroke();
  const cx=roof.reduce((s,p)=>s+p[0],0)/4,cy=roof.reduce((s,p)=>s+p[1],0)/4;ctx.textAlign='center';ctx.font='bold 13px system-ui';ctx.fillStyle='#235444';ctx.fillText('HOUSE CONCEPT',cx,cy);
 }else{const inn=trace(model.geometry.inner.vertices);poly(inn);ctx.fillStyle='#eaf5f0';ctx.fill();ctx.strokeStyle='#1a7888';ctx.lineWidth=2;ctx.stroke();}
 drawnEdges=[];for(let i=0;i<4;i++){const a=plot[i],b=plot[(i+1)%4];drawnEdges.push([a,b]);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=selectedKey==='boundary-'+i?'#ac203b':'#b63d4b';ctx.lineWidth=selectedKey==='boundary-'+i?5:3;ctx.stroke();}
 ctx.fillStyle='#2a5260';ctx.textAlign='left';ctx.font='bold 12px system-ui';ctx.fillText(current()?'PLOT 150 · HOUSE + SERVICES CONCEPT':'PLOT 150 · SOURCE SITE',12,23);ctx.font='11px system-ui';ctx.fillText('Flat site; building height illustrative only',12,43);ctx.fillText('Drag to orbit · wheel/pinch to zoom · click edge',12,h-14);
}
function renderInspector(){
 const elements=allElements(),el=elements.find(x=>x.id===selectedKey)||elements[0],i=selectedKey.startsWith('boundary-')?Number(selectedKey.split('-')[1]):-1,g=model.geometry;
 const rows=[];
 if(i>=0){const a=outer[i],b=outer[(i+1)%4];$('selected-title').textContent=labelSide(i)+' · '+g.outer.edgeLabels[i];$('selected-description').textContent='Plot edge recovered from the original vector PDF; direction supplied by owner, not surveyed bearing.';rows.push(['Length on original PDF',g.outer.edgeLabels[i]],['Orientation',labelSide(i)],['Local midpoint',`${round((a[0]+b[0])/2000,3)} m, ${round((a[1]+b[1])/2000,3)} m`]);}
 else {const item=selectedKey===g.house?.id?g.house:g.reservedUndergroundZones?.find(z=>z.id===selectedKey);if(item){$('selected-title').textContent=item.label;$('selected-description').textContent='Conceptual location only; building and underground services are not construction approved.';const r=item.rectMm;rows.push(['Plan size',`${round((r[2]-r[0])/1000)} × ${round((r[3]-r[1])/1000)} m`],['Local placement',`X ${round(r[0]/1000)}–${round(r[2]/1000)} m · Y ${round(r[1]/1000)}–${round(r[3]/1000)} m`],['Authority','Owner-requested concept · independent engineering HOLD']);}}
 rows.push(['Survey', 'Not georeferenced or certified'],['Issue status','Preliminary source/architectural review']);
 $('selected-register').replaceChildren();for(const [key,val] of rows){let dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=val;$('selected-register').append(dt,dd);}
 $('measurements').replaceChildren();g.outer.edgeLabels.forEach((l,j)=>{let tr=document.createElement('tr');tr.setAttribute('aria-selected',String(i===j));let b=document.createElement('button');b.textContent=labelSide(j);b.addEventListener('click',()=>select('boundary-'+j));let a=document.createElement('td');a.append(b);let c=document.createElement('td');c.textContent=l;let d=document.createElement('td');d.textContent=current()?(j===2?'Front-only offset (unverified)':'No setback drawn'):g.inner.edgeLabels[j];tr.append(a,c,d);$('measurements').append(tr);});
 $('area').textContent=current()?`PDF-derived plot ≈ ${round(area(outer))} m² · front band ≈ ${round(g.frontOnlySetback?area(g.frontOnlySetback.polygonMm):0)} m² · house ≈ ${round(g.house.floorAreaSqm)} m². None are survey/approved construction quantities.`:`PDF-derived plot ≈ ${round(area(outer))} m² · historic inner outline ≈ ${round(area(g.inner.vertices))} m². Not official land area.`;
}
const distance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy);};
function wireCanvas(){const cv=$('model3d');cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,moved:false};});cv.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;azimuth+=dx*.009;elevation=Math.max(.22,Math.min(1.42,elevation+dy*.006));drag.x=e.clientX;drag.y=e.clientY;render3d();});cv.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const r=cv.getBoundingClientRect(),pos=[e.clientX-r.left,e.clientY-r.top],dist=drawnEdges.map(s=>distance(pos,...s)),index=dist.indexOf(Math.min(...dist));if(dist[index]<25)select('boundary-'+index);}drag=null;});cv.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.45,Math.min(4,zoom*Math.exp(-e.deltaY*.001)));render3d();},{passive:false});cv.addEventListener('dblclick',fit);new ResizeObserver(()=>render3d()).observe(cv);}
function fit(){azimuth=-.5;elevation=.77;zoom=1;render3d();}
function setPanel(x){panel=x;notify();}
function setLevel(x){phase=x==='all'?'site':x;notify();}
function setLayout(x){layout=['split','plan','building','source'].includes(x)?x:'split';buttons();render3d();notify();}
async function start(){try{let r=await fetch(sourceUrl,{cache:'no-store'});if(!r.ok)throw Error(`Model HTTP ${r.status}`);model=await r.json();checked(model);outer=model.geometry.outer.vertices;
  $('svg-export').href=svgUrl.href;
  if(model.links.sourceDxf){$('dxf-export').href=new URL(model.links.sourceDxf,root).href;}else{$('dxf-export').hidden=true;}
  document.querySelectorAll('[data-layout]').forEach(b=>b.addEventListener('click',()=>setLayout(b.dataset.layout)));$('fit').addEventListener('click',fit);wireCanvas();buttons();renderPlan();render3d();renderInspector();
  window.ProjectDrawing={getState:()=>({ready:true,phase,layout,panel,componentCount:allElements().length,selectedId:selectedKey,elements:allElements().map(z=>({...z,status:'CONCEPT_REVIEW_ONLY'}))}),setPanel,setLevel,setLayout,fit};notify();
 }catch(error){$('plot-app').insertAdjacentHTML('afterbegin','<p role="alert" class="warn">Unable to load source-qualified plot model: '+String(error.message||error).replace(/[<>]/g,'')+'</p>');}}
void start();
