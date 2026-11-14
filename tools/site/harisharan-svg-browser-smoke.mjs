import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.PROJECT_SITE_URL||'http://127.0.0.1:5191/jp-drawing-coordination/';
const url=new URL('projects/harisharan-adhikari/below-plinth-svg/',base).href;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 for(const [label,width,height] of [['mobile',390,844],['desktop',1440,900]]){
  const page=await browser.newPage({viewport:{width,height},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const res=await page.goto(url,{waitUntil:'domcontentloaded'});
  assert.equal(res?.status(),200,url);
  await page.waitForFunction(()=>document.querySelector('#count')?.textContent.includes('115 of 115'),null,{timeout:20000});
  assert.equal(await page.locator('#members button').count(),115);
  assert.match(await page.locator('h1').innerText(),/Below-plinth individual SVG/);
  const families={PB:27,ST:12,COL:18,PAD:18,PCC:18,DOWEL:18,HOLD:4};
  for(const [family,count] of Object.entries(families)){
   await page.locator('#category').selectOption(family);
   assert.equal(await page.locator('#members button').count(),count,'family '+family);
  }
  await page.locator('#category').selectOption('');
  await page.locator('#search').fill('PB-A1-B1');
  assert.equal(await page.locator('#members button').count(),1);
  await page.locator('#members button').first().click();
  assert.equal(await page.locator('#selected').innerText(),'PB-A1-B1');
  await page.waitForFunction(()=>document.querySelector('#preview')?.complete&&document.querySelector('#preview')?.naturalWidth>0);
  assert.match(await page.locator('#metadata').innerText(),/A1 to B1/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'horizontal overflow '+width);
  const imageResponse=await page.request.get(new URL('sheets/PB-A1-B1.svg',url).href);
  assert.equal(imageResponse.status(),200);
  assert.match(await imageResponse.text(),/ENGINEERING HOLD - NOT FOR CONSTRUCTION/);
  await page.screenshot({path:'/tmp/harisharan-svg-review-'+label+'-plinth.png',fullPage:true});
  await page.locator('#search').fill('PAD-B1');
  await page.locator('#members button').first().click();
  await page.waitForFunction(()=>document.querySelector('#preview')?.complete&&document.querySelector('#preview')?.naturalWidth>0);
  assert.equal(await page.locator('#selected').innerText(),'PAD-B1');
  await page.screenshot({path:'/tmp/harisharan-svg-review-'+label+'-footing.png',fullPage:true});
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('#preview').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('HARISHARAN_SVG_BROWSER_QA_PASS',label,JSON.stringify(families));
  await page.close();
 }
}finally{await browser.close()}
