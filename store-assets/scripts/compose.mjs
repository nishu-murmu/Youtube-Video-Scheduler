// Turns the raw captures in store-assets/.raw into store screenshots, promo
// tiles and the site's social image.
// Usage: node store-assets/scripts/capture.mjs && node store-assets/scripts/compose.mjs
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { launch, ROOT, ASSETS, fonts } from "./browser.mjs";

const RAW = join(ASSETS, ".raw");
const CHROME = join(ASSETS, "chrome");
const SITE_IMG = join(ROOT, "site", "img");
mkdirSync(SITE_IMG, { recursive: true });

const raw = (n) => pathToFileURL(join(RAW, `${n}.png`)).href;
const logo = `data:image/svg+xml;base64,${readFileSync(join(ASSETS, "brand", "logo.svg")).toString("base64")}`;


const css = `
  * { box-sizing: border-box; margin: 0; }
  body { font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased; color: #18181b; }
  .kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 1.9em; height: 1.9em; padding: 0 .5em; border-radius: .4em;
         background: #fff; color: #18181b; font-weight: 600; box-shadow: inset 0 -2px 0 #d4d4d8, 0 0 0 1px #e4e4e7; }
`;

// Browser window frame around a capture. Captures are 1440x900 CSS px, shown at `w` wide.
function frame({ img, w = 1120, url = "youtube.com", popup }) {
  const h = Math.round((w * 900) / 1440);
  return `
  <div class="win" style="width:${w}px">
    <div class="bar">
      <span class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span>
      <span class="url">${url}</span>
      <img class="ext" src="${logo}">
    </div>
    <div class="view" style="height:${h}px"><img src="${img}" style="width:${w}px;height:${h}px">
      ${popup ? `<img class="popup" src="${popup}">` : ""}
    </div>
  </div>`;
}
const frameCss = `
  .win { border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px rgba(24,24,27,.08), 0 30px 60px -20px rgba(24,24,27,.35); }
  .bar { height: 40px; display: flex; align-items: center; gap: 12px; padding: 0 14px; background: #f4f4f5; border-bottom: 1px solid #e4e4e7; }
  .dots { display: flex; gap: 8px; } .dots i { width: 12px; height: 12px; border-radius: 50%; display: block; }
  .url { flex: 0 1 440px; margin: 0 auto; height: 26px; border-radius: 13px; background: #fff; box-shadow: 0 0 0 1px #e4e4e7;
         display: flex; align-items: center; justify-content: center; font-size: 13px; color: #52525b; }
  .ext { width: 22px; height: 22px; }
  .view { position: relative; overflow: hidden; }
  .view > img { display: block; }
  .popup { position: absolute; top: 4px; right: 10px; width: 340px; height: 480px; border-radius: 12px; overflow: hidden;
           box-shadow: 0 0 0 1px rgba(24,24,27,.12), 0 24px 48px -12px rgba(24,24,27,.45); }
`;

function screenshotHtml({ title, sub, img, popup, url }) {
  return `<!doctype html><html><head>${fonts}<style>${css}${frameCss}
    body { width: 1280px; height: 800px; overflow: hidden; background: #fafafa; position: relative; }
    body::before { content: ""; position: absolute; inset: 0; background: radial-gradient(900px 300px at 50% -60px, #fee2e2, transparent 70%); }
    header { position: relative; text-align: center; padding-top: 44px; height: 168px; }
    h1 { font-size: 46px; line-height: 56px; font-weight: 800; letter-spacing: -.025em; }
    h1 em { font-style: normal; color: #dc2626; }
    p { margin-top: 10px; font-size: 21px; color: #52525b; }
    .stage { position: relative; display: flex; justify-content: center; }
  </style></head><body>
    <header><h1>${title}</h1><p>${sub}</p></header>
    <div class="stage">${frame({ img, popup, url })}</div>
  </body></html>`;
}

const shots = [
  { file: "screenshot-1-schedule", title: "Schedule any video <em>for later</em>.", sub: "Hover a thumbnail, click +, and pick a time. A reminder opens it for you.", img: raw("add-modal") },
  { file: "screenshot-2-dashboard", title: "Every scheduled video in one place.", sub: "Press Ctrl+I to search, reschedule or remove videos.", img: raw("dashboard") },
  { file: "screenshot-3-missed", title: "Missed one? <em>Reschedule</em> it.", sub: "Videos you didn't open in time are collected so nothing slips away.", img: raw("missed") },
  { file: "screenshot-4-runtime", title: "Know the real runtime <em>at any speed</em>.", sub: "12:30 at 2x shows as 12:30 (06:15) right in the player.", img: raw("watch"), url: "youtube.com/watch" },
  { file: "screenshot-5-shorts", title: "Set a <em>Shorts limit</em> that works for you.", sub: "Choose how many Shorts per session and write your own reminder.", img: raw("shorts-warning"), popup: raw("popup"), url: "youtube.com/shorts" },
];

