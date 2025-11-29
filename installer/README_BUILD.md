# 🚀 MOVARISCH - Guida Build Installer Windows

Questa guida spiega come generare l'installer professionale di **MOVARISCH v1.1.0** per Windows usando Electron ed electron-builder.

---

## 📋 Prerequisiti

### Software Richiesto

1. **Node.js** (v18 o superiore)
   - Scarica da: https://nodejs.org/
   - Verifica installazione: `node --version`
   - Dovrebbe mostrare: `v18.x.x` o superiore

2. **npm** (incluso con Node.js)
   - Verifica installazione: `npm --version`
   - Dovrebbe mostrare: `9.x.x` o superiore

3. **Git** (opzionale, per clonare il repository)
   - Scarica da: https://git-scm.com/

### Requisiti di Sistema

- **SO**: Windows 10/11 (64-bit)
- **RAM**: Minimo 4GB
- **Spazio disco**: ~500MB per dipendenze + ~200MB per build
- **Connessione internet**: Necessaria per scaricare dipendenze

---

## 🛠️ Preparazione dell'Ambiente

### 1. Clona o Scarica il Repository

```bash
# Se usi Git
git clone https://github.com/Giuseppe575/movarisch.git
cd movarisch/installer

# Oppure scarica il ZIP e scompattalo
```

### 2. Installa le Dipendenze

Dalla cartella `installer/`:

```bash
npm install
```

Questo comando scaricherà:
- **Electron** (~150MB) - Framework per app desktop
- **electron-builder** (~50MB) - Tool per creare installer
- **electron-store** - Per gestire dati persistenti

⏱️ **Tempo stimato**: 2-5 minuti (dipende dalla connessione)

### 3. Prepara l'Icona (IMPORTANTE!)

L'installer richiede un file icona `icon.ico`. Hai due opzioni:

#### Opzione A: Icona Personalizzata (Consigliato)

1. Crea un'icona 256x256px del logo MOVARISCH
2. Convertila in formato `.ico`:
   - **Online**: https://convertio.co/it/png-ico/
   - **GIMP**: File → Esporta come → icon.ico
   - **ImageMagick**: `magick convert logo.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`
3. Salva il file come `installer/build/icon.ico`

#### Opzione B: Icona Temporanea

Se non hai ancora un'icona, usa un'icona generica temporanea:

```bash
# Copia un'icona esistente di Windows (esempio)
copy C:\Windows\System32\imageres.dll,77 build\icon.ico
```

📖 **Leggi** `build/ICON_README.txt` per dettagli completi.

---

## 🔨 Generare l'Installer

### Build Completo (Installer .exe)

Dalla cartella `installer/`:

```bash
npm run build
```

**Cosa fa questo comando:**
1. ✅ Compila l'app Electron
2. ✅ Include tutti i file necessari (HTML, CSS, JS, PDF.js, SheetJS)
3. ✅ Crea il pacchetto NSIS installer
4. ✅ Genera il file `MOVARISCH-Setup-1.1.0.exe`

⏱️ **Tempo stimato**: 3-10 minuti

**Output**:
```
installer/dist/MOVARISCH-Setup-1.1.0.exe  (~120-150MB)
```

### Build di Test (Solo Directory)

Per testare senza creare l'installer completo:

```bash
npm run build:dir
```

Questo crea solo la cartella `dist/win-unpacked/` con l'app eseguibile, utile per debug.

---

## 🧪 Testare l'Applicazione

### Test in Modalità Sviluppo

Prima di creare l'installer, puoi testare l'app:

```bash
npm start
```

Questo:
- ✅ Apre MOVARISCH in una finestra Electron
- ✅ Abilita DevTools (F12)
- ✅ Ricarica automaticamente le modifiche

**Testa**:
- [x] Caricamento PDF SDS/TDS
- [x] Estrazione H-codes
- [x] Calcolo MOVARISCH
- [x] Esportazione Excel/Word
- [x] Sistema di licenze
- [x] Storage manager

### Test dell'Installer

Dopo aver generato l'installer:

1. **Trova il file**: `installer/dist/MOVARISCH-Setup-1.1.0.exe`
2. **Esegui l'installer** (doppio click)
3. **Segui il wizard di installazione**:
   - Accetta la licenza (EULA)
   - Scegli la cartella di installazione
   - Seleziona "Crea icona sul Desktop"
   - Clicca "Installa"
4. **Lancia l'app** dal Desktop o menu Start
5. **Verifica tutte le funzionalità**

---

## 📂 Struttura dell'Installer

