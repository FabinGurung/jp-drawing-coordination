import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.env.PROJECT_SITE_URL||'http://127.0.0.1:5191/JP_Computer-Aided-Drawings/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport,hasTouch:viewport.width<600,isMobile:viewport.width<600}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(root+'projects/ashok-adhikari/?edition=v3-5&panel=views&phase=gf&layout=split#views',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>window.ProjectWorkspace?.getDrawing()?.getState()?.ready,null,{timeout:65000});
  assert.equal(await page.locator('#pw-edition').inputValue(),'v3-5');
  const snap=await page.locator('#ashok-engine').evaluate(frame=>{
   const m=frame.contentWindow.AADStudio.getSnapshot();
   const gfWindow=m.models.gf.floorGraph.openings.find(x=>x.id==='GF-W008-C4-C2-OWNER-20261116');
   const ffWindow=m.models.ff.floorGraph.openings.find(x=>x.id==='FF-W009-C4-C2-OWNER-20261112');
   return {version:m.manifest.release.version,plot:m.manifest.presentation.plotBounds,site:m.manifest.services.siteFrame,
    markers:m.manifest.presentation.elements.filter(e=>e.kind==='column'&&/-4$/.test(e.id)).map(e=>e.z),
    axis4:m.manifest.presentation.columnAxisGrid.numberAxes.find(x=>x.label==='4').zMm,
    gfJoin:m.models.gf.floorGraph.nodes.find(n=>n.id==='GF-N010').z,
    ffJoin:m.models.ff.floorGraph.nodes.find(n=>n.id==='FF-N009').z,
    gfWindow,ffWindow,rooms:m.manifest.presentation.roomEnvelopes.GF};
  });
  assert.equal(snap.version,'v3-5-review');assert.equal(snap.axis4,4238);
  assert.equal(snap.gfJoin,4.238);assert.equal(snap.ffJoin,4.038);
  assert.equal(snap.site.buildingOffsetX,1817);
  assert.deepEqual(snap.site.plinthRect,[1817,2364,9017,16764]);
  assert.deepEqual(snap.plot,[-1.817,-1.524,7.327,16.764]);
  assert.equal(snap.markers.length,6);assert.ok(snap.markers.every(z=>z===4.238));
  assert.equal(snap.gfWindow.wallId,'GF-EXT-04-1');assert.equal(snap.ffWindow.wallId,'FF-EXT-04-1');
  assert.equal(snap.gfWindow.offset,snap.ffWindow.offset);
  assert.equal(snap.gfWindow.width,snap.ffWindow.width);
  assert.ok(snap.rooms.some(r=>r.id==='GF-BED1'&&r.bbox[1]===10162));
  const frame=page.frameLocator('#ashok-engine');
  assert.equal(await frame.locator('#viewer2d [data-column-axis-overlay]').count(),1,'Provisional axes visible independent of minor grid');
  assert.equal(await frame.locator('#viewer3d canvas').isVisible(),true);
  await page.locator('#pw-phase').selectOption('ff');
  await page.waitForFunction(()=>window.ProjectWorkspace.getState().phase==='ff',null,{timeout:10000});
  const windowId=await page.locator('#ashok-engine').evaluate(f=>f.contentWindow.AADStudio.getSnapshot().models.ff.floorGraph.openings.find(x=>x.id==='FF-W009-C4-C2-OWNER-20261112').id);
  assert.equal(windowId,'FF-W009-C4-C2-OWNER-20261112');
  assert.deepEqual(errors,[]);
  console.log('ASHOK_V3_5_BROWSER_PASS',viewport.width,JSON.stringify({axisMm:snap.axis4,rearMm:1524,rightMm:127,alignedWindows:true}));
  await page.close();
 }
}finally{await browser.close()}
