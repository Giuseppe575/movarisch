const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateHealthRisk } = require('../src/lib/movarisch-health-engine.js');

function evaluate(ingredient, extra) {
  const structuredIngredient = Object.assign({}, ingredient);
  if ((structuredIngredient.concentrationPercent != null || structuredIngredient.concentration != null || structuredIngredient.concentrationRange != null) &&
      structuredIngredient.concentrationBasis == null) structuredIngredient.concentrationBasis = 'mass';
  return evaluateHealthRisk(Object.assign({
    productHazards: [],
    ingredients: [structuredIngredient],
    isMixture: true,
    productClassified: false,
    compositionComplete: true,
    physicalState: 'liquid',
  }, extra || {}));
}

test('soglia generale: 1% non gassoso e 0,2% gassoso sono inclusive', () => {
  const nonGas = evaluate({
    name: 'tossico inalatorio',
    concentrationPercent: 1,
    hazards: [{ code: 'H330', category: '1', section: 3 }],
  });
  assert.equal(nonGas.status, 'calculated');
  assert.equal(nonGas.score, 5.5);
  assert.equal(nonGas.determiningHazard.concentrationThresholdPercent, 1);

  const gas = evaluate({
    concentrationPercent: 0.2,
    concentrationBasis: 'volume',
    hazards: [{ code: 'H330', category: '1', section: 3 }],
  }, { mixturePhase: 'gas' });
  assert.equal(gas.status, 'calculated');
  assert.equal(gas.score, 5.5);
  assert.equal(gas.determiningHazard.concentrationThresholdPercent, 0.2);

  const below = evaluate({
    concentrationPercent: 0.199,
    concentrationBasis: 'volume',
    hazards: [{ code: 'H330', category: '1', section: 3 }],
  }, { mixturePhase: 'gas' });
  assert.equal(below.status, 'needs_review');
  assert.equal(below.score, null);
});

test('classi speciali CMR2 ed EUH381 usano la soglia inclusiva 0,1% p/p', () => {
  for (const code of ['H351', 'H361fd', 'EUH381']) {
    const atThreshold = evaluate({
      concentrationPercent: 0.1,
      concentrationBasis: 'mass',
      hazards: [{ code, section: 3 }],
    });
    assert.equal(atThreshold.status, 'calculated', code);
    assert.equal(atThreshold.score, 5.5, code);
    assert.equal(atThreshold.determiningHazard.concentrationThresholdPercent, 0.1, code);

    const below = evaluate({
      concentrationPercent: 0.099,
      concentrationBasis: 'mass',
      hazards: [{ code, section: 3 }],
    });
    assert.equal(below.status, 'needs_review', code);
    assert.equal(below.score, null, code);
  }
});

test('sensibilizzanti 1A e 1B applicano rispettivamente 0,01% e 0,1% p/p', () => {
  const category1A = evaluate({
    concentrationPercent: 0.01,
    concentrationBasis: 'mass',
    hazards: [{ code: 'H317', category: '1A', section: 3 }],
  });
  assert.equal(category1A.status, 'calculated');
  assert.equal(category1A.score, 4);
  assert.equal(category1A.ruleId, 'UNCLASSIFIED_MIXTURE_SKIN_SENSITIZER_1A');

  const category1ABelow = evaluate({
    concentrationPercent: 0.009,
    concentrationBasis: 'mass',
    hazards: [{ code: 'H317', category: '1A', section: 3 }],
  });
  assert.equal(category1ABelow.status, 'needs_review');

  const category1B = evaluate({
    concentrationPercent: 0.1,
    concentrationBasis: 'mass',
    hazards: [{ code: 'H317', category: '1B', section: 3 }],
  });
  assert.equal(category1B.status, 'calculated');
  assert.equal(category1B.score, 2.5);
  assert.equal(category1B.ruleId, 'UNCLASSIFIED_MIXTURE_SKIN_SENSITIZER_1B');
});

