# 🧪 PIANO DI TEST - CALCOLO SICUREZZA MOVARISCH
**Data**: 24 Novembre 2025
**Versione**: 1.1.0
**Obiettivo**: Verificare correttezza calcolo A1, A2, IRC dopo bugfix

---

## 📂 CARTELLA TEST
`C:\Users\atisg\movarisch\schede di sicurezza test`

**Totale SDS**: 27 file PDF

---

## 🎯 TEST CASE PRIORITARI

### TEST 1: ACETATO DI ETILE (Solo H-codes SALUTE)
**File**: `SDS ACETATO DI ETILE.pdf`

**H-codes attesi**:
- **SALUTE**: H319 (irritazione oculare grave), H336 (sonnolenza/vertigini)
- **FISICI**: Nessuno

**Valori attesi**:
```
Colonna "H-codes Fisici": [vuoto] o "-"
A1: 0.00 (nessun H-code fisico)
A2: 0.00 (nessun EUH reattivo)
D: 0.00
B1-B4: 0.00 (default)
E: 0.00
IRC: 0.00
Giudizio SICUREZZA: RISCHIO IRRILEVANTE
```

**SCORE salute atteso**:
- H319 → 1.00, H336 → 4.50 → SCORE = 4.50 (max)

**Verifica**:
- [ ] Colonna H-codes Fisici è vuota
- [ ] A1 = 0.00
- [ ] A2 = 0.00
- [ ] IRC = 0.00
- [ ] Console mostra: `physicalCodes: []`

---

### TEST 2: ALCOL ETILICO (H-codes FISICI presenti)
**File**: `SDS ALCOL ETILICO.pdf`

**H-codes attesi**:
- **SALUTE**: H225 (?)
- **FISICI**: H225 (liquido facilmente infiammabile)

**Nota**: H225 può essere classificato come fisico (infiammabilità)

**Valori attesi**:
```
Colonna "H-codes Fisici": H225
A1: 7.50 (H225 score 75 / 10)
A2: 0.00 (nessun EUH reattivo)
D: 7.50
B1-B4: 0.00 (default)
E: 0.00
IRC: 0.075 (= 7.50 / 100)
Giudizio SICUREZZA: RISCHIO IRRILEVANTE (0.075 < 6)
```

**Verifica**:
- [ ] Colonna H-codes Fisici contiene "H225"
- [ ] A1 = 7.50
- [ ] A2 = 0.00
- [ ] D = 7.50
- [ ] IRC = 0.075
- [ ] Console mostra: `A1_calculated: 7.5`

---

### TEST 3: SOSTANZA CON EUH REATTIVO
**File**: Da identificare (cercare EUH014, EUH006, EUH029, ecc.)

**H-codes attesi**:
- **FISICI**: H271 (comburente) + EUH014 (reagisce violentemente con acqua)

**Valori attesi**:
```
Colonna "H-codes Fisici": H271, EUH014
A1: 6.00 (H271 score 60 / 10)
A2: 3.00 (EUH014 → reazione violenta)
D: 9.00 (A1 + A2)
B1-B4: 0.00 (default)
E: 0.00
IRC: 0.09 (= 9.00 / 100)
Giudizio SICUREZZA: RISCHIO IRRILEVANTE (0.09 < 6)
```

**Verifica**:
- [ ] Colonna H-codes Fisici contiene EUH
- [ ] A1 > 0
- [ ] A2 > 0 (se EUH reattivo presente)
- [ ] D = A1 + A2
- [ ] Console mostra: `A2_calculated: > 0`

---

### TEST 4: GAS INFIAMMABILE (H220)
**File**: Da identificare (cercare gas compressi)

**H-codes attesi**:
- **FISICI**: H220 (gas estremamente infiammabile)

**Valori attesi**:
```
Colonna "H-codes Fisici": H220
A1: 7.50 (H220 score 75 / 10)
A2: 0.00
D: 7.50
IRC: 0.075
Giudizio SICUREZZA: RISCHIO IRRILEVANTE
```

**Verifica**:
- [ ] A1 = 7.50 (score 75 per H220)
- [ ] Console mostra correttamente H220 nei physicalCodes

---

### TEST 5: ESPLOSIVO (H200-H205)
**File**: Da identificare (improbabile in questa collezione)

**H-codes attesi**:
- **FISICI**: H200, H201, H202, H203, H204, o H205

**Valori attesi**:
```
A1: 10.00 (score massimo 100 / 10)
A2: varia (se EUH presenti)
D: >= 10.00
IRC: >= 0.10
Giudizio SICUREZZA: RISCHIO IRRILEVANTE (se B1-B4 = 0)
```

---

### TEST 6: CORROSIVO (H290)
**File**: Verificare se presente (es. acidi)

**H-codes attesi**:
- **FISICI**: H290 (corrosivo per i metalli)
- **SALUTE**: H314, H318 (corrosivo per pelle/occhi)

**Valori attesi**:
```
Colonna "H-codes Fisici": H290
A1: 3.00 (H290 score 30 / 10)
A2: 0.00 (H290 non è reattivo)
D: 3.00
IRC: 0.03
```

