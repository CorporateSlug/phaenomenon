// Run from the repository root: node --test tests/production-os.test.mjs
// No npm install required. Tests use Node's built-in VM and test runner.
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const script=readFileSync(new URL('../production-os.js',import.meta.url),'utf8');
function harness(state) {
  const storage=state||new Map(),handlers={},ui={innerHTML:'',contains:()=>true};
  let printed=false;
  const location={hash:'#/home'};
  const document={
    getElementById:id=>id==='production-app'?ui:null,
    addEventListener:(name,cb)=>{handlers[name]=cb;},
    querySelector:()=>null
  };
  const window={
    addEventListener:(name,cb)=>{handlers['window.'+name]=cb;},
    print:()=>{printed=true;}
  };
  class FormDataMock {
    constructor(form){this.data=form.values||{};}
    get(key){return this.data[key]??null;}
  }
  const sandbox={
    document,window,location,FormData:FormDataMock,
    localStorage:{
      getItem:key=>storage.get(key)||null,
      setItem:(key,value)=>storage.set(key,String(value))
    },
    alert:()=>{},confirm:()=>true,prompt:()=>'Example site discrepancy',setTimeout:()=>{},
    console,Date,Math,JSON,Map,Set,Array,Object,Number,String,Intl,encodeURIComponent,decodeURIComponent
  };
  runInNewContext(script,sandbox,{filename:'production-os.js'});
  const read=()=>JSON.parse(storage.get('phaenomenon-demo-v1'));
  const click=(act,id='')=>{
    const el={dataset:{act,id}};
    handlers.click({target:{closest:()=>el},preventDefault:()=>{}});
  };
  const submit=(id,values)=>{
    handlers.submit({target:{id,values},preventDefault:()=>{}});
  };
  const navigate=route=>{location.hash=route;handlers['window.hashchange']();};
  const change=target=>handlers.change({target});
  return {storage,ui,read,click,submit,navigate,change,get printed(){return printed;}};
}

test('migrates and connects canonical venue, stage and event records',()=>{
  const h=harness(),db=h.read(),o=db.productionOS;
  assert.ok(db.eventJobs.some(e=>e.id==='ev-abbotsford-two-stage-demo'));
  assert.ok(o.entities.some(e=>e.kind==='Venue'));
  assert.equal(o.entities.filter(e=>e.kind==='Space').length,2);
  assert.ok(o.entities.some(e=>e.kind==='Event'));
  assert.ok(o.relationships.some(r=>r.type==='Located within'));
  assert.ok(o.relationships.some(r=>r.type==='Takes place at'));
  assert.equal(o.assignments.length,4);
  assert.ok(o.published['ev-abbotsford-two-stage-demo'].tasks.length>0);
});

test('event-specific assignments do not duplicate an entity',()=>{
  const h=harness(),o=h.read().productionOS;
  const id=o.entities.find(e=>e.kind==='Person').id;
  const original=o.entities.length;
  h.navigate('#/production');
  h.submit('assign-form',{entityId:id,role:'DJ',areaId:'ab-indoor',responsibility:'Opening set'});
  assert.equal(h.read().productionOS.entities.length,original);
  assert.ok(h.read().productionOS.assignments.some(a=>a.entityId===id&&a.role==='DJ'&&a.areaId==='ab-indoor'));
});

test('crew completion and technical verification are separate states',()=>{
  const h=harness(),e='ev-abbotsford-two-stage-demo';
  const first=h.read().productionOS.published[e].tasks[0];
  h.click('installed',first.id);
  assert.equal(h.read().productionOS.published[e].tasks[0].state,'installed');
  h.click('verify',first.id);
  const t=h.read().productionOS.published[e].tasks[0];
  assert.equal(t.state,'verified');
  assert.ok(t.installedAt&&t.verifiedAt);
});

test('design drift remains unpublished until a new revision is created',()=>{
  const memory=new Map();
  const h=harness(memory),e='ev-abbotsford-two-stage-demo';
  const initial=h.read(),old=initial.productionOS.published[e];
  h.click('installed',old.tasks[0].id);
  const newer=h.read();
  const moved=old.tasks[0].sourceId;
  newer.venuePlans[e].items.find(i=>i.id===moved).x+=2;
  memory.set('phaenomenon-demo-v1',JSON.stringify(newer));
  const refreshed=harness(memory);
  refreshed.navigate('#/design');
  assert.match(refreshed.ui.innerHTML,/Pending revision: review the impact/);
  assert.match(refreshed.ui.innerHTML,/Equipment location or configuration changed/);
  assert.equal(refreshed.read().productionOS.published[e].revision,1);
  refreshed.click('publish');
  const latest=refreshed.read().productionOS.published[e];
  assert.equal(latest.revision,2);
  assert.equal(latest.history.length,1);
  assert.equal(latest.tasks.find(t=>t.sourceId===moved).state,'pending');
  assert.equal(latest.history[0].tasks.find(t=>t.sourceId===moved).state,'installed');
});

test('crew renders both schematic areas and offers printable packs',()=>{
  const h=harness();
  h.navigate('#/crew');
  assert.match(h.ui.innerHTML,/Indoor stage/);
  assert.match(h.ui.innerHTML,/Outdoor stage/);
  assert.match(h.ui.innerHTML,/Print area crew pack/);
  h.click('print');
  assert.equal(h.printed,true);
});

