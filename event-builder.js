/*
 * Phaenomenon Event Builder — reusable progress model and non-destructive
 * helpers shared by the Studio and Production pages.
 *
 * A completed planning step is NOT a safety or engineering approval.
 */
(function(){
  'use strict';
  const own=(a)=>Array.isArray(a)?a:[];
  const clean=x=>String(x??'').trim();
  const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const qty=x=>Math.max(0,Math.min(99999,Math.floor(Number(x)||0)));
  const event=(db,id)=>own(db?.eventJobs).find(x=>x.id===id);
  const venue=(db,e)=>own(db?.venues).find(x=>x.id===e?.venueId);
  const plan=(db,e)=>db?.venuePlans?.[e?.id]||{items:[],runs:[]};
  const published=(db,e)=>db?.productionOS?.published?.[e?.id];
  const entries=(db,e)=>own(db?.productionOS?.assignments).filter(x=>x.eventId===e?.id);
  function mapEquipment(db,e){
    const items=own(plan(db,e).items),catalogue=own(db?.equipment),existing=own(e?.kit);
    const map=new Map(),unlinked=[],unknown=[],ignored=[];
    for(const item of items){
      if(item.kitTracked===false){ignored.push(item);continue;}
      if(!item.eqId){unlinked.push(item);continue;}
      if(!catalogue.some(x=>x.id===item.eqId)){unknown.push(item);continue;}
      map.set(item.eqId,(map.get(item.eqId)||0)+1);
    }
    const gaps=[...map].map(([id,placed])=>{
      const gear=catalogue.find(x=>x.id===id);
      const requested=existing.filter(x=>x.id===id).reduce((a,b)=>a+qty(b.qty),0);
      return {id,name:gear.name,placed,requested,missing:Math.max(0,placed-requested)};
    });
    return {linked:[...map.values()].reduce((a,b)=>a+b,0),unlinked,unknown,ignored,gaps,
      incomplete:gaps.filter(x=>x.missing>0),catalogueCount:catalogue.length};
  }
  function reconcileKit(db,eventId){
    const e=event(db,eventId);
    if(!e)return {error:'Event not found.'};
    const summary=mapEquipment(db,e),next=own(e.kit).map(x=>({...x})),adjustments=[];
    for(const g of summary.gaps){
      if(!g.missing)continue;
      const current=next.find(x=>x.id===g.id);
      if(current)current.qty=qty(current.qty)+g.missing;
      else next.push({id:g.id,qty:g.placed});
      adjustments.push({id:g.id,name:g.name,from:g.requested,to:g.placed});
    }
    e.kit=next;
    return {...summary,adjustments,updated:adjustments.length};
  }
  const mark=(id,title,description,state,summary,action,href,extra={})=>
    ({id,title,description,state,summary,action,href,...extra});
  function inspect(db,e,options={}){
    if(!e)return [];
    const p=plan(db,e),v=venue(db,e),
      spaces=own(v?.spaces).filter(x=>own(e.spaceIds).includes(x.id)),
      items=own(p.items),runs=own(p.runs),
      team=entries(db,e),pub=published(db,e),gear=mapEquipment(db,e);
    const invalidPositions=items.filter(x=>!spaces.some(s=>s.id===x.areaId));
    const connections=runs.filter(r=>items.some(x=>x.id===r.from)&&items.some(x=>x.id===r.to));
    const wired=items.some(x=>['light','control','audio','video','network','power'].includes(x.kind));
    const readyBrief=!!clean(e.title); // Opportunities can begin before dates, clients or venues are known.
    const venueValid=!!v&&spaces.length>0;
    const layoutReady=items.length>0&&!p.needsVenueReview&&!invalidPositions.length;
    const equipmentReady=items.length>0&&gear.incomplete.length===0&&gear.unknown.length===0&&gear.unlinked.length===0;
    const isPublished=!!pub;
    const revisionStale=!!pub&&(!!p.needsVenueReview||!!options.changed);
    return [
      mark('brief','Event details','Who, what and when.',
        readyBrief?'complete':'attention',readyBrief?(e.date?'Event name and date recorded':'Opportunity recorded · date can be added later'):'Name this event or opportunity',
        'Edit details','index.html#/bookings/'+encodeURIComponent(e.id)),
      mark('spaces','Venue & spaces','Choose a reusable venue and the spaces used.',
        venueValid?'complete':'attention',venueValid?spaces.length+' space'+(spaces.length===1?'':'s')+' selected':'Choose a venue and at least one space',
        'Choose spaces','#/home/venue/'+encodeURIComponent(e.id)),
      mark('design','3D design','Place equipment in selected spaces.',
        layoutReady?'complete':items.length?'attention':'todo',
        p.needsVenueReview?'Venue changed — review positions':invalidPositions.length?invalidPositions.length+' placed items need a space review':items.length?items.length+' placed objects':'Nothing placed yet',
        'Open 3D planner','index.html#/spaces/'+encodeURIComponent(e.id)),
      mark('equipment','Equipment kit','Link physical layout to event equipment quantities.',
        equipmentReady?'complete':items.length?'attention':'todo',
        !items.length?'Add a layout first':gear.unlinked.length+' unlinked · '+gear.unknown.length+' unknown · '+gear.incomplete.length+' kit gaps'+(gear.ignored.length?' · '+gear.ignored.length+' excluded from kit':''),
        'Check equipment','#/production/logistics/'+encodeURIComponent(e.id),
        {equipment:gear}),
      mark('connections','Technical connections','Plan power, DMX, network, audio and video connections.',
        !items.length?'todo':connections.length?'complete':wired?'attention':'complete',
        !items.length?'Waiting for design':connections.length+' documented connection'+(connections.length===1?'':'s'),
        'Review connections','#/technical/'+encodeURIComponent(e.id)),
      mark('team','People & responsibilities','Assign event roles and the reporting chain.',
        team.length?'complete':'todo',team.length+' event role'+(team.length===1?'':'s')+' assigned',
        'Manage team','#/production/team/'+encodeURIComponent(e.id)),
      mark('review','Review & publish','Issue a revisioned crew pack after human review.',
        isPublished?(revisionStale?'attention':'complete'):items.length?'attention':'todo',
        isPublished?'Published revision '+pub.revision+(revisionStale?' (review required)':''):'No crew pack published',
        'Review changes','#/design/'+encodeURIComponent(e.id))
    ];
  }
  function create(db,fields={}){
    if(!Array.isArray(db.eventJobs))db.eventJobs=[];
    if(!Array.isArray(db.clients))db.clients=[];
    const title=clean(fields.title).slice(0,120),date=clean(fields.date);
    if(!title)return {error:'Enter an event name.'};
    if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(new Date(date+'T00:00:00Z').getTime())||
      new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date))return {error:'Choose a valid date or leave it blank.'};
    let client=db.clients.find(x=>x.id===fields.clientId),newClient=null;
    const clientName=clean(fields.clientName).slice(0,120);
    if(!client&&clientName){
      client=db.clients.find(x=>clean(x.name).toLocaleLowerCase('en-AU')===clientName.toLocaleLowerCase('en-AU'));
      if(!client)newClient={id:uid('c'),name:clientName,person:'',email:'',type:'Event contact'};
    }
    if(newClient)client=newClient;
    const e={
      id:uid('ev'),title,date,clientId:client?.id||'',venue:'',venueId:'',spaceIds:[],
      eventType:'Other',status:'Enquiry',guests:1,zones:1,environment:'Indoor',
      complexity:'Standard',labourHours:0,labourRate:0,notes:'',kit:[]
    };
    // Keep early-stage opportunities in the same event entity all the way to closeout.
    const lifecycle=window.PhaenomenonLifecycle;
    lifecycle?.ensureEvent(e);
    if(lifecycle){
      const stageResult=lifecycle.setDetails(e,{
        date,bookingStage:clean(fields.bookingStage)||'idea',
        dateCertainty:clean(fields.dateCertainty)||(date?'proposed':'unknown'),
        targetMonth:clean(fields.targetMonth),
        dateNotes:clean(fields.dateNotes),nextAction:clean(fields.nextAction),
        followUpDate:clean(fields.followUpDate),productionStage:'not-started'
      });
      if(stageResult.error)return stageResult;
    }
    if(newClient)db.clients.push(newClient);
    db.eventJobs.push(e);
    return {event:e,client:newClient};
  }
  window.PhaenomenonEventBuilder={steps:inspect,create,reconcileKit,mapEquipment};
})();
