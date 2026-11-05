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
  const compact=matchMedia('(pointer: coarse)').matches;
  const roles=compact?['frame','type','media']:['frame','frame','type','media'];
  const colors=['#f1d48a','#72e5c3','#99b6ff','#ffb090','#d3a1ff','#b4e680','#ff91b8','#85d9ff','#e4c783','#9ad6a9','#beb3ff','#efab73'];
  const crews=Array.from({length:compact?2:3},(_,index)=>({index,job:null,bots:roles.map((role,i)=>{
    const right=index%2===1;
    return {id:'crew-'+index+'-'+i,role,color:colors[index*roles.length+i],crew:index,slot:i,x:right?innerWidth-18:18,y:Math.min(innerHeight-24,100+index*105+i*25),gx:0,gy:0,arrived:false};
  })}));
  const bots=[].concat(...crews.map(c=>c.bots));
  // --- Home = inside the HARSH logo. Cursors leave it to work and return into it when idle. ---
  const logoEl=document.querySelector('.topbar__logo');let logoBox=null,pulses=[];
  const IDLE_MS=900;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  bots.forEach((b,i)=>{
    b.state='inside';b.hide=1;b.hideTarget=1;b.trip=null;b.idle=false;
    b.homeX=((i*0.381966)%1);b.homeY=Math.random();
    // free-hand character: each cursor has its own slow wobble rhythm
    b.f1=rnd(1.1,2.1);b.f2=rnd(2.3,3.6);b.f3=rnd(1.3,2.4);b.f4=rnd(2.6,4.1);
    b.p1=rnd(0,6.28);b.p2=rnd(0,6.28);b.p3=rnd(0,6.28);b.p4=rnd(0,6.28);
    b.vx=b.x;b.vy=b.y;b.vvx=0;b.vvy=0;
  });
  function refreshLogo(){
    if(!logoEl){logoBox=null;return;}
    const r=logoEl.getBoundingClientRect();
    logoBox=r.width>0&&r.height>0?r:null;
  }
  const SPEED=2,MAX_SPEED=(compact?1500:2200)*SPEED,BUILD_MS=1100/SPEED;
  let width,height,frame=0,last=0,queue=[],running=true,layoutVersion=0,started=false,serial=0,completed=0;
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
  refreshLogo();bots.forEach(b=>{const h=homePoint(b);b.x=b.vx=b.gx=h.x;b.y=b.vy=b.gy=h.y;b.arrived=true;});
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
  // Ambient layers animate normally; they do not steal a construction crew.
  targets=targets.filter(el=>!el.matches('.hero__field,.spotlight,.progress,.quotes__bg,.grain,.hero__grid'));
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
  function park(bot){return {x:bot.crew%2?width-18:18,y:Math.min(height-24,100+bot.crew*105+bot.slot*25)};}
  function bound(point){return {x:Math.max(12,Math.min(width-12,point.x)),y:Math.max(16,Math.min(height-16,point.y))};}
  function goal(bot,p){p=bound(p);bot.gx=p.x;bot.gy=p.y;}
  function homePoint(bot){
    if(!logoBox)return park(bot);
    return {x:logoBox.left+logoBox.width*(.12+.62*bot.homeX),y:logoBox.top+logoBox.height*(.5+(bot.homeY-.5)*.45)};
  }
  const smoother=t=>t*t*t*(t*(t*6-15)+10);
  function ripple(x,y){pulses.push({x,y,t:performance.now()});if(pulses.length>8)pulses.shift();}
  function startTrip(bot){
    const h=homePoint(bot),d=Math.hypot(h.x-bot.x,h.y-bot.y);
    bot.state='out';bot.idle=false;
    // a lazy, slightly different curve every time: a hand dragging a mouse home
    bot.trip={from:{x:bot.x,y:bot.y},t:0,dur:.85+Math.min(.8,d/1500)+rnd(0,.35),bend:(Math.random()<.5?-1:1)*rnd(45,120),ph:rnd(0,6.28),ph2:rnd(0,6.28)};
  }
  function moveTrip(bot,dt){
    const tr=bot.trip;tr.t+=dt/tr.dur;const t=Math.min(1,tr.t),u=smoother(t),h=homePoint(bot);
    const dx=h.x-tr.from.x,dy=h.y-tr.from.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    const arc=Math.sin(Math.PI*u)*tr.bend*Math.min(1,len/450+.3),wig=Math.sin(u*8+tr.ph)*7*Math.sin(Math.PI*u);
    bot.x=tr.from.x+dx*u+nx*(arc+wig);bot.y=tr.from.y+dy*u+ny*(arc+wig)+Math.sin(u*5+tr.ph2)*4*Math.sin(Math.PI*u);
    bot.hide=Math.max(bot.hide,Math.pow(clamp((t-.55)/.45),1.4));bot.hideTarget=bot.hide;bot.arrived=false;
    if(t>=1){bot.trip=null;bot.state='inside';bot.hide=bot.hideTarget=1;bot.x=h.x;bot.y=h.y;bot.vx=h.x;bot.vy=h.y;bot.vvx=bot.vvy=0;bot.arrived=true;ripple(h.x,h.y);}
  }
  function move(bot,dt){
    if(bot.state==='inside'){const h=homePoint(bot);bot.x=bot.vx=bot.gx=h.x;bot.y=bot.vy=bot.gy=h.y;bot.vvx=bot.vvy=0;bot.hide=1;bot.arrived=true;return;}
    if(bot.trip){moveTrip(bot,dt);return;}
    const dx=bot.gx-bot.x,dy=bot.gy-bot.y,d=Math.hypot(dx,dy),step=Math.min(d,MAX_SPEED*dt);
    if(d){bot.x+=dx/d*step;bot.y+=dy/d*step;}
    bot.arrived=d<=step+.00001;
    bot.hide+=(bot.hideTarget-bot.hide)*Math.min(1,dt*9);if(bot.hide<.01&&bot.hideTarget===0)bot.hide=0;
  }
  // Idle crews hover where they finished, then drift home into the logo (staggered).
  function idleStep(crew){
    const now=performance.now();if(crew.idleSince==null)crew.idleSince=now;
    const waiting=workWaiting();
    crew.bots.forEach(b=>{
      if(b.state==='inside'||b.trip)return;
      b.idle=true;b.hideTarget=0;goal(b,{x:b.x,y:b.y});
      if(!waiting&&now-crew.idleSince>IDLE_MS+b.slot*170+crew.index*260)startTrip(b);
    });
  }
  function workWaiting(){return queue.some(el=>{const r=el.getBoundingClientRect();return r.top<height&&r.bottom>0&&r.width>0&&r.height>0;});}
  // Spring-follow so the drawn cursor glides and lags a hair, like a hand, instead of snapping.
  function smooth(b,dt){
    if(b.state==='inside')return;
    const w=26,z=.72,n=2,h=dt/n;
    for(let i=0;i<n;i++){const ax=w*w*(b.x-b.vx)-2*z*w*b.vvx,ay=w*w*(b.y-b.vy)-2*z*w*b.vvy;b.vvx+=ax*h;b.vvy+=ay*h;b.vx+=b.vvx*h;b.vy+=b.vvy*h;}
  }
  function release(el){
    el.classList.remove('swarm-pending','swarm-building','swarm-structure');el.style.removeProperty('--structure-progress');
    const data=content.get(el);
    if(data){data.words.forEach(w=>{w.el.style.removeProperty('opacity');w.el.style.removeProperty('clip-path');w.shown=w.length;});data.images.forEach(img=>{img.classList.remove('swarm-image');img.style.removeProperty('--image-cut');});}
  }
  function measure(job){
    const r=job.el.getBoundingClientRect();job.r=r;
    if(job.metricsVersion!==layoutVersion){
      const unit=node=>{const b=node.getBoundingClientRect();return {x:(b.left-r.left)/(r.width||1),y:(b.top-r.top)/(r.height||1),w:b.width/(r.width||1),h:b.height/(r.height||1)};};
      job.letters=new Array(job.data.chars.length);job.wordBounds=job.data.words.map(w=>unit(w.el));
      job.groups=[];
      job.data.images.forEach(img=>{
        const p=unit(img);let group=job.groups.find(g=>Math.abs(g.box.x-p.x)*r.width<3&&Math.abs(g.box.y-p.y)*r.height<3&&Math.abs(g.box.w-p.w)*r.width<3&&Math.abs(g.box.h-p.h)*r.height<3);
        if(group)group.images.push(img);else job.groups.push({box:p,images:[img]});
      });job.metricsVersion=layoutVersion;
    }
    const left=Math.max(12,Math.min(width-28,r.left-7)),top=Math.max(16,Math.min(height-32,r.top-7));
    job.box={left,top,width:Math.max(16,Math.min(width-12,r.right+7)-left),height:Math.max(16,Math.min(height-16,r.bottom+7)-top)};
  }
  function glyph(job,count){
    const index=Math.max(0,Math.min(job.data.chars.length-1,count-1));
    if(!job.letters[index]){const b=job.data.chars[index].getBoundingClientRect(),r=job.r;job.letters[index]={x:(b.left-r.left)/(r.width||1),y:(b.top-r.top)/(r.height||1),w:b.width/(r.width||1),h:b.height/(r.height||1)};}
    const p=job.letters[index],r=job.r;
    return {x:r.left+(p.x+(count?p.w:0))*r.width+2,y:r.top+p.y*r.height+1.95,h:p.h*r.height,unit:p};
  }
  function corner(box,t){
    const w=box.width,h=box.height,perimeter=2*(w+h);let d=((t%1)+1)%1*perimeter;
    if(d<=w)return{x:box.left+d,y:box.top};d-=w;
    if(d<=h)return{x:box.left+w,y:box.top+d};d-=h;
    if(d<=w)return{x:box.left+w-d,y:box.top+h};d-=w;
    return{x:box.left,y:box.top+h-d};
  }
  function picture(job){
    const group=job.groups[job.mediaIndex];if(!group)return null;
    const p=group.box,r=job.r,ir={left:r.left+p.x*r.width,top:r.top+p.y*r.height,width:p.w*r.width,height:p.h*r.height};
    const left=Math.max(12,ir.left),right=Math.min(width-12,ir.left+ir.width),top=Math.max(16,ir.top),bottom=Math.min(height-16,ir.top+ir.height);
    return {group,ir,left,right,top,bottom,visible:right>left&&bottom>top};
  }
  function mediaPoint(job,fraction){
    const image=picture(job);if(!image||!image.visible)return corner(job.box,.75);
    return {x:image.left+(image.right-image.left)*fraction,y:(image.top+image.bottom)/2+Math.sin(fraction*Math.PI*2)*(image.bottom-image.top)*.28};
  }
  function anchors(crew,job){
    const frames=crew.bots.filter(b=>b.role==='frame');
    return crew.bots.map(b=>{
      if(b.role==='frame')return corner(job.box,frames.indexOf(b)/frames.length);
      if(b.role==='type'&&job.data.chars.length)return glyph(job,0);
      if(b.role==='media'&&job.groups.length)return mediaPoint(job,0);
      return corner(job.box,b.role==='type'?.82:.68);
    });
  }
  function assign(crew,el,now){
    const data=prepare(el);
    el.classList.add('swarm-building','is-in');
    const structure=!data.chars.length&&!data.images.length;if(structure)el.classList.add('swarm-structure');
    const job={id:++serial,el,data,phase:'travel',metricsVersion:-1,frameProgress:0,frameStep:null,typeCredit:0,typeTarget:null,mediaIndex:0,mediaProgress:0,mediaStep:null,structure,arrivalAt:now};
    measure(job);const destination=anchors(crew,job);
    crew.idleSince=null;
    job.routes=crew.bots.map((b,i)=>{
      const p=bound(destination[i]),d=Math.hypot(p.x-b.x,p.y-b.y);
      const fromHome=b.state==='inside';
      if(fromHome){ripple(b.x,b.y);b.state='out';b.hide=1;b.hideTarget=1;}else{b.hideTarget=0;}
      b.trip=null;b.idle=false;
      return {from:{x:b.x,y:b.y},duration:fromHome?.5+Math.min(.35,d/2600)+rnd(0,.12):Math.max(.28,Math.min(.9,d/1100+.2))/SPEED,
        elapsed:fromHome?-(i*.1+crew.index*.07+rnd(0,.08)):0,bend:(Math.random()<.5?-1:1)*rnd(25,100),ph:rnd(0,6.28)};
    });crew.job=job;
  }
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting&&!seen.has(entry.target)){seen.add(entry.target);observer.unobserve(entry.target);queue.push(entry.target);}});wake();
  },{threshold:0,rootMargin:'0px 0px -25px 0px'});
  function priority(el){return el.matches('.topbar,.dock,.menuBtn')?0:el.matches('.hero__title')?1:el.matches('.hero__media')?2:3;}
  function sortQueue(){queue.sort((a,b)=>{const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();return priority(a)-priority(b)||ra.top-rb.top||ra.left-rb.left;});}
  function start(){
    if(started)return;started=true;document.body.dataset.swarm='ready';
    document.documentElement.classList.remove('swarm-zero');document.documentElement.classList.add('swarm-active');
    targets.forEach(el=>{el.classList.add('swarm-pending');observer.observe(el);});
    targets.forEach(el=>{const r=el.getBoundingClientRect();if(r.width>0&&r.height>0&&r.top<height&&r.bottom>0){seen.add(el);observer.unobserve(el);queue.push(el);}});
    wake();
  }
  function wake(){if(!frame&&running&&!document.hidden)frame=requestAnimationFrame(tick);}
  function prepareGoals(crew,dt){
    const job=crew.job;if(!job){idleStep(crew);return;}
    measure(job);
    if(job.r.bottom<-30||job.r.top>height+30){finish(crew);idleStep(crew);return;}
    const positions=anchors(crew,job),frames=crew.bots.filter(b=>b.role==='frame');
    if(job.phase==='travel'){
      crew.bots.forEach((b,i)=>{
        const route=job.routes[i],end=bound(positions[i]);route.elapsed+=dt;const t=clamp(route.elapsed/route.duration),u=smoother(t);
        // Smooth deterministic arc, continuously re-targeted under scrolling.
        const len=Math.hypot(end.x-route.from.x,end.y-route.from.y)||1,k=Math.sin(Math.PI*u)*Math.min(1,len/380+.25);
        const nx=-(end.y-route.from.y)/len,ny=(end.x-route.from.x)/len,off=k*route.bend+Math.sin(u*7+route.ph)*6*Math.sin(Math.PI*u);
        if(route.elapsed>=0)b.hideTarget=0;
        goal(b,{x:route.from.x+(end.x-route.from.x)*u+nx*off,y:route.from.y+(end.y-route.from.y)*u+ny*off});
      });return;
    }
    crew.bots.forEach(b=>{b.hideTarget=0;});
    if(job.phase==='frame'){
      if(job.frameStep===null)job.frameStep=Math.min(1,job.frameProgress+dt/(BUILD_MS/1000*.28));
      crew.bots.forEach((b,i)=>goal(b,b.role==='frame'?corner(job.box,frames.indexOf(b)/frames.length+job.frameStep/frames.length):positions[i]));return;
    }
    crew.bots.forEach((b,i)=>{
      if(b.role==='frame'){goal(b,corner(job.box,(frames.indexOf(b)+1)/frames.length));return;}
      if(b.role==='type'&&job.data.chars.length){
        if(job.data.shown<job.data.chars.length){
          if(job.typeTarget===null){job.typeCredit=Math.min(5,job.typeCredit+dt*job.data.chars.length/(BUILD_MS/1000*.72));if(job.typeCredit>=1)job.typeTarget=Math.min(job.data.chars.length,job.data.shown+Math.floor(job.typeCredit));}
          goal(b,glyph(job,job.typeTarget===null?job.data.shown:job.typeTarget));
        }else goal(b,glyph(job,job.data.shown));return;
      }
      if(b.role==='media'&&job.groups.length){
        // Process real image panels in order, including the drop-in About video.
        let image=picture(job);
        while(image&&!image.visible){image.group.images.forEach(img=>img.style.setProperty('--image-cut','0%'));job.mediaIndex++;job.mediaProgress=0;job.mediaStep=null;image=picture(job);}
        if(image){if(job.mediaStep===null)job.mediaStep=Math.min(1,job.mediaProgress+dt/Math.max(.18/SPEED,BUILD_MS/1000*.72/job.groups.length));goal(b,mediaPoint(job,job.mediaStep));}
        else goal(b,positions[i]);return;
      }
      goal(b,positions[i]);
    });
  }
  function showText(job,count){
    const point=glyph(job,count).unit;
    for(let i=0;i<job.data.words.length;i++){
      const word=job.data.words[i],visible=Math.max(0,Math.min(word.length,count-word.start));if(visible===word.shown)continue;
      word.shown=visible;word.el.style.opacity=visible?'1':'0';
      if(visible===word.length)word.el.style.clipPath='none';
      else if(visible){const b=job.wordBounds[i],fraction=clamp((point.x+point.w-b.x)/Math.max(.000001,b.w));word.el.style.clipPath='inset(0 '+((1-fraction)*100).toFixed(3)+'% 0 0)';}
    }
    job.typeCredit=Math.max(0,job.typeCredit-(count-job.data.shown));job.data.shown=count;
  }
  function advance(crew){
    const job=crew.job;if(!job)return;
    if(job.phase==='travel'){
      if(job.routes.every(r=>r.elapsed>=r.duration)&&crew.bots.every(b=>b.arrived))job.phase='frame';return;
    }
    if(job.phase==='frame'){
      if(crew.bots.filter(b=>b.role==='frame').every(b=>b.arrived)){
        job.frameProgress=job.frameStep;job.frameStep=null;
        if(job.structure)job.el.style.setProperty('--structure-progress',String(job.frameProgress));
        if(job.frameProgress>=1){if(job.structure)finish(crew);else job.phase='work';}
      }return;
    }
    const writer=crew.bots.find(b=>b.role==='type'),pencil=crew.bots.find(b=>b.role==='media');
    if(job.typeTarget!==null&&writer.arrived){showText(job,job.typeTarget);job.typeTarget=null;}
    if(job.mediaStep!==null&&pencil.arrived){
      const image=picture(job);
      if(image){const x=image.left+(image.right-image.left)*job.mediaStep,fraction=clamp((x-image.ir.left)/Math.max(1,image.ir.width));image.group.images.forEach(img=>img.style.setProperty('--image-cut',((1-fraction)*100).toFixed(3)+'%'));}
      job.mediaProgress=job.mediaStep;job.mediaStep=null;
      if(job.mediaProgress>=1){if(image)image.group.images.forEach(img=>img.style.setProperty('--image-cut','0%'));job.mediaIndex++;job.mediaProgress=0;}
    }
    if(job.data.shown>=job.data.chars.length&&job.mediaIndex>=job.groups.length)finish(crew);
  }
  function finish(crew){if(!crew.job)return;release(crew.job.el);completed++;document.dispatchEvent(new Event('harsh:layout-change'));crew.job=null;crew.idleSince=null;crew.bots.forEach(b=>b.arrived=false);}
  function segment(box,start,amount){
    const end=start+amount,perimeter=2*(box.width+box.height),corners=[0,box.width/perimeter,.5,.5+box.width/perimeter,1];
    const p=corner(box,start);ctx.beginPath();ctx.moveTo(p.x,p.y);
    corners.filter(t=>t>start+1e-6&&t<end-1e-6).forEach(t=>{const p=corner(box,t);ctx.lineTo(p.x,p.y);});
    const q=corner(box,end);ctx.lineTo(q.x,q.y);ctx.stroke();
  }
  function drawJob(crew,now){
    const job=crew.job;if(!job||job.phase==='travel')return;
    const b=job.box,n=crew.bots.filter(b=>b.role==='frame').length;
    ctx.save();ctx.strokeStyle='#d4c397';ctx.lineWidth=.75;ctx.globalAlpha=.7;
    for(let i=0;i<n;i++)segment(b,i/n,job.frameProgress/n);
    for(const p of [corner(b,0),corner(b,boxCorner(b,1)),corner(b,.5),corner(b,boxCorner(b,3))]){ctx.fillStyle='#050505';ctx.fillRect(p.x-2,p.y-2,4,4);ctx.strokeRect(p.x-2,p.y-2,4,4);}
    if(job.phase==='work'&&job.data.chars.length&&job.data.shown<job.data.chars.length&&Math.floor(now/300)%2===0){
      const caret=glyph(job,job.data.shown);ctx.fillStyle='#f4e8bf';ctx.globalAlpha=.85;ctx.fillRect(caret.x,caret.y-1.95,1.5,Math.max(12,Math.min(32,caret.h)));
    }ctx.restore();
  }
  function boxCorner(b,index){const p=2*(b.width+b.height);return index===1?b.width/p:.5+b.width/p;}
  function drawBot(bot,now){
    if(bot.state==='inside'||bot.hide>=.995)return;
    const t=now/1000,moving=Math.hypot(bot.vvx,bot.vvy)>120,amp=bot.idle?3.2:moving?2.2:1.1;
    const ox=(Math.sin(t*bot.f1+bot.p1)+.6*Math.sin(t*bot.f2+bot.p2))*amp,oy=(Math.cos(t*bot.f3+bot.p3)+.6*Math.sin(t*bot.f4+bot.p4))*amp+(bot.idle?Math.sin(t*2.1+bot.p1)*2.4:0);
    const tilt=Math.max(-.24,Math.min(.24,bot.vvx/2600))+Math.sin(t*bot.f2+bot.p3)*(bot.idle?.09:.04);
    const grow=1-.88*bot.hide;
    ctx.save();ctx.globalAlpha=1-bot.hide*bot.hide;ctx.translate(bot.vx+ox,bot.vy+oy);ctx.rotate(tilt);ctx.scale(.65*grow,.65*grow);ctx.fillStyle=bot.color;ctx.strokeStyle='#111';ctx.lineWidth=1.2;
    if(bot.role==='media'){
      ctx.rotate(.6);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-4,-9);ctx.lineTo(-4,-31);ctx.lineTo(4,-31);ctx.lineTo(4,-9);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#ecd7ad';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-4,-9);ctx.lineTo(4,-9);ctx.closePath();ctx.fill();ctx.fillStyle='#faf3dc';ctx.fillRect(-4,-34,8,5);
    }else if(bot.role==='type'){
      ctx.strokeStyle=bot.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,-3);ctx.lineTo(5,-3);ctx.moveTo(0,-3);ctx.lineTo(0,17);ctx.moveTo(-5,17);ctx.lineTo(5,17);ctx.stroke();
    }else{
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1,18);ctx.lineTo(6,13);ctx.lineTo(10,22);ctx.lineTo(14,20);ctx.lineTo(10,12);ctx.lineTo(18,11);ctx.closePath();ctx.fill();ctx.stroke();
    }ctx.restore();
  }
  function drawPulses(){
    const t=performance.now();pulses=pulses.filter(p=>t-p.t<520);
    ctx.save();ctx.strokeStyle='#f1e5bf';ctx.lineWidth=1;
    for(const p of pulses){const k=(t-p.t)/520;ctx.globalAlpha=.5*(1-k);ctx.beginPath();ctx.arc(p.x,p.y,4+k*22,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function tick(now){
    frame=0;const dt=Math.min((now-(last||now-16.67))/1000,.04);last=now;
    try{
      if((!fastScroll||now-lastScrollAt>100)&&queue.length&&crews.some(c=>!c.job)){
        sortQueue();let preparedThisFrame=0;
        for(const crew of crews){if(crew.job)continue;if(preparedThisFrame)break;while(queue.length){const el=queue.shift(),r=el.getBoundingClientRect();if(r.bottom<0||r.width===0||r.height===0){release(el);continue;}if(r.top>height){queue.unshift(el);break;}assign(crew,el,now);preparedThisFrame++;break;}}
      }
      refreshLogo();
      crews.forEach(c=>prepareGoals(c,dt));bots.forEach(b=>move(b,dt));bots.forEach(b=>smooth(b,dt));crews.forEach(advance);
      ctx.clearRect(0,0,width,height);crews.forEach(c=>drawJob(c,now));drawPulses();bots.forEach(b=>drawBot(b,now));
      const readyQueue=workWaiting();
      if(crews.some(c=>c.job)||readyQueue||pulses.length||bots.some(b=>b.state!=='inside'||!b.arrived))wake();
    }catch(error){console.error('Construction safely stopped:',error);stop();}
  }
  function stop(){running=false;cancelAnimationFrame(frame);frame=0;observer.disconnect();targets.forEach(release);canvas.remove();}
  document.addEventListener('focusin',event=>{const el=targets.find(t=>t.contains(event.target));if(!el)return;for(const c of crews)if(c.job&&c.job.el===el)finish(c);release(el);seen.add(el);queue=queue.filter(t=>t!==el);wake();});
  const change=e=>{if(e.matches)stop();};if(motion.addEventListener)motion.addEventListener('change',change);else motion.addListener(change);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=0;wake();}});
  addEventListener('scroll',()=>{if(queue.length||crews.some(c=>c.job))wake();},{passive:true});addEventListener('resize',wake,{passive:true});
  if(location.search.includes('swarmDebug=1'))window.__swarmDebug=()=>({maxSpeed:MAX_SPEED,poolSize:bots.length,completed,queue:queue.length,active:crews.filter(c=>c.job).length,bots:bots.map(b=>({id:b.id,role:b.role,crew:b.crew,x:b.x,y:b.y,task:crews[b.crew].job?.id||null,phase:crews[b.crew].job?.phase||'parked',state:b.state,hide:+b.hide.toFixed(2),vx:Math.round(b.vx),vy:Math.round(b.vy)}))});
  if(document.documentElement.classList.contains('signature-opening'))document.addEventListener('harsh:signature-done',start,{once:true});else start();
  setTimeout(()=>document.documentElement.classList.remove('swarm-zero'),3000);
})();
