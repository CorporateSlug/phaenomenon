/* Collection-first shell for Phaenomenon. Pure rendering, no storage access. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=a=>Array.isArray(a)?a:[];
const href=(collection,id)=>'#/'+collection+'/'+encodeURIComponent(id);
const money=x=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(x)||0);
const date=x=>x?new Date(x+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):'No date';
const label={equipment:'Equipment',fixtures:'Fixtures',venues:'Venues',finances:'Invoices',entities:'People & organisations'};
const newButton=(kind,text)=>'<button class="btn primary" type="button" data-act="collection-new" data-kind="'+kind+'">+ '+esc(text||'New '+kind)+'</button>';
const hero=(small,title,description,right)=>'<div class="hero collection-hero"><div><div class="eyebrow">'+esc(small)+'</div><h1>'+esc(title)+'</h1><p class="muted">'+esc(description)+'</p></div><div class="collection-actions">'+(right||'')+'</div></div>';
const row=(title,subtitle,collection,id,status)=>'<a class="collection-record" data-ph-record href="'+href(collection,id)+'">'+
 '<span class="collection-record-main"><strong>'+esc(title)+'</strong><small>'+esc(subtitle)+'</small></span>'+
 (status?'<span class="collection-record-status">'+esc(status)+'</span>':'')+
 '<span class="collection-record-arrow" aria-hidden="true">›</span></a>';
const empty=(label)=>'<p class="collection-empty">No '+esc(label)+' here yet. Use New to add the first record.</p>';
const search=(query,placeholder='Search this collection')=>'<label class="collection-search"><span class="collection-search-icon" aria-hidden="true">⌕</span><input class="input" id="collection-search" type="search" value="'+esc(query||'')+'" placeholder="'+esc(placeholder)+'" aria-label="'+esc(placeholder)+'"></label>';
const match=(q,fields)=>!q||fields.join(' ').toLocaleLowerCase().includes(q.toLocaleLowerCase());
const section=(name,rows,emptyTitle)=>'<section class="panel collection-section"><div class="section-head"><h2>'+esc(name)+'</h2><span class="muted">'+rows.length+' records</span></div>'+
 '<div class="collection-scroll" tabindex="0" role="region" aria-label="'+esc(name)+'">'+(rows.length?rows.join(''):empty(emptyTitle||name.toLowerCase()))+'</div></section>';
function browse(view,db,ui={},org={}){
 const q=String(ui.collectionSearch||'').trim();
 if(view==='equipment'){
  const equipment=arr(db.equipment).filter(x=>match(q,[x.name,x.category,x.id]));
  const fixtures=arr(db.fixtures).filter(x=>match(q,[x.name,x.code,x.maker,x.type]));
  return hero('LIBRARY','Equipment & fixtures','Browse reusable stock and fixture specifications. Open a record to edit it in its own tab.',newButton('equipment','New equipment')+newButton('fixture','New fixture'))+
   '<div class="collection-bar">'+search(q,'Find equipment or fixtures')+'<span class="collection-count">'+(equipment.length+fixtures.length)+' matching</span></div>'+
   '<div class="collection-grid">'+section('Equipment & inventory',equipment.map(x=>row(x.name,(x.category||'Equipment')+' · '+(x.owned||0)+' owned','equipment',x.id,money(x.rate||0)+'/event')),'equipment')+
   section('Fixture specifications',fixtures.map(x=>row(x.name,(x.maker||'Manufacturer unknown')+' · '+(x.code||'No code'),'fixtures',x.id,(x.stock||0)+' units')),'fixtures')+'</div>';
 }
 if(view==='venues'){
  const places=arr(db.venues).filter(x=>match(q,[x.name,x.notes,...arr(x.spaces).map(s=>s.name)]));
  return hero('LIBRARY','Venues & spaces','Browse reusable venues and their individual rooms or stages. Spaces remain linked to the venue.',newButton('venue','New venue'))+
   '<div class="collection-bar">'+search(q,'Find venue or room')+'<span class="collection-count">'+places.length+' venues</span></div>'+
   section('Venue library',places.map(x=>row(x.name,arr(x.spaces).map(s=>s.name).join(' · ')||'No named spaces','venues',x.id,arr(x.spaces).length+' spaces')),'venues');
 }
 if(view==='finances'){
  const invoices=arr(db.invoices).filter(x=>match(q,[x.number,x.status,arr(db.clients).find(c=>c.id===x.clientId)?.name||'',x.notes]));
  return hero('FINANCE','Invoices & billing','Browse draft invoices and recorded payment statuses. This prototype does not send invoices or process payments.',newButton('invoice','New invoice draft'))+
   '<div class="collection-bar">'+search(q,'Find invoice or client')+'<span class="collection-count">'+invoices.length+' invoices</span></div>'+
   section('Invoice register',invoices.map(x=>'<a class="collection-record" data-ph-record href="index.html#/invoices/'+encodeURIComponent(x.id)+'"><span class="collection-record-main"><strong>'+esc(x.number||'Draft invoice')+'</strong><small>'+esc(arr(db.clients).find(c=>c.id===x.clientId)?.name||'Customer not assigned')+' · '+esc(date(x.issueDate))+'</small></span><span class="collection-record-status">'+esc(x.status||'Draft')+'</span><span class="collection-record-arrow">›</span></a>'),'invoices')+
   '<p class="collection-note">Payments are marked manually and are not verified against bank transactions.</p>';
 }
 return '';
}
function detail(view,db,id){
 const back='#/'+(view==='fixtures'?'equipment':view);
 if(view==='equipment'){
  const e=arr(db.equipment).find(x=>x.id===id);
  if(!e)return missing('Equipment',back);
  return hero('EQUIPMENT / RECORD',e.name,'Inventory record · changes are saved to the existing equipment catalogue.','<a class="btn" href="'+back+'">← Equipment library</a>')+
   '<section class="panel collection-edit-panel"><form class="collection-form" id="collection-edit-equipment">'+
   '<input type="hidden" name="id" value="'+esc(e.id)+'">'+input('Equipment name','name',e.name,'text','required maxlength="120"')+
   input('Category','category',e.category||'Lighting','text','required maxlength="70"')+
   input('Owned quantity','owned',e.owned||0,'number','required min="0" max="100000"')+
   input('Hire rate per event (AUD)','rate',e.rate||0,'number','min="0" step="0.01"')+
   input('Rated watts per unit','watts',e.watts||0,'number','min="0"')+
   '<div class="collection-form-actions"><button class="btn primary" type="submit">Save equipment</button></div></form></section>';
 }
 if(view==='fixtures'){
  const f=arr(db.fixtures).find(x=>x.id===id);
  if(!f)return missing('Fixture',back);
  return hero('FIXTURE / RECORD',f.name,'Reusable fixture reference data. Manufacturer specifications require independent verification.','<a class="btn" href="'+back+'">← Equipment library</a>')+
  '<section class="panel collection-edit-panel"><form class="collection-form" id="collection-edit-fixture">'+
  '<input type="hidden" name="id" value="'+esc(f.id)+'">'+input('Fixture name','name',f.name,'text','required maxlength="120"')+
  input('Code','code',f.code||'','text','required maxlength="32"')+
  input('Manufacturer','maker',f.maker||'','text','required maxlength="60"')+
  input('Type','type',f.type||'Other','text','maxlength="40"')+
  input('Colour temperature','cct',f.cct||'','text','maxlength="30"')+
  input('Beam angle','beam',f.beam||'','text','maxlength="30"')+
  input('Units in stock','stock',f.stock||0,'number','min="0"')+
  input('Unit cost (AUD)','cost',f.cost||0,'number','min="0" step="0.01"')+
  '<div class="collection-form-actions"><button class="btn primary" type="submit">Save fixture</button></div></form></section>';
 }
 if(view==='venues'){
  const v=arr(db.venues).find(x=>x.id===id);if(!v)return missing('Venue',back);
  return hero('VENUE / RECORD',v.name,'Reusable location and its spaces, independent of any particular event.','<a class="btn" href="'+back+'">← Venue library</a>')+
   '<section class="panel collection-edit-panel"><form class="collection-form" id="collection-edit-venue">'+
   '<input type="hidden" name="id" value="'+esc(v.id)+'">'+input('Venue name','name',v.name,'text','required maxlength="120"')+
   '<label class="collection-wide">Venue notes<textarea name="notes" maxlength="3000" rows="3">'+esc(v.notes||'')+'</textarea></label>'+
   '<div class="collection-form-actions"><button class="btn primary">Save venue</button></div></form></section>'+
   '<section class="panel collection-section"><div class="section-head"><h2>Spaces at this venue</h2><span class="muted">'+arr(v.spaces).length+' spaces</span></div>'+
   '<div class="collection-scroll">'+arr(v.spaces).map(s=>'<div class="collection-record collection-static"><span class="collection-record-main"><strong>'+esc(s.name)+'</strong><small>'+esc(s.kind||'indoor')+' · '+esc(s.width||'')+' × '+esc(s.length||'')+' m</small></span></div>').join('')+'</div>'+
   '<details class="collection-disclosure"><summary>+ Add space</summary><form class="collection-form" id="collection-add-space"><input type="hidden" name="venueId" value="'+esc(v.id)+'">'+
   input('Space name','name','','text','required maxlength="120"')+
   input('Width (m)','width',12,'number','min="2" max="200" step="0.5"')+
   input('Length (m)','length',10,'number','min="2" max="200" step="0.5"')+
   input('Height (m)','height',4,'number','min="0.5" max="40" step="0.5"')+
   '<label>Space kind<select name="kind"><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option></select></label>'+
   '<div class="collection-form-actions"><button class="btn primary">Add space</button></div></form></details></section>';
 }
 return '';
}
function missing(label,back){return hero('NOT FOUND',label+' not found','This record may have been removed or changed in another tab.','<a class="btn" href="'+back+'">Back to collection</a>');}
function input(label,name,value='',type='text',attributes=''){
 return '<label>'+esc(label)+'<input class="input" type="'+esc(type)+'" name="'+esc(name)+'" value="'+esc(value)+'" '+attributes+'></label>';
}
function create(kind,draftId,db){
 const title={event:'New event',entity:'New person or organisation',equipment:'New equipment',fixture:'New fixture',venue:'New venue',invoice:'New invoice draft'}[kind];
 if(!title)return missing('Draft','#/dashboard');
 const parent={event:'events',entity:'entities',equipment:'equipment',fixture:'equipment',venue:'venues',invoice:'finances'}[kind];
 const banner=hero('NEW / '+kind.toUpperCase(),title,'A new tab for this record. You can leave this draft and return before saving.','<a class="btn" href="#/'+parent+'">← '+(label[parent]||parent)+'</a>');
 let fields='';
 if(kind==='event'){
  fields=input('Event or opportunity name','title','','text','required maxlength="120" placeholder="e.g. Summer party idea"')+
    '<div class="collection-wide" data-ph-client-field><label>External organiser (optional)<select name="clientId"><option value="">Not known yet</option>'+arr(db.clients).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label></div>'+
    window.PhaenomenonLifecycleUI.fields(null,{create:true});
 } else if(kind==='entity'){
  fields=input('Name','name','','text','required maxlength="140"')+
    '<label>Record type<select name="kind"><option>Person</option><option>Organisation</option></select></label>'+
    input('Aliases, comma separated','aliases','','text','maxlength="500"')+
    '<label class="collection-wide">Notes<textarea name="notes" maxlength="4000" rows="3"></textarea></label>';
 } else if(kind==='equipment'){
  fields=input('Equipment name','name','','text','required maxlength="120"')+input('Category','category','Lighting','text','required maxlength="70"')+
    input('Owned quantity','owned',1,'number','min="0" max="100000"')+input('Hire / event (AUD)','rate',0,'number','min="0" step="0.01"')+
    input('Rated watts per unit','watts',0,'number','min="0"');
 } else if(kind==='fixture'){
  fields=input('Fixture name','name','','text','required maxlength="120"')+input('Code','code','','text','required maxlength="32"')+
    input('Manufacturer','maker','','text','required maxlength="60"')+input('Type','type','Other','text','maxlength="40"')+
    input('Colour temperature','cct','','text','maxlength="30"')+input('Beam angle','beam','','text','maxlength="30"')+
    input('Units in stock','stock',0,'number','min="0"')+input('Unit cost (AUD)','cost',0,'number','min="0" step="0.01"');
 } else if(kind==='venue'){
  fields=input('Venue name','name','','text','required maxlength="120"')+input('First space','spaceName','Main space','text','required maxlength="120"')+
    input('Space width (m)','width',18,'number','min="2" max="200" step="0.5"')+input('Space length (m)','length',14,'number','min="2" max="200" step="0.5"')+
    input('Space height (m)','height',4,'number','min="0.5" max="40" step="0.5"')+
    '<label>Environment<select name="kind"><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option></select></label>';
 } else if(kind==='invoice'){
  fields=input('Invoice reference','number','','text','required maxlength="60" placeholder="e.g. PH-001"')+
    '<label>External customer<select name="clientId" required><option value="">Choose a client</option>'+arr(db.clients).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>'+
    input('Description','description','Lighting services','text','required maxlength="180"')+
    input('Amount (AUD, excluding GST)','rate',0,'number','min="0" step="0.01"')+
    '<p class="collection-wide collection-note">Draft only. No payment processing or automatic issue; review GST and business details before sending externally.</p>';
 }
 return banner+'<section class="panel collection-edit-panel"><form class="collection-form" id="collection-create-form" data-kind="'+esc(kind)+'" data-draft-id="'+esc(draftId||'draft')+'">'+
 fields+'<div class="collection-form-actions"><button class="btn primary" type="submit">Create '+esc(kind==='entity'?'record':kind==='invoice'?'invoice draft':kind)+'</button>'+
 '<span class="muted">This record will be saved only when you select Create.</span></div></form></section>';
}
window.PhaenomenonCollections={browse,detail,create};
})();