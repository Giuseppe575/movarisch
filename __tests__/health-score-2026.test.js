const test = require('node:test');
const assert = require('node:assert/strict');

const data = require('../src/data/movarisch-health-2026.js');
const { evaluateHealthRisk } = require('../src/lib/movarisch-health-engine.js');

test('tabella MoVaRisCh 2026: punteggi campione trascritti dalla fonte ufficiale', () => {
  assert.equal(data.getHealthScore('H315'), 2.50);
  assert.equal(data.getHealthScore('H318'), 4.50);
  assert.equal(data.getHealthScore('H330 categoria 1'), 8.50);
  assert.equal(data.getHealthScore('H314 cat. 1A'), 6.25);
  assert.equal(data.getHealthScore('H317', '1A'), 6.00);
  assert.equal(data.getHealthScore('EUH380'), 10.00);
});

test('lookup conserva i suffissi H361fd/H350i e non inventa una categoria mancante', () => {
  assert.equal(data.getHealthScore('H361fd'), 8.00);
  assert.equal(data.normalizeHazardCode('H350i - può provocare il cancro se inalato'), 'H350I');
  const ambiguous = data.lookupHealthHazard('H317');
  assert.equal(ambiguous.found, false);
  assert.equal(ambiguous.ambiguous, true);
  assert.deepEqual(ambiguous.candidates.map((row) => row.category), ['1A', '1B']);
});

test('il calcolo ordinario usa il massimo della sola sezione 2 e ignora la sezione 16', () => {
  const output = evaluateHealthRisk({
    productHazards: [
      { code: 'H317', category: '1A', section: 2 },
      { code: 'H361fd', section: 16 },
    ],
    ingredients: [{ name: 'traccia', hazards: ['H351'] }],
    isMixture: true,
    productClassified: true,
  });
  assert.equal(output.status, 'calculated');
  assert.equal(output.score, 6.00);
  assert.equal(output.determiningHazard.code, 'H317');
  assert.equal(output.ruleId, 'PRODUCT_SECTION_2_MAX_SCORE');
  assert.ok(output.warnings.includes('PRODUCT_NON_SECTION_2_IGNORED'));
});

test('pericoli fisici, ambientali ed EUH informativi non sospendono lo score salute', () => {
  const output = evaluateHealthRisk({
    productHazards: [
      { code: 'H226', category: '3', section: 2 },
      { code: 'H290', category: '1', section: 2 },
      { code: 'H318', category: '1', section: 2 },
      { code: 'H411', section: 2 },
      { code: 'EUH210', section: 2 },
    ],
    ingredients: [],
    isMixture: false,
    productClassified: true,
  });
  assert.equal(output.status, 'calculated');
  assert.equal(output.score, 4.50);
  assert.equal(output.determiningHazard.code, 'H318');
  assert.ok(output.warnings.includes('PRODUCT_NON_HEALTH_HAZARD_IGNORED:H226'));
  assert.ok(output.warnings.includes('PRODUCT_NON_HEALTH_HAZARD_IGNORED:H411'));
  assert.ok(output.warnings.includes('PRODUCT_NON_HEALTH_HAZARD_IGNORED:EUH210'));
});

test('una miscela classificata soltanto per pericoli non sanitari passa alle regole ingredienti', () => {
  const output = evaluateHealthRisk({
    productHazards: [{ code: 'H226', category: '3', section: 2 }],
    ingredients: [],
    isMixture: true,
    productClassified: true,
    compositionComplete: false,
  });
  assert.equal(output.status, 'needs_review');
  assert.equal(output.ruleId, 'UNCLASSIFIED_MIXTURE_REQUIRES_STRUCTURED_INGREDIENT_DATA');
  assert.ok(!output.warnings.some((warning) => warning.startsWith('PRODUCT_UNMAPPED_HAZARD:')));
});
