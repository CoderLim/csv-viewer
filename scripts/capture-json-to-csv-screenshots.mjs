import { chromium } from 'playwright';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'public/imgs/json-to-csv');
const sampleJson = path.join(root, 'public/samples/demo-users.json');
const baseUrl = process.env.APP_URL ?? 'http://localhost:3000';

async function resizeScreenshot(
  page,
  inputPath,
  outputPath,
  width,
  height,
  objectPosition = 'left top',
  overlayHtml = ''
) {
  const imageBuffer = await readFile(inputPath);
  const imageBase64 = imageBuffer.toString('base64');

  await page.setViewportSize({ width, height });
  await page.setContent(`
    <!doctype html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: ${width}px; height: ${height}px; background: #fff; overflow: hidden; }
          .frame { position: relative; width: 100%; height: 100%; overflow: hidden; }
          img { width: 100%; height: 100%; object-fit: cover; object-position: ${objectPosition}; display: block; }
          .overlay {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid #dbeafe;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.96);
            padding: 10px 14px;
            color: #0f172a;
            font: 600 14px/1.4 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          }
        </style>
      </head>
      <body>
        <div class="frame">
          <img src="data:image/png;base64,${imageBase64}" />
          ${overlayHtml}
        </div>
      </body>
    </html>
  `);
  await page.screenshot({ path: outputPath, type: 'png' });
}

async function loadConvertedTable(page) {
  await page.goto(`${baseUrl}/json-to-csv`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[type="file"]', { state: 'attached' });
  await page.locator('input[type="file"]').setInputFiles(sampleJson);
  await page.waitForSelector('table');
  await page.waitForTimeout(600);
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    colorScheme: 'light',
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  const workspace = () => page.locator('#hero .mx-auto.w-full.max-w-6xl').first();

  // Upload zone (idle)
  await page.goto(`${baseUrl}/json-to-csv`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[type="file"]', { state: 'attached' });
  await page.waitForTimeout(400);
  await workspace().screenshot({
    path: path.join(outputDir, 'upload-zone.raw.png'),
  });

  // Paste tab with sample JSON
  await page.getByRole('button', { name: 'Paste JSON' }).click();
  await page.waitForTimeout(300);
  const sampleText = await readFile(sampleJson, 'utf8');
  await page.locator('textarea').fill(sampleText.slice(0, 320) + '...');
  await workspace().screenshot({
    path: path.join(outputDir, 'paste-json.raw.png'),
  });

  // Table preview after file upload
  await loadConvertedTable(page);
  await workspace().screenshot({
    path: path.join(outputDir, 'table-preview.raw.png'),
  });

  await workspace().screenshot({
    path: path.join(outputDir, 'introduce-main.raw.png'),
  });

  await workspace().screenshot({
    path: path.join(outputDir, 'download-ready.raw.png'),
  });

  await workspace().screenshot({
    path: path.join(outputDir, 'privacy.raw.png'),
  });

  // Mobile viewport
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto(`${baseUrl}/json-to-csv`, { waitUntil: 'networkidle' });
  await mobilePage.waitForSelector('input[type="file"]', { state: 'attached' });
  await mobilePage.locator('input[type="file"]').setInputFiles(sampleJson);
  await mobilePage.waitForSelector('table');
  await mobilePage.waitForTimeout(600);
  const mobileWorkspace = mobilePage.locator('#hero .mx-auto.w-full.max-w-6xl').first();
  await mobileWorkspace.screenshot({
    path: path.join(outputDir, 'mobile.raw.png'),
  });

  const cropPage = await browser.newPage();
  const targets = [
    ['introduce-main.raw.png', 'introduce-main.png', 1200, 800, 'left top', ''],
    ['upload-zone.raw.png', 'upload.png', 800, 600, 'center top', ''],
    ['table-preview.raw.png', 'table-preview.png', 800, 600, 'left top', ''],
    ['download-ready.raw.png', 'download.png', 800, 600, 'left top', ''],
    [
      'privacy.raw.png',
      'privacy.png',
      800,
      600,
      'left top',
      '<div class="overlay">🔒 Your data stays in your browser — nothing is sent to our servers</div>',
    ],
    ['introduce-main.raw.png', 'guide.png', 1200, 800, 'center top', ''],
    ['upload-zone.raw.png', 'benefits-no-account.png', 800, 600, 'center top', ''],
    ['table-preview.raw.png', 'benefits-nested.png', 800, 600, 'left center', ''],
    ['mobile.raw.png', 'benefits-devices.png', 800, 600, 'left top', ''],
    ['paste-json.raw.png', 'benefits-free.png', 800, 600, 'center top', ''],
  ];

  for (const [inputName, outputName, width, height, objectPosition, overlayHtml] of targets) {
    await resizeScreenshot(
      cropPage,
      path.join(outputDir, inputName),
      path.join(outputDir, outputName),
      width,
      height,
      objectPosition,
      overlayHtml
    );
  }

  for (const name of [
    'introduce-main.raw.png',
    'upload-zone.raw.png',
    'table-preview.raw.png',
    'download-ready.raw.png',
    'privacy.raw.png',
    'mobile.raw.png',
    'paste-json.raw.png',
  ]) {
    await unlink(path.join(outputDir, name)).catch(() => {});
  }

  await browser.close();
  console.log('Screenshots saved to public/imgs/json-to-csv/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
