const test = require('node:test');
const assert = require('node:assert/strict');

const { calcI, calcEinal, calcRinal } = require('../src/lib/movarisch.js');

function toFixed(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

test('I NON include T: 3×3×3×2 = 54 -> I = 3', () => {
  assert.strictEqual(calcI(3, 3, 3, 2), 3);
});

test('Einal applica T e d a valle: I=3, T=2, d=0.75 -> 4.50', () => {
  assert.strictEqual(toFixed(calcEinal(3, 2, 0.75)), 4.5);
});

test('Regressione: se qualcuno reinserisce T in calcI, questo test fallisce', () => {
  const I = calcI(3, 3, 3, 2);
  const Einal = calcEinal(I, 2, 0.75);
  const Rinal = calcRinal(8.5, Einal);

  assert.strictEqual(I, 3);
  assert.strictEqual(toFixed(Einal), 4.5);
  assert.strictEqual(toFixed(Rinal), 38.25);
});