test('draft looks can be linked to production cue descriptions',()=>{
  const h=harness(),e='ev-abbotsford-two-stage-demo';
  h.submit('look-form',{name:'Soft blue opening',areaId:'ab-outdoor',color:'#4477dd',intensity:'60',effect:'Slow fade',notes:'Demo'});
  const look=h.read().productionOS.looks[e][0];
  assert.equal(look.name,'Soft blue opening');
  h.submit('cue-form',{time:'19:30',title:'Outdoor act begins',areaId:'ab-outdoor',lookId:look.id});
  const cue=h.read().productionOS.show[e][0];
  assert.equal(cue.lookId,look.id);
  h.navigate('#/production');
  assert.match(h.ui.innerHTML,/Soft blue opening/);
});

test('reports a discrepancy without treating it as verification',()=>{
  const h=harness(),e='ev-abbotsford-two-stage-demo';
  h.click('report','task-place-demo-light-o1');
  assert.equal(h.read().productionOS.issues.filter(x=>x.eventId===e&&x.status==='Open').length,1);
  assert.equal(h.read().productionOS.published[e].tasks.find(x=>x.id==='task-place-demo-light-o1').state,'pending');
});

test('production task ownership filters crew instructions without changing identities',()=>{
  const h=harness(),e='ev-abbotsford-two-stage-demo';
  const task=h.read().productionOS.published[e].tasks.find(x=>x.kind==='place'&&x.sourceId==='demo-light-o1');
  assert.ok(task);
  const personId='ent-demo-hand',before=h.read().productionOS.entities.length;
  h.navigate('#/production');
  assert.match(h.ui.innerHTML,/Assign installation tasks/);
  h.change({id:'',dataset:{act:'task-owner',id:task.id},value:personId});
  assert.equal(h.read().productionOS.taskAssignments[e][task.id],personId);
  assert.equal(h.read().productionOS.entities.length,before);
  h.navigate('#/crew');
  h.change({id:'crew-person-picker',dataset:{},value:personId});
  assert.match(h.ui.innerHTML,/Outdoor wash 1/);
  assert.equal((h.ui.innerHTML.match(/class="task-row"/g)||[]).length,1);
  const restored=harness(h.storage);
  restored.navigate('#/crew');
  assert.match(restored.ui.innerHTML,/Assigned to Sam/);
});

test('stage structures are included in published crew pack',()=>{
  const h=harness(),e='ev-abbotsford-two-stage-demo';
  const tasks=h.read().productionOS.published[e].tasks;
  assert.ok(tasks.some(t=>t.sourceId==='demo-stage-in'&&t.title.includes('Indoor stage')));
  assert.ok(tasks.some(t=>t.sourceId==='demo-stage-out'&&t.title.includes('Outdoor stage')));
});

test('entity aliases prevent duplicate profiles and event profiles link to the team',()=>{
  const h=harness(),eventId='ev-abbotsford-two-stage-demo';
  h.click('profile','ent-demo-hand');
  h.click('alias','ent-demo-hand');
  const count=h.read().productionOS.entities.length;
  h.submit('entity-form',{name:'Example site discrepancy',kind:'Person',aliases:'',notes:''});
  assert.equal(h.read().productionOS.entities.length,count);
  h.click('profile','ent-event-'+eventId);
  assert.match(h.ui.innerHTML,/Production team/);
  assert.match(h.ui.innerHTML,/Sam · demonstration stagehand/);
});

test('a supplier can provide multiple equipment types without duplicated identity',()=>{
  const base={
    projects:[],leads:[],events:[],clients:[],fixtures:[],eventJobs:[],venues:[],venuePlans:{},technicalPlans:{},
    equipment:[{id:'eq-bar',name:'Pixel bar',category:'Lighting',owned:20,rate:35,watts:65},
               {id:'eq-wash',name:'LED wash',category:'Lighting',owned:12,rate:50,watts:140}]
  };
  const h=harness(new Map([['phaenomenon-demo-v1',JSON.stringify(base)]]));
  const values={entityId:'ent-demo-supplier',role:'Supplier',areaId:'all',responsibility:'Hire'};
  h.submit('assign-form',{...values,equipmentId:'eq-bar',quantity:'12'});
  h.submit('assign-form',{...values,equipmentId:'eq-wash',quantity:'4'});
  const links=h.read().productionOS.assignments.filter(a=>a.entityId==='ent-demo-supplier'&&a.role==='Supplier');
  assert.equal(links.length,2);
  assert.deepEqual(links.map(x=>x.quantity),[12,4]);
});

test('task assignment outside member work area is visibly flagged',()=>{
  const h=harness(),e='ev-abbotsford-two-stage-demo';
  const indoor=h.read().productionOS.published[e].tasks.find(x=>x.sourceId==='demo-stage-in');
  h.navigate('#/production');
  h.change({id:'',dataset:{act:'task-owner',id:indoor.id},value:'ent-demo-hand'});
  assert.match(h.ui.innerHTML,/Check assigned area/);
  h.navigate('#/crew');
  assert.match(h.ui.innerHTML,/Check assignment: different work area/);
});
