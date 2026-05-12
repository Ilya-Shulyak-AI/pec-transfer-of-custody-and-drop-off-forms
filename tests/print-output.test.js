#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') {
      throw new Error('Playwright is not installed. Run `npm install`, then `npx playwright install chromium`, and retry `npm run test:print`.');
    }
    throw error;
  }
}

const { chromium } = loadPlaywright();

const repoRoot = path.resolve(__dirname, '..');
const indexUrl = pathToFileURL(path.join(repoRoot, 'index.html')).href;
const artifactDir = path.join(repoRoot, 'test-artifacts');
const pdfPath = path.join(artifactDir, 'print-output.pdf');
const screenshotPath = path.join(artifactDir, 'print-output.png');

function countPdfPages(pdfBuffer) {
  const pdfText = pdfBuffer.toString('latin1');
  const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g) || [];
  return pageMatches.length;
}

async function fillText(page, selector, value) {
  const field = page.locator(selector);
  await field.fill(value);
  await field.dispatchEvent('input');
}

async function selectOther(page, selectSelector, inputSelector, otherValue) {
  await page.selectOption(selectSelector, 'Other');
  await page.locator(selectSelector).dispatchEvent('change');
  await fillText(page, inputSelector, otherValue);
}

async function drawSignature(page, signatureBoxSelector, points) {
  await page.click(signatureBoxSelector);
  const canvas = page.locator('#sigCanvas');
  await canvas.waitFor({ state: 'visible' });
  const box = await canvas.boundingBox();
  assert.ok(box, `Expected ${signatureBoxSelector} signature canvas to be visible`);

  await page.mouse.move(box.x + points[0][0], box.y + points[0][1]);
  await page.mouse.down();
  for (const [x, y] of points.slice(1)) {
    await page.mouse.move(box.x + x, box.y + y, { steps: 4 });
  }
  await page.mouse.up();
  await page.click('#sigModalDone');
  await expectSignatureSaved(page, signatureBoxSelector);
}

async function expectSignatureSaved(page, signatureBoxSelector) {
  await page.waitForFunction((selector) => {
    const box = document.querySelector(selector);
    const img = box && box.querySelector('img');
    return Boolean(box && box.classList.contains('sig-has-data') && img && img.src.startsWith('data:image/png'));
  }, signatureBoxSelector);
}

async function main() {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 1 });

  try {
    await page.goto(indexUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    await fillText(page, '#tocFormNumber', 'TOC-PRINT-REGRESSION-0001-LONG');
    await fillText(page, '#formDate', '05 / 11 / 2026');
    await fillText(page, '#poNumber', 'PO-PRINT-QUALITY-2026-EXTENDED');

    await fillText(page, '#fromCompanyName', 'A Very Long Transferring Company Name Incorporated With Multiple Divisions');
    await fillText(page, '#fromContactName', 'Alexandria Montgomery-Sutherland the Third');
    await fillText(page, '#fromAddress', '12345 Extremely Long Industrial Recycling Boulevard Suite 9876');
    await fillText(page, '#fromPhone', '4025550199');
    await fillText(page, '#fromEmail', 'long.contact.name@example-customer-domain.test');
    await fillText(page, '#fromCity', 'North Platte Industrial District');
    await fillText(page, '#fromState', 'ne');
    await fillText(page, '#fromZip', '69101-1234');
    await selectOther(page, '#transferMethod', '#transferMethodOther', 'Customer-arranged freight with dock appointment');

    await selectOther(page, '#receiverContactName', '#receiverContactNameOther', 'Precision E-Cycle Receiving Specialist With Long Name');
    await fillText(page, '#receiverPhone', '4025551267');
    await selectOther(page, '#receivedBy', '#receivedByOther', 'Jordan Avery Longname Receiver');

    await selectOther(page, '#reasonSelect', '#reasonOther', 'Secure electronics recycling and serialized asset transfer');
    await page.check('#dataDestructionYes');
    await page.check('#certificateYes');
    await selectOther(page, '#estimatedWeight', '#estimatedWeightOther', '9876');
    await fillText(page, '#totalUnits', '14 pallets, 222 laptops, 31 monitors, assorted peripherals');

    await fillText(page, '#transferSignatureDate', '05/11/2026');
    await fillText(page, '#receiverSignatureDate', '05/11/2026');
    await drawSignature(page, '#sigBox1', [[30, 85], [85, 45], [140, 95], [205, 55], [275, 80]]);
    await drawSignature(page, '#sigBox2', [[35, 95], [90, 55], [150, 100], [215, 60], [285, 90]]);

    await page.emulateMedia({ media: 'print' });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const pdfBuffer = await page.pdf({
      path: pdfPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' },
      preferCSSPageSize: true
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
