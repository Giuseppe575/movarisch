'use strict';

const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

const ALLOWED_HTTPS_TARGETS = Object.freeze([
  { hostname: 'giuseppe575.github.io', pathPrefixes: ['/movarisch/', '/movarisch-site/'] },
  { hostname: 'github.com', pathPrefixes: ['/Giuseppe575/movarisch'] },
  { hostname: 'www.garanteprivacy.it', pathPrefixes: ['/'] }
]);

const ALLOWED_MAILTO_ADDRESSES = Object.freeze([
  'atis.giuseppe@gmail.com'
]);

function canonicalPath(targetPath) {
  const realpath = fs.realpathSync.native || fs.realpathSync;
  return realpath(targetPath);
}

function isPathInside(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

/**
 * Accetta esclusivamente file esistenti che, dopo la risoluzione di symlink e
 * junction, si trovano nella directory delle risorse dell'applicazione.
 */
function isAllowedAppFileUrl(rawUrl, applicationRoot) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'file:' || parsed.username || parsed.password) {
      return false;
    }

    const canonicalRoot = canonicalPath(applicationRoot);
    const canonicalTarget = canonicalPath(fileURLToPath(parsed));
    return isPathInside(canonicalRoot, canonicalTarget);
  } catch (_error) {
    return false;
  }
}

function isAllowedHttpsUrl(parsed) {
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const rule = ALLOWED_HTTPS_TARGETS.find((entry) => entry.hostname === hostname);
  if (!rule) {
    return false;
  }

  return rule.pathPrefixes.some((prefix) => {
    if (prefix === '/') return true;
    const normalizedPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
    return parsed.pathname === normalizedPrefix ||
      parsed.pathname === `${normalizedPrefix}/` ||
      parsed.pathname.startsWith(`${normalizedPrefix}/`);
  });
}

function isAllowedMailtoUrl(parsed) {
  if (parsed.protocol !== 'mailto:') return false;

  // Non sono ammessi destinatari multipli, credenziali o indirizzi diversi da
  // quello ufficiale. Parametri innocui come subject/body restano consentiti.
  let address;
  try {
    address = decodeURIComponent(parsed.pathname).trim().toLowerCase();
  } catch (_error) {
    return false;
  }

  return !address.includes(',') &&
    !address.includes(';') &&
    ALLOWED_MAILTO_ADDRESSES.includes(address);
}

function isAllowedExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return isAllowedHttpsUrl(parsed) || isAllowedMailtoUrl(parsed);
  } catch (_error) {
    return false;
  }
}

function classifyNavigation(rawUrl, applicationRoot) {
  if (isAllowedAppFileUrl(rawUrl, applicationRoot)) return 'internal';
  if (isAllowedExternalUrl(rawUrl)) return 'external';
  return 'blocked';
}

module.exports = {
  ALLOWED_HTTPS_TARGETS,
  ALLOWED_MAILTO_ADDRESSES,
  classifyNavigation,
  isAllowedAppFileUrl,
  isAllowedExternalUrl,
  isPathInside
};
