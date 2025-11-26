# Come avviare MOVARISCH in locale

## Problema: file:/// non funziona

Quando apri `index.html` direttamente con `file:///C:/Users/...`, il browser blocca le richieste JavaScript per motivi di sicurezza (CORS - Cross-Origin Resource Sharing).

**Sintomi:**
- La pagina si carica ma non è formattata correttamente
- Gli script non si caricano
- La console del browser mostra errori CORS

## Soluzione: usa un server HTTP locale

### Metodo 1: Script automatico (raccomandato)

1. **Doppio click su `start-server.bat`**
2. Attendi che si apra la finestra del terminale
3. Apri il browser su: `http://localhost:8080`
4. Per fermare il server: premi `CTRL+C` nel terminale

### Metodo 2: Comando manuale

Apri il terminale (PowerShell o CMD) nella cartella del progetto ed esegui:

```bash
python -m http.server 8080
```

Poi apri il browser su: `http://localhost:8080`

### Metodo 3: Usa porta alternativa

Se la porta 8080 è già occupata:

```bash
python -m http.server 8081
```

Poi apri: `http://localhost:8081`

## Requisiti

- **Python 3.x** installato sul sistema
- Verifica con: `python --version`
- Se non hai Python: https://www.python.org/downloads/

## Note

- Il server funziona solo mentre il terminale è aperto
- Non chiudere la finestra del terminale mentre usi l'applicazione
- I dati rimangono nel browser (localStorage) anche quando chiudi il server
- Tutti i calcoli avvengono nel browser, nessun dato viene inviato a server esterni
