#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(repoRoot, 'app.js'), 'utf8');

function attrValue(tag, attr) {
  const match = tag.match(new RegExp(`${attr}="([^"]*)"`));
  return match ? match[1] : '';
}

function unique(values) {
  return [...new Set(values)];
}

function arrayLiteral(name) {
  const match = app.match(new RegExp(`${name}: \\[([\\s\\S]*?)\\]`));
  assert.ok(match, `Expected APP.${name} to be present`);
  return unique([...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]));
}

function objectRules(name) {
  const match = app.match(new RegExp(`${name}: \\[([\\s\\S]*?)\\]`));
  assert.ok(match, `Expected APP.${name} to be present`);
  return [...match[1].matchAll(/\{\s*fieldId:\s*'([^']+)',\s*controllerId:\s*'([^']+)',\s*requiredValue:\s*'([^']+)'\s*\}/g)]
    .map(([, fieldId, controllerId, requiredValue]) => ({ fieldId, controllerId, requiredValue }));
}

const idMatches = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const ids = new Set(idMatches);
assert.equal(ids.size, idMatches.length, 'Expected all HTML id attributes to be unique');

const dataSaveTags = [...html.matchAll(/<(input|select|textarea)\b[^>]*\bdata-save="true"[^>]*>/g)].map((match) => match[0]);
const dataSaveIds = dataSaveTags.map((tag) => attrValue(tag, 'id')).filter(Boolean);
assert.ok(dataSaveIds.length > 0, 'Expected saved controls to be discoverable');
assert.equal(dataSaveIds.length, dataSaveTags.length, 'Expected every saved control to have an id');

for (const id of [...arrayLiteral('requiredFieldIds'), ...arrayLiteral('optionalFieldIds')]) {
  assert.ok(ids.has(id), `Expected configured field #${id} to exist in index.html`);
  assert.ok(dataSaveIds.includes(id), `Expected configured field #${id} to be data-save enabled`);
}

for (const { fieldId, controllerId, requiredValue } of objectRules('conditionalRequiredFields')) {
  assert.ok(ids.has(fieldId), `Expected conditional field #${fieldId} to exist`);
  assert.ok(ids.has(controllerId), `Expected conditional controller #${controllerId} to exist`);
  const controllerTag = dataSaveTags.find((tag) => attrValue(tag, 'id') === controllerId);
  assert.ok(controllerTag, `Expected conditional controller #${controllerId} to be saved`);
  assert.ok(html.includes(`<option>${requiredValue}</option>`) || html.includes(`<option value="${requiredValue}">`), `Expected option ${requiredValue} for #${controllerId}`);
}

for (const tag of dataSaveTags.filter((entry) => entry.includes('data-other-target='))) {
  const targetId = attrValue(tag, 'data-other-target');
  assert.ok(ids.has(targetId), `Expected other-field wrapper #${targetId} to exist`);
}

const zipTag = dataSaveTags.find((tag) => attrValue(tag, 'id') === 'fromZip');
assert.equal(attrValue(zipTag, 'data-format'), 'zip', 'Expected ZIP field to opt into ZIP formatting/validation');
assert.match(app, /function formatZipValue\(/, 'Expected ZIP formatter implementation');
assert.match(app, /function isValidZipValue\(/, 'Expected ZIP validator implementation');
assert.doesNotMatch(html, /raw\.githubusercontent\.com/, 'Expected page assets to be repository-local for offline/print reliability');

console.log('Repository form contract checks passed');
