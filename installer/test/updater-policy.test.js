'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  clampProgress,
  isTransientNetworkError,
  sanitizeUpdateError
} = require('../lib/updater-policy');

test('clampProgress limita e arrotonda la percentuale', () => {
  assert.equal(clampProgress(-4), 0);
  assert.equal(clampProgress(54.6), 55);
  assert.equal(clampProgress(120), 100);
  assert.equal(clampProgress('non-numero'), 0);
});

test('isTransientNetworkError riconosce gli errori di rete temporanei', () => {
  assert.equal(isTransientNetworkError(new Error('net::ERR_INTERNET_DISCONNECTED')), true);
  assert.equal(isTransientNetworkError(new Error('ETIMEDOUT')), true);
  assert.equal(isTransientNetworkError(new Error('signature verification failed')), false);
});

test('sanitizeUpdateError non registra URL, credenziali o righe arbitrarie', () => {
  const sanitized = sanitizeUpdateError(
    new Error('GET https://example.test/file?token=abc\nAuthorization=Bearer-secret')
  );
  assert.equal(sanitized.includes('https://'), false);
  assert.equal(sanitized.includes('abc'), false);
  assert.equal(sanitized.includes('Bearer-secret'), false);
  assert.equal(sanitized.includes('\n'), false);
});
