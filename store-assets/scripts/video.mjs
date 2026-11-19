// Renders the 10-second promo video from the raw captures, frame by frame.
// Usage: node store-assets/scripts/capture.mjs && node store-assets/scripts/video.mjs
import { writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { launch, ROOT, ASSETS, fonts } from "./browser.mjs";

const RAW = join(ASSETS, ".raw");
const FRAMES = join(RAW, "frames");
const OUT = join(ASSETS, "video");
const FPS = 30;
const DURATION = 10;
const W = 1280;
const H = 720;

const raw = (n) => pathToFileURL(join(RAW, `${n}.png`)).href;
const logo = `data:image/svg+xml;base64,${readFileSync(join(ASSETS, "brand", "logo.svg")).toString("base64")}`;

// Browser frame geometry: captures are 1440x900 CSS px shown at FW wide.
const FW = 1000;
const S = FW / 1440;
const FX = (W - FW) / 2;
const FY = 118; // top of the window chrome
const CY = FY + 40; // top of page content

const html = `<!doctype html><html><head>${fonts}<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased; background: #fafafa; position: relative; }
  .layer { position: absolute; inset: 0; }
  .dark { background: #18181b; color: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .dark::before { content: ""; position: absolute; inset: 0; background: radial-gradient(500px 360px at 50% 40%, rgba(220,38,38,.3), transparent 70%); }
  .dark > * { position: relative; }
  .dark img { width: 120px; height: 120px; }
  .dark h1 { margin-top: 28px; font-size: 54px; font-weight: 800; letter-spacing: -.03em; }
  .dark p { margin-top: 14px; font-size: 26px; color: #a1a1aa; }
  .dark em { font-style: normal; color: #f87171; }
  .stores { margin-top: 30px; display: flex; gap: 12px; }
  .stores span { padding: 10px 18px; border-radius: 999px; background: #27272a; font-size: 18px; font-weight: 600; color: #e4e4e7; box-shadow: inset 0 0 0 1px #3f3f46; }
  .cap { position: absolute; z-index: 2; left: 0; right: 0; top: 34px; text-align: center; font-size: 40px; font-weight: 800; letter-spacing: -.025em; color: #18181b; }
  .cap em { font-style: normal; color: #dc2626; }
  .cap span { display: inline-block; padding: 4px 20px 8px; border-radius: 16px; background: rgba(250,250,250,.94); }
  .win { position: absolute; left: ${FX}px; top: ${FY}px; width: ${FW}px; border-radius: 14px; overflow: hidden; background: #fff;
         box-shadow: 0 0 0 1px rgba(24,24,27,.08), 0 30px 60px -20px rgba(24,24,27,.35); transform-origin: 50% 0; }
  .bar { height: 40px; display: flex; align-items: center; gap: 12px; padding: 0 14px; background: #f4f4f5; border-bottom: 1px solid #e4e4e7; }
  .dots { display: flex; gap: 8px; } .dots i { width: 12px; height: 12px; border-radius: 50%; display: block; }
  .url { flex: 0 1 400px; margin: 0 auto; height: 26px; border-radius: 13px; background: #fff; box-shadow: 0 0 0 1px #e4e4e7; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #52525b; }
  .ext { width: 22px; height: 22px; }
  .view { position: relative; height: ${Math.round(900 * S)}px; overflow: hidden; }
  .view img.shot { position: absolute; left: 0; top: 0; width: ${FW}px; height: ${Math.round(900 * S)}px; }
  .popup { position: absolute; top: 4px; right: 10px; width: 300px; height: 424px; border-radius: 12px; box-shadow: 0 0 0 1px rgba(24,24,27,.12), 0 24px 48px -12px rgba(24,24,27,.45); }
  #cursor { position: absolute; width: 26px; height: 26px; z-index: 10; filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
  #ring { position: absolute; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; border: 3px solid #dc2626; z-index: 9; }
  .toast { position: absolute; left: 50%; bottom: 40px; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 12px;
           background: #18181b; color: #fff; font-size: 18px; font-weight: 600; box-shadow: 0 20px 40px -10px rgba(0,0,0,.4); white-space: nowrap; }
  .toast i { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; }
</style></head><body>
  ${["schedule", "dashboard", "runtime", "shorts"].map((id) => `
  <div class="layer" id="sc-${id}">
    <div class="cap" id="cap-${id}"></div>
    <div class="win" id="win-${id}">
      <div class="bar"><span class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span>
        <span class="url">${{ schedule: "youtube.com", dashboard: "youtube.com", runtime: "youtube.com/watch", shorts: "youtube.com/shorts" }[id]}</span><img class="ext" src="${logo}"></div>
      <div class="view" id="view-${id}"></div>
    </div>
  </div>`).join("")}
  <div class="toast" id="toast"><i></i>Scheduled for tomorrow, 09:00</div>
  <div class="layer dark" id="sc-title"><img src="${logo}"><h1>YouTube Video Scheduler</h1><p>Save it for later. <em>Actually</em> watch it.</p></div>
  <div class="layer dark" id="sc-end"><img src="${logo}"><h1>Never lose a video again.</h1><p>Schedule · Remind · Real runtime · Shorts limit</p>
    <div class="stores"><span>Chrome Web Store</span><span>Firefox Add-ons</span></div></div>
  <div id="ring"></div>
  <svg id="cursor" viewBox="0 0 24 24"><path d="M4 2l16 10.5-7 1.5 4 7.5-3 1.5-4-7.5L4 20z" fill="#fff" stroke="#18181b" stroke-width="1.5" stroke-linejoin="round"/></svg>
<script>
  const S = ${S}, FX = ${FX}, CY = ${CY};
  const img = (src) => '<img class="shot" src="' + src + '">';
  document.getElementById("view-schedule").innerHTML =
    img("${raw("home-plain")}").replace('class="shot"', 'class="shot" id="i-plain"') +
    img("${raw("home-hover")}").replace('class="shot"', 'class="shot" id="i-hover"') +
    img("${raw("add-modal")}").replace('class="shot"', 'class="shot" id="i-modal"');
  document.getElementById("view-dashboard").innerHTML = img("${raw("dashboard")}");
  document.getElementById("view-runtime").innerHTML = img("${raw("watch")}");
  document.getElementById("view-shorts").innerHTML = img("${raw("shorts-warning")}") + '<img class="popup" id="popup" src="${raw("popup")}">';
  document.getElementById("cap-schedule").innerHTML = "<span>Hover. Click +. <em>Pick a time.</em></span>";
  document.getElementById("cap-dashboard").innerHTML = "<span>Every scheduled video, <em>one shortcut</em> away.</span>";
  document.getElementById("cap-runtime").innerHTML = "<span>Real runtime <em>at any speed</em>.</span>";
  document.getElementById("cap-shorts").innerHTML = "<span>Cap your <em>Shorts</em>.</span>";

  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const prog = (t, a, b) => ease((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const $ = (id) => document.getElementById(id);
  const page = (x, y) => [FX + x * S, CY + y * S]; // capture CSS px -> video px

  // Scene windows [in, out]; each fades/slides over 0.35 s.
  const scenes = { title: [0, 1.5], schedule: [1.5, 4.7], dashboard: [4.7, 6.2], runtime: [6.2, 7.7], shorts: [7.7, 8.9], end: [8.9, 10.5] };
  const T = 0.35;

  window.render = (t) => {
    for (const [id, [a, b]] of Object.entries(scenes)) {
      const inK = a === 0 ? 1 : prog(t, a - T / 2, a + T / 2);
      const outK = prog(t, b - T / 2, b + T / 2);
      const vis = inK * (1 - outK);
      const el = $("sc-" + id);
      el.style.opacity = vis;
      el.style.visibility = vis > 0.001 ? "visible" : "hidden";
      const win = $("win-" + id);
      if (win) win.style.transform = "translateY(" + (1 - inK) * 40 + "px)";
    }
    const titleIn = prog(t, 0.1, 0.6);
    $("sc-title").querySelector("img").style.transform = "scale(" + lerp(0.6, 1, titleIn) + ")";

    // Schedule scene: cursor to thumbnail, + appears, click, modal, click Schedule, toast.
    const [hx, hy] = page(908, 232);
    const [bx, by] = page(898, 679);
    const start = [FX + 860, CY + 470];
    let cx, cy;
    const m1 = prog(t, 1.7, 2.4), m2 = prog(t, 3.25, 3.75);
    cx = lerp(start[0], hx, m1); cy = lerp(start[1], hy, m1);
    if (t > 3.25) { cx = lerp(hx, bx, m2); cy = lerp(hy, by, m2); }
    $("i-hover").style.opacity = prog(t, 2.2, 2.45);
    $("i-modal").style.opacity = prog(t, 2.8, 3.05);
    $("i-modal").style.transformOrigin = "50% 50%";
    $("i-modal").style.transform = "scale(" + lerp(0.985, 1, prog(t, 2.8, 3.1)) + ")";
    const inSchedule = t > 1.6 && t < 4.6;
    const cur = $("cursor");
    cur.style.opacity = inSchedule ? 1 : 0;
    cur.style.left = cx - 4 + "px"; cur.style.top = cy - 2 + "px";
    const click = (tc) => { const k = (t - tc) / 0.35; return k >= 0 && k <= 1 ? k : -1; };
    const k = Math.max(click(2.6), click(3.9));
    const ring = $("ring");
    ring.style.opacity = k < 0 ? 0 : 1 - k;
    ring.style.left = cx + "px"; ring.style.top = cy + "px";
    ring.style.transform = "scale(" + (0.5 + (k < 0 ? 0 : k)) + ")";
    const toast = prog(t, 4.0, 4.2) * (1 - prog(t, 4.55, 4.75));
    $("toast").style.opacity = toast;
    $("toast").style.transform = "translate(-50%," + (1 - toast) * 16 + "px)";

    // Runtime scene: zoom into the time readout.
    const z = prog(t, 6.55, 7.2);
    const [tx, ty] = page(140, 588);
    const w = $("win-runtime");
    w.style.transformOrigin = (tx - FX) + "px " + (ty - ${FY}) + "px";
    w.style.transform += " scale(" + lerp(1, 1.55, z) + ")";

    // Shorts scene: popup drops in.
    const p = prog(t, 7.9, 8.25);
    $("popup").style.opacity = p;
    $("popup").style.transform = "translateY(" + (1 - p) * -14 + "px)";

    const endIn = prog(t, 9.0, 9.5);
    $("sc-end").querySelector("img").style.transform = "scale(" + lerp(0.7, 1, endIn) + ")";
  };
</script></body></html>`;

rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });
mkdirSync(OUT, { recursive: true });
const tmp = join(RAW, "video.html");
writeFileSync(tmp, html);

const browser = await launch();
const pg = await browser.newPage({ viewport: { width: W, height: H } });
await pg.goto(pathToFileURL(tmp).href);
await pg.evaluate(() => document.fonts.ready);
await pg.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
const total = FPS * DURATION;
for (let f = 0; f < total; f++) {
  await pg.evaluate((t) => window.render(t), f / FPS);
  await pg.screenshot({ path: join(FRAMES, `${String(f).padStart(4, "0")}.png`) });
  if (f % 60 === 0) console.log(`frame ${f}/${total}`);
}
await pg.evaluate(() => window.render(3.2));
await pg.screenshot({ path: join(OUT, "demo-poster.png") });
await browser.close();

const mp4 = join(OUT, "youtube-video-scheduler-demo.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(FRAMES, "%04d.png"),
  "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
console.log("wrote", mp4.replace(ROOT + "/", ""));
