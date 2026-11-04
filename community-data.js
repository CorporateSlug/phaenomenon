/* Public noticeboard demo data. Never reads the private production workspace.
   Browser-local only: no public multi-user sync, authentication or moderation security. */
(function(){
'use strict';
const KEY='phaenomenon-community-demo-v1';
const CATEGORIES=['Music & dance','Community','Arts & culture','Wellbeing','Other'];
const uid=()=> 'community-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
const trim=(x,max=180)=>String(x??'').trim().slice(0,max);
const pad=n=>String(n).padStart(2,'0');
const dateAfter=days=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return [d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');};
const examples=()=>[
{id:'demo-community-1',title:'Community listening night',date:dateAfter(11),time:'19:00',area:'Brunswick',venue:'Venue to be announced',category:'Music & dance',description:'A relaxed evening to share music and meet new people.',url:'',status:'approved',sample:true,organiser:'Community organisers',createdAt:''},
{id:'demo-community-2',title:'Queer makers afternoon',date:dateAfter(19),time:'14:00',area:'Collingwood',venue:'Location shared by organisers',category:'Arts & culture',description:'Bring a project, learn something small and spend time making things together.',url:'',status:'approved',sample:true,organiser:'Local makers',createdAt:''},
{id:'demo-community-3',title:'Neighbourhood picnic',date:dateAfter(32),time:'12:00',area:'Northcote',venue:'Park details to come',category:'Community',description:'A low-key afternoon for neighbours and friends.',url:'',status:'approved',sample:true,organiser:'Community volunteers',createdAt:''}
];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isDay=s=>{if(!/^\d{4}-\d\d-\d\d$/.test(s||''))return false;const d=new Date(s+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;};
const urlOrEmpty=u=>{const raw=trim(u,500);if(!raw)return '';try{const parsed=new URL(raw);return ['http:','https:'].includes(parsed.protocol)?parsed.href:'';}catch{return '';}};
function validate(input){
const data={title:trim(input?.title,120),date:trim(input?.date,10),time:trim(input?.time,5),area:trim(input?.area,80),venue:trim(input?.venue,120),category:trim(input?.category,40),description:trim(input?.description,420),url:trim(input?.url,500),organiser:trim(input?.organiser,100)};
if(data.title.length<3)return {error:'Please add an event name (at least 3 characters).'};
if(!isDay(data.date))return {error:'Please choose a valid event date.'};
if(data.date<dateAfter(0))return {error:'The event date must be today or later.'};
if(data.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time))return {error:'Please enter a valid time.'};
if(!data.area)return {error:'Please enter a neighbourhood or general location.'};
if(!CATEGORIES.includes(data.category))return {error:'Please choose a category.'};
if(!data.description)return {error:'Please add a short description.'};
if(data.url&&!urlOrEmpty(data.url))return {error:'Use a valid http or https link, or leave the link empty.'};
data.url=urlOrEmpty(data.url);return {data};
}
function read(storage=localStorage){
try{const data=JSON.parse(storage.getItem(KEY)||'null');
if(!data||data.version!==1||!Array.isArray(data.entries))return {version:1,demoSeedVersion:0,entries:[]};
return {version:1,demoSeedVersion:data.demoSeedVersion===1?1:0,
entries:data.entries.filter(x=>x&&typeof x.id==='string'&&['pending','approved','rejected'].includes(x.status)).slice(-300)};}
catch{return {version:1,demoSeedVersion:0,entries:[]};}
}
function demoReviewExamples(){
const toEntry=(id,title,days,time,area,venue,category,description,organiser,status,source)=>({
id,title,date:dateAfter(days),time,area,venue,category,description,organiser,
url:'',status,source,sample:true,createdAt:'',demo:true
});
return [
toEntry('demo-review-dance','Small dancefloor meetup · demo',16,'20:00','Fitzroy','Public venue TBA',
'Music & dance','Fictional community submission for Aaron to check and approve. No exact location is shared.','Local collective','pending','public'),
toEntry('demo-review-craft','Queer craft & repair circle · demo',23,'14:00','Brunswick','Meetup details TBA',
'Arts & culture','An illustrative community-hosted afternoon of making and repairing things.','Neighbourhood organisers','pending','public'),
toEntry('demo-own-open-decks','Phaenomenon open decks · demo',29,'18:30','Collingwood','Venue TBA',
'Music & dance','Illustrative Phaenomenon-run listening and DJ session. Not a real advertised event.','Phaenomenon','approved','admin')
];
}
/* Add missing demonstration records once without deleting or changing user posts.
   Seed state is stored so rejected / unpublished examples stay rejected. */
function ensureDemo(storage=localStorage){
const db=read(storage);
if(db.demoSeedVersion===1)return {ok:true,added:0};
const current=new Set(db.entries.map(x=>x.id));
const samples=demoReviewExamples().filter(x=>!current.has(x.id));
db.entries.push(...samples);
db.demoSeedVersion=1;
const result=write(db,storage);
return result.error?result:{ok:true,added:samples.length};
}
function write(data,storage=localStorage){try{storage.setItem(KEY,JSON.stringify(data));return {ok:true};}catch{return {error:'Browser storage is unavailable or full. The entry was not saved.'};}}
function submit(input,storage=localStorage){
const check=validate(input);if(check.error)return check;
const db=read(storage);if(db.entries.length>=300)return {error:'This demo has reached its local storage limit.'};
const entry={id:uid(),...check.data,status:'pending',source:'public',sample:false,createdAt:new Date().toISOString()};
db.entries.push(entry);const result=write(db,storage);return result.error?result:{ok:true,entry};
}
/* Aaron can create a listing directly without creating a private production job. */
function createAdmin(input,publishMode='approved',storage=localStorage){
if(!['approved','pending'].includes(publishMode))return {error:'Choose Publish now or Save for review.'};
const check=validate({...input,organiser:trim(input?.organiser,100)||'Phaenomenon'});
if(check.error)return check;
const db=read(storage);
if(db.entries.length>=300)return {error:'This demo has reached its local storage limit.'};
const entry={id:uid(),...check.data,status:publishMode,source:'admin',sample:false,createdAt:new Date().toISOString()};
db.entries.push(entry);const result=write(db,storage);
return result.error?result:{ok:true,entry};
}
function review(id,status,storage=localStorage){
if(!['approved','rejected','pending'].includes(status))return {error:'Invalid review status.'};
const db=read(storage),entry=db.entries.find(x=>x.id===id);
if(!entry)return {error:'Submission not found in this browser.'};
entry.status=status;entry.reviewedAt=new Date().toISOString();const result=write(db,storage);
return result.error?result:{ok:true,entry};
}
function published(storage=localStorage){
return [...examples(),...read(storage).entries.filter(x=>x.status==='approved')]
.filter(x=>isDay(x.date)&&x.date>=dateAfter(0))
.sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||'')||a.title.localeCompare(b.title));
}
function pending(storage=localStorage){return read(storage).entries.filter(x=>x.status==='pending').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));}
window.PhaenomenonCommunity={KEY,CATEGORIES,escape,isDay,safeUrl:urlOrEmpty,validate,read,submit,createAdmin,review,published,pending,examples,ensureDemo,demoReviewExamples};
})();