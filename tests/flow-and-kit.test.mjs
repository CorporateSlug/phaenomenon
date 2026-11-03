// Integration guardrails for the guided workflow and non-destructive equipment sync.
// Run with: node --test tests/flow-and-kit.test.mjs
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const source=filename=>readFileSync(new URL('../'+filename,import.meta.url),'utf8');
function builder(){
  const window={};
  runInNewContext(source('event-builder.js'),{window},{filename:'event-builder.js'});
  return window.PhaenomenonEventBuilder;
}
function sample(){
  return {
    projects:[],leads:[],events:[],fixtures:[],clients:[{id:'client-1',name:'Demo'}],
    eventJobs:[{id:'event-1',title:'Show',clientId:'client-1',date:'2026-12-18',
      kit:[{id:'eq-light',qty:1},{id:'eq-cable',qty:20}],spaceIds:['space-1'],venueId:'venue-1'}],
    venues:[{id:'venue-1',name:'Hall',spaces:[{id:'space-1',name:'Main space'}]}],
    equipment:[{id:'eq-light',name:'Moving head',owned:0,watts:400},{id:'eq-cable',name:'DMX cable',owned:10}],
    venuePlans:{'event-1':{venueId:'venue-1',items:[
      {id:'a',name:'Moving head A',areaId:'space-1',kind:'light',eqId:'eq-light'},
      {id:'b',name:'Moving head B',areaId:'space-1',kind:'light',eqId:'eq-light'},
      {id:'c',name:'Permanent stage',areaId:'space-1',kind:'stage',kitTracked:false},
      {id:'d',name:'Work light',areaId:'space-1',kind:'light'}
    ],runs:[]}},
    productionOS:{assignments:[],published:{}}
  };
}

test('raising kit quantities leaves unrelated, larger or manually planned allocations unchanged',()=>{
  const b=builder(),data=sample(),e=data.eventJobs[0];
  const result=b.reconcileKit(data,e.id);
  assert.equal(result.updated,1);
  assert.equal(e.kit.find(x=>x.id==='eq-light').qty,2);
  assert.equal(e.kit.find(x=>x.id==='eq-cable').qty,20);
  const repeat=b.reconcileKit(data,e.id);
  assert.equal(repeat.updated,0);
  assert.equal(e.kit.find(x=>x.id==='eq-cable').qty,20);
});

test('scenery can be excluded from stock without suppressing missing equipment warnings',()=>{
  const b=builder(),data=sample();
  const report=b.mapEquipment(data,data.eventJobs[0]);
  assert.equal(report.ignored.length,1);
  assert.equal(report.unlinked.length,1);
  assert.equal(report.linked,2);
  const step=b.steps(data,data.eventJobs[0]).find(x=>x.id==='equipment');
  assert.equal(step.state,'attention');
});

test('3D planner uses non-destructive kit reconciliation and explicit venue-only choice',()=>{
  const s=source('space-planner.js');
  assert.match(s,/syncKit\(\)\s*\{[\s\S]*?PhaenomenonEventBuilder/);
  assert.match(s,/reconcileKit\(this\.db,this\.eventId\)/);
  assert.doesNotMatch(s,/ev\.kit=Object\.entries\(counts\)/);
  assert.match(s,/value="__skip__"/);
  assert.match(s,/kitTracked=false/);
  assert.match(s,/Match event kit to placed equipment/);
});

test('event builder exposes editable estimates without crowding the primary form',()=>{
  const s=source('production-os.js');
  assert.match(s,/builder-assumptions/);
  for(const field of ['environment','complexity','guests','zones','labourHours','labourRate']){
    assert.match(s,new RegExp('name="'+field+'"'));
  }
  assert.match(s,/if\(f\.id==='builder-basics-form'\)/);
  assert.match(s,/e\.labourRate=Math\.max/);
});

test('new and existing 3D plans have a visible return path to Event Builder',()=>{
  const s=source('space-planner.js');
  assert.match(s,/production\.html#\/builder/);
  assert.match(s,/encodeURIComponent\(this\.eventId\)/);
  assert.match(s,/Create an event to begin/);
});