test('un decimo del limite specifico del sensibilizzante è una soglia alternativa inclusiva', () => {
  const atThreshold = evaluate({
    concentrationPercent: 0.05,
    specificConcentrationLimitPercent: 0.5,
    hazards: [{ code: 'H317', category: '1B', section: 3 }],
  });
  assert.equal(atThreshold.status, 'calculated');
  assert.equal(atThreshold.score, 2.5);
  assert.equal(atThreshold.determiningHazard.concentrationThresholdPercent, 0.05);
  assert.equal(atThreshold.determiningHazard.concentrationThresholdRule, 'SENSITIZER_ONE_TENTH_SPECIFIC_LIMIT');

  const below = evaluate({
    concentrationPercent: 0.049,
    specificConcentrationLimitPercent: 0.5,
    hazards: [{ code: 'H317', category: '1B', section: 3 }],
  });
  assert.equal(below.status, 'needs_review');
});

test('le fasce generiche 4,00 / 2,50 / 2,25 / 1,75 seguono via ed effetto', () => {
  const cases = [
    [{ concentrationPercent: 1, hazards: ['H331'] }, 4, 'UNCLASSIFIED_MIXTURE_INHALATION_BELOW8'],
    [{ concentrationPercent: 1, hazards: ['H332'] }, 2.5, 'UNCLASSIFIED_MIXTURE_INHALATION_ACUTE4_IRRITATION_NARCOSIS'],
    [{ concentrationPercent: 1, hazards: ['H312'] }, 2.25, 'UNCLASSIFIED_MIXTURE_ACUTE_DERMAL_ORAL_GE3'],
    [{ concentrationPercent: 1, hazards: ['H302'] }, 1.75, 'UNCLASSIFIED_MIXTURE_ACUTE_DERMAL_ORAL_LT3'],
  ];
  cases.forEach(([ingredient, score, rule]) => {
    const output = evaluate(ingredient);
    assert.equal(output.status, 'calculated', rule);
    assert.equal(output.score, score, rule);
    assert.equal(output.ruleId, rule);
  });
});

test('ingrediente con valore limite europeo almeno all 1% riceve 2,25', () => {
  const output = evaluate({
    name: 'sostanza con OEL UE',
    concentrationPercent: 1,
    hasEuropeanOccupationalExposureLimit: true,
  });
  assert.equal(output.status, 'calculated');
  assert.equal(output.score, 2.25);
  assert.equal(output.ruleId, 'UNCLASSIFIED_MIXTURE_EUROPEAN_OEL_GE1_PERCENT');

  const below = evaluate({
    concentrationPercent: 0.999,
    hasEuropeanOccupationalExposureLimit: true,
  });
  assert.equal(below.status, 'calculated');
  assert.equal(below.score, 1);
});

test('composizione dichiarata completa e priva di ingredienti pericolosi riceve 1,00', () => {
  const output = evaluateHealthRisk({
    productHazards: [],
    ingredients: [{ name: 'acqua', concentrationPercent: 100, hazards: [] }],
    isMixture: true,
    productClassified: false,
    compositionComplete: true,
  });
  assert.equal(output.status, 'calculated');
  assert.equal(output.score, 1);
  assert.equal(output.ruleId, 'UNCLASSIFIED_MIXTURE_NO_HAZARDOUS_INGREDIENT');
});

test('concentrazione mancante o intervallo che attraversa la soglia attivano il fail-safe', () => {
  const missing = evaluate({ hazards: ['H351'] });
  assert.equal(missing.status, 'needs_review');
  assert.ok(missing.warnings.some((warning) => warning.startsWith('INGREDIENT_CONCENTRATION_REQUIRED:')));

  const crossing = evaluate({
    concentrationRange: { min: 0.05, max: 0.2 },
    concentrationBasis: 'mass',
    hazards: ['H351'],
  });
  assert.equal(crossing.status, 'needs_review');
  assert.ok(crossing.warnings.some((warning) => warning.startsWith('INGREDIENT_THRESHOLD_UNCERTAIN:')));

  const entirelyAbove = evaluate({
    concentrationRange: { min: 0.1, max: 0.2 },
    concentrationBasis: 'mass',
    hazards: ['H351'],
  });
  assert.equal(entirelyAbove.status, 'calculated');
  assert.equal(entirelyAbove.score, 5.5);
});

