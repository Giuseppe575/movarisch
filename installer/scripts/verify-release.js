'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const installerRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(installerRoot, '..');
const args = new Set(process.argv.slice(2));
const releaseMode = args.has('--release');
const verifyArtifacts = args.has('--artifacts');
const verifySignature = args.has('--signature');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fail(message) {
  throw new Error(`Release gate: ${message}`);
}

function parseLatestYml(text) {
  const read = (key) => text.match(new RegExp(`^${key}:\\s*['\"]?([^'\"\\r\\n]+)`, 'm'))?.[1].trim();
  return { version: read('version'), path: read('path'), sha512: read('sha512') };
}

function sha512Base64(file) {
  const hash = crypto.createHash('sha512');
  hash.update(fs.readFileSync(file));
  return hash.digest('base64');
}

function assertValidAuthenticode(file) {
  if (process.platform !== 'win32') fail('la verifica Authenticode deve essere eseguita su Windows');
  const escaped = file.replace(/'/g, "''");
  const command = `$s=Get-AuthenticodeSignature -LiteralPath '${escaped}'; ` +
    `$o=[pscustomobject]@{Status=[string]$s.Status;Subject=[string]$s.SignerCertificate.Subject}; ` +
    `$o | ConvertTo-Json -Compress`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    encoding: 'utf8',
    windowsHide: true
  });
  if (result.status !== 0) fail(`impossibile verificare Authenticode: ${result.stderr.trim()}`);
  const signature = JSON.parse(result.stdout.trim());
  if (signature.Status !== 'Valid') fail(`firma Authenticode non valida (${signature.Status})`);
  const expectedSubject = process.env.WINDOWS_SIGNING_SUBJECT;
  if (!expectedSubject) fail('WINDOWS_SIGNING_SUBJECT non configurato');
  if (!signature.Subject.toLowerCase().includes(expectedSubject.toLowerCase())) {
    fail('il firmatario non corrisponde a WINDOWS_SIGNING_SUBJECT');
  }
}

const packageJson = readJson(path.join(installerRoot, 'package.json'));
const lockJson = readJson(path.join(installerRoot, 'package-lock.json'));
const rootPackage = readJson(path.join(repositoryRoot, 'package.json'));

assert.match(packageJson.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'versione non semver');
assert.equal(rootPackage.version, packageJson.version, 'versione root e installer non coerente');
assert.equal(lockJson.version, packageJson.version, 'versione package-lock non coerente');
assert.equal(lockJson.packages?.['']?.version, packageJson.version, 'versione root package-lock non coerente');
assert.equal(packageJson.build?.win?.verifyUpdateCodeSignature, true, 'verifica firma updater disattivata');
assert.notEqual(packageJson.build?.win?.sign, null, 'firma Windows disattivata esplicitamente');

if (releaseMode) {
  const tag = process.env.RELEASE_TAG || (process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : '');
  if (tag !== `v${packageJson.version}`) fail(`tag atteso v${packageJson.version}, ricevuto ${tag || '(assente)'}`);
  if (!process.env.CSC_LINK || !process.env.CSC_KEY_PASSWORD) {
    fail('credenziali di firma CSC_LINK/CSC_KEY_PASSWORD assenti');
  }
}

if (verifyArtifacts) {
  const latestPath = path.join(installerRoot, 'dist', 'latest.yml');
  if (!fs.existsSync(latestPath)) fail('dist/latest.yml assente');
  const metadata = parseLatestYml(fs.readFileSync(latestPath, 'utf8'));
  const expectedName = `MOVARISCH-Setup-${packageJson.version}.exe`;
  if (metadata.version !== packageJson.version) fail('versione latest.yml incoerente');
  if (metadata.path !== expectedName) fail(`path latest.yml inatteso: ${metadata.path}`);
  const installerPath = path.join(installerRoot, 'dist', expectedName);
  if (!fs.existsSync(installerPath)) fail(`artefatto ${expectedName} assente`);
  if (sha512Base64(installerPath) !== metadata.sha512) fail('SHA-512 installer diverso da latest.yml');
  if (verifySignature) assertValidAuthenticode(installerPath);
}

console.log(`Release gate superato per MOVARISCH ${packageJson.version}.`);
