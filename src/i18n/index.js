(function(){
  const STORAGE_KEY = 'movarisch:lang';
  const fallbackLang = 'it';
  const cache = {};
  const listeners = new Set();
  const attrMap = [
    ['data-i18n', 'textContent'],
    ['data-i18n-html', 'innerHTML'],
    ['data-i18n-placeholder', 'placeholder'],
    ['data-i18n-title', 'title'],
    ['data-i18n-href', 'href'],
    ['data-i18n-aria-label', 'ariaLabel']
  ];

  function detectLanguage(){
    const stored = localStorage.getItem(STORAGE_KEY);
    if(stored){ return stored; }
    const docLang = document.documentElement.lang;
    if(docLang){ return docLang.split('-')[0]; }
    const nav = navigator.language || (navigator.languages && navigator.languages[0]);
    if(nav){ return String(nav).split('-')[0]; }
    return fallbackLang;
  }

  function deepGet(obj, path){
    if(!obj) return undefined;
    return path.split('.').reduce((acc, part)=> (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  function format(value, params){
    if(typeof value !== 'string'){ return value; }
    if(!params) return value;
    return value.replace(/\{(\w+)\}/g, (match, key)=>{
      return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match;
    });
  }

  async function loadLanguage(lang){
    if(cache[lang]) return cache[lang];
    const response = await fetch(`src/i18n/${lang}.json`, { cache:'no-store' });
    if(!response.ok){
      throw new Error(`Failed to load translations for ${lang}`);
    }
    const data = await response.json();
    cache[lang] = data;
    return data;
  }

  let currentLang = detectLanguage() || fallbackLang;
  let initialized = false;

  function resolveValue(key){
    const primary = cache[currentLang];
    let value = deepGet(primary, key);
    if(value === undefined && currentLang !== fallbackLang){
      value = deepGet(cache[fallbackLang], key);
    }
    return value;
  }

  function applyTranslations(){
    document.documentElement.lang = currentLang;
    const title = exports.t('meta.title');
    if(typeof title === 'string'){ document.title = title; }
    for(const [attr, prop] of attrMap){
      document.querySelectorAll(`[${attr}]`).forEach((el)=>{
        const key = el.getAttribute(attr);
        const value = exports.t(key);
        if(value === undefined) return;
        if(prop === 'textContent' || prop === 'innerHTML'){
          el[prop] = typeof value === 'string' ? value : String(value);
        }else if(prop === 'ariaLabel'){
          el.setAttribute('aria-label', typeof value === 'string' ? value : String(value));
        }else if(prop && prop !== 'textContent' && prop !== 'innerHTML'){
          el.setAttribute(prop, typeof value === 'string' ? value : String(value));
        }
      });
    }
    const langSelect = document.querySelector('#langSelect');
    if(langSelect){
      langSelect.value = currentLang;
    }
    listeners.forEach((fn)=>{
      try{ fn(currentLang); }
      catch(err){ console.error('i18n listener error', err); }
    });
    window.dispatchEvent(new CustomEvent('i18n:change', { detail:{ lang: currentLang }}));
  }

  async function init(){
    try{
      await loadLanguage(fallbackLang);
      if(currentLang !== fallbackLang){
        try{
          await loadLanguage(currentLang);
        }catch(err){
          console.warn('Falling back to default language', err);
          currentLang = fallbackLang;
        }
      }
      initialized = true;
      applyTranslations();
    }catch(err){
      console.error('Failed to initialise translations', err);
    }
  }

  const exports = {
    async setLanguage(lang){
      const normalized = (lang || fallbackLang).split('-')[0];
      if(normalized === currentLang && initialized){ return; }
      try{
        await loadLanguage(normalized);
        currentLang = normalized;
        localStorage.setItem(STORAGE_KEY, currentLang);
      }catch(err){
        console.error('Unable to load language', normalized, err);
        currentLang = fallbackLang;
      }
      if(!cache[currentLang]){
        await loadLanguage(fallbackLang);
        currentLang = fallbackLang;
      }
      applyTranslations();
    },
    t(key, params){
      if(!key) return '';
      const value = resolveValue(key);
      if(value === undefined){ return key; }
      if(Array.isArray(value)){
        return value.map((item)=> typeof item === 'string' ? format(item, params) : item);
      }
      if(typeof value === 'object' && value !== null){
        return JSON.parse(JSON.stringify(value));
      }
      return format(value, params);
    },
    get(key){
      if(!key) return undefined;
      const value = resolveValue(key);
      if(value === undefined){ return undefined; }
      if(typeof value === 'object' && value !== null){
        return JSON.parse(JSON.stringify(value));
      }
      return value;
    },
    getLanguage(){ return currentLang; },
    onChange(fn){ if(typeof fn === 'function'){ listeners.add(fn); } },
    offChange(fn){ if(fn){ listeners.delete(fn); } }
  };

  window.i18n = exports;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }

  document.addEventListener('change', (event)=>{
    if(event.target && event.target.id === 'langSelect'){
      exports.setLanguage(event.target.value);
    }
  });
})();
