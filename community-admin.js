/* Internal prototype reviewer. No authentication: NOT deployable as a real admin console. */
(function(){
'use strict';
const C=()=>window.PhaenomenonCommunity;
function render(){
 const model=C();if(!model)return '<section class="panel">Community noticeboard is unavailable.</section>';
 const all=model.read().entries;
 const pending=all.filter(x=>x.status==='pending');
 const published=all.filter(x=>x.status==='approved');
 const rejected=all.filter(x=>x.status==='rejected');
 const esc=model.escape;
 const line=entry=>{
 const description=entry.description||'';
 const actions=entry.status==='pending'?
  '<div class="community-admin-actions"><button type="button" class="btn small primary" data-act="community-review" data-id="'+esc(entry.id)+'" data-status="approved">Approve for board</button>'+
  '<button type="button" class="btn small" data-act="community-review" data-id="'+esc(entry.id)+'" data-status="rejected">Decline</button></div>':
  entry.status==='approved'?'<div class="community-admin-actions"><button type="button" class="btn small" data-act="community-review" data-id="'+esc(entry.id)+'" data-status="rejected">Unpublish</button></div>':
  '<div class="community-admin-actions"><button type="button" class="btn small" data-act="community-review" data-id="'+esc(entry.id)+'" data-status="pending">Return to review</button></div>';
 return '<div class="community-admin-row"><div class="community-admin-main"><div class="community-admin-name"><strong>'+esc(entry.title)+'</strong><span class="pill">'+esc(entry.category||'Other')+'</span></div>'+
 '<small>'+esc(entry.date||'Date unknown')+(entry.time?' · '+esc(entry.time):'')+' · '+esc(entry.area||'Location TBA')+'</small>'+
 '<p>'+esc(description)+'</p>'+
 '<small>Submitted as '+esc(entry.organiser||'Community contributor')+(entry.url?' · External link provided':'')+'</small>'+
 '</div>'+actions+'</div>';
 };
 const group=(title,items,description)=>'<section class="panel community-review-group"><div class="section-head"><div><h2>'+title+'</h2><p class="muted">'+description+'</p></div><span class="pill">'+items.length+'</span></div>'+
 '<div class="community-admin-list ph-bounded-list" tabindex="0" role="region" aria-label="'+title+'">'+
 (items.length?items.map(line).join(''):'<p class="muted community-admin-empty">Nothing here yet.</p>')+'</div></section>';
 return '<section class="community-admin-workspace">'+
 '<div class="hero"><div><div class="eyebrow">COMMUNITY / PUBLIC NOTICEBOARD</div><h1>Community noticeboard</h1>'+
 '<p class="muted">Review submissions for the public-facing demo. Keep this separate from private event production records.</p></div>'+
 '<div class="row"><a class="btn primary" href="community.html" target="_blank" rel="noopener">Open public page ↗</a></div></div>'+
 '<div class="notice info section">DEMO ONLY: Visitors cannot actually submit to Aaron from another device yet. Submissions and approvals below share local storage only within this browser and origin. There is no secure admin login or live moderation backend.</div>'+
 '<div class="community-admin-metrics"><div class="stat"><small>Awaiting review</small><strong>'+pending.length+'</strong></div>'+
 '<div class="stat"><small>Approved submissions</small><strong>'+published.length+'</strong></div>'+
 '<div class="stat"><small>Declined / unpublished</small><strong>'+rejected.length+'</strong></div>'+
 '<div class="stat"><small>Example listings</small><strong>'+model.examples().length+'</strong></div></div>'+
 group('Waiting for review',pending,'Review local submissions before showing them on the public page.')+
 '<div class="community-admin-secondary">'+group('Approved community submissions',published,'Visible on the public demo page in this browser.')+
 group('Declined or unpublished',rejected,'Not visible on the public page.')+'</div>'+
 '<p class="footnote">Future launch requires an authenticated review service, server-side validation and abuse controls. The internal event database is never exported to the public page.</p>'+
 '</section>';
}
window.PhaenomenonCommunityAdmin={render};
})();