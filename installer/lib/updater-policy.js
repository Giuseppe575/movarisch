'use strict';

const TRANSIENT_NETWORK_MARKERS = [
  'net::err_',
  'econnreset',
  'econnrefused',
  'enotfound',
  'etimedout',
  'network error',
  'timeout'
];

function clampProgress(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function isTransientNetworkError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return TRANSIENT_NETWORK_MARKERS.some((marker) => message.includes(marker));
}

function sanitizeUpdateError(error) {
  const raw = String(error?.message || error || 'errore sconosciuto');
  return raw
    .replace(/https?:\/\/[^\s)]+/gi, '[URL rimossa]')
    .replace(/(?:token|authorization|password|secret)=?\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 500);
}

module.exports = {
  clampProgress,
  isTransientNetworkError,
  sanitizeUpdateError
};
