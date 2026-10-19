/* Three-dimensional coordinates projected to Canvas 2D. No WebGL/CDN dependency. */
window.KBGraph3D={mount(root,{nodes,stages,focusId,onOpen,escapeHtml,statusText}){
  const esc=escapeHtml,byId=new Map(nodes.map(n=>[n.id,n]));
  root.innerHTML=`<div class="atlas-layout"><div class="atlas-scene"><canvas id="atlas-canvas" tabindex="0" aria-label="三维知识卡网络。拖动旋转，滚轮缩放，方向键旋转，空格暂停。也可使用下方知识点列表。"></canvas><div class="atlas-hud"><span class="live-dot"></span><span>知识卡图</span><span id="atlas-count">${nodes.length} NODES</span></div><div class="atlas-controls"><button class="button small" id="atlas-motion">暂停旋转</button><button class="button small" id="atlas-reset">复位视角</button><button class="button small" id="atlas-in" aria-label="放大知识网络">＋</button><button class="button small" id="atlas-out" aria-label="缩小知识网络">−</button></div><div class="atlas-hint">拖动旋转 · 滚轮缩放 · 点击聚焦 · 双击阅读</div></div><aside class="atlas-detail"><div class="eyebrow">CONCEPT OBSERVATORY</div><div id="atlas-selection" aria-live="polite"></div><label class="atlas-select-label" for="atlas-node-select">定位知识点</label><select id="atlas-node-select"><option value="">选择一个节点…</option>${nodes.map(n=>`<option value="${esc(n.id)}">${esc(n.title)}</option>`).join('')}</select><div class="atlas-legend">${stages.filter(s=>nodes.some(n=>n.stage===s.id)).map(s=>`<span><i style="background:${s.color}"></i>${esc(s.title)}</span>`).join('')}</div><p class="atlas-help">实线为先修联系，焦点的虚线为关联知识。实线卡有正文，虚线卡正文待编写；卡片上的状态来自个人进度。深浅和大小只表示透视远近，第三轮选修需单独切换。</p></aside></div>`;
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),scene=root.querySelector('.atlas-scene');
  const groups=stages.filter(s=>nodes.some(n=>n.stage===s.id));
  const positions=new Map(),centers=[];
  const maxRows=Math.max(...groups.map(s=>Math.ceil(nodes.filter(n=>n.stage===s.id).length/2)));
  let layoutColumns=groups.length,layoutRows=1;
  function layout(){positions.clear();centers.length=0;layoutColumns=width<600?Math.min(2,groups.length):groups.length;layoutRows=Math.ceil(groups.length/layoutColumns);
  groups.forEach((s,i)=>{
    const ns=nodes.filter(n=>n.stage===s.id),rows=Math.ceil(ns.length/2),center={x:((i%layoutColumns)-(layoutColumns-1)/2)*300,y:(Math.floor(i/layoutColumns)-(layoutRows-1)/2)*(maxRows*86+110),z:(i%2?1:-1)*18};
    centers.push({...center,y:center.y-(rows-1)*43-60,title:s.title,color:s.color});
    ns.forEach((n,j)=>positions.set(n.id,{n,x:center.x+(j%2?70:-70),y:center.y+(Math.floor(j/2)-(rows-1)/2)*86,z:center.z+Math.sin(j*1.8)*18,color:s.color}));
  });}
  const edges=[];nodes.forEach(n=>n.prerequisites.forEach(p=>{if(byId.has(p))edges.push([p,n.id])}));
  let width=0,height=0,dpr=1,yaw=.12,pitch=-.06,zoom=1,selected=byId.has(focusId)?focusId:null,hover=null,drag=null,moved=false,disposed=false,frame=0,last=0,projected=[],playing=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $=s=>root.querySelector(s);
  function select(id){selected=id;$('#atlas-node-select').value=id||'';const n=byId.get(id);if(!n){$('#atlas-selection').innerHTML='<h2>让概念彼此连接。</h2><p>从一个熟悉的节点出发，找到先修、应用和下一步。</p>';draw();return}const pre=n.prerequisites.filter(p=>byId.has(p)),next=nodes.filter(m=>m.prerequisites.includes(id));$('#atlas-selection').innerHTML=`<span class="pill">${n.available?'有正文 · '+esc(statusText(n.id)):'正文待编写'}</span><h2>${esc(n.title)}</h2><p>${esc(n.summary)}</p><button class="button primary" id="atlas-open">打开知识点 ↗</button><div class="atlas-neighbors"><h3>先修 ${pre.length} · 后续 ${next.length}</h3>${pre.slice(0,4).map(p=>`<button data-focus="${p}">← ${esc(byId.get(p).title.split('：')[0])}</button>`).join('')}${next.slice(0,4).map(m=>`<button data-focus="${m.id}">${esc(m.title.split('：')[0])} →</button>`).join('')}${!pre.length&&!next.length?'<p>当前范围未显示其他先修；可打开正文查看跨轮次联系。</p>':''}</div>`;$('#atlas-open').onclick=()=>onOpen(id);root.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>select(b.dataset.focus));draw()}
  function project(p){const x=p.x*Math.cos(yaw)-p.z*Math.sin(yaw),z1=p.x*Math.sin(yaw)+p.z*Math.cos(yaw),y=p.y*Math.cos(pitch)-z1*Math.sin(pitch),z=p.y*Math.sin(pitch)+z1*Math.cos(pitch);const perspective=1800/(1800+z);const scale=Math.min((width-64)/(layoutColumns*300+60),(height-170)/(layoutRows*(maxRows*86+110)+40))*zoom;return {...p,x:width/2+x*scale*perspective,y:height/2-10+y*scale*perspective,z,scale:perspective*scale}}
  function draw(){if(disposed||!ctx||!width)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);const bg=ctx.createRadialGradient(width*.5,height*.48,20,width*.5,height*.48,Math.max(width,height)*.7);bg.addColorStop(0,'#163b40');bg.addColorStop(1,'#081c28');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    for(let i=0;i<100;i++){const x=(i*137.509%997)/997*width,y=(i*213.17%991)/991*height;ctx.fillStyle=`rgba(178,210,206,${.13+(i%3)*.08})`;ctx.beginPath();ctx.arc(x,y,i%4===0?1:.55,0,Math.PI*2);ctx.fill()}
    // Subtle orbital reference lines: visual guides, not graph edges.
    ctx.strokeStyle='#86b9ae14';ctx.lineWidth=1;for(const radius of [160,260,340]){ctx.beginPath();for(let a=0;a<=Math.PI*2+.02;a+=.04){const p=project({x:Math.cos(a)*radius,y:0,z:Math.sin(a)*radius});if(a===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}ctx.stroke()}
    projected=[...positions.values()].map(project).sort((a,b)=>b.z-a.z);const ps=new Map(projected.map(p=>[p.n.id,p]));const focus=hover||selected;
    edges.forEach(([from,to])=>{const a=ps.get(from),b=ps.get(to),active=from===focus||to===focus;ctx.strokeStyle=active?'#b8e7caa6':'#8cb0a628';ctx.lineWidth=active?1.6:.7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(active){const t=.72,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,angle=Math.atan2(b.y-a.y,b.x-a.x);ctx.fillStyle='#c3ead6';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6*Math.cos(angle-.45),y-6*Math.sin(angle-.45));ctx.lineTo(x-6*Math.cos(angle+.45),y-6*Math.sin(angle+.45));ctx.fill()}});
    if(focus&&ps.has(focus)){const a=ps.get(focus);ctx.setLineDash([4,5]);ctx.strokeStyle='#e3b77c99';for(const id of byId.get(focus).related){const b=ps.get(id);if(!b)continue;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.setLineDash([])}
    centers.map(project).forEach(p=>{ctx.font='11px "Microsoft YaHei",sans-serif';ctx.fillStyle='#a9c5bc66';ctx.textAlign='center';ctx.fillText(p.title,p.x,p.y)});
    function rounded(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}
    function paintCard(p,active){
      const id=p.n.id,neighbor=focus&&(byId.get(focus).prerequisites.includes(id)||p.n.prerequisites.includes(focus)||byId.get(focus).related.includes(id));
      const scale=Math.max(.12,Math.min(1.5,p.scale))*(active?1.10:1),w=124*scale,h=58*scale,x=p.x-w/2,y=p.y-h/2;
      p.card={x,y,w,h};p.radius=h/2;
      ctx.globalAlpha=active||neighbor?1:Math.max(.58,Math.min(.95,(1000-p.z)/1100));
      if(active){ctx.shadowColor='#b5e9ce88';ctx.shadowBlur=18;ctx.fillStyle='#b5e9ce16';rounded(x-4,y-4,w+8,h+8,8);ctx.fill();ctx.shadowBlur=0}
      ctx.fillStyle=active?'#edf3df':p.n.available?'#14363f':'#0e2934';ctx.strokeStyle=active?'#d7eab8':p.color;ctx.lineWidth=active?1.7:1;
      if(!p.n.available)ctx.setLineDash([4,3]);rounded(x,y,w,h,5);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=p.color;rounded(x+5*scale,y+6*scale,17*scale,16*scale,3*scale);ctx.fill();
      ctx.textAlign='center';ctx.font=`600 ${9*scale}px "Microsoft YaHei",sans-serif`;ctx.fillStyle='#f6f8e9';
      const glyph={math:'∑',ml:'M',dl:'N',vision:'▦',rl:'R',tasks:'V',modern:'A',research:'文'}[p.n.stage]||'K';ctx.fillText(glyph,x+13.5*scale,y+17.5*scale);
      const title=p.n.title.split('：')[0],label=title.length>8?title.slice(0,7)+'…':title;
      ctx.textAlign='left';ctx.font=`${active?'600 ':''}${11*scale}px "Microsoft YaHei",sans-serif`;ctx.fillStyle=active?'#193b3d':'#e0ece1';ctx.fillText(label,x+27*scale,y+17*scale);
      ctx.strokeStyle=active?'#234e3b22':'#91bbad22';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x+7*scale,y+28*scale);ctx.lineTo(x+w-7*scale,y+28*scale);ctx.stroke();
      ctx.font=`${8*scale}px "Microsoft YaHei",sans-serif`;ctx.fillStyle=active?'#577456':'#96b3ab';ctx.fillText(p.n.available?statusText(id):'正文待编写',x+8*scale,y+42*scale);
      ctx.textAlign='right';ctx.fillText(p.n.available?'↗':'▧',x+w-8*scale,y+42*scale);ctx.globalAlpha=1;
    }
    projected.filter(p=>p.n.id!==focus).forEach(p=>paintCard(p,false));
    const top=ps.get(focus);if(top)paintCard(top,true);
  }

  function resize(){width=scene.clientWidth;height=scene.clientHeight;layout();dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;draw()}
  function hit(e){const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;const order=[...projected].reverse();const active=projected.find(p=>p.n.id===(hover||selected));if(active)order.unshift(active);return order.find(p=>p.card&&x>=p.card.x-3&&x<=p.card.x+p.card.w+3&&y>=p.card.y-3&&y<=p.card.y+p.card.h+3)?.n.id}
  function setMotion(value){playing=value;$('#atlas-motion').textContent=playing?'暂停旋转':'缓慢旋转';last=0;if(playing&&!frame)frame=requestAnimationFrame(tick);else if(!playing&&frame){cancelAnimationFrame(frame);frame=0}}
  function tick(time){frame=0;if(disposed||!playing)return;if(!document.hidden&&!drag&&!hover){yaw+=Math.min(last?(time-last):16,50)*.00009;draw()}last=time;frame=requestAnimationFrame(tick)}
  canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};moved=false;canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;yaw+=dx*.006;pitch=Math.max(-1.1,Math.min(1.1,pitch+dy*.005));drag={x:e.clientX,y:e.clientY};draw()}else{const h=hit(e);if(h!==hover){hover=h;canvas.style.cursor=h?'pointer':'grab';draw()}}};
  canvas.onpointerup=e=>{if(!moved){const id=hit(e);if(id){setMotion(false);select(id)}}drag=null;canvas.releasePointerCapture(e.pointerId)};
  canvas.onpointercancel=()=>{drag=null};canvas.onpointerleave=()=>{hover=null;draw()};canvas.ondblclick=e=>{const id=hit(e);if(id)onOpen(id)};
  canvas.onwheel=e=>{e.preventDefault();zoom=Math.max(.45,Math.min(2.8,zoom*Math.exp(-e.deltaY*.001)));draw()};
  canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','+','-'].includes(e.key)){e.preventDefault();if(e.key===' ')setMotion(!playing);if(e.key==='ArrowLeft')yaw-=.15;if(e.key==='ArrowRight')yaw+=.15;if(e.key==='ArrowUp')pitch=Math.max(-1.1,pitch-.1);if(e.key==='ArrowDown')pitch=Math.min(1.1,pitch+.1);if(e.key==='+')zoom=Math.min(2.8,zoom*1.15);if(e.key==='-')zoom=Math.max(.45,zoom/1.15);draw()}};
  $('#atlas-motion').onclick=()=>setMotion(!playing);$('#atlas-reset').onclick=()=>{yaw=.12;pitch=-.06;zoom=1;draw()};$('#atlas-in').onclick=()=>{zoom=Math.min(2.8,zoom*1.2);draw()};$('#atlas-out').onclick=()=>{zoom=Math.max(.45,zoom/1.2);draw()};$('#atlas-node-select').onchange=e=>{setMotion(false);select(e.target.value||null)};
  const observer=new ResizeObserver(resize);observer.observe(scene);select(selected);resize();setMotion(playing);
  return ()=>{disposed=true;observer.disconnect();if(frame)cancelAnimationFrame(frame)};
}};
