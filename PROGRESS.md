# MOVARISCH - Progress e Stato del Progetto

**Ultimo aggiornamento:** 1 Febbraio 2026

---

## Stato Attuale: v1.1.0

### Repository
- **GitHub Programma:** https://github.com/Giuseppe575/movarisch
- **Sito Acquisto:** https://giuseppe575.github.io/movarisch-site/

---

## Completato

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

### Electron Installer Windows
- [x] Configurazione electron-builder
- [x] Icona professionale MOVARISCH
- [x] Installer NSIS in italiano
- [x] Script di build (`build-windows.bat`)

---

## Da Fare

### Prossimi Passi
- [ ] Pubblicare prima release su GitHub con sistema aggiornamenti
- [ ] Testare aggiornamento automatico end-to-end
- [ ] Aggiornare sito acquisto con nuova versione (se necessario)

---

## Come Pubblicare un Aggiornamento

### 1. Aggiorna la versione
Modifica in `installer/package.json`:
```json
"version": "1.2.0"
```

Aggiorna anche in:
- `installer/main.js` (titolo finestra e dialog info)
- `installer/preload.js` (version)

### 2. Build dell'installer
```bash
cd installer
npm install
npm run build
```

### 3. Pubblica su GitHub Releases

**Opzione A - Manuale:**
1. Vai su https://github.com/Giuseppe575/movarisch/releases
2. Clicca "Draft a new release"
3. Tag: `v1.2.0`
4. Titolo: `MOVARISCH v1.2.0`
5. Carica i file dalla cartella `installer/dist/`:
   - `MOVARISCH-Setup-1.2.0.exe`
   - `latest.yml`
6. Pubblica la release

**Opzione B - Automatica (richiede GitHub Token):**
```bash
cd installer
set GH_TOKEN=<tuo_token_github>
npm run publish
```

### 4. Gli utenti riceveranno la notifica
L'app controlla automaticamente:
- All'avvio (dopo 3 secondi)
- Ogni 4 ore
- Manualmente da menu "Aiuto → Controlla aggiornamenti..."

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
│   └── build/
│       └── icon.ico            # Icona app
├── __tests__/
│   └── movarisch.test.js       # Test automatici
└── docs/
    ├── eula.html               # Licenza utente
    └── privacy.html            # Privacy policy
```

---

## Note Tecniche

### electron-updater
- Provider: GitHub Releases
- Owner: Giuseppe575
- Repo: movarisch
- Auto-download: disabilitato (chiede conferma)
- Auto-install on quit: abilitato

### Test
Esegui con: `npm test`
- 3 test per calcoli MOVARISCH
- Tutti passano ✓

---

## Storico Commit Recenti

1. `a044b41` - feat: Sistema aggiornamenti automatici con electron-updater
2. `1441a43` - feat: Aggiunti strumenti di supporto per build Windows
3. `b270832` - feat: Aggiunta icona MOVARISCH professionale
4. `ea3c973` - feat: Configurazione Electron installer Windows
5. `3cccc45` - feat: Template Excel gestione clienti MOVARISCH
6. `af48956` - feat: Sistema completo di licenze offline e documentazione
