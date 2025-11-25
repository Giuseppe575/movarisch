# BUGFIX: Classificazione Corretta EUH per Calcoli M.I.R.C.

**Data**: 25 Novembre 2025
**Versione**: 1.1.0
**Gravità**: 🔴 CRITICA

---

## 📋 SOMMARIO

Trovati e corretti **3 bug critici** nella classificazione degli H-codes e EUH che causavano:
- Classificazione errata di EUH066 e altri EUH per la salute come "pericoli fisici"
- Inclusione di EUH non conformi a INRS nei calcoli M.I.R.C. per la sicurezza
- Potenziali errori nei calcoli A1, A2, D per la valutazione rischio sicurezza

---

## 🐛 BUG IDENTIFICATI

### **BUG #1: Classificazione universale EUH come "fisici"**

**Posizione**: `app.js:425` (versione precedente)
**Codice errato**:
```javascript
// ERRORE: Classifica TUTTI gli EUH come "fisici"
if(/^H2\d{2}$/.test(baseCode) || /^EUH\d{3}$/.test(baseCode)){
  physical.push(code);
}
```

**Problema**:
- La regex `/^EUH\d{3}$/` classificava **TUTTI i codici EUH** come pericoli fisici
- **EUH066** ("L'esposizione ripetuta può provocare secchezza o screpolature della pelle") veniva erroneamente considerato per i calcoli M.I.R.C. sicurezza
- Altri EUH per la salute (EUH070, EUH071) venivano mal classificati

**Impatto**:
- EUH066 veniva cercato in `H_PHYSICAL_SCORE` (dove NON esiste) → A1 = 0 (scorretto)
- Confusione tra pericoli salute e sicurezza
- Calcoli M.I.R.C. potenzialmente errati

---

### **BUG #2: H_PHYSICAL_SCORE conteneva EUH per la SALUTE**

**Posizione**: `app.js:73-75` (versione precedente)
**Codice errato**:
```javascript
// ERRORE: Include EUH per allergie/sensibilizzazione (SALUTE, non SICUREZZA)
"EUH201":20, "EUH201A":20, "EUH202":20, "EUH203":20, "EUH204":20,
"EUH205":20, "EUH206":20, "EUH207":20, "EUH208":20, "EUH209":20,
"EUH209A":20, "EUH210":20, "EUH401":20
```

**Problema**:
- **EUH203** (Cromo VI - allergia) = pericolo SALUTE, non sicurezza
- **EUH204** (Isocianati - allergia) = pericolo SALUTE
- **EUH205** (Epossidici - allergia) = pericolo SALUTE
- **EUH208** (Sensibilizzante - allergia) = pericolo SALUTE
- EUH201, 201A, 202, 206, 207, 210, 401 = Avvertimenti generici, NON pericoli fisici secondo INRS

**Impatto**:
- Prodotti con EUH203 contribuivano A1 = 2.0 punti erroneamente
- Calcoli M.I.R.C. non conformi a metodologia INRS

---

### **BUG #3: Mancanza EUH070, EUH071 in H_SCORE**

**Posizione**: `app.js:35` (versione precedente)

**Problema**:
- **EUH070** ("Tossico per contatto oculare") non aveva punteggio per calcoli salute
- **EUH071** ("Corrosivo per le vie respiratorie") non aveva punteggio per calcoli salute

**Impatto**:
- Prodotti con questi EUH avevano score = 0 per il rischio salute
- Sottostima del rischio salute (MoVaRiSch)

---

## ✅ CORREZIONI APPLICATE

### **Correzione #1: Whitelist esplicita EUH per sicurezza**

**File**: `app.js:421-442`
**Codice corretto**:
```javascript
// EUH per SICUREZZA (whitelist esplicita secondo INRS M.I.R.C.)
const SAFETY_EUH = new Set([
  'EUH001', 'EUH006', 'EUH014', 'EUH018', 'EUH019', 'EUH044',  // Esplosivi/reattivi
  'EUH209', 'EUH209A',  // Infiammabili durante l'uso
  'EUH029', 'EUH031', 'EUH032'  // Gas tossici da reazioni (usati in A2)
]);

// EUH: solo quelli nella whitelist SAFETY per M.I.R.C. (supporta suffissi come EUH201A)
else if(/^EUH\d{3}[A-Z]?$/.test(baseCode)){
  if(SAFETY_EUH.has(baseCode)){
    physical.push(code);
  } else {
    health.push(code);  // Altri EUH (es. EUH066, EUH070, EUH071) vanno in salute
  }
}
```

**Benefici**:
- ✅ Solo EUH conformi INRS vengono usati per calcoli M.I.R.C.
- ✅ EUH066, EUH070, EUH071 correttamente classificati come "salute"
- ✅ Supporto per suffissi alfanumerici (EUH201A, EUH209A)

---

### **Correzione #2: Pulizia H_PHYSICAL_SCORE**

**File**: `app.js:69-76`
**Codice corretto**:
```javascript
// EUH - PROPRIETÀ FISICHE (40)
"EUH001":40, "EUH006":40, "EUH014":40, "EUH018":40, "EUH019":40, "EUH044":40,

// EUH - INFIAMMABILITÀ DURANTE L'USO (35)
"EUH209":35, "EUH209A":30
// NOTA: Rimossi EUH201-EUH208, EUH210, EUH401 (non sono pericoli fisici secondo INRS)
// EUH203-EUH208 sono avvertimenti per allergie/sensibilizzazione (SALUTE, non SICUREZZA)
```

**Benefici**:
- ✅ Solo EUH per pericoli fisici reali
- ✅ Conformità INRS M.I.R.C.
- ✅ Calcoli A1 corretti

---

