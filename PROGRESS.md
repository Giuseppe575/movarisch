# MOVARISCH - Progress e Stato del Progetto

**Ultimo aggiornamento:** 20 Maggio 2026

---

## Stato Attuale: v1.3.1 ✅ (rilasciata)

### v1.3.1 — fix UI dopo hardening v1.3.0
- **Link "Supporto rapido" funzionanti di nuovo**: `setWindowOpenHandler` consente `file://` per le pagine interne (`support/*.html`) con sandbox sicura (preload + contextIsolation + nodeIntegration:false).
- **Nota legenda aggiornata** ai 2 preset: "P1 (Laboratorio) + P2 (Produzione rapida)" con rinvio ai bottoni in tabella.

### v1.3.0 — adeguamento normativo + UX + security

**Adeguamento MoVaRisCh 2026 e D.Lgs. 135/2024 (in vigore 11/10/2024):**
- Rimosse dal calcolo P: H360, H360D, H360F, H360FD, H360Df, H360Fd (Repr. 1A/1B → ora trattate ex Titolo IX Capo II, art. 234 mod.).
- Mantenute nel calcolo P: H341, H351, H361, H361d, H361f, H361fd, H362 (cat. 2 / allattamento, NON coperte dal D.Lgs. 135/2024).
- Aggiunte: EUH380=10.00, EUH381=8.00 (interferenti endocrini, MoVaRisCh 28/02/2026).
- Nuovo flag `isCmr` + lista `cmrCodes` su ogni riga; warning rosso esplicito nel Word + nuova colonna `Sostanza_CMR_TitIX_CapoII` nell'Excel.

**Preset operativi:**
- Aggiunto `PRESETS.preset2` (Produzione rapida: ventilazione generale, <15min, contatto accidentale).
- `PRESETS.preset1` (Laboratorio) resta default.
- Bottoni "P1"/"P2" in tabella per riga; il bottone si spegne se l'utente modifica manualmente un dropdown.

**Coerenza Word ↔ Calcolo:**
- Indici nel report Word ora stampati come "valore_numerico (descrizione_opzione)" — niente più ambiguità.
- Appendice fissa "Guida agli indici MOVARISCH" (D/Q/U/C/T/I) con esempi laboratorio vs produzione + formula + riferimento normativo.

**Security hardening (Electron):**
- CSP `<meta http-equiv="Content-Security-Policy">` in index.html.
- `setWindowOpenHandler` e `will-navigate` resi restrittivi (blocca `javascript:`, `data:`, `blob:` ecc.).
- Handler `web-contents-created` blocca `<webview>` e nuove finestre non autorizzate.
- Documentate limitazioni note: `sign:null`, `verifyUpdateCodeSignature:false`, license checksum reversibile.
- TODO supply-chain annotati nei loader CDN (xlsx, docx, pdfjs).

### Cose da fare prima del build effettivo
- Aggiornare `en.json` con le nuove chiavi i18n (CMR warning, indexGuide, presets).
- Bundle locale per docx/xlsx/pdfjs (TODO_PRIORITY_ALTA, rinviato a v1.3.1).
- Test aggiuntivi: H360 deve NON contribuire a SCORE; H361 deve contribuire; preset apply/clear.

---

## Stato Precedente: v1.2.0 ✅

### Repository
- **GitHub Programma:** https://github.com/Giuseppe575/movarisch
- **GitHub Releases:** https://github.com/Giuseppe575/movarisch/releases
- **Sito Acquisto:** https://giuseppe575.github.io/movarisch-site/

### Release Pubblicate
- **v1.1.0** - Release Ufficiale (29 Nov 2025)
- **v1.2.0** - Sistema aggiornamenti automatici (1 Feb 2026) ← ATTUALE

---

## Completato ✅

### Sistema Licenze Offline
- [x] `src/license-validator.js` - Validazione licenze con checksum
- [x] `src/license-activation.js` - UI per attivazione licenza
- [x] `src/license-settings.js` - Gestione impostazioni licenza
- [x] Bug risolti nel sistema di validazione
- [x] Test di regressione in `__tests__/movarisch.test.js`

