const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

test('il Word non esporta la tabella analitica degli ingredienti', () => {
  assert.doesNotMatch(app, /Dettaglio ingredienti - Sezione 3/);
  assert.doesNotMatch(app, /const ingredientHeader = new TableRow/);
});

test('il Word non esporta la nota tecnica interna sulle sezioni SDS', () => {
  assert.doesNotMatch(app, /Nota metodologica sull\\'uso delle sezioni SDS/);
  assert.doesNotMatch(app, /Sezione 16 - altre informazioni/);
  assert.doesNotMatch(app, /Validazione professionale/);
  assert.doesNotMatch(app, /Correzioni manuali/);
});

test('il report esterno non esporta i warning tecnici del parser', () => {
  assert.doesNotMatch(app, /reportWarningSummary\(r\)/);
  assert.doesNotMatch(app, /\['Avvertenze verificate', Array\.from/);
});