**Verifica**:
- [ ] H290 finisce nei physicalCodes (H2xx)
- [ ] H314/H318 finiscono nei healthCodes (H3xx)
- [ ] Separazione corretta

---

## 🔬 PROCEDURA DI TEST MANUALE

### Setup
1. Apri `index.html` in un browser moderno (Chrome/Edge)
2. Apri Console Browser (F12 → Console)
3. Tieni aperto questo documento per confrontare i risultati

### Per ogni SDS di test:

#### STEP 1: Caricamento
1. Clicca "Scegli file"
2. Seleziona SDS dalla cartella test
3. Clicca "Estrai & Calcola"

#### STEP 2: Verifica Console
Cerca nella console:
```javascript
[filename.pdf] EXTRACTION: {
  healthCodes: [...],
  physicalCodes: [...],
  flashPoint: ...,
  autoIgnitionTemp: ...,
  A1_calculated: ...,
  A2_calculated: ...
}
```

**Verifica**:
- [ ] `physicalCodes` contiene solo H2xx e EUH
- [ ] `healthCodes` contiene solo H3xx e H4xx
- [ ] `A1_calculated` corrisponde al valore atteso
- [ ] `A2_calculated` corrisponde al valore atteso

#### STEP 3: Verifica Tabella
Scorri orizzontalmente fino alle colonne SICUREZZA:

**Colonna "H-codes Fisici"**:
- [ ] Mostra H-codes fisici estratti (o vuoto se nessuno)
- [ ] Gli H-codes sono separati da ";"

**Colonna "A1"**:
- [ ] Valore numerico corretto (può essere 0.00)
- [ ] Editabile (clicca per modificare)

**Colonna "A2"**:
- [ ] Valore numerico corretto
- [ ] 0.00 se nessun EUH reattivo
- [ ] > 0 se EUH014, EUH006, H260, ecc. presenti

**Colonna "D"**:
- [ ] D = A1 + A2 (verifica somma)

**Colonne "B1, B2, B3, B4"**:
- [ ] Tutti 0.00 inizialmente
- [ ] Editabili

**Colonna "E"**:
- [ ] E = B1 + B2 + B3 + B4 (verifica somma)

**Colonna "IRC"**:
- [ ] IRC = (D + E) / 100
- [ ] Esempio: D=7.5, E=0 → IRC = 0.075

**Colonna "Giudizio SICUREZZA"**:
- [ ] Badge colorato con testo
- [ ] IRC ≤ 6 → "RISCHIO IRRILEVANTE" (verde)
- [ ] IRC > 6 e ≤ 12 → "RISCHIO BASSO" (giallo)
- [ ] IRC > 12 → Altri livelli

#### STEP 4: Test Modifica Manuale B1-B4
1. Clicca su cella B2, inserisci `5.0`, premi Invio
2. Verifica che E si aggiorni (E = 5.0)
3. Verifica che IRC si aggiorni (IRC = (D + 5.0) / 100)
4. Clicca su cella B4, inserisci `-15.0`, premi Invio
5. Verifica che E = 5.0 - 15.0 = -10.0
6. Verifica che IRC = (D - 10.0) / 100

**Esempio pratico**:
```
Iniziale: D=7.5, E=0 → IRC = 0.075
Dopo B2=5.0: D=7.5, E=5.0 → IRC = 0.125
Dopo B4=-15.0: D=7.5, E=-10.0 → IRC = -0.025 (→ 0.00, min capped)
```

#### STEP 5: Verifica Scheda Cumulativa
1. Clicca pulsante "Scheda Cumulativa"
2. Si apre `cumulative-report.html` in nuova tab

**Sezione 3: VALUTAZIONE RISCHIO SICUREZZA**:
- [ ] "Frasi H Fisiche" mostra H-codes fisici
- [ ] "A1 - Danno chimico-fisico" mostra valore corretto
- [ ] "A2 - Danno reazioni pericolose" mostra valore corretto
- [ ] "D - Danno totale" = A1 + A2
- [ ] "B1 - Modalità di lavoro" mostra 0.00 (o valore modificato)
- [ ] "B2 - Frequenza e tempi" mostra 0.00 (o valore modificato)
- [ ] "B3 - Quantitativi" mostra 0.00
- [ ] "B4 - Fattori riduzione" mostra 0.00 (o valore modificato)
- [ ] "E - Esposizione totale" = B1+B2+B3+B4
- [ ] "IRC - Indice Rischio Chimico SICUREZZA" mostra valore corretto

**Console Scheda Cumulativa**:
Cerca log:
```javascript
🟢 UI - A1 (Danno chimico-fisico): ...
🟢 UI - A2 (Danno reazioni): ...
🟢 UI - D (Danno totale): ...
🟢 UI - IRC (Rischio SICUREZZA): ...
```

---

## 📊 TABELLA RIEPILOGO TEST

