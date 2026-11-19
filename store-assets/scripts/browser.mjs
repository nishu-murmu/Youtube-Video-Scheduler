// Shared Playwright helpers for the store-asset scripts.
import { chromium } from "playwright";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ASSETS = join(ROOT, "store-assets");

// Use whatever Chromium build Playwright has cached, even if it is not the
// exact revision this Playwright version expects.
export function chromiumPath() {
  const wanted = chromium.executablePath();
  if (existsSync(wanted)) return wanted;
  const cache = join(homedir(), ".cache", "ms-playwright");
  const builds = readdirSync(cache)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort()
    .reverse();
  for (const b of builds) {
    const p = join(cache, b, "chrome-linux64", "chrome");
    if (existsSync(p)) return p;
  }
  throw new Error("No Chromium found. Run: bunx playwright install chromium");
}

export async function launch() {
  return chromium.launch({ executablePath: chromiumPath() });
}

export const fonts = `<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=block" rel="stylesheet">`;
