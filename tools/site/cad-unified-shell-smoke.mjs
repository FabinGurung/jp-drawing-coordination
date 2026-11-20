/** Cross-page product navigation QA: no changes to historical project engines. */
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const prefix=process.env.CAD_SITE_URL || "http://127.0.0.1:5177/";
const routes=[
 ["","CAD home"],["cad/aad/","AI Design Studio"],["cad/brief/","Language preview"],
 ["cad/","CAD Studio"],["guide/","How It Works"],["projects/","Projects"],
 ["projects/narayani-parajuli/","Narayani public hub"],
 ["projects/ramachandra-devkota/","Ramachandra public hub"],
 ["research/","Research"],["research/open-architecture-engine/","Research archive"],
 ["research/open-architecture-engine/v0.2/","Research v0.2"],
 ["releases/","Releases"],["source/","Sources"]];
try{
 const p=await browser.newPage({viewport:{width:1366,height:920}});
 const errors=[];p.on("pageerror",e=>errors.push(e.message));
 for(const [route,title] of routes){
  const response=await p.goto(new URL(route,prefix).href,{waitUntil:"domcontentloaded",timeout:45000});
  if(!response||response.status()>=400)throw Error(title+" route unavailable: "+response?.status());
  if(await p.locator('body[data-project]').count()){
   await p.locator('.pw-top').waitFor({timeout:12000});
   if(await p.locator('link[href*="project-workspace.css"]').count()!==1)throw Error(title+' missing shared project stylesheet');
   if(await p.locator('.pw-chapter-bar [role=tab]').count()!==5)throw Error(title+' missing common chapters');
   if(await p.locator('#pw-edition option').count()<1)throw Error(title+' missing source edition');
   if(await p.locator('.pw-top-links a[href$="/projects/"]').count()!==1)throw Error(title+' missing return to project library');
   continue;
  }
  await p.locator("#cad-global-navigation").waitFor({timeout:12000});
  // Theme stylesheet and global navigation are installed by deferred shell script.
  // Wait for exactly one linked stylesheet instead of racing the first DOM placeholder.
  await p.waitForFunction(()=>document.querySelectorAll('link[href*="cad-unified-theme.css"]').length===1,null,{timeout:15000});
  const sheet=await p.locator('link[href*="cad-unified-theme.css"]').count();
  if(sheet!==1)throw Error(title+" missing one shared stylesheet");
  // The shell is inserted by a deferred script. A partial/placeholder nav can
  // appear before its nested anchors are initialized under a busy CI browser.
  await p.waitForFunction(()=>document.querySelectorAll("#cad-global-navigation a").length>=7,null,{timeout:15000});
  const menu=await p.locator("#cad-global-navigation a").count();
  if(menu<7)throw Error(title+" missing global navigation");
  if(await p.locator('#cad-global-navigation .cad-global-links > a[href$="/cad/"]').count()!==0)
    throw Error(title+" incorrectly promotes legacy CAD editor to primary navigation");
  if(await p.locator('#cad-global-navigation .cad-global-links > a[href$="/cad/brief/"]').count()!==0)
    throw Error(title+" incorrectly promotes legacy mass preview to primary navigation");
 }
 await p.goto(prefix,{waitUntil:"networkidle"});
 await p.locator("#projects").waitFor();
 if(await p.locator("#capabilities").count()!==0)throw Error("Deprecated prototype disclosure is still promoted");
 if(await p.locator('#cad-global-navigation .cad-global-more').count()!==0)throw Error("Developer More menu is still promoted");
 if(await p.locator('#cad-global-navigation a[href$="/cad/aad/"]').count()!==0)throw Error("Standalone editor should not be a primary route");
 await p.locator("#cards .project-card").first().waitFor({timeout:12000});
 await p.locator("#projectSearch").fill("narayani");
 if(await p.locator("#cards .project-card").count()!==1)throw Error("Client project search broken");
 if(await p.locator("#cards .project-card .stage").first().innerText()!=="Fishtail Builders")throw Error("Backend IDs leaked into public card");
 if((await p.locator("#cad-global-navigation .cad-global-links > a").count())<4)throw Error("Project navigation incomplete");
 if(errors.length)throw Error("Page errors: "+JSON.stringify(errors));
 await p.screenshot({path:"/tmp/cad-project-first-home.png",fullPage:true});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await mobile.goto(prefix,{waitUntil:"networkidle"});
 await mobile.locator("#cad-global-navigation").waitFor();
 const noOverflow=await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+5);
 if(!noOverflow)throw Error("Mobile dashboard horizontal overflow");
 await mobile.screenshot({path:"/tmp/cad-project-first-mobile.png",fullPage:true});
 console.log("CAD_PROJECT_FIRST_NAV_QA_PASS",JSON.stringify({routes:routes.length,search:"narayani",mobileOverflow:false}));
 await mobile.close();await p.close();
}finally{await browser.close();}
