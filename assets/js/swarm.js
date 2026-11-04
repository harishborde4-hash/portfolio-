/* Harsh / Swarm builder. Original dependency-free implementation. */
(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'swarm-canvas'; canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  const colors = ['#f1d48a', '#72e5c3', '#99b6ff', '#ffb090', '#d3a1ff', '#b4e680', '#ff91b8', '#85d9ff', '#e4c783', '#9ad6a9', '#beb3ff', '#efab73'];
  const names = ['layout', 'design', 'type', 'build', 'detail', 'ship', 'frame', 'image', 'grid', 'code', 'style', 'polish'];
  const compact = matchMedia('(pointer: coarse)').matches;
  const bots = colors.slice(0, compact ? 6 : 12).map((color, i) => ({color, name:names[i], x:innerWidth*(.12+(i%4)*.24), y:innerHeight*(.18+Math.floor(i/4)*.23), alpha:0}));
  let width, height, frame = 0, last = 0, jobs = [], queue = [], running = true, layoutVersion=0;
  const seen = new WeakSet();
  let lastScrollY=scrollY,lastScrollAt=performance.now(),fastScroll=false;
  addEventListener('scroll',()=>{const now=performance.now();const speed=Math.abs(scrollY-lastScrollY)/Math.max(8,now-lastScrollAt)*1000;fastScroll=speed>1800;lastScrollY=scrollY;lastScrollAt=now;},{passive:true});
  function resize() {
    layoutVersion++;
    width = innerWidth; height = innerHeight;
    const dpr = (devicePixelRatio || 1);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize(); addEventListener('resize', resize, {passive:true});
  const ease = t => 1-Math.pow(1-t,3);
  const clamp = t => Math.max(0, Math.min(1,t));
  let targets = [...document.querySelectorAll('.hero__title, .hero__lede, .hero__media, .chip, .statement__body > .huge, .statement__aside, .gallery__head, .pcard, .cases__head, .case, .tile, .quote, .about__photo, .about__col, .about__top > h2, .focus__inner, .cta__title, .cta__actions, .footer__mail, .footer__cols, .archive__head > *, .cs__meta, .cs__body, .project__hero, .project__cover, .project__intro')];
  // Include large editorial headings and image panels on every case-study page.
  document.querySelectorAll('main h1, main h2, main figure, .case-hero, .case-cover').forEach(el => {
    if (!targets.includes(el) && !targets.some(t => t.contains(el) || el.contains(t))) targets.push(el);
  });
  // Cover every visible layer, not just editorial content. Keep targets disjoint.
  document.querySelectorAll('.hero__field, .spotlight, .progress, .quotes__bg, .cta__collage, .topbar, .dock, .menuBtn, .grain, .hero__grid, .hero__foot, .hero__arrow, .marquee, .ticker, .about__strip, .focus, .footer__bottom, .footer__huge, .footer__contact, .cs__head, .archive__filters, .archive__grid > *, main section > .label').forEach(el=>{
    if(!targets.some(t=>t===el || t.contains(el) || el.contains(t))) targets.push(el);
  });
  targets=targets.filter(el=>!targets.some(t=>t!==el && t.contains(el)));
  // Exact glyph geometry, but only ONE DOM element per word rather than per letter.
  // A shared Range measures the original shaped text, retaining font kerning.
  const content=new WeakMap(),glyphRange=document.createRange();
  function prepare(el){
    let data=content.get(el);
    if(!data){
      const chars=[],words=[];
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode(node){return node.textContent.trim()&&!node.parentElement.closest('script,style,svg,.sr-only,[aria-hidden="true"],[data-swarm-skip]')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
      const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      for(const node of nodes){
        const run=document.createElement('swarm-run');
        for(const piece of node.textContent.split(/(\s+)/)){
          if(!piece)continue;
          if(/^\s+$/.test(piece)){run.append(document.createTextNode(piece));continue;}
          const word=document.createElement('swarm-word');word.className='swarm-word';word.style.display='inline-block';word.textContent=piece;
          const info={el:word,start:chars.length,length:0,shown:0};let offset=0;
          for(const char of Array.from(piece)){
            const start=offset;offset+=char.length;
            chars.push({node:word.firstChild,start,end:offset,getBoundingClientRect(){glyphRange.setStart(this.node,this.start);glyphRange.setEnd(this.node,this.end);return glyphRange.getBoundingClientRect();}});info.length++;
          }
          words.push(info);run.append(word);
        }
        node.replaceWith(run);
      }
      data={chars,words,images:[...el.querySelectorAll('img, video')],shown:0};content.set(el,data);
    }
    data.shown=0;
    data.words.forEach(w=>{w.shown=0;w.el.style.opacity='0';w.el.style.clipPath='inset(0 100% 0 0)';});
    data.images.forEach(img=>{img.classList.add('swarm-image');img.style.setProperty('--image-cut','100%');});
    return data;
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || seen.has(entry.target)) continue;
      seen.add(entry.target); observer.unobserve(entry.target);
      queue.push(entry.target);
    }
    wake();
  }, {threshold:0, rootMargin:'0px 0px -25px 0px'});
  function start() {
    document.body.dataset.swarm='ready';
    document.documentElement.classList.remove('swarm-zero');
    document.documentElement.classList.add('swarm-active');
    targets.forEach(el => { el.classList.add('swarm-pending'); observer.observe(el); });
    // Structural chrome builds immediately, regardless of fixed-layer IO behavior.
    const first=targets.filter(el=>{const r=el.getBoundingClientRect();return r.width>0 && r.height>0 && r.top<innerHeight && r.bottom>0;});
    first.sort((a,b)=>{const rank=el=>el.matches('.hero__grid,.grain')?0:el.matches('.topbar,.dock')?1:2;return rank(a)-rank(b);});
    first.forEach(el=>{seen.add(el);observer.unobserve(el);queue.push(el);});
    introStart=performance.now();
    wake();
  }
  let introStart=0;
  function wake() { if (!frame && running && !document.hidden) { frame=requestAnimationFrame(tick); } }
  function release(el) {
    el.classList.remove('swarm-pending','swarm-building','swarm-structure');el.style.removeProperty('--structure-progress');
    const data=content.get(el);
    if(data){data.words.forEach(w=>{w.el.style.removeProperty('opacity');w.el.style.removeProperty('clip-path');w.shown=w.length;});data.shown=data.chars.length;data.images.forEach(img=>{img.classList.remove('swarm-image');img.style.removeProperty('--image-cut');});}
  }
  function charPosition(job,index){
    if(!job.letters[index]){
      const b=job.data.chars[index].getBoundingClientRect(),r=job.r;
      job.letters[index]={x:(b.left-r.left)/(r.width||1),y:(b.top-r.top)/(r.height||1),w:b.width/(r.width||1),h:b.height/(r.height||1)};
    }
    return job.letters[index];
  }
  function tick(now) {
    frame=0;
    const dt = Math.min((now-(last||now-16.67))/1000, .04); last=now;
    // Avoid starting expensive text preparation during a fast fling; resume as soon as it settles.
    while ((!fastScroll || now-lastScrollAt>100) && queue.length && jobs.length < (compact ? 2 : 3)) {
      const el=queue.shift(), r=el.getBoundingClientRect();
      if (r.bottom<0) { release(el); continue; }
      const data=prepare(el);
      el.classList.add('swarm-building'); el.classList.add('is-in');
      if(el.matches('.grain,.hero__grid,.hero__field,.spotlight,.progress') || (!data.chars.length && !data.images.length))el.classList.add('swarm-structure');
      const base=el.getBoundingClientRect();
      const unit=(node)=>{const r=node.getBoundingClientRect();return {x:(r.left-base.left)/(base.width||1),y:(r.top-base.top)/(base.height||1),w:r.width/(base.width||1),h:r.height/(base.height||1)};};
      const letters=new Array(data.chars.length),pictures=data.images.map(unit),wordBounds=data.words.map(w=>unit(w.el));
      jobs.push({el, data, letters, pictures, wordBounds, metricsVersion:layoutVersion, start:now, duration:650});
    }
    ctx.clearRect(0,0,width,height);
    const boot=clamp((now-introStart)/700);
    if(introStart && boot<1){
      ctx.save();ctx.fillStyle='#050505';ctx.globalAlpha=1-boot;ctx.fillRect(0,0,width,height);ctx.restore();
      ctx.save();ctx.strokeStyle='#e8d7a2';ctx.globalAlpha=(1-boot)*.4;ctx.lineWidth=.6;
      for(let x=width/6;x<width;x+=width/6){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height*ease(boot));ctx.stroke();}
      ctx.font='10px monospace';ctx.fillStyle='#f1e5bf';ctx.restore();
    }
    const rects = jobs.map(j => {
      const r=j.el.getBoundingClientRect();
      if(j.metricsVersion!==layoutVersion){
        const unit=node=>{const b=node.getBoundingClientRect();return {x:(b.left-r.left)/(r.width||1),y:(b.top-r.top)/(r.height||1),w:b.width/(r.width||1),h:b.height/(r.height||1)};};
        j.letters=new Array(j.data.chars.length);j.pictures=j.data.images.map(unit);j.wordBounds=j.data.words.map(w=>unit(w.el));j.metricsVersion=layoutVersion;
      }
      return {...j,r,p:clamp((now-j.start)/j.duration)};
    });
    for (const j of rects) {
      const {r,p,el}=j;
      const reveal = clamp((p-.12)/.76);
      if(el.classList.contains('swarm-structure'))el.style.setProperty('--structure-progress',String(ease(reveal)));
      const data=j.data;
      const count=Math.min(data.chars.length,Math.floor(reveal*data.chars.length));
      const typedEdge=data.chars.length?charPosition(j,Math.max(0,count-1)):null;
      for(let wi=0;wi<data.words.length;wi++){
        const word=data.words[wi];
        const visible=Math.max(0,Math.min(word.length,count-word.start));
        if(visible===word.shown)continue;
        word.shown=visible;word.el.style.opacity=visible?'1':'0';
        if(visible===word.length)word.el.style.clipPath='none';
        else if(visible){
          const bound=j.wordBounds[wi],edge=typedEdge;
          const fraction=clamp((edge.x+edge.w-bound.x)/Math.max(.000001,bound.w));
          word.el.style.clipPath='inset(0 '+((1-fraction)*100).toFixed(3)+'% 0 0)';
        }
      }
      data.shown=count;
      data.images.forEach(img=>img.style.setProperty('--image-cut',(100-ease(reveal)*100).toFixed(2)+'%'));
      if(data.chars.length && reveal>0 && reveal<1){
        const letter=data.chars[Math.max(0,count-1)];
        const point=typedEdge;
        const cr={left:r.left+point.x*r.width,right:r.left+(point.x+point.w)*r.width,top:r.top+point.y*r.height,height:point.h*r.height};
        j.caret={x:count?cr.right:cr.left,y:cr.top,h:cr.height};
        if(Math.floor(now/260)%2===0){ctx.save();ctx.fillStyle='#f4e8bf';ctx.globalAlpha=.95;ctx.fillRect(j.caret.x+2,j.caret.y,2,Math.max(12,cr.height));ctx.restore();}
      }
      if(data.images.length){
        const ip=j.pictures[0];const ir={left:r.left+ip.x*r.width,top:r.top+ip.y*r.height,width:ip.w*r.width,height:ip.h*r.height};
        j.pencil={x:ir.left+ir.width*ease(reveal),y:ir.top+ir.height*(.5+.43*Math.sin(reveal*Math.PI*12))};
      }
      const alpha = Math.min(1,p*7,(1-p)*6);
      ctx.save(); ctx.globalAlpha=alpha*.65; ctx.strokeStyle='#b9ab86'; ctx.lineWidth=.75;
      // Crosshair guides extend out from the real element bounds.
      ctx.setLineDash([3,6]);
      ctx.beginPath(); ctx.moveTo(0,r.top-7); ctx.lineTo(width,r.top-7); ctx.moveTo(r.left-7,0); ctx.lineTo(r.left-7,height); ctx.stroke();
      ctx.setLineDash([]); ctx.strokeStyle='#d4c397';
      const draw=ease(clamp(p/.42));
      ctx.strokeRect(r.left-7,r.top-7,(r.width+14)*draw,(r.height+14)*draw);
      for (const [x,y] of [[r.left-7,r.top-7],[r.right+7,r.top-7],[r.right+7,r.bottom+7],[r.left-7,r.bottom+7]]) {
        ctx.fillStyle='#050505'; ctx.fillRect(x-2.5,y-2.5,5,5); ctx.strokeRect(x-2.5,y-2.5,5,5);
      }
      ctx.font='9px monospace'; ctx.fillStyle='#e7dbb7';

      ctx.restore();
    }
    bots.forEach((bot,i) => {
      const j=rects[i % Math.max(1,rects.length)];
      let tx=width+60, ty=height+60, tool='arrow';
      if(j) {
        const {r,p}=j, k=Math.floor(i/Math.max(1,rects.length))%4;
        const travel=ease(clamp(p/.42));
        if(k===0) {tx=r.left-7+(r.width+14)*travel; ty=r.top-7;}
        else if(k===1) {tx=r.left-7+(r.width+14)*travel; ty=r.top-7+(r.height+14)*travel;}
        else if(k===2 && j.caret) {tx=j.caret.x+2;ty=j.caret.y+1.95;tool='type';}
        else if(k===2 && j.pencil) {tx=j.pencil.x;ty=j.pencil.y;tool='pencil';}
        else if(k===2) {tx=r.left+r.width*p;ty=r.top+r.height*.5;}
        else if(j.pencil){tx=j.pencil.x;ty=j.pencil.y;tool='pencil';} else {tx=r.left-7; ty=r.top-7+(r.height+14)*travel;}
        // Work tips follow real geometry; canvas clipping handles viewport edges.
        // Do not clamp the tip away from its actual text or image target.
        if(p>.88){tx+=50*ease((p-.88)/.12);ty-=35;}
      }
      const a=1-Math.exp(-dt*28);
      if(j){bot.x=tx;bot.y=ty;}else{bot.x+=(tx-bot.x)*a;bot.y+=(ty-bot.y)*a;}
      if(j)bot.alpha=Math.min(1,j.p*24,(1-j.p)*12);
      else bot.alpha+=(0-bot.alpha)*(1-Math.exp(-dt*24));
      if(bot.alpha<.015)return;
      ctx.save(); ctx.translate(bot.x,bot.y); ctx.scale(.65,.65); ctx.globalAlpha=bot.alpha;
      ctx.fillStyle=bot.color;ctx.strokeStyle='#111';ctx.lineWidth=1.2;
      if(tool==='pencil'){
        ctx.save();ctx.rotate(.6);
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-4,-9);ctx.lineTo(-4,-31);ctx.lineTo(4,-31);ctx.lineTo(4,-9);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#ecd7ad';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-4,-9);ctx.lineTo(4,-9);ctx.closePath();ctx.fill();
        ctx.fillStyle='#faf3dc';ctx.fillRect(-4,-34,8,5);ctx.restore();
      }else if(tool==='type'){
        ctx.strokeStyle=bot.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,-3);ctx.lineTo(5,-3);ctx.moveTo(0,-3);ctx.lineTo(0,17);ctx.moveTo(-5,17);ctx.lineTo(5,17);ctx.stroke();
      }else{
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1,18);ctx.lineTo(6,13);ctx.lineTo(10,22);ctx.lineTo(14,20);ctx.lineTo(10,12);ctx.lineTo(18,11);ctx.closePath();ctx.fill();ctx.stroke();
      }

      ctx.restore();
    });
    jobs=jobs.filter(j => {
      if(now-j.start>=j.duration || j.el.getBoundingClientRect().bottom < -80){release(j.el);return false;} return true;
    });
    if(jobs.length || queue.length || bots.some(b=>b.alpha>.02)) wake();
  }
  function stop() {
    running=false; cancelAnimationFrame(frame); frame=0; observer.disconnect();
    targets.forEach(release); canvas.remove();
  }
  document.addEventListener('focusin',e=>{const el=targets.find(t=>t.contains(e.target));if(el){release(el);seen.add(el);}});
  motion.addEventListener('change', e=> {if(e.matches) stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
  if(document.documentElement.classList.contains('signature-opening'))document.addEventListener('harsh:signature-done',start,{once:true});
  else start();
  // Never leave the page hidden if an unexpected runtime failure occurs.
  setTimeout(()=>document.documentElement.classList.remove('swarm-zero'),3000);
})();
