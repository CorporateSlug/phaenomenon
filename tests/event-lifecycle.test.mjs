// Lifecycle migration, date uncertainty and post-event closure regression tests.
// Run: node --test tests/event-lifecycle.test.mjs
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const src=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
function modules(){
  const window={};
  runInNewContext(src('event-lifecycle.js'),{window,Date,Math,JSON,Intl},{filename:'event-lifecycle.js'});
  runInNewContext(src('event-lifecycle-ui.js'),{window,Date,Math,JSON,Intl},{filename:'event-lifecycle-ui.js'});
  runInNewContext(src('event-builder.js'),{window,Date,Math,JSON,Intl},{filename:'event-builder.js'});
  return {lifecycle:window.PhaenomenonLifecycle,builder:window.PhaenomenonEventBuilder,ui:window.PhaenomenonLifecycleUI};
}
const blank=()=>({
  eventJobs:[],clients:[],venues:[],venuePlans:{},equipment:[],invoices:[],
  productionOS:{assignments:[],published:{}}
});
test('legacy bookings get independent lifecycle dimensions without being financially closed',()=>{
  const {lifecycle:l}=modules();
  const db=blank();
  db.eventJobs=[
    {id:'confirmed',title:'Confirmed gig',date:'2027-02-01',status:'Confirmed'},
    {id:'complete',title:'Past gig',date:'2026-01-12',status:'Completed'},
    {id:'enquiry',title:'Uncertain gig',date:'',status:'Enquiry'}
  ];
  l.ensureAll(db);
  assert.equal(db.eventJobs[0].lifecycle.bookingStage,'confirmed');
  assert.equal(db.eventJobs[0].lifecycle.dateCertainty,'confirmed');
  assert.equal(db.eventJobs[1].lifecycle.productionStage,'delivered');
  assert.equal(db.eventJobs[1].lifecycle.closedAt,'');
  assert.equal(db.eventJobs[2].lifecycle.dateCertainty,'unknown');
  const once=JSON.stringify(db);
  l.ensureAll(db);
  assert.equal(JSON.stringify(db),once,'Migration should be idempotent');
});
test('event can begin as an opportunity with no organiser, venue or date',()=>{
  const {builder,lifecycle:l}=modules(),db=blank();
  const created=builder.create(db,{title:'Possible outdoor concert',bookingStage:'outreach',
    targetMonth:'2027-03',dateCertainty:'indicative',nextAction:'Contact promoter'});
  assert.ok(created.event&&!created.error);
  assert.equal(created.event.date,'');
  assert.equal(created.event.clientId,'');
  assert.equal(created.event.venueId,'');
  assert.equal(l.summary(db,created.event).bookingLabel,'Outreach planned');
  assert.equal(l.summary(db,created.event).dateCertainty,'indicative');
  assert.equal(created.event.lifecycle.nextAction,'Contact promoter');
  assert.equal(builder.steps(db,created.event).find(x=>x.id==='brief').state,'complete');
});
test('an event may have a confirmed date while still being an early idea',()=>{
  const {lifecycle:l,builder}=modules(),db=blank();
  const ev=builder.create(db,{title:'Potential launch',date:'2027-03-12',
    bookingStage:'idea',dateCertainty:'confirmed'}).event;
  assert.equal(ev.date,'2027-03-12');
  assert.equal(ev.lifecycle.bookingStage,'idea');
  assert.equal(ev.lifecycle.dateCertainty,'confirmed');
  assert.equal(ev.status,'Enquiry','Legacy status remains compatible with booking availability');
  const invalid=l.setDetails(ev,{date:'',bookingStage:'idea',dateCertainty:'confirmed'});
  assert.match(invalid.error,/date/i);
  assert.equal(ev.date,'2027-03-12','Invalid edits must leave data unchanged');
});
test('opportunities use atomic validation when a new client name is supplied',()=>{
  const {builder}=modules(),db=blank();
  const bad=builder.create(db,{title:'Possible concert',clientName:'Brand-new promoter',
    bookingStage:'idea',dateCertainty:'confirmed'});
  assert.match(bad.error,/date/i);
  assert.equal(db.eventJobs.length,0);
  assert.equal(db.clients.length,0);
});
test('closeout reconciles linked invoice statuses, never auto-counting a draft as paid',()=>{
  const {builder,lifecycle:l}=modules(),db=blank();
  const e=builder.create(db,{title:'Paid production',date:'2026-10-10',
    bookingStage:'confirmed',dateCertainty:'confirmed'}).event;
  l.setDetails(e,{date:e.date,bookingStage:'confirmed',dateCertainty:'confirmed',
    productionStage:'delivered'});
  db.invoices.push({id:'inv-1',eventId:e.id,status:'Draft'});
  let report=l.summary(db,e);
  assert.equal(report.items.find(x=>x.id==='invoiceIssued').status,'pending');
  assert.equal(report.items.find(x=>x.id==='paymentReceived').status,'pending');
  assert.match(l.updateTask(db,e,'invoiceIssued','done').error,/invoice/i);
  db.invoices[0].status='Issued externally';
  report=l.summary(db,e);
  assert.equal(report.items.find(x=>x.id==='invoiceIssued').status,'done');
  assert.equal(report.items.find(x=>x.id==='paymentReceived').status,'pending');
  db.invoices[0].status='Paid';
  report=l.summary(db,e);
  assert.equal(report.items.find(x=>x.id==='paymentReceived').status,'done');
});
test('explicit not-applicable reasons and delivery are required for closure',()=>{
  const {builder,lifecycle:l,ui}=modules(),db=blank();
  const ev=builder.create(db,{title:'Test gig',date:'2026-10-10',
    bookingStage:'confirmed',dateCertainty:'confirmed'}).event;
  assert.match(l.closeEvent(db,ev).error,/delivered/i);
  assert.match(l.updateTask(db,ev,'crewPaid','na').error,/Explain/i);
  for(const item of l.TASKS){
    if(item.id==='crewPaid')assert.equal(l.updateTask(db,ev,item.id,'na','No paid crew booked').ok,true);
    else assert.equal(l.updateTask(db,ev,item.id,'done').ok,true);
  }
  assert.match(l.closeEvent(db,ev).error,/Delivered/i);
  l.setDetails(ev,{date:ev.date,bookingStage:'confirmed',dateCertainty:'confirmed',
    productionStage:'delivered'});
  assert.equal(l.summary(db,ev).readyToClose,true);
  assert.match(ui.closeoutPanel(db,ev),/Close event/);
  const closed=l.closeEvent(db,ev);
  assert.equal(closed.ok,true);
  assert.equal(l.summary(db,ev).closed,true);
  assert.match(l.updateTask(db,ev,'crewPaid','done').error,/Reopen/i);
  assert.equal(l.reopenEvent(ev).ok,true);
  assert.equal(l.summary(db,ev).closed,false);
});
test('invoice changes after closure remain visible as outstanding on review',()=>{
  const {lifecycle:l,builder}=modules(),db=blank();
  const ev=builder.create(db,{title:'Payment review',date:'2026-10-01',
    bookingStage:'confirmed',dateCertainty:'confirmed'}).event;
  l.setDetails(ev,{date:ev.date,bookingStage:'confirmed',dateCertainty:'confirmed',
    productionStage:'delivered'});
  db.invoices.push({id:'i1',eventId:ev.id,status:'Paid'});
  for(const task of l.TASKS)if(!task.source)l.updateTask(db,ev,task.id,'done');
  assert.equal(l.closeEvent(db,ev).ok,true);
  db.invoices[0].status='Draft';
  const report=l.summary(db,ev);
  assert.equal(report.closed,true);
  assert.equal(report.remaining,2,'Invoice drift must be visible, not silently counted as paid');
});
test('shared forms expose lifecycle dimensions and a distinct closeout workspace',()=>{
  const {builder,ui}=modules(),db=blank();
  const ev=builder.create(db,{title:'Demo gig'}).event;
  const fields=ui.fields(ev);
  for(const key of ['bookingStage','productionStage','dateCertainty','targetMonth',
    'followUpDate','nextAction'])assert.match(fields,new RegExp('name="'+key+'"'));
  const closeout=ui.closeoutPanel(db,ev);
  for(const token of ['Crew timesheets','Equipment returned','Client payment received',
    'id="event-closeout-form"','lifecycle-close'])assert.ok(closeout.includes(token),token);
});

