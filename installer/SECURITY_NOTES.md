# MOVARISCH installer — Security notes

Note relative alla configurazione `package.json` di electron-builder.
Tenute fuori dal `package.json` perche' electron-builder valida lo schema
e rigetta proprieta' non riconosciute (vedi v1.3.0 build fail).

## `sign: null` — codice non firmato

**Severita': MEDIA**

Il campo `sign: null` disabilita la firma del codice. Windows SmartScreen
mostrera' un avviso "Editore sconosciuto" agli utenti che lanciano
l'installer NSIS la prima volta. Non e' un rischio di sicurezza diretto
per l'utente (l'installer e' lo stesso, scaricato dal repo GitHub
ufficiale), ma e' un attrito UX e abbassa la fiducia percepita.

**Come rimuoverlo:** acquistare un certificato EV Code Signing
(DigiCert, Sectigo, GlobalSign), salvarlo in formato `.pfx`, impostare:

```json
"sign": "path/to/cert.pfx",
"cscKeyPassword": "<password>",
"signDlls": true
```

oppure usare le env var `CSC_LINK` / `CSC_KEY_PASSWORD` su build CI.

## `verifyUpdateCodeSignature: false` — auto-update non verificato

**Severita': MEDIA**

`electron-updater` non verifica la firma del code-signing dell'installer
scaricato prima di applicare l'aggiornamento automatico. Un attaccante
con controllo del canale di rete (es. ARP poisoning su LAN, BGP hijack,
DNS spoofing) potrebbe in teoria sostituire il pacchetto scaricato dal
canale GitHub Releases.

**Mitigazione attuale:** il download avviene su HTTPS verso
github.com (certificato pinnato dal sistema operativo), quindi un MITM
puro su rete pubblica non e' triviale. Resta vulnerabile a:
- compromissione dell'account GitHub
- compromissione di una CA HTTPS
- attacchi su LAN con root certificate iniettato

**Come rimuoverlo:** appena disponibile firma `sign`, impostare a `true`.

## License validator — checksum reversibile

**Severita': BASSA (modello di minaccia = utente finale, non attaccante esterno)**

`src/license-validator.js` usa un checksum custom su 4 caratteri.
L'algoritmo e' in chiaro nel bundle JS asar, quindi un utente motivato
puo' generare licenze valide. Accettato perche':

1. DevTools disabilitati in produzione (`devTools: isDev`).
2. Asar offusca il codice ma non lo cifra.
3. Il sistema serve a scoraggiare il riuso casuale, non a fermare
   reverse-engineering motivato.

Se serve protezione piu' robusta in futuro: usare RSA con chiave pubblica
embedded e firma server-side delle licenze, oppure attivazione online
una-tantum con token.
