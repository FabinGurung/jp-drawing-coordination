import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.env.PROJECT_SITE_URL||'http://127.0.0.1:5191/JP_Computer-Aided-Drawings/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(root+'projects/ashok-adhikari/?edition=v3-7-option&panel=views&phase=gf&layout=split#views',{waitUntil:'domcontentloaded'});
  assert.equal(response?.status(),200);
  await page.waitForFunction(()=>window.ProjectWorkspace?.getDrawing()?.getState()?.ready,null,{timeout:65000});
  assert.equal(await page.locator('#pw-edition').inputValue(),'v3-7-option');
  const snapshot=await page.locator('#ashok-engine').evaluate(frame=>{
   const p=frame.contentWindow.AADStudio.getSnapshot();
   const manifest=p.manifest,e=manifest.presentation.elements;
   return {
    release:manifest.release.version,
    sourceModels:manifest.levels.map(l=>l.model),
    sourceArea:manifest.levels.map(l=>l.sourceArea),
    tank:manifest.services.assets[0],
    exteriorWC:manifest.services.siteFrame.outsideWCRect,
    routes:manifest.services.routes.length,
    tankElement:e.find(x=>x.id==='MEP-SEPTIC-V37-CONCEPT'),
    hatch:e.find(x=>x.id==='MEP-SEPTIC-V37-ACCESS-HATCH'),
    ids:e.map(x=>x.id),
    gfBath:p.models.gf.roomEnvelopes.find(x=>x.id==='GF-BATH')?.bbox,
    permissions:manifest.restrictions
   };
  });
  assert.equal(snapshot.release,'v3-7-owner-service-option');
  assert.equal(snapshot.tank.xMm,7562);assert.equal(snapshot.tank.yMm,4226);
  assert.equal(snapshot.tank.widthMm,2400);assert.equal(snapshot.tank.lengthMm,1100);
  assert.ok(snapshot.tankElement&&snapshot.hatch,'actual tank and visible hatch are in viewer model');
  assert.ok(snapshot.ids.includes('FIX-GF-WC'),'retained GF shared bath WC');
  assert.ok(!snapshot.ids.some(id=>id.startsWith('EXT-WC')||id==='MEP-SOAK'));
  assert.equal(snapshot.routes,0);
  assert.equal(snapshot.exteriorWC,null);
  assert.deepEqual(snapshot.gfBath,[0,6362,3600,10162]);
  assert.equal(snapshot.permissions.issueForConstruction,false);
  const frame=page.frameLocator('#ashok-engine');
  assert.equal(await frame.locator('#viewer3d canvas').isVisible(),true);
  assert.equal(await frame.locator('#viewer2d [data-mep-overlay]').count(),1);
  if(viewport.width<760)await page.locator('#pw-menu').click();
  await page.locator('#pw-edition').selectOption('v3-6');
  await page.waitForFunction(()=>window.ProjectWorkspace?.getDrawing()?.getState()?.ready
    &&document.querySelector('#pw-edition').value==='v3-6'
    &&window.ProjectWorkspace.getDrawing().getState().elements.some(e=>e.id?.endsWith(':MEP-SOAK')),null,{timeout:65000});
  const old=await page.locator('#ashok-engine').evaluate(f=>({release:f.contentWindow.AADStudio.getSnapshot().manifest.release.version,
    assets:f.contentWindow.AADStudio.getSnapshot().manifest.services.assets.map(x=>x.id)}));
  assert.equal(old.release,'v3-6-review');assert.deepEqual(old.assets,['SEPTIC','SOAK']);
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('ASHOK_V37_APPROVED_OPTION_2D_3D_BROWSER_PASS',viewport.width,'sumpOutfall','NOT_DESIGNED');
 }
}finally{await browser.close();}
