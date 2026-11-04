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
  const storedRaw=()=>{try{return localStorage.getItem(KEY);}catch(e){return null;}};
  let db=load(),storageBaseline=storedRaw(),saveConflict=false, ui={view:'dashboard',eventId:'',area:'all',crewPerson:'all',role:'lead',productionTab:'team',homeVenueOpen:false,builderFocus:'',teamPerson:'',entityId:null,history:[],histIndex:-1,query:'',entityType:'All',showArchived:false,scheduleMode:'list',scheduleMonth:'',notice:''};
  try{const saved=JSON.parse(localStorage.getItem(PREF)||'{}');ui.eventId=saved.eventId||'';ui.area=saved.area||'all';ui.crewPerson=saved.crewPerson||'all';ui.role=saved.role||'lead';ui.productionTab=saved.productionTab||'team';ui.scheduleMode=saved.scheduleMode==='calendar'?'calendar':'list';}catch(e){}
  function savePreferences(){
    try{localStorage.setItem(PREF,JSON.stringify({eventId:ui.eventId,area:ui.area,crewPerson:ui.crewPerson,role:ui.role,productionTab:ui.productionTab,scheduleMode:ui.scheduleMode}));}catch(e){}
  }
  function store(){
    try{
      const remote=localStorage.getItem(KEY);
      if(remote!==storageBaseline){
        saveConflict=true;
        alert('A newer event change was saved in another Phaenomenon tab. This edit has NOT overwritten it. The latest data will now be loaded. Retry your edit.');
        refreshFromStorage();
        return false;
      }
      const next=JSON.stringify(db);
      if(remote&&remote!==next)window.PhaenomenonWorkspaceSafety?.checkpoint(localStorage,remote,'Before Production edit');
      localStorage.setItem(KEY,next);
      storageBaseline=next;
      const indicator=document.getElementById('save-status');
      if(indicator)indicator.textContent='Saved in this browser · '+new Date().toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'});
      savePreferences();
      return true;
    }catch(e){alert('Browser storage is full or unavailable. Export a JSON backup of your event information from the original app.');return false;}
  }
  function refreshFromStorage(){
    const latest=storedRaw();
    if(!latest||latest===storageBaseline)return false;
    let value;try{value=JSON.parse(latest);}catch(e){return false;}
    if(!value||!Array.isArray(value.eventJobs)||!Array.isArray(value.clients))return false;
    db=value;storageBaseline=latest;
    ensure();
    if(!events().some(x=>x.id===ui.eventId))ui.eventId=events()[0]?.id||DEMO;
    ui.entityId=entity(ui.entityId)?.id||null;
    render();
    return true;
  }
  function recoveryPoints(){
    const points=window.PhaenomenonWorkspaceSafety?.list(localStorage)||[];
    return '<details class="header-recovery"><summary class="btn">Local recovery points ('+points.length+')</summary><div class="header-recovery-list">'+
      (points.length?points.map(x=>'<div class="linkrow"><div><strong>'+new Date(x.at).toLocaleString('en-AU')+'</strong><div class="detail">'+esc(x.reason)+'</div></div>'+
        '<button type="button" class="btn small" data-act="restore-point" data-id="'+esc(x.id)+'">Restore</button></div>').join(''):
      '<p class="muted">No local recovery points yet. They are created during editing where browser storage permits.</p>')+
      '<p class="form-note">Recovery points are kept in this browser only and may be cleared with browser data. Export a JSON backup for a separate copy.</p></div></details>';
  }
  function replaceWorkspace(value,label){
    const checked=window.PhaenomenonWorkspaceSafety?.inspect(value);
    if(!checked?.valid){alert(checked?.error||'Not a valid workspace backup.');return false;}
    if(storedRaw()!==storageBaseline){refreshFromStorage();alert('Another tab updated the workspace. The current page was refreshed. Please review and retry the restore.');return false;}
    const previous=db,raw=storageBaseline;
    try{
      window.PhaenomenonWorkspaceSafety?.checkpoint(localStorage,raw,'Before '+label,true);
      db=value;
      ensure();
      const serialized=JSON.stringify(db);
      localStorage.setItem(KEY,serialized);
      storageBaseline=serialized;
      ui.eventId=events()[0]?.id||DEMO;ui.entityId=null;ui.area='all';ui.crewPerson='all';
      localStorage.setItem(PREF,JSON.stringify({eventId:ui.eventId,role:ui.role,productionTab:ui.productionTab,area:'all',crewPerson:'all'}));
      location.hash='#/builder/'+encodeURIComponent(ui.eventId);
      route();
      notice('Workspace restored from '+label+'. All data is still stored only in this browser.');
      return true;
    }catch(error){
      db=previous;storageBaseline=storedRaw();
      alert('Restore failed: '+error.message);
      return false;
    }
  }

  function org(){return db.productionOS;}
  function venues(){return db.venues||[];}
  function events(){return db.eventJobs||[];}
  function current(){return events().find(e=>e.id===ui.eventId)||events()[0];}
  function plan(e){return (db.venuePlans||{})[e?.id]||{venueId:e?.venueId||'',items:[],runs:[]};}
  function venue(e){const p=plan(e);return venues().find(v=>v.id===(p.venueId||e?.venueId))||venues().find(v=>v.name===e?.venue)||null;}
  function areas(e,snapshot){
    const v=snapshot?.venue||venue(e),all=Array.isArray(v?.spaces)&&v.spaces.length?v.spaces:[{id:'main',name:'Main space',x:0,y:0,width:v?.width||15,length:v?.length||12,height:v?.height||4,kind:v?.geometry?.kind||'indoor'}];
    const ids=snapshot?.spaceIds||e?.spaceIds;
    return Array.isArray(ids)?all.filter(space=>ids.includes(space.id)):all;
  }
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
        links:[{id:'ab-site-crossing',name:'Unverified site passage',fromSpace:'ab-indoor',toSpace:'ab-outdoor',from:{x:21,y:12,z:0},to:{x:30,y:12,z:0},via:[{x:25.5,y:12,z:0}],extraMeters:2,verified:false,allowedTypes:['network','power','audio','video','dmx'],notes:'Illustrative passage only. No approval for cable crossing or power infrastructure is implied.'}]});
    }
    const demoVenue=db.venues.find(x=>x.id===VENUE);
    // Repair the early prototype's schematic crossing, without touching any surveyed/non-demo venue.
    const sampleLink=demoVenue?.demo&&demoVenue.links?.find(x=>x.id==='ab-site-crossing');
    if(sampleLink&&(!sampleLink.from||!sampleLink.to)){
      sampleLink.from={x:21,y:12,z:0};sampleLink.to={x:30,y:12,z:0};sampleLink.via=[{x:25.5,y:12,z:0}];
      sampleLink.extraMeters=2;sampleLink.verified=false;sampleLink.notes='Hypothetical passage requiring site approval';
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
        item('demo-light-o3','Outdoor wash 3','light','ab-outdoor',44,17,3,160),
        item('demo-i-media','Indoor media server','video','ab-indoor',9,8,.7,150),
        item('demo-o-screen','Outdoor projection/screen (illustrative)','video','ab-outdoor',40,20,1.8,300)],
        runs:[
          {id:'demo-net',cableId:'NET-01',from:'demo-node-in',to:'demo-node-out',type:'network',cableLength:30,connector:'RJ45 / Cat6'},
          {id:'demo-dmx1',cableId:'DMX-01',from:'demo-node-out',to:'demo-light-o1',type:'dmx',cableLength:15,connector:'5-pin XLR'},
          {id:'demo-dmx2',cableId:'DMX-02',from:'demo-light-o1',to:'demo-light-o2',type:'dmx',cableLength:15,connector:'5-pin XLR'},
          {id:'demo-dmx3',cableId:'DMX-03',from:'demo-light-o2',to:'demo-light-o3',type:'dmx',cableLength:15,connector:'5-pin XLR'},
          {id:'demo-video',cableId:'VID-01',from:'demo-i-media',to:'demo-o-screen',type:'video',cableLength:50,connector:'3G-SDI / BNC'}]};
    }
  }
  function ensure(){
    demoSeed();
    window.PhaenomenonLifecycle?.ensureAll(db);
    window.PhaenomenonVenueWorkflow?.ensureAll(db);
    if(!db.productionOS||typeof db.productionOS!=='object')db.productionOS={};
    const o=org();o.version=1;
    for(const [key] of [['entities'],['relationships'],['assignments'],['issues']])if(!Array.isArray(o[key]))o[key]=[];
    for(const key of ['published','show','looks','taskAssignments','teamHierarchy','packAcknowledgements','operations'])if(!o[key]||typeof o[key]!=='object'||Array.isArray(o[key]))o[key]={};
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
      const existingLocation=o.relationships.find(r=>r.id===linkId);
      if(venueEntity){
        if(existingLocation)existingLocation.to=venueEntity.id;
        else o.relationships.push({id:linkId,from:eventRecord.id,to:venueEntity.id,type:'Takes place at',notes:'Derived from event booking',system:true});
      }else if(existingLocation)o.relationships=o.relationships.filter(r=>r.id!==linkId);
      const clientEntity=o.entities.find(z=>z.legacyType==='client'&&z.legacyId===x.clientId);
      const clientLinkId='rel-event-client-'+x.id;
      const clientLink=o.relationships.find(r=>r.id===clientLinkId);
      if(clientEntity){
        if(clientLink)clientLink.from=clientEntity.id;
        else o.relationships.push({id:clientLinkId,from:clientEntity.id,to:eventRecord.id,type:'Client for',notes:'Derived from booking',system:true});
      }else if(clientLink)o.relationships=o.relationships.filter(r=>r.id!==clientLinkId);
      const prefix='rel-event-space-'+x.id+'-';
      const chosen=new Set((x.spaceIds||[]).filter(id=>location?.spaces?.some(sp=>sp.id===id)));
      const desired=new Set([...chosen].map(id=>prefix+id));
      o.relationships=o.relationships.filter(rel=>!rel.id.startsWith(prefix)||desired.has(rel.id));
      for(const spId of chosen){
        const spaceEntity=o.entities.find(z=>z.legacyType==='space'&&z.legacyVenueId===location?.id&&z.legacySpaceId===spId);
        if(!spaceEntity)continue;
        const id=prefix+spId;
        const rel=o.relationships.find(r=>r.id===id);
        if(rel){rel.from=eventRecord.id;rel.to=spaceEntity.id;}
        else o.relationships.push({id,from:eventRecord.id,to:spaceEntity.id,type:'Uses space',notes:'Derived from event space selection',system:true});
      }
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
    if(!o.teamHierarchy[DEMO])o.teamHierarchy[DEMO]={
      'ent-demo-manager':{position:'In charge',reportsTo:'',notes:'Fictional overall lead'},
      'ent-demo-tech':{position:'Second in charge',reportsTo:'ent-demo-manager',notes:'Fictional technical deputy'},
      'ent-demo-hand':{position:'Helper',reportsTo:'ent-demo-tech',notes:'Fictional installation crew'}
    };
    if(!o.relationships.some(r=>r.id==='rel-demo1'))o.relationships.push({id:'rel-demo1',from:'ent-demo-tech',to:'ent-demo-supplier',type:'Freelances for',notes:'Illustrative relationship only',demo:true});
    if(!o.published[DEMO])publish(DEMO,true);
    if(!events().some(e=>e.id===ui.eventId))ui.eventId=events().some(e=>e.id===DEMO)?DEMO:(events()[0]?.id||DEMO);
  }
  function snapshot(e){
    if(!e)return null;
    const v=jsonClone(venue(e)||{}),used=new Set(e.spaceIds||[]);
    if(Array.isArray(v.spaces)&&used.size){
      v.spaces=v.spaces.filter(sp=>used.has(sp.id));
      if(Array.isArray(v.links))v.links=v.links.filter(link=>used.has(link.fromSpace)&&used.has(link.toSpace));
    }
    const p=plan(e),linked=new Set((p.items||[]).filter(x=>x.eqId&&x.kitTracked!==false).map(x=>x.eqId));
    const equipment=(db.equipment||[]).filter(x=>linked.has(x.id)).map(g=>({id:g.id,name:g.name,category:g.category,watts:g.watts})).sort((a,b)=>a.id.localeCompare(b.id));
    const kit=(e.kit||[]).map(x=>({id:x.id,qty:Math.max(0,Math.floor(num(x.qty)))})).sort((a,b)=>a.id.localeCompare(b.id));
    return {plan:jsonClone(p),venue:v,spaceIds:jsonClone(e.spaceIds||[]),kit,equipment,technical:jsonClone((db.technicalPlans||{})[e.id]||{})};
  }
  function signature(s){
    if(!s)return '';
    const p=s.plan||{},v=s.venue||{},t=s.technical||{};
    return JSON.stringify({
      spaceIds:s.spaceIds||[],
      kit:s.kit||[],equipment:s.equipment||[],
      plan:{venueId:p.venueId,items:p.items||[],runs:p.runs||[]},
      venue:{id:v.id,spaces:v.spaces,links:v.links,siteGeometry:(!v.spaces?.length?v.geometry:null)},
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
      else if(JSON.stringify([prior.x,prior.y,prior.z,prior.areaId,prior.rotation,prior.fixtureType,prior.name,prior.eqId,prior.kitTracked,prior.watts])!==
        JSON.stringify([x.x,x.y,x.z,x.areaId,x.rotation,x.fixtureType,x.name,x.eqId,x.kitTracked,x.watts]))
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
    if(JSON.stringify(old.equipment||[])!==JSON.stringify(fresh.equipment||[]))
      warnings.push('Linked equipment specification changed: inspect type, power and connectors before installation');
    if(JSON.stringify(old.kit||[])!==JSON.stringify(fresh.kit||[]))
      warnings.push('Event equipment kit quantities or allocation changed: review the revised plan');
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
      const an=areaName(e,groupArea(e,x,snap),snap);
      const patch=snap.technical?.patch?.[x.id]||{},power=snap.technical?.power?.[x.id]||{};
      const catalog=(snap.equipment||[]).find(g=>g.id===x.eqId);
      const inventoryNote=x.kitTracked===false?' This object is excluded from the event hire kit.':catalog?
        ' Equipment library: '+catalog.name+' ('+(catalog.category||'unclassified')+').':'';
      const dmx=x.kind==='light'?' DMX: '+(patch.start!=null?'U'+(patch.universe||1)+' / '+patch.start:'address not set')+(patch.modeName?' ('+patch.modeName+')':'')+'.':'';
      const detail=(x.kind==='stage'?'Set out stage structure':'Position equipment')+' at X '+num(x.x).toFixed(1)+' m, Y '+num(x.y).toFixed(1)+' m, height '+num(x.z).toFixed(1)+' m.'+inventoryNote+dmx+(x.kind==='stage'?' Confirm engineering, assembly and rigging approvals before use.':' Confirm site reference, safe mounting and power assignment.');
      list.push(specTask('place',x.id,'Position '+x.name,groupArea(e,x,snap),detail,[x.id,x.name,x.kind,x.areaId,x.x,x.y,x.z,x.fixtureType,x.rotation,x.eqId,x.kitTracked,x.watts,catalog,areas(e,snap).find(a=>a.id===groupArea(e,x,snap)),snap.technical?.patch?.[x.id],power,snap.technical?.deviceSpecs?.[x.id]]));
    });
    (p.runs||[]).forEach(r=>{
      const from=byId[r.from],to=byId[r.to];
      if(!from||!to)return;
      const name=r.cableId||r.id;
      const a=groupArea(e,to,snap);
      const detail=from.name+' → '+to.name+' · '+String(r.type||'Connection').toUpperCase()+
        (r.connector?' · '+r.connector:'')+(r.cableLength?' · nominal '+r.cableLength+' m cable':' · cable length unconfirmed')+
        '. Check route, connector, length and protection on site.';
      list.push(specTask('connect',r.id,'Connect '+name,a,detail,[r.id,r.cableId,r.type,r.from,r.to,r.cableLength,r.connector,r.slack,r.linkType,r.waypoints,snap.venue?.links,snap.technical?.patch?.[r.from],snap.technical?.patch?.[r.to],from.x,from.y,from.z,from.areaId,to.x,to.y,to.z,to.areaId,areas(e,snap),snap.venue?.geometry]));
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
    if(plan(e).needsVenueReview){
      if(!quiet)notice('Review and confirm the new Venue layout before publishing an installation pack.');
      return;
    }
    const p=snapshot(e),old=org().published[eventId];
    if(!quiet&&old){
      if(!isChanged(e)){notice('The published pack already matches the current design.');return;}
      const revised=changes(e),list=revised.slice(0,12).map(x=>'• '+x).join('\n');
      if(!confirm('Review proposed revision '+(old.revision+1)+':\n\n'+list+
        (revised.length>12?'\n… plus '+(revised.length-12)+' more changes':'')+
        '\n\nChanged installation tasks will be reset. Previous revision will be archived. Publish?'))return;
    }
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
  function notice(message){if(saveConflict){message='Another tab updated the event. Your latest edit was not saved. Please retry it.';saveConflict=false;}ui.notice=message;render();setTimeout(()=>{if(ui.notice===message){ui.notice='';document.querySelector('#message')?.remove();}},4200);}
  function viewName(){return ({dashboard:'Home',builder:'Event builder',home:'Event overview',events:'Events & schedule',design:'3D design',technical:'Technical connections',crew:'Crew installation',production:'Production',entities:'Directory'}[ui.view]||'Event overview');}
  function render(){
    const e=current(),c=counts(e);
    const navItem=(href,label,glyph,active)=>'<a href="'+href+'" class="nav'+(active?' active':'')+'"'+(active?' aria-current="page"':'')+'><span class="nav-symbol" aria-hidden="true">'+glyph+'</span><span>'+esc(label)+'</span></a>';
    const navGroup=(key,label,glyph,rows,isOpen)=>
      '<details class="rail-group" '+(isOpen?'open':'')+'><summary class="rail-group-title"><span class="nav-symbol" aria-hidden="true">'+glyph+'</span><span>'+esc(label)+'</span><span class="rail-chevron" aria-hidden="true">⌄</span></summary>'+
      '<div class="rail-subnav">'+rows.join('')+'</div></details>';
    const eventId=e?.id?encodeURIComponent(e.id):'';
    const navigation=
      '<div class="rail-label">HOME</div>'+navItem('#/dashboard','Dashboard','⌂',ui.view==='dashboard')+
      '<div class="rail-label">EVENTS</div>'+navItem('#/events','All events & schedule','▦',ui.view==='events')+
      '<div class="rail-label">ACTIVE EVENT</div>'+
      navItem('#/builder/'+eventId,'Event builder','◈',ui.view==='builder')+
      navItem('#/home','Event overview','⌂',ui.view==='home'&&!ui.homeVenueOpen)+
      navItem('index.html#/bookings/'+eventId,'Event details','▤',false)+
      '<div class="rail-label">WORKSPACES</div>'+
      navGroup('plan','Plan & design','⌑',[
        navItem('#/design','3D design','◫',ui.view==='design'),
        navItem('#/technical','Technical connections','⚡',ui.view==='technical')
      ],['design','technical'].includes(ui.view))+
      navGroup('deliver','Deliver the event','✓',[
        navItem('#/crew','Crew installation','☑',ui.view==='crew'),
        navItem('#/production','Production','▦',ui.view==='production'),
        navItem('#/production/closeout/'+eventId,'Closeout','✓',ui.view==='production'&&ui.productionTab==='closeout')
      ],['crew','production'].includes(ui.view))+
      navGroup('library','Library & people','◇',[
        navItem('#/home/venue/'+eventId,'Venues & spaces','⌘',ui.view==='home'&&ui.homeVenueOpen),
        navItem('#/entities','Directory','♧',ui.view==='entities'),
        navItem('index.html#/equipment','Equipment','◫',false),
        navItem('index.html#/fixtures','Fixture library','◉',false)
      ],ui.view==='entities'||(ui.view==='home'&&ui.homeVenueOpen))+
      navGroup('studio','Studio management','▤',[
        navItem('index.html#/overview','Studio overview','⌂',false),
        navItem('index.html#/projects','Projects','◇',false),
        navItem('index.html#/pipeline','Opportunities','▥',false),
        navItem('index.html#/schedule','Calendar','▦',false),
        navItem('index.html#/clients','Clients','♧',false),
        navItem('index.html#/invoices','Invoices','▤',false),
        navItem('index.html#/settings','Settings','⚙',false)
      ],false);
    const mobileTab=(href,label,glyph,active)=>'<a class="mobile-tab'+(active?' is-active':'')+'" href="'+href+'" '+(active?'aria-current="page"':'')+'><span aria-hidden="true" class="mobile-tab-icon">'+glyph+'</span><span>'+label+'</span></a>';
    const mobileNavigation='<nav class="mobile-tabbar production-mobile-tabs" aria-label="Quick event navigation">'+
      mobileTab('#/dashboard','Home','⌂',ui.view==='dashboard')+
      mobileTab('index.html#/spaces/'+eventId,'3D','▧',false)+
      mobileTab('#/technical/'+eventId,'Tech','⚡',ui.view==='technical')+
      mobileTab('#/crew/'+eventId,'Crew','✓',ui.view==='crew')+
      '<button type="button" class="mobile-tab mobile-more-tab'+(['production','entities','design'].includes(ui.view)?' is-active':'')+'" data-act="toggle-rail" aria-controls="production-navigation" aria-expanded="false">'+
      '<span class="mobile-tab-icon" aria-hidden="true">☰</span><span>More</span></button></nav>';
    const html='<div class="shell"><aside class="rail" id="production-rail">'+
      '<div class="rail-top"><a class="brand" href="#/dashboard">phaenomenon<span>.</span></a>'+
      '<button type="button" class="rail-mobile-toggle" data-act="toggle-rail" aria-expanded="false" aria-controls="production-navigation">☰ <span>Menu</span></button></div>'+
      '<button type="button" class="rail-quick-new" data-act="builder-new">+ New event</button>'+
      '<nav id="production-navigation" aria-label="Production navigation">'+navigation+'</nav>'+
      '<div class="rail-bottom"><strong>ALL EVENTS · CONNECTED WORK</strong><p>Browse the schedule or switch events at any time.</p>'+
      '<p>Local prototype · Role views are not security permissions.</p></div></aside>'+
      '<button type="button" class="mobile-nav-backdrop" data-act="close-rail" aria-label="Close navigation"></button>'+
      '<main class="main"><header class="header"><div><div class="eyebrow">Phaenomenon / '+(ui.view==='dashboard'?'Home':'Event')+'</div><div class="header-title"><span class="header-title-desktop">'+viewName()+'</span><span class="header-title-mobile">'+({dashboard:'Home',builder:'Build',home:'Event',events:'Events',design:'Design',technical:'Tech',crew:'Crew',production:'Production',entities:'Directory'}[ui.view]||'Event')+'</span></div></div>'+
      '<div class="header-tools"><a class="btn header-events-link" href="#/events">All events</a><button type="button" class="btn primary" data-act="builder-new">+ New event</button><label class="event-header-select">SWITCH EVENT<select id="event-picker" aria-label="Switch active event">'+
      events().map(x=>'<option value="'+esc(x.id)+'" '+(x.id===e?.id?'selected':'')+'>'+esc(x.title)+'</option>').join('')+
      '</select></label><details class="header-more"><summary class="btn" aria-label="More workspace options">Options ▾</summary>'+
      '<div class="header-more-menu"><label>Default starting view<select id="role-picker">'+
      [['lead','Designer / lead'],['tech','Lighting technician'],['crew','Installation crew'],['manager','Production manager']].map(x=>'<option value="'+x[0]+'" '+(ui.role===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+
      '</select></label><p class="mobile-local-note">Stored on this device only · not synchronised with other devices</p>'+
      '<button type="button" class="btn" data-act="export-backup">Export JSON backup</button>'+
      '<button type="button" class="btn" data-act="import-backup">Import JSON backup</button>'+recoveryPoints()+
      '<a class="btn" href="index.html#/bookings/'+eventId+'">Edit event booking ↗</a></div></details>'+
      '<small id="save-status" class="save-status" title="This is local browser storage, not cloud sync.">Saved in this browser</small></div></header>'+
      '<div class="content">'+(ui.notice?'<div id="message" class="notice good section" role="status">'+esc(ui.notice)+'</div>':'')+
      (ui.view==='dashboard'?studioDashboard():ui.view==='events'?eventSchedule():ui.view==='builder'?builderPage(e,c):ui.view==='home'?home(e,c):ui.view==='design'?design(e,c):ui.view==='technical'?technical(e,c):ui.view==='crew'?crew(e,c):ui.view==='production'?production(e,c):entities(e))+
      '<p class="footnote">Phaenomenon prototype · Single-browser storage only · Data and technical calculations are provisional · Role views are not security permissions.</p></div></main></div>'+mobileNavigation;
    $.innerHTML=html;
    document.title=viewName()+' · Phaenomenon';
  }

  function studioDashboard(){
    const model=window.PhaenomenonEventBuilder;
    const rows=events().map(e=>{
      const revision=!!published(e)&&isChanged(e);
      const steps=model?.steps(db,e,{changed:revision})||[];
      const life=window.PhaenomenonLifecycle.summary(db,e);
      return {
        id:e.id,title:e.title,date:e.date,status:e.status,
        bookingStage:life.bookingStage,bookingLabel:life.bookingLabel,
        dateCertainty:life.dateCertainty,targetMonth:life.targetMonth,
        productionStage:life.productionStage,productionLabel:life.productionLabel,
        followUpDate:life.followUpDate,nextAction:life.nextAction,
        closeoutRemaining:life.remaining,closeoutDone:life.done,closed:life.closed,
        venue:venue(e)?.name||e.venue||'Venue to be confirmed',
        needsRevision:revision,
        openIssues:org().issues.filter(i=>i.eventId===e.id&&i.status!=='Resolved').length,
        steps:steps.map(s=>({id:s.id,title:s.title,state:s.state,summary:s.summary,href:s.href}))
      };
    });
    return window.PhaenomenonHome?.render({events:rows,activeId:current()?.id})||
      hero('HOME','Your studio at a glance','Open an event to continue.','<a class="btn primary" href="#/events">All events →</a>');
  }

  function hero(ey,title,sub,right){
    return '<div class="hero"><div><div class="eyebrow">'+esc(ey)+'</div><h1>'+esc(title)+'</h1><p class="muted">'+esc(sub)+'</p></div>'+(right||'')+'</div>';
  }
  function pill(text,type){return '<span class="pill '+(type||'')+'">'+esc(text)+'</span>';}
  function stat(label,value,sub){return '<div class="stat"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><small>'+esc(sub)+'</small></div>';}
  function changeNotice(e){
    if(isChanged(e)){const d=revisionDiff(e);return '<div class="notice section"><strong>Unpublished design changes detected.</strong> The existing crew pack remains on revision '+published(e).revision+'. Proposed impact: <strong>'+d.added+' new</strong>, <strong>'+d.changed+' changed</strong>, <strong>'+d.removed+' removed</strong> tasks. Review the pending changes before distributing updated instructions. <button class="btn small" data-act="review-changes">Review pending changes</button></div>';}
    if(!published(e))return '<div class="notice section">There is no published installation pack for this event. Design the event first, then publish instructions. <button class="btn small" data-act="publish">Publish first pack</button></div>';
    return '';
  }

  function venuePickerOptions(venueId){
    return '<option value="">Select a venue…</option>'+venues().slice().sort((a,b)=>a.name.localeCompare(b.name)).map(x=>
      '<option value="'+esc(x.id)+'" '+(x.id===venueId?'selected':'')+'>'+esc(x.name)+'</option>').join('')+
      '<option value="__create__">+ Create new venue…</option>';
  }
  function venueSpaceChoices(venueId,selected){
    const v=window.PhaenomenonVenueWorkflow?.findVenue(db,venueId);
    if(!v)return '<p class="muted">Choose a saved venue to see its reusable spaces.</p>';
    const picked=new Set(selected||v.spaces.map(x=>x.id));
    return '<div class="venue-space-grid">'+v.spaces.map(x=>'<label class="venue-space-option"><input type="checkbox" name="spaceIds" value="'+esc(x.id)+'" '+(picked.has(x.id)?'checked':'')+'><span><strong>'+esc(x.name)+'</strong><small>'+esc(x.geometry?.kind||x.kind||'indoor')+' · '+num(x.width)+' × '+num(x.length)+' m</small></span></label>').join('')+'</div>';
  }
  function venueSettings(e){
    const v=venue(e),selected=Array.isArray(e?.spaceIds)?e.spaceIds:undefined;
    return '<details class="panel section event-venue-details" id="event-venue-settings" '+(ui.homeVenueOpen||plan(e).needsVenueReview?'open':'')+'>'+
      '<summary class="event-venue-summary"><span><strong>Venue &amp; spaces</strong><small>'+esc(v?.name||'Choose a venue')+' · '+areas(e).length+' spaces selected</small></span><span class="detail-toggle">Manage ▾</span></summary>'+
      '<div class="event-venue-body"><div class="section-head"><p class="muted">Select reusable spaces for this event or create a missing venue or space.</p><a class="btn small" href="index.html#/spaces/'+encodeURIComponent(e.id)+'">Edit venue geometry ↗</a></div>'+
      (plan(e).needsVenueReview?'<div class="notice section"><strong>Venue changed.</strong> Previously placed equipment has not been repositioned or verified for the new venue. Open the 3D layout to review coordinates and physical routing before publishing another crew pack. <button class="btn small" data-act="venue-layout-reviewed">Mark layout reviewed (planning only)</button></div>':'')+
      '<form id="event-venue-form" class="stack"><div class="form-grid"><label>Venue<select name="venueId" id="production-venue-select" data-current-venue="'+esc(v?.id||'')+'" required>'+venuePickerOptions(v?.id)+'</select></label>'+
      '<div class="row" style="align-self:end"><button type="button" class="btn" data-act="venue-create">+ Create venue</button>'+
      '<button type="button" class="btn" data-act="space-create" '+(!v?'disabled':'')+'>+ Create missing space</button></div></div>'+
      '<div><label>Spaces used by this event</label><div id="production-space-choices">'+venueSpaceChoices(v?.id,selected)+'</div></div>'+
      '<div class="row"><button class="btn primary" type="submit">Save venue &amp; spaces</button><span class="form-note">Spaces belong to the venue library; selections belong to this event.</span></div></form></div></details>';
  }
  let quickVenueOpen=false;
  function productionQuickClose(){document.querySelector('[data-venue-quick-overlay]')?.remove();quickVenueOpen=false;}
  function productionQuickOpen(kind){
    productionQuickClose();
    const venueId=document.getElementById('production-venue-select')?.value||venue(current())?.id||'';
    if(kind==='space'&&!window.PhaenomenonVenueWorkflow?.findVenue(db,venueId)){notice('Choose an existing venue to add a space.');return;}
    const label=kind==='venue'?'Create a reusable venue':'Add space to '+window.PhaenomenonVenueWorkflow.findVenue(db,venueId).name;
    const title='<div><h2>'+esc(label)+'</h2><p class="venue-hint">Venue geometry is reusable. Dimensions are placeholders until surveyed.</p></div>';
    const html='<div class="venue-quick-backdrop" data-venue-quick-overlay><section class="venue-quick-dialog" role="dialog" aria-modal="true" aria-label="'+esc(label)+'">'+
      '<div class="venue-picker-top">'+title+'<button type="button" class="btn" data-act="venue-quick-close" aria-label="Close">×</button></div>'+
      '<form id="production-venue-quick-form" class="venue-quick-form">'+
      '<input name="mode" type="hidden" value="'+kind+'"><input name="venueId" type="hidden" value="'+esc(venueId)+'">'+
      (kind==='venue'?'<label>Venue name<input name="venueName" class="input" required maxlength="120" placeholder="e.g. Abbotsford Convent"></label>':'<p class="venue-hint">Adds a new space to the selected existing venue. It will remain available for future events.</p>')+
      '<label>Space name<input name="spaceName" class="input" required maxlength="120" value="'+(kind==='venue'?'Main space':'')+'" placeholder="e.g. Courtyard"></label>'+
      '<div class="form-grid"><label>Width (m)<input name="width" class="input" type="number" min="2" max="200" step=".5" value="16" required></label>'+
      '<label>Length (m)<input name="length" class="input" type="number" min="2" max="200" step=".5" value="12" required></label>'+
      '<label>Height (m)<input name="height" class="input" type="number" min=".5" max="40" step=".5" value="4" required></label>'+
      '<label>Environment<select name="kind"><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option></select></label></div>'+
      '<div class="venue-quick-actions"><button type="button" class="btn" data-act="venue-quick-close">Cancel</button><button class="btn primary" type="submit">'+(kind==='venue'?'Create venue':'Add space')+'</button></div></form></section></div>';
    document.body.insertAdjacentHTML('beforeend',html);
    quickVenueOpen=true;
    document.querySelector('#production-venue-quick-form input[name="'+(kind==='venue'?'venueName':'spaceName')+'"]')?.focus();
  }
  function renderVenuePicker(venueId,extra){
    const select=document.getElementById('production-venue-select');
    if(!select)return;
    const old=select.dataset.currentVenue||'';
    const selected=old===venueId?[...document.querySelectorAll('#production-space-choices input[name="spaceIds"]:checked')].map(x=>x.value):undefined;
    select.innerHTML=venuePickerOptions(venueId);
    select.value=venueId;
    select.dataset.currentVenue=venueId;
    const v=window.PhaenomenonVenueWorkflow?.findVenue(db,venueId);
    const ids=selected||v?.spaces.map(x=>x.id)||[];
    if(extra&&!ids.includes(extra))ids.push(extra);
    const node=document.getElementById('production-space-choices');
    if(node)node.innerHTML=venueSpaceChoices(venueId,ids);
    const btn=document.querySelector('#event-venue-form [data-act="space-create"]');
    if(btn)btn.disabled=!v;
  }



  function builderEquipmentLinks(e,gear){
    const objects=[...gear.unlinked,...gear.unknown,...gear.ignored];
    if(!objects.length)return '';
    const catalog=db.equipment||[];
    return '<details class="workspace-disclosure section builder-item-links"><summary>Resolve '+(gear.unlinked.length+gear.unknown.length)+' catalogue links'+(gear.ignored.length?' · '+gear.ignored.length+' intentionally excluded':'')+'</summary>'+
      '<div class="disclosure-body"><p class="muted">Each physical object can link to a reusable equipment type. If it is a venue feature or another object that is not part of the event hire kit, mark it as excluded. Adding a catalogue placeholder does not claim you own that equipment.</p>'+
      '<div class="stack">'+objects.map(item=>{
        const isIgnored=item.kitTracked===false;
        return '<div class="builder-link-row"><div><strong>'+esc(item.name)+'</strong><small>'+esc(item.kind||'Object')+' · '+esc(areaName(e,item.areaId))+'</small></div>'+
        '<label>Equipment library link<select data-act="builder-link-object" data-id="'+esc(item.id)+'">'+
        '<option value="" '+(!item.eqId&&!isIgnored?'selected':'')+'>Not linked yet</option>'+
        catalog.map(g=>'<option value="'+esc(g.id)+'" '+(!isIgnored&&item.eqId===g.id?'selected':'')+'>'+esc(g.name)+'</option>').join('')+
        '<option value="__new__">+ Create catalogue placeholder…</option>'+
        '<option value="__skip__" '+(isIgnored?'selected':'')+'>Not part of the event kit</option>'+
        '</select></label></div>';
      }).join('')+'</div>'+
      '<p class="form-note">Changing a linked object can affect published crew instructions. Review and publish a revision if necessary.</p></div></details>';
  }


  function builderBasics(e){
    const eventTypes=['Other','Performance','Live music','Festival','Wedding','Corporate','Private','Exhibition'];
    return '<section class="panel section builder-inline-form"><div class="section-head"><h2>Event details</h2><span class="form-note">Edit the event without leaving the guided workflow</span></div>'+
      '<form id="builder-basics-form" class="form-grid">'+
      '<label class="wide">Event name<input class="input" name="title" required maxlength="120" value="'+esc(e.title)+'"></label>'+
      window.PhaenomenonLifecycleUI.fields(e,{compact:true})+
      '<label>Client / organiser (optional)<select name="clientId"><option value="">Not known yet</option>'+db.clients.map(x=>'<option value="'+esc(x.id)+'" '+(e.clientId===x.id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label>'+
      '<label>Event type<select name="eventType">'+eventTypes.map(x=>'<option value="'+esc(x)+'" '+(e.eventType===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>'+

      '<details class="wide workspace-disclosure builder-assumptions"><summary>Planning assumptions &amp; estimated costs</summary><div class="disclosure-body form-grid">'+
      '<label>Expected guests<input class="input" name="guests" type="number" min="1" max="5000" value="'+Math.max(1,Math.floor(num(e.guests,1)))+'"></label>'+
      '<label>Lighting zones (kit estimate)<input class="input" name="zones" type="number" min="1" max="12" value="'+Math.max(1,Math.floor(num(e.zones,1)))+'"></label>'+
      '<label>Environment<select name="environment"><option value="Indoor" '+(e.environment!=='Outdoor'?'selected':'')+'>Indoor / covered</option><option value="Outdoor" '+(e.environment==='Outdoor'?'selected':'')+'>Outdoor</option></select></label>'+
      '<label>Production complexity<select name="complexity">'+['Simple','Standard','Feature'].map(x=>'<option value="'+x+'" '+(e.complexity===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
      '<label>Estimated crew hours<input class="input" name="labourHours" type="number" min="0" max="1000" step="0.25" value="'+Math.max(0,num(e.labourHours))+'"></label>'+
      '<label>Indicative crew rate (AUD/h)<input class="input" name="labourRate" type="number" min="0" max="100000" step="0.01" value="'+Math.max(0,num(e.labourRate))+'"></label>'+
      '<p class="muted wide">These are estimates for a draft budget, not verified quantities, labour requirements or an electrical design.</p></div></details>'+
      '<label class="wide">Notes<textarea class="input" name="notes" maxlength="3000">'+esc(e.notes||'')+'</textarea></label>'+
      '<div class="wide row"><button type="submit" class="btn primary">Save event details</button>'+
      '<a class="btn" href="#/builder/'+encodeURIComponent(e.id)+'/spaces">Next: Venue &amp; spaces →</a></div>'+
      '</form></section>';
  }
  function builderFocused(e,c){
    const step=ui.builderFocus;
    if(!step)return '';
    const name={brief:'Event details',spaces:'Venue & spaces',design:'3D design',equipment:'Equipment kit',connections:'Technical connections',team:'People & responsibilities',review:'Review & publish'}[step];
    if(!name)return '';
    const content=step==='brief'?builderBasics(e):step==='spaces'?venueSettings(e):
      step==='equipment'?logistics(e):step==='review'?
      (changePanel(e)||'<section class="panel section"><h2>Published crew pack</h2><p class="muted">'+
        (published(e)?'Revision '+published(e).revision+' is published. Review the technical record before issuing instructions.':'No crew pack published for this event.')+
        '</p><button class="btn primary" data-act="publish">Publish current crew pack</button></section>'):'';
    return '<div class="builder-focus section" id="builder-active-step"><div class="section-head"><div><span class="eyebrow">EDITING STEP</span><h2>'+esc(name)+'</h2></div>'+
      '<a class="btn small" href="#/builder/'+encodeURIComponent(e.id)+'">Close step ×</a></div>'+
      (content||'<p class="muted">Continue using the dedicated workspace for this stage.</p>')+'</div>';
  }

  function builderPage(e,c){
    const model=window.PhaenomenonEventBuilder;
    if(!e)return hero('EVENT BUILDER','Start a production','Create an event to begin.','<button class="btn primary" data-act="builder-new">+ Create event</button>');
    const steps=model?.steps(db,e,{changed:isChanged(e)})||[];
    const setup=steps.filter(x=>x.state==='complete').length;
    const next=steps.find(x=>x.state!=='complete');
    const gear=model?.mapEquipment(db,e);
    const progress=steps.length?Math.round(setup/steps.length*100):0;
    const actionLink=step=>{
      const local=['brief','spaces','equipment','review'].includes(step.id);
      const href=local?'#/builder/'+encodeURIComponent(e.id)+'/'+step.id:step.href;
      return '<a class="btn '+(step.id===(next?.id)?'primary':'small')+'" href="'+esc(href)+'">'+esc(local?'Edit step':step.action)+' →</a>';
    };
    return hero('GUIDED EVENT BUILDER',e.title,'Choose the next step or jump directly to any part of the event. Nothing is locked.',
        '<button class="btn" data-act="builder-new">+ Another event</button>')+
      changeNotice(e)+window.PhaenomenonLifecycleUI.stageStrip(e,db)+
      '<section class="builder-summary section"><div><strong>'+setup+' of '+steps.length+' steps configured</strong><p class="muted">Planning progress only. A configured step does not mean it has been checked or approved for safe installation.</p>'+
      '<div class="builder-progress" role="progressbar" aria-label="Event setup progress" aria-valuenow="'+setup+'" aria-valuemin="0" aria-valuemax="'+steps.length+'"><div style="width:'+progress+'%"></div></div></div>'+
      (next?'<div class="builder-next"><span class="eyebrow">SUGGESTED NEXT</span><strong>'+esc(next.title)+'</strong><small>'+esc(next.summary)+'</small>'+actionLink(next)+'</div>':
      '<div class="builder-next"><strong>All steps contain planning information</strong><small>Review technical assumptions and publish updates as needed.</small><a class="btn" href="#/design/'+encodeURIComponent(e.id)+'">Review &amp; publish →</a></div>')+
      '</section>'+builderFocused(e,c)+
      '<ol class="builder-step-list section">'+steps.map((step,index)=>{
        const stateLabel=({complete:'Configured',attention:'Needs attention',todo:'Not started'})[step.state]||'Draft';
        return '<li class="builder-step '+esc(step.state)+'"><div class="builder-number">'+(index+1)+'</div>'+
          '<div class="builder-step-content"><div class="builder-step-top"><h2>'+esc(step.title)+'</h2><span class="builder-state '+esc(step.state)+'">'+stateLabel+'</span></div>'+
          '<p>'+esc(step.description)+'</p><div class="builder-step-summary">'+esc(step.summary)+'</div></div><div class="builder-step-action">'+actionLink(step)+'</div></li>';
      }).join('')+'</ol>'+
      (gear&&gear.incomplete.length?'<section class="panel section builder-action-panel"><div class="section-head"><div><h2>Event kit is behind the layout</h2><p class="muted">Placed items linked to the equipment catalogue need matching quantities in this event’s kit. Existing unrelated quantities are preserved.</p></div><span class="builder-state attention">'+gear.incomplete.length+' gaps</span></div>'+
      '<div class="stack">'+gear.incomplete.map(x=>'<div class="linkrow"><strong>'+esc(x.name)+'</strong><span class="muted">'+x.placed+' placed · '+x.requested+' allocated</span></div>').join('')+'</div>'+
      '<button class="btn primary" style="margin-top:13px" data-act="builder-reconcile-kit">Bring kit up to placed quantities</button></section>':'')+
            (gear?builderEquipmentLinks(e,gear):'')+
      '<div class="builder-footnote">You can leave an event as a draft and return to any step. Layout revisions, technical verification and crew sign-offs remain separate from these planning markers. <a href="#/production/closeout/'+encodeURIComponent(e.id)+'">Post-event closeout →</a></div>';
  }
  let builderEventOpen=false;
  function openBuilderEvent(){
    closeBuilderEvent();
    const overlay='<div class="venue-quick-backdrop" data-builder-event-overlay><section class="venue-quick-dialog" role="dialog" aria-modal="true" aria-label="Create a new event">'+
      '<header class="venue-picker-top"><div><h2>Create an event</h2><p class="venue-hint">Start with the basics. You can select a Venue and its Spaces in the next step.</p></div>'+
      '<button class="btn" type="button" data-act="builder-new-close" aria-label="Close">×</button></header>'+
      '<form id="builder-new-event-form" class="venue-quick-form">'+
      '<label>Event name<input class="input" name="title" required maxlength="120" placeholder="e.g. Saturday warehouse party"></label>'+
      window.PhaenomenonLifecycleUI.fields(null,{create:true,compact:true})+
      '<label>Existing client (optional)<select name="clientId"><option value="">Not known yet…</option>'+
      (db.clients||[]).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>'+
      '<label>Or new client name<input class="input" name="clientName" maxlength="120" placeholder="Only needed if not in the list"></label>'+
      '<div class="venue-quick-actions"><button class="btn" type="button" data-act="builder-new-close">Cancel</button>'+
      '<button class="btn primary" type="submit">Create draft event</button></div></form></section></div>';
    document.body.insertAdjacentHTML('beforeend',overlay);builderEventOpen=true;
    document.querySelector('#builder-new-event-form input[name="title"]')?.focus();
  }
  function closeBuilderEvent(){document.querySelector('[data-builder-event-overlay]')?.remove();builderEventOpen=false;}


  function monthKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
  function dateKey(d){return monthKey(d)+'-'+String(d.getDate()).padStart(2,'0');}
  function validEventDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(new Date(value+'T12:00:00').getTime());}
  function eventSchedule(){
    const all=events(),today=dateKey(new Date()),L=window.PhaenomenonLifecycle;
    const state=x=>L.summary(db,x);
    const earlyStages=new Set(['idea','outreach','contacted','discussion','quoted','tentative','postponed']);
    const isEarly=x=>earlyStages.has(state(x).bookingStage);
    const opportunities=all.filter(isEarly).sort((a,b)=>(state(a).followUpDate||'9999').localeCompare(state(b).followUpDate||'9999')||a.title.localeCompare(b.title));
    const upcoming=all.filter(x=>state(x).bookingStage==='confirmed'&&!state(x).closed&&
      validEventDate(x.date)&&x.date>=today&&state(x).productionStage!=='delivered')
      .sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
    const outstanding=all.filter(x=>state(x).productionStage==='delivered'&&!state(x).closed);
    const closed=all.filter(x=>state(x).closed);
    const used=new Set([...opportunities,...upcoming,...outstanding,...closed].map(x=>x.id));
    const past=all.filter(x=>!used.has(x.id)&&validEventDate(x.date)&&x.date<today).sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
    past.forEach(x=>used.add(x.id));
    const unscheduled=all.filter(x=>!used.has(x.id)&&!validEventDate(x.date)).sort((a,b)=>a.title.localeCompare(b.title));
    unscheduled.forEach(x=>used.add(x.id));
    const remaining=all.filter(x=>!used.has(x.id));
    const eventRow=x=>'<a class="event-index-row'+(x.id===ui.eventId?' is-current':'')+'" href="#/builder/'+encodeURIComponent(x.id)+'">'+
      '<span class="event-index-date">'+esc(date(x.date)==='Unscheduled'?(state(x).targetMonth?state(x).targetMonth+' approx.':'No date'):date(x.date))+'</span>'+
      '<span class="event-index-main"><strong>'+esc(x.title)+'</strong><small>'+esc(venue(x)?.name||x.venue||'Venue not assigned')+
      ' · '+esc(state(x).dateLabel)+' · '+esc(state(x).productionLabel)+(state(x).nextAction?' · Next: '+esc(state(x).nextAction):'')+'</small></span>'+
      '<span class="event-index-status">'+pill(state(x).closed?'Closed':state(x).bookingLabel)+(x.id===ui.eventId?'<small class="event-index-active">Current</small>':'')+'</span><span class="event-index-chevron" aria-hidden="true">›</span></a>';
    const grouped=(name,list)=>list.length?'<section class="panel event-index-group"><h2>'+esc(name)+' <span class="muted">('+list.length+')</span></h2><div class="event-index-rows">'+list.map(eventRow).join('')+'</div></section>':'';
    const selected=current(),monthPattern=/^\d{4}-(0[1-9]|1[0-2])$/;
    const key=monthPattern.test(ui.scheduleMonth)?ui.scheduleMonth:monthKey(new Date());
    const [year,month]=key.split('-').map(Number);
    const first=new Date(year,month-1,1),startOffset=(first.getDay()+6)%7;
    const days=new Date(year,month,0).getDate(),cells=Math.ceil((startOffset+days)/7)*7;
    const monthEvents=all.filter(x=>validEventDate(x.date)&&x.date.slice(0,7)===key);
    const monthTitle=first.toLocaleDateString('en-AU',{month:'long',year:'numeric'});
    const grid=Array.from({length:cells},(_,i)=>{
      const d=i-startOffset+1;
      if(d<1||d>days)return '<div class="calendar-day is-outside" aria-hidden="true"></div>';
      const stamp=key+'-'+String(d).padStart(2,'0');
      const matches=monthEvents.filter(x=>x.date===stamp);
      return '<div class="calendar-day'+(stamp===today?' is-today':'')+'"><span class="calendar-date">'+d+'</span>'+
        matches.map(x=>'<a href="#/builder/'+encodeURIComponent(x.id)+'" title="'+esc(x.title)+'" class="calendar-event'+(x.id===ui.eventId?' is-current':'')+'">'+esc(x.title)+'</a>').join('')+'</div>';
    }).join('');
    return hero('EVENTS & SCHEDULE','All events','Find a booking, review the schedule and open any event without leaving Production OS.',
      '<button class="btn primary" data-act="builder-new">+ New event</button>')+
      '<div class="event-index-actions section"><div class="row"><button type="button" class="btn'+(ui.scheduleMode==='list'?' primary':'')+'" data-act="schedule-mode" data-id="list" aria-pressed="'+(ui.scheduleMode==='list')+'">Event list</button>'+
      '<button type="button" class="btn'+(ui.scheduleMode==='calendar'?' primary':'')+'" data-act="schedule-mode" data-id="calendar" aria-pressed="'+(ui.scheduleMode==='calendar')+'">Month calendar</button></div>'+
      (selected?'<a class="btn" href="#/builder/'+encodeURIComponent(selected.id)+'">Continue '+esc(selected.title)+' →</a>':'')+'</div>'+
      (ui.scheduleMode==='calendar'?
        '<section class="panel section event-calendar"><div class="event-calendar-head"><h2>'+esc(monthTitle)+'</h2>'+
        '<div class="row"><button type="button" class="btn small" data-act="schedule-month" data-id="-1" aria-label="Previous month">←</button>'+
        '<button type="button" class="btn small" data-act="schedule-today">Today</button>'+
        '<button type="button" class="btn small" data-act="schedule-selected" '+(!selected||!validEventDate(selected.date)?'disabled':'')+'>Selected event</button>'+
        '<button type="button" class="btn small" data-act="schedule-month" data-id="1" aria-label="Next month">→</button></div></div>'+
        '<div class="calendar-grid" aria-label="'+esc(monthTitle)+'">'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>'<div class="calendar-weekday">'+x+'</div>').join('')+grid+'</div>'+
        '<p class="form-note">Event dates from your saved bookings. Select an event to open its builder. For the broader studio diary, use <a href="index.html#/schedule">Studio calendar ↗</a>.</p></section>'+
        (monthEvents.length?grouped('Events this month',monthEvents.slice().sort((a,b)=>a.date.localeCompare(b.date))):'<p class="muted">No events scheduled this month. Use the arrows to browse other months or switch to Event list for every booking.</p>'):
        (all.length?grouped('Opportunities & discussions',opportunities)+grouped('Upcoming confirmed',upcoming)+
          grouped('Delivered · closeout outstanding',outstanding)+grouped('Past events',past)+grouped('Without a date',unscheduled)+grouped('Other events',remaining)+grouped('Closed / archive',closed):
        '<div class="empty">No events yet. Select + New event to create your first production.</div>'))+
      '<div class="row section"><a class="btn" href="index.html#/schedule">Open full studio calendar ↗</a><a class="btn" href="index.html#/bookings">Manage bookings in classic workspace ↗</a></div>';
  }

  function home(e,c){
    if(!e)return '<div class="empty">Create an event in the original workspace to begin.</div>';
    return hero('YOUR EVENT WORKSPACE',e.title, date(e.date)+' · '+(venue(e)?.name||e.venue||'Venue not set'),'<a class="btn primary" href="#/builder/'+encodeURIComponent(e.id)+'">Continue event builder →</a> '+pill(e.status||'Enquiry')+' '+pill('Crew pack r'+(published(e)?.revision||0)))+
      changeNotice(e)+venueSettings(e)+
      '<div class="stats">'+stat('Spaces',areas(e).length,'Selected for this event')+stat('Placed equipment',(plan(e).items||[]).length,'All equipment and structures')+
      stat('Installation',c.installed+' / '+c.all,'Tasks marked installed')+stat('Open issues',c.issues,'Awaiting resolution')+'</div>'+
      '<div class="section-head"><h2>What are you working on?</h2><span class="muted">Choose a task, not an expertise level</span></div>'+
      '<div class="grid cols4 section">'+[
        ['design','⌑','3D design','Position equipment and plan the physical layout.'],
        ['technical','⚡','Connections','Review patching, cables and power.'],
        ['crew','✓','Crew installation','Follow task-specific installation instructions.'],
        ['production','▤','Production','Coordinate team, equipment and show schedule.']
      ].map(x=>'<a class="work-card" href="#/'+x[0]+'"><span class="symbol">'+x[1]+'</span><strong>'+x[2]+'</strong><p>'+x[3]+'</p></a>').join('')+'</div>'+
      '<details class="event-overview-more section"><summary>Spaces &amp; installation progress <span aria-hidden="true">⌄</span></summary><div class="grid cols2">'+
      '<section class="panel"><h2>Spaces in this event</h2><div class="stack">'+areas(e).map(a=>'<div class="area-card"><div class="row between"><strong>'+esc(a.name)+'</strong>'+pill(a.kind||'Stage')+'</div><p class="muted">'+(plan(e).items||[]).filter(i=>groupArea(e,i)===a.id).length+' placed items · '+(plan(e).runs||[]).filter(r=>{const to=(plan(e).items||[]).find(i=>i.id===r.to);return to&&groupArea(e,to)===a.id;}).length+' incoming/local cable records</p></div>').join('')+'</div></section>'+
      '<section class="panel"><h2>Current state</h2><p class="muted">The event record connects a reusable venue, its selected spaces, equipment placements, technical connections, named assignments and a published crew revision.</p>'+
      '<div class="sep"></div><div class="row between"><span>Installed</span><strong>'+c.installed+' / '+c.all+'</strong></div><div class="progress" style="margin:12px 0"><div style="width:'+(c.all?100*c.installed/c.all:0)+'%"></div></div>'+
      '<p class="muted">'+c.verified+' independently marked verified · '+c.issues+' open issue(s)</p>'+
      '<a class="btn" href="#/production">Open production overview →</a></section></div></details>';
  }
  function design(e,c){
    const p=plan(e),v=venue(e);
    return hero('DESIGN WORKSPACE','Design the event','A guided entry point to the existing 3D space planner and its Design → Connect → Review → Export workflow.',
      '<a class="btn primary" href="index.html#/spaces/'+encodeURIComponent(e.id)+'">Open 3D planner ↗</a>')+
      changeNotice(e)+changePanel(e)+
      '<div class="notice info section">The existing 3D editor is preserved in the classic workspace. Use Open 3D planner above to continue in the existing four-step Design → Connect → Review → Export workflow. Return here to review and publish installation instructions. This is the same browser data, reloaded between workspaces.</div>'+
      '<div class="grid cols2 section"><section class="panel"><h2>Physical venue model</h2>'+
      '<p class="muted">'+esc(v?.name||'Unassigned venue')+'</p>'+
      '<div class="stack">'+areas(e).map(a=>'<div class="linkrow"><div><strong>'+esc(a.name)+'</strong><div class="detail">'+esc(a.kind||'Space')+' · '+num(a.width)+' × '+num(a.length)+' m (illustrative until verified)</div></div>'+pill((p.items||[]).filter(i=>groupArea(e,i)===a.id).length+' items')+'</div>').join('')+'</div></section>'+
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
      '<details class="workspace-disclosure"><summary>+ Add draft lighting look</summary><div class="disclosure-body"><form id="look-form" class="form-grid"><label>Look name<input class="input" name="name" required maxlength="100" placeholder="e.g. Sunset wash"></label>'+
      '<label>Space<select name="areaId">'+areas(e).map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join('')+'</select></label>'+
      '<label>Colour<input class="input" type="color" name="color" value="#8cddcf"></label>'+
      '<label>Intensity (%)<input class="input" type="number" min="0" max="100" step="1" name="intensity" value="75"></label>'+
      '<label>Effect concept<select name="effect"><option>Static</option><option>Slow fade</option><option>Pulse</option><option>Chase</option><option>Audio-reactive (concept)</option><option>Other</option></select></label>'+
      '<label>Notes<input class="input" name="notes" maxlength="220" placeholder="Fixture group / desired mood"></label>'+
      '<div class="wide"><button class="btn primary" type="submit">Add draft look</button></div></form></div></details></section>';
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
      '<a class="btn primary" href="index.html#/spaces/'+encodeURIComponent(e.id)+'">Edit technical plan ↗</a>')+
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
  function taskOwner(e,taskId){return org().taskAssignments?.[e.id]?.[taskId]||'';}
  function taskOwnerAreaOK(e,t){const owner=taskOwner(e,t.id);return !owner||org().assignments.some(a=>a.eventId===e.id&&a.entityId===owner&&(a.areaId==='all'||a.areaId===t.areaId));}
  function crewMembers(e){const ids=[...new Set(org().assignments.filter(a=>a.eventId===e.id&&entity(a.entityId)?.kind==='Person').map(a=>a.entityId))];return ids.map(entity).filter(Boolean);}
  function crewSelector(e){
    const members=crewMembers(e);return '<label style="min-width:195px">CREW MEMBER<select id="crew-person-picker"><option value="all">All crew tasks</option>'+members.map(x=>'<option value="'+esc(x.id)+'" '+(ui.crewPerson===x.id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label>';
  }
  function matchesCrew(e,t){return (ui.area==='all'||t.areaId===ui.area)&&(ui.crewPerson==='all'||taskOwner(e,t.id)===ui.crewPerson);}
  function taskList(e,opt){
    opt=opt||{};
    const pub=published(e);
    if(!pub)return '<div class="empty">No published pack yet.</div>';
    const all=pub.tasks||[];
    const filtered=all.filter(t=>(ui.area==='all'||t.areaId===ui.area)&&(opt.verify||ui.crewPerson==='all'||taskOwner(e,t.id)===ui.crewPerson)&&(!opt.verify||t.state==='installed'||t.state==='verified'));
    if(!filtered.length)return '<div class="empty">No matching tasks.</div>';
    return filtered.map(t=>{
      const locked=isChanged(e);
      const bad=org().issues.some(i=>i.eventId===e.id&&i.taskId===t.id&&i.status!=='Resolved');
      const buttons=opt.verify?
        (t.state==='installed'?'<button class="btn small" data-act="verify" data-id="'+esc(t.id)+'">Mark verified</button>':pill('Verified','good')):
        '<button class="btn small" data-act="report" data-id="'+esc(t.id)+'">Report issue</button>';
      return '<div class="task-row"><input class="task-check" type="checkbox" data-act="installed" data-id="'+esc(t.id)+'" aria-label="Mark installed: '+esc(t.title)+'" '+(t.state!=='pending'?'checked':'')+(opt.verify?' disabled':'')+'>'+
        '<div class="task-main"><strong>'+esc(t.title)+'</strong> '+(t.state==='verified'?pill('Verified','good'):t.state==='installed'?pill('Installed','good'):pill('To do'))+(bad?' '+pill('Issue open','bad'):'')+
        '<p>'+esc(t.details)+'</p><div class="form-note">'+esc(areaName(e,t.areaId,pub.snapshot))+' · '+esc(t.kind)+' · revision '+pub.revision+(taskOwner(e,t.id)?' · Assigned to '+esc(aname(taskOwner(e,t.id))):' · Unassigned')+(taskOwnerAreaOK(e,t)?'':' · Check assignment: different work area')+'</div></div>'+
        '<div class="task-actions">'+buttons+'</div></div>';
    }).join('');
  }
  function areaPicker(e){
    return '<label style="min-width:210px">SPACE / WORK AREA<select id="area-picker"><option value="all" '+(ui.area==='all'?'selected':'')+'>All spaces</option>'+
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

  function acknowledgements(e){return org().packAcknowledgements[e?.id]||[];}
  function acknowledged(e,personId,revision){
    return acknowledgements(e).find(x=>x.personId===personId&&x.revision===revision);
  }
  function acknowledgePack(e,personId){
    const pub=published(e),person=crewMembers(e).find(p=>p.id===personId);
    if(!pub||!person)return false;
    if(!org().packAcknowledgements[e.id])org().packAcknowledgements[e.id]=[];
    if(!acknowledged(e,personId,pub.revision)){
      org().packAcknowledgements[e.id].push({personId,revision:pub.revision,at:now(),type:'recorded-in-browser'});
    }
    return true;
  }
  function crewAcknowledgement(e){
    const pub=published(e);if(!pub)return '';
    if(ui.crewPerson==='all')return '<div class="notice info section">Select a crew member to view their revision acknowledgement status. Acknowledgement records in this prototype are not identity-verified or signed approvals.</div>';
    const item=acknowledged(e,ui.crewPerson,pub.revision);
    return '<div class="notice info section"><strong>'+esc(aname(ui.crewPerson))+'</strong> · Crew pack r'+pub.revision+' · '+
      (item?'Review recorded '+new Date(item.at).toLocaleString('en-AU')+'.':'Review not yet recorded for this person.')+
      (item?'':' <button class="btn small no-print" data-act="ack-pack">Record review of revision '+pub.revision+'</button>')+
      '<p class="form-note">This is a local workflow marker. It is not proof of identity, acceptance of risk, safety certification or formal sign-off.</p></div>';
  }
  function productionAcknowledgements(e){
    const people=crewMembers(e),pub=published(e);if(!pub)return '';
    const complete=people.filter(x=>acknowledged(e,x.id,pub.revision)).length;
    return '<section class="panel section"><div class="section-head"><h2>Crew pack circulation</h2>'+pill(complete+' / '+people.length+' reviews recorded')+'</div>'+
      '<p class="muted">Track which team members have reviewed the current published revision. Each new revision requires a fresh review. Statuses are self-reported in this prototype, not authenticated signatures.</p>'+
      '<div class="stack">'+(people.map(x=>{
        const ack=acknowledged(e,x.id,pub.revision),stale=acknowledgements(e).filter(a=>a.personId===x.id&&a.revision!==pub.revision).sort((a,b)=>b.revision-a.revision)[0];
        return '<div class="linkrow"><div><strong>'+esc(x.name)+'</strong><div class="detail">'+
          (ack?'Review recorded '+new Date(ack.at).toLocaleString('en-AU'):stale?'Previously reviewed r'+stale.revision+'. Current revision '+pub.revision+' needs review.':'No review recorded for current revision')+
          '</div></div>'+pill(ack?'Reviewed r'+pub.revision:'Needs review',ack?'good':'warn')+'</div>';
      }).join('')||'<div class="empty">Add people to the event team to track pack circulation.</div>')+'</div></section>';
  }

  function crew(e,c){
    if(ui.crewPerson!=='all'&&!crewMembers(e).some(x=>x.id===ui.crewPerson))ui.crewPerson='all';
    const pub=published(e),total=(pub?.tasks||[]).filter(t=>matchesCrew(e,t)),done=total.filter(t=>t.state!=='pending').length;
    return hero('CREW WORKSPACE','Install the event','Simple, area-specific instructions from a versioned crew pack. Track installation separately from technical verification.',
      areaPicker(e)+crewSelector(e))+
      changeNotice(e)+reportingSummary(e)+crewAcknowledgement(e)+
      (!pub?'<div class="empty">Publish a crew pack from Design to begin.</div>':
      '<div class="row between section no-print"><button class="btn" data-act="print">Print area crew pack / Save as PDF</button><span class="form-note">Select one area for a concise handout.</span></div><div class="notice info section">Crew pack revision <strong>'+pub.revision+'</strong> · issued '+new Date(pub.at).toLocaleString('en-AU')+'. '+
      (isChanged(e)?' A newer design has not been published. Do not use unreviewed new instructions.':' Instructions reflect the currently published plan.')+'</div>'+
      '<div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">'+stat('Assigned tasks',total.length,'In chosen area')+stat('Installed',done,'Marked by crew')+stat('Verified',total.filter(x=>x.state==='verified').length,'Technical sign-off status')+'</div>'+
      '<div class="grid cols2"><section class="panel"><h2>Installation instructions</h2><div class="row between section"><span class="muted">'+done+' of '+total.length+' installed</span>'+pill((total.length?Math.round(done/total.length*100):0)+'%')+'</div>'+
      '<div class="progress section"><div style="width:'+(total.length?100*done/total.length:0)+'%"></div></div>'+taskList(e)+
      '<p class="form-note">Checking a box means the item was reported installed. It does not indicate a qualified safety sign-off.</p></section>'+
      '<section class="panel"><h2>Where things go</h2>'+diagram(e)+'<p class="form-note">Diagram is schematic, not a measured construction or rigging drawing. Use the approved site drawings and instructions.</p></section></div>');
  }

  const TEAM_POSITIONS=['In charge','Second in charge','Team lead','Helper','Crew member','Other'];
  function peopleInEvent(e){return crewMembers(e);}
  function teamEntries(e){
    const members=peopleInEvent(e),people=new Set(members.map(x=>x.id));
    const stored=org().teamHierarchy[e.id]||{};
    return members.map(person=>{
      const entry=stored[person.id]||{},roles=org().assignments.filter(a=>a.eventId===e.id&&a.entityId===person.id);
      const initial=roles.some(a=>a.role==='Production manager')?'In charge':roles.some(a=>a.role==='Stagehand')?'Helper':'Crew member';
      return {person,position:TEAM_POSITIONS.includes(entry.position)?entry.position:initial,
        reportsTo:people.has(entry.reportsTo)&&entry.reportsTo!==person.id?entry.reportsTo:'',
        notes:entry.notes||'',roles};
    });
  }
  function wouldCycle(e,personId,supervisorId){
    if(!supervisorId)return false;
    if(supervisorId===personId)return true;
    const records=new Map(teamEntries(e).map(n=>[n.person.id,n]));
    let current=supervisorId;const seen=new Set();
    while(current){
      if(current===personId||seen.has(current))return true;
      seen.add(current);current=records.get(current)?.reportsTo||'';
    }
    return false;
  }
  function saveTeamLine(e,personId,supervisorId,position,notes){
    const ids=new Set(peopleInEvent(e).map(p=>p.id));
    if(!ids.has(personId))return 'This person is not on this event team.';
    if(supervisorId&&!ids.has(supervisorId))return 'Choose a supervisor from this event team.';
    if(wouldCycle(e,personId,supervisorId))return 'Cannot create a reporting loop or make someone report to themselves.';
    if(!TEAM_POSITIONS.includes(position))return 'Choose a valid team position.';
    if(!org().teamHierarchy[e.id])org().teamHierarchy[e.id]={};
    org().teamHierarchy[e.id][personId]={position,reportsTo:supervisorId||'',notes:clean(notes).slice(0,320)};
    return '';
  }

  function reportingSummary(e){
    if(ui.crewPerson==='all')return '';
    const person=teamEntries(e).find(x=>x.person.id===ui.crewPerson);
    if(!person)return '';
    const peers=teamEntries(e).filter(x=>x.reportsTo===person.person.id);
    return '<div class="notice info section"><strong>'+esc(person.person.name)+'</strong> · '+esc(person.position)+' · '+
      (person.reportsTo?'Reports to '+esc(aname(person.reportsTo)):'Top of reporting tree / no manager assigned')+
      (peers.length?' · '+peers.length+' direct report'+(peers.length===1?'':'s'):'')+
      '. <span class="form-note">Reporting lines are for team coordination only.</span></div>';
  }
  function profileReporting(ent){
    if(ent.kind!=='Person')return '';
    const memberships=events().flatMap(e=>{
      const nodes=teamEntries(e),person=nodes.find(n=>n.person.id===ent.id);
      if(!person)return [];
      return [{event:e,entry:person,reports:nodes.filter(x=>x.reportsTo===ent.id)}];
    });
    if(!memberships.length)return '';
    return '<div class="sep"></div><h3>Reporting structure by event</h3><div class="stack">'+memberships.map(x=>
      '<div class="area-card"><strong>'+esc(x.event.title)+'</strong><p class="muted">'+esc(x.entry.position)+'</p>'+
      (x.entry.reportsTo?'<button class="linkrow" data-act="profile" data-id="'+esc(x.entry.reportsTo)+'"><div><strong>Reports to '+esc(aname(x.entry.reportsTo))+'</strong></div>→</button>':'<p class="muted">No supervisor in this event</p>')+
      (x.reports.length?'<p class="muted">Direct reports:</p>'+x.reports.map(n=>
        '<button class="linkrow" data-act="profile" data-id="'+esc(n.person.id)+'"><div><strong>'+esc(n.person.name)+'</strong><div class="detail">'+esc(n.position)+'</div></div>→</button>').join(''):'')+
      '</div>').join('')+'</div>';
  }

  function teamStructure(e){
    const records=teamEntries(e);
    if(!records.length)return '<section class="panel section"><h2>Team hierarchy</h2><div class="empty">Add a person to this event team to start building a hierarchy.</div></section>';
    const byId=new Map(records.map(n=>[n.person.id,n]));
    const nodeParent=n=>{
      if(!n.reportsTo)return '';
      return wouldCycle(e,n.person.id,n.reportsTo)?'':n.reportsTo;
    };
    const tree=parentId=>records.filter(n=>nodeParent(n)===parentId);
    const selected=byId.get(ui.teamPerson)||records.find(n=>!nodeParent(n))||records[0];
    const node=(n,visited)=>{
      if(visited.has(n.person.id))return '';
      const next=new Set(visited);next.add(n.person.id);
      const children=tree(n.person.id).filter(x=>!next.has(x.person.id));
      const jobs=n.roles.map(a=>a.role).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');
      const assigned=(published(e)?.tasks||[]).filter(t=>taskOwner(e,t.id)===n.person.id);
      const completed=assigned.filter(t=>t.state!=='pending').length;
      const areasAssigned=n.roles.map(a=>a.areaId==='all'?'Whole event':areaName(e,a.areaId)).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
      return '<li><button type="button" data-act="team-select" data-id="'+esc(n.person.id)+'" class="team-person '+(selected.person.id===n.person.id?'selected':'')+'" aria-label="Edit '+esc(n.person.name)+' in the team hierarchy">'+
        '<span class="team-avatar" aria-hidden="true">'+esc(n.person.name.trim().slice(0,1).toUpperCase())+'</span>'+
        '<span class="team-person-info"><strong>'+esc(n.person.name)+'</strong><span>'+esc(n.position)+' · '+esc(jobs||'Event team')+'</span><small>'+esc(areasAssigned)+'</small></span>'+
        '<span class="team-progress">'+completed+'/'+assigned.length+'<small>tasks</small></span></button>'+
        (children.length?'<ul class="team-branch">'+children.map(c=>node(c,next)).join('')+'</ul>':'')+'</li>';
    };
    const roots=records.filter(n=>!nodeParent(n));
    const supervisors=records.filter(n=>n.person.id!==selected.person.id);
    const manager=selected.reportsTo;
    const direct=records.filter(x=>nodeParent(x)===selected.person.id);
    return '<section class="panel section" id="team-hierarchy"><div class="section-head"><div><h2>Team hierarchy</h2>'+
      '<p class="muted">Build a chain of responsibility for this event, from the person in charge to deputies and helpers.</p></div>'+
      pill(records.length+' people · '+roots.length+' reporting groups')+'</div>'+
      '<div class="team-hierarchy-layout"><div class="team-structure">'+
      '<div class="eyebrow" style="margin:0 0 10px">REPORTING TREE</div>'+
      '<ul class="team-tree">'+roots.map(n=>node(n,new Set())).join('')+'</ul>'+
      '<p class="form-note">Select a person in the tree to edit their position or who they report to. Different events can have different structures.</p></div>'+
      '<form id="team-hierarchy-form" class="team-editor"><div class="eyebrow">SELECTED PERSON</div>'+
      '<h3>'+esc(selected.person.name)+'</h3>'+
      '<p class="muted">'+esc(selected.roles.map(a=>a.role).join(', '))+'</p>'+
      '<input type="hidden" name="personId" value="'+esc(selected.person.id)+'">'+
      '<label>Position in this team<select name="position">'+TEAM_POSITIONS.map(p=>'<option value="'+esc(p)+'" '+(selected.position===p?'selected':'')+'>'+esc(p)+'</option>').join('')+'</select></label>'+
      '<label>Reports to<select name="reportsTo"><option value="">Nobody · top of reporting tree</option>'+
      supervisors.map(n=>'<option value="'+esc(n.person.id)+'" '+(manager===n.person.id?'selected':'')+'>'+esc(n.person.name)+' · '+esc(n.position)+'</option>').join('')+'</select></label>'+
      '<label>Responsibilities / notes<textarea name="notes" rows="3" maxlength="320" placeholder="Optional team responsibilities">'+esc(selected.notes)+'</textarea></label>'+
      '<div class="team-report-summary"><strong>'+direct.length+' direct report'+(direct.length===1?'':'s')+'</strong><p>'+
      (direct.map(x=>esc(x.person.name)).join(', ')||'No one currently reports directly to this person.')+'</p></div>'+
      '<button class="btn primary" type="submit">Save reporting line</button>'+
      '<p class="form-note">Reporting lines describe coordination, not application permissions or safety approvals.</p></form></div></section>';
  }

  function taskOwnership(e){
    const tasks=published(e)?.tasks||[],members=crewMembers(e);
    return '<section class="panel section"><div class="section-head"><h2>Assign installation tasks</h2>'+pill(tasks.filter(t=>taskOwner(e,t.id)).length+' / '+tasks.length+' assigned')+'</div>'+
      '<p class="muted">Assign each published instruction to a named team member. If someone is assigned outside their event area, a warning will appear. These are organisational assignments only; they do not grant access or certify safe completion.</p>'+
      (members.length?'<div class="table-scroll"><table><thead><tr><th>Task</th><th>Area</th><th>State</th><th>Assigned person</th></tr></thead><tbody>'+
      tasks.map(t=>'<tr><td>'+esc(t.title)+(taskOwnerAreaOK(e,t)?'':' '+pill('Check assigned area','warn'))+'</td><td>'+esc(areaName(e,t.areaId,published(e).snapshot))+'</td><td>'+esc(t.state)+'</td><td><select aria-label="Assign '+esc(t.title)+'" data-act="task-owner" data-id="'+esc(t.id)+'"><option value="">Unassigned</option>'+members.map(m=>'<option value="'+esc(m.id)+'" '+(taskOwner(e,t.id)===m.id?'selected':'')+'>'+esc(m.name)+'</option>').join('')+'</select></td></tr>').join('')+
      '</tbody></table></div>':'<div class="empty">Add a person to the event team above before assigning tasks.</div>')+
      '</section>';
  }

  function eventOperations(e){return org().operations[e?.id]||{};}
  function eventWindow(e){
    if(!e)return null;
    const o=eventOperations(e),first=o.loadInDate||e.date,last=o.packOutDate||e.date,
      startTime=o.loadInTime||'00:00',endTime=o.packOutTime||'23:59';
    const start=new Date(first+'T'+startTime+':00'),end=new Date(last+'T'+endTime+':00');
    if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||start>=end)return null;
    return {start:start.getTime(),end:end.getTime(),provisional:!(o.loadInDate&&o.packOutDate),startLabel:first+' '+startTime,endLabel:last+' '+endTime};
  }
  function overlap(a,b){return !!(a&&b&&a.start<b.end&&b.start<a.end);}
  function allocationRows(e){
    const stocks=db.equipment||[],w=eventWindow(e),jobs=events().filter(x=>x.id!==e.id&&x.status==='Confirmed'&&overlap(w,eventWindow(x)));
    const assigned=(e.kit||[]),requested=id=>assigned.filter(x=>x.id===id).reduce((sum,x)=>sum+Math.max(0,Math.floor(num(x.qty))),0);
    const suppliers=org().assignments.filter(a=>a.eventId===e.id&&a.equipmentId&&a.quantity>0);
    return stocks.map(gear=>{
      const owned=Math.max(0,Math.floor(num(gear.owned))),planned=requested(gear.id);
      const reserved=jobs.reduce((sum,x)=>sum+(x.kit||[]).filter(k=>k.id===gear.id).reduce((v,k)=>v+Math.max(0,Math.floor(num(k.qty))),0),0);
      const confirmedSupplier=suppliers.filter(x=>x.equipmentId===gear.id).reduce((sum,x)=>sum+Math.max(0,Math.floor(num(x.quantity))),0);
      const available=Math.max(0,owned-reserved),covered=available+confirmedSupplier;
      const placed=(plan(e).items||[]).filter(item=>item.eqId===gear.id).length;
      return {gear,owned,planned,reserved,available,covered,confirmedSupplier,shortfall:Math.max(0,planned-covered),placed};
    });
  }
  function logistics(e){
    const ops=eventOperations(e),w=eventWindow(e),rows=allocationRows(e),short=rows.filter(x=>x.shortfall>0),gap=rows.filter(x=>x.placed>x.planned);
    return '<section class="panel section"><div class="section-head"><div><h2>Equipment and logistics</h2>'+
      '<p class="muted">Allocate event stock and check overlaps with confirmed bookings.</p></div>'+
      pill(short.length+' stock gaps',short.length?'warn':'good')+'</div>'+
      '<div class="notice info section">Planning estimate only. Stock is counted by catalogue quantity, not individual serial numbers. Supplier commitments are unverified, and date/time availability requires dispatch, return and transport allowances.</div>'+
      '<div class="grid cols2 section"><form id="operations-form" class="form-grid">'+
      '<label>Load-in date<input type="date" class="input" name="loadInDate" value="'+esc(ops.loadInDate||e.date||'')+'" required></label>'+
      '<label>Load-in time<input type="time" class="input" name="loadInTime" value="'+esc(ops.loadInTime||'08:00')+'" required></label>'+
      '<label>Pack-down / return date<input type="date" class="input" name="packOutDate" value="'+esc(ops.packOutDate||e.date||'')+'" required></label>'+
      '<label>Pack-down / return time<input type="time" class="input" name="packOutTime" value="'+esc(ops.packOutTime||'23:00')+'" required></label>'+
      '<div class="wide"><button class="btn" type="submit">Save event logistics window</button></div></form>'+
      '<div class="area-card"><h3>Availability assumptions</h3><p class="muted">'+(w?'From '+esc(w.startLabel)+' until '+esc(w.endLabel):'The current interval is invalid. Set an end after the start.')+'</p>'+
      (w?.provisional?pill('Unconfirmed schedule','warn'):'')+
      '<p class="form-note">Only other Confirmed bookings with intersecting time intervals reserve owned stock. Enquiries do not reserve it. Enter the full period gear is away from stock, including transport and returns.</p></div></div>'+
      (rows.length?'<div class="table-scroll"><table><thead><tr><th>Equipment</th><th>Requested</th><th>Owned</th><th>Other confirmed reservations</th><th>Supplier allocations</th><th>Gap</th></tr></thead><tbody>'+
      rows.map(x=>'<tr><td><strong>'+esc(x.gear.name)+'</strong><small>'+esc(x.gear.category||'Equipment')+(x.placed?' · '+x.placed+' linked placements':'')+'</small></td>'+
        '<td><input class="input" type="number" data-act="kit-quantity" data-id="'+esc(x.gear.id)+'" min="0" max="9999" step="1" value="'+x.planned+'" style="width:79px" aria-label="Requested '+esc(x.gear.name)+'"></td>'+
        '<td>'+x.owned+'</td><td>'+x.reserved+'</td><td>'+x.confirmedSupplier+'</td><td>'+(x.shortfall?pill('Short '+x.shortfall,'bad'):(x.placed>x.planned?pill('Kit below placement','warn'):pill('Covered','good')))+'</td></tr>').join('')+'</tbody></table></div>'+
      '<p class="form-note">Supplier allocations represent stated quantities, not verified reservations. Review supplier availability and equipment suitability before confirming any event.</p>':
      '<div class="empty">No equipment in the catalogue. Add equipment under Equipment in the classic studio workspace.</div>')+
      (gap.length?'<div class="notice section">Linked placements exceed the event kit for: '+gap.map(x=>esc(x.gear.name)).join(', ')+'. Review the kit and placed objects.</div>':'')+
      '<div class="row"><a class="btn" href="index.html#/bookings/'+encodeURIComponent(e.id)+'">Edit event booking ↗</a>'+
      '<a class="btn" href="index.html#/equipment">Manage equipment catalogue ↗</a></div></section>';
  }


  const PRODUCTION_TABS=[['team','Team'],['logistics','Equipment & logistics'],['installation','Installation'],['show','Show schedule'],['closeout','Closeout']];
  function productionTabs(){
    return '<nav class="tabs production-tabs section no-print" role="tablist" aria-label="Production work areas">'+
      PRODUCTION_TABS.map(([key,label])=>
        '<button type="button" class="tab '+(ui.productionTab===key?'active':'')+'" role="tab" aria-selected="'+(ui.productionTab===key)+'" aria-controls="production-'+key+'" data-act="production-tab" data-id="'+key+'">'+esc(label)+'</button>').join('')+'</nav>';
  }
  function productionPane(key){return '<section id="production-'+key+'" role="tabpanel" aria-label="'+esc(PRODUCTION_TABS.find(x=>x[0]===key)[1])+'" class="production-pane '+(ui.productionTab===key?'active':'')+'">';}


  let cueEditorOpen=false;
  function closeCueEditor(){document.querySelector('[data-cue-editor-overlay]')?.remove();cueEditorOpen=false;}
  function openCueEditor(e,cue){
    closeCueEditor();
    const spots=areas(e),looks=org().looks[e.id]||[];
    const markup='<div class="venue-quick-backdrop" data-cue-editor-overlay><section class="venue-quick-dialog" role="dialog" aria-modal="true" aria-label="Edit show cue">'+
      '<header class="venue-picker-top"><div><h2>Edit show cue</h2><p class="venue-hint">This only changes the planning schedule. It does not control live equipment.</p></div>'+
      '<button type="button" class="btn" data-act="cue-editor-close" aria-label="Close">×</button></header>'+
      '<form id="cue-editor-form" class="venue-quick-form"><input type="hidden" name="id" value="'+esc(cue.id)+'">'+
      '<div class="form-grid"><label>Time<input class="input" name="time" type="time" required value="'+esc(cue.time)+'"></label>'+
      '<label>Space<select name="areaId">'+spots.map(x=>'<option value="'+esc(x.id)+'" '+(cue.areaId===x.id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label></div>'+
      '<label>Cue or activity<input class="input" name="title" required maxlength="160" value="'+esc(cue.title)+'"></label>'+
      '<label>Draft lighting look<select name="lookId"><option value="">No linked look</option>'+
      looks.map(x=>'<option value="'+esc(x.id)+'" '+(cue.lookId===x.id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label>'+
      '<p class="venue-hint">Editing a completed cue resets its status to Planned, so its updated details can be checked again.</p>'+
      '<div class="venue-quick-actions"><button class="btn" type="button" data-act="cue-editor-close">Cancel</button>'+
      '<button class="btn primary" type="submit">Save cue</button></div></form></section></div>';
    document.body.insertAdjacentHTML('beforeend',markup);cueEditorOpen=true;
    document.querySelector('#cue-editor-form input[name="title"]')?.focus();
  }

  function production(e,c){
    const p=published(e),a=org().assignments.filter(x=>x.eventId===e.id);
    const done=c.all?Math.round(c.installed/c.all*100):0;
    return hero('PRODUCTION WORKSPACE','Run the production','People, suppliers, responsibilities, installation readiness, show cues and approvals in one place.',
      '<button class="btn primary" data-act="publish">Publish current crew revision</button>')+
      changeNotice(e)+changePanel(e)+
      '<div class="stats">'+stat('Team & suppliers',a.length,'Event-specific roles')+stat('Installation',done+'%','Reported installed')+stat('Technical checks',c.verified,'Marked verified')+stat('Open issues',c.issues,'Awaiting response')+'</div>'+
      productionTabs()+productionPane('team')+teamStructure(e)+
      '<div class="grid cols2 section"><section class="panel"><div class="section-head"><h2>Event team</h2>'+pill(a.length+' assignments')+'</div>'+
      '<div class="stack">'+(a.length?a.map(x=>'<div class="linkrow"><div><strong><a href="#/entities/'+encodeURIComponent(x.entityId)+'" data-act="profile" data-id="'+esc(x.entityId)+'">'+esc(aname(x.entityId))+'</a></strong><div class="detail">'+esc(x.role)+' · '+esc(x.areaId==='all'?'Entire event':areaName(e,x.areaId))+(x.responsibility?' · '+esc(x.responsibility):'')+(x.equipmentId&&x.quantity?' · '+esc(x.quantity)+' × '+esc((db.equipment||[]).find(g=>g.id===x.equipmentId)?.name||'Unknown equipment'):'')+'</div></div><button class="btn small danger" data-act="remove-assignment" data-id="'+esc(x.id)+'">Remove</button></div>').join(''):'<div class="empty">No assignments yet.</div>')+'</div>'+
      '<details class="workspace-disclosure"><summary>+ Add person or supplier</summary><div class="disclosure-body"><form id="assign-form" class="form-grid">'+
      '<label>Person or organisation<select name="entityId" required>'+org().entities.filter(x=>['Person','Organisation'].includes(x.kind)).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>'+
      '<label>Role<select name="role"><option>Production manager</option><option>Lighting designer</option><option>Lighting technician</option><option>Stagehand</option><option>DJ</option><option>Promoter</option><option>Event organiser</option><option>Audio technician</option><option>Video technician</option><option>Supplier</option><option>Other</option></select></label>'+
      '<label>Responsibility / notes<input class="input" name="responsibility" maxlength="180" placeholder="e.g. Patch outdoor stage"></label>'+
      '<label>Assigned area<select name="areaId"><option value="all">Entire event</option>'+areas(e).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>'+
      '<label>Equipment supplied (optional)<select name="equipmentId"><option value="">No equipment linked</option>'+(db.equipment||[]).map(g=>'<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>').join('')+'</select></label><label>Quantity supplied (optional)<input class="input" type="number" name="quantity" min="0" max="9999" step="1" value="0"></label>'+'<div class="wide"><button class="btn primary" type="submit">Add to event team</button></div></form></div></details></section>'+
      '<section class="panel"><div class="section-head"><h2>Installation readiness</h2>'+pill('Revision '+(p?.revision||'—'))+'</div>'+
      '<div class="row between"><span class="muted">Installed tasks</span><strong>'+c.installed+' / '+c.all+'</strong></div><div class="progress" style="margin:13px 0"><div style="width:'+done+'%"></div></div>'+
      '<div class="row between"><span class="muted">Independently verified</span><strong>'+c.verified+' / '+c.all+'</strong></div>'+
      '<div class="sep"></div><h3>Open issues</h3>'+
      (org().issues.filter(x=>x.eventId===e.id&&x.status!=='Resolved').map(x=>'<div class="linkrow"><div><strong>'+esc(x.note)+'</strong><div class="detail">'+esc(x.taskId||'General issue')+' · '+new Date(x.at).toLocaleString('en-AU')+'</div></div><button class="btn small" data-act="resolve-issue" data-id="'+esc(x.id)+'">Resolve</button></div>').join('')||'<p class="muted">No open issues.</p>')+
      '<div class="sep"></div><button class="btn" data-act="report" data-id="">+ Report general issue</button></section></div></section>'+
      productionPane('logistics')+logistics(e)+'</section>'+productionPane('installation')+taskOwnership(e)+productionAcknowledgements(e)+'</section>'+productionPane('show')+
      '<section class="panel section"><div class="section-head"><h2>Run of show</h2>'+pill((org().show[e.id]||[]).length+' cues')+'</div>'+
      '<p class="muted">A lightweight production cue list. This does not drive live lighting consoles or control show-critical systems.</p>'+
      '<div class="table-scroll"><table><thead><tr><th>Time</th><th>Cue / activity</th><th>Area</th><th>Draft look</th><th>Status</th><th></th></tr></thead><tbody>'+
      (org().show[e.id]||[]).slice().sort((a,b)=>a.time.localeCompare(b.time)).map(x=>'<tr><td>'+esc(x.time)+'</td><td>'+esc(x.title)+'</td><td>'+esc(areaName(e,x.areaId))+'</td><td>'+esc((org().looks[e.id]||[]).find(l=>l.id===x.lookId)?.name||'—')+'</td><td>'+pill(x.done?'Done':'Planned',x.done?'good':'')+'</td><td><div class="row"><button class="btn small" data-act="toggle-cue" data-id="'+esc(x.id)+'">'+(x.done?'Reopen':'Mark done')+'</button><button class="btn small" data-act="edit-cue" data-id="'+esc(x.id)+'">Edit</button><button class="btn small danger" data-act="delete-cue" data-id="'+esc(x.id)+'">Remove</button></div></td></tr>').join('')+'</tbody></table></div>'+
      '<details class="workspace-disclosure"><summary>+ Add show cue</summary><div class="disclosure-body"><form id="cue-form" class="form-grid"><label>Time<input class="input" type="time" name="time" required value="19:00"></label><label>Area<select name="areaId">'+areas(e).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>'+
      '<label class="wide">Cue or activity<input class="input" name="title" required maxlength="160" placeholder="e.g. Outdoor stage changeover"></label><label class="wide">Optional draft lighting look<select name="lookId"><option value="">No linked look</option>'+(org().looks[e.id]||[]).map(l=>'<option value="'+esc(l.id)+'">'+esc(l.name)+'</option>').join('')+'</select></label><div class="wide"><button class="btn primary" type="submit">Add cue</button></div></form></div></details></section>'+
      '<section class="panel"><h2>Published revisions</h2>'+([...(p?.history||[]),...(p?[{revision:p.revision,at:p.at,tasks:p.tasks}]:[])].reverse().map(x=>'<div class="linkrow"><div><strong>Revision '+x.revision+'</strong><div class="detail">'+new Date(x.at).toLocaleString('en-AU')+' · '+(x.tasks?.length||0)+' tasks</div></div>'+pill(x.revision===p.revision?'Current':'Archived')+'</div>').join('')||'<div class="empty">No revisions yet.</div>')+'</section></section>'+productionPane('closeout')+
      window.PhaenomenonLifecycleUI.closeoutPanel(db,e)+'</section>';
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
      (ent.legacyType==='event'?'<div class="sep"></div><h3>Production team &amp; suppliers</h3><div class="stack">'+(org().assignments.filter(a=>a.eventId===ent.legacyId).map(a=>'<button class="linkrow" data-act="profile" data-id="'+esc(a.entityId)+'"><div><strong>'+esc(aname(a.entityId))+'</strong><div class="detail">'+esc(a.role)+' · '+esc(a.areaId==='all'?'Entire event':areaName(events().find(x=>x.id===ent.legacyId),a.areaId))+(a.equipmentId&&a.quantity?' · '+esc(a.quantity)+' × '+esc((db.equipment||[]).find(x=>x.id===a.equipmentId)?.name||'equipment'):'')+'</div></div>→</button>').join('')||'<p class="muted">No team linked.</p>')+'</div>':'')+
      profileReporting(ent)+
      '<div class="sep"></div><h3>Event roles</h3><div class="stack">'+(al.map(x=>'<div class="tag">'+esc(x.role)+' · '+esc(events().find(t=>t.id===x.eventId)?.title||'Unknown event')+(x.equipmentId&&x.quantity?' · '+esc(x.quantity)+' × '+esc((db.equipment||[]).find(g=>g.id===x.equipmentId)?.name||'Unknown equipment'):'')+'</div>').join('')||'<p class="muted">No event assignments.</p>')+'</div>'+
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
    return hero('DIRECTORY','People, places and organisations','Canonical records with aliases, event-specific roles, typed relationships and navigable profiles.')+
      '<div class="side-by-side"><div><section class="panel section"><div class="section-head"><h2>Browse entities</h2>'+pill(all.length+' records')+'</div>'+
      '<div class="form-grid section"><label>Search name, alias or notes<input class="input" id="entity-search" placeholder="Search entities" value="'+esc(ui.query)+'"></label>'+
      '<label>Entity type<select id="entity-filter">'+['All','Person','Organisation','Venue','Space','Event'].map(x=>'<option '+(ui.entityType===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label></div>'+
      '<div class="stack">'+(all.map(x=>'<button class="linkrow" data-act="profile" data-id="'+esc(x.id)+'"><div><strong>'+esc(x.name)+'</strong><div class="detail">'+esc(x.kind)+(x.aliases?.length?' · '+esc(x.aliases.join(', ')):'')+'</div></div><span class="chev">›</span></button>').join('')||'<div class="empty">No matching entities.</div>')+'</div></section>'+
      '<section class="panel"><details class="workspace-disclosure"><summary>+ Add person or organisation</summary><div class="disclosure-body"><p class="muted">Create a person or organisation once, then assign different roles to each event.</p><form id="entity-form" class="form-grid">'+
      '<label>Name<input class="input" name="name" maxlength="140" required placeholder="Display name"></label>'+
      '<label>Type<select name="kind"><option>Person</option><option>Organisation</option></select></label>'+
      '<label class="wide">Aliases (comma separated)<input class="input" name="aliases" placeholder="Other names or abbreviations"></label>'+
      '<label class="wide">Notes<textarea name="notes" maxlength="4000"></textarea></label>'+
      '<div class="wide"><button class="btn primary" type="submit">Create record</button></div></form><p class="form-note">Venues and spaces are managed in the reusable Venue library.</p>'+
      '<a class="btn small" href="#/home/venue/'+encodeURIComponent(e?.id||'')+'">Manage venues &amp; spaces</a></div></details></section></div>'+
      (selected?entityProfile(selected,e):'<section class="panel inspector"><div class="empty">Select an entity to see its profile, aliases, relationships, roles and linked events.</div></section>')+'</div>';
  }
  function route(){
    document.body?.classList?.remove('ph-mobile-menu-open');
    const parts=location.hash.replace(/^#\/?/,'').split('/'),view=parts[0];
    ui.view=['dashboard','events','builder','home','design','technical','crew','production','entities'].includes(view)?view:'dashboard';
    ui.builderFocus=ui.view==='builder'&&['brief','spaces','design','equipment','connections','team','review'].includes(parts[2])?parts[2]:'';
    ui.homeVenueOpen=(ui.view==='home'&&parts[1]==='venue')||(ui.view==='builder'&&ui.builderFocus==='spaces');
    const routeEvent=ui.view==='home'&&parts[1]==='venue'?parts[2]:ui.view==='production'&&['team','logistics','installation','show','closeout'].includes(parts[1])?parts[2]:['entities','events'].includes(ui.view)?null:parts[1];
    if(ui.view==='production'&&['team','logistics','installation','show','closeout'].includes(parts[1]))ui.productionTab=parts[1];
    if(routeEvent&&events().some(x=>x.id===decodeURIComponent(routeEvent)))ui.eventId=decodeURIComponent(routeEvent);
    if(ui.view==='entities'&&parts[1]&&entity(decodeURIComponent(parts[1]))){
      const id=decodeURIComponent(parts[1]);if(ui.entityId!==id){ui.entityId=id;if(ui.history[ui.histIndex]!==id){ui.history=ui.history.slice(0,ui.histIndex+1);ui.history.push(id);ui.histIndex=ui.history.length-1;}}
    }
    savePreferences();render();
  }
  function selectActiveEvent(id){
    if(!events().some(x=>x.id===id))return;
    ui.eventId=id;ui.area='all';ui.crewPerson='all';savePreferences();
    const encoded=encodeURIComponent(id);
    const target=ui.view==='builder'?'#/builder/'+encoded+(ui.builderFocus?'/'+ui.builderFocus:''):
      ui.view==='home'&&ui.homeVenueOpen?'#/home/venue/'+encoded:
      ['home','design','technical','crew','production'].includes(ui.view)?'#/'+ui.view+'/'+encoded:'#/builder/'+encoded;
    location.hash=target;route();
  }
  document.addEventListener('click',ev=>{
    const menuLink=ev.target?.closest?.('#production-navigation a[href]');
    if(menuLink?.tagName==='A'){
      document.getElementById('production-rail')?.classList?.remove('is-expanded');
      document.body?.classList?.remove('ph-mobile-menu-open');
      return;
    }
    const el=ev.target.closest('[data-act]');if(!el||(!$.contains(el)&&!el.closest('[data-venue-quick-overlay]')&&!el.closest('[data-builder-event-overlay]')&&!el.closest('[data-cue-editor-overlay]')))return;
    const action=el.dataset.act,id=el.dataset.id,e=current(),p=published(e);
    ev.preventDefault();
    if(action==='cue-editor-close'){closeCueEditor();return;}
    if(action==='edit-cue'){const cue=(org().show[e.id]||[]).find(x=>x.id===id);if(cue)openCueEditor(e,cue);return;}
    if(action==='delete-cue'){
      const cue=(org().show[e.id]||[]).find(x=>x.id===id);
      if(cue&&confirm('Remove show cue "'+cue.title+'"? This does not delete any draft lighting looks.')){
        org().show[e.id]=(org().show[e.id]||[]).filter(x=>x.id!==id);
        if(store())notice('Show cue removed from the planning schedule.');
      }return;
    }
    if(action==='lifecycle-close'){
      const result=window.PhaenomenonLifecycle.closeEvent(db,e);
      if(result.error){notice(result.error);return;}
      if(store())notice('Event closed. All closeout requirements were recorded as complete or not applicable.');
      return;
    }
    if(action==='lifecycle-reopen'){
      if(!confirm('Reopen this event for editing? Existing checklist records will be retained.'))return;
      const result=window.PhaenomenonLifecycle.reopenEvent(e);
      if(result.error){notice(result.error);return;}
      if(store())notice('Event reopened for additional changes.');
      return;
    }
    if(action==='builder-new-close'){closeBuilderEvent();return;}
    if(action==='builder-new'){openBuilderEvent();return;}
    if(action==='builder-reconcile-kit'){
      const result=window.PhaenomenonEventBuilder?.reconcileKit(db,e.id);
      if(!result||result.error){notice(result?.error||'Unable to update event kit.');return;}
      if(store())notice(result.updated?'Updated '+result.updated+' event kit allocation(s) to match linked placed objects.':'Kit already covers linked placed objects.');
      return;
    }
    if(action==='venue-quick-close'){productionQuickClose();return;}
    if(action==='venue-create'){productionQuickOpen('venue');return;}
    if(action==='space-create'){productionQuickOpen('space');return;}
    if(action==='venue-layout-reviewed'){
      const v=venue(e),selected=areas(e),p=plan(e),G=window.PhaenomenonGeometry,M=window.PhaenomenonMultiSpace;
      const outside=(p.items||[]).filter(item=>{
        const space=selected.find(x=>x.id===item.areaId);
        if(!space)return true;
        if(G&&M?.polygon)return !G.contains(M.polygon(space),{x:num(item.x),y:num(item.y)});
        return num(item.x)<num(space.x)||num(item.x)>num(space.x)+num(space.width)||
          num(item.y)<num(space.y)||num(item.y)>num(space.y)+num(space.length);
      });
      if(outside.length){
        notice('Cannot mark Venue layout reviewed: '+outside.length+' placed item(s) are outside their assigned, selected Space. Reposition them in the 3D planner first.');
        return;
      }
      p.needsVenueReview=false;
      if(store())notice('Venue placement review marked complete. Engineering and technical safety verification remain separate.');
      return;
    }
    if(action==='toggle-rail'||action==='close-rail'){
      const rail=document.getElementById('production-rail');
      const open=action==='toggle-rail'?!rail?.classList?.contains('is-expanded'):false;
      rail?.classList?.toggle('is-expanded',open);
      document.body?.classList?.toggle('ph-mobile-menu-open',open);
      rail?.querySelector('.rail-mobile-toggle')?.setAttribute('aria-expanded',open?'true':'false');
      document.querySelector('.production-mobile-tabs .mobile-more-tab')?.setAttribute('aria-expanded',open?'true':'false');
      if(open)rail?.querySelector('nav a[href]')?.focus();
      else if(action==='close-rail')document.querySelector('.production-mobile-tabs .mobile-more-tab')?.focus();
      return;
    }
    if(action==='print'){window.print();return;}
    if(action==='import-backup'){
      document.getElementById('production-import-file')?.click();
      return;
    }
    if(action==='restore-point'){
      const point=window.PhaenomenonWorkspaceSafety?.readPoint(localStorage,id);
      if(!point||point.error){notice(point?.error||'No local recovery point found.');return;}
      const summary=point.checked?.summary||{};
      if(confirm('Restore the local recovery point from '+new Date(point.at).toLocaleString('en-AU')+'?\n\n'+
        summary.events+' events · '+summary.venues+' venues · '+summary.clients+' clients\n\n'+
        'This replaces the current workspace on this browser. Export a JSON backup first if needed.')){
        replaceWorkspace(point.workspace,'the selected recovery point');
      }return;
    }
    if(action==='export-backup'){
      try{
        const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download='phaenomenon-workspace-'+new Date().toISOString().slice(0,10)+'.json';
        document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),2000);
        notice('Workspace backup exported. Store it somewhere secure.');
      }catch(error){notice('Could not export a backup. Try the classic Settings export.');}
      return;
    }
    if(action==='ack-pack'){
      if(ui.crewPerson==='all'){notice('Select a crew member first.');return;}
      if(acknowledgePack(e,ui.crewPerson)){
        if(store())notice('Pack review recorded for '+aname(ui.crewPerson)+' on revision '+published(e).revision+'.');
      }else notice('Choose a team member with a current event assignment.');
      return;
    }
    if(action==='review-changes'){location.hash='#/design';route();return;}
    if(action==='profile'){navigateProfile(id);return;}
    if(action==='entity-back'||action==='entity-forward'){
      const next=ui.histIndex+(action==='entity-back'?-1:1);
      if(next>=0&&next<ui.history.length){ui.histIndex=next;navigateProfile(ui.history[next],true);}return;
    }
    if(action==='select-event'){selectActiveEvent(id);return;}
    if(action==='schedule-mode'){ui.scheduleMode=id==='calendar'?'calendar':'list';savePreferences();render();return;}
    if(action==='schedule-today'){ui.scheduleMonth=monthKey(new Date());render();return;}
    if(action==='schedule-selected'){if(validEventDate(e?.date))ui.scheduleMonth=e.date.slice(0,7);render();return;}
    if(action==='schedule-month'){const key=/^\d{4}-(0[1-9]|1[0-2])$/.test(ui.scheduleMonth)?ui.scheduleMonth:monthKey(new Date());const [y,m]=key.split('-').map(Number);ui.scheduleMonth=monthKey(new Date(y,m-1+(id==='-1'?-1:1),1));render();return;}
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
    if(action==='production-tab'){if(PRODUCTION_TABS.some(x=>x[0]===id)){ui.productionTab=id;store();render();}return;}
    if(action==='team-select'){ui.teamPerson=id;render();return;}
    if(action==='remove-assignment'){
      const x=org().assignments.find(x=>x.id===id&&x.eventId===e.id);
      if(x&&confirm('Remove this event role? The person and their other event roles remain.')){
        org().assignments=org().assignments.filter(y=>y.id!==id);
        if(!org().assignments.some(y=>y.eventId===e.id&&y.entityId===x.entityId)){
          const hierarchy=org().teamHierarchy[e.id]||{},replacement=hierarchy[x.entityId]?.reportsTo||'';
          Object.values(hierarchy).forEach(v=>{if(v.reportsTo===x.entityId)v.reportsTo=replacement;});
          delete hierarchy[x.entityId];
          const ta=org().taskAssignments[e.id]||{};
          Object.keys(ta).forEach(taskId=>{if(ta[taskId]===x.entityId)delete ta[taskId];});
          if(ui.teamPerson===x.entityId)ui.teamPerson='';
          if(ui.crewPerson===x.entityId)ui.crewPerson='all';
        }
        store();render();
      }
      return;
    }
    if(action==='alias'){const x=entity(id);if(!x)return;const raw=prompt('New alias for '+x.name+':');const v=clean(raw).slice(0,140);if(v&&!x.aliases.some(y=>y.toLowerCase()===v.toLowerCase())){x.aliases.push(v);store();render();}return;}
    if(action==='rename'){const x=entity(id);if(!x)return;const v=clean(prompt('Entity display name:',x.name)).slice(0,140);if(v){x.name=v;x.customName=true;store();render();}return;}
  });
  document.addEventListener('change',ev=>{
    const el=ev.target;
    if(el.id==='production-import-file'){
      const file=el.files?.[0];if(!file)return;
      if(file.size>5000000){alert('The workspace JSON file is too large for this browser import.');el.value='';return;}
      const reader=new FileReader();
      reader.onload=()=>{
        try{
          const parsed=JSON.parse(String(reader.result||''));
          const check=window.PhaenomenonWorkspaceSafety?.inspect(parsed);
          if(!check?.valid)throw Error(check?.error||'Invalid Phaenomenon backup');
          const summary=check.summary;
          const warnings=check.warnings?.length?'\n\nReferences to review:\n'+check.warnings.slice(0,5).join('\n'):'';
          if(confirm('Import '+summary.events+' events, '+summary.venues+' venues, '+summary.clients+' clients and '+summary.equipment+' equipment records?'+
            '\n\nThis replaces the workspace in this browser. Keep a separate JSON backup if needed.'+warnings)){
            replaceWorkspace(parsed,'the JSON file');
          }
        }catch(err){alert('Cannot import workspace: '+err.message);}
        el.value='';
      };
      reader.onerror=()=>{alert('The file could not be read.');el.value='';};
      reader.readAsText(file);
      return;
    }
    if(!$.contains(el))return;
    if(el.id==='role-picker'){ui.role=el.value;store();location.hash='#/'+({lead:'home',tech:'technical',crew:'crew',manager:'production'}[ui.role]||'home');route();}
    if(el.id==='production-venue-select'){
      if(el.value==='__create__'){el.value=el.dataset.currentVenue||'';productionQuickOpen('venue');}
      else renderVenuePicker(el.value);
      return;
    }
    if(el.id==='event-picker'){selectActiveEvent(el.value);return;}
    if(el.id==='area-picker'){ui.area=el.value;store();render();}
    if(el.id==='crew-person-picker'){ui.crewPerson=el.value;store();render();}
    if(el.id==='entity-filter'){ui.entityType=el.value;render();}
    if(el.dataset.act==='builder-link-object'){
      const e=current(),item=plan(e).items?.find(x=>x.id===el.dataset.id);
      if(!item)return;
      if(el.value==='__skip__'){
        delete item.eqId;item.kitTracked=false;
      }else if(el.value==='__new__'){
        const same=db.equipment?.find(x=>x.name.trim().toLocaleLowerCase('en-AU')===String(item.name||'').trim().toLocaleLowerCase('en-AU'));
        if(same){
          if(!confirm('An equipment catalogue item with the same name exists. Link this placed object to '+same.name+'?'))return;
          item.eqId=same.id;item.kitTracked=true;
        }else{
          if(!confirm('Create a reusable equipment catalogue placeholder for "'+item.name+'"?\n\nOwned quantity and hire rate will start at zero. Check the specifications independently.'))return;
          const id=uid('eq');
          if(!Array.isArray(db.equipment))db.equipment=[];
          const category=({light:'Lighting',audio:'Audio',video:'Video',control:'Control',network:'Network',power:'Power',stage:'Staging',rigging:'Rigging'})[item.kind]||'Other';
          db.equipment.push({id,name:String(item.name||'Equipment').trim().slice(0,120),category,owned:0,rate:0,watts:Math.max(0,num(item.watts))});
          item.eqId=id;item.kitTracked=true;
        }
      }else if(el.value===''){
        delete item.eqId;item.kitTracked=true;
      }else{
        const gear=db.equipment?.find(x=>x.id===el.value);
        if(!gear){notice('Choose an existing equipment type.');return;}
        item.eqId=gear.id;item.kitTracked=true;
        if(item.watts==null&&Number.isFinite(Number(gear.watts)))item.watts=Number(gear.watts);
      }
      if(store())notice('Layout equipment link updated. Review kit allocation and any published instructions.');
      return;
    }
    if(el.dataset.act==='kit-quantity'){
      const e=current(),id=el.dataset.id;
      if(!db.equipment.some(x=>x.id===id))return;
      const qty=Math.min(9999,Math.max(0,Math.floor(num(el.value))));
      if(!Array.isArray(e.kit))e.kit=[];
      e.kit=e.kit.filter(x=>x.id!==id);
      if(qty)e.kit.push({id,qty});
      if(store())render();
    }
    if(el.dataset.act==='task-owner'){
      const e=current(),t=published(e)?.tasks.find(x=>x.id===el.dataset.id);
      if(!t)return;
      const eligible=crewMembers(e).some(x=>x.id===el.value);
      if(el.value&&!eligible){notice('Add the person to the event team first.');return;}
      if(!org().taskAssignments[e.id])org().taskAssignments[e.id]={};
      if(el.value)org().taskAssignments[e.id][t.id]=el.value;
      else delete org().taskAssignments[e.id][t.id];
      store();render();
    }
  });
  document.addEventListener('input',ev=>{
    const el=ev.target;if(!$.contains(el))return;
    if(el.id==='entity-search'){ui.query=el.value;const start=el.selectionStart;render();const next=document.getElementById('entity-search');next?.focus();next?.setSelectionRange(start,start);}
  });
  document.addEventListener('submit',ev=>{
    const f=ev.target;
    if(f.id==='cue-editor-form'){
      ev.preventDefault();
      const data=new FormData(f),val=k=>clean(data.get(k)),e=current();
      const cue=(org().show[e.id]||[]).find(x=>x.id===val('id'));
      if(!cue){closeCueEditor();notice('This cue no longer exists.');return;}
      const t=val('time'),title=val('title').slice(0,160),space=areas(e).find(x=>x.id===val('areaId'));
      if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)||!title||!space){alert('Enter a valid time, cue title and Space.');return;}
      cue.time=t;cue.title=title;cue.areaId=space.id;
      cue.lookId=(org().looks[e.id]||[]).some(x=>x.id===val('lookId'))?val('lookId'):null;
      cue.done=false;
      if(store()){closeCueEditor();notice('Show cue updated. Completion reset to Planned.');}
      return;
    }
    if(f.id==='event-closeout-form'){
      ev.preventDefault();
      const e=current(),L=window.PhaenomenonLifecycle;
      if(!e){notice('Select an event first.');return;}
      const draft=JSON.parse(JSON.stringify(e)),data=new FormData(f);
      for(const task of L.effectiveCloseout(db,draft)){
        if(task.source==='invoices')continue;
        const state=String(data.get('status_'+task.id)||'pending');
        const note=String(data.get('note_'+task.id)||'');
        const result=L.updateTask(db,draft,task.id,state,note);
        if(result.error){notice(task.label+': '+result.error);return;}
      }
      e.lifecycle.closeout=draft.lifecycle.closeout;
      if(store())notice('Closeout checklist saved. Completion is recorded manually unless linked invoices provide the status.');
      return;
    }
    if(f.id==='builder-new-event-form'){
      ev.preventDefault();
      const data=new FormData(f),fields={title:clean(data.get('title')),date:clean(data.get('date')),
        clientId:clean(data.get('clientId')),clientName:clean(data.get('clientName')),
        bookingStage:clean(data.get('bookingStage')),dateCertainty:clean(data.get('dateCertainty')),
        targetMonth:clean(data.get('targetMonth')),dateNotes:clean(data.get('dateNotes')),
        followUpDate:clean(data.get('followUpDate')),nextAction:clean(data.get('nextAction'))};
      const result=window.PhaenomenonEventBuilder?.create(db,fields);
      if(!result||result.error){alert(result?.error||'Unable to create event.');return;}
      ui.eventId=result.event.id;ui.area='all';ui.crewPerson='all';
      ensure();
      if(!store())return;
      closeBuilderEvent();
      location.hash='#/builder/'+encodeURIComponent(result.event.id);
      route();
      return;
    }
    if(f.id==='production-venue-quick-form'){
      ev.preventDefault();
      const data=new FormData(f),val=k=>clean(data.get(k)),W=window.PhaenomenonVenueWorkflow;
      const mode=val('mode');
      const params={name:val('venueName'),spaceName:val('spaceName'),width:val('width'),length:val('length'),height:val('height'),kind:val('kind')};
      const result=mode==='venue'?W.addVenue(db,params):W.addSpace(db,val('venueId'),{...params,name:val('spaceName')});
      if(result.error&&!result.existing){alert(result.error);return;}
      if(result.venue&&!result.error){ensure();if(!store())return;}
      const targetVenue=result.venue?.id||(mode==='venue'?result.existing?.id:val('venueId'));
      const targetSpace=result.space?.id||(mode==='space'?result.existing?.id:undefined);
      productionQuickClose();
      renderVenuePicker(targetVenue,targetSpace);
      const host=document.querySelector('.content');
      if(host)host.insertAdjacentHTML('afterbegin','<div class="notice info section" role="status">'+esc(result.error||'Saved in the reusable venue library. Select the spaces and save the event.')+'</div>');
      return;
    }
    if(!$.contains(f))return;
    if(!['assign-form','cue-form','look-form','entity-form','entity-note-form','relation-form','team-hierarchy-form','operations-form','event-venue-form','builder-basics-form'].includes(f.id))return;
    ev.preventDefault();const d=new FormData(f),val=k=>clean(d.get(k)),e=current(),o=org();
    if(f.id==='builder-basics-form'){
      const title=val('title').slice(0,120),day=val('date');
      if(!title){notice('Enter an event name.');return;}
      const result=window.PhaenomenonLifecycle.setDetails(e,{
        date:day,bookingStage:val('bookingStage'),dateCertainty:val('dateCertainty'),
        targetMonth:val('targetMonth'),dateNotes:val('dateNotes'),
        nextAction:val('nextAction'),followUpDate:val('followUpDate'),
        productionStage:val('productionStage')
      });
      if(result.error){notice(result.error);return;}
      e.title=title;e.clientId=db.clients.some(x=>x.id===val('clientId'))?val('clientId'):'';
      const allowed=['Other','Performance','Live music','Festival','Wedding','Corporate','Private','Exhibition'];
      e.eventType=allowed.includes(val('eventType'))?val('eventType'):'Other';
      e.guests=Math.max(1,Math.min(5000,Math.floor(num(val('guests'),1))));
      e.zones=Math.max(1,Math.min(12,Math.floor(num(val('zones'),1))));
      e.environment=val('environment')==='Outdoor'?'Outdoor':'Indoor';
      e.complexity=['Simple','Standard','Feature'].includes(val('complexity'))?val('complexity'):'Standard';
      e.labourHours=Math.max(0,Math.min(1000,num(val('labourHours'))));
      e.labourRate=Math.max(0,Math.min(100000,num(val('labourRate'))));
      e.notes=val('notes').slice(0,3000);
      ensure();
      if(store())notice('Event details saved. Continue with Venue & spaces when ready.');
      return;
    }
    if(f.id==='event-venue-form'){
      const v=window.PhaenomenonVenueWorkflow?.findVenue(db,val('venueId'));
      const checked=(d.getAll?d.getAll('spaceIds'):[]).map(String);
      if(!v||!checked.length){notice('Select a venue and at least one space.');return;}
      const p=plan(e),different=!!((e.venueId||p.venueId)!==v.id);
      if(different&&p.items?.length&&!confirm('This event already has equipment placed in another venue. Keep its positions marked for review until you inspect them in the 3D planner?'))return;
      const res=window.PhaenomenonVenueWorkflow.updateEvent(db,e.id,v.id,checked);
      if(res.error){notice(res.error);return;}
      ui.area='all';
      ensure();
      if(store())notice(res.needsReview?'Venue changed. Review all placed equipment before publishing.':'Venue and selected spaces saved to this event.');
      return;
    }
    if(f.id==='operations-form'){
      const startDate=val('loadInDate'),endDate=val('packOutDate'),st=val('loadInTime'),et=val('packOutTime');
      const validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(new Date(x+'T12:00:00').getTime());
      const validTime=x=>/^([01]\d|2[0-3]):[0-5]\d$/.test(x);
      if(!validDate(startDate)||!validDate(endDate)||!validTime(st)||!validTime(et)||
         new Date(startDate+'T'+st+':00')>=new Date(endDate+'T'+et+':00')){
        notice('Enter a valid logistics period with the end after the start.');return;
      }
      o.operations[e.id]={loadInDate:startDate,loadInTime:st,packOutDate:endDate,packOutTime:et};
      if(store())notice('Event logistics window updated.');
      return;
    }
    if(f.id==='team-hierarchy-form'){
      const error=saveTeamLine(e,val('personId'),val('reportsTo'),val('position'),val('notes'));
      if(error){notice(error);return;}
      ui.teamPerson=val('personId');store();notice('Reporting line updated for this event.');return;
    }
    if(f.id==='assign-form'){
      if(!entity(val('entityId')))return;
      const eqId=(db.equipment||[]).some(g=>g.id===val('equipmentId'))?val('equipmentId'):null;
      const previous=o.assignments.find(x=>x.eventId===e.id&&x.entityId===val('entityId')&&x.role===val('role')&&x.areaId===val('areaId')&&(x.equipmentId||'')===(eqId||''));
      if(previous){notice('This entity already has that role and equipment assignment in the selected area.');return;}
      const qty=Math.max(0,Math.min(9999,Math.floor(num(val('quantity')))));
      if(qty&&!eqId){notice('Choose an equipment type for a supplied quantity.');return;}
      o.assignments.push({id:uid('assignment'),eventId:e.id,entityId:val('entityId'),role:val('role'),areaId:val('areaId'),responsibility:val('responsibility').slice(0,180),equipmentId:eqId,quantity:eqId?qty:0});
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
      if(!['Person','Organisation'].includes(val('kind'))){notice('Create venues and spaces in the Venue library, not as unlinked records.');return;}
      const existing=o.entities.find(x=>x.kind===val('kind')&&(x.name.toLowerCase()===val('name').toLowerCase()||(x.aliases||[]).some(alias=>alias.toLowerCase()===val('name').toLowerCase())));
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
  // Prevent stale browser tabs from silently overwriting other production edits.
  window.addEventListener('storage',event=>{if(event.key===KEY)refreshFromStorage();});
  window.addEventListener('focus',refreshFromStorage);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshFromStorage();});
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){if(document.getElementById('production-rail')?.classList?.contains('is-expanded')){
    document.getElementById('production-rail').classList.remove('is-expanded');
    document.body?.classList?.remove('ph-mobile-menu-open');
    document.querySelector('.production-mobile-tabs .mobile-more-tab')?.setAttribute('aria-expanded','false');
    document.querySelector('.production-mobile-tabs .mobile-more-tab')?.focus();
  }else if(cueEditorOpen)closeCueEditor();else if(builderEventOpen)closeBuilderEvent();else if(quickVenueOpen)productionQuickClose();}});
  document.addEventListener('toggle',ev=>{
    if(ev.target?.id==='event-venue-settings')ui.homeVenueOpen=ev.target.open;
  },true);
  window.addEventListener('hashchange',route);
  ensure();store();route();
})();