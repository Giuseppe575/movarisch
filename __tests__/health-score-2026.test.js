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