test('categoria o via mancanti non vengono inferite in modo arbitrario', () => {
  const sensitizerCategoryMissing = evaluate({
    concentrationPercent: 1,
    hazards: ['H317'],
  });
  assert.equal(sensitizerCategoryMissing.status, 'needs_review');
  assert.ok(sensitizerCategoryMissing.warnings.some((warning) => warning.includes('INGREDIENT_CATEGORY_REQUIRED:H317')));

  const routeMissing = evaluate({
    concentrationPercent: 1,
    hazards: ['H373'],
  });
  assert.equal(routeMissing.status, 'needs_review');
  assert.ok(routeMissing.warnings.some((warning) => warning.startsWith('INGREDIENT_ROUTE_OR_EFFECT_REQUIRED:')));
});

test('EUH riservate a miscele classificate non generano uno score nella miscela non classificata', () => {
  for (const code of ['EUH207', 'EUH208']) {
    const output = evaluate({ concentrationPercent: 10, hazards: [code] });
    assert.equal(output.status, 'needs_review', code);
    assert.notEqual(output.score, 5.5, code);
    assert.ok(output.warnings.some((warning) => warning.includes('INGREDIENT_EUH_ONLY_APPLIES_TO_CLASSIFIED_MIXTURE')), code);
  }
});

test('override di miscela classificata P<4 usa soltanto i codici della Tabella 3', () => {
  const excluded = evaluateHealthRisk({
    productHazards: [{ code: 'H319', section: 2 }],
    ingredients: [{ hazards: ['EUH207'] }],
    isMixture: true,
    productClassified: true,
  });
  assert.equal(excluded.status, 'calculated');
  assert.equal(excluded.score, 3);
  assert.equal(excluded.ruleId, 'PRODUCT_SECTION_2_MAX_SCORE');

  const included = evaluateHealthRisk({
    productHazards: [{ code: 'H319', section: 2 }],
    ingredients: [{ hazards: ['H351'] }],
    isMixture: true,
    productClassified: true,
  });
  assert.equal(included.status, 'calculated');
  assert.equal(included.score, 5.5);
  assert.equal(included.ruleId, 'CLASSIFIED_MIXTURE_PRODUCT_LT4_INGREDIENT_GE8');
});

test('schema parser SDS e dati ambigui sono gestiti in fail-safe', () => {
  const parsed = evaluateHealthRisk({
    productHazards: [],
    ingredients: [{
      concentration: { lower: 0.01, upper: 0.02, minInclusive: true, maxInclusive: true, unit: '%' },
      concentrationBasis: 'mass',
      hazards: [{ code: 'H317', category: '1B', section: 3 }],
      specificConcentrationLimits: [{ hazardCode: 'H317', lower: 0.1, upper: Infinity }],
      occupationalExposureLimits: [],
      needsReview: false,
    }],
    isMixture: true,
    productClassified: false,
    compositionComplete: true,
    physicalState: 'liquid',
  });
  assert.equal(parsed.status, 'calculated');
  assert.equal(parsed.score, 2.5);
  assert.equal(parsed.determiningHazard.concentrationThresholdPercent, 0.01);

  const parserReview = evaluateHealthRisk({
    productHazards: [],
    ingredients: [{
      concentration: { lower: 1, upper: 2, unit: '%' },
      concentrationBasis: 'mass',
      hazards: ['H331'],
      needsReview: true,
      reviewReasons: ['MULTIPLE_CONCENTRATIONS'],
    }],
    isMixture: true,
    productClassified: false,
    physicalState: 'liquid',
  });
  assert.equal(parserReview.status, 'needs_review');
  assert.ok(parserReview.warnings.some((warning) => warning.startsWith('INGREDIENT_PARSER_REVIEW_REQUIRED:')));
});

test('fase e base percentuale mancanti attivano il fail-safe', () => {
  const output = evaluateHealthRisk({
    productHazards: [],
    ingredients: [{ concentration: { lower: 1, upper: 2, unit: '%' }, hazards: ['H331'] }],
    isMixture: true,
    productClassified: false,
  });
  assert.equal(output.status, 'needs_review');
  assert.ok(output.warnings.some((warning) => warning.startsWith('INGREDIENT_CONCENTRATION_BASIS_REQUIRED:')));
  assert.ok(output.warnings.includes('MIXTURE_PHASE_REQUIRED_FOR_GENERAL_THRESHOLD'));
});
