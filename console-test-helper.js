/**
 * HELPER PER TEST CONSOLE
 *
 * Copia e incolla questo script nella console del browser (F12)
 * per ottenere validazione automatica dei calcoli
 */

// Whitelist EUH per sicurezza
const EXPECTED_SAFETY_EUH = new Set([
  'EUH001', 'EUH006', 'EUH014', 'EUH018', 'EUH019', 'EUH044',
  'EUH209', 'EUH209A',
  'EUH029', 'EUH031', 'EUH032'
]);

// EUH per salute (non devono apparire in physicalCodes)
const EXPECTED_HEALTH_EUH = new Set([
  'EUH066', 'EUH070', 'EUH071',
  'EUH059',
  'EUH201', 'EUH201A', 'EUH202', 'EUH203', 'EUH204', 'EUH205',
  'EUH206', 'EUH207', 'EUH208', 'EUH210',
  'EUH401'
]);

const H_PHYSICAL_SCORE = {
  "H200":100, "H201":100, "H202":100, "H203":100, "H204":100, "H205":100,
  "H220":75, "H221":75, "H222":75, "H223":75, "H224":75, "H225":75, "H226":75,
  "H227":50, "H228":50,
  "H250":80, "H251":80, "H252":80,
  "H260":70, "H261":70,
  "H270":60, "H271":60, "H272":60,
  "H229":30, "H230":30, "H231":30, "H240":30, "H241":30, "H242":30,
  "H280":30, "H281":30, "H290":30,
  "EUH001":40, "EUH006":40, "EUH014":40, "EUH018":40, "EUH019":40, "EUH044":40,
  "EUH209":35, "EUH209A":30
};

