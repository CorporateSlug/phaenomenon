/* Phaenomenon technical planning engine v1.
 * One event's placed equipment + cable runs are the authoritative source.
 * Assumptions are preliminary; all physical/electrical limits must be verified. */
(()=>{
'use strict';
const N=(v,d=0)=>v===null||v===''||v===undefined?d:(Number.isFinite(+v)?+v:d);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const valid=(v)=>Number.isFinite(Number(v))&&v!==''&&v!=null;
const round=(x,d=2)=>+Number(x).toFixed(d);
const clean=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ID=(prefix)=>prefix+'-'+Math.random().toString(36).slice(2,9);
const TYPES=['dmx','power','network','audio','video'];
const CONNECTORS={dmx:['','3-pin XLR','5-pin XLR','etherCON','Other / adaptor'],power:['','powerCON','Power Pro True / TRUE1','Mains / IEC','Other / adaptor'],network:['','etherCON / Cat6','RJ45 / Cat6','Fibre','Other'],audio:['','3-pin XLR','Speakon','TRS','Other'],video:['','3G-SDI / BNC','12G-SDI / BNC','HDMI','DisplayPort','Fibre / SDI converter','Other']};
const DEFAULT_LENGTHS=[2,3,5,10,15,20,25,30,50,100];
const title=(x)=>({dmx:'DMX / data',power:'Power',network:'Ethernet',audio:'Audio',video:'Video / SDI / HDMI'}[x]||x);
function ensure(db,eventId,plan){
 if(!db.technicalPlans || typeof db.technicalPlans!=='object'||Array.isArray(db.technicalPlans))db.technicalPlans={};
 let t=db.technicalPlans[eventId];
 if(!t||typeof t!=='object')t=db.technicalPlans[eventId]={
  version:1,universeCount:6,circuits:[
   {id:'c1',name:'Circuit 01',voltage:230,limitAmps:10,warningPercent:80},
   {id:'c2',name:'Circuit 02',voltage:230,limitAmps:10,warningPercent:80}
  ],patch:{},power:{},deviceSpecs:{},installed:{},notes:'',latestReportAt:null
 };
 if(!Array.isArray(t.circuits))t.circuits=[];
 if(!t.patch||typeof t.patch!=='object')t.patch={};
 if(!t.power||typeof t.power!=='object')t.power={};
 if(!t.deviceSpecs||typeof t.deviceSpecs!=='object')t.deviceSpecs={};
 if(!t.installed||typeof t.installed!=='object')t.installed={};
 if(!Array.isArray(plan?.runs))plan.runs=[];
 for(const item of plan.items||[]){
   if(!t.patch[item.id])t.patch[item.id]={enabled:item.kind==='light',universe:1,channels:null,start:null,locked:false,modeName:''};
   if(item.kind==='light')t.patch[item.id].enabled=true;
   if(!t.power[item.id])t.power[item.id]={enabled:N(item.watts)>0,circuitId:'',currentOverride:null};
   if(!t.deviceSpecs[item.id])t.deviceSpecs[item.id]={dmxIn:'',dmxOut:'',powerIn:'',powerOut:'',maxPowerLinks:null};
 }
 t.universeCount=clamp(Math.round(N(t.universeCount,6)),1,64);
 return t;
}
function listedItems(plan,t){
 return (plan.items||[]).filter(o=>t.patch[o.id]?.enabled);
}
function sortedPatch(plan,t){
 const items=listedItems(plan,t);const order=new Map((plan.items||[]).map((o,i)=>[o.id,i]));
 return items.slice().sort((a,b)=>{
   const pa=t.patch[a.id]||{},pb=t.patch[b.id]||{};
   return N(pa.universe,1)-N(pb.universe,1)||N(pa.start,9999)-N(pb.start,9999)||(order.get(a.id)-order.get(b.id));
 });
}
function autoPatch(plan,t){
 const list=listedItems(plan,t),byU=new Map(),failures=[];
 for(const o of list){const p=t.patch[o.id],u=clamp(Math.round(N(p.universe,1)),1,t.universeCount);p.universe=u;if(!byU.has(u))byU.set(u,[]);byU.get(u).push(o);}
 for(const [u,group] of byU){
   const occupied=[];
   const hold=group.filter(o=>t.patch[o.id].locked && valid(t.patch[o.id].start)&&N(t.patch[o.id].channels)>0);
   for(const o of hold){const p=t.patch[o.id],start=Math.round(N(p.start)),channels=Math.round(N(p.channels));occupied.push([start,start+channels-1,o.id]);}
   for(const o of group.filter(o=>!hold.includes(o))){
    const p=t.patch[o.id],width=Math.round(N(p.channels));
    if(width<1||width>512){p.start=null;failures.push(o.name+': select a valid DMX mode/channel footprint');continue;}
    let start=1;while(start+width-1<=512&&occupied.some(([a,b])=>start<=b && start+width-1>=a)){start++;}
    if(start+width-1>512){p.start=null;failures.push(o.name+': no free '+width+'-channel block in U'+u);}
    else{p.start=start;occupied.push([start,start+width-1,o.id]);}
   }
 }
 return failures;
}
function routeInfo(p,run){
 const items=p.plan.items||[],src=items.find(x=>x.id===run.from),dest=items.find(x=>x.id===run.to);
 if(!src||!dest)return null;
 let route=null;try{route=p.route(run)}catch(e){}
 if(!route)return null;
 const needed=round(N(route.length),1),selected=valid(run.cableLength)?N(run.cableLength):null;
 return {src,dest,needed,selected,short:selected!==null&&selected+.0001<needed,spare:selected!==null?round(selected-needed,1):null,suggested:DEFAULT_LENGTHS.find(x=>x>=needed)||null,betweenSpaces:!!route.betweenSpaces,provisional:!!route.provisional,siteLinkId:route.link?.id||null};
}
function evaluate(p){
 const plan=p.plan,t=ensure(p.db,p.eventId,plan),items=plan.items||[],itemMap=new Map(items.map(o=>[o.id,o]));
 const issues=[],patchRows=[],circuits=[],cables=[];
 const issue=(severity,section,code,message,itemId)=>issues.push({severity,section,code,message,itemId});
 for(const o of listedItems(plan,t)){
  const patch=t.patch[o.id],u=N(patch.universe,1),ch=valid(patch.channels)?Math.round(N(patch.channels)):0,start=valid(patch.start)?Math.round(N(patch.start)):null,end=start!==null&&ch>0?start+ch-1:null;
  patchRows.push({o,p:patch,u,ch,start,end});
  if(ch<1||ch>512)issue('warning','DMX','mode','Set a verified DMX mode/channel footprint for '+o.name,o.id);
  if(u<1||u>t.universeCount)issue('error','DMX','universe',o.name+' is assigned to an unavailable universe',o.id);
  if(ch>0&&start===null)issue('warning','DMX','unpatched',o.name+' has not been addressed',o.id);
  if(start!==null&&(start<1||start>512||end>512))issue('error','DMX','out-of-range',o.name+' exceeds universe U'+u+' capacity (512 channels)',o.id);
  const incoming=plan.runs.filter(r=>r.type==='dmx'&&r.to===o.id);
  if(!incoming.length)issue('warning','DMX','no-data',o.name+' has no mapped DMX input cable',o.id);
 }
 for(let i=0;i<patchRows.length;i++)for(let j=i+1;j<patchRows.length;j++){
   const a=patchRows[i],b=patchRows[j];
   if(a.u===b.u&&a.start!==null&&b.start!==null&&a.end!==null&&b.end!==null&&a.start<=b.end&&b.start<=a.end)issue('error','DMX','collision','U'+a.u+' address collision: '+a.o.name+' and '+b.o.name,a.o.id);
 }
 for(const c of t.circuits){
  const voltage=N(c.voltage,230),limit=N(c.limitAmps,0);
  const assigned=items.filter(o=>t.power[o.id]?.enabled&&t.power[o.id].circuitId===c.id);
  const load=assigned.reduce((sum,o)=>sum+(valid(t.power[o.id].currentOverride)?N(t.power[o.id].currentOverride):voltage>0?N(o.watts)/voltage:0),0);
  const unknown=assigned.filter(o=>!valid(t.power[o.id].currentOverride)&&N(o.watts)<=0);
  circuits.push({c,assigned,load:round(load),watts:assigned.reduce((s,o)=>s+N(o.watts),0),unknown:unknown.length});
  if(voltage<=0||limit<=0)issue('error','Power','no-rating',c.name+' needs valid voltage and circuit planning limit');
  else if(load>limit+1e-5)issue('error','Power','overload',c.name+': '+round(load)+' A exceeds the entered '+limit+' A planning limit');
  else if(load>limit*N(c.warningPercent,80)/100)issue('warning','Power','high-load',c.name+' is above its planning warning threshold');
  if(unknown.length)issue('warning','Power','unknown-current',c.name+' contains '+unknown.length+' device(s) with unknown current');
 }
 for(const o of items){
  const a=t.power[o.id];
  if(a?.enabled&&!t.circuits.some(c=>c.id===a.circuitId))issue('warning','Power','unassigned',o.name+' has no assigned power circuit',o.id);
 }
 const inbound={};
 for(const run of plan.runs){
  if(!TYPES.includes(run.type))continue;
  const calc=routeInfo(p,run);
  if(!calc){
    const source=items.find(x=>x.id===run.from),target=items.find(x=>x.id===run.to),venue=p.venue;
    const M=window.PhaenomenonMultiSpace;
    const across=M?.hasAreas(venue)&&source&&target&&M.which(venue,source)?.id!==M.which(venue,target)?.id;
    issue('error','Cables',across?'no-site-link':'missing-endpoint',across?'No permitted '+title(run.type)+' pathway is configured between '+source.name+' and '+target.name:'A '+title(run.type)+' run refers to missing or unreachable equipment');continue;
  }
  if(calc.betweenSpaces&&calc.provisional)issue('warning','Cables','unsurveyed-link','Between-space route '+calc.src.name+' → '+calc.dest.name+' is illustrative and must be measured, approved and physically protected before installation',run.id);
  const src=calc.src,dest=calc.dest,specFrom=t.deviceSpecs[src.id]||{},specTo=t.deviceSpecs[dest.id]||{};
  const key=run.type+':'+dest.id;inbound[key]=(inbound[key]||0)+1;
  const cable={run,...calc};
  cables.push(cable);
  if(calc.selected===null)issue('warning','Cables','no-length',title(run.type)+' cable '+src.name+' → '+dest.name+' has no allocated physical length',run.id);
  else if(calc.short)issue('error','Cables','too-short',title(run.type)+' cable '+src.name+' → '+dest.name+' is '+round(-calc.spare,1)+' m too short',run.id);
  const limit=N(run.maxRunMeters,0);if(limit>0&&calc.needed>limit)issue('error','Cables','max-length',title(run.type)+' '+src.name+' → '+dest.name+' exceeds the configured '+limit+' m route limit',run.id);
  const type=run.type;
  if(type==='dmx'||type==='power'){
    const fromKey=type==='dmx'?'dmxOut':'powerOut',toKey=type==='dmx'?'dmxIn':'powerIn';
    const srcConnector=specFrom[fromKey],targetConnector=specTo[toKey];
    if(srcConnector&&run.connector&&srcConnector!==run.connector)issue('warning','Cables','source-connector',src.name+' output '+srcConnector+' differs from cable '+run.connector,run.id);
    if(targetConnector&&run.connector&&targetConnector!==run.connector)issue('warning','Cables','target-connector',dest.name+' input '+targetConnector+' differs from cable '+run.connector,run.id);
    if(srcConnector&&targetConnector&&srcConnector!==targetConnector&&!run.adapter)issue('warning','Cables','adapter',src.name+' → '+dest.name+' may need an adaptor or compatible cable',run.id);
  }
  if(type==='dmx'){
    const a=t.patch[src.id],b=t.patch[dest.id];
    if(a?.enabled&&b?.enabled&&N(a.universe,1)!==N(b.universe,1))issue('error','DMX','cross-universe','DMX cable '+src.name+' → '+dest.name+' crosses assigned universes',run.id);
  }
  if(type==='power'){
    const a=t.power[src.id],b=t.power[dest.id];
    if(a?.enabled&&b?.enabled&&a.circuitId&&b.circuitId&&a.circuitId!==b.circuitId)issue('error','Power','cross-circuit','Power chain '+src.name+' → '+dest.name+' crosses assigned circuits',run.id);
  }
 }
 for(const [key,count] of Object.entries(inbound))if(count>1){
  const [kind,id]=key.split(':');issue('warning','Cables','multiple-inputs',(itemMap.get(id)?.name||id)+' has '+count+' incoming '+title(kind)+' connections; verify fan-in and permitted topology',id);
 }
 for(const type of ['dmx','power']){
  const edgeMap=new Map();for(const r of plan.runs.filter(r=>r.type===type)){if(!edgeMap.has(r.from))edgeMap.set(r.from,[]);edgeMap.get(r.from).push(r.to);}
  const visited=new Set(),stack=new Set();let cyc=false;
  function dfs(id){if(stack.has(id)){cyc=true;return}if(visited.has(id))return;visited.add(id);stack.add(id);for(const next of edgeMap.get(id)||[])dfs(next);stack.delete(id)}
  for(const id of edgeMap.keys())dfs(id);
  if(cyc)issue('error',type==='dmx'?'DMX':'Power','cycle',title(type)+' graph contains a circular connection');
 }
 // Linked power limits require manufacturer data; missing limit is not approval.
 for(const o of items){
  const spec=t.deviceSpecs[o.id],limit=N(spec?.maxPowerLinks,0);
  if(limit>0){let seen=new Set(),front=[o.id];while(front.length){const next=front.shift();for(const r of plan.runs.filter(r=>r.type==='power'&&r.from===next)){if(!seen.has(r.to)){seen.add(r.to);front.push(r.to)}}}
   if(seen.size>limit)issue('error','Power','link-limit',o.name+' has '+seen.size+' downstream links, above its configured limit of '+limit,o.id);
  }
 }
 const rank={error:0,warning:1,info:2};issues.sort((a,b)=>rank[a.severity]-rank[b.severity]||a.section.localeCompare(b.section));
 return {plan,t,items,patchRows:patchRows.sort((a,b)=>a.u-b.u||(a.start??9999)-(b.start??9999)),circuits,cables,issues,counts:{errors:issues.filter(x=>x.severity==='error').length,warnings:issues.filter(x=>x.severity==='warning').length}};
}
window.PhaenomenonTechCore={ensure,autoPatch,evaluate,routeInfo,sortedPatch,clean,round,n:N,clamp,ID,TYPES,CONNECTORS,DEFAULT_LENGTHS,title};
})();