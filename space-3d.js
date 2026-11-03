/* Phaenomenon Space Planner 2.0. Three.js r174 (MIT). All units in metres.
   WebGL is progressive enhancement; legacy schematic remains if unavailable. */
(async()=>{
'use strict';
let THREE;
try{THREE=await import('https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js')}
catch(e){try{THREE=await import('https://unpkg.com/three@0.174.0/build/three.module.js')}catch(e2){console.warn('3D viewer unavailable; retained 2D fallback',e2);return}}
const G=window.PhaenomenonGeometry, T=THREE;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const n=(v,d=0)=>Number.isFinite(+v)?+v:d;
const rad=v=>v*Math.PI/180;
const colors={light:0xf4bc76,audio:0xb49be7,power:0xe6a46d,network:0x6ad0cd,control:0xb3a1e8,rigging:0xb6c9c5,stage:0x80aba0,other:0xb9c9c7};
const cableColors={power:0xeaa36f,network:0x6bd0ce,dmx:0xb6a2f2,audio:0x91bdf5};
function clearObjects(group){group.traverse(o=>{o.geometry?.dispose();const m=Array.isArray(o.material)?o.material:[o.material];m.forEach(x=>x?.dispose?.())});group.clear()}
class SceneViewer{
 constructor(p){
  this.p=p;this.v=p.venue;this.mode=p.mode;this.zoom=1;this.yaw=.75;this.elevation=.73;this.target=new T.Vector3(0,Math.min(2,G.peakHeight(this.v)*.2),0);this.tool='move';this.showDims=true;this.showBeams=true;
  this.wrap=p.canvas.parentElement;
  this.host=document.createElement('div');this.host.className='sp3-host';
  this.labels=document.createElement('div');this.labels.className='sp3-labels';
  this.hud=document.createElement('div');this.hud.className='sp3-hud';
  try{this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch(e){throw e}
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
  this.renderer.domElement.className='sp3-canvas';this.renderer.domElement.tabIndex=0;this.host.append(this.renderer.domElement,this.labels,this.hud);
  this.wrap.insertBefore(this.host,p.root.querySelector('#sp-canvas-status'));p.canvas.style.display='none';
  this.scene=new T.Scene();this.scene.background=new T.Color(0x1b3033);
  this.world=new T.Group();this.scene.add(this.world);
  this.scene.add(new T.HemisphereLight(0xe8f9f5,0x607579,2));
  const sun=new T.DirectionalLight(0xffffff,2);sun.position.set(-12,28,16);this.scene.add(sun);
  this.ortho=new T.OrthographicCamera(-10,10,10,-10,.1,1500);
  this.persp=new T.PerspectiveCamera(42,1,.1,1500);this.camera=this.ortho;
  this.raycaster=new T.Raycaster();this.mouse=new T.Vector2();
  this.picks=[];this.labelRefs=[];this.meshes=new Map();
  this.toolbar();this.controls();this.bind();
  this.rebuild();this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.wrap);
 }
 pos(o){return new T.Vector3(n(o.x)-this.v.width/2,n(o.z),n(o.y)-this.v.length/2)}
 point(x,y,z=0){return new T.Vector3(x-this.v.width/2,z,y-this.v.length/2)}
 mat(color,opacity=1){return new T.MeshStandardMaterial({color,roughness:.73,metalness:.12,transparent:opacity<1,opacity,side:T.DoubleSide,depthWrite:opacity===1})}
 line(points,color,opacity=1){const g=new T.BufferGeometry().setFromPoints(points),m=new T.LineBasicMaterial({color,transparent:opacity<1,opacity,toneMapped:false});const l=new T.Line(g,m);this.world.add(l);return l}
 toolbar(){
  const sw=this.p.root.querySelector('.sp-view-switch');
  this.p.root.querySelector('#sp-view-three').textContent='Iso';
  const btn=document.createElement('button');btn.type='button';btn.id='sp-view-perspective';btn.className='sp-tool sp-toggle';btn.textContent='Perspective';btn.setAttribute('aria-pressed','false');sw?.append(btn);btn.onclick=()=>this.p.setView('perspective');
  this.hud.innerHTML='<div class="sp3-tools" role="group" aria-label="Model tools"><button data-tool="move" class="active" type="button">Move</button><button data-tool="rotate" type="button">Rotate</button></div><button data-toggle="beams" class="active" type="button">Beams</button><button data-toggle="dims" class="active" type="button">Dimensions</button>';
  this.hud.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{this.tool=b.dataset.tool;this.hud.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('active',x===b));this.render()});
  this.hud.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>{const k=b.dataset.toggle==='dims'?'showDims':'showBeams';this[k]=!this[k];b.classList.toggle('active',this[k]);this.rebuild()});
 }
 controls(){
  this.status=document.createElement('div');this.status.className='sp3-status';this.host.append(this.status);
 }
 bind(){
  const c=this.renderer.domElement;
  this.down=e=>{this.p.setCanvasActive(true);c.focus({preventScroll:true});const hit=this.pick(e);this.drag={kind:e.button===2||e.shiftKey?'pan':'orbit',x:e.clientX,y:e.clientY,moved:false};
   if(hit?.userData.vertexId&&this.p.editOutline&&this.mode==='top'){this.p.selectedVertex=hit.userData.vertexId;this.drag.kind='vertex';this.drag.id=hit.userData.vertexId;this.p.updateGeometry()}
   else if(hit?.userData.itemId&&e.button===0){this.p.selected=hit.userData.itemId;this.drag.kind=this.tool;this.drag.id=hit.userData.itemId;this.p.updateInspector();this.rebuild()}
   c.setPointerCapture(e.pointerId);e.preventDefault()};
  this.move=e=>{if(!this.drag){c.style.cursor=this.pick(e)?'pointer':'grab';return}const d=this.drag,dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>0)d.moved=true;
   if(d.kind==='orbit'&&this.mode!=='top'){this.yaw-=dx*.009;this.elevation=clamp(this.elevation+dy*.006,.12,1.52);this.updateCamera();this.render()}
   else if(d.kind==='pan'){const v=Math.max(this.v.width,this.v.length)/Math.max(1,c.clientHeight)/this.zoom*1.9;const right=new T.Vector3().setFromMatrixColumn(this.camera.matrix,0),up=new T.Vector3().setFromMatrixColumn(this.camera.matrix,1);this.target.addScaledVector(right,-dx*v).addScaledVector(up,dy*v);this.updateCamera();this.render()}
   else if(d.kind==='rotate'){const o=this.p.plan.items.find(x=>x.id===d.id);if(o){o.rotation=(n(o.rotation)+dx*.7+3600)%360;if(e.shiftKey)o.rotation=Math.round(o.rotation/15)*15;const mesh=this.meshes.get(o.id);if(mesh)mesh.rotation.y=-rad(o.rotation);this.render()}}
   else if(d.kind==='move'||d.kind==='vertex'){const o=this.p.plan.items.find(x=>x.id===d.id),h=d.kind==='move'?Math.max(.15,n(o?.z)):.2,world=this.intersect(e,h);if(world){const x=clamp(world.x+this.v.width/2,0,this.v.width),y=clamp(world.z+this.v.length/2,0,this.v.length);
     if(d.kind==='move'&&o){const pos=G.insidePosition(this.v.geometry.footprint,{x,y});o.x=pos.x;o.y=pos.y;this.p.constrainItem(o);const mesh=this.meshes.get(o.id);mesh?.position.set(o.x-this.v.width/2,h,o.y-this.v.length/2);this.render()}
     else{const corner=this.v.geometry.footprint.find(p=>p.id===d.id);if(corner){const before={x:corner.x,y:corner.y};corner.x=Math.round(x*10)/10;corner.y=Math.round(y*10)/10;if(G.valid(this.v.geometry.footprint,this.v.width,this.v.length))Object.assign(corner,before);else this.rebuild()}}}}
   d.x=e.clientX;d.y=e.clientY;e.preventDefault()};
  this.up=()=>{if(!this.drag)return;const d=this.drag;this.drag=null;if(d.moved&&['move','rotate','vertex'].includes(d.kind)){if(d.kind==='vertex'){this.p.rehomeAll();this.p.updateGeometry()}this.p.save();this.p.updateInspector();this.p.updateRoutes();this.p.updateSummary();this.rebuild()}};
  this.wheel=e=>{if(!this.p.canvasActive)return;e.preventDefault();this.zoom=clamp(this.zoom*Math.exp(-e.deltaY*.0014),.35,5);this.updateCamera();this.render()};
  this.context=e=>e.preventDefault();
  this.outside=e=>{if(!this.p.isFocus&&this.p.canvasActive&&!this.wrap.contains(e.target))this.p.setCanvasActive(false)};
  c.addEventListener('pointerdown',this.down);c.addEventListener('pointermove',this.move);c.addEventListener('pointerup',this.up);c.addEventListener('pointercancel',this.up);c.addEventListener('wheel',this.wheel,{passive:false});c.addEventListener('contextmenu',this.context);document.addEventListener('pointerdown',this.outside);
 }
 pointer(e){const r=this.renderer.domElement.getBoundingClientRect();this.mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.mouse,this.camera)}
 pick(e){this.pointer(e);return this.raycaster.intersectObjects(this.picks,false)[0]?.object}
 intersect(e,h){this.pointer(e);const result=new T.Vector3();return this.raycaster.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-h),result)?result:null}
 rebuild(){
  if(this.disposed)return;this.v=this.p.venue;this.meshes.clear();this.picks=[];this.labelRefs=[];this.labels.replaceChildren();clearObjects(this.world);
  const M=window.PhaenomenonMultiSpace;
  if(M?.hasAreas(this.v))M.draw3D(T,this);
  else {
  const fp=this.v.geometry.footprint||[];
  if(fp.length>2){
   const shape=new T.Shape();fp.forEach((p,i)=>i?shape.lineTo(p.x,p.y):shape.moveTo(p.x,p.y));shape.closePath();
   const floor=new T.ShapeGeometry(shape);floor.rotateX(Math.PI/2);floor.translate(-this.v.width/2,-.01,-this.v.length/2);this.world.add(new T.Mesh(floor,this.mat(this.v.geometry.kind==='outdoor'?0x315448:0x2c4948)));
   this.line([...fp,fp[0]].map(p=>this.point(p.x,p.y,.022)),0x9ac5b9,.85);
   const step=Math.max(1,Math.ceil(Math.max(this.v.width,this.v.length)/35));
   for(let x=step;x<this.v.width;x+=step){let pts=[];for(let y=0;y<=this.v.length;y+=.4){const p={x,y};if(G.contains(fp,p))pts.push(this.point(x,y,.03));else if(pts.length>1){this.line(pts,0x8db2a8,.14);pts=[]}}if(pts.length>1)this.line(pts,0x8db2a8,.14)}
   for(let y=step;y<this.v.length;y+=step){let pts=[];for(let x=0;x<=this.v.width;x+=.4){const p={x,y};if(G.contains(fp,p))pts.push(this.point(x,y,.03));else if(pts.length>1){this.line(pts,0x8db2a8,.14);pts=[]}}if(pts.length>1)this.line(pts,0x8db2a8,.14)}
   if(this.v.geometry.roof.type!=='none'){
    fp.forEach((a,i)=>{const b=fp[(i+1)%fp.length],ha=G.height(this.v,a),hb=G.height(this.v,b);this.line([this.point(a.x,a.y),this.point(a.x,a.y,ha)],0x9cbfba,.45);this.line([this.point(a.x,a.y,ha),this.point(b.x,b.y,hb)],0xb9d5cb,.7)});
    if(this.v.geometry.roof.type==='gable'){
      const roof=this.v.geometry.roof,ridge=[];
      for(let i=0;i<=60;i++){
        const p=roof.axis==='x'?{x:this.v.width*.5,y:i*this.v.length/60}:{x:i*this.v.width/60,y:this.v.length*.5};
        if(G.contains(fp,p))ridge.push(this.point(p.x,p.y,G.height(this.v,p)));
        else if(ridge.length>1){this.line([...ridge],0xe1c595,.68);ridge.length=0;}
      }
      if(ridge.length>1)this.line(ridge,0xe1c595,.68);
    }
   }
   if(this.mode==='top'&&this.p.editOutline)fp.forEach((p,i)=>{const mesh=new T.Mesh(new T.SphereGeometry(.19,12,8),new T.MeshBasicMaterial({color:p.id===this.p.selectedVertex?0xf0bf78:0xc3e7db}));mesh.position.copy(this.point(p.x,p.y,.18));mesh.userData.vertexId=p.id;this.world.add(mesh);this.picks.push(mesh);this.label(''+(i+1),this.point(p.x,p.y,.49),'corner')});
   if(this.showDims){
    fp.slice(0,12).forEach((a,i)=>{
     const b=fp[(i+1)%fp.length],dist=Math.hypot(a.x-b.x,a.y-b.y);
     if(dist<.55)return;
     const middle={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
     let nx=(b.y-a.y)/dist*.55,ny=-(b.x-a.x)/dist*.55;
     if(G.contains(fp,{x:middle.x+nx*.7,y:middle.y+ny*.7})){nx=-nx;ny=-ny;}
     const p1=this.point(a.x+nx,a.y+ny,.075),p2=this.point(b.x+nx,b.y+ny,.075);
     this.line([p1,p2],0x8aafa6,.64);
     const tx=(b.x-a.x)/dist*.14,ty=(b.y-a.y)/dist*.14;
     this.line([this.point(a.x+nx+ty,a.y+ny-tx,.075),this.point(a.x+nx-ty,a.y+ny+tx,.075)],0x8aafa6,.7);
     this.line([this.point(b.x+nx+ty,b.y+ny-tx,.075),this.point(b.x+nx-ty,b.y+ny+tx,.075)],0x8aafa6,.7);
     this.label(dist.toFixed(1)+' m',this.point(middle.x+nx,middle.y+ny,.16),'measure');
    });
   }
  }
  }
  if(this.p.showRuns){for(const cable of this.p.plan.runs){const r=this.p.route(cable);if(r){this.line(r.points.map(p=>this.point(p.x,p.y,Math.max(.05,p.z))),cableColors[cable.type]||0xd4e8e1,.9)}}}
  let migrated=false;
  this.p.plan.items.forEach(o=>{if(o.kind==='light'&&window.PhaenomenonFixtures?.ensure(o))migrated=true;this.addItem(o)});
  if(migrated)this.p.save();
  this.updateCamera();this.render();this.decorateInspector();
 }
 addItem(o){
  const kind=o.kind||'other',color=colors[kind]||colors.other,selected=o.id===this.p.selected;
  const group=new T.Group();group.position.copy(this.point(o.x,o.y,Math.max(.17,n(o.z))));group.rotation.y=-rad(n(o.rotation));this.world.add(group);this.meshes.set(o.id,group);
  const mat=this.mat(color),add=(mesh)=>{mesh.userData.itemId=o.id;group.add(mesh);this.picks.push(mesh);return mesh};
  if(kind==='light'){window.PhaenomenonFixtures?.build3D(T,o,group,add,this.showBeams);
  }else if(kind==='stage'){const mesh=add(new T.Mesh(new T.BoxGeometry(clamp(n(o.width,1.8),.5,30),.26,clamp(n(o.depth,1.25),.5,30)),mat));mesh.position.y=.06}
  else if(kind==='rigging'){const mesh=add(new T.Mesh(new T.BoxGeometry(.2,1.5,.2),mat));mesh.position.y=.55}
  else if(kind==='audio'){add(new T.Mesh(new T.BoxGeometry(.52,.7,.38),mat))}
  else{add(new T.Mesh(new T.BoxGeometry(.46,.27,.42),mat))}
  if(selected){const ring=new T.Mesh(new T.TorusGeometry(.51,.024,6,44),new T.MeshBasicMaterial({color:0xffd998}));ring.rotation.x=Math.PI/2;ring.position.y=-Math.max(.16,n(o.z))+.05;group.add(ring);
   group.add(new T.ArrowHelper(new T.Vector3(0,0,-1),new T.Vector3(0,.2,0),.9,0xffcb82,.15,.11))}
  this.label(o.name,group.position.clone().add(new T.Vector3(0,kind==='rigging'?1.7:.65,0)),selected?'selected':'item');
 }
 label(s,v,type){const d=document.createElement('span');d.className='sp3-label sp3-label-'+type;d.textContent=s;this.labels.append(d);this.labelRefs.push({d,v,type})}
 decorateInspector(){
  const item=this.p.selectedItem(),el=this.p.root.querySelector('#sp-inspect-body');
  if(item&&el&&!el.querySelector('.sp-optics'))this.p.updateInspector();
 }
 updateCamera(){
  const w=Math.max(1,this.host.clientWidth),h=Math.max(1,this.host.clientHeight),aspect=w/h;
  const span=Math.max(this.v.width,this.v.length,5)*1.7+Math.min(10,G.peakHeight(this.v));
  const el=this.mode==='top'?Math.PI/2-.0001:this.elevation,dist=span*1.7;
  const offset=new T.Vector3(Math.sin(this.yaw)*Math.cos(el),Math.sin(el),Math.cos(this.yaw)*Math.cos(el)).multiplyScalar(dist);
  const cam=this.mode==='perspective'?this.persp:this.ortho;cam.position.copy(this.target).add(offset);cam.up.set(0,this.mode==='top'?0:1,this.mode==='top'?-1:0);cam.lookAt(this.target);
  if(this.mode==='perspective'){cam.aspect=aspect;cam.position.copy(this.target).add(offset.multiplyScalar(1/this.zoom));cam.updateProjectionMatrix()}
  else{const size=span/this.zoom;cam.left=-size*aspect/2;cam.right=size*aspect/2;cam.top=size/2;cam.bottom=-size/2;cam.updateProjectionMatrix()}
  this.camera=cam;
 }
 resize(){if(!this.host.isConnected)return;const w=this.host.clientWidth,h=this.host.clientHeight;if(w<10||h<10)return;this.renderer.setSize(w,h,false);this.updateCamera();this.render()}
 render(){
  if(this.disposed)return;this.renderer.render(this.scene,this.camera);
  const w=this.host.clientWidth,h=this.host.clientHeight;
  this.labelRefs.forEach(({d,v})=>{const x=v.clone().project(this.camera),px=(x.x*.5+.5)*w,py=(-x.y*.5+.5)*h;d.hidden=x.z< -1||x.z>1||px<0||px>w||py<0||py>h;if(!d.hidden)d.style.transform='translate3d('+Math.round(px)+'px,'+Math.round(py)+'px,0) translate(-50%,-125%)'});
  const placed=[];this.labelRefs.filter(x=>!x.d.hidden).sort((a,b)=>({selected:0,corner:1,measure:2,item:3}[a.type]??4)-({selected:0,corner:1,measure:2,item:3}[b.type]??4)).forEach(({d,type})=>{
   const rect=d.getBoundingClientRect();
   const overlap=placed.some(b=>!(rect.right+5<b.left||rect.left-5>b.right||rect.bottom+4<b.top||rect.top-4>b.bottom));
   if(overlap&&type==='item')d.hidden=true;else placed.push(rect);
  });
  this.status.textContent=this.p.selected?(this.tool==='rotate'?'Rotate':'Move')+' · '+this.p.selectedItem()?.name:'Drag background to orbit · Shift-drag to pan';
 }
 setMode(mode){this.mode=mode;this.updateCamera();this.rebuild()}
 zoomBy(v){this.zoom=clamp(this.zoom*v,.35,5);this.updateCamera();this.render()}
 fit(){this.target.set(0,Math.min(2,G.peakHeight(this.v)*.2),0);this.yaw=.75;this.elevation=.73;this.zoom=1;this.updateCamera();this.render()}
 dispose(){
  if(this.disposed)return;this.disposed=true;this.observer?.disconnect();const c=this.renderer.domElement;
  c.removeEventListener('pointerdown',this.down);c.removeEventListener('pointermove',this.move);c.removeEventListener('pointerup',this.up);c.removeEventListener('pointercancel',this.up);c.removeEventListener('wheel',this.wheel);c.removeEventListener('contextmenu',this.context);document.removeEventListener('pointerdown',this.outside);
  clearObjects(this.world);this.renderer.dispose();this.host.remove();if(this.p.canvas)this.p.canvas.style.display='';
 }
}
function attach(p){if(!p?.canvas)return null;try{return new SceneViewer(p)}catch(e){console.warn('Keeping 2D fallback',e);return null}}
window.Phaenomenon3D={attach};
document.dispatchEvent(new Event('phaenomenon-three-ready'));
})();