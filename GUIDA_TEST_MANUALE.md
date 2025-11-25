# 🧪 GUIDA TEST MANUALE - Validazione Correzioni EUH

**Data**: 25 Novembre 2025
**Scopo**: Validare che le correzioni funzionino correttamente con schede PDF reali

---

## 📋 CHECKLIST TEST

### **PREPARAZIONE**

- [x] Correzioni applicate a `app.js`
- [x] Test automatici eseguiti (100% pass)
- [x] `index.html` aperto nel browser
- [ ] Console browser aperta (F12 → tab Console)

---

## 🎯 TEST DA ESEGUIRE

### **TEST 1: Verifica classificazione EUH066**

**Obiettivo**: Confermare che EUH066 sia classificato come "health" e NON contribuisca ai calcoli M.I.R.C.

**Passi**:
1. ✅ Apri l'applicazione (già fatto)
2. Apri la Console del browser (premi **F12** → tab **Console**)
3. Clicca su **"Carica SDS (PDF)"**
4. Seleziona una scheda che contiene EUH066 (es. acetone, solventi)
5. Attendi il caricamento

**Verifica nella Console**:
Cerca una riga tipo:
```
[filename.pdf] EXTRACTION: {
  healthCodes: [..., "EUH066", ...],
  physicalCodes: ["H225", ...],
  A1_calculated: 7.5,
  A2_calculated: 0
}
```

**✅ PASS se**:
- [ ] `EUH066` appare in `healthCodes` (NON in `physicalCodes`)
- [ ] `A1_calculated` corrisponde al massimo H-code fisico / 10
- [ ] `A2_calculated` è corretto per le reazioni presenti

**❌ FAIL se**:
- [ ] `EUH066` appare in `physicalCodes`
- [ ] `A1` o `A2` sono calcolati erroneamente

---

### **TEST 2: Verifica sostanza con solo H-codes salute**

**Obiettivo**: Confermare che sostanze senza pericoli fisici abbiano A1=0, A2=0, D=0

**Schede suggerite**: Cerca schede con solo H3xx, H4xx (es. coloranti, alcuni prodotti farmaceutici)

**Passi**:
1. Carica una scheda con solo H-codes salute (H300-H499)
2. Verifica nella Console

**✅ PASS se**:
```
physicalCodes: [],
A1_calculated: 0,
A2_calculated: 0
```

**Verifica nella tabella**:
- [ ] Colonna "A1" = 0.00
- [ ] Colonna "A2" = 0.00
- [ ] Colonna "D" = 0.00

---

### **TEST 3: Verifica sostanza infiammabile (H225)**

**Obiettivo**: Confermare calcolo corretto A1 per H225

**Schede suggerite**:
- Acetone
- Etanolo
- Solventi infiammabili

**Passi**:
1. Carica scheda con H225
2. Verifica nella Console

**✅ PASS se**:
```
physicalCodes: ["H225", ...],
A1_calculated: 7.5,    // H225 = 75/10 = 7.5
```

**Verifica nella tabella**:
- [ ] Colonna "H-codes Fisici" contiene "H225"
- [ ] Colonna "A1" = 7.50
- [ ] Colonna "D" = A1 + A2

---

### **TEST 4: Verifica sostanza con reattività acqua**

**Obiettivo**: Confermare calcolo corretto A2 per reazioni pericolose

**H-codes da cercare**: H260, H261, EUH014, EUH029, EUH031, EUH032

**Passi**:
1. Carica scheda con H260 o EUH014 (se disponibile)
2. Verifica nella Console

**✅ PASS se A2 corretto**:
- H260 → A2 = +3.0
- H261 → A2 = +2.0
- EUH014 → A2 = +3.0
- EUH029/031/032 → A2 = +2.0
- EUH018 → A2 = +2.5

**Esempio**:
```
physicalCodes: ["H260", "EUH014"],
A1_calculated: 7.0,    // H260 = 70/10
A2_calculated: 6.0     // H260 (+3.0) + EUH014 (+3.0)
```

---

### **TEST 5: Verifica sostanza esplosiva**

**Obiettivo**: Confermare A1 massimo per esplosivi

**H-codes da cercare**: H200, H201, H202, H203, H204, H205

**Passi**:
1. Carica scheda con H200-H205 (se disponibile)
2. Verifica nella Console

**✅ PASS se**:
```
physicalCodes: ["H201", ...],
A1_calculated: 10.0,   // H201 = 100/10 = 10.0
```

---

### **TEST 6: Verifica EUH per salute NON contribuiscano a M.I.R.C.**

**Obiettivo**: Confermare che EUH203, EUH204, EUH205, EUH208, EUH070, EUH071 NON influenzino A1

**Passi**:
1. Carica scheda con EUH203 (cromo VI) o EUH204 (isocianati) se disponibile
2. Verifica nella Console

**✅ PASS se**:
```
healthCodes: [..., "EUH203", ...],    // In health, NON physical!
physicalCodes: [...],                  // EUH203 NON presente qui
A1_calculated: <valore_da_H2xx_solo>  // NON influenzato da EUH203
```

---

## 🔍 COME INTERPRETARE I RISULTATI

### **Console Browser**

