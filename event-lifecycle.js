/*
 * Phaenomenon event lifecycle (local-first, shared between Studio and Production).
 * A single event survives discovery, booking, delivery and financial closeout.
 * No status implies safety approval or an actual payment transfer.
 */
(function(){
  'use strict';
  const BOOKING=[
    ['idea','Identified / possible event'],
    ['outreach','Outreach planned'],
    ['contacted','Contacted organisers'],
    ['discussion','In discussion'],
    ['quoted','Quote / proposal sent'],
    ['tentative','Tentative / on hold'],
    ['confirmed','Confirmed booking'],
    ['declined','Declined by us'],
    ['lost','Not proceeding / lost'],
    ['cancelled','Cancelled']
  ];
  const PRODUCTION=[
    ['not-started','Not started'],['planning','Planning'],['preparing','Preparing'],
    ['ready','Ready for delivery'],['load-in','Load-in'],['live','Event underway'],
    ['pack-down','Pack-down'],['delivered','Delivered']
  ];
  const DATE=[
    ['unknown','Unknown'],['indicative','Indicative / approximate'],['proposed','Proposed date'],
    ['confirmed','Confirmed date']
  ];
  const TASKS=[
    {id:'equipmentReturned',label:'Equipment returned and accounted for',group:'Equipment'},
    {id:'equipmentResolved',label:'Damaged or missing items resolved',group:'Equipment'},
    {id:'timesheetsApproved',label:'Crew timesheets approved',group:'People'},
    {id:'crewPaid',label:'Employees and contractors paid',group:'People'},
    {id:'supplierReconciled',label:'Suppliers and hire costs reconciled',group:'Finance'},
    {id:'invoiceIssued',label:'Client invoice issued',group:'Finance',source:'invoices'},
    {id:'paymentReceived',label:'Client payment received',group:'Finance',source:'invoices'},
    {id:'expensesReconciled',label:'Other expenses reconciled',group:'Finance'},
    {id:'recordsArchived',label:'Final records archived',group:'Admin'}
  ];
  const BOOKING_IDS=new Set(BOOKING.map(x=>x[0]));
  const PROD_IDS=new Set(PRODUCTION.map(x=>x[0]));
  const DATE_IDS=new Set(DATE.map(x=>x[0]));
  const TASK_IDS=new Set(TASKS.map(x=>x.id));
  const own=a=>Array.isArray(a)?a:[];
  const text=s=>String(s??'').trim();
  const exactDate=s=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;
    const d=new Date(s+'T12:00:00Z');
    return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;
  };
  const exactMonth=s=>/^\d{4}-(0[1-9]|1[0-2])$/.test(s||'');
  const label=(list,id)=>list.find(x=>x[0]===id)?.[1]||String(id||'');
  const statusFor=(stage,production,closedAt)=>{
    if(closedAt)return 'Completed';
    if(['cancelled','declined','lost'].includes(stage))return 'Cancelled';
    if(production==='delivered')return 'Completed';
    if(stage==='confirmed')return 'Confirmed';
    if(stage==='quoted')return 'Quoted';
    return 'Enquiry';
  };
  const legacyBooking=s=>s==='Confirmed'||s==='Completed'?'confirmed':
    s==='Quoted'?'quoted':s==='Cancelled'?'cancelled':'idea';
  function ensureEvent(event){
    if(!event||typeof event!=='object')return null;
    if(typeof event.date!=='string'||!exactDate(event.date))event.date='';
    let lc=event.lifecycle;
    if(!lc||typeof lc!=='object'||Array.isArray(lc)){lc={};event.lifecycle=lc;}
    if(!BOOKING_IDS.has(lc.bookingStage))lc.bookingStage=legacyBooking(event.status);
    if(!PROD_IDS.has(lc.productionStage))lc.productionStage=event.status==='Completed'?'delivered':'not-started';
    if(!DATE_IDS.has(lc.dateCertainty))lc.dateCertainty=event.date?(event.status==='Confirmed'||event.status==='Completed'?'confirmed':'proposed'):'unknown';
    if(!event.date&&lc.dateCertainty==='confirmed')lc.dateCertainty='unknown';
    if(!exactMonth(lc.targetMonth))lc.targetMonth='';
    if(typeof lc.dateNotes!=='string')lc.dateNotes='';
    if(typeof lc.nextAction!=='string')lc.nextAction='';
    if(!exactDate(lc.followUpDate))lc.followUpDate='';
    if(typeof lc.closedAt!=='string')lc.closedAt='';
    if(!lc.closeout||typeof lc.closeout!=='object'||Array.isArray(lc.closeout))lc.closeout={};
    for(const task of TASKS){
      const value=lc.closeout[task.id];
      if(!value||typeof value!=='object'||Array.isArray(value))lc.closeout[task.id]={status:'pending',note:'',updatedAt:''};
      else {
        if(!['pending','done','na'].includes(value.status))value.status='pending';
        if(typeof value.note!=='string')value.note='';
        if(typeof value.updatedAt!=='string')value.updatedAt='';
      }
    }
    return lc;
  }
  function ensureAll(db){for(const e of own(db?.eventJobs))ensureEvent(e);return db;}
  function setDetails(event,fields={}){
    const lc=ensureEvent(event);if(!lc)return {error:'Event not found.'};
    const day=text(fields.date),rawCertainty=text(fields.dateCertainty)||lc.dateCertainty,
      certainty=day&&rawCertainty==='unknown'?'proposed':rawCertainty;
    const stage=text(fields.bookingStage)||lc.bookingStage;
    const prod=text(fields.productionStage)||lc.productionStage;
    const month=text(fields.targetMonth);
    const follow=text(fields.followUpDate);
    if(day&&!exactDate(day))return {error:'Enter a valid event date.'};
    if(!DATE_IDS.has(certainty))return {error:'Choose a valid date certainty.'};
    if(['proposed','confirmed'].includes(certainty)&&!day)return {error:'Choose an event date or change the date certainty to Unknown / Indicative.'};
    if(month&&!exactMonth(month))return {error:'Enter a valid approximate month.'};
    if(follow&&!exactDate(follow))return {error:'Enter a valid follow-up date.'};
    if(!BOOKING_IDS.has(stage)||!PROD_IDS.has(prod))return {error:'Choose a valid booking and production stage.'};
    if(lc.closedAt&&(stage!==lc.bookingStage||prod!==lc.productionStage||day!==event.date))
      return {error:'Reopen the event before changing its booking, delivery or date information.'};
    event.date=day;lc.dateCertainty=certainty;lc.targetMonth=month;
    lc.dateNotes=text(fields.dateNotes).slice(0,350);
    lc.nextAction=text(fields.nextAction).slice(0,350);
    lc.followUpDate=follow;
    lc.bookingStage=stage;lc.productionStage=prod;
    event.status=statusFor(stage,prod,lc.closedAt);
    return {ok:true,lifecycle:lc};
  }
  function invoicesFor(db,event){return own(db?.invoices).filter(x=>x.eventId===event?.id);}
  function effectiveCloseout(db,event){
    const lc=ensureEvent(event),linked=invoicesFor(db,event);
    if(!lc)return [];
    return TASKS.map(task=>{
      const manual=lc.closeout[task.id];
      let status=manual.status,source='manual',note=manual.note||'';
      if(linked.length&&task.id==='invoiceIssued'){
        status=linked.every(x=>['Issued externally','Paid'].includes(x.status))?'done':'pending';
        source='invoices';note=linked.length+' linked invoice'+(linked.length===1?'':'s')+' · '+(status==='done'?'all issued':'drafts remain');
      }
      if(linked.length&&task.id==='paymentReceived'){
        status=linked.every(x=>x.status==='Paid')?'done':'pending';
        source='invoices';note=linked.length+' linked invoice'+(linked.length===1?'':'s')+' · '+(status==='done'?'all marked paid':'payment outstanding');
      }
      return {...task,status,source,note,updatedAt:manual.updatedAt||''};
    });
  }
  function summary(db,event){
    const lc=ensureEvent(event),items=effectiveCloseout(db,event);
    const done=items.filter(x=>x.status==='done'||x.status==='na').length;
    return {
      bookingStage:lc.bookingStage,bookingLabel:label(BOOKING,lc.bookingStage),
      productionStage:lc.productionStage,productionLabel:label(PRODUCTION,lc.productionStage),
      dateCertainty:lc.dateCertainty,dateLabel:label(DATE,lc.dateCertainty),
      date: event.date||'',targetMonth:lc.targetMonth,nextAction:lc.nextAction,followUpDate:lc.followUpDate,
      closed:!!lc.closedAt,closedAt:lc.closedAt,done,total:items.length,remaining:items.length-done,
      readyToClose:lc.productionStage==='delivered'&&done===items.length,
      items,linkedInvoices:invoicesFor(db,event).length
    };
  }
  function updateTask(db,event,taskId,status,note=''){
    if(!TASK_IDS.has(taskId))return {error:'Unknown closeout item.'};
    const lc=ensureEvent(event);if(!lc)return {error:'Event not found.'};
    if(lc.closedAt)return {error:'Reopen this event before changing its closeout checklist.'};
    if(!['pending','done','na'].includes(status))return {error:'Choose Pending, Done or Not applicable.'};
    const existing=effectiveCloseout(db,event).find(x=>x.id===taskId);
    if(existing?.source==='invoices')return {error:'This item is calculated from linked invoices. Update invoice statuses in Studio Billing.'};
    if(status==='na'&&!text(note))return {error:'Explain why this item is not applicable.'};
    lc.closeout[taskId]={status,note:text(note).slice(0,350),updatedAt:new Date().toISOString()};
    return {ok:true};
  }
  function closeEvent(db,event){
    const lc=ensureEvent(event);if(!lc)return {error:'Event not found.'};
    const s=summary(db,event);
    if(lc.closedAt)return {error:'Already closed.'};
    if(!s.readyToClose)return {error:'Mark the production Delivered and resolve or explicitly waive all '+s.remaining+' outstanding closeout items before closing.'};
    lc.closedAt=new Date().toISOString();
    event.status='Completed';
    return {ok:true,closedAt:lc.closedAt};
  }
  function reopenEvent(event){
    const lc=ensureEvent(event);if(!lc)return {error:'Event not found.'};
    lc.closedAt='';
    event.status=statusFor(lc.bookingStage,lc.productionStage,'');
    return {ok:true};
  }
  const dateDisplay=e=>{
    if(exactDate(e?.date))return e.date;
    const lc=ensureEvent(e);
    return lc?.targetMonth?lc.targetMonth+' (approx.)':'Date to be confirmed';
  };
  window.PhaenomenonLifecycle={
    BOOKING,PRODUCTION,DATE,TASKS,ensureEvent,ensureAll,setDetails,
    effectiveCloseout,summary,updateTask,closeEvent,reopenEvent,
    exactDate,dateDisplay,statusFor,label:(kind,id)=>label(kind==='booking'?BOOKING:kind==='production'?PRODUCTION:DATE,id)
  };
})();