### Sistema Aggiornamenti Automatici
- [x] `installer/updater.js` - Modulo electron-updater
- [x] `installer/main.js` - Integrazione updater all'avvio
- [x] `installer/preload.js` - Eventi update esposti al renderer
- [x] `installer/package.json` - Configurazione publish per GitHub Releases
- [x] Menu "Aiuto → Controlla aggiornamenti..."
- [x] Notifiche automatiche quando disponibile nuova versione
- [x] **TESTATO E FUNZIONANTE** - Gli utenti riceveranno notifiche per versioni future

### Electron Installer Windows
- [x] Configurazione electron-builder
- [x] Icona professionale MOVARISCH
- [x] Installer NSIS in italiano
- [x] Script di build (`build-windows.bat`)

### GitHub Releases
- [x] Release v1.1.0 pubblicata con installer
- [x] Release v1.2.0 pubblicata con sistema aggiornamenti
- [x] File `latest.yml` per electron-updater

---

## Da Fare (Prossime Versioni)

### Per la v1.3.0
- [ ] Migliorare messaggio quando non ci sono aggiornamenti (attualmente mostra "Errore")
- [ ] Eventuali nuove funzionalità richieste dagli utenti
- [ ] Aggiornare sito acquisto se necessario

---

## Come Pubblicare un Aggiornamento

### 1. Aggiorna la versione
Modifica in **3 file**:

**installer/package.json:**
```json
"version": "1.3.0"
```

**installer/main.js** (2 punti):
- Titolo finestra: `title: 'MOVARISCH v1.3.0'`
- Dialog info: `message: 'MOVARISCH v1.3.0'`

**installer/preload.js** (2 punti):
- `version: '1.3.0'`
- `console.log('MOVARISCH v1.3.0 - Electron App')`

### 2. Build dell'installer
```powershell
cd C:\Users\atisg\movarisch\installer
npm run build
```

### 3. Pubblica su GitHub Releases
1. Vai su https://github.com/Giuseppe575/movarisch/releases/new
2. Tag: `v1.3.0`
3. Target: `main`
4. Titolo: `MOVARISCH v1.3.0`
5. Descrizione con novità
6. Carica i file dalla cartella `installer/dist/`:
   - `MOVARISCH-Setup-1.3.0.exe`
   - `latest.yml`
7. Spunta "Set as the latest release"
8. Pubblica

### 4. Commit e push
```powershell
cd C:\Users\atisg\movarisch
git add installer/main.js installer/package.json installer/preload.js
git commit -m "chore: Aggiornamento versione a v1.3.0"
git push origin main
```

### 5. Gli utenti riceveranno la notifica automaticamente!

---

## Struttura File Importanti

```
movarisch/
├── src/
│   ├── license-validator.js    # Validazione licenze
│   ├── license-activation.js   # UI attivazione
│   └── license-settings.js     # Impostazioni
├── installer/
│   ├── main.js                 # Entry point Electron
│   ├── preload.js              # Bridge sicuro
│   ├── updater.js              # Sistema aggiornamenti
│   ├── package.json            # Config build + publish
│   ├── dist/                   # Output build (non committato)
│   └── build/
│       └── icon.ico            # Icona app
├── __tests__/
│   └── movarisch.test.js       # Test automatici
├── docs/
│   ├── eula.html               # Licenza utente
│   └── privacy.html            # Privacy policy
└── PROGRESS.md                 # Questo file
```

---

## Note Tecniche

