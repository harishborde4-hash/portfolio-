/* Drop-in video: no build step, no file chooser, no change to v5's visual theme. */
(function(){
  'use strict';
  var video=document.getElementById('about-video');
  if(!video)return;
  var frame=video.closest('.about__photo'),sources=[].slice.call(video.querySelectorAll('source')),button=frame.querySelector('.about__video-play');
  var started=false,inView=false,failed=false,attempt=0;
  var motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function fallback(){failed=true;attempt++;video.pause();frame.classList.remove('video-ready');button.hidden=true;}
  function play(manual){
    if(failed||document.hidden||(!manual&&(!inView||motion.matches)))return;
    var token=++attempt;
    try{
      var promise=video.play();
      if(promise&&promise.catch)promise.catch(function(error){
        if(token!==attempt||!inView||document.hidden||error.name==='AbortError')return;
        if(error.name==='NotSupportedError'){fallback();return;}
        button.hidden=false;
      });
    }catch(error){button.hidden=false;}
  }
  function load(){
    if(started)return;
    started=true;video.muted=true;video.defaultMuted=true;
    sources.forEach(function(s){s.src=s.getAttribute('data-src');});video.load();
  }
  function update(){
    if(!inView||document.hidden){attempt++;video.pause();return;}
    load();
    if(motion.matches){button.hidden=failed;return;}
    play(false);
  }
  sources.forEach(function(s,i){s.addEventListener('error',function(){if(i===sources.length-1)fallback();});});
  video.addEventListener('error',fallback);
  video.addEventListener('playing',function(){frame.classList.add('video-ready');button.hidden=true;});
  button.addEventListener('click',function(){load();play(true);});
  document.addEventListener('visibilitychange',update);
  var change=function(){if(motion.matches){attempt++;video.pause();button.hidden=failed;}else update();};
  if(motion.addEventListener)motion.addEventListener('change',change);
  else if(motion.addListener)motion.addListener(change);
  if(typeof window.IntersectionObserver==='function'){
    var observer=new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;update();},{threshold:0.08});observer.observe(frame);
  }else{
    var check=function(){var r=frame.getBoundingClientRect();inView=r.bottom>0&&r.top<innerHeight;update();};
    window.addEventListener('scroll',check,{passive:true});check();
  }
})();
