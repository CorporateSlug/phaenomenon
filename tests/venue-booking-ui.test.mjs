// Event booking UI smoke tests with a lightweight DOM harness (no npm dependencies).
// Run: node --test tests/venue-booking-ui.test.mjs
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const source=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

function harness(){
  const handlers={},memory=new Map(),window={},app={innerHTML:''};
  const dropdown={value:'',dataset:{renderedVenue:''},innerHTML:''},spaceHost={innerHTML:''};
  const spaceButton={disabled:true};
  const picker={
    checked:[],
    querySelector:selector=>selector==='[data-venue-pick]'?dropdown:selector==='[data-space-choices]'?spaceHost:
      selector==='[data-action="space-create"]'?spaceButton:null,
    querySelectorAll:()=>picker.checked.map(value=>({value}))
  };
  const document={
    title:'',hidden:false,popupOpen:false,popupHTML:'',
    getElementById:id=>id==='app'?app:id==='import-file'?{addEventListener(){},value:''}:null,
    querySelector:selector=>selector==='[data-venue-quick-overlay]'?
      (document.popupOpen?{remove(){document.popupOpen=false}}:null):
      selector.includes('input[name="venueName"]')||selector.includes('input[name="spaceName"]')||selector==='.modal input'?{focus(){}}:null,
    querySelectorAll:()=>[],
    addEventListener:(name,fn)=>{handlers[name]=fn;},
    body:{insertAdjacentHTML:(where,html)=>{document.popupOpen=true;document.popupHTML=html}}
  };
  const location={hash:'#/bookings'};
  class FormDataMock{
    constructor(form){this.data=form.values||{};}
    get(key){return this.data[key]??null;}
    getAll(key){return this.data[key]||[];}
  }
  for(const file of ['venue-geometry.js','multi-space.js','venue-workflow.js','event-lifecycle.js','event-lifecycle-ui.js']){
    runInNewContext(source(file),{window},{filename:file});
  }
  window.PhaenomenonSpacePlanner={ensure(db){if(!db.venues)db.venues=[{id:'v-existing',name:'Existing Club',width:16,length:12,height:4}]},mount(){}};
  window.addEventListener=(name,fn)=>{handlers['window.'+name]=fn};
  const script=source('app.js').replace(/renderRoute\(\);\s*\}\)\(\);\s*$/,
    'renderRoute();window.__test={db,ui};})();');
  if(!script.includes('window.__test={db,ui}'))throw Error('Test harness instrument failed');
  const alerts=[];
  const sandbox={
    window,document,location,FormData:FormDataMock,
    localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,String(value))},
    confirm:()=>true,alert:message=>alerts.push(message),prompt:()=>'',setTimeout:()=>{},
    console,Date,Math,JSON,Map,Set,Array,Object,Number,String,Intl
  };
  runInNewContext(script,sandbox,{filename:'app.js'});
  function click(action,detail={}){
    const element={dataset:{action,...detail},closest(selector){return selector==='[data-venue-picker]'?picker:element;}};
    handlers.click({target:{closest:()=>element},preventDefault(){}});
  }
  function submit(type,values){
    const form={dataset:{form:type},values};
    handlers.submit({target:{closest:()=>form},preventDefault(){}});
  }
  const read=()=>JSON.parse(memory.get('phaenomenon-demo-v1')||'{}');
  return {window,document,app,picker,dropdown,spaceHost,alerts,click,submit,read};
}

test('new event can create venue with first space without losing its form',()=>{
  const h=harness();
  assert.match(h.app.innerHTML,/name="venueId"/);
  h.click('open-modal',{type:'booking'});
  assert.match(h.app.innerHTML,/data-form="new-booking"/);
  h.click('venue-create');
  assert.match(h.document.popupHTML,/Create venue and first space/);
  h.submit('quick-venue',{venueName:'Music Hall',spaceName:'Main Room',width:'20',length:'15',height:'5',kind:'indoor'});
  const venue=h.window.__test.db.venues.find(v=>v.name==='Music Hall');
  assert.ok(venue);
  assert.equal(venue.spaces[0].name,'Main Room');
  assert.equal(h.dropdown.value,venue.id);
  assert.match(h.app.innerHTML,/data-form="new-booking"/);
  h.submit('new-booking',{title:'Winter Festival',clientId:'c1',date:'2027-02-01',venueId:venue.id,spaceIds:[venue.spaces[0].id],guests:'120',zones:'2'});
  const event=h.window.__test.db.eventJobs.find(e=>e.title==='Winter Festival');
  assert.equal(event.venueId,venue.id);
  assert.deepEqual([...event.spaceIds],[venue.spaces[0].id]);
  assert.ok(h.read().eventJobs.some(e=>e.id===event.id));
});

test('existing venue can gain a missing space and event can select it',()=>{
  const h=harness();
  h.click('open-modal',{type:'booking'});
  h.click('venue-create');
  h.submit('quick-venue',{venueName:'Westside Arts',spaceName:'Indoor Hall',width:'18',length:'12',height:'5',kind:'indoor'});
  const v=h.window.__test.db.venues.find(x=>x.name==='Westside Arts');
  h.submit('new-booking',{title:'Show A',clientId:'c1',date:'2027-02-01',venueId:v.id,spaceIds:[v.spaces[0].id],guests:'150'});
  const event=h.window.__test.db.eventJobs.find(x=>x.title==='Show A');
  h.dropdown.value=v.id;h.dropdown.dataset.renderedVenue=v.id;h.picker.checked=[v.spaces[0].id];
  h.click('space-create');
  assert.match(h.document.popupHTML,/Add space to Westside Arts/);
  h.submit('quick-space',{venueId:v.id,spaceName:'Courtyard',width:'12',length:'11',height:'4',kind:'outdoor'});
  const newSpace=v.spaces.find(x=>x.name==='Courtyard');
  assert.ok(newSpace);
  assert.equal(h.window.__test.db.venues.filter(x=>x.name==='Westside Arts').length,1);
  assert.match(h.spaceHost.innerHTML,/Courtyard/);
  assert.match(h.spaceHost.innerHTML,new RegExp('value="'+newSpace.id+'" checked'));
  h.submit('edit-booking',{id:event.id,title:'Show A',clientId:'c1',date:'2027-02-01',venueId:v.id,
    spaceIds:[v.spaces[0].id,newSpace.id],guests:'150',eventType:'Performance'});
  assert.ok(h.read().eventJobs.find(x=>x.id===event.id).spaceIds.includes(newSpace.id));
});

test('duplicate venue and duplicate space names reuse existing records',()=>{
  const h=harness();
  h.click('open-modal',{type:'booking'});
  h.click('venue-create');
  h.submit('quick-venue',{venueName:'Music Hall',spaceName:'Main space'});
  const v=h.window.__test.db.venues.find(x=>x.name==='Music Hall'),id=v.id;
  h.click('venue-create');
  h.submit('quick-venue',{venueName:'music hall',spaceName:'Different'});
  assert.equal(h.window.__test.db.venues.filter(x=>x.id===id).length,1);
  assert.equal(h.dropdown.value,id);
  h.dropdown.value=id;h.dropdown.dataset.renderedVenue=id;
  h.click('space-create');
  h.submit('quick-space',{venueId:id,spaceName:'main SPACE'});
  assert.equal(v.spaces.length,1);
  assert.ok(h.spaceHost.innerHTML.includes('Main space'));
});
