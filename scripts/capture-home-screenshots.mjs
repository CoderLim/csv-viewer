import { chromium } from 'playwright';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'public/imgs/csv-viewer');
const sampleCsv = path.join(root, 'public/samples/demo-sales.csv');
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

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    colorScheme: 'light',
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[type="file"]', { state: 'attached' });

  const workspace = page.locator('#hero .mx-auto.w-full.max-w-6xl').first();

  await workspace.screenshot({
    path: path.join(outputDir, 'benefits-no-install.raw.png'),
  });

  await page.locator('input[type="file"]').setInputFiles(sampleCsv);
  await page.waitForSelector('table');
  await page.waitForTimeout(500);

  await workspace.screenshot({
    path: path.join(outputDir, 'introduce-main.raw.png'),
  });

  await workspace.screenshot({
    path: path.join(outputDir, 'benefits-privacy.raw.png'),
  });

  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await mobilePage.waitForSelector('input[type="file"]', { state: 'attached' });
  await mobilePage.locator('input[type="file"]').setInputFiles(sampleCsv);
  await mobilePage.waitForSelector('table');
  await mobilePage.waitForTimeout(500);

  const mobileWorkspace = mobilePage.locator('#hero .mx-auto.w-full.max-w-6xl').first();
  await mobileWorkspace.screenshot({
    path: path.join(outputDir, 'benefits-devices-mobile.raw.png'),
  });

  const cropPage = await browser.newPage();
  const targets = [
    ['introduce-main.raw.png', 'introduce-main.png', 960, 640, 'left top', ''],
    ['benefits-no-install.raw.png', 'benefits-no-install.png', 960, 640, 'center top', ''],
    [
      'benefits-privacy.raw.png',
      'benefits-privacy.png',
      960,
      640,
      'left top',
      '<div class="overlay">🔒 Your files stay in your browser — nothing is uploaded to our servers</div>',
    ],
    ['benefits-devices-mobile.raw.png', 'benefits-devices.png', 960, 640, 'left top', ''],
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
    await unlink(path.join(outputDir, inputName));
  }

  await browser.close();
  console.log('Screenshots saved to public/imgs/csv-viewer/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
