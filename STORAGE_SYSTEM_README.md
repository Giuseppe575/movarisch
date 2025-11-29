# 🔧 Sistema di Storage Universale MOVARISCH

## Panoramica

Sistema di storage robusto con **fallback automatici** che garantisce il funzionamento su **tutti i browser**, indipendentemente dalle impostazioni di privacy.

---

## 🎯 Obiettivi Raggiunti

✅ **Compatibilità universale** - Funziona su tutti i browser
✅ **Fallback automatici** - Se un metodo fallisce, passa al successivo
✅ **Gestione errori silenziosa** - Nessun errore visibile al cliente
✅ **Persistenza garantita** - La licenza rimane salvata
✅ **Preparato per installer** - Supporto futuro per file system

---

## 🔄 Ordine di Fallback

Il sistema prova i metodi in questo ordine:

### 1. **localStorage** (Prima scelta)
- ✅ Persistente (rimane dopo chiusura browser)
- ✅ Illimitato (~10MB)
- ✅ Veloce
- ❌ Bloccato da alcune impostazioni privacy

### 2. **sessionStorage** (Fallback 1)
- ⚠️ Solo sessione (si perde alla chiusura)
- ✅ Meno restrittivo di localStorage
- ✅ Veloce
- ℹ️ Mostra warning all'utente

### 3. **Cookie** (Fallback 2)
- ✅ Persistente (10 anni)
- ⚠️ Limitato (~4KB)
- ✅ Supportato ovunque
- ❌ Bloccato se cookies disabilitati

### 4. **IndexedDB** (Fallback 3)
- ✅ Persistente
- ✅ Grande capacità
- ✅ Asincrono
- ❌ Più lento, più complesso

### 5. **In-Memory** (Ultimo resort)
- ❌ Non persistente (solo RAM)
- ✅ Sempre funziona
- ⚠️ Mostra errore all'utente
- 💡 Usato solo se TUTTI i metodi falliscono

---

## 📁 Struttura File

### `src/storage-manager.js`
Modulo principale che gestisce tutti i fallback.

**API Pubblica:**
```javascript
window.StorageManager = {
  setItem(key, value),      // Salva dato
  getItem(key),             // Recupera dato
  removeItem(key),          // Rimuove dato
  getInfo(),                // Info metodo corrente
  checkWarning(),           // Verifica se serve warning
  isPersistent()            // Verifica se è persistente
}
```

**Tutte le funzioni sono async** per supportare IndexedDB.

---

## 🔍 Come Funziona

### Test Automatico all'Avvio

Quando la pagina carica:

```javascript
// 1. Test localStorage
if (testLocalStorage()) {
  console.log('📦 Storage: localStorage (persistente)');
  return 'localStorage';
}

// 2. Test sessionStorage
if (testSessionStorage()) {
  console.warn('⚠️ localStorage bloccato, uso sessionStorage');
  return 'sessionStorage';
}

// 3. Test Cookie
if (testCookies()) {
  console.warn('⚠️ Storage bloccato, uso cookie');
  return 'cookie';
}

// 4. Test IndexedDB
if (testIndexedDB()) {
  console.warn('⚠️ Storage bloccato, uso IndexedDB');
  return 'indexedDB';
}

// 5. Fallback finale
console.error('❌ Tutti i metodi bloccati, uso memoria');
return 'memory';
```

### Esempio d'Uso

```javascript
// Salva licenza (automaticamente usa il metodo migliore)
await StorageManager.setItem('movarisch_license', licenseData);

// Recupera licenza
const license = await StorageManager.getItem('movarisch_license');

// Verifica info storage
const info = StorageManager.getInfo();
console.log('Metodo corrente:', info.method);
console.log('È persistente?', info.persistent);

// Check warning
const warning = StorageManager.checkWarning();
if (warning.shouldWarn) {
  alert(warning.message);
}
```

---

## ⚠️ Gestione Warning

### Quando vengono mostrati

| Metodo | Warning | Messaggio |
|--------|---------|-----------|
| localStorage | ❌ No | - |
| sessionStorage | ⚠️ Sì | "La licenza sarà valida solo per questa sessione" |
| cookie | ❌ No | - |
| indexedDB | ❌ No | - |
| memory | 🚫 Errore | "Impossibile salvare la licenza. Abilita i cookie..." |

### Come vengono gestiti

**sessionStorage:**
- Mostra warning arancione
- Attivazione procede comunque
- Cliente informato che la licenza non è permanente

**memory:**
- Mostra errore rosso
- Attivazione fallisce
- Messaggio chiaro: "Abilita i cookie o lo storage"

---

## 🎨 Integrazione UI

### Nel Modal di Attivazione

```javascript
async function handleActivate() {
  const result = await LicenseManager.activate(licenseKey);

  if (result.success) {
    // Check storage warning
    const warning = StorageManager.checkWarning();

    if (warning.shouldWarn && warning.severity === 'warning') {
      // Mostra warning giallo per 3 secondi
      showWarning(warning.message);
      setTimeout(() => showSuccess(), 3000);
    } else {
      // Attivazione OK
      showSuccess();
    }
  } else {
    // Errore (include messaggio se storage bloccato)
    showError(result.error);
  }
}
```

---

## 🔐 Sicurezza e Privacy

### Rispetto Privacy del Browser

Il sistema **NON forza** lo storage:
- ❌ Non bypassa le impostazioni privacy
- ❌ Non usa tecniche invasive
- ✅ Rispetta la scelta dell'utente
- ✅ Usa solo API standard del browser

