# 🔐 Sistema di Licenze Offline MOVARISCH

## Panoramica

Sistema completo di gestione licenze offline per MOVARISCH che non richiede connessione a server esterni. Ogni licenza viene validata tramite algoritmo crittografico con checksum.

---

## 📋 Componenti del Sistema

### 1. **Generatore di Licenze** (`license-generator.html`)
- **Uso:** Solo per uso interno (NON distribuire ai clienti)
- **Funzionalità:**
  - Genera chiavi univoche nel formato `MOVA-XXXX-XXXX-XXXX-XXXX`
  - Salva tutte le chiavi generate in localStorage per tracciamento
  - Esporta le chiavi in formato JSON
  - Interfaccia moderna con tema scuro coerente con MOVARISCH

### 2. **Validatore Offline** (`src/license-validator.js`)
- Valida le licenze tramite algoritmo di checksum
- Non richiede connessione internet
- API pubblica: `window.LicenseManager`

### 3. **Schermata di Attivazione** (`src/license-activation.js` + CSS)
- Modal a schermo intero che blocca l'accesso all'app
- Auto-formattazione del campo input
- Feedback visivo per errori e successo
- Design coerente con MOVARISCH

### 4. **Gestione Licenza** (`src/license-settings.js`)
- Visualizza lo stato della licenza attiva
- Mostra data di attivazione
- Permette di copiare la propria chiave
- Licenza permanente (no scadenza, no disattivazione)

---

## 🚀 Come Usare il Sistema

### Per l'Amministratore (Generazione Chiavi)

1. **Aprire il Generatore:**
   ```
   Aprire il file: license-generator.html
   ```

2. **Generare Chiavi:**
   - Inserire la quantità desiderata (1-100)
   - Cliccare su "Genera Licenze"
   - Le chiavi vengono salvate automaticamente

3. **Esportare le Chiavi:**
   - Cliccare su "Esporta JSON"
   - Salva un file con tutte le chiavi generate
   - Formato: `movarisch-licenses-YYYY-MM-DD.json`

4. **Tracciamento:**
   - Tutte le chiavi generate sono salvate nel localStorage del browser
   - Mantiene il conteggio totale e della sessione corrente
   - Ogni chiave è garantita univoca

### Per il Cliente (Attivazione)

1. **Primo Avvio:**
   - All'apertura di MOVARISCH appare la schermata di attivazione
   - L'applicazione è bloccata fino all'inserimento di una licenza valida

2. **Inserimento Licenza:**
   - Inserire la chiave ricevuta: `MOVA-XXXX-XXXX-XXXX-XXXX`
   - Il formato viene auto-completato durante la digitazione
   - Cliccare "Attiva Licenza" o premere Enter

3. **Validazione:**
   - La chiave viene validata offline (no server)
   - Se valida: licenza salvata e app sbloccata
   - Se non valida: messaggio di errore

4. **Uso dell'Applicazione:**
   - Dopo l'attivazione, l'app funziona normalmente
   - La licenza è permanente e non scade
   - Visualizzazione dettagli licenza nella sezione "Impostazioni Licenza"

---

## 🔒 Sicurezza e Validazione

### Algoritmo di Validazione

Il sistema usa un algoritmo di checksum deterministico:

```javascript
Formato: MOVA-AAAA-BBBB-CCCC-DDDD

Dove:
- MOVA: Prefisso fisso
- AAAA, BBBB, CCCC: Blocchi casuali (12 caratteri)
- DDDD: Checksum calcolato dai primi 3 blocchi
```

**Caratteristiche:**
- ✅ Validazione offline (no server richiesto)
- ✅ Impossibile indovinare chiavi valide
- ✅ Ogni chiave è univoca
- ✅ Charset senza caratteri ambigui (no 0, O, I, 1)
- ✅ Licenza salvata in localStorage
- ✅ Non modificabile dall'utente

### Protezioni

1. **Formato rigido:** Solo chiavi nel formato corretto sono accettate
2. **Checksum:** L'ultimo blocco deve corrispondere al calcolo matematico
3. **Charset limitato:** Solo caratteri validi (A-Z, 2-9, esclusi O, I, 0, 1)
4. **Validazione continua:** La licenza viene rivalidata all'avvio

---

## 📁 Struttura File

```
movarisch/
├── license-generator.html          # Generatore (uso interno)
├── index.html                       # App principale (con licenze integrate)
├── src/
│   ├── license-validator.js        # Algoritmo validazione
│   ├── license-activation.js       # UI attivazione
│   ├── license-activation.css      # Stili modal attivazione
│   └── license-settings.js         # UI impostazioni licenza
└── style.css                        # Stili generali (include stili licenza)
```

