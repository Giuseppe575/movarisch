const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const it = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', 'it.json'), 'utf8'));

test('le soglie mostrate coincidono con la classificazione implementata', () => {
  assert.deepEqual(Object.values(it.legend.items).map(item => item.range), [
    '0,1 ≤ R < 15', '15 ≤ R < 21', '21 ≤ R ≤ 40', '40 < R ≤ 80', 'R > 80'
  ]);
  assert.match(app, /test:\(r\)=> r < 15/);
  assert.match(app, /test:\(r\)=> r >= 15 && r < 21/);
  assert.match(app, /test:\(r\)=> r >= 21 && r <= 40/);
  assert.match(app, /test:\(r\)=> r > 40 && r <= 80/);
  assert.match(app, /test:\(r\)=> r > 80/);
  assert.match(it.legend.items.irr.text, /medico competente/);
});

test('il tutorial descrive il nuovo flusso di conferma rapida', () => {
  assert.equal(it.tutorial.steps.length, 5);
  assert.match(it.tutorial.steps.join(' '), /conferma insieme le SDS/);
  assert.match(it.tutorial.steps.join(' '), /scheda cumulativa/);
  assert.doesNotMatch(it.tutorial.steps.join(' '), /SDS\/TDS/);
  assert.doesNotMatch(`${it.header.subtitle} ${it.buttons.selectPdf}`, /SDS\/TDS/);
  assert.match(it.header.subtitle, /revisione rapida/);
  assert.match(it.legend.defaultNote, /non valori normativi/);
});

test('i quattro collegamenti di supporto puntano a risorse locali esistenti', () => {
  for (const target of Object.values(it.links)) {
    assert.ok(fs.existsSync(path.join(root, target)), `Risorsa mancante: ${target}`);
  }
});

test('la palette principale usa uno sfondo blu ardesia più chiaro', () => {
  assert.match(css, /--bg:#172235/);
  assert.match(css, /--card:#202c43/);
  assert.match(css, /background:linear-gradient\(180deg,#172235,#22324d\)/);
});
