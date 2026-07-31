const test = require('node:test');
const assert = require('node:assert/strict');

const { parseSdsSections } = require('../src/lib/sds/section-parser.js');

test('separa le sezioni SDS italiane conservando pagine e righe', () => {
  const result = parseSdsSections({
    pages: [
      { pageNumber: 1, lines: [{ text: 'SEZIONE 1: Identificazione' }, { text: 'Prodotto X' }] },
      { pageNumber: 2, lines: [{ text: 'SEZIONE 2. Identificazione dei pericoli' }, { text: 'H317' }] },
      { pageNumber: 3, lines: [{ text: 'SEZIONE 3 - Composizione' }, { text: 'Ingrediente Y' }] },
      { pageNumber: 8, lines: [{ text: 'SEZIONE 16: Altre informazioni' }, { text: 'Testo completo H317' }] }
    ]
  });

  assert.deepEqual(Object.keys(result.sections), ['1', '2', '3', '16']);
  assert.equal(result.sections['2'].pageStart, 2);
  assert.equal(result.sections['2'].text, 'H317');
  assert.equal(result.sections['16'].lines[1].page, 8);
  assert.equal(result.warnings.length, 0);
});

test('supporta SECTION inglese e form feed fra pagine', () => {
  const result = parseSdsSections('SECTION 2: Hazards identification\nH317\fSECTION 3: Composition\nSubstance');

  assert.equal(result.sections['2'].title, 'Hazards identification');
  assert.equal(result.sections['3'].pageStart, 2);
  assert.ok(result.warnings.some((warning) => warning.section === '16'));
});

test('segnala input senza intestazioni e sezioni rilevanti mancanti', () => {
  const result = parseSdsSections('Testo non strutturato\nH315');

  assert.deepEqual(result.sections, {});
  assert.ok(result.warnings.some((warning) => warning.code === 'NO_SECTION_HEADINGS'));
  assert.equal(result.warnings.filter((warning) => warning.code === 'MISSING_RELEVANT_SECTION').length, 3);
});

test('rifiuta formati di input non validi', () => {
  assert.throws(() => parseSdsSections(null), /stringa|pages/i);
});
