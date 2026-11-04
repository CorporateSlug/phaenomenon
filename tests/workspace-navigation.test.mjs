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
   'window.__test={getRoute,iconFor,sanitize,synchronize,openExplicitTab,closeTab,activate,tabs:()=>tabs,selected:()=>selected};})();');
 assert.notEqual(raw,file('workspace-navigation.js'),'Test hooks must be injected');
 runInNewContext(raw,{
   window,document:doc,localStorage:storage,sessionStorage,location,
   MutationObserver:class{},queueMicrotask(){},matchMedia(){return {matches:true}},
   encodeURIComponent,decodeURIComponent,Date,Math,JSON,Map,Set,Array,Object,Number,String
 },{filename:'workspace-navigation.js'});
 const api=window.__test;
 return {env,map,session,route:api.getRoute,sync:api.synchronize,openNew:api.openExplicitTab,
   close:api.closeTab,activate:api.activate,tabs:api.tabs,selected:api.selected,
   iconFor:api.iconFor,sanitize:api.sanitize};
}
test('Home stays pinned and sidebar destinations use the same line icon scheme',()=>{
 const h=harness();
 h.sync();
 assert.equal(h.route().key,'home');
 assert.deepEqual(Array.from(h.tabs(),t=>t.id),['home']);
 for(const [name,icon] of [['Event builder','layers'],['Equipment library','package'],
  ['Plan & design','layers'],['Studio management','briefcase'],
  ['All events & schedule','calendar'],['Technical connections','bolt']]){
  assert.equal(h.iconFor(name),icon);
 }
 const sheet=file('workspace-navigation.css');
 assert.match(sheet,/ph-nav-collapsed/);
 assert.match(sheet,/\.ph-tab-picker/);
 assert.match(sheet,/\.ph-tabs-track/);
 assert.match(sheet,/overflow-x:auto/);
 assert.match(sheet,/\.ph-tab-new/);
});
test('Ordinary navigation reuses the current tab instead of automatically adding tabs',()=>{
 const h=harness();
 h.sync();
 h.env.hash='#/builder/event-one/brief';h.sync();
 const slot=h.tabs()[1].id;
 assert.equal(h.tabs().length,2,'Initial navigation uses one working slot alongside Home');
 h.env.hash='#/builder/event-two';h.sync();
 h.env.hash='#/technical/event-one';h.sync();
 h.env.hash='#/production/team/event-one';h.sync();
 assert.equal(h.tabs().length,2,'Multiple sidebar clicks must not grow the tab strip');
 assert.equal(h.tabs()[1].id,slot);
 assert.equal(h.tabs()[1].href,'production.html#/production/team/event-one');
 h.env.hash='#/dashboard';h.sync();
 assert.equal(h.selected(),'home');
 assert.equal(h.tabs()[1].id,slot,'Navigating Home keeps the last workspace');
 h.env.hash='#/events';h.sync();
 assert.equal(h.tabs().length,2,'Leaving Home reuses the previous working slot');
 assert.equal(h.tabs()[1].id,slot);
});
test('Only an explicit new-tab action creates an additional independently navigable view',()=>{
 const h=harness();h.sync();
 h.env.hash='#/builder/event-one';h.sync();
 const first=h.tabs()[1].id;
 h.openNew('production.html#/technical/event-two');h.sync();
 assert.equal(h.tabs().length,3);
 const second=h.tabs()[2].id;
 assert.notEqual(first,second);
 assert.equal(h.tabs()[1].href,'production.html#/builder/event-one');
 assert.equal(h.tabs()[2].href,'production.html#/technical/event-two');
 h.env.hash='#/crew/event-two';h.sync();
 assert.equal(h.tabs().length,3);
 assert.equal(h.tabs()[2].id,second);
 assert.equal(h.tabs()[2].href,'production.html#/crew/event-two');
 h.activate(first);h.env.hash='#/builder/event-one';h.sync();
 assert.equal(h.tabs()[1].href,'production.html#/builder/event-one');
 assert.equal(h.tabs()[2].href,'production.html#/crew/event-two');
});
test('Closing an active tab chooses another without deleting event data',()=>{
 const h=harness();h.sync();
 h.env.hash='#/builder/event-one';h.sync();
 const first=h.tabs()[1].id;
 h.openNew('production.html#/crew/event-two');h.sync();
 const second=h.tabs()[2].id;
 h.close(second);
 assert.equal(h.tabs().length,2);
 assert.equal(h.selected(),first);
 assert.equal(h.env.href,'production.html#/builder/event-one');
 assert.match(h.map.get('phaenomenon-demo-v1'),/event-two/);
 h.close(first);
 assert.equal(h.tabs().length,1);
 assert.equal(h.selected(),'home');
 assert.equal(h.env.href,'production.html#/dashboard');
});
test('Studio and Production share explicit tabs while preserving scoped event routes',()=>{
 const h=harness();h.sync();
 h.env.hash='#/builder/event-one';h.sync();
 h.openNew('index.html#/spaces/event-two');h.sync();
 assert.equal(h.route().key,'spaces:event-two');
 assert.equal(h.tabs().length,3);
 assert.equal(h.tabs()[2].href,'index.html#/spaces/event-two');
 h.env.hash='#/equipment';h.sync();
 assert.equal(h.tabs().length,3);
 assert.equal(h.tabs()[2].href,'index.html#/equipment');
 assert.match(h.map.get('phaenomenon-open-workspace-tabs-v2'),/index.html#\/equipment/);
});
test('Legacy auto-generated tab history is ignored and unsafe tab URLs are rejected',()=>{
 const h=harness();
 h.map.set('phaenomenon-open-workspace-tabs-v1',JSON.stringify({tabs:[
  {key:'builder:event-one',href:'production.html#/builder/event-one',label:'Old automatic tab'}
 ]}));
 assert.equal(h.tabs().length,1,'Old automatic tab history does not clutter the new bar');
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
