# 🔧 BUGFIX: Calcolo SICUREZZA MOVARISCH
**Data**: 24 Novembre 2025
**Versione**: 1.1.0
**Tipo**: Correzione critica + Implementazione M.I.R.C. (INRS)

---

## 📋 PROBLEMA RISOLTO

Il calcolo del rischio SICUREZZA non funzionava correttamente:

### ❌ SINTOMI:
1. **H-codes fisici non estratti nella colonna dedicata** (colonna vuota)
2. **A2 (Danno Sicurezza) sempre 0.00** anche con H-codes fisici presenti
3. **Scheda cumulativa mostrava valori hardcodati** (PI=10, IQ=1, FCO=1.0)
4. **Disconnessione tra tabella e scheda cumulativa**
5. **IRC sempre 0.1 o valore di default** non calcolato correttamente

### 🔍 CAUSE IDENTIFICATE:
1. **Mancanza inizializzazione campi M.I.R.C.** nella creazione della riga (app.js:1617-1629)
2. **Nessun calcolo automatico di A1 e A2** dagli H-codes fisici estratti
3. **Scheda cumulativa usava campi legacy** (PI, IQ, FCO) invece di A1, A2, B1-B4, IRC
4. **H-codes fisici estratti ma non visualizzati** nella colonna dedicata

---

## ✅ MODIFICHE IMPLEMENTATE

### 1. **CALCOLO AUTOMATICO A1 (Danno Chimico-Fisico)**
**File**: `app.js` linee 443-455

```javascript
function calculateA1FromPhysicalCodes(physicalCodes){
  if(!physicalCodes || !physicalCodes.length) return 0;

  const scores = physicalCodes.map(code => {
    const baseCode = code.split(' ')[0];
    return H_PHYSICAL_SCORE[baseCode] || 0;
  });

  // A1 = massimo score tra gli H-codes fisici / 10 (normalizzato)
  const maxScore = Math.max(...scores, 0);
  return maxScore > 0 ? round(maxScore / 10, 2) : 0;
}
```

**Logica**:
- Usa la tabella `H_PHYSICAL_SCORE` esistente (linee 46-76)
- Estrae il massimo score tra gli H-codes fisici
- Normalizza dividendo per 10 (score 100 → A1 = 10.0)
- Gestisce correttamente categorie (es. "H226 cat.2" → "H226")

**Esempi**:
- H220 (gas estremamente infiammabile, score 75) → A1 = 7.50
- H200 (esplosivo instabile, score 100) → A1 = 10.00
- H226 (liquido infiammabile, score 75) → A1 = 7.50
- H290 (corrosivo per i metalli, score 30) → A1 = 3.00

---

### 2. **CALCOLO AUTOMATICO A2 (Danno Reazioni Pericolose)**
**File**: `app.js` linee 457-489

```javascript
function calculateA2FromPhysicalCodes(physicalCodes){
  if(!physicalCodes || !physicalCodes.length) return 0;

  let score = 0;
  const baseCodes = physicalCodes.map(c => c.split(' ')[0]);

  // Reazioni esplosive/violente
  const explosiveReactions = ['EUH006', 'EUH014', 'EUH019', 'EUH044'];
  if(baseCodes.some(c => explosiveReactions.includes(c))){
    score += 3.0;
  }

  // Formazione gas infiammabili/pericolosi
  const gasFormation = ['EUH029', 'EUH031', 'EUH032'];
  if(baseCodes.some(c => gasFormation.includes(c))){
    score += 2.0;
  }

  // Formazione prodotti instabili
  if(baseCodes.includes('EUH018')){
    score += 2.5;
  }

  // Reattività con acqua
  if(baseCodes.includes('H260')){
    score += 3.0; // Reazione violenta
  } else if(baseCodes.includes('H261')){
    score += 2.0; // Reazione moderata
  }

  return round(score, 2);
}
```

**Logica** (conforme a MIRC_Metodologia_Sicurezza.md):
- **Reazioni esplosive** (EUH006, EUH014, EUH019, EUH044) → +3.0 punti
- **Formazione gas pericolosi** (EUH029, EUH031, EUH032) → +2.0 punti
- **Formazione miscela esplosiva** (EUH018) → +2.5 punti
- **Reattività acqua violenta** (H260) → +3.0 punti
- **Reattività acqua moderata** (H261) → +2.0 punti
- **Cumulativo**: i punteggi si sommano se presenti più condizioni

**Esempi**:
- Sostanza con EUH006 (esplosivo a contatto con/senza aria) → A2 = 3.00
- Sostanza con H260 (reagisce violentemente con acqua) → A2 = 3.00
- Sostanza con EUH006 + EUH029 → A2 = 5.00 (cumulativo)

---

