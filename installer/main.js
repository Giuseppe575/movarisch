/**
 * MOVARISCH - Entry Point Electron
 *
 * Questo file gestisce:
 * - Creazione della finestra principale
 * - Gestione del ciclo di vita dell'app
 * - Menu dell'applicazione
 * - Protocol handlers
 */

const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { initUpdater, checkForUpdatesManual } = require('./updater');

// Mantieni un riferimento globale alla finestra per evitare il garbage collection
let mainWindow;

// Configurazione percorsi
const isDev = !app.isPackaged;
const appPath = isDev
  ? path.join(__dirname, '..')
  : path.join(process.resourcesPath, 'app');

/**
 * Crea la finestra principale dell'applicazione
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'MOVARISCH v1.1.0',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#0b1220',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: isDev // Abilita DevTools solo in sviluppo
    },
    show: false, // Non mostrare finché non è pronta
    autoHideMenuBar: false
  });

  // Carica l'applicazione
  const indexPath = path.join(appPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    console.error('File index.html non trovato in:', indexPath);
    dialog.showErrorBox(
      'Errore di avvio',
      `Impossibile trovare index.html.\nPercorso cercato: ${indexPath}`
    );
    app.quit();
    return;
  }

  // Mostra la finestra quando è pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Apri DevTools solo in modalità sviluppo
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Gestisci apertura link esterni
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Apri link esterni nel browser predefinito
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Previeni navigazione non autorizzata
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const indexUrl = mainWindow.webContents.getURL();
    if (!url.startsWith(indexUrl) && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Crea il menu dell'applicazione
  createMenu();
}

/**
 * Crea il menu dell'applicazione
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Nuovo Progetto',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Esci',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Modifica',
      submenu: [
        { label: 'Annulla', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Ripeti', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Taglia', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copia', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Incolla', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Seleziona tutto', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'Visualizza',
      submenu: [
        { label: 'Ricarica', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Forza ricarica', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Zoom avanti', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom indietro', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Ripristina zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Schermo intero', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Aiuto',
      submenu: [
        {
          label: 'Documentazione',
          click: () => {
            shell.openExternal('https://giuseppe575.github.io/movarisch/');
          }
        },
        {
          label: 'Segnala un problema',
          click: () => {
            shell.openExternal('mailto:atis.giuseppe@gmail.com?subject=MOVARISCH%20-%20Segnalazione');
          }
        },
        { type: 'separator' },
        {
          label: 'Privacy Policy',
          click: () => {
            const privacyPath = path.join(appPath, 'docs', 'privacy.html');
            if (fs.existsSync(privacyPath)) {
              shell.openPath(privacyPath);
            }
          }
        },
        {
          label: 'EULA',
          click: () => {
            const eulaPath = path.join(appPath, 'docs', 'eula.html');
            if (fs.existsSync(eulaPath)) {
              shell.openPath(eulaPath);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Controlla aggiornamenti...',
          click: () => {
            checkForUpdatesManual(mainWindow);
          }
        },
        { type: 'separator' },
        {
          label: 'Informazioni su MOVARISCH',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Informazioni su MOVARISCH',
              message: 'MOVARISCH v1.1.0',
              detail:
                'Software professionale per l\'analisi automatizzata del rischio chimico.\n\n' +
                'Sviluppato da: Giuseppe\n' +
                'Email: atis.giuseppe@gmail.com\n' +
                'Sito: https://giuseppe575.github.io/movarisch-site/\n\n' +
                '© 2025 Giuseppe - Tutti i diritti riservati',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  // Aggiungi menu Sviluppatore solo in dev mode
  if (isDev) {
    template.push({
      label: 'Sviluppatore',
      submenu: [
        { label: 'Apri DevTools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Percorso app:', enabled: false },
        { label: appPath, enabled: false }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Gestione eventi del ciclo di vita dell'app
 */

// Quando Electron ha completato l'inizializzazione
app.whenReady().then(() => {
  createWindow();

  // Inizializza il sistema di aggiornamenti automatici
  initUpdater(mainWindow);

  // Su macOS ricrea la finestra quando l'icona del dock viene cliccata
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Esci quando tutte le finestre sono chiuse (eccetto macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Previeni istanze multiple dell'app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Se l'utente prova ad aprire una seconda istanza, porta in focus la prima
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Gestione errori non catturati
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox(
    'Errore critico',
    `Si è verificato un errore imprevisto:\n\n${error.message}\n\nL'applicazione verrà chiusa.`
  );
  app.quit();
});
