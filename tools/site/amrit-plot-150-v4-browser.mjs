import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.PROJECT_SITE_URL||'http://127.0.0.1:5191/JP_Computer-Aided-Drawings/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(base+'projects/14-amrit-hardware-1/plot/',{waitUntil:'networkidle',timeout:60000});
 assert.equal(response.status(),200);
 await page.waitForFunction(()=>window.ProjectDrawing?.getState()?.ready,null,{timeout:60000});
 const status=await page.evaluate(()=>window.ProjectDrawing.getState());
 assert.equal(status.threeStatus,'THREEJS','Real WebGL Three.js must load');
 assert.equal(await page.locator('canvas#model3d').getAttribute('data-renderer'),'threejs-0.181.2');
 assert.ok(await page.locator('#plan image').count()>0,'2D canonical SVG not embedded');
 assert.ok(await page.locator('#plan polygon').count()>=8,'2D room hit regions missing');
 await page.locator('#plan polygon').last().click();
 assert.equal((await page.evaluate(()=>window.ProjectDrawing.getState())).selectedId,'BATH-01');
 assert.match(await page.locator('#selected-title').innerText(),/Attached bath/);
 await page.locator('[data-layout=building]').click();
 assert.equal(await page.locator('#model-pane').isVisible(),true);
 const before=await page.locator('#model3d').getAttribute('width');assert.ok(Number(before)>0);
 await page.locator('#fit').click();
 assert.deepEqual(errors,[]);
 console.log('PLOT150_V004_BROWSER_REAL_THREEJS_SVG_ROOM_SELECTION_PASS',status.threeStatus);
 await page.close();
}finally{await browser.close();}
