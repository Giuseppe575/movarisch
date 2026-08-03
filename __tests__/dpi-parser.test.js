const test = require('node:test');
const assert = require('node:assert/strict');
const { parseSection8Dpi, classifyInstruction, summarizeInstruction } = require('../src/lib/sds/dpi-parser.js');

test('classifica indicazioni DPI obbligatorie, consigliate e condizionate senza trasformarle tutte in obblighi', () => {
  assert.equal(classifyInstruction('Utilizzare guanti protettivi conformi alla EN 374.'), 'required');
  assert.equal(classifyInstruction('Si consiglia di indossare occhiali protettivi EN 166.'), 'recommended');
  assert.equal(classifyInstruction('In caso di superamento del valore limite indossare una maschera con filtro A.'), 'conditional');
  assert.equal(classifyInstruction('Protezione respiratoria non necessaria.'), 'not_required');
});

test('la sintesi DPI conserva i dati tecnici senza troncare parole', () => {
  const source = 'Utilizzare guanti protettivi conformi alla norma UNI EN 374-3 di classe pari o superiore a 3 (PVC, neoprene o gomma), spessore 0,12 mm, AQL 1,5, tempo di permeazione 30 minuti. L’idoneità e la stabilità di un guanto dipendono dall’utilizzo e dalla frequenza di contatto.';
  const summary = summarizeInstruction(source);
  assert.match(summary, /UNI EN 374-3/);
  assert.match(summary, /spessore 0,12 mm/);
  assert.match(summary, /AQL 1,5/);
  assert.match(summary, /permeazione 30 minuti/);
  assert.doesNotMatch(summary, /L’idoneità/);
  assert.doesNotMatch(summary, /\bdef$/);
});

test('estrae le quattro famiglie DPI dalla sezione 8 e conserva la pagina', () => {
  const section = {
    pageStart: 5,
    text: [
      'PROTEZIONE DELLE MANI',
      'Utilizzare guanti protettivi conformi alla EN 374.',
      'PROTEZIONE DEGLI OCCHI',
      'Si consiglia di indossare occhiali ermetici EN 166.',
      'PROTEZIONE DELLA PELLE',
      'Indossare abiti da lavoro con maniche lunghe.',
      'PROTEZIONE RESPIRATORIA',
      'In caso di superamento del TLV usare un filtro A EN 14387.'
    ].join('\n'),
    lines: [
      { text: 'PROTEZIONE DELLE MANI', page: 5 },
      { text: 'Utilizzare guanti protettivi conformi alla EN 374.', page: 5 },
      { text: 'PROTEZIONE DEGLI OCCHI', page: 6 },
      { text: 'Si consiglia di indossare occhiali ermetici EN 166.', page: 6 },
      { text: 'PROTEZIONE DELLA PELLE', page: 6 },
      { text: 'Indossare abiti da lavoro con maniche lunghe.', page: 6 },
      { text: 'PROTEZIONE RESPIRATORIA', page: 7 },
      { text: 'In caso di superamento del TLV usare un filtro A EN 14387.', page: 7 }
    ]
  };
  const parsed = parseSection8Dpi(section);
  assert.equal(parsed.sectionFound, true);
  assert.equal(parsed.items.length, 4);
  assert.equal(parsed.items.find(item => item.category === 'hands').status, 'required');
  assert.equal(parsed.items.find(item => item.category === 'eyesFace').status, 'recommended');
  assert.equal(parsed.items.find(item => item.category === 'respiratory').status, 'conditional');
  assert.equal(parsed.items.find(item => item.category === 'respiratory').page, 7);
});
