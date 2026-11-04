# Harsh v5 — Smooth Edition

Based on the v5 bold-signature / testimonial-fix package, retaining the original v5 design.

## This revision

- Builder cursors are scaled to 65% of their previous size; pointer rings are smaller too.
- Removed the Replay/Rebuild button and its handler entirely.
- Refresh uses manual scroll restoration, returns to top, clears a refreshed anchor, and replays the bold ×͜× harsh homepage intro.
- Added the newly supplied cyan portrait to About in a full-image 3:2 frame. The original portrait stays in the hero.
- Cursor guides, typing carets and pencils use cached, normalized geometry that follows scrolling/transforms; resize invalidates the cache.
- Drawing coordinates and frame construction use the same progress calculation. Working tips align to their actual targets after the short fly-in.
- Canvas resolution is capped at 1.5 device pixels per CSS pixel to reduce fill work.
- Desktop supports three simultaneous build tasks; touch devices two.
- New text preparation waits during fast scroll flings, then resumes after approximately 100ms of settling. Completed/skipped content is released rather than kept hidden.
- Builder cursors fade out and the animation loop sleeps when there is no work.
- Original main.js no longer measures the entire page continuously at idle. Layout-dependent work is scheduled on scroll/resize, while pointer smoothing has a short independent settling window.
- Hero ambient drawing stops off-screen and when hidden; CSS tickers pause off-screen. The grain remains static rather than animating.
- Dangling optional-font fetches from the supplied v5 package were removed; the same fallback-font appearance is retained.
- Testimonial author-name fixes remain intact.

## Performance expectations

The site uses requestAnimationFrame and follows the browser/display refresh cadence. 500 visible FPS cannot be guaranteed or forced by website code: the screen refresh rate, hardware, browser, power settings and other activity set the practical limit. No setInterval-based fake 500-FPS loop or artificial FPS counter is included.

Browser checks in Chromium covered intro playback, a continuous scroll pass, portrait loading, horizontal author names, no rebuild button, refresh from a deep anchor returning to top, and mobile overflow. No JavaScript exceptions occurred in those tested flows. A local headless scroll sample reported no >50ms main-thread long tasks, but that is not a guarantee for real devices or every run. Test your actual phones/screens before production launch.

## Deploy

Extract the ZIP and deploy the directory containing index.html as a static site. No build command is needed. Local preview: `python3 -m http.server 3000`.

## New/changed files

- assets/js/main.js: event-driven layout scheduling and off-screen animation pause.
- assets/js/swarm.js: smaller, task-aligned cursors, geometry cache, adaptive preparation, no replay UI.
- assets/css/smooth.css: portrait framing, smaller pointer, static grain and paused-track rule.
- assets/img/harsh-new.webp: optimized new About portrait.
- assets/img/harsh-new-original.png: your unmodified uploaded image, retained for editing.
- HTML: refresh reset, new portrait and versioned script/style references.

---

## Previous revision notes (historical)

Earlier descriptions of a Replay option are superseded by this revision.

# Harsh v5 — Bold Signature Intro + Testimonial Fix

This package is based directly on harsh-swarm-website-v5.zip, not on the redesigned premium or cinematic portfolios. Its original pages, design, content, project images and v5 build timings are retained.

## Changes in this revision

- Removed the opening cursor circle and rotating placeholder cursors.
- Added a dark/cream, bold ×͜× harsh homepage intro. The face appears first, then harsh slides out from behind it toward the right.
- The intro has a Skip button, Escape dismissal, reduced-motion support and a timeout fallback.
- Fixed testimonial author names stacking vertically. Typing now uses custom inline elements and groups each original text node into one run; the original span/flex selectors can no longer turn each letter into its own vertical column.
- Author names and role containers explicitly use horizontal writing. All three names were browser-tested on desktop and mobile and remain one line tall.
- Cursor name/role labels remain removed, as previously requested. Other v5 drawing tools, typing, image pencils and page-build behavior are preserved.
- Replay restarts the build without an orbit; it does not replay the homepage signature.

## Deploy

Extract this ZIP and deploy the folder containing index.html as a static website. No build step is needed. For local preview, run `python3 -m http.server 3000` in this folder, then open http://localhost:3000.

## Files changed

- assets/js/swarm.js — removes orbit, waits for signature, uses layout-safe typing tags, removes cursor labels.
- assets/js/signature.js — intro timing and skip behavior.
- assets/css/signature.css — bold opening and scoped testimonial fixes.
- assets/css/styles.css — testimonial span selector restricted to direct children.
- HTML pages — replace the rotating opening placeholder and include the patch assets.

## Browser checks

