import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function jpAadMode({APP,WebIFC,IfcModel,quiet}) {
  const src=JSON.parse(fs.readFileSync(process.env.JP_SYNTHETIC_MODEL,'utf8'));
  assert.equal(src.units,'mm');
  const s=src.storeys[0];
  const N=await import(path.join(APP,'new-model.js'));
  const MW=await import(path.join(APP,'model-walls.js'));
  const OPS=await import(path.join(APP,'model-ops.js'));
  const {IfcEditor}=await import(path.join(APP,'ifc-edit.js'));
  const near=(a,b,e=.01)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
  const checks=[];
  const check=(label,fn)=>{fn();checks.push(label);console.log('JP PASS '+label);};
  const engine=await quiet(IfcModel.create)(WebIFC,null);
  await quiet(b=>engine.load(b))(new TextEncoder().encode(N.newBuilding({name:'JP synthetic POC only',levels:N.stackLevels(1,s.height_mm,()=>s.storey_id),fileName:'jp-synthetic.ifc',now:new Date('2026-11-27T00:00:00Z')})));
  const ed=new IfcEditor(WebIFC,engine);
  const level=OPS.snapshotModel(ed).levels[0].guid;
  const ids=new Map();
  for(const w of s.walls){
    const typeKey=MW.typeAt('concrete-200',w.thickness_mm);
    assert.ok(typeKey);
    const r=ed.modelChange(OPS.drawWalls({storey:level,segs:[{a:w.start_mm,b:w.end_mm}],typeKey,height:w.height_mm}));
    assert.equal(r.ids.length,1);
    const found=OPS.snapshotModel(ed).walls.find(x=>Math.abs(x.a[0]-w.start_mm[0])<.01 && Math.abs(x.a[1]-w.start_mm[1])<.01);
    assert.ok(found);
    ids.set(w.element_id,found.guid);
  }
  check('wall counts, centerlines, thickness, height',()=>{
    const walls=OPS.snapshotModel(ed).walls;assert.equal(walls.length,s.walls.length);
    for(const w of s.walls){const x=walls.find(y=>y.guid===ids.get(w.element_id)); assert.ok(x);near(x.t,w.thickness_mm);near(x.height,w.height_mm);x.a.forEach((v,i)=>near(v,w.start_mm[i]));x.b.forEach((v,i)=>near(v,w.end_mm[i]));}
  });
  const openIds=new Map();
  for(const o of s.openings){
    ed.modelChange(OPS.placeOpening({wall:ids.get(o.wall_id),typeKey:o.kind==='door'?'door-single':'win-fixed',offset:o.offset_mm,width:o.width_mm,height:o.height_mm,sill:o.sill_mm,face:'left'}));
    const x=OPS.snapshotModel(ed).openings.find(y=>y.wallGuid===ids.get(o.wall_id)&&y.kind===o.kind);
    assert.ok(x);openIds.set(o.element_id,x.guid);
  }
  const verify=(editor,widthDelta=0)=>{
    const snap=OPS.snapshotModel(editor);assert.equal(snap.walls.length,s.walls.length);assert.equal(snap.openings.length,s.openings.length);
    for(const w of s.walls)assert.ok(snap.walls.some(x=>x.guid===ids.get(w.element_id)));
    for(const o of s.openings){const x=snap.openings.find(y=>y.guid===openIds.get(o.element_id));assert.ok(x);assert.equal(x.wallGuid,ids.get(o.wall_id));near(x.offset,o.offset_mm);near(x.width,o.width_mm+(o.kind==='window'?widthDelta:0));near(x.height,o.height_mm);near(x.sill,o.sill_mm);}
  };
  check('hosted opening dimensions and host relationships',()=>verify(ed));
  const win=s.openings.find(o=>o.kind==='window');
  ed.modelChange(OPS.changeOpening(openIds.get(win.element_id),{width:win.width_mm+100}));
  check('window mutation retains identities',()=>verify(ed,100));
  ed.undo();check('undo restores original',()=>verify(ed));
  ed.redo();check('redo restores mutation',()=>verify(ed,100));
  ed.undo();
  const bytes=ed.save();
  const e2=await quiet(IfcModel.create)(WebIFC,null);
  await quiet(b=>e2.load(b))(bytes);
  check('IFC save and native reopen preserve walls, hosts, opening identities',()=>verify(new IfcEditor(WebIFC,e2)));
  fs.mkdirSync(process.env.JP_EVIDENCE,{recursive:true});
  fs.writeFileSync(path.join(process.env.JP_EVIDENCE,'jp-synthetic.ifc'),bytes);
  fs.writeFileSync(path.join(process.env.JP_EVIDENCE,'bimcraft-jp-receipt.json'),JSON.stringify({source:src.project_id,checks,wallIds:Object.fromEntries(ids),openingIds:Object.fromEntries(openIds),limitations:['Slab, full IFC oracle comparison, SVG/DXF/glTF equivalence and BCF not covered by this targeted test.']},null,2));
  return 0;
}
