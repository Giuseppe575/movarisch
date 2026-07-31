const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

test('il Word non esporta la tabella analitica degli ingredienti', () => {
  assert.doesNotMatch(app, /Dettaglio ingredienti - Sezione 3/);
  assert.doesNotMatch(app, /const ingredientHeader = new TableRow/);
});

test('le sezioni SDS sono spiegate in una nota metodologica separata', () => {
  assert.match(app, /Nota metodologica sull\\'uso delle sezioni SDS/);
  assert.match(app, /Sezione 16 - altre informazioni/);
  assert.match(app, /non sono state utilizzate direttamente per determinare lo score/);
});

test('il report esterno usa descrizioni comprensibili e non codici di warning del parser', () => {
  assert.match(app, /reportWarningSummary\(r\)/);
  assert.doesNotMatch(app, /\['Avvertenze verificate', Array\.from/);
});
