/**
 * Înregistrează demo-ul animat la /demo-video în format 9:16 (1080×1920).
 *
 * Utilizare:
 *   npm run demo:record
 *
 * Opțional: PORT=3001 npm run demo:record
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_DIR = path.join(ROOT, "output", "demo-video");
const PUBLIC_OUT = path.join(ROOT, "public", "demo-flow.mp4");
const PUBLIC_WEBM = path.join(ROOT, "public", "demo-flow.webm");

function waitForServer(url, timeoutMs = 90_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else retry();
      });
      req.on("error", retry);
      function retry() {
        if (Date.now() - started > timeoutMs) reject(new Error(`Server nu a pornit la ${url}`));
        else setTimeout(tick, 500);
      }
    };
    tick();
  });
}

async function ensureDevServer() {
  try {
    await waitForServer(BASE_URL, 2_000);
    console.log(`✓ Server activ la ${BASE_URL}`);
    return null;
  } catch {
    console.log("Pornesc dev server…");
    const child = spawn("npm", ["run", "dev", "--", "-p", String(PORT)], {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, NODE_ENV: "development" },
    });
    await waitForServer(BASE_URL);
    return child;
  }
}

async function convertToMp4(webmPath, mp4Path) {
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(
    "ffmpeg",
    ["-y", "-i", webmPath, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "fast", "-movflags", "+faststart", mp4Path],
    { stdio: "inherit" }
  );
  return result.status === 0;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const devChild = await ensureDevServer();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 540, height: 960 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1080, height: 1920 },
    },
    locale: "ro-RO",
  });

  const page = await context.newPage();
  console.log("Încarc demo-ul…");
  await page.goto(`${BASE_URL}/demo-video?autoplay=1`, { waitUntil: "networkidle" });

  await page.waitForFunction(() => window.__DEMO_VIDEO_READY__ === true, { timeout: 30_000 });
  console.log("Rulează animația…");
  await page.waitForFunction(() => window.__DEMO_VIDEO_DONE__ === true, { timeout: 240_000 });
  await page.waitForTimeout(800);

  await context.close();
  await browser.close();

  const videos = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => ({ f, t: fs.statSync(path.join(OUTPUT_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);

  if (videos.length === 0) {
    console.error("Nu s-a găsit fișier video.");
    process.exit(1);
  }

  const webmPath = path.join(OUTPUT_DIR, videos[0].f);
  fs.copyFileSync(webmPath, PUBLIC_WEBM);
  console.log(`✓ WebM: ${PUBLIC_WEBM}`);

  const mp4Ok = await convertToMp4(webmPath, PUBLIC_OUT);
  if (mp4Ok) {
    console.log(`✓ MP4:  ${PUBLIC_OUT}`);
  } else {
    console.log("ffmpeg indisponibil — folosește demo-flow.webm sau instalează ffmpeg pentru MP4.");
  }

  if (devChild) {
    devChild.kill();
  }

  console.log("\nGata! Video 9:16 în public/demo-flow.webm" + (mp4Ok ? " și public/demo-flow.mp4" : ""));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
