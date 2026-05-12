const { expect, test } = require('@playwright/test');
const { PDFDocument } = require('pdf-lib');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const repoRoot = path.resolve(__dirname, '..');
const indexUrl = pathToFileURL(path.join(repoRoot, 'index.html')).href;
const artifactDir = path.join(repoRoot, 'test-results', 'print-validation');
const pdfPath = path.join(artifactDir, 'toc-print-validation.pdf');
const screenshotPath = path.join(artifactDir, 'toc-print-validation.png');

const letterPortrait = {
  width: 612,
  height: 792,
  tolerance: 0.5,
};

async function fillText(page, selector, value) {
  await page.locator(selector).fill(value);
}

async function selectOtherAndFill(page, selectSelector, inputSelector, value) {
  await page.locator(selectSelector).selectOption('Other');
  await expect(page.locator(inputSelector)).toBeVisible();
  await page.locator(inputSelector).fill(value);
}

async function drawSignature(page, boxSelector) {
  const box = page.locator(boxSelector);
  await box.click();
  await expect(page.locator('#sigModal')).toHaveClass(/open/);

  const canvas = page.locator('#sigCanvas');
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();

  const startX = bounds.x + bounds.width * 0.18;
  const midY = bounds.y + bounds.height * 0.55;

  await page.mouse.move(startX, midY);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.34, bounds.y + bounds.height * 0.35, { steps: 6 });
  await page.mouse.move(bounds.x + bounds.width * 0.52, bounds.y + bounds.height * 0.62, { steps: 6 });
  await page.mouse.move(bounds.x + bounds.width * 0.76, bounds.y + bounds.height * 0.42, { steps: 6 });
  await page.mouse.up();

  await page.locator('#sigModalDone').click();
  await expect(page.locator('#sigModal')).not.toHaveClass(/open/);
}

test('completed Transfer of Custody form prints as one Letter portrait page', async ({ page }) => {
  await fs.mkdir(artifactDir, { recursive: true });

  await page.goto(indexUrl, { waitUntil: 'load' });
  await page.locator('#estimatedWeight option', { hasText: '10,000 lbs' }).waitFor({ state: 'attached' });

  await fillText(page, '#tocFormNumber', 'TOC-VALIDATION-20260511-LONG-REFERENCE-001');
  await fillText(page, '#formDate', '05 / 11 / 2026');
  await fillText(page, '#poNumber', 'PO-PRINT-REGRESSION-LONG-000123456789');

  await fillText(page, '#fromCompanyName', 'Representative Long Company Name for Print Regression Validation LLC');
  await fillText(page, '#fromContactName', 'Alexandra Longname-Contact Validation');
  await fillText(page, '#fromAddress', '12345 Very Long Industrial Parkway Suite 678 Building Nine');
  await fillText(page, '#fromPhone', '4025550199');
  await fillText(page, '#fromEmail', 'print.validation@example-customer.com');
  await fillText(page, '#fromCity', 'Lincoln');
  await page.locator('#fromState').selectOption('NE');
  await fillText(page, '#fromZip', '68504-1234');
  await selectOtherAndFill(page, '#transferMethod', '#transferMethodOther', 'Dock pickup with palletized serialized equipment transfer');

  await selectOtherAndFill(page, '#receiverContactName', '#receiverContactNameOther', 'Precision E-Cycle Receiving Validation Team');
  await fillText(page, '#receiverPhone', '4025551267');
  await selectOtherAndFill(page, '#receivedBy', '#receivedByOther', 'Receiving Specialist With Long Validation Name');

  await selectOtherAndFill(page, '#reasonSelect', '#reasonOther', 'Mixed IT asset recycling, data destruction, and audit documentation');
  await page.locator('#dataDestructionYes').check();
  await page.locator('#certificateYes').check();
  await selectOtherAndFill(page, '#estimatedWeight', '#estimatedWeightOther', '9876');
  await fillText(page, '#totalUnits', '12 pallets, 48 laptops, 32 desktops, 24 monitors, and boxed accessories');

  await fillText(page, '#transferSignatureDate', '05/11/2026');
  await fillText(page, '#receiverSignatureDate', '05/11/2026');
  await drawSignature(page, '#sigBox1');
  await drawSignature(page, '#sigBox2');

  await expect(page.locator('#sigPreview1')).toBeVisible();
  await expect(page.locator('#sigPreview2')).toBeVisible();

  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    scale: 1,
    printBackground: true,
    preferCSSPageSize: false,
  });

  const pdfBytes = await fs.readFile(pdfPath);
  const pdf = await PDFDocument.load(pdfBytes);
  expect(pdf.getPageCount()).toBe(1);

  const { width, height } = pdf.getPage(0).getSize();
  expect(width).toBeGreaterThanOrEqual(letterPortrait.width - letterPortrait.tolerance);
  expect(width).toBeLessThanOrEqual(letterPortrait.width + letterPortrait.tolerance);
  expect(height).toBeGreaterThanOrEqual(letterPortrait.height - letterPortrait.tolerance);
  expect(height).toBeLessThanOrEqual(letterPortrait.height + letterPortrait.tolerance);
});
