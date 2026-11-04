/* Compact data-driven Home dashboard for Phaenomenon Production OS. */
(function(){
'use strict';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=id=>'#/builder/'+encodeURIComponent(id);
const fmt=s=>/^\d{4}-\d\d-\d\d$/.test(s||'')?new Date(s+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):'Unscheduled';
const dayString=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const hrefStep=(e,s)=>['brief','spaces','equipment','review'].includes(s.id)?link(e.id)+'/'+s.id:s.href||link(e.id);
function render({events=[],activeId}={}){
 const now=new Date(),today=dayString(now),later=new Date(now.getFullYear(),now.getMonth(),now.getDate()+30),last=dayString(later);
 const relevant=events.filter(e=>e.status!=='Cancelled');
 const future=relevant.filter(e=>/^\d{4}-\d\d-\d\d$/.test(e.date||'')&&e.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
 const upcoming=future.filter(e=>e.date<=last),enquiries=relevant.filter(e=>e.status==='Enquiry');
 const totalIssues=events.reduce((n,e)=>n+e.openIssues,0),revisions=events.filter(e=>e.needsRevision).length;
 const active=events.find(e=>e.id===activeId)||events[0],steps=active?.steps||[];
 const done=steps.filter(s=>s.state==='complete').length,next=steps.find(s=>s.state!=='complete');
 const metric=(title,count,sub,dest)=>'<a class="home-metric" href="'+dest+'"><span class="home-metric-label">'+title+'</span><strong>'+count+'</strong><small>'+sub+' ↗</small></a>';
 const metrics='<div class="home-metrics">'+metric('Next 30 days',upcoming.length,'Scheduled events','#/events')+
   metric('Open enquiries',enquiries.length,'Awaiting confirmation','#/events')+
   metric('Open issues',totalIssues,'Across events','#/events')+
   metric('Crew packs to review',revisions,'Unpublished changes','#/events')+'</div>';
 const activeUrl=active?link(active.id):'#/events';
 const activeCard='<section class="panel home-current" aria-labelledby="home-active-heading"><div class="home-current-left">'+
   '<div class="home-current-kicker"><span class="eyebrow">CONTINUE WORKING</span>'+
   (active?.needsRevision?'<span class="home-warning">Revision needs review</span>':active?.openIssues?'<span class="home-warning">'+active.openIssues+' open issues</span>':'')+'</div>'+
   '<h2 id="home-active-heading">'+escape(active?.title||'No current event')+'</h2>'+
   '<p class="muted">'+escape(active?fmt(active.date)+' · '+active.venue+' · '+(active.status||'Draft'):'Create an event to start planning')+'</p>'+
   '<div class="home-progress-text"><strong>'+done+' of '+steps.length+' steps configured</strong><small>Planning progress only · not safety approval</small></div>'+
   '<div class="home-progress" role="progressbar" aria-label="Current event planning progress" aria-valuemin="0" aria-valuemax="'+steps.length+'" aria-valuenow="'+done+'"><span style="width:'+(steps.length?Math.round(done/steps.length*100):0)+'%"></span></div>'+
   '</div><div class="home-current-actions"><a class="btn primary" href="'+activeUrl+'">Open event builder →</a>'+
   (next?'<a class="btn" href="'+hrefStep(active,next)+'">Next: '+escape(next.title)+'</a>':'<a class="btn" href="#/events">All events</a>')+
   '</div></section>';
 const eventRow=e=>'<a class="home-row" href="'+link(e.id)+'"><span class="home-row-date">'+escape(fmt(e.date))+'</span>'+
   '<span class="home-row-detail"><strong>'+escape(e.title)+'</strong><small>'+escape(e.venue)+'</small></span>'+
   '<span class="home-row-status">'+escape(e.status||'Enquiry')+'</span><span class="home-row-chevron" aria-hidden="true">›</span></a>';
 const eventPanel='<section class="panel home-panel"><div class="home-panel-heading"><div><h2>Upcoming events</h2><small>'+future.length+' scheduled from today</small></div>'+
   '<a class="btn small" href="#/events">Full schedule →</a></div>'+
   '<div class="home-panel-list" tabindex="0" role="region" aria-label="Upcoming events">'+(future.length?future.slice(0,10).map(eventRow).join(''):'<p class="home-empty">No upcoming events recorded.</p>')+'</div></section>';
 const alerts=[];
 for(const e of [...new Map([active,...future.slice(0,10)].filter(Boolean).map(x=>[x.id,x])).values()]){
   if(e.openIssues)alerts.push({title:e.openIssues+' open production issue'+(e.openIssues===1?'':'s'),detail:e.title,url:'#/production/installation/'+encodeURIComponent(e.id),type:'issue'});
   if(e.needsRevision)alerts.push({title:'Review unpublished design changes',detail:e.title,url:link(e.id)+'/review',type:'issue'});
   const first=e.steps?.find(s=>s.state==='attention'&&s.id!=='review');
   if(first)alerts.push({title:first.title+' needs attention',detail:e.title+' · '+first.summary,url:hrefStep(e,first),type:'planning'});
 }
 if(!alerts.length&&enquiries.length)alerts.push({title:'Review open enquiries',detail:enquiries.length+' pending bookings',url:'#/events',type:'planning'});
 const alertRow=a=>'<a class="home-row home-alert-row" href="'+a.url+'"><span class="home-alert-dot '+a.type+'" aria-hidden="true"></span>'+
  '<span class="home-row-detail"><strong>'+escape(a.title)+'</strong><small>'+escape(a.detail)+'</small></span><span class="home-row-chevron" aria-hidden="true">›</span></a>';
 const alertsPanel='<section class="panel home-panel"><div class="home-panel-heading"><div><h2>Needs attention</h2><small>From recorded event plans and issues</small></div><span class="home-count">'+alerts.length+' flagged</span></div>'+
   '<div class="home-panel-list" tabindex="0" role="region" aria-label="Recorded items needing attention">'+(alerts.length?alerts.slice(0,10).map(alertRow).join(''):'<p class="home-empty">No flagged items in the recorded plans. Human technical checks are still needed.</p>')+'</div></section>';
 const shortcuts=[
   ['#/events','▦','Events & schedule','Bookings and diary'],
   [activeUrl,'◈','Event builder','Plan and configure'],
   ['index.html#/spaces/'+encodeURIComponent(active?.id||''),'◫','3D planner','Venue and fixtures'],
   ['#/technical/'+encodeURIComponent(active?.id||''),'⚡','Technical plans','Patching and power'],
   ['#/production/'+encodeURIComponent(active?.id||''),'✓','Production','Team and show'],
   ['#/entities','♧','Directory','People and suppliers'],
   ['index.html#/equipment','▤','Equipment library','Stock and catalogue'],
   ['index.html#/overview','⌂','Studio management','Projects and invoices']
 ];
 const shortPanel='<section class="home-shortcuts"><div class="home-shortcuts-heading"><h2>Go to workspace</h2><small>Quick access to your tools</small></div>'+
   '<div class="home-shortcut-grid">'+shortcuts.map(x=>'<a class="home-shortcut" href="'+x[0]+'"><span class="home-shortcut-icon" aria-hidden="true">'+x[1]+'</span>'+
   '<span><strong>'+x[2]+'</strong><small>'+x[3]+'</small></span><span aria-hidden="true" class="home-row-chevron">›</span></a>').join('')+'</div></section>';
 return '<div class="home-dashboard"><div class="home-top"><div><span class="eyebrow">PHAENOMENON / HOME</span>'+
  '<h1>Your studio at a glance</h1><p class="muted">'+escape(now.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))+' · Planning and delivery in one place</p></div>'+
  '<div class="home-top-actions"><a class="btn" href="#/events">All events</a><button class="btn primary" type="button" data-act="builder-new">+ New event</button></div></div>'+
  metrics+activeCard+'<div class="home-panels">'+eventPanel+alertsPanel+'</div>'+shortPanel+
  '<p class="home-disclaimer">Local prototype · Information is saved in this browser. Planning status does not certify technical safety or approvals.</p></div>';
}
window.PhaenomenonHome={render};
})();