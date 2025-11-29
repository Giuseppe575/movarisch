#!/usr/bin/env node

/**
 * Converte icon.png in icon.ico
 * Usa il pacchetto to-ico
 */

const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const PNG_FILE = path.join(__dirname, 'icon.png');
const ICO_FILE = path.join(__dirname, 'icon.ico');

console.log('🔄 Conversione PNG → ICO...\n');

async function convert() {
  try {
    // Leggi il PNG
    const pngBuffer = fs.readFileSync(PNG_FILE);

    // Converti in ICO
    const icoBuffer = await toIco([pngBuffer]);

    // Salva ICO
    fs.writeFileSync(ICO_FILE, icoBuffer);

    const stats = fs.statSync(ICO_FILE);
    console.log(`✅ ICO creato: ${ICO_FILE}`);
    console.log(`📊 Dimensione: ${(stats.size / 1024).toFixed(2)} KB\n`);

  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.log('\n⚠️  Conversione fallita. Usa un convertitore online:');
    console.log('   https://convertio.co/it/png-ico/');
    console.log('   https://www.icoconverter.com/\n');
    process.exit(1);
  }
}

convert();
