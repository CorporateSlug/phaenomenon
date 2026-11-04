/*
 * Phaenomenon shared workspace navigation
 * - SlugSync-like persistent, stable-width workflow tabs with independent close
 * - same tab strip on Studio and Production pages
 * - one collapsed icon rail setting for both entry points
 * - links preserve the event (and current builder/production subview) they belong to
 * - no processes, event data or technical planning states are modified by closing tabs
 */
(() => {
  'use strict';
  // v2 deliberately starts with one workspace instead of restoring the old
  // auto-generated v1 tabs that accumulated during ordinary navigation.
  const TABS_KEY='phaenomenon-open-workspace-tabs-v2';
  const ACTIVE_KEY='phaenomenon-active-workspace-tab-v2';
  const LAST_WORK_KEY='phaenomenon-last-workspace-tab-v2';
  const RAIL_KEY='phaenomenon-icon-sidebar-v1';
  const DB_KEY='phaenomenon-demo-v1';
  const isProduction=()=>!!document.getElementById('production-app');
  const host=()=>document.getElementById('production-app')||document.getElementById('app');
  const safeString=v=>typeof v==='string'?v:'';
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons={
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    layers:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
    brief:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    cube:'<path d="m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10"/>',
    bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    check:'<path d="m4 12 5 5L20 6"/><rect x="3" y="3" width="18" height="18" rx="3"/>',
    box:'<path d="m3 7 9-4 9 4v10l-9 4-9-4V7ZM3 7l9 5 9-5M12 12v9"/>',
    library:'<path d="M4 3v18M9 3v18M14 3v18M19 5v16M3 21h18M3 3h12"/>',
    venue:'<path d="M3 21V8l9-5 9 5v13M9 21v-7h6v7M3 10h18"/>',
    package:'<path d="m3 7 9-4 9 4v10l-9 4-9-4V7ZM3 7l9 5 9-5M12 12v9"/>',
    bulb:'<path d="M9 18h6M10 21h4M8 14a7 7 0 1 1 8 0c-1 .8-1 1.5-1 3H9c0-1.5 0-2.2-1-3Z"/>',
    briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
    chart:'<path d="M3 3v18h18M7 16l5-6 4 3 5-7"/>',
    receipt:'<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM9 8h6M9 12h6"/>',
    settings:'<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.8 1.8 0 0 0 .3 2l-1.7 1.7a1.8 1.8 0 0 0-2-.3l-1.2.5-1 2.1h-2.5l-1-2.1-1.2-.5a1.8 1.8 0 0 0-2 .3L5.4 17a1.8 1.8 0 0 0 .3-2l-.5-1.2L3 12.8v-2.5l2.2-1 .5-1.2a1.8 1.8 0 0 0-.3-2L7.1 4.4a1.8 1.8 0 0 0 2 .3l1.2-.5 1-2.2h2.5l1 2.2 1.2.5a1.8 1.8 0 0 0 2-.3l1.7 1.7a1.8 1.8 0 0 0-.3 2l.5 1.2 2.1 1v2.5l-2.1 1Z"/>',
    chevronLeft:'<path d="m15 18-6-6 6-6"/>',
    chevronRight:'<path d="m9 18 6-6-6-6"/>',
    close:'<path d="M18 6 6 18M6 6l12 12"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    file:'<path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v6h6M9 13h7M9 17h7"/>'
  };
  const svg=(name,size=18)=>'<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(icons[name]||icons.grid)+'</svg>';
  const iconFor=label=>{
    const x=label.toLowerCase();
    if(/home|dashboard|overview/.test(x))return 'home';
    if(/builder/.test(x))return 'layers';
    if(/details/.test(x))return 'brief';
    if(/fixture library|fixture/.test(x))return 'bulb';
    if(/equipment|stock/.test(x))return 'package';
    if(/schedule|calendar|event(s| &)?|bookings/.test(x))return 'calendar';
    if(/builder|planning|plan &/.test(x))return 'layers';
    if(/3d|design|fixture position/.test(x))return 'cube';
    if(/technical|connections|power|dmx/.test(x))return 'bolt';
    if(/crew|installation|deliver/.test(x))return 'check';
    if(/production/.test(x))return 'briefcase';
    if(/library &|library|fixture library/.test(x))return 'library';
    if(/venue|spaces/.test(x))return 'venue';
    if(/directory|people|clients/.test(x))return 'users';
    if(/equipment|stock/.test(x))return 'package';
    if(/fixtures|bulb/.test(x))return 'bulb';
    if(/opportunities|pipeline/.test(x))return 'chart';
    if(/invoices/.test(x))return 'receipt';
    if(/projects|studio management/.test(x))return 'briefcase';
    if(/settings|options/.test(x))return 'settings';
    if(/details|notes|brief/.test(x))return 'brief';
    return 'grid';
  };
  function parseJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
  function events(){return parseJson(DB_KEY,{eventJobs:[]}).eventJobs||[]}
  function activeEventId(){
    if(isProduction())return document.querySelector('#event-picker')?.value||parseJson('phaenomenon-production-prefs-v1',{}).eventId||events()[0]?.id||'';
    return document.querySelector('.event-picker.chosen')?.dataset.id||
      document.querySelector('[data-action="select-booking"].chosen')?.dataset.id||
      parseJson('phaenomenon-production-prefs-v1',{}).eventId||events()[0]?.id||'';
  }
  const eventName=id=>events().find(e=>e.id===id)?.title||'Event';
  function getRoute(){
    const prod=isProduction(),base=prod?'production.html':'index.html',hash=location.hash|| (prod?'#/dashboard':'#/overview');
    const segments=hash.replace(/^#\/?/,'').split('/').filter(Boolean),view=segments[0]||(prod?'dashboard':'overview');
    const detail=segments[1]||'';
    let id=activeEventId();
    const productionTabs=['team','logistics','installation','show'];
    if(prod){
      if(view==='home'&&detail==='venue')id=segments[2]||id;
      else if(view==='production'&&productionTabs.includes(detail))id=segments[2]||id;
      else if(['builder','home','design','technical','crew','production'].includes(view))id=detail||id;
    }else if(['spaces','bookings'].includes(view))id=detail||id;
    const encoded=encodeURIComponent(id||'');
    let key,label,icon,canonical;
    if(prod){
      switch(view){
        case 'dashboard':key='home';label='Home';icon='home';canonical='production.html#/dashboard';break;
        case 'events':key='events';label='Events & schedule';icon='calendar';canonical='production.html#/events';break;
        case 'builder':key='builder:'+id;label='Build · '+eventName(id);icon='layers';canonical='production.html#/builder/'+encoded+(segments[2]?'/'+segments[2]:'');break;
        case 'home':
          if(detail==='venue'){key='venue:'+id;label='Venue · '+eventName(id);icon='venue';canonical='production.html#/home/venue/'+encoded;}
          else{key='overview:'+id;label='Overview · '+eventName(id);icon='home';canonical='production.html#/home/'+encoded;}
          break;
        case 'design':key='design:'+id;label='Design · '+eventName(id);icon='cube';canonical='production.html#/design/'+encoded;break;
        case 'technical':key='technical:'+id;label='Technical · '+eventName(id);icon='bolt';canonical='production.html#/technical/'+encoded;break;
        case 'crew':key='crew:'+id;label='Crew · '+eventName(id);icon='check';canonical='production.html#/crew/'+encoded;break;
        case 'production':
          key='production:'+id;label='Production · '+eventName(id);icon='briefcase';
          canonical='production.html#/production/'+(productionTabs.includes(detail)?detail+'/':'')+encoded;break;
        case 'entities':
          key=detail?'entity:'+detail:'directory';label=detail?'Entity profile':'Directory';icon='users';canonical='production.html#/entities'+(detail?'/'+encodeURIComponent(detail):'');break;
        default:key='home';label='Home';icon='home';canonical='production.html#/dashboard';
      }
    }else{
      const titles={overview:'Studio overview',bookings:'Event details',spaces:'3D planner',equipment:'Equipment library',fixtures:'Fixture library',invoices:'Invoices',projects:'Projects',pipeline:'Opportunities',schedule:'Calendar',clients:'Clients',settings:'Settings',search:'Search'};
      const iconMap={overview:'grid',bookings:'brief',spaces:'cube',equipment:'package',fixtures:'bulb',invoices:'receipt',projects:'briefcase',pipeline:'chart',schedule:'calendar',clients:'users',settings:'settings',search:'grid'};
      icon=iconMap[view]||'grid';label=titles[view]||'Studio overview';canonical='index.html#/'+view;
      if(['bookings','spaces'].includes(view)){
        key=view+':'+id;label=(view==='spaces'?'3D':'Details')+' · '+eventName(id);canonical+='/'+encoded;
      }else if((view==='projects'||view==='invoices')&&detail){
        key=view+':'+detail;
        label=(view==='projects'?'Project':'Invoice')+' · '+detail.slice(0,18);
        canonical+='/'+encodeURIComponent(detail);
      }else key='studio:'+view;
    }
    return {key,label,icon,href:canonical};
  }
  function sanitize(saved){
    const all=Array.isArray(saved?.tabs)?saved.tabs:[];
    const filtered=all.filter(x=>x&&typeof x.id==='string'&&/^[a-z0-9_-]{1,90}$/i.test(x.id)&&
      typeof x.href==='string'&&/^(index|production)\.html#\/[a-z0-9_/%-]+$/i.test(x.href)&&
      typeof x.label==='string').slice(-24).map(x=>({
        id:x.id,key:safeString(x.key).slice(0,180),href:x.href,
        label:x.label.slice(0,115),icon:icons[x.icon]?x.icon:'grid'
      }));
    const ids=new Set();
    return filtered.filter(x=>{if(ids.has(x.id))return false;ids.add(x.id);return true;});
  }
  const home={id:'home',key:'home',label:'Home',icon:'home',href:'production.html#/dashboard'};
  let tabs=[home,...sanitize(parseJson(TABS_KEY,{tabs:[]})).filter(x=>x.id!=='home')];
  let collapsed=parseJson(RAIL_KEY,false)===true;
  const session=()=>{
    try{return sessionStorage}catch{return localStorage}
  };
  const getActive=()=>{try{return session().getItem(ACTIVE_KEY)||'home'}catch{return 'home'}};
  const setActive=id=>{try{session().setItem(ACTIVE_KEY,id)}catch{}};
  let selected=getActive(),lastWorking=(()=>{try{return session().getItem(LAST_WORK_KEY)||''}catch{return ''}})();
  if(selected!=='home')lastWorking=selected;
  const newId=()=> 'work-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const saveTabs=()=>{try{localStorage.setItem(TABS_KEY,JSON.stringify({version:2,tabs}))}catch{}};
  function activate(id){
    selected=id;
    if(id!=='home'){
      lastWorking=id;
      try{session().setItem(LAST_WORK_KEY,id)}catch{}
    }
    setActive(id);
  }
  function synchronize(){
    const route=getRoute();
    // Home is pinned; coming home never erases the last working tab.
    if(route.key==='home'){
      activate('home');
      saveTabs();
      return;
    }
    let slot=tabs.find(t=>t.id===selected&&t.id!=='home');
    // Clicking an ordinary sidebar link while Home is active reuses a working
    // slot, rather than spawning another tab on each navigation.
    if(!slot)slot=tabs.find(t=>t.id===lastWorking)||tabs.find(t=>t.id!=='home');
    if(!slot){
      slot={id:newId(),...route};
      tabs.push(slot);
    }else Object.assign(slot,route);
    activate(slot.id);
    saveTabs();
  }
  // A new tab is created only by the explicit '+' menu. Nav changes always
  // update the selected working slot, so there is no passive tab accumulation.
  function openExplicitTab(href){
    if(!/^(index|production)\.html#\/[a-z0-9_/%-]+$/i.test(href))return;
    const slot={id:newId(),key:'new',label:'Workspace',icon:'grid',href};
    tabs.push(slot);
    activate(slot.id);
    saveTabs();
    visit(href);
    schedule();
  }
  function navIcons(sidebar){
    if(!sidebar)return;
    const prod=isProduction();
    const targets=sidebar.querySelectorAll(prod?'.rail a.nav,.rail-group-title':'.nav-items a.nav-link,.nav-group-heading');
    targets.forEach(el=>{
      const text=el.textContent?.replace(/[⌄›]/g,'').trim()||'Navigation';
      const symbol=iconFor(text);
      const node=prod?el.querySelector('.nav-symbol'):el.querySelector('svg');
      if(node){
        if(prod)node.innerHTML=svg(symbol);
        else node.outerHTML=svg(symbol);
      }else if(!prod)el.insertAdjacentHTML('afterbegin',svg(symbol));
      // Native tooltips are useful for icon-only mode, but visually noisy
      // when the expanded navigation already shows the full label.
      el.title=collapsed?text:'';
      if(collapsed||el.tagName==='SUMMARY')el.setAttribute('aria-label',text);
    });
  }
  function sidebarControl(sidebar){
    if(!sidebar)return;
    const parent=sidebar.querySelector(isProduction()?'.rail-top':'.sidebar-heading');
    if(!parent)return;
    parent.querySelector('.ph-rail-toggle')?.remove();
    const btn=document.createElement('button');btn.type='button';btn.className='ph-rail-toggle';
    btn.setAttribute('aria-controls',isProduction()?'production-navigation':'studio-navigation');
    btn.innerHTML=svg(collapsed?'chevronRight':'chevronLeft',18);
    btn.setAttribute('aria-label',collapsed?'Expand sidebar':'Collapse sidebar');
    btn.setAttribute('aria-expanded',String(!collapsed));
    btn.title=collapsed?'Expand sidebar':'Collapse sidebar';
    parent.appendChild(btn);
    document.body.classList.toggle('ph-nav-collapsed',collapsed);
  }
  function drawTabs(main){
    if(!main)return;
    let bar=main.querySelector(':scope > .ph-workspace-tabs');
    if(!bar){
      bar=document.createElement('nav');
      bar.className='ph-workspace-tabs';
      bar.setAttribute('aria-label','Open workspaces');
      const header=main.querySelector(':scope > .header, :scope > .topbar');
      if(header)header.after(bar);else main.prepend(bar);
    }
    bar.innerHTML='<div class="ph-tabs-track" aria-label="Open workspaces">'+tabs.map(t=>{
      const active=t.id===selected;
      return '<div class="ph-workspace-tab'+(active?' is-active':'')+(t.id==='home'?' is-home':'')+'" data-tab-id="'+escape(t.id)+'">'+
        '<a class="ph-tab-link" data-open-tab="'+escape(t.id)+'" '+(active?'aria-current="page" ':'')+'href="'+escape(t.href)+'" title="'+escape(t.label)+'">'+
          '<span class="ph-tab-icon">'+svg(t.icon,15)+'</span><span class="ph-tab-title">'+escape(t.label)+'</span>'+
          '</a>'+
        (t.id==='home'?'':'<button type="button" class="ph-tab-close" data-close-id="'+escape(t.id)+'" aria-label="Close '+escape(t.label)+'" title="Close workspace">'+svg('close',13)+'</button>')+
        '</div>';
    }).join('')+'</div><button type="button" class="ph-tab-new" aria-label="Open a new workspace tab" title="Open a new workspace tab" aria-haspopup="menu" aria-expanded="false">'+svg('plus',18)+'</button>';
    // Only reveal the selected tab, not the entire navigation row.
    const activeEl=bar.querySelector('.ph-workspace-tab.is-active');
    activeEl?.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  function openWorkspacePicker(button){
    const bar=button.closest('.ph-workspace-tabs');
    if(!bar)return;
    const old=bar.querySelector('.ph-tab-picker');
    if(old){old.remove();button.setAttribute('aria-expanded','false');return}
    const route=getRoute();
    const eventScoped=/^(?:builder|venue|overview|design|technical|crew|production|spaces|bookings):/.test(route.key);
    const eventId=eventScoped?route.key.split(':').slice(1).join(':'):activeEventId();
    const id=encodeURIComponent(eventId||'');
    const options=[
      ['production.html#/events','calendar','Events & schedule'],
      ['production.html#/builder/'+id,'layers','Event builder'],
      ['index.html#/spaces/'+id,'cube','3D planner'],
      ['production.html#/technical/'+id,'bolt','Technical connections'],
      ['production.html#/crew/'+id,'check','Crew installation'],
      ['production.html#/production/'+id,'briefcase','Production'],
      ['production.html#/entities','users','People & organisations'],
      ['index.html#/equipment','package','Equipment library'],
      ['index.html#/overview','grid','Studio overview']
    ];
    const picker=document.createElement('div');
    picker.className='ph-tab-picker';
    picker.setAttribute('role','menu');
    picker.setAttribute('aria-label','Choose a workspace to open in a new tab');
    picker.innerHTML='<div class="ph-tab-picker-heading">Open in a new tab</div>'+
      '<div class="ph-tab-picker-items">'+options.map(o=>
        '<button type="button" role="menuitem" class="ph-tab-picker-item" data-ph-new-tab="'+escape(o[0])+'">'+
        svg(o[1],16)+'<span>'+escape(o[2])+'</span></button>'
      ).join('')+'</div><p class="ph-tab-picker-hint">Normal navigation stays in the current tab</p>';
    bar.appendChild(picker);
    button.setAttribute('aria-expanded','true');
    picker.querySelector('button')?.focus();
  }
  function closeWorkspacePicker(){
    const picker=document.querySelector('.ph-tab-picker');
    if(!picker)return false;
    picker.remove();
    document.querySelector('.ph-tab-new')?.setAttribute('aria-expanded','false');
    return true;
  }
  function redraw(){
    const root=host();if(!root)return;
    const sidebar=root.querySelector(isProduction()?'#production-rail':'#studio-sidebar');
    const main=root.querySelector('.main');
    if(!main)return;
    synchronize();navIcons(sidebar);sidebarControl(sidebar);drawTabs(main);
  }
  let pending=false;
  function schedule(){if(pending)return;pending=true;queueMicrotask(()=>{pending=false;redraw()})}
  function visit(href){if(!/^(index|production)\.html#\//.test(href))return;location.href=href;}
  function closeTab(id){
    const i=tabs.findIndex(t=>t.id===id);
    if(i<0||id==='home')return;
    const wasActive=selected===id;
    tabs.splice(i,1);
    if(lastWorking===id)lastWorking=tabs.find(t=>t.id!=='home')?.id||'';
    if(wasActive){
      const target=tabs[Math.min(i,tabs.length-1)]||home;
      activate(target.id);
      saveTabs();
      visit(target.href);
      schedule();
    }else{saveTabs();schedule()}
  }
  document.addEventListener('click',ev=>{
    const collapse=ev.target.closest('.ph-rail-toggle');
    if(collapse){
      ev.preventDefault();collapsed=!collapsed;try{localStorage.setItem(RAIL_KEY,JSON.stringify(collapsed))}catch{}
      const sidebar=host()?.querySelector(isProduction()?'#production-rail':'#studio-sidebar');
      document.body.classList.toggle('ph-nav-collapsed',collapsed);
      const btn=sidebar?.querySelector('.ph-rail-toggle');if(btn){btn.innerHTML=svg(collapsed?'chevronRight':'chevronLeft');btn.title=collapsed?'Expand sidebar':'Collapse sidebar';btn.setAttribute('aria-label',btn.title);btn.setAttribute('aria-expanded',String(!collapsed))}
      navIcons(sidebar);
      return;
    }
    const group=ev.target.closest('.rail-group-title,.nav-group-heading');
    if(group&&collapsed&&matchMedia('(min-width:841px)').matches){
      ev.preventDefault();collapsed=false;try{localStorage.setItem(RAIL_KEY,'false')}catch{}
      document.body.classList.remove('ph-nav-collapsed');
      group.closest('details').open=true;
      const btn=host()?.querySelector('.ph-rail-toggle');if(btn){btn.innerHTML=svg('chevronLeft');btn.title='Collapse sidebar';btn.setAttribute('aria-label',btn.title);btn.setAttribute('aria-expanded','true')}
      navIcons(host()?.querySelector(isProduction()?'#production-rail':'#studio-sidebar'));
      return;
    }
    const closing=ev.target.closest('.ph-tab-close');
    if(closing){
      ev.preventDefault();ev.stopPropagation();
      closeWorkspacePicker();
      closeTab(closing.dataset.closeId);
      return;
    }
    const newWorkspace=ev.target.closest('[data-ph-new-tab]');
    if(newWorkspace){
      ev.preventDefault();ev.stopPropagation();
      const href=newWorkspace.dataset.phNewTab;
      closeWorkspacePicker();
      openExplicitTab(href);
      return;
    }
    const plus=ev.target.closest('.ph-tab-new');
    if(plus){ev.preventDefault();openWorkspacePicker(plus);return}
    const tabLink=ev.target.closest('.ph-tab-link');
    if(tabLink){
      closeWorkspacePicker();
      if(tabs.some(t=>t.id===tabLink.dataset.openTab)){
        activate(tabLink.dataset.openTab);
        saveTabs();
        // The destination URL changes the page; do not rebind the newly
        // selected slot to the previous page during the click microtask.
        if(tabLink.getAttribute('href')===(isProduction()?'production.html':'index.html')+location.hash){
          drawTabs(host()?.querySelector('.main'));
        }
      }
      return;
    }
    if(!ev.target.closest('.ph-tab-picker'))closeWorkspacePicker();
  },true);
  // Keyboard navigation for the workflow tab strip: arrows / Home / End / Delete.
  document.addEventListener('keydown',ev=>{
    const link=ev.target.closest?.('.ph-tab-link');
    if(!link)return;
    const track=link.closest('.ph-tabs-track');
    if(!track)return;
    const links=[...track.querySelectorAll('.ph-tab-link')],index=links.indexOf(link);
    let target=index;
    if(ev.key==='ArrowRight')target=Math.min(index+1,links.length-1);
    else if(ev.key==='ArrowLeft')target=Math.max(0,index-1);
    else if(ev.key==='Home')target=0;
    else if(ev.key==='End')target=links.length-1;
    else if(ev.key==='Delete'){
      const id=link.closest('.ph-workspace-tab')?.dataset.tabId;
      if(id&&id!=='home'){ev.preventDefault();closeTab(id)}
      return;
    }else return;
    ev.preventDefault();
    links[target]?.focus();
    links[target]?.scrollIntoView({block:'nearest',inline:'nearest'});
  });
  // A vertical mouse-wheel gesture over the narrow tab strip scrolls its tabs,
  // not the work area; native horizontal trackpad gestures continue to work.
  document.addEventListener('keydown',ev=>{
    if(ev.key==='Escape'&&closeWorkspacePicker()){
      document.querySelector('.ph-tab-new')?.focus();
      ev.stopPropagation();
    }
  });
  document.addEventListener('wheel',ev=>{
    const track=ev.target.closest?.('.ph-tabs-track');
    if(!track||track.scrollWidth<=track.clientWidth)return;
    if(Math.abs(ev.deltaY)>Math.abs(ev.deltaX)){
      track.scrollLeft+=ev.deltaY;
      ev.preventDefault();
    }
  },{passive:false});
  window.addEventListener('hashchange',schedule);
  window.addEventListener('storage',ev=>{
    if(ev.key===TABS_KEY){
      tabs=[home,...sanitize(parseJson(TABS_KEY,{tabs:[]})).filter(x=>x.id!=='home')];
      if(!tabs.some(t=>t.id===selected))activate('home');
      schedule();
    }
    if(ev.key===RAIL_KEY){collapsed=parseJson(RAIL_KEY,false)===true;document.body.classList.toggle('ph-nav-collapsed',collapsed);schedule()}
  });
  const init=()=>{
    const root=host();if(!root)return;
    document.body.classList.toggle('ph-nav-collapsed',collapsed);
    new MutationObserver(schedule).observe(root,{childList:true,subtree:false});
    schedule();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();