### electron-updater
- Provider: GitHub Releases
- Owner: Giuseppe575
- Repo: movarisch
- Auto-download: disabilitato (chiede conferma all'utente)
- Auto-install on quit: abilitato
- Controllo automatico: all'avvio + ogni 4 ore

### Test
Esegui con: `npm test`
- 3 test per calcoli MOVARISCH
- Tutti passano ✓

---

## Storico Sessioni di Lavoro

### 1 Febbraio 2026
- ✅ Risolti bug sistema licenze
- ✅ Implementato sistema aggiornamenti automatici (electron-updater)
- ✅ Pubblicata release v1.2.0 su GitHub
- ✅ Testato funzionamento aggiornamenti (funziona!)
- ✅ Aggiornato PROGRESS.md

### Commit Recenti
1. `7ba475d` - chore: Aggiornamento versione a v1.2.0
2. `9a2c5b3` - docs: Aggiunto PROGRESS.md
3. `a044b41` - feat: Sistema aggiornamenti automatici con electron-updater
4. `1441a43` - feat: Aggiunti strumenti di supporto per build Windows
5. `b270832` - feat: Aggiunta icona MOVARISCH professionale

---

## Diario di ripresa — 31 luglio 2026

### Obiettivo della revisione in corso

- Rendere la verifica delle SDS molto più rapida per l'operatore.
- Conservare il controllo professionale, concentrandolo soltanto sulle vere eccezioni.
- Revisionare integralmente la scheda cumulativa per più prodotti.
- Estrarre i DPI dalla Sezione 8 delle SDS e distinguere indicazioni, consigli e condizioni d'uso senza inventare obblighi.
- Collaudare il flusso con le 8 SDS reali presenti in `__tests__/schede test`.

### Modifiche implementate ma non ancora pubblicate

- Nuova conferma rapida di gruppo con un solo nominativo e una sola dichiarazione di verifica.
- Le schede calcolabili restano chiuse e sintetiche; si aprono automaticamente soltanto quelle da approfondire.
- Il dettaglio di Sezione 3 e Sezione 16 resta disponibile come controllo tecnico, ma non appesantisce il flusso ordinario.
- Nuovo parser DPI in `src/lib/sds/dpi-parser.js`, basato sulla Sezione 8.
- Classificazione DPI: indicato dalla SDS, consigliato, condizionato allo scenario, non richiesto/non determinato.
- Nuova scheda cumulativa multiprodotto: usa tutte le righe e non più soltanto la prima SDS.
- La cumulativa contiene riepilogo prodotti, matrice DPI, riferimenti a prodotto/pagina e interventi; non genera obblighi DPI fittizi dallo score.
- Corretto il motore salute: H2xx, H4xx ed EUH informative non sospendono il coefficiente P come se fossero errori del modello salute.
- Aggiunto versionamento alla risorsa del motore nell'HTML per evitare che una vecchia copia in cache annulli la correzione.
- Evitata la duplicazione degli eventi della conferma rapida durante i rerender.

### Esito del collaudo reale con 8 SDS

- 8 file caricati ed elaborati insieme senza errore.
- 6 schede risultano pronte e sono state confermate correttamente con un'unica operazione di prova.
- 2 schede restano correttamente da approfondire:
  - `MULTIGIENIC (SS).pdf`
  - `SPEED (SS).pdf`
- Per entrambe la regola è `UNCLASSIFIED_MIXTURE_REQUIRES_STRUCTURED_INGREDIENT_DATA`: la Sezione 2 riporta soltanto pericoli non sanitari, quindi il metodo richiede dati ingredienti strutturati prima di attribuire P.
- DPI rilevati: 3–4 famiglie per quasi tutti i prodotti; MULTIGIENIC ne rileva 1.
- Gli score corretti verificati nel test includono: AQUA SC 4,50; IDRO PROFUMATO 6,25; KALC 5,75; SCRUB SC 5,75; SUPRACID 5,75; XTRA-CALC PLUS 4,50.

### Test automatici

- Suite completa superata: 85 test su 85.
- Nuovi test dedicati a DPI, cumulativa multiprodotto, conferma rapida e pericoli non sanitari.
- `node --check app.js` superato.
- `git diff --check` superato prima dell'ultimo piccolo aggiornamento; da ripetere alla ripresa.

### Stato di rilascio

- Versione pubblica precedente: v1.4.4.
- Questa revisione non è stata ancora versionata, compilata, installata, committata o pubblicata.
- Nessun aggiornamento automatico è stato inviato agli utenti.

### Da riprendere domani, in ordine

1. Migliorare il testo visibile delle due eccezioni, sostituendo il codice tecnico della regola con una spiegazione semplice.
2. Decidere e implementare il flusso più rapido per correggere i dati ingredienti di MULTIGIENIC e SPEED senza chiedere controlli inutili.
3. Completare il test della scheda cumulativa con tutte e 8 le SDS confermate in una sessione di collaudo.
4. Verificare visivamente layout, stampa/PDF e matrice DPI della cumulativa.
5. Ripetere l'intera suite automatica e il controllo delle differenze.
6. Portare la versione a v1.4.5 e creare un installer locale di prova.
7. Consegnare l'installer al professionista per il test; pubblicare l'aggiornamento automatico soltanto dopo approvazione esplicita.

### File principali modificati nella revisione

- `app.js`
- `index.html`
- `style.css`
- `cumulative-report.html`
- `src/lib/movarisch-health-engine.js`
- `src/lib/sds/dpi-parser.js`
- `__tests__/health-score-2026.test.js`
- `__tests__/offline-assets.test.js`
- `__tests__/ui-table-layout.test.js`
- `__tests__/dpi-parser.test.js`
- `__tests__/cumulative-multi-sds.test.js`

---

## Diario di avanzamento — 3 agosto 2026

### Completato

- Sostituiti i codici tecnici delle eccezioni con spiegazioni operative comprensibili.
- Ridotta la gestione delle eccezioni a punteggio professionale e motivazione sintetica; la motivazione standard viene proposta automaticamente ed è modificabile.
- Spostati i dettagli delle Sezioni 2, 3 e 16 in un pannello tecnico chiuso per impostazione predefinita.
- Collaudo reale ripetuto: 6 SDS confermate con una sola operazione; MULTIGIENIC e SPEED restano le sole eccezioni corrette.
- Completata la scheda cumulativa con 8 prodotti e 4 famiglie DPI.
- Il giudizio DPI ora è distinto prodotto per prodotto e non usa più un unico esito cumulativo ambiguo.
- Verificata visivamente la cumulativa completa: prodotto, giudizio SDS, pagina e testo sorgente sono leggibili.
- Versione portata a v1.4.5; versione del preload ricavata automaticamente dal package anziché mantenuta come valore statico.

### Verifiche superate

- Test applicazione: 87/87.
- Test installer/updater: 3/3.
- Release gate configurazione: superato.
- Build Windows NSIS: completato.
- Controllo artefatti e `latest.yml`: superato.

### Installer locale di prova

- File: `installer/dist/MOVARISCH-Setup-1.4.5.exe`
- Dimensione: 101.168.113 byte.
- SHA-256: `6D62E1C671195C91E61C449C10E2F7BED0AA79124DCE2B6F52E7C9597393ECC0`
- Firma digitale: assente, come concordato per questa fase.
- Aggiornamento automatico: non pubblicato; attendere il test e l'approvazione del professionista.

### Nota sul collaudo

- I valori 1,00 inseriti temporaneamente per MULTIGIENIC e SPEED servivano esclusivamente ad aprire e verificare la cumulativa; non rappresentano una valutazione professionale e non sono stati salvati nell'app o nell'installer.
- Build rigenerata dopo la richiesta del professionista: la nota metodologica sulle Sezioni SDS, la validazione, le correzioni e i warning tecnici non compaiono più nel Word esportato.

### Controllo finale dell'interfaccia prima della pubblicazione

- Verificata la legenda del rischio rispetto alla matrice MoVaRisCh 2026 ufficiale; soglie, giudizi e gestione dei valori di confine sono coerenti con il motore di calcolo.
- Aggiunto al giudizio di rischio irrilevante il richiamo a consultare comunque il medico competente.
- Precisato che i preset P1/P2 sono scenari precompilati di praticità e devono essere verificati rispetto alla mansione reale; non sono valori normativi.
- Aggiornato il tutorial al flusso attuale: caricamento SDS, estrazione preliminare, conferma rapida di gruppo, gestione delle sole eccezioni ed esportazione Excel/Word/cumulativa.
- Verificati i quattro collegamenti locali di supporto: knowledge base, documentazione tecnica, ticket e licenza d'uso.
- Sostituito lo sfondo blu molto scuro con una palette blu ardesia più chiara, mantenendo contrasto e leggibilità.
- Suite completa aggiornata e superata: 91/91 test; controllo sintattico e `git diff --check` superati.
- Installer v1.4.5 rigenerato con la nuova palette: 101.168.388 byte, SHA-256 `6D1294F856E3D65B2850CD305218A9AF7EBE79CB70F6B823EA2F1D9DF93AAA13`.
- Release gate e controllo degli artefatti superati; firma digitale assente come concordato.

### Pubblicazione finale v1.4.5

- Pull request `#26` approvata dai controlli CI e integrata in `main` il 3 agosto 2026.
- Tag pubblico `v1.4.5` creato sul commit di rilascio.
- Release GitHub pubblicata come release stabile, non bozza e non prerelease.
- Pubblicati `MOVARISCH-Setup-1.4.5.exe`, `latest.yml` e `MOVARISCH-Setup-1.4.5.exe.blockmap`.
- Verificato tramite API GitHub che `releases/latest` restituisce `v1.4.5` e che tutti gli asset risultano caricati.
- Le installazioni dotate di updater possono rilevare la 1.4.5; download e installazione richiedono la conferma dell'utente. La 1.1.0 richiede invece l'installazione manuale.

---

## Diario di avanzamento - revisione cumulativa v1.4.6

- Aggiunto l’export della scheda cumulativa in Word modificabile.
- Ridisegnato il DOCX come relazione tecnica sobria: testata, metadati, quadro generale, tabelle a righe alternate, misure, validazione e firma.
- Aggiunta la tabella “Prodotto e SDS di riferimento / Frase H / Descrizione” per i pericoli del prodotto presenti in Sezione 2.
- Aggiunto il repertorio italiano delle descrizioni CLP, con gestione distinta delle varianti H360/H361.
- Eliminato il taglio fisso della fonte DPI; introdotta una sintesi che conserva norma, materiale, prestazioni e condizioni operative senza spezzare parole.
- Compattata la matrice DPI in un’unica tabella con prodotto, file SDS, dispositivo, stato, sintesi tecnica e pagina.
- Versione di lavoro portata a 1.4.6 perché la 1.4.5 è già pubblica.
- Verifiche superate: 95/95 test, sintassi JavaScript e controllo differenze.
- Collaudo browser completato con dati multiprodotto fittizi; schermata salvata in `output/playwright/cumulative-report.png`.
- DOCX di prova aperto in Microsoft Word, convertito in PDF e controllato pagina per pagina: 4 pagine, 5 tabelle, nessun contenuto tagliato o sovrapposto.
- Installer locale v1.4.6 creato e verificato: 101.174.260 byte, SHA-256 `113044FB5BC56153698716ED14CAB482A1305BB27972F35BAB1C6986599547F0`.
- Release gate, artefatti e `latest.yml` superati; firma digitale assente come concordato.
- Pull request `#27` approvata dai controlli CI e integrata in `main` il 3 agosto 2026.
- Tag e release stabile `v1.4.6` pubblicati con installer, `latest.yml` e blockmap.
- Verificato tramite API GitHub che `releases/latest` restituisce `v1.4.6` e che tutti gli asset risultano caricati con digest coerente.
- Aggiornamento automatico attivo per le installazioni dotate di updater; download e installazione richiedono la conferma dell’utente.
