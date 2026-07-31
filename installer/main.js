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
const childWindows = new Set();

// Configurazione percorsi
const isDev = !app.isPackaged;
const appPath = isDev
  ? path.join(__dirname, '..')
  : path.join(process.resourcesPath, 'app');
const {
  classifyNavigation,
  isAllowedAppFileUrl,
  isAllowedExternalUrl
} = require(path.join(appPath, 'src', 'electron-security-policy.js'));

function secureWebPreferences() {
  return {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    enableRemoteModule: false,
    webSecurity: true,
    allowRunningInsecureContent: false,
    navigateOnDragDrop: false,
    safeDialogs: true,
    devTools: isDev
  };
}

function openApprovedExternal(url) {
  if (!isAllowedExternalUrl(url)) return;
  shell.openExternal(url).catch((error) => {
    console.error('Impossibile aprire il collegamento esterno approvato:', error.message);
  });
}

function openInternalPage(relativePath, title) {
  const targetPath = path.join(appPath, relativePath);
  const targetUrl = require('url').pathToFileURL(targetPath).href;
  if (!isAllowedAppFileUrl(targetUrl, appPath)) return;

  const childWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title,
    autoHideMenuBar: true,
    parent: mainWindow || undefined,
    webPreferences: secureWebPreferences()
  });
  childWindows.add(childWindow);
  childWindow.on('closed', () => childWindows.delete(childWindow));
  childWindow.loadFile(targetPath);
}

/**
 * Crea la finestra principale dell'applicazione
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: `MOVARISCH v${app.getVersion()}`,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#0b1220',
    webPreferences: secureWebPreferences(),
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
            openApprovedExternal('https://giuseppe575.github.io/movarisch/');
          }
        },
        {
          label: 'Segnala un problema',
          click: () => {
            openApprovedExternal('mailto:atis.giuseppe@gmail.com?subject=MOVARISCH%20-%20Segnalazione');
          }
        },
        { type: 'separator' },
        {
          label: 'Privacy Policy',
          click: () => {
            const privacyPath = path.join(appPath, 'docs', 'privacy.html');
            if (fs.existsSync(privacyPath)) {
              openInternalPage(path.join('docs', 'privacy.html'), 'Privacy Policy - MOVARISCH');
            }
          }
        },
        {
          label: 'EULA',
          click: () => {
            const eulaPath = path.join(appPath, 'docs', 'eula.html');
            if (fs.existsSync(eulaPath)) {
              openInternalPage(path.join('docs', 'eula.html'), 'EULA - MOVARISCH');
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
              message: `MOVARISCH v${app.getVersion()}`,
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

// Blocca webview non autorizzati e nuovi BrowserWindow creati da contenuto web
app.on('web-contents-created', (_event, contents) => {
  // Disabilita la creazione di <webview> tag (vettore di attacco noto in Electron)
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  // Blocca apertura di nuove finestre da contenuto renderer (sotto-finestre)
  contents.setWindowOpenHandler(({ url }) => {
    const disposition = classifyNavigation(url, appPath);
    if (disposition === 'external') {
      openApprovedExternal(url);
      return { action: 'deny' };
    }
    if (disposition === 'internal') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: secureWebPreferences()
        }
      };
    }
    return { action: 'deny' };
  });

  const enforceNavigationPolicy = (event, url) => {
    const disposition = classifyNavigation(url, appPath);
    if (disposition === 'internal') return;

    event.preventDefault();
    if (disposition === 'external') openApprovedExternal(url);
  };

  // Applica la stessa policy sia alle navigazioni dirette sia ai redirect.
  contents.on('will-navigate', enforceNavigationPolicy);
  contents.on('will-redirect', enforceNavigationPolicy);
});

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
