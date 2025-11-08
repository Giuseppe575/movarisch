# Architettura minima del sistema di licenze MOVARISCH

Questo documento descrive una possibile implementazione "cloud light" per la distribuzione delle licenze del client MOVARISCH, conforme ai requisiti indicati.

## Componenti principali

### Client MOVARISCH
- Convalida locale della licenza tramite firma digitale (JWT firmato).
- Effettua un controllo periodico online verso il License Server.
- Può funzionare offline entro il limite definito da `offline_grace_days`.

### License Server
- Responsabile della generazione, rotazione e revoca delle licenze.
- Gestisce utenti e pagamenti.
- Espone le API necessarie all'applicazione desktop/web e ai webhook.

### Stack consigliato
Si suggerisce l'uso di **Firebase Auth + Firestore** per ridurre al minimo la manutenzione del backend. In alternativa si possono valutare Supabase o un'istanza personalizzata Node.js + PostgreSQL su VPS qualora si necessiti di maggiore controllo.

### Pagamenti
- Integrazione con **Stripe**.
- Webhook `POST /webhooks/stripe` invocato al termine della transazione.

## Flusso utente

1. **Acquisto**
   - L'utente completa il pagamento su Stripe.
   - Stripe chiama il webhook del License Server (`POST /webhooks/stripe`).
2. **Creazione account**
   - Il License Server crea l'account, avvia la verifica email e associa il pagamento andato a buon fine.
3. **Generazione licenza**
   - Il server emette un JWT firmato con chiave privata RSA/ECDSA contenente i seguenti claim:
     - `sub`: ID utente.
     - `type`: edizione (Standard/Pro).
     - `seats`: numero di postazioni.
     - `exp`: scadenza licenza.
     - `features`: elenco funzionalità abilitate.
     - `device_limit`: limite dispositivi concorrenti.
     - `offline_grace_days`: numero massimo di giorni di uso offline.
     - `support_until`: data fine supporto.
     - `license_id`: identificativo univoco della licenza.
4. **Attivazione in app**
   - L'utente inserisce la License Key o effettua il sign-in.
   - Il client verifica la firma usando la chiave pubblica incorporata.
   - Facoltativo: invio di `device_fingerprint` per associare la postazione o attivare il node-locking.
   - Download della CRL/Allow-list delle licenze revocate, con caching locale.
5. **Uso quotidiano**
   - Durante il funzionamento normale il client usa la licenza dalla cache.
   - Ogni intervallo pianificato effettua un ping al License Server per sincronizzare stato licenza e revoche.
6. **Modalità offline**
   - Il client consente l'utilizzo offline fino al raggiungimento di `offline_grace_days`.
   - Superato il periodo di tolleranza viene richiesta una sincronizzazione online per continuare ad operare.

## Note implementative

- **Sicurezza chiavi**: la chiave privata resta sul License Server; la chiave pubblica è incorporata nell'app.
- **Revoche**: mantenere una CRL o allow-list firmata per garantire la validità offline.
- **Rotazione licenze**: in caso di rinnovo emettere un nuovo JWT aggiornando i claim. La chiave precedente può essere revocata.
- **Osservabilità**: tracciare gli eventi di attivazione, rinnovo e revoca per audit e supporto clienti.

## Hosting

- GitHub Pages rimane utilizzabile per sito vetrina e documentazione.
- Il License Server richiede un'infrastruttura backend con accesso a Stripe e al database scelto.
