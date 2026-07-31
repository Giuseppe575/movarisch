'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  classifyNavigation,
  isAllowedAppFileUrl,
  isAllowedExternalUrl,
  isPathInside
} = require('../src/electron-security-policy');

const applicationRoot = path.resolve(__dirname, '..');

test('consente file esistenti solo sotto la directory applicativa', () => {
  const indexUrl = pathToFileURL(path.join(applicationRoot, 'index.html'));
  indexUrl.search = '?test=1';
  indexUrl.hash = '#sezione';

  assert.equal(isAllowedAppFileUrl(indexUrl.href, applicationRoot), true);
  assert.equal(classifyNavigation(indexUrl.href, applicationRoot), 'internal');
  assert.equal(isAllowedAppFileUrl('file:///file-che-non-esiste.html', applicationRoot), false);
});

test('blocca file fuori dalla radice applicativa e schemi attivi', () => {
  const restrictedRoot = path.join(applicationRoot, 'support');
  const outsideUrl = pathToFileURL(path.join(applicationRoot, 'index.html')).href;

  assert.equal(isAllowedAppFileUrl(outsideUrl, restrictedRoot), false);
  assert.equal(classifyNavigation('javascript:alert(1)', applicationRoot), 'blocked');
  assert.equal(classifyNavigation('data:text/html,test', applicationRoot), 'blocked');
  assert.equal(classifyNavigation('blob:https://giuseppe575.github.io/id', applicationRoot), 'blocked');
});

test('la verifica di contenimento non accetta prefissi di directory simili', () => {
  const root = path.resolve(applicationRoot, 'support');
  assert.equal(isPathInside(root, path.join(root, 'ticket.html')), true);
  assert.equal(isPathInside(root, path.resolve(applicationRoot, 'support-evil', 'page.html')), false);
});

test('consente soltanto destinazioni HTTPS esplicitamente approvate', () => {
  assert.equal(isAllowedExternalUrl('https://giuseppe575.github.io/movarisch/'), true);
  assert.equal(isAllowedExternalUrl('https://giuseppe575.github.io/movarisch/guida/'), true);
  assert.equal(isAllowedExternalUrl('https://github.com/Giuseppe575/movarisch/issues'), true);
  assert.equal(isAllowedExternalUrl('https://www.garanteprivacy.it/'), true);

  assert.equal(isAllowedExternalUrl('http://giuseppe575.github.io/movarisch/'), false);
  assert.equal(isAllowedExternalUrl('https://evil.example/'), false);
  assert.equal(isAllowedExternalUrl('https://giuseppe575.github.io.evil.example/movarisch/'), false);
  assert.equal(isAllowedExternalUrl('https://user@giuseppe575.github.io/movarisch/'), false);
  assert.equal(isAllowedExternalUrl('https://giuseppe575.github.io:444/movarisch/'), false);
  assert.equal(isAllowedExternalUrl('https://giuseppe575.github.io/altro/'), false);
});

test('mailto è limitato all’indirizzo ufficiale', () => {
  assert.equal(
    isAllowedExternalUrl('mailto:atis.giuseppe@gmail.com?subject=MOVARISCH%20-%20Segnalazione'),
    true
  );
  assert.equal(isAllowedExternalUrl('mailto:attacker@example.com'), false);
  assert.equal(isAllowedExternalUrl('mailto:atis.giuseppe@gmail.com,attacker@example.com'), false);
});