// Funzione di validazione
window.validateExtraction = function(extraction) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 VALIDAZIONE AUTOMATICA');
  console.log('='.repeat(70));

  const { healthCodes = [], physicalCodes = [], A1_calculated, A2_calculated } = extraction;

  let errors = [];
  let warnings = [];
  let passed = 0;
  let total = 0;

  // Test 1: Verifica che EUH salute NON siano in physicalCodes
  total++;
  console.log('\n📋 Test 1: Verifica EUH per salute NON in physicalCodes');
  const wrongPhysicalEUH = physicalCodes.filter(code => {
    const baseCode = code.split(' ')[0];
    return EXPECTED_HEALTH_EUH.has(baseCode);
  });

  if(wrongPhysicalEUH.length > 0) {
    errors.push(`EUH per salute trovati in physicalCodes: ${wrongPhysicalEUH.join(', ')}`);
    console.log(`   ❌ FAIL: ${wrongPhysicalEUH.join(', ')} devono essere in healthCodes!`);
  } else {
    passed++;
    console.log(`   ✅ PASS: Nessun EUH salute in physicalCodes`);
  }

  // Test 2: Verifica che solo EUH whitelist siano in physicalCodes
  total++;
  console.log('\n📋 Test 2: Verifica solo EUH whitelist in physicalCodes');
  const wrongEUHInPhysical = physicalCodes.filter(code => {
    const baseCode = code.split(' ')[0];
    return /^EUH\d{3}[A-Z]?$/.test(baseCode) && !EXPECTED_SAFETY_EUH.has(baseCode);
  });

  if(wrongEUHInPhysical.length > 0) {
    errors.push(`EUH non conformi INRS in physicalCodes: ${wrongEUHInPhysical.join(', ')}`);
    console.log(`   ❌ FAIL: ${wrongEUHInPhysical.join(', ')} non sono nella whitelist INRS!`);
  } else {
    passed++;
    console.log(`   ✅ PASS: Solo EUH whitelist INRS in physicalCodes`);
  }

  // Test 3: Verifica calcolo A1
  total++;
  console.log('\n📋 Test 3: Verifica calcolo A1');
  const scores = physicalCodes.map(code => {
    const baseCode = code.split(' ')[0];
    return H_PHYSICAL_SCORE[baseCode] || 0;
  });
  const expectedA1 = scores.length > 0 ? Math.max(...scores) / 10 : 0;
  const expectedA1Rounded = Math.round(expectedA1 * 100) / 100;

  console.log(`   Physical codes: ${physicalCodes.join(', ') || '(nessuno)'}`);
  console.log(`   Scores: ${scores.join(', ') || '0'}`);
  console.log(`   MAX score: ${scores.length > 0 ? Math.max(...scores) : 0}`);
  console.log(`   Expected A1: ${expectedA1Rounded}`);
  console.log(`   Calculated A1: ${A1_calculated}`);

  if(Math.abs(A1_calculated - expectedA1Rounded) < 0.01) {
    passed++;
    console.log(`   ✅ PASS: A1 corretto`);
  } else {
    errors.push(`A1 errato: Expected ${expectedA1Rounded}, got ${A1_calculated}`);
    console.log(`   ❌ FAIL: A1 dovrebbe essere ${expectedA1Rounded}, non ${A1_calculated}`);
  }

  // Test 4: Verifica calcolo A2
  total++;
  console.log('\n📋 Test 4: Verifica calcolo A2');
  let expectedA2 = 0;
  const baseCodes = physicalCodes.map(c => c.split(' ')[0]);

  const explosiveReactions = ['EUH006', 'EUH014', 'EUH019', 'EUH044'];
  const hasExplosive = baseCodes.some(c => explosiveReactions.includes(c));
  if(hasExplosive) {
    expectedA2 += 3.0;
    console.log(`   + 3.0 (reazione esplosiva: ${baseCodes.filter(c => explosiveReactions.includes(c)).join(', ')})`);
  }

  const gasFormation = ['EUH029', 'EUH031', 'EUH032'];
  const hasGas = baseCodes.some(c => gasFormation.includes(c));
  if(hasGas) {
    expectedA2 += 2.0;
    console.log(`   + 2.0 (formazione gas: ${baseCodes.filter(c => gasFormation.includes(c)).join(', ')})`);
  }

  if(baseCodes.includes('EUH018')) {
    expectedA2 += 2.5;
    console.log(`   + 2.5 (EUH018: miscela esplosiva)`);
  }

  if(baseCodes.includes('H260')) {
    expectedA2 += 3.0;
    console.log(`   + 3.0 (H260: reattività acqua violenta)`);
  } else if(baseCodes.includes('H261')) {
    expectedA2 += 2.0;
    console.log(`   + 2.0 (H261: reattività acqua)`);
  }

  expectedA2 = Math.round(expectedA2 * 100) / 100;
  console.log(`   Expected A2: ${expectedA2}`);
  console.log(`   Calculated A2: ${A2_calculated}`);

  if(Math.abs(A2_calculated - expectedA2) < 0.01) {
    passed++;
    console.log(`   ✅ PASS: A2 corretto`);
  } else {
    errors.push(`A2 errato: Expected ${expectedA2}, got ${A2_calculated}`);
    console.log(`   ❌ FAIL: A2 dovrebbe essere ${expectedA2}, non ${A2_calculated}`);
  }

  // Test 5: Verifica che H3xx e H4xx NON siano in physicalCodes
  total++;
  console.log('\n📋 Test 5: Verifica H3xx/H4xx NON in physicalCodes');
  const wrongHealthInPhysical = physicalCodes.filter(code => {
    const baseCode = code.split(' ')[0];
    return /^H[34]\d{2}$/.test(baseCode);
  });

  if(wrongHealthInPhysical.length > 0) {
    errors.push(`H-codes salute in physicalCodes: ${wrongHealthInPhysical.join(', ')}`);
    console.log(`   ❌ FAIL: ${wrongHealthInPhysical.join(', ')} sono per la SALUTE!`);
  } else {
    passed++;
    console.log(`   ✅ PASS: Nessun H-code salute in physicalCodes`);
  }

  // Riepilogo
  console.log('\n' + '='.repeat(70));
  console.log('📊 RIEPILOGO VALIDAZIONE');
  console.log('='.repeat(70));
  console.log(`Test passati: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);

  if(errors.length > 0) {
    console.log('\n❌ ERRORI TROVATI:');
    errors.forEach((err, i) => console.log(`   ${i+1}. ${err}`));
  }

  if(warnings.length > 0) {
    console.log('\n⚠️  AVVERTIMENTI:');
    warnings.forEach((warn, i) => console.log(`   ${i+1}. ${warn}`));
  }

  if(errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ TUTTI I TEST PASSATI! Estrazione corretta al 100%');
  }

  console.log('='.repeat(70) + '\n');

  return {
    passed,
    total,
    errors,
    warnings,
    success: errors.length === 0
  };
};

console.log('✅ Helper caricato!');
console.log('\n📚 UTILIZZO:');
console.log('1. Carica una scheda PDF');
console.log('2. Copia il risultato della console che inizia con "[filename.pdf] EXTRACTION:"');
console.log('3. Esegui: validateExtraction({...dati copiati...})');
console.log('\nOppure intercetta automaticamente:');
console.log('// Dopo aver caricato, se vedi il log EXTRACTION, puoi validarlo direttamente\n');
