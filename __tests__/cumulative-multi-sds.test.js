const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'cumulative-report.html'), 'utf8');

test('la scheda cumulativa elabora tutte le SDS e non soltanto la prima riga', () => {
  assert.match(source, /const rows=data\.rows/);
  assert.match(source, /rows\.map\(\(row,index\)/);
  assert.doesNotMatch(source, /rows\[0\]/);
});

test('i DPI cumulativi provengono dalla sezione 8 e distinguono gli esiti', () => {
  assert.match(source, /row\.sdsEvidence\?\.dpi\?\.items/);
  assert.match(source, /required:\['Indicato dalla SDS'/);
  assert.match(source, /recommended:\['Consigliato dalla SDS'/);
  assert.match(source, /conditional:\['Condizionato allo scenario'/);
  assert.match(source, /l’obbligatorietà finale deriva dalla valutazione professionale/);
});

test('la matrice DPI mantiene un giudizio distinto per ogni prodotto', () => {
  assert.match(source, /id="productsTable"/);
  assert.match(source, /Giudizio dalla SDS/);
  assert.match(source, /Indicato dalla SDS/);
  assert.match(source, /Non richiesto dalla SDS/);
  assert.doesNotMatch(source, /required:\['Da adottare'/);
});
