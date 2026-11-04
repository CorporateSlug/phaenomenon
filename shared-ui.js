(() => {
'use strict';
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
const pad=n=>String(n).padStart(2,'0');
const parse=s=>{const m=/^(\d{4})-(\d\d)(?:-(\d\d))?$/.exec(s||'');return m?{y:+m[1],m:+m[2]-1,d:m[3]?+m[3]:1}:null};
const format=(s,monthOnly=false)=>{const p=parse(s);return p?(monthOnly?months[p.m].slice(0,3)+' '+p.y:pad(p.d)+'/'+pad(p.m+1)+'/'+p.y):''};
let box=null,field=null,y,m,view,monthOnly=false;
function dismiss(){box?.remove();box=null;field=null}
function selectDate(v){const hidden=field.querySelector('[data-ph-iso]');hidden.value=v;field.querySelector('.ph-date-display').value=format(v,monthOnly);hidden.dispatchEvent(new Event('change',{bubbles:true}));dismiss()}
function render(){
 const selected=parse(field.querySelector('[data-ph-iso]').value),today=new Date(),start=Math.floor(y/10)*10;
 const title=view==='day'?months[m]+' '+y:view==='month'?y:view==='year'?start+'–'+(start+9):Math.floor(y/100)*100+'–'+(Math.floor(y/100)*100+99);
 box.innerHTML='<div class="ph-cal-header"><button type="button" data-c="prev" aria-label="Previous">‹</button><button type="button" data-c="zoom" class="ph-cal-title" aria-label="Choose larger date range">'+title+' ▾</button><button type="button" data-c="next" aria-label="Next">›</button></div><div class="ph-cal-grid '+(view==='day'?'':'ph-cal-grid3')+'"></div><div class="ph-cal-bottom"><button type="button" data-c="today">Today</button><button type="button" data-c="clear">Clear</button></div>';
 const grid=box.querySelector('.ph-cal-grid');
 const add=(label,action,value,cls='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.c=action;b.dataset.v=value;b.className=cls;grid.appendChild(b)};
 if(view==='day'){
  ['M','T','W','T','F','S','S'].forEach(t=>{const e=document.createElement('span');e.textContent=t;e.className='ph-weekday';grid.appendChild(e)});
  const first=(new Date(y,m,1).getDay()+6)%7;for(let i=0;i<first;i++)grid.appendChild(document.createElement('span'));
  for(let d=1;d<=new Date(y,m+1,0).getDate();d++)add(d,'day',d,(selected?.y===y&&selected?.m===m&&selected?.d===d?'selected ':'')+(today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d?'today':''));
 }else if(view==='month')months.forEach((name,i)=>add(name.slice(0,3),'month',i,selected?.y===y&&selected?.m===i?'selected':''));
 else if(view==='year')for(let n=start;n<start+10;n++)add(n,'year',n,selected?.y===n?'selected':'');
 else for(let n=Math.floor(y/100)*100;n<Math.floor(y/100)*100+100;n+=10)add(n+'s','decade',n);
}
function open(wrap){
 if(field===wrap){dismiss();return}dismiss();field=wrap;
 const p=parse(wrap.querySelector('[data-ph-iso]').value),today=new Date();y=p?.y??today.getFullYear();m=p?.m??today.getMonth();monthOnly=wrap.dataset.phMonth==='true';view=monthOnly?'month':'day';
 box=document.createElement('div');box.className='ph-calendar';box.setAttribute('role','dialog');box.setAttribute('aria-label','Choose date');document.body.appendChild(box);render();
 const r=wrap.getBoundingClientRect(),h=box.getBoundingClientRect().height;
 box.style.left=Math.max(10,Math.min(r.left,innerWidth-326))+'px';box.style.top=Math.max(10,Math.min(r.bottom+6,innerHeight-h-10))+'px';
}
function enhance(root){
 const selector='input[type="date"],input[type="month"]';
 const inputs=[...(root.matches?.(selector)?[root]:[]),...(root.querySelectorAll?.(selector)||[])];
 inputs.forEach(input=>{
  const monthMode=input.type==='month';
  const span=document.createElement('span');span.className='ph-date-wrap';span.dataset.phMonth=String(monthMode);
  const display=document.createElement('input');display.type='text';display.className=(input.className||'input')+' ph-date-display';display.readOnly=true;display.value=format(input.value,monthMode);display.placeholder=monthMode?'MMM YYYY':'DD/MM/YYYY';display.setAttribute('aria-label',monthMode?'Choose approximate month':'Choose date');display.setAttribute('aria-haspopup','dialog');display.disabled=input.disabled;
  input.before(span);span.append(display,input);input.type='hidden';input.dataset.phIso='';
  const icon=document.createElement('span');icon.className='ph-date-icon';icon.textContent='▦';span.appendChild(icon);
  display.addEventListener('click',()=>open(span));display.addEventListener('keydown',ev=>{if(['Enter',' ','ArrowDown'].includes(ev.key)){ev.preventDefault();open(span)}});
 });
}
document.addEventListener('click',ev=>{
 const btn=ev.target.closest('[data-c]');if(btn&&box){
  const a=btn.dataset.c,v=Number(btn.dataset.v);
  if(a==='zoom')view=view==='day'?'month':view==='month'?'year':'decade';
  if(a==='prev'||a==='next'){const dir=a==='next'?1:-1;if(view==='day'){m+=dir;if(m<0){m=11;y--}if(m>11){m=0;y++}}else y+=dir*(view==='month'?1:view==='year'?10:100)}
  if(a==='day'){selectDate(String(y).padStart(4,'0')+'-'+pad(m+1)+'-'+pad(v));return}
  if(a==='month'){m=v;if(monthOnly){selectDate(String(y).padStart(4,'0')+'-'+pad(m+1));return}view='day'}if(a==='year'){y=v;view='month'}if(a==='decade'){y=v;view='year'}
  if(a==='clear'){selectDate('');return}
  if(a==='today'){const d=new Date();selectDate(d.getFullYear()+'-'+pad(d.getMonth()+1)+(monthOnly?'':'-'+pad(d.getDate())));return}
  render();return;
 }
 if(box&&!box.contains(ev.target)&&!field?.contains(ev.target))dismiss();
});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&box){dismiss();ev.stopPropagation()}});

function enhanceScrollRegions(root){
 const selector='.table-scroll,.table-wrap,.tech-table-wrap,.ph-table-region,.ph-bounded-list,.event-index-rows,.event-side';
 const regions=[...(root.matches?.(selector)?[root]:[]),...(root.querySelectorAll?.(selector)||[])];
 regions.forEach(region=>{
  if(region.classList.contains('event-index-rows')&&region.children.length<7)return;
  if(!region.hasAttribute('tabindex'))region.tabIndex=0;
  if(!region.hasAttribute('role'))region.setAttribute('role','region');
  if(!region.hasAttribute('aria-label')){
   const title=region.closest('section,aside,article')?.querySelector('h2,h3')?.textContent?.trim();
   region.setAttribute('aria-label',(title||'Records')+' — '+(region.querySelector('table')?'scrollable table':'scrollable list'));
  }
 });
}
const init=()=>{enhance(document);enhanceScrollRegions(document);new MutationObserver(rs=>{rs.forEach(r=>{r.addedNodes.forEach(n=>{if(n.nodeType===1){enhance(n);enhanceScrollRegions(n)}});if(r.target?.nodeType===1)enhanceScrollRegions(r.target)});if(box&&!document.body.contains(field))dismiss()}).observe(document.body,{childList:true,subtree:true})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();