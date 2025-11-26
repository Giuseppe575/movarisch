# MOVARISCH v1.1.0 - Release Notes

**Data rilascio:** 26 Novembre 2025
**Repository:** [Giuseppe575/movarisch](https://github.com/Giuseppe575/movarisch)

---

## 🎯 Panoramica

Questa release introduce correzioni critiche alla classificazione dei codici EUH nella metodologia M.I.R.C. (INRS) e un aggiornamento completo della documentazione di supporto. Include anche strumenti per facilitare l'avvio del server locale.

---

## 🐛 Bug Risolti

### Correzione Classificazione EUH per M.I.R.C.

**Problema:** I codici EUH non venivano correttamente classificati nel calcolo del rischio di sicurezza M.I.R.C. (INRS), causando valutazioni imprecise del fattore A2 (danno sicurezza).

**Soluzione implementata:**
- Aggiunta mappatura completa dei codici EUH fisici per il calcolo A2:
  - `EUH001`, `EUH006`, `EUH014`, `EUH018`, `EUH019`, `EUH044`: **A2 = 5** (pericoli esplosivi/infiammabili)
  - `EUH029`, `EUH031`, `EUH032`: **A2 = 5** (reazioni pericolose)
  - `EUH070`: **A2 = 2** (tossicità oculare)
  - Altri EUH non fisici: **A2 = 0**

**File modificati:**
- `src/lib/movarisch.js` (funzione `getA2Score`)

**Commit:** `9507c13` - Bugfix: correzione classificazione EUH per calcoli M.I.R.C.

**Impatto:** Calcoli IRC (Indice Rischio Chimico) ora accurati per sostanze con codici EUH.

---

## ✨ Nuove Funzionalità

### 1. Script Automatico di Avvio Server

**File aggiunti:**
- `start-server.bat` - Script batch per avvio immediato server locale porta 8080
- `README_SERVER.md` - Guida completa per risolvere problemi CORS e file:///

**Funzionalità:**
- Doppio click per avviare server HTTP locale
- Verifica automatica presenza Python
- Messaggio di errore chiaro se Python mancante
- Istruzioni per fermare il server

**Beneficio:** Elimina problemi CORS quando si apre `index.html` direttamente con `file:///`

### 2. Documentazione Estesa

#### Knowledge Base (support/knowledge-base.html)

**Nuove sezioni aggiunte:**
- **Cos'è MOVARISCH**: introduzione metodologia D.Lgs. 81/08
- **Codici H e classificazione**: H2xx (fisici), H3xx (salute), H4xx (ambiente)
- **Metodologia M.I.R.C. (INRS)**: calcolo IRC = D × E con dettagli fattori
- **Formule di calcolo**: esposizione inalatoria/cutanea, R_tot
- **Classificazione giudizio rischio**: soglie da irrilevante a grave
- **FAQ aggiornate**: rimozione test libreria, nuove domande CMR e estrazione fallita

#### Documentazione Tecnica (support/documentazione.html)

**Nuove sezioni aggiunte:**
- **Metodologia MOVARISCH completa**: formule E_inal, E_cut, calcolo rischio
- **Metodologia M.I.R.C. (INRS)**: IRC con fattori D (A1+A2) ed E (B1+B2+B3+B4)
- **Codici H/EUH classificazione CLP**: tutti i range con esempi
- **Calcoli MoVaRiSch parametri**: valori numerici per indici D, Q, U, C, T, I, d
- **Controlli qualità**: checklist verifica estrazione e parametri

**File modificati:**
- `support/knowledge-base.html`
- `support/documentazione.html`

**Commit:** `4bc2483` - docs: Aggiornamento completo documentazione e contatti supporto

### 3. Unificazione Contatti

**Modifiche:**
- Sostituito `supporto@movarisch.local` con `atis.giuseppe@gmail.com` in tutti i file
- Rimosso `giuseppe.strifezza@movarisch.local` da licenza-uso.html
- Unificato contatto supporto tecnico e licenze

**File modificati:**
- `support/ticket.html` (italiano e inglese)
- `support/documentazione.html`
- `support/licenza-uso.html`

**Commit:** `1d2838a` - docs: Rimozione test libreria e unificazione contatti

---

## 📝 Modifiche alla Documentazione

### File Aggiornati

| File | Descrizione Modifiche |
|------|----------------------|
| `support/knowledge-base.html` | +6 articoli, FAQ estese, rimozione test libreria |
| `support/documentazione.html` | +5 sezioni metodologie complete, tabelle parametri |
| `support/ticket.html` | Email aggiornata IT/EN |
| `support/licenza-uso.html` | Contatti unificati |
| `README_SERVER.md` | Nuova guida server locale |

### Righe di Codice

- **Aggiunte:** ~350 righe di documentazione
- **Modificate:** ~20 righe (email e riferimenti)
- **Rimosse:** ~15 righe (test libreria, email obsolete)

---

## 🔧 File Modificati (Dettaglio Tecnico)

### Core Application

```
src/lib/movarisch.js
└── Funzione getA2Score()
    ├── Aggiunta mappatura EUH001-EUH070
    ├── Logica classificazione A2 per EUH fisici
    └── Gestione EUH non fisici (A2 = 0)
```

### Documentazione

```
support/
├── knowledge-base.html      [+215 righe]
├── documentazione.html      [+180 righe]
├── ticket.html              [2 modifiche email]
└── licenza-uso.html         [unificazione contatti]
```

### Nuovi File

```
├── start-server.bat         [script batch Windows]
├── README_SERVER.md         [guida server locale]
└── RELEASE_NOTES_v1.1.0.md  [questo file]
```

---

## 📦 Backup

È stato creato un backup completo del progetto in:
- **Archivio:** `backup_2025-11-26.zip`
- **Cartella:** `backup_2025-11-26/`

Il backup include tutti i file committati su git (esclude .git, node_modules, backup precedenti).

---

## 🚀 Istruzioni per l'Uso

### Avvio Applicazione

#### Metodo 1: Script Automatico (Raccomandato)
```bash
# Doppio click su:
start-server.bat

# Poi apri nel browser:
http://localhost:8080
```

#### Metodo 2: Comando Manuale
```bash
python -m http.server 8080
```

### Verifica Modifiche EUH

Per testare la correzione classificazione EUH:

1. Carica una SDS con codici EUH (es. EUH001, EUH018, EUH070)
2. Verifica nella colonna "A2" che il punteggio sia corretto:
   - EUH esplosivi/infiammabili → A2 = 5
   - EUH tossici oculari → A2 = 2
   - Altri EUH non fisici → A2 = 0
3. Controlla che IRC sia calcolato correttamente

### Consultare Documentazione

- **Knowledge Base:** http://localhost:8080/support/knowledge-base.html
- **Documentazione Tecnica:** http://localhost:8080/support/documentazione.html
- **Guida Server:** `README_SERVER.md`

---

## 🔄 Aggiornamento da v1.0.x

### Compatibilità

✅ **Retrocompatibile:** I dati salvati in localStorage delle versioni precedenti funzionano senza modifiche.

### Cosa Fare

1. **Pull da GitHub:**
   ```bash
   git pull origin main
   ```

2. **Riavviare Server:**
   - Usa `start-server.bat` o riavvia manualmente

3. **Svuota Cache Browser:**
   - `Ctrl + Shift + R` (hard refresh)
   - Oppure apri in modalità incognito

4. **Ricalcola Sostanze con EUH:**
   - Se hai valutazioni precedenti con codici EUH, ricarica le SDS
   - Premi "Estrai & Calcola" per aggiornare A2 e IRC

---

## 📊 Statistiche Progetto

- **Commit totali in questa release:** 3
- **File modificati:** 7
- **Righe aggiunte:** ~370
- **Bug risolti:** 1 critico (classificazione EUH)
- **Nuovi file:** 3

---

## 👥 Contributori

- **Giuseppe Atis** (atis.giuseppe@gmail.com)
  - Bugfix classificazione EUH
  - Documentazione completa
  - Script avvio server

- **Claude Code** (Anthropic)
  - Assistenza sviluppo
  - Generazione documentazione
  - Code review

---

## 🔮 Prossimi Sviluppi (v1.2.0)

### In Pianificazione

- [ ] Supporto multi-lingua (inglese) completo
- [ ] Salvataggio progetti su file JSON
- [ ] Import/export configurazioni parametri
- [ ] Template personalizzabili per export Word
- [ ] Grafici visualizzazione rischio
- [ ] Modalità offline completa (bundle PDF.js locale)

### Sotto Valutazione

- [ ] Database sostanze chimiche precompilato
- [ ] Integrazione API ECHA per dati SDS
- [ ] Mobile-responsive design
- [ ] PWA (Progressive Web App)

---

## 📞 Supporto e Contatti

**Email:** atis.giuseppe@gmail.com

**Segnalazione Bug:**
- Descrivi il problema
- Allega SDS problematica (se possibile)
- Indica browser e versione

**Richieste Funzionalità:**
- Descrivi caso d'uso
- Spiega beneficio atteso
- Fornisci esempi se possibile

---

## 📜 Licenza

Proprietà del Dott. Giuseppe Strifezza
Uso autorizzato per consulenti e collaboratori
Tutti i diritti riservati

---

**Fine Release Notes v1.1.0**

*Generato con Claude Code - 26 Novembre 2025*
