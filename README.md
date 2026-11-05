# Harsh v5 — Smooth Scrolling / 2× Coordinated Cursors

Based on the black/cream coordinated-cursor 2× video-ready edition. Prior ZIPs are unchanged. This is not a mobile-lite redesign.

## What was fixed

Slow scrolling previously mixed repeated layout reads and style writes, repainted the idle cursor canvas, and measured parallax using its own already-transformed position. Scroll-driven parallax also inherited a one-second CSS transform transition, causing each small wheel movement to restart a delayed tween.

### Scroll pipeline

- Cache document-space geometry and marquee distances; scroll effects consume cached numeric boxes instead of repeatedly forcing layout.
- Invalidate caches on actual load, resize, ResizeObserver size changes, archive filtering and completed cursor construction.
- Separate scroll-driven parallax from entrance-transform tweening, removing feedback/drift. Opacity entrances remain.
- Update word-lighting classes only across the changed boundary.
- Update gallery counter text and active navigation classes only when their values actually change.
- Pointer ring and case preview use transforms/individual translate rather than repeated left/top layout writes.

### Rendering

- Parked cursors stay visible on their existing canvas without clearing/redrawing it for every tiny scroll event. Active construction still animates normally.
- Prepare at most one new construction job per frame to reduce initialization bursts; crews still work in parallel.
- Six animated background waves are now full-resolution static SVG strips translated by the compositor, rather than a full-screen high-DPI canvas redrawn every frame. Their wave rates/amplitudes remain coordinated with the original effect; pointer response uses a gentle compositor-driven field tilt.
- Animated grain is a small raster texture rather than a live SVG turbulence filter. Overscan is reduced from 50% per side to the 6% needed for its actual movement. Grain remains animated, but is subtly normal-composited rather than a costly full-screen overlay blend.
- Field and native-pointer compositing avoid expensive blend passes. There is no reduced phone-image mode or canvas-DPR downgrade.
- The hero grayscale/contrast/brightness treatment is pre-rendered to a lossless PNG at the original 1040×1280 resolution, avoiding a live image filter. Original image remains included.

The visual treatment is retained, but grain compositing and pointer-wave tilt were reimplemented for performance; this is not a claim of pixel-identical filter output.

## Retained

- Fixed persistent pool: 12 desktop / 6 touch cursors, permanent roles, no job-index teleporting, no per-task respawns or fade replacement.
- 2× speed multiplier; 550ms base work budget, doubled travel ceilings, visible travel and crew synchronization. Actual task time includes travel and arrival.
- Original black/cream typography/layout, project content, imagery and full supported animation suite.
- Bold face-first/name-second intro, small cursors, no labels or Rebuild button, horizontal testimonial names and refresh-to-top.
- Drop-in video: assets/video/dark.mp4. The existing photo remains fallback until it plays. Muted looping, inline playback, deferred video loading, manual Play when needed and off-screen pausing remain.

## Controlled slow-scroll measurement

Chromium 1440×950, device pixel ratio 2, 4× CPU throttling, 300px movement over six seconds after initial construction. Before = prior 2× edition on local port 8230; after = this edition on 8240.

| Metric | Before | After |
|---|---:|---:|
| Hero p95 frame interval | 117ms | 33ms |
| Hero main-thread long tasks (>50ms) | 76 | 0 |
| Hero layout passes | 80 | 2 |
| About p95 frame interval | 50ms | 33ms |
| About layout passes | 155 | 1 |

These are controlled simulation samples, not physical-machine guarantees. Browser rasterization, GPU acceleration, temperature, available RAM, display refresh rate and other running apps affect actual FPS. No fixed 60/120/144/500FPS or zero-lag guarantee is made. The code does not add a frame-rate cap to native scrolling.

## Regression checks

- Zero idle cursor-canvas redraws during a tiny continuous-scroll check.
- No parallax-position drift after repeated same-position scroll events.
- Stable cursor IDs/roles and zero movement-limit violations across desktop/mobile assignments.
- No horizontal overflow or JavaScript exceptions in tested desktop/mobile flows.
- Valid temporary H.264 About video played correctly; missing-video photo fallback retained. No sample video is included.
- Archive and all six case-study pages loaded without JavaScript exceptions.
- All local HTML link/script/image references resolve.

## Use

Extract the ENTIRE ZIP, retain the assets directory and deploy as a static site. No build step. Local preview: python3 -m http.server 3000.

If you already added a video to a previous local edition, copy it into this edition at assets/video/dark.mp4 too. Your local video cannot be included here unless you upload it.

Modified: assets/js/main.js, assets/js/swarm.js, versioned HTML references and hero image reference. Added: assets/css/performance.css, assets/img/grain-fast.png, assets/img/harsh-rendered.png.


## Drop-in cassette work

Read **PUT-YOUR-2-FILES-HERE.txt**. Your original two uploaded files are included unchanged inside `assets/3d-work/cassette-gallery/`, beside a ready-made index.html that runs them directly. The archive card embeds a live preview; clicking it opens the full interactive work. The folder can also be hosted independently. HTTP hosting required.
