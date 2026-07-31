const test = require('node:test');
const assert = require('node:assert/strict');

const { parseSection3Ingredients, parseConcentrationExpression, classifyConcentrationAgainstThreshold, isValidCas } = require('../src/lib/sds/ingredient-parser.js');

test('estrae intervalli decimali italiani e conserva estremi inclusivi/esclusivi', () => {
  assert.deepEqual(parseConcentrationExpression('0 < x < 0,05 %')[0], {
    lower: 0, upper: 0.05, min: 0, max: 0.05, minInclusive: false, maxInclusive: false, unit: '%', raw: '0 < x < 0,05', basis: 'unspecified', certainty: 'explicit', crossesThreshold: null
  });
  assert.deepEqual(parseConcentrationExpression('1 - 5 %')[0], {
    lower: 1, upper: 5, min: 1, max: 5, minInclusive: true, maxInclusive: true, unit: '%', raw: '1 - 5 %', basis: 'unspecified', certainty: 'explicit', crossesThreshold: null
  });
});

test('valida il checksum CAS', () => {
  assert.equal(isValidCas('120-57-0'), true);
  assert.equal(isValidCas('120-57-1'), false);
});

test('un intervallo che attraversa la soglia resta esplicitamente ambiguo', () => {
  const concentration = parseConcentrationExpression('0,05 - 0,2 %')[0];
  assert.equal(classifyConcentrationAgainstThreshold(concentration, 0.1), 'crosses_threshold');
  assert.equal(classifyConcentrationAgainstThreshold(concentration, 0.3), 'below');
});

test('riconosce la base della percentuale e richiede review quando non è specificata', () => {
  assert.equal(parseConcentrationExpression('1 - 5 % p/p')[0].basis, 'mass');
  assert.equal(parseConcentrationExpression('1 - 5 % w/w')[0].basis, 'mass');
  assert.equal(parseConcentrationExpression('1 - 5 % v/v')[0].basis, 'volume');
  const result = parseSection3Ingredients('Ingrediente A\nCAS 64-17-5\n1 - 5 % H319');
  assert.equal(result.ingredients[0].concentration.certainty, 'explicit');
  assert.ok(result.ingredients[0].reviewReasons.includes('CONCENTRATION_BASIS_UNSPECIFIED'));
  assert.ok(!result.ingredients[0].reviewReasons.includes('CONCENTRATION_UNIT_ASSUMED_PERCENT'));
});

test('estrae ingrediente, CAS, CE, concentrazione, pericoli, SCL, ATE e fattore M con evidenza', () => {
  const section = {
    number: '3',
    lines: [
      { text: 'Piperonale', page: 4, line: 10 },
      { text: 'CAS 120-57-0 CE 204-409-7', page: 4, line: 11 },
      { text: '0 < x < 0,05 % p/p Repr. 2 H361fd; Skin Sens. 1B H317', page: 4, line: 12 },
      { text: 'SCL: H317 >= 0,01 % p/p', page: 4, line: 13 },
      { text: 'ATE orale: 500 mg/kg; fattore M: 10; VLEP Italia: vedere sezione 8', page: 4, line: 14 }
    ]
  };
  const result = parseSection3Ingredients(section);
  assert.equal(result.status, 'parsed');
  assert.equal(result.ingredients.length, 1);
  const ingredient = result.ingredients[0];
  assert.equal(ingredient.name, 'Piperonale');
  assert.equal(ingredient.cas, '120-57-0');
  assert.equal(ingredient.ecNumber, '204-409-7');
  assert.deepEqual(ingredient.concentration, { lower: 0, upper: 0.05, min: 0, max: 0.05, minInclusive: false, maxInclusive: false, unit: '%', raw: '0 < x < 0,05', basis: 'mass', certainty: 'explicit', crossesThreshold: null });
  assert.deepEqual(ingredient.hazards.map(item => item.code), ['H361fd', 'H317']);
  assert.equal(ingredient.specificConcentrationLimits[0].hazardCode, 'H317');
  assert.equal(ingredient.ate[0].value, 500);
  assert.equal(ingredient.mFactors[0].value, 10);
  assert.equal(ingredient.occupationalExposureLimits[0].origin, 'Italia');
  assert.deepEqual(ingredient.evidence[0], { page: 4, line: 10, sourceText: 'Piperonale' });
  assert.equal(ingredient.needsReview, false);
});

test('non sceglie tra concentrazioni concorrenti e marca needs_review', () => {
  const result = parseSection3Ingredients([
    'Ingrediente A',
    'CAS 64-17-5',
    '1 - 5 % H319',
    'Concentrazione alternativa: 10 %'
  ].join('\n'));
  assert.equal(result.status, 'needs_review');
  assert.equal(result.ingredients[0].concentration, null);
  assert.ok(result.ingredients[0].reviewReasons.includes('MULTIPLE_CONCENTRATIONS'));
  assert.ok(result.ingredients[0].evidence.every(item => Object.hasOwn(item, 'page') && Object.hasOwn(item, 'line')));
});

test('senza CAS non associa dati a un ingrediente inventato', () => {
  const result = parseSection3Ingredients('Piperonale\n0 < x < 0,05 % H361fd');
  assert.equal(result.status, 'needs_review');
  assert.deepEqual(result.ingredients, []);
  assert.equal(result.warnings[0].code, 'SECTION3_NO_CAS_ANCHOR');
});

test('non interpreta la coda di un numero INDEX CLP come numero CAS', () => {
  const result = parseSection3Ingredients([
    'INDEX 613-167-00-5',
    'Miscela di conservanti H317',
    'CAS 55965-84-9',
    '0,1 - 0,2 % p/p Skin Sens. 1B H317'
  ].join('\n'));

  assert.equal(result.ingredients.length, 1);
  assert.equal(result.ingredients[0].cas, '55965-84-9');
});

test('non attribuisce al primo CAS le righe introduttive dell ingrediente successivo', () => {
  const result = parseSection3Ingredients([
    'Ingrediente A',
    'CAS 64-17-5',
    '1 - 5 % p/p H319',
    'Ingrediente B',
    'INDEX 601-001-00-9',
    'CAS 67-64-1',
    '5 - 10 % p/p H225'
  ].join('\n'));

  assert.equal(result.ingredients.length, 2);
  assert.deepEqual(result.ingredients[0].hazards.map(item => item.code), ['H319']);
  assert.deepEqual(result.ingredients[1].hazards.map(item => item.code), ['H225']);
});
