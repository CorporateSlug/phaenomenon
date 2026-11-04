// Community noticeboard public/private boundary and moderation demo tests.
// Run with: node --test tests/community-board.test.mjs
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function memory(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),map};}
function setup(){
  const window={},storage=memory();
  runInNewContext(src('community-data.js'),{window,localStorage:storage,URL,Date,JSON,Math,String,Number,Array},{filename:'community-data.js'});
  return {C:window.PhaenomenonCommunity,storage,window};
}
const nextDay=()=>{const d=new Date();d.setDate(d.getDate()+45);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
function valid(){return {title:'Neighbourhood music meetup',date:nextDay(),time:'19:00',area:'Brunswick',category:'Music & dance',description:'Come listen to music together',url:'https://example.org/tickets',organiser:'Example volunteers'}}

test('public page is a standalone static entry point with no private workspace imports',()=>{
 const html=src('community.html');
 assert.match(html,/community-data.js/);
 assert.match(html,/community-public.js/);
 assert.match(html,/id="community-submit-form"/);
 assert.doesNotMatch(html,/production-os.js|app.js|workspace-safety.js|venue-workflow.js/);
 assert.doesNotMatch(src('community-public.js'),/phaenomenon-demo-v1|productionOS|eventJobs/);
 assert.match(html,/DEMO ONLY/);
});

test('submitted event remains pending until explicitly approved',()=>{
 const {C,storage}=setup();
 const sent=C.submit(valid(),storage);
 assert.equal(sent.ok,true);
 assert.equal(sent.entry.status,'pending');
 assert.equal(C.pending(storage).length,1);
 assert.equal(C.published(storage).some(x=>x.id===sent.entry.id),false);
 assert.equal(C.review(sent.entry.id,'approved',storage).ok,true);
 assert.equal(C.published(storage).some(x=>x.id===sent.entry.id),true);
 assert.equal(C.pending(storage).length,0);
 assert.equal(C.review(sent.entry.id,'rejected',storage).ok,true);
 assert.equal(C.published(storage).some(x=>x.id===sent.entry.id),false);
 assert.equal(C.review(sent.entry.id,'pending',storage).ok,true);
 assert.equal(C.pending(storage).length,1);
});

test('private planning data is never read, displayed or overwritten by community submission',()=>{
 const {C,storage}=setup();
 const privateValue=JSON.stringify({eventJobs:[{title:'Private internal production',crew:[{name:'Private crew'}]}],invoices:[{total:200}]});
 storage.setItem('phaenomenon-demo-v1',privateValue);
 C.submit(valid(),storage);
 C.review(C.pending(storage)[0].id,'approved',storage);
 const publicJson=JSON.stringify(C.published(storage));
 assert.doesNotMatch(publicJson,/Private internal production|Private crew|200/);
 assert.equal(storage.getItem('phaenomenon-demo-v1'),privateValue);
 assert.equal(C.KEY,'phaenomenon-community-demo-v1');
});

test('separate browsers do not share locally submitted demo data',()=>{
 const {C,storage}=setup(),other=memory();
 const approved=C.submit(valid(),storage).entry;
 C.review(approved.id,'approved',storage);
 assert.equal(C.published(other).some(e=>e.id===approved.id),false);
 assert.equal(C.published(storage).some(e=>e.id===approved.id),true);
 assert.ok(C.examples().every(e=>e.sample===true));
});

test('invalid submissions and unsafe external links are rejected',()=>{
 const {C,storage}=setup();
 for(const edits of [{date:'2026-02-29'},{date:'invalid'},{title:'a'},{url:'javascript:alert(1)'},{url:'data:text/html,stuff'},{category:'Fake category'}]){
  const result=C.submit({...valid(),...edits},storage);
  assert.ok(result.error,JSON.stringify(edits));
 }
 assert.equal(C.read(storage).entries.length,0);
 assert.equal(C.safeUrl('javascript:alert(1)'),'');
 assert.match(C.safeUrl('https://example.org/link'),/^https:\/\//);
 assert.match(C.escape('<img onerror="x">'),/&lt;img/);
});

test('moderation UI only shows submitted public fields with explicit review actions',()=>{
 const {C,storage,window}=setup();
 const entry=C.submit({...valid(),description:'Queer-friendly music night'},storage).entry;
 runInNewContext(src('community-admin.js'),{window,localStorage:storage,Date,JSON},{filename:'community-admin.js'});
 const html=window.PhaenomenonCommunityAdmin.render();
 assert.match(html,/Waiting for review/);
 assert.match(html,/Neighbourhood music meetup/);
 assert.match(html,/data-act="community-review"/);
 assert.match(html,/data-status="approved"/);
 assert.match(html,/DEMO ONLY/);
 assert.match(html,/Open public page/);
 assert.equal(C.read(storage).entries.find(x=>x.id===entry.id).status,'pending');
});

test('Phaenomenon exposes separate internal moderation and public preview',()=>{
 const internal=src('production-os.js'),html=src('production.html'),home=src('home-dashboard.js'),tabs=src('workspace-navigation.js');
 assert.match(internal,/ui.view==='community'/);
 assert.match(internal,/community-review/);
 assert.match(internal,/model.review\(id,status\)/);
 assert.match(html,/community-data.js/);
 assert.match(html,/community-admin.js/);
 assert.match(internal,/Community noticeboard/);
 assert.doesNotMatch(home,/Go to workspace/);
 assert.match(tabs,/community-review/);
});

test('demo seeding adds public and review examples once, retaining existing submissions',()=>{
 const {C,storage}=setup();
 const external=C.submit(valid(),storage).entry;
 assert.equal(C.ensureDemo(storage).ok,true);
 const all=C.read(storage).entries;
 assert.equal(all.length,4,'existing submission + 2 review examples + 1 own listing');
 assert.equal(all.find(x=>x.id===external.id)?.status,'pending');
 assert.equal(all.filter(x=>x.sample&&x.status==='pending').length,2);
 assert.equal(all.filter(x=>x.sample&&x.status==='approved'&&x.source==='admin').length,1);
 assert.equal(C.published(storage).length,4,'3 built-in examples plus approved own listing');
 const first=JSON.stringify(C.read(storage));
 assert.equal(C.ensureDemo(storage).added,0);
 assert.equal(JSON.stringify(C.read(storage)),first,'subsequent visits must not reset moderation or duplicate seeds');
 const queued=all.find(x=>x.id==='demo-review-dance');
 assert.ok(queued);
 C.review(queued.id,'rejected',storage);
 C.ensureDemo(storage);
 assert.equal(C.read(storage).entries.find(x=>x.id===queued.id).status,'rejected');
});
test('Aaron can publish his own listing directly or save it for review',()=>{
 const {C,storage}=setup();C.ensureDemo(storage);
 const pub=C.createAdmin({...valid(),title:'Phaenomenon night',organiser:''},'approved',storage);
 assert.equal(pub.ok,true);
 assert.equal(pub.entry.source,'admin');
 assert.equal(pub.entry.organiser,'Phaenomenon');
 assert.equal(pub.entry.status,'approved');
 assert.equal(pub.entry.sample,false);
 assert.ok(C.published(storage).some(x=>x.id===pub.entry.id));
 const draft=C.createAdmin({...valid(),title:'Possible craft night'},'pending',storage);
 assert.equal(draft.ok,true);
 assert.equal(draft.entry.status,'pending');
 assert.ok(C.pending(storage).some(x=>x.id===draft.entry.id));
 assert.equal(C.published(storage).some(x=>x.id===draft.entry.id),false);
 assert.match(C.createAdmin({...valid(),url:'javascript:alert(1)'},'approved',storage).error,/valid http/i);
 assert.match(C.createAdmin(valid(),'rejected',storage).error,/publish now/i);
});
test('Aaron sees example events on both sides and has a functional create-listing form',()=>{
 const {C,storage,window}=setup();
 runInNewContext(src('community-admin.js'),{window,localStorage:storage,Date,JSON},{filename:'community-admin.js'});
 const page=window.PhaenomenonCommunityAdmin.render();
 assert.match(page,/Small dancefloor meetup · demo/);
 assert.match(page,/Queer craft & repair circle · demo/);
 assert.match(page,/Phaenomenon open decks · demo/);
 assert.match(page,/Community listening night/);
 assert.match(page,/Built-in example · read-only/);
 assert.match(page,/id="community-admin-create-form"/);
 assert.match(page,/name="publishMode"/);
 assert.match(page,/value="approved"/);
 assert.match(page,/value="pending"/);
 assert.match(page,/data-act="community-review"/);
 assert.equal(C.pending(storage).length,2);
});
test('Production creates admin listings through a distinct form, not the private production booking form',()=>{
 const script=src('production-os.js');
 assert.match(script,/f.id==='community-admin-create-form'/);
 assert.match(script,/model.createAdmin\(fields/);
 assert.match(script,/publishMode/);
 assert.doesNotMatch(src('community-public.js'),/createAdmin\(/);
});
