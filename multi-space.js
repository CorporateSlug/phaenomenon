/* Multi-area venue sites for Phaenomenon.
   Area geometry and between-area links are illustrative until independently surveyed.
   Existing single-space venues remain unchanged. */
(()=>{
'use strict';
const G=window.PhaenomenonGeometry;
if(!G)return;
const r=v=>Math.round(Number(v)*10)/10;
const n=(x,d=0)=>Number.isFinite(+x)?+x:d;
const cap=(x,a,b)=>Math.max(a,Math.min(b,x));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const uid=prefix=>prefix+'-'+Math.random().toString(36).slice(2,10);
const DEMO_ID='ev-abbotsford-two-stage-demo',VENUE_ID='ven-abbotsford-two-stage-demo';
function area({id,name,x,y,width,length,height=5,kind='indoor',roof='flat',shape='rectangle'}){
 const v={id,name,x,y,width,length,height,geometry:{kind,footprint:G.template(shape==='l'?'L':shape==='u'?'U':shape,width,length),roof:{type:roof,eave:height,peak:height+1.5,axis:'x',heights:{}}}};
 G.normalize(v);return v;
}
function seed(db){
 if(!Array.isArray(db.venues))return;
 if(!db.venues.some(v=>v.id===VENUE_ID)){
  const venue={id:VENUE_ID,name:'Abbotsford Convent · two-stage concept',width:52,length:29,height:6.2,
   demo:true,approximate:true,notes:'Illustrative only. Not a surveyed Abbotsford Convent plan. Stages and paths are hypothetical; verify access, geometry, power and cable paths on site.',
   spaces:[
    area({id:'ab-indoor',name:'Indoor stage',x:3,y:4,width:19,length:15,height:6.2,kind:'indoor',roof:'gable'}),
    area({id:'ab-outdoor',name:'Outdoor stage',x:29,y:5,width:18,length:17,height:4.5,kind:'outdoor',roof:'none'})
   ],
   links:[{id:'ab-courtyard-link',name:'Illustrative site cable passage',fromSpace:'ab-indoor',toSpace:'ab-outdoor',from:{x:21,y:12,z:0},to:{x:30,y:12,z:0},via:[{x:25.5,y:12,z:0}],extraMeters:2,verified:false,allowedTypes:['dmx','network','audio','power'],notes:'Pathway is hypothetical. Obtain permission to cross the site, confirm elevation, protected cable crossing and physical route.'}]
  };
  G.normalize(venue);db.venues.push(venue);
 }
 if(!Array.isArray(db.eventJobs))return;
 if(!db.eventJobs.some(e=>e.id===DEMO_ID)){
  const c=db.clients?.[0]?.id||'';
  db.eventJobs.push({id:DEMO_ID,title:'Abbotsford Convent · Indoor + Outdoor demo',clientId:c,date:'2026-12-05',venue:'Abbotsford Convent · concept',venueId:VENUE_ID,
    eventType:'Performance',guests:160,zones:2,environment:'Outdoor',complexity:'Feature',status:'Enquiry',labourHours:8,labourRate:90,
    notes:'Illustrative two-area demonstration only. Not an actual event booking or scaled site survey.',kit:[],demo:true});
 }
 if(!db.venuePlans||typeof db.venuePlans!=='object')db.venuePlans={};
 if(!db.venuePlans[DEMO_ID]){
  const itm=(id,name,kind,areaId,x,y,z,watts=0,extra={})=>({id,name,kind,areaId,x,y,z,watts,eqId:'',...extra});
  db.venuePlans[DEMO_ID]={venueId:VENUE_ID,focusSpaceId:'all',
   items:[
    itm('ab-indoor-stage','Indoor performance platform','stage','ab-indoor',12,16,0),
    itm('ab-i-console','Indoor lighting control','control','ab-indoor',7,7,0,80),
    itm('ab-i-node','Indoor DMX / network node','network','ab-indoor',19,12,0,20),
    itm('ab-i-distro','Indoor power distribution','power','ab-indoor',5,13,0),
    itm('ab-i-wash1','Indoor wash · left','light','ab-indoor',8,13,3.8,180,{fixtureType:'movingWash',pan:15,tilt:60,beamAngle:36,colorHex:'#ffb26d'}),
    itm('ab-i-wash2','Indoor wash · right','light','ab-indoor',17,13,3.8,180,{fixtureType:'movingWash',pan:-15,tilt:60,beamAngle:36,colorHex:'#8ba4ff'}),
    itm('ab-outdoor-stage','Outdoor performance platform','stage','ab-outdoor',38,18,0),
    itm('ab-o-node','Outdoor DMX / network node','network','ab-outdoor',31,12,0,20),
    itm('ab-o-distro','Outdoor power distribution (illustrative)','power','ab-outdoor',31,9,0),
    itm('ab-o-wash1','Outdoor wash · left','light','ab-outdoor',33,17,3,160,{fixtureType:'par',pan:15,tilt:58,beamAngle:28,colorHex:'#a9e8cb'}),
    itm('ab-o-wash2','Outdoor wash · centre','light','ab-outdoor',39,17,3,160,{fixtureType:'par',pan:0,tilt:60,beamAngle:28,colorHex:'#d4aaff'}),
    itm('ab-o-wash3','Outdoor wash · right','light','ab-outdoor',44,17,3,160,{fixtureType:'par',pan:-15,tilt:60,beamAngle:28,colorHex:'#f6c17d'})
   ],
   runs:[
    {id:'ab-net-between',cableId:'NET-01',type:'network',from:'ab-i-node',to:'ab-o-node',cableLength:30,slack:15,connector:'RJ45 / Cat6',linkType:'Direct'},
    {id:'ab-i-dmx1',cableId:'DMX-I-01',type:'dmx',from:'ab-i-node',to:'ab-i-wash1',cableLength:20,slack:15,connector:'5-pin XLR'},
    {id:'ab-i-dmx2',cableId:'DMX-I-02',type:'dmx',from:'ab-i-wash1',to:'ab-i-wash2',cableLength:20,slack:15,connector:'5-pin XLR'},
    {id:'ab-o-dmx1',cableId:'DMX-O-01',type:'dmx',from:'ab-o-node',to:'ab-o-wash1',cableLength:15,slack:15,connector:'5-pin XLR'},
    {id:'ab-o-dmx2',cableId:'DMX-O-02',type:'dmx',from:'ab-o-wash1',to:'ab-o-wash2',cableLength:15,slack:15,connector:'5-pin XLR'},
    {id:'ab-o-dmx3',cableId:'DMX-O-03',type:'dmx',from:'ab-o-wash2',to:'ab-o-wash3',cableLength:15,slack:15,connector:'5-pin XLR'},
    {id:'ab-i-power1',cableId:'PWR-I-01',type:'power',from:'ab-i-distro',to:'ab-i-wash1',cableLength:15,slack:15,linkType:'Direct'},
    {id:'ab-i-power2',cableId:'PWR-I-02',type:'power',from:'ab-i-distro',to:'ab-i-wash2',cableLength:20,slack:15,linkType:'Direct'},
    {id:'ab-o-power1',cableId:'PWR-O-01',type:'power',from:'ab-o-distro',to:'ab-o-wash1',cableLength:15,slack:15,linkType:'Direct'},
    {id:'ab-o-power2',cableId:'PWR-O-02',type:'power',from:'ab-o-distro',to:'ab-o-wash2',cableLength:20,slack:15,linkType:'Direct'},
    {id:'ab-o-power3',cableId:'PWR-O-03',type:'power',from:'ab-o-distro',to:'ab-o-wash3',cableLength:25,slack:15,linkType:'Direct'}
   ]};
 }
 if(!db.technicalPlans||typeof db.technicalPlans!=='object')db.technicalPlans={};
 if(!db.technicalPlans[DEMO_ID]){
  const plan=db.venuePlans[DEMO_ID];
  const patch={},power={};
  for(const item of plan.items){
    if(item.kind==='light'){
      const indoor=item.areaId==='ab-indoor';
      patch[item.id]={enabled:true,universe:indoor?1:2,channels:18,start:indoor?(item.id.endsWith('wash1')?1:19):(item.id.endsWith('wash1')?1:item.id.endsWith('wash2')?19:37),locked:false,modeName:'Illustrative 18-channel mode (verify)'};
      power[item.id]={enabled:true,circuitId:indoor?'ab-circ-indoor':'ab-circ-outdoor',currentOverride:null};
    }else if(item.kind==='control'||item.kind==='network'){
      patch[item.id]={enabled:false,universe:1,channels:null,start:null};
      power[item.id]={enabled:true,circuitId:item.areaId==='ab-indoor'?'ab-circ-indoor':'ab-circ-outdoor',currentOverride:null};
    }else power[item.id]={enabled:false,circuitId:'',currentOverride:null};
  }
  db.technicalPlans[DEMO_ID]={version:1,universeCount:2,patch,power,deviceSpecs:{},installed:{},circuits:[
   {id:'ab-circ-indoor',name:'Indoor circuit (demo)',voltage:230,limitAmps:10,warningPercent:80},
   {id:'ab-circ-outdoor',name:'Outdoor circuit (demo)',voltage:230,limitAmps:10,warningPercent:80}
  ],notes:'Illustrative layouts, fixture modes, locations, supplies and links. Verify independently. This is not an electrical plan.'};
 }
}
function hasAreas(v){return Array.isArray(v?.spaces)&&v.spaces.length>0}
function ensure(v){
 if(!hasAreas(v))return[];
 for(const a of v.spaces){a.x=n(a.x);a.y=n(a.y);a.width=cap(n(a.width,12),2,200);a.length=cap(n(a.length,10),2,200);a.height=cap(n(a.height,4),.5,50);G.normalize(a);}
 if(!Array.isArray(v.links))v.links=[];
 return v.spaces;
}
function polygon(a){return (a.geometry?.footprint||G.rectangle(a.width,a.length)).map(p=>({x:p.x+a.x,y:p.y+a.y,id:p.id}))}
function which(v,o){const spaces=ensure(v);if(!spaces.length)return null;return spaces.find(a=>G.contains(polygon(a),{x:n(o.x),y:n(o.y)}))||spaces.find(a=>a.id===o.areaId)||spaces[0]}
function constrain(v,o){
 if(!hasAreas(v))return false;
 const old=o.areaId;const a=which(v,o),q=G.insidePosition(polygon(a),{x:n(o.x),y:n(o.y)});
 o.areaId=a.id;o.x=q.x;o.y=q.y;
 o.z=cap(n(o.z),0,Math.max(a.height,G.peakHeight(a)));
 return old!==o.areaId;
}
function migrate(v,plan){if(!hasAreas(v))return;ensure(v);for(const o of plan.items||[]){if(!o.areaId||!v.spaces.some(a=>a.id===o.areaId))o.areaId=which(v,o)?.id;}}
function convert(v){
 if(hasAreas(v))return ensure(v);
 const first=area({id:uid('space'),name:'Main space',x:0,y:0,width:v.width,length:v.length,height:v.height,kind:v.geometry?.kind||'indoor',roof:v.geometry?.roof?.type||'flat'});
 first.geometry=JSON.parse(JSON.stringify(v.geometry||first.geometry));G.normalize(first);
 v.spaces=[first];v.links=[];return v.spaces;
}
function expand(v){
 let w=2,l=2;for(const a of v.spaces||[]){w=Math.max(w,a.x+a.width+3);l=Math.max(l,a.y+a.length+3);}
 v.width=Math.max(w,v.width);v.length=Math.max(l,v.length);
 v.geometry.footprint=G.rectangle(v.width,v.length);
 G.normalize(v);
}
function addSpace(v,opts={}){
 convert(v);const prior=v.spaces[v.spaces.length-1],maxX=Math.max(...v.spaces.map(a=>a.x+a.width));
 const added=area({id:uid('space'),name:opts.name||'New space',x:r(maxX+4),y:prior?.y||2,width:cap(n(opts.width,12),2,200),length:cap(n(opts.length,10),2,200),height:cap(n(opts.height,4),.5,40),kind:opts.kind||'indoor',roof:opts.kind==='outdoor'?'none':'flat'});
 v.spaces.push(added);expand(v);return added;
}
function line(a,b){return Math.hypot(a.x-b.x,a.y-b.y,n(a.z)-n(b.z))}
function route(p,run){
 const v=p.venue,all=ensure(v),items=p.plan.items||[],a=items.find(o=>o.id===run.from),b=items.find(o=>o.id===run.to);
 if(!a||!b||!all.length)return null;
 const sa=which(v,a),sb=which(v,b);if(!sa||!sb)return null;
 const start={x:a.x,y:a.y,z:n(a.z)},end={x:b.x,y:b.y,z:n(b.z)};
 const floor=(a,b,space)=>{
  const path=G.shortest(polygon(space),a,b);return path&&path.map(v=>({x:v.x,y:v.y,z:0}));
 };
 let mid=[],siteLink=null;
 if(sa.id===sb.id){mid=floor(a,b,sa);if(!mid)return null;}
 else{
  siteLink=(v.links||[]).find(q=>(q.fromSpace===sa.id&&q.toSpace===sb.id)||(q.fromSpace===sb.id&&q.toSpace===sa.id));
  if(!siteLink||siteLink.disabled)return null;
  if(Array.isArray(siteLink.allowedTypes)&&!siteLink.allowedTypes.includes(run.type))return null;
  const forward=siteLink.fromSpace===sa.id,portalA=forward?siteLink.from:siteLink.to,portalB=forward?siteLink.to:siteLink.from;
  const p1=G.insidePosition(polygon(sa),portalA),p2=G.insidePosition(polygon(sb),portalB);
  const pathA=floor(a,p1,sa),pathB=floor(p2,b,sb);
  if(!pathA||!pathB)return null;
  const via=(siteLink.via||[]).map(q=>({x:n(q.x),y:n(q.y),z:n(q.z)}));
  if(!forward)via.reverse();
  mid=[...pathA,...via,...pathB];
 }
 const points=[start,...mid,end];let dist=0;
 for(let i=1;i<points.length;i++)dist+=line(points[i],points[i-1]);
 dist+=siteLink?Math.max(0,n(siteLink.extraMeters)):0;
 const length=r(dist*(1+cap(n(run.slack),0,100)/100));
 return {a,b,points,length,suggested:[2,3,5,10,15,20,25,30,50,100].find(x=>x>=length)||null,betweenSpaces:sa.id!==sb.id,link:siteLink,provisional:!!siteLink&&!siteLink.verified};
}
function draw3D(T,viewer){
 const v=viewer.v,p=viewer.p;
 for(const a of ensure(v)){
  const fp=polygon(a);if(fp.length<3)continue;
  const selected=p.focusSpaceId==='all'||p.focusSpaceId===a.id;
  const shape=new T.Shape();fp.forEach((pt,i)=>i?shape.lineTo(pt.x,pt.y):shape.moveTo(pt.x,pt.y));shape.closePath();
  const geom=new T.ShapeGeometry(shape);geom.rotateX(Math.PI/2);geom.translate(-v.width/2,-.015,-v.length/2);
  const color=a.geometry.kind==='outdoor'?0x315c48:0x294a55;
  const mat=viewer.mat(color,selected?1:.4);
  viewer.world.add(new T.Mesh(geom,mat));
  viewer.line([...fp,fp[0]].map(q=>viewer.point(q.x,q.y,.045)),selected?0x9fdfc1:0x7b9e9b,selected?.94:.4);
  const step=2;
  for(let x=Math.ceil(a.x/step)*step;x<a.x+a.width;x+=step){let pts=[];for(let y=a.y;y<a.y+a.length;y+=.6){if(G.contains(fp,{x,y}))pts.push(viewer.point(x,y,.05));else if(pts.length>1){viewer.line(pts,0x83b3aa,.13);pts=[]}}if(pts.length>1)viewer.line(pts,0x83b3aa,.13)}
  for(let y=Math.ceil(a.y/step)*step;y<a.y+a.length;y+=step){let pts=[];for(let x=a.x;x<a.x+a.width;x+=.6){if(G.contains(fp,{x,y}))pts.push(viewer.point(x,y,.05));else if(pts.length>1){viewer.line(pts,0x83b3aa,.13);pts=[]}}if(pts.length>1)viewer.line(pts,0x83b3aa,.13)}
  const local={width:a.width,length:a.length,height:a.height,geometry:a.geometry};
  if(a.geometry.roof.type!=='none'){
    fp.forEach((q,i)=>{const e=fp[(i+1)%fp.length],z1=G.height(local,{x:q.x-a.x,y:q.y-a.y}),z2=G.height(local,{x:e.x-a.x,y:e.y-a.y});
      viewer.line([viewer.point(q.x,q.y,0),viewer.point(q.x,q.y,z1)],0x94bdb6,.42);
      viewer.line([viewer.point(q.x,q.y,z1),viewer.point(e.x,e.y,z2)],0xbed5ce,.65);
    });
  }
  viewer.label(a.name,viewer.point(a.x+a.width/2,a.y+a.length/2,Math.max(.5,a.geometry.roof.type==='none'?.5:a.height*.75)),'space');
  if(viewer.showDims){
   viewer.label(Math.round(G.area(a.geometry.footprint))+' m²',viewer.point(a.x+a.width/2,a.y+a.length/2,.2),'measure');
  }
 }
 for(const link of v.links||[]){
  const pts=[link.from,...(link.via||[]),link.to].filter(Boolean).map(q=>viewer.point(n(q.x),n(q.y),Math.max(.1,n(q.z,.1))));
  if(pts.length>=2){
   const geometry=new T.BufferGeometry().setFromPoints(pts);
   const material=new T.LineDashedMaterial({color:link.verified?0x7edbb5:0xe5c28b,dashSize:.6,gapSize:.3,transparent:true,opacity:.9});
   const line=new T.Line(geometry,material);line.computeLineDistances();viewer.world.add(line);
   const mid=pts[Math.floor(pts.length/2)].clone().add(new T.Vector3(0,.5,0));
   viewer.label(link.verified?'Verified route':'Provisional route',mid,'link');
  }
 }
}
function attach(p){
 const v=p.venue,scene=p.root.querySelector('.sp-scene-shell'),canvas=p.root.querySelector('.sp-canvas-wrap');
 if(!scene||!canvas)return null;
 const ui=document.createElement('section');ui.className='msp-root';
 scene.insertBefore(ui,canvas);
 const o={p,ui,disposed:false,
  render(){
   const v=p.venue;ensure(v);const active=p.focusSpaceId||'all';
   const areas=v.spaces||[];
   ui.innerHTML='<div class="msp-top"><div class="msp-top-left"><span class="msp-overline">VENUE SPACES</span><div class="msp-tabs" role="group" aria-label="Viewing area"><button type="button" data-msp-focus="all" class="'+(active==='all'?'is-active':'')+'">Whole venue</button>'+areas.map(a=>'<button type="button" data-msp-focus="'+esc(a.id)+'" class="'+(active===a.id?'is-active':'')+'">'+(a.geometry.kind==='outdoor'?'☀ ':'⌂ ')+esc(a.name)+'</button>').join('')+'</div></div><div class="msp-actions">'+(areas.length?'<button type="button" data-msp-open="edit">Edit spaces</button>':'<button type="button" data-msp-action="convert">+ Add another space</button>')+'</div></div>'+
    (v.approximate?'<p class="msp-disclaimer"><strong>Illustrative only.</strong> Room geometry, positions, paths and power points are not surveyed or approved.</p>':'')+
    '<div class="msp-details" '+(this.open?'':'hidden')+'><div class="msp-editor-head"><strong>Spaces & shared pathways</strong><button type="button" data-msp-open="close">Close</button></div>'+
    '<div class="msp-area-cards">'+areas.map(a=>'<div class="msp-area-card"><div class="msp-area-title"><strong>'+esc(a.name)+'</strong><span>'+(a.geometry.kind==='outdoor'?'Open air':'Indoor')+'</span></div>'+
     '<div class="msp-field-grid">'+
     input(a,'name','Name','text')+input(a,'x','X (m)','number')+input(a,'y','Y (m)','number')+input(a,'width','Width (m)','number')+input(a,'length','Length (m)','number')+input(a,'height','Height / reference (m)','number')+
     '<label>Environment<select data-msp-area="'+esc(a.id)+'" data-msp-field="kind"><option value="indoor" '+(a.geometry.kind==='indoor'?'selected':'')+'>Indoor</option><option value="outdoor" '+(a.geometry.kind==='outdoor'?'selected':'')+'>Outdoor / open air</option></select></label>'+
     '<label>Floorplan<select data-msp-area="'+esc(a.id)+'" data-msp-field="shape">'+['rectangle','l','u','angled'].map(x=>'<option value="'+x+'">'+({rectangle:'Rectangle',l:'L shape',u:'U shape',angled:'Angled'}[x])+'</option>').join('')+'</select></label>'+
     '<label>Roof<select data-msp-area="'+esc(a.id)+'" data-msp-field="roof">'+['none','flat','mono','gable'].map(x=>'<option value="'+x+'" '+(a.geometry.roof.type===x?'selected':'')+'>'+({none:'None / open sky',flat:'Flat',mono:'Sloped',gable:'Pitched'}[x])+'</option>').join('')+'</select></label>'+
     '</div></div>').join('')+'</div>'+
     '<div class="msp-link-head"><strong>Between-space connections</strong><p>These are permitted cable pathways, not automatic power or data connections. Verify actual access and cable protection.</p></div>'+
     '<div class="msp-links">'+(v.links||[]).map(link=>'<label class="msp-link"><span>'+esc(link.name||'Shared route')+' <small>'+esc(areas.find(a=>a.id===link.fromSpace)?.name||'?')+' → '+esc(areas.find(a=>a.id===link.toSpace)?.name||'?')+'</small></span><span>Extra route (m)<input type="number" min="0" max="1000" step=".5" data-msp-link="'+esc(link.id)+'" value="'+n(link.extraMeters)+'"></span><span class="msp-link-status">'+(link.verified?'Surveyed':'Not verified')+'</span></label>').join('')+
     (v.links?.length?'':'<span class="msp-empty">No shared site connections yet. Create a link for cross-space cable estimates.</span>')+'</div>'+
     '<div class="msp-create-link"><select id="msp-link-from">'+areas.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join('')+'</select><span aria-hidden="true">→</span><select id="msp-link-to">'+areas.map(a=>'<option value="'+esc(a.id)+'" '+(a.id===areas[1]?.id?'selected':'')+'>'+esc(a.name)+'</option>').join('')+'</select><button type="button" data-msp-action="link">+ Add shared pathway</button></div>'+
     '<div class="msp-editor-foot"><button type="button" data-msp-action="add">+ Add another area</button><span>Room dimensions and shared route positions are estimates until surveyed.</span></div></div>';
   const legacy=p.root.querySelector('#sp-venue-pane .sp-geometry-panel');
   if(legacy)legacy.hidden=hasAreas(v);
   const dims=p.root.querySelector('#sp-venue-pane .sp-dimensions');
   if(dims)dims.hidden=hasAreas(v);
  },
  open:false,
  dispose(){ui.remove();this.disposed=true},
 };
 function input(a,field,label,type){return '<label>'+label+'<input data-msp-area="'+esc(a.id)+'" data-msp-field="'+field+'" type="'+type+'" '+(type==='number'?'step=".5" ':'')+'value="'+esc(a[field])+'"></label>'}
 ui.addEventListener('click',e=>{
  const focus=e.target.closest('[data-msp-focus]');if(focus){p.focusSpaceId=focus.dataset.mspFocus;p.plan.focusSpaceId=p.focusSpaceId;p.save();o.render();focusView(p);return}
  const open=e.target.closest('[data-msp-open]');if(open){o.open=open.dataset.mspOpen!=='close';o.render();return}
  const action=e.target.closest('[data-msp-action]')?.dataset.mspAction;if(!action)return;
  if(action==='convert'){convert(p.venue);p.plan.items.forEach(x=>constrain(p.venue,x));p.focusSpaceId=p.venue.spaces[0].id;p.plan.focusSpaceId=p.focusSpaceId;o.open=true;p.save();o.render();p.draw();return}
  if(action==='add'){const a=addSpace(p.venue);p.focusSpaceId=a.id;p.plan.focusSpaceId=a.id;p.save();o.render();focusView(p);return}
  if(action==='link'){
   const src=ui.querySelector('#msp-link-from')?.value,dst=ui.querySelector('#msp-link-to')?.value;
   if(!src||!dst||src===dst){p.notify?.('Choose two different spaces.');return}
   if(p.venue.links.some(l=>l.fromSpace===src&&l.toSpace===dst||l.fromSpace===dst&&l.toSpace===src)){p.notify?.('These spaces already have a shared pathway.');return}
   const a=p.venue.spaces.find(x=>x.id===src),b=p.venue.spaces.find(x=>x.id===dst);
   const ca={x:r(a.x+a.width/2),y:r(a.y+a.length/2),z:0},cb={x:r(b.x+b.width/2),y:r(b.y+b.length/2),z:0};
   p.venue.links.push({id:uid('site-link'),name:'Provisional cable route',fromSpace:src,toSpace:dst,from:ca,to:cb,via:[],extraMeters:3,verified:false,allowedTypes:['dmx','power','network','audio']});
   p.save();o.render();p.draw();p.technical?.refresh();return;
  }
 });
 ui.addEventListener('change',e=>{
  const el=e.target,spaceId=el.dataset.mspArea,field=el.dataset.mspField;
  if(spaceId&&field){
   const a=p.venue.spaces.find(x=>x.id===spaceId);if(!a)return;
   if(field==='kind'){a.geometry.kind=el.value;a.geometry.roof.type=el.value==='outdoor'?'none':'flat'}
   else if(field==='roof'){a.geometry.roof.type=el.value;}
   else if(field==='shape'){const ok=window.confirm('Replace this area’s outline with a '+el.value+' template? Equipment will remain in the nearest valid position.');if(!ok)return;a.geometry.footprint=G.template(el.value==='l'?'L':el.value==='u'?'U':el.value,a.width,a.length);}
   else if(field==='name'){a.name=String(el.value).slice(0,75).trim()||a.name;}
   else{
    const previous={width:a.width,length:a.length};
    a[field]=cap(n(el.value,a[field]),field==='height'?.5:field==='x'||field==='y'?0:2,field==='height'?40:200);
    if((field==='width'||field==='length')&&previous[field]>0){const scale=a[field]/previous[field];for(const point of a.geometry.footprint)point[field==='width'?'x':'y']=r(point[field==='width'?'x':'y']*scale);}
   }
   expand(p.venue);
   for(const plan of Object.values(p.db.venuePlans||{}))if(plan.venueId===p.venue.id)plan.items?.forEach(item=>constrain(p.venue,item));
   p.save();o.render();p.updateAll();focusView(p);return;
  }
  if(el.dataset.mspLink){const link=p.venue.links.find(l=>l.id===el.dataset.mspLink);if(link){link.extraMeters=cap(n(el.value,0),0,1000);p.save();o.render();p.updateAll()}}
 });
 // New layouts start with whole-site context; prior focus preference is preserved.
 p.focusSpaceId=p.plan.focusSpaceId||'all';
 o.render();return o;
}
function focusView(p){
 const viewer=p.threeView;if(!viewer)return;
 const a=p.venue.spaces?.find(x=>x.id===p.focusSpaceId);
 if(a){
  viewer.target.set(a.x+a.width/2-p.venue.width/2,Math.max(.5,a.height*.2),a.y+a.length/2-p.venue.length/2);
  viewer.zoom=cap(Math.max(p.venue.width,p.venue.length)/Math.max(a.width,a.length)*.8,1.1,3.5);
 }else{viewer.target.set(0,Math.min(2,p.venue.height*.2),0);viewer.zoom=1;}
 viewer.rebuild();
}
window.PhaenomenonMultiSpace={seed,hasAreas,ensure,polygon,which,constrain,migrate,convert,expand,addSpace,route,draw3D,attach,focusView,DEMO_ID,VENUE_ID};
})();