| File | H-codes Fisici | A1 | A2 | D | IRC | Note |
|------|----------------|----|----|---|-----|------|
| SDS ACETATO DI ETILE.pdf | - | 0.00 | 0.00 | 0.00 | 0.00 | ✓ Solo salute |
| SDS ALCOL ETILICO.pdf | H225 | 7.50 | 0.00 | 7.50 | 0.075 | ✓ Infiammabile |
| ... | ... | ... | ... | ... | ... | ... |

**Compilare durante i test**

---

## 🐛 PROBLEMI DA SEGNALARE

Se durante i test trovi:

### ❌ H-codes fisici non estratti
**Sintomo**: Colonna "H-codes Fisici" vuota anche se SDS contiene H2xx
**Verifica**:
1. Console → cerca `physicalCodes: []`
2. Se vuoto ma dovrebbe avere H-codes → BUG estrazione
3. Controlla Sezione 2.1 del PDF (Classificazione)

### ❌ A1 calcolato male
**Sintomo**: A1 non corrisponde allo score atteso
**Verifica**:
1. Console → confronta `A1_calculated` con tabella H_PHYSICAL_SCORE
2. Verifica formula: A1 = max(scores) / 10
3. Esempio: H220 (score 75) → A1 dovrebbe essere 7.50

### ❌ A2 sempre 0 con EUH presenti
**Sintomo**: A2 = 0.00 anche se ci sono EUH014, EUH006, H260
**Verifica**:
1. Console → cerca `A2_calculated: 0`
2. Console → verifica che EUH sia in `physicalCodes`
3. Controlla funzione `calculateA2FromPhysicalCodes()`

### ❌ IRC non si aggiorna
**Sintomo**: Modifico B1-B4 ma IRC rimane uguale
**Verifica**:
1. Verifica che E si aggiorni
2. Verifica che la pagina si "refreshi" (tabella si ridisegna)
3. Controlla console per errori JavaScript

### ❌ Scheda cumulativa mostra valori vecchi
**Sintomo**: PI=10, IQ=1, FCO=1.0 invece di A1, A2, B1-B4
**Verifica**:
1. Svuota cache browser (Ctrl+Shift+Delete)
2. Ricarica pagina (Ctrl+F5)
3. Se persiste → file `cumulative-report.html` non aggiornato

---

## 📋 CHECKLIST COMPLETA

### Test Funzionali
- [ ] Acetato di Etile (solo salute) → A1=0, A2=0, IRC=0
- [ ] Alcol Etilico (infiammabile) → A1>0, A2=0, IRC>0
- [ ] Sostanza con EUH reattivo → A1>0, A2>0, IRC>0
- [ ] Sostanza corrosiva (H290) → A1=3.0
- [ ] Gas infiammabile (H220) → A1=7.5
- [ ] Modifica B2=5.0 → E=5.0, IRC ricalcolato
- [ ] Modifica B4=-15.0 → E negativo, IRC ricalcolato

### Test Interfaccia
- [ ] Colonna H-codes Fisici popolata correttamente
- [ ] Colonne A1, A2 editabili e visualizzate
- [ ] Colonna D calcolata automaticamente (A1+A2)
- [ ] Colonne B1-B4 editabili
- [ ] Colonna E calcolata automaticamente (somma B)
- [ ] Colonna IRC calcolata e formattata (2 decimali)
- [ ] Badge "Giudizio SICUREZZA" colorato correttamente

### Test Scheda Cumulativa
- [ ] Sezione SICUREZZA mostra tutti i campi M.I.R.C.
- [ ] Valori sincronizzati con tabella principale
- [ ] Nessun valore hardcodato (PI, IQ, FCO)
- [ ] Console mostra log corretti

### Test Console
- [ ] Log `EXTRACTION` mostra H-codes separati
- [ ] Log mostra `A1_calculated` e `A2_calculated`
- [ ] Nessun errore JavaScript
- [ ] Nessun warning "undefined" per campi M.I.R.C.

---

## 🎯 CRITERI DI SUCCESSO

Il bugfix è considerato **RIUSCITO** se:

1. ✅ **Tutti i 27 file PDF** vengono processati senza errori JavaScript
2. ✅ **A1 calcolato correttamente** per tutti i file con H-codes fisici
3. ✅ **A2 calcolato correttamente** per file con EUH reattivi (se presenti)
4. ✅ **IRC calcolato** e diverso da 0.00 quando A1 o A2 > 0
5. ✅ **Scheda cumulativa sincronizzata** con valori reali (non hardcodati)
6. ✅ **Modifica B1-B4 funziona** e IRC si aggiorna
7. ✅ **Nessun crash** o "undefined" in console

---

## 📝 REPORT TEST

**Data test**: ___________
**Tester**: ___________
**Browser**: ___________ (Chrome/Edge/Firefox + versione)

### Risultati
- [ ] Test SUPERATO - Tutti i test funzionano
- [ ] Test PARZIALE - Alcuni problemi minori (specificare sotto)
- [ ] Test FALLITO - Problemi critici (specificare sotto)

### Note:
_______________________________________________________
_______________________________________________________
_______________________________________________________

### Screenshot allegati:
1. Console con log EXTRACTION
2. Tabella con colonne SICUREZZA popolate
3. Scheda cumulativa sezione SICUREZZA

---

**Fine Piano di Test**
