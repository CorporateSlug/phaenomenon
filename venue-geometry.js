/* Phaenomenon geometry: reusable venue footprints, elevation profiles and indicative floor routes.
   Coordinates are local metres, not surveyed/CAD data. All edits are local to the browser. */
(() => {
  'use strict';
  const num=(a,b=0)=>Number.isFinite(Number(a))?Number(a):b;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const round=v=>Math.round(v*100)/100;
  const point=(x,y,id)=>({id:id||`corner_${Math.random().toString(36).slice(2,9)}`,x:round(x),y:round(y)});
  const rectangle=(w,l)=>[point(0,0),point(w,0),point(w,l),point(0,l)];
  function template(name,w,l){
    const W=num(w,16),L=num(l,12);
    if(name==='L')return [[0,0],[W,0],[W,L*.46],[W*.55,L*.46],[W*.55,L],[0,L]].map(p=>point(...p));
    if(name==='U')return [[0,0],[W,0],[W,L],[W*.73,L],[W*.73,L*.43],[W*.27,L*.43],[W*.27,L],[0,L]].map(p=>point(...p));
    if(name==='angled')return [[W*.09,0],[W*.82,0],[W,L*.25],[W*.88,L*.8],[W*.63,L],[W*.12,L*.9],[0,L*.3]].map(p=>point(...p));
    return rectangle(W,L);
  }
  const area=pts=>Math.abs(pts.reduce((sum,p,i)=>{const q=pts[(i+1)%pts.length];return sum+p.x*q.y-q.x*p.y;},0))/2;
  function onSegment(p,a,b,eps=.00001){
    const cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
    return Math.abs(cross)<eps && p.x>=Math.min(a.x,b.x)-eps && p.x<=Math.max(a.x,b.x)+eps && p.y>=Math.min(a.y,b.y)-eps && p.y<=Math.max(a.y,b.y)+eps;
  }
  function contains(poly,p){
    if(!poly||poly.length<3)return false;
    let inside=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];if(onSegment(p,a,b))return true;
      if((a.y>p.y)!==(b.y>p.y) && p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }
    return inside;
  }
  const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  function crosses(a,b,c,d){
    const ab=orient(a,b,c),ab2=orient(a,b,d),cd=orient(c,d,a),cd2=orient(c,d,b);
    if((ab>1e-8&&ab2 < -1e-8||ab < -1e-8&&ab2>1e-8)&&(cd>1e-8&&cd2 < -1e-8||cd < -1e-8&&cd2>1e-8))return true;
    return false;
  }
  function valid(poly,w,l){
    if(!Array.isArray(poly)||poly.length<3||poly.length>30)return 'Use between 3 and 30 perimeter corners.';
    for(let i=0;i<poly.length;i++){
      const p=poly[i],q=poly[(i+1)%poly.length];
      if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>w||p.y>l)return 'Corners must stay within the site width and length.';
      if(Math.hypot(p.x-q.x,p.y-q.y)<.2)return 'Corners must be at least 0.2m apart.';
    }
    if(area(poly)<.5)return 'The floorplan must enclose at least 0.5m².';
    for(let i=0;i<poly.length;i++)for(let j=i+1;j<poly.length;j++){
      if(j===i+1||(i===0&&j===poly.length-1))continue;
      if(crosses(poly[i],poly[(i+1)%poly.length],poly[j],poly[(j+1)%poly.length]))return 'Walls cannot cross one another.';
    }
    return null;
  }
  function insidePosition(poly,p){
    if(contains(poly,p))return {x:round(p.x),y:round(p.y)};
    const xs=poly.map(q=>q.x),ys=poly.map(q=>q.y);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    // Find an interior anchor without assuming that the polygon is convex.
    let anchor=null,best=-Infinity;
    for(let i=0;i<=30;i++)for(let j=0;j<=30;j++){
      const c={x:minX+(maxX-minX)*(i+.5)/31,y:minY+(maxY-minY)*(j+.5)/31};
      if(!contains(poly,c))continue;
      const minD=Math.min(...poly.map((q,k)=>{
        const r=poly[(k+1)%poly.length],dx=r.x-q.x,dy=r.y-q.y,t=clamp(((c.x-q.x)*dx+(c.y-q.y)*dy)/(dx*dx+dy*dy||1),0,1);
        return Math.hypot(c.x-q.x-t*dx,c.y-q.y-t*dy);
      }));
      if(minD>best){anchor=c;best=minD;}
    }
    if(!anchor)return{x:poly[0].x,y:poly[0].y};
    // Prefer a nearby interior location along the line from the invalid point to the anchor.
    for(let t=.02;t<=1.001;t+=.02){const c={x:p.x+(anchor.x-p.x)*t,y:p.y+(anchor.y-p.y)*t};if(contains(poly,c))return{x:round(c.x),y:round(c.y)};}
    return{x:round(anchor.x),y:round(anchor.y)};
  }
  function segmentInside(poly,a,b){
    if(!contains(poly,a)||!contains(poly,b))return false;
    const distance=Math.hypot(a.x-b.x,a.y-b.y),steps=Math.max(5,Math.min(300,Math.ceil(distance/.2)));
    for(let i=0;i<=steps;i++){const t=i/steps;if(!contains(poly,{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}))return false;}
    return true;
  }
  function shortest(poly,a,b){
    if(segmentInside(poly,a,b))return [a,b];
    const nodes=[a,b,...poly],length=nodes.length,dist=Array(length).fill(Infinity),prev=Array(length).fill(-1),used=Array(length).fill(false);dist[0]=0;
    for(let iter=0;iter<length;iter++){
      let k=-1;for(let i=0;i<length;i++)if(!used[i]&&(k<0||dist[i]<dist[k]))k=i;
      if(k<0||!Number.isFinite(dist[k])||k===1)break;used[k]=true;
      for(let i=0;i<length;i++)if(i!==k&&!used[i]&&segmentInside(poly,nodes[k],nodes[i])){
        const d=dist[k]+Math.hypot(nodes[k].x-nodes[i].x,nodes[k].y-nodes[i].y);
        if(d<dist[i]){dist[i]=d;prev[i]=k;}
      }
    }
    if(!Number.isFinite(dist[1]))return null;
    const chain=[];for(let k=1;k!==-1;k=prev[k])chain.push(nodes[k]);return chain.reverse();
  }
  function normalize(venue){
    const w=num(venue.width,16),l=num(venue.length,12),h=num(venue.height,4);
    if(!venue.geometry||!Array.isArray(venue.geometry.footprint)){
      const outdoor=/courtyard|garden|outdoor|park/i.test(venue.name||'');
      venue.geometry={footprint:rectangle(w,l),kind:outdoor?'outdoor':'indoor',roof:{type:outdoor?'none':'flat',eave:h,peak:h+1.5,axis:'x',heights:{}}};
    }
    if(!venue.geometry.roof)venue.geometry.roof={type:'flat',eave:h,peak:h+1.5,axis:'x',heights:{}};
    const g=venue.geometry;
    g.kind=g.kind==='outdoor'?'outdoor':'indoor';
    if(!['none','flat','mono','gable','custom'].includes(g.roof.type))g.roof.type='flat';
    g.roof.eave=clamp(num(g.roof.eave,h),.5,40);
    g.roof.peak=clamp(num(g.roof.peak,h+1.5),.5,50);
    g.roof.axis=g.roof.axis==='y'?'y':'x';
    if(!g.roof.heights||typeof g.roof.heights!=='object')g.roof.heights={};
    g.footprint=g.footprint.map(p=>({id:p.id||`corner_${Math.random().toString(36).slice(2,9)}`,x:num(p.x),y:num(p.y)}));
    if(valid(g.footprint,w,l))g.footprint=rectangle(w,l);
    return g;
  }
  const lerp=(a,b,t)=>a+(b-a)*t;
  function height(venue,p){
    const g=normalize(venue),roof=g.roof,w=num(venue.width,16),l=num(venue.length,12),E=roof.eave,P=roof.peak;
    if(roof.type==='none')return 0;
    if(roof.type==='flat')return E;
    if(roof.type==='mono')return lerp(E,P,clamp(p[roof.axis]/(roof.axis==='x'?w:l),0,1));
    if(roof.type==='gable')return E+(P-E)*(1-Math.abs(2*clamp(p[roof.axis]/(roof.axis==='x'?w:l),0,1)-1));
    if(roof.type==='custom'){
      const pts=g.footprint;
      // IDW interpolation: vertex heights are exact at their corners.
      let weighted=0,total=0;
      for(const q of pts){const d=Math.hypot(p.x-q.x,p.y-q.y);const value=clamp(num(roof.heights[q.id],E),.5,50);if(d<.001)return value;const weight=1/(d*d*d);weighted+=weight*value;total+=weight;}
      return weighted/total;
    }
    return E;
  }
  function peakHeight(venue){const roof=normalize(venue).roof;return Math.max(num(venue.height,4),roof.eave,roof.type==='flat'||roof.type==='none'?0:roof.peak, ...Object.values(roof.heights).map(v=>num(v,0)));}
  window.PhaenomenonGeometry={rectangle,template,area,contains,valid,insidePosition,segmentInside,shortest,normalize,height,peakHeight,point,round};
})();