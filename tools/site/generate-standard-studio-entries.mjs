// All real project front doors are generated from one client template.
import fs from 'node:fs';
import path from 'node:path';
import {PROJECTS,ALL_WORKSPACE_PROJECTS} from '../../public/assets/js/project-workspace-config.mjs';
const template=fs.readFileSync('governance/aad/studio-project-entry.v1.html','utf8');
const registry=JSON.parse(fs.readFileSync('public/data/projects.json','utf8')).projects;
const html=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const registered=registry.map(p=>p.slug).sort(), configured=Object.keys(PROJECTS).sort();
if(new Set(registered).size!==registered.length||JSON.stringify(registered)!==JSON.stringify(configured))throw Error('Registry/config mismatch');
let generated=0,unchanged=0;
for(const slug of registered){
 const project=PROJECTS[slug];
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Unsafe project route '+slug);
 const theme=project.clientTheme||'standard';
 if(!['standard','monochrome'].includes(theme))throw Error('Unsupported client theme '+theme);
 const target=path.join('public','projects',slug,'index.html');
 const expected=template.replaceAll('{{PROJECT_SLUG}}',slug).replaceAll('{{PROJECT_TITLE}}',html(project.name)).replaceAll('{{PROJECT_THEME}}',theme);
 const previous=fs.existsSync(target)?fs.readFileSync(target,'utf8'):null;
 if(previous===expected){unchanged++;continue;}
 if(process.argv.includes('--check'))throw Error('Regenerate '+target);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,expected,'utf8');generated++;
}
// Keep the fictional test route in staging only. Its deployed route is retired.
if(!ALL_WORKSPACE_PROJECTS['example-empty']?.synthetic)throw Error('Missing fictional test contract');
console.log('CAD_CLIENT_ENTRY_TEMPLATE',JSON.stringify({registered:registered.length,generated,unchanged}));