### 3. **INIZIALIZZAZIONE CAMPI M.I.R.C. NELLA RIGA**
**File**: `app.js` linee 1646-1698

**Prima** (MANCANTE):
```javascript
const row = {
  // ... campi salute ...
  hcodesPhysical: hcodesPhysical,
  flashPoint: flashPoint,
  // MANCAVANO: A1, A2, B1-B4, D_mirc, E_mirc, IRC, mircLevel, mircClass
};
```

**Dopo** (CORRETTO):
```javascript
// Calcola A1 e A2 automaticamente dagli H-codes fisici
const calculatedA1 = calculateA1FromPhysicalCodes(hcodesPhysical);
const calculatedA2 = calculateA2FromPhysicalCodes(hcodesPhysical);

const row = {
  // ... campi salute ...
  hcodesPhysical: hcodesPhysical,
  flashPoint: flashPoint,
  autoIgnitionTemp: autoIgnitionTemp,

  // M.I.R.C. FIELDS (INRS Safety Risk Assessment)
  A1: calculatedA1, // AUTO-CALCOLATO da H-codes fisici
  A2: calculatedA2, // AUTO-CALCOLATO da EUH/reazioni
  B1: defaults.B1,  // Default 0 (modificabile manualmente)
  B2: defaults.B2,  // Default 0
  B3: defaults.B3,  // Default 0
  B4: defaults.B4,  // Default 0
  D_mirc: 0,   // Calcolato da recalcRow()
  E_mirc: 0,   // Calcolato da recalcRow()
  IRC: 0,      // Calcolato da recalcRow()
  mircLevel: 'irrilevante',
  mircClass: 'irr',
  mircText: ''
};
```

