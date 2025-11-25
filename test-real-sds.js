/**
 * TEST AUTOMATICO - Estrazione e calcolo con SDS reali
 *
 * Verifica che l'estrazione H-codes e i calcoli M.I.R.C. siano corretti
 * per schede di sicurezza reali
 */

const fs = require('fs');
const path = require('path');

// Import funzioni dal codice (simulato per test standalone)
const SAFETY_EUH = new Set([
  'EUH001', 'EUH006', 'EUH014', 'EUH018', 'EUH019', 'EUH044',
  'EUH209', 'EUH209A',
  'EUH029', 'EUH031', 'EUH032'
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

function round(num, decimals) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

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

function calculateA1FromPhysicalCodes(physicalCodes){
  if(!physicalCodes || !physicalCodes.length) return 0;

  const scores = physicalCodes.map(code => {
    const baseCode = code.split(' ')[0];
    return H_PHYSICAL_SCORE[baseCode] || 0;
  });

  const maxScore = Math.max(...scores, 0);
  return maxScore > 0 ? round(maxScore / 10, 2) : 0;
}

function calculateA2FromPhysicalCodes(physicalCodes){
  if(!physicalCodes || !physicalCodes.length) return 0;

  let score = 0;
  const baseCodes = physicalCodes.map(c => c.split(' ')[0]);

  const explosiveReactions = ['EUH006', 'EUH014', 'EUH019', 'EUH044'];
  if(baseCodes.some(c => explosiveReactions.includes(c))){
    score += 3.0;
  }

  const gasFormation = ['EUH029', 'EUH031', 'EUH032'];
  if(baseCodes.some(c => gasFormation.includes(c))){
    score += 2.0;
  }

  if(baseCodes.includes('EUH018')){
    score += 2.5;
  }

  if(baseCodes.includes('H260')){
    score += 3.0;
  } else if(baseCodes.includes('H261')){
    score += 2.0;
  }

  return round(score, 2);
}

// Test cases con H-codes noti
const TEST_CASES = [
  {
    name: "Acetone (Esempio tipico)",
    hcodes: ['H225', 'H319', 'H336', 'EUH066'],
    expectedPhysical: ['H225'],
    expectedHealth: ['H319', 'H336', 'EUH066'],
    expectedA1: 7.5,  // H225 = 75/10
    expectedA2: 0,
    expectedD: 7.5
  },
  {
    name: "Sostanza con reattività acqua",
    hcodes: ['H260', 'H314', 'EUH014'],
    expectedPhysical: ['H260', 'EUH014'],
    expectedHealth: ['H314'],
    expectedA1: 7.0,  // H260 = 70/10
    expectedA2: 6.0,  // H260 (+3.0) + EUH014 (+3.0)
    expectedD: 13.0
  },
  {
    name: "Sostanza esplosiva",
    hcodes: ['H201', 'H315', 'H335'],
    expectedPhysical: ['H201'],
    expectedHealth: ['H315', 'H335'],
    expectedA1: 10.0,  // H201 = 100/10
    expectedA2: 0,
    expectedD: 10.0
  },
  {
    name: "Sostanza con gas tossici",
    hcodes: ['H220', 'H331', 'EUH029', 'EUH066'],
    expectedPhysical: ['H220', 'EUH029'],
    expectedHealth: ['H331', 'EUH066'],
    expectedA1: 7.5,  // H220 = 75/10
    expectedA2: 2.0,  // EUH029 (+2.0)
    expectedD: 9.5
  },
  {
    name: "Sostanza solo salute (no fisici)",
    hcodes: ['H302', 'H315', 'H319', 'EUH066', 'EUH070'],
    expectedPhysical: [],
    expectedHealth: ['H302', 'H315', 'H319', 'EUH066', 'EUH070'],
    expectedA1: 0,
    expectedA2: 0,
    expectedD: 0
  },
  {
    name: "Sostanza con EUH infiammabile durante uso",
    hcodes: ['H226', 'H304', 'EUH209'],
    expectedPhysical: ['H226', 'EUH209'],
    expectedHealth: ['H304'],
    expectedA1: 7.5,  // H226 = 75/10
    expectedA2: 0,
    expectedD: 7.5
  }
];

console.log('🧪 TEST ESTRAZIONE E CALCOLI M.I.R.C. CON CASI REALI\n');
console.log('=' .repeat(70));

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

for(const testCase of TEST_CASES){
  console.log(`\n📋 Test: ${testCase.name}`);
  console.log(`   Input H-codes: ${testCase.hcodes.join(', ')}`);

  totalTests += 5; // 5 verifiche per ogni test case

  // Separa H-codes
  const { health, physical } = separateHCodes(testCase.hcodes);

  // Verifica separazione physical
  const physicalMatch = JSON.stringify(physical.sort()) === JSON.stringify(testCase.expectedPhysical.sort());
  if(physicalMatch){
    console.log(`   ✅ Physical codes: ${physical.join(', ') || '(nessuno)'}`);
    passedTests++;
  } else {
    console.log(`   ❌ Physical codes: Expected [${testCase.expectedPhysical.join(', ')}], got [${physical.join(', ')}]`);
    failedTests.push({test: testCase.name, type: 'physical_separation'});
  }

  // Verifica separazione health
  const healthMatch = JSON.stringify(health.sort()) === JSON.stringify(testCase.expectedHealth.sort());
  if(healthMatch){
    console.log(`   ✅ Health codes: ${health.join(', ') || '(nessuno)'}`);
    passedTests++;
  } else {
    console.log(`   ❌ Health codes: Expected [${testCase.expectedHealth.join(', ')}], got [${health.join(', ')}]`);
    failedTests.push({test: testCase.name, type: 'health_separation'});
  }

  // Calcola A1
  const A1 = calculateA1FromPhysicalCodes(physical);
  if(A1 === testCase.expectedA1){
    console.log(`   ✅ A1 = ${A1}`);
    passedTests++;
  } else {
    console.log(`   ❌ A1: Expected ${testCase.expectedA1}, got ${A1}`);
    failedTests.push({test: testCase.name, type: 'A1_calculation', expected: testCase.expectedA1, got: A1});
  }

  // Calcola A2
  const A2 = calculateA2FromPhysicalCodes(physical);
  if(A2 === testCase.expectedA2){
    console.log(`   ✅ A2 = ${A2}`);
    passedTests++;
  } else {
    console.log(`   ❌ A2: Expected ${testCase.expectedA2}, got ${A2}`);
    failedTests.push({test: testCase.name, type: 'A2_calculation', expected: testCase.expectedA2, got: A2});
  }

  // Calcola D
  const D = round(A1 + A2, 2);
  if(D === testCase.expectedD){
    console.log(`   ✅ D = ${D} (Fattore Danno)`);
    passedTests++;
  } else {
    console.log(`   ❌ D: Expected ${testCase.expectedD}, got ${D}`);
    failedTests.push({test: testCase.name, type: 'D_calculation', expected: testCase.expectedD, got: D});
  }
}

// Risultati finali
console.log('\n' + '=' .repeat(70));
console.log(`\n📊 RISULTATI:`);
console.log(`   Total checks: ${totalTests}`);
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests.length}`);
console.log(`   Success rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);

if(failedTests.length > 0){
  console.log('\n❌ VERIFICHE FALLITE:');
  failedTests.forEach(({test, type, expected, got}) => {
    if(expected !== undefined){
      console.log(`   ${test} - ${type}: Expected ${expected}, got ${got}`);
    } else {
      console.log(`   ${test} - ${type}`);
    }
  });
  process.exit(1);
} else {
  console.log('\n✅ TUTTI I TEST PASSATI!');
  console.log('\n📌 PROSSIMO PASSO: Aprire index.html e caricare manualmente le schede PDF per validazione finale.');
  process.exit(0);
}
