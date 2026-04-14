# MOVARISCH — Piano di Rilascio ai Clienti
**Versione target: v1.2.1**
**Aggiornato: 14 Aprile 2026**

---

## STATO ATTUALE DEI BUG RISOLTI (v1.2.1)

| # | Bug | File modificato | Stato |
|---|-----|-----------------|-------|
| 1 | Scheda Cumulativa → pagina bianca nell'app installata | `installer/package.json` | ✅ FIXATO |
| 2 | Knowledge Base / Licenza / Supporto → pagina bianca | `installer/package.json` | ✅ FIXATO |
| 3 | Grafico radar blocca la pagina in assenza di internet | `cumulative-report.html` | ✅ FIXATO |
| 4 | CSS di debug visibili in produzione (sfondo blu, testo giallo) | `style.css` | ✅ FIXATO |

---

## TASK OBBLIGATORI PRIMA DEL RILASCIO

### FASE 1 — Preparazione locale (da fare sul PC di sviluppo)

- [ ] **Scaricare Chart.js localmente**
  ```
  Scarica: https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js
  Salva in: movarisch/src/lib/chart.umd.min.js
  ```
  Senza questo file, il grafico radar nella Scheda Cumulativa non funziona offline.

- [ ] **Commit di tutti i fix su Git**
  ```bash
  cd movarisch
  git add installer/package.json cumulative-report.html style.css CHANGELOG.md RELEASE_PLANNING.md installer/main.js installer/preload.js
  git commit -m "fix(v1.2.1): scheda cumulativa e support/ mancanti dal build; cleanup CSS debug; Chart.js offline"
  git push origin main
  ```

- [ ] **Creare tag di release su Git**
  ```bash
  git tag -a v1.2.1 -m "Release v1.2.1 - Hotfix scheda cumulativa e supporto"
  git push origin v1.2.1
  ```

### FASE 2 — Build dell'installer Windows

- [ ] Entrare nella cartella installer
  ```bash
  cd installer
  npm install
  ```

- [ ] Eseguire il build
  ```bash
  npm run build
  # oppure per solo directory (test rapido senza installer):
  npm run build:dir
  ```

- [ ] Verificare che il file `installer/dist/MOVARISCH-Setup-1.2.1.exe` sia stato creato

- [ ] **Verificare il contenuto del pacchetto**: aprire `installer/dist/win-unpacked/` e controllare che esistano:
  - `resources/app/index.html` ✓
  - `resources/app/cumulative-report.html` ← CRITICO, deve esserci
  - `resources/app/support/knowledge-base.html` ← CRITICO, deve esserci
  - `resources/app/src/lib/chart.umd.min.js` ← se scaricato

### FASE 3 — Test pre-rilascio (da fare sull'installer generato)

- [ ] Installare l'app da `MOVARISCH-Setup-1.2.1.exe` in una cartella di test
- [ ] Caricare una SDS PDF di prova (es. `SDS ACETATO DI ETILE.pdf` già nel repo)
- [ ] Premere "Estrai & Calcola"
- [ ] **Cliccare "Scheda Cumulativa"** → deve aprire la scheda con i dati, NON pagina bianca
- [ ] **Cliccare "Knowledge base"** nel pannello supporto → deve aprire la pagina
- [ ] **Cliccare "Licenza d'uso"** → deve aprire la pagina
- [ ] Testare esportazione Excel e Word
- [ ] Verificare che i calcoli SALUTE e SICUREZZA siano corretti

### FASE 4 — Rilascio su GitHub

- [ ] Andare su: https://github.com/Giuseppe575/movarisch/releases/new
- [ ] Selezionare il tag `v1.2.1`
- [ ] Titolo: `MOVARISCH v1.2.1 — Hotfix Scheda Cumulativa e Supporto`
- [ ] Caricare il file `MOVARISCH-Setup-1.2.1.exe`
- [ ] Pubblicare la release
- [ ] Verificare che `electron-updater` rilevi correttamente il nuovo aggiornamento

### FASE 5 — Comunicazione ai clienti esistenti

- [ ] Inviare email ai clienti con link diretto all'installer v1.2.1
- [ ] Indicare che è un aggiornamento automatico (se `electron-updater` è configurato) o manuale
- [ ] Riportare i bug risolti nella comunicazione

---

## ROADMAP FUTURA (post v1.2.1)

### v1.3.0 — Funzionalità
- Scheda Cumulativa multi-sostanza (ora mostra solo la prima riga; aggiungere riepilogo tabellare di tutte le sostanze)
- Esportazione della Scheda Cumulativa in PDF o Word
- Aggiungere numero CAS automatico dall'estrazione SDS
- Migliorare parsing per SDS in inglese (lingua EN)

### v1.4.0 — Qualità e UX
- Modal interno per Knowledge Base (non aprire nuova finestra, mostrare in overlay)
- Aggiungere sistema di notifiche in-app invece degli alert
- Internazionalizzazione completa della Scheda Cumulativa
- Aggiungere logo/intestazione aziendale personalizzabile nell'export Word/Excel

### v2.0.0 — Architettura
- Sistema di licenze con attivazione online (endpoint API)
- Database locale sostanze (SQLite via electron) per ricerche rapide
- Storico valutazioni (salva sessioni precedenti)
- Modalità multi-utente per team (condivisione dati tramite rete locale)

---

## CHECKLIST RAPIDA RILASCIO

```
□ Chart.js scaricato in src/lib/chart.umd.min.js
□ git commit + push + tag v1.2.1
□ npm run build (nella cartella installer/)
□ Verificato cumulative-report.html nel pacchetto
□ Verificato support/ nel pacchetto
□ Test manuale scheda cumulativa → NON bianca
□ Test manuale knowledge base → NON bianca
□ Upload su GitHub Releases
□ Email ai clienti
```

---

*Autore: Giuseppe Strifezza — SIPLA PADULA*
*Documento generato automaticamente il 14/04/2026*
