/*
 * Shared lifecycle UI. Renderers are deliberately small and reused in both app shells.
 * Forms retain ISO dates; the shared hierarchical calendar upgrades date inputs.
 */
(function(){
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const LC=()=>window.PhaenomenonLifecycle;
 const options=(list,chosen)=>list.map(([id,title])=>'<option value="'+esc(id)+'" '+(chosen===id?'selected':'')+'>'+esc(title)+'</option>').join('');
 function fields(event,config={}){
   const LCx=LC(),lc=LCx.ensureEvent(event||{title:'',date:''});
   const newEvent=!!config.create,compact=!!config.compact;
   const prefix=compact?'':'Event ';
   const date='<label>'+prefix+'date (optional)<input class="input" type="date" name="date" value="'+esc(event?.date||'')+'"></label>';
   return '<div class="ph-lifecycle-fields">'+
     '<label class="ph-lifecycle-lead">Event led by<select name="eventLead">'+options(LCx.EVENT_LEADS,lc.eventLead)+'</select><small class="ph-lifecycle-lead-hint">Choose who the idea or event is for. Own events do not need an external client or self-invoice.</small></label>'+
     '<label>Booking stage<select name="bookingStage">'+options(LCx.BOOKING,lc.bookingStage)+'</select></label>'+
     '<label>How certain is the date?<select name="dateCertainty">'+options(LCx.DATE,lc.dateCertainty)+'</select></label>'+
     (config.includeDate!==false?date:'')+
     '<label>Indicative month (optional)<input class="input" name="targetMonth" type="month" value="'+esc(lc.targetMonth)+'"></label>'+
     (newEvent?'':'<label>Production stage<select name="productionStage">'+options(LCx.PRODUCTION,lc.productionStage)+'</select></label>')+
     '<label class="ph-lifecycle-wide">Next action / outreach plan<input class="input" maxlength="350" name="nextAction" value="'+esc(lc.nextAction)+'" placeholder="e.g. Ask the organiser if they need lighting"></label>'+
     '<label>Follow-up date (optional)<input class="input" type="date" name="followUpDate" value="'+esc(lc.followUpDate)+'"></label>'+
     '<label class="ph-lifecycle-wide">Date details (optional)<input class="input" maxlength="350" name="dateNotes" value="'+esc(lc.dateNotes)+'" placeholder="e.g. Sometime in January, exact day unknown"></label>'+
     '</div>';
 }
 function stageStrip(event,db){
   const m=LC().summary(db,event);
   return '<div class="ph-stage-strip" aria-label="Event lifecycle overview">'+
      '<span><small>Organiser</small><strong>'+esc(m.eventLead==='studio'?'Own event · Phaenomenon':'Client-led event')+'</strong></span>'+
      '<span><small>Booking</small><strong>'+esc(m.bookingLabel)+'</strong></span>'+
      '<span><small>Event date</small><strong>'+esc(event.date?m.dateLabel: m.dateCertainty==='unknown'?'Unknown':m.dateLabel)+'</strong></span>'+
      '<span><small>Production</small><strong>'+esc(m.productionLabel)+'</strong></span>'+
      '<a href="#/production/closeout/'+encodeURIComponent(event.id)+'"><small>Closeout</small><strong>'+(m.closed?'Closed':m.done+' / '+m.total+' complete')+' ↗</strong></a>'+
      '</div>';
 }
 function closeoutPanel(db,event){
   const L=LC(),m=L.summary(db,event),lc=L.ensureEvent(event);
   const row=item=>{
     const derived=item.source==='invoices'||item.source==='own-event';
     return '<div class="ph-closeout-row">'+
       '<div class="ph-closeout-task"><strong>'+esc(item.label)+'</strong>'+
       (derived?'<small>'+(item.source==='own-event'?'No self-invoice required':'Read from '+m.linkedInvoices+' linked invoice'+(m.linkedInvoices===1?'':'s'))+'</small>':
         item.updatedAt?'<small>Last updated '+esc(new Date(item.updatedAt).toLocaleDateString('en-AU'))+'</small>':'<small>Manually recorded · not independently verified</small>')+
       '</div><label class="ph-closeout-state"><span class="visually-hidden">Status: '+esc(item.label)+'</span>'+
       (derived?'<input type="hidden" name="derived_'+esc(item.id)+'" value="true"><span class="ph-closeout-derived">'+(item.status==='done'?'Done':item.status==='na'?'Not applicable':'Pending')+'</span>':
         '<select name="status_'+esc(item.id)+'" aria-label="'+esc(item.label)+' status" '+(m.closed?'disabled':'')+'>'+
           [['pending','Pending'],['done','Done'],['na','Not applicable']].map(([key,label])=>
              '<option value="'+key+'" '+(item.status===key?'selected':'')+'>'+label+'</option>').join('')+'</select>')+'</label>'+
       (derived?'<span class="ph-closeout-note">'+esc(item.note)+'</span>':
         '<label class="ph-closeout-reason"><span class="visually-hidden">Explanation for '+esc(item.label)+'</span>'+
         '<input class="input" name="note_'+esc(item.id)+'" maxlength="350" '+(m.closed?'disabled':'')+' value="'+esc(lc.closeout[item.id].note||'')+'" placeholder="Note / reason if not applicable"></label>')+
       '</div>';
   };
   const groupNames=['Equipment','People','Finance','Admin'];
   const groups=groupNames.map(group=>{
     const items=m.items.filter(x=>x.group===group);
     return '<section class="ph-closeout-group"><h3>'+group+'</h3>'+items.map(row).join('')+'</section>';
   }).join('');
   return '<section class="ph-lifecycle-closeout panel section" aria-labelledby="closeout-title">'+
     '<div class="section-head"><div><span class="eyebrow">POST-EVENT</span><h2 id="closeout-title">Operational and financial closeout</h2>'+
     '<p class="muted">Track returns, people and money after delivery. Recorded completion does not transfer funds or verify actual returns.</p></div>'+
     '<div class="ph-closeout-summary"><strong>'+m.done+' / '+m.total+'</strong><small>'+ (m.closed?'Closed':m.remaining+' remaining')+'</small></div></div>'+
     '<div class="ph-closeout-progress"><span style="width:'+Math.round(m.done/m.total*100)+'%"></span></div>'+
     '<p class="form-note">'+(m.productionStage==='delivered'?'Event marked delivered.':['cancelled','declined','lost'].includes(m.bookingStage)?'Booking no longer proceeding.':'Set production to Delivered (or record a declined or cancelled booking) before closing.')+
     ' Invoice issue and payment statuses are automatically determined from linked invoices where present. Other items require explicit confirmation.</p>'+
     '<form id="event-closeout-form"><div class="ph-closeout-list" role="region" tabindex="0" aria-label="Post-event closeout checklist">'+groups+'</div>'+
     '<div class="row ph-closeout-actions"><button class="btn primary" type="submit" '+(m.closed?'disabled':'')+'>Save checklist</button>'+
     '<a class="btn" href="index.html#/invoices">Open invoices ↗</a>'+
     (m.closed?'<button type="button" class="btn" data-act="lifecycle-reopen">Reopen event</button>':
       '<button type="button" class="btn '+(m.readyToClose?'primary':'')+'" data-act="lifecycle-close" '+(m.readyToClose?'':'disabled')+'>Close event</button>')+
     '</div></form>'+
     (m.closed?'<p class="ph-closed-caption">Closed '+esc(new Date(m.closedAt).toLocaleString('en-AU'))+'. Reopen to amend the lifecycle or checklist.</p>':
       m.readyToClose?'<p class="ph-closed-caption">Everything is recorded as complete or not applicable. You can close the event.</p>':
       '<p class="ph-closed-caption">Closing remains unavailable until delivery or a final booking outcome is recorded and all closeout items are complete.</p>')+
     '</section>';
 }
 window.PhaenomenonLifecycleUI={fields,stageStrip,closeoutPanel};
})();