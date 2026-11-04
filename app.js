/*
 * Phaenomenon · Lighting design studio demo
 * No build tools, servers, logins, APIs or third-party JS required.
 * All sample records are fictional. Data is stored locally in your browser.
 */
(() => {
  'use strict';
  const STORE_KEY = 'phaenomenon-demo-v1';
  const STAGES = ['Concept', 'Design Development', 'Procurement', 'Installation', 'Handover'];
  const LEAD_STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Won'];
  const $app = document.getElementById('app');
  const $import = document.getElementById('import-file');
  const money = n => new Intl.NumberFormat('en-AU', {style:'currency', currency:'AUD', maximumFractionDigits:0}).format(Number(n)||0);
  const currency = n => new Intl.NumberFormat('en-AU', {style:'currency', currency:'AUD', minimumFractionDigits:2, maximumFractionDigits:2}).format(Number(n)||0);
  const formatDate = (s, options={day:'numeric', month:'short', year:'numeric'}) => s ? new Intl.DateTimeFormat('en-AU', options).format(parseDate(s)) : 'Not scheduled';
  const parseDate = s => new Date(`${s}T12:00:00`);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays = n => { const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+n); return iso(d); };
  const safe = value => String(value ?? '').replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const attr = safe;
  const id = prefix => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const cls = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const titleCase = s => s.replace(/\b\w/g, x=>x.toUpperCase());
  const shortDay = d => formatDate(d,{day:'numeric',month:'short'});
  const isLate = d => d && d < iso(new Date());
  const sum = arr => arr.reduce((a,b)=>a+b,0);
  const svgPaths = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
    chart:'<path d="M3 3v18h18M8 15l4-5 4 3 5-7"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    bulb:'<path d="M9 18h6M10 21h4M8 14a7 7 0 1 1 8 0c-1 .7-1 1.5-1 3H9c0-1.5 0-2.3-1-3Z"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.2a4 4 0 0 1 0 7.6M22 21v-2a4 4 0 0 0-3-3.9"/><circle cx="9" cy="7" r="4"/>',
    settings:'<path d="M10.3 3.1h3.4l.6 2.1 1.7.7 1.9-1 2.4 2.4-1 1.9.7 1.7 2.1.6v3.4l-2.1.6-.7 1.7 1 1.9-2.4 2.4-1.9-1-1.7.7-.6 2.1h-3.4l-.6-2.1-1.7-.7-1.9 1-2.4-2.4 1-1.9-.7-1.7-2.1-.6v-3.4l2.1-.6.7-1.7-1-1.9L6.1 5l1.9 1 1.7-.7.6-2.2Z"/><circle cx="12" cy="12" r="3"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',chevron:'<path d="m9 18 6-6-6-6"/>',
    left:'<path d="m15 18-6-6 6-6"/>',check:'<path d="m5 12 4 4L19 6"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',wallet:'<rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 9h20M16 14h2"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4"/>',
    reset:'<path d="M3 11a9 9 0 1 1 2 6m-2 3v-9h9"/>',file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8M8 17h8"/>',
    layers:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
    box:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 7v10l9 5 9-5V7M12 12v10"/>',
    pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',sliders:'<path d="M4 7h8m4 0h4M4 17h3m4 0h9"/><circle cx="14" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    spark:'<path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2ZM19 18l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"/>',
    lamp:'<path d="M7 3h10l5 12H2L7 3ZM12 15v6M8 21h8"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
    print:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  };
  const icon = (name, size=16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgPaths[name]||svgPaths.grid}</svg>`;

  function seed(){
    return {
      version:2, created: new Date().toISOString(),
      equipment:demoEquipment(), eventJobs:demoEventJobs(), invoices:demoInvoices(),
      clients:[
        {id:'c1',name:'Harbour Hospitality',person:'Maya Chen',email:'maya@demo.example',type:'Hospitality group'},
        {id:'c2',name:'Spatial Form Studio',person:'Jordan Blake',email:'jordan@demo.example',type:'Architecture practice'},
        {id:'c3',name:'Atelier North',person:'Amelia Woods',email:'amelia@demo.example',type:'Interior design'},
        {id:'c4',name:'City Arts Collective',person:'Ari Kapoor',email:'ari@demo.example',type:'Arts organisation'},
      ],
      fixtures:[
        {id:'f1',code:'LX-DL-01',name:'Recessed adjustable downlight',maker:'Northline',type:'Downlight',cct:'2700K',beam:'24°',stock:46,cost:385},
        {id:'f2',code:'LX-LN-02',name:'Linear grazing profile',maker:'Arc Works',type:'Linear',cct:'3000K',beam:'Asymmetric',stock:18,cost:620},
        {id:'f3',code:'LX-SP-03',name:'Track spotlight',maker:'Aperture',type:'Spotlight',cct:'3000K',beam:'18°',stock:38,cost:440},
        {id:'f4',code:'LX-PD-04',name:'Opal glass pendant',maker:'Glasshouse',type:'Pendant',cct:'2700K',beam:'Diffuse',stock:9,cost:1150},
        {id:'f5',code:'LX-EX-05',name:'IP65 exterior wall washer',maker:'Northline',type:'Exterior',cct:'3000K',beam:'45°',stock:12,cost:890},
        {id:'f6',code:'LX-CV-06',name:'Concealed cove tape',maker:'Arc Works',type:'Strip',cct:'2700K',beam:'120°',stock:110,cost:89},
      ],
      projects:[
        {id:'p1',code:'PH-2601',name:'North Pier Hotel',clientId:'c1',type:'Hospitality',stage:'Design Development',budget:145000,spent:52200,designFee:12500,installationFee:14500,due:addDays(38),location:'Docklands, Melbourne',tone:['#3d5b60','#182f34'],description:'A layered, warm lighting strategy for a waterfront boutique hotel, including public spaces, guest rooms and facade accents.',tasks:[{id:'t1',name:'Review guest room dimming schedule',due:addDays(2),done:false},{id:'t2',name:'Present lobby lighting mock-ups',due:addDays(6),done:false},{id:'t3',name:'Issue revised reflected ceiling plans',due:addDays(9),done:false},{id:'t4',name:'Complete initial site survey',due:addDays(-7),done:true}],fixtures:[{id:'f1',qty:24},{id:'f2',qty:14},{id:'f4',qty:8}]},
        {id:'p2',code:'PH-2602',name:'Arc House',clientId:'c2',type:'Residential',stage:'Concept',budget:68000,spent:11200,designFee:8000,installationFee:9800,due:addDays(24),location:'Carlton North, Melbourne',tone:['#aa8874','#635449'],description:'A considered residential scheme that balances soft architectural accents, artwork and intuitive control.',tasks:[{id:'t5',name:'Develop three moodboard directions',due:addDays(4),done:false},{id:'t6',name:'Confirm ceiling height constraints',due:addDays(8),done:false},{id:'t7',name:'Complete client briefing',due:addDays(-5),done:true}],fixtures:[{id:'f1',qty:12},{id:'f6',qty:32}]},
        {id:'p3',code:'PH-2603',name:'Banyan Restaurant',clientId:'c1',type:'Hospitality',stage:'Procurement',budget:97000,spent:61500,designFee:10500,installationFee:12300,due:addDays(17),location:'Fitzroy, Melbourne',tone:['#655a46','#2e342b'],description:'An intimate restaurant scheme with warm pools of light, table illumination and low-glare accents.',tasks:[{id:'t8',name:'Approve pendant shop drawings',due:addDays(1),done:false},{id:'t9',name:'Confirm driver delivery date',due:addDays(3),done:false},{id:'t10',name:'Approve specification package',due:addDays(-12),done:true}],fixtures:[{id:'f3',qty:20},{id:'f4',qty:7},{id:'f6',qty:38}]},
        {id:'p4',code:'PH-2604',name:'Eclipse Gallery',clientId:'c4',type:'Cultural',stage:'Installation',budget:124000,spent:92000,designFee:15000,installationFee:26000,due:addDays(51),location:'Collingwood, Melbourne',tone:['#8a6f61','#2b363b'],description:'A flexible gallery lighting solution with highly adjustable spotlighting for rotating exhibitions.',tasks:[{id:'t11',name:'Attend on-site aiming session',due:addDays(5),done:false},{id:'t12',name:'Test emergency scene presets',due:addDays(10),done:false},{id:'t13',name:'Finalise track layout',due:addDays(-6),done:true}],fixtures:[{id:'f3',qty:35},{id:'f5',qty:9}]},
        {id:'p5',code:'PH-2605',name:'Marin Residence',clientId:'c3',type:'Residential',stage:'Handover',budget:41000,spent:37000,designFee:7000,installationFee:7600,due:addDays(4),location:'Kew, Melbourne',tone:['#8b8a7b','#445459'],description:'Final commissioning and handover of an understated residential lighting and control package.',tasks:[{id:'t14',name:'Send client handover pack',due:addDays(1),done:false},{id:'t15',name:'Verify scene programming',due:addDays(-4),done:true},{id:'t16',name:'Complete practical completion walk-through',due:addDays(-2),done:true}],fixtures:[{id:'f1',qty:18},{id:'f6',qty:24}]},
      ],
      leads:[
        {id:'l1',name:'Solstice Wellness',client:'Evergreen Property',kind:'Wellness',value:56000,stage:'Discovery',note:'Initial brief received'},
        {id:'l2',name:'The Glasshouse',client:'Pavilion Group',kind:'Hospitality',value:82000,stage:'Discovery',note:'Site walkthrough requested'},
        {id:'l3',name:'Sable Apartments',client:'Muir Developments',kind:'Multi-residential',value:186000,stage:'Proposal',note:'Fee proposal shared'},
        {id:'l4',name:'Forma Showroom',client:'Objects & Co',kind:'Retail',value:39000,stage:'Proposal',note:'Awaiting feedback'},
        {id:'l5',name:'Orchid House',client:'Atelier North',kind:'Residential',value:48000,stage:'Negotiation',note:'Scope clarification in progress'},
      ],
      events:[
        {id:'e1',date:addDays(1),title:'Banyan supplier check-in',projectId:'p3',kind:'review'},
        {id:'e2',date:addDays(3),title:'North Pier concept review',projectId:'p1',kind:'review'},
        {id:'e3',date:addDays(5),title:'Eclipse site aiming',projectId:'p4',kind:'crew'},
        {id:'e4',date:addDays(8),title:'Arc House presentation',projectId:'p2',kind:'review'},
        {id:'e5',date:addDays(12),title:'Banyan procurement deadline',projectId:'p3',kind:'milestone'},
        {id:'e6',date:addDays(18),title:'North Pier documentation',projectId:'p1',kind:'milestone'},
      ]
    };
  }
  function read(){
    try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return seed();const x=JSON.parse(raw);if(!valid(x))throw Error('Invalid local data');return x;}
    catch(err){console.warn('Could not load local demo data:',err);return seed();}
  }
  function valid(x){return x&&Array.isArray(x.projects)&&Array.isArray(x.leads)&&Array.isArray(x.events)&&Array.isArray(x.clients)&&Array.isArray(x.fixtures);}
  let db=read();
  const storedRaw=()=>{try{return localStorage.getItem(STORE_KEY);}catch(e){return null;}};
  let storageBaseline=storedRaw();
  assureEventData(db);
  window.PhaenomenonLifecycle?.ensureAll(db);
  window.PhaenomenonSpacePlanner?.ensure(db);
  window.PhaenomenonVenueWorkflow?.ensureAll(db);
  let ui={view:'overview',projectId:null,eventId:null,invoiceId:null,printInvoiceId:null,tab:'overview',bookingTab:'details',filter:'All',search:'',fixtureSearch:'',calendar:new Date(new Date().getFullYear(),new Date().getMonth(),1),selectedDate:null,modal:null,toast:null};
  function save(force=false){
    try {
      const latest=localStorage.getItem(STORE_KEY);
      if(!force&&latest!==storageBaseline){
        alert('Another Phaenomenon tab saved newer data. This edit was not written over it. The current page will reload the newer data. Please retry your change.');
        refreshFromStorage();
        return false;
      }
      const payload=JSON.stringify(db);
      if(latest&&latest!==payload)window.PhaenomenonWorkspaceSafety?.checkpoint(localStorage,latest,'Before Studio edit',force);
      localStorage.setItem(STORE_KEY,payload);
      storageBaseline=payload;
      return true;
    } catch(e){flash('Browser storage is unavailable. Export your work to keep it.');return false;}
  }
  function refreshFromStorage(){
    const raw=storedRaw();
    if(raw===storageBaseline)return false;
    if(!raw)return false;
    let data;try{data=JSON.parse(raw);}catch(e){return false;}
    if(!valid(data))return false;
    db=data;storageBaseline=raw;
    assureEventData(db);
    window.PhaenomenonLifecycle?.ensureAll(db);
    window.PhaenomenonSpacePlanner?.ensure(db);
    window.PhaenomenonVenueWorkflow?.ensureAll(db);
    ui.modal=null;ui.projectId=null;
    renderRoute();
    return true;
  }
  function clientName(id){return db.clients.find(c=>c.id===id)?.name||'Unassigned';}
  function projectName(id){return db.projects.find(p=>p.id===id)?.name||'General';}
  function taskCount(project){return project.tasks?.length||0;}
  function progress(p){const done=(p.tasks||[]).filter(t=>t.done).length;return taskCount(p) ? Math.round(done/taskCount(p)*100) : 0;}
  function projectFixtureCost(p){return sum((p.fixtures||[]).map(f=>{const fixture=db.fixtures.find(i=>i.id===f.id);return (fixture?.cost||0)*f.qty;}));}
  function quoteParts(p){return [{label:'Lighting design services',value:p.designFee||0},{label:'Specified fixture supply',value:projectFixtureCost(p)},{label:'Installation / commissioning allowance',value:p.installationFee||0}];}
  function quoteTotal(p){return sum(quoteParts(p).map(x=>x.value));}
  function stageStatus(stage){return `<span class="status ${cls(stage)}">${safe(stage)}</span>`;}
  function flash(message){ui.toast=message;render();setTimeout(()=>{if(ui.toast===message){ui.toast=null;document.querySelector('.toast')?.remove();}},3500);}
  function mutate(cb,message){cb();if(!save())return;render();if(message)flash(message);}
  function nav(view){ui.filter='All';ui.search='';ui.fixtureSearch='';ui.modal=null;location.hash='#/'+view;if(location.hash==='#/'+view)renderRoute();}
  function openProject(projectId){ui.projectId=projectId;ui.tab='overview';ui.modal=null;location.hash='#/projects/'+encodeURIComponent(projectId);renderRoute();}
  function closeProject(){ui.projectId=null;location.hash='#/projects';renderRoute();}
  function renderRoute(){document.body?.classList?.remove('ph-studio-menu-open');const tokens=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);const allowed=['overview','bookings','spaces','invoices','equipment','projects','pipeline','schedule','fixtures','clients','settings','search'];ui.view=allowed.includes(tokens[0])?tokens[0]:'overview';ui.projectId=ui.view==='projects' && db.projects.some(p=>p.id===tokens[1])?tokens[1]:null; if(ui.view==='bookings'&&db.eventJobs.some(e=>e.id===tokens[1]))ui.eventId=tokens[1]; if(ui.view==='spaces'&&db.eventJobs.some(e=>e.id===tokens[1]))ui.eventId=tokens[1]; if(ui.view==='invoices'&&db.invoices.some(e=>e.id===tokens[1]))ui.invoiceId=tokens[1]; render();}

  const navLinks=[
    ['overview','Studio overview','grid'],
    ['bookings','Events','calendar'],
    ['spaces','3D planner','layers'],
    ['equipment','Equipment','layers'],
    ['invoices','Invoices','file'],
    ['clients','Clients','users'],
    ['projects','Projects','briefcase'],
    ['pipeline','Opportunities','chart'],
    ['schedule','Calendar','calendar'],
    ['fixtures','Fixture library','bulb'],
    ['settings','Settings','settings']
  ];
  const navItem=(key)=>{
    const item=navLinks.find(x=>x[0]===key);if(!item)return '';
    const [,label,glyph]=item;
    const selected=ui.view===key;
    return '<a href="#/'+key+'" data-action="nav" data-view="'+key+'" class="nav-link'+(selected?' active':'')+'" title="'+label+'" '+(selected?'aria-current="page"':'')+'>'+
      icon(glyph,17)+'<span>'+label+'</span>'+(key==='pipeline'&&db.leads.length?'<b class="nav-count">'+db.leads.length+'</b>':'')+'</a>';
  };
  function sidebar(){
    const group=(key,label,glyph,links,extra='')=>{
      const active=links.includes(ui.view);
      return '<details class="nav-group" data-group="'+key+'" '+(active?'open':'')+'><summary class="nav-group-heading" aria-label="'+label+'">'+
        icon(glyph,17)+'<span>'+label+'</span><span class="nav-chevron" aria-hidden="true">⌄</span></summary>'+
        '<div class="nav-subitems">'+links.map(navItem).join('')+extra+'</div></details>';
    };
    const activeEvent=ui.eventId&&db.eventJobs.some(x=>x.id===ui.eventId)?encodeURIComponent(ui.eventId):'';
    return '<aside class="sidebar" id="studio-sidebar">'+
      '<div class="sidebar-heading"><a class="logo" href="production.html#/dashboard" aria-label="Phaenomenon Home dashboard">'+
        '<span class="logo-mark">'+icon('lamp',21)+'</span><span><span class="logo-name">phaenomenon<span style="color:#d9b58c">.</span></span><span class="logo-tag">Event production studio</span></span></a>'+
        '<button type="button" class="nav-mobile-toggle" data-action="toggle-sidebar" aria-expanded="false" aria-controls="studio-navigation">'+icon('menu',18)+'<span>Menu</span></button></div>'+
      '<nav class="nav-items" id="studio-navigation" aria-label="Studio navigation">'+
        '<div class="nav-label">HOME</div><a class="nav-link nav-feature" href="production.html#/dashboard" title="Open studio Home dashboard">'+icon('grid',17)+'<span>Dashboard</span></a>'+
         '<div class="nav-label">EVENT WORKSPACE</div>'+
        '<a class="nav-link nav-feature" href="production.html#/builder/'+activeEvent+'" title="Continue the selected event’s guided workflow">'+icon('layers',17)+'<span>Event builder</span></a>'+
        navItem('bookings')+navItem('overview')+
        '<div class="nav-label">TOOLS &amp; RECORDS</div>'+
        group('planning','Plan &amp; design','layers',['spaces'],
          '<a class="nav-link" href="production.html#/technical/'+activeEvent+'" title="Review current event technical connections">'+icon('layers',14)+'<span>Technical connections</span></a>')+
        group('library','Equipment library','bulb',['equipment','fixtures'])+
        group('studio','Studio management','briefcase',['projects','pipeline','schedule','clients','invoices'])+
        navItem('settings')+
      '</nav>'+
      '<div class="sidebar-bottom"><button class="nav-help" data-action="view-guide">'+icon('info',15)+'<span>Help &amp; guide</span></button>'+
        '<p class="nav-disclaimer">Prototype · Browser-local data</p></div>'+
      '</aside>';
  }

  function topbar(){const page=ui.view==='search'?'Search':navLinks.find(x=>x[0]===ui.view)?.[1]||'Overview';return `<header class="topbar"><div class="breadcrumbs"><span class="breadcrumbs-root">Studio</span><span class="breadcrumbs-divider" aria-hidden="true">/</span><span class="breadcrumbs-page">${page}</span></div><div class="top-actions"><label class="top-search">${icon('search',14)}<input id="global-search" aria-label="Search projects and leads" placeholder="Search workspace" value="${attr(ui.search)}" /></label><button class="button primary" data-action="open-modal" data-type="booking">${icon('plus',15)} New event</button></div></header>`;}
  function mobileDock(){
    const id=ui.eventId&&db.eventJobs.some(x=>x.id===ui.eventId)?encodeURIComponent(ui.eventId):'';
    const tab=(label,glyph,href,active)=>'<a class="studio-mobile-tab'+(active?' is-active':'')+'" href="'+href+'" '+(active?'aria-current="page"':'')+'>'+icon(glyph,19)+'<span>'+label+'</span></a>';
    return '<nav class="studio-mobile-dock" aria-label="Quick workspace navigation">'+
      tab('Home','grid','production.html#/dashboard',false)+
       tab('Events','calendar','#/bookings',ui.view==='bookings')+
      tab('Build','layers','production.html#/builder/'+id,false)+
      tab('3D','box','#/spaces/'+id,ui.view==='spaces')+
      '<button type="button" class="studio-mobile-tab studio-mobile-more'+(!['bookings','spaces'].includes(ui.view)?' is-active':'')+'" data-action="toggle-sidebar" aria-controls="studio-navigation" aria-expanded="false">'+
      icon('menu',19)+'<span>More</span></button></nav>';
  }
  function layout(content){return `<div class="app-shell">${sidebar()}<button type="button" class="studio-mobile-backdrop" data-action="close-sidebar" aria-label="Close navigation"></button><main class="main">${topbar()}<div class="content">${content}</div></main></div>${mobileDock()}${ui.projectId?drawer():''}${ui.modal?modal():''}${ui.toast?`<div class="toast" role="status">${icon('check',15)} ${safe(ui.toast)}</div>`:''}${ui.projectId?printSheet():''}${ui.printInvoiceId?invoicePrintPage():''}`;}
  function heading(eyebrow,title,description,right=''){return `<div class="section-intro"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${right}</div>`;}
  function metric(label,value,foot,glyph){return `<section class="metric-card"><div class="metric-top"><span class="metric-label">${label}</span><span class="metric-icon">${icon(glyph,15)}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></section>`;}
  function overview(){
    const active=db.projects.filter(p=>p.stage!=='Handover').length, pipelineValue=sum(db.leads.filter(l=>l.stage!=='Won').map(l=>Number(l.value)||0)), deadlines=db.projects.flatMap(p=>p.tasks.map(t=>({...t,project:p.name}))).filter(t=>!t.done&&t.due).sort((a,b)=>a.due.localeCompare(b.due));
    const now=new Date(), welcome=new Intl.DateTimeFormat('en-AU',{weekday:'long',day:'numeric',month:'long'}).format(now);
    const items=db.projects.slice().sort((a,b)=>a.due.localeCompare(b.due)).slice(0,4);
    const upcoming=db.events.filter(e=>e.date>=iso(now)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
    const completeTasks=sum(db.projects.map(p=>p.tasks.filter(t=>t.done).length)), allTasks=sum(db.projects.map(p=>p.tasks.length));
    return `${eventsHomeStrip()}${heading('STUDIO','Studio overview','Projects and upcoming tasks in one place.')}
    <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Projects in motion</h2><p class="subtitle">Design to delivery</p></div><button class="panel-link" data-action="nav" data-view="projects">All projects ${icon('arrow',13)}</button></div><div class="project-list">${items.length?items.map(p=>`<button class="project-row" data-action="project" data-id="${attr(p.id)}"><span class="project-symbol" style="background:${safe(p.tone[0])}1d;color:${safe(p.tone[0])}">${icon(p.type==='Residential'?'lamp':'layers',20)}</span><span><span class="project-title">${safe(p.name)}</span><span class="project-meta">${safe(clientName(p.clientId))} · ${safe(p.stage)}</span></span><span class="project-progress-area"><small>${progress(p)}% tasks done</small><div class="progress"><span style="width:${progress(p)}%"></span></div></span></button>`).join(''):empty('No projects yet','Create one to see it here.')}</div></section>
    <section class="panel"><div class="panel-head"><div><h2>Up next</h2><p class="subtitle">Tasks that need your attention</p></div>${icon('clock',16)}</div><div class="task-list">${deadlines.length?deadlines.slice(0,5).map(t=>`<div class="task-row"><button class="task-check" title="Mark complete" aria-label="Mark ${attr(t.name)} complete" data-action="toggle-task" data-id="${attr(t.id)}"> </button><div class="task-details"><div class="task-title">${safe(t.name)}</div><div class="task-sub">${safe(t.project)}</div></div><span class="date-chip ${isLate(t.due)?'overdue':''}">${shortDay(t.due)}</span></div>`).join(''):empty('All caught up','Add a task to your project.')}</div></section></div>
    <details class="studio-more"><summary>More studio metrics &amp; calendar <span aria-hidden="true">⌄</span></summary><div class="studio-more-content">
    <div class="cards-4">${metric('Active projects',active,`${db.projects.length} projects in total`,'briefcase')}${metric('Open pipeline',money(pipelineValue),`${db.leads.filter(l=>l.stage!=='Won').length} live opportunities`,'chart')}${metric('Upcoming milestones',db.events.filter(e=>e.date>=iso(now)&&e.date<=addDays(30)).length,'Scheduled in the next 30 days','calendar')}${metric('Tasks completed',`${allTasks?Math.round(completeTasks/allTasks*100):0}%`,`${completeTasks} of ${allTasks} across the studio`,'check')}</div>
    <div class="bottom-grid"><section class="panel"><div class="panel-head"><div><h2>Studio workload</h2><p class="subtitle">Project distribution by delivery stage</p></div><button class="panel-link" data-action="nav" data-view="projects">Explore ${icon('arrow',13)}</button></div><div class="stage-bars">${STAGES.map(s=>{const n=db.projects.filter(p=>p.stage===s).length;return `<div class="stage-row"><span>${safe(s)}</span><div class="stage-track"><div class="stage-fill" style="width:${db.projects.length?n/db.projects.length*100:0}%"></div></div><span class="stage-number">${n}</span></div>`;}).join('')}</div></section><section class="panel"><div class="panel-head"><div><h2>On the calendar</h2><p class="subtitle">Your next studio moments</p></div><button class="panel-link" data-action="nav" data-view="schedule">View calendar ${icon('arrow',13)}</button></div><div class="event-list">${upcoming.length?upcoming.map(eventRow).join(''):empty('Nothing scheduled','Add an upcoming milestone.')}</div></section></div>
    </div></details>`;
  }
  function eventRow(e){return `<div class="event-row"><span class="event-date"><strong>${parseDate(e.date).getDate()}</strong><small>${formatDate(e.date,{month:'short'})}</small></span><span class="event-info"><strong>${safe(e.title)}</strong><span>${safe(projectName(e.projectId))} · ${safe(titleCase(e.kind))}</span></span><span class="event-dot"></span></div>`;}
  function empty(title,detail){return `<div class="empty">${icon('layers',23)}<strong>${title}</strong><p>${detail}</p></div>`;}
  function projectCards(){const match=db.projects.filter(p=>(ui.filter==='All'||p.stage===ui.filter)&&`${p.name} ${clientName(p.clientId)} ${p.type} ${p.location}`.toLowerCase().includes(ui.search.toLowerCase()));return `${heading('PROJECT DELIVERY','Your projects','An overview of the lighting work moving through the studio.',`<button class="button primary" data-action="open-modal" data-type="project">${icon('plus',14)} Add project</button>`)}<div class="section-toolbar"><div class="filter-tabs">${['All',...STAGES].map(s=>`<button class="filter-tab ${ui.filter===s?'active':''}" data-action="filter" data-value="${attr(s)}">${safe(s)}</button>`).join('')}</div><label class="search-control">${icon('search',15)}<input id="project-search" placeholder="Search projects" value="${attr(ui.search)}" /></label></div><div class="project-cards">${match.map(p=>`<button class="project-card" data-action="project" data-id="${attr(p.id)}"><div class="project-card-visual" style="--tone-a:${safe(p.tone[0])};--tone-b:${safe(p.tone[1])}"><span class="project-card-code">${safe(p.code)}</span><span class="project-card-label">${safe(p.type)}</span></div><div class="project-card-body"><h3 class="card-title">${safe(p.name)}</h3><div class="project-card-sub">${safe(clientName(p.clientId))} · ${safe(p.location)}</div><div class="project-card-data">${stageStatus(p.stage)}<span style="font-weight:800;font-size:12px;color:#3c4b52">${money(p.budget)}</span></div><div class="project-card-bottom"><span>Task completion</span><strong>${progress(p)}%</strong></div><div class="progress"><span style="width:${progress(p)}%"></span></div><div class="project-card-bottom" style="margin-bottom:0"><span>Due ${formatDate(p.due,{day:'numeric',month:'short'})}</span><span>${p.tasks.filter(x=>!x.done).length} open tasks</span></div></div></button>`).join('')}</div>${!match.length?empty('No matching projects','Try a different filter or add a project.'):''}`;}
  function pipeline(){const total=sum(db.leads.map(l=>Number(l.value)||0));return `${heading('BUSINESS DEVELOPMENT','Opportunity pipeline','Move new business from an initial conversation to a confirmed project.',`<button class="button primary" data-action="open-modal" data-type="lead">${icon('plus',14)} Add opportunity</button>`)}<div class="cards-4" style="margin-bottom:19px">${metric('Total opportunity value',money(total),'Indicative project values','wallet')}${metric('Open enquiries',db.leads.filter(l=>l.stage==='Discovery').length,'New work to qualify','users')}${metric('Proposals sent',db.leads.filter(l=>l.stage==='Proposal').length,'Awaiting client decisions','file')}${metric('In negotiation',db.leads.filter(l=>l.stage==='Negotiation').length,'Potential projects close to award','chart')}</div><div class="kanban">${LEAD_STAGES.map(stage=>{const items=db.leads.filter(l=>l.stage===stage&&`${l.name} ${l.client} ${l.kind}`.toLowerCase().includes(ui.search.toLowerCase()));return `<div class="kanban-col"><div class="kanban-col-head">${stageStatus(stage)}<span class="count">${items.length}</span></div>${items.map(l=>`<article class="lead-card"><small>${safe(l.kind)} · ${safe(l.client)}</small><h3>${safe(l.name)}</h3><p class="lead-meta">${safe(l.note||'Opportunity in progress')}</p><div class="lead-bottom"><strong>${money(l.value)}</strong>${icon('chart',15)}</div><label class="field-label" for="lead-${attr(l.id)}">Move to stage</label><select class="lead-select" id="lead-${attr(l.id)}" data-action="lead-stage" data-id="${attr(l.id)}">${LEAD_STAGES.map(s=>`<option ${l.stage===s?'selected':''}>${s}</option>`).join('')}</select>${l.stage==='Won'?`<div class="lead-actions"><button class="button small primary" data-action="convert-lead" data-id="${attr(l.id)}">Create project ${icon('arrow',12)}</button></div>`:''}</article>`).join('')}${items.length?'':`<div class="no-results">No opportunities here</div>`}</div>`;}).join('')}</div><p class="notice">Demo values are placeholders, not a sales forecast. Moving an opportunity to Won lets you convert it into a project.</p>`;}
  function calendar(){const base=ui.calendar,yr=base.getFullYear(),mo=base.getMonth();const first=new Date(yr,mo,1),offset=(first.getDay()+6)%7,gridStart=new Date(yr,mo,1-offset);const today=iso(new Date());const monthTitle=new Intl.DateTimeFormat('en-AU',{month:'long',year:'numeric'}).format(base);const monthEvents=db.events.filter(e=>{const d=parseDate(e.date);return d.getMonth()===mo&&d.getFullYear()===yr}).sort((a,b)=>a.date.localeCompare(b.date));const chosen=ui.selectedDate?db.events.filter(e=>e.date===ui.selectedDate):monthEvents;return `${heading('STUDIO PLANNING','Schedule & milestones','Keep track of design reviews, supplier check-ins and on-site sessions.',`<button class="button primary" data-action="open-modal" data-type="milestone">${icon('plus',14)} Add milestone</button>`)}<div class="calendar-layout"><section class="panel"><div class="calendar-header"><strong class="calendar-month">${monthTitle}</strong><div class="calendar-controls"><button class="icon-button" aria-label="Previous month" data-action="month-prev">${icon('left',17)}</button><button class="button small" data-action="month-today">Today</button><button class="icon-button" aria-label="Next month" data-action="month-next">${icon('chevron',17)}</button></div></div><div class="weekday-grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(w=>`<div>${w}</div>`).join('')}</div><div class="calendar-grid">${Array.from({length:42},(_,i)=>{const d=new Date(gridStart);d.setDate(gridStart.getDate()+i);const key=iso(d),events=db.events.filter(e=>e.date===key);return `<button class="day ${d.getMonth()!==mo?'muted':''} ${key===today?'today':''} ${ui.selectedDate===key?'selected':''}" data-action="select-day" data-day="${key}" aria-label="${formatDate(key)}: ${events.length} events"><span class="day-number">${d.getDate()}</span>${events.slice(0,2).map(e=>`<span class="day-event ${safe(e.kind)}" title="${attr(e.title)}">${safe(e.title)}</span>`).join('')}${events.length>2?`<span class="day-event">+${events.length-2} more</span>`:''}</button>`}).join('')}</div></section><section class="panel"><div class="panel-head"><div><h2>${ui.selectedDate?'Selected date':'This month'}</h2><p class="subtitle">${ui.selectedDate?formatDate(ui.selectedDate):`${monthEvents.length} scheduled moments`}</p></div>${ui.selectedDate?`<button class="panel-link" data-action="clear-day">All month</button>`:icon('calendar',16)}</div><div class="calendar-agenda">${chosen.length?chosen.map(eventRow).join(''):empty('Nothing on the agenda','Add a milestone to give this day some structure.')}</div></section></div>`;}
  function fixtures(){const list=db.fixtures.filter(f=>`${f.code} ${f.name} ${f.maker} ${f.type} ${f.cct}`.toLowerCase().includes((ui.fixtureSearch||ui.search).toLowerCase()));const assigned=sum(db.projects.flatMap(p=>(p.fixtures||[]).map(f=>Number(f.qty)||0)));return `${heading('SPECIFICATION & PROCUREMENT','Fixture library','Reference products, specifications and quantities while building project estimates.',`<button class="button primary" data-action="open-modal" data-type="fixture">${icon('plus',14)} Add fixture</button>`)}<div class="cards-4" style="margin-bottom:19px">${metric('Fixtures in library',db.fixtures.length,'Reusable specification entries','bulb')}${metric('Units in stock',sum(db.fixtures.map(f=>Number(f.stock)||0)),'Illustrative inventory balance','layers')}${metric('Units specified',assigned,'Across all project schedules','briefcase')}${metric('Fixture value',money(sum(db.fixtures.map(f=>f.stock*f.cost))),'At indicative unit cost','wallet')}</div><section class="panel"><div class="panel-head"><div><h2>Fixture register</h2><p class="subtitle">Edit the source to connect manufacturer catalogues, cut sheets and supplier orders</p></div><label class="search-control">${icon('search',14)}<input id="fixture-search" placeholder="Find a fixture" value="${attr(ui.fixtureSearch)}" /></label></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Fixture / code</th><th>Manufacturer</th><th>Colour temp</th><th>Beam</th><th>Stock</th><th>Unit cost</th></tr></thead><tbody>${list.map(f=>`<tr><td><div class="fixture-name"><span class="swatch">${icon('bulb',18)}</span><span><strong>${safe(f.name)}</strong><br><span class="sku">${safe(f.code)}</span></span></div></td><td>${safe(f.maker)}</td><td>${safe(f.cct)}</td><td>${safe(f.beam)}</td><td>${safe(f.stock)}</td><td><strong>${money(f.cost)}</strong></td></tr>`).join('')}</tbody></table>${!list.length?empty('Nothing found','Try another specification or add a fixture.'):''}</div></section><p class="notice">Fixture data is fictional and for demonstration only. For real work, technical specifications must be checked against current manufacturer documentation.</p>`;}
  function clients(){const list=db.clients.filter(c=>`${c.name} ${c.person} ${c.type}`.toLowerCase().includes(ui.search.toLowerCase()));return `${heading('CLIENT RELATIONSHIPS','Your clients','Keep the key people and their lighting projects connected.',`<button class="button primary" data-action="open-modal" data-type="client">${icon('plus',14)} Add client</button>`)}<div class="client-grid">${list.map(c=>{const projects=db.projects.filter(p=>p.clientId===c.id);return `<article class="client-card"><div class="client-monogram">${safe(c.name.split(' ').slice(0,2).map(n=>n[0]).join(''))}</div><h3>${safe(c.name)}</h3><p>${safe(c.type)}</p><div class="split-stat"><span>Primary contact</span><strong>${safe(c.person)}</strong></div><div class="split-stat"><span>Linked projects</span><strong>${projects.length}</strong></div><div class="divider"><a href="mailto:${attr(c.email)}">${icon('mail',12)} ${safe(c.email)}</a>${projects.length?`<button class="panel-link" data-action="project" data-id="${attr(projects[0].id)}">Open project ${icon('arrow',12)}</button>`:''}</div></article>`;}).join('')}</div>${!list.length?empty('No clients found','Add a client to build your studio contacts.'):''}`;}
  function searchResults(){
    const q=ui.search.trim().toLowerCase();
    const projects=q?db.projects.filter(p=>`${p.name} ${clientName(p.clientId)} ${p.description} ${p.location}`.toLowerCase().includes(q)):[];
    const leads=q?db.leads.filter(l=>`${l.name} ${l.client} ${l.note} ${l.kind}`.toLowerCase().includes(q)):[];
    const clients=q?db.clients.filter(c=>`${c.name} ${c.person} ${c.type}`.toLowerCase().includes(q)):[];
    const fixtures=q?db.fixtures.filter(f=>`${f.name} ${f.maker} ${f.code} ${f.type}`.toLowerCase().includes(q)):[];
    const resultRow=(name,detail,action,glyph,id='')=>`<button class="project-row" data-action="${action}" ${id?`data-id="${attr(id)}"`:`data-view="${action==='nav'?'pipeline':'projects'}"`}><span class="project-symbol" style="background:#eef3f1;color:#5f8179">${icon(glyph,19)}</span><span><span class="project-title">${safe(name)}</span><span class="project-meta">${safe(detail)}</span></span>${icon('arrow',14)}</button>`;
    return `${heading('FIND ANYTHING','Search the workspace',q?`Results matching “${safe(ui.search.trim())}”`:'Find projects, opportunities, clients and fixture specifications.')}<section class="panel"><div class="panel-head"><h2>${projects.length+leads.length+clients.length+fixtures.length} matches</h2></div><div class="project-list">${!q?empty('Try searching by project, client or fixture','Use the search box in the top-right corner.'):projects.map(p=>resultRow(p.name,`${clientName(p.clientId)} · Project`,'project','briefcase',p.id)).join('')+leads.map(l=>resultRow(l.name,`${l.client} · Opportunity`,'nav','chart')).join('')+clients.map(c=>resultRow(c.name,`${c.person} · Client`,'nav-client','users',c.id)).join('')+fixtures.map(f=>resultRow(f.name,`${f.code} · Fixture`,'nav-fixture','bulb',f.id)).join('')||empty('No matching records','Try a broader word or phrase.')}</div></section>`;
  }
  function settings(){return `${heading('DEMO SETTINGS','Make it your own','Start with sample records, explore how the workflows fit together, then adapt the code to your studio.')}<div class="settings-layout"><section class="panel"><div class="settings-content"><h3>Your local event workspace</h3><p>Everything you edit in this demo is saved to this browser using localStorage. There is no account, cloud database or sharing between devices. Invoices are drafts only and are not sent or paid through the app.</p><div class="split-stat"><span>Bookings</span><strong>${db.eventJobs.length}</strong></div><div class="split-stat"><span>Invoices</span><strong>${db.invoices.length}</strong></div><div class="split-stat"><span>Client records</span><strong>${db.clients.length}</strong></div><div class="split-stat"><span>Hire equipment items</span><strong>${db.equipment.length}</strong></div><div class="setting-actions"><button class="button primary" data-action="export">${icon('download',15)} Export JSON</button><button class="button" data-action="import">${icon('upload',15)} Import JSON</button><button class="button danger" data-action="reset">${icon('reset',15)} Reset demo</button></div><div class="callout"><strong>Privacy by design, for this prototype.</strong> Example contact names and emails are fictional. Changes stay in the browser unless you export them. Do not use this as a production system for private customer or financial records.</div></div></section><section class="panel"><div class="settings-content"><h3>What could come next?</h3><p>A path from this interactive proof of concept to a real lighting design management product.</p><div class="split-stat"><span>01. Real event and client database</span><strong>Backend + sign-in</strong></div><div class="split-stat"><span>02. Documents, RCPs and cut sheets</span><strong>File storage</strong></div><div class="split-stat"><span>03. Accounting integrations and payments</span><strong>Supplier integrations</strong></div><div class="split-stat"><span>04. Crew, permissions and approvals</span><strong>Team workflows</strong></div><div class="split-stat"><span>05. Automation and reporting</span><strong>Notifications</strong></div><p class="notice">The README includes a suggested architecture, data model, deployment steps and a development roadmap.</p></div></section></div>`;}
  function drawer(){const p=db.projects.find(p=>p.id===ui.projectId);if(!p)return '';const tabs=['overview','tasks','fixtures','estimate'];return `<div class="drawer-backdrop" data-action="close-drawer-backdrop"><aside class="drawer" role="dialog" aria-modal="true" aria-label="Project details for ${attr(p.name)}"><div class="drawer-hero" style="--tone-a:${safe(p.tone[0])};--tone-b:${safe(p.tone[1])}"><div class="drawer-top"><span class="eyebrow">${safe(p.code)} · PROJECT DETAIL</span><button class="drawer-close" aria-label="Close project" data-action="close-project">${icon('x',17)}</button></div><h2>${safe(p.name)}</h2><p>${safe(clientName(p.clientId))} · ${safe(p.location)}</p></div><div class="drawer-tabs" role="tablist">${tabs.map(t=>`<button class="drawer-tab ${ui.tab===t?'active':''}" role="tab" aria-selected="${ui.tab===t}" data-action="drawer-tab" data-tab="${t}">${t==='estimate'?'Estimate':titleCase(t)}</button>`).join('')}</div><div class="drawer-body">${ui.tab==='overview'?detailOverview(p):ui.tab==='tasks'?detailTasks(p):ui.tab==='fixtures'?detailFixtures(p):detailEstimate(p)}</div></aside></div>`;}
  function detailOverview(p){const ratio=p.budget?Math.min(100,Math.round(p.spent/p.budget*100)):0;return `<div class="detail-grid"><div class="detail-tile"><small>Client</small><strong>${safe(clientName(p.clientId))}</strong></div><div class="detail-tile"><small>Target completion</small><strong>${formatDate(p.due)}</strong></div><div class="detail-tile"><small>Project value</small><strong>${money(p.budget)}</strong></div><div class="detail-tile"><small>Tasks complete</small><strong>${progress(p)}%</strong></div></div><div class="field-label">Project stage</div><select class="form-select" data-action="project-stage" data-id="${attr(p.id)}">${STAGES.map(s=>`<option ${p.stage===s?'selected':''}>${s}</option>`).join('')}</select><div class="detail-section"><h3>Project brief</h3><p>${safe(p.description)}</p><div class="field-label">Edit brief</div><textarea class="form-textarea" id="project-notes" rows="3" aria-label="Project brief">${safe(p.description)}</textarea><button class="button small" style="margin-top:9px" data-action="save-brief" data-id="${attr(p.id)}">Save brief</button></div><div class="detail-section"><h3>Budget snapshot</h3><div class="budget-track"><span style="width:${ratio}%"></span></div><div class="budget-metrics"><span>Spent <strong>${money(p.spent)}</strong></span><span>Budget <strong>${money(p.budget)}</strong></span></div><p class="notice">Values are illustrative, not linked to accounting software.</p></div><div class="detail-section"><h3>Next actions</h3>${p.tasks.filter(t=>!t.done).slice(0,3).map(t=>`<div class="task-row"><button class="task-check" aria-label="Complete ${attr(t.name)}" data-action="toggle-task" data-id="${attr(t.id)}"></button><span class="task-details"><span class="task-title">${safe(t.name)}</span><span class="task-sub">Due ${formatDate(t.due)}</span></span></div>`).join('')||'<p>No outstanding tasks.</p>'}<button class="button small" data-action="drawer-tab" data-tab="tasks">Manage tasks ${icon('arrow',12)}</button></div>`;}
  function detailTasks(p){return `<h3>Project task list</h3><p class="tagline" style="font-size:12px">${p.tasks.filter(t=>t.done).length} completed of ${p.tasks.length} tasks. Add the next deliverable or close out finished work.</p><div class="progress" style="margin:15px 0 20px;height:7px"><span style="width:${progress(p)}%"></span></div>${p.tasks.slice().sort((a,b)=>Number(a.done)-Number(b.done)||a.due.localeCompare(b.due)).map(t=>`<div class="task-row"><button class="task-check ${t.done?'done':''}" aria-label="${t.done?'Reopen':'Complete'} ${attr(t.name)}" data-action="toggle-task" data-id="${attr(t.id)}">${t.done?icon('check',12):''}</button><div class="task-details"><div class="task-title ${t.done?'done':''}">${safe(t.name)}</div><div class="task-sub">Due ${formatDate(t.due)}</div></div><span class="date-chip ${!t.done&&isLate(t.due)?'overdue':''}">${shortDay(t.due)}</span></div>`).join('')||empty('No tasks','Add a task below.')}<form class="detail-section" data-form="add-task"><h3>Add a task</h3><label class="field-label" for="task-name">Task description</label><input class="field" name="name" id="task-name" required maxlength="150" placeholder="e.g. Confirm final fixture schedule"><label class="field-label" for="task-date">Due date</label><input class="field" type="date" name="due" id="task-date" required value="${addDays(7)}"><input type="hidden" name="projectId" value="${attr(p.id)}"><button class="button primary" style="margin-top:13px" type="submit">${icon('plus',14)} Add task</button></form>`;}
  function detailFixtures(p){const total=projectFixtureCost(p);return `<h3>Project fixture schedule</h3><p style="font-size:12px;color:#95a2a7">A live bill of materials linked to your fixture library. Adjust the quantities to update the estimate.</p>${(p.fixtures||[]).map(item=>{const f=db.fixtures.find(f=>f.id===item.id);if(!f)return '';return `<div class="quote-line" style="align-items:center"><div><strong>${safe(f.name)}</strong><br><span>${safe(f.code)} · ${money(f.cost)} each</span></div><div style="display:flex;gap:7px;align-items:center"><label style="font-size:10px;color:#8a969c" for="qty-${attr(p.id)}-${attr(f.id)}">Qty</label><input class="field" style="width:73px" id="qty-${attr(p.id)}-${attr(f.id)}" type="number" min="0" max="99999" data-action="fixture-qty" data-project="${attr(p.id)}" data-id="${attr(f.id)}" value="${item.qty}" aria-label="Quantity of ${attr(f.name)}"><button class="icon-button" aria-label="Remove fixture" data-action="remove-fixture" data-project="${attr(p.id)}" data-id="${attr(f.id)}">${icon('x',14)}</button></div></div>`}).join('')}<div class="quote-total"><span>Estimated fixture cost</span><span>${currency(total)}</span></div><form class="detail-section" data-form="assign-fixture"><h3>Specify another fixture</h3><label class="field-label" for="choose-fixture">Fixture</label><select class="form-select" name="fixtureId" id="choose-fixture" required>${db.fixtures.filter(f=>!(p.fixtures||[]).some(x=>x.id===f.id)).map(f=>`<option value="${attr(f.id)}">${safe(f.name)} · ${safe(f.code)}</option>`).join('')||'<option value="" disabled>No unassigned fixtures</option>'}</select><label class="field-label" for="fixture-assign-qty">Quantity</label><input class="field" type="number" id="fixture-assign-qty" name="qty" min="1" max="99999" value="1" required><input type="hidden" name="projectId" value="${attr(p.id)}"><button type="submit" class="button primary" style="margin-top:14px" ${db.fixtures.every(f=>(p.fixtures||[]).some(x=>x.id===f.id))?'disabled':''}>${icon('plus',14)} Add to schedule</button></form>`;}
  function detailEstimate(p){const parts=quoteParts(p), subtotal=quoteTotal(p),gst=subtotal*.1;return `<div class="quote-sheet"><div class="quote-head"><div><strong>PHAENOMENON / ESTIMATE</strong><br><small>Indicative fee and supply estimate</small></div><span class="status proposal">DRAFT</span></div><h3>${safe(p.name)}</h3><p style="font-size:11px;color:#98a3a9;margin:0">For ${safe(clientName(p.clientId))}<br>Reference: ${safe(p.code)}</p><div style="margin-top:24px">${parts.map(x=>`<div class="quote-line"><span>${x.label}</span><strong>${currency(x.value)}</strong></div>`).join('')}<div class="quote-line"><span>GST (10%)</span><strong>${currency(gst)}</strong></div></div><div class="quote-total"><span>Total incl. GST</span><span>${currency(subtotal+gst)}</span></div></div><div class="inline-actions"><button class="button primary" data-action="print-estimate">${icon('print',15)} Print / save PDF</button><button class="button" data-action="drawer-tab" data-tab="fixtures">${icon('bulb',15)} Edit fixture schedule</button></div><div class="callout"><strong>Draft only.</strong> This is a demonstrative estimate assembled from fictional unit costs, design services and an installation allowance. It is not a tax invoice, final quotation or validated procurement schedule.</div>`;}
  function printSheet(){const p=db.projects.find(p=>p.id===ui.projectId);if(!p)return '';const sub=quoteTotal(p);return `<div class="print-only"><h1>PHAENOMENON · Indicative estimate</h1><p>Project: ${safe(p.name)}<br>Client: ${safe(clientName(p.clientId))}<br>Reference: ${safe(p.code)}<br>Date: ${formatDate(iso(new Date()))}</p><table><thead><tr><th>Item</th><th>Estimated amount (AUD)</th></tr></thead><tbody>${quoteParts(p).map(part=>`<tr><td>${part.label}</td><td>${currency(part.value)}</td></tr>`).join('')}<tr><td>GST (10%)</td><td>${currency(sub*.1)}</td></tr></tbody></table><div class="total">Total incl. GST: ${currency(sub*1.1)}</div><p style="margin-top:50px;color:#666;font-size:12px">DEMO ONLY. Fictional costs. Not a formal quotation, invoice or purchase order.</p></div>`;}

  /* Shared reusable venue/space selection in event forms. */
  const VE=()=>window.PhaenomenonVenueWorkflow;
  function venueOptionsHTML(venueId){
    return '<option value="" '+(!venueId?'selected':'')+'>Select a venue…</option>'+
      (db.venues||[]).slice().sort((a,b)=>a.name.localeCompare(b.name)).map(v=>
        '<option value="'+attr(v.id)+'" '+(v.id===venueId?'selected':'')+'>'+safe(v.name)+'</option>').join('')+
      '<option value="__new__">+ Create new venue…</option>';
  }
  function eventSpaceChoices(venueId,selectedIds){
    const venue=VE()?.findVenue(db,venueId);
    if(!venue)return '<p class="muted">Select a venue to choose its spaces.</p>';
    const spaces=VE().ensureSpaces(venue),selected=new Set(selectedIds||spaces.map(s=>s.id));
    return '<div class="venue-space-grid">'+spaces.map(sp=>
      '<label class="venue-space-option"><input type="checkbox" name="spaceIds" value="'+attr(sp.id)+'" '+(selected.has(sp.id)?'checked':'')+'><span><strong>'+safe(sp.name)+'</strong><small>'+safe(sp.geometry?.kind||sp.kind||'indoor')+' · '+safe(sp.width)+' × '+safe(sp.length)+' m</small></span></label>').join('')+
      '</div>';
  }
  function eventVenueFields(ev){
    const id=VE()?.findVenue(db,ev?.venueId)?.id||'';
    const fieldId=ev?'edit-venue-id':'new-venue-id';
    const available=id?VE()?.activeSpaces(ev,VE()?.findVenue(db,id)).map(s=>s.id):[];
    const fallback=ev?.venue&&!id?'<p class="venue-hint">Previous venue text: '+safe(ev.venue)+'. Select or create a reusable venue to link it.</p>':'';
    return '<div class="full venue-picker" data-venue-picker>'+
      '<div class="venue-picker-top"><label class="field-label" for="'+fieldId+'">Venue</label><button class="button small" type="button" data-action="venue-create">+ Create venue</button></div>'+
      '<select class="form-select" id="'+fieldId+'" data-venue-pick data-rendered-venue="'+(id||'')+'" name="venueId">'+venueOptionsHTML(id)+'</select>'+fallback+
      '<div class="venue-picker-top"><span class="field-label">Spaces used by this event</span><button class="button small" type="button" data-action="space-create" '+(!id?'disabled':'')+'>+ Create missing space</button></div>'+
      '<div data-space-choices>'+eventSpaceChoices(id,available)+'</div>'+
      '<p class="venue-hint">Venues and their spaces are reusable. Only checked spaces are included in this event; the venue library is never duplicated.</p></div>';
  }
  function refreshVenuePicker(picker,venueId,extraSpaceId){
    if(!picker)return;
    const dropdown=picker.querySelector('[data-venue-pick]');
    const previous=dropdown?.dataset.renderedVenue||'';
    const checked=[...picker.querySelectorAll('input[name="spaceIds"]:checked')].map(x=>x.value);
    if(dropdown){
      dropdown.innerHTML=venueOptionsHTML(venueId);
      dropdown.value=venueId||'';
      dropdown.dataset.renderedVenue=venueId||'';
    }
    const preserve=venueId===previous?checked:VE()?.ensureSpaces(VE()?.findVenue(db,venueId)).map(x=>x.id);
    if(extraSpaceId&&!preserve.includes(extraSpaceId))preserve.push(extraSpaceId);
    const spaceHost=picker.querySelector('[data-space-choices]');
    if(spaceHost)spaceHost.innerHTML=eventSpaceChoices(venueId,preserve);
    const add=picker.querySelector('[data-action="space-create"]');
    if(add)add.disabled=!venueId;
    picker.querySelector('.venue-hint')?.removeAttribute('hidden');
  }
  let quickVenueOrigin=null;
  function closeVenueQuick(){
    document.querySelector('[data-venue-quick-overlay]')?.remove();
    quickVenueOrigin=null;
  }
  function openVenueQuick(kind,picker){
    closeVenueQuick();
    const venueId=picker?.querySelector('[data-venue-pick]')?.value;
    if(kind==='space'&&!VE()?.findVenue(db,venueId)){alert('Select a saved venue before adding a space.');return;}
    quickVenueOrigin=picker;
    const name=kind==='venue'?'Create venue and first space':'Add space to '+VE().findVenue(db,venueId).name;
    const fields=kind==='venue'?'<label>Venue name<input class="field" name="venueName" maxlength="120" required placeholder="e.g. Abbotsford Convent"></label>':'<div class="venue-hint">The new space will be added to the existing venue, not as another venue.</div>';
    const html='<div class="venue-quick-backdrop" data-venue-quick-overlay role="presentation"><section class="venue-quick-dialog" role="dialog" aria-modal="true" aria-label="'+attr(name)+'"><header class="venue-picker-top"><div><h2>'+safe(name)+'</h2><p class="venue-hint">Dimensions are editable placeholders until checked on site.</p></div><button type="button" class="button" data-action="venue-quick-close" aria-label="Close">×</button></header>'+
      '<form data-form="'+(kind==='venue'?'quick-venue':'quick-space')+'" class="venue-quick-form">'+
      '<input type="hidden" name="venueId" value="'+attr(venueId||'')+'">'+fields+
      '<label>Space name<input class="field" name="spaceName" required maxlength="120" value="'+(kind==='venue'?'Main space':'')+'" placeholder="e.g. Indoor hall"></label>'+
      '<div class="form-grid"><label>Width (m)<input class="field" type="number" name="width" min="2" max="200" step="0.5" value="16" required></label>'+
      '<label>Length (m)<input class="field" type="number" name="length" min="2" max="200" step="0.5" value="12" required></label>'+
      '<label>Height (m)<input class="field" type="number" name="height" min="0.5" max="40" step="0.5" value="4" required></label>'+
      '<label>Environment<select class="form-select" name="kind"><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option></select></label></div>'+
      '<div class="venue-quick-actions"><button type="button" class="button" data-action="venue-quick-close">Cancel</button><button type="submit" class="button primary">'+(kind==='venue'?'Create venue':'Add space')+'</button></div></form></section></div>';
    document.body.insertAdjacentHTML('beforeend',html);
    document.querySelector('[data-venue-quick-overlay] input[name="'+(kind==='venue'?'venueName':'spaceName')+'"]')?.focus();
  }

  function modal(){const type=ui.modal;const titles={booking:['New event booking','Choose a repeat customer and capture the event brief.'],equipment:['New hire equipment','Add an item to the equipment kit catalogue.'],project:['New lighting project','Create a project with a client, scope and target date.'],lead:['New opportunity','Capture a potential lighting design commission.'],milestone:['New milestone','Put a meeting or delivery date on your studio calendar.'],fixture:['New fixture','Add a reusable fixture specification.'],client:['New client','Create a client record for future projects.']};const [heading,desc]=titles[type]||['New record',''];const field=(label,name,input='text',value='',extra='')=>`<div><label class="field-label" for="modal-${name}">${label}</label><input class="field" id="modal-${name}" type="${input}" name="${name}" value="${attr(value)}" ${extra}></div>`;
  let fields='';
  if(type==='booking')fields=`<div class="form-grid"><div class="full">${field('Event name','title','text','','required maxlength="120" placeholder="e.g. Spring brand launch"')}</div><div class="full"><label class="field-label">Repeat customer</label><select class="form-select" name="clientId" required>${clientOptions(db.clients[0]?.id)}</select></div>${field('Event date','date','date',addDays(21),'required')}${field('Expected guests','guests','number','120','min="1" max="5000" required')}${eventVenueFields(null)}${field('Lighting zones','zones','number','2','min="1" max="12" required')}<div><label class="field-label">Event type</label><select class="form-select" name="eventType">${eventOptions(EVENT_TYPES,'Corporate')}</select></div><div><label class="field-label">Production level</label><select class="form-select" name="complexity">${eventOptions(['Simple','Standard','Feature'],'Standard')}</select></div><div><label class="field-label">Environment</label><select class="form-select" name="environment">${eventOptions(['Indoor','Outdoor'],'Indoor')}</select></div></div>`;
  if(type==='equipment')fields=`<div class="form-grid"><div class="full">${field('Equipment name','name','text','','required maxlength="120"')}</div>${field('Category','category','text','Lighting','required maxlength="70"')}${field('Owned quantity','owned','number','1','required min="0" max="100000"')}${field('Hire per event (AUD)','rate','number','50','required min="0" max="100000" step="0.01"')}${field('Power (W) optional','watts','number','0','min="0" max="100000"')}</div>`;
  if(type==='project')fields=`<div class="form-grid"><div class="full">${field('Project name','name','text','','required maxlength="100" placeholder="e.g. Riverside Library"')}</div><div class="full"><label class="field-label">Client</label><select class="form-select" name="clientId" required>${db.clients.map(c=>`<option value="${attr(c.id)}">${safe(c.name)}</option>`).join('')||'<option value="" disabled>Add a client first</option>'}</select></div>${field('Project type','type','text','Commercial','required maxlength="50"')}${field('Budget (AUD)','budget','number','50000','min="0" step="1" required')}${field('Target completion','due','date',addDays(45),'required')}<div><label class="field-label">Stage</label><select class="form-select" name="stage">${STAGES.map(s=>`<option>${s}</option>`).join('')}</select></div><div class="full">${field('Location','location','text','Melbourne, Victoria','maxlength="100"')}</div></div>`;
  if(type==='lead')fields=`<div class="form-grid"><div class="full">${field('Project / opportunity','name','text','','required maxlength="100" placeholder="e.g. Pavilion Fitout"')}</div><div class="full">${field('Prospective client','client','text','','required maxlength="100"')}</div>${field('Project category','kind','text','Commercial','maxlength="50"')}${field('Estimated value (AUD)','value','number','50000','required min="0"')}<div class="full">${field('Next step / note','note','text','Brief to be confirmed','maxlength="140"')}</div></div>`;
  if(type==='milestone')fields=`${field('Milestone title','title','text','','required maxlength="130" placeholder="e.g. Site walkthrough"')}${field('Date','date','date',addDays(7),'required')}<label class="field-label">Project</label><select class="form-select" name="projectId"><option value="">Studio-wide</option>${db.projects.map(p=>`<option value="${attr(p.id)}">${safe(p.name)}</option>`).join('')}</select><label class="field-label">Category</label><select class="form-select" name="kind"><option value="review">Design review</option><option value="crew">Site / crew</option><option value="milestone">Milestone</option></select>`;
  if(type==='fixture')fields=`<div class="form-grid"><div class="full">${field('Fixture name','name','text','','required maxlength="100"')}</div>${field('Fixture code','code','text','','required maxlength="32"')}${field('Manufacturer','maker','text','','required maxlength="60"')}${field('Type','type','text','Downlight','required maxlength="40"')}${field('Colour temperature','cct','text','3000K','maxlength="30"')}${field('Beam angle','beam','text','24°','maxlength="30"')}${field('Available stock','stock','number','0','min="0" required')}${field('Unit cost (AUD)','cost','number','250','min="0" step="0.01" required')}</div>`;
  if(type==='client')fields=`${field('Client / business name','name','text','','required maxlength="100"')}${field('Primary contact','person','text','','required maxlength="100"')}${field('Email','email','email','','required maxlength="150"')}${field('Business type','type','text','Architecture / Design','maxlength="100"')}`;
  return `<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${attr(heading)}"><div class="modal-head"><div><h2>${heading}</h2><p>${desc}</p></div><button class="icon-button" aria-label="Close" data-action="close-modal">${icon('x',18)}</button></div><form data-form="new-${type}">${fields}<div class="modal-footer"><button type="button" class="button" data-action="close-modal">Cancel</button><button type="submit" class="button primary" ${type==='project'&&!db.clients.length?'disabled':''}>${icon('plus',14)} Create ${type==='milestone'?'milestone':type}</button></div></form></div></div>`;}
  function render(){let page='';switch(ui.view){case 'bookings':page=bookings();break;case 'spaces':page=spacePlannerPage();break;case 'invoices':page=invoices();break;case 'equipment':page=equipmentCatalog();break;case 'projects':page=projectCards();break;case 'pipeline':page=pipeline();break;case 'schedule':page=calendar();break;case 'fixtures':page=fixtures();break;case 'clients':page=clients();break;case 'settings':page=settings();break;case 'search':page=searchResults();break;default:page=overview();} $app.innerHTML=layout(page);if(ui.view==='spaces')window.PhaenomenonSpacePlanner?.mount(document.getElementById('space-planner-root'),db,save,flash,ui.eventId);document.title=`${navLinks.find(x=>x[0]===ui.view)?.[1]||'Overview'} · Phaenomenon`;}

  /* Event bookings + equipment planning + draft invoicing.
     Calculations are configurable planning heuristics, not rigging/power advice. */
  const EVENT_TYPES=['Corporate','Private party','Live music','Festival','Performance','Other'];
  const EVENT_STATUS=['Enquiry','Confirmed','Completed','Cancelled'];
  const BILL_STATUS=['Draft','Issued externally','Paid'];
  function demoEquipment(){return [
    {id:'eq-wash',name:'LED wash light',category:'Lighting',owned:16,rate:55,watts:180},
    {id:'eq-spot',name:'Moving-head spot',category:'Lighting',owned:8,rate:140,watts:500},
    {id:'eq-uplight',name:'Wireless uplight',category:'Lighting',owned:32,rate:35,watts:75},
    {id:'eq-outdoor',name:'Outdoor-rated wash light',category:'Lighting',owned:8,rate:95,watts:350},
    {id:'eq-control',name:'Lighting console / DMX controller',category:'Control',owned:2,rate:185,watts:80},
    {id:'eq-dmx',name:'DMX / data cable run',category:'Cabling',owned:40,rate:10,watts:0},
    {id:'eq-stand',name:'Lighting stand',category:'Rigging',owned:12,rate:25,watts:0},
    {id:'eq-distro',name:'Power distribution kit',category:'Power',owned:4,rate:75,watts:0},
    {id:'eq-power',name:'Extension cable / power run',category:'Cabling',owned:30,rate:10,watts:0},
  ];}
  function demoEventJobs(){return [
    {id:'ev-01',title:'Pier winter launch',clientId:'c1',date:addDays(12),venue:'Harbour Hall',eventType:'Corporate',guests:180,zones:3,environment:'Indoor',complexity:'Feature',status:'Confirmed',labourHours:8,labourRate:90,notes:'Returning client. Warm entrance look, product reveal and a short performance.',kit:[{id:'eq-wash',qty:8},{id:'eq-spot',qty:4},{id:'eq-uplight',qty:12},{id:'eq-control',qty:1},{id:'eq-stand',qty:4},{id:'eq-dmx',qty:12},{id:'eq-power',qty:9},{id:'eq-distro',qty:1}]},
    {id:'ev-02',title:'Quarterly showcase',clientId:'c4',date:addDays(27),venue:'Arts Warehouse',eventType:'Performance',guests:320,zones:2,environment:'Indoor',complexity:'Standard',status:'Confirmed',labourHours:12,labourRate:90,notes:'Regular quarterly show with changing stage positions.',kit:[{id:'eq-wash',qty:8},{id:'eq-spot',qty:4},{id:'eq-uplight',qty:8},{id:'eq-control',qty:1},{id:'eq-dmx',qty:12},{id:'eq-stand',qty:5},{id:'eq-distro',qty:1}]},
    {id:'ev-03',title:'Summer courtyard party',clientId:'c3',date:addDays(42),venue:'Northside Courtyard',eventType:'Private party',guests:90,zones:2,environment:'Outdoor',complexity:'Simple',status:'Enquiry',labourHours:6,labourRate:90,notes:'Check weather plan and site power before confirming.',kit:[]},
  ];}
  function demoInvoices(){return [
    {id:'inv-demo-1',number:'PH-INV-26001',eventId:'ev-01',clientId:'c1',issueDate:addDays(0),dueDate:addDays(14),status:'Draft',gstPercent:0,notes:'Demonstration draft. Confirm scope, business details, tax status and payment terms before issuing.',lines:[{id:'il1',description:'Lighting equipment hire – Pier winter launch',qty:1,rate:1770},{id:'il2',description:'Setup, programming and pack-down crew (hours)',qty:8,rate:90}]},
  ];}
  function assureEventData(workspace){
    if(!Array.isArray(workspace.equipment))workspace.equipment=demoEquipment();
    if(!Array.isArray(workspace.eventJobs))workspace.eventJobs=demoEventJobs();
    if(!Array.isArray(workspace.invoices))workspace.invoices=demoInvoices();
  }
  function eventClient(ev){return clientName(ev.clientId);}
  function getBooking(eventId){return db.eventJobs.find(x=>x.id===eventId);}
  function gearTotal(ev){return sum((ev.kit||[]).map(x=>x.qty*(db.equipment.find(y=>y.id===x.id)?.rate||0)));}
  function eventTotal(ev){return gearTotal(ev)+Math.max(0,ev.labourHours||0)*Math.max(0,ev.labourRate||0);}
  function overlapsOtherBookings(ev,gearId){return sum(db.eventJobs.filter(x=>x.id!==ev.id&&ev.date&&x.date===ev.date&&x.status==='Confirmed').map(x=>x.kit?.find(z=>z.id===gearId)?.qty||0));}
  function recommendEquipment(ev){
    const guests=Math.max(1,Math.min(5000,Number(ev.guests)||1));
    const zones=Math.max(1,Math.min(12,Number(ev.zones)||1));
    const factor=ev.complexity==='Feature'?1.35:ev.complexity==='Simple'?.72:1;
    const performance=['Performance','Live music','Festival'].includes(ev.eventType);
    const wash=Math.ceil((zones*2+guests/85)*factor);
    const spots=performance?Math.ceil((2+guests/140)*factor):(ev.complexity==='Feature'?Math.ceil(zones*.75):0);
    const uplight=Math.ceil((zones*3+guests/(performance?95:50))*factor);
    const outdoor=ev.environment==='Outdoor'?Math.ceil(zones*2*factor):0;
    return {'eq-wash':wash,'eq-spot':spots,'eq-uplight':uplight,'eq-outdoor':outdoor,'eq-control':1,'eq-dmx':Math.ceil((wash+spots+outdoor)/2)+2,'eq-stand':Math.ceil((wash+spots+outdoor)/3),'eq-distro':ev.environment==='Outdoor'?2:1,'eq-power':Math.ceil((wash+spots+uplight+outdoor)/3)+1};
  }
  function invoiceSub(inv){return sum((inv.lines||[]).map(x=>(Number(x.qty)||0)*(Number(x.rate)||0)));}
  function invoiceGST(inv){return invoiceSub(inv)*(Number(inv.gstPercent)||0)/100;}
  function invoiceSum(inv){return invoiceSub(inv)+invoiceGST(inv);}
  function nextInvoiceNumber(){let i=db.invoices.length+1,s;do{s=`PH-INV-${String(new Date().getFullYear()).slice(-2)}${String(i).padStart(3,'0')}`;i++;}while(db.invoices.some(x=>x.number===s));return s;}
  const eventOptions=(options,selected)=>options.map(x=>`<option value="${attr(x)}" ${x===selected?'selected':''}>${safe(x)}</option>`).join('');
  const clientOptions=selected=>db.clients.map(x=>`<option value="${attr(x.id)}" ${x.id===selected?'selected':''}>${safe(x.name)}</option>`).join('');
  function spacePlannerPage(){return heading('SPACE DESIGN','3D space planner','Reuse venue dimensions, arrange equipment and estimate cable routes.','')+'<div id="space-planner-root"></div>';}
  function eventsHomeStrip(){
    const upcoming=db.eventJobs.filter(x=>x.date>=iso(new Date())&&x.status!=='Cancelled').sort((a,b)=>a.date.localeCompare(b.date));
    const next=upcoming[0];
    return '<section class="event-hero panel"><div><div class="eyebrow">EVENTS</div><h2>Plan and run your events</h2>'+
      '<p>'+(next?'Next: <strong>'+safe(next.title)+'</strong> on '+formatDate(next.date)+'.':'Choose an event or create a new booking.')+
      ' Your venue, spaces, design, crew and production tasks stay connected.</p>'+
      '<div class="inline-actions"><button class="button primary" data-action="nav" data-view="bookings">'+icon('calendar',15)+' Events</button>'+
      '<a class="button" href="production.html#/builder/'+encodeURIComponent(ui.eventId||next?.id||'')+'">Continue event builder →</a></div></div>'+
      '<div class="event-hero-stats"><span><strong>'+db.eventJobs.filter(x=>x.status==='Confirmed'&&x.date>=iso(new Date())).length+'</strong> upcoming confirmed</span>'+
      '<span><strong>'+db.eventJobs.filter(x=>x.status==='Enquiry').length+'</strong> enquiries</span></div></section>';
  }
  function bookingList(){return db.eventJobs.slice().sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')).map(ev=>`<button class="event-picker ${ui.eventId===ev.id?'chosen':''}" data-action="select-booking" data-id="${attr(ev.id)}"><span class="event-picker-top"><strong>${safe(ev.title)}</strong>${stageStatus(ev.status)}</span><span>${safe(eventClient(ev))} · ${ev.date?formatDate(ev.date):safe(window.PhaenomenonLifecycle.dateDisplay(ev))}</span><small>${safe(ev.venue||'Venue to be confirmed')} · ${safe(window.PhaenomenonLifecycle.label('booking',window.PhaenomenonLifecycle.ensureEvent(ev).bookingStage))}</small></button>`).join('')||empty('No event bookings','Create your first event.');}
  function bookings(){const all=db.eventJobs,ev=getBooking(ui.eventId)||all[0];if(ev)ui.eventId=ev.id;return `${heading('EVENTS','Events','Choose an event to edit its details, venue spaces or equipment kit.',`<button class="button primary" data-action="open-modal" data-type="booking">${icon('plus',14)} New event</button>`)}<details class="bookings-metrics"><summary>Booking summary <span>▾</span></summary><div class="event-summary cards-4">${metric('Future bookings',all.filter(x=>x.date>=iso(new Date())&&x.status==='Confirmed').length,'Confirmed events','calendar')}${metric('Open enquiries',all.filter(x=>x.status==='Enquiry').length,'Waiting for confirmation','mail')}${metric('Equipment types',db.equipment.length,'Editable hire catalogue','bulb')}${metric('Draft invoices',db.invoices.filter(x=>x.status==='Draft').length,'Ready to review','file')}</div></details><div class="event-layout"><details class="mobile-event-switch"><summary><span><small>SELECTED EVENT</small><strong>${ev?safe(ev.title):'No events yet'}</strong><span class="mobile-event-date">${ev?formatDate(ev.date):'Create an event to begin'}</span></span><span class="mobile-event-chevron" aria-hidden="true">⌄</span></summary><div class="mobile-event-options">${bookingList()}</div></details><aside class="panel event-side"><div class="panel-head"><div><h2>Your events</h2><p class="subtitle">Select an event to continue</p></div></div>${bookingList()}</aside><section class="panel event-work">${ev?bookingDetail(ev):empty('Choose an event','Create a booking to get started.')}</section></div>`;}
  function bookingDetail(ev){const suggested=recommendEquipment(ev),planMap=Object.fromEntries((ev.kit||[]).map(x=>[x.id,x.qty]));const kitTotal=gearTotal(ev),conflicts=[];
    const gearRows=db.equipment.map(g=>{const assigned=planMap[g.id]||0,reserved=overlapsOtherBookings(ev,g.id),free=Math.max(0,g.owned-reserved),warning=assigned>free&&ev.status!=='Cancelled';if(warning)conflicts.push(`${g.name}: ${assigned} required, ${free} available`);return `<tr><td><strong>${safe(g.name)}</strong><small>${safe(g.category)}</small></td><td>${Number(suggested[g.id])||0}</td><td><input class="field compact-input" type="number" min="0" max="9999" value="${assigned}" aria-label="${attr(g.name)} quantity" data-action="booking-kit-qty" data-id="${attr(g.id)}" data-event="${attr(ev.id)}"></td><td>${free} / ${g.owned}</td><td>${currency(g.rate)}</td><td>${currency(assigned*g.rate)}</td><td>${warning?'<span class="risk-pill">Check stock</span>':''}</td></tr>`;}).join('');
    return `<div class="event-work-head"><div><div class="eyebrow">${safe(ev.status.toUpperCase())} · ${safe(ev.eventType.toUpperCase())}</div><h2>${safe(ev.title)}</h2><p>${safe(eventClient(ev))} · ${safe(ev.venue)}</p></div><div class="inline-actions"><a class="button primary small" href="production.html#/builder/${encodeURIComponent(ev.id)}">Event builder →</a><a class="button small" href="#/spaces" data-action="open-space" data-id="${attr(ev.id)}">${icon('layers',13)} 3D planner</a><details class="event-more"><summary class="button small">More ▾</summary><div class="event-more-list"><button class="button small" data-action="duplicate-booking" data-id="${attr(ev.id)}">Rebook event</button><button class="button small" data-action="invoice-from-booking" data-id="${attr(ev.id)}">Draft invoice</button></div></details></div></div>
    <nav class="event-detail-tabs" role="tablist" aria-label="Event planning sections">
      <button type="button" class="event-detail-tab ${ui.bookingTab==='details'?'active':''}" data-action="booking-tab" data-tab="details" role="tab" aria-controls="booking-details" aria-selected="${ui.bookingTab==='details'}">Event details</button>
      <button type="button" class="event-detail-tab ${ui.bookingTab==='equipment'?'active':''}" data-action="booking-tab" data-tab="equipment" role="tab" aria-controls="booking-equipment" aria-selected="${ui.bookingTab==='equipment'}">Equipment kit <span class="event-tab-count">${(ev.kit||[]).reduce((total,item)=>total+(Number(item.qty)||0),0)}</span></button>
    </nav>
    <section class="event-detail-panel" data-booking-panel="details" id="booking-details" role="tabpanel" ${ui.bookingTab==='details'?'':'hidden'}>
    <form class="event-form" data-form="edit-booking"><input type="hidden" name="id" value="${attr(ev.id)}"><div class="form-grid event-fields"><div class="full"><label class="field-label">Event name</label><input class="field" name="title" maxlength="120" required value="${attr(ev.title)}"></div><div><label class="field-label">Customer</label><select class="form-select" name="clientId"><option value="">Not known yet</option>${clientOptions(ev.clientId)}</select></div><div><label class="field-label">Event date</label><input class="field" type="date" name="date" value="${attr(ev.date)}"></div>${eventVenueFields(ev)}<div><label class="field-label">Event type</label><select class="form-select" name="eventType">${eventOptions(EVENT_TYPES,ev.eventType)}</select></div><div><label class="field-label">Guests / audience</label><input class="field" type="number" min="1" max="5000" name="guests" required value="${ev.guests}"></div><div><label class="field-label">Lighting zones (kit estimate)</label><input class="field" type="number" min="1" max="12" name="zones" required value="${ev.zones}"></div><div><label class="field-label">Environment</label><select class="form-select" name="environment">${eventOptions(['Indoor','Outdoor'],ev.environment)}</select></div><div><label class="field-label">Production level</label><select class="form-select" name="complexity">${eventOptions(['Simple','Standard','Feature'],ev.complexity)}</select></div>${window.PhaenomenonLifecycleUI.fields(ev,{includeDate:false})}<div><label class="field-label">Crew hours</label><input class="field" type="number" name="labourHours" step="0.5" min="0" max="1000" value="${ev.labourHours||0}"></div><div><label class="field-label">Crew hourly rate (AUD)</label><input class="field" type="number" name="labourRate" step="0.01" min="0" max="100000" value="${ev.labourRate||0}"></div><div class="full"><label class="field-label">Event brief / notes</label><textarea class="form-textarea" name="notes" maxlength="3000">${safe(ev.notes||'')}</textarea></div></div><div class="inline-actions event-form-actions"><button type="submit" class="button primary">${icon('check',14)} Save brief & recalculate</button><small>Changing parameters recalculates suggested quantities after you save; assigned quantities stay as they were until you apply suggestions.</small></div></form></section>
    <section class="event-detail-panel" data-booking-panel="equipment" id="booking-equipment" role="tabpanel" ${ui.bookingTab==='equipment'?'':'hidden'}>
    <div class="equipment-head"><div><h3>Suggested equipment kit</h3><p>Rule-of-thumb starting quantities based on guest count, zones, event type, environment and production level.</p></div><button class="button gold" data-action="apply-kit" data-id="${attr(ev.id)}">${icon('spark',14)} Apply suggestions</button></div>
    <div class="table-wrap"><table class="data-table equipment-table"><thead><tr><th>Equipment</th><th>Suggested</th><th>Assigned</th><th>Available / owned</th><th>Hire per unit</th><th>Line total</th><th>Notes</th></tr></thead><tbody>${gearRows}</tbody></table></div>
    ${conflicts.length?`<div class="stock-warning"><strong>Stock conflicts to review:</strong> ${safe(conflicts.join(' · '))}. The availability estimate subtracts equipment assigned to other confirmed events on the same date only.</div>`:'<p class="gear-advice">Stock check is illustrative. Verify inventory, transport, access, venue power, rigging, weather and local regulations before committing to a job.</p>'}
    <div class="event-totals"><span><small>Equipment hire (ex GST)</small><strong>${currency(kitTotal)}</strong></span><span><small>Estimated crew</small><strong>${currency((ev.labourHours||0)*(ev.labourRate||0))}</strong></span><span><small>Draft subtotal (ex GST)</small><strong>${currency(eventTotal(ev))}</strong></span></div></section>`;}
  function equipmentCatalog(){return `${heading('EQUIPMENT LIBRARY','Hire equipment','Configure your real stock and indicative per-event hire rates. Editing these changes future planning and draft invoice estimates.',`<button class="button primary" data-action="open-modal" data-type="equipment">${icon('plus',14)} Add equipment</button>`)}<section class="panel"><div class="table-wrap"><table class="data-table catalogue-table"><thead><tr><th>Equipment</th><th>Category</th><th>Owned</th><th>Hire / event (AUD)</th><th>Rated watts / unit</th><th></th></tr></thead><tbody>${db.equipment.map(x=>`<tr><td><strong>${safe(x.name)}</strong></td><td>${safe(x.category)}</td><td colspan="4"><form class="equipment-edit" data-form="edit-equipment"><input name="id" type="hidden" value="${attr(x.id)}"><input type="number" class="field compact-input" name="owned" min="0" max="100000" value="${x.owned}" aria-label="Owned quantity of ${attr(x.name)}"><input type="number" class="field compact-input" name="rate" min="0" max="100000" step="0.01" value="${x.rate}" aria-label="Hire rate for ${attr(x.name)}"><input type="number" class="field compact-input" name="watts" min="0" max="100000" value="${x.watts||0}" aria-label="Watts for ${attr(x.name)}"><button class="button small" type="submit">Save</button></form></td></tr>`).join('')}</tbody></table></div></section><div class="callout"><strong>Equipment library, not an electrical design tool.</strong> Suggested quantities are editable heuristics. Rated watts are inventory notes only and are not used to certify load, circuits, rigging or safe installations.</div>`;}
  function invoiceList(){return db.invoices.slice().sort((a,b)=>b.issueDate.localeCompare(a.issueDate)).map(x=>`<button class="event-picker ${ui.invoiceId===x.id?'chosen':''}" data-action="select-invoice" data-id="${attr(x.id)}"><span class="event-picker-top"><strong>${safe(x.number)}</strong>${stageStatus(x.status)}</span><span>${safe(clientName(x.clientId))}</span><small>${formatDate(x.issueDate)} · ${currency(invoiceSum(x))}</small></button>`).join('')||empty('No invoices','Create one from an event or add a manual invoice.');}
  function invoices(){const inv=db.invoices.find(x=>x.id===ui.invoiceId)||db.invoices[0];if(inv)ui.invoiceId=inv.id;const unpaid=sum(db.invoices.filter(x=>x.status!=='Paid').map(invoiceSum));return `${heading('BILLING','Draft invoices','Prepare line items for repeat customers, then print to PDF and record external payment status.',`<button class="button primary" data-action="new-invoice">${icon('plus',14)} New draft invoice</button>`)}<div class="cards-4 event-summary">${metric('Drafts',db.invoices.filter(x=>x.status==='Draft').length,'Not issued','file')}${metric('Issued externally',db.invoices.filter(x=>x.status==='Issued externally').length,'Manual status tracking','mail')}${metric('Unpaid amount',money(unpaid),'Includes all open drafts','wallet')}${metric('Paid',db.invoices.filter(x=>x.status==='Paid').length,'Marked paid manually','check')}</div><div class="event-layout"><aside class="panel event-side"><div class="panel-head"><div><h2>Invoices</h2><p class="subtitle">Editable drafts and status tracking</p></div></div>${invoiceList()}</aside><section class="panel event-work">${inv?invoiceDetail(inv):empty('No invoices yet','Create a draft invoice to begin.')}</section></div>`;}
  function invoiceDetail(inv){const ev=getBooking(inv.eventId);return `<div class="event-work-head"><div><div class="eyebrow">DEMO BILLING · ${safe(inv.status.toUpperCase())}</div><h2>${safe(inv.number)}</h2><p>${safe(clientName(inv.clientId))}${ev?' · '+safe(ev.title):''}</p></div><button class="button primary small" data-action="print-invoice" data-id="${attr(inv.id)}">${icon('print',14)} Print / PDF</button></div>
    <form data-form="edit-invoice" class="event-form"><input type="hidden" name="id" value="${attr(inv.id)}"><div class="form-grid event-fields"><div><label class="field-label">Invoice reference</label><input class="field" name="number" maxlength="60" required value="${attr(inv.number)}"></div><div><label class="field-label">Customer</label><select class="form-select" name="clientId">${clientOptions(inv.clientId)}</select></div><div><label class="field-label">Issue date</label><input class="field" name="issueDate" type="date" required value="${attr(inv.issueDate)}"></div><div><label class="field-label">Due date</label><input class="field" name="dueDate" type="date" required value="${attr(inv.dueDate)}"></div><div><label class="field-label">Status (manual)</label><select class="form-select" name="status">${eventOptions(BILL_STATUS,inv.status)}</select></div><div><label class="field-label">GST treatment</label><select class="form-select" name="gstPercent"><option value="0" ${!inv.gstPercent?'selected':''}>No GST (0%)</option><option value="10" ${inv.gstPercent===10?'selected':''}>Add GST (10%, only if registered)</option></select></div></div>
    <h3 class="billing-subhead">Invoice line items</h3><div class="invoice-lines">${(inv.lines||[]).map((line,i)=>`<div class="invoice-item"><div><label class="field-label">Description</label><input class="field" name="desc_${i}" maxlength="180" value="${attr(line.description)}" required></div><div><label class="field-label">Qty</label><input class="field" type="number" name="qty_${i}" step="0.01" min="0" max="100000" value="${line.qty}" required></div><div><label class="field-label">Unit price</label><input class="field" type="number" name="rate_${i}" step="0.01" min="0" max="10000000" value="${line.rate}" required></div><button class="icon-button" type="button" data-action="delete-invoice-line" data-id="${attr(inv.id)}" data-index="${i}" aria-label="Remove line item">${icon('x',16)}</button></div>`).join('')}</div><div class="inline-actions"><button class="button small" type="button" data-action="add-invoice-line" data-id="${attr(inv.id)}">${icon('plus',12)} Add line</button></div><div class="full"><label class="field-label">Payment instructions / notes</label><textarea class="form-textarea" name="notes" maxlength="3000" placeholder="Payment terms, bank details, reference and business identification (if used outside this demo)">${safe(inv.notes||'')}</textarea></div><div class="invoice-total"><span>Subtotal ${currency(invoiceSub(inv))}</span><span>GST ${currency(invoiceGST(inv))}</span><strong>Total ${currency(invoiceSum(inv))}</strong></div><div class="inline-actions event-form-actions"><button type="submit" class="button primary">${icon('check',14)} Save draft</button><small>Invoice total refreshes after saving. Printing does not send an email or collect a payment.</small></div></form><div class="callout"><strong>Prototype only.</strong> This is a draft document, not a validated Australian tax invoice or connected accounting system. Real use requires correct business identity/ABN, GST registration treatment, customer details, numbering and payment information. Never enter real sensitive client or payment details in this public demo.</div>`;}
  function invoicePrintPage(){const inv=db.invoices.find(x=>x.id===ui.printInvoiceId);if(!inv)return '';const ev=getBooking(inv.eventId);return `<div class="print-only invoice-print"><div class="print-head"><div><h1>PHAENOMENON</h1><p>Demonstration event lighting studio</p></div><div><strong>INVOICE · DEMO DRAFT</strong><p>${safe(inv.number)}</p></div></div><div class="invoice-print-meta"><div><strong>Bill to</strong><p>${safe(clientName(inv.clientId))}</p>${ev?`<p>${safe(ev.title)} · ${formatDate(ev.date)}</p>`:''}</div><div><p>Issue date: ${formatDate(inv.issueDate)}</p><p>Due date: ${formatDate(inv.dueDate)}</p><p>Status: ${safe(inv.status)}</p></div></div><table><thead><tr><th>Item</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${inv.lines.map(line=>`<tr><td>${safe(line.description)}</td><td>${Number(line.qty)||0}</td><td>${currency(line.rate)}</td><td>${currency((Number(line.qty)||0)*(Number(line.rate)||0))}</td></tr>`).join('')}</tbody></table><div class="invoice-print-total"><p>Subtotal: ${currency(invoiceSub(inv))}</p><p>GST (${inv.gstPercent||0}%): ${currency(invoiceGST(inv))}</p><strong>Total AUD: ${currency(invoiceSum(inv))}</strong></div><p class="print-note">${safe(inv.notes||'')}</p><p class="print-disclaimer">DEMONSTRATION ONLY. Fictional business and customers. Not a valid tax invoice or payment request.</p></div>`;}
  function newInvoice(eventId=null){const ev=getBooking(eventId),lines=ev?[...(ev.kit||[]).filter(x=>x.qty>0).map(x=>{const g=db.equipment.find(y=>y.id===x.id);return {id:id('il'),description:`${g?.name||'Equipment'} hire`,qty:x.qty,rate:g?.rate||0};}),{id:id('il'),description:'Crew setup / operation / pack-down (hours)',qty:ev.labourHours||0,rate:ev.labourRate||0}]:[{id:id('il'),description:'Lighting services',qty:1,rate:0}];
    const inv={id:id('inv'),number:nextInvoiceNumber(),eventId:ev?.id||null,clientId:ev?.clientId||db.clients[0]?.id,issueDate:iso(new Date()),dueDate:addDays(14),status:'Draft',gstPercent:0,notes:'Review business details, tax treatment and payment instructions before issuing externally.',lines};mutate(()=>{db.invoices.unshift(inv);ui.invoiceId=inv.id;ui.view='invoices';location.hash='#/invoices/'+inv.id;},'Draft invoice created');}

  // Event delegation means forms and controls continue working after rerenders.
  document.addEventListener('click',e=>{
    const menuLink=e.target?.closest?.('#studio-navigation a[href]');
    if(menuLink?.tagName==='A'){
      document.getElementById('studio-sidebar')?.classList?.remove('is-expanded');
      document.body?.classList?.remove('ph-studio-menu-open');
    }
    const el=e.target.closest('[data-action]');if(!el)return;
    const action=el.dataset.action;
    if(action==='close-drawer-backdrop'&&e.target!==el)return;
    if(action==='modal-backdrop'&&e.target!==el)return;
    if(['select-booking','select-invoice','duplicate-booking','invoice-from-booking','apply-kit','new-invoice','add-invoice-line','delete-invoice-line','print-invoice','project','nav','filter','open-modal','close-project','drawer-tab','close-modal','modal-backdrop','close-drawer-backdrop','toggle-task','month-prev','month-next','month-today','select-day','clear-day','convert-lead','remove-fixture','save-brief','print-estimate','export','import','reset','view-guide','nav-client','nav-fixture'].includes(action))e.preventDefault();
    if(action==='venue-quick-close'){e.preventDefault();closeVenueQuick();return;}
    if(action==='venue-create'||action==='space-create'){
      e.preventDefault();openVenueQuick(action==='venue-create'?'venue':'space',el.closest('[data-venue-picker]'));return;
    }
    if(action==='booking-tab'){
      e.preventDefault();
      const tab=el.dataset.tab;
      if(!['details','equipment'].includes(tab))return;
      ui.bookingTab=tab;
      const host=el.closest('.event-work');
      host?.querySelectorAll('[data-booking-panel]').forEach(panel=>{panel.hidden=panel.dataset.bookingPanel!==tab;});
      host?.querySelectorAll('[data-action="booking-tab"]').forEach(button=>{
        const selected=button.dataset.tab===tab;
        button.classList.toggle('active',selected);
        button.setAttribute('aria-selected',selected?'true':'false');
      });
      return;
    }
    if(action==='toggle-sidebar'||action==='close-sidebar'){
      e.preventDefault();
      const sidebar=document.getElementById('studio-sidebar');
      const next=action==='toggle-sidebar'?!sidebar?.classList?.contains('is-expanded'):false;
      sidebar?.classList?.toggle('is-expanded',next);
      document.body?.classList?.toggle('ph-studio-menu-open',next);
      sidebar?.querySelector('.nav-mobile-toggle')?.setAttribute('aria-expanded',next?'true':'false');
      document.querySelector('.studio-mobile-more')?.setAttribute('aria-expanded',next?'true':'false');
      if(next)sidebar?.querySelector('.nav-items a[href]')?.focus();
      else if(action==='close-sidebar')document.querySelector('.studio-mobile-more')?.focus();
      return;
    }
    if(action==='open-space'){e.preventDefault();ui.eventId=el.dataset.id;location.hash='#/spaces';renderRoute();return;}
    if(action==='select-booking'){ui.bookingTab='details';ui.eventId=el.dataset.id;location.hash='#/bookings/'+encodeURIComponent(ui.eventId);renderRoute();}
    if(action==='select-invoice'){ui.invoiceId=el.dataset.id;location.hash='#/invoices/'+encodeURIComponent(ui.invoiceId);renderRoute();}
    if(action==='duplicate-booking'){const original=getBooking(el.dataset.id);if(original){const copy={...original,id:id('ev'),title:original.title+' (new booking)',date:addDays(30),status:'Enquiry',kit:original.kit.map(k=>({...k})),notes:original.notes};mutate(()=>{db.eventJobs.push(copy);if(db.venuePlans?.[original.id]){const p=db.venuePlans[original.id];const remap=Object.fromEntries((p.items||[]).map(x=>[x.id,id('obj')]));db.venuePlans[copy.id]={venueId:p.venueId,items:(p.items||[]).map(x=>({...x,id:remap[x.id]})),runs:(p.runs||[]).map(r=>({...r,id:id('run'),from:remap[r.from],to:remap[r.to]}))};}ui.eventId=copy.id;location.hash='#/bookings/'+copy.id;},'Repeat booking copied. Check the new date and kit.');}}
    if(action==='apply-kit'){const ev=getBooking(el.dataset.id);if(ev&&(!(ev.kit||[]).length||confirm('Replace assigned equipment quantities with the suggested starting kit?'))){mutate(()=>{ev.kit=Object.entries(recommendEquipment(ev)).filter(([_,qty])=>qty>0&&db.equipment.some(g=>g.id===_)).map(([id,qty])=>({id,qty}));},'Suggested kit applied. Review stock and suitability.');}}
    if(action==='invoice-from-booking')newInvoice(el.dataset.id);
    if(action==='new-invoice')newInvoice();
    if(action==='add-invoice-line'){const inv=db.invoices.find(x=>x.id===el.dataset.id);if(inv)mutate(()=>inv.lines.push({id:id('il'),description:'New service / equipment',qty:1,rate:0}),'Line added. Save your invoice details before adding another.');}
    if(action==='delete-invoice-line'){const inv=db.invoices.find(x=>x.id===el.dataset.id),idx=Number(el.dataset.index);if(inv&&inv.lines.length>1&&Number.isInteger(idx)&&idx>=0&&idx<inv.lines.length)mutate(()=>inv.lines.splice(idx,1),'Line removed');else if(inv)flash('Keep at least one line item');}
    if(action==='print-invoice'){ui.printInvoiceId=el.dataset.id;render();window.print();}
    if(action==='nav')nav(el.dataset.view);
    if(action==='nav-client')nav('clients');
    if(action==='nav-fixture')nav('fixtures');
    if(action==='project')openProject(el.dataset.id);
    if(action==='close-project'||action==='close-drawer-backdrop')closeProject();
    if(action==='filter'){ui.filter=el.dataset.value;render();}
    if(action==='drawer-tab'){ui.tab=el.dataset.tab;render();}
    if(action==='open-modal'){ui.modal=el.dataset.type;render();document.querySelector('.modal input')?.focus();}
    if(action==='close-modal'||action==='modal-backdrop'){ui.modal=null;render();}
    if(action==='toggle-task')mutate(()=>{for(const p of db.projects){const t=p.tasks.find(t=>t.id===el.dataset.id);if(t){t.done=!t.done;break;}}},'Task updated');
    if(action==='month-prev'||action==='month-next'){ui.calendar=new Date(ui.calendar.getFullYear(),ui.calendar.getMonth()+(action==='month-next'?1:-1),1);ui.selectedDate=null;render();}
    if(action==='month-today'){ui.calendar=new Date(new Date().getFullYear(),new Date().getMonth(),1);ui.selectedDate=iso(new Date());render();}
    if(action==='select-day'){ui.selectedDate=el.dataset.day;render();}
    if(action==='clear-day'){ui.selectedDate=null;render();}
    if(action==='convert-lead')mutate(()=>{const l=db.leads.find(l=>l.id===el.dataset.id);if(!l||l.stage!=='Won')return;let client=db.clients.find(c=>c.name.toLowerCase()===l.client.toLowerCase());if(!client){client={id:id('c'),name:l.client,person:'Contact to confirm',email:'contact@demo.example',type:l.kind};db.clients.push(client);}const p={id:id('p'),code:`PH-${String(new Date().getFullYear()).slice(2)}${String(db.projects.length+1).padStart(2,'0')}`,name:l.name,clientId:client.id,type:l.kind,stage:'Concept',budget:l.value,spent:0,designFee:Math.round(l.value*.12),installationFee:Math.round(l.value*.17),due:addDays(60),location:'Location to confirm',tone:['#566b71','#293e43'],description:l.note||'Initial brief to be confirmed.',tasks:[{id:id('t'),name:'Confirm project brief',due:addDays(7),done:false}],fixtures:[]};db.projects.push(p);db.leads=db.leads.filter(x=>x.id!==l.id);ui.view='projects';ui.projectId=p.id;location.hash='#/projects/'+p.id;},'Opportunity converted into a project');
    if(action==='remove-fixture')mutate(()=>{const p=db.projects.find(p=>p.id===el.dataset.project);if(p)p.fixtures=p.fixtures.filter(f=>f.id!==el.dataset.id);},'Fixture removed from schedule');
    if(action==='save-brief'){const note=document.getElementById('project-notes')?.value||'';mutate(()=>{const p=db.projects.find(p=>p.id===el.dataset.id);if(p)p.description=note.slice(0,5000);},'Project brief saved');}
    if(action==='print-estimate')window.print();
    if(action==='export')exportData();
    if(action==='import')$import.click();
    if(action==='reset'){if(confirm('Replace all edits in this browser with the original fictional sample data?')){db=seed();save();ui.projectId=null;ui.eventId=null;ui.invoiceId=null;ui.modal=null;location.hash='#/overview';renderRoute();flash('Fresh demo data restored');}}
    if(action==='view-guide')nav('settings');
  });
  document.addEventListener('change',e=>{
    const el=e.target;if(!el.dataset.action)return;
    if(el.dataset.action==='booking-kit-qty'){const ev=getBooking(el.dataset.event),gear=db.equipment.find(g=>g.id===el.dataset.id);if(ev&&gear)mutate(()=>{const qty=Math.min(9999,Math.max(0,Math.floor(Number(el.value)||0)));ev.kit=ev.kit.filter(x=>x.id!==gear.id);if(qty>0)ev.kit.push({id:gear.id,qty});},'Assigned quantity updated');}
    if(el.dataset.action==='project-stage'){mutate(()=>{const p=db.projects.find(p=>p.id===el.dataset.id);if(p&&STAGES.includes(el.value))p.stage=el.value;},'Project stage updated');}
    if(el.dataset.action==='lead-stage'){mutate(()=>{const l=db.leads.find(l=>l.id===el.dataset.id);if(l&&LEAD_STAGES.includes(el.value))l.stage=el.value;},'Opportunity moved');}
    if(el.dataset.action==='fixture-qty'){mutate(()=>{const p=db.projects.find(p=>p.id===el.dataset.project),f=p?.fixtures.find(x=>x.id===el.dataset.id);if(f)f.qty=Math.max(0,Math.min(99999,Number(el.value)||0));},'Quantity updated');}
  });
  document.addEventListener('input',e=>{
    const el=e.target;
    const type=el.id;if(!['global-search','project-search','fixture-search'].includes(type))return;
    const key=type==='fixture-search'?'fixtureSearch':'search';ui[key]=el.value;const selection=el.selectionStart;if(type==='global-search'){ui.view='search';if(location.hash!=='#/search')location.hash='#/search';}render();const next=document.getElementById(type);if(next){next.focus();try{next.setSelectionRange(selection,selection);}catch(_){}}
  });
  document.addEventListener('change',e=>{
    const field=e.target.closest('[data-venue-pick]');
    if(!field)return;
    const picker=field.closest('[data-venue-picker]');
    if(field.value==='__new__'){
      const prior=field.dataset.renderedVenue||'';
      field.value=prior;
      openVenueQuick('venue',picker);
      return;
    }
    refreshVenuePicker(picker,field.value);
  });
  document.addEventListener('submit',e=>{
    const form=e.target.closest('[data-form]');if(!form)return;e.preventDefault();const a=new FormData(form),val=n=>String(a.get(n)||'').trim(),num=n=>Math.max(0,Number(a.get(n))||0),which=form.dataset.form;
    if(which==='quick-venue'||which==='quick-space'){
      const params={name:val('venueName'),spaceName:val('spaceName'),width:val('width'),length:val('length'),height:val('height'),kind:val('kind')};
      const result=which==='quick-venue'?VE().addVenue(db,params):VE().addSpace(db,val('venueId'),{...params,name:val('spaceName')});
      if(result.error&&!result.existing){alert(result.error);return;}
      if(result.venue&&!result.error){if(!save())return;}
      refreshVenuePicker(quickVenueOrigin,result.venue?.id||(which==='quick-venue'?result.existing?.id:val('venueId')),result.space?.id||(which==='quick-space'?result.existing?.id:undefined));
      closeVenueQuick();
      flash(result.error||'Saved to the venue library. Choose the spaces for this event.');
      return;
    }
    if(which==='new-booking'){
      if(!val('title')||!db.clients.some(c=>c.id===val('clientId'))||!val('date'))return;
      const v=VE()?.findVenue(db,val('venueId'));
      const picked=(a.getAll?a.getAll('spaceIds'):[]).map(String);
      if(!v||!picked.length){alert('Select an existing venue and at least one space, or create them from this form.');return;}
      const ev={id:id('ev'),title:val('title').slice(0,120),clientId:val('clientId'),date:val('date'),venue:v.name,venueId:v.id,spaceIds:picked,eventType:EVENT_TYPES.includes(val('eventType'))?val('eventType'):'Other',guests:Math.max(1,Math.min(5000,num('guests'))),zones:Math.max(1,Math.min(12,num('zones'))),environment:val('environment')==='Outdoor'?'Outdoor':'Indoor',complexity:['Simple','Standard','Feature'].includes(val('complexity'))?val('complexity'):'Standard',status:'Enquiry',labourHours:6,labourRate:90,notes:'',kit:[]};
      mutate(()=>{db.eventJobs.push(ev);ui.bookingTab='details';ui.eventId=ev.id;ui.modal=null;location.hash='#/bookings/'+ev.id;},'Event created with its reusable venue and selected spaces.');return;
    }
    if(which==='edit-booking'){
      const ev=getBooking(val('id')),v=VE()?.findVenue(db,val('venueId'));
      if(!ev||!v||!val('title')||!val('date')||!db.clients.some(c=>c.id===val('clientId')))return;
      const spaceIds=(a.getAll?a.getAll('spaceIds'):[]).map(String);
      if(!spaceIds.length||spaceIds.some(x=>!v.spaces.some(sp=>sp.id===x))){alert('Choose at least one valid space belonging to this venue.');return;}
      const p=db.venuePlans?.[ev.id],oldVenue=ev.venueId||p?.venueId;
      if(oldVenue!==v.id&&p?.items?.length&&!confirm('This event already has equipment placed in another venue. Keep those placements marked for review when switching the venue?'))return;
      if(oldVenue===v.id&&p?.items?.some(item=>item.areaId&&v.spaces.some(sp=>sp.id===item.areaId)&&!spaceIds.includes(item.areaId))){
        alert('A deselected space still contains equipment. Move those items in the 3D planner before removing the space from the event.');return;
      }
      mutate(()=>{
        const result=VE().updateEvent(db,ev.id,v.id,spaceIds);
        if(result.error){alert(result.error);return;}
        Object.assign(ev,{title:val('title').slice(0,120),clientId:val('clientId'),date:val('date'),eventType:EVENT_TYPES.includes(val('eventType'))?val('eventType'):'Other',guests:Math.max(1,Math.min(5000,num('guests'))),zones:Math.max(1,Math.min(12,num('zones'))),environment:val('environment')==='Outdoor'?'Outdoor':'Indoor',complexity:['Simple','Standard','Feature'].includes(val('complexity'))?val('complexity'):'Standard',status:EVENT_STATUS.includes(val('status'))?val('status'):'Enquiry',labourHours:Math.min(1000,num('labourHours')),labourRate:Math.min(100000,num('labourRate')),notes:val('notes').slice(0,3000)});
      },'Event saved with selected venue spaces. Review the 3D layout after changing a venue.');return;
    }
    if(which==='edit-equipment'){const gear=db.equipment.find(g=>g.id===val('id'));if(!gear)return;mutate(()=>{gear.owned=Math.min(100000,Math.floor(num('owned')));gear.rate=Math.min(100000,num('rate'));gear.watts=Math.min(100000,Math.floor(num('watts')));},'Equipment stock and hire rate updated');return;}
    if(which==='new-equipment'){if(!val('name')||!val('category'))return;mutate(()=>{db.equipment.push({id:id('eq'),name:val('name').slice(0,120),category:val('category').slice(0,70),owned:Math.min(100000,Math.floor(num('owned'))),rate:Math.min(100000,num('rate')),watts:Math.min(100000,Math.floor(num('watts')))});ui.modal=null;},'Equipment added to the catalogue');return;}
    if(which==='edit-invoice'){const inv=db.invoices.find(x=>x.id===val('id'));if(!inv||!val('number')||!val('issueDate')||!val('dueDate')||!db.clients.some(c=>c.id===val('clientId')))return;if(db.invoices.some(x=>x.id!==inv.id&&x.number.toLowerCase()===val('number').toLowerCase())){alert('That invoice number is already in use.');return;}const lines=inv.lines.map((line,i)=>({id:line.id,description:val('desc_'+i).slice(0,180),qty:Math.min(100000,num('qty_'+i)),rate:Math.min(10000000,num('rate_'+i))}));if(lines.some(x=>!x.description)){alert('All invoice lines need a description.');return;}mutate(()=>{Object.assign(inv,{number:val('number').slice(0,60),clientId:val('clientId'),issueDate:val('issueDate'),dueDate:val('dueDate'),status:BILL_STATUS.includes(val('status'))?val('status'):'Draft',gstPercent:val('gstPercent')==='10'?10:0,notes:val('notes').slice(0,3000),lines});},'Invoice draft saved');return;}
    if(which==='add-task'){const p=db.projects.find(p=>p.id===val('projectId'));if(!p||!val('name')||!val('due'))return;mutate(()=>p.tasks.push({id:id('t'),name:val('name').slice(0,150),due:val('due'),done:false}),'Task added');return;}
    if(which==='assign-fixture'){const p=db.projects.find(p=>p.id===val('projectId')),fixture=db.fixtures.find(f=>f.id===val('fixtureId'));if(!p||!fixture)return;mutate(()=>{const existing=p.fixtures.find(f=>f.id===fixture.id);if(existing)existing.qty+=num('qty');else p.fixtures.push({id:fixture.id,qty:num('qty')});},'Fixture added to schedule');return;}
    if(which==='new-project'){if(!val('name')||!db.clients.find(c=>c.id===val('clientId')))return;const p={id:id('p'),code:`PH-${String(new Date().getFullYear()).slice(2)}${String(db.projects.length+1).padStart(2,'0')}`,name:val('name'),clientId:val('clientId'),type:val('type')||'Commercial',stage:STAGES.includes(val('stage'))?val('stage'):'Concept',budget:num('budget'),spent:0,designFee:Math.round(num('budget')*.12),installationFee:Math.round(num('budget')*.2),due:val('due'),location:val('location'),tone:['#657980','#2e4247'],description:'New project brief. Add requirements, design intent and approvals here.',tasks:[],fixtures:[]};mutate(()=>{db.projects.push(p);ui.modal=null;ui.projectId=p.id;ui.tab='overview';location.hash='#/projects/'+p.id;},'Project created');return;}
    if(which==='new-lead'){if(!val('name')||!val('client'))return;mutate(()=>{db.leads.unshift({id:id('l'),name:val('name'),client:val('client'),kind:val('kind')||'Commercial',value:num('value'),stage:'Discovery',note:val('note')});ui.modal=null;},'Opportunity added');return;}
    if(which==='new-milestone'){if(!val('title')||!val('date'))return;mutate(()=>{db.events.push({id:id('e'),title:val('title'),date:val('date'),kind:val('kind')||'milestone',projectId:val('projectId')});ui.modal=null;ui.calendar=new Date(parseDate(val('date')).getFullYear(),parseDate(val('date')).getMonth(),1);ui.selectedDate=val('date');},'Milestone scheduled');return;}
    if(which==='new-fixture'){if(!val('name')||!val('code')||!val('maker'))return;mutate(()=>{db.fixtures.push({id:id('f'),name:val('name'),code:val('code'),maker:val('maker'),type:val('type'),cct:val('cct'),beam:val('beam'),stock:Math.floor(num('stock')),cost:num('cost')});ui.modal=null;},'Fixture added to the library');return;}
    if(which==='new-client'){if(!val('name')||!val('person')||!val('email'))return;mutate(()=>{db.clients.push({id:id('c'),name:val('name'),person:val('person'),email:val('email'),type:val('type')});ui.modal=null;},'Client added');}
  });
  window.addEventListener('afterprint',()=>{if(ui.printInvoiceId){ui.printInvoiceId=null;render();}});
  function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`phaenomenon-demo-${iso(new Date())}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);flash('Workspace exported as JSON');}
  $import.addEventListener('change',async()=>{const f=$import.files?.[0];if(!f)return;try{if(f.size>5_000_000)throw Error('File is too large.');const x=JSON.parse(await f.text());const report=window.PhaenomenonWorkspaceSafety?.inspect(x);if(!valid(x)||report&&!report.valid)throw Error(report?.error||'This is not a compatible Phaenomenon export.');if(!confirm('Restore '+(x.eventJobs||[]).length+' events, '+(x.venues||[]).length+' venues and '+(x.clients||[]).length+' clients from this file?\nThis replaces the current workspace stored in this browser.'+(report?.warnings?.length?'\n\nWarnings:\n'+report.warnings.slice(0,3).join('\n'):'')))return;db=x;assureEventData(db);window.PhaenomenonSpacePlanner?.ensure(db);if(!save(true))throw Error('The browser could not save the imported workspace.');ui.modal=null;ui.projectId=null;ui.search='';ui.fixtureSearch='';location.hash='#/overview';renderRoute();flash('Workspace imported');}catch(err){alert('Import failed: '+err.message);}finally{$import.value='';}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(document.getElementById('studio-sidebar')?.classList?.contains('is-expanded')){document.getElementById('studio-sidebar').classList.remove('is-expanded');document.body?.classList?.remove('ph-studio-menu-open');document.querySelector('.studio-mobile-more')?.setAttribute('aria-expanded','false');document.querySelector('.studio-mobile-more')?.focus();}else if(document.querySelector('[data-venue-quick-overlay]'))closeVenueQuick();else if(ui.modal){ui.modal=null;render();}else if(ui.projectId)closeProject();}});
  // Other tabs and the Production workspace share this browser's data, not a backend.
  // Refresh on storage/focus so a stale tab does not overwrite a newer event model.
  window.addEventListener('storage',event=>{if(event.key===STORE_KEY)refreshFromStorage();});
  window.addEventListener('focus',refreshFromStorage);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshFromStorage();});
  window.addEventListener('hashchange',renderRoute);
  if(!location.hash)location.hash='#/overview';
  renderRoute();
})();