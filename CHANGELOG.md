# CHANGELOG - MOVARISCH

Registro delle modifiche e miglioramenti al progetto MOVARISCH.

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

**Ultimo aggiornamento**: 22 Gennaio 2025
**Autore**: Giuseppe575 + Claude Code
**Repository**: https://github.com/Giuseppe575/movarisch
