/* Public noticeboard: only the dedicated community store, never private production data. */
(function(){
'use strict';
const C=window.PhaenomenonCommunity,$=id=>document.getElementById(id),esc=C.escape;
const stamp=s=>{const d=new Date(s+'T12:00:00');return {day:String(d.getDate()),month:d.toLocaleDateString('en-AU',{month:'short'}).toUpperCase(),group:d.toLocaleDateString('en-AU',{month:'long',year:'numeric'})};};
const time=s=>s?new Date('2000-01-01T'+s+':00').toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'}):'Time TBA';
const query={text:'',category:'all'};
function render(){
const filtered=C.published().filter(e=>(query.category==='all'||e.category===query.category)&&(!query.text||[e.title,e.description,e.area,e.venue,e.organiser].join(' ').toLocaleLowerCase().includes(query.text)));
$('community-count').textContent=filtered.length+' event'+(filtered.length===1?'':'s');
let previous='';
const html=filtered.map(e=>{
const date=stamp(e.date),heading=previous===date.group?'':'<div class="community-date-group">'+esc(date.group)+'</div>';
previous=date.group;
const external=e.url?'<div class="community-row-action"><a href="'+esc(e.url)+'" target="_blank" rel="noopener noreferrer nofollow ugc" aria-label="More information about '+esc(e.title)+'">More info / tickets ↗</a></div>':'';
return heading+'<article class="community-row"><div class="community-row-date"><small>'+esc(date.month)+'</small><b>'+esc(date.day)+'</b></div>'+
'<div class="community-row-detail"><h3>'+esc(e.title)+'</h3><div class="community-row-meta">'+esc(time(e.time))+' · '+esc(e.area)+(e.venue?' · '+esc(e.venue):'')+'</div>'+
'<p>'+esc(e.description)+'</p><div class="community-row-flags"><span class="community-chip">'+esc(e.category)+'</span>'+
(e.sample?'<span class="community-chip sample">Example listing</span>':'')+
(e.organiser?'<span class="community-chip">By '+esc(e.organiser)+'</span>':'')+'</div></div>'+external+'</article>';
}).join('');
$('community-list').innerHTML=html||'<p class="community-empty">Nothing matching that search yet. Try another category or check back later.</p>';
}
function status(message,good=false){
const el=$('community-form-message');el.hidden=false;el.textContent=message;el.style.borderColor=good?'#6d9c82':'#9e727c';
}
function openDialog(){
const d=$('community-submit-dialog');$('community-form-message').hidden=true;
if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
d.querySelector('[name="title"]')?.focus();
}
function closeDialog(){const d=$('community-submit-dialog');if(typeof d.close==='function')d.close();else d.removeAttribute('open');}
function init(){
const select=$('community-category'),form=$('community-submit-form');
C.CATEGORIES.forEach(cat=>{const o=document.createElement('option');o.value=cat;o.textContent=cat;select.appendChild(o)});
const selectInForm=form.querySelector('[name="category"]');
C.CATEGORIES.forEach(cat=>{const o=document.createElement('option');o.value=cat;o.textContent=cat;selectInForm.appendChild(o)});
const today=new Date(),start=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
form.querySelector('[name="date"]').min=start;
$('community-search').addEventListener('input',e=>{query.text=e.target.value.trim().toLocaleLowerCase();render()});
select.addEventListener('change',e=>{query.category=e.target.value;render()});
document.querySelectorAll('[data-open-submit]').forEach(b=>b.addEventListener('click',openDialog));
document.querySelectorAll('[data-close-submit]').forEach(b=>b.addEventListener('click',closeDialog));
$('community-submit-dialog').addEventListener('click',e=>{if(e.target===e.currentTarget)closeDialog()});
form.addEventListener('submit',e=>{
e.preventDefault();
const data=new FormData(form),result=C.submit(Object.fromEntries(data.entries()));
if(result.error){status(result.error);return;}
form.reset();form.querySelector('.ph-date-display')?.setAttribute('value','');const visualDate=form.querySelector('.ph-date-display');if(visualDate)visualDate.value='';status('Saved for review in this browser demo. This has NOT been sent to a server or shared with other visitors.',true);render();
});
window.addEventListener('storage',e=>{if(e.key===C.KEY)render()});
render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();