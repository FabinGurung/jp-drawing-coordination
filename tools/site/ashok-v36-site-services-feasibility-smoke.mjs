import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='public/data/projects/ashok-adhikari/';
const load=n=>JSON.parse(fs.readFileSync(base+n,'utf8'));
const model=load('aad-building-v3-6-review.json');
const prior=load('v3-6-engineering-debt-review-20261117.json');
const study=load('v3-6-site-services-feasibility-r000001.json');
const eq=(a,b,name)=>assert.deepEqual(a,b,name);
const near=(a,b,tolerance=0.03)=>assert.ok(Math.abs(a-b)<=tolerance,`Mismatch ${a} vs ${b}`);
const rect=(cx,cy,w,h)=>[cx-w/2,cy-h/2,cx+w/2,cy+h/2];
const intersection=(a,b)=>[Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0])),Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]))];
const intersects=(a,b)=>{const [x,y]=intersection(a,b);return x>0&&y>0};
const euclideanGap=(a,b)=>Math.hypot(Math.max(0,a[0]-b[2],b[0]-a[2]),Math.max(0,a[1]-b[3],b[1]-a[3]));
const minBoundary=(r,plot)=>Math.min(r[0]-plot[0],r[1]-plot[1],plot[2]-r[2],plot[3]-r[3]);
const f=model.services.siteFrame;
const plot=[0,0,f.widthMm,f.lengthMm];
eq(plot,[0,0,9144,18288],'nominal plot');
eq(f.plinthRect,study.coordinates.houseBoundingRect,'source house');
eq(f.outsideWCRect,study.coordinates.externalWcRect,'source exterior WC');
const vehicle=model.presentation.elements.find(e=>e.id==='SITE-CAR-DOLPHIN');assert.ok(vehicle);
const cx=(vehicle.x-model.presentation.sitePicker.originX)*1000;
const cy=(model.presentation.sitePicker.originZ-vehicle.z)*1000;
const car=rect(cx,cy,vehicle.dx*1000,vehicle.dz*1000);
eq(car,study.coordinates.carDisplayRect,'same displayed vehicle envelope');
const oldSeptic=model.services.assets.find(x=>x.id==='SEPTIC');
const oldSoak=model.services.assets.find(x=>x.id==='SOAK');
assert.ok(oldSeptic&&oldSoak);
const boxOf=a=>rect(a.xMm,a.yMm,a.widthMm,a.lengthMm);
eq(boxOf(oldSeptic),study.existing.septic.boundingRectMm);
eq(boxOf(oldSoak),study.existing.soak.boundingRectMm);
eq(intersection(boxOf(oldSeptic),f.plinthRect),prior.collisionFlags.find(x=>x.id==='SERV-01').overlapMm);
eq(intersection(boxOf(oldSoak),f.outsideWCRect),prior.collisionFlags.find(x=>x.id==='SERV-02').overlapMm);
eq(intersection(boxOf(oldSoak),f.plinthRect),prior.collisionFlags.find(x=>x.id==='SERV-03').overlapMm);
const screen=study.sizingScreen;
near(screen.septicRequiredLiquidStorageM3,
      screen.designFlowAssumedLPerDay/1000
      +.0425*screen.occupantsAssumed
      +.0708*screen.occupantsAssumed);
near(screen.septicRequiredLiquidStorageM3,oldSeptic.requiredLiquidM3);
assert.ok(oldSeptic.internalLiquidM3>screen.septicRequiredLiquidStorageM3);
near(screen.soakInfiltrationRequiredLPerM2Day,
    screen.designFlowAssumedLPerDay/(Math.PI*(oldSoak.internalDiameterMm/1000)*oldSoak.effectiveDepthM));
assert.equal(screen.soakInfiltrationAvailableLPerM2Day,null);
assert.equal(study.sourceAuthority.siteSurvey,'NOT_LOCATED_IN_INSPECTED_ASHOK_SOURCE_FOLDERS');
assert.equal(study.sourceAuthority.foundationPlan,'NOT_LOCATED_IN_INSPECTED_CAD_OR_STRUCTURAL_REPOSITORY');
for(const option of study.options.filter(x=>x.septic&&x.soak)){
 const tank=option.septic.rectMm,pit=option.soak.rectMm;
 const tankDims=option.id==='A'?[oldSeptic.widthMm,oldSeptic.lengthMm]:[oldSeptic.lengthMm,oldSeptic.widthMm];
 eq(tank,rect(...option.septic.centreMm,...tankDims),option.id+' septic bounds');
 eq(pit,rect(...option.soak.centreMm,oldSoak.widthMm,oldSoak.lengthMm),option.id+' soak bounds');
 for(const [label,r] of [['Septic',tank],['Soak',pit]]){
   assert.ok(minBoundary(r,plot)>=option.screeningMinimumGeometricGapMm,option.id+' plot '+label);
   assert.ok(euclideanGap(r,f.plinthRect)>=option.screeningMinimumGeometricGapMm,option.id+' building '+label);
   assert.ok(!intersects(r,f.outsideWCRect),option.id+' WC clash '+label);
 }
 assert.ok(!intersects(tank,pit),option.id+' tank/soak overlap');
 const d=option.drawnClearancesMm;
 eq([Math.round(euclideanGap(tank,f.plinthRect)),Math.round(euclideanGap(tank,car)),minBoundary(tank,plot)],
    [d.septic.buildingEnvelope,d.septic.displayCar,d.septic.propertyMin],option.id+' septic clearances');
 eq([Math.round(euclideanGap(pit,f.plinthRect)),Math.round(euclideanGap(pit,car)),minBoundary(pit,plot)],
    [d.soak.buildingEnvelope,d.soak.displayCar,d.soak.propertyMin],option.id+' pit clearances');
 eq(Math.round(euclideanGap(tank,pit)),d.septicToSoak,option.id+' separation');
 if(option.id==='A'){
   assert.ok(!intersects(tank,car)&&!intersects(pit,car),'A retains displayed car envelope only');
 }else{
   assert.ok(intersects(tank,car)&&intersects(pit,car),'B must flag both parking conflicts');
 }
 assert.match(option.engineeringEvaluation,/HOLD|APPROVAL/);
}
assert.equal(study.kind,'PRE_DESIGN_COORDINATION_ONLY_NOT_AN_ARCHITECTURAL_EDITION');
assert.equal(model.restrictions.issueForConstruction,false);
assert.ok(study.criticalUnknowns.length>=8);
console.log('ASHOK_V36_SITE_SERVICES_SCREEN_PASS',JSON.stringify({
 footprint:f.plinthRect,car,oldConflicts:prior.collisionFlags.map(x=>[x.id,x.overlapMm]),
 options:study.options.map(x=>({id:x.id,scenario:x.scenario,carConflict:x.parkingConflict??null})),
 requiredInfiltrationLPerM2Day:screen.soakInfiltrationRequiredLPerM2Day,
 status:study.status
}));