test('cancelled and declined opportunities can close with explained exemptions without delivery',()=>{
 const {builder,lifecycle:l}=modules(),db=blank();
 const e=builder.create(db,{title:'Cancelled proposal',bookingStage:'cancelled'}).event;
 assert.equal(e.status,'Cancelled');
 for(const task of l.TASKS){
   const result=l.updateTask(db,e,task.id,'na','No delivery or invoice for this cancelled event');
   assert.equal(result.ok,true);
 }
 const summary=l.summary(db,e);
 assert.equal(summary.productionStage,'not-started');
 assert.equal(summary.readyToClose,true);
 assert.equal(l.closeEvent(db,e).ok,true);
 assert.equal(l.summary(db,e).closed,true);
 assert.equal(e.status,'Cancelled','A cancelled event must not become a completed booking');
});
test('approximate month uses the hierarchical date picker instead of a mismatched native month control',()=>{
 const s=src('shared-ui.js');
 assert.match(s,/input\[type="month"\]/);
 assert.match(s,/monthOnly/);
 assert.match(s,/view=monthOnly\?'month':'day'/);
});
test('production event directory exposes both early opportunities and closed archive',()=>{
 const s=src('production-os.js');
 assert.match(s,/Opportunities & discussions/);
 assert.match(s,/Delivered · closeout outstanding/);
 assert.match(s,/Closed \/ archive/);
 assert.match(s,/PRODUCTION_TABS=\[[^\n]*closeout/);
});
