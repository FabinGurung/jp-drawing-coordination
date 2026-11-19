/** Shared CAD plot-boundary adapter, v1.0. One immutable source-derived JSON -> linked 2D and orbitable 3D.
 * A site-only view deliberately has no invented walls, structural axes, northing/easting or terrain levels.
 */
const $=id=>document.getElementById(id);
const urlParams=new URL(location.href).searchParams;
const root=new URL('../../../',location.href);
const sourcePath=urlParams.get('manifest')||'data/projects/14-amrit-hardware-1/plot-150-pdf-trace-v1.json';
const sourceUrl=new URL(sourcePath.startsWith('/')?sourcePath:new URL(sourcePath,root).href,location.origin);
let model,outer,inner,selected=0,layout='split',panel='views',phase='site';
let azimuth=-.58,elevation=.78,zoom=1.0,drag=null,drawnSegments=[];
const color={red:'#b63d4b',teal:'#1a7888',ink:'#233d4b',light:'#e1b8a1'};
const mmToM=point=>[point[0]/1000,point[1]/1000];
const mat=(p)=>[p[0]/1000,p[1]/1000];
const round=(v,dp=2)=>Number(v).toFixed(dp);
const polygonArea=pts=>Math.abs(pts.reduce((sum,p,i)=>sum+(p[0]*pts[(i+1)%pts.length][1]-pts[(i+1)%pts.length][0]*p[1]),0)/2)/1e6;
const elem=(tag,attributes={})=>{let e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attributes))e.setAttribute(k,v);return e;};
const describeSide=i=>['Top','Right','Bottom · road adjacent','Left'][i];
const v=[...Array(4).keys()];
function geometryCheck(data){
 if(data.schema!=='jp-cad://site-plot-boundary/1.0')throw Error('Unsupported plot-boundary schema');
 if(data.geometry.units!=='mm'||data.geometry.georeferenced!==false)throw Error('Only un-georeferenced local-mm plot data admitted');
 for(const name of ['outer','inner']){
  const polygon=data.geometry[name];if(polygon.vertices.length!==4||polygon.edgeLabels.length!==4)throw Error('Four-sided source geometry required');
  if(!polygon.vertices.every(pt=>pt.length===2&&pt.every(Number.isFinite)))throw Error('Invalid plan coordinate');
 }
 if(!Number.isFinite(polygonArea(data.geometry.outer.vertices)))throw Error('Invalid geometric area');
}
function setSelected(i){selected=(i+4)%4;renderPlan();render3d();renderDetail();document.dispatchEvent(new CustomEvent('project-drawing-state'));}
function configureButtons(){document.querySelectorAll('[data-layout]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.layout===layout));});$('views').className='views '+(layout==='source'?'plan':layout);$('plan-pane').hidden=layout==='building';$('model-pane').hidden=layout==='plan'||layout==='source';}
function renderPlan(){
 const svg=$('plan');svg.replaceChildren();svg.setAttribute('viewBox','0 0 600 560');
 const all=[...outer,...inner];const minx=Math.min(...all.map(p=>p[0])),maxx=Math.max(...all.map(p=>p[0]));const miny=Math.min(...all.map(p=>p[1])),maxy=Math.max(...all.map(p=>p[1]));
 const scale=Math.min(470/(maxx-minx),435/(maxy-miny));const xshift=300-(maxx+minx)/2*scale,yshift=280+(maxy+miny)/2*scale;
 const pos=p=>[xshift+p[0]*scale,yshift-p[1]*scale];const points=arr=>arr.map(p=>pos(p).map(x=>round(x,2)).join(',')).join(' ');
 const defs=elem('defs');const pat=elem('pattern',{id:'plot-setback-lines',width:10,height:10,patternUnits:'userSpaceOnUse',patternTransform:'rotate(35)'});pat.append(elem('line',{x1:0,y1:0,x2:0,y2:10,stroke:'#ca9c86','stroke-width':'1.6'}));defs.append(pat);svg.append(defs);
 const d=(pts)=>'M '+pts.map(p=>pos(p).join(' ')).join(' L ')+' Z';
 svg.append(elem('path',{d:d(outer)+' '+d(inner.toReversed()),fill:'url(#plot-setback-lines)','fill-rule':'evenodd',stroke:'none'}));
 svg.append(elem('polygon',{points:points(inner),fill:'#e7f4f3',stroke:color.teal,'stroke-width':2.2,'stroke-linejoin':'round'}));
 svg.append(elem('polygon',{points:points(outer),fill:'none',stroke:color.red,'stroke-width':selected>=0?3.3:2.5,'stroke-linejoin':'round'}));
 outer.forEach((p,i)=>{
  const q=outer[(i+1)%4],a=pos(p),b=pos(q);
  const hit=elem('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'transparent','stroke-width':25,'pointer-events':'stroke',cursor:'pointer'});
  const label=elem('text',{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2-8,'text-anchor':'middle',fill:i===selected?color.red:color.ink,'font-size':i===selected?15:13,'font-weight':'700','paint-order':'stroke',stroke:'#fff','stroke-width':'5','stroke-linejoin':'round'});label.textContent=model.geometry.outer.edgeLabels[i];
  const ring=elem('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:i===selected?'#a51e3a':'none','stroke-width':5,'pointer-events':'none'});
  hit.addEventListener('click',()=>setSelected(i));svg.append(ring,label,hit);
  const mark=elem('circle',{cx:a[0],cy:a[1],r:i===selected?5:3.4,fill:'#fff',stroke:color.red,'stroke-width':2});svg.append(mark);
 });
 const centre=outer.reduce((c,p)=>[c[0]+p[0]/4,c[1]+p[1]/4],[0,0]);const cp=pos(centre);
 const title=elem('text',{x:cp[0],y:cp[1]-15,'text-anchor':'middle','font-size':21,'font-weight':'900',fill:color.ink,'paint-order':'stroke',stroke:'#fff','stroke-width':5});title.textContent='PLOT 150';svg.append(title);
 const sub=elem('text',{x:cp[0],y:cp[1]+8,'text-anchor':'middle','font-size':12,fill:'#426775'});sub.textContent='(PDF local coordinates)';svg.append(sub);
 const note=elem('text',{x:20,y:30,'font-size':11,fill:'#697f89'});note.textContent='PAGE UP ↑ · NOT TRUE NORTH';svg.append(note);
}
function make3dProjector(canvas){
 const r=canvas.getBoundingClientRect(),w=Math.max(300,r.width),h=Math.max(330,r.height);
 const scale=Math.min(w/18,h/25)*1.7*zoom;
 const all=outer.map(mat);let mx=(Math.min(...all.map(p=>p[0]))+Math.max(...all.map(p=>p[0])))/2,my=(Math.min(...all.map(p=>p[1]))+Math.max(...all.map(p=>p[1])))/2;
 return {w,h,project:(pt,z=0)=>{
  const x=pt[0]-mx,y=pt[1]-my;
  const horizontal=x*Math.cos(azimuth)-y*Math.sin(azimuth);
  const depth=x*Math.sin(azimuth)+y*Math.cos(azimuth);
  return [w/2+horizontal*scale,h*.57+(depth*Math.sin(elevation)-z*Math.cos(elevation))*scale];
 }};
}
function render3d(){
 const canvas=$('model3d'),c=canvas.getContext('2d');if(!c||!model)return;
 const {w,h,project}=make3dProjector(canvas),dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 const polys=[outer,inner].map(arr=>arr.map(pt=>project(mat(pt))));
 const path=pts=>{c.beginPath();pts.forEach((pt,i)=>i?c.lineTo(...pt):c.moveTo(...pt));c.closePath();};
 const exterior=polys[0],interior=polys[1];path(exterior);c.fillStyle='#d3e7ec';c.fill();c.lineWidth=2.7;c.strokeStyle=color.red;c.stroke();
 path(interior);c.fillStyle='#eaf5f0';c.fill();c.lineWidth=2.5;c.strokeStyle=color.teal;c.stroke();
 const raised=outer.map(pt=>project(mat(pt),.12));
 c.fillStyle='#ffffff';c.strokeStyle='#b63d4b';c.lineWidth=1.6;for(let i=0;i<4;i++){let j=(i+1)%4;c.beginPath();c.moveTo(...exterior[i]);c.lineTo(...raised[i]);c.lineTo(...raised[j]);c.lineTo(...exterior[j]);c.stroke();}
 drawnSegments=[];for(let i=0;i<4;i++){
  const a=exterior[i],b=exterior[(i+1)%4];drawnSegments.push([a,b]);
  c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=i===selected?'#af2239':color.red;c.lineWidth=i===selected?6:3.2;c.stroke();
  c.fillStyle=i===selected?'#b62f48':'#52778b';let x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
  c.font=(i===selected?'bold 13px':'12px')+' system-ui';c.textAlign='center';c.lineWidth=4;c.strokeStyle='white';c.strokeText(model.geometry.outer.edgeLabels[i],x,y-9);c.fillText(model.geometry.outer.edgeLabels[i],x,y-9);
 }
 raised.forEach((p,i)=>{const b=exterior[i];c.beginPath();c.moveTo(...b);c.lineTo(...p);c.strokeStyle='#b63d4b';c.lineWidth=2;c.stroke();c.beginPath();c.arc(...p,4,0,2*Math.PI);c.fillStyle='#fff';c.fill();c.stroke();});
 c.fillStyle='#365967';c.font='bold 13px system-ui';c.textAlign='left';c.fillText('PLOT 150 · 3D SITE',16,26);c.font='11px system-ui';c.fillText('Display-only 0.12 m border lift; elevations unknown',16,43);c.fillText('ORBIT DRAG • ZOOM WHEEL • CLICK EDGE',16,h-16);
}
function renderDetail(){const i=selected,a=outer[i],b=outer[(i+1)%4],m=[(a[0]+b[0])/2000,(a[1]+b[1])/2000];
 $('selected-title').textContent=describeSide(i)+' · '+model.geometry.outer.edgeLabels[i];
 $('selected-description').textContent='Selected side of the red plot boundary; the same source vertices are highlighted in 2D and 3D.';
 const rows=[['Plot edge label',model.geometry.outer.edgeLabels[i]],['Interior edge label',model.geometry.inner.edgeLabels[i]],['Local midpoint',`X ${round(m[0],3)} m · Y ${round(m[1],3)} m`],['Coordinates','Local PDF drawing only — not GIS'],['Approval','Source review / not surveyed']];
 $('selected-register').replaceChildren();for(const [name,value] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;$('selected-register').append(dt,dd);}
 $('measurements').replaceChildren();model.geometry.outer.edgeLabels.forEach((label,j)=>{const tr=document.createElement('tr');tr.setAttribute('aria-selected',String(j===i));const c0=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent=describeSide(j);button.addEventListener('click',()=>setSelected(j));c0.append(button);const c1=document.createElement('td'),c2=document.createElement('td');c1.textContent=label;c2.textContent=model.geometry.inner.edgeLabels[j];tr.append(c0,c1,c2);$('measurements').append(tr);});
 $('area').textContent=`Derived plan area ≈ ${round(polygonArea(outer),2)} m² · inner drawn footprint ≈ ${round(polygonArea(inner),2)} m². Not official parcel area.`;
}
const segmentDistance=(p,a,b)=>{const vx=b[0]-a[0],vy=b[1]-a[1],t=Math.min(1,Math.max(0,((p[0]-a[0])*vx+(p[1]-a[1])*vy)/(vx*vx+vy*vy)));return Math.hypot(p[0]-(a[0]+t*vx),p[1]-(a[1]+t*vy));};
function wire3d(){const canvas=$('model3d');canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,moved:false};});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;azimuth+=dx*.009;elevation=Math.max(.22,Math.min(1.42,elevation+dy*.006));drag.x=e.clientX;drag.y=e.clientY;render3d();});
 canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const r=canvas.getBoundingClientRect(),point=[e.clientX-r.left,e.clientY-r.top],dist=drawnSegments.map(x=>segmentDistance(point,...x));const idx=dist.indexOf(Math.min(...dist));if(dist[idx]<24)setSelected(idx);}drag=null;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.45,Math.min(3.5,zoom*Math.exp(-e.deltaY*.001)));render3d();},{passive:false});
 canvas.addEventListener('dblclick',()=>fit());
 new ResizeObserver(()=>render3d()).observe(canvas);
}
function fit(){azimuth=-.58;elevation=.78;zoom=1.0;render3d();}
function setLayout(x){layout=['split','plan','building','source'].includes(x)?x:'split';configureButtons();render3d();}
function setPanel(x){panel=x;if(panel==='boq'){$('measurements').closest('article').scrollIntoView({block:'nearest'});}document.dispatchEvent(new CustomEvent('project-drawing-state'));}
function setLevel(x){phase=x==='all'?'site':x;document.dispatchEvent(new CustomEvent('project-drawing-state'));}
async function start(){
 try{const response=await fetch(sourceUrl);if(!response.ok)throw Error('Source model HTTP '+response.status);model=await response.json();geometryCheck(model);outer=model.geometry.outer.vertices;inner=model.geometry.inner.vertices;
 $('svg-export').href=new URL(model.links.sourceSvg,root).href;$('dxf-export').href=new URL(model.links.sourceDxf,root).href;
 document.querySelectorAll('[data-layout]').forEach(b=>b.addEventListener('click',()=>setLayout(b.dataset.layout)));$('fit').addEventListener('click',fit);
 wire3d();configureButtons();renderPlan();render3d();renderDetail();
 window.ProjectDrawing={getState:()=>({ready:true,phase,layout,panel,componentCount:8,selectedId:'outer-side-'+selected,elements:outer.map((x,i)=>({id:'outer-side-'+i,name:describeSide(i),kind:'plot-boundary',status:'PDF_SOURCE_REVIEW'}))}),setPanel,setLevel,setLayout,fit};
 document.dispatchEvent(new CustomEvent('project-drawing-state'));
 }catch(error){$('plot-app').insertAdjacentHTML('afterbegin','<p role="alert" style="background:#fff0e8;padding:12px;border:1px solid #bd6b4b">Unable to load Plot 150 source-derived geometry. '+String(error.message||error).replace(/[<>]/g,'')+'</p>');}
}
void start();