### Fallback Sicuri

Tutti i metodi sono sicuri:
- Cookie con `SameSite=Strict`
- IndexedDB isolato per dominio
- Nessun dato sensibile (solo chiave di licenza)

---

## 🧪 Test dei Metodi

### Test Manuale

Nella console del browser:

```javascript
// Test tutti i metodi
StorageManager.getInfo()

// Output esempio:
{
  method: "localStorage",
  persistent: true,
  available: {
    localStorage: true,
    sessionStorage: true,
    cookies: true,
    indexedDB: true
  }
}
```

### Simulare Browser Restrittivo

**Firefox (Tracking Protection Strict):**
```
about:preferences#privacy
→ Protezione antitracciamento avanzata: Rigida
```

**Brave:**
```
brave://settings/shields
→ Block cookies: All cookies
```

**Chrome (modalità incognito):**
```
Ctrl+Shift+N
→ localStorage bloccato automaticamente
```

---

## 🚀 Performance

### Velocità dei Metodi

| Metodo | Velocità | Note |
|--------|----------|------|
| localStorage | ⚡ Istantaneo | ~0.1ms |
| sessionStorage | ⚡ Istantaneo | ~0.1ms |
| cookie | ⚡ Veloce | ~1ms |
| indexedDB | 🐢 Lento | ~10-50ms (async) |
| memory | ⚡ Istantaneo | Solo RAM |

### Ottimizzazioni

- Test di disponibilità **una sola volta** all'avvio
- Metodo selezionato **cached** in variabile
- Chiamate successive **non ripetono i test**

---

## 📊 Statistiche di Compatibilità

### Browser Moderni (2024)

| Browser | localStorage | sessionStorage | Cookie | IndexedDB |
|---------|-------------|----------------|--------|-----------|
| Chrome | ✅ Sì | ✅ Sì | ✅ Sì | ✅ Sì |
| Firefox | ✅ Sì | ✅ Sì | ✅ Sì | ✅ Sì |
| Edge | ✅ Sì | ✅ Sì | ✅ Sì | ✅ Sì |
| Safari | ✅ Sì | ✅ Sì | ✅ Sì | ✅ Sì |
| Brave | ⚠️ Bloccato | ✅ Sì | ⚠️ Configurabile | ✅ Sì |

### Modalità Privata

| Browser | Metodo Usato |
|---------|-------------|
| Chrome Incognito | sessionStorage |
| Firefox Private | sessionStorage |
| Safari Private | sessionStorage |
| Edge InPrivate | sessionStorage |

**Tutti funzionano** con sessionStorage come fallback! ✅

---

## 🔮 Preparazione per Installer

### Supporto File System (Futuro)

Il codice è già preparato per aggiungere:

```javascript
// FUTURO: Storage su file locale
function writeToFile(key, value) {
  // Quando sarà disponibile File System Access API
  // o quando verrà creato installer .exe con Electron
  const fs = require('fs');
  fs.writeFileSync('license.dat', value);
}
```

**Posizione futura nell'ordine:**
1. File locale (`license.dat` in AppData)
2. localStorage
3. sessionStorage
4. cookie
5. indexedDB
6. memory

---

## 🐛 Debug

### Log in Console

Il sistema logga automaticamente:

```
🔧 Storage Manager inizializzato: {
  method: "localStorage",
  persistent: true,
  available: {...}
}

📦 Storage: localStorage (persistente)
```

### Comandi Utili

```javascript
// Verifica metodo corrente
StorageManager.getInfo().method

// Forza test di nuovo
// (ricarica la pagina per forzare re-detection)
location.reload()

// Test manuale di ogni metodo
testLocalStorage()    // true/false
testSessionStorage()  // true/false
testCookies()         // true/false
testIndexedDB()       // true/false
```

---

## ❓ FAQ

### Cosa succede se localStorage è bloccato?
Il sistema passa automaticamente a sessionStorage → cookie → indexedDB → memory.

### La licenza si perde con sessionStorage?
Sì, quando chiudi il browser. Ma l'utente riceve un warning chiaro.

### Posso forzare un metodo specifico?
Non direttamente, il sistema sceglie automaticamente il migliore disponibile.

### Come testo il fallback?
Apri il browser in modalità privata o disabilita localStorage dalle dev tools.

### Funziona offline?
Sì, tutti i metodi funzionano offline. Nessuna connessione richiesta.

---

## 📞 Supporto

### Problemi Comuni

**"Tracking Prevention blocked storage"**
- ✅ Soluzione automatica: fallback a sessionStorage/cookie

**"La licenza non viene salvata"**
- Verifica: `StorageManager.getInfo()`
- Se method è `memory`, l'utente ha bloccato tutto lo storage

**"Warning: solo sessione corrente"**
- Normale con sessionStorage
- Chiedi al cliente di abilitare localStorage

---

## ✨ Vantaggi del Sistema

✅ **Zero configurazione** - Funziona out of the box
✅ **Auto-riparazione** - Fallback automatici
✅ **User-friendly** - Messaggi chiari solo quando servono
✅ **Developer-friendly** - API semplice, async/await
✅ **Future-proof** - Preparato per installer
✅ **Privacy-first** - Rispetta le scelte dell'utente
✅ **Performance** - Test una volta, cache dei risultati

---

**Versione:** 2.0 (Storage Universale)
**Compatibilità:** Tutti i browser moderni + fallback per restrizioni privacy
**Licenza:** Proprietario MOVARISCH