Playwright Chromium: face appears before name; no builders during intro; builders start afterward; three desktop and three mobile author names stay horizontal (about 22px line height); no mobile horizontal overflow; no JavaScript exceptions in the tested flows.

---

## Original v5 notes (historical)

The following notes document earlier versions. References below to a circular opening are superseded by the signature revision described above.

# Harsh — Swarm Build Edition

Your original static portfolio, with an original scroll-triggered cursor-builder effect. No runtime dependencies or build step.

## Run / deploy

Extract the ZIP. Deploy the contents of this folder to Vercel as a static site (framework preset: Other; no build command; output directory: .). Keep index.html at the deployment root.

For local preview run `python3 -m http.server 8080` in this folder, then open http://localhost:8080.

## Added

- assets/js/swarm.js: coordinated colored cursor teams draw frames, crosshair guides, size labels and reveal real page content on entry.
- assets/css/swarm.css: isolated reveal styles and non-interactive canvas overlay.
- Both files are included on all HTML pages.

The existing layout, links, text, loader, galleries and original scripts are retained. Assets were restored to the directory structure expected by the HTML. The missing vision.html, favicon.svg and harsh-placeholder.svg were retrieved from the public original website.

## Motion and performance

One requestAnimationFrame loop, capped canvas pixel ratio, maximum three concurrent build jobs, no mouse-follow listeners. The loop sleeps when idle and pauses in background tabs. Desktop uses twelve cursors; touch devices use six cursors and two concurrent jobs. OS reduced-motion preference disables the effect entirely. Content stays accessible to assistive technology; the canvas is decorative and cannot intercept clicks. Without JavaScript the swarm does not hide content.

Version 3 types the existing text character by character, progressing word by word in its original position. A blinking caret tracks the written character and a dedicated I-beam cursor follows the text. Pencil cursors draw image reveals separately. Text remains in the DOM and its layout space is reserved, preserving links and avoiding reflow.

## Customize

Edit the colors and names arrays at the top of swarm.js. Change duration (3200 desktop / 2400 touch, milliseconds) to tune speed. Edit the targets selector to choose participating elements. To remove the effect, remove the swarm.css and swarm.js includes from the HTML files.

## Checks

JavaScript syntax checked with Node. All local src/href references in the delivered HTML resolve to included files. Browser tested with Playwright Chromium at desktop (1440 × 950) and touch-mobile (390 × 844) sizes. Verified active cursor-building jobs, completed hero visibility, scroll-triggered statement building, replay, a case-study page, and the reduced-motion fallback. No JavaScript errors were recorded. Frame-rate guarantees are not possible across all hardware.

Version 2 fixes empty clipping preventing IntersectionObserver entry and a frame timer reset that prevented cursor motion. Added a Replay build button, persistent idle cursor team, more section targets, and versioned asset URLs.

## Version 3 — precise typing and image tools

Text is wrapped once in layout-preserving word/character spans and progressively written. Images have independent masks and pencil tools. Typical builds now take 1.8 seconds, extending to at most 3.8 seconds for long copy. Cursor movement uses frame-rate-independent exponential smoothing with a faster response. Replay resets both typing and image drawing.


## Version 4 — build from the first paint

Replaces the old opening loader with an immediate blank-canvas cursor scene. A tiny inline SVG startup scene appears before the main script is ready; the live canvas cursor team takes over immediately after HTML parsing. Structural layers (background grid, signal field, grain), fixed header, navigation, footer, ticker, marquee and decorative image layers now participate in addition to text and project content.

The opening build no longer waits for the original loader. Four jobs run together on desktop and three on mobile. Typical jobs take 1.1 seconds (0.95 seconds touch), with long copy capped at 2.2 seconds. Initial structural layers have priority, then content is written and images drawn. Subsequent sections build on viewport entry. Cursor team starts inside the viewport so its movement is visible immediately.

Reduced motion skips this scene and displays the normal site. With JavaScript disabled the startup cover stays hidden. The first-paint cover has a timeout fallback. This is a visual assembly effect over the real HTML, not runtime generation of the site's source code. Browser loading speed still depends on the network/device.


## Version 5 — circular swarm opening

All cursors gather and orbit in a centered circle for 2.1 seconds on the blank canvas before any build jobs start. The team then smoothly leaves the circle and assembles the website. Replay repeats the circle first too.

Build timing is about 20–23% slower than v4: minimum 1.35 seconds desktop / 1.15 seconds touch, capped at 2.65 seconds for longer copy. Typing, blinking caret, pencils and scroll builds are retained. Browser verified: zero build jobs during orbit, four desktop jobs after it, hero completion, replay returning to orbit, and no JavaScript errors.
