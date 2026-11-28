import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';
const projects=JSON.parse(fs.readFileSync('public/data/projects.json','utf8')).projects;
const base=process.env.PROJECT_SITE_URL||'http://127.0.0.1:5191/JP_Computer-Aided-Drawings/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 for(const width of [390,1440])for(const {slug,href} of projects){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await page.goto(new URL(href,base).href,{waitUntil:'domcontentloaded'})).status(),200);
  await page.locator('.pw-top').waitFor();
  assert.equal(await page.locator('body').getAttribute('data-entry-template'),'client-1.6');
  assert.equal(await page.locator('body').getAttribute('data-studio-template'),'standard-client-v1');
  assert.equal(await page.locator('body').getAttribute('data-project'),slug);
  assert.equal(await page.locator('body > nav').count(),0,'No project-specific audit banner');
  assert.equal(await page.locator('body').getAttribute('data-client-theme'),slug==='14-amrit-hardware-1'?'monochrome':'standard');
  if(['js-buddha-jewelers','ramachandra-devkota'].includes(slug)){
   await page.locator('#pw-content').getByText('Floor plan pending').waitFor();
   assert.match(await page.locator('#pw-content').innerText(),/3D model pending/);
  }else{
   await page.waitForFunction(()=>window.ProjectWorkspace?.getDrawing()?.getState().ready,null,{timeout:60000});
   const state=await page.evaluate(()=>window.ProjectWorkspace.getDrawing().getState());
   assert.ok(state.componentCount>0||state.elements?.length>0,'Actual model components required');
   if(slug==='14-amrit-hardware-1')assert.equal(state.threeStatus,'THREEJS');
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Mobile/desktop overflow '+slug);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'/tmp/client-template-'+slug+'-'+width+'.png'});
  console.log('CAD_SIX_PROJECT_TEMPLATE_PASS',slug,width);
  await page.close();
 }
}finally{await browser.close();}
