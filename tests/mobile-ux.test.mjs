// Mobile Studio/Production information architecture and interaction tests.
// Run: node --test tests/mobile-ux.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const classList=()=>{
  const state=new Set();
  return {
    contains:n=>state.has(n),
    add:n=>state.add(n),
    remove:n=>state.delete(n),
    toggle:(n,forced)=>{
      const active=forced===undefined?!state.has(n):!!forced;
      if(active)state.add(n);else state.delete(n);
      return active;
    }
  };
};
function harness(mode){
  const events={},window={},storage=new Map(),location={hash:mode==='studio'?'#/bookings':'#/builder'};
  window.addEventListener=(name,fn)=>(events['window.'+name]??=[]).push(fn);
  const root={innerHTML:'',contains(){return true}};
  const sidebar={classList:classList(),querySelector(){return {focus(){},setAttribute(){}}}};
  const body={classList:classList(),insertAdjacentHTML(){}};
  const document={
    title:'',hidden:false,body,
    getElementById:id=>id===(mode==='studio'?'app':'production-app')?root:
      id===(mode==='studio'?'studio-sidebar':'production-rail')?sidebar:
      id==='import-file'?{addEventListener(){},value:''}:null,
    querySelector(){return null},querySelectorAll(){return []},
    addEventListener:(name,fn)=>(events[name]??=[]).push(fn)
  };
  for(const source of ['venue-geometry.js','multi-space.js','venue-workflow.js','event-builder.js','workspace-safety.js']){
    runInNewContext(file(source),{window},{filename:source});
  }
  if(mode==='studio')window.PhaenomenonSpacePlanner={ensure(){},mount(){}};
  class FormDataMock {
    constructor(form){this.values=form.values||{}}
    get(name){return this.values[name]??null}
    getAll(name){return this.values[name]||[]}
  }
  const environment={
    window,document,location,FormData:FormDataMock,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))},
    setTimeout(){},alert(){},confirm:()=>true,prompt:()=>'',console,
    Date,Math,JSON,Intl,Number,String,Array,Object,Map,Set,
    encodeURIComponent,decodeURIComponent
  };
  const name=mode==='studio'?'app.js':'production-os.js';
  runInNewContext(file(name),environment,{filename:name});
  return {
    root,body,sidebar,location,
    click(action){
      const dataset=mode==='studio'?{action}:{act:action};
      const node={dataset,closest(selector){
        if(selector==='[data-action]'&&mode==='studio')return this;
        if(selector==='[data-act]'&&mode==='production')return this;
        return null;
      }};
      for(const fn of events.click||[])fn({target:node,preventDefault(){}});
    },
    navigate(hash){
      location.hash=hash;
      for(const fn of events['window.hashchange']||[])fn();
    }
  };
}

test('Studio phone dock has four useful destinations and keeps the full desktop menu',()=>{
  const h=harness('studio'),markup=h.root.innerHTML;
  assert.match(markup,/<nav class="studio-mobile-dock"/);
  assert.equal((markup.match(/class="studio-mobile-tab/g)||[]).length,4);
  for(const label of ['Events','Build','3D','More'])assert.ok(markup.includes('>'+label+'</span>'),label);
  assert.match(markup,/production\.html#\/builder\//);
  assert.match(markup,/class="nav-group"/);
  assert.match(markup,/id="studio-navigation"/);
});
test('Studio mobile menu opens, dismisses and resets on navigation',()=>{
  const h=harness('studio');
  h.click('toggle-sidebar');
  assert.equal(h.sidebar.classList.contains('is-expanded'),true);
  assert.equal(h.body.classList.contains('ph-studio-menu-open'),true);
  h.click('close-sidebar');
  assert.equal(h.sidebar.classList.contains('is-expanded'),false);
  h.click('toggle-sidebar');
  h.navigate('#/overview');
  assert.equal(h.body.classList.contains('ph-studio-menu-open'),false);
});
test('Studio phone event chooser preserves the selected booking while keeping the desktop list',()=>{
  const h=harness('studio'),markup=h.root.innerHTML;
  assert.match(markup,/class="mobile-event-switch"/);
  assert.match(markup,/class="mobile-event-options"/);
  assert.match(markup,/class="panel event-side"/);
  assert.match(markup,/class="panel event-work"/);
  assert.match(markup,/data-action="select-booking"/);
});
test('Production phone navigation has five primary tasks and retains full navigation',()=>{
  const h=harness('production'),markup=h.root.innerHTML;
  assert.match(markup,/class="mobile-tabbar production-mobile-tabs"/);
  assert.equal((markup.match(/<a class="mobile-tab/g)||[]).length,4);
  assert.match(markup,/class="mobile-tab mobile-more-tab/);
  for(const label of ['Build','3D','Tech','Crew','More'])assert.ok(markup.includes('>'+label+'</span>'),label);
  assert.match(markup,/id="production-navigation"/);
  assert.match(markup,/rail-quick-new/);
  assert.match(markup,/data-act="builder-new"/);
  assert.match(markup,/id="event-picker"/);
});
test('Production mobile More can close by backdrop and navigation',()=>{
  const h=harness('production');
  h.click('toggle-rail');
  assert.equal(h.sidebar.classList.contains('is-expanded'),true);
  assert.equal(h.body.classList.contains('ph-mobile-menu-open'),true);
  h.click('close-rail');
  assert.equal(h.sidebar.classList.contains('is-expanded'),false);
  h.click('toggle-rail');
  h.navigate('#/technical');
  assert.equal(h.body.classList.contains('ph-mobile-menu-open'),false);
  assert.match(h.root.innerHTML,/Technical connections/);
});
test('iPhone viewport, touch target and safe-area support is present in both views',()=>{
  for(const html of ['index.html','production.html'])assert.match(file(html),/viewport-fit=cover/);
  const light=file('styles.css'),dark=file('production.css'),sheets=file('venue-workflow.css');
  assert.match(light,/PH MOBILE UX • Studio/);
  assert.match(light,/env\(safe-area-inset-bottom/);
  assert.match(light,/\.mobile-event-switch/);
  assert.match(light,/\.modal-backdrop,\.drawer-backdrop\{z-index:1250\}/);
  assert.match(dark,/PH MOBILE UX • Production/);
  assert.match(dark,/\.production-mobile-tabs/);
  assert.match(dark,/\.mobile-local-note/);
  assert.match(sheets,/Phone dialogs behave like compact sheets/);
  assert.match(sheets,/max-height:calc\(100dvh - 8px\)/);
});
test('Specialist phone tools retain horizontal tables and larger space tabs',()=>{
  const tech=file('technical-planner.css'),spaces=file('multi-space.css');
  assert.match(tech,/PH MOBILE UX • technical workflow/);
  assert.match(tech,/\.tech-table-wrap/);
  assert.match(tech,/\.tech-flow-track/);
  assert.match(spaces,/PH MOBILE UX • reusable Venue\/Space editing/);
  assert.match(spaces,/\.msp-tabs button\{flex:0 0 auto;min-height:43px/);
});
