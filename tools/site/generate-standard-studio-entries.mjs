// New public-safe projects inherit the single reader template at build time.
// Existing project front doors are never overwritten.
import fs from 'node:fs';
import path from 'node:path';
import {ALL_WORKSPACE_PROJECTS} from '../../public/assets/js/project-workspace-config.mjs';
const template=fs.readFileSync('governance/aad/studio-project-entry.v1.html','utf8');
const html=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let generated=0,preserved=0;
for(const [slug,project] of Object.entries(ALL_WORKSPACE_PROJECTS)){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Unsafe public route '+slug);
 const dir=path.join('public','projects',slug),target=path.join(dir,'index.html');
 if(fs.existsSync(target)){preserved++;continue;}
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(target,template.replaceAll('{{PROJECT_SLUG}}',slug).replaceAll('{{PROJECT_TITLE}}',html(project.name)),'utf8');
 generated++;
}
console.log('CAD_STANDARD_STUDIO_ENTRIES',JSON.stringify({generated,preserved}));
