const test = require('node:test');
const assert = require('node:assert/strict');

const { parseSdsSections } = require('../src/lib/sds/section-parser.js');
const { parseHazards } = require('../src/lib/sds/hazard-parser.js');

test('mantiene i suffissi CLP di H361fd, H360FD e H350i', () => {
  const hazards = parseHazards('H361fd\nH360FD\nH350i', { section: 16 });

  assert.deepEqual(hazards.map((item) => item.code), ['H361fd', 'H360FD', 'H350i']);
  assert.deepEqual(hazards.map((item) => item.baseCode), ['H361', 'H360', 'H350']);
  assert.ok(hazards.every((item) => item.section === '16'));
});

test('estrae EUH e codici con spazi tipografici', () => {
  const hazards = parseHazards('EUH 066: esposizione ripetuta. H 317: allergia.', { section: '2' });

  assert.deepEqual(hazards.map((item) => item.code), ['EUH066', 'H317']);
});

test('associa categorie poste prima, dopo e su righe adiacenti', () => {
  const hazards = parseHazards([
    'Categoria 1A',
    'H317: Può provocare una reazione allergica cutanea',
    'H315 - Provoca irritazione cutanea - Categoria 2',
    'Carc. 1B H350: Può provocare il cancro'
  ].join('\n'), { section: 2 });

  assert.deepEqual(hazards.map((item) => [item.code, item.category]), [
    ['H317', '1A'],
    ['H315', '2'],
    ['H350', '1B']
  ]);
  assert.match(hazards[0].sourceText, /Categoria 1A/);
  assert.equal(hazards[1].sourceText, 'H315 - Provoca irritazione cutanea - Categoria 2');
});

test('conserva pagina e sezione provenienti dal parser SDS', () => {
  const parsed = parseSdsSections({
    pages: [
      { pageNumber: 4, lines: [{ text: 'SEZIONE 2: Pericoli' }, { text: 'Skin Sens. 1A, H317' }] },
      { pageNumber: 5, lines: [{ text: 'SEZIONE 3: Composizione' }] },
      { pageNumber: 9, lines: [{ text: 'SEZIONE 16: Informazioni' }] }
    ]
  });
  const hazards = parseHazards(parsed.sections['2']);

  assert.equal(hazards[0].section, '2');
  assert.equal(hazards[0].page, 4);
  assert.equal(hazards[0].category, '1A');
  assert.match(hazards[0].sourceText, /H317/);
});

test('non assegna una categoria attraversando una riga con un altro codice H', () => {
  const hazards = parseHazards('Categoria 1A H317\nH315\nCategoria 2 H319', { section: 2 });

  assert.equal(hazards.find((item) => item.code === 'H315').category, null);
});
