/**
 * MOVARISCH - Sistema di validazione licenze offline
 * Questo modulo gestisce la validazione e l'attivazione delle licenze
 * senza richiedere connessione a server esterni.
 */

(function(window) {
  'use strict';

  const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const LICENSE_KEY = 'movarisch_license';

  /**
   * Calcola il checksum di una licenza
   * Deve corrispondere esattamente all'algoritmo del generatore
   */
  function calculateChecksum(blocks) {
    const data = blocks.join('');
    let sum = 0;

    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i);
      sum += charCode * (i + 1);
    }

    let checksum = '';
    for (let i = 0; i < 4; i++) {
      const index = (sum >> (i * 5)) % CHARSET.length;
      checksum += CHARSET[index];
      sum = sum * 31 + data.charCodeAt(i % data.length);
    }

    return checksum;
  }

  /**
   * Valida il formato di una chiave di licenza
   */
  function validateLicenseFormat(license) {
    if (!license || typeof license !== 'string') {
      return { valid: false, error: 'Licenza non valida' };
    }

    // Rimuovi spazi e converti in maiuscolo
    license = license.trim().toUpperCase();

    // Verifica formato MOVA-XXXX-XXXX-XXXX-XXXX
    const parts = license.split('-');

    if (parts.length !== 5) {
      return { valid: false, error: 'Formato licenza non valido. Usa: MOVA-XXXX-XXXX-XXXX-XXXX' };
    }

    if (parts[0] !== 'MOVA') {
      return { valid: false, error: 'Prefisso licenza non valido' };
    }

    // Verifica che ogni blocco sia di 4 caratteri validi
    for (let i = 1; i < 5; i++) {
      if (parts[i].length !== 4) {
        return { valid: false, error: `Blocco ${i} non valido: deve contenere 4 caratteri` };
      }

      // Verifica che ogni carattere sia nel charset valido
      for (const char of parts[i]) {
        if (!CHARSET.includes(char)) {
          return { valid: false, error: `Carattere non valido: ${char}` };
        }
      }
    }

    return { valid: true, license };
  }

  /**
   * Valida una licenza verificando il checksum
   */
  function validateLicense(license) {
    // Prima valida il formato
    const formatCheck = validateLicenseFormat(license);
    if (!formatCheck.valid) {
      return formatCheck;
    }

    license = formatCheck.license;
    const parts = license.split('-');
    const [_, block1, block2, block3, providedChecksum] = parts;

    // Calcola il checksum atteso
    const calculatedChecksum = calculateChecksum([block1, block2, block3]);

    // Verifica corrispondenza
    if (providedChecksum !== calculatedChecksum) {
      return {
        valid: false,
        error: 'Chiave di licenza non valida. Contatta il supporto per assistenza.'
      };
    }

    return {
      valid: true,
      license,
      activated: new Date().toISOString()
    };
  }

  /**
   * Salva la licenza usando StorageManager (con fallback automatici)
   */
  async function saveLicense(licenseData) {
    try {
      // Attendi che StorageManager sia disponibile
      if (!window.StorageManager) {
        console.error('StorageManager non disponibile');
        return false;
      }

      const result = await window.StorageManager.setItem(LICENSE_KEY, JSON.stringify(licenseData));
      return result;
    } catch (e) {
      console.error('Errore nel salvataggio della licenza:', e);
      return false;
    }
  }

  /**
   * Recupera la licenza salvata usando StorageManager
   */
  async function getLicense() {
    try {
      // Attendi che StorageManager sia disponibile
      if (!window.StorageManager) {
        console.error('StorageManager non disponibile');
        return null;
      }

      const saved = await window.StorageManager.getItem(LICENSE_KEY);
      if (!saved) return null;

      return JSON.parse(saved);
    } catch (e) {
      console.error('Errore nel recupero della licenza:', e);
      return null;
    }
  }

  /**
   * Verifica se l'applicazione è attivata
   */
  async function isActivated() {
    const license = await getLicense();
    if (!license) return false;

    // Riconvalida la licenza salvata
    const validation = validateLicense(license.license);
    return validation.valid;
  }

  /**
   * Attiva l'applicazione con una chiave di licenza
   */
  async function activate(licenseKey) {
    const validation = validateLicense(licenseKey);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const licenseData = {
      license: validation.license,
      activated: validation.activated,
      version: '1.0'
    };

    const saved = await saveLicense(licenseData);

    if (!saved) {
      // Verifica se è un problema di storage
      const warning = window.StorageManager ? window.StorageManager.checkWarning() : null;

      return {
        success: false,
        error: warning && warning.shouldWarn
          ? warning.message
          : 'Impossibile salvare la licenza. Verifica le impostazioni del browser.'
      };
    }

    return {
      success: true,
      data: licenseData
    };
  }

  /**
   * Rimuove la licenza (solo per debug/sviluppo)
   */
  async function deactivate() {
    try {
      if (window.StorageManager) {
        return await window.StorageManager.removeItem(LICENSE_KEY);
      }
      // Fallback
      localStorage.removeItem(LICENSE_KEY);
      return true;
    } catch (e) {
      console.error('Errore nella rimozione della licenza:', e);
      return false;
    }
  }

  /**
   * Normalizza una chiave di licenza (rimuove spazi, converti maiuscole)
   */
  function normalizeLicenseKey(key) {
    if (!key) return '';
    return key.trim().toUpperCase().replace(/\s+/g, '');
  }

  // Esporta l'API pubblica
  window.LicenseManager = {
    validate: validateLicense,
    activate: activate,
    isActivated: isActivated,
    getLicense: getLicense,
    deactivate: deactivate,
    normalize: normalizeLicenseKey
  };

})(window);
