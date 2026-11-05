(()=>{'use strict';
 const filters=document.querySelector('.filters'),panel=document.getElementById('archive3d-panel'),grid=document.getElementById('archive-project-grid'),list=document.getElementById('three-work-cards');
 const buttons=[...filters.querySelectorAll('button[data-filter]')],works=window.HARSH_3D_WORKS||[];let token=0,instances=[],active=false;
 function clear(){token++;instances.forEach(i=>i.dispose?.());instances=[];list.replaceChildren();}
 async function show(){const version=token;
  for(const work of works){
   const card=document.createElement('a');card.className='three-work-card';card.href='3d-work.html?work='+encodeURIComponent(work.id);card.setAttribute('aria-label','Open '+work.title+' — interactive 3D project');
   const preview=document.createElement('div');preview.className='three-card-preview';preview.setAttribute('aria-hidden','true');
   const status=document.createElement('span');status.className='three-card-status';status.textContent='Loading live 3D preview…';preview.append(status);
   const caption=document.createElement('div');caption.className='three-card-caption';const title=document.createElement('span');title.textContent=work.title;const action=document.createElement('span');action.textContent='Open work ↗';caption.append(title,action);card.append(preview,caption);list.append(card);
   try{const mountWork=window.mountHarshWork;if(version!==token)return;const instance=await mountWork(preview,work,{preview:true});if(version!==token){instance.dispose?.();return;}instances.push(instance);status.remove();}
   catch(error){if(version===token)status.textContent='Open interactive project ↗';}
  }
 }
 function select(button){const category=button.dataset.filter,is3d=category==='3d';buttons.forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-selected',String(b===button));b.tabIndex=b===button?0:-1;});panel.hidden=!is3d;grid.hidden=is3d;grid.setAttribute('aria-labelledby',button.id);grid.querySelectorAll('.tile').forEach(t=>t.style.display=category==='all'||(t.dataset.cat||'').includes(category)?'':'none');if(is3d&&!active){active=true;show();}else if(!is3d){active=false;clear();}document.dispatchEvent(new Event('harsh:layout-change'));}
 buttons.forEach(b=>b.tabIndex=b.classList.contains('is-active')?0:-1);
 filters.addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(b)select(b);});filters.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const i=buttons.indexOf(e.target);if(i<0)return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[n].focus();select(buttons[n]);});
 if(location.hash==='#3d'){select(document.getElementById('filter-3d'));requestAnimationFrame(()=>filters.scrollIntoView({block:'start'}));}
})();
