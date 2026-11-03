// Run with: node --test tests/venue-workflow.test.mjs
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';

function harness(){
  const window={};
  const sandbox={window,Date,Math,JSON,Map,Set,Array,Object,Number,String};
  for(const path of ['venue-geometry.js','multi-space.js','venue-workflow.js']){
    const src=readFileSync(new URL('../'+path,import.meta.url),'utf8');
    runInNewContext(src,sandbox,{filename:path});
  }
  return window.PhaenomenonVenueWorkflow;
}

test('existing venues and their first spaces migrate once, without duplicate venues',()=>{
  const W=harness(),db={
    venues:[{id:'ven-legacy',name:'Harbour Hall',width:20,length:14,height:5}],
    eventJobs:[{id:'event-legacy',title:'Show',venue:'Harbour Hall'}],
    venuePlans:{}
  };
  W.ensureAll(db);
  assert.equal(db.venues.length,1);
  assert.equal(db.venues[0].spaces.length,1);
  assert.equal(db.venues[0].spaces[0].name,'Main space');
  assert.equal(db.eventJobs[0].venueId,'ven-legacy');
  assert.deepEqual([...db.eventJobs[0].spaceIds],[db.venues[0].spaces[0].id]);
  const spaceId=db.venues[0].spaces[0].id;
  W.ensureAll(db);
  assert.equal(db.venues.length,1);
  assert.equal(db.venues[0].spaces.length,1);
  assert.equal(db.venues[0].spaces[0].id,spaceId);
});

test('new venues are reusable and include a named first space',()=>{
  const W=harness(),db={venues:[],eventJobs:[],venuePlans:{}};
  const res=W.addVenue(db,{name:' AbbotSford Convent ',spaceName:'Indoor Hall',width:18,length:14,height:6,kind:'indoor'});
  assert.ok(res.venue&&res.space);
  assert.equal(res.venue.name,'AbbotSford Convent');
  assert.equal(res.venue.spaces[0].name,'Indoor Hall');
  assert.equal(res.venue.spaces[0].width,18);
  assert.equal(res.venue.spaces[0].geometry.kind,'indoor');
  const duplicate=W.addVenue(db,{name:'abbotsford   convent',spaceName:'Wrong'});
  assert.ok(duplicate.existing);
  assert.equal(duplicate.existing.id,res.venue.id);
  assert.equal(db.venues.length,1);
});

test('missing space can be added to an existing venue without duplicating either',()=>{
  const W=harness(),db={venues:[],eventJobs:[],venuePlans:{}};
  const {venue,space:hall}=W.addVenue(db,{name:'Westside Arts',spaceName:'Main Hall'});
  const second=W.addSpace(db,venue.id,{name:'Courtyard',width:13,length:11,kind:'outdoor'});
  assert.equal(db.venues.length,1);
  assert.equal(venue.spaces.length,2);
  assert.equal(second.space.name,'Courtyard');
  assert.equal(second.space.geometry.kind,'outdoor');
  assert.equal(second.space.geometry.roof.type,'none');
  const duplicate=W.addSpace(db,venue.id,{name:'  COURTYARD  '});
  assert.ok(duplicate.existing);
  assert.equal(duplicate.existing.id,second.space.id);
  assert.equal(venue.spaces.length,2);
  assert.notEqual(hall.id,second.space.id);
});

test('one event can link a newly created space without altering another event',()=>{
  const W=harness(),db={venues:[],eventJobs:[],venuePlans:{}};
  const {venue,space:hall}=W.addVenue(db,{name:'Westside Arts',spaceName:'Hall'});
  db.eventJobs.push(
    {id:'a',title:'Event A',venue:venue.name,venueId:venue.id,spaceIds:[hall.id]},
    {id:'b',title:'Event B',venue:venue.name,venueId:venue.id,spaceIds:[hall.id]}
  );
  const garden=W.addSpace(db,venue.id,{name:'Garden',kind:'outdoor'}).space;
  assert.equal(W.activeSpaces(db.eventJobs[0],venue).length,1);
  assert.equal(W.activeSpaces(db.eventJobs[1],venue).length,1);
  assert.equal(W.updateEvent(db,'a',venue.id,[hall.id,garden.id]).error,undefined);
  assert.equal(W.activeSpaces(db.eventJobs[0],venue).length,2);
  assert.equal(W.activeSpaces(db.eventJobs[1],venue).length,1);
});

test('an event cannot select spaces from another venue or exclude occupied spaces',()=>{
  const W=harness(),db={venues:[],eventJobs:[],venuePlans:{}};
  const {venue,space:hall}=W.addVenue(db,{name:'Venue A',spaceName:'Hall'});
  const second=W.addSpace(db,venue.id,{name:'Courtyard'}).space;
  const other=W.addVenue(db,{name:'Venue B',spaceName:'Studio'}).space;
  db.eventJobs=[{id:'a',title:'Event A',venue:venue.name,venueId:venue.id,spaceIds:[hall.id,second.id]}];
  db.venuePlans.a={venueId:venue.id,items:[{id:'fixture1',name:'Spotlight',areaId:second.id,x:6,y:4}],runs:[]};
  const foreign=W.updateEvent(db,'a',venue.id,[hall.id,other.id]);
  assert.match(foreign.error,/does not belong/);
  const occupied=W.updateEvent(db,'a',venue.id,[hall.id]);
  assert.match(occupied.error,/contain placed equipment/);
  assert.deepEqual([...db.eventJobs[0].spaceIds],[hall.id,second.id]);
});

test('moving an event to another venue flags its existing layout instead of moving objects silently',()=>{
  const W=harness(),db={venues:[],eventJobs:[],venuePlans:{}};
  const original=W.addVenue(db,{name:'Venue One',spaceName:'Hall'});
  const next=W.addVenue(db,{name:'Venue Two',spaceName:'Studio'});
  db.eventJobs=[{id:'ev',title:'Show',venue:original.venue.name,venueId:original.venue.id,spaceIds:[original.space.id]}];
  db.venuePlans.ev={venueId:original.venue.id,items:[{id:'item',name:'Moving head',areaId:original.space.id,x:7,y:9}],runs:[]};
  const result=W.updateEvent(db,'ev',next.venue.id,[next.space.id]);
  assert.equal(result.needsReview,true);
  assert.equal(db.eventJobs[0].venueId,next.venue.id);
  assert.equal(db.venuePlans.ev.venueId,next.venue.id);
  assert.equal(db.venuePlans.ev.needsVenueReview,true);
  assert.equal(db.venuePlans.ev.items[0].x,7);
  assert.equal(db.venuePlans.ev.items[0].y,9);
});

test('user-facing entry points both expose venue and space workflow',()=>{
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const production=readFileSync(new URL('../production-os.js',import.meta.url),'utf8');
  const threeD=readFileSync(new URL('../space-planner.js',import.meta.url),'utf8');
  assert.match(app,/Spaces used by this event/);
  assert.match(app,/Create missing space/);
  assert.match(app,/quick-space/);
  assert.match(production,/venueSpaceChoices/);
  assert.match(production,/event-venue-form/);
  assert.match(production,/production-venue-quick-form/);
  assert.match(threeD,/PhaenomenonVenueWorkflow.*updateEvent/);
});
