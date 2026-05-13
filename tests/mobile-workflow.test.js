#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
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

const { chromium, devices } = loadPlaywright();

const repoRoot = path.resolve(__dirname, '..');
const indexUrl = pathToFileURL(path.join(repoRoot, 'index.html')).href;

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext(devices['iPhone 13']);
  const page = await context.newPage();

  try {
    await page.goto(indexUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    const clearBox = await page.locator('[data-action="new-form"]').boundingBox();
    const printBox = await page.locator('[data-action="print"]').boundingBox();
    const viewport = page.viewportSize();

    assert.ok(clearBox, 'Expected Clear Saved Data button to be visible in portrait mobile toolbar');
    assert.ok(printBox, 'Expected Print button to be visible in portrait mobile toolbar');
    assert.ok(viewport, 'Expected viewport size');
    assert.ok(clearBox.x >= 0 && clearBox.x + clearBox.width <= viewport.width, 'Expected Clear Saved Data button to fit within portrait viewport');
    assert.ok(printBox.x >= 0 && printBox.x + printBox.width <= viewport.width, 'Expected Print button to fit within portrait viewport');
    assert.ok(printBox.width >= 96, `Expected portrait Print button tap target to be at least 96px wide, got ${printBox.width}`);
    assert.ok(printBox.height >= 48, `Expected portrait Print button tap target to be at least 48px tall, got ${printBox.height}`);

    const savedStatusStyles = await page.locator('#savedAtStatus').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        color: styles.color,
        width: el.getBoundingClientRect().width,
      };
    });

    assert.notEqual(savedStatusStyles.display, 'none', 'Expected saved status to remain visible in portrait mobile toolbar');
    assert.ok(savedStatusStyles.width > 0, 'Expected saved status to have readable width in portrait mobile toolbar');
    assert.notEqual(savedStatusStyles.color, 'rgb(0, 0, 0)', 'Expected saved status text not to render black on the dark toolbar');

    await page.selectOption('#receiverContactName', 'Ilya Shulyak');
    await page.locator('#receiverContactName').dispatchEvent('change');
    assert.equal(await page.locator('#receiverPhone').inputValue(), '(402) 413-1267');
    assert.equal(await page.locator('#receivedBy').inputValue(), 'Ilya Shulyak');

    await page.selectOption('#receivedBy', 'Slavic Brychka');
    await page.locator('#receivedBy').dispatchEvent('change');
    assert.equal(await page.locator('#receivedBy').inputValue(), 'Slavic Brychka');

    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#receiverContactName').inputValue(), 'Ilya Shulyak');
    assert.equal(await page.locator('#receiverPhone').inputValue(), '(402) 413-1267');
    assert.equal(await page.locator('#receivedBy').inputValue(), 'Slavic Brychka');

    console.log('Mobile toolbar and receiving-party autofill workflow passed');
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