```
installer/
├── package.json           # Configurazione Electron + electron-builder
├── main.js                # Entry point: crea finestra, menu, gestisce eventi
├── preload.js             # Script di sicurezza (context isolation)
├── build/
│   ├── icon.ico           # Icona dell'app (da creare)
│   ├── installer.nsh      # Script NSIS personalizzato (italiano)
│   └── ICON_README.txt    # Istruzioni per creare l'icona
├── dist/                  # Output della build (creato automaticamente)
│   └── MOVARISCH-Setup-1.1.0.exe
└── README_BUILD.md        # Questa guida
```

---

## ⚙️ Configurazione Dettagliata

### Modificare la Versione

Edita `package.json`:

```json
{
  "version": "1.2.0"  // ← Cambia qui
}
```

L'installer si chiamerà automaticamente `MOVARISCH-Setup-1.2.0.exe`.

### Personalizzare l'Installer NSIS

Edita `build/installer.nsh` per:
- Messaggi custom durante l'installazione
- Controlli pre-installazione
- Azioni post-installazione
- Script di disinstallazione

### Aggiungere/Rimuovere File

Edita `package.json` → sezione `build.files`:

```json
"files": [
  "main.js",
  "preload.js",
  "../index.html",
  "../app.js",
  "../src/**/*",
  "!../test-*.html"  // ! = escludi
]
```

---

## 🐛 Troubleshooting

### Errore: "Cannot find module 'electron'"

**Soluzione**:
```bash
cd installer
npm install
```

### Errore: "icon.ico not found"

**Soluzione**:
1. Crea/Aggiungi `icon.ico` in `installer/build/`
2. Leggi `build/ICON_README.txt`

### L'app non si avvia dopo l'installazione

**Soluzione**:
1. Controlla che `index.html` esista nella root del progetto
2. Verifica i percorsi in `main.js`:
   ```javascript
   const appPath = isDev
     ? path.join(__dirname, '..')
     : path.join(process.resourcesPath, 'app');
   ```
3. Testa in modalità dev: `npm start`

### Errore: "Build failed - ENOENT"

**Soluzione**:
- Verifica che tutti i file referenziati in `package.json` → `build.files` esistano
- Escludi file mancanti con `!` prefix

### L'installer è troppo grande (>200MB)

**Soluzione**:
- Escludi file non necessari in `package.json`
- Rimuovi PDF di test, backup, node_modules dal bundle
- Attualmente esclusi automaticamente:
  ```json
  "!../backup*/**/*",
  "!../*.pdf",
  "!../test-*.html"
  ```

### Storage/Licenze non funzionano in Electron

**Info**: localStorage funziona nativamente in Electron. Il sistema di licenze di MOVARISCH è compatibile.

**Verifica**:
```javascript
// Apri DevTools (F12) e testa:
localStorage.setItem('test', 'ok');
console.log(localStorage.getItem('test')); // Dovrebbe stampare 'ok'
```

---

## 📦 Distribuzione

### Pubblicare l'Installer

Una volta generato `MOVARISCH-Setup-1.1.0.exe`:

1. **Upload su GitHub Releases**:
   ```bash
   # Crea un nuovo release
   git tag v1.1.0
   git push origin v1.1.0
   ```
   Poi carica manualmente il `.exe` nella release.

2. **Firma digitale** (Opzionale ma consigliato):
   - Acquista un certificato Code Signing
   - Configura in `package.json`:
     ```json
     "win": {
       "certificateFile": "path/to/cert.pfx",
       "certificatePassword": "password"
     }
     ```

3. **Condividi**:
   - Email ai clienti
   - Download dal sito https://giuseppe575.github.io/movarisch/
   - CDN o servizio di hosting

---

## 📊 Checklist Pre-Release

Prima di distribuire l'installer:

- [ ] ✅ Versione aggiornata in `package.json`
- [ ] ✅ Icona personalizzata aggiunta (`icon.ico`)
- [ ] ✅ EULA aggiornata (`../docs/eula.html`)
- [ ] ✅ Testato in modalità dev (`npm start`)
- [ ] ✅ Generato installer (`npm run build`)
- [ ] ✅ Testato installer su macchina pulita
- [ ] ✅ Verificato sistema di licenze
- [ ] ✅ Verificato caricamento PDF e export Excel/Word
- [ ] ✅ Verificato menu e shortcut
- [ ] ✅ Verificato disinstallazione pulita

---

## 📞 Supporto

**Problemi durante il build?**

- 📧 Email: atis.giuseppe@gmail.com
- 🌐 Sito: https://giuseppe575.github.io/movarisch/
- 📚 Documentazione Electron: https://www.electronjs.org/docs
- 📚 Documentazione electron-builder: https://www.electron.build/

---

## 📄 Licenza

Questo installer è parte del software MOVARISCH.
Vedi `../docs/eula.html` per i termini di licenza completi.

**© 2025 Giuseppe - Tutti i diritti riservati**
