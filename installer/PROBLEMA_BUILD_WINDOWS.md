# ⚠️ Problema Build Windows - Symbolic Link

## Il Problema

Durante il build dell'installer, electron-builder tenta di estrarre un archivio che contiene symbolic link (per macOS). Windows richiede privilegi di amministratore per creare symbolic link, causando questo errore:

```
ERROR: Cannot create symbolic link: Il privilegio richiesto non appartiene al client.
```

## ✅ SOLUZIONI (scegli una)

### 🔷 Soluzione 1: Script Automatico (PIÙ SEMPLICE)

Usa lo script batch che gestisce automaticamente tutto:

```batch
cd C:\Users\atisg\movarisch\installer
build-windows.bat
```

Lo script:
- ✅ Controlla se sei amministratore
- ✅ Ti chiede di riavviare come admin se necessario
- ✅ Oppure apre le impostazioni Developer Mode
- ✅ Esegue il build automaticamente

---

### 🔷 Soluzione 2: Esegui come Amministratore (VELOCE)

**PowerShell come Amministratore:**

1. Premi `Win + X`
2. Seleziona "Windows PowerShell (Amministratore)"
3. Esegui:
   ```powershell
   cd C:\Users\atisg\movarisch\installer
   npm run build
   ```

**Prompt dei Comandi come Amministratore:**

1. Cerca "cmd" nel menu Start
2. Tasto destro → "Esegui come amministratore"
3. Esegui:
   ```batch
   cd C:\Users\atisg\movarisch\installer
   npm run build
   ```

⏱️ **Tempo**: ~5-10 minuti per il primo build

---

### 🔷 Soluzione 3: Abilita Developer Mode (PERMANENTE)

Attiva la modalità sviluppatore di Windows per permettere symbolic link senza admin:

**Windows 11:**
1. `Win + I` (apri Impostazioni)
2. Privacy e sicurezza → Per sviluppatori
3. Attiva "Modalità sviluppatore"
4. **Riavvia il computer**
5. Esegui normalmente: `npm run build`

**Windows 10:**
1. `Win + I` (apri Impostazioni)
2. Aggiornamento e sicurezza → Per sviluppatori
3. Attiva "Modalità sviluppatore"
4. **Riavvia il computer**
5. Esegui normalmente: `npm run build`

✅ **Vantaggio**: Non serve più essere amministratore per i build futuri

---

### 🔷 Soluzione 4: Build Portatile (ALTERNATIVA)

Se non puoi usare le soluzioni sopra, crea una versione portatile senza installer:

```batch
npm run build:dir
```

**Output**: Cartella `dist/win-unpacked/` con l'app eseguibile

⚠️ **Nota**: Questa non è un installer .exe, ma l'app funziona comunque

---

## 🎯 Verifica del Build Riuscito

Quando il build completa con successo, vedrai:

```
• packaging       platform=win32 arch=x64 electron=28.3.3
• building        target=nsis file=dist\MOVARISCH-Setup-1.1.0.exe
• building block map  blockMapFile=dist\MOVARISCH-Setup-1.1.0.exe.blockmap
```

L'installer sarà in:
```
C:\Users\atisg\movarisch\installer\dist\MOVARISCH-Setup-1.1.0.exe
```

Dimensione attesa: **~120-150 MB**

---

## ❓ Perché Succede?

electron-builder scarica uno strumento di code-signing (winCodeSign) che include file per macOS con symbolic link. Windows richiede permessi speciali per creare symbolic link, ma i link MacOS non servono su Windows - è solo un bug del packaging.

## 📧 Serve Aiuto?

Se nessuna soluzione funziona:
- Email: atis.giuseppe@gmail.com
- Invia il log completo dell'errore
- Specifica quale soluzione hai provato

---

**© 2025 MOVARISCH - Giuseppe**
