/* A deterministic constellation of concepts projected from 3D. No dependencies. */
window.KBGraph3D={mount(root,{nodes,stages,focusId,onOpen,escapeHtml,statusText}){
  const esc=escapeHtml,byId=new Map(nodes.map(n=>[n.id,n])),groups=stages.filter(s=>nodes.some(n=>n.stage===s.id));
  const symbols={math:'◇',ml:'⬡',dl:'◎',vision:'▱',rl:'△',tasks:'▦',modern:'✧',research:'⌖'};
  const glyphs={'math-vectors':'↗','math-dot':'·','math-matmul':'×','math-functions':'ƒ','math-derivative':'∂','math-chain':'∘','math-probability':'P','math-statistics':'μ','ml-problem':'?','ml-split':'⋮','ml-linear':'／','ml-loss':'L','ml-gradient':'∇','ml-logistic':'σ','ml-knn':'k','ml-trees':'⑂','ml-unsupervised':'∴','ml-overfit':'λ','ml-metrics':'%','torch-tensors':'T','dl-neuron':'σ','dl-mlp':'⋮','dl-backprop':'∇','dl-softmax':'S','dl-dataloader':'≡','dl-training':'↻','dl-optimizers':'η','dl-regularization':'λ','cv-convolution':'⊛','cv-padding':'↔','cv-channels':'C','cv-pooling':'↓','cv-augmentation':'↺','cv-lenet':'N','cv-resnet':'+','cv-transfer':'↗'};
  root.innerHTML=`<div class="atlas-layout"><div class="atlas-scene"><canvas id="atlas-canvas" tabindex="0" aria-label="三维知识网络。菱形为数学，六边形为机器学习，轨道节点为深度学习，叠层节点为CNN。拖动旋转，滚轮缩放，点击聚焦，双击阅读；也可使用下方选择框。"></canvas><div class="atlas-hud"><span class="live-dot"></span><span>知识星群</span><span id="atlas-count">${nodes.length} CONCEPTS</span></div><div class="atlas-controls"><button class="button small" id="atlas-motion">暂停旋转</button><button class="button small" id="atlas-reset">复位视角</button><button class="button small" id="atlas-in" aria-label="放大知识网络">＋</button><button class="button small" id="atlas-out" aria-label="缩小知识网络">−</button></div><div class="atlas-hint">拖动探索 · 滚轮缩放 · 点击看联系 · 双击阅读</div></div><aside class="atlas-detail"><div class="eyebrow">CONCEPT OBSERVATORY</div><div id="atlas-selection" aria-live="polite"></div><label class="atlas-select-label" for="atlas-node-select">定位知识点</label><select id="atlas-node-select"><option value="">选择一个节点…</option>${nodes.map(n=>`<option value="${esc(n.id)}">${esc(n.title)}</option>`).join('')}</select><div class="atlas-legend">${groups.map(s=>`<span><b style="color:${s.color}">${symbols[s.id]||'◇'}</b>${esc(s.title)}</span>`).join('')}</div><p class="atlas-help">形状与颜色区分章节，大小表示当前图中的先修连接数量。实线连先修，选中后的金色虚线连关联；虚线轮廓表示正文待编写，✓ 表示练习通过。第三轮选修单独查看。</p></aside></div>`;
  const $=s=>root.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d'),scene=$('.atlas-scene'),edges=[];
  nodes.forEach(n=>n.prerequisites.forEach(p=>{if(byId.has(p))edges.push([p,n.id])}));
  const degree=new Map(nodes.map(n=>[n.id,edges.filter(e=>e.includes(n.id)).length])),positions=new Map(),centers=[];
  let width=0,height=0,dpr=1,yaw=.12,pitch=-.10,zoom=1,selected=byId.has(focusId)?focusId:null,hover=null,drag=null,moved=false,disposed=false,frame=0,last=0,phase=0,projected=[],playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,extentX=500,extentY=360;
  function layout(){
    positions.clear();centers.length=0;const narrow=width<600,anchors=new Map();
    groups.forEach((s,i)=>{
      const angle=-2.5+i*2.399963,c=groups.length===1?{x:0,y:0,z:0}:{x:Math.cos(angle)*(narrow?110:290),y:Math.sin(angle)*(narrow?380:180),z:Math.sin(i*1.7)*90};anchors.set(s.id,c);
      nodes.filter(n=>n.stage===s.id).forEach((n,j)=>{const a=j*2.399963+.4*i,r=45+Math.sqrt(j)*46;positions.set(n.id,{n,x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r,z:c.z+Math.sin(j*1.9)*62,color:s.color})});
    });
    // Repulsion and topology springs retain a constellation rather than rows.
    const ps=[...positions.values()];
    for(let step=0;step<220;step++){
      const forces=new Map(ps.map(p=>[p.n.id,{x:0,y:0}]));
      for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){
        const a=ps[i],b=ps[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.max(1,Math.hypot(dx,dy)),f=Math.min(12,2200/(d*d));
        forces.get(a.n.id).x+=dx/d*f;forces.get(a.n.id).y+=dy/d*f;forces.get(b.n.id).x-=dx/d*f;forces.get(b.n.id).y-=dy/d*f;
      }
      edges.forEach(([from,to])=>{const a=positions.get(from),b=positions.get(to),dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),f=(d-(a.n.stage===b.n.stage?115:240))*.009;forces.get(from).x+=dx/d*f;forces.get(from).y+=dy/d*f;forces.get(to).x-=dx/d*f;forces.get(to).y-=dy/d*f});
      ps.forEach(p=>{const c=anchors.get(p.n.stage),f=forces.get(p.n.id),cool=1-step/290;p.x+=(f.x+(c.x-p.x)*.006)*cool;p.y+=(f.y+(c.y-p.y)*.006)*cool});
    }
    const midX=(Math.min(...ps.map(p=>p.x))+Math.max(...ps.map(p=>p.x)))/2,midY=(Math.min(...ps.map(p=>p.y))+Math.max(...ps.map(p=>p.y)))/2;
    ps.forEach(p=>{p.x=(p.x-midX)*(narrow?.75:1);p.y-=midY});extentX=Math.max(...ps.map(p=>Math.abs(p.x)))+85;extentY=Math.max(...ps.map(p=>Math.abs(p.y)))+70;
    groups.forEach(s=>{const ns=ps.filter(p=>p.n.stage===s.id);centers.push({x:ns.reduce((a,p)=>a+p.x,0)/ns.length,y:Math.min(...ns.map(p=>p.y))-50,z:0,title:s.title,color:s.color})});
  }
  function select(id){
    selected=id;$('#atlas-node-select').value=id||'';const n=byId.get(id);
    if(!n){$('#atlas-selection').innerHTML='<h2>从一个概念，发现一片联系。</h2><p>点亮任意节点，查看它的先修、后续与相关知识。网络中的连线表示知识关系。</p>';draw();return}
    const pre=n.prerequisites.filter(p=>byId.has(p)),next=nodes.filter(m=>m.prerequisites.includes(id));
    $('#atlas-selection').innerHTML=`<span class="pill">${n.available?'有正文 · '+esc(statusText(n.id)):'正文待编写'}</span><h2>${esc(n.title)}</h2><p>${esc(n.summary)}</p><button class="button primary" id="atlas-open">打开知识点 ↗</button><div class="atlas-neighbors"><h3>先修 ${pre.length} · 后续 ${next.length}</h3>${pre.slice(0,4).map(p=>`<button data-focus="${p}">← ${esc(byId.get(p).title.split('：')[0])}</button>`).join('')}${next.slice(0,4).map(m=>`<button data-focus="${m.id}">${esc(m.title.split('：')[0])} →</button>`).join('')}${!pre.length&&!next.length?'<p>当前范围未显示其他先修；可打开正文查看跨轮次联系。</p>':''}</div>`;
    $('#atlas-open').onclick=()=>onOpen(id);root.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>select(b.dataset.focus));draw();
  }
  function project(p){const x=p.x*Math.cos(yaw)-p.z*Math.sin(yaw),z1=p.x*Math.sin(yaw)+p.z*Math.cos(yaw),y=p.y*Math.cos(pitch)-z1*Math.sin(pitch),z=p.y*Math.sin(pitch)+z1*Math.cos(pitch),perspective=1600/(1600+z),scale=Math.min((width-70)/(extentX*2),(height-180)/(extentY*2))*zoom;return {...p,x:width/2+x*scale*perspective,y:height/2-4+y*scale*perspective,z,scale:perspective*scale}}
  function polygon(x,y,r,sides,rotation){ctx.beginPath();for(let i=0;i<sides;i++){const a=rotation+i*Math.PI*2/sides,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()}
  function shape(p,r){if(['math','vision'].includes(p.n.stage))polygon(p.x,p.y,r,4,-Math.PI/2);else if(p.n.stage==='ml')polygon(p.x,p.y,r,6,Math.PI/6);else if(p.n.stage==='rl')polygon(p.x,p.y,r,3,-Math.PI/2);else if(['modern','research'].includes(p.n.stage))polygon(p.x,p.y,r,4,0);else{ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2)}}
  function curve(a,b){const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),bend=Math.min(24,d*.1);return{x:(a.x+b.x)/2-dy/d*bend,y:(a.y+b.y)/2+dx/d*bend}}
  function draw(){
    if(disposed||!ctx||!width)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const bg=ctx.createRadialGradient(width*.48,height*.45,10,width*.48,height*.45,Math.max(width,height)*.7);bg.addColorStop(0,'#173b42');bg.addColorStop(1,'#081a27');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    for(let i=0;i<110;i++){ctx.fillStyle=`rgba(178,210,206,${.06+(i%3)*.04})`;ctx.beginPath();ctx.arc((i*137.509%997)/997*width,(i*213.17%991)/991*height,i%7===0?1:.5,0,Math.PI*2);ctx.fill()}
    projected=[...positions.values()].map(project).sort((a,b)=>b.z-a.z);const ps=new Map(projected.map(p=>[p.n.id,p])),focus=hover||selected,neighbors=new Set();
    if(focus){edges.forEach(([a,b])=>{if(a===focus)neighbors.add(b);if(b===focus)neighbors.add(a)});byId.get(focus).related.forEach(id=>neighbors.add(id))}
    centers.map(project).forEach(p=>{const glow=ctx.createRadialGradient(p.x,p.y+65,0,p.x,p.y+65,160);glow.addColorStop(0,p.color+'0d');glow.addColorStop(1,p.color+'00');ctx.fillStyle=glow;ctx.fillRect(p.x-170,p.y-110,340,340);ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillStyle=p.color+'99';ctx.textAlign='center';ctx.fillText(p.title,p.x,p.y)});
    edges.forEach(([from,to],i)=>{
      const a=ps.get(from),b=ps.get(to),active=from===focus||to===focus,c=curve(a,b);ctx.strokeStyle=active?'#b8e7cabb':focus?'#8cb0a61c':'#8cbeb15a';ctx.lineWidth=active?1.7:.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(c.x,c.y,b.x,b.y);ctx.stroke();
      if(active){const t=.79,x=(1-t)**2*a.x+2*(1-t)*t*c.x+t*t*b.x,y=(1-t)**2*a.y+2*(1-t)*t*c.y+t*t*b.y,angle=Math.atan2(b.y-c.y,b.x-c.x);ctx.fillStyle='#cee8ca';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6*Math.cos(angle-.45),y-6*Math.sin(angle-.45));ctx.lineTo(x-6*Math.cos(angle+.45),y-6*Math.sin(angle+.45));ctx.fill()}
      if(playing&&(!focus||active)&&i%3===0){const t=(phase*.09+i*.137)%1,x=(1-t)**2*a.x+2*(1-t)*t*c.x+t*t*b.x,y=(1-t)**2*a.y+2*(1-t)*t*c.y+t*t*b.y;ctx.fillStyle='#cbe7cb88';ctx.beginPath();ctx.arc(x,y,1.7,0,Math.PI*2);ctx.fill()}
    });
    if(focus&&ps.has(focus)){const a=ps.get(focus);ctx.setLineDash([3,6]);ctx.lineWidth=1;ctx.strokeStyle='#e3b77caa';for(const id of byId.get(focus).related){const b=ps.get(id);if(!b)continue;const c=curve(a,b);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(c.x,c.y,b.x,b.y);ctx.stroke()}ctx.setLineDash([])}
    const labels=[];
    function paint(p){
      const id=p.n.id,active=id===focus,near=neighbors.has(id),base=16+Math.min(7,degree.get(id)*1.1),r=Math.max(7,base*Math.min(1.25,p.scale))*(active?1.18:1);p.radius=r;p.label=null;ctx.globalAlpha=focus&&!active&&!near?.32:Math.max(.7,Math.min(1,1-p.z/1800));
      const halo=ctx.createRadialGradient(p.x,p.y,r*.25,p.x,p.y,r*(active?3:2));halo.addColorStop(0,p.color+(active?'55':'22'));halo.addColorStop(1,p.color+'00');ctx.fillStyle=halo;ctx.fillRect(p.x-r*3,p.y-r*3,r*6,r*6);ctx.lineWidth=active?2:1.25;ctx.strokeStyle=active?'#f2e1ae':p.color;
      if(p.n.stage==='vision'){ctx.globalAlpha*=.7;shape({...p,y:p.y-5},r);ctx.stroke();shape({...p,y:p.y+5},r);ctx.stroke();ctx.globalAlpha=focus&&!active&&!near?.32:1}
      const fill=ctx.createLinearGradient(p.x-r,p.y-r,p.x+r,p.y+r);fill.addColorStop(0,active?'#dae8bd':p.color+'9c');fill.addColorStop(1,active?'#9acfc0':'#143640');ctx.fillStyle=fill;if(!p.n.available)ctx.setLineDash([3,3]);shape(p,r);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      if(p.n.stage==='dl'){ctx.strokeStyle=active?'#eadb9dcc':p.color+'99';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(p.x,p.y,r*1.45,r*.62,-.6,0,Math.PI*2);ctx.stroke()}
      ctx.fillStyle=active?'#183a3d':'#edf5e6';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`500 ${Math.max(9,r*.8)}px Georgia,"Microsoft YaHei",serif`;ctx.fillText(glyphs[id]||symbols[p.n.stage]||'·',p.x,p.y+.5);
      if(statusText(id)==='练习通过'){ctx.fillStyle='#d4e7a6';ctx.beginPath();ctx.arc(p.x+r*.8,p.y-r*.7,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#244c40';ctx.font='8px sans-serif';ctx.fillText('✓',p.x+r*.8,p.y-r*.7)}
      if(active){ctx.strokeStyle='#efdfa688';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(p.x,p.y,r+7,phase*.2,phase*.2+Math.PI*1.5);ctx.stroke()}ctx.globalAlpha=1;ctx.textBaseline='alphabetic';labels.push({p,r,active,near});
    }
    projected.filter(p=>p.n.id!==focus).forEach(paint);if(ps.has(focus))paint(ps.get(focus));
    // Plain labels around nodes. Avoid existing labels and nearby node shapes.
    const occupied=[];
    labels.sort((a,b)=>Number(b.active)-Number(a.active)||Number(b.near)-Number(a.near)||degree.get(b.p.n.id)-degree.get(a.p.n.id)).forEach(({p,r,active,near})=>{
      if(width<500&&nodes.length>12&&!active&&!near&&degree.get(p.n.id)<3)return;
      const text=p.n.title.split('：')[0],font=active?13:width<600?9:11;ctx.font=`${active?'600 ':''}${font}px "Microsoft YaHei",sans-serif`;const w=ctx.measureText(text).width;
      const candidates=[{x:p.x-w/2,y:p.y+r+font+7},{x:p.x-w/2,y:p.y-r-8},{x:p.x+r+8,y:p.y+font/3},{x:p.x-r-w-8,y:p.y+font/3}];
      const spot=candidates.find(c=>c.x>8&&c.x+w<width-8&&c.y>65&&c.y<height-80&&!occupied.some(b=>c.x<b.x+b.w+5&&c.x+w+5>b.x&&c.y-font<b.y+b.h+3&&c.y+3>b.y)&&!projected.some(q=>q!==p&&Math.abs(q.x-(c.x+w/2))<w/2+q.radius&&Math.abs(q.y-(c.y-font/2))<font/2+q.radius));
      const c=spot||(active?candidates[0]:null);if(!c)return;ctx.globalAlpha=focus&&!active&&!near?.3:1;ctx.textAlign='left';ctx.strokeStyle='#102b36';ctx.lineWidth=4;ctx.lineJoin='round';ctx.strokeText(text,c.x,c.y);ctx.fillStyle=active?'#f5e5b5':near?'#e6f0d7':'#bcd2c8';ctx.fillText(text,c.x,c.y);ctx.globalAlpha=1;p.label={x:c.x,y:c.y-font,w,h:font+5};occupied.push(p.label);
    });
  }
  function resize(){width=scene.clientWidth;height=scene.clientHeight;layout();dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;draw()}
  function hit(e){const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,order=[...projected].reverse(),active=projected.find(p=>p.n.id===(hover||selected));if(active)order.unshift(active);return order.find(p=>Math.hypot(x-p.x,y-p.y)<=p.radius+7||(p.label&&x>=p.label.x&&x<=p.label.x+p.label.w&&y>=p.label.y&&y<=p.label.y+p.label.h))?.n.id}
  function setMotion(value){playing=value;$('#atlas-motion').textContent=playing?'暂停旋转':'缓慢旋转';last=0;if(playing&&!frame)frame=requestAnimationFrame(tick);else if(!playing&&frame){cancelAnimationFrame(frame);frame=0}draw()}
  function tick(time){frame=0;if(disposed||!playing)return;const dt=Math.min(last?time-last:16,50);if(!document.hidden&&!drag&&!hover){yaw+=dt*.000025;phase+=dt*.001;draw()}last=time;frame=requestAnimationFrame(tick)}
  canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};moved=false;canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>4)moved=true;yaw+=dx*.006;pitch=Math.max(-1.1,Math.min(1.1,pitch+dy*.005));drag.x=e.clientX;drag.y=e.clientY;draw()}else{const h=hit(e);if(h!==hover){hover=h;canvas.style.cursor=h?'pointer':'grab';draw()}}};
  canvas.onpointerup=e=>{if(!moved){const id=hit(e);if(id){setMotion(false);select(id)}}drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)};
  canvas.onpointercancel=()=>{drag=null};canvas.onpointerleave=()=>{hover=null;draw()};canvas.ondblclick=e=>{const id=hit(e);if(id)onOpen(id)};canvas.onwheel=e=>{e.preventDefault();zoom=Math.max(.45,Math.min(2.8,zoom*Math.exp(-e.deltaY*.001)));draw()};
  canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','+','-'].includes(e.key)){e.preventDefault();if(e.key===' ')setMotion(!playing);if(e.key==='ArrowLeft')yaw-=.15;if(e.key==='ArrowRight')yaw+=.15;if(e.key==='ArrowUp')pitch=Math.max(-1.1,pitch-.1);if(e.key==='ArrowDown')pitch=Math.min(1.1,pitch+.1);if(e.key==='+')zoom=Math.min(2.8,zoom*1.15);if(e.key==='-')zoom=Math.max(.45,zoom/1.15);draw()}};
  $('#atlas-motion').onclick=()=>setMotion(!playing);$('#atlas-reset').onclick=()=>{yaw=.12;pitch=-.10;zoom=1;hover=null;draw()};$('#atlas-in').onclick=()=>{zoom=Math.min(2.8,zoom*1.2);draw()};$('#atlas-out').onclick=()=>{zoom=Math.max(.45,zoom/1.2);draw()};$('#atlas-node-select').onchange=e=>{setMotion(false);select(e.target.value||null)};
  const observer=new ResizeObserver(resize);observer.observe(scene);select(selected);resize();setMotion(playing);
  return()=>{disposed=true;observer.disconnect();if(frame)cancelAnimationFrame(frame)};
}};
