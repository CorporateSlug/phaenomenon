// Integration checks for own concepts and client commissions in both app shells.
// Run: node --test tests/event-lead-ui.test.mjs
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const shared=['event-lifecycle.js','event-lifecycle-ui.js','event-builder.js','home-dashboard.js','event-workspace.js'];
class FormValues {
 constructor(form){this.data=form.values||{};}
 get(key){return this.data[key]??null;}
 getAll(key){return this.data[key]||[];}
}
function harness(kind){
 const callbacks={},memory=new Map(),root={innerHTML:'',contains:()=>true};
 const window={addEventListener:(key,fn)=>{callbacks['window.'+key]=fn;}};
 const document={
  title:'',hidden:false,body:{insertAdjacentHTML(){}},
  getElementById:id=>id===(kind==='production'?'production-app':'app')?root:null,
  querySelector:()=>null,querySelectorAll:()=>[],
  addEventListener:(key,fn)=>{callbacks[key]=fn;}
 };
 const location={hash:kind==='production'?'#/dashboard':'#/bookings'};
 const localStorage={getItem:key=>memory.get(key)||null,setItem:(key,val)=>memory.set(key,String(val))};
 const sandbox={window,document,location,localStorage,FormData:FormValues,
  alert(){},confirm:()=>true,prompt:()=>'',setTimeout(){},
  console,Date,Math,JSON,Map,Set,Array,Object,Number,String,Intl,
  encodeURIComponent,decodeURIComponent
 };
 for(const file of shared)runInNewContext(src(file),sandbox,{filename:file});
 runInNewContext(src(kind==='production'?'production-os.js':'app.js'),sandbox,{filename:kind});
 const read=()=>JSON.parse(memory.get('phaenomenon-demo-v1'));
 const submit=(id,values)=>callbacks.submit({
  target:kind==='production'?{id,values}:{closest:selector=>selector==='[data-form]'?{dataset:{form:id},values}:null},
  preventDefault(){}
 });
 const click=(action,id)=>{
  const element={dataset:kind==='production'?{act:action,id}:{action,id}};
  callbacks.click({target:{closest:selector=>selector===(kind==='production'?'[data-act]':'[data-action]')?element:null},preventDefault(){}});
 };
 const visit=hash=>{location.hash=hash;callbacks['window.hashchange']?.();};
 const rows=()=>[...root.innerHTML.matchAll(/<a data-ph-record class="event-index-row[^"]*" href="#\/home\/([^"]+)"/g)].map(x=>x[1]);
 return {callbacks,memory,root,window,document,location,read,submit,click,visit,rows};
}

test('Production creates self-led concepts without customers and filters event rows correctly',()=>{
 const h=harness('production');
 h.submit('builder-new-event-form',{title:'Self-produced showcase',eventLead:'studio',
   bookingStage:'idea',date:'',dateCertainty:'indicative',targetMonth:'2027-09',
   clientId:'c1',clientName:'Do not create this client'});
 const db=h.read(),own=db.eventJobs.find(e=>e.title==='Self-produced showcase');
 assert.ok(own);
 assert.equal(own.lifecycle.eventLead,'studio');
 assert.equal(own.clientId,'');
 assert.equal(db.clients.length,1,'no fictitious client record for the studio');
 h.visit('#/events');
 assert.ok(h.root.innerHTML.includes('data-act="event-scope"'));
 h.click('event-scope','studio');
 assert.deepEqual(h.rows(),[own.id]);
 h.click('event-scope','client');
 assert.deepEqual(h.rows(),['ev-abbotsford-two-stage-demo']);
 assert.equal(JSON.parse(h.memory.get('phaenomenon-production-prefs-v1')).eventScope,'client');
 h.visit('#/builder/'+own.id+'/brief');
 assert.match(h.root.innerHTML,/<option value="studio" selected>/);
 h.submit('builder-basics-form',{title:own.title,eventLead:'studio',bookingStage:'idea',
   date:'',dateCertainty:'indicative',targetMonth:'2027-09',
   productionStage:'planning',clientId:'c1',guests:'1',zones:'1'});
 const edited=h.read().eventJobs.find(e=>e.id===own.id);
 assert.equal(edited.lifecycle.eventLead,'studio');
 assert.equal(edited.clientId,'');
 assert.equal(edited.lifecycle.productionStage,'planning');
});

test('Studio can convert an own-event concept into an external commission without creating self-invoices',()=>{
 const h=harness('studio');
 h.submit('new-booking',{title:'Own concept',eventLead:'studio',bookingStage:'idea',
   dateCertainty:'unknown',clientId:'c1',date:'',venueId:''});
 const e=h.read().eventJobs.find(x=>x.title==='Own concept');
 assert.ok(e);
 assert.equal(e.lifecycle.eventLead,'studio');
 assert.equal(e.clientId,'');
 const oldInvoices=h.read().invoices.length;
 h.click('invoice-from-booking',e.id);
 assert.equal(h.read().invoices.length,oldInvoices,'own events are not internally invoiced');
 h.submit('edit-booking',{id:e.id,title:e.title,eventLead:'client',bookingStage:'idea',
   dateCertainty:'unknown',productionStage:'planning',clientId:'c1',date:'',venueId:'',
   guests:'1',zones:'1',environment:'Indoor',complexity:'Standard',eventType:'Other'});
 const revised=h.read().eventJobs.find(x=>x.id===e.id);
 assert.equal(revised.lifecycle.eventLead,'client');
 assert.equal(revised.clientId,'c1');
 assert.equal(revised.lifecycle.productionStage,'planning');
});
