# Harsh v5 Fast & Precise — About Video Ready

Based on harsh-swarm-v5-fast-precise.zip, NOT the cobalt experiment. The original black/cream design, animations, 650ms task duration and precise cursors are retained.

## All you need to do

1. Extract this entire ZIP.
2. Open assets/video/.
3. Put your video in that folder and name it exactly dark.mp4.
4. Deploy the complete website, or preview it through a local server.

Final layout:

index.html
assets/video/dark.mp4

No HTML, CSS or JavaScript edits needed. A placeholder instruction text file is already inside assets/video/ so the folder is easy to find. No sample video or empty fake MP4 is included.

Do not rename the file dark.mp4.mp4. Linux hosting paths are case-sensitive: use lower-case dark.mp4.

## Video behaviour

- Muted looping inline playback when About enters view.
- Existing photo stays visible until the first video playback starts; it remains the fallback if the video is missing, unsupported or fails.
- Off-screen and hidden-tab playback pauses.
- Video is not requested before the About frame enters view.
- A Play button appears when autoplay is blocked. Reduced-motion users can start playback manually.
- Same 3:2 About frame, object-fit cover (video may be cropped to fill).
- Cursor/pencil media-building effect recognizes both images and video.

Recommended format: H.264 MP4, short 720p clip, no audio track. Autoplay depends on browser/power-saving restrictions. If replacing an existing hosted dark.mp4, hard-refresh or clear the cached video.

The complete ZIP must be extracted/uploaded, not just index.html. Local preview: python3 -m http.server 3000; then open http://localhost:3000.

## Checks

Tested absent-video fallback, valid H.264 playback on desktop and simulated mobile, browser-autoplay rejection with manual playback, reduced motion, deferred video requests and off-screen pausing. No JavaScript exceptions occurred. Tests used a temporary clip which is NOT shipped in the website.

Changed: index.html; media selection/excluded-control selector in swarm.js. Added: about-video.js, about-video.css and assets/video/PUT-DARK-MP4-HERE.txt.
