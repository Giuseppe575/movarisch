const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath){
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('l interfaccia non esegue librerie da CDN', () => {
  const sources = [read('index.html'), read('app.js'), read('cumulative-report.html')];
  const remoteExecutableSource = /(?:src\s*=|import\s*\(|workerSrc\s*=)[^\n>]*(?:cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)/i;

  for(const source of sources){
    assert.doesNotMatch(source, remoteExecutableSource);
  }
  assert.match(read('index.html'), /script-src 'self'/);
});

test('tutte le dipendenze browser richieste sono distribuite negli asset locali', () => {
  const assets = [
    'src/lib/xlsx.full.min.js',
    'src/lib/pdf.bundle.js',
    'src/lib/pdf.worker.min.mjs',
    'src/lib/docx.umd.js',
    'src/lib/chart.umd.min.js'
  ];

  for(const relativePath of assets){
    const stat = fs.statSync(path.join(root, relativePath));
    assert.ok(stat.isFile(), `${relativePath} deve essere un file`);
    assert.ok(stat.size > 100_000, `${relativePath} sembra incompleto`);
  }
});

test('il build Electron include l intera directory degli asset locali', () => {
  const installerPackage = JSON.parse(read('installer/package.json'));
  assert.ok(installerPackage.build.files.includes('../src/**/*'));
  assert.ok(installerPackage.build.extraResources[0].filter.includes('src/**/*'));
});

test('i dati SDS non vengono scritti nei log e il passaggio cumulativo è monouso', () => {
  const appSource = read('app.js');
  const reportSource = read('cumulative-report.html');

  assert.doesNotMatch(appSource, /console\.log\s*\(/);
  assert.doesNotMatch(reportSource, /console\.log\s*\(/);
  assert.match(reportSource, /localStorage\.removeItem\('movarisch_cumulative_data'\)/);
  assert.match(reportSource, /ageMinutes\s*>\s*5/);
});
