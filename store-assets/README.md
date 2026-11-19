# Store assets

Everything here is captured from the real, built extension (`.output/chrome-mv3`) running in Chromium. The backdrop is a neutral mock video site with made-up titles and generated thumbnails, served at `youtube.com` URLs so the content scripts load. No real videos, channels or third-party branding appear.

## Chrome Web Store (`chrome/`)

| Dashboard field | File | Size |
| --- | --- | --- |
| Store icon | `store-icon-128.png` | 128×128 (96 px artwork, 16 px padding) |
| Screenshots (up to 5) | `screenshot-1-schedule.png`, `-2-dashboard`, `-3-missed`, `-4-runtime`, `-5-shorts` | 1280×800 |
| Small promo tile | `promo-small-440x280.png` | 440×280 |
| Marquee promo tile | `promo-marquee-1400x560.png` | 1400×560 |
| Promo video | `video/youtube-video-scheduler-demo.mp4` | 1280×720, 10 s, 30 fps |

Upload screenshots in numbered order; the first is the most visible.

The Chrome Web Store takes the promo video as a **YouTube link**, not a file. Upload the MP4 to YouTube (Public or Unlisted) and paste the URL. `video/demo-poster.png` works as its thumbnail.

## Firefox Add-ons

Upload the same five `chrome/screenshot-*.png` files. The icon comes from the extension itself.

## Brand

`brand/logo.svg` is the source for every icon: the extension icons in `public/icon/`, the store icon, and the site's favicon and app icons.

## Regenerating

```bash
bun run assets:icons   # after editing brand/logo.svg
bun run assets         # build -> capture -> compose -> video
```

| Script | Does |
| --- | --- |
| `scripts/icons.mjs` | Renders `brand/logo.svg` at every icon size |
| `scripts/capture.mjs` | Loads the built extension, opens the mock pages and saves raw UI captures to `.raw/` (git-ignored). Pass names to capture only some: `home`, `dashboard`, `missed`, `watch`, `shorts`, `popup` |
| `scripts/compose.mjs` | Frames the captures into store screenshots, promo tiles and `site/og-image.png` |
| `scripts/video.mjs` | Renders the demo video frame by frame and encodes it with ffmpeg |
| `scripts/mock/` | The mock video site and its sample videos |

Requirements: Playwright's Chromium (`bunx playwright install chromium`) and `ffmpeg` on the `PATH`. Captures use real dates relative to 19 November 2026; edit `at()` in `capture.mjs` to change them.

After regenerating, copy the new demo video to the site:

```bash
cp store-assets/video/youtube-video-scheduler-demo.mp4 site/media/demo.mp4
```
