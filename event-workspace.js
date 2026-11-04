/*
 * Unified event workspace: a single event record from idea to closeout.
 * Pure renderer: no writes, no external requests, no hidden public publication.
 */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const own=a=>Array.isArray(a)?a:[];
const icons={
  details:'<path d="M8 4h11v16H5V4h3m0-2h6v4H8zM9 11h6M9 15h6"/>',
  design:'<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>',
  technical:'<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8z"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 8a3 3 0 0 1 0 6M18 18a4 4 0 0 1 3 3"/>',
  finance:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M7 15h4"/>',
  public:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/>',
  closeout:'<rect x="4" y="4" width="16" height="17" rx="2"/><path d="m8 12 2 2 4-4M8 18h8M9 2h6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>'
};
const icon=(name)=>'<svg class="ew-icon" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[name]||icons.details)+'</svg>';
const dateLabel=(e,l)=>{
 if(e.date)return new Date(e.date+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})+(l.dateCertainty==='confirmed'?'':' · '+l.dateLabel.toLowerCase());
 if(l.targetMonth)return new Date(l.targetMonth+'-15T12:00:00').toLocaleDateString('en-AU',{month:'short',year:'numeric'})+' · indicative';
 return 'Not scheduled';
};
const humanDate=day=>day?new Date(day+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):'';
const link=id=>'#/home/'+encodeURIComponent(id);
const builder=(id,step='brief')=>'#/builder/'+encodeURIComponent(id)+'/'+step;
function model(db,e,ctx={}){
 const L=window.PhaenomenonLifecycle,life=L.summary(db,e);
 const p=db?.venuePlans?.[e.id]||{},venue=own(db?.venues).find(x=>x.id===(p.venueId||e.venueId))||
   own(db?.venues).find(x=>x.name===e.venue);
 const selected=own(venue?.spaces).filter(s=>own(e.spaceIds).includes(s.id));
 const assignmentCount=own(db?.productionOS?.assignments).filter(a=>a.eventId===e.id).length;
 const invoices=own(db?.invoices).filter(x=>x.eventId===e.id);
 const published=db?.productionOS?.published?.[e.id],issues=own(db?.productionOS?.issues).filter(x=>x.eventId===e.id&&x.status!=='Resolved').length;
 const early=['idea','outreach','contacted','discussion','quoted','tentative','postponed'].includes(life.bookingStage);
 const terminal=['cancelled','declined','lost'].includes(life.bookingStage);
 const complete=life.closed,delivered=life.productionStage==='delivered';
 const publicId=e.lifecycle?.publicListingId||'',community=window.PhaenomenonCommunity,publicEntry=publicId?
   community?.read()?.entries?.find(x=>x.id===publicId&&x.source==='admin'&&!x.sample):null;
 let priority;
 if(complete)priority={title:'Event archived',detail:'All closeout items were recorded as complete or not applicable. Reopen if something changes.',href:'#/production/closeout/'+encodeURIComponent(e.id),action:'Review closure',tone:'neutral'};
 else if(delivered||terminal)priority={title:terminal?'Finalise or archive this event':'Complete post-event closeout',detail:life.remaining+' of '+life.total+' closeout items remaining. Equipment, crew and payments need independent confirmation.',href:'#/production/closeout/'+encodeURIComponent(e.id),action:'Open closeout',tone:'attention'};
 else if(early)priority=life.nextAction?
  {title:life.nextAction,detail:'Your recorded next action'+(life.followUpDate?' · Follow up '+humanDate(life.followUpDate):' · No follow-up date set'),href:builder(e.id),action:'Update outreach',tone:'opportunity'}:
  {title:life.eventLead==='studio'?'Develop the concept':'Follow up with the organiser',detail:'Add a next action or follow-up date. A confirmed date and venue are not required yet.',href:builder(e.id),action:'Add next action',tone:'opportunity'};
 else if(issues)priority={title:issues+' unresolved production issue'+(issues===1?'':'s'),detail:'Review the outstanding installation/production issues before delivery.',href:'#/production/installation/'+encodeURIComponent(e.id),action:'Review issues',tone:'attention'};
 else if(!venue||!selected.length)priority={title:'Confirm venue and spaces',detail:'Link the event to the spaces you expect to use.',href:'#/home/venue/'+encodeURIComponent(e.id),action:'Choose spaces',tone:'attention'};
 else if(!own(p.items).length)priority={title:'Start the event design',detail:'Place fixtures and equipment, then plan connections and labour.',href:'index.html#/spaces/'+encodeURIComponent(e.id),action:'Open 3D planner',tone:'neutral'};
 else if(!published||ctx.changed)priority={title:'Review the installation plan',detail:published?'Changes have been made since the last published pack.':'The initial crew instructions have not been published.',href:'#/builder/'+encodeURIComponent(e.id)+'/review',action:'Review & publish',tone:'attention'};
 else priority={title:'Coordinate event delivery',detail:'Review crew, technical plans and event schedule before load-in.',href:'#/production/team/'+encodeURIComponent(e.id),action:'Open production',tone:'neutral'};
 return {life,venue,selected,p,assignmentCount,invoices,published,issues,early,terminal,delivered,complete,priority,publicEntry,publicId,dateLabel:dateLabel(e,life)};
}
function taskCard({title,desc,href,iconName,meta,highlight}){
 return '<a class="ew-workspace-card'+(highlight?' ew-workspace-highlight':'')+'" href="'+esc(href)+'">'+
 '<span class="ew-card-icon">'+icon(iconName)+'</span><span class="ew-card-body"><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small>'+
 (meta?'<span class="ew-card-meta">'+esc(meta)+'</span>':'')+'</span><span class="ew-chevron" aria-hidden="true">›</span></a>';
}
function publication(db,e,m,open=false){
 const C=window.PhaenomenonCommunity;if(!C)return '';
 const linked=m.publicEntry;
 const defaultDate=linked?.date||e.date||'';
 const values={title:linked?.title??e.title,date:defaultDate,time:linked?.time||'',area:linked?.area||'',venue:linked?.venue||'',description:linked?.description||'',category:linked?.category||'Music & dance',organiser:linked?.organiser||(m.life.eventLead==='studio'?'Phaenomenon':''),url:linked?.url||''};
 const field=(name,title,type='text',value='',extra='')=>'<label>'+title+'<input class="input" name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+extra+'></label>';
 const state=linked?linked.status==='approved'?'Published (local demo)':linked.status==='pending'?'Awaiting review':'Unpublished':'Not listed';
 return '<details class="ew-publication panel" id="event-publication"'+(open?' open':'')+'>'+
   '<summary>'+icon('public')+'<span><strong>Community noticeboard listing</strong><small>'+esc(state)+' · Public details are separate from this production record</small></span><span class="ew-chevron">⌄</span></summary>'+
   '<div class="ew-publication-body"><div class="notice info">Only the fields entered below can appear publicly. Private notes, contacts, crew, budgets and technical information are not copied. Nothing is published without your action. This is a local-browser demo, not a live website.</div>'+
   (m.life.eventLead!=='studio'?'<p class="ew-privacy-warning">Client-led event: only publish information the organiser has explicitly authorised.</p>':'')+
   (m.publicId&&!linked?'<p class="ew-privacy-warning">A previously linked listing could not be found in this browser. Saving will create a fresh community listing.</p>':'')+
   '<form id="event-publication-form" class="ew-publication-form" data-event-id="'+esc(e.id)+'">'+
   field('title','Public event name','text',values.title,'required maxlength="120"')+
   '<div class="ew-publication-fields">'+field('date','Public date','date',values.date,'required')+
   field('time','Time (optional)','time',values.time)+
   field('area','Public neighbourhood','text',values.area,'required maxlength="80" placeholder="e.g. Brunswick"')+
   '<label>Category<select name="category">'+C.CATEGORIES.map(x=>'<option value="'+esc(x)+'"'+(values.category===x?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>'+
   field('venue','Public venue (optional)','text',values.venue,'maxlength="120" placeholder="Only if approved for publication"')+
   field('organiser','Public organiser (optional)','text',values.organiser,'maxlength="100"')+'</div>'+
   '<label>Public description<textarea class="input" name="description" maxlength="420" rows="2" required placeholder="What should visitors know?">'+esc(values.description)+'</textarea></label>'+
   field('url','External information or ticket link (optional)','url',values.url,'maxlength="500" placeholder="https://…"')+
   '<section class="ew-public-preview" aria-labelledby="ew-preview-title"><div class="ew-preview-heading"><strong id="ew-preview-title">Exactly what visitors can see</strong><small>Live preview · no publication yet</small></div>'+
   '<div id="event-public-preview" aria-live="polite"></div></section>'+
   '<label class="ew-publish-consent"><input type="checkbox" name="publishConsent" value="yes" required> I have permission to make every detail above public. No private addresses or personal information are included.</label>'+
   '<div class="ew-publish-footer"><label>Save as<select name="publishMode">'+
   '<option value="pending"'+(linked?.status==='pending'?' selected':'')+'>Save for review</option>'+
   '<option value="approved"'+(linked?.status==='approved'?' selected':'')+'>Publish to public demo now</option>'+
   '</select></label><button type="submit" class="btn primary">'+(linked?'Update community listing':'Save community listing')+'</button>'+
   (linked&&linked.status!=='rejected'?'<button type="button" class="btn" data-act="event-public-unpublish" data-id="'+esc(e.id)+'">Unpublish</button>':'')+
   '<a class="btn small" href="community.html" target="_blank" rel="noopener noreferrer">View public demo ↗</a></div></form></div></details>';
}
function preview(data){
 const e=esc,rows=[['Date',data.date],['Time',data.time],['Neighbourhood',data.area],
 ['Public venue',data.venue],['Category',data.category],['Organiser',data.organiser],
 ['Description',data.description],['External URL',data.url]];
 return '<div class="ew-preview-event"><strong>'+e(data.title||'Event name')+'</strong>'+
 rows.filter(x=>String(x[1]||'').trim()).map(([label,value])=>'<div class="ew-preview-row"><span>'+e(label)+'</span><span>'+e(value)+'</span></div>').join('')+
 (!data.area||!data.description?'<p class="ew-preview-note">Add a neighbourhood and a description before saving.</p>':'')+'</div>';
}
function render(db,e,ctx={}){
 if(!e)return '<section class="ew-empty panel"><h1>No event selected</h1><p class="muted">Create an event or select an existing one to begin.</p><button type="button" class="btn primary" data-act="builder-new">+ New event</button><a class="btn" href="#/events">Browse events →</a></section>';
 const m=model(db,e,ctx),life=m.life,id=encodeURIComponent(e.id);
 const summary=[
 ['Organised by',life.eventLead==='studio'?'Phaenomenon · own event':'Client-led event'],
 ['Booking stage',life.closed?'Closed / archived':life.bookingLabel],
 ['Date',m.dateLabel],['Production',life.productionLabel]
 ].map(([label,value])=>'<div class="ew-fact"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong></div>').join('');
 const notes=life.followUpDate&&!m.complete?'<span>Follow-up '+esc(humanDate(life.followUpDate))+'</span>':'';
 const mainCards=[
  {title:'Event details',desc:'Concept, organiser, date and next steps',href:builder(e.id),iconName:'details',meta:life.nextAction?'Action recorded':'Edit details',highlight:m.early},
  {title:'Venue & spaces',desc:'Location, stages and venue setup',href:'#/home/venue/'+id,iconName:'calendar',meta:m.venue?m.venue.name:'Not assigned'},
  {title:'People & crew',desc:'People, roles, responsibilities',href:'#/production/team/'+id,iconName:'people',meta:m.assignmentCount+' assigned'},
  {title:'Budget & invoices',desc:'Costs, client billing and payment status',href:'index.html#/invoices',iconName:'finance',meta:m.invoices.length+' linked invoice'+(m.invoices.length===1?'':'s')}
 ];
 const publicCard={title:'Public community listing',desc:'Preview and choose exactly what goes public',
 href:'#/home/'+id+'/publish',iconName:'public',meta:m.publicEntry?
 (m.publicEntry.status==='approved'?'Listed on public demo':m.publicEntry.status==='pending'?'Awaiting review':'Unpublished'):'Not published'};
 const mainVisible=m.early?
   (life.eventLead==='studio'?[mainCards[0],mainCards[1],publicCard]:mainCards.slice(0,3)):
   [...mainCards,publicCard];
 const productionCards=[
  {title:'3D design & equipment',desc:'Fixtures, positions and event kit',href:'index.html#/spaces/'+id,iconName:'design',meta:own(m.p.items).length+' placed objects'},
  {title:'Technical connections',desc:'Patch, power and cable planning',href:'#/technical/'+id,iconName:'technical',meta:own(m.p.runs).length+' documented runs'},
  {title:'Production & show',desc:'Load-in, crew packs and show schedule',href:'#/production/team/'+id,iconName:'people',meta:m.published?'Crew pack r'+m.published.revision:'No crew pack published'},
  {title:'Post-event closeout',desc:'Returns, payments and final records',href:'#/production/closeout/'+id,iconName:'closeout',meta:life.closed?'Closed':life.remaining+' items remaining'}
 ];
 const cards=items=>items.map(taskCard).join('');
 const archivedText=m.complete?'This event is closed. Reopen it through Closeout if more work needs recording.':
   m.early?'This is an early-stage event. You can explore technical workspaces whenever you want; nothing has to be confirmed first.':
   m.delivered?'Delivery is recorded. Resolve returns, people and financial items before closing.':
   'Technical planning remains subject to human review and safety verification.';
 return '<div class="event-workspace">'+
 '<div class="ew-top"><div class="ew-heading"><div class="ew-crumb">EVENTS <span>›</span> EVENT WORKSPACE</div>'+
 '<h1>'+esc(e.title)+'</h1><div class="ew-chiprow">'+
 '<span class="ew-chip '+(life.eventLead==='studio'?'is-own':'')+'">'+esc(life.eventLead==='studio'?'Own production':'Client work')+'</span>'+
 '<span class="ew-chip">'+esc(life.closed?'Closed':life.bookingLabel)+'</span>'+notes+'</div></div>'+
 '<div class="ew-top-actions"><a class="btn" href="#/events">All events</a><a class="btn primary" href="'+builder(e.id)+'">Edit event details →</a></div></div>'+
 '<div class="ew-facts" aria-label="Event lifecycle">'+summary+'</div>'+
 '<section class="ew-next '+esc(m.priority.tone)+'" aria-labelledby="ew-next-title"><div class="ew-next-copy"><small>RECOMMENDED NEXT</small>'+
 '<h2 id="ew-next-title">'+esc(m.priority.title)+'</h2><p>'+esc(m.priority.detail)+'</p></div>'+
 '<a class="btn primary" href="'+esc(m.priority.href)+'">'+esc(m.priority.action)+' →</a></section>'+
 '<section class="ew-main-panel"><div class="ew-section-title"><h2>'+esc(m.early?'Develop this event':m.delivered||m.complete?'Review event records':'Manage this production')+'</h2>'+
 '<span>Everything stays connected to this event</span></div>'+
 '<div class="ew-card-grid">'+cards(mainVisible)+'</div></section>'+
 (m.early?'<details class="ew-extra-tools"><summary>Production and finance workspaces <span>Available whenever you need them</span></summary><div class="ew-card-grid">'+
 cards([...(life.eventLead==='studio'?[mainCards[2]]:[mainCards[3],publicCard]),...(life.eventLead==='studio'?[mainCards[3]]:[]),...productionCards])+'</div></details>':
 '<section class="ew-main-panel"><div class="ew-section-title"><h2>Production workspaces</h2><span>Specialist tools for this event</span></div><div class="ew-card-grid">'+cards(productionCards)+'</div></section>')+
 (m.early?'':'<div class="ew-technical-summary"><span>'+icon('design')+' '+own(m.p.items).length+' placed</span>'+
 '<span>'+icon('people')+' '+m.assignmentCount+' assigned</span><span>'+icon('closeout')+' '+m.issues+' open issues</span>'+
 '<span>'+icon('finance')+' '+m.invoices.length+' invoices</span></div>')+
 '<p class="ew-stage-advice">'+esc(archivedText)+'</p>'+
 publication(db,e,m,!!ctx.publishOpen)+
 '<p class="ew-disclaimer">Private event data is stored in this browser. Planning progress does not certify technical safety. Community publication requires a separate, explicit decision and is a local demo.</p>'+
 '</div>';
}
window.PhaenomenonEventWorkspace={model,render,preview};
})();