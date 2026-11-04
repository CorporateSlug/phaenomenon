// Shared tabbed workspace navigation regression tests.
// Run: node --test tests/workspace-navigation.test.mjs
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
function harness(production=true){
 const map=new Map([
  ['phaenomenon-demo-v1',JSON.stringify({eventJobs:[
   {id:'event-one',title:'Abbotsford Convent',status:'Confirmed'},
   {id:'event-two',title:'Winter Festival',status:'Enquiry'}
  ]})],
  ['phaenomenon-production-prefs-v1',JSON.stringify({eventId:'event-one'})]
 ]);
 const env={production,hash:'#/dashboard'};
 const window={addEventListener(){}};
 const doc={
   readyState:'loading',
   addEventListener(){},
   getElementById:id=>env.production?(id==='production-app'?{}:null):(id==='app'?{}:null),
   querySelector:s=>s==='#event-picker'?{value:'event-one'}:null
 };
 const location={get hash(){return env.hash},set hash(s){env.hash=s}};
 const storage={getItem:key=>map.get(key)||null,setItem:(key,s)=>map.set(key,s)};
 const raw=file('workspace-navigation.js').replace(/\}\)\(\);\s*$/,'window.__test={getRoute,iconFor,sanitize,synchronize,tabs:()=>tabs};})();');
 assert.notEqual(raw,file('workspace-navigation.js'),'Test hooks must be injected');
 runInNewContext(raw,{
   window,document:doc,localStorage:storage,location,
   MutationObserver:class{},queueMicrotask(){},matchMedia(){return {matches:true}},
   encodeURIComponent,decodeURIComponent,Date,Math,JSON,Map,Set,Array,Object,Number,String
 },{filename:'workspace-navigation.js'});
 return {env,window,map,route:()=>window.__test.getRoute(),sync:()=>window.__test.synchronize(),tabs:()=>window.__test.tabs(),icons:window.__test.iconFor,sanitize:window.__test.sanitize};
}
test('Global Home tab is present and icon styles share one SVG design language',()=>{
 const h=harness();
 assert.equal(h.route().key,'home');
 assert.equal(h.tabs()[0].key,'home');
 for(const [label,icon] of [['Event builder','layers'],['Equipment library','package'],['Plan & design','layers'],['Studio management','briefcase'],['All events & schedule','calendar'],['Technical connections','bolt']]){
  assert.equal(h.icons(label),icon);
 }
 const sheet=file('workspace-navigation.css');
 assert.match(sheet,/ph-nav-collapsed/);
 assert.match(sheet,/\.ph-tabs-track/);
 assert.match(sheet,/overflow-x:auto/);
 assert.match(sheet,/flex:0 0 205px/);
 assert.match(sheet,/\.ph-tab-new/);
});
test('Opening event-specific workflows creates separate stable-width, ordered tabs',()=>{
 const h=harness();
 h.sync();
 h.env.hash='#/builder/event-one/brief';h.sync();
 h.env.hash='#/builder/event-two';h.sync();
 h.env.hash='#/technical/event-one';h.sync();
 assert.deepEqual(Array.from(h.tabs(),x=>x.key),['home','builder:event-one','builder:event-two','technical:event-one']);
 assert.equal(h.tabs()[1].href,'production.html#/builder/event-one/brief');
 assert.match(h.tabs()[3].label,/Technical · Abbotsford/);
 h.env.hash='#/builder/event-one/equipment';h.sync();
 assert.equal(h.tabs().length,4,'Builder substeps update their tab instead of creating clones');
 assert.equal(h.tabs()[1].href,'production.html#/builder/event-one/equipment');
 assert.equal(h.tabs()[0].key,'home','Home remains available');
});
test('Switching to Studio preserves event identity and the shared tab set',()=>{
 const h=harness();
 h.env.hash='#/builder/event-one';h.sync();
 h.env.production=false;h.env.hash='#/spaces/event-two';h.sync();
 assert.equal(h.route().key,'spaces:event-two');
 assert.equal(h.route().href,'index.html#/spaces/event-two');
 assert.deepEqual(Array.from(h.tabs(),x=>x.key),['home','builder:event-one','spaces:event-two']);
 assert.match(h.map?.get?.('phaenomenon-open-workspace-tabs-v1')||h.map.get('phaenomenon-open-workspace-tabs-v1'),/spaces:event-two/);
});
test('Tabs only accept workspace-local navigation links from storage',()=>{
 const h=harness();
 const tabs=h.sanitize({tabs:[
  {key:'bad',href:'javascript:alert(1)',label:'Unsafe'},
  {key:'two',href:'index.html#/equipment',label:'Equipment',icon:'package'}
 ]});
 assert.equal(tabs.length,1);
 assert.equal(tabs[0].key,'two');
});
test('Both HTML app entry points mount the same navigation files',()=>{
 for(const html of ['index.html','production.html']){
  const markup=file(html);
  assert.match(markup,/href="workspace-navigation.css"/);
  assert.match(markup,/src="workspace-navigation.js"/);
 }
});
