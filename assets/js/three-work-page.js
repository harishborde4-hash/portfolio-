(async()=>{const mountWork=window.mountHarshWork;
const work=(window.HARSH_3D_WORKS||[]).find(w=>w.id===new URLSearchParams(location.search).get('work')),root=document.getElementById('viewer'),status=document.getElementById('status'),tools=document.getElementById('tools');let instance;
if(!work){status.textContent='Project not found. Use “Back to 3D Work” to choose a project.';}else{
 document.title=work.title+' — 3D Work — Harsh';document.getElementById('title').textContent=work.title;root.setAttribute('aria-label',work.title+' interactive viewer');document.getElementById('help').textContent=work.instructions||'Interact with the scene to explore this project.';
 try{instance=await mountWork(root,work);status.hidden=true;tools.hidden=!work.cassetteControls;updatePause();}
 catch(error){status.textContent='Could not load this interactive project. Check WebGL/hardware acceleration and use HTTP hosting, not file://.';console.warn(error);}
}
function updatePause(){const button=tools.querySelector('[data-action="pause"]'),paused=!instance?.getState?.().autoRotate;button.textContent=paused?'Resume rotation':'Pause rotation';button.setAttribute('aria-pressed',String(paused));}
tools.addEventListener('click',e=>{if(!instance)return;switch(e.target.dataset.action){case'previous':instance.scrollBy?.(-1.05);break;case'next':instance.scrollBy?.(1.05);break;case'left':instance.rotateBy?.(-.3);break;case'right':instance.rotateBy?.(.3);break;case'pause':instance.setAutoRotate?.(!instance.getState?.().autoRotate);break;case'reset':instance.reset?.();break;}updatePause();});root.addEventListener('keyup',updatePause);addEventListener('pagehide',()=>instance?.dispose?.());
})();