Ogni volta che carichi una scheda, dovresti vedere:

```javascript
[nome_file.pdf] EXTRACTION: {
  healthCodes: Array[...],      // H3xx, H4xx, EUH066, EUH070, EUH071, ecc.
  physicalCodes: Array[...],    // H2xx, EUH001-044, EUH209/209A, EUH029/031/032
  flashPoint: "23°C",           // Se trovato
  autoIgnitionTemp: null,
  A1_calculated: 7.5,           // MAX(physicalCodes scores) / 10
  A2_calculated: 2.0            // Somma punteggi reazioni
}
```

### **Tabella principale**

Verifica le colonne:
- **H-codes Fisici**: Solo H2xx e EUH whitelist
- **A1**: MAX(H_PHYSICAL_SCORE[code]) / 10
- **A2**: Somma punteggi reazioni
- **D**: A1 + A2
- **E**: B1 + B2 + B3 + B4
- **IRC**: (D + E) / 100
- **Giudizio SICUREZZA**: Badge colorato

---

## 📊 SCHEDE SUGGERITE PER TEST

Testa con queste 6 schede selezionate random:

```
1. ./schede di sicurezza test/1690276_EN_MSDS.pdf
2. ./schede di sicurezza test/1690269_EN_MSDS.pdf
3. ./schede di sicurezza test/1690321_EN_MSDS.pdf
4. ./schede di sicurezza test/8MK.pdf
5. ./schede di sicurezza test/1690275_EN_MSDS.pdf
6. ./schede di sicurezza test/c07100525.pdf
```

Per ogni scheda:
1. Carica il PDF
2. Verifica il log console
3. Verifica i valori nella tabella
4. Segna ✅ o ❌ nella checklist sotto

---

## ✅ RISULTATI TEST

### **Scheda 1**: ___________________
- [ ] EUH classificati correttamente (health vs physical)
- [ ] A1 corretto
- [ ] A2 corretto
- [ ] D corretto (A1 + A2)
- [ ] Nessun errore console

**Note**: ___________________________________

---

### **Scheda 2**: ___________________
- [ ] EUH classificati correttamente
- [ ] A1 corretto
- [ ] A2 corretto
- [ ] D corretto
- [ ] Nessun errore console

**Note**: ___________________________________

---

### **Scheda 3**: ___________________
- [ ] EUH classificati correttamente
- [ ] A1 corretto
- [ ] A2 corretto
- [ ] D corretto
- [ ] Nessun errore console

**Note**: ___________________________________

---

### **Scheda 4**: ___________________
- [ ] EUH classificati correttamente
- [ ] A1 corretto
- [ ] A2 corretto
- [ ] D corretto
- [ ] Nessun errore console

**Note**: ___________________________________

---

### **Scheda 5**: ___________________
- [ ] EUH classificati correttamente
- [ ] A1 corretto
- [ ] A2 corretto
- [ ] D corretto
- [ ] Nessun errore console

**Note**: ___________________________________

---

### **Scheda 6**: ___________________
- [ ] EUH classificati correttamente
- [ ] A1 corretto
- [ ] A2 corretto
- [ ] D corretto
- [ ] Nessun errore console

**Note**: ___________________________________

---

## 🚨 PROBLEMI COMUNI

### **Problema**: EUH066 appare in physicalCodes
**Causa**: Correzioni non caricate
**Soluzione**: Ricarica la pagina (Ctrl+R o F5)

### **Problema**: A1 calcolato male
**Causa**: H_PHYSICAL_SCORE non aggiornato
**Soluzione**: Verifica che le correzioni siano in app.js, poi ricarica

### **Problema**: Nessun log nella console
**Causa**: Console non aperta o filtri attivi
**Soluzione**: Apri DevTools (F12), vai su Console, deseleziona filtri

### **Problema**: PDF non caricati
**Causa**: pdf.js non trovato
**Soluzione**: Verifica che esista src/lib/pdf.min.js

---

## ✅ VALIDAZIONE FINALE

Una volta testati almeno 3-4 PDF diversi:

**Il sistema è validato se**:
- [ ] Tutti gli EUH per salute (066, 070, 071, 203-208) vanno in healthCodes
- [ ] Tutti gli EUH per sicurezza (001, 006, 014, 018, 019, 044, 029, 031, 032, 209, 209A) vanno in physicalCodes
- [ ] A1 = MAX(H_PHYSICAL_SCORE[code]) / 10
- [ ] A2 = Somma corretta reazioni
- [ ] D = A1 + A2
- [ ] Nessun errore console

**✅ SE TUTTI I TEST PASSANO**: Le correzioni sono validate al 100%!

---

## 📝 REPORT FINALE

Dopo i test, compila questo report:

**Schede testate**: _____ / 6
**Test passati**: _____ / 6
**Test falliti**: _____ / 6
**Success rate**: _____ %

**Problemi riscontrati**:
- ___________________________________
- ___________________________________

**Conclusione**:
- [ ] ✅ Tutte le correzioni funzionano correttamente
- [ ] ⚠️ Alcuni problemi minori (specificare)
- [ ] ❌ Problemi critici (specificare)

---

**PRONTO PER IL TEST!** 🚀

Segui i passi sopra e condividi i risultati.
