/**
 * MOVARISCH - UI Attivazione Licenza
 * Gestisce l'interfaccia utente per l'attivazione della licenza
 */

(function(window) {
  'use strict';

  let modal = null;
  let input = null;
  let errorDisplay = null;
  let activateBtn = null;

  /**
   * Inizializza la schermata di attivazione
   */
  function init() {
    // Crea l'HTML del modal se non esiste
    if (!document.getElementById('licenseModal')) {
      createModal();
    }

    // Ottieni riferimenti agli elementi
    modal = document.getElementById('licenseModal');
    input = document.getElementById('licenseInput');
    errorDisplay = document.getElementById('licenseError');
    activateBtn = document.getElementById('activateBtn');

    // Setup event listeners
    setupEventListeners();
  }

  /**
   * Crea il modal HTML
   */
  function createModal() {
    const modalHTML = `
      <div id="licenseModal">
        <div class="license-container">
          <div class="license-icon">🔐</div>
          <h1>Attivazione MOVARISCH</h1>
          <p class="subtitle">
            Inserisci la tua chiave di licenza per attivare MOVARISCH.<br>
            Una volta attivato, potrai utilizzare tutte le funzionalità senza limiti.
          </p>

          <div class="license-input-group">
            <label for="licenseInput">Chiave di Licenza</label>
            <input
              type="text"
              id="licenseInput"
              placeholder="MOVA-XXXX-XXXX-XXXX-XXXX"
              maxlength="24"
              autocomplete="off"
              spellcheck="false"
            />
            <span class="license-error" id="licenseError"></span>
          </div>

          <div class="license-actions">
            <button id="activateBtn" class="btn-activate">
              🚀 Attiva Licenza
            </button>
            <a href="#" class="btn-purchase" id="purchaseLink" target="_blank" rel="noopener">
              💳 Acquista Licenza
            </a>
          </div>

          <div class="license-help">
            <h3>ℹ️ Formato della chiave</h3>
            <p>La chiave di licenza deve essere nel formato:</p>
            <div class="license-format">MOVA-XXXX-XXXX-XXXX-XXXX</div>
            <p style="margin-top: 15px;">
              <strong>Problemi con l'attivazione?</strong>
            </p>
            <ul>
              <li>Verifica di aver inserito la chiave correttamente</li>
              <li>Assicurati che non ci siano spazi extra</li>
              <li>Controlla di aver ricevuto una chiave valida</li>
              <li>Contatta il supporto per assistenza</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Auto-formattazione input
    input.addEventListener('input', handleInput);

    // Attivazione al click del pulsante
    activateBtn.addEventListener('click', handleActivate);

    // Attivazione con tasto Enter
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleActivate();
      }
    });

    // Link acquisto (personalizzabile)
    const purchaseLink = document.getElementById('purchaseLink');
    purchaseLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Qui puoi impostare l'URL del tuo sito di vendita
      window.open('https://tuosito.com/acquista-movarisch', '_blank');
    });
  }

  /**
   * Gestisce l'input della chiave con auto-formattazione
   */
  function handleInput(e) {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Auto-inserimento trattini
    if (value.length > 4) {
      value = value.match(/.{1,4}/g).join('-');
      if (value.startsWith('MOVA-')) {
        value = value.substring(5);
      }
      value = 'MOVA-' + value;
    }

    e.target.value = value.substring(0, 24); // MOVA-XXXX-XXXX-XXXX-XXXX = 24 caratteri

    // Rimuovi errori durante la digitazione
    clearError();
  }

  /**
   * Gestisce l'attivazione della licenza
   */
  async function handleActivate() {
    const licenseKey = input.value.trim();

    // Validazione base
    if (!licenseKey) {
      showError('Inserisci una chiave di licenza');
      return;
    }

    // Normalizza la chiave
    const normalizedKey = window.LicenseManager.normalize(licenseKey);

    // Mostra stato di caricamento
    setLoading(true);

    // Simula un piccolo delay per migliore UX
    setTimeout(async () => {
      // Tenta l'attivazione (ora è async)
      const result = await window.LicenseManager.activate(normalizedKey);

      setLoading(false);

      if (result.success) {
        // Verifica se ci sono warning sullo storage
        if (window.StorageManager) {
          const warning = window.StorageManager.checkWarning();
          if (warning.shouldWarn && warning.severity === 'warning') {
            // Mostra warning ma permetti comunque il successo
            showWarning(warning.message);
            setTimeout(() => {
              showSuccess();
            }, 3000);
            return;
          }
        }
        showSuccess();
      } else {
        showError(result.error);
      }
    }, 500);
  }

  /**
   * Mostra un errore
   */
  function showError(message) {
    errorDisplay.textContent = '❌ ' + message;
    errorDisplay.style.color = '#ff6b6b';
    input.classList.add('error');

    // Rimuovi classe error dopo l'animazione
    setTimeout(() => {
      input.classList.remove('error');
    }, 500);
  }

  /**
   * Mostra un warning (non bloccante)
   */
  function showWarning(message) {
    errorDisplay.textContent = '⚠️ ' + message;
    errorDisplay.style.color = '#f0ad4e';
  }

  /**
   * Rimuove l'errore
   */
  function clearError() {
    errorDisplay.textContent = '';
    errorDisplay.style.color = '';
    input.classList.remove('error');
  }

  /**
   * Mostra stato di caricamento
   */
  function setLoading(loading) {
    activateBtn.disabled = loading;
    if (loading) {
      activateBtn.classList.add('loading');
    } else {
      activateBtn.classList.remove('loading');
    }
  }

  /**
   * Mostra successo e chiude il modal
   */
  function showSuccess() {
    const container = modal.querySelector('.license-container');
    container.classList.add('license-success');

    // Mostra messaggio di successo
    errorDisplay.style.color = '#4ecca3';
    errorDisplay.textContent = '✅ Licenza attivata con successo!';

    // Chiudi il modal e ricarica l'app dopo 1.5 secondi
    setTimeout(() => {
      hide();
      // Ricarica la pagina per applicare la licenza
      window.location.reload();
    }, 1500);
  }

  /**
   * Mostra il modal
   */
  function show() {
    if (!modal) init();
    modal.classList.add('active');
    input.value = '';
    clearError();
    input.focus();
  }

  /**
   * Nascondi il modal
   */
  function hide() {
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Verifica se serve mostrare l'attivazione all'avvio
   */
  async function checkActivationOnLoad() {
    // Attendi che LicenseManager e StorageManager siano disponibili
    if (!window.LicenseManager || !window.StorageManager) {
      setTimeout(checkActivationOnLoad, 100);
      return;
    }

    const isActive = await window.LicenseManager.isActivated();

    if (!isActive) {
      // Mostra il modal dopo un piccolo delay
      setTimeout(show, 300);
    }
  }

  // Esporta l'API pubblica
  window.LicenseActivation = {
    init: init,
    show: show,
    hide: hide,
    checkOnLoad: checkActivationOnLoad
  };

  // Auto-inizializza quando il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
