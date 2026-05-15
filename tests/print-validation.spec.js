#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') {
      throw new Error('Playwright is not installed. Run `npm install`, then `npx playwright install chromium`, and retry this check.');
    }
    throw error;
  }
}

const { chromium } = loadPlaywright();

const repoRoot = path.resolve(__dirname, '..');
const indexUrl = pathToFileURL(path.join(repoRoot, 'index.html')).href;
const artifactDir = path.join(repoRoot, 'test-results', 'print-validation');
const pdfPath = path.join(artifactDir, 'toc-print-validation.pdf');
const screenshotPath = path.join(artifactDir, 'toc-print-validation.png');

function countPdfPages(pdfBuffer) {
  const pdfText = pdfBuffer.toString('latin1');
  return (pdfText.match(/\/Type\s*\/Page\b/g) || []).length;
}

async function fillText(page, selector, value) {
  const field = page.locator(selector);
  await field.fill(value);
  await field.dispatchEvent('input');
}

async function selectOtherAndFill(page, selectSelector, inputSelector, value) {
  await page.selectOption(selectSelector, 'Other');
  await page.locator(selectSelector).dispatchEvent('change');
  await page.locator(inputSelector).waitFor({ state: 'visible' });
  await fillText(page, inputSelector, value);
}

async function drawSignature(page, boxSelector) {
  await page.click(boxSelector);
  const modal = page.locator('#sigModal');
  await modal.waitFor({ state: 'visible' });

  const canvas = page.locator('#sigCanvas');
  const bounds = await canvas.boundingBox();
  assert.ok(bounds, `Expected ${boxSelector} canvas bounds`);

  const startX = bounds.x + bounds.width * 0.18;
  const midY = bounds.y + bounds.height * 0.55;

  await page.mouse.move(startX, midY);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.34, bounds.y + bounds.height * 0.35, { steps: 6 });
  await page.mouse.move(bounds.x + bounds.width * 0.52, bounds.y + bounds.height * 0.62, { steps: 6 });
  await page.mouse.move(bounds.x + bounds.width * 0.76, bounds.y + bounds.height * 0.42, { steps: 6 });
  await page.mouse.up();

  await page.click('#sigModalDone');
  await page.waitForFunction((selector) => {
    const box = document.querySelector(selector);
    const img = box && box.querySelector('img');
    return Boolean(box && box.classList.contains('sig-has-data') && img && img.src.startsWith('data:image/png'));
  }, boxSelector);
}

async function main() {
  await fs.mkdir(artifactDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 1 });

  try {
    await page.goto(indexUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
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
    await page.selectOption('#fromState', 'NE');
    await fillText(page, '#fromZip', '68504-1234');
    await selectOtherAndFill(page, '#transferMethod', '#transferMethodOther', 'Dock pickup with palletized serialized equipment transfer');

    await selectOtherAndFill(page, '#receivedBy', '#receivedByOther', 'Receiving Specialist With Long Validation Name');

    await selectOtherAndFill(page, '#reasonSelect', '#reasonOther', 'Mixed IT asset recycling, data destruction, and audit documentation');
    await page.check('#certificateYes');
    await selectOtherAndFill(page, '#estimatedWeight', '#estimatedWeightOther', '9876');
    await fillText(page, '#totalUnits', '12 pallets, 48 laptops, 32 desktops, 24 monitors, and boxed accessories');

    await fillText(page, '#transferSignatureDate', '05/11/2026');
    await fillText(page, '#receiverSignatureDate', '05/11/2026');
    await drawSignature(page, '#sigBox1');
    await drawSignature(page, '#sigBox2');

    await page.emulateMedia({ media: 'print' });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const pdfBuffer = await page.pdf({
      path: pdfPath,
      format: 'Letter',
      scale: 1,
      printBackground: true,
      preferCSSPageSize: false,
    });

    const pageCount = countPdfPages(pdfBuffer);
    assert.equal(pageCount, 1, `Expected generated Letter PDF to have exactly one page, got ${pageCount}. See ${pdfPath}`);

    console.log(`Generated ${pdfPath}`);
    console.log(`Generated ${screenshotPath}`);
    console.log('PDF page count: 1');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
