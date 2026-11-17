import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='public/data/projects/ashok-adhikari/';
const load=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const model=load('aad-building-v3-6-review.json');
const gf=load('aad-gf-model-v3-6-review.json');
const old=load('v3-6-site-services-feasibility-r000001.json');
const study=load('v3-6-underfootprint-services-review-r000002.json');
const eq=(a,b,label)=>assert.deepEqual(a,b,label);
eq(study.sourceGeometry.nominalSiteRectMm,[0,0,9144,18288],'nominal site');
eq(study.sourceGeometry.houseBoundingRectMm,model.services.siteFrame.plinthRect,'current plinth/site envelope');
eq(study.sourceGeometry.exteriorWcRectMm,model.services.siteFrame.outsideWCRect,'unmoved exterior WC');
const parking=gf.roomEnvelopes.find(r=>r.id==='GF-PARK');
assert.ok(parking,'missing reference internal car porch');
eq(study.sourceGeometry.gfParkSourceRoomBboxMm,parking.bbox,'floor graph room bbox preserved');
const p=parking.bbox;
const x=model.services.siteFrame.buildingOffsetX;
const zOrigin=model.services.siteFrame.plinthRect[3];
eq(study.sourceGeometry.gfParkConvertedPlotRectMm,
 [x+p[0],model.services.siteFrame.plinthRect[1]+p[1]-762,x+p[2],model.services.siteFrame.plinthRect[1]+p[3]-762],
 'front-relative graph to site bbox');
eq(study.sourceGeometry.gfParkSiteCentreMm,[7562,4226],'site centre based on rendered GF-PARK-FINISH');
assert.equal(study.sourceGeometry.gfParkWorldZCenterMm,12538);
assert.match(study.sourceGeometry.gfParkLocationDiscrepancy,/CORRECTED/);
assert.match(study.sourceGeometry.footingLayout,/MISSING/);
assert.match(study.status,/REVIEW_ONLY/);
const comps=Object.fromEntries(study.components.map(o=>[o.id,o]));
eq(Object.keys(comps).sort(),['D1','D2','D3','D4']);
assert.match(comps.D1.codeScreen,/OPEN_TO_SKY/);
assert.match(comps.D1.engineeringStatus,/NOT_APPROVED/);
assert.match(comps.D2.engineeringStatus,/DO_NOT_ADVANCE/);
assert.match(comps.D2.codeScreen,/CLAUSE_5_3/);
assert.match(comps.D3.engineeringStatus,/OWNER_REVIEW/);
assert.match(comps.D4.engineeringStatus,/INVESTIGATE/);
for (const o of study.components) assert.ok(!Array.isArray(o.proposedPosition) && !o.positionMm,
 'No unsupported spatial coordinates may enter under-footprint candidate '+o.id);
assert.equal(study.clearanceDecision.constructionIssued,false);
assert.match(study.clearanceDecision.municipal2083,/UNVERIFIED/);
assert.ok(study.technicalSources.some(o=>o.clause==='3.3.1' && /NOT_PROVEN/.test(o.sourceStatus)));
assert.ok(study.technicalSources.some(o=>o.clause==='5.3' && /NOT_PROVEN/.test(o.sourceStatus)));
assert.equal(model.restrictions.issueForConstruction,false);
assert.match(old.status,/MUNICIPAL_SETBACK_HOLD/);
const route=fs.readFileSync('public/projects/ashok-adhikari/service-study/index.html','utf8');
assert.ok(route.includes('id="under-footprint-review"'),'Owner proposal not visible in study UI');
assert.ok(route.includes('R000002 machine-readable review'),'R000002 not linked');
assert.ok(route.includes('NO APPROVED UNDER-SLAB LOCATION'),'Under-building construction hold missing');
for (const path of ['v3-6-site-services-feasibility-r000001.json','v3-6-underfootprint-services-review-r000002.json']){
 const text=fs.readFileSync(dir+path,'utf8');
 assert.ok(!/drive[.]google|docs[.]google|drive.?id|sandbox:|sediment:/i.test(text),'Private provider identifier found: '+path);
}
console.log('ASHOK_UNDERFOOTPRINT_SITING_REVIEW_PASS',JSON.stringify({
 sourceEdition:'v3-6',proposals:Object.keys(comps),
 foundation:'NOT_ADMITTED',septic:'SPECIAL_REVIEW_ONLY',
 soak:'NOT_APPROVED_UNDER_FOUNDATION',municipality:'2083_CONTENT_UNVERIFIED',
 geometryMutation:false
}));
