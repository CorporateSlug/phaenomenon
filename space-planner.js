/* Phaenomenon venue and event space planner.
   Lightweight 3D/isometric canvas, no external dependencies.
   Geometry and cable totals are indicative, not engineering or electrical design. */
(() => {
  'use strict';
  const G=window.PhaenomenonGeometry;
  if(!G)throw new Error('Venue geometry module did not load');
  const n = (x,fallback=0) => Number.isFinite(Number(x)) ? Number(x) : fallback;
  const clamp = (x,min,max) => Math.max(min,Math.min(max,x));
  const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = prefix => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const r1 = x => Math.round(x*10)/10;
  const palette = {
    light:'#eeb96b', audio:'#a58ce0', power:'#e29a5c', network:'#62c4cf', control:'#c1a6ec', rigging:'#91a8b3', stage:'#728d89', other:'#cad2d0'
  };
  const TYPES = [
    ['light','Lighting fixture'],['audio','Audio / speaker'],['power','Power / distribution'],
    ['network','Network / data'],['control','Control desk'],['rigging','Rigging / truss'],
    ['stage','Stage / structure'],['other','Other equipment']
  ];
  const CABLES = {power:{label:'Power',color:'#e4a568'},network:{label:'Ethernet / network',color:'#67cfd7'},dmx:{label:'DMX / control',color:'#bba3ff'},audio:{label:'Audio',color:'#8bb9ef'}};
  const defaults = ()=>[
    {id:'ven-harbour',name:'Harbour Hall',width:20,length:14,height:5.5,notes:'Fictional repeat venue. Dimensions are placeholders.'},
    {id:'ven-arts',name:'Arts Warehouse',width:25,length:17,height:7,notes:'Fictional multi-purpose venue.'},
    {id:'ven-court',name:'Northside Courtyard',width:18,length:12,height:4,notes:'Outdoor footprint placeholder. Height represents indicative rigging limit.'}
  ];
  function createDemoPlan(){
    return {
      venueId:'ven-harbour',items:[
        {id:'obj-stage',name:'Presentation stage',kind:'stage',x:10,y:12,z:0,watts:0,eqId:''},
        {id:'obj-power',name:'Power distribution',kind:'power',x:2,y:11,z:0,watts:0,eqId:'eq-distro'},
        {id:'obj-control',name:'Lighting console',kind:'control',x:9,y:2,z:0,watts:80,eqId:'eq-control'},
        {id:'obj-net',name:'Network / data point',kind:'network',x:3,y:2,z:0,watts:0,eqId:''},
        {id:'obj-l1',name:'LED wash A',kind:'light',x:5,y:10.5,z:3.2,watts:180,eqId:'eq-wash'},
        {id:'obj-l2',name:'LED wash B',kind:'light',x:15,y:10.5,z:3.2,watts:180,eqId:'eq-wash'},
        {id:'obj-l3',name:'LED wash C',kind:'light',x:10,y:7,z:2.8,watts:180,eqId:'eq-wash'},
        {id:'obj-audio',name:'PA speaker',kind:'audio',x:17,y:11,z:1.5,watts:300,eqId:''}
      ],runs:[
        {id:'run-1',from:'obj-power',to:'obj-l1',type:'power',slack:15},
        {id:'run-2',from:'obj-power',to:'obj-l2',type:'power',slack:15},
        {id:'run-3',from:'obj-control',to:'obj-l3',type:'dmx',slack:15},
        {id:'run-4',from:'obj-net',to:'obj-control',type:'network',slack:15},
      ]
    };
  }
  const blankPlan = venueId=>({venueId,items:[],runs:[]});
  function ensure(db){
    if(!Array.isArray(db.venues))db.venues=defaults();
    db.venues.forEach(v=>G.normalize(v));
    if(!db.venuePlans||typeof db.venuePlans!=='object'||Array.isArray(db.venuePlans))db.venuePlans={};
    for(const e of db.eventJobs||[]){
      if(!e.venueId){const match=db.venues.find(v=>v.name.toLowerCase()===(e.venue||'').trim().toLowerCase());if(match)e.venueId=match.id;}
    }
    // Seed a useful example only if there is no already-existing event plan.
    if(!db.venuePlans['ev-01'] && (db.eventJobs||[]).some(e=>e.id==='ev-01'))db.venuePlans['ev-01']=createDemoPlan();
  }
  class Planner {
    constructor(root,db,onSave,onNotify,initialEventId){
      this.root=root;this.db=db;this.save=onSave;this.notify=onNotify;
      this.eventId=(db.eventJobs||[]).some(e=>e.id===initialEventId)?initialEventId:(db.eventJobs||[])[0]?.id;
      this.mode='three';this.yaw=-.65;this.tilt=.54;this.zoom=1;this.selected=null;this.drag=null;
      this.creatingVenue=false;this.showRuns=true;this.geometry=null;this.editOutline=false;this.selectedVertex=null;this.canvasActive=false;
      this.ensureActive();this.build();
    }
    get event(){return this.db.eventJobs.find(e=>e.id===this.eventId);}
    get plan(){return this.db.venuePlans[this.eventId];}
    get venue(){return this.db.venues.find(v=>v.id===this.plan.venueId)||this.db.venues[0];}
    ensureActive(){
      if(!this.event)return;
      if(!this.db.venuePlans[this.eventId])this.db.venuePlans[this.eventId]=blankPlan(this.event.venueId||this.db.venues[0]?.id);
      const p=this.plan;
      if(!this.db.venues.some(v=>v.id===p.venueId))p.venueId=this.db.venues[0]?.id;
      if(!Array.isArray(p.items))p.items=[];
      if(!Array.isArray(p.runs))p.runs=[];
      if(!this.event.venueId)this.event.venueId=p.venueId;
    }
    persist(){this.save();this.updateSummary();this.draw();}
    build(){
      this.threeView?.dispose();this.threeView=null;
      this.resizeObserver?.disconnect();
      if(!this.event){this.root.innerHTML='<p>Create an event booking first to attach a venue plan.</p>';return;}
      const v=this.venue;
      this.root.innerHTML=`<div class="sp-toolbar panel">
        <div class="sp-controls"><label class="sp-label">Event booking<select id="sp-event" class="form-select">${this.db.eventJobs.map(e=>`<option value="${esc(e.id)}" ${e.id===this.eventId?'selected':''}>${esc(e.title)} · ${esc(e.date)}</option>`).join('')}</select></label>
        <label class="sp-label">Saved venue<select id="sp-venue" class="form-select">${this.db.venues.map(venue=>`<option value="${esc(venue.id)}" ${venue.id===v.id?'selected':''}>${esc(venue.name)}</option>`).join('')}</select></label>
        <button id="sp-new-venue" class="button">+ New venue</button>
        <a class="button" href="#/bookings/${encodeURIComponent(this.eventId)}">Open event brief</a></div>
        <div id="sp-venue-new" class="sp-newvenue" hidden><label>Name <input id="sp-newname" class="field" maxlength="90" placeholder="e.g. Civic Ballroom"></label><label>Width (m) <input id="sp-neww" class="field" type="number" min="2" max="200" step="0.5" value="16"></label><label>Length (m) <input id="sp-newl" class="field" type="number" min="2" max="200" step="0.5" value="12"></label><label>Reference height (m) <input id="sp-newh" class="field" type="number" min="0.5" max="40" step="0.5" value="4"></label><label>Environment<select id="sp-newkind" class="form-select"><option value="indoor">Indoor / enclosed</option><option value="outdoor">Outdoor / open</option></select></label><button id="sp-create-venue" class="button primary">Create venue</button></div>
        <div class="sp-dimensions">${[['Site width','width'],['Site length','length'],['Reference height','height']].map(([label,key])=>`<label class="sp-label">${label} (m)<input class="field sp-dim" id="sp-${key}" type="number" step="0.1" min="2" max="200" value="${n(v[key])}"></label>`).join('')}<button id="sp-save-venue" class="button">Save dimensions</button><span class="sp-caption">Shared site measurements. Resizing scales the perimeter across bookings.</span></div>
      </div>
      <section class="sp-geometry-panel panel" aria-label="Venue geometry editor">
        <div class="sp-geometry-title"><div><h2>Venue geometry</h2><p>Draw an irregular footprint, choose a roof profile or keep the sky open. Saved venue changes apply to all associated events.</p></div><span class="sp-geometry-tag">Reusable venue</span></div>
        <div class="sp-geometry-columns">
          <div class="sp-geometry-section">
            <h3>Floorplan outline</h3>
            <div class="sp-geometry-controls"><label>Starting shape<select id="sp-shape" class="form-select"><option value="rectangle">Rectangle</option><option value="L">L-shaped</option><option value="U">U / courtyard</option><option value="angled">Angled polygon</option></select></label><button id="sp-apply-shape" class="button small">Use shape</button><button id="sp-edit-outline" class="button small">Edit corners on plan</button></div>
            <p class="sp-geometry-note">In top view, drag the numbered corners. Add corners to an edge for custom shapes, or enter exact coordinates below.</p>
            <div class="sp-geometry-controls"><button id="sp-add-corner" class="button small">+ Add corner</button><button id="sp-remove-corner" class="button small" disabled>Remove selected</button><span id="sp-area" class="sp-area"></span></div>
            <details class="sp-geometry-details"><summary>Corner coordinates <span id="sp-corner-count"></span></summary><div id="sp-corners"></div></details>
          </div>
          <div class="sp-geometry-section">
            <h3>Roof & environment</h3>
            <div class="sp-roof-form"><label>Space type<select id="sp-kind" class="form-select"><option value="indoor">Indoor / enclosed</option><option value="outdoor">Outdoor / open-air</option></select></label><label>Roof profile<select id="sp-roof-type" class="form-select"><option value="none">No roof (open sky)</option><option value="flat">Flat roof</option><option value="mono">Single slope</option><option value="gable">Pitched / gable</option><option value="custom">Custom corner heights</option></select></label><label>Eave / base (m)<input id="sp-eave" class="field" type="number" min="0.5" max="40" step="0.1"></label><label>High point (m)<input id="sp-peak" class="field" type="number" min="0.5" max="50" step="0.1"></label><label>Slope direction<select id="sp-roof-axis" class="form-select"><option value="x">Across site width</option><option value="y">Along site length</option></select></label></div>
            <div id="sp-roof-corners" class="sp-custom-roof"></div>
            <p class="sp-geometry-note">Outdoor venues can have no roof. Roof shapes are schematic and do not establish safe mounting points or load capacities.</p>
          </div>
        </div>
      </section>
      <div class="sp-summary" id="sp-summary" aria-live="polite"></div>
      <div class="sp-workspace">
        <section class="sp-scene-shell panel"><div class="sp-scene-head"><div><h2>Interactive space layout</h2><p>Drag equipment or orbit in 3D. Switch to top view to drag boundary corners.</p></div><div class="sp-view-controls" role="toolbar" aria-label="Space view controls">
          <div class="sp-control-group sp-view-switch" role="group" aria-label="Projection">
            <button type="button" id="sp-view-three" class="sp-tool sp-toggle is-active" aria-pressed="true" title="3D perspective">3D</button>
            <button type="button" id="sp-view-top" class="sp-tool sp-toggle" aria-pressed="false" title="Top-down plan">Top</button>
          </div>
          <button type="button" id="sp-fit" class="sp-tool sp-reset" title="Reset rotation and zoom" aria-label="Reset rotation and zoom"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11a9 9 0 1 1 3 6.7"/><path d="M3 4v7h7"/></svg><span>Reset</span></button>
          <div class="sp-control-group sp-zoom-group" role="group" aria-label="Zoom">
            <button type="button" id="sp-zoom-out" class="sp-tool sp-zoom-btn" aria-label="Zoom out" title="Zoom out"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg></button>
            <button type="button" id="sp-zoom-in" class="sp-tool sp-zoom-btn" aria-label="Zoom in" title="Zoom in"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
          </div>
        </div></div>
          <div class="sp-canvas-wrap"><canvas id="sp-canvas" tabindex="0" role="region" aria-label="Interactive event layout" aria-describedby="sp-canvas-status"></canvas><div id="sp-canvas-status" class="sp-canvas-activation" role="status" aria-live="polite"><span class="sp-canvas-activation-dot" aria-hidden="true"></span><span class="sp-canvas-activation-text">Click model to interact · scroll page normally</span></div></div>
          <div class="sp-floor-tools"><strong>Add to layout</strong><div class="sp-palette">${TYPES.map(([kind,label])=>`<button class="sp-add" data-kind="${kind}" type="button"><i style="background:${palette[kind]}"></i>${esc(label)}</button>`).join('')}</div></div>
          <div class="sp-hint"><span class="sp-dot" style="background:${CABLES.power.color}"></span> Power <span class="sp-dot" style="background:${CABLES.network.color}"></span> Network <span class="sp-dot" style="background:${CABLES.dmx.color}"></span> DMX <span class="sp-dot" style="background:${CABLES.audio.color}"></span> Audio <label><input id="sp-show-runs" type="checkbox" checked> Show cables</label></div>
        </section>
        <aside class="sp-inspector panel"><div class="sp-inspector-head"><h2>Selection & equipment</h2><p id="sp-inspect-help">Select a fixture to edit its exact location, height and inventory mapping.</p></div><div id="sp-inspect-body"></div>
          <div class="sp-placement-list"><h3>Placed equipment <span id="sp-count"></span></h3><div id="sp-placed"></div></div>
        </aside>
      </div>
      <section class="panel sp-cable-panel"><div class="sp-cable-head"><div><h2>Power, data & cable routing</h2><p>Estimate floor-level cable paths within the mapped boundary, then add vertical drops and slack. Connections are editable.</p></div><button id="sp-sync" class="button primary">Copy placed equipment to event kit</button></div>
        <form id="sp-cable-form" class="sp-cable-form"><label>From<select id="sp-from" class="form-select" required></select></label><label>To<select id="sp-to" class="form-select" required></select></label><label>Cable type<select id="sp-type" class="form-select">${Object.entries(CABLES).map(([k,t])=>`<option value="${k}">${esc(t.label)}</option>`).join('')}</select></label><label>Slack %<input id="sp-slack" class="field" type="number" min="0" max="100" value="15" step="5"></label><button type="submit" class="button primary">Add route</button></form>
        <div class="sp-table-scroll"><table class="table sp-cable-table"><thead><tr><th>Connection</th><th>Type</th><th>Estimated route</th><th>Suggested single length</th><th></th></tr></thead><tbody id="sp-runs"></tbody></table></div>
        <div id="sp-totals" class="sp-cable-totals"></div>
        <p class="sp-safety"><strong>Planning estimate only.</strong> Routes follow approximate unobstructed ground-level paths inside the drawn perimeter, with vertical drops and the specified slack. They do not detect walls, furniture, elevation changes, doors, exclusion zones, actual cable containment, connectors, voltage drop, circuit capacities, power factor, network performance, rigging loads or electrical compliance. Confirm dimensions, routes, gear suitability and installation with qualified personnel. Never use these totals as an electrical safety approval.</p>
      </section>`;
      this.arrangeWorkspace();
      this.canvas=this.root.querySelector('#sp-canvas');this.ctx=this.canvas.getContext('2d');
      this.bind();this.updateGeometry();this.updateAll();
      this.resizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>this.resize()):null;
      this.resizeObserver?.observe(this.canvas.parentElement);
      this.resize();
      if(window.Phaenomenon3D){this.threeView=window.Phaenomenon3D.attach(this);this.threeView?.decorateInspector();}
    }

    arrangeWorkspace(){
      const toolbar=this.root.querySelector('.sp-toolbar');
      const workspace=this.root.querySelector('.sp-workspace');
      const metrics=this.root.querySelector('#sp-summary');
      const geometry=this.root.querySelector('.sp-geometry-panel');
      const inspector=workspace.querySelector('.sp-inspector');
      geometry.querySelector('.sp-geometry-title')?.remove();
      geometry.prepend(toolbar.querySelector('.sp-dimensions'));
      toolbar.after(workspace,metrics);
      // Venue measurements and 3D editing now share the same workspace, not a distant form.
      const equipmentPane=document.createElement('div');
      equipmentPane.id='sp-equipment-pane';equipmentPane.className='sp-inspector-pane';
      equipmentPane.append(...Array.from(inspector.children));
      const venuePane=document.createElement('div');
      venuePane.id='sp-venue-pane';venuePane.className='sp-inspector-pane sp-venue-pane';
      venuePane.hidden=true;
      venuePane.innerHTML='<div class="sp-venue-pane-head"><div><strong>Venue geometry</strong><p>Shared measurements for every event here</p></div><button id="sp-close-venue" type="button" class="sp-venue-done">Done</button></div><div class="sp-geometry-mode-tabs" role="group" aria-label="Venue editing tools"><button type="button" data-sp-geometry-mode="floor" aria-pressed="true" class="is-active">Floorplan</button><button type="button" data-sp-geometry-mode="roof" aria-pressed="false">Roof &amp; site</button></div><div id="sp-venue-meta" class="sp-venue-pane-meta"></div>';
      venuePane.appendChild(geometry);
      const paneTabs=document.createElement('div');
      paneTabs.className='sp-inspector-tabs';
      paneTabs.innerHTML='<button type="button" data-sp-inspector-mode="equipment" class="is-active" aria-pressed="true">Equipment</button><button type="button" data-sp-inspector-mode="venue" aria-pressed="false">Venue</button>';
      inspector.append(paneTabs,equipmentPane,venuePane);
      // Switch between floor plan and roof settings without separating the tools from the model.
      const sections=geometry.querySelectorAll('.sp-geometry-section');
      if(sections[1])sections[1].hidden=true;
      this.inspectorMode='equipment';this.geometryTab='floor';
      paneTabs.querySelectorAll('[data-sp-inspector-mode]').forEach(btn=>btn.addEventListener('click',()=>this.setInspectorMode(btn.dataset.spInspectorMode)));
      venuePane.querySelector('#sp-close-venue').addEventListener('click',()=>this.setInspectorMode('equipment'));
      venuePane.querySelectorAll('[data-sp-geometry-mode]').forEach(btn=>btn.addEventListener('click',()=>this.setGeometryTab(btn.dataset.spGeometryMode)));
      const controls=toolbar.querySelector('.sp-controls');
      const edit=document.createElement('button');
      edit.id='sp-edit-venue';edit.type='button';edit.className='button sp-open-venue';
      edit.textContent='Venue tools';
      controls.insertBefore(edit,controls.querySelector('#sp-new-venue'));
      edit.addEventListener('click',()=>this.setInspectorMode(this.inspectorMode==='venue'?'equipment':'venue'));
      const sceneHead=workspace.querySelector('.sp-scene-head h2');
      if(sceneHead)sceneHead.textContent='Space layout';
      const caption=workspace.querySelector('.sp-scene-head p');
      if(caption)caption.textContent='Select equipment, or open Venue tools to shape the space.';
      const shortcut=document.createElement('button');
      shortcut.type='button';shortcut.id='sp-geometry-shortcut';shortcut.className='sp-geometry-shortcut';
      shortcut.innerHTML='<span aria-hidden="true">▱</span> <span class="sp-geometry-shortcut-label">Edit venue</span>';
      workspace.querySelector('.sp-canvas-wrap').appendChild(shortcut);
      shortcut.addEventListener('click',()=>this.setInspectorMode('venue'));
      const viewControls=workspace.querySelector('.sp-view-controls');
      const focus=document.createElement('button');
      focus.id='sp-focus';focus.type='button';focus.className='sp-tool sp-focus-button';
      focus.setAttribute('aria-pressed','false');
      focus.setAttribute('aria-label','Expand space planner');
      focus.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg><span>Focus</span>';
      viewControls.appendChild(focus);
      focus.addEventListener('click',()=>this.setFocusMode(!this.isFocus));
      if(this.boundFocusKeydown)window.removeEventListener('keydown',this.boundFocusKeydown);
      this.boundFocusKeydown=e=>{if(e.key!=='Escape')return;if(this.isFocus){e.preventDefault();this.setFocusMode(false);this.root.querySelector('#sp-focus')?.focus();}else if(this.canvasActive){e.preventDefault();this.setCanvasActive(false);this.canvas?.blur();}};
      window.addEventListener('keydown',this.boundFocusKeydown);
      this.isFocus=false;
    }
    setInspectorMode(mode){
      const venue=mode==='venue';
      this.inspectorMode=venue?'venue':'equipment';
      const workspace=this.root.querySelector('.sp-workspace');
      workspace?.classList.toggle('sp-venue-editing',venue);
      const gear=this.root.querySelector('#sp-equipment-pane'),tools=this.root.querySelector('#sp-venue-pane');
      if(gear)gear.hidden=venue;
      if(tools)tools.hidden=!venue;
      this.root.querySelectorAll('[data-sp-inspector-mode]').forEach(button=>{
        const active=button.dataset.spInspectorMode===this.inspectorMode;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-pressed',String(active));
      });
      const quick=this.root.querySelector('#sp-edit-venue');
      if(quick){quick.classList.toggle('is-active',venue);quick.setAttribute('aria-pressed',String(venue));quick.textContent=venue?'Equipment tools':'Venue tools';}
      const shortcut=this.root.querySelector('#sp-geometry-shortcut');
      if(shortcut)shortcut.setAttribute('aria-pressed',String(venue));
      if(venue)this.setGeometryTab(this.geometryTab||'floor');
      else {this.editOutline=false;this.updateGeometry();this.draw();}
      this.resize();
    }
    setGeometryTab(tab){
      this.geometryTab=tab==='roof'?'roof':'floor';
      const roof=this.geometryTab==='roof';
      this.root.querySelectorAll('.sp-geometry-section').forEach((section,i)=>section.hidden=roof?i===0:i===1);
      this.root.querySelectorAll('[data-sp-geometry-mode]').forEach(button=>{
        const active=button.dataset.spGeometryMode===this.geometryTab;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-pressed',String(active));
      });
      this.editOutline=!roof;
      this.setView(roof?'three':'top');
      this.updateGeometry();
      const help=this.root.querySelector('.sp-scene-head p');
      if(help)help.textContent=roof?'Adjust roof and site settings while inspecting the model in 3D.':'Drag the numbered corners to shape the venue floorplan.';
      this.resize();
    }
    setFocusMode(active){
      this.isFocus=!!active;
      this.setCanvasActive(this.isFocus);
      const workspace=this.root.querySelector('.sp-workspace');
      workspace?.classList.toggle('sp-is-focused',this.isFocus);
      const button=this.root.querySelector('#sp-focus');
      if(button){button.setAttribute('aria-pressed',String(this.isFocus));button.setAttribute('aria-label',this.isFocus?'Exit expanded space planner':'Expand space planner');button.querySelector('span').textContent=this.isFocus?'Exit focus':'Focus';}
      this.resize();
    }
    setCanvasActive(active){
      this.canvasActive=!!active;
      const badge=this.root.querySelector('#sp-canvas-status');
      if(badge){
        badge.classList.toggle('is-active',this.canvasActive);
        const label=badge.querySelector('.sp-canvas-activation-text');
        if(label)label.textContent=this.canvasActive?'Editor active · scroll to zoom · Esc to release':'Click model to interact · scroll page normally';
      }
      this.canvas?.setAttribute('data-interactive',String(this.canvasActive));
    }
    bind(){
      const $=s=>this.root.querySelector(s);
      $('#sp-event').addEventListener('change',e=>{this.eventId=e.target.value;this.selected=null;this.ensureActive();this.save();this.build();});
      $('#sp-venue').addEventListener('change',e=>{
        if(e.target.value===this.plan.venueId)return;
        if(this.plan.items.length && !confirm('Change venue for this event? Equipment coordinates will be kept and clamped inside the new room.')){e.target.value=this.plan.venueId;return;}
        this.plan.venueId=e.target.value;this.event.venueId=e.target.value;this.event.venue=this.venue.name;
        this.plan.items.forEach(o=>this.constrainItem(o));
        this.save();this.selected=null;this.build();
      });
      $('#sp-new-venue').addEventListener('click',()=>{const panel=$('#sp-venue-new');panel.hidden=!panel.hidden;});
      $('#sp-create-venue').addEventListener('click',()=>{
        const name=$('#sp-newname').value.trim();if(!name){alert('Enter a venue name.');return;}
        const v={id:uid('ven'),name:name.slice(0,90),width:clamp(n($('#sp-neww').value,16),2,200),length:clamp(n($('#sp-newl').value,12),2,200),height:clamp(n($('#sp-newh').value,4),.5,40)};G.normalize(v);v.geometry.kind=$('#sp-newkind').value;if(v.geometry.kind==='outdoor')v.geometry.roof.type='none';
        this.db.venues.push(v);this.plan.venueId=v.id;this.event.venueId=v.id;this.event.venue=v.name;
        this.plan.items.forEach(o=>this.constrainItem(o));this.selected=null;this.save();this.build();this.notify('Venue added to the reusable library. Existing event placements were retained.');
      });
      $('#sp-save-venue').addEventListener('click',()=>{
        const v=this.venue;const w=n($('#sp-width').value),l=n($('#sp-length').value),h=n($('#sp-height').value);
        if(w<2||w>200||l<2||l>200||h<.5||h>40){alert('Use site dimensions 2–200m and reference height 0.5–40m.');return;}
        const oldW=v.width,oldL=v.length;
        for(const pt of v.geometry.footprint){pt.x=G.round(pt.x*w/oldW);pt.y=G.round(pt.y*l/oldL);}
        Object.assign(v,{width:w,length:l,height:h});v.geometry.roof.eave=h;
        this.rehomeAll();this.persist();this.updateGeometry();this.updateInspector();this.notify('Shared venue dimensions and footprint scaled across bookings.');
      });
      this.bindGeometry();
      $('#sp-view-three').addEventListener('click',()=>this.setView('three'));
      $('#sp-view-top').addEventListener('click',()=>this.setView('top'));
      $('#sp-fit').addEventListener('click',()=>{if(this.threeView)this.threeView.fit();else{this.zoom=1;this.yaw=-.65;this.tilt=.54;this.draw();}});
      $('#sp-zoom-in').addEventListener('click',()=>{if(this.threeView)this.threeView.zoomBy(1.2);else{this.zoom=clamp(this.zoom*1.2,.55,2.7);this.draw();}});
      $('#sp-zoom-out').addEventListener('click',()=>{if(this.threeView)this.threeView.zoomBy(1/1.2);else{this.zoom=clamp(this.zoom/1.2,.55,2.7);this.draw();}});
      $('#sp-show-runs').addEventListener('change',e=>{this.showRuns=e.target.checked;this.draw();});
      this.root.querySelectorAll('.sp-add').forEach(btn=>btn.addEventListener('click',()=>this.add(btn.dataset.kind)));
      $('#sp-inspect-body').addEventListener('change',e=>this.editItem(e));
      $('#sp-inspect-body').addEventListener('click',e=>{
        const cmd=e.target.closest('[data-cmd]')?.dataset.cmd;
        if(cmd==='remove')this.deleteSelected();
        if(cmd==='duplicate')this.duplicateSelected();
      });
      $('#sp-placed').addEventListener('click',e=>{const id=e.target.closest('[data-id]')?.dataset.id;if(id){this.selected=id;this.updateInspector();this.draw();}});
      $('#sp-cable-form').addEventListener('submit',e=>{e.preventDefault();const from=$('#sp-from').value,to=$('#sp-to').value,type=$('#sp-type').value;const slack=clamp(n($('#sp-slack').value,15),0,100);if(!from||!to||from===to){alert('Select two different placed items.');return;}
        this.plan.runs.push({id:uid('run'),from,to,type,slack});this.persist();this.updateRoutes();this.updateSummary();});
      $('#sp-runs').addEventListener('click',e=>{const id=e.target.closest('[data-remove-run]')?.dataset.removeRun;if(id){this.plan.runs=this.plan.runs.filter(r=>r.id!==id);this.persist();this.updateRoutes();}});
      $('#sp-sync').addEventListener('click',()=>this.syncKit());
      this.canvas.addEventListener('pointerdown',e=>this.pointerDown(e));
      this.canvas.addEventListener('pointermove',e=>this.pointerMove(e));
      this.canvas.addEventListener('pointerup',()=>this.pointerUp());
      this.canvas.addEventListener('pointercancel',()=>this.pointerUp());
      this.canvas.addEventListener('focus',()=>this.setCanvasActive(true));
      this.canvas.addEventListener('wheel',e=>{if(!this.canvasActive)return;e.preventDefault();this.zoom=clamp(this.zoom*(e.deltaY>0?.91:1.1),.55,2.7);this.draw();},{passive:false});
      if(this.boundCanvasOutsidePointerdown)document.removeEventListener('pointerdown',this.boundCanvasOutsidePointerdown);
      this.boundCanvasOutsidePointerdown=e=>{if(this.canvasActive&&!this.isFocus&&!this.canvas.parentElement.contains(e.target)){this.setCanvasActive(false);}};
      document.addEventListener('pointerdown',this.boundCanvasOutsidePointerdown);
      this.setCanvasActive(false);
    }
    constrainItem(o){
      const v=this.venue,poly=v.geometry.footprint;
      const p={x:clamp(n(o.x),0,v.width),y:clamp(n(o.y),0,v.length)};
      const inside=G.insidePosition(poly,p);o.x=inside.x;o.y=inside.y;o.z=clamp(n(o.z),0,Math.max(v.height,G.peakHeight(v)));
    }
    rehomeAll(){
      const v=this.venue;
      for(const plan of Object.values(this.db.venuePlans))if(plan.venueId===v.id)for(const o of plan.items||[])this.constrainItem(o);
    }
    bindGeometry(){
      const $=s=>this.root.querySelector(s);
      $('#sp-apply-shape').addEventListener('click',()=>{
        const type=$('#sp-shape').value;
        if(!confirm(`Replace the shared venue outline with an ${type==='rectangle'?'rectangular':type} starting shape? Existing equipment positions will be kept where possible.`))return;
        this.venue.geometry.footprint=G.template(type,this.venue.width,this.venue.length);
        this.selectedVertex=null;this.rehomeAll();this.save();this.updateAll();this.updateGeometry();
        this.notify('Venue outline updated. Check equipment placements and cable routes.');
      });
      $('#sp-edit-outline').addEventListener('click',()=>{
        this.editOutline=!this.editOutline;
        if(this.editOutline)this.setView('top');
        this.updateGeometry();this.draw();
      });
      $('#sp-add-corner').addEventListener('click',()=>{
        const pts=this.venue.geometry.footprint;
        if(pts.length>=30){this.notify('A venue may have up to 30 corners.');return;}
        let index=0,max=-1;pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length],dist=Math.hypot(p.x-q.x,p.y-q.y);if(dist>max){max=dist;index=i;}});
        if(max<.41){this.notify('All edges are too short to split.');return;}
        const a=pts[index],b=pts[(index+1)%pts.length];const vertex=G.point((a.x+b.x)/2,(a.y+b.y)/2);
        pts.splice(index+1,0,vertex);this.selectedVertex=vertex.id;this.editOutline=true;this.setView('top');this.save();this.updateAll();this.updateGeometry();
      });
      $('#sp-remove-corner').addEventListener('click',()=>{
        const pts=this.venue.geometry.footprint,idx=pts.findIndex(p=>p.id===this.selectedVertex);
        if(idx<0||pts.length<=3)return;
        const trial=pts.filter((_,i)=>i!==idx);const problem=G.valid(trial,this.venue.width,this.venue.length);
        if(problem){this.notify(problem);return;}
        pts.splice(idx,1);this.selectedVertex=null;this.rehomeAll();this.save();this.updateAll();this.updateGeometry();
      });
      $('#sp-corners').addEventListener('change',e=>{
        const el=e.target.closest('[data-vertex-id][data-axis]');if(!el)return;
        const pts=this.venue.geometry.footprint,p=pts.find(p=>p.id===el.dataset.vertexId),axis=el.dataset.axis;
        if(!p||!['x','y'].includes(axis))return;
        const prev=p[axis];p[axis]=G.round(Number(el.value));
        const problem=G.valid(pts,this.venue.width,this.venue.length);
        if(problem){p[axis]=prev;el.value=prev;this.notify(problem);return;}
        this.selectedVertex=p.id;this.rehomeAll();this.save();this.updateAll();this.updateGeometry();
      });
      $('#sp-kind').addEventListener('change',e=>{
        const g=this.venue.geometry;g.kind=e.target.value==='outdoor'?'outdoor':'indoor';
        if(g.kind==='outdoor')g.roof.type='none';
        else if(g.roof.type==='none')g.roof.type='flat';
        this.save();this.updateGeometry();this.updateAll();
      });
      for(const [id,key] of [['sp-roof-type','type'],['sp-roof-axis','axis'],['sp-eave','eave'],['sp-peak','peak']]){
        $('#'+id).addEventListener('change',e=>{
          const r=this.venue.geometry.roof,value=e.target.value;
          if(key==='type'&&!['none','flat','mono','gable','custom'].includes(value))return;
          if(key==='axis'&&!['x','y'].includes(value))return;
          if(key==='eave'||key==='peak'){
            const measured=Number(value),limit=key==='eave'?40:50;
            if(!Number.isFinite(measured)||measured<.5||measured>limit){this.notify(`Enter a ${key} height from 0.5 to ${limit} metres.`);this.updateGeometry();return;}
            r[key]=G.round(measured);
            if(key==='eave')this.venue.height=r.eave;
          }else r[key]=value;
          this.save();this.updateGeometry();this.updateAll();
        });
      }
      $('#sp-roof-corners').addEventListener('change',e=>{
        const el=e.target.closest('[data-roof-vertex]');if(!el)return;
        const value=Number(el.value);
        if(!Number.isFinite(value)||value<.5||value>50){this.notify('Corner heights must be 0.5–50m.');this.updateGeometry();return;}
        this.venue.geometry.roof.heights[el.dataset.roofVertex]=G.round(value);
        this.save();this.updateAll();this.updateGeometry();
      });
    }
    updateGeometry(){
      const v=this.venue,g=G.normalize(v),r=g.roof;
      const $=s=>this.root.querySelector(s);
      $('#sp-kind').value=g.kind;$('#sp-roof-type').value=r.type;$('#sp-roof-axis').value=r.axis;$('#sp-eave').value=r.eave;$('#sp-peak').value=r.peak;
      $('#sp-area').textContent=`${G.area(g.footprint).toFixed(1)} m² mapped`;
      const venueMeta=$('#sp-venue-meta');if(venueMeta)venueMeta.textContent=Math.round(G.area(g.footprint))+' m² · '+(g.kind==='outdoor'?'Outdoor':r.type==='none'?'Open roof':({flat:'Flat roof',mono:'Sloped roof',gable:'Pitched roof',custom:'Custom roof'}[r.type]||'Roof'));const venueShortcut=$('#sp-geometry-shortcut .sp-geometry-shortcut-label');if(venueShortcut)venueShortcut.textContent='Venue · '+Math.round(G.area(g.footprint))+' m²';
      $('#sp-corner-count').textContent=`· ${g.footprint.length} corners`;
      $('#sp-remove-corner').disabled=!this.selectedVertex||g.footprint.length<=3;
      $('#sp-edit-outline').classList.toggle('primary',this.editOutline);
      $('#sp-edit-outline').textContent=this.editOutline?'✓ Editing in top view':'Edit corners on plan';
      const corners=$('#sp-corners');
      corners.innerHTML=`<div class="sp-corner-head"><span>Point</span><span>X (m)</span><span>Y (m)</span><span></span></div>`+g.footprint.map((p,i)=>`<div class="sp-corner-row ${p.id===this.selectedVertex?'active':''}"><button type="button" data-focus-vertex="${esc(p.id)}">${i+1}</button><input type="number" min="0" max="${v.width}" step="0.1" aria-label="Corner ${i+1} X" data-vertex-id="${esc(p.id)}" data-axis="x" class="field" value="${p.x}"><input type="number" min="0" max="${v.length}" step="0.1" aria-label="Corner ${i+1} Y" data-vertex-id="${esc(p.id)}" data-axis="y" class="field" value="${p.y}"><span>m</span></div>`).join('');
      corners.querySelectorAll('[data-focus-vertex]').forEach(b=>b.addEventListener('click',()=>{this.selectedVertex=b.dataset.focusVertex;this.editOutline=true;this.setView('top');this.updateGeometry();this.draw();}));
      $('#sp-peak').disabled=['none','flat'].includes(r.type);
      $('#sp-roof-axis').disabled=!['mono','gable'].includes(r.type);
      $('#sp-eave').disabled=r.type==='none';
      $('#sp-roof-corners').innerHTML=r.type==='custom'?`<p class="sp-geometry-note">Set a different elevation at each perimeter corner:</p><div class="sp-custom-grid">${g.footprint.map((p,i)=>`<label>Corner ${i+1}<input type="number" data-roof-vertex="${esc(p.id)}" class="field" min="0.5" max="50" step="0.1" value="${G.round(Number.isFinite(Number(r.heights[p.id]))?Number(r.heights[p.id]):r.eave)}"></label>`).join('')}</div>`:'';
      const edit=$('#sp-edit-outline');edit.setAttribute('aria-pressed',String(this.editOutline));
    }
    setView(mode){this.mode=mode;for(const [id,active] of [['sp-view-three',mode==='three'],['sp-view-top',mode==='top'],['sp-view-perspective',mode==='perspective']]){const button=this.root.querySelector('#'+id);if(!button)continue;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));}if(this.threeView)this.threeView.setMode(mode);else this.draw();}
    selectedItem(){return this.plan.items.find(x=>x.id===this.selected);}
    kindForGear(g){const s=(g?.category||'').toLowerCase();return s.includes('light')?'light':s.includes('audio')?'audio':s.includes('power')?'power':s.includes('control')?'control':s.includes('rig')?'rigging':s.includes('network')?'network':'other';}
    add(kind,fixtureType=null){
      const F=window.PhaenomenonFixtures;
      if(kind==='light'&&!fixtureType&&F){F.pick(type=>this.add('light',type));return;}
      const v=this.venue,items=this.plan.items;
      const proposed={x:r1(clamp(v.width/2+(items.length%4-1.5)*1.2,0,v.width)),y:r1(clamp(v.length/2+Math.floor(items.length/4)*1.1,0,v.length))};
      const {x,y}=G.insidePosition(v.geometry.footprint,proposed);
      const obj={id:uid('obj'),kind,name:TYPES.find(t=>t[0]===kind)?.[1]||'Equipment',x,y,z:kind==='light'?Math.min(2.5,G.peakHeight(v)):0,watts:0,eqId:''};
      if(kind==='light'&&F)F.apply(obj,fixtureType||'par');
      items.push(obj);this.selected=obj.id;this.persist();this.updateAll();
    }
    editItem(e){const item=this.selectedItem();if(!item)return;const key=e.target.dataset.key;if(!key)return;const v=this.venue;
      if(['x','y','z','watts'].includes(key)){const max=key==='x'?v.width:key==='y'?v.length:key==='z'?Math.max(v.height,G.peakHeight(v)):100000;const min=0;item[key]=r1(clamp(n(e.target.value),min,max));if(key==='x'||key==='y'){const loc=G.insidePosition(v.geometry.footprint,{x:item.x,y:item.y});item.x=loc.x;item.y=loc.y;}}
      else if(key==='kind'){if(palette[e.target.value]){item.kind=e.target.value;if(item.kind==='light')window.PhaenomenonFixtures?.ensure(item);}}
      else if(key==='name')item.name=e.target.value.slice(0,100).trim()||'Equipment';
      else if(key==='eqId'){const gear=this.db.equipment.find(g=>g.id===e.target.value);item.eqId=gear?.id||'';if(gear){item.name=gear.name;item.kind=this.kindForGear(gear);item.watts=n(gear.watts);if(item.kind==='light')window.PhaenomenonFixtures?.ensure(item);}}
      this.persist();this.updateAll();
    }
    deleteSelected(){if(!this.selectedItem())return;this.plan.items=this.plan.items.filter(o=>o.id!==this.selected);this.plan.runs=this.plan.runs.filter(r=>r.from!==this.selected&&r.to!==this.selected);this.selected=null;this.persist();this.updateAll();}
    duplicateSelected(){const o=this.selectedItem();if(!o)return;const v=this.venue,p=G.insidePosition(v.geometry.footprint,{x:r1(clamp(o.x+1,0,v.width)),y:r1(clamp(o.y+1,0,v.length))}),clone={...o,id:uid('obj'),name:o.name+' copy',x:p.x,y:p.y};this.plan.items.push(clone);this.selected=clone.id;this.persist();this.updateAll();}
    syncKit(){
      const ev=this.event,items=this.plan.items.filter(o=>o.eqId&&this.db.equipment.some(g=>g.id===o.eqId));
      if(!items.length){alert('Link at least one placed item to an equipment catalogue entry in the inspector first.');return;}
      const counts={};items.forEach(o=>counts[o.eqId]=(counts[o.eqId]||0)+1);
      if((ev.kit||[]).length&&!confirm('Replace the assigned event kit with the catalogue-linked items placed in this layout? Unplaced items in the kit will be removed.'))return;
      ev.kit=Object.entries(counts).map(([id,qty])=>({id,qty}));this.save();this.notify('Placed equipment copied into the event kit. Review additional cables, stands and stock before invoicing.');
    }
    updateAll(){this.updateInspector();this.updateRoutes();this.updateSummary();this.draw();}
    updateInspector(){
      const el=this.root.querySelector('#sp-inspect-body'),item=this.selectedItem();this.root.querySelector('#sp-count').textContent=`${this.plan.items.length}`;
      this.root.querySelector('#sp-placed').innerHTML=this.plan.items.length?this.plan.items.map(o=>`<button type="button" data-id="${esc(o.id)}" class="sp-object-row ${this.selected===o.id?'active':''}">${o.kind==='light'&&window.PhaenomenonFixtures?window.PhaenomenonFixtures.icon(o.fixtureType||'par'):'<i style="background:'+ (palette[o.kind]||palette.other)+'"></i>'}<span>${esc(o.name)}</span><small>${r1(o.x)}m, ${r1(o.y)}m</small></button>`).join(''):'<p class="sp-muted">Add some equipment using the palette.</p>';
      if(!item){el.innerHTML='<div class="sp-empty"><span>◎</span><strong>Nothing selected</strong><p>Click a model object or choose one from the equipment list. Its coordinates and height will appear here.</p></div>';return;}
      const field=(label,key,value,max)=>`<label>${label}<input data-key="${key}" class="field" type="number" step="0.1" min="0" max="${max}" value="${r1(value)}"></label>`;
      el.innerHTML=`<label class="sp-inspect-full">Item name<input data-key="name" class="field" maxlength="100" value="${esc(item.name)}"></label><label class="sp-inspect-full">Equipment type<select data-key="kind" class="form-select">${TYPES.map(([k,label])=>`<option value="${k}" ${item.kind===k?'selected':''}>${label}</option>`).join('')}</select></label>
      <label class="sp-inspect-full">Link to equipment inventory<select data-key="eqId" class="form-select"><option value="">Not linked (visual only)</option>${this.db.equipment.map(g=>`<option value="${esc(g.id)}" ${item.eqId===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label>
      <div class="sp-coordinates">${field('X · metres','x',item.x,this.venue.width)}${field('Y · metres','y',item.y,this.venue.length)}${field('Height · m','z',item.z,G.peakHeight(this.venue))}${field('Watts (estimate)','watts',item.watts,100000)}</div>
      <div class="sp-inspect-actions"><button type="button" class="button small" data-cmd="duplicate">Duplicate</button><button type="button" class="button small" data-cmd="remove">Remove</button></div>`;
      const F=window.PhaenomenonFixtures;
      if(F)F.mountInspector(el,item,(changed,refresh)=>{this.save();if(refresh)this.updateInspector();this.draw();});
    }
    route(r){
      const a=this.plan.items.find(x=>x.id===r.from),b=this.plan.items.find(x=>x.id===r.to);if(!a||!b)return null;
      const floorPath=G.shortest(this.venue.geometry.footprint,{x:a.x,y:a.y},{x:b.x,y:b.y});
      if(!floorPath)return null;
      const points=[{x:a.x,y:a.y,z:a.z},...floorPath.map(p=>({x:p.x,y:p.y,z:0})),{x:b.x,y:b.y,z:b.z}];
      let base=0;for(let i=1;i<points.length;i++)base+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y,points[i].z-points[i-1].z);
      const length=r1(base*(1+clamp(n(r.slack),0,100)/100));
      const options=[3,5,10,15,20,25,30,50,100];const suggested=options.find(x=>x>=length);
      return {a,b,points,length,suggested:suggested?`${suggested} m`:`Custom (>${100} m)`};
    }
    updateRoutes(){
      const opts=this.plan.items.map(o=>`<option value="${esc(o.id)}">${esc(o.name)}</option>`).join('');
      for(const key of ['from','to']){const sel=this.root.querySelector('#sp-'+key);const current=sel.value;sel.innerHTML=opts;if(this.plan.items.some(o=>o.id===current))sel.value=current;}
      if(this.root.querySelector('#sp-from').value===this.root.querySelector('#sp-to').value&&this.plan.items.length>1)this.root.querySelector('#sp-to').selectedIndex=1;
      const body=this.root.querySelector('#sp-runs');const rows=this.plan.runs.map(run=>({run,calc:this.route(run)})).filter(o=>o.calc);
      body.innerHTML=rows.length?rows.map(({run,calc})=>`<tr><td>${esc(calc.a.name)} <span class="sp-arrow">→</span> ${esc(calc.b.name)}</td><td><span class="sp-dot" style="background:${CABLES[run.type]?.color||'#aaa'}"></span>${esc(CABLES[run.type]?.label||run.type)}</td><td><strong>${calc.length.toFixed(1)} m</strong> <small>incl. ${clamp(n(run.slack),0,100)}% slack</small></td><td>${calc.suggested}</td><td><button type="button" class="sp-remove" data-remove-run="${esc(run.id)}" aria-label="Remove route">×</button></td></tr>`).join(''):'<tr><td colspan="5" class="sp-muted">Connect two objects above to see cable route estimates.</td></tr>';
      const totals={};for(const {run,calc} of rows)totals[run.type]=(totals[run.type]||0)+calc.length;
      this.root.querySelector('#sp-totals').innerHTML=Object.entries(CABLES).map(([kind,{label,color}])=>`<span><i style="background:${color}"></i>${esc(label)} <strong>${r1(totals[kind]||0).toFixed(1)} m</strong></span>`).join('');
    }
    updateSummary(){
      const v=this.venue,items=this.plan.items,watts=items.reduce((a,o)=>a+n(o.watts),0),length=this.plan.runs.reduce((a,r)=>a+(this.route(r)?.length||0),0);
      this.root.querySelector('#sp-summary').innerHTML=`<div class="sp-stat"><span>Venue footprint</span><strong>${G.area(v.geometry.footprint).toFixed(1)} m²</strong><small>${v.geometry.kind==='outdoor'?'Open-air site': 'Enclosed / covered'} · ${r1(v.width)} × ${r1(v.length)} m bounds</small></div><div class="sp-stat"><span>Placed items</span><strong>${items.length}</strong><small>${items.filter(o=>o.eqId).length} inventory-linked</small></div><div class="sp-stat"><span>Connected cable</span><strong>${r1(length).toFixed(1)} m</strong><small>${this.plan.runs.length} routed connections</small></div><div class="sp-stat"><span>Indicative connected load</span><strong>${r1(watts).toLocaleString()} W</strong><small>Fixture ratings only, not load approval</small></div>`;
    }
    resize(){if(this.threeView){this.threeView.resize();return;}if(!this.canvas)return;const rect=this.canvas.getBoundingClientRect();if(rect.width<=0)return;const dpr=clamp(window.devicePixelRatio||1,1,2);this.canvas.width=Math.round(rect.width*dpr);this.canvas.height=Math.round(rect.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.draw();}
    computeCamera(){
      const w=this.canvas.clientWidth||900,h=this.canvas.clientHeight||550,v=this.venue;
      const angle=this.mode==='top'?0:this.yaw,c=Math.cos(angle),s=Math.sin(angle);const horiz=Math.abs(v.width*c)+Math.abs(v.length*s);const depth=Math.abs(v.width*s)+Math.abs(v.length*c);
      const viewHeight=G.peakHeight(v);const extentY=this.mode==='top'?depth:(depth*Math.sin(this.tilt)+viewHeight*Math.cos(this.tilt));
      const scale=clamp(Math.min((w-90)/(horiz||1),(h-110)/(extentY||1))*this.zoom,6,120);
      const centerX=w/2,centerY=this.mode==='top'?h/2:(h/2 + viewHeight*.23*scale);
      this.geometry={w,h,scale,angle,c,s,centerX,centerY,tilt:this.mode==='top'?Math.PI/2:this.tilt};
    }
    project(o){const g=this.geometry,v=this.venue,dx=o.x-v.width/2,dy=o.y-v.length/2;
      const u=dx*g.c-dy*g.s,d=dx*g.s+dy*g.c;
      return {x:g.centerX+u*g.scale,y:g.centerY+(d*Math.sin(g.tilt)-o.z*Math.cos(g.tilt))*g.scale};
    }
    unproject(x,y,z){const g=this.geometry,v=this.venue;const u=(x-g.centerX)/g.scale;
      const d=((y-g.centerY)/g.scale+z*Math.cos(g.tilt))/Math.max(.08,Math.sin(g.tilt));
      return {x:clamp(r1(u*g.c+d*g.s+v.width/2),0,v.width),y:clamp(r1(-u*g.s+d*g.c+v.length/2),0,v.length)};
    }
    path(points,stroke,fill,width=1,dash=[]){const c=this.ctx;c.save();c.beginPath();points.forEach((o,i)=>{const p=this.project(o);if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);});if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.setLineDash(dash);c.stroke();}c.restore();}
    draw(){
      if(this.threeView){this.threeView.rebuild();return;}
      if(!this.canvas||!this.canvas.clientWidth)return;this.computeCamera();const c=this.ctx,g=this.geometry,v=this.venue;
      c.clearRect(0,0,g.w,g.h);c.fillStyle='#18292d';c.fillRect(0,0,g.w,g.h);
      // ambient accent
      const grad=c.createRadialGradient(g.w*.65,g.h*.2,5,g.w*.65,g.h*.2,g.w*.9);grad.addColorStop(0,'#30474a');grad.addColorStop(1,'#18292d');c.fillStyle=grad;c.fillRect(0,0,g.w,g.h);
      const floor=v.geometry.footprint.map(p=>({...p,z:0}));
      this.path(floor,'#7da6a0',v.geometry.kind==='outdoor'?'#325345':'#254144',2.5);
      // Grid clipped to the actual site footprint rather than its bounding rectangle.
      c.save();c.beginPath();floor.forEach((p,i)=>{const pt=this.project(p);if(i)c.lineTo(pt.x,pt.y);else c.moveTo(pt.x,pt.y);});c.closePath();c.clip();
      const step=Math.max(1,Math.ceil(Math.max(v.width,v.length)/30));
      for(let x=0;x<=v.width;x+=step)this.path([{x,y:0,z:0},{x,y:v.length,z:0}],'#86a5a433',null,1);
      for(let y=0;y<=v.length;y+=step)this.path([{x:0,y,z:0},{x:v.width,y,z:0}],'#86a5a433',null,1);
      c.restore();
      const r=v.geometry.roof;
      if(this.mode==='three'&&r.type!=='none'){
        // A lightweight, semi-transparent envelope preserves visibility of event equipment.
        for(let i=0;i<floor.length;i++){
          const a=floor[i],b=floor[(i+1)%floor.length],ha=G.height(v,a),hb=G.height(v,b);
          this.path([a,b,{...b,z:hb},{...a,z:ha}],null,i%2===0?'#77a8a120':'#90bbb417');
          this.path([a,{...a,z:ha}], '#8bb3b18a',null,1.2,[4,5]);
          this.path([{...a,z:ha},{...b,z:hb}], '#b6d1c397',null,1.6);
        }
        // Sample the gable ridge in the roof interior, including for concave footprints.
        if(r.type==='gable'){
          let chain=[];const samples=65;
          for(let i=0;i<=samples;i++){
            const t=i/samples,pt=r.axis==='x'?{x:v.width/2,y:t*v.length}:{x:t*v.width,y:v.length/2};
            if(G.contains(v.geometry.footprint,pt))chain.push({...pt,z:G.height(v,pt)});
            else if(chain.length){if(chain.length>1)this.path(chain,'#e9bf7ca9',null,1.7,[5,3]);chain=[];}
          }
          if(chain.length>1)this.path(chain,'#e9bf7ca9',null,1.7,[5,3]);
        }
        if(r.type==='mono'){
          const hi=r.axis==='x'?{x:v.width*.75,y:v.length*.5}:{x:v.width*.5,y:v.length*.75};
          const low=r.axis==='x'?{x:v.width*.25,y:v.length*.5}:{x:v.width*.5,y:v.length*.25};
          if(G.contains(v.geometry.footprint,hi)&&G.contains(v.geometry.footprint,low))this.path([{...low,z:G.height(v,low)},{...hi,z:G.height(v,hi)}],'#e9bf7ca9',null,1.6,[4,4]);
        }
        if(r.type==='custom'){
          const central=G.insidePosition(v.geometry.footprint,{x:v.width*.5,y:v.length*.5});
          for(const p of floor){if(G.segmentInside(v.geometry.footprint,central,p))this.path([{...central,z:G.height(v,central)},{...p,z:G.height(v,p)}],'#c9b3e75e',null,1,[5,5]);}
        }
      }
      if(this.mode==='top' || this.editOutline){
        for(let i=0;i<floor.length;i++){
          const a=floor[i],b=floor[(i+1)%floor.length],aa=this.project(a),bb=this.project(b);
          const mx=(aa.x+bb.x)/2,my=(aa.y+bb.y)/2;
          c.save();c.fillStyle='#d8ede8';c.textAlign='center';c.font='10px system-ui';
          c.fillText(`${Math.hypot(a.x-b.x,a.y-b.y).toFixed(1)}m`,mx,my-7);c.restore();
        }
      }
      if(this.editOutline && this.mode==='top'){
        for(let i=0;i<floor.length;i++){
          const p=this.project(floor[i]),selected=floor[i].id===this.selectedVertex;
          c.save();c.beginPath();c.arc(p.x,p.y,selected?11:9,0,Math.PI*2);
          c.fillStyle=selected?'#f1b864':'#d8ede7';c.fill();c.strokeStyle='#253d3b';c.lineWidth=2;c.stroke();
          c.font='bold 11px system-ui';c.fillStyle='#273e3c';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),p.x,p.y);c.restore();
        }
      }
      c.fillStyle='#c3d6d1';c.font='12px system-ui';c.textAlign='left';
      const origin=this.project({x:0,y:0,z:0});c.fillText('0,0',origin.x+7,origin.y-8);
      const wtext=this.project({x:v.width/2,y:v.length,z:0});c.fillText(`${r1(v.width)}m wide`,wtext.x+8,wtext.y+19);
      const ltext=this.project({x:v.width,y:v.length/2,z:0});c.fillText(`${r1(v.length)}m long`,ltext.x+8,ltext.y+4);
      if(this.mode==='three'&&v.geometry.roof.type!=='none'){const ht=this.project({x:0,y:0,z:G.height(v,{x:0,y:0})});c.fillText(`${v.geometry.roof.type} roof`,ht.x+8,ht.y-9);}
      if(this.showRuns)for(const run of this.plan.runs){const rt=this.route(run);if(!rt)continue;this.path(rt.points,CABLES[run.type]?.color||'#e5ecec',null,2.5,[7,4]);}
      // Draw raised item stems and floor shadows first.
      for(const o of this.plan.items){if(o.z>.05&&this.mode==='three'){
        const base=this.project({...o,z:0}),pos=this.project(o);c.strokeStyle='#a6c3bc55';c.lineWidth=1.4;c.setLineDash([3,3]);c.beginPath();c.moveTo(base.x,base.y);c.lineTo(pos.x,pos.y);c.stroke();c.setLineDash([]);
      }}
      const nodes=this.plan.items.map(o=>({o,p:this.project(o)})).sort((a,b)=>a.p.y-b.p.y);
      for(const {o,p} of nodes){const color=palette[o.kind]||palette.other,active=o.id===this.selected,rr=active?13:10;
        c.save();c.shadowBlur=active?24:12;c.shadowColor=color+'aa';c.fillStyle=color;c.strokeStyle=active?'#fff9db':'#203037';c.lineWidth=active?3:2;
        if(o.kind==='stage'){c.fillRect(p.x-15,p.y-9,30,18);c.strokeRect(p.x-15,p.y-9,30,18);}
        else if(o.kind==='network'||o.kind==='control'){c.beginPath();c.roundRect(p.x-rr,p.y-rr,rr*2,rr*2,3);c.fill();c.stroke();}
        else if(o.kind==='rigging'){c.beginPath();c.moveTo(p.x,p.y-rr-3);c.lineTo(p.x+rr+2,p.y+rr);c.lineTo(p.x-rr-2,p.y+rr);c.closePath();c.fill();c.stroke();}
        else {c.beginPath();c.arc(p.x,p.y,rr,0,Math.PI*2);c.fill();c.stroke();}
        if(active){c.strokeStyle='#f7f3df99';c.setLineDash([3,3]);c.beginPath();c.arc(p.x,p.y,19,0,Math.PI*2);c.stroke();}
        c.shadowBlur=0;c.font=active?'600 12px system-ui':'11px system-ui';c.fillStyle=active?'#ffffff':'#e4edeb';c.textAlign='center';c.strokeStyle='#142528';c.lineWidth=3;c.lineJoin='round';c.strokeText(o.name,p.x,p.y-rr-10);c.fillText(o.name,p.x,p.y-rr-10);c.restore();
      }
      this.hitNodes=nodes.slice().reverse();

    }
    coord(e){const r=this.canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
    pointerDown(e){if(e.button!==0)return;this.setCanvasActive(true);this.canvas.focus({preventScroll:true});const pos=this.coord(e);
      if(this.editOutline&&this.mode==='top'){const vertex=this.venue.geometry.footprint.find(p=>{const screen=this.project({...p,z:0});return Math.hypot(screen.x-pos.x,screen.y-pos.y)<17;});
        if(vertex){this.selectedVertex=vertex.id;this.updateGeometry();this.draw();this.drag={mode:'vertex',last:pos,changed:false};this.canvas.setPointerCapture(e.pointerId);return;}}
      const hit=(this.hitNodes||[]).find(({p})=>Math.hypot(p.x-pos.x,p.y-pos.y)<23);
      if(hit){this.selected=hit.o.id;this.updateInspector();this.draw();this.drag={mode:'object',last:pos,changed:false};}
      else this.drag={mode:'orbit',last:pos};this.canvas.setPointerCapture(e.pointerId);
    }
    pointerMove(e){if(!this.drag)return;const p=this.coord(e),d=this.drag,dx=p.x-d.last.x,dy=p.y-d.last.y;
      if(d.mode==='vertex'){const pts=this.venue.geometry.footprint,v=this.venue,vertex=pts.find(q=>q.id===this.selectedVertex);if(vertex){const loc=this.unproject(p.x,p.y,0),prev={x:vertex.x,y:vertex.y};vertex.x=loc.x;vertex.y=loc.y;const problem=G.valid(pts,v.width,v.length);if(problem){vertex.x=prev.x;vertex.y=prev.y;}else{d.changed=true;this.draw();}}}
      else if(d.mode==='object'){const o=this.selectedItem();if(o){const loc=this.unproject(p.x,p.y,o.z);const inside=G.contains(this.venue.geometry.footprint,loc)?loc:G.insidePosition(this.venue.geometry.footprint,loc);if(o.x!==inside.x||o.y!==inside.y){o.x=inside.x;o.y=inside.y;d.changed=true;this.draw();this.updateSummary();this.updateRoutes();}}}
      else if(this.mode==='three'){this.yaw+=dx*.008;this.tilt=clamp(this.tilt+dy*.004,.21,1.26);this.draw();}
      d.last=p;
    }
    pointerUp(){if(this.drag?.mode==='vertex'&&this.drag.changed){this.rehomeAll();this.save();this.updateGeometry();this.updateAll();}
      else if(this.drag?.mode==='object'&&this.drag.changed){this.save();this.updateInspector();this.updateRoutes();this.updateSummary();}this.drag=null;}
  }
  function mount(root,db,onSave,onNotify,eventId){if(!root)return;ensure(db);if(window.__phaenomenonActivePlanner?.resizeObserver)window.__phaenomenonActivePlanner.resizeObserver.disconnect();if(window.__phaenomenonActivePlanner?.threeView)window.__phaenomenonActivePlanner.threeView.dispose();if(window.__phaenomenonActivePlanner?.boundFocusKeydown)window.removeEventListener('keydown',window.__phaenomenonActivePlanner.boundFocusKeydown);if(window.__phaenomenonActivePlanner?.boundCanvasOutsidePointerdown)document.removeEventListener('pointerdown',window.__phaenomenonActivePlanner.boundCanvasOutsidePointerdown);window.__phaenomenonActivePlanner=new Planner(root,db,onSave,onNotify,eventId);}
  document.addEventListener('phaenomenon-three-ready',()=>{const p=window.__phaenomenonActivePlanner;if(p&&!p.threeView&&p.root?.isConnected){p.threeView=window.Phaenomenon3D.attach(p);p.threeView?.decorateInspector();}});
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#/spaces'))return;const p=window.__phaenomenonActivePlanner;if(p?.threeView){p.threeView.dispose();p.threeView=null;}});
  window.PhaenomenonSpacePlanner={ensure,mount};
})();