/**
 * Capture full-page screenshots of every L6 web route + a short demo video.
 * Requires: web on http://127.0.0.1:3000 and Playwright Chromium installed.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3000";
const OUT = process.env.DEMO_OUT ?? "/opt/cursor/artifacts/screenshots";
const VIDEO_DIR = process.env.DEMO_VIDEO_DIR ?? "/opt/cursor/artifacts/demo-raw";
const REPO_DOCS =
  process.env.DEMO_DOCS ?? join(fileURLToPath(new URL(".", import.meta.url)), "../../../docs/demo");

mkdirSync(OUT, { recursive: true });
mkdirSync(VIDEO_DIR, { recursive: true });
mkdirSync(REPO_DOCS, { recursive: true });

const routes = [
  { path: "/", name: "01-today" },
  { path: "/alarms", name: "02-alarms" },
  { path: "/alarms/alm_1001", name: "03-alarm-detail" },
  { path: "/prescriptions", name: "04-prescriptions" },
  { path: "/prescriptions/rx_9001", name: "05-prescription-detail" },
  { path: "/evidence/evd_4401", name: "06-evidence" },
  { path: "/analyst", name: "07-analyst" },
  { path: "/reports", name: "08-reports" },
  { path: "/energy", name: "09-energy" },
  { path: "/equipment", name: "10-equipment" },
  { path: "/intensity", name: "11-intensity" },
  { path: "/settings/integrations", name: "12-integrations" },
  { path: "/settings/admin", name: "13-admin" },
];

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });

// --- Full-page screenshots ---
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  for (const r of routes) {
    const url = `${BASE}${r.path}`;
    console.log(`screenshot ${r.name} <- ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page);
    const file = join(OUT, `${r.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    copyFileSync(file, join(REPO_DOCS, `${r.name}.png`));
  }
  // Analyst Mode A overlay on Today
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const ask = page.getByRole("button", { name: /Ask Analyst/i });
  if (await ask.isVisible().catch(() => false)) {
    await ask.click();
    await page.waitForTimeout(500);
    const file = join(OUT, "14-analyst-mode-a.png");
    await page.screenshot({ path: file, fullPage: false });
    copyFileSync(file, join(REPO_DOCS, "14-analyst-mode-a.png"));
  }
  await context.close();
}

// --- Fast demo video (core ops journey) ---
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await settle(page);

  // Ask Analyst open/close
  const ask = page.getByRole("button", { name: /Ask Analyst/i });
  if (await ask.isVisible().catch(() => false)) {
    await ask.click();
    await page.waitForTimeout(600);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  // Alarms → detail → ack-looking action if present
  await page.goto(`${BASE}/alarms`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await page.goto(`${BASE}/alarms/alm_1001`, { waitUntil: "domcontentloaded" });
  await settle(page);

  // Prescriptions → triage
  await page.goto(`${BASE}/prescriptions`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const defer = page.getByRole("button", { name: /Defer/i }).first();
  if (await defer.isVisible().catch(() => false)) {
    await defer.click();
    await page.waitForTimeout(400);
  }
  await page.goto(`${BASE}/prescriptions/rx_9001`, { waitUntil: "domcontentloaded" });
  await settle(page);

  // Evidence + reports export approve
  await page.goto(`${BASE}/evidence/evd_4401`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await page.goto(`${BASE}/reports`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const approve = page.getByRole("button", { name: /^Approve$/i }).first();
  if (await approve.isVisible().catch(() => false)) {
    await approve.click();
    await page.waitForTimeout(500);
  }

  // Reveal analytics screens quickly
  for (const p of ["/energy", "/equipment", "/intensity", "/settings/admin"]) {
    await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
    await settle(page);
  }

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await settle(page);

  await context.close();
}

await browser.close();

// Promote video to stable name
const vids = readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
if (vids.length === 0) {
  console.error("No video produced");
  process.exit(1);
}
const src = join(VIDEO_DIR, vids[vids.length - 1]);
const destArtifacts = "/opt/cursor/artifacts/l6-ui-demo.webm";
const destDocs = join(REPO_DOCS, "l6-ui-demo.webm");
copyFileSync(src, destArtifacts);
copyFileSync(src, destDocs);
console.log(JSON.stringify({ screenshots: OUT, video: destArtifacts, docs: REPO_DOCS }, null, 2));
