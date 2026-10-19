/* Offline, bounded teaching experiments. Every renderer returns a cleanup hook. */
window.KBDemos = (() => {
  const $ = (root, s) => root.querySelector(s);
  const fmt = n => Number(n.toFixed(3)).toString();
  const shell = (name, description, body) => `<section class="demo" aria-label="${name}"><div class="demo-heading"><h2>${name}</h2><span class="demo-tag">INTERACTIVE STUDY</span></div><p class="demo-description">${description}</p>${body}</section>`;
  const button = (id, text) => `<button type="button" class="button small" id="${id}">${text}</button>`;
  function dot(root) {
    root.innerHTML = shell('把线索加在一起', '固定输入 x = [1, 2, 3]，调整权重，观察每一项的贡献。', `<div class="dot-inputs">${[2,-1,.5].map((v,i)=>`<label>权重 w${i+1}<input id="dot-w${i}" type="range" min="-3" max="3" step="0.1" value="${v}" aria-label="第 ${i+1} 个权重"><output id="dot-out${i}">${v}</output></label>`).join('')}</div><svg id="dot-svg" viewBox="0 0 520 190" role="img" aria-label="三个分量对点积的正负贡献"></svg><div class="demo-readout" id="dot-result" aria-live="polite"></div><p class="demo-note">绿条为正贡献，棕条为负贡献；每条同时标注数值。这里的分数不是概率。</p>`);
    function draw(){
      const w=[0,1,2].map(i=>+$(root,`#dot-w${i}`).value), terms=w.map((v,i)=>v*(i+1));
      w.forEach((v,i)=>$(root,`#dot-out${i}`).value=fmt(v));
      let svg='<line x1="260" y1="8" x2="260" y2="155" stroke="#a9bb9a"/><text x="252" y="178" fill="#839475">0</text>';
      terms.forEach((v,i)=>{const y=20+i*46, width=Math.abs(v)*20;svg+=`<text x="12" y="${y+15}" fill="#69815a">x${i+1} × w${i+1}</text><rect x="${v<0?260-width:260}" y="${y}" width="${Math.max(width,1)}" height="25" rx="3" fill="${v<0?'#b78053':'#5a8b6d'}"/><text x="${v<0?250-width:270+width}" y="${y+17}" text-anchor="${v<0?'end':'start'}" fill="#426046">${fmt(v)}</text>`});
      $(root,'#dot-svg').innerHTML=svg;
      $(root,'#dot-result').textContent=`${terms.map(fmt).join(' + ')} = ${fmt(terms.reduce((a,b)=>a+b,0))}`;
    }
    root.querySelectorAll('input').forEach(e=>e.addEventListener('input',draw));draw();return ()=>{};
  }
  function derivative(root){
    root.innerHTML=shell('让切线告诉你变化率','拖动 x，观察 y = x² 的切线。切线只描述当前位置附近的变化。',`<div class="demo-controls"><label>x = <input id="derivative-x" type="range" min="-2.5" max="2.5" step="0.1" value="1.5" aria-label="函数上的横坐标"><output id="derivative-out">1.5</output></label></div><svg id="derivative-svg" viewBox="0 0 560 290" role="img" aria-label="平方函数与当前位置的切线"></svg><div class="demo-readout" id="derivative-result" aria-live="polite"></div><p class="demo-note">图中的切线斜率使用精确公式 f′(x)=2x。x=0 处切线水平；这是本例的最小点，其他函数的零导数点不一定是最小点。</p>`);
    const X=x=>280+x*75,Y=y=>253-y*23;
    function draw(){const x=+$(root,'#derivative-x').value,y=x*x,m=2*x;$(root,'#derivative-out').value=fmt(x);let path='';for(let t=-3;t<=3.001;t+=.05)path+=`${path?'L':'M'}${X(t).toFixed(1)},${Y(t*t).toFixed(1)} `;
      const x1=x-1,x2=x+1;
      $(root,'#derivative-svg').innerHTML=`<defs><clipPath id="deriv-clip"><rect x="40" y="10" width="480" height="260"/></clipPath></defs><line x1="45" y1="253" x2="525" y2="253" stroke="#b5c4a9"/><line x1="280" y1="12" x2="280" y2="270" stroke="#b5c4a9"/><text x="529" y="257" fill="#7d906e">x</text><text x="289" y="20" fill="#7d906e">y</text><text x="265" y="270" fill="#7d906e">0</text><g clip-path="url(#deriv-clip)"><path d="${path}" fill="none" stroke="#4b8062" stroke-width="2.5"/><line x1="${X(x1)}" y1="${Y(y+m*(x1-x))}" x2="${X(x2)}" y2="${Y(y+m*(x2-x))}" stroke="#bc7e48" stroke-width="2.5"/><circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="#21584f"/></g><text x="50" y="26" fill="#4b8062">f(x) = x²</text><text x="50" y="46" fill="#bc7e48">切线斜率 = ${fmt(m)}</text>`;
      $(root,'#derivative-result').textContent=`x = ${fmt(x)} → f(x) = ${fmt(y)}，f′(x) = ${fmt(m)}；${m>0?'局部向右上升':m<0?'局部向右下降':'切线水平'}`;
    }$(root,'#derivative-x').addEventListener('input',draw);draw();return ()=>{};
  }
  function gradient(root){
    let w=0,step=0,timer=null,history=[0],notice='';
    root.innerHTML=shell('沿着误差的斜坡往下走','目标：让 L(w) = (w − 3)² 变小。学习率决定每一步走多远。',`<div class="demo-controls"><label>学习率 η <input id="gd-rate" type="range" min="0.05" max="1.2" step="0.05" value="0.1" aria-label="梯度下降学习率"><output id="gd-rate-out">0.1</output></label></div><svg id="gd-svg" viewBox="0 0 560 280" role="img" aria-label="损失曲线与参数更新轨迹"></svg><div class="demo-controls">${button('gd-step','走一步')}${button('gd-play','连续播放')}${button('gd-reset','重置')}</div><div class="demo-readout" id="gd-result" aria-live="polite"></div><p class="demo-note" id="gd-notice">试试 η=0.1 与 η=1.1 的区别。每次改学习率会重新开始。播放可暂停；最多演示 60 步，超出绘图区自动停止。</p>`);
    const X=x=>45+(x+4)*39,Y=l=>236-l*4;
    function stop(){if(timer)clearInterval(timer);timer=null;$(root,'#gd-play').textContent='连续播放'}
    function draw(){let path='';for(let x=-4;x<=10.001;x+=.07)path+=`${path?'L':'M'}${X(x).toFixed(1)},${Y((x-3)**2).toFixed(1)} `;let track='';history.forEach((v,i)=>track+=`${i?'L':'M'}${X(v)},${Y((v-3)**2)} `);
      $(root,'#gd-svg').innerHTML=`<defs><clipPath id="gd-clip"><rect x="35" y="10" width="520" height="240"/></clipPath></defs><line x1="40" y1="236" x2="550" y2="236" stroke="#b5c4a9"/><text x="535" y="263" fill="#7d906e">w</text><text x="42" y="20" fill="#7d906e">L(w)</text><text x="${X(3)-3}" y="257" fill="#7d906e">3</text><g clip-path="url(#gd-clip)"><path d="${path}" stroke="#527f60" stroke-width="2.3" fill="none"/><path d="${track}" stroke="#c38b51" stroke-width="1.3" stroke-dasharray="4 3" fill="none"/>${history.slice(-20).map(v=>`<circle cx="${X(v)}" cy="${Y((v-3)**2)}" r="2.5" fill="#c19566"/>`).join('')}<circle cx="${X(w)}" cy="${Y((w-3)**2)}" r="6" fill="#21584f"/></g>`;
      $(root,'#gd-result').textContent=`第 ${step} 步 · w = ${fmt(w)} · 梯度 = ${fmt(2*(w-3))} · 损失 = ${fmt((w-3)**2)}${notice?' · '+notice:''}`;
      $(root,'#gd-step').disabled=step>=60||Math.abs(w-3)>7;
      $(root,'#gd-play').disabled=step>=60||Math.abs(w-3)>7;
    }
    function advance(){if(step>=60||Math.abs(w-3)>7)return;const rate=+$(root,'#gd-rate').value;w-=rate*2*(w-3);step++;history.push(w);if(Math.abs(w-3)>7){notice='参数已远离最优点，演示停止';stop()}if(step>=60){notice='已达 60 步，请观察结果或重置';stop()}draw()}
    function reset(){stop();w=0;step=0;history=[0];notice='';draw()}
    $(root,'#gd-step').onclick=()=>{stop();advance()};$(root,'#gd-reset').onclick=reset;
    $(root,'#gd-play').onclick=()=>{if(timer){stop();return}$(root,'#gd-play').textContent='暂停';timer=setInterval(advance,600)};
    $(root,'#gd-rate').oninput=()=>{$(root,'#gd-rate-out').value=fmt(+$(root,'#gd-rate').value);reset()};draw();return stop;
  }
  function convolution(root){
    const initial=[0,0,1,1,1,0,0,1,1,1,0,0,1,1,1,0,0,1,1,1,0,0,1,1,1];let pixels=[...initial],position=0,timer=null;
    const kernels={edge:[-1,0,1,-1,0,1,-1,0,1],mean:Array(9).fill(1/9),identity:[0,0,0,0,1,0,0,0,0]};
    root.innerHTML=shell('让一个小窗口走过图像','点击输入格可切换 0 / 1。选择卷积核，看局部计算如何形成整张输出。',`<div class="demo-controls"><label>卷积核 <select id="conv-kernel"><option value="edge">竖直边缘</option><option value="mean">局部均值</option><option value="identity">保留中心</option></select></label>${button('conv-step','下一个窗口')}${button('conv-play','播放')}${button('conv-reset','重置')}</div><div class="conv-layout"><div class="matrix-group"><div class="matrix-title">输入 · 5 × 5</div><div class="matrix" id="conv-input" style="grid-template-columns:repeat(5,1fr)"></div></div><span class="matrix-symbol" aria-hidden="true">⊙</span><div class="matrix-group"><div class="matrix-title">共享核 · 3 × 3</div><div class="matrix" id="conv-weights" style="grid-template-columns:repeat(3,1fr)"></div></div><span class="matrix-symbol" aria-hidden="true">→</span><div class="matrix-group"><div class="matrix-title">输出 · 3 × 3</div><div class="matrix" id="conv-output" style="grid-template-columns:repeat(3,1fr)"></div></div></div><div class="demo-readout" id="conv-result" aria-live="polite"></div><p class="demo-note">单通道、步长 1、无填充，无偏置。使用不翻转核的互相关；核由人工设定，不是模型学习结果。输出始终展示全部计算值，棕色框标记当前窗口对应的位置。</p>`);
    function stop(){if(timer)clearInterval(timer);timer=null;$(root,'#conv-play').textContent='播放'}
    function draw(){const k=kernels[$(root,'#conv-kernel').value],row=Math.floor(position/3),col=position%3;let selected=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)selected.push((row+r)*5+col+c);
      $(root,'#conv-input').innerHTML=pixels.map((v,i)=>`<button type="button" data-pixel="${i}" class="${selected.includes(i)?'active':''}" aria-label="输入第 ${Math.floor(i/5)+1} 行第 ${i%5+1} 列，值 ${v}，点击切换">${v}</button>`).join('');
      $(root,'#conv-weights').innerHTML=k.map(v=>`<span class="cell kernel">${$(root,'#conv-kernel').value==='mean'?'1/9':v}</span>`).join('');
      let values=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++){let s=0;for(let a=0;a<3;a++)for(let b=0;b<3;b++)s+=pixels[(r+a)*5+c+b]*k[a*3+b];values.push(s)}
      $(root,'#conv-output').innerHTML=values.map((v,i)=>`<span class="cell ${i===position?'current':''}">${fmt(v)}</span>`).join('');
      const contributions=selected.map((i,j)=>pixels[i]*k[j]);$(root,'#conv-result').textContent=`窗口 (${row+1}, ${col+1})：${contributions.map(fmt).join(' + ')} = ${fmt(values[position])}`;
    }
    $(root,'#conv-input').onclick=e=>{const b=e.target.closest('[data-pixel]');if(!b)return;const i=+b.dataset.pixel;pixels[i]=1-pixels[i];draw();$(root,`[data-pixel="${i}"]`).focus()};
    $(root,'#conv-step').onclick=()=>{stop();position=(position+1)%9;draw()};
    $(root,'#conv-play').onclick=()=>{if(timer){stop();return}$(root,'#conv-play').textContent='暂停';timer=setInterval(()=>{position=(position+1)%9;draw()},850)};
    $(root,'#conv-kernel').onchange=()=>{stop();position=0;draw()};
    $(root,'#conv-reset').onclick=()=>{stop();pixels=[...initial];position=0;$(root,'#conv-kernel').value='edge';draw()};draw();return stop;
  }
  return {dot,derivative,gradient,convolution};
})();
