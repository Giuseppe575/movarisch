const test = require('node:test');
const assert = require('node:assert/strict');

const { parseSdsSections } = require('../src/lib/sds/section-parser.js');
const { parseHazards } = require('../src/lib/sds/hazard-parser.js');
const { evaluateHealthRisk } = require('../src/lib/movarisch-health-engine.js');

function preferCategorized(hazards) {
  const selected = new Map();
  for (const hazard of hazards) {
    const current = selected.get(hazard.code.toUpperCase());
    if (!current || (!current.category && hazard.category)) selected.set(hazard.code.toUpperCase(), hazard);
  }
  return [...selected.values()];
}

test('regressione SDS TECNO PAVIMENTI: sezione 2 H317 cat.1A determina P=6,00', () => {
  const fixture = [
    'SEZIONE 2. Identificazione dei pericoli',
    'Classificazione e indicazioni di pericolo:',
    'Sensibilizzazione cutanea, categoria 1A H317 Può provocare una reazione allergica cutanea.',
    'Indicazioni di pericolo:',
    'H317 Può provocare una reazione allergica cutanea.',
    'SEZIONE 3. Composizione/informazioni sugli ingredienti',
    '3.2. Miscele',
    'Piperonale',
    '0 < x < 0,05 Repr. 2 H361fd, Skin Sens. 1B H317',
    'SEZIONE 16. Altre informazioni',
    'Testo delle indicazioni di pericolo (H) citate alle sezioni 2-3 della scheda:',
    'H361fd Sospettato di nuocere alla fertilità. Sospettato di nuocere al feto.',
    'H317 Può provocare una reazione allergica cutanea.'
  ].join('\n');

  const parsed = parseSdsSections(fixture);
  const productHazards = preferCategorized(parseHazards(parsed.sections['2']));
  const ingredientHazards = preferCategorized(parseHazards(parsed.sections['3']));
  const referenceHazards = preferCategorized(parseHazards(parsed.sections['16']));
  const result = evaluateHealthRisk({
    productHazards,
    ingredients: [{ name: 'Ingredienti sezione 3', hazards: ingredientHazards }],
    isMixture: true,
    productClassified: true
  });

  assert.equal(result.status, 'calculated');
  assert.equal(result.score, 6.00);
  assert.equal(result.determiningHazard.code, 'H317');
  assert.equal(result.determiningHazard.category, '1A');
  assert.equal(result.ruleId, 'PRODUCT_SECTION_2_MAX_SCORE');
  assert.ok(ingredientHazards.some(hazard => hazard.code === 'H361fd'));
  assert.ok(referenceHazards.some(hazard => hazard.code === 'H361fd'));
});

test('regressione metamorfica: cambiare le frasi della sezione 16 non cambia lo score', () => {
  const base = [
    'SEZIONE 2. Identificazione dei pericoli',
    'Skin Sens. 1A H317',
    'SEZIONE 3. Composizione/informazioni sugli ingredienti',
    '3.2. Miscele',
    'SEZIONE 16. Altre informazioni'
  ].join('\n');

  function calculate(extraSection16) {
    const parsed = parseSdsSections(`${base}\n${extraSection16}`);
    return evaluateHealthRisk({
      productHazards: parseHazards(parsed.sections['2']),
      ingredients: [],
      isMixture: true,
      productClassified: true
    }).score;
  }

  assert.equal(calculate('H315'), 6.00);
  assert.equal(calculate('H361fd H350 H340 EUH380'), 6.00);
});