---

## 🎨 Personalizzazione

### Cambiare l'URL di Acquisto

Modificare `src/license-activation.js` alla riga ~75:

```javascript
window.open('https://TUOSITO.com/acquista-movarisch', '_blank');
```

### Modificare il Messaggio di Attivazione

Modificare `src/license-activation.js` nel blocco HTML del modal.

### Cambiare i Colori

I colori sono definiti in:
- `src/license-activation.css` per il modal
- `style.css` per la sezione impostazioni

---

## ⚙️ API JavaScript

### LicenseManager

```javascript
// Verifica se l'app è attivata
LicenseManager.isActivated() // true/false

// Recupera dati licenza
LicenseManager.getLicense() // { license, activated, version }

// Attiva con una chiave
LicenseManager.activate('MOVA-XXXX-XXXX-XXXX-XXXX')
// Returns: { success: true/false, error: string, data: object }

// Valida una chiave (senza salvarla)
LicenseManager.validate('MOVA-XXXX-XXXX-XXXX-XXXX')
// Returns: { valid: true/false, error: string }

// Rimuove licenza (solo per debug)
LicenseManager.deactivate()
```

### LicenseActivation

```javascript
// Mostra schermata di attivazione
LicenseActivation.show()

// Nascondi schermata
LicenseActivation.hide()

// Verifica all'avvio (auto-chiamato)
LicenseActivation.checkOnLoad()
```

### LicenseSettings

```javascript
// Aggiorna visualizzazione impostazioni
LicenseSettings.refresh()
```

---

## 🧪 Test e Debug

### Testare la Validazione

Aprire la console del browser:

```javascript
// Test validazione
LicenseManager.validate('MOVA-TEST-TEST-TEST-TEST') // false

// Genera una chiave dal generatore e testala
LicenseManager.validate('MOVA-XXXX-XXXX-XXXX-XXXX') // true/false

// Verifica licenza attiva
LicenseManager.isActivated()

// Vedi dati licenza
LicenseManager.getLicense()
```

### Resettare la Licenza (Debug)

```javascript
// Rimuovi licenza per testare di nuovo l'attivazione
LicenseManager.deactivate()
location.reload()
```

---

## ❓ FAQ

### Come genero una nuova licenza?
Apri `license-generator.html`, imposta la quantità e clicca "Genera Licenze".

### Le licenze scadono?
No, sono permanenti.

### Cosa succede se perdo la chiave?
Il cliente può recuperarla dalla sezione "Impostazioni Licenza" dopo l'attivazione.

### Posso usare la stessa chiave su più computer?
Tecnicamente sì (è offline), ma dovresti generare chiavi uniche per ogni cliente/installazione.

### Il cliente può disattivare la licenza?
No, una volta attivata è permanente (come richiesto).

### Devo tenere un database delle chiavi?
Il generatore salva tutto in localStorage e permette export JSON. Raccomandato salvare i backup JSON.

### Come funziona offline?
La validazione è puramente matematica (checksum). Non serve server.

---

## 🔧 Manutenzione

### Backup delle Chiavi Generate

1. Esportare regolarmente dal generatore (JSON)
2. Salvare i file in un posto sicuro
3. Formato file: `movarisch-licenses-YYYY-MM-DD.json`

### Distribuzione ai Clienti

1. Generare una chiave univoca
2. Inviarla al cliente via email/ticket
3. Il cliente la inserisce all'apertura di MOVARISCH
4. Segnare nel tuo sistema quale chiave è stata assegnata a quale cliente

---

## 📞 Supporto

In caso di problemi con il sistema di licenze:

1. Verificare che la chiave sia nel formato corretto
2. Testare la validazione nella console
3. Verificare che i file del sistema siano tutti presenti
4. Controllare la console del browser per errori JavaScript

---

## 🎉 Funzionalità Complete

✅ Generatore di chiavi con interfaccia grafica
✅ Algoritmo di validazione offline robusto
✅ Schermata di attivazione professionale
✅ Blocco dell'app fino all'attivazione
✅ Gestione licenza nelle impostazioni
✅ Copia facile della propria chiave
✅ Licenze permanenti (no scadenza)
✅ Design coerente con MOVARISCH
✅ Nessuna dipendenza da server esterni
✅ Export/Import delle chiavi generate

---

**Versione Sistema:** 1.0
**Compatibilità:** Tutti i browser moderni (Chrome, Firefox, Edge, Safari)
**Licenza:** Proprietario - Solo uso interno MOVARISCH
