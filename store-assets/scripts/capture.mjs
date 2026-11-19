// Loads the built extension (.output/chrome-mv3) into Chromium, serves the
// mock pages at youtube.com URLs, and captures the real extension UI.
// Usage: bun run build && node store-assets/scripts/capture.mjs
import { chromium } from "playwright";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromiumPath, ROOT, ASSETS } from "./browser.mjs";
import { homePage, watchPage, shortsPage, embedPage } from "./mock/pages.mjs";
import { thumbnailSvg, videos } from "./mock/videos.mjs";

const EXT = join(ROOT, ".output", "chrome-mv3");
const RAW = join(ASSETS, ".raw");
mkdirSync(RAW, { recursive: true });
const only = process.argv.slice(2);
const want = (name) => !only.length || only.includes(name);

const context = await chromium.launchPersistentContext(
  mkdtempSync(join(tmpdir(), "yvs-profile-")),
  {
    executablePath: chromiumPath(),
    headless: true,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: "en-US",
    timezoneId: "Asia/Kolkata",
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  }
);

await context.route("https://i.ytimg.com/**", (route) => {
  const id = new URL(route.request().url()).pathname.split("/")[2];
  route.fulfill({ contentType: "image/svg+xml", body: thumbnailSvg(id) });
});
await context.route("https://www.youtube.com/**", (route) => {
  const url = new URL(route.request().url());
  let body;
  if (url.pathname.startsWith("/embed/")) body = embedPage(url.pathname.split("/")[2]);
  else if (url.pathname === "/watch") body = watchPage(url.searchParams.get("v"));
  else if (url.pathname.startsWith("/shorts/")) body = shortsPage(url.pathname.split("/")[2]);
  else body = homePage();
  route.fulfill({ contentType: "text/html; charset=utf-8", body });
});

let [worker] = context.serviceWorkers();
worker ??= await context.waitForEvent("serviceworker");
const extId = worker.url().split("/")[2];
const sw = (fn, arg) => worker.evaluate(fn, arg);
const setStorage = (data) => sw((d) => chrome.storage.local.set(d), data);
const sendToTab = (url, msg) =>
  sw(
    async ({ url, msg }) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((t) => t.url?.startsWith(url));
      return chrome.tabs.sendMessage(tab.id, msg);
    },
    { url, msg }
  );

const at = (dayOffset, h, m) => {
  const d = new Date("2026-11-19T00:00:00+05:30");
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return JSON.stringify(d.toISOString());
};
const sched = (v, time) => ({
  id: v.id,
  name: v.title,
  time,
  url: `https://www.youtube.com/watch?v=${v.id}`,
});

const page = await context.newPage();
const shot = async (name, opts = {}) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(RAW, `${name}.png`), ...opts });
  console.log("captured", name);
};

// 1. Hover icon + schedule modal on the home grid
if (want("home") || want("modal")) {
  await setStorage({ schedules: [], missedSchedules: [], dashboardVisible: false });
  await page.goto("https://www.youtube.com/");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector(".hover-icon-container", { state: "attached", timeout: 15000 });
  await page.mouse.move(1300, 850);
  await shot("home-plain");
  const card = page.locator("ytd-rich-item-renderer").nth(2);
  await card.locator("yt-thumbnail-view-model").hover();
  await shot("home-hover");
  await card.locator("#hover-icon").click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /^Tomorrow/ }).click();
  await page.waitForTimeout(700);
  await page.mouse.move(1300, 850);
  await shot("add-modal");
}

// 2. Dashboard (Ctrl+I)
if (want("dashboard")) {
  await setStorage({
    missedSchedules: [],
    dashboardVisible: true,
    schedules: [
      sched(videos[1], at(0, 20, 30)),
      sched(videos[0], at(1, 9, 0)),
      sched(videos[3], at(1, 18, 45)),
      sched(videos[6], at(2, 7, 30)),
      sched(videos[4], at(3, 21, 0)),
      sched(videos[7], at(5, 22, 15)),
    ],
  });
  await page.goto("https://www.youtube.com/");
  await page.waitForTimeout(1500);
  await sendToTab("https://www.youtube.com/", { action: "TOGGLE_DASHBOARD" });
  await page.waitForTimeout(2500);
  await shot("dashboard");
  await setStorage({ dashboardVisible: false });
}

// 3. Missed schedules table
if (want("missed")) {
  await setStorage({
    schedules: [],
    missedSchedules: [
      sched(videos[2], at(-1, 19, 0)),
      sched(videos[5], at(-1, 7, 15)),
      sched(videos[7], at(-2, 22, 30)),
    ],
  });
  await page.goto("https://www.youtube.com/");
  const host = page.locator("missed-videos-table-component");
  await host.waitFor({ state: "attached", timeout: 10000 });
  await page.waitForTimeout(2000);
  await host.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await shot("missed");
  await setStorage({ missedSchedules: [] });
}

// 4. Real duration at playback speed
if (want("watch")) {
  await page.goto(`https://www.youtube.com/watch?v=${videos[2].id}`);
  await page.waitForTimeout(1800);
  await page.evaluate(() => {
    document.querySelector("ytd-watch-metadata").append(document.createElement("span"));
  });
  await page.waitForFunction(() =>
    document.querySelector(".ytp-time-duration")?.textContent.includes("(")
  );
  await shot("watch");
}

// 5. Shorts limit reached
if (want("shorts")) {
  await page.goto(`https://www.youtube.com/shorts/${videos[5].id}`);
  await page.waitForTimeout(1500);
  await sendToTab("https://www.youtube.com/shorts/", { action: "LIMIT_EXCEEDED" });
  await page.waitForTimeout(1200);
  await shot("shorts-warning");
}

// 6. Popup (Shorts limit settings)
if (want("popup")) {
  const popup = await context.newPage();
  await popup.setViewportSize({ width: 340, height: 480 });
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await popup.addStyleTag({ content: "body{margin:0}" });
  await popup.waitForTimeout(1200);
  await popup.screenshot({ path: join(RAW, "popup.png"), omitBackground: true });
  console.log("captured popup");
  await popup.close();
}

await context.close();
