/**
 * A7/A9 AAD-14-AMRIT-P150-V004 — canonical Three.js source for Plot 150.
 * Source authority: same SHA-versioned SVG <metadata id="jp-cad-model"> used by 2D.
 * This file is mirrored as literal source text in one permanent native Google Doc.
 * Never edit house/room geometry independently here. Three.js 0.181.2 via local Vite package.
 * Review-only model: not for construction, permits, surveying, sanitation or structural design.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export function mountPlot150Three({canvas,model,onSelect}) {
  if (!canvas || !model?.geometry?.outer?.vertices) throw Error('Missing canonical plot source');
  const g=model.geometry;
  const house=g.house;
  const plan=house?.plan;
  const plotted=g.outer.vertices;
  const mean=(arr,index)=>arr.reduce((s,p)=>s+p[index],0)/arr.length;
  const cx=mean(plotted,0)/1000,cz=mean(plotted,1)/1000;
  const pt=p=>new THREE.Vector3(p[0]/1000-cx,0,cz-p[1]/1000);
  const fromLocal=p=>{
    if(!plan) throw Error('No v004 shared floorplan basis');
    const f=plan.frameMm;
    return [f.origin[0]+p[0]*f.uAxis[0]+p[1]*f.vAxis[0],
            f.origin[1]+p[0]*f.uAxis[1]+p[1]*f.vAxis[1]];
  };
  const corners=r=>[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]];
  const scene=new THREE.Scene();scene.background=new THREE.Color('#eaf1f4');
  const camera=new THREE.PerspectiveCamera(42,1,.08,160);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=false;
  canvas.dataset.renderer='threejs-0.181.2';
  scene.add(new THREE.HemisphereLight(0xffffff,0xb9c5d4,2.15));
  const sun=new THREE.DirectionalLight(0xffffff,1.85);sun.position.set(-6,17,9);scene.add(sun);
  const target=pt([mean(plotted,0),mean(plotted,1)]);
  target.y=.3;
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=5;controls.maxDistance=55;
  controls.minPolarAngle=.04;controls.maxPolarAngle=Math.PI/2-.045;
  controls.target.copy(target);
  const tint=new Map(); const pickables=[];let selection=null;
  const addPoly=(points,color,level=0,opacity=1,id=null)=>{
    const shape=new THREE.Shape();const pts=points.map(pt);
    shape.moveTo(pts[0].x,-pts[0].z);pts.slice(1).forEach(p=>shape.lineTo(p.x,-p.z));shape.closePath();
    const geometry=new THREE.ShapeGeometry(shape);
    const material=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:opacity<1,opacity,depthWrite:opacity>=1});
    const mesh=new THREE.Mesh(geometry,material);
    mesh.rotation.x=-Math.PI/2;mesh.position.y=level;mesh.userData.partId=id;
    scene.add(mesh);if(id){pickables.push(mesh);tint.set(id,{mesh,base:material.color.clone()});}return mesh;
  };
  const loop=(points,color,height=.075)=>{
    const positions=[];for(let i=0;i<points.length;i++){
      const a=pt(points[i]),b=pt(points[(i+1)%points.length]);positions.push(a.x,height,a.z,b.x,height,b.z);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    const line=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color}));scene.add(line);return line;
  };
  addPoly(plotted,'#f1f0e7',0,1,'SITE');
  loop(plotted,'#b33a46',.035);
  if(g.frontOnlySetback?.polygonMm){addPoly(g.frontOnlySetback.polygonMm,'#f4dbb7',.008,.93);loop(g.frontOnlySetback.polygonMm,'#c89a5e',.065);}
  const wallHeight=(plan?.wallHeightMmDisplayOnly||house?.displayHeightMm||2600)/1000;
  const addWall=(a,b,kind)=>{
    const A=pt(a),B=pt(b),delta=B.clone().sub(A),length=Math.hypot(delta.x,delta.z);
    const thickness=kind==='outer'?.16:.105;
    const geo=new THREE.BoxGeometry(length,wallHeight,thickness);
    const mat=new THREE.MeshStandardMaterial({color:kind==='outer'?'#637c85':'#8b9ca5',roughness:1,transparent:true,opacity:kind==='outer'?.87:.73,depthWrite:true});
    const wall=new THREE.Mesh(geo,mat);
    wall.position.set((A.x+B.x)/2,wallHeight/2,(A.z+B.z)/2);
    wall.rotation.y=-Math.atan2(delta.z,delta.x);
    scene.add(wall);
    const cap=wall.clone();cap.material=new THREE.MeshBasicMaterial({color:kind==='outer'?'#244b56':'#617886',transparent:true,opacity:.8});
    cap.scale.y=.018;cap.position.y=wallHeight;scene.add(cap);
  };
  function addLabel(str,point,size=1.12){
    const cv=document.createElement('canvas');cv.width=640;cv.height=130;
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,640,130);
    ctx.font='700 49px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#194150';ctx.fillText(str,320,65,610);
    const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
    sp.position.copy(pt(point));sp.position.y=.18;sp.scale.set(size,.23,1);sp.renderOrder=5;scene.add(sp);
  }
  if(plan){
    for(const room of plan.rooms){
      const poly=corners(room.rectLocalMm).map(fromLocal);
      const mesh=addPoly(poly,room.fill,room.containedIn?.035:.021,.97,room.id);
      mesh.userData.label=room.label;
      const r=room.rectLocalMm;
      let u=(r[0]+r[2])/2,v=(r[1]+r[3])/2;
      if(room.id==='BED-01'){u=2500;v=2100;}
      const label=room.label.split(' · ')[0];
      if(!['PASSAGE','REARHALL'].includes(room.id))addLabel(label,fromLocal([u,v]),room.id==='BATH-01'?1.12:1.65);
    }
    const shell=house.polygonMm;loop(shell,'#256754',.095);
    for(const w of plan.wallSegments)addWall(fromLocal(w.aLocalMm),fromLocal(w.bLocalMm),w.kind);
    // Nine visually stepped treads are a staircase illustration, NOT a riser/tread schedule.
    for(let i=0;i<9;i++){
      const v=4380+i*284,center=fromLocal([1220,v]);const xz=pt(center);
      const step=new THREE.Mesh(new THREE.BoxGeometry(2.16,.12+i*.14,.235),new THREE.MeshStandardMaterial({color:'#9ba3c7',roughness:.86}));
      step.position.set(xz.x,(.12+i*.14)/2+.04,xz.z);
      step.rotation.y=-Math.atan2(-plan.frameMm.uAxis[1],plan.frameMm.uAxis[0]);scene.add(step);
    }
  }else if(house?.rectMm){
    const points=corners(house.rectMm);
    addPoly(points,'#c0d8cd',.02,.97,house.id);
    const y=(house.displayHeightMm||4500)/1000;
    for(let i=0;i<4;i++)addWall(points[i],points[(i+1)%4],'outer');
    addLabel('Historic concept',[(house.rectMm[0]+house.rectMm[2])/2,(house.rectMm[1]+house.rectMm[3])/2],2.1);
    for(const zone of g.reservedUndergroundZones||[]){addPoly(corners(zone.rectMm),'#9cc5de',.025,.75,zone.id);}
  }else if(g.inner?.vertices){addPoly(g.inner.vertices,'#c7e3da',.02,.9);loop(g.inner.vertices,'#2a7c86',.09);}
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down=null;
  function pointerDown(e){down={x:e.clientX,y:e.clientY};}
  function pointerUp(e){
    if(!down)return;const d=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;if(d>6)return;
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    mouse.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height*2-1));
    ray.setFromCamera(mouse,camera);
    const hit=ray.intersectObjects(pickables,false).find(x=>x.object.userData.partId&&x.object.userData.partId!=='SITE');
    if(hit)onSelect?.(hit.object.userData.partId);
  }
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);
  const fit=()=>{
    controls.target.copy(target);
    camera.position.set(target.x+10,target.y+17,target.z+23);
    camera.lookAt(target);controls.update();
  };
  fit();
  function select(id){selection=id;for(const [key,t] of tint)t.mesh.material.color.copy(t.base).multiplyScalar(key===id?1.08:1);}
  const resize=()=>{const r=canvas.getBoundingClientRect();if(r.width<3||r.height<3)return;
    renderer.setSize(Math.floor(r.width),Math.floor(r.height),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  let alive=true,handle=null;
  function tick(){if(!alive)return;handle=requestAnimationFrame(tick);if(document.visibilityState==='hidden')return;controls.update();resizeIfNeeded();renderer.render(scene,camera);}
  let previousWidth=-1,previousHeight=-1;
  function resizeIfNeeded(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w!==previousWidth||h!==previousHeight){previousWidth=w;previousHeight=h;resize();}}
  tick();
  function dispose(){alive=false;if(handle!=null)cancelAnimationFrame(handle);observer.disconnect();
    canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);
    controls.dispose();scene.traverse(obj=>{if(obj.geometry?.dispose)obj.geometry.dispose();const materials=obj.material?(Array.isArray(obj.material)?obj.material:[obj.material]):[];for(const m of materials){if(m.map?.dispose)m.map.dispose();m.dispose?.();}});renderer.dispose();}
  window.addEventListener('pagehide',dispose,{once:true});
  return {setSelection:select,fit,resize,dispose,scene,camera,renderer,controls};
}
