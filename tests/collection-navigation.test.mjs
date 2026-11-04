// Collection-first navigation and editable record workflows.
// Run: node --test tests/collection-navigation.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const dependencies=[
 'venue-geometry.js','multi-space.js','venue-workflow.js',
 'event-lifecycle.js','event-lifecycle-ui.js','event-builder.js',
 'collection-workspaces.js','home-dashboard.js','event-workspace.js',
 'community-data.js','community-admin.js'
];
class FormValues{
 constructor(form){this.data=form.values||{};}
 get(name){return this.data[name]??null;}
 getAll(name){return this.data[name]||[];}
 entries(){return Object.entries(this.data)[Symbol.iterator]();}
}
function app(){
 const local=new Map(),session=new Map(),handlers={},root={innerHTML:'',contains:()=>true},errors=[];
 const window={addEventListener:(key,fn)=>{handlers['window.'+key]=fn;}};
 const document={
  title:'',body:{classList:{remove(){}}},getElementById:id=>id==='production-app'?root:null,
  querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(key,fn)=>{handlers[key]=fn;}
 };
 const location={hash:'#/dashboard',href:''};
 const storage={getItem:key=>local.get(key)||null,setItem:(key,v)=>local.set(key,String(v))};
 const sessionStorage={getItem:key=>session.get(key)||null,setItem:(key,v)=>session.set(key,String(v)),removeItem:key=>session.delete(key)};
 const context={window,document,location,localStorage:storage,sessionStorage,
  FormData:FormValues,URL,Date,Math,JSON,Intl,Map,Set,Array,Object,Number,String,
  encodeURIComponent,decodeURIComponent,
  alert:x=>errors.push(x),confirm:()=>true,prompt:()=>'',setTimeout(){},console};
 for(const name of dependencies)runInNewContext(source(name),context,{filename:name});
 runInNewContext(source('production-os.js'),context,{filename:'production-os.js'});
 const db=()=>JSON.parse(local.get('phaenomenon-demo-v1'));
 const visit=hash=>{location.hash=hash;handlers['window.hashchange']();};
 const submit=(id,values,meta={})=>handlers.submit({target:{id,dataset:meta,values},preventDefault(){}});
 const create=(kind,draft,fields)=>{visit('#/new/'+kind+'/'+draft);submit('collection-create-form',fields,{kind,draftId:draft});};
 return {window,root,db,visit,submit,create,location,local,errors};
}
test('Dashboard is a dashboard, and sidebar only shows collections',()=>{
 const h=app(),html=h.root.innerHTML;
 assert.match(html,/Your studio at a glance/);
 assert.doesNotMatch(html,/Go to workspace/);
 assert.doesNotMatch(html,/id="event-picker"/);
 for(const [name,route] of [['Events & schedule','#/events'],
  ['People & organisations','#/entities'],['Venues & spaces','#/venues'],
  ['Equipment & fixtures','#/equipment'],['Finances','#/finances']]){
  assert.ok(html.includes('href="'+route+'"'),name);
 }
 assert.ok(html.indexOf('href="#/finances"')<html.indexOf('rail-community-section'));
 assert.doesNotMatch(html,/id="event-picker"/);
});
test('Collections show browse/search views and contextual new actions',()=>{
 const h=app();
 for(const [hash,marker] of [['#/events','New event'],['#/entities','New person or organisation'],
  ['#/venues','New venue'],['#/equipment','New equipment'],['#/finances','New invoice draft']]){
  h.visit(hash);
  assert.match(h.root.innerHTML,new RegExp(marker));
 }
 h.visit('#/equipment');
 assert.match(h.root.innerHTML,/Fixture specifications/);
 assert.match(h.root.innerHTML,/New fixture/);
 assert.match(h.root.innerHTML,/id="collection-search"/);
});
test('Creating equipment and fixtures saves real records only when submitted',()=>{
 const h=app(),before=h.db().equipment.length;
 h.visit('#/new/equipment/draft-gear');
 assert.match(h.root.innerHTML,/id="collection-create-form"/);
 assert.equal(h.db().equipment.length,before);
 h.submit('collection-create-form',{name:'Spotlight test',category:'Lighting',owned:'4',rate:'75',watts:'80'}, {kind:'equipment',draftId:'draft-gear'});
 const eq=h.db().equipment.find(x=>x.name==='Spotlight test');
 assert.ok(eq);assert.equal(eq.owned,4);
 assert.equal(h.location.hash,'#/equipment/'+eq.id);
 h.submit('collection-edit-equipment',{id:eq.id,name:eq.name,category:eq.category,owned:'7',rate:'85',watts:'90'});
 assert.equal(h.db().equipment.find(x=>x.id===eq.id).owned,7);
 h.create('fixture','draft-fixture',{name:'LED fixture test',code:'FIX-NEW',maker:'Demo Co',type:'Wash',stock:'2',cost:'300'});
 const f=h.db().fixtures.find(x=>x.code==='FIX-NEW');
 assert.ok(f);assert.equal(h.location.hash,'#/fixtures/'+f.id);
 assert.equal(h.errors.length,0);
});
test('Create person, venue and event with the existing shared models',()=>{
 const h=app();
 h.create('entity','draft-person',{name:'Lighting assistant',kind:'Person',aliases:'LA',notes:'Demo'});
 const person=h.db().productionOS.entities.find(x=>x.name==='Lighting assistant');
 assert.ok(person);assert.equal(h.location.hash,'#/entities/'+person.id);
 h.visit('#/entities');
 assert.match(h.root.innerHTML,/Lighting assistant/);
 h.create('venue','draft-venue',{name:'Example hall',spaceName:'Main room',width:'15',length:'10',height:'5',kind:'indoor'});
 const venue=h.db().venues.find(x=>x.name==='Example hall');
 assert.ok(venue);assert.equal(venue.spaces[0].name,'Main room');
 assert.equal(h.location.hash,'#/venues/'+venue.id);
 h.submit('collection-add-space',{venueId:venue.id,name:'Courtyard',width:'12',length:'10',height:'4',kind:'outdoor'});
 assert.ok(h.db().venues.find(x=>x.id===venue.id).spaces.some(x=>x.name==='Courtyard'));
 h.create('event','draft-event',{title:'Our party',eventLead:'studio',bookingStage:'idea',date:'',dateCertainty:'unknown'});
 const event=h.db().eventJobs.find(x=>x.title==='Our party');
 assert.ok(event);assert.equal(event.clientId,'');assert.equal(event.date,'');
 assert.equal(h.location.hash,'#/home/'+event.id);
 assert.equal(h.errors.length,0);
});
test('New invoice is a draft, not an issued invoice or payment',()=>{
 const h=app(),previous=h.db().invoices.length;
 h.create('invoice','draft-invoice',{number:'TEST-001',clientId:'c1',description:'Demo services',rate:'250'});
 const invoice=h.db().invoices.find(x=>x.number==='TEST-001');
 assert.ok(invoice);assert.equal(invoice.status,'Draft');
 assert.equal(invoice.lines[0].rate,250);
 assert.equal(invoice.eventId,null);
 assert.equal(h.db().invoices.length,previous+1);
 assert.match(h.location.href,/^index\.html#\/invoices\//);
});
test('The same tab manager deduplicates record tabs and preserves unfinished drafts',()=>{
 const raw=source('workspace-navigation.js').replace(/\}\)\(\);\s*$/,
  'window.__tests={synchronize,openRecordTab,tabs:()=>tabs};})();');
 const map=new Map([['phaenomenon-demo-v1',JSON.stringify({eventJobs:[],equipment:[],productionOS:{entities:[]}})]]);
 const session=new Map(),env={hash:'#/dashboard',href:'production.html#/dashboard'};
 const location={
  get hash(){return env.hash;},set hash(v){env.hash=v;},
  get href(){return env.href;},set href(v){env.href=v;env.hash=v.slice(v.indexOf('#'));}
 };
 const window={addEventListener(){}};
 const document={readyState:'loading',addEventListener(){},getElementById:id=>id==='production-app'?{}:null,querySelector:()=>null};
 const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v))};
 const sessionStorage={getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,String(v))};
 runInNewContext(raw,{window,document,location,localStorage:storage,sessionStorage,
  MutationObserver:class{},queueMicrotask(){},matchMedia:()=>({matches:false}),
  encodeURIComponent,decodeURIComponent,Date,Math,JSON,Map,Set,Array,Object,String,Number});
 const h=window.__tests;
 h.synchronize();assert.equal(h.tabs().length,1);
 env.hash='#/equipment';h.synchronize();
 h.openRecordTab('production.html#/equipment/eq-one');h.synchronize();
 h.openRecordTab('production.html#/equipment/eq-one');h.synchronize();
 assert.equal(h.tabs().length,2);
 h.openRecordTab('production.html#/new/event/draft-one');h.synchronize();
 assert.equal(h.tabs().length,3);
 env.hash='#/events';h.synchronize();
 assert.equal(h.tabs().length,3);
 assert.ok(h.tabs().some(x=>x.key==='draft:event:draft-one'));
});
