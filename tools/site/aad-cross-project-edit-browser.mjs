/** Project workspace link and local request history: all currently listed projects. */
import assert from "node:assert/strict";
import {chromium} from "playwright";
const root=process.env.CAD_SITE_URL||"http://127.0.0.1:5191/JP_Computer-Aided-Drawings/"; // staging preview; production passes CAD_SITE_URL explicitly
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--use-gl=angle","--use-angle=swiftshader"]});
async function open(page,slug){
 const url=new URL("projects/"+slug+"/",root);
 const res=await page.goto(url.href,{waitUntil:"domcontentloaded",timeout:70000});
 assert(res?.ok(),"Missing workspace "+slug);
 await page.locator("#pw-edit-readiness").waitFor({state:"attached",timeout:30000});
 return url;
}
try{
 const page=await browser.newPage({viewport:{width:1400,height:900},acceptDownloads:true});
 const admitted={
  "ashok-adhikari":"/data/projects/ashok-adhikari/aad-building-v3-7-architectural-final.json",
  "narayani-parajuli":"/data/projects/narayani-parajuli/aad-building-v1.json"
 };
 for(const [slug,suffix] of Object.entries(admitted)){
  await open(page,slug);
  const link=page.locator("#pw-edit-direct");
  assert.equal(await link.isVisible(),false,slug+" technical editor stays machine-registered but hidden from the client interface");
  const href=await link.getAttribute("href"),url=new URL(href);
  assert(url.pathname.endsWith("/cad/aad/multistorey/"),"Must use one shared viewer");
  assert(url.searchParams.get("manifest").endsWith(suffix),"Wrong source model for "+slug);
  assert.equal(url.searchParams.get("workspace"),"standard");
  if(slug==="narayani-parajuli")assert.equal(url.searchParams.get("structure"),"source-review");
  assert.equal(await page.locator("#pw-request-status").textContent().then(s=>s.includes("0 local request(s)")),true);
 }
 await open(page,"ashok-adhikari");
 // Owner-approved v3.7 is the default ARCHITECTURAL VERSION. Frozen v3.6 and superseded v3.5 are independently selectable.
 await page.locator("#pw-edition").selectOption("v3-6");
 await page.waitForFunction(()=>document.getElementById("pw-edit-direct")?.href?.includes("aad-building-v3-6-review"));
 assert(new URL(await page.locator("#pw-edit-direct").getAttribute("href")).searchParams.get("manifest").endsWith("aad-building-v3-6-review.json"));
 await page.locator("#pw-edition").selectOption("v3-5");
 await page.waitForFunction(()=>document.getElementById("pw-edit-direct")?.href?.includes("aad-building-v3-5-review"));
 assert(new URL(await page.locator("#pw-edit-direct").getAttribute("href")).searchParams.get("manifest").endsWith("aad-building-v3-5-review.json"));
 await page.locator("#pw-edition").selectOption("v3-4");
 await page.waitForFunction(()=>document.getElementById("pw-edit-direct")?.href?.includes("aad-building-v3-4-review"));
 assert(new URL(await page.locator("#pw-edit-direct").getAttribute("href")).searchParams.get("manifest").endsWith("aad-building-v3-4-review.json"));
 await page.locator("#pw-edition").selectOption("v3-3");
 await page.waitForFunction(()=>document.getElementById("pw-edit-direct")?.href?.includes("aad-building-v3-3-review"));
 assert(new URL(await page.locator("#pw-edit-direct").getAttribute("href")).searchParams.get("manifest").endsWith("aad-building-v3-3-review.json"));
 await page.locator("#pw-edition").selectOption("v3-2");
 await page.waitForFunction(()=>document.getElementById("pw-edit-direct")?.href?.includes("aad-building-v3-2-review"));
 assert(new URL(await page.locator("#pw-edit-direct").getAttribute("href")).searchParams.get("manifest").endsWith("aad-building-v3-2-review.json"));
 await page.locator("#pw-edition").selectOption("v3-grid");
 await page.waitForFunction(()=>document.getElementById("pw-edit-direct")?.href?.includes("aad-building-v3-grid-review"));
 assert(new URL(await page.locator("#pw-edit-direct").getAttribute("href")).searchParams.get("manifest").endsWith("aad-building-v3-grid-review.json"),
 "Changing Ashok edition must retarget the model, not mix earlier client editions");
 const readOnly=["harisharan-adhikari","ramachandra-devkota","js-buddha-jewelers","example-empty"];
 for(const slug of readOnly){
  await open(page,slug);
  assert.equal(await page.locator("#pw-edit-direct").isVisible(),false,"Client editor must be hidden: "+slug);
  assert.equal(await page.locator("#pw-change-request").isVisible(),false,"Client request journal must be hidden: "+slug);
  assert.equal(await page.locator("#pw-edit-request-open").isVisible(),false,"Client technical action must be hidden: "+slug);
  assert.match(await page.locator("#pw-edit-readiness").textContent(),/SOURCE REVIEW HOLD/);
  const bundle=await page.evaluate(()=>window.ProjectWorkspace.getChangeRequests());
  assert.equal(bundle.projectSlug,slug);
  assert.equal(bundle.schema,"jp-cad://aad-project-change-requests/1");
 }
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await open(mobile,"narayani-parajuli");
 assert.equal(await mobile.locator("#pw-edit-request-open").isVisible(),false);
 assert.equal(await mobile.locator("#pw-change-request").isVisible(),false);
 console.log("AAD_PROJECT_WIDE_EDIT_ROUTE_PASS",JSON.stringify({admitted:Object.keys(admitted),sourceOnly:readOnly,editionRebinding:true,clientReadOnly:true,mobile:true}));
}finally{await browser.close();}
