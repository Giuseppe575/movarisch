const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('l’intestazione sticky non copre la prima riga dei risultati', () => {
  const headerRule = css.match(/table#tbl thead th\s*\{([^}]*)\}/);

  assert.ok(headerRule, 'Regola CSS dell’intestazione tabella non trovata');
  assert.match(headerRule[1], /position\s*:\s*sticky/);
  assert.match(headerRule[1], /top\s*:\s*0(?:px)?\s*;/);
  assert.doesNotMatch(headerRule[1], /top\s*:\s*84px/);
});

test('il contenitore della tabella mantiene lo scroll orizzontale', () => {
  const wrapperRule = css.match(/\.table-wrapper\s*\{([^}]*)\}/);

  assert.ok(wrapperRule, 'Regola CSS del contenitore tabella non trovata');
  assert.match(wrapperRule[1], /overflow-x\s*:\s*auto/);
  assert.match(wrapperRule[1], /position\s*:\s*relative/);
});

test('la schermata carica il workflow e i tre pannelli di revisione SDS', () => {
  assert.match(html, /id="sdsReviewSection"/);
  assert.match(html, /src="src\/lib\/sds\/review-workflow\.js"/);
  assert.match(html, /id="sdsReviewList"/);
  assert.match(css, /\.review-panels\s*\{/);
});

test('gli errori di conferma sono mostrati localmente e i campi obbligatori sono evidenziati', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(app, /data-review-error role="alert"/);
  assert.match(app, /Nominativo del professionista <strong>\(obbligatorio\)<\/strong>/);
  assert.match(app, /invalidField\.focus\(\{ preventScroll: true \}\)/);
  assert.match(css, /\[aria-invalid="true"\]/);
});
