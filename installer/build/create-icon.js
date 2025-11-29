#!/usr/bin/env node

/**
 * Script per generare l'icona MOVARISCH
 *
 * Crea un'icona 256x256 con:
 * - Sfondo gradiente verde acqua (#4ecca3) -> blu scuro (#0b1220)
 * - Angoli arrotondati
 * - Lettera "M" bianca bold al centro
 *
 * Output: icon.png (256x256) e icon.ico (multi-resolution)
 */

const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const SIZE = 256;
const OUTPUT_DIR = __dirname;
const PNG_FILE = path.join(OUTPUT_DIR, 'icon.png');
const ICO_FILE = path.join(OUTPUT_DIR, 'icon.ico');

console.log('🎨 Generazione icona MOVARISCH...\n');

// SVG dell'icona con gradiente e lettera M
const iconSVG = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradiente radiale dal centro -->
    <radialGradient id="bgGradient" cx="50%" cy="50%" r="70%">
      <stop offset="0%" style="stop-color:#4ecca3;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0b1220;stop-opacity:1" />
    </radialGradient>

    <!-- Ombra per la lettera M -->
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.5"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Sfondo con angoli arrotondati -->
  <rect width="${SIZE}" height="${SIZE}" rx="32" ry="32" fill="url(#bgGradient)"/>

  <!-- Bordo sottile -->
  <rect width="${SIZE}" height="${SIZE}" rx="32" ry="32" fill="none"
        stroke="#2a8c7a" stroke-width="3" opacity="0.6"/>

  <!-- Lettera M centrale -->
  <text x="50%" y="53%"
        font-family="Arial, Helvetica, sans-serif"
        font-size="160"
        font-weight="900"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#ffffff"
        filter="url(#shadow)">M</text>

  <!-- Sottile evidenziazione superiore -->
  <ellipse cx="${SIZE/2}" cy="30" rx="60" ry="15" fill="#ffffff" opacity="0.15"/>
</svg>
`;

// Funzione principale
async function generateIcon() {
  try {
    // Step 1: Genera PNG 256x256
    console.log('📐 Creazione PNG 256x256...');
    await sharp(Buffer.from(iconSVG))
      .resize(SIZE, SIZE)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(PNG_FILE);

    console.log(`✅ PNG creato: ${PNG_FILE}`);

    // Step 2: Crea anche versioni più piccole per l'ICO
    console.log('\n📐 Creazione PNG multi-resolution per ICO...');

    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = [];

    for (const size of sizes) {
      const buffer = await sharp(Buffer.from(iconSVG))
        .resize(size, size)
        .png({ quality: 100 })
        .toBuffer();
      pngBuffers.push(buffer);
      console.log(`   ✓ ${size}x${size}`);
    }

    // Step 3: Converti in ICO multi-resolution
    console.log('\n🔄 Conversione in ICO multi-resolution...');
    const icoBuffer = await pngToIco(pngBuffers);

    fs.writeFileSync(ICO_FILE, icoBuffer);
    console.log(`✅ ICO creato: ${ICO_FILE}`);

    // Statistiche
    const pngStats = fs.statSync(PNG_FILE);
    const icoStats = fs.statSync(ICO_FILE);

    console.log('\n📊 Statistiche:');
    console.log(`   PNG: ${(pngStats.size / 1024).toFixed(2)} KB`);
    console.log(`   ICO: ${(icoStats.size / 1024).toFixed(2)} KB`);
    console.log('   Risoluzioni ICO: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256');

    console.log('\n✨ Icona MOVARISCH generata con successo!');
    console.log('\n🎯 File pronti per il build:');
    console.log(`   ${PNG_FILE}`);
    console.log(`   ${ICO_FILE}`);

  } catch (error) {
    console.error('\n❌ Errore durante la generazione dell\'icona:', error);
    process.exit(1);
  }
}

// Esegui
generateIcon();
