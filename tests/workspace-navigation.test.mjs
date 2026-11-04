// Intentional workspace tabs, sidebar and persistence regression tests.
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
 const session=new Map();
 const env={production,hash:production?'#/dashboard':'#/overview',href:''};
 const window={addEventListener(){}};
 const doc={
   readyState:'loading',
   addEventListener(){},
   getElementById:id=>env.production?(id==='production-app'?{}:null):(id==='app'?{}:null),
   querySelector:s=>s==='#event-picker'?{value:'event-one'}:null
 };
 const location={
   get hash(){return env.hash},
   set hash(s){env.hash=s},
   get href(){return env.href},
   set href(s){env.href=s;env.hash='#/'+(s.split('#/')[1]||'dashboard');env.production=s.startsWith('production.html')}
 };
 const storage={getItem:key=>map.get(key)||null,setItem:(key,s)=>map.set(key,s)};
 const sessionStorage={getItem:key=>session.get(key)||null,setItem:(key,s)=>session.set(key,s)};
 const raw=file('workspace-navigation.js').replace(/\}\)\(\);\s*$/,
   'window.__test={getRoute,iconFor,sanitize,synchronize,openExplicitTab,openRecordTab,closeTab,activate,tabs:()=>tabs,selected:()=>selected};})();');
 assert.notEqual(raw,file('workspace-navigation.js'),'Test hooks must be injected');
 runInNewContext(raw,{
   window,document:doc,localStorage:storage,sessionStorage,location,
   MutationObserver:class{},queueMicrotask(){},matchMedia(){return {matches:true}},
   encodeURIComponent,decodeURIComponent,Date,Math,JSON,Map,Set,Array,Object,Number,String
 },{filename:'workspace-navigation.js'});
 const api=window.__test;
 return {env,map,session,route:api.getRoute,sync:api.synchronize,openNew:api.openExplicitTab,
   close:api.closeTab,activate:api.activate,openRecord:api.openRecordTab,tabs:api.tabs,selected:api.selected,
   iconFor:api.iconFor,sanitize:api.sanitize};
}
test('Home is a normal closable workspace and sidebar icons remain consistent',()=>{
 const h=harness();
 h.sync();
 assert.equal(h.route().key,'home');
 assert.equal(h.tabs().length,1,'Initial dashboard opens one ordinary workspace');
 assert.equal(h.tabs()[0].key,'home');
 assert.notEqual(h.tabs()[0].id,'home','New sessions never generate a special pinned Home ID');
 for(const [name,icon] of [['Event builder','layers'],['Equipment library','package'],
  ['Plan & design','layers'],['Studio management','briefcase'],
  ['All events & schedule','calendar'],['Technical connections','bolt']]){
  assert.equal(h.iconFor(name),icon);
 }
 const js=file('workspace-navigation.js'),sheet=file('workspace-navigation.css');
 assert.doesNotMatch(js,/if\(i<0\|\|id==='home'\)/,'Home must not be protected from close');
 assert.match(js,/data-close-id/);
 assert.match(js,/Home dashboard/,'Home is available via the deliberate new-tab menu');
 assert.match(sheet,/ph-nav-collapsed/);
 assert.match(sheet,/\.ph-tab-picker/);
 assert.match(sheet,/\.ph-tabs-track/);
 assert.match(sheet,/overflow-x:auto/);
 assert.match(sheet,/\.ph-tab-new/);
 assert.match(sheet,/\.ph-tabs-empty/);
 assert.match(sheet,/border-radius:10px/);
 assert.match(js,/No open tabs/);
});
test('Collection navigation reuses one browse tab while preserving open records',()=>{
 const h=harness();h.sync();
 const initial=h.tabs()[0].id;
 h.env.hash='#/events';h.sync();
 assert.equal(h.tabs().length,1);
 assert.equal(h.tabs()[0].id,initial);
 h.openRecord('production.html#/home/event-one');h.sync();
 assert.equal(h.tabs().length,2);
 assert.equal(h.tabs()[1].key,'overview:event-one');
 h.env.hash='#/entities';h.sync();
 assert.equal(h.tabs().length,2,'Sidebar browsing does not overwrite an event record tab');
 assert.equal(h.tabs()[0].key,'directory');
 assert.equal(h.tabs()[1].key,'overview:event-one');
 h.env.hash='#/equipment';h.sync();
 assert.equal(h.tabs().length,2);
 assert.equal(h.tabs()[0].key,'equipment-library');
});
test('Existing record tabs are reused and a new draft keeps its own tab',()=>{
 const h=harness();h.sync();
 h.env.hash='#/equipment';h.sync();
 h.openRecord('production.html#/equipment/equipment-one');h.sync();
 const recordId=h.selected();
 h.openRecord('production.html#/equipment/equipment-one');h.sync();
 assert.equal(h.tabs().length,2);
 assert.equal(h.selected(),recordId);
 h.openRecord('production.html#/new/event/draft-one');h.sync();
 assert.equal(h.tabs().length,3);
 assert.equal(h.tabs()[2].key,'draft:event:draft-one');
 h.env.hash='#/events';h.sync();
 assert.equal(h.tabs().length,3);
 assert.ok(h.tabs().some(t=>t.key==='draft:event:draft-one'),'Switching collections must not discard the draft');
});
test('Only explicit + creates another independently navigable workspace',()=>{
 const h=harness();h.sync();
 h.env.hash='#/builder/event-one';h.sync();
 const first=h.tabs()[0].id;
 h.openNew('production.html#/technical/event-two');h.sync();
 assert.equal(h.tabs().length,2);
 const second=h.tabs()[1].id;
 assert.notEqual(first,second);
 assert.equal(h.tabs()[0].href,'production.html#/builder/event-one');
 assert.equal(h.tabs()[1].href,'production.html#/technical/event-two');
 h.env.hash='#/crew/event-two';h.sync();
 assert.equal(h.tabs().length,2);
 assert.equal(h.tabs()[1].id,second);
 assert.equal(h.tabs()[1].href,'production.html#/crew/event-two');
 h.activate(first);h.env.hash='#/builder/event-one';h.sync();
 assert.equal(h.tabs()[0].href,'production.html#/builder/event-one');
 assert.equal(h.tabs()[1].href,'production.html#/crew/event-two');
});
test('Closing Home and last remaining tab never removes event data or re-pins Home',()=>{
 const h=harness();h.sync();
 const first=h.tabs()[0].id;
 h.openNew('production.html#/crew/event-two');h.sync();
 const second=h.tabs()[1].id;
 h.close(first);
 assert.equal(h.tabs().length,1,'Home and other workspaces have equal close permissions');
 assert.equal(h.selected(),second);
 h.close(second);
 assert.equal(h.tabs().length,0);
 assert.equal(h.selected(),'');
 assert.equal(h.env.href,'production.html#/dashboard','Closing last tab shows dashboard');
 assert.match(h.map.get('phaenomenon-demo-v1'),/event-two/);
 assert.equal(JSON.parse(h.map.get('phaenomenon-open-workspace-tabs-v2')).emptyHome,true);
 h.sync();
 assert.equal(h.tabs().length,0,'Dashboard must not silently recreate a tab after final close');
 h.env.hash='#/events';h.sync();
 assert.equal(h.tabs().length,1,'An explicit navigation can open a new working slot');
});
test('Home can be deliberately reopened in a fresh tab',()=>{
 const h=harness();h.sync();
 const first=h.tabs()[0].id;
 h.close(first);h.sync();
 assert.equal(h.tabs().length,0);
 h.openNew('production.html#/dashboard');h.sync();
 assert.equal(h.tabs().length,1);
 assert.equal(h.tabs()[0].key,'home');
 assert.equal(h.selected(),h.tabs()[0].id);
 assert.equal(JSON.parse(h.map.get('phaenomenon-open-workspace-tabs-v2')).emptyHome,false);
});
test('Studio and Production share explicitly opened tabs with event-specific routes',()=>{
 const h=harness();h.sync();
 h.env.hash='#/builder/event-one';h.sync();
 h.openNew('index.html#/spaces/event-two');h.sync();
 assert.equal(h.route().key,'spaces:event-two');
 assert.equal(h.tabs().length,2);
 assert.equal(h.tabs()[1].href,'index.html#/spaces/event-two');
 h.env.hash='#/equipment';h.sync();
 assert.equal(h.tabs().length,3,'Studio equipment browsing gets a collection tab, preserving 3D record');
 assert.equal(h.tabs()[2].href,'index.html#/equipment');
 assert.match(h.map.get('phaenomenon-open-workspace-tabs-v2'),/index.html#\/equipment/);
});
test('Legacy auto-generated history is ignored and unsafe destinations rejected',()=>{
 const h=harness();
 h.map.set('phaenomenon-open-workspace-tabs-v1',JSON.stringify({tabs:[
  {key:'builder:event-one',href:'production.html#/builder/event-one',label:'Old automatic tab'}
 ]}));
 assert.equal(h.tabs().length,0,'Old history does not clutter a fresh session');
 h.sync();
 assert.equal(h.tabs().length,1,'Fresh dashboard opens a single ordinary tab');
 const safe=h.sanitize({tabs:[
  {id:'bad',key:'unsafe',href:'javascript:alert(1)',label:'Bad'},
  {id:'valid',key:'equipment',href:'index.html#/equipment',label:'Equipment',icon:'package'}
 ]});
 assert.equal(safe.length,1);
 assert.equal(safe[0].id,'valid');
});
test('Both app entry points load a shared tab and icon design system',()=>{
 for(const html of ['index.html','production.html']){
  assert.match(file(html),/href="workspace-navigation.css"/);
  assert.match(file(html),/src="workspace-navigation.js"/);
 }
});

test('Closeout deep links preserve the selected event and production tab context',()=>{
 const h=harness();
 h.env.hash='#/production/closeout/event-two';
 const route=h.route();
 assert.equal(route.key,'production:event-two');
 assert.equal(route.href,'production.html#/production/closeout/event-two');
 assert.match(route.label,/Closeout · Winter Festival/);
 assert.equal(route.icon,'check');
});

test('Production navigation is a stable collection list with Community at the bottom',()=>{
 const src=file('production-os.js');
 for(const label of ['Dashboard','Events & schedule','People & organisations',
   'Venues & spaces','Equipment & fixtures','Finances','Community noticeboard']){
   assert.ok(src.includes(label),label);
 }
 assert.ok(src.indexOf("navItem('#/equipment'")<src.indexOf("navItem('#/finances'"));
 assert.ok(src.indexOf("navItem('#/finances'")<src.indexOf("rail-community-section"));
 assert.match(src,/ui.view==='new'\?window.PhaenomenonCollections.create/);
 assert.doesNotMatch(src,/id="event-picker"/);
 const css=file('production.css');
 assert.match(css,/\.rail-community-section\s*\{\s*margin-top:auto/);
});
test('Floating tabs and desktop header controls follow a consistent sizing rhythm',()=>{
 const css=file('workspace-navigation.css'),production=file('production.css');
 assert.match(css,/flex:0 0 202px;\s*width:202px;min-width:202px;max-width:202px/);
 assert.match(css,/min-height:36px;height:36px/);
 assert.match(css,/width:36px;height:36px/);
 assert.match(css,/\.ph-workspace-tabs\s*\{[^}]*padding:7px 16px/);
 assert.match(css,/\.ph-workspace-tab\s*\{[^}]*border:1px solid #334752/);
 assert.match(css,/border-radius:10px/);
 assert.match(production,/\.header-more/);
 assert.match(file('production-os.js'),/class="header-tools"><details class="header-more"/);
 assert.doesNotMatch(file('production-os.js'),/id="event-picker"/);
});
