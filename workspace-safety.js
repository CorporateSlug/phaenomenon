/*
 * Browser-local recovery support. This is NOT cloud backup or collaboration.
 * Checkpoints are capped and best-effort; always export important data.
 */
(function(){
  'use strict';
  const KEY='phaenomenon-recovery-v1',MAX_RECORD=420000,MAX_TOTAL=950000,MAX_POINTS=3,INTERVAL=15*60*1000;
  const arrays=['projects','leads','events','clients','fixtures'];
  const own=a=>Array.isArray(a)?a:[];
  function inspect(data){
    if(!data||typeof data!=='object'||Array.isArray(data))return {valid:false,error:'Not a Phaenomenon workspace JSON object.'};
    const missing=arrays.filter(k=>!Array.isArray(data[k]));
    if(missing.length)return {valid:false,error:'Missing workspace collections: '+missing.join(', ')+'.'};
    for(const key of ['eventJobs','venues','equipment','invoices']){
      if(data[key]!=null&&!Array.isArray(data[key]))return {valid:false,error:'Invalid '+key+' collection.'};
    }
    if(data.venuePlans!=null&&(typeof data.venuePlans!=='object'||Array.isArray(data.venuePlans)))return {valid:false,error:'Invalid venue plans.'};
    if(data.productionOS!=null&&(typeof data.productionOS!=='object'||Array.isArray(data.productionOS)))return {valid:false,error:'Invalid production data.'};
    const duplicate=arr=>{const seen=new Set();return own(arr).some(x=>{if(!x||typeof x!=='object'||!x.id||typeof x.id!=='string'||seen.has(x.id))return true;seen.add(x.id);return false;});};
    for(const key of ['clients','eventJobs','venues','equipment','projects']){
      if(duplicate(data[key]))return {valid:false,error:'Invalid or duplicate identifiers in '+key+'.'};
    }
    const warns=[],clientIds=new Set(own(data.clients).map(x=>x.id)),venueIds=new Set(own(data.venues).map(x=>x.id));
    const knownVenues=own(data.venues);
    for(const event of own(data.eventJobs)){
      if(event.clientId&&!clientIds.has(event.clientId))warns.push('Event '+String(event.title||event.id).slice(0,70)+' references a missing client');
      if(event.venueId&&!venueIds.has(event.venueId))warns.push('Event '+String(event.title||event.id).slice(0,70)+' references a missing venue');
      const v=knownVenues.find(x=>x.id===event.venueId);
      if(v&&own(event.spaceIds).some(id=>!own(v.spaces).some(s=>s.id===id)))warns.push('An event has spaces not found at its selected venue');
    }
    return {valid:true,warnings:warns.slice(0,10),summary:{
      events:own(data.eventJobs).length,venues:own(data.venues).length,
      clients:own(data.clients).length,equipment:own(data.equipment).length
    }};
  }
  function list(storage){
    try{
      const obj=JSON.parse(storage.getItem(KEY)||'[]');
      return own(obj).filter(x=>x&&typeof x.id==='string'&&typeof x.raw==='string'&&
        x.raw.length<=MAX_RECORD&&Number.isFinite(Number(x.at))).slice(0,MAX_POINTS);
    }catch(e){return [];}
  }
  function checkpoint(storage,raw,reason='Before edit',force=false){
    if(!raw||typeof raw!=='string'||raw.length>MAX_RECORD)return {created:false,reason:'Workspace exceeds browser checkpoint size limit.'};
    let workspace;try{workspace=JSON.parse(raw);}catch(e){return {created:false,reason:'Invalid workspace data'};}
    if(!inspect(workspace).valid)return {created:false,reason:'Workspace validation failed'};
    const history=list(storage),now=Date.now(),recent=history[0];
    if(recent&&recent.raw===raw)return {created:false,reason:'Already captured'};
    if(!force&&recent&&now-recent.at<INTERVAL)return {created:false,reason:'Recent recovery point exists'};
    const next=[{id:'rec-'+now.toString(36)+'-'+Math.random().toString(36).slice(2,6),at:now,
      reason:String(reason||'Before edit').slice(0,70),raw},...history].slice(0,MAX_POINTS);
    while(next.length>1&&next.reduce((sum,x)=>sum+x.raw.length,0)>MAX_TOTAL)next.pop();
    try{storage.setItem(KEY,JSON.stringify(next));return {created:true,id:next[0].id,count:next.length};}
    catch(e){return {created:false,reason:'Browser storage is full or unavailable'};}
  }
  function readPoint(storage,id){
    const point=list(storage).find(x=>x.id===id);
    if(!point)return {error:'Recovery point is unavailable.'};
    let workspace;try{workspace=JSON.parse(point.raw);}catch(e){return {error:'Recovery point could not be read.'};}
    const checked=inspect(workspace);
    return checked.valid?{workspace,checked,at:point.at}:{error:checked.error};
  }
  window.PhaenomenonWorkspaceSafety={key:KEY,inspect,list,checkpoint,readPoint};
})();
