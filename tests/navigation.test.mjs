// Navigation and progressive-disclosure regression tests.
// Run: node --test tests/navigation.test.mjs
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const source=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
function deps(window) {
  for (const file of ['venue-geometry.js','multi-space.js','venue-workflow.js']) {
    runInNewContext(source(file),{window},{filename:file});
  }
}
const storage=()=>new Map();
function classic(memory=storage(),route='#/bookings') {
  const handlers={},window={},location={hash:route},root={innerHTML:''};
  deps(window);
  window.PhaenomenonSpacePlanner={ensure(){},mount(){}};
  window.addEventListener=(name,fn)=>handlers['window.'+name]=fn;
  const panels=[{dataset:{bookingPanel:'details'},hidden:false},{dataset:{bookingPanel:'equipment'},hidden:true}];
  const buttons=[{dataset:{tab:'details'},classList:{toggle(){}},setAttribute(){}},
    {dataset:{tab:'equipment'},classList:{toggle(){}},setAttribute(){}}];
  const host={querySelectorAll:q=>q==='[data-booking-panel]'?panels:
    q==='[data-action="booking-tab"]'?buttons:[]};
  const document={
    title:'',hidden:false,
    getElementById:id=>id==='app'?root:id==='import-file'?{addEventListener(){},value:''}:null,
    querySelector(){return null;},querySelectorAll(){return [];},
    addEventListener:(name,fn)=>handlers[name]=fn,
    body:{insertAdjacentHTML(){}}
  };
  class FormDataMock {constructor(f){this.values=f.values||{}}get(key){return this.values[key]??null}getAll(key){return this.values[key]||[]}}
  const script=source('app.js').replace(/renderRoute\(\);\s*\}\)\(\);\s*$/,
    'renderRoute();window.__test={db,ui,sidebar,bookingDetail};})();');
  if(!script.includes('window.__test={db,ui,sidebar,bookingDetail}'))throw Error('Classic test instrumentation failed');
  runInNewContext(script,{
    window,document,location,FormData:FormDataMock,
    localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,String(value))},
    alert(){},confirm:()=>true,prompt:()=>'',setTimeout(){},
    console,Date,Math,JSON,Map,Set,Array,Object,Number,String,Intl
  },{filename:'app.js'});
  return {
    window,root,panels,memory,
    navigate:hash=>{location.hash=hash;handlers['window.hashchange']();},
    click:(action,detail={})=>{
      const el={dataset:{action,...detail},closest:q=>q==='.event-work'?host:el};
      handlers.click({target:{closest:()=>el},preventDefault(){}});
    }
  };
}
function production(memory=storage(),hash='#/home'){
  const handlers={},window={},location={hash},root={innerHTML:'',contains:()=>true};
  deps(window);
  window.addEventListener=(name,fn)=>handlers['window.'+name]=fn;
  const document={
    title:'',hidden:false,
    getElementById:id=>id==='production-app'?root:null,
    querySelector(){return null;},querySelectorAll(){return [];},
    addEventListener:(name,fn)=>handlers[name]=fn,
    body:{insertAdjacentHTML(){}}
  };
  class FormDataMock {constructor(f){this.values=f.values||{}}get(k){return this.values[k]??null}getAll(k){return this.values[k]||[]}}
  const script=source('production-os.js').replace('ensure();store();route();',
    'ensure();store();route();window.__test={db,ui,current};');
  runInNewContext(script,{
    window,document,location,FormData:FormDataMock,
    localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,v)=>memory.set(key,String(v))},
    alert(){},confirm:()=>true,prompt:()=>'',setTimeout(){},
    console,Date,Math,JSON,Map,Set,Array,Object,Number,String,Intl,encodeURIComponent,decodeURIComponent
  },{filename:'production-os.js'});
  return {
    window,root,memory,navigate:route=>{location.hash=route;handlers['window.hashchange']();},
    click:(act,id='')=>handlers.click({target:{closest:()=>({dataset:{act,id}})},preventDefault(){}})
  };
}
test('Studio sidebar groups advanced destinations without hiding Events and Studio overview',()=>{
  const h=classic(),html=h.root.innerHTML;
  assert.equal((html.match(/class="nav-group"/g)||[]).length,3);
  assert.match(html,/Plan &amp; design/);
  assert.match(html,/Equipment library/);
  assert.match(html,/Studio management/);
  assert.match(html,/Event workspace/);
  assert.match(html,/production\.html#\/technical\//);
  assert.match(html,/Studio overview/);
  assert.match(html,/data-action="toggle-sidebar"/);
  assert.doesNotMatch(html,/More studio tools/);
  h.navigate('#/equipment');
  assert.match(h.root.innerHTML,/data-group="library" open/);
});
test('Event bookings use focused tabs and switching does not re-render unsaved forms',()=>{
  const h=classic(),before=h.root.innerHTML;
  assert.match(before,/data-tab="details"/);
  assert.match(before,/data-tab="equipment"/);
  assert.match(before,/class="bookings-metrics"/);
  assert.match(before,/production.html#\/home\//);
  h.click('booking-tab',{tab:'equipment'});
  assert.equal(h.root.innerHTML,before);
  assert.equal(h.window.__test.ui.bookingTab,'equipment');
  assert.equal(h.panels[0].hidden,true);
  assert.equal(h.panels[1].hidden,false);
});
test('Studio overview prioritises events and tasks with optional secondary metrics',()=>{
  const h=classic(storage(),'#/overview');
  assert.match(h.root.innerHTML,/Studio overview/);
  assert.match(h.root.innerHTML,/class="studio-more"/);
  assert.match(h.root.innerHTML,/Projects in motion/);
  assert.match(h.root.innerHTML,/Up next/);
  assert.doesNotMatch(h.root.innerHTML,/Every project, from first sketch/);
});
test('Production sidebar uses the same conceptual sections and moves options out of the header',()=>{
  const h=production(),html=h.root.innerHTML;
  assert.equal((html.match(/class="rail-group"/g)||[]).length,4);
  assert.match(html,/Plan &amp; design/);
  assert.match(html,/Deliver the event/);
  assert.match(html,/Library &amp; people/);
  assert.match(html,/Studio management/);
  assert.match(html,/data-act="toggle-rail"/);
  assert.match(html,/class="header-more"/);
  assert.match(html,/Default starting view/);
});
test('Production resolves selected event deep links from the Studio',()=>{
  const h=production(),db=h.window.__test.db;
  db.eventJobs.push({...db.eventJobs[0],id:'event-second',title:'Second event',spaceIds:[...db.eventJobs[0].spaceIds]});
  h.navigate('#/home/event-second');
  assert.equal(h.window.__test.current().id,'event-second');
  assert.match(h.root.innerHTML,/Second event/);
  h.navigate('#/home/venue/event-second');
  assert.equal(h.window.__test.current().id,'event-second');
  assert.match(h.root.innerHTML,/id="event-venue-settings" open/);
  h.navigate('#/technical/event-second');
  assert.equal(h.window.__test.current().id,'event-second');
});
test('Production home shows only four primary tasks and collapses detailed configuration',()=>{
  const h=production(),html=h.root.innerHTML;
  assert.equal((html.match(/class="work-card"/g)||[]).length,4);
  assert.match(html,/class="event-overview-more section"/);
  assert.match(html,/id="event-venue-settings"/);
  assert.doesNotMatch(html,/id="event-venue-settings" open/);
});
test('Advanced forms are available inside disclosures but canonical Venue creation is separate',()=>{
  const h=production();
  h.navigate('#/production');
  assert.match(h.root.innerHTML,/Add person or supplier/);
  assert.match(h.root.innerHTML,/class="workspace-disclosure"/);
  h.navigate('#/entities');
  assert.match(h.root.innerHTML,/Add person or organisation/);
  assert.match(h.root.innerHTML,/Manage venues &amp; spaces/);
  assert.doesNotMatch(h.root.innerHTML,/<option>Venue<\/option><option>Space<\/option>/);
});
test('Production tab labels stay task-focused and retain internal stable IDs',()=>{
  const h=production();
  h.navigate('#/production');
  for(const label of ['Team','Equipment &amp; logistics','Installation','Show schedule']){
    assert.ok(h.root.innerHTML.includes(label),label);
  }
  for(const id of ['team','logistics','installation','show']){
    assert.match(h.root.innerHTML,new RegExp('id="production-'+id+'"'));
  }
});
