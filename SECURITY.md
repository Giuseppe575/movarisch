# Politica di sicurezza di MOVARISCH

## Versioni supportate

Riceve correzioni di sicurezza soltanto l'ultima versione pubblicata. Gli utenti devono installare gli aggiornamenti proposti dall'applicazione o scaricare l'installer dalla pagina ufficiale delle release.

## Segnalazione riservata

Segnalare una vulnerabilità a **atis.giuseppe@gmail.com** indicando versione, sistema operativo, impatto e passaggi minimi per riprodurla. Non aprire un'issue pubblica prima della correzione e non allegare schede di sicurezza, report o dati di clienti reali.

La ricezione viene normalmente confermata entro 5 giorni lavorativi. Dopo la verifica vengono comunicati severità, piano di correzione e modalità di pubblicazione coordinata. Questi tempi sono obiettivi operativi, non garanzie contrattuali.

## Integrità delle release

Le release destinate agli utenti devono essere firmate con Authenticode, includere `latest.yml` e superare il controllo automatico di versione, nome dell'artefatto, SHA-512 e firmatario. Le build locali non firmate sono ammesse esclusivamente per sviluppo e test e non devono essere distribuite.

MOVARISCH non raccoglie telemetria d'uso tramite il sistema di aggiornamento. Il log locale dell'updater contiene solo data, stato tecnico e versione; URL e valori assimilabili a credenziali vengono rimossi.
