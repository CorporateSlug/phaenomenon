/* Phaenomenon technical planning UI.
 * Shared 3D equipment, patch/power assignments and physical cable runs.
 * This is a local-first planning prototype, not electrical or rigging approval. */
(()=>{
'use strict';
const C=window.PhaenomenonTechCore;
if(!C)return;
const {clean:E,n:N,round:R,ID,CONNECTORS,DEFAULT_LENGTHS,title:T}=C;
const options=(list,value)=>list.map(v=>'<option value="'+E(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+E(v||'Not specified')+'</option>').join('');
const fmt=(n,d=1)=>Number(n||0).toFixed(d);
const badge=(v)=>'<span class="tech-pill '+v+'">'+(v==='error'?'Issue':v==='warning'?'Review':'OK')+'</span>';
const attrs=(o)=>Object.entries(o).map(([k,v])=>' '+k+'="'+E(v)+'"').join('');
const nav=[['layout','3D layout'],['map','Power + data map'],['patch','DMX patch'],['power','Power'],['cables','Cable runs'],['report','Install pack']];
function graph(p,e,type){
 const t=e.t,groups=type==='dmx'?Array.from({length:t.universeCount},(_,i)=>({id:String(i+1),label:'Universe '+(i+1),items:e.patchRows.filter(r=>r.u===i+1).map(r=>r.o)})).filter(g=>g.items.length):e.circuits.map(q=>({id:q.c.id,label:q.c.name,items:q.assigned})).filter(g=>g.items.length);
 if(!groups.length)return '<div class="tech-empty">No '+T(type)+' assignments yet. Use '+(type==='dmx'?'DMX patch':'Power')+' to add them.</div>';
 return groups.map(g=>{
  const endpointIds=new Set(g.items.map(o=>o.id)),edges=[];
  for(const r of e.plan.runs.filter(x=>x.type===type)){if(endpointIds.has(r.to)){endpointIds.add(r.from);edges.push(r)}}
  const nodes=[...endpointIds].map(id=>e.items.find(o=>o.id===id)).filter(Boolean);
  const depth=new Map(nodes.map(o=>[o.id,0]));for(let i=0;i<Math.min(nodes.length,8);i++){let changed=false;for(const r of edges){if(!depth.has(r.from)||!depth.has(r.to))continue;const next=Math.min(nodes.length-1,(depth.get(r.from)||0)+1);if(next>(depth.get(r.to)||0)){depth.set(r.to,next);changed=true}}if(!changed)break}
  const cols=new Map();for(const node of nodes){const d=depth.get(node.id)||0;if(!cols.has(d))cols.set(d,[]);cols.get(d).push(node)}
  const maxCol=Math.max(0,...cols.keys()),maxRows=Math.max(1,...[...cols.values()].map(v=>v.length));const w=Math.max(390,(maxCol+1)*185+60),h=Math.max(120,maxRows*105+35);
  const xy=new Map();for(const [d,column] of cols){column.forEach((node,i)=>xy.set(node.id,{x:18+d*185,y:17+i*105}))}
  const edgesMarkup=edges.map(r=>{const a=xy.get(r.from),b=xy.get(r.to);if(!a||!b)return '';const calc=C.routeInfo(p,r),label=calc?(calc.selected==null?'?':fmt(calc.selected)+'m')+' / '+fmt(calc.needed)+'m':'';
   const x1=a.x+150,y1=a.y+34,x2=b.x,y2=b.y+34,mid=(x1+x2)/2,stroke=type==='dmx'?'#55b7d9':'#ed8b80';
   return '<path d="M'+x1+' '+y1+' C'+mid+' '+y1+' '+mid+' '+y2+' '+x2+' '+y2+'" stroke="'+stroke+'" stroke-width="2.4" fill="none" marker-end="url(#tech-arrow-'+type+')" />'+(label?'<text x="'+mid+'" y="'+(Math.min(y1,y2)-7)+'" text-anchor="middle" font-size="10" fill="#647581">'+E(label)+'</text>':'');
  }).join('');
  const nodesMarkup=nodes.map(o=>{const q=xy.get(o.id),patch=t.patch[o.id],pow=t.power[o.id],detail=type==='dmx'?(patch?.enabled?'U'+patch.universe+' · A'+(patch.start??'—')+' / '+(patch.channels||'?')+'ch':'DMX source'):(pow?.circuitId===g.id?'Assigned load':'Power source');
   return '<g transform="translate('+q.x+' '+q.y+')"><rect width="150" height="68" rx="9" fill="#fff" stroke="'+(o.kind==='light'?'#b8d7ca':'#dce6e5')+'" stroke-width="1.5"/><circle cx="17" cy="19" r="5" fill="'+(o.kind==='light'?'#c99654':type==='dmx'?'#4fb8d0':'#ed8b80')+'"/><text x="28" y="23" font-size="12" font-weight="700" fill="#263e41">'+E(o.name.length>18?o.name.slice(0,17)+'…':o.name)+'</text><text x="13" y="48" font-size="10" fill="#6b7b80">'+E(detail)+'</text></g>';
  }).join('');
  return '<article class="tech-graph-card"><header><strong>'+E(g.label)+'</strong><span>'+g.items.length+' assigned devices</span></header><div class="tech-graph-scroll"><svg aria-label="'+E(type+' connections for '+g.label)+'" role="img" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'"><defs><marker id="tech-arrow-'+type+'" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="'+(type==='dmx'?'#55b7d9':'#ed8b80')+'"/></marker></defs>'+edgesMarkup+nodesMarkup+'</svg></div></article>';
 }).join('');
}
function issuesPanel(e,only){
 const issues=e.issues.filter(x=>!only||x.section===only);
 if(!issues.length)return '<div class="tech-ok">No checks flagged for this section. This is not an electrical or installation approval.</div>';
 return '<div class="tech-issues">'+issues.slice(0,30).map(x=>'<div class="tech-issue tech-'+x.severity+'"><span>'+E(x.severity==='error'?'!':'i')+'</span><p><strong>'+E(x.section)+'</strong> '+E(x.message)+'</p></div>').join('')+(issues.length>30?'<p>+'+(issues.length-30)+' further findings</p>':'')+'</div>';
}
class Technical{
 constructor(p){
  this.p=p;this.tab='layout';this.t=C.ensure(p.db,p.eventId,p.plan);this.lastSig='';
  this.root=document.createElement('section');this.root.className='tech-root';this.root.id='tech-root';
  this.nav=document.createElement('div');this.nav.className='tech-tabs';this.nav.setAttribute('role','tablist');this.nav.setAttribute('aria-label','Technical planning views');
  this.content=document.createElement('div');this.content.className='tech-content panel';this.content.hidden=true;
  this.root.append(this.nav,this.content);
  p.root.querySelector('.sp-workspace').before(this.root);
  this.oldCables=p.root.querySelector('.sp-cable-panel');if(this.oldCables)this.oldCables.style.display='none';
  this.layout=p.root.querySelector('.sp-workspace');this.metrics=p.root.querySelector('#sp-summary');
  this.renderNav();this.render();
  this.nav.addEventListener('click',ev=>{const btn=ev.target.closest('[data-tech-tab]');if(btn)this.select(btn.dataset.techTab)});
  this.content.addEventListener('change',ev=>this.change(ev));
  this.content.addEventListener('click',ev=>this.click(ev));
 }
 dispose(){this.root.remove();if(this.oldCables)this.oldCables.style.display='';}
 state(){this.t=C.ensure(this.p.db,this.p.eventId,this.p.plan);return C.evaluate(this.p)}
 renderNav(){
  const e=this.state();
  this.nav.innerHTML=nav.map(([id,label])=>'<button type="button" role="tab" data-tech-tab="'+id+'" aria-selected="'+(this.tab===id)+'" class="'+(this.tab===id?'active':'')+'">'+label+'</button>').join('')+'<div class="tech-health">'+(e.counts.errors?'<span class="tech-bad">'+e.counts.errors+' issues</span>':'')+(e.counts.warnings?'<span class="tech-caution">'+e.counts.warnings+' to review</span>':'')+(!e.counts.errors&&!e.counts.warnings?'<span class="tech-green">No flagged checks</span>':'')+'</div>';
 }
 select(tab){
  if(!nav.some(([v])=>v===tab))return;this.tab=tab;
  const visible=tab==='layout';this.layout.hidden=!visible;this.metrics.hidden=!visible;this.content.hidden=visible;
  this.layout.classList.toggle('tech-layout-hidden',!visible);
  if(this.oldCables)this.oldCables.style.display='none';
  this.render();if(visible){this.p.resize();this.p.threeView?.resize();}
 }
 refresh(){this.renderNav();if(this.tab!=='layout')this.render(); }
 refreshIfOpen(){if(this.tab!=='layout')this.refresh();else this.renderNav()}
 render(){
  this.renderNav();if(this.tab==='layout')return;
  const e=this.state();
  const head='<div class="tech-heading"><div><span class="tech-overline">EVENT SYSTEMS</span><h2>'+E(nav.find(([v])=>v===this.tab)[1])+'</h2><p>Connected to '+E(this.p.event?.title||'current event')+' · '+e.items.length+' placed items · changes automatically update calculations and reports</p></div><div class="tech-heading-side">'+e.counts.errors+' critical · '+e.counts.warnings+' review</div></div>';
  const body=this.tab==='map'?this.map(e):this.tab==='patch'?this.patch(e):this.tab==='power'?this.power(e):this.tab==='cables'?this.cables(e):this.report(e);
  this.content.innerHTML=head+body;
 }
 map(e){
  return '<div class="tech-summary-grid"><div><small>DMX devices</small><strong>'+e.patchRows.length+'</strong></div><div><small>Data runs</small><strong>'+e.cables.filter(x=>x.run.type==='dmx').length+'</strong></div><div><small>Power circuits</small><strong>'+e.circuits.length+'</strong></div><div><small>Power runs</small><strong>'+e.cables.filter(x=>x.run.type==='power').length+'</strong></div></div><div class="tech-two-cols"><section><div class="tech-subhead"><h3>Data topology</h3><p>Blue connections are actual configured DMX cables, not implied links.</p></div>'+graph(this.p,e,'dmx')+'</section><section><div class="tech-subhead"><h3>Power topology</h3><p>Red connections are actual configured power cables.</p></div>'+graph(this.p,e,'power')+'</section></div><div class="tech-explainer">The topology shows mapped connections. A fixture with an address or circuit assignment but no incoming cable remains disconnected. Moving equipment in 3D recalculates mapped lengths; it does not silently reroute circuits or DMX chains.</div>'+issuesPanel(e);
 }
 patch(e){
  const choices=Array.from({length:e.t.universeCount},(_,i)=>i+1);
  const add=e.items.filter(o=>!e.t.patch[o.id]?.enabled);
  return '<div class="tech-actions"><label>Available universes <input id="tech-universe-count" type="number" min="1" max="64" value="'+e.t.universeCount+'"></label><button class="tech-primary" type="button" data-tech-action="autopatch">Auto-address unlocked fixtures</button><label>Enable DMX on another item<select id="tech-enable-device"><option value="">Choose equipment…</option>'+add.map(o=>'<option value="'+E(o.id)+'">'+E(o.name)+'</option>').join('')+'</select></label><button type="button" data-tech-action="enable-dmx">Add</button></div><div class="tech-table-wrap"><table class="tech-table"><thead><tr><th>Fixture / device</th><th>Mode (channels)</th><th>Universe</th><th>Start</th><th>End</th><th>Lock</th><th>Mapped input</th></tr></thead><tbody>'+
  e.patchRows.map(({o,p,u,ch,start,end})=>'<tr><td><strong>'+E(o.name)+'</strong><small>'+E(p.modeName||'Set mode from fixture manual')+'</small></td><td><input aria-label="Channel footprint for '+E(o.name)+'" data-tech-patch="'+E(o.id)+'" data-field="channels" type="number" min="1" max="512" value="'+(ch||'')+'" placeholder="Channels"></td><td><select data-tech-patch="'+E(o.id)+'" data-field="universe">'+choices.map(x=>'<option value="'+x+'" '+(x===u?'selected':'')+'>U'+x+'</option>').join('')+'</select></td><td><input aria-label="Start address" type="number" min="1" max="512" data-tech-patch="'+E(o.id)+'" data-field="start" value="'+(start??'')+'" placeholder="—"></td><td>'+ (end??'—')+'</td><td><input type="checkbox" aria-label="Lock '+E(o.name)+' address" data-tech-patch="'+E(o.id)+'" data-field="locked" '+(p.locked?'checked':'')+'></td><td><small>'+E(e.plan.runs.filter(r=>r.type==='dmx'&&r.to===o.id).map(r=>e.items.find(x=>x.id===r.from)?.name||'?').join(', ')||'Not connected')+'</small></td></tr>').join('')+
  '</tbody></table></div><p class="tech-footnote">DMX addressing uses up to 512 slots per universe. Enter the channel footprint of the selected, verified device mode. Auto-addressing leaves locked valid addresses in place; all changes must also be reflected in your actual console/fixture configuration.</p>'+issuesPanel(e,'DMX');
 }
 power(e){
  const choices='<option value="">Unassigned</option>'+e.t.circuits.map(c=>'<option value="'+E(c.id)+'">'+E(c.name)+'</option>').join('');
  return '<div class="tech-subhead"><h3>Circuit limits</h3><p>Configurable planning thresholds. Validate supply, protection, power factor and installation separately with a competent person.</p></div><div class="tech-circuit-grid">'+e.circuits.map(({c,assigned,load,watts,unknown})=>'<div class="tech-circuit"><div><strong>'+E(c.name)+'</strong><span class="tech-circuit-load">'+fmt(load,2)+' A</span></div><div class="tech-bar"><span style="width:'+Math.min(100,Math.max(0,load/Math.max(1,N(c.limitAmps,10))*100))+'%"></span></div><small>'+assigned.length+' loads · '+watts+' W nominal · '+(unknown?'missing current values':'estimated unless amps overridden')+'</small><div class="tech-circuit-edit"><label>Voltage (V)<input type="number" min="1" max="1000" data-tech-circuit="'+E(c.id)+'" data-field="voltage" value="'+E(c.voltage)+'"></label><label>Limit (A)<input type="number" min="0.1" max="1000" step=".1" data-tech-circuit="'+E(c.id)+'" data-field="limitAmps" value="'+E(c.limitAmps)+'"></label><label>Warning %<input type="number" min="1" max="100" data-tech-circuit="'+E(c.id)+'" data-field="warningPercent" value="'+E(c.warningPercent)+'"></label></div></div>').join('')+'</div><div class="tech-actions"><button type="button" data-tech-action="add-circuit">+ Add circuit</button></div><div class="tech-table-wrap"><table class="tech-table"><thead><tr><th>Placed equipment</th><th>Included</th><th>Watts from layout</th><th>Circuit</th><th>Rated current override (A)</th></tr></thead><tbody>'+e.items.map(o=>{const a=e.t.power[o.id]||{};return '<tr><td><strong>'+E(o.name)+'</strong><small>'+E(o.kind)+'</small></td><td><input type="checkbox" data-tech-power="'+E(o.id)+'" data-field="enabled" '+(a.enabled?'checked':'')+'></td><td>'+E(o.watts??0)+' W</td><td><select data-tech-power="'+E(o.id)+'" data-field="circuitId"><option value="">Unassigned</option>'+e.t.circuits.map(c=>'<option value="'+E(c.id)+'" '+(a.circuitId===c.id?'selected':'')+'>'+E(c.name)+'</option>').join('')+'</select></td><td><input type="number" step=".01" min="0" data-tech-power="'+E(o.id)+'" data-field="currentOverride" value="'+(a.currentOverride??'')+'" placeholder="Use W / V estimate"></td></tr>'}).join('')+'</tbody></table></div><p class="tech-footnote">When rated current is not provided, A ≈ W / V is only a preliminary estimate, particularly where power factor and device characteristics are unknown. Limits here are user-entered checks, never electrical certification.</p>'+issuesPanel(e,'Power');
 }
 cables(e){
  const itemOpts=e.items.map(o=>'<option value="'+E(o.id)+'">'+E(o.name)+'</option>').join('');
  const runs=e.cables;
  return '<div class="tech-subhead"><h3>Add a physical cable connection</h3><p>Connections are drawn in the 3D scene and reused in the technical schematic and install pack.</p></div><div class="tech-cable-builder"><label>From<select id="tech-new-from">'+itemOpts+'</select></label><label>To<select id="tech-new-to">'+itemOpts+'</select></label><label>System<select id="tech-new-kind">'+C.TYPES.map(s=>'<option value="'+s+'">'+T(s)+'</option>').join('')+'</select></label><label>Connector<select id="tech-new-connector">'+options(CONNECTORS.dmx,'')+'</select></label><label>Cable length (m)<select id="tech-new-length"><option value="">Unassigned</option>'+options(DEFAULT_LENGTHS,'')+'</select></label><label>Slack (%)<input id="tech-new-slack" type="number" min="0" max="100" value="15"></label><button class="tech-primary" data-tech-action="add-cable" type="button">Add cable</button></div><div class="tech-table-wrap"><table class="tech-table"><thead><tr><th>ID / system</th><th>From → To</th><th>Estimated</th><th>Allocated</th><th>Connector</th><th>Direct / piggyback</th><th>Supplier</th><th>Status</th><th></th></tr></thead><tbody>'+
  runs.map(({run,src,dest,needed,selected,short})=>'<tr><td><input class="tech-id-input" data-tech-run="'+E(run.id)+'" data-field="cableId" value="'+E(run.cableId||run.id)+'"><small>'+T(run.type)+'</small></td><td><strong>'+E(src.name)+'</strong><small>→ '+E(dest.name)+'</small></td><td>'+fmt(needed)+' m</td><td><input type="number" min="0" step=".5" data-tech-run="'+E(run.id)+'" data-field="cableLength" value="'+(selected??'')+'" placeholder="m"></td><td><select data-tech-run="'+E(run.id)+'" data-field="connector">'+options(CONNECTORS[run.type]||[''],run.connector||'')+'</select></td><td><select data-tech-run="'+E(run.id)+'" data-field="linkType">'+options(['Direct','Piggyback'],run.linkType||'Direct')+'</select></td><td><input data-tech-run="'+E(run.id)+'" data-field="supplier" value="'+E(run.supplier||'')+'" placeholder="Optional"></td><td>'+badge(short?'error':selected===null?'warning':'ok')+'</td><td><button type="button" class="tech-delete" data-tech-action="delete-run" data-id="'+E(run.id)+'" aria-label="Remove cable">×</button></td></tr>').join('')+
  '</tbody></table></div><details class="tech-advanced"><summary>Advanced cable limits and connector checks</summary><div class="tech-table-wrap"><table class="tech-table"><thead><tr><th>Cable</th><th>Maximum route (m)</th><th>Slack %</th><th>Source output</th><th>Target input</th><th>Power links (from source)</th></tr></thead><tbody>'+runs.map(({run,src,dest})=>'<tr><td>'+E(run.cableId||run.id)+'</td><td><input type="number" min="0" step=".5" data-tech-run="'+E(run.id)+'" data-field="maxRunMeters" value="'+(run.maxRunMeters??'')+'" placeholder="Unspecified"></td><td><input type="number" min="0" max="100" data-tech-run="'+E(run.id)+'" data-field="slack" value="'+E(run.slack??15)+'"></td><td><input data-tech-spec="'+E(src.id)+'" data-field="'+(run.type==='power'?'powerOut':'dmxOut')+'" value="'+E(e.t.deviceSpecs[src.id]?.[run.type==='power'?'powerOut':'dmxOut']||'')+'" placeholder="Connector"></td><td><input data-tech-spec="'+E(dest.id)+'" data-field="'+(run.type==='power'?'powerIn':'dmxIn')+'" value="'+E(e.t.deviceSpecs[dest.id]?.[run.type==='power'?'powerIn':'dmxIn']||'')+'" placeholder="Connector"></td><td><input type="number" min="0" data-tech-spec="'+E(src.id)+'" data-field="maxPowerLinks" value="'+(e.t.deviceSpecs[src.id]?.maxPowerLinks??'')+'" placeholder="Unknown"></td></tr>').join('')+'</tbody></table></div></details><p class="tech-footnote">Length estimates follow the existing venue-footprint route plus vertical drops and slack. They do not account for interior obstructions, cable trays, safety offsets, or detailed installation waypoints. Verify on site.</p>'+issuesPanel(e,'Cables');
 }
 report(e){
  const event=this.p.event;
  return '<div class="tech-report-head"><div><strong>'+E(event?.title||'Event')+'</strong><p>'+E(event?.venue||'Venue')+' · '+E(event?.date||'')+' · '+e.items.length+' placed items · '+e.cables.length+' mapped runs</p></div><div><button type="button" class="tech-primary" data-tech-action="print">Open printable install pack</button><button type="button" data-tech-action="csv">Export schedule CSV</button></div></div><div class="tech-report-callout"><strong>Installation readiness:</strong> '+e.counts.errors+' critical issues and '+e.counts.warnings+' items to review. Reports are always generated from the current layout, patch, circuits and physical connections. Reprint after changes.</div><div class="tech-report-grid"><article><h3>DMX patch</h3><div class="tech-table-wrap">'+this.patchTable(e)+'</div></article><article><h3>Power circuits</h3><div class="tech-table-wrap">'+this.powerTable(e)+'</div></article></div><section><h3>Cable installation checklist</h3>'+ (e.cables.length?'<div class="tech-checklist">'+e.cables.map(x=>'<label><input type="checkbox" data-tech-installed="'+E(x.run.id)+'" '+(e.t.installed[x.run.id]?'checked':'')+'><span><strong>'+E(x.run.cableId||x.run.id)+'</strong> · '+E(T(x.run.type))+' · '+E(x.src.name)+' → '+E(x.dest.name)+'</span><small>'+(x.selected??'—')+'m allocated · '+fmt(x.needed)+'m estimated</small></label>').join('')+'</div>':'<div class="tech-empty">No mapped cables yet.</div>')+'</section><section><h3>Issues requiring review</h3>'+issuesPanel(e)+'</section><div class="tech-explainer">These instructions are planning documents. Crew must check the actual equipment labels, venue routes, connectors, electrical supply, circuit protection, environmental suitability and rigging approvals before use.</div>';
 }
 patchTable(e){return '<table class="tech-table"><thead><tr><th>Fixture</th><th>Universe</th><th>Address</th><th>Mode</th></tr></thead><tbody>'+e.patchRows.map(({o,p,u,start,end,ch})=>'<tr><td>'+E(o.name)+'</td><td>U'+u+'</td><td>'+(start??'—')+'–'+(end??'—')+'</td><td>'+(ch||'—')+'ch</td></tr>').join('')+'</tbody></table>'}
 powerTable(e){return '<table class="tech-table"><thead><tr><th>Circuit</th><th>Estimated current</th><th>Devices</th></tr></thead><tbody>'+e.circuits.map(v=>'<tr><td>'+E(v.c.name)+'</td><td>'+fmt(v.load,2)+' A / '+E(v.c.limitAmps)+' A</td><td>'+v.assigned.length+'</td></tr>').join('')+'</tbody></table>'}
 change(ev){
  const target=ev.target,field=target.dataset.field;
  if(target.id==='tech-universe-count')this.t.universeCount=C.clamp(Math.round(N(target.value,6)),1,64);
  else if(target.id==='tech-new-kind'){const sel=this.content.querySelector('#tech-new-connector');if(sel)sel.innerHTML=options(CONNECTORS[target.value]||[''],'');return}
  else if(target.dataset.techPatch){const a=this.t.patch[target.dataset.techPatch];if(!a)return;
   if(field==='locked')a.locked=target.checked;
   else if(field==='start'||field==='channels'){a[field]=target.value===''?null:Math.round(N(target.value));}
   else if(field==='universe')a.universe=Math.round(N(target.value,1));
  }else if(target.dataset.techPower){const a=this.t.power[target.dataset.techPower];if(!a)return;
   if(field==='enabled')a.enabled=target.checked;
   else if(field==='currentOverride')a.currentOverride=target.value===''?null:N(target.value);
   else a[field]=target.value;
  }else if(target.dataset.techCircuit){const c=this.t.circuits.find(v=>v.id===target.dataset.techCircuit);if(!c)return;c[field]=N(target.value);}
  else if(target.dataset.techRun){const r=this.p.plan.runs.find(v=>v.id===target.dataset.techRun);if(!r)return;
   if(['cableLength','maxRunMeters'].includes(field))r[field]=target.value===''?null:N(target.value);
   else if(field==='slack')r.slack=C.clamp(N(target.value),0,100);
   else r[field]=target.value;
  }else if(target.dataset.techSpec){this.t.deviceSpecs[target.dataset.techSpec][field]=field==='maxPowerLinks'?(target.value===''?null:N(target.value)):target.value;}
  else if(target.dataset.techInstalled){this.t.installed[target.dataset.techInstalled]=target.checked;}
  else return;
  this.persist();
 }
 click(ev){
  const action=ev.target.closest('[data-tech-action]')?.dataset.techAction;if(!action)return;
  if(action==='autopatch'){const failed=C.autoPatch(this.p.plan,this.t);this.persist();if(failed.length)this.p.notify?.(failed.join('; '));return}
  if(action==='add-circuit'){const id=ID('circ');this.t.circuits.push({id,name:'Circuit '+String(this.t.circuits.length+1).padStart(2,'0'),voltage:230,limitAmps:10,warningPercent:80});this.persist();return}
  if(action==='enable-dmx'){const id=this.content.querySelector('#tech-enable-device')?.value;if(id&&this.t.patch[id]){this.t.patch[id].enabled=true;this.persist()}return}
  if(action==='add-cable'){
    const get=id=>this.content.querySelector(id)?.value;
    const from=get('#tech-new-from'),to=get('#tech-new-to'),kind=get('#tech-new-kind');
    if(!from||!to||from===to){this.p.notify?.('Select two different devices to connect.');return;}
    const run={id:ID('run'),cableId:'CBL-'+String(this.p.plan.runs.length+1).padStart(3,'0'),from,to,type:kind,connector:get('#tech-new-connector')||'',cableLength:get('#tech-new-length')===''?null:N(get('#tech-new-length')),slack:C.clamp(N(get('#tech-new-slack'),15),0,100),linkType:'Direct',supplier:''};
    this.p.plan.runs.push(run);this.persist();return;
  }
  if(action==='delete-run'){const id=ev.target.closest('[data-id]')?.dataset.id;this.p.plan.runs=this.p.plan.runs.filter(r=>r.id!==id);delete this.t.installed[id];this.persist();return}
  if(action==='print'){this.printReport();return}
  if(action==='csv'){this.downloadCsv();return}
 }
 persist(){
  this.t.revision=N(this.t.revision,0)+1;
  this.p.save();this.p.updateRoutes();this.p.updateSummary();this.p.draw();this.render();
 }
 printReport(){
  const e=this.state(),ev=this.p.event;
  const css='@page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#243738;margin:22px;font-size:11px}h1{margin-bottom:5px;font-size:23px}h2{margin-top:24px;font-size:15px;border-bottom:1px solid #d5e0db;padding-bottom:6px}p{color:#60716d}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{padding:7px;text-align:left;border-bottom:1px solid #dce5e0}th{background:#edf4f0;color:#315950}tr{break-inside:avoid}.warn{padding:8px;background:#fff3df;border-left:3px solid #d08a39;margin:5px 0}.err{background:#fcece9;border-color:#b74b47}.meta{font-size:10px;color:#76857f}.checks{font-size:15px}.tech-graph-card{border:1px solid #dde8e2;border-radius:9px;margin:9px 0;padding:6px;break-inside:avoid}.tech-graph-card header{display:flex;gap:12px;font-size:12px;color:#315950}.tech-graph-card header span{font-size:10px;color:#73857d}.tech-graph-scroll{overflow:visible}.tech-graph-scroll svg{width:100%;height:auto;max-height:190px}.map-stack{display:grid;grid-template-columns:1fr 1fr;gap:12px}.map-stack>section{min-width:0}';
  const section=(header,rows)=>'<h2>'+header+'</h2><table><thead><tr>'+rows[0].map(x=>'<th>'+E(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(1).map(r=>'<tr>'+r.map(x=>'<td>'+E(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  let html='<!doctype html><html><head><meta charset="utf-8"><title>'+E(ev?.title||'Event')+' · Install pack</title><style>'+css+'</style></head><body><h1>'+E(ev?.title||'Event')+' · Installation pack</h1><p>'+E(ev?.venue||'Venue')+' · '+E(ev?.date||'')+' · Generated '+E(new Date().toLocaleString())+'</p><p class="meta">PRELIMINARY INSTALLATION PLAN · NOT ELECTRICAL OR RIGGING CERTIFICATION</p>';
  html+='<h2>Readiness: '+e.counts.errors+' critical issues · '+e.counts.warnings+' review items</h2>'+e.issues.map(v=>'<p class="warn '+(v.severity==='error'?'err':'')+'">'+E(v.severity.toUpperCase()+' · '+v.section+' · '+v.message)+'</p>').join('');
  html+=section('Equipment and DMX patch',[['Fixture / location','Universe','Address range','Mode','Circuit'],...e.patchRows.map(v=>[v.o.name+' · '+fmt(v.o.x)+' / '+fmt(v.o.y)+' / '+fmt(v.o.z)+'m','U'+v.u,(v.start??'—')+'–'+(v.end??'—'),(v.ch||'?')+'ch',e.t.circuits.find(c=>c.id===e.t.power[v.o.id]?.circuitId)?.name||'Unassigned'])]);
  html+=section('Power allocation',[['Circuit','Voltage','Planning limit','Estimated current','Assigned equipment'],...e.circuits.map(v=>[v.c.name,v.c.voltage+' V',v.c.limitAmps+' A',fmt(v.load,2)+' A',v.assigned.map(x=>x.name).join(', ')])]);
  html+=section('Physical cable schedule',[['Done','Cable ID','Type','From','To','Connector','Length allocated','Length estimated','Supplier / note'],...e.cables.map(v=>[e.t.installed[v.run.id]?'☑':'☐',v.run.cableId||v.run.id,T(v.run.type),v.src.name,v.dest.name,v.run.connector||'Verify',v.selected==null?'Unassigned':fmt(v.selected)+' m',fmt(v.needed)+' m',v.run.supplier||''])]);
  html+='<h2>Power + data connection maps</h2><p>Diagrams show explicitly mapped cable connections. Unmapped devices require checking before installation.</p><div class="map-stack"><section><h3>DMX / data</h3>'+graph(this.p,e,'dmx')+'</section><section><h3>Power distribution</h3>'+graph(this.p,e,'power')+'</section></div>';
  html+='<h2>On-site checks</h2><p>☐ Verify venue geometry, mounting points and cable routes</p><p>☐ Confirm DMX modes, patch, connector adaptors and signal continuity</p><p>☐ Confirm actual electrical supply, protection, link ratings and circuit suitability</p><p>☐ Test each fixture and record corrections before energising the rig</p><p class="meta">Printed from Phaenomenon. Update and reprint after equipment, routing or patch changes.</p></body></html>';
  const win=window.open('','_blank');if(!win){this.p.notify?.('Allow pop-ups to open the installation print preview.');return}
  win.document.open();win.document.write(html);win.document.close();win.focus();
 }
 downloadCsv(){
  const e=this.state(),rows=[['Record','ID','From / fixture','To','Universe / circuit','Address / type','Cable allocated (m)','Cable required (m)','Notes']];
  for(const v of e.patchRows)rows.push(['Fixture',v.o.id,v.o.name,'','U'+v.u,(v.start??'—')+'-'+(v.end??'—'),'','',v.ch+' channels']);
  for(const v of e.cables)rows.push(['Cable',v.run.cableId||v.run.id,v.src.name,v.dest.name,'',T(v.run.type),v.selected??'',fmt(v.needed),[v.run.connector,v.run.linkType,v.run.supplier].filter(Boolean).join(' | ')]);
  for(const v of e.circuits)rows.push(['Circuit',v.c.id,v.c.name,'',v.c.voltage+' V',fmt(v.load,2)+' A / '+v.c.limitAmps+' A','','',v.assigned.map(x=>x.name).join('; ')]);
  const quote=v=>'"'+String(v??'').replace(/"/g,'""').replace(/^[=+\-@]/,'\x27$&')+'"';
  const csv='\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='phaenomenon-'+String(this.p.event?.title||'event').toLowerCase().replace(/[^a-z0-9-]+/g,'-')+'-install-schedule.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
}
function attach(p){return new Technical(p)}
window.PhaenomenonTechnical={attach};
})();