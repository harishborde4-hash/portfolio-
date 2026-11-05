// Shared lifecycle for live card previews and full interactive project pages.
// Classic script (no ES-module loading needed) so it also works when opened from file://.
window.mountHarshWork=async function(root,work,{preview=false}={}){
 if(work.type==='embed'){
  const frame=document.createElement('iframe');frame.title=work.title+(preview?' preview':'');frame.src=new URL(preview?(work.previewSrc||work.src):work.src,document.baseURI).href;frame.setAttribute('allowfullscreen','');if(preview)frame.tabIndex=-1;root.append(frame);
  return{dispose(){frame.remove();}};
 }
 const module=await import(new URL(work.src,document.baseURI).href),factory=module[work.factory||'createWork'];
 if(typeof factory!=='function')throw new Error('Project factory export not found.');
 const instance=await factory(root,{wheelRequiresFocus:true});
 return instance||{};
};
