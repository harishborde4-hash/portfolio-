/* =========================================================================
   HARSH — Portfolio · main.js
   Vanilla JS. No dependencies.
   Modules:
     01. Helpers
     02. Preloader
     03. Reveal on scroll
     04. Split text + scroll-linked word lighting
     05. Parallax
     06. Scroll-linked marquee
     07. Pinned horizontal gallery
     08. Infinite tickers
     09. Testimonial background words
     10. Custom cursor
     11. Case-study hover preview
     12. Copy to clipboard
     13. Mobile menu
     14. Active dock link (scrollspy)
     15. Archive filters + lightbox
     16. Misc (year, scroll lock)
     17. Scroll progress thread
     18. Cursor-tracked spotlight
     19. Magnetic buttons
     20. Pointer-reactive tilt (gallery cards + archive tiles)
     21. Hero signal field (generative canvas)
     22. Scramble-decode hero title
   ========================================================================= */
(function () {
  "use strict";

  /* ------------------------------------------------------------ 01. HELPERS */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const vh = () => window.innerHeight;

  /* ------------------------------------------------------- 01b. DOM REFS */
  const gallery = $(".gallery");
  const track = $("[data-track]");
  const galleryIndex = $("[data-gallery-index]");

  /* ----------------------------------------------------------- 02. PRELOADER */
  const loader = $("#loader");
  const loaderBar = $("#loaderBar");
  const loaderCount = $("#loaderCount");

  function runLoader() {
    if (document.documentElement.classList.contains("swarm-enabled")) { if(loader)loader.classList.add("is-done"); finishLoad(); return; }
    if (!loader) return finishLoad();

    let progress = 0;
    let assetsReady = document.readyState === "complete";
    window.addEventListener("load", () => { assetsReady = true; }, { once: true });

    const finish = () => {
      loader.classList.add("is-done");
      finishLoad();
    };

    const tick = () => {
      // ease the bar towards 100%, but never past 94% until assets are in
      progress += Math.random() * 14 + 5;
      const ceiling = assetsReady ? 100 : 94;
      const p = Math.min(progress, ceiling);
      if (loaderBar) loaderBar.style.width = p + "%";
      if (loaderCount) loaderCount.textContent = String(Math.floor(p)).padStart(2, "0");

      if (p >= 100) {
        setTimeout(finish, 300);
      } else {
        setTimeout(tick, assetsReady || p < 90 ? 90 + Math.random() * 110 : 140);
      }
    };

    setTimeout(tick, 160);

    // safety net: never hold the visitor hostage
    setTimeout(() => {
      if (loader && !loader.classList.contains("is-done")) finish();
    }, 4500);
  }

  let hasFinished = false;
  function finishLoad() {
    if (hasFinished) return;
    hasFinished = true;
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    setupReveals();
    requestAnimationFrame(() => measure());
  }

  /* ----------------------------------------------------- 03. REVEAL ON SCROLL */
  // blocks that don't need data-attributes in the markup
  $$(".quote, .case, .tile, .archive__head > *").forEach((el) => el.classList.add("reveal"));

  /**
   * Reveal-on-scroll.
   * Deliberately not IntersectionObserver-only: if the visitor jump-scrolls past
   * a block (dock links, hash links, restored scroll position) the block must
   * still end up visible. Every pending item is checked against the viewport
   * bottom and revealed the moment it is at or above that line — which also
   * covers items that were skipped entirely.
   */
  let pendingReveals = [];
  let revealThrottle = 0;

  function setupReveals() {
    pendingReveals = $$(".reveal").filter((el) => !el.classList.contains("is-in"));
    if (reduceMotion) {
      pendingReveals.forEach((el) => el.classList.add("is-in"));
      pendingReveals = [];
      if (gallery) gallery.classList.add("is-in");
      return;
    }
    updateReveals(true);
  }

  function updateReveals(force) {
    if (revealThrottle++ % 3 !== 0 && !force) return;

    if (pendingReveals.length) {
      const line = vh() * 0.92;
      const batch = [];
      pendingReveals = pendingReveals.filter((el) => {
        if (scrollBox(el).top < line) {
          batch.push(el);
          return false;
        }
        return true;
      });
      batch.forEach((el, i) => {
        if (i < 8) el.style.transitionDelay = (i * 0.07).toFixed(2) + "s";
        el.classList.add("is-in");
      });
    }

    if (gallery && !gallery.classList.contains("is-in")) {
      const r = scrollBox(gallery);
      if (r.top < vh() * 0.9 && r.bottom > 0) gallery.classList.add("is-in");
    }
  }

  /* --------------------------------------------- 04. SPLIT TEXT + WORD LIGHT */
  const splitTargets = $$('[data-split="words"]');
  splitTargets.forEach((el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const words = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          words.forEach((w) => {
            if (/^\s+$/.test(w)) {
              frag.appendChild(document.createTextNode(" "));
            } else if (w.length) {
              const span = document.createElement("span");
              span.className = "word";
              span.textContent = w;
              frag.appendChild(span);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
  });

  function updateWords() {
    for (let s = 0; s < splitTargets.length; s++) {
      const el = splitTargets[s];
      const r = scrollBox(el);
      if (r.bottom < -200 || r.top > vh() + 200) continue;
      const total = r.height + vh() * 0.35;
      const p = clamp((vh() * 0.86 - r.top) / total);
      if (!el._words) el._words = Array.from(el.querySelectorAll(".word"));
      const words = el._words;
      const lit = Math.round(p * words.length * 1.12);
      const previous=el._lastLit||0,next=Math.max(0,Math.min(words.length,lit));
      for(let i=Math.min(previous,next);i<Math.max(previous,next);i++)words[i].classList.toggle('is-lit',i<next);
      el._lastLit=next;
    }
  }

  /* ------------------------------------------------------------ 05. PARALLAX */
  const parallaxItems = $$("[data-parallax]");

  /* ---------------------------------------- 05b. HERO SCROLL (figure + lines) */
  const heroEl = $("#hero");
  const heroMedia = $("[data-hero-media]");
  const heroRows = heroEl ? $$(".hero__row", heroEl) : [];
  const heroInner = heroEl ? $(".hero__inner", heroEl) : null;
  const heroDir = [-1, 1, -1];      // row A drifts left, B right, C left
  const heroAmt = [0.24, 0.26, 0.18]; // fraction of viewport width

  function updateHero() {
    if (!heroEl || reduceMotion) return;
    const r = scrollBox(heroEl);
    if (r.bottom < -50) return;
    const p = clamp(-r.top / Math.max(1, r.height * 0.9));
    const w = window.innerWidth;
    if (heroMedia) {
      // figure lags behind the page, grows slightly and fades into the dark
      heroMedia.style.transform = `translate3d(0, ${(p * r.height * 0.32).toFixed(1)}px, 0) scale(${(1 + p * 0.22).toFixed(4)})`;
      heroMedia.style.opacity = (1 - p * 0.85).toFixed(3);
    }
    heroRows.forEach((row, i) => {
      row.style.transform = `translate3d(${(heroDir[i % 3] * heroAmt[i % 3] * p * w).toFixed(1)}px, 0, 0)`;
    });
    if (heroInner) heroInner.style.opacity = clamp(1 - p * 1.25).toFixed(3);
  }

  /* ------------------------------------------------- 06. SCROLL MARQUEE */
  const marqueeRows = $$("[data-marquee-scroll]");

  /* -------------------------------------------------- 09. QUOTES BG WORDS */
  const quoteWords = $$("[data-quotes-word]");

  /* ---------------------------------------------------- 07. GALLERY MEASURE */
  let galleryDistance = 0;
  let cards = [];

  function measure() {
    if (gallery && track && window.innerWidth > 980) {
      cards = $$(".pcard", track);
      galleryDistance = Math.max(0, track.scrollWidth - window.innerWidth + 40);
      gallery.style.height = vh() + galleryDistance + "px";
    } else if (gallery) {
      gallery.style.height = "";
      if (track) track.style.transform = "";
    }
    measureTickers();
  }

  /* ---------------------------------------------------- 08. INFINITE TICKERS */
  function buildTicker(el) {
    if (el.dataset.tickerReady === "1") return;
    const original = el.innerHTML;
    let k = 2;
    el.innerHTML = original.repeat(k);
    let guard = 0;
    while (el.scrollWidth < window.innerWidth * 2.1 && guard < 8) {
      k += 2;
      el.innerHTML = original.repeat(k);
      guard++;
    }
    el.dataset.tickerReady = "1";
  }
  function measureTickers() {
    $$("[data-ticker]").forEach(buildTicker);
  }

  /* ------------------------------------------------------ 10. CUSTOM CURSOR */
  let cursor, cursorRing;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  function initCursor() {
    cursor = $("#cursor");
    if (!cursor || !canHover || reduceMotion) return;
    cursorRing = $(".cursor__ring", cursor);

    window.addEventListener(
      "mousemove",
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      },
      { passive: true }
    );

    const hoverTargets = "a, button, .tile, .case__link, .filters button";
    document.addEventListener("mouseover", (e) => {
      const hit = e.target.closest(hoverTargets);
      cursor.classList.toggle("is-hover", !!hit);
      cursor.classList.toggle("is-label", !!e.target.closest('[data-cursor="view"]'));
    });
    document.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) cursor.classList.remove("is-hover");
    });
  }

  /* --------------------------------------------- 11. CASE HOVER PREVIEW */
  const previewList = $("[data-preview-list]");
  let previewX = 0,
    previewY = 0,
    activeCase = null;

  if (previewList && canHover) {
    previewList.addEventListener("mousemove", (e) => {
      const li = e.target.closest(".case");
      if (li !== activeCase) {
        if (activeCase) activeCase.classList.remove("is-previewing");
        activeCase = li;
        if (activeCase) activeCase.classList.add("is-previewing");
      }
      previewX = e.clientX;
      previewY = e.clientY;
    });
    previewList.addEventListener("mouseleave", () => {
      if (activeCase) activeCase.classList.remove("is-previewing");
      activeCase = null;
    });
  }

  /* ----------------------------------------------------- 12. COPY EMAIL/PHONE */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy");
      const original = btn.innerHTML;
      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
      }
      btn.classList.add("is-copied");
      btn.innerHTML = "Copied!";
      setTimeout(() => {
        btn.classList.remove("is-copied");
        btn.innerHTML = original;
      }, 1600);
    });
  });

  /* --------------------------------------------------------- 13. MOBILE MENU */
  const menuBtn = $("#menuBtn");
  const menu = $("#menu");
  function closeMenu() {
    if (!menu || !menuBtn) return;
    menu.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", closeMenu));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ------------------------------------------------------ 14. SCROLLSPY DOCK */
  const spyLinks = $$("[data-spy]");
  const spySections = spyLinks
    .map((a) => document.getElementById(a.getAttribute("data-spy")))
    .filter(Boolean);

  function updateSpy() {
    if (!spySections.length) return;
    let current = null;
    spySections.forEach((sec) => {
      const r = scrollBox(sec);
      if (r.top <= vh() * 0.45 && r.bottom >= vh() * 0.35) current = sec.id;
    });
    if(updateSpy.last!==current){spyLinks.forEach((a)=>a.classList.toggle("is-active",a.getAttribute("data-spy")===current));updateSpy.last=current;}
  }

  /* --------------------------------------------- 15. ARCHIVE FILTERS + LIGHTBOX */
  const filterBar = $(".filters");
  if (filterBar) {
    const tiles = $$(".tile");
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      $$("button", filterBar).forEach((b) => b.classList.toggle("is-active", b === btn));
      const filter = btn.getAttribute("data-filter");
      tiles.forEach((t) => {
        const show = filter === "all" || (t.getAttribute("data-cat") || "").includes(filter);
        t.style.display = show ? "" : "none";
      });
    });
  }

  const lightbox = $("#lightbox");
  if (lightbox) {
    const lbImg = $("img", lightbox);
    const lbTitle = $("[data-lb-title]", lightbox);
    const lbCat = $("[data-lb-cat]", lightbox);
    $$(".tile").forEach((tile) => {
      if (!tile.querySelector("img")) return;
      tile.setAttribute("tabindex", "0");
      tile.setAttribute("role", "button");
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          tile.click();
        }
      });
      tile.addEventListener("click", () => {
        const img = $("img", tile);
        if (img) lbImg.src = img.src;
        if (lbTitle) lbTitle.textContent = tile.getAttribute("data-title") || "";
        if (lbCat) lbCat.textContent = tile.getAttribute("data-cat") || "";
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
      });
    });
    const close = () => {
      lightbox.hidden = true;
      document.body.style.overflow = "";
    };
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.closest(".lightbox__close")) close();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) close();
    });
  }

  /* --------------------------------------------------------------- 16. MISC */
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------- 17. SCROLL PROGRESS */
  const progressEl = document.createElement("div");
  progressEl.className = "progress";
  progressEl.setAttribute("aria-hidden", "true");
  const progressBar = document.createElement("span");
  progressEl.appendChild(progressBar);
  document.body.prepend(progressEl);

  function updateProgress() {
    const max = pageScrollMax;
    const p = max > 0 ? clamp(window.scrollY / max) : 0;
    progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
  }

  /* ------------------------------------------------- 18. CURSOR SPOTLIGHT */
  let spotlight = null;
  if (canHover && !reduceMotion) {
    spotlight = document.createElement("div");
    spotlight.className = "spotlight";
    spotlight.setAttribute("aria-hidden", "true");
    document.body.appendChild(spotlight);
  }

  /* --------------------------------------------------------- 19. MAGNETIC CTAs */
  if (canHover && !reduceMotion) {
    $$(".btn, .dock__cta").forEach((el) => {
      const pull = el.classList.contains("dock__cta") ? 0.3 : 0.45;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = (e.clientX - r.left - r.width / 2) * pull;
        const my = (e.clientY - r.top - r.height / 2) * pull;
        el.style.transition = "transform 0.15s linear";
        el.style.transform = `translate3d(${mx.toFixed(1)}px, ${(my - 2).toFixed(1)}px, 0)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform 0.5s var(--ease)";
        el.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------- 20. TILT CARDS */
  if (canHover && !reduceMotion) {
    $$(".pcard__link, .tile").forEach((el) => {
      let queued = false;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          const rx = (0.5 - py) * 9;
          const ry = (px - 0.5) * 11;
          el.style.transition = "transform 0.12s linear";
          el.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px) scale(1.015)`;
          queued = false;
        });
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform 0.6s var(--ease-out), border-color 0.4s var(--ease)";
        el.style.transform = "";
      });
    });
  }

  /* --------------------------------------------------- 21. HERO SIGNAL FIELD */
  (function initHeroField(){
    const hero=$('#hero');if(!hero||reduceMotion)return;
    const field=document.createElement('div');field.className='hero__field';field.setAttribute('aria-hidden','true');
    field.style.cssText='width:100%;height:100%;overflow:hidden;transition:transform .65s ease-out;transform-origin:50% 50%';
    hero.insertBefore(field,$('.hero__grid',hero)||hero.firstChild);
    let visible=true,mouseFrame=0,pointerTilt=0;
    function pause(){field.querySelectorAll('.hero__wave').forEach(el=>el.style.animationPlayState=visible&&!document.hidden?'running':'paused');}
    function size(){
      const w=hero.offsetWidth,h=hero.offsetHeight;const fragment=document.createDocumentFragment();
      for(let i=0;i<6;i++){
        const frequency=.9+i*.22,amp=h*(.035+i*.012),period=2*w/frequency,span=w+period+16,strip=amp*2+4;
        let d='';for(let x=0;x<=span;x+=8){const y=amp+2+Math.sin(x/w*Math.PI*frequency+i*.6)*amp;d+=(x?'L':'M')+x+' '+y.toFixed(2);}
        const wave=document.createElement('div');wave.className='hero__wave';
        wave.style.cssText=`position:absolute;left:0;top:${h*(.22+i*.1)-amp-2}px;width:${span}px;height:${strip}px;--wave-period:${period}px;animation-duration:${2*Math.PI/(.204*(1+i*.18))}s;opacity:${.05+(6-i)*.012}`;
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${span} ${strip}`);svg.setAttribute('width',span);svg.setAttribute('height',strip);
        const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);path.setAttribute('fill','none');path.setAttribute('stroke','#f0e5c4');path.setAttribute('stroke-width','1');svg.appendChild(path);wave.appendChild(svg);fragment.appendChild(wave);
      }
      field.replaceChildren(fragment);pause();
    }
    size();window.addEventListener('resize',size,{passive:true});
    window.addEventListener('mousemove',event=>{pointerTilt=(event.clientX/innerWidth-.5)*2;if(!mouseFrame)mouseFrame=requestAnimationFrame(()=>{mouseFrame=0;field.style.transform=`translate3d(0,${pointerTilt*8}px,0) rotate(${pointerTilt*.4}deg)`;});},{passive:true});
    if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;pause();}).observe(hero);
    document.addEventListener('visibilitychange',pause);
  })();

  /* ------------------------------------------------------- 22. SCRAMBLE TITLE */
  (function scrambleHero() {
    if(document.documentElement.classList.contains("swarm-enabled")) return;
    if (reduceMotion) return;
    const hero = $("#hero");
    const titles = hero ? $$(".hero__title", hero) : [];
    if (!titles.length) return;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ&·";

    titles.forEach((el, idx) => {
      const original = el.textContent;
      let frame = 0;
      const totalFrames = 16;
      let running = false;

      function tick() {
        frame++;
        const reveal = Math.floor((frame / totalFrames) * original.length);
        let out = "";
        for (let i = 0; i < original.length; i++) {
          const ch = original[i];
          out += ch.trim() === "" || ch === "&" || i < reveal ? ch : chars[(Math.random() * chars.length) | 0];
        }
        el.textContent = out;
        if (frame < totalFrames) setTimeout(tick, 28);
        else el.textContent = original;
      }

      function start() {
        if (running) return;
        running = true;
        setTimeout(tick, idx * 90);
      }

      if (document.body.classList.contains("is-ready")) {
        start();
      } else {
        const obs = new MutationObserver(() => {
          if (document.body.classList.contains("is-ready")) {
            start();
            obs.disconnect();
          }
        });
        obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
      }
    });
  })();

  // Cached document-space boxes. Rebuilt on real layout changes, not each scroll pixel.
  let geometryDirty=true,pageScrollMax=1;
  const geometry=new Map();
  function invalidateGeometry(){geometryDirty=true;onScroll();}
  function rebuildGeometry(){
    const elements=new Set([...splitTargets,...parallaxItems,...quoteWords,...spySections,...pendingReveals]);
    if(heroEl)elements.add(heroEl);if(gallery)elements.add(gallery);
    marqueeRows.forEach(row=>elements.add(row.closest('.marquee')||row));
    const y=scrollY,x=scrollX;
    elements.forEach(el=>{const r=el.getBoundingClientRect(),offset=el._scrollParallaxOffset||0;geometry.set(el,{top:r.top+y-offset,left:r.left+x,width:r.width,height:r.height});});
    marqueeRows.forEach(row=>row._cachedDistance=Math.max(0,row.scrollWidth-innerWidth));
    pageScrollMax=Math.max(1,document.documentElement.scrollHeight-innerHeight);geometryDirty=false;
  }
  function scrollBox(el){
    const box=geometry.get(el);
    if(!box){const r=el.getBoundingClientRect();return r;}
    return {top:box.top-scrollY,bottom:box.top+box.height-scrollY,left:box.left-scrollX,right:box.left+box.width-scrollX,width:box.width,height:box.height};
  }
  window.addEventListener('resize',invalidateGeometry,{passive:true});
  window.addEventListener('load',invalidateGeometry,{once:true});
  document.addEventListener('harsh:layout-change',invalidateGeometry);
  document.addEventListener('click',event=>{if(event.target.closest('.filters'))invalidateGeometry();});
  document.addEventListener('DOMContentLoaded',()=>{
    if(typeof ResizeObserver==='function'){
      const ro=new ResizeObserver(invalidateGeometry);
      const nodes=new Set([document.querySelector('main'),...splitTargets,...parallaxItems,...quoteWords,...spySections]);
      nodes.forEach(el=>{if(el)ro.observe(el);});
    }
  },{once:true});

  /* ------------------------------------------------------ SCROLL LOOP (rAF) */
  // One scheduled layout pass per scroll frame. Pointer settling never re-reads page layout.
  let loopQueued=false, layoutDirty=true, pointerUntil=0;
  function requestLoop(){
    if(loopQueued || document.hidden)return;
    loopQueued=true;
    requestAnimationFrame(()=>{loop();if(performance.now()<pointerUntil)requestLoop();});
  }
  function onScroll(){layoutDirty=true;requestLoop();}
  window.addEventListener('mousemove',()=>{pointerUntil=performance.now()+450;requestLoop();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)onScroll();});

  function loop() {
    loopQueued = false;
    if(document.hidden)return;
    if(layoutDirty){
    layoutDirty=false;
    if(geometryDirty)rebuildGeometry();

    // scroll progress thread
    updateProgress();

    // reveal-on-scroll (also rescues blocks skipped by jump scrolls)
    updateReveals(true);

    // word lighting
    updateWords();

    // hero figure + headline lines
    updateHero();

    // parallax
    parallaxItems.forEach((el) => {
      const speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
      const r = scrollBox(el);
      if (r.bottom < -300 || r.top > vh() + 300) return;
      const offset = (r.top + r.height / 2 - vh() / 2) * -speed;
      el._scrollParallaxOffset=offset;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });

    // scroll-linked marquee
    marqueeRows.forEach((row) => {
      const section = row.closest(".marquee") || row;
      const r = scrollBox(section);
      const total = r.height + vh();
      const p = clamp((vh() - r.top) / total);
      const dist = row._cachedDistance || 0;
      row.style.transform = `translate3d(${(-p * dist).toFixed(1)}px, 0, 0)`;
    });

    // pinned gallery
    if (gallery && track && galleryDistance > 0 && window.innerWidth > 980) {
      const r = scrollBox(gallery);
      const p = clamp(-r.top / Math.max(1, r.height - vh()));
      track.style.transform = `translate3d(${(-p * galleryDistance).toFixed(1)}px, 0, 0)`;
      if (galleryIndex && cards.length) {
        const i = Math.min(cards.length - 1, Math.round(p * (cards.length - 1)));
        const value=String(i+1).padStart(2,"0");
        if(galleryIndex.textContent!==value)galleryIndex.textContent=value;
      }
    }

    // quotes background words
    if (quoteWords.length) {
      quoteWords.forEach((w, i) => {
        const r = scrollBox(w);
        const p = (r.top + r.height / 2 - vh() / 2) / vh();
        const dir = i % 2 === 0 ? 1 : -1;
        w.style.transform = `translate3d(${(p * 60 * dir).toFixed(1)}px, 0, 0)`;
      });
    }

    updateSpy();
    } // end scroll/layout pass

    // case preview follow
    if (activeCase) {
      const thumb = $(".case__thumb", activeCase);
      if (thumb) {
        previewX = lerp(previewX, mouseX, 0.16);
        previewY = lerp(previewY, mouseY, 0.16);
        thumb.style.translate=previewX+"px "+previewY+"px";
      }
    }

    // ambient cursor spotlight
    if (spotlight) {
      spotlight.style.transform = `translate3d(${mouseX - 290}px, ${mouseY - 290}px, 0)`;
    }

    // cursor
    if (cursorRing) {
      ringX = lerp(ringX, mouseX, 0.18);
      ringY = lerp(ringY, mouseY, 0.18);
      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      cursorRing.style.transform=`translate3d(${ringX-mouseX}px,${ringY-mouseY}px,0) translate(-50%,-50%)`;
    }

  }

  /* ------------------------------------------------------------- BOOTSTRAP */
  function start() {
    initCursor();
    measure();
    measureTickers();
    onScroll();
    runLoader();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    onScroll();
  });
  window.addEventListener("load", () => {measure();onScroll();});

  if (document.readyState === "complete") {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start);
  }

  const movingTracks=$$('[data-ticker]');
  if('IntersectionObserver' in window){
    const trackObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{entry.target.dataset.motionInView=entry.isIntersecting?'1':'0';entry.target.classList.toggle('motion-paused',!entry.isIntersecting||document.hidden);});});
    movingTracks.forEach(el=>trackObserver.observe(el));
    document.addEventListener('visibilitychange',()=>movingTracks.forEach(el=>el.classList.toggle('motion-paused',document.hidden||el.dataset.motionInView!=='1')));
  }
  requestLoop();
})();
