const test = require('node:test');
const assert = require('node:assert/strict');
const workflow = require('../src/lib/sds/review-workflow.js');

test('la revisione nasce pendente e richiede nominativo e conferma esplicita', () => {
  const review = workflow.createReviewState();
  assert.equal(review.status, 'pending');
  assert.equal(workflow.validateConfirmation(review, { healthStatus: 'calculated', score: 6 }), 'REVIEWER_REQUIRED');
  review.reviewer = 'Giuseppe';
  assert.equal(workflow.validateConfirmation(review, { healthStatus: 'calculated', score: 6 }), 'ACCEPTANCE_REQUIRED');
});

test('ogni correzione invalida la conferma e richiede una motivazione', () => {
  const review = workflow.createReviewState();
  review.status = 'confirmed';
  workflow.recordChange(review, { field: 'section2.hazards', before: 'H315', after: 'H317 cat.1A' });
  review.reviewer = 'Giuseppe';
  review.accepted = true;
  assert.equal(review.status, 'pending');
  assert.equal(review.audit.length, 1);
  assert.equal(workflow.validateConfirmation(review, { healthStatus: 'calculated', score: 6 }), 'CORRECTION_REASON_REQUIRED');
});

test('un risultato irrisolto non può essere confermato senza punteggio professionale', () => {
  const review = workflow.createReviewState();
  review.reviewer = 'Giuseppe';
  review.accepted = true;
  assert.equal(workflow.validateConfirmation(review, { healthStatus: 'needs_review', score: null }), 'UNRESOLVED_HEALTH_RESULT');
  assert.equal(workflow.validateConfirmation(review, { healthStatus: 'needs_review', score: 5.5 }), null);
});

test('la conferma conserva timestamp e snapshot e abilita il gruppo completo', () => {
  const review = workflow.createReviewState();
  review.reviewer = 'Giuseppe';
  review.accepted = true;
  const result = workflow.confirm(review, {
    healthStatus: 'calculated',
    score: 6,
    snapshot: { ruleId: 'PRODUCT_SECTION_2_MAX_SCORE' }
  });
  assert.equal(result.ok, true);
  assert.equal(review.status, 'confirmed');
  assert.ok(review.confirmedAt);
  assert.deepEqual(review.snapshot, { ruleId: 'PRODUCT_SECTION_2_MAX_SCORE' });
  assert.equal(workflow.allConfirmed([{ review }]), true);
});
