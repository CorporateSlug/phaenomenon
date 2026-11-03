/* Reusable Venue → Space → Event model.
 * Shared by classic Event bookings and Production OS.
 * A Venue is reusable. Spaces belong to its venue. Events link to chosen spaces.
 * Changes to venue geometry do not automatically alter published crew instructions.
 */
(() => {
  'use strict';
  const G=window.PhaenomenonGeometry;
  const M=window.PhaenomenonMultiSpace;
  const norm=x=>String(x||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-AU');
  const text=x=>String(x||'').trim().slice(0,120);
  const number=(x,def,min,max)=>{const n=Number(x);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):def};
  const id=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const findVenue=(db,venueId)=>Array.isArray(db?.venues)?db.venues.find(v=>v.id===venueId):null;
  const findByName=(db,name)=>(db?.venues||[]).find(v=>norm(v.name)===norm(name));
  function ensureSpaces(venue){
    if(!venue)return [];
    G?.normalize(venue);
    if(!Array.isArray(venue.spaces)||!venue.spaces.length){
      if(M?.convert)M.convert(venue);
      else venue.spaces=[{id:id('space'),name:'Main space',kind:venue.geometry?.kind||'indoor',x:0,y:0,width:venue.width||16,length:venue.length||12,height:venue.height||4}];
    }
    venue.spaces.forEach(sp=>{if(!sp.id)sp.id=id('space');if(!sp.name)sp.name='Unnamed space';const hadGeometry=!!sp.geometry;G?.normalize(sp);if(!hadGeometry&&sp.kind){sp.geometry.kind=sp.kind;if(sp.kind==='outdoor')sp.geometry.roof.type='none';}});
    if(!Array.isArray(venue.links))venue.links=[];
    return venue.spaces;
  }
  function activeSpaces(event,venue){
    const available=venue?.spaces||[];
    if(!Array.isArray(event?.spaceIds))return available;
    const selected=new Set(event.spaceIds);
    return available.filter(s=>selected.has(s.id));
  }
  function ensureAll(db){
    if(!Array.isArray(db.venues))db.venues=[];
    db.venues.forEach(ensureSpaces);
    for(const event of db.eventJobs||[]){
      const p=db.venuePlans?.[event.id];
      const configured=findVenue(db,event.venueId),byPlan=findVenue(db,p?.venueId);
      // Preserve a populated layout's venue if older booking and layout disagree.
      const hasLayout=!!p?.items?.length;
      const v=(hasLayout&&byPlan)||configured||byPlan||findByName(db,event.venue);
      if(!v)continue;
      event.venueId=v.id;
      event.venue=v.name;
      if(!Array.isArray(event.spaceIds))event.spaceIds=ensureSpaces(v).map(sp=>sp.id);
      if(p)p.venueId=v.id;
    }
    return db;
  }
  function addVenue(db,params={}){
    const name=text(params.name);
    if(!name)return {error:'Enter a venue name.'};
    const existing=findByName(db,name);
    if(existing)return {error:'A venue with this name already exists. Select it and add the missing space instead.',existing};
    const width=number(params.width,18,2,200),length=number(params.length,14,2,200),
          height=number(params.height,4,.5,40),kind=params.kind==='outdoor'?'outdoor':'indoor';
    const first=text(params.spaceName)||'Main space';
    const venue={id:id('ven'),name,width:width+4,length:length+4,height,spaces:[],links:[],notes:text(params.notes),approximate:true};
    G?.normalize(venue);
    venue.geometry.kind=kind;
    if(kind==='outdoor')venue.geometry.roof.type='none';
    const space={id:id('space'),name:first,x:2,y:2,width,length,height,kind};
    G?.normalize(space);
    space.geometry.kind=kind;
    if(kind==='outdoor')space.geometry.roof.type='none';
    venue.spaces.push(space);
    db.venues.push(venue);
    return {venue,space};
  }
  function addSpace(db,venueId,params={}){
    const venue=findVenue(db,venueId);
    if(!venue)return {error:'Select an existing venue first.'};
    const name=text(params.name);
    if(!name)return {error:'Enter a space name.'};
    const existing=(venue.spaces||[]).find(s=>norm(s.name)===norm(name));
    if(existing)return {error:'This space already exists at the venue. Select it for the event instead.',existing};
    const width=number(params.width,12,2,200),length=number(params.length,10,2,200),
          height=number(params.height,4,.5,40),kind=params.kind==='outdoor'?'outdoor':'indoor';
    ensureSpaces(venue);
    let space;
    if(M?.addSpace)space=M.addSpace(venue,{name,width,length,height,kind});
    else{
      const x=Math.max(2,...venue.spaces.map(s=>(s.x||0)+(s.width||0)))+4;
      space={id:id('space'),name,kind,x,y:2,width,length,height};
      G?.normalize(space);
      venue.spaces.push(space);
      venue.width=Math.max(venue.width,x+width+3);
      venue.length=Math.max(venue.length,length+5);
      G?.normalize(venue);
    }
    return {venue,space};
  }
  function updateEvent(db,eventId,venueId,spaceIds){
    const event=(db.eventJobs||[]).find(e=>e.id===eventId),venue=findVenue(db,venueId);
    if(!event)return {error:'Event not found.'};
    if(!venue)return {error:'Select a venue from the saved venue library.'};
    ensureSpaces(venue);
    const requested=[...new Set(Array.isArray(spaceIds)?spaceIds:[])];
    if(!requested.length)return {error:'Select at least one space for this event.'};
    const available=new Set(venue.spaces.map(x=>x.id));
    if(requested.some(x=>!available.has(x)))return {error:'A selected space does not belong to this venue.'};
    const oldVenue=event.venueId||db.venuePlans?.[eventId]?.venueId;
    const plan=db.venuePlans?.[eventId];
    const changedVenue=!!(oldVenue&&oldVenue!==venue.id);
    const placements=plan?.items||[];
    if(!changedVenue){
      const excluded=placements.filter(x=>{const spaceId=available.has(x.areaId)?x.areaId:M?.which?.(venue,x)?.id;return spaceId&&available.has(spaceId)&&!requested.includes(spaceId);});
      if(excluded.length)return {error:'These spaces contain placed equipment. Move or remove the items before deselecting the space: '+[...new Set(excluded.map(x=>venue.spaces.find(sp=>sp.id===x.areaId)?.name||x.areaId))].join(', ')};
    }
    event.venueId=venue.id;
    event.venue=venue.name;
    event.spaceIds=requested;
    if(plan){
      plan.venueId=venue.id;
      if(changedVenue&&placements.length){
        plan.needsVenueReview=true;
        // Do not silently move equipment. Mark original locations for an explicit design review.
      }
    }
    return {event,venue,changedVenue,needsReview:changedVenue&&placements.length>0};
  }
  window.PhaenomenonVenueWorkflow={ensureAll,ensureSpaces,findVenue,findByName,activeSpaces,addVenue,addSpace,updateEvent};
})();
