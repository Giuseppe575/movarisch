#!/usr/bin/env node

/**
 * Script di workaround per il problema dei symbolic link su Windows
 * Pre-estrae gli archivi winCodeSign nella cache prima del build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(
  process.env.LOCALAPPDATA || process.env.APPDATA,
  'electron-builder',
  'Cache',
  'winCodeSign'
);

const sevenZip = path.join(
  __dirname,
  'node_modules',
  '7zip-bin',
  'win',
  'x64',
  '7za.exe'
);

console.log('🔧 MOVARISCH Build Fix - Workaround Symbolic Link\n');

// Crea directory cache se non esiste
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('✅ Cache directory creata\n');
}

// Trova tutti i file .7z nella cache
const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.7z'));

if (files.length === 0) {
  console.log('⚠️  Nessun archivio .7z trovato nella cache.');
  console.log('   Il build scaricherà winCodeSign automaticamente.\n');
} else {
  console.log(`📦 Trovati ${files.length} archivi da estrarre...\n`);

  // Estrai ogni archivio con opzione -aos (skip symlinks)
  for (const file of files) {
    const archivePath = path.join(cacheDir, file);
    const extractDir = path.join(cacheDir, path.basename(file, '.7z'));

    // Salta se già estratto
    if (fs.existsSync(extractDir) && fs.readdirSync(extractDir).length > 0) {
      console.log(`✓ ${file} - già estratto`);
      continue;
    }

    try {
      console.log(`🔄 Estrazione: ${file}...`);
      execSync(
        `"${sevenZip}" x -y -aos "${archivePath}" "-o${extractDir}"`,
        { stdio: 'ignore' }
      );
      console.log(`✅ ${file} - estratto con successo`);
    } catch (error) {
      console.log(`⚠️  ${file} - estratto con warning (symlink ignorati)`);
    }
  }
}

console.log('\n🚀 Avvio build electron-builder...\n');
console.log('='.repeat(60));

// Esegui il build
try {
  execSync('npm run build', {
    stdio: 'inherit',
    cwd: __dirname
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ BUILD COMPLETATO CON SUCCESSO!\n');
  console.log('📦 Installer creato in:');
  console.log('   dist/MOVARISCH-Setup-1.1.0.exe\n');

} catch (error) {
  console.log('\n' + '='.repeat(60));
  console.log('\n❌ BUILD FALLITO\n');
  console.error('Errore:', error.message);
  console.log('\n💡 Prova una di queste soluzioni:');
  console.log('   1. Esegui come Amministratore');
  console.log('   2. Abilita Developer Mode in Windows');
  console.log('   3. Leggi: PROBLEMA_BUILD_WINDOWS.md\n');
  process.exit(1);
}