function marqueeHtml() {
  return `<!doctype html><html><head>${fonts}<style>${css}
    body { width: 1400px; height: 560px; overflow: hidden; background: #18181b; color: #fafafa; position: relative; }
    body::before { content: ""; position: absolute; inset: 0;
      background: radial-gradient(600px 420px at 85% 40%, rgba(220,38,38,.35), transparent 70%), radial-gradient(500px 300px at 0% 100%, rgba(63,63,70,.6), transparent 70%); }
    .left { position: absolute; left: 76px; top: 70px; width: 640px; }
    .brand { display: flex; align-items: center; gap: 16px; font-size: 26px; font-weight: 700; }
    .brand img { width: 56px; height: 56px; }
    h1 { margin-top: 52px; font-size: 64px; line-height: 70px; font-weight: 800; letter-spacing: -.03em; }
    h1 em { font-style: normal; color: #f87171; }
    p { margin-top: 22px; font-size: 23px; line-height: 34px; color: #a1a1aa; }
    .keys { margin-top: 30px; display: flex; align-items: center; gap: 10px; font-size: 20px; color: #a1a1aa; }
    .modal { position: absolute; right: 64px; top: 64px; width: 600px; height: 606px; border-radius: 22px; overflow: hidden;
             box-shadow: 0 40px 80px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.08); }
    .modal img { position: absolute; width: ${1440 * 600 / 520}px; left: ${-460 * 600 / 520}px; top: ${-187 * 600 / 520}px; }
  </style></head><body>
    <div class="left">
      <div class="brand"><img src="${logo}">YouTube Video Scheduler</div>
      <h1>Save it for later.<br><em>Actually</em> watch it.</h1>
      <p>Schedule videos with a reminder, see the real runtime at any speed, and cap your Shorts.</p>
      <div class="keys"><span class="kbd">Ctrl</span>+<span class="kbd">I</span><span style="margin-left:8px">opens your schedule</span></div>
    </div>
    <div class="modal"><img src="${raw("add-modal")}"></div>
  </body></html>`;
}

function smallHtml() {
  return `<!doctype html><html><head>${fonts}<style>${css}
    body { width: 440px; height: 280px; overflow: hidden; background: #18181b; color: #fafafa; position: relative; }
    body::before { content: ""; position: absolute; inset: 0; background: radial-gradient(260px 220px at 100% 0%, rgba(220,38,38,.45), transparent 70%); }
    .wrap { position: absolute; left: 32px; top: 30px; right: 28px; }
    img { width: 64px; height: 64px; }
    h1 { margin-top: 20px; font-size: 30px; line-height: 34px; font-weight: 800; letter-spacing: -.02em; }
    p { margin-top: 12px; font-size: 17px; line-height: 24px; color: #a1a1aa; }
    em { font-style: normal; color: #f87171; }
  </style></head><body><div class="wrap">
    <img src="${logo}">
    <h1>YouTube Video<br>Scheduler</h1>
    <p>Schedule videos. Get reminded <em>on time</em>.</p>
  </div></body></html>`;
}

function ogHtml() {
  return `<!doctype html><html><head>${fonts}<style>${css}${frameCss}
    body { width: 1200px; height: 630px; overflow: hidden; background: #18181b; color: #fafafa; position: relative; }
    body::before { content: ""; position: absolute; inset: 0; background: radial-gradient(600px 400px at 90% 30%, rgba(220,38,38,.35), transparent 70%); }
    .left { position: absolute; left: 64px; top: 64px; width: 520px; }
    .brand { display: flex; align-items: center; gap: 14px; font-size: 24px; font-weight: 700; }
    .brand img { width: 52px; height: 52px; }
    h1 { margin-top: 60px; font-size: 60px; line-height: 66px; font-weight: 800; letter-spacing: -.03em; }
    h1 em { font-style: normal; color: #f87171; }
    p { margin-top: 22px; font-size: 22px; line-height: 32px; color: #a1a1aa; }
    .modal { position: absolute; right: 56px; top: 70px; width: 520px; height: 525px; border-radius: 20px; overflow: hidden;
             box-shadow: 0 40px 80px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.08); }
    .modal img { position: absolute; width: 1440px; left: -460px; top: -187px; }
  </style></head><body>
    <div class="left">
      <div class="brand"><img src="${logo}">YouTube Video Scheduler</div>
      <h1>Save it for later.<br><em>Actually</em> watch it.</h1>
      <p>A free Chrome and Firefox extension for scheduling videos, real runtimes at any speed and a Shorts limit.</p>
    </div>
    <div class="modal"><img src="${raw("add-modal")}"></div>
  </body></html>`;
}

const browser = await launch();
const page = await browser.newPage();
async function render(html, w, h, out) {
  const tmp = join(RAW, "compose.html");
  writeFileSync(tmp, html);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(pathToFileURL(tmp).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: out });
  console.log("wrote", out.replace(ROOT + "/", ""));
}

for (const s of shots) {
  await render(screenshotHtml(s), 1280, 800, join(CHROME, `${s.file}.png`));
}
await render(marqueeHtml(), 1400, 560, join(CHROME, "promo-marquee-1400x560.png"));
await render(smallHtml(), 440, 280, join(CHROME, "promo-small-440x280.png"));
await render(ogHtml(), 1200, 630, join(ROOT, "site", "og-image.png"));
await browser.close();
