const test = require('node:test');
const assert = require('node:assert/strict');

const { parseSection3Ingredients } = require('../src/lib/sds/ingredient-parser.js');
const { evaluateHealthRisk } = require('../src/lib/movarisch-health-engine.js');

function evaluateSection3(lines) {
  const parsed = parseSection3Ingredients({ number: '3', lines });
  const health = evaluateHealthRisk({
    productHazards: [],
    ingredients: parsed.ingredients,
    isMixture: true,
    productClassified: false,
    mixturePhase: 'liquido',
    compositionComplete: false,
  });
  return { parsed, health };
}

test('pipeline sezione 3 applica la soglia CMR2 inclusiva 0,1% p/p', () => {
  const { parsed, health } = evaluateSection3([
    { text: 'Sostanza CMR categoria 2', page: 4, line: 10 },
    { text: 'CAS 50-00-0', page: 4, line: 11 },
    { text: '0,1 % p/p Carc. 2 H351', page: 4, line: 12 },
  ]);

  assert.equal(parsed.status, 'parsed');
  assert.equal(parsed.ingredients[0].concentration.basis, 'mass');
  assert.equal(health.status, 'calculated');
  assert.equal(health.score, 5.5);
  assert.equal(health.ruleId, 'UNCLASSIFIED_MIXTURE_INGREDIENT_GE8');
  assert.equal(health.determiningHazard.section, 3);
});

test('pipeline sezione 3 non calcola quando l intervallo attraversa la soglia', () => {
  const { health } = evaluateSection3([
    { text: 'Sostanza CMR categoria 2', page: 4, line: 20 },
    { text: 'CAS 50-00-0', page: 4, line: 21 },
    { text: '0,05 - 0,2 % p/p Carc. 2 H351', page: 4, line: 22 },
  ]);

  assert.equal(health.status, 'needs_review');
  assert.equal(health.score, null);
  assert.ok(health.warnings.some((warning) => warning.includes('INGREDIENT_THRESHOLD_UNCERTAIN')));
});
