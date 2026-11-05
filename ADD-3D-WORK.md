# Drop-in 3D work

Start with **PUT-YOUR-2-FILES-HERE.txt**.

The current cassette gallery needs no module adaptation or export renaming. Replace its two source files in `assets/3d-work/cassette-gallery/` and keep index.html. Both original uploads are already included unchanged.

For future works, create another folder with a complete working index.html and its dependencies, then add an embed entry in `assets/js/three-works.js`:

```js
{
  id: 'my-next-work',
  title: 'My next work',
  type: 'embed',
  src: 'assets/3d-work/my-next-work/index.html',
  instructions: 'Drag to explore.'
}
```

Separate array entries with commas. Each registered project gets a clickable live-preview card and a dedicated interactive project page. A custom `previewSrc` can point to a preview-mode URL if your HTML supports one. Previews do not receive pointer events: clicking them opens the full project. The full iframe is interactive. Leaving the category removes preview frames and their animation loops.

Only embed trusted content. Local self-contained projects are recommended. External hosts may block embedding. A bare model file or unrelated JavaScript module still needs an appropriate HTML scene/viewer; the supplied wrapper specifically starts the cassette-gallery module.

Use HTTP hosting and deploy the complete site. No browser upload dashboard is included.

## v2 note: works without a server

The site now loads the cassette through `assets/3d-work/cassette-gallery/cassette-gallery.bundle.js`, a classic (non-module) script built from your two original files, which are still in that folder unchanged. Because of that, the site works when you double-click `archive.html` (file://) as well as on any web host. If you edit `cassette-gallery.js`, the bundle must be rebuilt for the change to show; ask and I'll regenerate it.

## v3 note: cursors live inside the HARSH logo

When the page-building cursors have nothing left to do, they drift (staggered, on curved hand-like paths) up to the HARSH name and shrink into it. When new content scrolls into view they pop back out of the name, build it, and return. Tunables are at the top of `assets/js/swarm.js` (`IDLE_MS` = wait before heading home).
