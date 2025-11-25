/**
 * TEST AUTOMATICO - Classificazione H-codes e EUH
 *
 * Verifica che la funzione separateHCodes() classifichi correttamente
 * tutti gli H-codes e EUH secondo la metodologia INRS M.I.R.C.
 */

// Whitelist EUH per SICUREZZA (deve corrispondere a quella in app.js)
const SAFETY_EUH = new Set([
  'EUH001', 'EUH006', 'EUH014', 'EUH018', 'EUH019', 'EUH044',  // Esplosivi/reattivi
  'EUH209', 'EUH209A',  // Infiammabili durante l'uso
  'EUH029', 'EUH031', 'EUH032'  // Gas tossici da reazioni
]);

// Test cases con classificazione attesa
const TEST_CASES = {
  // H-codes FISICI (H2xx) - tutti per SICUREZZA
  physical: [
    'H200', 'H201', 'H202', 'H203', 'H204', 'H205',  // Esplosivi
    'H220', 'H221', 'H222', 'H223',  // Gas infiammabili
    'H224', 'H225', 'H226', 'H227',  // Liquidi infiammabili
    'H228',  // Solidi infiammabili
    'H229', 'H280', 'H281',  // Gas sotto pressione
    'H230', 'H231', 'H240', 'H241', 'H242',  // Autoreattivi
    'H250', 'H251', 'H252',  // Piroforici
    'H260', 'H261',  // Reattività acqua
    'H270', 'H271', 'H272',  // Comburenti
    'H290'  // Corrosivi metalli
  ],

  // EUH per SICUREZZA
  physicalEUH: [
    'EUH001', 'EUH006', 'EUH014', 'EUH018', 'EUH019', 'EUH044',  // Esplosivi/reattivi
    'EUH209', 'EUH209A',  // Infiammabili
    'EUH029', 'EUH031', 'EUH032'  // Gas tossici da reazioni
  ],

  // H-codes SALUTE (H3xx, H4xx)
  health: [
    'H300', 'H301', 'H302',  // Tossicità acuta orale
    'H310', 'H311', 'H312',  // Tossicità acuta cutanea
    'H330', 'H331', 'H332',  // Tossicità acuta inalazione
    'H314', 'H315', 'H318', 'H319',  // Corrosione/irritazione
    'H334', 'H317',  // Sensibilizzazione
    'H335', 'H336',  // Tossicità specifica organi (singola)
    'H370', 'H371', 'H372', 'H373',  // Tossicità organi
    'H304',  // Aspirazione
    'H360', 'H360D', 'H360F', 'H360FD', 'H361', 'H361d', 'H361f',  // Riproduttività
    'H341', 'H351',  // Mutagenicità/Cancerogenicità
    'H362',  // Allattamento
    'H400', 'H410', 'H411', 'H412', 'H413'  // Ambiente
  ],

  // EUH per SALUTE
  healthEUH: [
    'EUH066',  // Irritazione cutanea ripetuta
    'EUH070',  // Tossico per contatto oculare
    'EUH071',  // Corrosivo vie respiratorie
    'EUH059',  // Ambiente (ozono)
    'EUH201', 'EUH201A', 'EUH202', 'EUH203', 'EUH204', 'EUH205',  // Avvertimenti specifici
    'EUH206', 'EUH207', 'EUH208', 'EUH210',  // Avvertimenti specifici
    'EUH401'  // Avvertimento generale
  ]
};

// Funzione di test
function separateHCodes(allHCodes){
  const health = [];
  const physical = [];

  for(const code of allHCodes){
    const baseCode = code.split(' ')[0];

    if(/^H2\d{2}$/.test(baseCode)){
      physical.push(code);
    }
    else if(/^EUH\d{3}[A-Z]?$/.test(baseCode)){
      if(SAFETY_EUH.has(baseCode)){
        physical.push(code);
      } else {
        health.push(code);
      }
    }
    else if(/^H[34]\d{2}$/.test(baseCode)){
      health.push(code);
    }
    else if(/^H[34]/.test(baseCode)){
      health.push(code);
    } else {
      physical.push(code);
    }
  }

  return { health, physical };
}

// Esegui test
console.log('🧪 TEST CLASSIFICAZIONE H-CODES E EUH\n');
console.log('=' .repeat(60));

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

// Test H-codes fisici
console.log('\n📦 TEST H-CODES FISICI (H2xx - SICUREZZA):');
for(const code of TEST_CASES.physical){
  totalTests++;
  const result = separateHCodes([code]);
  if(result.physical.length === 1 && result.health.length === 0){
    console.log(`  ✅ ${code} → PHYSICAL (corretto)`);
    passedTests++;
  } else {
    console.log(`  ❌ ${code} → Classificato come HEALTH (ERRORE!)`);
    failedTests.push({code, expected: 'physical', got: 'health'});
  }
}

// Test EUH per sicurezza
console.log('\n📦 TEST EUH PER SICUREZZA:');
for(const code of TEST_CASES.physicalEUH){
  totalTests++;
  const result = separateHCodes([code]);
  if(result.physical.length === 1 && result.health.length === 0){
    console.log(`  ✅ ${code} → PHYSICAL (corretto)`);
    passedTests++;
  } else {
    console.log(`  ❌ ${code} → Classificato come HEALTH (ERRORE!)`);
    failedTests.push({code, expected: 'physical', got: 'health'});
  }
}

// Test H-codes salute
console.log('\n🏥 TEST H-CODES SALUTE (H3xx, H4xx):');
for(const code of TEST_CASES.health){
  totalTests++;
  const result = separateHCodes([code]);
  if(result.health.length === 1 && result.physical.length === 0){
    console.log(`  ✅ ${code} → HEALTH (corretto)`);
    passedTests++;
  } else {
    console.log(`  ❌ ${code} → Classificato come PHYSICAL (ERRORE!)`);
    failedTests.push({code, expected: 'health', got: 'physical'});
  }
}

// Test EUH per salute
console.log('\n🏥 TEST EUH PER SALUTE:');
for(const code of TEST_CASES.healthEUH){
  totalTests++;
  const result = separateHCodes([code]);
  if(result.health.length === 1 && result.physical.length === 0){
    console.log(`  ✅ ${code} → HEALTH (corretto)`);
    passedTests++;
  } else {
    console.log(`  ❌ ${code} → Classificato come PHYSICAL (ERRORE!)`);
    failedTests.push({code, expected: 'health', got: 'physical'});
  }
}

// Test con categorie
console.log('\n🔬 TEST H-CODES CON CATEGORIE:');
const categoryCodes = ['H314 cat.1A', 'H330 cat.1', 'H334 cat.1B'];
for(const code of categoryCodes){
  totalTests++;
  const result = separateHCodes([code]);
  if(result.health.length === 1 && result.physical.length === 0){
    console.log(`  ✅ ${code} → HEALTH (corretto)`);
    passedTests++;
  } else {
    console.log(`  ❌ ${code} → Classificato come PHYSICAL (ERRORE!)`);
    failedTests.push({code, expected: 'health', got: 'physical'});
  }
}

// Risultati finali
console.log('\n' + '=' .repeat(60));
console.log(`\n📊 RISULTATI:`);
console.log(`   Total tests: ${totalTests}`);
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests.length}`);
console.log(`   Success rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);

if(failedTests.length > 0){
  console.log('\n❌ TEST FALLITI:');
  failedTests.forEach(({code, expected, got}) => {
    console.log(`   ${code}: Expected ${expected}, got ${got}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ TUTTI I TEST PASSATI!');
  process.exit(0);
}
