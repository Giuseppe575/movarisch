(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MovarischReviewWorkflow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createReviewState() {
    return {
      status: 'pending',
      reviewer: '',
      correctionReason: '',
      accepted: false,
      confirmedAt: null,
      audit: [],
      snapshot: null
    };
  }

  function ensure(review) {
    return review && typeof review === 'object' ? review : createReviewState();
  }

  function invalidate(review) {
    const target = ensure(review);
    target.status = 'pending';
    target.confirmedAt = null;
    target.snapshot = null;
    return target;
  }

  function comparable(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value.trim();
    try { return JSON.stringify(value); } catch (_) { return String(value); }
  }

  function recordChange(review, change) {
    const target = invalidate(review);
    const before = comparable(change && change.before);
    const after = comparable(change && change.after);
    if (before === after) return target;
    target.audit.push({
      timestamp: new Date().toISOString(),
      field: String(change && change.field || 'unknown'),
      before,
      after
    });
    return target;
  }

  function validateConfirmation(review, result) {
    const target = ensure(review);
    if (String(target.reviewer || '').trim().length < 2) return 'REVIEWER_REQUIRED';
    if (target.accepted !== true) return 'ACCEPTANCE_REQUIRED';
    if (target.audit.length && !String(target.correctionReason || '').trim()) return 'CORRECTION_REASON_REQUIRED';
    const status = result && result.healthStatus;
    const score = result && result.score;
    if (status === 'needs_review' && !Number.isFinite(score)) return 'UNRESOLVED_HEALTH_RESULT';
    return null;
  }

  function confirm(review, result) {
    const target = ensure(review);
    const error = validateConfirmation(target, result);
    if (error) return { ok: false, error, review: target };
    target.status = 'confirmed';
    target.confirmedAt = new Date().toISOString();
    target.snapshot = result && result.snapshot ? result.snapshot : null;
    return { ok: true, error: null, review: target };
  }

  function allConfirmed(rows) {
    return Array.isArray(rows) && rows.length > 0 && rows.every(function (row) {
      return row && row.review && row.review.status === 'confirmed';
    });
  }

  return Object.freeze({
    createReviewState,
    invalidate,
    recordChange,
    validateConfirmation,
    confirm,
    allConfirmed
  });
});
