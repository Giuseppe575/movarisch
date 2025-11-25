# CHANGELOG - MOVARISCH

Registro delle modifiche e miglioramenti al progetto MOVARISCH.

---

## [2025-11-25] - Bugfix: Correzione Classificazione EUH per Calcoli M.I.R.C.

### 🐛 Problemi Critici Risolti

#### 1. Classificazione Errata EUH come Pericoli Fisici
**Problema**: La funzione `separateHCodes()` classificava TUTTI i codici EUH come pericoli fisici, inclusi quelli per la salute (es. EUH066, EUH070, EUH071).

**Impatto**:
- EUH066 ("L'esposizione ripetuta può provocare secchezza o screpolature della pelle") veniva erroneamente considerato nei calcoli M.I.R.C. per la SICUREZZA
- EUH per allergie/sensibilizzazione (EUH203-208) contribuivano erroneamente ai calcoli di rischio sicurezza
- Calcoli A1, A2, D non conformi alla metodologia INRS

**Soluzione**:
- Implementata **whitelist esplicita** degli EUH per sicurezza secondo INRS:
  - EUH001, EUH006, EUH014, EUH018, EUH019, EUH044 (esplosivi/reattivi)
  - EUH209, EUH209A (infiammabili durante l'uso)
  - EUH029, EUH031, EUH032 (gas tossici da reazioni)
- Tutti gli altri EUH vengono classificati come pericoli per la SALUTE
- File modificato: `app.js` (righe 416-456)

```javascript
// EUH per SICUREZZA (whitelist esplicita secondo INRS M.I.R.C.)
const SAFETY_EUH = new Set([
  'EUH001', 'EUH006', 'EUH014', 'EUH018', 'EUH019', 'EUH044',
  'EUH209', 'EUH209A',
  'EUH029', 'EUH031', 'EUH032'
]);

// Classificazione con controllo whitelist
else if(/^EUH\d{3}[A-Z]?$/.test(baseCode)){
  if(SAFETY_EUH.has(baseCode)){
    physical.push(code);
  } else {
    health.push(code);  // EUH066, EUH070, EUH071, ecc. → salute
  }
}
```

#### 2. H_PHYSICAL_SCORE Conteneva EUH per la Salute
**Problema**: La tabella `H_PHYSICAL_SCORE` includeva EUH per allergie/sensibilizzazione che NON sono pericoli fisici secondo INRS.

**EUH erroneamente inclusi**:
- EUH203 (Cromo VI - allergia)
- EUH204 (Isocianati - allergia)
- EUH205 (Epossidici - allergia)
- EUH208 (Sensibilizzante - allergia)
- EUH201, 202, 206, 207, 210, 401 (avvertimenti generici)

**Impatto**: Prodotti con questi EUH contribuivano erroneamente ad A1 (es. EUH203 → A1 = +2.0)

**Soluzione**:
- Rimossi tutti gli EUH non conformi INRS
- Mantenuti solo EUH209 e EUH209A (infiammabili durante l'uso)
- File modificato: `app.js` (righe 69-76)

```javascript
// EUH - INFIAMMABILITÀ DURANTE L'USO (35)
"EUH209":35, "EUH209A":30
// NOTA: Rimossi EUH201-EUH208, EUH210, EUH401
```

#### 3. EUH070, EUH071 Mancanti in H_SCORE
**Problema**: I codici EUH070 ("Tossico per contatto oculare") e EUH071 ("Corrosivo per le vie respiratorie") non avevano punteggi per i calcoli di rischio SALUTE.

**Soluzione**:
- Aggiunti EUH070 (5.00) e EUH071 (5.50) alla tabella H_SCORE
- File modificato: `app.js` (riga 35)

```javascript
"H315":4.50,"H318":3.00,"H319":3.00,"EUH066":2.50,"EUH070":5.00,"EUH071":5.50,
```

### ✅ Validazione e Testing

#### Test Automatici Implementati
**File creati**:
1. `test-hcode-classification.js` - Test classificazione H/EUH
   - 98 test eseguiti
   - **100% PASS**
   - Verifica: H2xx, H3xx, H4xx, tutti gli EUH

2. `test-real-sds.js` - Test calcoli M.I.R.C.
   - 30 verifiche eseguite (6 casi × 5 controlli)
   - **100% PASS**
   - Casi testati: acetone, esplosivi, reattività acqua, gas tossici, solo salute, EUH infiammabili

#### Risultati Test
```
📊 Test Classificazione H/EUH:
✅ H-codes fisici (H2xx): 32/32
✅ EUH per sicurezza: 11/11
✅ H-codes salute (H3xx, H4xx): 38/38
✅ EUH per salute: 15/15
✅ H-codes con categorie: 3/3
Total: 98/98 (100%)

📊 Test Calcoli M.I.R.C.:
✅ Acetone (H225, H319, H336, EUH066) → A1=7.5, A2=0, D=7.5
✅ Reattività acqua (H260, H314, EUH014) → A1=7.0, A2=6.0, D=13.0
✅ Esplosivo (H201, H315, H335) → A1=10.0, A2=0, D=10.0
✅ Gas tossici (H220, H331, EUH029, EUH066) → A1=7.5, A2=2.0, D=9.5
✅ Solo salute (H302, H315, H319, EUH066, EUH070) → A1=0, A2=0, D=0
✅ EUH infiammabile (H226, H304, EUH209) → A1=7.5, A2=0, D=7.5
Total: 30/30 (100%)
```

### 📁 File Modificati

| File | Righe | Descrizione |
|------|-------|-------------|
| `app.js` | 416-456 | Funzione `separateHCodes()` con whitelist EUH |
| `app.js` | 69-76 | Pulizia `H_PHYSICAL_SCORE` - rimossi EUH non INRS |
| `app.js` | 35 | Aggiunti EUH070, EUH071 a `H_SCORE` |

### 📚 File di Documentazione Creati

| File | Scopo |
|------|-------|
| `BUGFIX_EUH_CLASSIFICATION.md` | Report completo bug, correzioni, validazione |
| `test-hcode-classification.js` | Suite test automatici classificazione |
| `test-real-sds.js` | Suite test automatici calcoli M.I.R.C. |
| `GUIDA_TEST_MANUALE.md` | Guida testing manuale con checklist |
| `console-test-helper.js` | Helper JavaScript per validazione console |
| `TEST_INSTRUCTIONS.txt` | Istruzioni rapide per test |

### 🎯 Impatto delle Correzioni

**Prima**:
- ❌ EUH066 classificato come "physical" → contribuiva erroneamente a calcoli sicurezza
- ❌ EUH203-208 (allergie) contribuivano ad A1
- ❌ EUH070, EUH071 non avevano punteggio salute

**Dopo**:
- ✅ EUH066 classificato come "health" → usa H_SCORE per calcoli salute
- ✅ Solo EUH INRS conformi usati per calcoli M.I.R.C. sicurezza
- ✅ EUH070, EUH071 hanno punteggi corretti per salute
- ✅ Calcoli A1, A2, D conformi a metodologia INRS

### 📖 Riferimenti

**Documentazione INRS**:
- File locale: `MIRC_Metodologia_Sicurezza.md` (sezione EUH: righe 419-428)

**Fonti esterne**:
- [EUH-phrases complete list](https://msds-eu.com/index.php/hazard-statements/96-list-of-euh-phrases)
- [GHS/CLP Tabella di raccordo](https://www.studiobarbaracalvi.com/wp-content/uploads/2023/04/GHS-CLP-Tabella-di-raccordo-Rev.-2.0-2023.pdf)

**EUH per SICUREZZA (secondo INRS)**:
- Esplosivi/reattivi: EUH001, EUH006, EUH014, EUH018, EUH019, EUH044
- Infiammabili: EUH209, EUH209A
- Gas tossici da reazioni: EUH029, EUH031, EUH032

**EUH per SALUTE**:
- Irritazione/tossicità: EUH066, EUH070, EUH071
- Allergie/sensibilizzazione: EUH203, EUH204, EUH205, EUH208
- Avvertimenti: EUH201-202, EUH206-207, EUH210, EUH401, EUH059

---

## [2025-01-22] - Fix Sincronizzazione Scheda Cumulativa

### Problemi Risolti

#### 1. Visualizzazione Dati in Tabella
**Problema**: I dati estratti dalle SDS venivano correttamente inseriti nel DOM ma non erano visibili nella tabella HTML.

**Causa**: Conflitti CSS impedivano la visualizzazione delle celle contenenti elementi `<select>` e campi `contenteditable`.

**Soluzione**:
- Aggiunto CSS forzato con `!important` per garantire visibilità totale
- Implementati stili di test con colori vividi per debug
- File modificato: `style.css` (righe 89-125)

```css
#tbl tbody tr {
    display: table-row !important;
    visibility: visible !important;
}

#tbl tbody td {
    display: table-cell !important;
    visibility: visible !important;
    opacity: 1 !important;
}
```

#### 2. Pulizia Nome Commerciale
**Problema**: Il nome del prodotto estratto conteneva prefissi indesiderati come "commerciale:" e suffissi "(Segue da pagina X)".

**Esempio**:
- Prima: `commerciale: Etile acetato (Segue da pagina 1)`
- Dopo: `Etile acetato`

**Soluzione**:
- Implementata pulizia "chirurgica" del testo estratto senza modificare la funzione di estrazione
- File modificato: `app.js` (righe 1581-1588)

```javascript
// Pulizia nome commerciale
let cleanedProductName = productName;
if (cleanedProductName) {
  cleanedProductName = cleanedProductName
    .replace(/^commerciale:\s*/i, '')
    .replace(/\s*\(Segue da pagina \d+\)/gi, '')
    .trim();
}
```

#### 3. Sincronizzazione Scheda Cumulativa
**Problema**: La scheda cumulativa mostrava dati hardcodati o dati vecchi invece dei dati reali estratti dalle SDS.

**Esempio dati errati visualizzati**:
- H-codes errati: H304, H315, H335 (invece di H319, H336)
- Valori SICUREZZA: H226, H290 (non presenti nella SDS)
- Score errato: 4.50 (invece di 3.50)

**Causa**:
- Cache del browser mostrava versione vecchia
- localStorage conteneva dati obsoleti
- Mancanza di meccanismo di aggiornamento forzato

**Soluzione**:
- **Cancellazione preventiva** vecchi dati localStorage prima del salvataggio
- **Cache busting** con timestamp nell'URL
- **Verifica età dati** con warning se più vecchi di 5 minuti
- **Log debug dettagliati** per tracciare flusso dati

**File modificati**:

`app.js` (righe 1646-1677):
```javascript
// CANCELLA vecchi dati prima di salvare nuovi
localStorage.removeItem('movarisch_cumulative_data');
localStorage.setItem('movarisch_cumulative_data', JSON.stringify(dataToSave));

// Cache busting con timestamp
const timestamp = new Date().getTime();
const url = `cumulative-report.html?t=${timestamp}`;
window.open(url, '_blank');
```

`cumulative-report.html` (righe 304-373):
```javascript
// Verifica età dati
const dataAge = new Date() - new Date(cumulativeData.timestamp);
const ageMinutes = Math.floor(dataAge / 60000);
if(ageMinutes > 5){
  console.warn('⚠️ ATTENZIONE: I dati hanno più di 5 minuti!');
}
```

### Funzionalità Aggiunte

#### Sistema di Debug Completo
**Log in app.js** (salvataggio dati):
- 🔵 Stato `state.rows` prima del salvataggio
- 🔵 Dati da salvare in localStorage
- 🔵 Verifica immediata dopo salvataggio
- 🔵 Conferma apertura finestra

**Log in cumulative-report.html** (caricamento dati):
- 🟢 Raw string da localStorage
- 🟢 Dati parsati
- 🟢 Numero di righe disponibili
- 🟢 Età dei dati (timestamp)
- 🟢 Prima riga estratta con tutti i campi
- 🟢 Oggetto substanceData creato
- 🟢 Valori popolati nell'UI

#### Messaggi di Errore Chiari
Se localStorage è vuoto o i dati sono corrotti:
```
❌ ERRORE CRITICO: localStorage è VUOTO!
❌ SOLUZIONE: Torna a index.html, carica un PDF, clicca "Estrai & Calcola", poi "Scheda Cumulativa"
```

### File Modificati

| File | Righe Modificate | Descrizione |
|------|-----------------|-------------|
| `style.css` | 89-125 | CSS forzato per visibilità tabella |
| `app.js` | 1581-1588 | Pulizia nome commerciale |
| `app.js` | 1646-1677 | Gestione localStorage con cancellazione preventiva |
| `cumulative-report.html` | 297-419 | Sistema debug + verifica età dati |

### Test e Validazione

**Caso di test eseguito**:
- File: `SDS ACETATO DI ETILE.pdf`
- H-codes estratti: H319, H336
- SCORE calcolato: 3.50
- Rischio Inalatorio: Calcolato correttamente
- Rischio Cutaneo: Calcolato correttamente
- H-codes Fisici: Estratti automaticamente
- Pericolo Intrinseco (PI): Calcolato da H-codes fisici

**Risultato**: ✅ Tutti i dati sincronizzati correttamente tra tabella principale e scheda cumulativa

### Istruzioni per Sviluppatori

#### Debug del Flusso Dati
1. Aprire Console browser (F12)
2. Caricare PDF SDS
3. Cliccare "Estrai & Calcola"
4. Osservare log 🔵 BLU per estrazione e salvataggio
5. Cliccare "Scheda Cumulativa"
6. Osservare log 🟢 VERDE per caricamento e visualizzazione

#### Clear Cache in Caso di Problemi
```javascript
// In Console browser
localStorage.removeItem('movarisch_cumulative_data');
location.reload();
```

O manualmente:
- F12 → Application → Storage → Local Storage → Delete
- Ctrl+Shift+R (Hard Refresh)

### Architettura Tecnica

#### Flusso Dati
```
PDF SDS
  ↓
[PDF.js] Estrazione testo
  ↓
[Regex] Parsing H-codes, nome, dati
  ↓
[MOVARISCH.js] Calcolo rischi
  ↓
[state.rows] Array dati processati
  ↓
[localStorage] Persistenza
  ↓
[cumulative-report.html] Visualizzazione
```

#### Storage LocalStorage
**Chiave**: `movarisch_cumulative_data`

**Struttura dati**:
```json
{
  "rows": [
    {
      "nome": "Etile acetato",
      "cas": "141-78-6",
      "hcodes": ["H319", "H336"],
      "SCORE": 3.50,
      "Rinal": 22.50,
      "Rcut": 3.50,
      "Rtot": 25.50,
      "hcodesPhysical": ["H226"],
      "PI": 75,
      "RiskSafety": 506.25,
      "OverallRiskValue": 506.25
    }
  ],
  "timestamp": "2025-01-22T10:30:00.000Z",
  "count": 1
}
```

### Compatibilità

- ✅ Chrome/Edge (testato)
- ✅ Firefox (compatibile)
- ✅ Safari (compatibile con localStorage)
- ⚠️ IE11 (non supportato - richiede PDF.js polyfill)

### Note di Sicurezza

- Tutti i dati rimangono **offline** nel browser
- Nessun upload a server esterni
- localStorage limitato allo stesso origin
- Dati persistono fino a cancellazione manuale cache

### Prossimi Miglioramenti Suggeriti

- [ ] Esportazione scheda cumulativa in PDF
- [ ] Gestione multi-sostanza nella scheda cumulativa
- [ ] Storico valutazioni con timestamp
- [ ] Import/Export configurazioni di default
- [ ] Validazione automatica dati estratti
- [ ] Suggerimenti DPI basati su AI/ML
- [ ] Integrazione database sostanze chimiche

---

## Cronologia Versioni

### v1.3.0 (2025-11-25)
- 🐛 **Bugfix critico**: Correzione classificazione EUH per calcoli M.I.R.C.
- ✅ Whitelist esplicita EUH per sicurezza (conformità INRS)
- ✅ Pulizia H_PHYSICAL_SCORE (rimossi EUH non conformi)
- ✅ Aggiunti EUH070, EUH071 per calcoli salute
- ✅ Suite test automatici: 128 test, 100% pass
- 📚 Documentazione completa bug e correzioni

### v1.2.0 (2025-01-22)
- Fix sincronizzazione scheda cumulativa
- Sistema debug completo
- Cache busting automatico

### v1.1.0 (commit precedenti)
- Implementazione metodologia M.I.R.C. (INRS) per rischio SICUREZZA
- Estrazione automatica dati SICUREZZA da SDS
- Giudizio finale Word include SALUTE + SICUREZZA

### v1.0.0 (iniziale)
- Parser SDS da PDF
- Calcolo MOVARISCH per rischio SALUTE
- Esportazione Excel e Word

---

**Ultimo aggiornamento**: 25 Novembre 2025
**Autore**: Giuseppe575 + Claude Code
**Repository**: https://github.com/Giuseppe575/movarisch
