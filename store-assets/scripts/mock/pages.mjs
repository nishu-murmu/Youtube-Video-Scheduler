// A neutral, unbranded video site used as the backdrop for screenshots.
// It reproduces only the DOM hooks the extension looks for
// (ytd-rich-item-renderer, yt-thumbnail-view-model, .ytp-time-duration, ...),
// not YouTube's look.
import { videos, byId } from "./videos.mjs";

const thumb = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

const base = `
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=block" rel="stylesheet">
<style>
  /* The real site sets a 10px root font size; keep it so the extension renders as it does there. */
  html { font-size: 10px; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/20px Roboto, Arial, sans-serif; color: #0f0f0f; background: #fff; }
  a { color: inherit; text-decoration: none; }
  .top { position: sticky; top: 0; z-index: 10; height: 56px; display: flex; align-items: center; gap: 16px; padding: 0 20px; background: #fff; }
  .burger { width: 24px; display: grid; gap: 4px; } .burger i { display: block; height: 2px; background: #0f0f0f; border-radius: 2px; }
  .search { flex: 0 1 560px; margin: 0 auto; height: 40px; border: 1px solid #d4d4d8; border-radius: 40px; display: flex; align-items: center; padding: 0 18px; color: #71717a; }
  .search svg { margin-left: auto; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#a1a1aa,#52525b); }
  .chips { display: flex; gap: 12px; padding: 8px 24px 16px; }
  .chip { padding: 6px 12px; border-radius: 8px; background: #f4f4f5; font-weight: 500; font-size: 14px; }
  .chip.on { background: #18181b; color: #fff; }
  #contents { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px 16px; padding: 0 24px 40px; }
  ytd-rich-item-renderer { display: block; position: relative; }
  yt-thumbnail-view-model { display: block; position: relative; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; background: #e4e4e7; }
  yt-thumbnail-view-model img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .len { position: absolute; right: 8px; bottom: 8px; background: rgba(0,0,0,.8); color: #fff; font-size: 12px; font-weight: 500; line-height: 18px; padding: 0 5px; border-radius: 4px; }
  .meta { display: flex; gap: 12px; margin-top: 12px; }
  .ch { width: 36px; height: 36px; border-radius: 50%; flex: none; }
  h3 { margin: 0 0 4px; font-size: 16px; line-height: 22px; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .sub { color: #606060; font-size: 14px; line-height: 20px; }
</style>`;

const header = `
<div class="top">
  <div class="burger"><i></i><i></i><i></i></div>
  <div class="search">Search<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></div>
  <div class="avatar"></div>
</div>`;

function card(v) {
  return `
<ytd-rich-item-renderer>
  <a href="https://www.youtube.com/watch?v=${v.id}">
    <yt-thumbnail-view-model><img src="${thumb(v.id)}" alt=""><span class="len">${v.len}</span></yt-thumbnail-view-model>
  </a>
  <div class="meta">
    <div class="ch" style="background:linear-gradient(135deg,${v.c1},${v.c2})"></div>
    <div><h3>${v.title}</h3><div class="sub">${v.channel}</div><div class="sub">${v.views} · ${v.age}</div></div>
  </div>
</ytd-rich-item-renderer>`;
}

export function homePage() {
  return `<!doctype html><html><head><title>Home</title>${base}</head><body>
${header}
<div class="chips">${["All", "Baking", "Programming", "Woodworking", "Art", "Engineering", "Fitness", "Photography"].map((c, i) => `<span class="chip${i ? "" : " on"}">${c}</span>`).join("")}</div>
<div id="contents">${videos.map(card).join("")}</div>
</body></html>`;
}

