import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.env.PROJECT_SITE_URL||'http://127.0.0.1:5191/JP_Computer-Aided-Drawings/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url=root+'projects/ashok-adhikari/?edition=v3-4&panel=views&phase=gf&layout=split#views';
  const response=await page.goto(url,{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>window.ProjectWorkspace?.getDrawing()?.getState()?.ready,null,{timeout:65000});
  assert.equal(await page.locator('#pw-edition').inputValue(),'v3-4');
  const proof=await page.locator('#ashok-engine').evaluate(frame=>{
   const snapshot=frame.contentWindow?.AADStudio?.getSnapshot();
   const m=snapshot?.manifest;
   const site=Object.fromEntries((m?.presentation?.elements||[]).filter(e=>['SITE-PLOT','SITE-PATH','SITE-CAR-DOLPHIN','EXT-WC-B'].includes(e.id)).map(e=>[e.id,{z:e.z,dz:e.dz}]));
   return {version:m?.release?.version,limits:m?.presentation?.plotBounds,site,
    origin:m?.presentation?.coordinateGrid?.plotOriginMm,front:m?.sitePlacementReview?.after?.frontSetbackMm,
    rear:m?.sitePlacementReview?.after?.rearSetbackMm,stair:m?.presentation?.roofAccess?.risers,
    floorCount:snapshot?.models?.gf?.floorGraph?.walls?.length,
    floorNodeCount:snapshot?.models?.ff?.floorGraph?.nodes?.length};
  });
  assert.equal(proof.version,'v3-4-review');
  assert.deepEqual(proof.limits,[-1.944,-1.524,7.2,16.764]);
  assert.deepEqual(proof.origin,[1944,2364]);
  assert.equal(proof.front,2364);
  assert.equal(proof.rear,1524);
  assert.ok(Math.abs(proof.site['SITE-PLOT'].z-7.62)<.00001);
  assert.ok(Math.abs(proof.site['EXT-WC-B'].z-(-1.449))<.00001);
  assert.ok(proof.floorCount>10&&proof.floorNodeCount>10);
  const iframe=page.frameLocator('#ashok-engine');
  assert.equal(await iframe.locator('#viewer2d [data-column-axis-overlay]').count(),1);
  assert.equal(await iframe.locator('#viewer3d canvas').isVisible(),true);
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('ASHOK_V3_4_5FT_BROWSER_PASS',viewport.width,proof.rear,proof.front);
 }
}finally{await browser.close()}
