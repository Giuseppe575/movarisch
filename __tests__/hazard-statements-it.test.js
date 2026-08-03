const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptionFor, normalizeCode } = require('../src/data/hazard-statements-it.js');

test('associa le descrizioni CLP alle frasi H più ricorrenti', () => {
  assert.equal(descriptionFor('H317 cat.1A'), 'Può provocare una reazione allergica della pelle.');
  assert.equal(descriptionFor('H318'), 'Provoca gravi lesioni oculari.');
  assert.equal(descriptionFor('H226'), 'Liquido e vapori infiammabili.');
  assert.equal(descriptionFor('EUH071'), 'Corrosivo per le vie respiratorie.');
  assert.equal(normalizeCode(' H 302 cat.4 '), 'H302');
});

test('mantiene distinte le varianti tossiche per la riproduzione', () => {
  assert.match(descriptionFor('H360FD'), /fertilità.*feto/);
  assert.match(descriptionFor('H360Fd'), /fertilità.*Sospettato/);
  assert.match(descriptionFor('H360Df'), /feto.*Sospettato/);
  assert.match(descriptionFor('H361fd'), /Sospettato di nuocere alla fertilità.*feto/);
});
