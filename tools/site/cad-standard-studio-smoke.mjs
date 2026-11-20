import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ALL_WORKSPACE_PROJECTS,CHAPTERS} from '../../public/assets/js/project-workspace-config.mjs';
const js='public/assets/js/project-workspace.mjs',css='public/assets/css/project-workspace.css';
const engine=fs.readFileSync(js,'utf8'),style=fs.readFileSync(css,'utf8');
assert.deepEqual(CHAPTERS.map(x=>x[0]),['views','boq','packages','sources','more']);
assert.ok(engine.includes("const ashokWorkspace=true;"),'standard reader must be enabled across projects');
assert.ok(engine.includes("dataset.studioTemplate='standard-client-v1'"));
assert.ok(style.includes('body[data-studio-template="standard-client-v1"]'));
const projects=Object.keys(ALL_WORKSPACE_PROJECTS);
assert.ok(projects.length>=6,'all project readers, including synthetic example');
for(const slug of projects){
 const file='public/projects/'+slug+'/index.html';
 assert.ok(fs.existsSync(file),'No public reader route: '+slug);
 const html=fs.readFileSync(file,'utf8');
 assert.ok(html.includes('data-project="'+slug+'"'),'Wrong project data: '+slug);
 assert.ok(html.includes('../../assets/js/project-workspace.mjs'),'Missing shared engine: '+slug);
 assert.ok(html.includes('../../assets/css/project-workspace.css'),'Missing shared client CSS: '+slug);
 assert.equal((html.match(/project-workspace[.]mjs/g)||[]).length,1,'Duplicate studio engine: '+slug);
 assert.ok(ALL_WORKSPACE_PROJECTS[slug].editions?.length,'No edition/source boundary: '+slug);
 assert.ok(ALL_WORKSPACE_PROJECTS[slug].sourceGroups?.length,'No project sources: '+slug);
}
const entry=fs.readFileSync('governance/aad/studio-project-entry.v1.html','utf8');
assert.ok(entry.includes('{{PROJECT_SLUG}}')&&entry.includes('../../assets/js/project-workspace.mjs'));
assert.ok(engine.includes("edition.engine==='harisharan'"),'Preserve specialist engineering adapter');
assert.ok(engine.includes("slug==='ashok-adhikari'?'<a href="),'Keep special Ashok final drawing link');
console.log('CAD_STANDARD_STUDIO_SINGLE_SOURCE_PASS',JSON.stringify({projectRoutes:projects}));
