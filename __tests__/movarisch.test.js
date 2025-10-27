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

test('Einal usa solo I e d: I=3, d=0.75 -> 2.25', () => {
  assert.strictEqual(toFixed(calcEinal(3, 0.75)), 2.25);
});

test('Regressione: se qualcuno reinserisce T in calcI, questo test fallisce', () => {
  const I = calcI(3, 3, 3, 2);
  const Einal = calcEinal(I, 0.75);
  const Rinal = calcRinal(8.5, Einal);

  assert.strictEqual(I, 3);
  assert.strictEqual(toFixed(Einal), 2.25);
  assert.strictEqual(toFixed(Rinal), 19.13);
});
