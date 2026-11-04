// Unified Event Workspace — lifecycle, routing and explicit community publication.
// Run: node --test tests/event-workspace.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const scripts=['event-lifecycle.js','event-lifecycle-ui.js','event-builder.js','home-dashboard.js','community-data.js','community-admin.js','event-workspace.js','production-os.js'];
class MockFormData{
  constructor(el){this.values=el.values||{};}
  get(key){return this.values[key]??null;}
  getAll(key){return this.values[key]??[];}
}
function harness(hash='#/home'){
 const local=new Map(),handlers={},root={innerHTML:'',contains:()=>true};
 const window={addEventListener:(name,fn)=>handlers['window.'+name]=fn};
 const location={hash};
 const document={
  title:'',body:{insertAdjacentHTML(){}},getElementById:id=>id==='production-app'?root:null,
  querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(name,fn)=>handlers[name]=fn
 };
 const notices=[];
 const localStorage={getItem:key=>local.get(key)||null,setItem:(key,v)=>local.set(key,String(v))};
 const sandbox={window,document,location,localStorage,FormData:MockFormData,
  URL,Date,Math,JSON,Intl,String,Number,Array,Object,Map,Set,encodeURIComponent,decodeURIComponent,
  alert:message=>notices.push(message),confirm:()=>true,prompt:()=>'',setTimeout(){},console
 };
 for(const script of scripts)runInNewContext(read(script),sandbox,{filename:script});
 const getDb=()=>JSON.parse(local.get('phaenomenon-demo-v1'));
 const navigate=route=>{location.hash=route;handlers['window.hashchange']();};
 const submit=(id,values,eventId)=>{
   const form={id,values,dataset:eventId?{eventId}:{}};
   handlers.submit({target:form,preventDefault(){}});
 };
 const click=(act,id)=>{
   const button={dataset:{act,id}};
   handlers.click({target:{closest:s=>s==='[data-act]'?button:null},preventDefault(){}});
 };
 const readPublic=()=>window.PhaenomenonCommunity.read(localStorage);
 const refresh=()=>handlers['window.storage']?.({key:'phaenomenon-demo-v1'});
 return {window,root,local,localStorage,location,notices,readPublic,submit,click,navigate,getDb,refresh};
}
function future(days=60){
 const d=new Date();d.setDate(d.getDate()+days);
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
const emptyValues=(name,lead='studio')=>({
 title:name,eventLead:lead,bookingStage:'idea',dateCertainty:'unknown',date:'',
 targetMonth:'',dateNotes:'',nextAction:'',followUpDate:'',clientId:''
});
test('An undated own concept opens a connected, uncluttered event workspace',()=>{
 const h=harness('#/dashboard');
 h.submit('builder-new-event-form',{...emptyValues('Phaenomenon Summer Party'),
  nextAction:'Ask local venue about possible dates',targetMonth:'2027-01',dateCertainty:'indicative'});
 const e=h.getDb().eventJobs.find(x=>x.title==='Phaenomenon Summer Party');
 assert.ok(e);
 assert.equal(h.location.hash,'#/home/'+encodeURIComponent(e.id),'new events should open the unified workspace');
 assert.equal(e.lifecycle.eventLead,'studio');
 assert.equal(e.date,'');
 assert.match(h.root.innerHTML,/Develop this event/);
 assert.match(h.root.innerHTML,/RECOMMENDED NEXT/);
 assert.match(h.root.innerHTML,/Ask local venue about possible dates/);
 assert.match(h.root.innerHTML,/Production and finance workspaces/);
 assert.match(h.root.innerHTML,/Public community listing/);
 assert.match(h.root.innerHTML,/Not published/);
 assert.match(h.root.innerHTML,/No self-invoice required|Public details are separate/);
});
test('Confirmed client production surfaces design and issue resolution before closure',()=>{
 const h=harness('#/dashboard');
 const date=future(90);
 h.submit('builder-new-event-form',{...emptyValues('Confirmed client show','client'),
  bookingStage:'confirmed',date,dateCertainty:'confirmed'});
 const e=h.getDb().eventJobs.find(x=>x.title==='Confirmed client show');
 assert.ok(e);
 const L=h.window.PhaenomenonLifecycle;
 const db=h.getDb();
 db.productionOS.issues.push({id:'workspace-issue',eventId:e.id,status:'Open'});
 h.local.set('phaenomenon-demo-v1',JSON.stringify(db));
 h.refresh();
 h.navigate('#/home/'+encodeURIComponent(e.id));
 assert.match(h.root.innerHTML,/Manage this production/);
 assert.match(h.root.innerHTML,/unresolved production issue/);
 assert.match(h.root.innerHTML,/3D design &amp; equipment/);
 assert.match(h.root.innerHTML,/Technical connections/);
 assert.match(h.root.innerHTML,/Budget &amp; invoices/);
 assert.match(h.root.innerHTML,/Post-event closeout/);
 assert.doesNotMatch(h.root.innerHTML,/class="ew-extra-tools"/);
});
test('Delivered and closed work prioritises financial/operational closeout, not 3D design',()=>{
 const h=harness('#/dashboard'),C=h.window.PhaenomenonLifecycle;
 h.submit('builder-new-event-form',{...emptyValues('Delivered event','client'),bookingStage:'confirmed',
  date:future(65),dateCertainty:'confirmed'});
 const e=h.getDb().eventJobs.find(x=>x.title==='Delivered event');
 h.navigate('#/builder/'+encodeURIComponent(e.id)+'/brief');
 h.submit('builder-basics-form',{title:e.title,eventLead:'client',bookingStage:'confirmed',
  productionStage:'delivered',date:e.date,dateCertainty:'confirmed'});
 h.navigate('#/home/'+encodeURIComponent(e.id));
 assert.match(h.root.innerHTML,/Complete post-event closeout/);
 assert.match(h.root.innerHTML,/9 of 9 closeout items remaining/);
 const db=h.getDb(),ev=db.eventJobs.find(x=>x.id===e.id);
 for(const task of C.TASKS)assert.equal(C.updateTask(db,ev,task.id,'na','No services incurred in demo').ok,true);
 assert.equal(C.closeEvent(db,ev).ok,true);
 h.local.set('phaenomenon-demo-v1',JSON.stringify(db));
 h.refresh();
 h.navigate('#/home/'+encodeURIComponent(e.id));
 assert.match(h.root.innerHTML,/Event archived/);
 assert.match(h.root.innerHTML,/Review closure/);
});
test('A public-listing preview has no private fields, and explicit publication is editable without duplicates',()=>{
 const h=harness('#/dashboard');
 h.submit('builder-new-event-form',emptyValues('Own DJ idea'));
 const e=h.getDb().eventJobs.find(x=>x.title==='Own DJ idea');
 const db=h.getDb();db.eventJobs.find(x=>x.id===e.id).notes='PRIVATE: crew phone / technical notes / budget';
 h.local.set('phaenomenon-demo-v1',JSON.stringify(db));
 h.refresh();
 h.navigate('#/home/'+encodeURIComponent(e.id)+'/publish');
 assert.match(h.root.innerHTML,/event-publication-form/);
 assert.match(h.root.innerHTML,/publishConsent/);
 assert.match(h.root.innerHTML,/Live preview/);
 assert.doesNotMatch(h.root.innerHTML,/PRIVATE: crew phone/);
 const data={title:'Public DJ night',date:future(40),time:'19:30',area:'Brunswick',
  venue:'Public venue TBA',category:'Music & dance',organiser:'Phaenomenon',
  description:'An open community listening night',url:'',publishMode:'pending',publishConsent:'yes'};
 h.submit('event-publication-form',data,e.id);
 let listing=h.readPublic().entries.filter(x=>x.title==='Public DJ night');
 assert.equal(listing.length,1);
 assert.equal(listing[0].status,'pending');
 const privateId=h.getDb().eventJobs.find(x=>x.id===e.id).lifecycle.publicListingId;
 assert.equal(privateId,listing[0].id);
 assert.ok(!JSON.stringify(h.readPublic()).includes(e.id),'public store must not hold private event identifiers');
 assert.ok(!JSON.stringify(h.readPublic()).includes('PRIVATE: crew'));
 h.submit('event-publication-form',{...data,description:'Updated public-only description',publishMode:'approved'},e.id);
 listing=h.readPublic().entries.filter(x=>x.title==='Public DJ night');
 assert.equal(listing.length,1,'editing a linked post does not create a duplicate');
 assert.equal(listing[0].status,'approved');
 assert.equal(listing[0].description,'Updated public-only description');
 assert.equal(h.getDb().eventJobs.find(x=>x.id===e.id).lifecycle.publicListingId,privateId);
 h.click('event-public-unpublish',e.id);
 assert.equal(h.readPublic().entries.find(x=>x.id===privateId).status,'rejected');
 assert.ok(!h.window.PhaenomenonCommunity.published(h.localStorage).some(x=>x.id===privateId));
});
test('Permission and authorisation are required before publishing client work',()=>{
 const h=harness('#/dashboard'),date=future(20);
 h.submit('builder-new-event-form',{...emptyValues('External commission','client'),
  bookingStage:'confirmed',date,dateCertainty:'confirmed'});
 const e=h.getDb().eventJobs.find(x=>x.title==='External commission');
 const data={title:'External commission',date,area:'Fitzroy',description:'Authorised details',
  category:'Community',organiser:'',publishMode:'approved',publishConsent:'yes'};
 h.submit('event-publication-form',data,e.id);
 assert.equal(h.readPublic().entries.filter(x=>x.title==='External commission').length,0);
 assert.match(h.notices.join(' '),/authorised public organiser/i);
 h.submit('event-publication-form',{...data,organiser:'External producer',publishConsent:''},e.id);
 assert.equal(h.readPublic().entries.filter(x=>x.title==='External commission').length,0);
 assert.match(h.notices.join(' '),/permission to publish/);
});
test('The event directory, calendar and Home link back to the unified event workspace',()=>{
 const production=read('production-os.js'),home=read('home-dashboard.js'),studio=read('app.js'),nav=read('workspace-navigation.js');
 assert.match(production,/href="#\/home\//);
 assert.match(production,/matches\.map\(x=>'<a href="#\/home\//);
 assert.match(home,/const link=id=>'#\/home\//);
 assert.match(studio,/production\.html#\/home\//);
 assert.match(nav,/segments\[2\]==='publish'/);
});
