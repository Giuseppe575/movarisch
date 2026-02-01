# MOVARISCH - Progress e Stato del Progetto

**Ultimo aggiornamento:** 1 Febbraio 2026

---

## Stato Attuale: v1.2.0 ✅

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
