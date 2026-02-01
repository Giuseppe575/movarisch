/**
 * MOVARISCH - Sistema di Aggiornamenti Automatici
 *
 * Gestisce il controllo e l'installazione degli aggiornamenti
 * utilizzando electron-updater con GitHub Releases.
 */

const { autoUpdater } = require('electron-updater');
const { app, dialog, BrowserWindow } = require('electron');

// Configurazione
autoUpdater.autoDownload = false; // Non scaricare automaticamente
autoUpdater.autoInstallOnAppQuit = true; // Installa quando l'app si chiude

// Log per debug (rimuovere in produzione se necessario)
autoUpdater.logger = require('electron').app.isPackaged ? null : console;

/**
 * Inizializza il sistema di aggiornamenti
 * @param {BrowserWindow} mainWindow - Finestra principale dell'app
 */
function initUpdater(mainWindow) {
  // Non controllare aggiornamenti in sviluppo
  if (!app.isPackaged) {
    console.log('Updater: Modalità sviluppo - aggiornamenti disabilitati');
    return;
  }

  // Evento: Controllo aggiornamenti in corso
  autoUpdater.on('checking-for-update', () => {
    console.log('Updater: Controllo aggiornamenti...');
  });

  // Evento: Aggiornamento disponibile
  autoUpdater.on('update-available', (info) => {
    console.log('Updater: Aggiornamento disponibile:', info.version);

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Aggiornamento disponibile',
      message: `È disponibile una nuova versione di MOVARISCH (v${info.version})`,
      detail: 'Vuoi scaricare e installare l\'aggiornamento?\n\nL\'applicazione si riavvierà automaticamente al termine.',
      buttons: ['Scarica ora', 'Più tardi'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        // L'utente ha scelto di scaricare
        autoUpdater.downloadUpdate();

        // Notifica l'utente che il download è iniziato
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-status', {
            status: 'downloading',
            version: info.version
          });
        }
      }
    });
  });

  // Evento: Nessun aggiornamento disponibile
  autoUpdater.on('update-not-available', (info) => {
    console.log('Updater: Nessun aggiornamento disponibile');
  });

  // Evento: Errore durante il controllo/download
  autoUpdater.on('error', (err) => {
    console.error('Updater: Errore:', err);

    // Non mostrare errori all'utente per problemi di rete minori
    // Mostra solo errori critici
    if (err.message && !err.message.includes('net::ERR')) {
      dialog.showErrorBox(
        'Errore aggiornamento',
        'Si è verificato un errore durante il controllo degli aggiornamenti.\n\n' +
        'Riprova più tardi o scarica l\'aggiornamento manualmente dal sito.'
      );
    }
  });

  // Evento: Progresso download
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    console.log(`Updater: Download ${percent}%`);

    // Invia progresso alla finestra
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', {
        status: 'progress',
        percent: percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      });

      // Aggiorna la barra del titolo con il progresso
      mainWindow.setTitle(`MOVARISCH - Scaricamento aggiornamento ${percent}%`);
    }
  });

  // Evento: Download completato
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Updater: Download completato, versione:', info.version);

    // Ripristina il titolo
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitle('MOVARISCH v' + app.getVersion());

      mainWindow.webContents.send('update-status', {
        status: 'downloaded',
        version: info.version
      });
    }

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Aggiornamento pronto',
      message: 'L\'aggiornamento è stato scaricato',
      detail: `La versione ${info.version} è pronta per essere installata.\n\nL'applicazione si chiuderà e si riavvierà automaticamente.`,
      buttons: ['Installa e riavvia', 'Installa più tardi'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        // Installa e riavvia
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Controlla aggiornamenti dopo 3 secondi dall'avvio
  setTimeout(() => {
    checkForUpdates();
  }, 3000);

  // Controlla aggiornamenti ogni 4 ore
  setInterval(() => {
    checkForUpdates();
  }, 4 * 60 * 60 * 1000);
}

/**
 * Controlla manualmente la presenza di aggiornamenti
 */
function checkForUpdates() {
  if (!app.isPackaged) {
    console.log('Updater: Skip controllo in modalità sviluppo');
    return;
  }

  try {
    autoUpdater.checkForUpdates();
  } catch (err) {
    console.error('Updater: Errore nel controllo:', err);
  }
}

/**
 * Controlla aggiornamenti e mostra messaggio anche se non ci sono
 * (per uso da menu)
 */
function checkForUpdatesManual(mainWindow) {
  if (!app.isPackaged) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Modalità sviluppo',
      message: 'Gli aggiornamenti automatici sono disabilitati in modalità sviluppo.',
      buttons: ['OK']
    });
    return;
  }

  // Listener temporaneo per "nessun aggiornamento"
  const noUpdateHandler = () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Nessun aggiornamento',
      message: 'Stai già utilizzando l\'ultima versione di MOVARISCH.',
      detail: `Versione attuale: ${app.getVersion()}`,
      buttons: ['OK']
    });
  };

  autoUpdater.once('update-not-available', noUpdateHandler);

  // Rimuovi il listener dopo 10 secondi se non viene chiamato
  setTimeout(() => {
    autoUpdater.removeListener('update-not-available', noUpdateHandler);
  }, 10000);

  checkForUpdates();
}

module.exports = {
  initUpdater,
  checkForUpdates,
  checkForUpdatesManual
};
