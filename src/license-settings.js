/**
 * MOVARISCH - Gestione UI Impostazioni Licenza
 * Popola e gestisce la sezione impostazioni licenza nell'interfaccia
 */

(function(window) {
  'use strict';

  /**
   * Inizializza la sezione impostazioni licenza
   */
  async function initLicenseSettings() {
    // Verifica che i manager siano disponibili
    if (!window.LicenseManager || !window.StorageManager) {
      setTimeout(initLicenseSettings, 100);
      return;
    }

    // Verifica se la licenza è attiva (ora async)
    const isActive = await window.LicenseManager.isActivated();

    if (!isActive) {
      // Nasconde la sezione impostazioni se non c'è licenza
      const settingsSection = document.getElementById('licenseSettings');
      if (settingsSection) {
        settingsSection.style.display = 'none';
      }
      return;
    }

    // Recupera i dati della licenza (ora async)
    const licenseData = await window.LicenseManager.getLicense();
    if (!licenseData) return;

    // Mostra la sezione
    const settingsSection = document.getElementById('licenseSettings');
    if (settingsSection) {
      settingsSection.style.display = 'block';
    }

    // Popola i dati
    populateLicenseData(licenseData);

    // Setup eventi
    setupEventListeners();
  }

  /**
   * Popola i dati della licenza nell'interfaccia
   */
  function populateLicenseData(licenseData) {
    // Chiave di licenza
    const keyDisplay = document.getElementById('displayLicenseKey');
    if (keyDisplay) {
      keyDisplay.textContent = licenseData.license || 'N/A';
    }

    // Data di attivazione
    const dateDisplay = document.getElementById('licenseActivationDate');
    if (dateDisplay && licenseData.activated) {
      try {
        const date = new Date(licenseData.activated);
        const formatted = date.toLocaleDateString('it-IT', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        dateDisplay.textContent = formatted;
      } catch (e) {
        dateDisplay.textContent = licenseData.activated;
      }
    }
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Pulsante copia licenza
    const copyBtn = document.getElementById('copyLicenseBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', handleCopyLicense);
    }
  }

  /**
   * Gestisce la copia della chiave di licenza
   */
  async function handleCopyLicense() {
    const licenseData = await window.LicenseManager.getLicense();
    if (!licenseData || !licenseData.license) return;

    // Copia negli appunti
    navigator.clipboard.writeText(licenseData.license).then(() => {
      showCopyFeedback();
    }).catch((err) => {
      console.error('Errore nella copia:', err);
      // Fallback per browser più vecchi
      fallbackCopy(licenseData.license);
    });
  }

  /**
   * Mostra feedback visivo dopo la copia
   */
  function showCopyFeedback() {
    const copyBtn = document.getElementById('copyLicenseBtn');
    if (!copyBtn) return;

    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅';
    copyBtn.style.background = 'rgba(31, 178, 107, 0.2)';

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '';
    }, 2000);
  }

  /**
   * Fallback per la copia su browser più vecchi
   */
  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      showCopyFeedback();
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }

    document.body.removeChild(textarea);
  }

  /**
   * Aggiorna la visualizzazione se la licenza cambia
   */
  function refreshLicenseDisplay() {
    initLicenseSettings();
  }

  // Esporta l'API pubblica
  window.LicenseSettings = {
    init: initLicenseSettings,
    refresh: refreshLicenseDisplay
  };

  // Auto-inizializza quando il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLicenseSettings);
  } else {
    initLicenseSettings();
  }

})(window);
