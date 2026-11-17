import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.env.PROJECT_SITE_URL||'http://127.0.0.1:5191/JP_Computer-Aided-Drawings/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(root+'projects/ashok-adhikari/?edition=v3-6&panel=views&phase=gf&layout=split#views',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>window.ProjectWorkspace?.getDrawing()?.getState()?.ready,null,{timeout:65000});
  assert.equal(await page.locator('#pw-edition').inputValue(),'v3-6');
  const state=await page.locator('#ashok-engine').evaluate(frame=>{
   const p=frame.contentWindow.AADStudio.getSnapshot();
   const get=(name,id)=>p.models[name].roomEnvelopes.find(x=>x.id===id).bbox;
   const win=name=>p.models[name].floorGraph.openings.find(x=>x.id===(name==='gf'?'GF-W008-C4-C2-OWNER-20261116':'FF-W009-C4-C2-OWNER-20261112'));
   const columns=p.manifest.presentation.elements.filter(x=>x.kind==='column'&&/-[1-5]$/.test(x.id));
   return {release:p.manifest.release.version,outline:p.manifest.presentation.outerBounds,
    site:p.manifest.services.siteFrame.plinthRect,
    axes:Object.fromEntries(p.manifest.presentation.columnAxisGrid.numberAxes.map(x=>[x.label,x.zMm])),
    rooms:{bath:get('gf','GF-BATH'),bed2:get('gf','GF-BED2'),main:get('ff','FF-MAIN'),lounge:get('ff','FF-LOUNGE')},
    windows:[win('gf'),win('ff')].map(w=>({offset:w.offset,width:w.width,host:w.wallId})),
    columns:columns.length,frontRoom:p.manifest.ownerCorrection20261117?.frontSetbackMm};
  });
  assert.equal(state.release,'v3-6-review');assert.deepEqual(state.outline,[0,0,7.2,13.638]);
  assert.equal(state.frontRoom,3126);
  assert.deepEqual(state.site,[1817,3126,9017,16764]);
  assert.deepEqual(state.axes,{'1':13488,'2':11438,'3':8038,'4':4238,'5':150});
  assert.deepEqual(state.rooms.bath,[0,6362,3600,10162]);
  assert.deepEqual(state.rooms.bed2,[0,2962,3600,6362]);
  assert.deepEqual(state.rooms.main,[0,10362,7200,14400]);
  assert.deepEqual(state.rooms.lounge,[3600,2962,7200,10362]);
  assert.equal(state.columns,28);
  assert.equal(state.windows[0].offset,state.windows[1].offset);
  assert.equal(state.windows[0].width,state.windows[1].width);
  const frame=page.frameLocator('#ashok-engine');
  assert.equal(await frame.locator('#viewer2d [data-column-axis-overlay]').count(),1);
  assert.equal(await frame.locator('#viewer3d canvas').isVisible(),true);
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('ASHOK_V3_6_CORRECTED_LIVE_BROWSER_PASS',viewport.width,'front',state.frontRoom,'line1',state.axes['1']);
 }
}finally{await browser.close()}
