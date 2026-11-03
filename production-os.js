/*
 * Phaenomenon Production OS · local-first workflow preview.
 * Additive layer: shares the existing Phaenomenon browser store.
 * Roles below are VIEW PRESETS, not authentication or permissions.
 */
(function () {
  'use strict';
  const KEY='phaenomenon-demo-v1';
  const PREF='phaenomenon-production-prefs-v1';
  const DEMO='ev-abbotsford-two-stage-demo';
  const VENUE='ven-abbotsford-two-stage-demo';
  const $=document.getElementById('production-app');
  const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const date=x=>x?new Date(x+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):'Unscheduled';
  const now=()=>new Date().toISOString();
  const jsonClone=x=>JSON.parse(JSON.stringify(x));
  const clean=s=>String(s||'').trim();
  const num=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
  function starter(){
    return {projects:[],leads:[],events:[],clients:[{id:'c1',name:'Example Events (demo)',person:'',email:'',type:'Demo client'}],fixtures:[],equipment:[],eventJobs:[],venues:[],venuePlans:{},technicalPlans:{},invoices:[]};
  }
  function load(){
    try{const raw=localStorage.getItem(KEY);const obj=raw?JSON.parse(raw):starter();return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:starter();}
    catch(e){return starter();}
  }
  let db=load(), ui={view:'home',eventId:'',area:'all',role:'lead',entityId:null,history:[],histIndex:-1,query:'',entityType:'All',showArchived:false,notice:''};
  try{const saved=JSON.parse(localStorage.getItem(PREF)||'{}');ui.eventId=saved.eventId||'';ui.area=saved.area||'all';ui.role=saved.role||'lead';}catch(e){}
  function store(){try{localStorage.setItem(KEY,JSON.stringify(db));localStorage.setItem(PREF,JSON.stringify({eventId:ui.eventId,area:ui.area,role:ui.role}));}catch(e){alert('Browser storage is full or unavailable. Export your event information from the original app.');}}
  function org(){return db.productionOS;}
  function venues(){return db.venues||[];}
  function events(){return db.eventJobs||[];}
  function current(){return events().find(e=>e.id===ui.eventId)||events()[0];}
  function plan(e){return (db.venuePlans||{})[e?.id]||{venueId:e?.venueId||'',items:[],runs:[]};}
  function venue(e){const p=plan(e);return venues().find(v=>v.id===(p.venueId||e?.venueId))||venues().find(v=>v.name===e?.venue)||null;}
  function areas(e,snapshot){const v=snapshot?.venue||venue(e);return Array.isArray(v?.spaces)&&v.spaces.length?v.spaces:[{id:'main',name:'Main area',x:0,y:0,width:v?.width||15,length:v?.length||12,height:v?.height||4,kind:v?.geometry?.kind||'indoor'}];}
  function areaName(e,id,s){return areas(e,s).find(a=>a.id===(id||'main'))?.name||'General site';}
  function groupArea(e,obj,s){return obj.areaId||areas(e,s)[0]?.id||'main';}
  function entity(id){return org().entities.find(x=>x.id===id);}
  function aname(id){return entity(id)?.name||'Unknown entity';}
  function entityKind(k){return ['Person','Organisation','Venue','Space','Event'].includes(k)?k:'Organisation';}
  function savedByKind(kind,legacy,id,name,extra){
    const existing=org().entities.find(x=>x.legacyType===kind&&x.legacyId===id);
    if(existing){if(!existing.customName)existing.name=name;return existing;}
    const row=Object.assign({id:'ent-'+kind+'-'+id,kind:kind==='client'?'Organisation':kind==='venue'?'Venue':kind==='event'?'Event':kind==='space'?'Space':kind,name,aliases:[],notes:'',legacyType:kind,legacyId:id,customName:false,demo:!!extra?.demo},extra||{});
    org().entities.push(row);return row;
  }
  function demoSeed(){
    db.clients=Array.isArray(db.clients)?db.clients:[];
    db.venues=Array.isArray(db.venues)?db.venues:[];
    db.eventJobs=Array.isArray(db.eventJobs)?db.eventJobs:[];
    db.venuePlans=db.venuePlans&&typeof db.venuePlans==='object'?db.venuePlans:{};
    db.technicalPlans=db.technicalPlans&&typeof db.technicalPlans==='object'?db.technicalPlans:{};
    if(!db.clients.length)db.clients.push({id:'c1',name:'Example Events (demo)',person:'',email:'',type:'Demo client'});
    if(!db.venues.some(v=>v.id===VENUE)){
      db.venues.push({id:VENUE,name:'Abbotsford Convent · two-stage concept',width:52,length:29,height:6.2,demo:true,approximate:true,
        notes:'Hypothetical layout only, not a surveyed venue plan or validated infrastructure.',
        spaces:[{id:'ab-indoor',name:'Indoor stage',x:3,y:4,width:19,length:15,height:6.2,kind:'indoor'},
                {id:'ab-outdoor',name:'Outdoor stage',x:29,y:5,width:18,length:17,height:4.5,kind:'outdoor'}],
        links:[{id:'ab-site-crossing',name:'Unverified site passage',fromSpace:'ab-indoor',toSpace:'ab-outdoor',verified:false,allowedTypes:['network','power','audio','dmx']}]});
    }
    if(!db.eventJobs.some(e=>e.id===DEMO)){
      db.eventJobs.push({id:DEMO,title:'Abbotsford Convent · Indoor + Outdoor demo',date:'2026-12-05',venue:'Abbotsford Convent · concept',venueId:VENUE,
        clientId:db.clients[0].id,eventType:'Performance',guests:160,zones:2,environment:'Outdoor',complexity:'Feature',status:'Enquiry',kit:[],notes:'Illustrative concept, not a confirmed booking.',labourHours:8,labourRate:90,demo:true});
    }
    if(!db.venuePlans[DEMO]){
      const item=(id,name,kind,areaId,x,y,z,watts)=>({id,name,kind,areaId,x,y,z,watts});
      db.venuePlans[DEMO]={venueId:VENUE,items:[
        item('demo-stage-in','Indoor stage platform','stage','ab-indoor',12,15,0,0),
        item('demo-control','Lighting control','control','ab-indoor',7,7,0,80),
        item('demo-node-in','Indoor node','network','ab-indoor',19,12,0,20),
        item('demo-power-in','Indoor power distro','power','ab-indoor',5,13,0,0),
        item('demo-light-i1','Indoor wash 1','light','ab-indoor',8,13,3.8,180),
        item('demo-light-i2','Indoor wash 2','light','ab-indoor',17,13,3.8,180),
        item('demo-stage-out','Outdoor stage platform','stage','ab-outdoor',38,18,0,0),
        item('demo-node-out','Outdoor node','network','ab-outdoor',31,12,0,20),
        item('demo-power-out','Outdoor power distro','power','ab-outdoor',31,9,0,0),
        item('demo-light-o1','Outdoor wash 1','light','ab-outdoor',33,17,3,160),
        item('demo-light-o2','Outdoor wash 2','light','ab-outdoor',39,17,3,160),
        item('demo-light-o3','Outdoor wash 3','light','ab-outdoor',44,17,3,160)],
        runs:[
          {id:'demo-net',cableId:'NET-01',from:'demo-node-in',to:'demo-node-out',type:'network',cableLength:30,connector:'RJ45 / Cat6'},
          {id:'demo-dmx1',cableId:'DMX-01',from:'demo-node-out',to:'demo-light-o1',type:'dmx',cableLength:15,connector:'5-pin XLR'},
          {id:'demo-dmx2',cableId:'DMX-02',from:'demo-light-o1',to:'demo-light-o2',type:'dmx',cableLength:15,connector:'5-pin XLR'},
          {id:'demo-dmx3',cableId:'DMX-03',from:'demo-light-o2',to:'demo-light-o3',type:'dmx',cableLength:15,connector:'5-pin XLR'}]};
    }
  }
  function ensure(){
    demoSeed();
    if(!db.productionOS||typeof db.productionOS!=='object')db.productionOS={};
    const o=org();o.version=1;
    for(const [key] of [['entities'],['relationships'],['assignments'],['issues']])if(!Array.isArray(o[key]))o[key]=[];
    for(const key of ['published','show','looks'])if(!o[key]||typeof o[key]!=='object'||Array.isArray(o[key]))o[key]={};
    db.clients.forEach(x=>savedByKind('client','client',x.id,x.name,{demo:!!x.demo||x.name.toLowerCase().includes('demo')}));
    db.venues.forEach(x=>{
      const parent=savedByKind('venue','venue',x.id,x.name,{demo:!!x.demo});
      (x.spaces||[]).forEach(sp=>{
        const child=savedByKind('space','space',x.id+'-'+sp.id,sp.name,{legacyVenueId:x.id,legacySpaceId:sp.id,demo:!!x.demo});
        const linkId='rel-location-'+x.id+'-'+sp.id;
        if(!o.relationships.some(r=>r.id===linkId))o.relationships.push({id:linkId,from:child.id,to:parent.id,type:'Located within',notes:'Derived from reusable venue geometry',system:true});
      });
    });
    db.eventJobs.forEach(x=>{
      const eventRecord=savedByKind('event','event',x.id,x.title,{demo:!!x.demo});
      const location=venue(x);
      const venueEntity=location&&o.entities.find(z=>z.legacyType==='venue'&&z.legacyId===location.id);
      const linkId='rel-event-location-'+x.id;
      if(venueEntity&&!o.relationships.some(r=>r.id===linkId))o.relationships.push({id:linkId,from:eventRecord.id,to:venueEntity.id,type:'Takes place at',notes:'Derived from event booking',system:true});
    });
    const example=org().entities.find(x=>x.id==='ent-demo-supplier');
    if(!example){org().entities.push(
      {id:'ent-demo-supplier',kind:'Organisation',name:'Sample Production Supplier',aliases:[],notes:'Fictional demonstration supplier.',demo:true},
      {id:'ent-demo-tech',kind:'Person',name:'Alex · demonstration technician',aliases:[],notes:'Fictional person for role and task demonstrations.',demo:true},
      {id:'ent-demo-hand',kind:'Person',name:'Sam · demonstration stagehand',aliases:[],notes:'Fictional person for crew workflow demonstrations.',demo:true},
      {id:'ent-demo-manager',kind:'Person',name:'Taylor · demonstration producer',aliases:[],notes:'Fictional person for production dashboard demonstrations.',demo:true}
    );}
    if(!o.assignments.some(a=>a.eventId===DEMO)){
      o.assignments.push(
        {id:'as-demo1',eventId:DEMO,entityId:'ent-demo-tech',role:'Lighting technician',areaId:'ab-outdoor',responsibility:'Patch and verification',demo:true},
        {id:'as-demo2',eventId:DEMO,entityId:'ent-demo-hand',role:'Stagehand',areaId:'ab-outdoor',responsibility:'Outdoor installation',demo:true},
        {id:'as-demo3',eventId:DEMO,entityId:'ent-demo-manager',role:'Production manager',areaId:'all',responsibility:'Show readiness',demo:true},
        {id:'as-demo4',eventId:DEMO,entityId:'ent-demo-supplier',role:'Equipment supplier',areaId:'all',responsibility:'Illustrative hire supplier',demo:true}
      );
    }
    if(!o.relationships.some(r=>r.id==='rel-demo1'))o.relationships.push({id:'rel-demo1',from:'ent-demo-tech',to:'ent-demo-supplier',type:'Freelances for',notes:'Illustrative relationship only',demo:true});
    if(!o.published[DEMO])publish(DEMO,true);
    if(!events().some(e=>e.id===ui.eventId))ui.eventId=events().some(e=>e.id===DEMO)?DEMO:(events()[0]?.id||DEMO);
  }
  function snapshot(e){
    if(!e)return null;
    return {plan:jsonClone(plan(e)),venue:jsonClone(venue(e)||{}),technical:jsonClone((db.technicalPlans||{})[e.id]||{})};
  }
  function signature(s){
    if(!s)return '';
    const p=s.plan||{},v=s.venue||{},t=s.technical||{};
    return JSON.stringify({
      plan:{venueId:p.venueId,items:p.items||[],runs:p.runs||[]},
      venue:{id:v.id,width:v.width,length:v.length,geometry:v.geometry,spaces:v.spaces,links:v.links},
      technical:{patch:t.patch,power:t.power,deviceSpecs:t.deviceSpecs,circuits:t.circuits,universeCount:t.universeCount}
    });
  }

  function changes(e){
    const old=published(e)?.snapshot;if(!old)return [];
    const fresh=snapshot(e),before=old.plan||{},after=fresh.plan||{},items=before.items||[],next=after.items||[];
    const warnings=[],oldBy=new Map(items.map(x=>[x.id,x])),newBy=new Map(next.map(x=>[x.id,x]));
    next.forEach(x=>{
      const prior=oldBy.get(x.id);
      if(!prior)warnings.push('New equipment: '+x.name);
      else if(JSON.stringify([prior.x,prior.y,prior.z,prior.areaId,prior.rotation,prior.fixtureType,prior.name])!==
        JSON.stringify([x.x,x.y,x.z,x.areaId,x.rotation,x.fixtureType,x.name]))
        warnings.push('Equipment location or configuration changed: '+x.name);
    });
    items.filter(x=>!newBy.has(x.id)).forEach(x=>warnings.push('Removed equipment: '+x.name));
    const a=new Map((before.runs||[]).map(x=>[x.id,x])),b=new Map((after.runs||[]).map(x=>[x.id,x]));
    (after.runs||[]).forEach(x=>{
      const y=a.get(x.id);
      if(!y)warnings.push('New cable or signal connection: '+(x.cableId||x.id));
      else if(JSON.stringify(y)!==JSON.stringify(x))warnings.push('Connection modified: '+(x.cableId||x.id));
    });
    (before.runs||[]).filter(x=>!b.has(x.id)).forEach(x=>warnings.push('Connection removed: '+(x.cableId||x.id)));
    if(JSON.stringify(before.venueId)!==JSON.stringify(after.venueId)||
      JSON.stringify([old.venue?.spaces,old.venue?.geometry,old.venue?.links,old.venue?.width,old.venue?.length])!==
      JSON.stringify([fresh.venue?.spaces,fresh.venue?.geometry,fresh.venue?.links,fresh.venue?.width,fresh.venue?.length]))
      warnings.push('Venue geometry or inter-area route changed: review site measurements and pathways');
    if(JSON.stringify(old.technical?.patch||{})!==JSON.stringify(fresh.technical?.patch||{}))warnings.push('DMX addressing or fixture mode data changed');
    if(JSON.stringify([old.technical?.power,old.technical?.circuits])!==JSON.stringify([fresh.technical?.power,fresh.technical?.circuits]))
      warnings.push('Power distribution or circuit planning information changed');
    if(JSON.stringify(old.technical?.deviceSpecs)!==JSON.stringify(fresh.technical?.deviceSpecs))
      warnings.push('Equipment connector or technical specification changed');
    if(!warnings.length&&isChanged(e))warnings.push('Other model metadata changed. Check live plan against the published snapshot.');
    return warnings;
  }
  function changePanel(e){
    if(!isChanged(e))return '';
    return '<section id="revision-preview" class="panel section"><div class="section-head"><h2>Pending revision: review the impact</h2>'+pill(changes(e).length+' changes to inspect','warn')+'</div>'+
      '<p class="muted">Review these changes before publishing. A new revision resets changed tasks and carries forward unchanged completed tasks.</p>'+
      '<div class="stack">'+changes(e).map(x=>'<div class="linkrow"><span class="status-dot warn"></span><span style="flex:1">'+esc(x)+'</span></div>').join('')+'</div>'+
      '<div class="row" style="margin-top:15px"><button class="btn primary" data-act="publish">Publish updated crew instructions</button>'+
      '<span class="form-note">Human review required for safety-critical changes.</span></div></section>';
  }
  function published(e){return org().published[e?.id]||null;}
  function isChanged(e){const pub=published(e);return !!(pub&&pub.signature!==signature(snapshot(e)));}
  function specTask(kind,sourceId,title,areaId,details,fp){
    return {id:'task-'+kind+'-'+sourceId,kind,sourceId,title,areaId,details,fingerprint:JSON.stringify(fp),state:'pending',verifiedAt:null,installedAt:null};
  }
  function tasksFor(e,snap){
    const p=snap.plan||{},items=p.items||[],list=[],byId=Object.fromEntries(items.map(x=>[x.id,x]));
    items.forEach(x=>{
      if(x.kind==='stage')return;
      const an=areaName(e,groupArea(e,x,snap),snap);
      const patch=snap.technical?.patch?.[x.id]||{},power=snap.technical?.power?.[x.id]||{};
      const dmx=x.kind==='light'?' DMX: '+(patch.start!=null?'U'+(patch.universe||1)+' / '+patch.start:'address not set')+(patch.modeName?' ('+patch.modeName+')':'')+'.':'';
      const detail='Position at X '+num(x.x).toFixed(1)+' m, Y '+num(x.y).toFixed(1)+' m, height '+num(x.z).toFixed(1)+' m.'+dmx+' Confirm site reference, safe mounting and power assignment.';
      list.push(specTask('place',x.id,'Position '+x.name,groupArea(e,x,snap),detail,[x.id,x.name,x.kind,x.areaId,x.x,x.y,x.z,x.fixtureType,x.rotation,areas(e,snap).find(a=>a.id===groupArea(e,x,snap)),snap.technical?.patch?.[x.id],power,snap.technical?.deviceSpecs?.[x.id]]));
    });
    (p.runs||[]).forEach(r=>{
      const from=byId[r.from],to=byId[r.to];
      if(!from||!to)return;
      const name=r.cableId||r.id;
      const a=groupArea(e,to,snap);
      const detail=from.name+' → '+to.name+' · '+String(r.type||'Connection').toUpperCase()+
        (r.connector?' · '+r.connector:'')+(r.cableLength?' · nominal '+r.cableLength+' m cable':' · cable length unconfirmed')+
        '. Check route, connector, length and protection on site.';
      list.push(specTask('connect',r.id,'Connect '+name,a,detail,[r.id,r.cableId,r.type,r.from,r.to,r.cableLength,r.connector,r.slack,r.linkType,r.waypoints,snap.venue?.links,snap.technical?.patch?.[r.from],snap.technical?.patch?.[r.to],from.x,from.y,from.z,from.areaId,to.x,to.y,to.z,to.areaId]));
    });
    return list;
  }
  function revisionDiff(e){
    const previous=published(e)?.tasks||[],proposed=tasksFor(e,snapshot(e));
    const old=new Map(previous.map(x=>[x.id,x]));
    return {added:proposed.filter(x=>!old.has(x.id)).length,changed:proposed.filter(x=>old.has(x.id)&&old.get(x.id).fingerprint!==x.fingerprint).length,removed:previous.filter(x=>!proposed.some(y=>y.id===x.id)).length};
  }
  function publish(eventId,quiet){
    const e=events().find(x=>x.id===eventId);if(!e)return;
    const p=snapshot(e),old=org().published[eventId];
    if(!quiet&&old&&!confirm('Publish a new installation revision? Changed instructions will require fresh installation checks. Previous revisions remain archived.'))return;
    const rev=old?old.revision+1:1;
    const oldTasks=old?.tasks||[];
    const next=tasksFor(e,p).map(t=>{
      const previous=oldTasks.find(q=>q.id===t.id&&q.fingerprint===t.fingerprint);
      return previous?Object.assign(t,{state:previous.state,installedAt:previous.installedAt,verifiedAt:previous.verifiedAt}):t;
    });
    const pub={revision:rev,at:now(),signature:signature(p),snapshot:p,tasks:next,history:old?[...(old.history||[]),{revision:old.revision,at:old.at,snapshot:old.snapshot,tasks:old.tasks}]:[]};
    org().published[eventId]=pub;
    if(!quiet){store();notice('Published revision '+rev+'. Changed tasks have been reset for review.');}
  }
  function counts(e){
    const t=published(e)?.tasks||[];
    return {all:t.length,installed:t.filter(x=>x.state!=='pending').length,verified:t.filter(x=>x.state==='verified').length,issues:org().issues.filter(x=>x.eventId===e?.id&&x.status!=='Resolved').length};
  }
  function notice(message){ui.notice=message;render();setTimeout(()=>{if(ui.notice===message){ui.notice='';document.querySelector('#message')?.remove();}},4200);}
  function viewName(){return ({home:'Event home',design:'Design',technical:'Technical',crew:'Crew',production:'Production',entities:'Entities'}[ui.view]||'Event home');}
  function render(){
    const e=current(),c=counts(e);
    const nav=[['home','◉','Event home'],['design','⌑','Design'],['technical','⚡','Technical'],['crew','✓','Crew'],['production','▤','Production'],['entities','◇','Entities']];
    const html='<div class="shell"><aside class="rail">'+
      '<a class="brand" href="index.html#/overview">phaenomenon<span>.</span></a>'+
      '<small>CONNECTED EVENT WORKSPACE</small><nav>'+
      nav.map(n=>'<a href="#/'+n[0]+'" class="nav '+(ui.view===n[0]?'active':'')+'"><span aria-hidden="true">'+n[1]+'</span> '+n[2]+'</a>').join('')+
      '</nav><div class="rail-bottom">ONE EVENT. ONE MODEL.<br>Multiple task-focused views.<br><br>'+
      '<a href="index.html#/overview">← Classic studio workspace</a><p>Local demo only. No shared accounts, real-time sync or enforced permissions.</p></div></aside>'+
      '<main class="main"><header class="header"><div><div class="eyebrow">Phaenomenon / Production</div><div class="header-title">'+viewName()+'</div></div>'+
      '<div class="header-tools"><label style="min-width:160px">STARTING WORKSPACE<select id="role-picker">'+[['lead','Designer / lead'],['tech','Lighting technician'],['crew','Installation crew'],['manager','Production manager']].map(x=>'<option value="'+x[0]+'" '+(ui.role===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+'</select></label><label style="min-width:190px" aria-label="Active event"><span style="font-size:10px">ACTIVE EVENT</span><select id="event-picker">'+
      events().map(x=>'<option value="'+esc(x.id)+'" '+(x.id===e?.id?'selected':'')+'>'+esc(x.title)+'</option>').join('')+
      '</select></label><a class="btn" href="index.html#/bookings/'+encodeURIComponent(e?.id||'')+'">Open booking ↗</a></div></header>'+
      '<div class="content">'+(ui.notice?'<div id="message" class="notice good section" role="status">'+esc(ui.notice)+'</div>':'')+
      (ui.view==='home'?home(e,c):ui.view==='design'?design(e,c):ui.view==='technical'?technical(e,c):ui.view==='crew'?crew(e,c):ui.view==='production'?production(e,c):entities(e))+
      '<p class="footnote">Phaenomenon prototype · Single-browser storage only · Data and technical calculations are provisional · Role views are not security permissions.</p></div></main></div>';
    $.innerHTML=html;
    document.title=viewName()+' · Phaenomenon';
  }
  function hero(ey,title,sub,right){
    return '<div class="hero"><div><div class="eyebrow">'+esc(ey)+'</div><h1>'+esc(title)+'</h1><p class="muted">'+esc(sub)+'</p></div>'+(right||'')+'</div>';
  }
  function pill(text,type){return '<span class="pill '+(type||'')+'">'+esc(text)+'</span>';}
  function stat(label,value,sub){return '<div class="stat"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><small>'+esc(sub)+'</small></div>';}
  function changeNotice(e){
    if(isChanged(e)){const d=revisionDiff(e);return '<div class="notice section"><strong>Unpublished design changes detected.</strong> The existing crew pack remains on revision '+published(e).revision+'. Proposed impact: <strong>'+d.added+' new</strong>, <strong>'+d.changed+' changed</strong>, <strong>'+d.removed+' removed</strong> tasks. Review the pending changes before distributing updated instructions. <button class="btn small" data-act="publish">Review &amp; publish revision</button></div>';}
    if(!published(e))return '<div class="notice section">There is no published installation pack for this event. Design the event first, then publish instructions. <button class="btn small" data-act="publish">Publish first pack</button></div>';
    return '';
  }
  function home(e,c){
    if(!e)return '<div class="empty">Create an event in the original workspace to begin.</div>';
    return hero('YOUR EVENT WORKSPACE',e.title, date(e.date)+' · '+(venue(e)?.name||e.venue||'Venue not set'),pill(e.status||'Enquiry')+' '+pill('Crew pack r'+(published(e)?.revision||0)))+
      changeNotice(e)+
      '<div class="stats">'+stat('Areas',areas(e).length,'Spaces in venue')+stat('Placed equipment',(plan(e).items||[]).length,'All equipment and structures')+
      stat('Installation',c.installed+' / '+c.all,'Tasks marked installed')+stat('Open issues',c.issues,'Awaiting resolution')+'</div>'+
      '<div class="section-head"><h2>What are you working on?</h2><span class="muted">Choose a task, not an expertise level</span></div>'+
      '<div class="grid cols3 section">'+[
        ['design','⌑','Design the event','Build stages, position fixtures and manage the 3D model.'],
        ['technical','⚡','Connect equipment','Inspect power, patch, DMX and cable records.'],
        ['crew','✓','Prepare and install','Give crew area-specific instructions and track installation.'],
        ['production','▤','Run production','Coordinate people, suppliers, readiness, cues and changes.'],
        ['entities','◇','Explore the entity network','Find venues, people, organisations and their roles.']
      ].map(x=>'<a class="work-card" href="#/'+x[0]+'"><span class="symbol">'+x[1]+'</span><strong>'+x[2]+'</strong><p>'+x[3]+'</p></a>').join('')+'</div>'+
      '<div class="grid cols2">'+
      '<section class="panel"><h2>Spaces in this event</h2><div class="stack">'+areas(e).map(a=>'<div class="area-card"><div class="row between"><strong>'+esc(a.name)+'</strong>'+pill(a.kind||'Stage')+'</div><p class="muted">'+(plan(e).items||[]).filter(i=>groupArea(e,i)===a.id).length+' placed items · '+(plan(e).runs||[]).filter(r=>{const to=(plan(e).items||[]).find(i=>i.id===r.to);return to&&groupArea(e,to)===a.id;}).length+' incoming/local cable records</p></div>').join('')+'</div></section>'+
      '<section class="panel"><h2>Current state</h2><p class="muted">The event record connects a reusable venue, its areas, equipment placements, technical connections, named assignments and a published crew revision.</p>'+
      '<div class="sep"></div><div class="row between"><span>Installed</span><strong>'+c.installed+' / '+c.all+'</strong></div><div class="progress" style="margin:12px 0"><div style="width:'+(c.all?100*c.installed/c.all:0)+'%"></div></div>'+
      '<p class="muted">'+c.verified+' independently marked verified · '+c.issues+' open issue(s)</p>'+
      '<a class="btn" href="#/production">Open production overview →</a></section></div>';
  }
  function design(e,c){
    const p=plan(e),v=venue(e);
    return hero('DESIGN WORKSPACE','Design the event','A guided entry point to the existing 3D space planner and its Design → Connect → Review → Export workflow.',
      '<a class="btn primary" href="index.html#/bookings/'+encodeURIComponent(e.id)+'">Open event and 3D planner ↗</a>')+
      changeNotice(e)+changePanel(e)+
      '<div class="notice info section">The existing 3D editor is preserved in the classic workspace. Open this event booking, then select <strong>3D layout</strong>. Return here to review and publish installation instructions. This is the same browser data, reloaded between workspaces.</div>'+
      '<div class="grid cols2 section"><section class="panel"><h2>Physical venue model</h2>'+
      '<p class="muted">'+esc(v?.name||'Unassigned venue')+'</p>'+
      '<div class="stack">'+areas(e).map(a=>'<div class="linkrow"><div><strong>'+esc(a.name)+'</strong><div class="detail">'+esc(a.kind||'Area')+' · '+num(a.width)+' × '+num(a.length)+' m (illustrative until verified)</div></div>'+pill((p.items||[]).filter(i=>groupArea(e,i)===a.id).length+' items')+'</div>').join('')+'</div></section>'+
      '<section class="panel"><h2>Connected model</h2><p class="muted">Equipment exists once in the event plan, with its location and its relationships to cable runs and patching.</p>'+
      '<div class="stats" style="grid-template-columns:repeat(2,minmax(0,1fr))">'+stat('Equipment',p.items?.length||0,'Positioned objects')+stat('Connections',p.runs?.length||0,'Signal and power lines')+'</div>'+
      '<button class="btn" data-act="publish">Publish current install pack</button><p class="form-note">Publishing snapshots a revision. Only changed tasks are reset.</p></section></div>'+
      '<section class="panel"><h2>Equipment positioned by area</h2><div class="table-scroll"><table><thead><tr><th>Item</th><th>Type</th><th>Area</th><th>Position (m)</th></tr></thead><tbody>'+
      (p.items||[]).map(i=>'<tr><td>'+esc(i.name)+'</td><td>'+esc(i.kind)+'</td><td>'+esc(areaName(e,groupArea(e,i)))+'</td><td>'+[i.x,i.y,i.z].map(x=>num(x).toFixed(1)).join(', ')+'</td></tr>').join('')+'</tbody></table></div></section>'+showDesign(e);
  }

  function showDesign(e){
    const looks=org().looks[e.id]||[];
    return '<section class="panel section"><div class="section-head"><div><h2>Creative looks and effects</h2><p class="muted">Plan lighting looks within the same event record.</p></div>'+pill(looks.length+' draft looks')+'</div>'+
      '<div class="notice info section">Creative-planning metadata only. No live DMX output, TouchDesigner processing, console playback or photometric simulation.</div>'+
      '<div class="grid cols3 section">'+(looks.length?looks.map(x=>
        '<div class="area-card"><div class="row between"><span class="pill" style="background:'+esc(/^#[0-9a-f]{6}$/i.test(x.color)?x.color:'#8cddcf')+';color:#131a1d;border-color:transparent">●</span>'+
        '<button class="btn small danger no-print" data-act="delete-look" data-id="'+esc(x.id)+'">Remove</button></div><h3 style="margin-top:12px">'+esc(x.name)+'</h3>'+
        '<p class="muted">'+esc(areaName(e,x.areaId))+' · '+esc(x.intensity)+'% · '+esc(x.effect)+'</p><p class="form-note">'+esc(x.notes||'')+'</p></div>'
      ).join(''):'<div class="empty">No looks defined yet. Add a creative idea below.</div>')+'</div>'+
      '<form id="look-form" class="form-grid"><label>Look name<input class="input" name="name" required maxlength="100" placeholder="e.g. Sunset wash"></label>'+
      '<label>Stage / area<select name="areaId">'+areas(e).map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join('')+'</select></label>'+
      '<label>Colour<input class="input" type="color" name="color" value="#8cddcf"></label>'+
      '<label>Intensity (%)<input class="input" type="number" min="0" max="100" step="1" name="intensity" value="75"></label>'+
      '<label>Effect concept<select name="effect"><option>Static</option><option>Slow fade</option><option>Pulse</option><option>Chase</option><option>Audio-reactive (concept)</option><option>Other</option></select></label>'+
      '<label>Notes<input class="input" name="notes" maxlength="220" placeholder="Fixture group / desired mood"></label>'+
      '<div class="wide"><button class="btn primary" type="submit">+ Add draft look</button></div></form></section>';
  }
  function patchTable(e){
    const p=plan(e),t=db.technicalPlans?.[e.id]||{};
    const rows=(p.items||[]).filter(i=>i.kind==='light').map(i=>{
      const x=t.patch?.[i.id]||{};
      return '<tr><td><strong>'+esc(i.name)+'</strong><small>'+esc(areaName(e,groupArea(e,i)))+'</small></td>'+
        '<td>'+(x.universe!=null?'U'+esc(x.universe):'Not set')+'</td><td>'+esc(x.start??'Not patched')+'</td>'+
        '<td>'+esc(x.channels??'Unknown')+'</td><td>'+esc(x.modeName||'Mode unverified')+'</td></tr>';
    }).join('');
    return '<div class="table-scroll"><table><thead><tr><th>Fixture</th><th>Universe</th><th>Address</th><th>Channels</th><th>DMX mode</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
  function technical(e,c){
    const p=plan(e),t=db.technicalPlans?.[e.id]||{},patch=(t.patch||{});
    return hero('TECHNICAL WORKSPACE','Connect and verify','See fixture positions, current DMX patch, cable details and verification status.',
      '<a class="btn primary" href="index.html#/bookings/'+encodeURIComponent(e.id)+'">Edit in technical planner ↗</a>')+
      changeNotice(e)+
      '<div class="grid cols2 section"><section class="panel"><h2>DMX fixture patch</h2>'+patchTable(e)+
      '<p class="form-note">These are the live technical records, not a snapshot of the last published pack. Check modes and manufacturer specifications.</p></section>'+
      '<section class="panel"><h2>Power and distribution</h2>'+
      (t.circuits?.length?t.circuits.map(x=>'<div class="linkrow"><div><strong>'+esc(x.name)+'</strong><div class="detail">'+esc(x.voltage||'?')+' V · '+esc(x.limitAmps||'?')+' A entered planning limit</div></div></div>').join(''):'<div class="empty">No circuits configured yet.</div>')+
      '<p class="form-note">Displayed values are not electrical approval or verification of safe loading.</p></section></div>'+
      '<section class="panel section"><div class="section-head"><h2>Cables and signal paths</h2>'+pill((p.runs||[]).length+' planned connections')+'</div>'+
      '<div class="table-scroll"><table><thead><tr><th>ID</th><th>Type</th><th>From</th><th>To</th><th>Nominal length</th><th>Connector</th></tr></thead><tbody>'+
      (p.runs||[]).map(r=>{const from=p.items.find(x=>x.id===r.from),to=p.items.find(x=>x.id===r.to);return '<tr><td>'+esc(r.cableId||r.id)+'</td><td>'+esc(r.type)+'</td><td>'+esc(from?.name||'Missing source')+'</td><td>'+esc(to?.name||'Missing destination')+'</td><td>'+esc(r.cableLength||'Unverified')+' m</td><td>'+esc(r.connector||'To confirm')+'</td></tr>';}).join('')+
      '</tbody></table></div></section>'+
      '<section class="panel"><h2>Installed equipment verification</h2><p class="muted">Technicians can mark completed installation tasks verified. Verification here is an audit status, not a certification of electrical or rigging safety.</p>'+taskList(e,{verify:true})+'</section>';
  }
  function taskList(e,opt){
    opt=opt||{};
    const pub=published(e);
    if(!pub)return '<div class="empty">No published pack yet.</div>';
    const all=pub.tasks||[];
    const filtered=all.filter(t=>(ui.area==='all'||t.areaId===ui.area)&&(!opt.verify||t.state==='installed'||t.state==='verified'));
    if(!filtered.length)return '<div class="empty">No matching tasks.</div>';
    return filtered.map(t=>{
      const locked=isChanged(e);
      const bad=org().issues.some(i=>i.eventId===e.id&&i.taskId===t.id&&i.status!=='Resolved');
      const buttons=opt.verify?
        (t.state==='installed'?'<button class="btn small" data-act="verify" data-id="'+esc(t.id)+'">Mark verified</button>':pill('Verified','good')):
        '<button class="btn small" data-act="report" data-id="'+esc(t.id)+'">Report issue</button>';
      return '<div class="task-row"><input class="task-check" type="checkbox" data-act="installed" data-id="'+esc(t.id)+'" aria-label="Mark installed: '+esc(t.title)+'" '+(t.state!=='pending'?'checked':'')+(opt.verify?' disabled':'')+'>'+
        '<div class="task-main"><strong>'+esc(t.title)+'</strong> '+(t.state==='verified'?pill('Verified','good'):t.state==='installed'?pill('Installed','good'):pill('To do'))+(bad?' '+pill('Issue open','bad'):'')+
        '<p>'+esc(t.details)+'</p><div class="form-note">'+esc(areaName(e,t.areaId,pub.snapshot))+' · '+esc(t.kind)+' · revision '+pub.revision+'</div></div>'+
        '<div class="task-actions">'+buttons+'</div></div>';
    }).join('');
  }
  function areaPicker(e){
    return '<label style="min-width:210px">STAGE / WORK AREA<select id="area-picker"><option value="all" '+(ui.area==='all'?'selected':'')+'>All areas</option>'+
      areas(e,published(e)?.snapshot).map(a=>'<option value="'+esc(a.id)+'" '+(ui.area===a.id?'selected':'')+'>'+esc(a.name)+'</option>').join('')+'</select></label>';
  }
  function diagram(e){
    const snap=published(e)?.snapshot;if(!snap)return '';
    return areas(e,snap).filter(a=>ui.area==='all'||ui.area===a.id).map(a=>diagramForArea(e,a)).join('');
  }
  function diagramForArea(e,area){
    const p=published(e)?.snapshot?.plan;
    if(!p)return '';
    if(!area)return '';
    const box={x:num(area.x),y:num(area.y),w:Math.max(1,num(area.width,15)),h:Math.max(1,num(area.length,12))};
    const point=i=>({x:25+260*(num(i.x)-box.x)/box.w,y:30+175*(num(i.y)-box.y)/box.h});
    const items=(p.items||[]).filter(i=>groupArea(e,i,published(e).snapshot)===area.id);
    const links=(p.runs||[]).filter(r=>items.some(i=>i.id===r.from)&&items.some(i=>i.id===r.to));
    const svg='<svg viewBox="0 0 310 235" style="width:100%;max-height:305px" role="img" aria-label="Illustrative top-down positions for '+esc(area.name)+'">'+
      '<rect x="25" y="30" width="260" height="175" rx="5" fill="#111820" stroke="#658078" stroke-width="2" stroke-dasharray="7 5"/>'+
      links.map(r=>{const f=point(items.find(i=>i.id===r.from)),t=point(items.find(i=>i.id===r.to));return '<path d="M'+f.x+','+f.y+' L'+t.x+','+t.y+'" stroke="'+(r.type==='dmx'?'#f2c18a':'#8cddcf')+'" stroke-width="1.5" opacity=".75"/>';}).join('')+
      items.map((i,n)=>{const p=point(i);return '<g><circle cx="'+p.x+'" cy="'+p.y+'" r="8" fill="'+(i.kind==='light'?'#f2c18a':'#8cddcf')+'" stroke="#101820"/><text x="'+p.x+'" y="'+(p.y+3)+'" font-size="9" text-anchor="middle" fill="#18232a" font-weight="bold">'+(n+1)+'</text></g>';}).join('')+
      '<text x="25" y="19" font-size="10" fill="#b5c4ce">Schematic · positions need site verification</text></svg>';
    return '<div class="section"><h3>'+esc(area.name)+'</h3>'+svg+'<div class="chiprow">'+items.map((i,n)=>'<span class="tag">'+(n+1)+'. '+esc(i.name)+'</span>').join('')+'</div></div>';
  }
  function crew(e,c){
    const pub=published(e),total=(pub?.tasks||[]).filter(t=>ui.area==='all'||t.areaId===ui.area),done=total.filter(t=>t.state!=='pending').length;
    return hero('CREW WORKSPACE','Install the event','Simple, area-specific instructions from a versioned crew pack. Track installation separately from technical verification.',
      areaPicker(e))+
      changeNotice(e)+
      (!pub?'<div class="empty">Publish a crew pack from Design to begin.</div>':
      '<div class="row between section no-print"><button class="btn" data-act="print">Print area crew pack / Save as PDF</button><span class="form-note">Select one area for a concise handout.</span></div><div class="notice info section">Crew pack revision <strong>'+pub.revision+'</strong> · issued '+new Date(pub.at).toLocaleString('en-AU')+'. <button class="btn small no-print" data-act="print-crew">Print crew pack</button> '+
      (isChanged(e)?' A newer design has not been published. Do not use unreviewed new instructions.':' Instructions reflect the currently published plan.')+'</div>'+
      '<div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">'+stat('Assigned tasks',total.length,'In chosen area')+stat('Installed',done,'Marked by crew')+stat('Verified',total.filter(x=>x.state==='verified').length,'Technical sign-off status')+'</div>'+
      '<div class="grid cols2"><section class="panel"><h2>Installation instructions</h2><div class="row between section"><span class="muted">'+done+' of '+total.length+' installed</span>'+pill((total.length?Math.round(done/total.length*100):0)+'%')+'</div>'+
      '<div class="progress section"><div style="width:'+(total.length?100*done/total.length:0)+'%"></div></div>'+taskList(e)+
      '<p class="form-note">Checking a box means the item was reported installed. It does not indicate a qualified safety sign-off.</p></section>'+
      '<section class="panel"><h2>Where things go</h2>'+diagram(e)+'<p class="form-note">Diagram is schematic, not a measured construction or rigging drawing. Use the approved site drawings and instructions.</p></section></div>');
  }
  function production(e,c){
    const p=published(e),a=org().assignments.filter(x=>x.eventId===e.id);
    const done=c.all?Math.round(c.installed/c.all*100):0;
    return hero('PRODUCTION WORKSPACE','Run the production','People, suppliers, responsibilities, installation readiness, show cues and approvals in one place.',
      '<button class="btn primary" data-act="publish">Publish current crew revision</button>')+
      changeNotice(e)+changePanel(e)+
      '<div class="stats">'+stat('Team & suppliers',a.length,'Event-specific roles')+stat('Installation',done+'%','Reported installed')+stat('Technical checks',c.verified,'Marked verified')+stat('Open issues',c.issues,'Awaiting response')+'</div>'+
      '<div class="grid cols2 section"><section class="panel"><div class="section-head"><h2>Event team</h2>'+pill(a.length+' assignments')+'</div>'+
      '<div class="stack">'+(a.length?a.map(x=>'<div class="linkrow"><div><strong><a href="#/entities/'+encodeURIComponent(x.entityId)+'" data-act="profile" data-id="'+esc(x.entityId)+'">'+esc(aname(x.entityId))+'</a></strong><div class="detail">'+esc(x.role)+' · '+esc(x.areaId==='all'?'Entire event':areaName(e,x.areaId))+(x.responsibility?' · '+esc(x.responsibility):'')+'</div></div><button class="btn small danger" data-act="remove-assignment" data-id="'+esc(x.id)+'">Remove</button></div>').join(''):'<div class="empty">No assignments yet.</div>')+'</div>'+
      '<div class="sep"></div><h3>Assign someone to this event</h3><form id="assign-form" class="form-grid">'+
      '<label>Person or organisation<select name="entityId" required>'+org().entities.filter(x=>['Person','Organisation'].includes(x.kind)).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>'+
      '<label>Role<select name="role"><option>Production manager</option><option>Lighting designer</option><option>Lighting technician</option><option>Stagehand</option><option>DJ</option><option>Promoter</option><option>Event organiser</option><option>Audio technician</option><option>Video technician</option><option>Supplier</option><option>Other</option></select></label>'+
      '<label>Responsibility / notes<input class="input" name="responsibility" maxlength="180" placeholder="e.g. Patch outdoor stage"></label>'+
      '<label>Assigned area<select name="areaId"><option value="all">Entire event</option>'+areas(e).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>'+
      '<div class="wide"><button class="btn primary" type="submit">+ Add assignment</button></div></form></section>'+
      '<section class="panel"><div class="section-head"><h2>Installation readiness</h2>'+pill('Revision '+(p?.revision||'—'))+'</div>'+
      '<div class="row between"><span class="muted">Installed tasks</span><strong>'+c.installed+' / '+c.all+'</strong></div><div class="progress" style="margin:13px 0"><div style="width:'+done+'%"></div></div>'+
      '<div class="row between"><span class="muted">Independently verified</span><strong>'+c.verified+' / '+c.all+'</strong></div>'+
      '<div class="sep"></div><h3>Open issues</h3>'+
      (org().issues.filter(x=>x.eventId===e.id&&x.status!=='Resolved').map(x=>'<div class="linkrow"><div><strong>'+esc(x.note)+'</strong><div class="detail">'+esc(x.taskId||'General issue')+' · '+new Date(x.at).toLocaleString('en-AU')+'</div></div><button class="btn small" data-act="resolve-issue" data-id="'+esc(x.id)+'">Resolve</button></div>').join('')||'<p class="muted">No open issues.</p>')+
      '<div class="sep"></div><button class="btn" data-act="report" data-id="">+ Report general issue</button></section></div>'+
      '<section class="panel section"><div class="section-head"><h2>Run of show</h2>'+pill((org().show[e.id]||[]).length+' cues')+'</div>'+
      '<p class="muted">A lightweight production cue list. This does not drive live lighting consoles or control show-critical systems.</p>'+
      '<div class="table-scroll"><table><thead><tr><th>Time</th><th>Cue / activity</th><th>Area</th><th>Draft look</th><th>Status</th><th></th></tr></thead><tbody>'+
      (org().show[e.id]||[]).slice().sort((a,b)=>a.time.localeCompare(b.time)).map(x=>'<tr><td>'+esc(x.time)+'</td><td>'+esc(x.title)+'</td><td>'+esc(areaName(e,x.areaId))+'</td><td>'+esc((org().looks[e.id]||[]).find(l=>l.id===x.lookId)?.name||'—')+'</td><td>'+pill(x.done?'Done':'Planned',x.done?'good':'')+'</td><td><button class="btn small" data-act="toggle-cue" data-id="'+esc(x.id)+'">'+(x.done?'Reopen':'Mark done')+'</button></td></tr>').join('')+'</tbody></table></div>'+
      '<form id="cue-form" class="form-grid" style="margin-top:15px"><label>Time<input class="input" type="time" name="time" required value="19:00"></label><label>Area<select name="areaId">'+areas(e).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>'+
      '<label class="wide">Cue or activity<input class="input" name="title" required maxlength="160" placeholder="e.g. Outdoor stage changeover"></label><label class="wide">Optional draft lighting look<select name="lookId"><option value="">No linked look</option>'+(org().looks[e.id]||[]).map(l=>'<option value="'+esc(l.id)+'">'+esc(l.name)+'</option>').join('')+'</select></label><div class="wide"><button class="btn primary" type="submit">+ Add cue</button></div></form></section>'+
      '<section class="panel"><h2>Published revisions</h2>'+([...(p?.history||[]),...(p?[{revision:p.revision,at:p.at,tasks:p.tasks}]:[])].reverse().map(x=>'<div class="linkrow"><div><strong>Revision '+x.revision+'</strong><div class="detail">'+new Date(x.at).toLocaleString('en-AU')+' · '+(x.tasks?.length||0)+' tasks</div></div>'+pill(x.revision===p.revision?'Current':'Archived')+'</div>').join('')||'<div class="empty">No revisions yet.</div>')+'</section>';
  }
  function navigateProfile(id,backOrForward){
    if(!entity(id))return;
    if(!backOrForward){ui.history=ui.history.slice(0,ui.histIndex+1);if(ui.history[ui.histIndex]!==id){ui.history.push(id);ui.histIndex=ui.history.length-1;}}
    ui.entityId=id;ui.view='entities';location.hash='#/entities/'+encodeURIComponent(id);render();
  }
  function relatedEvents(ent){
    const all=[];
    for(const e of events()){
      if(org().assignments.some(a=>a.entityId===ent.id&&a.eventId===e.id)||
        ent.legacyType==='venue'&&venue(e)?.id===ent.legacyId||
        ent.legacyType==='client'&&e.clientId===ent.legacyId||
        ent.legacyType==='event'&&e.id===ent.legacyId||
        ent.legacyType==='space'&&venue(e)?.id===ent.legacyVenueId)all.push(e);
    }
    return all;
  }
  function entityProfile(ent,e){
    const back=ui.histIndex>0,forward=ui.histIndex<ui.history.length-1;
    const r=org().relationships.filter(x=>x.from===ent.id||x.to===ent.id);
    const al=org().assignments.filter(x=>x.entityId===ent.id);
    const v=ent.legacyType==='venue'?venues().find(x=>x.id===ent.legacyId):null;
    return '<section class="panel inspector"><div class="row between"><div class="eyebrow">ENTITY PROFILE</div><div class="backforward">'+
      '<button class="btn small" data-act="entity-back" '+(back?'':'disabled')+' aria-label="Back in entity history">←</button>'+
      '<button class="btn small" data-act="entity-forward" '+(forward?'':'disabled')+' aria-label="Forward in entity history">→</button></div></div>'+
      '<h2 style="margin-top:11px">'+esc(ent.name)+'</h2><div class="row">'+pill(ent.kind)+(ent.demo?pill('Demo entity'):'')+'</div>'+
      '<p class="muted">'+(ent.aliases?.length?'Also known as: '+ent.aliases.map(esc).join(', '):'No aliases added')+'</p>'+
      '<div class="row"><button class="btn small" data-act="alias" data-id="'+esc(ent.id)+'">+ Alias</button><button class="btn small" data-act="rename" data-id="'+esc(ent.id)+'">Edit name</button></div>'+
      '<div class="sep"></div><h3>Notes</h3><form id="entity-note-form"><input type="hidden" name="id" value="'+esc(ent.id)+'"><textarea name="notes" maxlength="4000">'+esc(ent.notes||'')+'</textarea><button class="btn small" type="submit">Save notes</button></form>'+
      (v?'<div class="sep"></div><h3>Spaces</h3><div class="chiprow">'+(v.spaces||[]).map(x=>{const sub=org().entities.find(y=>y.legacyType==='space'&&y.legacyVenueId===v.id&&y.legacySpaceId===x.id);return '<button class="btn small" data-act="profile" data-id="'+esc(sub?.id||'')+'">'+esc(x.name)+'</button>';}).join('')+'</div>':'')+
      '<div class="sep"></div><h3>Events</h3><div class="stack">'+(relatedEvents(ent).map(x=>'<button class="linkrow" data-act="select-event" data-id="'+esc(x.id)+'"><div><strong>'+esc(x.title)+'</strong><div class="detail">'+date(x.date)+'</div></div>→</button>').join('')||'<p class="muted">No linked events.</p>')+'</div>'+
      '<div class="sep"></div><h3>Event roles</h3><div class="stack">'+(al.map(x=>'<div class="tag">'+esc(x.role)+' · '+esc(events().find(t=>t.id===x.eventId)?.title||'Unknown event')+'</div>').join('')||'<p class="muted">No event assignments.</p>')+'</div>'+
      '<div class="sep"></div><h3>Relationships</h3><div class="stack">'+(r.map(x=>'<button class="linkrow" data-act="profile" data-id="'+esc(x.from===ent.id?x.to:x.from)+'"><div><strong>'+esc(aname(x.from===ent.id?x.to:x.from))+'</strong><div class="detail">'+esc(x.type)+(x.notes?' · '+esc(x.notes):'')+'</div></div>→</button>').join('')||'<p class="muted">No relationships recorded.</p>')+'</div>'+
      '<div class="sep"></div><h3>Add relationship</h3><form id="relation-form" class="stack"><input type="hidden" name="from" value="'+esc(ent.id)+'">'+
      '<label>Related person, organisation or venue<select name="to" required>'+org().entities.filter(x=>x.id!==ent.id).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>'+
      '<label>Relationship<select name="type"><option>Works for</option><option>Provides equipment to</option><option>Manages</option><option>Organises</option><option>Promotes</option><option>Technical contact for</option><option>Collaborates with</option><option>Other</option></select></label>'+
      '<label>Notes<input class="input" name="notes" maxlength="180"></label><button class="btn" type="submit">Add relationship</button></form></section>';
  }
  function entities(e){
    const all=org().entities.filter(x=>(ui.entityType==='All'||x.kind===ui.entityType)&&
      (x.name+' '+(x.aliases||[]).join(' ')+' '+(x.notes||'')).toLowerCase().includes(ui.query.toLowerCase()));
    const selected=entity(ui.entityId);
    return hero('CONNECTED ENTITY REGISTRY','People, organisations and venues','Canonical records with aliases, event-specific roles, typed relationships and navigable profiles.')+
      '<div class="side-by-side"><div><section class="panel section"><div class="section-head"><h2>Browse entities</h2>'+pill(all.length+' records')+'</div>'+
      '<div class="form-grid section"><label>Search name, alias or notes<input class="input" id="entity-search" placeholder="Search entities" value="'+esc(ui.query)+'"></label>'+
      '<label>Entity type<select id="entity-filter">'+['All','Person','Organisation','Venue','Space','Event'].map(x=>'<option '+(ui.entityType===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label></div>'+
      '<div class="stack">'+(all.map(x=>'<button class="linkrow" data-act="profile" data-id="'+esc(x.id)+'"><div><strong>'+esc(x.name)+'</strong><div class="detail">'+esc(x.kind)+(x.aliases?.length?' · '+esc(x.aliases.join(', ')):'')+'</div></div><span class="chev">›</span></button>').join('')||'<div class="empty">No matching entities.</div>')+'</div></section>'+
      '<section class="panel"><h2>Create entity</h2><p class="muted">An entity exists once, even when it has different roles at different events.</p><form id="entity-form" class="form-grid">'+
      '<label>Name<input class="input" name="name" maxlength="140" required placeholder="Display name"></label>'+
      '<label>Type<select name="kind"><option>Person</option><option>Organisation</option><option>Venue</option><option>Space</option></select></label>'+
      '<label class="wide">Aliases (comma separated)<input class="input" name="aliases" placeholder="Other names or abbreviations"></label>'+
      '<label class="wide">Notes<textarea name="notes" maxlength="4000"></textarea></label>'+
      '<div class="wide"><button class="btn primary" type="submit">+ Create entity</button></div></form><p class="form-note">Adding a venue entity alone does not create a measurable 3D geometry record. Set up venue geometry in the classic planner.</p></section></div>'+
      (selected?entityProfile(selected,e):'<section class="panel inspector"><div class="empty">Select an entity to see its profile, aliases, relationships, roles and linked events.</div></section>')+'</div>';
  }
  function route(){
    const parts=location.hash.replace(/^#\/?/,'').split('/'),view=parts[0];
    ui.view=['home','design','technical','crew','production','entities'].includes(view)?view:'home';
    if(ui.view==='entities'&&parts[1]&&entity(decodeURIComponent(parts[1]))){
      const id=decodeURIComponent(parts[1]);if(ui.entityId!==id){ui.entityId=id;if(ui.history[ui.histIndex]!==id){ui.history=ui.history.slice(0,ui.histIndex+1);ui.history.push(id);ui.histIndex=ui.history.length-1;}}
    }
    render();
  }
  document.addEventListener('click',ev=>{
    const el=ev.target.closest('[data-act]');if(!el||!$.contains(el))return;
    const action=el.dataset.act,id=el.dataset.id,e=current(),p=published(e);
    ev.preventDefault();
    if(action==='print'){window.print();return;}
    if(action==='profile'){navigateProfile(id);return;}
    if(action==='entity-back'||action==='entity-forward'){
      const next=ui.histIndex+(action==='entity-back'?-1:1);
      if(next>=0&&next<ui.history.length){ui.histIndex=next;navigateProfile(ui.history[next],true);}return;
    }
    if(action==='select-event'){ui.eventId=id;ui.area='all';store();location.hash='#/home';render();return;}
    if(action==='print-crew'){window.print();return;}
    if(action==='publish'){if(!plan(e).items?.length){notice('Add equipment in the 3D planner before publishing.');return;}publish(e.id,false);return;}
    if(action==='installed'){const t=p?.tasks.find(x=>x.id===id);if(!t)return;t.state=t.state==='pending'?'installed':'pending';t.installedAt=t.state==='installed'?now():null;t.verifiedAt=null;store();render();return;}
    if(action==='verify'){const t=p?.tasks.find(x=>x.id===id);if(!t||t.state!=='installed')return;t.state='verified';t.verifiedAt=now();store();notice('Task recorded as verified. This is not a safety certification.');return;}
    if(action==='delete-look'){
      const looks=org().looks[e.id]||[];
      const look=looks.find(x=>x.id===id);
      if(look&&confirm('Remove draft lighting look '+look.name+'? Existing cues will retain their descriptions but lose the look association.')){
        org().looks[e.id]=looks.filter(x=>x.id!==id);store();render();
      }return;
    }
    if(action==='report'){
      const note=prompt('Describe the issue or discrepancy (no sensitive information):');if(!clean(note))return;
      org().issues.push({id:uid('issue'),eventId:e.id,taskId:id||null,note:clean(note).slice(0,900),status:'Open',at:now()});store();notice('Issue recorded for production review.');return;
    }
    if(action==='resolve-issue'){const x=org().issues.find(x=>x.id===id&&x.eventId===e.id);if(x){x.status='Resolved';x.resolvedAt=now();store();notice('Issue marked resolved.');}return;}
    if(action==='toggle-cue'){const x=(org().show[e.id]||[]).find(x=>x.id===id);if(x){x.done=!x.done;store();render();}return;}
    if(action==='remove-assignment'){const x=org().assignments.find(x=>x.id===id&&x.eventId===e.id);if(x&&confirm('Remove this event-specific assignment? The entity record will remain.')){org().assignments=org().assignments.filter(y=>y.id!==id);store();render();}return;}
    if(action==='alias'){const x=entity(id);if(!x)return;const raw=prompt('New alias for '+x.name+':');const v=clean(raw).slice(0,140);if(v&&!x.aliases.some(y=>y.toLowerCase()===v.toLowerCase())){x.aliases.push(v);store();render();}return;}
    if(action==='rename'){const x=entity(id);if(!x)return;const v=clean(prompt('Entity display name:',x.name)).slice(0,140);if(v){x.name=v;x.customName=true;store();render();}return;}
  });
  document.addEventListener('change',ev=>{
    const el=ev.target;if(!$.contains(el))return;
    if(el.id==='role-picker'){ui.role=el.value;store();location.hash='#/'+({lead:'home',tech:'technical',crew:'crew',manager:'production'}[ui.role]||'home');route();}
    if(el.id==='event-picker'){ui.eventId=el.value;ui.area='all';store();render();}
    if(el.id==='area-picker'){ui.area=el.value;store();render();}
    if(el.id==='entity-filter'){ui.entityType=el.value;render();}
  });
  document.addEventListener('input',ev=>{
    const el=ev.target;if(!$.contains(el))return;
    if(el.id==='entity-search'){ui.query=el.value;const start=el.selectionStart;render();const next=document.getElementById('entity-search');next?.focus();next?.setSelectionRange(start,start);}
  });
  document.addEventListener('submit',ev=>{
    const f=ev.target;if(!$.contains(f))return;
    if(!['assign-form','cue-form','look-form','entity-form','entity-note-form','relation-form'].includes(f.id))return;
    ev.preventDefault();const d=new FormData(f),val=k=>clean(d.get(k)),e=current(),o=org();
    if(f.id==='assign-form'){
      if(!entity(val('entityId')))return;
      const previous=o.assignments.find(x=>x.eventId===e.id&&x.entityId===val('entityId')&&x.role===val('role')&&x.areaId===val('areaId'));
      if(previous){notice('This entity already has that role in the selected area.');return;}
      o.assignments.push({id:uid('assignment'),eventId:e.id,entityId:val('entityId'),role:val('role'),areaId:val('areaId'),responsibility:val('responsibility').slice(0,180)});
    }
    if(f.id==='look-form'){
      if(!val('name'))return;
      if(!o.looks[e.id])o.looks[e.id]=[];
      o.looks[e.id].push({id:uid('look'),name:val('name').slice(0,100),areaId:val('areaId'),
        color:/^#[0-9a-f]{6}$/i.test(val('color'))?val('color'):'#8cddcf',
        intensity:Math.max(0,Math.min(100,num(val('intensity')))),
        effect:val('effect').slice(0,80),notes:val('notes').slice(0,220)});
    }
    if(f.id==='cue-form'){
      if(!val('time')||!val('title'))return;
      if(!o.show[e.id])o.show[e.id]=[];
      o.show[e.id].push({id:uid('cue'),time:val('time'),title:val('title').slice(0,160),areaId:val('areaId'),lookId:(o.looks[e.id]||[]).some(x=>x.id===val('lookId'))?val('lookId'):null,done:false});
    }
    if(f.id==='entity-form'){
      if(!val('name'))return;
      const existing=o.entities.find(x=>x.name.toLowerCase()===val('name').toLowerCase()&&x.kind===val('kind'));
      if(existing){navigateProfile(existing.id);notice('Existing entity opened instead of creating a duplicate.');return;}
      const x={id:uid('ent'),name:val('name').slice(0,140),kind:entityKind(val('kind')),aliases:val('aliases').split(',').map(x=>x.trim()).filter(Boolean).slice(0,30),notes:val('notes').slice(0,4000)};
      o.entities.push(x);store();navigateProfile(x.id);notice('Entity created.');return;
    }
    if(f.id==='entity-note-form'){const x=entity(val('id'));if(!x)return;x.notes=val('notes').slice(0,4000);}
    if(f.id==='relation-form'){
      if(!entity(val('from'))||!entity(val('to'))||val('from')===val('to'))return;
      const duplicate=o.relationships.some(x=>x.from===val('from')&&x.to===val('to')&&x.type===val('type'));
      if(duplicate){notice('That relationship already exists.');return;}
      o.relationships.push({id:uid('rel'),from:val('from'),to:val('to'),type:val('type'),notes:val('notes').slice(0,180)});
    }
    store();notice('Saved to this browser.');
  });
  window.addEventListener('hashchange',route);
  ensure();store();route();
})();