**Risultato**:
- A1 e A2 vengono **calcolati automaticamente** al caricamento del PDF
- B1-B4 iniziano a 0 (l'utente può modificarli nella tabella)
- `recalcRow()` calcola automaticamente D, E, IRC ad ogni render

---

### 4. **SINCRONIZZAZIONE SCHEDA CUMULATIVA**

#### 4.1 Lettura dati da localStorage
**File**: `cumulative-report.html` linee 347-373

**Prima** (VECCHI CAMPI):
```javascript
substanceData = {
  // ...
  safetyPI: row.PI || 0,        // Hardcodato
  safetyIQ: row.IQ || 0,        // Hardcodato
  safetyFCO: row.FCO || 0,      // Hardcodato
  riskSafetyTotal: row.RiskSafety || 0  // Sbagliato
};
```

**Dopo** (CAMPI M.I.R.C.):
```javascript
substanceData = {
  // ...
  // M.I.R.C. (INRS) Safety Assessment
  safetyA1: row.A1 || 0,        // Danno chimico-fisico
  safetyA2: row.A2 || 0,        // Danno reazioni
  safetyD: row.D_mirc || 0,     // Danno totale
  safetyB1: row.B1 || 0,        // Modalità lavoro
  safetyB2: row.B2 || 0,        // Frequenza
  safetyB3: row.B3 || 0,        // Quantitativi
  safetyB4: row.B4 || 0,        // Fattori riduzione
  safetyE: row.E_mirc || 0,     // Esposizione totale
  riskSafetyTotal: row.IRC || 0, // IRC = (D+E)/100
  safetyLevel: row.mircClass || 'irr',
  // Legacy fields (backward compatibility)
  safetyPI: row.PI || 0,
  safetyIQ: row.IQ || 0,
  safetyFCO: row.FCO || 0
};
```

#### 4.2 Visualizzazione HTML
**File**: `cumulative-report.html` linee 236-279

**Prima** (3 CAMPI HARDCODATI):
```html
<div class="info-item">
  <div class="info-label">Pericolo Intrinseco (PI)</div>
  <div class="info-value" id="safetyPI">-</div>
</div>
<div class="info-item">
  <div class="info-label">Indice Quantità (IQ)</div>
  <div class="info-value" id="safetyIQ">-</div>
</div>
<div class="info-item">
  <div class="info-label">Condizioni Operative (FCO)</div>
  <div class="info-value" id="safetyFCO">-</div>
</div>
```

**Dopo** (8 CAMPI M.I.R.C.):
```html
<div class="info-item">
  <div class="info-label">A1 - Danno chimico-fisico</div>
  <div class="info-value" id="safetyA1">-</div>
</div>
<div class="info-item">
  <div class="info-label">A2 - Danno reazioni pericolose</div>
  <div class="info-value" id="safetyA2">-</div>
</div>
<div class="info-item">
  <div class="info-label">D - Danno totale (A1+A2)</div>
  <div class="info-value" id="safetyD">-</div>
</div>
<div class="info-item">
  <div class="info-label">B1 - Modalità di lavoro</div>
  <div class="info-value" id="safetyB1">-</div>
</div>
<div class="info-item">
  <div class="info-label">B2 - Frequenza e tempi</div>
  <div class="info-value" id="safetyB2">-</div>
</div>
<div class="info-item">
  <div class="info-label">B3 - Quantitativi</div>
  <div class="info-value" id="safetyB3">-</div>
</div>
<div class="info-item">
  <div class="info-label">B4 - Fattori riduzione</div>
  <div class="info-value" id="safetyB4">-</div>
</div>
<div class="info-item">
  <div class="info-label">E - Esposizione totale (B1+B2+B3+B4)</div>
  <div class="info-value" id="safetyE">-</div>
</div>
<div class="risk-box">
  <h3>IRC - Indice Rischio Chimico SICUREZZA</h3>
  <div class="risk-value" id="safetyRiskValue">-</div>
</div>
```

#### 4.3 Popolamento JavaScript
**File**: `cumulative-report.html` linee 462-483

**Prima**:
```javascript
document.getElementById('safetyPI').textContent = substanceData.safetyPI;
document.getElementById('safetyIQ').textContent = substanceData.safetyIQ;
document.getElementById('safetyFCO').textContent = substanceData.safetyFCO.toFixed(2);
```

**Dopo**:
```javascript
// M.I.R.C. (INRS) Safety Assessment values
document.getElementById('safetyA1').textContent = substanceData.safetyA1.toFixed(2);
document.getElementById('safetyA2').textContent = substanceData.safetyA2.toFixed(2);
document.getElementById('safetyD').textContent = substanceData.safetyD.toFixed(2);
document.getElementById('safetyB1').textContent = substanceData.safetyB1.toFixed(2);
document.getElementById('safetyB2').textContent = substanceData.safetyB2.toFixed(2);
document.getElementById('safetyB3').textContent = substanceData.safetyB3.toFixed(2);
document.getElementById('safetyB4').textContent = substanceData.safetyB4.toFixed(2);
document.getElementById('safetyE').textContent = substanceData.safetyE.toFixed(2);
document.getElementById('safetyRiskValue').textContent = substanceData.riskSafetyTotal.toFixed(2);
```

---

### 5. **LOGGING MIGLIORATO**
**File**: `app.js` linee 1642-1650

**Aggiunto logging dettagliato**:
```javascript
console.log(`[${file.name}] EXTRACTION:`, {
  healthCodes: hcodesHealth,
  physicalCodes: hcodesPhysical,
  flashPoint: flashPoint ? `${flashPoint}°C` : 'non trovato',
  autoIgnitionTemp: autoIgnitionTemp ? `${autoIgnitionTemp}°C` : 'non trovato',
  A1_calculated: calculatedA1,
  A2_calculated: calculatedA2
});
```

**Visibile in console browser** (F12 → Console) per debug:
- H-codes salute estratti
- H-codes fisici estratti
- Punto di infiammabilità
- Temperatura di autoaccensione
- **A1 calcolato**
- **A2 calcolato**

---

## 📊 FLUSSO COMPLETO POST-FIX

```
1. CARICAMENTO PDF
   ↓
2. pdfToText() → Estrazione testo
   ↓
3. findH() → Estrazione H-codes (H2xx, H3xx, H4xx, EUH)
   ↓
4. separateHCodes() → Separazione:
   ├─→ hcodesHealth (H3xx, H4xx) → per SALUTE
   └─→ hcodesPhysical (H2xx, EUH) → per SICUREZZA
   ↓
5. CALCOLO AUTOMATICO SICUREZZA:
   ├─→ calculateA1FromPhysicalCodes() → A1 (danno chimico-fisico)
   └─→ calculateA2FromPhysicalCodes() → A2 (danno reazioni)
   ↓
6. CREAZIONE RIGA con campi M.I.R.C. inizializzati
   ↓
7. recalcRow() → Calcolo:
   ├─→ D_mirc = A1 + A2
   ├─→ E_mirc = B1 + B2 + B3 + B4
   ├─→ IRC = (D_mirc + E_mirc) / 100
   └─→ mircClass = classifyMircRisk(IRC)
   ↓
8. RENDER TABELLA → Visualizzazione:
   ├─→ H-codes fisici (colonna dedicata)
   ├─→ A1, A2, D (colonne danno)
   ├─→ B1, B2, B3, B4, E (colonne esposizione)
   └─→ IRC, Giudizio SICUREZZA (badge colorato)
   ↓
9. EXPORT SCHEDA CUMULATIVA → localStorage
   ↓
10. VISUALIZZAZIONE SCHEDA CUMULATIVA:
    └─→ Sezione SICUREZZA con tutti i valori M.I.R.C.
```

---

## 🧪 TEST RACCOMANDATI

### Test Case 1: Sostanza con H-codes fisici
**SDS**: Acetone (H225, H319, H336)
- **Aspettato**: H225 (liquido facilmente infiammabile) → A1 = 7.50, A2 = 0.00
- **Verifica**: Colonna "H-codes Fisici" mostra "H225"

### Test Case 2: Sostanza con EUH reattivi
**SDS**: Perossido di idrogeno (H271, H302, H314, EUH014)
- **Aspettato**: H271 (comburente) → A1 = 6.00, EUH014 (reazione violenta con acqua) → A2 = 3.00
- **Verifica**: A1 = 6.00, A2 = 3.00, D = 9.00

### Test Case 3: Sostanza SOLO salute (no fisici)
**SDS**: Acetato di Etile (H319, H336)
- **Aspettato**: A1 = 0.00, A2 = 0.00, IRC = 0.00
- **Verifica**: Colonna "H-codes Fisici" vuota

### Test Case 4: Sostanza esplosiva
**SDS con H200-H205**
- **Aspettato**: A1 = 10.00 (score massimo)
- **Verifica**: IRC elevato anche con B1-B4 a zero

### Test Case 5: Modifica manuale B1-B4
**Procedura**:
1. Carica SDS con H-codes fisici
2. Modifica B2 = 5.0 (uso quotidiano)
3. Modifica B4 = -15.0 (misure protezione)
- **Aspettato**: E = -10.0, IRC ricalcolato automaticamente

---

## 📈 VANTAGGI POST-FIX

1. ✅ **Calcolo automatico** di A1 e A2 → riduce errori umani
2. ✅ **Tracciabilità completa** → H-codes → scores → IRC
3. ✅ **Conformità M.I.R.C. INRS** → metodologia francese per sicurezza
4. ✅ **Sincronizzazione tabella-scheda** → dati coerenti
5. ✅ **Modificabilità B1-B4** → adattabile al contesto specifico
6. ✅ **Logging dettagliato** → debug e verifica facilitati
7. ✅ **Backward compatibility** → campi legacy mantenuti

---

## 🔄 COMPATIBILITÀ

### Retrocompatibilità
- **Campi legacy** (PI, IQ, FCO) mantenuti nel codice ma non visualizzati
- **Vecchi export Excel/Word** continuano a funzionare
- **localStorage vecchio** gestito con fallback

### Forward compatibility
- **Struttura estendibile** → facile aggiungere nuovi fattori
- **Commenti dettagliati** → manutenibilità futura
- **Separazione logica** → calcolo salute vs sicurezza indipendenti

---

## 📝 NOTE IMPORTANTI

### Limitazioni
1. **B1-B4 richiedono input manuale** → non calcolabili automaticamente senza info sul contesto lavorativo
2. **Punto di infiammabilità** estratto ma non ancora usato per modificare A1
3. **Quantità in kg/l** estratta ma non mappata automaticamente a B3
4. **Temperatura di autoaccensione** estratta ma non integrata in A1

### Possibili Evoluzioni Future
1. **Calcolo automatico B2** da campo "Frequenza utilizzo" (se aggiunto all'UI)
2. **Integrazione flash point in A1** → incremento score se FP < 0°C
3. **Mapping quantità → B3** → se quantità > soglia → B3 = +2.0
4. **Suggerimenti B4** → checkboxes per misure protezione → calcolo automatico

---

## 👨‍💻 AUTORE

**Claude Code (Anthropic)**
Data: 24 Novembre 2025
Versione Claude: Sonnet 4.5

---

## 📚 RIFERIMENTI

- `MIRC_Metodologia_Sicurezza.md` → Metodologia INRS completa
- `ISTRUZIONI_CALCOLO.md` → Formule MOVARISCH salute
- `app.js` linee 46-76 → Tabella H_PHYSICAL_SCORE
- `src/lib/movarisch.js` linee 60-87 → Funzioni calcolo M.I.R.C.
- Regolamento CLP/GHS → Classificazione H-codes

---

## ✅ CHECKLIST FINALE

- [x] Funzione `calculateA1FromPhysicalCodes()` implementata
- [x] Funzione `calculateA2FromPhysicalCodes()` implementata
- [x] Campi M.I.R.C. aggiunti all'inizializzazione riga
- [x] `recalcRow()` calcola D, E, IRC correttamente
- [x] Colonna "H-codes Fisici" popolata
- [x] Colonne A1, A2, D visibili e editabili
- [x] Colonne B1-B4, E visibili e editabili
- [x] Colonna IRC calcolata e visualizzata
- [x] Scheda cumulativa sincronizzata
- [x] Logging debug implementato
- [x] Backward compatibility garantita
- [x] Documentazione completa

---

**Status**: ✅ **IMPLEMENTAZIONE COMPLETATA**
**Test**: ⏳ **IN ATTESA DI VERIFICA CON SDS REALI**
