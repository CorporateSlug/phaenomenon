(function spacePlannerModule() {
  'use strict';
  const E = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=(v,d=0)=>Number.isFinite(+v)?+v:d;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const newid=p=>p+Math.random().toString(36).slice(2,9);
  const kinds={light:['Lighting fixture','#f0b765'],audio:['Speaker / audio','#a99bdf'],power:['Power source','#f09b67'],network:['Network point','#63c9d0'],control:['Lighting control','#c6a8ee'],rigging:['Truss / stand','#8eacb5'],stage:['Stage','#8fa9a0'],other:['Other','#adbebc']};
  const cableTypes={power:['Power','#eea368'],network:['Ethernet / network','#61c7d0'],dmx:['DMX','#b7a2ed'],audio:['Audio','#89b7f3']};
  const style=document.createElement('style');
  style.textContent=`
  .sp-wrap{color:#32484b}.sp-card{background:#fff;border:1px solid #e4ebea;border-radius:13px;padding:18px;margin:0 0 16px;min-width:0}
  .sp-grid{display:grid;grid-template-columns:minmax(0,1fr) 285px;gap:16px}.sp-row{display:flex;flex-wrap:wrap;gap:10px;align-items:end}
  .sp-flex{flex:1;min-width:140px}.sp-wrap label{font:600 11px system-ui;color:#607579;display:grid;gap:6px}
  .sp-wrap input,.sp-wrap select{padding:10px;border:1px solid #dce5e3;border-radius:8px;background:#fff;width:100%;min-width:0;color:#344b4e}
  .sp-wrap button{border:1px solid #dbe5e2;background:#f6faf9;border-radius:8px;padding:9px 12px;color:#344b4e;cursor:pointer;font:600 11px system-ui}
  .sp-wrap button:hover{background:#e5f1ee}.sp-wrap button.sp-primary{background:#315c55;color:white;border-color:#315c55}
  .sp-wrap h3{font-size:14px;color:#385157;margin:0 0 10px}.sp-wrap p{font-size:11px;line-height:1.6;color:#7c9296}
  .sp-stage{position:relative;background:#182a30;border-radius:10px;overflow:hidden;height:460px}.sp-stage canvas{width:100%;height:100%;display:block;touch-action:none;cursor:grab}
  .sp-label{font-size:10px;color:#9eb5bb;position:absolute;bottom:12px;left:14px;pointer-events:none}
  .sp-tools{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0 5px}.sp-tools button{display:flex;align-items:center;gap:7px}
  .sp-tools b{width:8px;height:8px;border-radius:3px;display:inline-block}
  .sp-side{display:grid;gap:12px;align-content:start}.sp-selected{padding:12px;background:#f6f9f8;border-radius:9px}
  .sp-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .sp-items{max-height:220px;overflow:auto}.sp-item{display:flex;width:100%;justify-content:space-between;gap:8px;text-align:left;margin:3px 0}
  .sp-item.active{background:#e1f1ec;border-color:#9bc4b6}.sp-item span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sp-cables{display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) 86px auto;gap:9px;align-items:end;margin:14px 0}
  .sp-runs{overflow:auto}.sp-runs table{width:100%;border-collapse:collapse;font-size:11px;min-width:570px}.sp-runs td,.sp-runs th{padding:9px 8px;text-align:left;border-bottom:1px solid #e8eeec}
  .sp-stats{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.sp-stat{background:#f1f8f5;border-radius:8px;padding:10px;font-size:10px;color:#4e6a67}
  .sp-stat strong{display:block;font-size:17px;color:#2b5852;margin-top:5px}
  .sp-note{background:#fffbf4;border:1px solid #ebdfc7;border-radius:8px;padding:12px;color:#897655;font-size:11px;line-height:1.6}
  @media(max-width:1050px){.sp-grid{grid-template-columns:1fr}.sp-cables{grid-template-columns:repeat(2,minmax(0,1fr))}.sp-cables>button{justify-self:start}}
  @media(max-width:600px){.sp-card{padding:12px}.sp-stage{height:350px}.sp-row>*{min-width:100px}.sp-cables{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);
  function ensure(db){
    if(!Array.isArray(db.venues))db.venues=[
      {id:'venue-demo-1',name:'Harbour Hall (demo)',width:20,length:14,height:5},
      {id:'venue-demo-2',name:'Warehouse (demo)',width:25,length:17,height:7}
    ];
    if(!db.venuePlans||typeof db.venuePlans!=='object')db.venuePlans={};
    if(db.eventJobs?.length && !db.venuePlans[db.eventJobs[0].id]){
      db.venuePlans[db.eventJobs[0].id]={venueId:db.venues[0].id,items:[
        {id:'obj-a',name:'Lighting control',kind:'control',x:8,y:2,z:0,watts:80,eqId:''},
        {id:'obj-b',name:'LED wash left',kind:'light',x:5,y:10,z:3,watts:160,eqId:''},
        {id:'obj-c',name:'LED wash right',kind:'light',x:15,y:10,z:3,watts:160,eqId:''},
        {id:'obj-d',name:'Power distribution',kind:'power',x:2,y:11,z:0,watts:0,eqId:''},
        {id:'obj-e',name:'Network port',kind:'network',x:3,y:2,z:0,watts:0,eqId:''}
      ],runs:[{id:'run-a',from:'obj-d',to:'obj-b',type:'power',slack:15},{id:'run-b',from:'obj-d',to:'obj-c',type:'power',slack:15},{id:'run-c',from:'obj-a',to:'obj-b',type:'dmx',slack:15}]};
    }
  }
  function mount(root,db,save,flash,startEvent){
    if(!root)return;ensure(db);
    let eventId=db.eventJobs?.some(e=>e.id===startEvent)?startEvent:db.eventJobs?.[0]?.id;
    if(!eventId){root.innerHTML='<div class="sp-card">Create an event first to plan its layout.</div>';return;}
    let chosen=null,top=false,zoom=1,yaw=-Math.PI/4,canvas,ctx,hits=[],drag=null;
    const event=()=>db.eventJobs.find(e=>e.id===eventId);
    const plan=()=>{if(!db.venuePlans[eventId])db.venuePlans[eventId]={venueId:db.venues[0].id,items:[],runs:[]};return db.venuePlans[eventId];};
    const venue=()=>db.venues.find(v=>v.id===plan().venueId)||db.venues[0];
    const item=id=>plan().items.find(i=>i.id===id);
    const persist=()=>{save();};
    const options=(list,selected)=>list.map(([id,name])=>`<option value="${E(id)}" ${id===selected?'selected':''}>${E(name)}</option>`).join('');
    function summary(){
      const route=plan().runs.reduce((acc,r)=>{acc[r.type]=(acc[r.type]||0)+distance(r);return acc;},{});
      root.querySelector('#sp-summary').innerHTML='<span class="sp-stat">Items<strong>'+plan().items.length+'</strong></span>'+Object.entries(cableTypes).map(([type,[name]])=>'<span class="sp-stat">'+E(name)+' cable<strong>'+Math.ceil(route[type]||0)+'m</strong></span>').join('');
    }
    function distance(r){const a=item(r.from),b=item(r.to);return a&&b?(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.z-b.z))*(1+clamp(num(r.slack,15),0,100)/100):0;}
    function field(label,key,val,min,max){return `<label>${label}<input data-edit="${key}" type="number" step="0.1" min="${min}" max="${max}" value="${E(val)}"></label>`;}
    function draw(){
      if(!canvas)return;const dpr=window.devicePixelRatio||1;const rect=canvas.getBoundingClientRect();
      canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
      const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);
      const v=venue(),span=top?Math.max(v.width,v.length):v.width+v.length;
      const s=Math.min(w*.78/span,h*.69/(top?span:span*.42+v.height*.85))*zoom;
      const px=(x,y,z=0)=>{
        const xx=x-v.width/2,yy=y-v.length/2;
        if(top)return {x:w/2+xx*s,y:h/2+yy*s};
        const u=xx*Math.cos(yaw)-yy*Math.sin(yaw),vv=xx*Math.sin(yaw)+yy*Math.cos(yaw);
        return {x:w/2+u*s,y:h*.58+vv*s*.48-z*s*.80};
      };
      function poly(coords,fill,stroke){ctx.beginPath();coords.forEach((p,i)=>{if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.stroke();}
      const f=[[0,0],[v.width,0],[v.width,v.length],[0,v.length]].map(([x,y])=>px(x,y));
      poly(f,'#294349','#52716f');
      if(!top){for(let k=0;k<4;k++){let [a,b]=[[0,0],[v.width,0],[v.width,v.length],[0,v.length]][k];const p=px(a,b),q=px(a,b,v.height);ctx.strokeStyle='#547b83';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}
      ctx.strokeStyle='#3d5960';ctx.lineWidth=.7;
      for(let x=1;x<v.width;x++){let a=px(x,0),b=px(x,v.length);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      for(let y=1;y<v.length;y++){let a=px(0,y),b=px(v.width,y);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      for(const r of plan().runs){const a=item(r.from),b=item(r.to);if(!a||!b)continue;const p=px(a.x,a.y,a.z),q=px(b.x,b.y,b.z);ctx.strokeStyle=cableTypes[r.type]?.[1]||'#ddd';ctx.lineWidth=2;ctx.setLineDash([7,4]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.setLineDash([]);}
      hits=[];
      for(const o of [...plan().items].sort((a,b)=>(a.y+a.x)-(b.y+b.x))){const p=px(o.x,o.y,o.z);hits.push({id:o.id,p});const c=kinds[o.kind]?.[1]||'#aaa';
        ctx.fillStyle=c;ctx.strokeStyle=chosen===o.id?'#fff':'#243c41';ctx.lineWidth=chosen===o.id?3:2;ctx.beginPath();ctx.arc(p.x,p.y,chosen===o.id?12:9,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillStyle='#eff9f6';ctx.fillText(o.name,p.x,p.y-17);
        if(o.z>0&&!top){const q=px(o.x,o.y,0);ctx.strokeStyle='#b6d3d07a';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
      }
      ctx.font='12px system-ui';ctx.fillStyle='#b7d1d1';ctx.textAlign='left';ctx.fillText(v.width+'m × '+v.length+'m  ·  height '+v.height+'m',15,22);
    }
    function inspector(){
      const o=item(chosen);
      root.querySelector('#sp-inspector').innerHTML=!o?'<p>Click a placed item to edit its name, position, mounting height or inventory link.</p>':
      `<div class="sp-selected"><label>Item name<input data-edit="name" value="${E(o.name)}"></label><div class="sp-cols">${field('X (m)','x',o.x,0,venue().width)}${field('Y (m)','y',o.y,0,venue().length)}${field('Height (m)','z',o.z,0,venue().height)}${field('Power (W)','watts',o.watts||0,0,100000)}</div><label>Inventory item<select data-edit="eqId"><option value="">Unlinked</option>${options((db.equipment||[]).map(g=>[g.id,g.name]),o.eqId||'')}</select></label><div class="sp-row"><button data-action="duplicate">Duplicate</button><button data-action="delete">Remove</button></div></div>`;
      root.querySelector('#sp-item-list').innerHTML=plan().items.map(i=>`<button class="sp-item ${chosen===i.id?'active':''}" data-select="${E(i.id)}"><span>${E(i.name)}</span><span>${i.x.toFixed(1)}, ${i.y.toFixed(1)}</span></button>`).join('')||'<p>No equipment placed yet.</p>';
    }
    function routes(){
      const els=plan().items.map(i=>[i.id,i.name]),selA=root.querySelector('#sp-from'),selB=root.querySelector('#sp-to');
      if(selA){const a=selA.value,b=selB.value;selA.innerHTML=options(els,a);selB.innerHTML=options(els,b);if(!b&&els.length>1)selB.value=els[1][0];}
      root.querySelector('#sp-routes').innerHTML=plan().runs.length?'<table><tr><th>Connection</th><th>Type</th><th>Est. length</th><th></th></tr>'+plan().runs.map(r=>`<tr><td>${E(item(r.from)?.name||'?')} → ${E(item(r.to)?.name||'?')}</td><td>${E(cableTypes[r.type]?.[0]||r.type)}</td><td>${distance(r).toFixed(1)}m</td><td><button data-remove="${E(r.id)}">×</button></td></tr>`).join('')+'</table>':'<p>Add cable routes between placed equipment.</p>';
    }
    function refresh(){inspector();routes();summary();draw();}
    function build(){
      const v=venue();
      root.innerHTML=`<div class="sp-wrap"><div class="sp-card"><div class="sp-row"><label class="sp-flex">Event<select id="sp-event">${options(db.eventJobs.map(e=>[e.id,e.title]),eventId)}</select></label><label class="sp-flex">Venue<select id="sp-venue">${options(db.venues.map(v=>[v.id,v.name]),v.id)}</select></label><label>Width (m)<input id="sp-width" type="number" min="2" max="200" value="${v.width}"></label><label>Length (m)<input id="sp-length" type="number" min="2" max="200" value="${v.length}"></label><label>Height (m)<input id="sp-height" type="number" min="2" max="30" value="${v.height}"></label><button id="sp-save-dims" class="sp-primary">Save dimensions</button><button id="sp-new-venue">New venue</button></div><p>Venue dimensions are reusable; equipment positions and cable routes belong to the selected event.</p><div id="sp-new-form" class="sp-row" hidden><label>Name<input id="sp-new-name" placeholder="Venue name"></label><label>Width<input id="sp-new-width" type="number" value="15"></label><label>Length<input id="sp-new-length" type="number" value="10"></label><label>Height<input id="sp-new-height" type="number" value="4"></label><button id="sp-create-venue" class="sp-primary">Create venue</button></div></div>
      <div id="sp-summary" class="sp-stats"></div><div class="sp-grid">
      <div class="sp-card"><div class="sp-row" style="justify-content:space-between"><h3>Interactive venue layout</h3><div class="sp-row"><button id="sp-three" class="sp-primary">3D view</button><button id="sp-top">Top view</button><button id="sp-rotate">Rotate</button><button id="sp-zoom-in">+</button><button id="sp-zoom-out">−</button></div></div><div class="sp-stage"><canvas id="sp-canvas"></canvas><span class="sp-label">Drag objects to reposition · Estimated geometry</span></div><h3 style="margin-top:16px">Add equipment</h3><div class="sp-tools">${Object.entries(kinds).map(([id,[name,color]])=>`<button data-add="${id}"><b style="background:${color}"></b>${E(name)}</button>`).join('')}</div></div>
      <div class="sp-card"><h3>Equipment inspector</h3><div id="sp-inspector"></div><h3 style="margin-top:18px">Placed objects</h3><div class="sp-items" id="sp-item-list"></div><button id="sp-sync" class="sp-primary" style="margin-top:12px">Copy linked equipment into event kit</button><p>Review quantities and availability before issuing a quote.</p></div></div>
      <div class="sp-card"><h3>Power, network and control cables</h3><p>Assign approximate routes between equipment. Estimates use an orthogonal path plus slack, not measured on-site routing.</p><div class="sp-cables"><label>From<select id="sp-from"></select></label><label>To<select id="sp-to"></select></label><label>Cable type<select id="sp-type">${options(Object.entries(cableTypes).map(([id,[name]])=>[id,name]),'power')}</select></label><label>Slack %<input id="sp-slack" type="number" min="0" max="100" value="15"></label><button id="sp-add-route" class="sp-primary">Add cable</button></div><div id="sp-routes" class="sp-runs"></div><div class="sp-note" style="margin-top:15px">Indicative design aid only. Power loading, connector ratings, cable ratings, voltage drop, networking capacity, rigging and electrical compliance require qualified review.</div></div></div>`;
      canvas=root.querySelector('#sp-canvas');
      root.querySelector('#sp-event').onchange=e=>{eventId=e.target.value;chosen=null;plan();build();};
      root.querySelector('#sp-venue').onchange=e=>{plan().venueId=e.target.value;chosen=null;persist();build();};
      root.querySelector('#sp-save-dims').onclick=()=>{const w=num(root.querySelector('#sp-width').value),l=num(root.querySelector('#sp-length').value),h=num(root.querySelector('#sp-height').value);if(w<2||l<2||h<2){alert('Dimensions must be at least 2m.');return;}Object.assign(v,{width:clamp(w,2,200),length:clamp(l,2,200),height:clamp(h,2,30)});persist();refresh();};
      root.querySelector('#sp-new-venue').onclick=()=>root.querySelector('#sp-new-form').hidden=false;
      root.querySelector('#sp-create-venue').onclick=()=>{const name=root.querySelector('#sp-new-name').value.trim();if(!name){alert('Enter a venue name.');return;}const nv={id:newid('ven-'),name,width:clamp(num(root.querySelector('#sp-new-width').value,15),2,200),length:clamp(num(root.querySelector('#sp-new-length').value,10),2,200),height:clamp(num(root.querySelector('#sp-new-height').value,4),2,30)};db.venues.push(nv);plan().venueId=nv.id;persist();build();};
      root.querySelector('#sp-three').onclick=()=>{top=false;root.querySelector('#sp-three').classList.add('sp-primary');root.querySelector('#sp-top').classList.remove('sp-primary');draw();};
      root.querySelector('#sp-top').onclick=()=>{top=true;root.querySelector('#sp-top').classList.add('sp-primary');root.querySelector('#sp-three').classList.remove('sp-primary');draw();};
      root.querySelector('#sp-rotate').onclick=()=>{yaw+=.3;draw();};
      root.querySelector('#sp-zoom-in').onclick=()=>{zoom=clamp(zoom*1.2,.5,2.8);draw();};
      root.querySelector('#sp-zoom-out').onclick=()=>{zoom=clamp(zoom/1.2,.5,2.8);draw();};
      root.querySelector('#sp-add-route').onclick=()=>{const from=root.querySelector('#sp-from').value,to=root.querySelector('#sp-to').value;if(!from||!to||from===to){alert('Choose two different placed objects.');return;}plan().runs.push({id:newid('run-'),from,to,type:root.querySelector('#sp-type').value,slack:clamp(num(root.querySelector('#sp-slack').value,15),0,100)});persist();refresh();};
      root.querySelector('#sp-sync').onclick=()=>{const counts={};plan().items.forEach(o=>{if(o.eqId)counts[o.eqId]=(counts[o.eqId]||0)+1;});if(!Object.keys(counts).length){flash('Link placed equipment to the inventory first.');return;}event().kit=Object.entries(counts).map(([id,qty])=>({id,qty}));persist();flash('Event kit updated. Review the equipment list.');};
      root.addEventListener('click',click);
      root.addEventListener('change',change);
      canvas.addEventListener('pointerdown',pointerDown);
      canvas.addEventListener('pointermove',pointerMove);
      canvas.addEventListener('pointerup',pointerUp);
      canvas.addEventListener('pointercancel',pointerUp);
      requestAnimationFrame(draw);
      refresh();
    }
    function click(e){const add=e.target.closest('[data-add]');if(add){const kind=add.dataset.add;const o={id:newid('obj-'),kind,name:kinds[kind][0],x:Math.round(venue().width/2),y:Math.round(venue().length/2),z:kind==='light'?Math.min(3,venue().height):0,watts:0,eqId:''};plan().items.push(o);chosen=o.id;persist();refresh();return;}
      const s=e.target.closest('[data-select]');if(s){chosen=s.dataset.select;refresh();return;}
      const rem=e.target.closest('[data-remove]');if(rem){plan().runs=plan().runs.filter(r=>r.id!==rem.dataset.remove);persist();refresh();return;}
      const action=e.target.closest('[data-action]')?.dataset.action,o=item(chosen);if(!o)return;
      if(action==='duplicate'){plan().items.push({...o,id:newid('obj-'),name:o.name+' copy',x:clamp(o.x+1,0,venue().width)});chosen=plan().items.at(-1).id;persist();refresh();}
      if(action==='delete'){plan().items=plan().items.filter(i=>i.id!==o.id);plan().runs=plan().runs.filter(r=>r.from!==o.id&&r.to!==o.id);chosen=null;persist();refresh();}
    }
    function change(e){const key=e.target.dataset.edit,o=item(chosen);if(!key||!o)return;if(['x','y','z','watts'].includes(key)){const max=key==='x'?venue().width:key==='y'?venue().length:key==='z'?venue().height:100000;o[key]=clamp(num(e.target.value),0,max);}else{o[key]=e.target.value;if(key==='eqId'){const g=db.equipment?.find(g=>g.id===o.eqId);if(g){o.name=g.name;o.watts=num(g.watts);}}}persist();refresh();}
    function pointerDown(e){const r=canvas.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;const found=hits.slice().reverse().find(h=>Math.hypot(h.p.x-x,h.p.y-y)<22);if(found){chosen=found.id;drag={id:found.id};refresh();canvas.setPointerCapture(e.pointerId);}}
    function pointerMove(e){if(!drag)return;const o=item(drag.id),v=venue(),r=canvas.getBoundingClientRect(),w=r.width,h=r.height;const span=top?Math.max(v.width,v.length):v.width+v.length,s=Math.min(w*.78/span,h*.69/(top?span:span*.42+v.height*.85))*zoom;const xx=e.clientX-r.left,yy=e.clientY-r.top;
      if(top){o.x=clamp(Math.round((v.width/2+(xx-w/2)/s)*10)/10,0,v.width);o.y=clamp(Math.round((v.length/2+(yy-h/2)/s)*10)/10,0,v.length);}
      else{const u=(xx-w/2)/s, vv=(yy-h*.58+o.z*s*.8)/(s*.48);const dx=u*Math.cos(yaw)+vv*Math.sin(yaw),dy=-u*Math.sin(yaw)+vv*Math.cos(yaw);o.x=clamp(Math.round((dx+v.width/2)*10)/10,0,v.width);o.y=clamp(Math.round((dy+v.length/2)*10)/10,0,v.length);}
      draw();}
    function pointerUp(){if(drag){drag=null;persist();refresh();}}
    build();
  }
  window.PhaenomenonSpacePlanner={ensure,mount};
})();