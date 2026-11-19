// Renders brand/logo.svg to the extension icons, the store icon and site icons.
// Usage: node store-assets/scripts/icons.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, ROOT, ASSETS } from "./browser.mjs";

const svg = readFileSync(join(ASSETS, "brand", "logo.svg"), "utf8");

const targets = [
  ...[16, 32, 48, 96, 128].map((s) => ({
    file: join(ROOT, "public", "icon", `icon-${s}.png`),
    size: s,
    pad: 0,
  })),
  // Chrome Web Store: 128x128 with 96px artwork and 16px transparent padding.
  { file: join(ASSETS, "chrome", "store-icon-128.png"), size: 128, pad: 16 },
  { file: join(ROOT, "site", "icon-192.png"), size: 192, pad: 0 },
  { file: join(ROOT, "site", "icon-512.png"), size: 512, pad: 0 },
  { file: join(ROOT, "site", "apple-touch-icon.png"), size: 180, pad: 0 },
];

const browser = await launch();
const page = await browser.newPage();
for (const { file, size, pad } of targets) {
  mkdirSync(join(file, ".."), { recursive: true });
  const art = size - pad * 2;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">
      <div style="width:${size}px;height:${size}px;padding:${pad}px;box-sizing:border-box">
        <img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}"
             style="width:${art}px;height:${art}px;display:block">
      </div></body></html>`
  );
  await page.screenshot({ path: file, omitBackground: true });
  console.log("wrote", file.replace(ROOT + "/", ""));
}
await browser.close();
