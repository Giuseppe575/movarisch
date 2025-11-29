/**
 * MOVARISCH - Storage Manager Universale
 * Sistema di storage con fallback automatici per massima compatibilità browser
 *
 * Ordine di fallback:
 * 1. localStorage (persistente, illimitato)
 * 2. sessionStorage (solo sessione)
 * 3. Cookie (persistente, limitato a 4KB)
 * 4. IndexedDB (persistente, grande capacità)
 * 5. In-Memory (temporaneo, solo per sessione corrente)
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'movarisch_license';
  const COOKIE_NAME = 'movarisch_lic';
  const COOKIE_DAYS = 3650; // 10 anni
  const DB_NAME = 'MovarischDB';
  const DB_VERSION = 1;
  const DB_STORE = 'licenses';

  let currentMethod = null;
  let memoryStorage = {}; // Fallback in-memory

  /**
   * Test se localStorage è disponibile e funzionante
   */
  function testLocalStorage() {
    try {
      const test = '__movarisch_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Test se sessionStorage è disponibile
   */
  function testSessionStorage() {
    try {
      const test = '__movarisch_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Test se i cookies sono abilitati
   */
  function testCookies() {
    try {
      document.cookie = '__movarisch_test__=1; path=/';
      const works = document.cookie.indexOf('__movarisch_test__') !== -1;
      document.cookie = '__movarisch_test__=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
      return works;
    } catch (e) {
      return false;
    }
  }

  /**
   * Test se IndexedDB è disponibile
   */
  function testIndexedDB() {
    return !!(window.indexedDB);
  }

  /**
   * Determina il metodo di storage migliore disponibile
   */
  function detectBestStorageMethod() {
    if (testLocalStorage()) {
      console.log('📦 Storage: localStorage (persistente)');
      return 'localStorage';
    }

    if (testSessionStorage()) {
      console.warn('⚠️ localStorage bloccato, uso sessionStorage (solo sessione)');
      return 'sessionStorage';
    }

    if (testCookies()) {
      console.warn('⚠️ Storage bloccato, uso cookie (persistente, limitato)');
      return 'cookie';
    }

    if (testIndexedDB()) {
      console.warn('⚠️ Storage bloccato, uso IndexedDB (persistente)');
      return 'indexedDB';
    }

    console.error('❌ Tutti i metodi di storage bloccati, uso memoria (temporaneo)');
    return 'memory';
  }

  /**
   * METODI DI SCRITTURA
   */

  function writeLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('localStorage write error:', e);
      return false;
    }
  }

  function writeSessionStorage(key, value) {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('sessionStorage write error:', e);
      return false;
    }
  }

  function writeCookie(name, value, days) {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      const cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
      document.cookie = cookie;
      return true;
    } catch (e) {
      console.error('Cookie write error:', e);
      return false;
    }
  }

  function writeIndexedDB(key, value) {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('IndexedDB open error');
          resolve(false);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(DB_STORE)) {
            db.createObjectStore(DB_STORE, { keyPath: 'key' });
          }
        };

        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction([DB_STORE], 'readwrite');
          const store = transaction.objectStore(DB_STORE);

          store.put({ key, value });

          transaction.oncomplete = () => {
            db.close();
            resolve(true);
          };

          transaction.onerror = () => {
            db.close();
            console.error('IndexedDB transaction error');
            resolve(false);
          };
        };
      } catch (e) {
        console.error('IndexedDB write error:', e);
        resolve(false);
      }
    });
  }

  function writeMemory(key, value) {
    memoryStorage[key] = value;
    return true;
  }

  /**
   * METODI DI LETTURA
   */

  function readLocalStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('localStorage read error:', e);
      return null;
    }
  }

  function readSessionStorage(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.error('sessionStorage read error:', e);
      return null;
    }
  }

  function readCookie(name) {
    try {
      const nameEQ = name + '=';
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
        }
      }
      return null;
    } catch (e) {
      console.error('Cookie read error:', e);
      return null;
    }
  }

  function readIndexedDB(key) {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('IndexedDB open error');
          resolve(null);
        };

        request.onsuccess = (event) => {
          const db = event.target.result;

          if (!db.objectStoreNames.contains(DB_STORE)) {
            db.close();
            resolve(null);
            return;
          }

          const transaction = db.transaction([DB_STORE], 'readonly');
          const store = transaction.objectStore(DB_STORE);
          const getRequest = store.get(key);

          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result ? getRequest.result.value : null);
          };

          getRequest.onerror = () => {
            db.close();
            console.error('IndexedDB read error');
            resolve(null);
          };
        };
      } catch (e) {
        console.error('IndexedDB read error:', e);
        resolve(null);
      }
    });
  }

  function readMemory(key) {
    return memoryStorage[key] || null;
  }

  /**
   * METODI DI RIMOZIONE
   */

  function removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function removeSessionStorage(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function removeCookie(name) {
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      return true;
    } catch (e) {
      return false;
    }
  }

  function removeIndexedDB(key) {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onsuccess = (event) => {
          const db = event.target.result;

          if (!db.objectStoreNames.contains(DB_STORE)) {
            db.close();
            resolve(true);
            return;
          }

          const transaction = db.transaction([DB_STORE], 'readwrite');
          const store = transaction.objectStore(DB_STORE);
          store.delete(key);

          transaction.oncomplete = () => {
            db.close();
            resolve(true);
          };

          transaction.onerror = () => {
            db.close();
            resolve(false);
          };
        };

        request.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  function removeMemory(key) {
    delete memoryStorage[key];
    return true;
  }

  /**
   * API PUBBLICA UNIFICATA
   */

  async function setItem(key, value) {
    if (!currentMethod) {
      currentMethod = detectBestStorageMethod();
    }

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    switch (currentMethod) {
      case 'localStorage':
        return writeLocalStorage(key, valueStr);

      case 'sessionStorage':
        return writeSessionStorage(key, valueStr);

      case 'cookie':
        return writeCookie(COOKIE_NAME, valueStr, COOKIE_DAYS);

      case 'indexedDB':
        return await writeIndexedDB(key, valueStr);

      case 'memory':
        return writeMemory(key, valueStr);

      default:
        return false;
    }
  }

  async function getItem(key) {
    if (!currentMethod) {
      currentMethod = detectBestStorageMethod();
    }

    let value = null;

    switch (currentMethod) {
      case 'localStorage':
        value = readLocalStorage(key);
        break;

      case 'sessionStorage':
        value = readSessionStorage(key);
        break;

      case 'cookie':
        value = readCookie(COOKIE_NAME);
        break;

      case 'indexedDB':
        value = await readIndexedDB(key);
        break;

      case 'memory':
        value = readMemory(key);
        break;
    }

    return value;
  }

  async function removeItem(key) {
    if (!currentMethod) {
      currentMethod = detectBestStorageMethod();
    }

    switch (currentMethod) {
      case 'localStorage':
        return removeLocalStorage(key);

      case 'sessionStorage':
        return removeSessionStorage(key);

      case 'cookie':
        return removeCookie(COOKIE_NAME);

      case 'indexedDB':
        return await removeIndexedDB(key);

      case 'memory':
        return removeMemory(key);

      default:
        return false;
    }
  }

  /**
   * Verifica se lo storage è persistente
   */
  function isPersistent() {
    return currentMethod === 'localStorage' ||
           currentMethod === 'cookie' ||
           currentMethod === 'indexedDB';
  }

  /**
   * Ottieni informazioni sullo storage corrente
   */
  function getStorageInfo() {
    if (!currentMethod) {
      currentMethod = detectBestStorageMethod();
    }

    return {
      method: currentMethod,
      persistent: isPersistent(),
      available: {
        localStorage: testLocalStorage(),
        sessionStorage: testSessionStorage(),
        cookies: testCookies(),
        indexedDB: testIndexedDB()
      }
    };
  }

  /**
   * Mostra warning se necessario
   */
  function checkAndWarnIfNeeded() {
    const info = getStorageInfo();

    if (info.method === 'memory') {
      return {
        shouldWarn: true,
        message: 'Impossibile salvare la licenza. Abilita i cookie o lo storage del browser per mantenere l\'attivazione.',
        severity: 'error'
      };
    }

    if (info.method === 'sessionStorage') {
      return {
        shouldWarn: true,
        message: 'La licenza sarà valida solo per questa sessione. Per mantenerla permanentemente, abilita localStorage o i cookie.',
        severity: 'warning'
      };
    }

    return {
      shouldWarn: false,
      message: null,
      severity: null
    };
  }

  // Inizializza al caricamento
  detectBestStorageMethod();

  // Esporta API pubblica
  window.StorageManager = {
    setItem,
    getItem,
    removeItem,
    getInfo: getStorageInfo,
    checkWarning: checkAndWarnIfNeeded,
    isPersistent
  };

  // Log informazioni all'avvio (solo per debug)
  const info = getStorageInfo();
  console.log('🔧 Storage Manager inizializzato:', info);

})(window);
