(() => {
 'use strict';
 const root=document.documentElement,overlay=document.getElementById('signature-intro');
 if(!root.classList.contains('signature-opening')||matchMedia('(prefers-reduced-motion: reduce)').matches){overlay?.remove();return;}
 let done=false;const skip=overlay?.querySelector('.signature-skip');
 function finish(){if(done)return;done=true;overlay?.classList.add('signature-exit');root.classList.remove('signature-opening','swarm-zero');if(skip)skip.tabIndex=-1;document.dispatchEvent(new Event('harsh:signature-done'));setTimeout(()=>overlay?.remove(),650);}
 skip?.setAttribute('tabindex','0');skip?.addEventListener('click',finish);
 requestAnimationFrame(()=>requestAnimationFrame(()=>overlay?.classList.add('show-face')));
 setTimeout(()=>overlay?.classList.add('show-name'),500);
 setTimeout(finish,2250);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')finish();});
})();
