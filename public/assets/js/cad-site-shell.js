/* Simple project-first website navigation. Older tool navigation is preserved in the archived source branch. */
(()=>{"use strict";
 const source=document.currentScript;if(!source)return;
 const root=new URL(source.getAttribute("data-cad-root")||"./",document.baseURI);
 const path=slug=>new URL(slug,root).href;
 const normalized=u=>{let p=new URL(u,document.baseURI).pathname;if(p.endsWith("index.html"))p=p.slice(0,-10);return p.endsWith("/")?p:p+"/";};
 const current=normalized(location.href);
 const nav=document.createElement("nav");nav.id="cad-global-navigation";nav.className="cad-global-nav";nav.setAttribute("aria-label","Main navigation");
 const link=(label,slug)=>{const a=document.createElement("a");a.textContent=label;a.href=path(slug);if(normalized(a.href)===current)a.setAttribute("aria-current","page");return a;};
 const skip=document.createElement("a");skip.className="cad-global-skip";skip.href="#cad-main-content";skip.textContent="Skip to content";nav.append(skip);
 const brand=link("JP CAD · Projects","");brand.className="cad-global-brand";nav.append(brand);
 const menu=document.createElement("div");menu.className="cad-global-links";
 for(const [label,slug] of [["Projects","projects/"],["Guide","guide/"]])menu.append(link(label,slug));
 nav.append(menu);document.body.insertBefore(nav,document.body.firstChild);
 const main=document.querySelector("main")||document.querySelector(".app")||document.querySelector(".wrap");
 if(main&&!main.id)main.id="cad-main-content";
 document.body.classList.add("cad-shell-ready");
})();