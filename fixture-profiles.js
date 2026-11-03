/* Phaenomenon fixture profiles: illustrative categories, not manufacturer photometric data. */
(()=>{'use strict';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clean=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const profiles={
 par:{name:'LED PAR',detail:'Static colour wash',shape:'round',beam:[15,60],color:'rgb',cct:[2700,8000],d:{beamAngle:36,pan:0,tilt:65,range:12,intensity:80,hex:'#ffbd86',softness:60}},
 fresnel:{name:'Fresnel',detail:'Soft theatrical wash',shape:'round',beam:[12,65],color:'white',cct:[2700,6500],d:{beamAngle:35,pan:0,tilt:65,range:12,intensity:90,hex:'#ffe7bd',softness:80}},
 profile:{name:'Profile spotlight',detail:'Hard-edged shutters and iris',shape:'square',beam:[10,45],color:'white',cct:[2700,6500],iris:true,shutters:true,gobo:true,d:{beamAngle:24,pan:0,tilt:62,range:18,intensity:90,hex:'#ffe3ae',softness:10}},
 movingWash:{name:'Moving wash',detail:'Pan/tilt RGBW wash',shape:'round',beam:[5,60],color:'rgb',cct:[2000,9500],moving:true,d:{beamAngle:28,pan:0,tilt:65,range:18,intensity:85,hex:'#81cfff',softness:70}},
 movingSpot:{name:'Moving spot',detail:'Beam, gobo and motorised optics',shape:'round',beam:[4,40],color:'rgb',cct:[2800,8000],moving:true,iris:true,gobo:true,d:{beamAngle:16,pan:0,tilt:62,range:22,intensity:90,hex:'#edd9a7',softness:12}},
 batten:{name:'LED batten',detail:'Linear colour wash',shape:'wide',beam:[12,65],color:'rgb',cct:[2000,9000],d:{beamAngle:36,pan:0,tilt:65,range:12,intensity:85,hex:'#b58cff',softness:60}},
 blinder:{name:'Stage blinder',detail:'Wide warm-white audience light',shape:'square',beam:[30,90],color:'white',cct:[1800,3200],d:{beamAngle:65,pan:0,tilt:30,range:18,intensity:100,hex:'#ffc878',softness:45}},
 followspot:{name:'Followspot',detail:'Manual tracking light with iris',shape:'round',beam:[5,28],color:'fixed',iris:true,d:{beamAngle:13,pan:0,tilt:35,range:30,intensity:100,hex:'#fff7de',softness:12}}
};
const order=Object.keys(profiles),palette=['#ffffff','#ffd5aa','#f3bb6a','#f47b78','#e27de8','#947cf1','#72b4ff','#75d8d8','#88df99','#f4dd83'];
const get=id=>profiles[id]||profiles.par;
const rgb=hex=>/^#[0-9a-f]{6}$/i.test(hex||'')?hex:'#ffe1a5';
function kelvin(k){let t=clamp(num(k,3200),1000,40000)/100,r,g,b;if(t<=66){r=255;g=99.47*Math.log(t)-161.12;b=t<=19?0:138.52*Math.log(t-10)-305.04}else{r=329.70*Math.pow(t-60,-.1332);g=288.12*Math.pow(t-60,-.0755);b=255}return '#'+[r,g,b].map(x=>Math.round(clamp(x,0,255)).toString(16).padStart(2,'0')).join('')}
function ensure(o){if(!o||o.kind!=='light')return false;let changed=false;if(!profiles[o.fixtureType]){o.fixtureType='par';changed=true}const p=get(o.fixtureType),d={...p.d,rotation:0,iris:100,cct:3200,colorMode:p.color==='white'?'white':p.color==='rgb'?'rgb':'fixed',leftShutter:0,rightShutter:0,topShutter:0,bottomShutter:0,gobo:'open'};
for(const [k,v] of Object.entries(d)){const key=k==='hex'?'lightColor':k==='range'?'beamRange':k==='softness'?'edgeSoftness':k;if(o[key]===undefined||o[key]===null){o[key]=v;changed=true}}
return changed}
function apply(o,id){const old=get(o.fixtureType).name,name=o.name;Object.assign(o,{fixtureType:id});for(const k of ['pan','tilt','beamAngle','beamRange','intensity','lightColor','edgeSoftness','iris','cct','colorMode','leftShutter','rightShutter','topShutter','bottomShutter','gobo'])delete o[k];ensure(o);if(!name||name==='Lighting fixture'||name===old)o.name=get(id).name;return o}
function limits(o,k){const p=get(o.fixtureType);return ({rotation:[0,360],pan:[0,360],tilt:[0,89],beamAngle:p.beam,beamRange:[1,60],intensity:[0,100],iris:[5,100],cct:p.cct||[2700,6500],edgeSoftness:[0,100],leftShutter:[0,45],rightShutter:[0,45],topShutter:[0,45],bottomShutter:[0,45]})[k]||null}
function set(o,k,v){ensure(o);if(k==='fixtureType'){if(!profiles[v])return false;apply(o,v);return true}
 if(k==='lightColor'){o.lightColor=rgb(v);o.colorMode='rgb';return true}
 if(k==='colorMode'){if(!['rgb','white','fixed'].includes(v))return false;o.colorMode=v;return true}
 if(k==='gobo'){o.gobo=['open','dots','bars'].includes(v)?v:'open';return true}
 const lim=limits(o,k);if(!lim)return false;o[k]=clamp(num(v,lim[0]),...lim);return true}
function effectiveColor(o){return o.colorMode==='white'&&get(o.fixtureType).cct?kelvin(o.cct):rgb(o.lightColor)}
function icon(type){const d={
 par:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="4"/>',
 fresnel:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="2"/>',
 profile:'<path d="M3 8h6l3-3h7v14h-7l-3-3H3z"/><path d="M14 9v6"/>',
 movingWash:'<path d="M8 20h8M7 9v5q0 5 5 5t5-5V9"/><circle cx="12" cy="7" r="5"/>',
 movingSpot:'<path d="M8 20h8M7 9v5q0 5 5 5t5-5V9"/><path d="M8 5h8l3 5-7 3-7-3z"/>',
 batten:'<rect x="2" y="8" width="20" height="8" rx="2"/><path d="M6 10v4m4-4v4m4-4v4m4-4v4"/>',
 blinder:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="10" r="2"/><circle cx="16" cy="10" r="2"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/>',
 followspot:'<path d="M3 8l13-3 5 6-5 6-13-3z"/><path d="M12 16v5M7 21h10"/>'
 }[type]||'<circle cx="12" cy="12" r="6"/>';
 return '<svg class="sp-fixture-icon" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'+d+'</svg>'}
function pick(choose){const old=document.querySelector('#sp-fixture-picker');if(old)old.remove();
 const dlg=document.createElement('dialog');dlg.id='sp-fixture-picker';dlg.className='sp-fixture-picker';
 dlg.innerHTML='<header><span>FIXTURE LIBRARY</span><button type="button" aria-label="Close">×</button><h2>Choose a light</h2><p>Each family has its own model, beam shape and adjustable capabilities.</p></header><div class="sp-fixture-grid">'+order.map(k=>'<button type="button" data-profile="'+k+'">'+icon(k)+'<span><strong>'+clean(get(k).name)+'</strong><small>'+clean(get(k).detail)+'</small></span><b>+</b></button>').join('')+'</div><footer>Illustrative profiles. Manufacturer-specific ranges and photometry can be added later.</footer>';
 document.body.append(dlg);dlg.querySelector('header button').onclick=()=>dlg.close();dlg.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{dlg.close();choose(b.dataset.profile)});dlg.addEventListener('close',()=>dlg.remove(),{once:true});dlg.showModal()}
function mountInspector(el,o,onChange){if(!o||el.querySelector('.sp-optics'))return;ensure(o);const p=o.kind==='light'?get(o.fixtureType):null;
 const block=document.createElement('section');block.className='sp-optics';
 const field=(k,label,step=1,unit='°')=>{const lim=limits(o,k);return '<label>'+label+'<span class="sp-optic-input"><input type="number" data-optic="'+k+'" min="'+lim[0]+'" max="'+lim[1]+'" step="'+step+'" value="'+num(o[k])+'"><small>'+unit+'</small></span></label>'};
 const range=(k,label,min,max,unit)=>'<label class="sp-optic-range"><span>'+label+'</span><output data-value="'+k+'">'+num(o[k])+unit+'</output><input type="range" data-optic="'+k+'" min="'+min+'" max="'+max+'" step="1" value="'+num(o[k])+'"></label>';
 const hdr=p?'<div class="sp-optic-head">'+icon(o.fixtureType)+'<span><strong>'+clean(p.name)+'</strong><small>'+clean(p.detail)+'</small></span></div><label class="sp-optic-choice">Fixture profile<select data-optic="fixtureType">'+order.map(k=>'<option value="'+k+'" '+(k===o.fixtureType?'selected':'')+'>'+clean(get(k).name)+'</option>').join('')+'</select></label>':'';
 const axes='<h4>Direction</h4><div class="sp-optic-fields">'+field('rotation','Fixture rotation')+(p?field('pan','Pan')+field('tilt','Tilt down')+field('beamRange','Throw range',.5,'m'):'')+'</div>';
 const shutter=p?.shutters?'<details><summary>Framing shutters</summary><div class="sp-optic-fields">'+['leftShutter','rightShutter','topShutter','bottomShutter'].map((k,i)=>field(k,['Left','Right','Top','Bottom'][i],1,'%')).join('')+'</div></details>':'';
 const optical=p?'<h4>Beam & aperture</h4>'+range('beamAngle','Beam / zoom',...p.beam,'°')+(p.iris?range('iris','Iris opening',5,100,'%'):'')+range('edgeSoftness','Edge softness',0,100,'%')+shutter+(p.gobo?'<label class="sp-optic-choice">Gobo<select data-optic="gobo"><option value="open">Open</option><option value="dots">Dot pattern</option><option value="bars">Bar pattern</option></select></label>':''):'';
 const color=p?'<h4>Colour & intensity</h4>'+(p.color==='rgb'?'<div class="sp-optic-modes"><button type="button" data-mode="rgb">RGB colour</button><button type="button" data-mode="white">White / CCT</button></div>':'')+(p.color==='rgb'&&o.colorMode!=='white'?'<label class="sp-optic-colour">Beam colour<input data-optic="lightColor" type="color" value="'+rgb(o.lightColor)+'"></label><div class="sp-optic-swatches">'+palette.map(c=>'<button type="button" data-swatch="'+c+'" style="background:'+c+'" aria-label="Set beam colour '+c+'"></button>').join('')+'</div>':'')+(p.cct&&o.colorMode==='white'?range('cct','Colour temperature',...p.cct,' K'):'')+range('intensity','Dimmer',0,100,'%')+'<p class="sp-optic-note">Visual planning only, not photometric or electrical simulation.</p>':'';
 block.innerHTML=hdr+axes+optical+color;el.append(block);
 const change=(k,v,refresh)=>{if(!set(o,k,v))return;onChange(k,refresh)};
 block.querySelectorAll('[data-optic]').forEach(input=>{
 const type=input.getAttribute('type');input.addEventListener(type==='range'||type==='color'?'input':'change',()=>{const k=input.dataset.optic;change(k,input.value,k==='fixtureType'||k==='gobo');const output=block.querySelector('[data-value="'+k+'"]');if(output)output.textContent=input.value+(k==='cct'?' K':['intensity','iris','edgeSoftness'].includes(k)?'%':'°')})
 });
 block.querySelectorAll('[data-swatch]').forEach(b=>b.onclick=()=>change('lightColor',b.dataset.swatch,true));
 block.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>change('colorMode',b.dataset.mode,true));
 if(p?.gobo)block.querySelector('[data-optic="gobo"]').value=o.gobo||'open';
 block.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===o.colorMode));
}
function build3D(T,o,group,add,beams){ensure(o);const p=get(o.fixtureType),color=effectiveColor(o);
 const shell=new T.MeshStandardMaterial({color:0x56717b,metalness:.46,roughness:.46}),metal=new T.MeshStandardMaterial({color:0x1f3035,roughness:.4,metalness:.6}),lens=new T.MeshBasicMaterial({color,transparent:true,opacity:.9});
 const pivot=new T.Group();pivot.rotation.order='YXZ';pivot.rotation.y=-num(o.pan)*Math.PI/180;pivot.rotation.x=-num(o.tilt)*Math.PI/180;group.add(pivot);
 const mesh=(g,m,x=0,y=0,z=0,fixed=false)=>{const obj=add(new T.Mesh(g,m));if(!fixed)pivot.add(obj);obj.position.set(x,y,z);return obj};
 const can=(r=.23)=>{const head=mesh(new T.CylinderGeometry(r*.9,r,.5,24),shell);head.rotation.x=Math.PI/2;mesh(new T.CircleGeometry(r*.74,30),lens,0,0,-.26);mesh(new T.TorusGeometry(r*.92,.025,8,30),metal,0,0,-.265)};
 if(o.fixtureType==='par')can(.24);
 else if(o.fixtureType==='fresnel'){can(.29);for(let i=0;i<3;i++)mesh(new T.TorusGeometry(.07+i*.06,.007,6,32),metal,0,0,-.267)}
 else if(o.fixtureType==='profile'||o.fixtureType==='followspot'){mesh(new T.BoxGeometry(.46,.39,.44),shell,0,0,.15);const barrel=mesh(new T.CylinderGeometry(.16,.22,.7,20),metal,0,0,-.4);barrel.rotation.x=Math.PI/2;mesh(new T.CircleGeometry(.14,28),lens,0,0,-.76)}
 else if(p.moving){mesh(new T.CylinderGeometry(.33,.35,.15,22),metal,0,-.35,0,true);mesh(new T.BoxGeometry(.08,.5,.12),shell,-.29,.02,0,true);mesh(new T.BoxGeometry(.08,.5,.12),shell,.29,.02,0,true);mesh(new T.SphereGeometry(o.fixtureType==='movingWash'?.28:.23,22,14),shell,0,.04,-.1);mesh(new T.CircleGeometry(.17,24),lens,0,.04,-.365)}
 else if(o.fixtureType==='batten'){mesh(new T.BoxGeometry(1.5,.20,.29),shell);for(let i=0;i<8;i++)mesh(new T.CircleGeometry(.055,14),lens,-.59+i*.17,0,-.152)}
 else if(o.fixtureType==='blinder'){mesh(new T.BoxGeometry(.89,.54,.22),shell);for(let x of [-.2,.2])for(let y of [-.13,.13])mesh(new T.CircleGeometry(.11,18),lens,x,y,-.125)}
 if(!beams||num(o.intensity)<=0)return;
 const down=num(o.tilt,60)*Math.PI/180,yaw=num(o.pan)*Math.PI/180;
 const direction=new T.Vector3(Math.sin(yaw)*Math.cos(down),-Math.sin(down),-Math.cos(yaw)*Math.cos(down)).normalize();
 const height=Math.max(.17,num(o.z)),range=clamp(num(o.beamRange,10),1,60),floorDist=direction.y<-.01?height/-direction.y:Infinity,length=Math.min(range,floorDist),iris=p.iris?num(o.iris,100)/100:1;
 const radius=Math.tan(num(o.beamAngle,p.d.beamAngle)*Math.PI/360)*length*iris;
 if(length<.05||radius<.001)return;
 let geometry;
 if(p.shape==='square'){const l=p.shutters?num(o.leftShutter)/100:0,r=p.shutters?num(o.rightShutter)/100:0,t=p.shutters?num(o.topShutter)/100:0,b=p.shutters?num(o.bottomShutter)/100:0;
  geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-radius*(1-l),-length,-radius*(1-b),radius*(1-r),-length,-radius*(1-b),radius*(1-r),-length,radius*(1-t),-radius*(1-l),-length,radius*(1-t)],3));geometry.setIndex([0,1,2,0,2,3,0,3,4,0,4,1]);geometry.computeVertexNormals()}
 else{geometry=new T.ConeGeometry(radius,length,32,1,true);if(p.shape==='wide')geometry.scale(2.7,1,1)}
 const beam=new T.Mesh(geometry,new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:.06+.15*num(o.intensity)/100,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));beam.userData.noPick=true;beam.position.copy(direction.clone().multiplyScalar(length/2));beam.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),direction);group.add(beam);
 const arrow=new T.ArrowHelper(direction,new T.Vector3(),Math.min(1.2,length),new T.Color(color),.12,.07);group.add(arrow);
 if(floorDist<=range){const mark=new T.Mesh(new T.CircleGeometry(Math.max(.04,radius),40),new T.MeshBasicMaterial({color,transparent:true,opacity:.04+.10*num(o.intensity)/100,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));mark.rotation.x=-Math.PI/2;mark.position.copy(direction.clone().multiplyScalar(length));mark.position.y+=-height+.025;mark.userData.noPick=true;group.add(mark)}
 if(p.gobo&&o.gobo!=='open'&&floorDist<=range){
  const origin=direction.clone().multiplyScalar(length);
  if(o.gobo==='dots'){for(let i=0;i<7;i++){const theta=i*Math.PI*2/7,spot=new T.Mesh(new T.CircleGeometry(Math.max(.04,radius*.11),12),new T.MeshBasicMaterial({color,transparent:true,opacity:.24*num(o.intensity)/100,depthWrite:false,blending:T.AdditiveBlending}));spot.rotation.x=-Math.PI/2;spot.position.copy(origin).add(new T.Vector3(Math.cos(theta)*radius*.52,-height+.05,Math.sin(theta)*radius*.52));spot.userData.noPick=true;group.add(spot)}}
  else{for(let i=-1;i<=1;i++){const spot=new T.Mesh(new T.PlaneGeometry(Math.max(.05,radius*.18),Math.max(.08,radius*1.5)),new T.MeshBasicMaterial({color,transparent:true,opacity:.23*num(o.intensity)/100,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));spot.rotation.x=-Math.PI/2;spot.position.copy(origin).add(new T.Vector3(i*radius*.5,-height+.05,0));spot.userData.noPick=true;group.add(spot)}}
 }
}
window.PhaenomenonFixtures={profiles,order,get,ensure,apply,set,pick,icon,mountInspector,build3D,effectiveColor};
})();