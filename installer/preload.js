/**
 * MOVARISCH - Preload Script
 *
 * Questo script viene eseguito prima del caricamento della pagina web.
 * Fornisce un bridge sicuro tra il processo principale e il renderer.
 *
 * IMPORTANTE: Questo script gira in un contesto isolato per sicurezza.
 * Non espone direttamente Node.js o Electron al renderer.
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Espone API sicure al renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Informazioni sull'app
  platform: process.platform,
  version: '1.1.0',

  // Flag per indicare che siamo in Electron
  isElectron: true,

  // Listener per eventi di aggiornamento
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  },

  // Rimuovi listener aggiornamento
  removeUpdateListener: () => {
    ipcRenderer.removeAllListeners('update-status');
  }
});

/**
 * Inietta informazioni di runtime
 */
window.addEventListener('DOMContentLoaded', () => {
  // Aggiungi classe al body per CSS specifici di Electron
  document.body.classList.add('electron-app');

  // Log di avvio (solo console, non visibile all'utente)
  console.log('MOVARISCH v1.1.0 - Electron App');
  console.log('Platform:', process.platform);
  console.log('Electron version:', process.versions.electron);
  console.log('Chrome version:', process.versions.chrome);
  console.log('Node version:', process.versions.node);
});
