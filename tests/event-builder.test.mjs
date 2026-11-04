// Run: node --test tests/event-builder.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
function model(){
  const window={};runInNewContext(source('event-builder.js'),{window,Date,Math,JSON,Intl},{filename:'event-builder.js'});
  return window.PhaenomenonEventBuilder;
}
const blank=()=>({
  projects:[],leads:[],events:[],fixtures:[],clients:[{id:'c1',name:'Client One'}],
  eventJobs:[],venues:[],venuePlans:{},equipment:[],productionOS:{assignments:[],published:{}}
});
test('new event is a draft with reusable clients and no accidental venue',()=>{
  const b=model(),data=blank();
  const result=b.create(data,{title:' Event One ',date:'2026-12-09',clientId:'c1'});
  assert.equal(result.event.title,'Event One');
  assert.equal(result.event.clientId,'c1');
  assert.equal(result.event.venueId,'');
  assert.equal(result.event.spaceIds.length,0);
  assert.equal(result.event.status,'Enquiry');
  const steps=b.steps(data,result.event);
  assert.equal(steps.length,7);
  assert.equal(steps.find(x=>x.id==='brief').state,'complete');
  assert.equal(steps.find(x=>x.id==='spaces').state,'attention');
  assert.equal(steps.find(x=>x.id==='design').state,'todo');
});
test('creation of a new client deduplicates names and rejects empty or malformed event fields',()=>{
  const b=model(),data=blank();
  assert.match(b.create(data,{title:'',date:'2026-12-09',clientId:'c1'}).error,/event name/);
  assert.match(b.create(data,{title:'Event',date:'bad',clientId:'c1'}).error,/valid date/);
  const early=b.create(data,{title:'Potential gig'});
  assert.equal(early.event.date,'');
  assert.equal(early.event.clientId,'');
  const first=b.create(data,{title:'Event',date:'2026-12-09',clientName:'  Community Crew '});
  const second=b.create(data,{title:'Event Two',date:'2026-12-10',clientName:'community crew'});
  assert.equal(first.event.clientId,second.event.clientId);
  assert.equal(data.clients.length,2);
});
test('steps reflect independent venue, design, equipment, connections and crew stages',()=>{
  const b=model(),data=blank(),e=b.create(data,{title:'Production',date:'2026-12-09',clientId:'c1'}).event;
  data.venues=[{id:'ven1',name:'Example venue',spaces:[{id:'space1',name:'Main stage'}]}];
  e.venueId='ven1';e.spaceIds=['space1'];
  data.equipment=[{id:'eq1',name:'LED Wash',owned:4,rate:20}];
  data.venuePlans[e.id]={venueId:'ven1',items:[
    {id:'item1',name:'Wash 1',kind:'light',areaId:'space1',eqId:'eq1'},
    {id:'item2',name:'Wash 2',kind:'light',areaId:'space1',eqId:'eq1'}
  ],runs:[{id:'cable1',from:'item1',to:'item2',type:'dmx'}]};
  let steps=b.steps(data,e);
  assert.equal(steps.find(x=>x.id==='spaces').state,'complete');
  assert.equal(steps.find(x=>x.id==='design').state,'complete');
  assert.equal(steps.find(x=>x.id==='equipment').state,'attention');
  assert.equal(steps.find(x=>x.id==='connections').state,'complete');
  assert.equal(steps.find(x=>x.id==='team').state,'todo');
  const summary=b.reconcileKit(data,e.id);
  assert.equal(summary.updated,1);
  assert.equal(e.kit[0].qty,2);
  steps=b.steps(data,e);
  assert.equal(steps.find(x=>x.id==='equipment').state,'complete');
  data.productionOS.assignments=[{id:'role',eventId:e.id,entityId:'person1',role:'Technician'}];
  assert.equal(b.steps(data,e).find(x=>x.id==='team').state,'complete');
});
test('existing unrelated kit quantities are preserved and reconcile is idempotent',()=>{
  const b=model(),data=blank(),e=b.create(data,{title:'Show',date:'2026-12-09',clientId:'c1'}).event;
  data.equipment=[{id:'eq1',name:'Spot',owned:3},{id:'eq2',name:'Cable',owned:10}];
  data.venuePlans[e.id]={items:[{id:'x1',eqId:'eq1'},{id:'x2',eqId:'eq1'},{id:'x3',eqId:'eq1'}],runs:[]};
  e.kit=[{id:'eq1',qty:1},{id:'eq2',qty:8}];
  assert.equal(b.reconcileKit(data,e.id).updated,1);
  assert.equal(e.kit.find(x=>x.id==='eq1').qty,3);
  assert.equal(e.kit.find(x=>x.id==='eq2').qty,8);
  assert.equal(b.reconcileKit(data,e.id).updated,0);
});
test('venue placeholders and fixed scenery may be intentionally outside the hire kit',()=>{
  const b=model(),data=blank(),e=b.create(data,{title:'Show',date:'2026-12-09',clientId:'c1'}).event;
  data.equipment=[{id:'eq1',name:'Fixture',owned:2}];
  data.venuePlans[e.id]={items:[
    {id:'one',name:'Fixture A',eqId:'eq1'},
    {id:'two',name:'Stage wall',kitTracked:false},
    {id:'three',name:'Unknown object'}
  ],runs:[]};
  const summary=b.mapEquipment(data,e);
  assert.equal(summary.linked,1);
  assert.equal(summary.ignored.length,1);
  assert.equal(summary.unlinked.length,1);
  assert.equal(summary.gaps[0].missing,1);
  e.kit=[{id:'eq1',qty:1}];
  assert.equal(b.mapEquipment(data,e).incomplete.length,0);
});
test('issued pack revision is flagged when the live design changes',()=>{
  const b=model(),data=blank(),e=b.create(data,{title:'Show',date:'2026-12-09',clientId:'c1'}).event;
  data.productionOS.published[e.id]={revision:2,signature:'old'};
  assert.equal(b.steps(data,e,{changed:true}).find(x=>x.id==='review').state,'attention');
  assert.equal(b.steps(data,e,{changed:false}).find(x=>x.id==='review').state,'complete');
});
