/* Compact lifecycle-aware Home dashboard for Phaenomenon. */
(function(){
'use strict';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=id=>'#/builder/'+encodeURIComponent(id);
const closeout=id=>'#/production/closeout/'+encodeURIComponent(id);
const fmt=s=>/^\d{4}-\d\d-\d\d$/.test(s||'')?new Date(s+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):'Date unknown';
const dayString=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const hrefStep=(e,s)=>['brief','spaces','equipment','review'].includes(s.id)?link(e.id)+'/'+s.id:s.href||link(e.id);
const isOpportunity=e=>!!e&&['idea','outreach','contacted','discussion','quoted','tentative','postponed'].includes(e.bookingStage)&&!e.closed;
const isDelivered=e=>!!e&&e.productionStage==='delivered'&&!e.closed;
const needsCloseout=e=>!!e&&(isDelivered(e)||e.closed&&e.closeoutRemaining>0);
function render({events=[],activeId}={}){
 const now=new Date(),today=dayString(now),later=new Date(now.getFullYear(),now.getMonth(),now.getDate()+30),last=dayString(later),soon=dayString(new Date(now.getFullYear(),now.getMonth(),now.getDate()+7));
 const active=events.find(e=>e.id===activeId)||events[0];
 const opportunities=events.filter(isOpportunity);
 const ownConcepts=opportunities.filter(e=>e.eventLead==='studio');
 const clientLeads=opportunities.filter(e=>e.eventLead!=='studio');
 const planned=events.filter(e=>e.bookingStage==='confirmed'&&!e.closed&&e.date>=today&&e.productionStage!=='delivered')
   .sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
 const upcoming=planned.filter(e=>e.date<=last);
 const closeouts=events.filter(needsCloseout);
 const issues=events.reduce((n,e)=>n+(e.openIssues||0),0);
 const steps=active?.steps||[],done=steps.filter(s=>s.state==='complete').length,next=steps.find(s=>s.state!=='complete');
 const metric=(title,count,sub,dest)=>'<a class="home-metric" href="'+dest+'"><span class="home-metric-label">'+title+'</span><strong>'+count+'</strong><small>'+sub+' ↗</small></a>';
 const metrics='<div class="home-metrics">'+metric('Opportunities',opportunities.length,ownConcepts.length+' own ideas · '+clientLeads.length+' client leads','#/events')+
   metric('Next 30 days',upcoming.length,'Confirmed upcoming events','#/events')+
   metric('Closeout outstanding',closeouts.length,'Delivered, not yet closed','#/events')+
   metric('Open issues',issues,'Across event productions','#/events')+'</div>';
 const activeUrl=active?link(active.id):'#/events';
 const activeDate=active?(active.date?fmt(active.date):active.targetMonth?active.targetMonth+' (approx.)':'Date unknown'):'';
 const activeCard='<section class="panel home-current" aria-labelledby="home-active-heading"><div class="home-current-left">'+
   '<div class="home-current-kicker"><span class="eyebrow">CONTINUE WORKING</span>'+
   (active?.closed?'<span class="home-warning">Closed</span>':active?.needsRevision?'<span class="home-warning">Revision needs review</span>':
   active?.openIssues?'<span class="home-warning">'+active.openIssues+' open issues</span>':'')+'</div>'+
   '<h2 id="home-active-heading">'+escape(active?.title||'No current event')+'</h2>'+
   '<p class="muted">'+escape(active?((active.eventLead==='studio'?'Own production':'Client-led event')+' · '+activeDate+' · '+(active.venue||'Venue unknown')+' · '+(active.bookingLabel||'Opportunity')):'Create an opportunity or event to start planning')+'</p>'+
   '<div class="home-progress-text"><strong>'+done+' of '+steps.length+' steps configured</strong><small>Planning progress only · not safety approval</small></div>'+
   '<div class="home-progress" role="progressbar" aria-label="Current event planning progress" aria-valuemin="0" aria-valuemax="'+steps.length+'" aria-valuenow="'+done+'"><span style="width:'+(steps.length?Math.round(done/steps.length*100):0)+'%"></span></div>'+
   '</div><div class="home-current-actions"><a class="btn primary" href="'+activeUrl+'">Open event builder →</a>'+
   (isDelivered(active)?'<a class="btn" href="'+closeout(active.id)+'">Closeout · '+active.closeoutRemaining+' outstanding →</a>':
    next?'<a class="btn" href="'+hrefStep(active,next)+'">Next: '+escape(next.title)+'</a>':'<a class="btn" href="#/events">All events</a>')+
   '</div></section>';
 const eventRow=e=>'<a class="home-row" href="'+link(e.id)+'"><span class="home-row-date">'+escape(e.date?fmt(e.date):e.targetMonth?e.targetMonth+' approx.':'Date unknown')+'</span>'+
   '<span class="home-row-detail"><strong>'+escape(e.title)+'</strong><small>'+escape(e.eventLead==='studio'?'Own production · Phaenomenon':'Client commission')+' · '+escape(e.venue||'Venue unconfirmed')+'</small></span>'+
   '<span class="home-row-status">'+escape(e.bookingLabel||e.status||'Opportunity')+'</span><span class="home-row-chevron" aria-hidden="true">›</span></a>';
 const ownPreview=ownConcepts.slice(0,4),bookedPreview=planned.slice(0,8);
 const eventPanel='<section class="panel home-panel"><div class="home-panel-heading"><div><h2>On the horizon</h2><small>'+planned.length+' confirmed · '+ownConcepts.length+' own concepts</small></div>'+
   '<a class="btn small" href="#/events">All events →</a></div>'+
   '<div class="home-panel-list" tabindex="0" role="region" aria-label="Own concepts and upcoming events">'+
   (ownPreview.length?'<div class="ph-home-section-title">Own concepts · '+ownConcepts.length+'</div>'+ownPreview.map(eventRow).join(''):'')+
   (bookedPreview.length?'<div class="ph-home-section-title">Confirmed upcoming · '+planned.length+'</div>'+bookedPreview.map(eventRow).join(''):'')+
   (!ownPreview.length&&!bookedPreview.length?'<p class="home-empty">Nothing scheduled or being developed yet. Add your first concept or client event.</p>':'')+
   '</div></section>';
 const alerts=[];
 const watched=[...new Map([active,...closeouts,...opportunities,...planned.slice(0,12)].filter(Boolean).map(e=>[e.id,e])).values()];
 for(const e of watched){
   if(needsCloseout(e))alerts.push({title:(e.closed?'Closed event needs review':'Post-event closeout')+' · '+e.closeoutRemaining+' remaining',detail:e.title,url:closeout(e.id),type:'issue'});
   if(isOpportunity(e)&&(e.followUpDate&&e.followUpDate<=soon||e.nextAction&&!e.followUpDate)){
     alerts.push({title:e.nextAction||'Follow up with organisers',detail:e.title+' · '+(e.followUpDate?fmt(e.followUpDate):'No follow-up date set'),url:link(e.id)+'/brief',type:'planning'});
   }
   if(e.openIssues)alerts.push({title:e.openIssues+' open production issue'+(e.openIssues===1?'':'s'),detail:e.title,url:'#/production/installation/'+encodeURIComponent(e.id),type:'issue'});
   if(e.needsRevision)alerts.push({title:'Review unpublished design changes',detail:e.title,url:link(e.id)+'/review',type:'issue'});
   if(e.bookingStage==='confirmed'){
     const first=e.steps?.find(s=>s.state==='attention'&&s.id!=='review');
     if(first)alerts.push({title:first.title+' needs attention',detail:e.title+' · '+first.summary,url:hrefStep(e,first),type:'planning'});
   }
 }
 if(!alerts.length&&opportunities.length)alerts.push({title:'Review your opportunity pipeline',detail:opportunities.length+' potential event'+(opportunities.length===1?'':'s'),url:'#/events',type:'planning'});
 const alertRow=a=>'<a class="home-row home-alert-row" href="'+a.url+'"><span class="home-alert-dot '+a.type+'" aria-hidden="true"></span>'+
   '<span class="home-row-detail"><strong>'+escape(a.title)+'</strong><small>'+escape(a.detail)+'</small></span><span class="home-row-chevron" aria-hidden="true">›</span></a>';
 const alertsPanel='<section class="panel home-panel"><div class="home-panel-heading"><div><h2>Needs attention</h2><small>Outreach, production and financial closeout</small></div><span class="home-count">'+alerts.length+' flagged</span></div>'+
   '<div class="home-panel-list" tabindex="0" role="region" aria-label="Work requiring attention">'+(alerts.length?alerts.slice(0,10).map(alertRow).join(''):'<p class="home-empty">No recorded follow-ups or outstanding items. Human safety and payment checks are still required.</p>')+'</div></section>';
 const shortcuts=[
  ['#/events','▦','Events & pipeline','Opportunities and diary'],
  [activeUrl,'◈','Event builder','Plan the active event'],
  ['index.html#/spaces/'+encodeURIComponent(active?.id||''),'◫','3D planner','Venue and fixtures'],
  ['#/technical/'+encodeURIComponent(active?.id||''),'⚡','Technical plans','Patching and power'],
  [active?closeout(active.id):'#/events','✓','Event closeout','Returns, crew and invoices'],
  ['#/entities','♧','Directory','People and suppliers'],
  ['index.html#/equipment','▤','Equipment library','Stock and catalogue'],
  ['index.html#/overview','⌂','Studio management','Projects and billing'],
  ['community.html','✳','Community noticeboard','View the public page'],
  ['#/community','◎','Submission review','Approve local demo posts']
 ];
 const shortPanel='<section class="home-shortcuts"><div class="home-shortcuts-heading"><h2>Go to workspace</h2><small>Quick access to your tools</small></div>'+
   '<div class="home-shortcut-grid">'+shortcuts.map(x=>'<a class="home-shortcut" href="'+x[0]+'"><span class="home-shortcut-icon" aria-hidden="true">'+x[1]+'</span>'+
   '<span><strong>'+x[2]+'</strong><small>'+x[3]+'</small></span><span aria-hidden="true" class="home-row-chevron">›</span></a>').join('')+'</div></section>';
 return '<div class="home-dashboard"><div class="home-top"><div><span class="eyebrow">PHAENOMENON / HOME</span>'+
  '<h1>Your studio at a glance</h1><p class="muted">'+escape(now.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))+' · Opportunities, production and closeout</p></div>'+
  '<div class="home-top-actions"><a class="btn" href="#/events">All events</a><button class="btn primary" type="button" data-act="builder-new">+ New opportunity / event</button></div></div>'+
  metrics+activeCard+'<div class="home-panels">'+eventPanel+alertsPanel+'</div>'+shortPanel+
  '<p class="home-disclaimer">Local prototype · Information is stored in this browser. Checklist completion does not certify a safe installation or confirm financial transfers.</p></div>';
}
window.PhaenomenonHome={render};
})();