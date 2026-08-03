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
  assert.match(source, /required:\['Prescritto nella SDS'/);
  assert.match(source, /recommended:\['Consigliato nella SDS'/);
  assert.match(source, /conditional:\['Richiesto alle condizioni indicate'/);
  assert.match(source, /carattere obbligatorio del DPI deve essere confermato dal professionista/);
  assert.doesNotMatch(source, /sourceText\.slice\(0,360\)/);
});

test('la matrice DPI mantiene un giudizio distinto per ogni prodotto', () => {
  assert.match(source, /id="productsTable"/);
  assert.match(source, /Indicazione SDS/);
  assert.match(source, /Prescritto nella SDS/);
  assert.match(source, /Non richiesto dalla SDS/);
  assert.doesNotMatch(source, /required:\['Da adottare'/);
});

test('la cumulativa espone frasi H con descrizione ed export Word modificabile', () => {
  assert.match(source, /id="hazardStatementsTable"/);
  assert.match(source, /Prodotto e SDS di riferimento/);
  assert.match(source, /Frase H/);
  assert.match(source, /Descrizione/);
  assert.match(source, /id="exportCumulativeWordBtn"/);
  assert.match(source, /MOVARISCH_scheda_cumulativa\.docx/);
  assert.match(source, /src\/lib\/docx\.umd\.js/);
  assert.match(source, /src\/data\/hazard-statements-it\.js/);
});
