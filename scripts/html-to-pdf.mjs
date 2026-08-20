import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'docs', 'guide.html');
const pdfPath = path.join(__dirname, '..', 'docs', 'Forge-Pro-User-Guide.pdf');

async function convertToPdf() {
  console.log('Launching headless Chromium...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`Loading ${htmlPath}...`);
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  // Wait for fonts to load
  await page.waitForTimeout(3000);

  console.log(`Generating PDF → ${pdfPath}...`);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
    printBackground: true,
    displayHeaderFooter: false,
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log(`✅ PDF generated successfully: ${pdfPath}`);
}

convertToPdf().catch((err) => {
  console.error('❌ PDF generation failed:', err.message);
  process.exit(1);
});