export function watchPage(id, { speed = 2 } = {}) {
  const v = byId[id] ?? videos[2];
  const [m, s] = v.len.split(":").map(Number);
  const lengthSeconds = m * 60 + s;
  const related = videos.filter((x) => x.id !== v.id).slice(0, 5);
  return `<!doctype html><html><head><title>${v.title}</title>${base}
<style>
  .wrap { display: grid; grid-template-columns: 1fr 400px; gap: 24px; padding: 8px 24px 24px; }
  .player { position: relative; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; background: #000; }
  .player > img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .bar { position: absolute; left: 0; right: 0; bottom: 0; padding: 0 16px 10px; background: linear-gradient(transparent, rgba(0,0,0,.6)); color: #fff; }
  .prog { height: 4px; background: rgba(255,255,255,.3); border-radius: 2px; margin-bottom: 10px; }
  .prog i { display: block; height: 100%; width: 25%; background: #ef4444; border-radius: 2px; }
  .ctl { display: flex; align-items: center; gap: 16px; font-size: 14px; }
  .ctl .gear { margin-left: auto; }
  .time { font-variant-numeric: tabular-nums; }
  .time .ytp-time-duration { font-weight: 500; }
  .ytp-popup { position: absolute; right: 14px; bottom: 58px; width: 260px; background: rgba(28,28,28,.92); color: #fff; border-radius: 12px; padding: 8px 0; font-size: 14px; }
  .ytp-popup .row { display: flex; justify-content: space-between; padding: 10px 16px; }
  .ytp-popup .row.on { background: rgba(255,255,255,.12); }
  ytd-watch-metadata { display: block; margin-top: 12px; }
  ytd-watch-metadata h1 { font-size: 20px; line-height: 28px; margin: 0 0 8px; }
  ytd-compact-video-renderer { display: flex; gap: 8px; margin-bottom: 8px; position: relative; }
  ytd-compact-video-renderer img { width: 168px; aspect-ratio: 16/9; border-radius: 8px; object-fit: cover; flex: none; }
  ytd-compact-video-renderer h3 { font-size: 14px; line-height: 20px; }
  ytd-compact-video-renderer .sub { font-size: 12px; line-height: 18px; }
</style></head><body>
${header}
<div class="wrap">
  <div>
    <div class="player">
      <img src="${thumb(v.id)}" alt="">
      <div class="ytp-popup ytp-settings-menu">
        <div class="row"><span>Quality</span><span>1080p</span></div>
        <div class="row on"><span>Playback speed</span><span>${speed}x</span></div>
        <div class="row"><span>Subtitles</span><span>Off</span></div>
      </div>
      <div class="bar">
        <div class="prog"><i></i></div>
        <div class="ctl">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          <span class="time"><span class="ytp-time-current">3:08</span> / <span class="ytp-time-duration">${v.len}</span></span>
          <svg class="gear" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
        </div>
      </div>
    </div>
    <ytd-watch-metadata><h1>${v.title}</h1><div class="sub">${v.channel} · ${v.views} · ${v.age}</div></ytd-watch-metadata>
  </div>
  <div>
    ${related.map((r) => `<ytd-compact-video-renderer><a href="https://www.youtube.com/watch?v=${r.id}"><img src="${thumb(r.id)}" alt=""></a><div><h3>${r.title}</h3><div class="sub">${r.channel}</div><div class="sub">${r.views}</div></div></ytd-compact-video-renderer>`).join("")}
  </div>
</div>
<script>/* "lengthSeconds":"${lengthSeconds}" */ sessionStorage.setItem("yt-player-playback-rate", JSON.stringify({ data: "${speed}", creation: Date.now() }));</script>
</body></html>`;
}

export function shortsPage(id) {
  const v = byId[id] ?? videos[5];
  return `<!doctype html><html><head><title>Shorts</title>${base}
<style>
  body { background: #fafafa; }
  .stage { display: flex; justify-content: center; padding: 8px 0 24px; }
  .short { width: 380px; aspect-ratio: 9/16; border-radius: 16px; overflow: hidden; position: relative; background: #000; }
  .short img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .cap { position: absolute; left: 16px; right: 16px; bottom: 20px; color: #fff; font-weight: 500; }
</style></head><body>
${header}
<div class="stage"><div class="short"><img src="${thumb(v.id)}" alt=""><div class="cap">${v.channel}<br><span style="font-weight:400">${v.title}</span></div></div></div>
</body></html>`;
}

export function embedPage(id) {
  return `<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#000}img{width:100%;height:100%;object-fit:cover;display:block}
  .p{position:absolute;left:50%;top:50%;width:60px;height:42px;margin:-21px 0 0 -30px;border-radius:12px;background:rgba(24,24,27,.82);display:grid;place-items:center}</style></head>
  <body><img src="${thumb(id)}"><div class="p"><svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></div></body></html>`;
}
