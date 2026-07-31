const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateHealthRisk } = require('../src/lib/movarisch-health-engine.js');

test('miscela classificata con P prodotto < 4 e ingrediente >= 8 riceve lo score generico 5,50', () => {
  const output = evaluateHealthRisk({
    productHazards: [{ code: 'H319', section: 2 }],
    ingredients: [{ name: 'ingrediente critico', hazards: [{ code: 'H351', section: 3 }] }],
    isMixture: true,
    productClassified: true,
  });
  assert.equal(output.status, 'calculated');
  assert.equal(output.score, 5.50);
  assert.equal(output.ruleId, 'CLASSIFIED_MIXTURE_PRODUCT_LT4_INGREDIENT_GE8');
  assert.equal(output.determiningHazard.genericMixtureScore, true);
});

test('un ingrediente >= 8 non sostituisce il punteggio di un prodotto gia >= 4', () => {
  const output = evaluateHealthRisk({
    productHazards: [{ code: 'H317', category: '1A', section: 2 }],
    ingredients: [{ hazards: ['H351'] }],
    isMixture: true,
    productClassified: true,
  });
  assert.equal(output.status, 'calculated');
  assert.equal(output.score, 6.00);
  assert.equal(output.ruleId, 'PRODUCT_SECTION_2_MAX_SCORE');
});

test('prima regola per miscela non classificata e revisione se i dati non bastano', () => {
  const high = evaluateHealthRisk({
    productHazards: [],
    ingredients: [{ hazards: ['EUH381'], qualifiesForGenericScoring: true }],
    isMixture: true,
    productClassified: false,
  });
  assert.equal(high.status, 'calculated');
  assert.equal(high.score, 5.50);
  assert.equal(high.ruleId, 'UNCLASSIFIED_MIXTURE_INGREDIENT_GE8');

  const thresholdUnknown = evaluateHealthRisk({
    productHazards: [],
    ingredients: [{ hazards: ['EUH381'] }],
    isMixture: true,
    productClassified: false,
  });
  assert.equal(thresholdUnknown.status, 'needs_review');
  assert.ok(thresholdUnknown.warnings.includes('UNCLASSIFIED_MIXTURE_CONCENTRATION_THRESHOLDS_REQUIRE_REVIEW'));

  const incomplete = evaluateHealthRisk({
    productHazards: [],
    ingredients: [{ hazards: ['H315'] }],
    isMixture: true,
    productClassified: false,
  });
  assert.equal(incomplete.status, 'needs_review');
  assert.equal(incomplete.score, null);
  assert.ok(incomplete.warnings.includes('UNCLASSIFIED_MIXTURE_DATA_INSUFFICIENT_FOR_GENERIC_SCORE'));
});

test('una miscela classificata con P < 4 richiede i dati della sezione 3', () => {
  const output = evaluateHealthRisk({
    productHazards: [{ code: 'H319', section: 2 }],
    ingredients: [],
    isMixture: true,
    productClassified: true,
  });
  assert.equal(output.status, 'needs_review');
  assert.equal(output.score, null);
  assert.equal(output.ruleId, 'LOW_SCORE_MIXTURE_REQUIRES_INGREDIENT_REVIEW');
  assert.ok(output.warnings.includes('INGREDIENT_DATA_MISSING_FOR_LOW_SCORE_MIXTURE_CHECK'));
});
