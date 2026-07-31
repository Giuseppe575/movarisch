/**
 * MOVARISCH - Sistema di Aggiornamenti Automatici
 *
 * Gestisce il controllo e l'installazione degli aggiornamenti
 * utilizzando electron-updater con GitHub Releases.
 */

const { autoUpdater } = require('electron-updater');
const { app, dialog, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const {
  clampProgress,
  isTransientNetworkError,
  sanitizeUpdateError
} = require('./lib/updater-policy');

// Configurazione
autoUpdater.autoDownload = false; // Non scaricare automaticamente
autoUpdater.autoInstallOnAppQuit = true; // Installa quando l'app si chiude
autoUpdater.allowPrerelease = false;
autoUpdater.allowDowngrade = false;
autoUpdater.fullChangelog = false;

let initialized = false;
let checkInProgress = null;

function createUpdaterLogger() {
  if (!app.isPackaged) return console;

  const logDirectory = path.join(app.getPath('userData'), 'logs');
  const logPath = path.join(logDirectory, 'updater.log');
  const maxLogBytes = 512 * 1024;

  try {
    fs.mkdirSync(logDirectory, { recursive: true });
    if (fs.existsSync(logPath) && fs.statSync(logPath).size > maxLogBytes) {
      fs.renameSync(logPath, `${logPath}.old`);
    }
  } catch {
    // Un errore di logging non deve bloccare l'app o gli aggiornamenti.
  }

  const write = (level, values) => {
    const message = values
      .map((value) => value instanceof Error ? sanitizeUpdateError(value) : String(value))
      .join(' ');
    const line = `${new Date().toISOString()} ${level} ${message}\n`;
    try {
      fs.appendFileSync(logPath, line, { encoding: 'utf8', mode: 0o600 });
    } catch {
      // Logging best-effort e privo di contenuti delle schede/documenti utente.
    }
  };

  return {
    info: (...values) => write('INFO', values),
    warn: (...values) => write('WARN', values),
    error: (...values) => write('ERROR', values),
    debug: (...values) => write('DEBUG', values)
  };
}

const log = (...values) => autoUpdater.logger?.info(...values);
const logError = (...values) => autoUpdater.logger?.error(...values);

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

  if (initialized) return;
  initialized = true;
  autoUpdater.logger = createUpdaterLogger();

  // Evento: Controllo aggiornamenti in corso
  autoUpdater.on('checking-for-update', () => {
    log('Updater: controllo aggiornamenti');
  });

  // Evento: Aggiornamento disponibile
  autoUpdater.on('update-available', (info) => {
    log('Updater: aggiornamento disponibile', info.version);

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
        autoUpdater.downloadUpdate().catch((error) => {
          logError('Updater: download fallito', sanitizeUpdateError(error));
        });

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
    log('Updater: nessun aggiornamento disponibile', info?.version || 'versione sconosciuta');
  });

  // Evento: Errore durante il controllo/download
  autoUpdater.on('error', (err) => {
    logError('Updater: errore', sanitizeUpdateError(err));

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitle('MOVARISCH v' + app.getVersion());
      mainWindow.webContents.send('update-status', { status: 'error' });
    }

    // Non mostrare errori all'utente per problemi di rete minori
    // Mostra solo errori critici
    if (!isTransientNetworkError(err)) {
      dialog.showErrorBox(
        'Errore aggiornamento',
        'Si è verificato un errore durante il controllo degli aggiornamenti.\n\n' +
        'Riprova più tardi o scarica l\'aggiornamento manualmente dal sito.'
      );
    }
  });

  // Evento: Progresso download
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = clampProgress(progressObj.percent);
    log(`Updater: download ${percent}%`);

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
    log('Updater: download completato', info.version);

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

  if (checkInProgress) return checkInProgress;

  checkInProgress = Promise.resolve()
    .then(() => autoUpdater.checkForUpdates())
    .catch((error) => {
      logError('Updater: controllo fallito', sanitizeUpdateError(error));
      return null;
    })
    .finally(() => {
      checkInProgress = null;
    });

  return checkInProgress;
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