### **Correzione #3: Aggiunta EUH070, EUH071 a H_SCORE**

**File**: `app.js:35`
**Codice corretto**:
```javascript
"H315":4.50,"H318":3.00,"H319":3.00,"EUH066":2.50,"EUH070":5.00,"EUH071":5.50,
```

**Benefici**:
- ✅ Copertura completa EUH per pericoli salute
- ✅ Calcoli MoVaRiSch corretti per prodotti con questi EUH

---

## 🧪 VALIDAZIONE

### **Test #1: Classificazione H/EUH**
- **File**: `test-hcode-classification.js`
- **Test eseguiti**: 98
- **Risultato**: ✅ **100% PASSATI**

Test categories:
- 32 H-codes fisici (H2xx) → ✅ Tutti classificati come PHYSICAL
- 11 EUH per sicurezza → ✅ Tutti classificati come PHYSICAL
- 38 H-codes salute (H3xx, H4xx) → ✅ Tutti classificati come HEALTH
- 15 EUH per salute → ✅ Tutti classificati come HEALTH
- 3 H-codes con categorie → ✅ Tutti classificati come HEALTH

### **Test #2: Calcoli M.I.R.C.**
- **File**: `test-real-sds.js`
- **Test eseguiti**: 30 (6 casi × 5 verifiche)
- **Risultato**: ✅ **100% PASSATI**

Test cases:
1. Acetone (H225, H319, H336, EUH066) → A1=7.5, A2=0, D=7.5 ✅
2. Reattività acqua (H260, H314, EUH014) → A1=7.0, A2=6.0, D=13.0 ✅
3. Esplosivo (H201, H315, H335) → A1=10.0, A2=0, D=10.0 ✅
4. Gas tossici (H220, H331, EUH029, EUH066) → A1=7.5, A2=2.0, D=9.5 ✅
5. Solo salute (H302, H315, H319, EUH066, EUH070) → A1=0, A2=0, D=0 ✅
6. EUH infiammabile uso (H226, H304, EUH209) → A1=7.5, A2=0, D=7.5 ✅

---

## 📊 IMPATTO DELLE CORREZIONI

### **Prima delle correzioni**:
- ❌ EUH066 classificato come "physical" (errore)
- ❌ EUH066 cercato in H_PHYSICAL_SCORE → non trovato → A1=0
- ❌ EUH203-EUH208 contribuivano erroneamente ad A1
- ❌ EUH070, EUH071 non avevano punteggio per salute

### **Dopo le correzioni**:
- ✅ EUH066 classificato come "health" (corretto)
- ✅ EUH066 usa H_SCORE[EUH066]=2.50 per calcoli salute
- ✅ EUH203-EUH208 classificati come "health"
- ✅ EUH070, EUH071 hanno punteggi per calcoli salute
- ✅ Solo EUH INRS conformi usati per M.I.R.C.

---

## 📚 RIFERIMENTI

### **Documentazione INRS**:
- **File locale**: `MIRC_Metodologia_Sicurezza.md`
- **Sezione EUH**: Righe 419-428

### **EUH per SICUREZZA secondo INRS**:
- EUH001, EUH006, EUH014, EUH018, EUH019, EUH044 (esplosivi/reattivi)
- EUH209 (infiammabili durante l'uso)
- EUH029, EUH031, EUH032 (gas tossici da reazioni - contribuiscono ad A2)

### **EUH per SALUTE**:
- EUH066 (irritazione cutanea ripetuta)
- EUH070 (tossico per contatto oculare)
- EUH071 (corrosivo vie respiratorie)
- EUH059 (ambiente - ozono)
- EUH201-EUH208, EUH210, EUH401 (avvertimenti specifici)

### **Fonti esterne**:
- [EUH-phrases complete list](https://msds-eu.com/index.php/hazard-statements/96-list-of-euh-phrases)
- [GHS/CLP Tabella di raccordo](https://www.studiobarbaracalvi.com/wp-content/uploads/2023/04/GHS-CLP-Tabella-di-raccordo-Rev.-2.0-2023.pdf)

---

## ✅ CHECKLIST FINALE

- [x] Bug #1 corretto (separateHCodes con whitelist)
- [x] Bug #2 corretto (H_PHYSICAL_SCORE pulito)
- [x] Bug #3 corretto (EUH070, EUH071 aggiunti)
- [x] Test classificazione H/EUH: 100% PASS
- [x] Test calcoli M.I.R.C.: 100% PASS
- [x] Documentazione completa

---

## 🎯 PROSSIMI PASSI

1. **Test manuale con schede PDF reali**:
   - Aprire `index.html` nel browser
   - Caricare schede dalla cartella `schede di sicurezza test/`
   - Verificare che:
     - EUH066 appaia in "H-codes Salute", NON in "H-codes Fisici"
     - A1, A2, D siano calcolati correttamente
     - Console.log mostri classificazione corretta

2. **Schede suggerite per test**:
   ```
   ./schede di sicurezza test/1690276_EN_MSDS.pdf
   ./schede di sicurezza test/1690269_EN_MSDS.pdf
   ./schede di sicurezza test/1690321_EN_MSDS.pdf
   ./schede di sicurezza test/8MK.pdf
   ./schede di sicurezza test/1690275_EN_MSDS.pdf
   ./schede di sicurezza test/c07100525.pdf
   ```

3. **Validazione finale**:
   - Verificare log console per ogni scheda
   - Confrontare valori A1, A2, D con attesi
   - Verificare che nessun EUH salute contribuisca ai calcoli sicurezza

---

**STATO**: ✅ **CORREZIONI COMPLETATE E TESTATE**
**PRONTO PER**: Validazione manuale con schede PDF reali
