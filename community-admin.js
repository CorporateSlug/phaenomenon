/* Internal prototype reviewer. No authentication: NOT deployable as a real admin console. */
(function(){
'use strict';
const C=()=>window.PhaenomenonCommunity;
function render(){
 const model=C();if(!model)return '<section class="panel">Community noticeboard is unavailable.</section>';
 model.ensureDemo();
 const all=model.read().entries;
 const pending=all.filter(x=>x.status==='pending');
 const published=all.filter(x=>x.status==='approved');
 const rejected=all.filter(x=>x.status==='rejected');
 const own=all.filter(x=>x.source==='admin');
 const ownPublished=published.filter(x=>x.source==='admin');
 const communityPublished=published.filter(x=>x.source!=='admin');
 const esc=model.escape;
 const line=entry=>{
 const description=entry.description||'';
 const actions=entry.status==='pending'?
  '<div class="community-admin-actions"><button type="button" class="btn small primary" data-act="community-review" data-id="'+esc(entry.id)+'" data-status="approved">Approve for board</button>'+
  '<button type="button" class="btn small" data-act="community-review" data-id="'+esc(entry.id)+'" data-status="rejected">Decline</button></div>':
  entry.status==='approved'?'<div class="community-admin-actions"><button type="button" class="btn small" data-act="community-review" data-id="'+esc(entry.id)+'" data-status="rejected">Unpublish</button></div>':
  '<div class="community-admin-actions"><button type="button" class="btn small" data-act="community-review" data-id="'+esc(entry.id)+'" data-status="pending">Return to review</button></div>';
 return '<div class="community-admin-row"><div class="community-admin-main"><div class="community-admin-name"><strong>'+esc(entry.title)+'</strong><span class="pill">'+esc(entry.category||'Other')+'</span>'+(entry.sample?'<span class="pill community-admin-demo">Example</span>':'')+(entry.source==='admin'?'<span class="pill community-admin-own">Created here</span>':'')+'</div>'+
 '<small>'+esc(entry.date||'Date unknown')+(entry.time?' · '+esc(entry.time):'')+' · '+esc(entry.area||'Location TBA')+'</small>'+
 '<p>'+esc(description)+'</p>'+
 '<small>Submitted as '+esc(entry.organiser||'Community contributor')+(entry.url?' · External link provided':'')+'</small>'+
 '</div>'+actions+'</div>';
 };
 const group=(title,items,description)=>'<section class="panel community-review-group"><div class="section-head"><div><h2>'+title+'</h2><p class="muted">'+description+'</p></div><span class="pill">'+items.length+'</span></div>'+
 '<div class="community-admin-list ph-bounded-list" tabindex="0" role="region" aria-label="'+title+'">'+
 (items.length?items.map(line).join(''):'<p class="muted community-admin-empty">Nothing here yet.</p>')+'</div></section>';

 const createForm='<details class="panel community-admin-create" id="community-admin-create"><summary><span>+ Create event listing</span><small>Post your own event or save it as a draft for review</small></summary>'+
 '<div class="community-admin-create-body"><p class="form-note">This creates a community noticeboard listing, not an internal production booking. Public listings show only the fields entered here.</p>'+
 '<form id="community-admin-create-form" class="community-admin-form">'+
 '<label class="wide">Event name<input class="input" type="text" name="title" maxlength="120" placeholder="e.g. Phaenomenon open decks" required></label>'+
 '<label>Date<input class="input" type="date" name="date" required></label>'+
 '<label>Time (optional)<input class="input" type="time" name="time"></label>'+
 '<label>Neighbourhood<input class="input" name="area" maxlength="80" placeholder="e.g. Fitzroy" required></label>'+
 '<label>Event type<select name="category">'+model.CATEGORIES.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('')+'</select></label>'+
 '<label>Public venue (optional)<input class="input" name="venue" maxlength="120" placeholder="Leave blank if private / unconfirmed"></label>'+
 '<label>Organiser name (optional)<input class="input" name="organiser" maxlength="100" value="Phaenomenon"></label>'+
 '<label class="wide">Short description<textarea name="description" rows="2" maxlength="420" required placeholder="Just the essentials — what is it?"></textarea></label>'+
 '<label class="wide">Info or tickets link (optional)<input class="input" type="url" name="url" maxlength="500" placeholder="https://…"></label>'+
 '<label>What happens when you save?<select name="publishMode"><option value="approved">Publish to public demo now</option><option value="pending">Save for review</option></select></label>'+
 '<div class="community-admin-create-actions"><button type="submit" class="btn primary">Save listing</button><span class="form-note">Visible only in this browser demo.</span></div>'+
 '</form></div></details>';

 return '<section class="community-admin-workspace">'+
 '<div class="hero"><div><div class="eyebrow">COMMUNITY / PUBLIC NOTICEBOARD</div><h1>Community noticeboard</h1>'+
 '<p class="muted">Review submissions for the public-facing demo. Keep this separate from private event production records.</p></div>'+
 '<div class="row"><a class="btn primary" href="community.html" target="_blank" rel="noopener noreferrer">Open public page ↗</a></div></div>'+
 '<div class="notice info section">DEMO ONLY: Visitors cannot actually submit to Aaron from another device yet. Submissions and approvals below share local storage only within this browser and origin. There is no secure admin login or live moderation backend.</div>'+
 '<div class="community-admin-metrics"><div class="stat"><small>Awaiting review</small><strong>'+pending.length+'</strong></div>'+
 '<div class="stat"><small>Approved submissions</small><strong>'+published.length+'</strong></div>'+
 '<div class="stat"><small>Created here</small><strong>'+own.length+'</strong></div>'+
 '<div class="stat"><small>Example listings</small><strong>'+(model.examples().length+all.filter(x=>x.sample).length)+'</strong></div></div>'+
 createForm+
 group('Waiting for review',pending,'Practice approving or declining the example submissions.')+
 '<div class="community-admin-secondary">'+group('Your published listings',ownPublished,'Listings created from this admin workspace, including a labelled demo example.')+
 group('Approved community submissions',communityPublished,'External submissions approved for the public board.')+'</div>'+
 group('Declined or unpublished',rejected,'Hidden from the public board. You can return these to review.')+
 '<p class="footnote">Future launch requires an authenticated review service, server-side validation and abuse controls. The internal event database is never exported to the public page.</p>'+
 '</section>';
}
window.PhaenomenonCommunityAdmin={render};
})();