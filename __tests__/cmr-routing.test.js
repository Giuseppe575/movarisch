const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateHealthRisk } = require('../src/lib/movarisch-health-engine.js');

for (const code of ['H340', 'H350', 'H350i', 'H360', 'H360D', 'H360F', 'H360FD', 'H360Df', 'H360Fd']) {
  test(`${code} del prodotto viene instradato fuori dal calcolo Capo I`, () => {
    const output = evaluateHealthRisk({
      productHazards: [{ code, section: 2 }],
      isMixture: true,
      productClassified: true,
    });
    assert.equal(output.status, 'excluded_cmr');
    assert.equal(output.score, null);
    assert.equal(output.ruleId, 'PRODUCT_CMR_CATEGORY_1_TITLE_IX_CAPO_II');
  });
}

test('CMR categoria 2 H341/H351/H361 resta nel calcolo MoVaRisCh', () => {
  for (const code of ['H341', 'H351', 'H361', 'H361fd']) {
    const output = evaluateHealthRisk({
      productHazards: [{ code, section: 2 }],
      isMixture: false,
      productClassified: true,
    });
    assert.equal(output.status, 'calculated');
    assert.equal(output.score, 8.00);
  }
});

test('un ingrediente CMR non rende automaticamente CMR la miscela', () => {
  const output = evaluateHealthRisk({
    productHazards: [{ code: 'H319', section: 2 }],
    ingredients: [{ name: 'traccia CMR', hazards: ['H350'] }],
    isMixture: true,
    productClassified: true,
  });
  assert.equal(output.status, 'calculated');
  assert.equal(output.score, 3.00);
  assert.notEqual(output.status, 'excluded_cmr');
  assert.ok(output.warnings.includes('INGREDIENT_CMR_REQUIRES_MIXTURE_CLASSIFICATION_CHECK:H350'));
});
