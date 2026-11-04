// Own-produced concepts versus external client commissions.
// Run: node --test tests/event-lead.test.mjs
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function modules(){
 const window={};
 for(const path of ['event-lifecycle.js','event-lifecycle-ui.js','event-builder.js']){
   runInNewContext(src(path),{window,Date,Math,JSON,Intl},{filename:path});
 }
 return {L:window.PhaenomenonLifecycle,U:window.PhaenomenonLifecycleUI,B:window.PhaenomenonEventBuilder};
}
const blank=()=>({eventJobs:[],clients:[{id:'client1',name:'External organiser'}],
  venues:[],venuePlans:{},equipment:[],invoices:[],
  productionOS:{assignments:[],published:{}}});
test('existing bookings migrate to client-led, keeping client references intact',()=>{
 const {L}=modules(),db=blank(),e={id:'legacy',title:'Legacy gig',date:'2026-12-04',status:'Confirmed',clientId:'client1'};
 db.eventJobs.push(e);
 L.ensureAll(db);
 assert.equal(e.lifecycle.eventLead,'client');
 assert.equal(e.clientId,'client1');
 assert.equal(L.summary(db,e).eventLeadLabel,'Client-led · external commission');
 const original=JSON.stringify(e);
 L.ensureAll(db);
 assert.equal(JSON.stringify(e),original);
});
test('own-event concept can be created with no date, organiser, external client or venue',()=>{
 const {L,B,U}=modules(),db=blank();
 const result=B.create(db,{title:'Our spring show',eventLead:'studio',bookingStage:'idea',
   targetMonth:'2027-09',dateCertainty:'indicative',nextAction:'Explore possible venues',
   clientId:'client1',clientName:'Phaenomenon'});
 assert.ok(result.event&&!result.error);
 const e=result.event;
 assert.equal(e.clientId,'','own events must not auto-assign a commissioning client');
 assert.equal(db.clients.length,1,'self-produced work must not create fake client entities');
 assert.equal(e.date,'');
 assert.equal(e.lifecycle.eventLead,'studio');
 assert.equal(L.summary(db,e).bookingStage,'idea');
 assert.equal(L.summary(db,e).targetMonth,'2027-09');
 assert.match(U.fields(e),/name="eventLead"/);
 assert.match(U.stageStrip(e,db),/Own event · Phaenomenon/);
 assert.match(U.closeoutPanel(db,e),/No self-invoice required/);
});
test('date certainty and ownership stay independent',()=>{
 const {L,B}=modules(),db=blank();
 const e=B.create(db,{title:'Studio performance',eventLead:'studio',date:'2027-06-04',
   dateCertainty:'confirmed',bookingStage:'idea'}).event;
 assert.equal(L.summary(db,e).eventLead,'studio');
 assert.equal(L.summary(db,e).bookingStage,'idea');
 assert.equal(L.summary(db,e).dateCertainty,'confirmed');
 assert.equal(L.summary(db,e).productionStage,'not-started');
 assert.equal(e.status,'Enquiry');
});
test('client commission may remain an idea without a known client, then be promoted',()=>{
 const {L,B}=modules(),db=blank();
 const e=B.create(db,{title:'Possible festival booking',eventLead:'client'}).event;
 assert.equal(e.clientId,'');
 assert.equal(L.summary(db,e).eventLead,'client');
 assert.equal(L.setDetails(e,{date:'2027-05-01',eventLead:'client',
   bookingStage:'confirmed',dateCertainty:'confirmed',productionStage:'planning'}).ok,true);
 assert.equal(L.summary(db,e).bookingStage,'confirmed');
 assert.equal(e.status,'Confirmed');
});
test('no invoice to self: own-event invoice closeout items are automatically not applicable',()=>{
 const {L,B}=modules(),db=blank(),e=B.create(db,{title:'Own production',eventLead:'studio'}).event;
 for(const id of ['invoiceIssued','paymentReceived']){
   const item=L.effectiveCloseout(db,e).find(x=>x.id===id);
   assert.equal(item.status,'na');
   assert.equal(item.source,'own-event');
   assert.match(L.updateTask(db,e,id,'done').error,/Self-invoicing/);
 }
 assert.equal(L.summary(db,e).done,2);
 for(const task of L.TASKS.filter(x=>!x.source))assert.equal(L.updateTask(db,e,task.id,'done').ok,true);
 assert.equal(L.summary(db,e).readyToClose,false);
 assert.equal(L.setDetails(e,{date:'',eventLead:'studio',bookingStage:'confirmed',
   dateCertainty:'unknown',productionStage:'delivered'}).ok,true);
 assert.equal(L.summary(db,e).readyToClose,true);
 assert.equal(L.closeEvent(db,e).ok,true);
 assert.equal(L.summary(db,e).closed,true);
});
test('external invoices linked to a studio event still require real recorded payment statuses',()=>{
 const {L,B}=modules(),db=blank(),e=B.create(db,{title:'Our show',eventLead:'studio'}).event;
 db.invoices.push({id:'outside-sponsor-invoice',eventId:e.id,status:'Draft',clientId:'client1'});
 let issued=L.effectiveCloseout(db,e).find(x=>x.id==='invoiceIssued');
 assert.equal(issued.source,'invoices');
 assert.equal(issued.status,'pending');
 db.invoices[0].status='Issued externally';
 issued=L.effectiveCloseout(db,e).find(x=>x.id==='invoiceIssued');
 assert.equal(issued.status,'done');
 assert.equal(L.effectiveCloseout(db,e).find(x=>x.id==='paymentReceived').status,'pending');
 db.invoices[0].status='Paid';
 assert.equal(L.effectiveCloseout(db,e).find(x=>x.id==='paymentReceived').status,'done');
});
test('invalid ownership values cannot be saved or alter an existing record',()=>{
 const {L,B}=modules(),db=blank(),e=B.create(db,{title:'Event',eventLead:'studio'}).event;
 const result=L.setDetails(e,{date:'',eventLead:'disallowed',
   bookingStage:'idea',dateCertainty:'unknown'});
 assert.match(result.error,/leading this event/i);
 assert.equal(e.lifecycle.eventLead,'studio');
});
test('UI: both event forms, schedule filters and invoice safeguards are integrated',()=>{
 const production=src('production-os.js'),studio=src('app.js'),css=src('event-lifecycle.css'),home=src('home-dashboard.js');
 assert.match(production,/eventLead:clean\(data.get\('eventLead'\)\)/);
 assert.match(production,/eventLead:val\('eventLead'\)/);
 assert.match(production,/data-act="event-scope"/);
 assert.match(production,/Own events/);
 assert.match(studio,/eventLead:val\('eventLead'\)/);
 assert.match(studio,/Phaenomenon · own production/);
 assert.match(studio,/Own events and undetermined clients do not generate an invoice/);
 assert.match(css,/form:has\(select\[name="eventLead"\]/);
 assert.match(home,/Own concepts/);
 assert.match(home,/client leads/);
});
