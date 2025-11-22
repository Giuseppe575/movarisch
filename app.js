// =================== CONFIG ===================
function t(key, params){
  const fn = window.i18n && typeof window.i18n.t === 'function' ? window.i18n.t : null;
  if(fn){ return fn(key, params); }
  if(!key) return '';
  if(params){
    return key.replace(/\{(\w+)\}/g, (match, name)=> Object.prototype.hasOwnProperty.call(params, name) ? params[name] : match);
  }
  return key;
}

function makeOption(value, labelKey, extras={}){
  return Object.assign({
    value,
    labelKey,
    get label(){ return t(labelKey); }
  }, extras);
}

function describeError(err){
  if(!err && err !== 0){ return ''; }
  if(typeof err === 'string'){ return err; }
  if(typeof err?.message === 'string' && err.message){ return err.message; }
  try{ return JSON.stringify(err); }
  catch(e){ return String(err); }
}

const H_SCORE = {
  "H332":4.50,"H312":3.00,"H302":2.00,"H331":6.00,"H311":4.50,"H301":2.25,
  "H330":6.50,"H330 cat.1":6.50,"H330 cat.2":5.50,
  "H310":3.00,"H310 cat.1":3.00,"H310 cat.2":2.50,
  "H300":3.00,"H300 cat.1":3.00,"H300 cat.2":8.50,
  "EUH029":3.00,"EUH031":3.50,"EUH032":6.25,
  "H314":5.50,"H314 cat.1A":5.75,"H314 cat.1B":5.50,"H314 cat.1C":2.50,
  "H315":4.50,"H318":3.00,"H319":3.00,"EUH066":2.50,
  "H334":8.50,"H334 cat.1A":9.00,"H334 cat.1B":8.00,
  "H317":4.50,"H317 cat.1A":6.00,"H317 cat.1B":4.50,
  "H370":9.50,"H371":8.00,"H335":3.25,"H336":3.50,
  "H372":8.00,"H373":7.00,"H304":3.50,
  "H360":10.00,"H360D":9.50,"H360Df":9.75,"H360F":9.50,"H360FD":10.00,
  "H341":8.00,"H351":8.00,"H361":8.00,"H361d":7.50,"H361f":7.50,"H361fd":8.00,
  "H362":6.00,
};

// =================== SAFETY HAZARDS (Physical H-codes) ===================
const H_PHYSICAL_SCORE = {
  // ESPLOSIVITÀ (100)
  "H200":100, "H201":100, "H202":100, "H203":100, "H204":100, "H205":100,

  // INFIAMMABILITÀ ALTA (75)
  "H220":75, "H221":75, "H222":75, "H223":75, "H224":75, "H225":75, "H226":75,

  // INFIAMMABILITÀ MEDIA (50)
  "H227":50, "H228":50,

  // AUTOACCENSIONE (80)
  "H250":80, "H251":80, "H252":80,

  // REATTIVITÀ ACQUA (70)
  "H260":70, "H261":70,

  // COMBURENZA (60)
  "H270":60, "H271":60, "H272":60,

  // PRESSIONE/INSTABILITÀ (30)
  "H229":30, "H230":30, "H231":30, "H240":30, "H241":30, "H242":30,
  "H280":30, "H281":30, "H290":30,

  // EUH - PROPRIETÀ FISICHE (40)
  "EUH001":40, "EUH006":40, "EUH014":40, "EUH018":40, "EUH019":40, "EUH044":40,

  // EUH - ELEMENTI ETICHETTA (20)
  "EUH201":20, "EUH201A":20, "EUH202":20, "EUH203":20, "EUH204":20,
  "EUH205":20, "EUH206":20, "EUH207":20, "EUH208":20, "EUH209":20,
  "EUH209A":20, "EUH210":20, "EUH401":20
};

const UV_FALLBACK = ["H317","H335"]; // per UV/acrilati quando H non rilevate
const REGEX_H = /(EUH\d{3}|H\d{3})(?:\s*cat\.?\s*(1A|1B|1|2))?/gi;

const SISTEMA_OPTIONS = [
  makeOption('chiuso', 'options.system.chiuso', { index:1, showIndex:true }),
  makeOption('matrice', 'options.system.matrice', { index:2, showIndex:true }),
  makeOption('controllato', 'options.system.controllato', { index:3, showIndex:true }),
  makeOption('dispersivo', 'options.system.dispersivo', { index:4, showIndex:true })
];

const CONTROL_TYPE_OPTIONS = [
  makeOption('contenimento_completo', 'options.control.contenimento_completo', { index:1, showIndex:true }),
  makeOption('aspirazione_localizzata', 'options.control.aspirazione_localizzata', { index:2, showIndex:true }),
  makeOption('segregazione_separazione', 'options.control.segregazione_separazione', { index:3, showIndex:true }),
  makeOption('ventilazione_generale', 'options.control.ventilazione_generale', { index:4, showIndex:true }),
  makeOption('manipolazione_diretta', 'options.control.manipolazione_diretta', { index:5, showIndex:true })
];

const EXPOSURE_TIME_OPTIONS = [
  makeOption('lt_15', 'options.exposure.lt_15', { index:1, showIndex:true }),
  makeOption('15_120', 'options.exposure.15_120', { index:2, showIndex:true }),
  makeOption('120_240', 'options.exposure.120_240', { index:3, showIndex:true }),
  makeOption('240_360', 'options.exposure.240_360', { index:4, showIndex:true }),
  makeOption('gt_360', 'options.exposure.gt_360', { index:5, showIndex:true })
];

const QUANTITY_OPTIONS = [
  makeOption('lt_0_1', 'options.quantity.lt_0_1', { index:1, showIndex:true }),
  makeOption('0_1_1', 'options.quantity.0_1_1', { index:2, showIndex:true }),
  makeOption('1_10', 'options.quantity.1_10', { index:3, showIndex:true }),
  makeOption('10_100', 'options.quantity.10_100', { index:4, showIndex:true }),
  makeOption('gt_100', 'options.quantity.gt_100', { index:5, showIndex:true })
];

const STATO_FISICO_OPTIONS = [
  makeOption('solido_nebbia', 'options.physical.solido_nebbia', { index:1 }),
  makeOption('liquido_bassa', 'options.physical.liquido_bassa', { index:2 }),
  makeOption('liquido_media_alta', 'options.physical.liquido_media_alta', { index:3 }),
  makeOption('gas', 'options.physical.gas', { index:4 })
];

const CONTACT_LEVEL_OPTIONS = [
  makeOption('nessun_contatto', 'options.contact.nessun_contatto', { index:1 }),
  makeOption('accidentale', 'options.contact.accidentale', { index:2 }),
  makeOption('discontinuo', 'options.contact.discontinuo', { index:3 }),
  makeOption('esteso', 'options.contact.esteso', { index:4 })
];

const DISTANCE_OPTIONS = [
  makeOption('lt_1', 'options.distance.lt_1', { d:1.0 }),
  makeOption('1_3', 'options.distance.1_3', { d:0.75 }),
  makeOption('3_5', 'options.distance.3_5', { d:0.50 }),
  makeOption('5_10', 'options.distance.5_10', { d:0.25 }),
  makeOption('ge_10', 'options.distance.ge_10', { d:0.10 })
];

// =================== SAFETY OPTIONS ===================
const PHYSICAL_STATE_SAFETY_OPTIONS = [
  makeOption('solido', 'options.safety.physical_state.solido'),
  makeOption('liquido', 'options.safety.physical_state.liquido'),
  makeOption('gas', 'options.safety.physical_state.gas')
];

const SYSTEM_TYPE_SAFETY_OPTIONS = [
  makeOption('aperto', 'options.safety.system_type.aperto', { factor: 1.5 }),
  makeOption('chiuso', 'options.safety.system_type.chiuso', { factor: 1.0 })
];

const VENTILATION_OPTIONS = [
  makeOption('naturale', 'options.safety.ventilation.naturale', { factor: 1.0 }),
  makeOption('forzata', 'options.safety.ventilation.forzata', { factor: 1.0 }),
  makeOption('assente', 'options.safety.ventilation.assente', { factor: 1.3 })
];

const ECUT_MATRIX = {
  1: { 1:1, 2:1, 3:3, 4:7 }, // Sistema chiuso
  2: { 1:1, 2:3, 3:3, 4:7 }, // Inclusione in matrice
  3: { 1:1, 2:3, 3:7, 4:10 }, // Uso controllato
  4: { 1:1, 2:7, 3:7, 4:10 }, // Uso dispersivo
};

const defaults = {
  // HEALTH defaults
  sistema:'controllato',
  controlType:'aspirazione_localizzata',
  exposureTime:'15_120',
  qtyBand:'1_10',
  statoFisico:'liquido_media_alta',
  contactLevel:'nessun_contatto',
  distanceBand:'1_3',
  DIS:0.75,
  Ecut:1.0,

  // M.I.R.C. (INRS) SAFETY defaults
  hcodesPhysical: [],
  flashPoint: null,
  autoIgnitionTemp: null,

  // M.I.R.C. Fattori di Danno
  A1: 0,  // Danno salute (H3xx, H4xx)
  A2: 0,  // Danno sicurezza (H2xx fisici)

  // M.I.R.C. Fattori di Esposizione
  B1: 0,  // Quantità utilizzata
  B2: 0,  // Frequenza/Durata
  B3: 0,  // Ventilazione/Contenimento
  B4: 0,  // DPI e protezioni (può essere negativo)

  // M.I.R.C. Indici calcolati
  D_mirc: 0,   // D = A1 + A2
  E_mirc: 0,   // E = B1 + B2 + B3 + B4
  IRC: 0.1,    // IRC = 10^((D+E)/100)
  mircLevel: 'irrilevante',
  mircClass: 'irr'
};

const MOVARISCH = window.movarischLib || {};

if (
  typeof MOVARISCH.calcI !== 'function' ||
  typeof MOVARISCH.calcEinal !== 'function' ||
  typeof MOVARISCH.calcRinal !== 'function' ||
  typeof MOVARISCH.calcRcute !== 'function' ||
  typeof MOVARISCH.calcRcum !== 'function'
) {
  throw new Error(t('errors.movarischMissing'));
}

const RISK_CLASSES = [
  {
    id:'irr',
    test:(r)=> r < 15,
    get text(){ return t('legend.items.irr.text'); }
  },
  {
    id:'unc',
    test:(r)=> r >= 15 && r < 21,
    get text(){ return t('legend.items.unc.text'); }
  },
  {
    id:'sup',
    test:(r)=> r >= 21 && r <= 40,
    get text(){ return t('legend.items.sup.text'); }
  },
  {
    id:'elev',
    test:(r)=> r > 40 && r <= 80,
    get text(){ return t('legend.items.elev.text'); }
  },
  {
    id:'grave',
    test:(r)=> r > 80,
    get text(){ return t('legend.items.grave.text'); }
  }
];

// =================== STATE ===================
const state = { files:[], rows:[] };
const $ = s => document.querySelector(s);

if(window.pdfjsLib){
  try{
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  }catch(e){}
}

// =================== LIB LOADER + ALERT ===================
function showAlert(msg){ const el=$('#alert'); el.textContent=msg; el.style.display='block'; }
function clearAlert(){ const el=$('#alert'); el.textContent=''; el.style.display='none'; }

async function loadScript(src){
  return new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (err) => {
      s.remove();
      const msg = t('errors.loadScript', { src });
      reject(err || new Error(msg));
    };
    document.head.appendChild(s);
  });
}

async function ensureXlsx(){
  if(window.XLSX){ return window.XLSX; }
  const urls = [
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
  ];
  let lastErr;
  for(const url of urls){
    try{
      await loadScript(url);
      if(window.XLSX){ break; }
    }catch(err){
      lastErr = err;
    }
  }
  if(!window.XLSX){
    const msg = t('errors.loadXlsx');
    throw lastErr || new Error(msg);
  }
  return window.XLSX;
}

async function ensureDocx(){
  if(window.docxLib){ return window.docxLib; }
  const urls = [
    'https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm',
    'https://unpkg.com/docx@8.5.0/+esm'
  ];
  let lastErr;
  for(const url of urls){
    try{
      const module = await import(url);
      window.docxLib = module;
      if(window.docxLib){ break; }
    }catch(err){
      lastErr = err;
    }
  }
  if(!window.docxLib){
    const msg = t('errors.loadDocx');
    throw lastErr || new Error(msg);
  }
  return window.docxLib;
}

const PDFJS_WORKER_CANDIDATES = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
];
let pdfWorkerConfigured = false;

async function configurePdfWorker(pdfjs){
  if(!pdfjs || pdfWorkerConfigured){
    if(pdfjs && pdfjs.GlobalWorkerOptions && pdfjs.GlobalWorkerOptions.workerSrc){
      return;
    }
    if(pdfjs && pdfjs.disableWorker && typeof location !== 'undefined' && location.protocol === 'file:'){
      try{ pdfjs.disableWorker = true; }catch(e){}
    }
    return;
  }
  pdfWorkerConfigured = true;

  if(typeof location !== 'undefined' && location.protocol === 'file:'){
    try{ pdfjs.disableWorker = true; }catch(e){}
    return;
  }

  for(const url of PDFJS_WORKER_CANDIDATES){
    try{
      if(typeof fetch === 'function'){
        const res = await fetch(url, { method:'HEAD', mode:'cors' });
        if(!res.ok) continue;
      }
      if(pdfjs.GlobalWorkerOptions){
        pdfjs.GlobalWorkerOptions.workerSrc = url;
      }
      return;
    }catch(err){
      // Prova il prossimo URL
    }
  }

  try{ pdfjs.disableWorker = true; }catch(e){}
}

async function ensurePdfJs(){
  if(window.pdfjsLib){
    await configurePdfWorker(window.pdfjsLib);
    return window.pdfjsLib;
  }
  const urls = [
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
  ];
  for(const u of urls){
    try{
      await new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=u; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
      if(window.pdfjsLib){ break; }
    }catch(e){}
  }
  if(!window.pdfjsLib){ throw new Error(t('errors.loadPdf')); }
  await configurePdfWorker(window.pdfjsLib);
  return window.pdfjsLib;
}

// =================== PDF TEXT EXTRACTION ===================
function readAsArrayBuffer(file){
  return new Promise((resolve, reject)=>{
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error || new Error(t('errors.readFile')));
    fr.readAsArrayBuffer(file);
  });
}

async function pdfToText(file){
  const pdfjs = await ensurePdfJs();
  // Evita fetch su blob:URL (può fallire nel sandbox) passando i bytes direttamente
  const data = await readAsArrayBuffer(file);
  let pdf;
  try{
    pdf = await pdfjs.getDocument({data}).promise;
  }catch(err){
    // Fallback: disabilita worker e riprova
    try{ pdfjs.disableWorker = true; }catch(e){}
    pdf = await pdfjs.getDocument({data}).promise;
  }
  let full = '';
  for(let p=1; p<=pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const txt = await page.getTextContent();
    const str = txt.items.map(it=>it.str).join(' ');
    full += '\n'+str;
  }
  return full;
}

function findH(text){
  const out=[]; const seen=new Set();
  for(const m of text.matchAll(REGEX_H)){
    const base=(m[1]||'').toUpperCase();
    const cat=(m[2]||'').toUpperCase().replace(/\s+/g,'');
    let code=base;
    if(cat){
      if(/^H(314|330|310|300)$/i.test(base) && /^(1A|1B|1C|1|2)$/.test(cat)) code = base+' cat.'+cat;
      if(/^H(334|317)$/i.test(base) && /^(1A|1B)$/.test(cat)) code = base+' cat.'+cat;
    }
    if(!seen.has(code)){ seen.add(code); out.push(code); }
  }
  return out;
}

// Separa H-codes in salute (H3xx, H4xx) e fisici (H2xx, EUH)
function separateHCodes(allHCodes){
  const health = [];
  const physical = [];

  for(const code of allHCodes){
    const baseCode = code.split(' ')[0]; // Rimuove " cat.X" se presente

    // H-codes fisici: H2xx (200-299) e EUH
    if(/^H2\d{2}$/.test(baseCode) || /^EUH\d{3}$/.test(baseCode)){
      physical.push(code);
    }
    // H-codes salute: H3xx (300-399), H4xx (400-499)
    else if(/^H[34]\d{2}$/.test(baseCode)){
      health.push(code);
    }
    // Default: se inizia con H3 o H4 -> salute, altrimenti fisici
    else if(/^H[34]/.test(baseCode)){
      health.push(code);
    } else {
      physical.push(code);
    }
  }

  return { health, physical };
}

// Estrae punto di infiammabilità dalla Sezione 9
function extractFlashPoint(text){
  // Pattern comuni per punto di infiammabilità in SDS italiane e inglesi
  const patterns = [
    /punto\s+(?:di\s+)?infiammabilit[àa]\s*(?:[:\-–]?\s*)?([<>]?\s*\d+(?:[.,]\d+)?)\s*°?\s*c/i,
    /flash\s+point\s*(?:[:\-–]?\s*)?([<>]?\s*\d+(?:[.,]\d+)?)\s*°?\s*c/i,
    /flash\s*[\-–]?\s*point\s*(?:[:\-–]?\s*)?([<>]?\s*\d+(?:[.,]\d+)?)\s*°?\s*c/i,
    /infiammabilit[àa]\s*(?:[:\-–]?\s*)?([<>]?\s*\d+(?:[.,]\d+)?)\s*°?\s*c/i,
    /p\.?\s*infiamm\.?\s*(?:[:\-–]?\s*)?([<>]?\s*\d+(?:[.,]\d+)?)\s*°?\s*c/i
  ];

  for(const pattern of patterns){
    const match = text.match(pattern);
    if(match){
      let value = match[1].trim();
      // Rimuove simboli < > e converte , in .
      value = value.replace(/[<>]/g, '').replace(',', '.').trim();
      const num = parseFloat(value);
      if(!isNaN(num) && num >= -100 && num <= 500){
        return num;
      }
    }
  }

  return null;
}

// Estrae temperatura di autoaccensione dalla Sezione 9
function extractAutoIgnitionTemp(text){
  const patterns = [
    /temperatura\s+(?:di\s+)?autoaccensione\s*(?:[:\-–]?\s*)?([<>]?\s*\d+(?:[.,]\d+)?)\s*°?\s*c/i,
    /auto[\-–]?ignition\s+temperature\s*(?:[:\-–]?\s*)?([<>]?\s*\d+(?:[.,]\d+)?)\s*°?\s*c/i,
    /autoignition\s*(?:[:\-–]?\s*)?([<>]?\s*\d+(?:[.,]\d+)?)\s*°?\s*c/i,
    /temp\.?\s+autoaccensione\s*(?:[:\-–]?\s*)?([<>]?\s*\d+(?:[.,]\d+)?)\s*°?\s*c/i,
    /t\.?\s*autoaccensione\s*(?:[:\-–]?\s*)?([<>]?\s*\d+(?:[.,]\d+)?)\s*°?\s*c/i
  ];

  for(const pattern of patterns){
    const match = text.match(pattern);
    if(match){
      let value = match[1].trim();
      value = value.replace(/[<>]/g, '').replace(',', '.').trim();
      const num = parseFloat(value);
      if(!isNaN(num) && num >= 0 && num <= 1000){
        return num;
      }
    }
  }

  return null;
}

const PRODUCT_LINE_PATTERNS = [
  { regex:/nome\s+commerciale\s*(?:[:\-–]\s*)?(.+)/i, priority:100, type:'name' },
  { regex:/nome\s+del\s+prodotto\s*(?:[:\-–]\s*)?(.+)/i, priority:95, type:'name' },
  { regex:/nome\s+prodotto\s*(?:[:\-–]\s*)?(.+)/i, priority:90, type:'name' },
  { regex:/denominazione\s+del\s+prodotto\s*(?:[:\-–]\s*)?(.+)/i, priority:85, type:'name' },
  { regex:/denominazione\s*(?:[:\-–]\s*)?(.+)/i, priority:80, type:'name' },
  { regex:/product\s+trade\s+name\s*(?:[:\-–]\s*)?(.+)/i, priority:75, type:'name' },
  { regex:/product\s+name\s*(?:[:\-–]\s*)?(.+)/i, priority:70, type:'name' },
  { regex:/trade\s+name\s*(?:[:\-–]\s*)?(.+)/i, priority:65, type:'name' },
  { regex:/commercial\s+name\s*(?:[:\-–]\s*)?(.+)/i, priority:60, type:'name' },
  { regex:/identificatore\s+del\s+prodotto\s*(?:[:\-–]\s*)?(.+)/i, priority:58, type:'identifier' },
  { regex:/product\s+identifier\s*(?:[:\-–]\s*)?(.+)/i, priority:25, type:'identifier' },
];

const PRODUCT_LABEL_ONLY = /(nome\s+commerciale|nome\s+del\s+prodotto|nome\s+prodotto|denominazione\s+del\s+prodotto|denominazione|identificatore\s+del\s+prodotto|product\s+trade\s+name|product\s+name|trade\s+name|commercial\s+name)\b/i;

const PRODUCT_STOP_WORDS = [
  'USO','USI','USE','USES','UTILIZZO','UTILIZATION','IDENTIFICATORE','IDENTIFIER','RELEVANT','IDENTIFIED','CAS','EC','INDEX','NUMERO','NUMBER','SUPPLIER','FORNITORE','COMPANY','MANUFACTURER','REGISTRATION','REGISTRAZIONE','EMERGENCY','TELEFONO','TELEPHONE','EMAIL','FAX','DETAILS','SAFETY DATA SHEET','SCHEDA DI SICUREZZA','SEZIONE','SECTION','1.2','1.3','1.4','2.1','2.2'
];

const SECTION11_START_REGEX = /^\s*1(?:\s*[\.,]\s*|\s+|[)\-–]\s*)1(?:\b|[\s:.-])/;
const SECTION11_END_REGEX = /^\s*(?:1(?:\s*[\.,\-–]\s*|\s+)(?:2|3|4|5|6|7|8|9)|1\.(?:2|3|4|5|6|7|8|9)|1,(?:2|3|4|5|6|7|8|9)|2(?:\b|[\s.:])|(?:SEZIONE|SECTION)\s*2\b)/i;

function cleanProductName(raw){
  if(!raw) return '';
  let name = raw.replace(/^[\s:;\-–]+/, '').replace(/\s+/g, ' ').trim();
  name = name.replace(/^(?:\d+\.\d+\s*)+/, '').trim();
  name = name.replace(/^(?:product\s+identifier|identificatore\s+del\s+prodotto)\s*/i, '').trim();
  name = name.replace(/^(?:product\s+trade\s+name|trade\s+name|commercial\s+name|nome\s+commerciale|denominazione\s+del\s+prodotto|denominazione|nome\s+del\s+prodotto|nome\s+prodotto)\s*/i, '').trim();
  name = name.replace(/^(?:o|or)\s+(?:designazione\s+della\s+miscela|designation\s+of\s+the\s+mixture)\s*/i, '').trim();
  name = name.replace(/^(?:designazione\s+della\s+miscela|designation\s+of\s+the\s+mixture)\s*/i, '').trim();
  if(!name) return '';
  const upper = name.toUpperCase();
  for(const stop of PRODUCT_STOP_WORDS){
    const idx = upper.indexOf(stop);
    if(idx > 3){
      name = name.slice(0, idx).trim();
      break;
    }
  }
  name = name.replace(/\b(?:details\s+of\s+the\s+supplier|fornitore\s+della\s+scheda\s+di\s+sicurezza|fornitore\s+del\s+la\s+scheda\s+di\s+sicurezza)\b.*$/i, '').trim();
  const sectionMatch = name.match(/\b\d+\.\d+\b/);
  if(sectionMatch && sectionMatch.index > 3){
    name = name.slice(0, sectionMatch.index).trim();
  }
  name = name.replace(/[\s:;\-–]+$/, '').trim();
  if(name.length > 120){
    name = name.slice(0, 120).trim();
  }
  return name;
}

function isValidProductName(name){
  if(!name) return false;
  if(name.length < 3) return false;
  if(!/[A-ZÀ-ÖØ-Ý]/i.test(name)) return false;
  const trimmed = name.trim();
  if(/^(?:\d+\.\d+|SEZIONE|SECTION)\b/i.test(trimmed)) return false;
  if(/^(?:DETAILS|FORNITORE|SUPPLIER|RELEVANT|USI|USES|UTILIZZO|EMERGENCY)\b/i.test(trimmed)) return false;
  const upper = name.toUpperCase();
  if(/NOME\s+COMMERCIALE|NOME\s+DEL\s+PRODOTTO|PRODUCT\s+NAME|TRADE\s+NAME|COMMERCIAL\s+NAME|PRODUCT\s+IDENTIFIER/.test(upper)) return false;
  return true;
}

function nameQualityScore(name){
  if(!name) return -Infinity;
  let score = 0;
  const letters = (name.match(/[A-ZÀ-ÖØ-Ýa-zà-öø-ý]/g) || []).length;
  const digits = (name.match(/\d/g) || []).length;
  const hasSpace = /\s/.test(name);
  const hasLower = /[a-zà-öø-ý]/.test(name);
  const tokenCount = name.trim().split(/\s+/).length;
  score += Math.min(letters, 60);
  if(hasSpace) score += 6;
  if(hasLower) score += 8;
  if(tokenCount >= 3) score += 4;
  if(/[;,:]/.test(name)) score -= 2;
  if(digits > letters) score -= 8;
  if(digits && !hasLower && letters <= digits + 2) score -= 6;
  if(/^[A-Z0-9;\-\s]+$/.test(name) && !hasLower) score -= 6;
  score -= Math.max(0, digits - 2);
  return score;
}

function collectCandidatesFromLines(lines, priorityBoost=0, indexOffset=0){
  const candidates = [];
  for(let i=0;i<lines.length;i++){
    const line = lines[i];
    for(const pattern of PRODUCT_LINE_PATTERNS){
      const match = line.match(pattern.regex);
      if(match){
        const cleaned = cleanProductName(match[1]);
        if(isValidProductName(cleaned)){
          const basePriority = pattern.priority + priorityBoost;
          const quality = nameQualityScore(cleaned) - (pattern.type==='identifier' ? 5 : 0);
          candidates.push({ name: cleaned, priority: basePriority, quality, index:indexOffset + i });
        }
      }
    }
    if(PRODUCT_LABEL_ONLY.test(line) && i+1 < lines.length){
      const nextClean = cleanProductName(lines[i+1]);
      if(isValidProductName(nextClean)){
        const quality = nameQualityScore(nextClean);
        candidates.push({ name: nextClean, priority:68 + priorityBoost, quality, index:indexOffset + i + 1 });
      }
    }
  }
  return candidates;
}

function collectCandidatesFromText(text, priorityBoost=0, indexOffset=0){
  const candidates = [];
  if(!text) return candidates;
  for(const pattern of PRODUCT_LINE_PATTERNS){
    const match = text.match(pattern.regex);
    if(match){
      const cleaned = cleanProductName(match[1]);
      if(isValidProductName(cleaned)){
        const basePriority = pattern.priority + priorityBoost;
        const quality = nameQualityScore(cleaned) - (pattern.type==='identifier' ? 5 : 0);
        candidates.push({ name: cleaned, priority: basePriority, quality, index:indexOffset + candidates.length });
      }
    }
  }
  return candidates;
}

function extractSection11Lines(lines){
  const collected = [];
  let startIndex = -1;
  let capturing = false;
  for(let i=0;i<lines.length;i++){
    const line = lines[i];
    const simplified = line.replace(/\s+/g, ' ').trim();
    const upper = simplified.toUpperCase();
    if(!capturing){
      if(SECTION11_START_REGEX.test(simplified) || upper.includes('1.1 IDENTIFICATORE DEL PRODOTTO') || upper.startsWith('IDENTIFICATORE DEL PRODOTTO') || upper.startsWith('PRODUCT IDENTIFIER')){
        capturing = true;
        if(startIndex === -1) startIndex = i;
        collected.push(line);
        continue;
      }
    }else{
      if(!simplified){
        collected.push(line);
        continue;
      }
      if(SECTION11_END_REGEX.test(simplified)){
        break;
      }
      collected.push(line);
    }
  }
  return { lines: collected, offset: startIndex < 0 ? 0 : startIndex };
}

function pickBestCandidate(candidates){
  if(!candidates.length) return '';
  candidates.sort((a,b)=>{
    if(b.priority !== a.priority) return b.priority - a.priority;
    if(b.quality !== a.quality) return b.quality - a.quality;
    return a.index - b.index;
  });
  return candidates[0].name;
}

function extractProductName(text){
  if(!text) return '';
  const normalized = text.replace(/\r/g, '\n');
  const lines = normalized.split(/\n+/).map(l=>l.trim());
  const sectionInfo = extractSection11Lines(lines);
  if(sectionInfo.lines.length){
    const sectionCandidates = collectCandidatesFromLines(sectionInfo.lines, 40, sectionInfo.offset);
    if(sectionCandidates.length){
      return pickBestCandidate(sectionCandidates);
    }
    const sectionText = sectionInfo.lines.join(' ');
    const sectionFallback = collectCandidatesFromText(sectionText, 35, sectionInfo.offset);
    if(sectionFallback.length){
      return pickBestCandidate(sectionFallback);
    }
  }
  const section2Match = normalized.match(/(?:^|\n)\s*(?:(?:SEZIONE|SECTION)\s*2\b|2(?:[\s\.:,\-]|$))/mi);
  const beforeSection2 = section2Match ? normalized.slice(0, section2Match.index) : normalized;
  const sectionOneLines = beforeSection2.split(/\n+/).map(l=>l.trim()).filter(Boolean);
  const sectionOneCandidates = collectCandidatesFromLines(sectionOneLines, 12, 0);
  if(sectionOneCandidates.length){
    return pickBestCandidate(sectionOneCandidates);
  }
  const fallbackText = beforeSection2.replace(/\s+/g, ' ');
  const fallbackCandidates = collectCandidatesFromText(fallbackText, 10, sectionOneLines.length);
  if(fallbackCandidates.length){
    return pickBestCandidate(fallbackCandidates);
  }
  if(sectionInfo.lines.length){
    const rawBlock = sectionInfo.lines.join(' ').replace(/\s+/g, ' ').trim();
    if(isValidProductName(rawBlock)){
      return rawBlock;
    }
  }
  return '';
}

function guessUV(fileName, text){
  const f = fileName.toUpperCase(); const t = text.toUpperCase();
  return f.includes('UV') || f.includes('VARNISH') || f.includes('OPTIFLEX') || f.includes('FLEXO') || f.includes('SCREEN') || t.includes(' UV ');
}

function pickScore(hcodes){
  if(!hcodes.length) return 0;
  const scores = hcodes.map(h=> H_SCORE[h] ?? H_SCORE[h.split(' ')[0]] ).filter(v=>typeof v==='number');
  return scores.length ? Math.max(...scores) : 0;
}

// =================== TABLE & CALC ===================
function recalcRow(row){
  // HEALTH calculations
  updateExposureFactors(row);
  const distanceFactor = Number.isFinite(row.DIS) ? row.DIS : 0;
  const einal = MOVARISCH.calcEinal(row.I, distanceFactor);
  row.Einal = round(einal, 2);
  row.Rinal = round(MOVARISCH.calcRinal(row.SCORE, row.Einal), 2);
  row.Rcut  = round(MOVARISCH.calcRcute(row.SCORE, row.Ecut), 2);
  row.Rtot  = round(MOVARISCH.calcRcum(row.Rinal, row.Rcut), 2);
  const risk = classifyRisk(row.Rtot);
  row.Giudizio = risk.text;
  row.GiudizioClass = risk.id;

  // M.I.R.C. (INRS) SAFETY calculations
  if (!row.hcodesPhysical) row.hcodesPhysical = [];

  // Ensure M.I.R.C. parameters exist
  if (!Number.isFinite(row.A1)) row.A1 = defaults.A1;
  if (!Number.isFinite(row.A2)) row.A2 = defaults.A2;
  if (!Number.isFinite(row.B1)) row.B1 = defaults.B1;
  if (!Number.isFinite(row.B2)) row.B2 = defaults.B2;
  if (!Number.isFinite(row.B3)) row.B3 = defaults.B3;
  if (!Number.isFinite(row.B4)) row.B4 = defaults.B4;

  // Calculate M.I.R.C. indices
  row.D_mirc = MOVARISCH.calcMircD(row.A1, row.A2);
  row.E_mirc = MOVARISCH.calcMircE(row.B1, row.B2, row.B3, row.B4);
  row.IRC = round(MOVARISCH.calcMircIRC(row.D_mirc, row.E_mirc), 2);

  // Classify M.I.R.C. risk
  const mircRisk = MOVARISCH.classifyMircRisk(row.IRC);
  row.mircLevel = mircRisk.level;
  row.mircClass = mircRisk.class;
  row.mircText = mircRisk.text;

  // Overall risk (max of health Rtot and safety IRC)
  // Convert to comparable scale: use risk class index
  const healthRiskNumeric = row.Rtot;
  const safetyRiskNumeric = row.IRC;

  // Determine overall class (worst case between health and safety)
  const healthClass = RISK_CLASSES.findIndex(c => c.id === row.GiudizioClass);
  const safetyClass = RISK_CLASSES.findIndex(c => c.id === row.mircClass);
  const overallClassIndex = Math.max(healthClass, safetyClass);
  row.OverallClass = overallClassIndex >= 0 ? RISK_CLASSES[overallClassIndex].id : 'irr';
  row.OverallRiskValue = Math.max(healthRiskNumeric, safetyRiskNumeric);
}

function render(){
  console.log('🔄 render() chiamata - state.rows.length:', state.rows.length);
  const tb = document.querySelector('#tbl tbody');
  console.log('📋 tbody trovato:', tb);
  tb.innerHTML = '';
  state.rows.forEach((r,i)=>{
    console.log('➕ Creando riga', i, 'per:', r.file);
    console.log('📊 Dati completi riga:', JSON.stringify(r, null, 2));
    console.log('🔍 Campi chiave:', {
      file: r.file,
      nome: r.nome,
      statoFisico: r.statoFisico,
      hcodes: r.hcodes,
      SCORE: r.SCORE,
      sistema: r.sistema,
      controlType: r.controlType,
      exposureTime: r.exposureTime
    });
    try{
    recalcRow(r);
    if(!r.statoFisico){ r.statoFisico = defaults.statoFisico; }
    if(!r.qtyBand){
      applyQuantity(r, undefined);
    }else if(!r.qty){
      r.qty = getQuantityOption(r.qtyBand)?.label ?? r.qtyBand;
    }
    if(!r.sistema){
      applySistema(r, undefined);
    }
    if(!r.controlType){
      r.controlType = defaults.controlType;
    }
    if(!r.exposureTime){
      r.exposureTime = defaults.exposureTime;
    }
    const tr = document.createElement('tr');
    const sistemaOptions = buildOptions(SISTEMA_OPTIONS, r.sistema);
    const controlOptions = buildOptions(CONTROL_TYPE_OPTIONS, r.controlType);
    const exposureOptions = buildOptions(EXPOSURE_TIME_OPTIONS, r.exposureTime);
    const controlInfo = getControlOption(r.controlType);
    const exposureInfo = getExposureOption(r.exposureTime);
    const qtyOptions = buildOptions(QUANTITY_OPTIONS, r.qtyBand);
    const statoOptions = buildOptions(STATO_FISICO_OPTIONS, r.statoFisico);
    const contactOptions = buildOptions(CONTACT_LEVEL_OPTIONS, r.contactLevel);
    const distanceOptions = buildOptions(DISTANCE_OPTIONS, r.distanceBand);

    console.log('🔧 Options generate:', {
      statoOptions: statoOptions.substring(0, 100),
      sistemaOptions: sistemaOptions.substring(0, 100),
      controlOptions: controlOptions.substring(0, 100)
    });

    const controlTitle = t('table.tooltips.controlIndex', { index: controlInfo?.index ?? '-' });
    const exposureTitle = t('table.tooltips.exposureIndex', { index: exposureInfo?.index ?? '-' });
    const dTitle = t('table.tooltips.dIndex');
    const qTitle = t('table.tooltips.qIndex');
    const uTitle = t('table.tooltips.uIndex');
    const cTitle = t('table.tooltips.cIndex');
    const tTitle = t('table.tooltips.tIndex');
    const deleteLabel = t('table.actions.delete');

    tr.innerHTML = `
      <td>${escapeHtml(r.file)}</td>
      <td class="edit" data-field="nome" contenteditable>${escapeHtml(r.nome)}</td>
      <td><select data-stato>${statoOptions}</select></td>
      <td class="edit" data-field="hcodes" contenteditable>${escapeHtml(r.hcodes.join(';'))}</td>
      <td class="num edit" data-field="SCORE" contenteditable>${fmt(r.SCORE)}</td>
      <td><select data-sistema>${sistemaOptions}</select></td>
      <td><select data-controllo title="${escapeHtml(controlTitle)}">${controlOptions}</select></td>
      <td><select data-exposure title="${escapeHtml(exposureTitle)}">${exposureOptions}</select></td>
      <td><select data-qty>${qtyOptions}</select></td>
      <td><select data-contact>${contactOptions}</select></td>
      <td class="num" title="${escapeHtml(dTitle)}">${r.D}</td>
      <td class="num" title="${escapeHtml(qTitle)}">${r.Q}</td>
      <td class="num" title="${escapeHtml(uTitle)}">${r.U}</td>
      <td class="num" title="${escapeHtml(cTitle)}">${r.C}</td>
      <td class="num" title="${escapeHtml(tTitle)}">${r.T}</td>
      <td class="num">${fmt(r.I)}</td>
      <td><select data-distance>${distanceOptions}</select></td>
      <td class="num">${fmt(r.DIS)}</td>
      <td class="num">${fmt(r.Einal)}</td>
      <td class="num">${fmt(r.Ecut)}</td>
      <td class="num">${fmt(r.Rinal)}</td>
      <td class="num">${fmt(r.Rcut)}</td>
      <td class="num"><b>${fmt(r.Rtot)}</b></td>
      <td>${badge(r.Giudizio, r.GiudizioClass)}</td>
      <!-- M.I.R.C. (INRS) SAFETY COLUMNS -->
      <td class="edit" data-field="hcodesPhysical" contenteditable>${escapeHtml((r.hcodesPhysical || []).join(';'))}</td>
      <td class="num edit" data-field="quantitySafety" contenteditable>${fmt(r.quantitySafety)}</td>
      <td class="num edit" data-field="flashPoint" contenteditable>${fmt(r.flashPoint)}</td>
      <td class="num edit" data-field="A1" contenteditable>${fmt(r.A1)}</td>
      <td class="num edit" data-field="A2" contenteditable>${fmt(r.A2)}</td>
      <td class="num"><b>${fmt(r.D_mirc)}</b></td>
      <td class="num edit" data-field="B1" contenteditable>${fmt(r.B1)}</td>
      <td class="num edit" data-field="B2" contenteditable>${fmt(r.B2)}</td>
      <td class="num edit" data-field="B3" contenteditable>${fmt(r.B3)}</td>
      <td class="num edit" data-field="B4" contenteditable>${fmt(r.B4)}</td>
      <td class="num"><b>${fmt(r.E_mirc)}</b></td>
      <td class="num"><b>${fmt(r.IRC)}</b></td>
      <td>${badge(r.mircText, r.mircClass)}</td>
      <td class="num"><b>${badge(fmt(r.OverallRiskValue), r.OverallClass)}</b></td>
      <td><button class="btn" data-del="${i}" aria-label="${escapeHtml(deleteLabel)}">${escapeHtml(deleteLabel)}</button></td>`;

    tr.querySelectorAll('.edit').forEach((cell)=>{
      cell.addEventListener('input', ()=>{
        const field = cell.dataset.field;
        const value = cell.innerText.trim();
        if(field==='nome'){ r.nome = value; }
        else if(field==='hcodes'){ r.hcodes = value.split(';').map(s=>s.trim()).filter(Boolean); }
        else if(field==='SCORE'){
          const parsed = parseNumeric(value);
          if(isFinite(parsed)){
            r.SCORE = round(parsed, 2);
          }
          render();
        }
        // SAFETY FIELDS
        else if(field==='hcodesPhysical'){
          r.hcodesPhysical = value.split(';').map(s=>s.trim()).filter(Boolean);
          render();
        }
        else if(field==='quantitySafety'){
          const parsed = parseNumeric(value);
          r.quantitySafety = isFinite(parsed) ? parsed : null;
          render();
        }
        else if(field==='flashPoint'){
          const parsed = parseNumeric(value);
          r.flashPoint = isFinite(parsed) ? parsed : null;
          render();
        }
        // M.I.R.C. FIELDS
        else if(field==='A1'){
          const parsed = parseNumeric(value);
          r.A1 = isFinite(parsed) ? round(parsed, 2) : 0;
          render();
        }
        else if(field==='A2'){
          const parsed = parseNumeric(value);
          r.A2 = isFinite(parsed) ? round(parsed, 2) : 0;
          render();
        }
        else if(field==='B1'){
          const parsed = parseNumeric(value);
          r.B1 = isFinite(parsed) ? round(parsed, 2) : 0;
          render();
        }
        else if(field==='B2'){
          const parsed = parseNumeric(value);
          r.B2 = isFinite(parsed) ? round(parsed, 2) : 0;
          render();
        }
        else if(field==='B3'){
          const parsed = parseNumeric(value);
          r.B3 = isFinite(parsed) ? round(parsed, 2) : 0;
          render();
        }
        else if(field==='B4'){
          const parsed = parseNumeric(value);
          r.B4 = isFinite(parsed) ? round(parsed, 2) : 0;
          render();
        }
      });
    });

    tr.querySelector('[data-sistema]')?.addEventListener('change', (ev)=>{
      applySistema(r, ev.target.value);
      render();
    });

    tr.querySelector('[data-controllo]')?.addEventListener('change', (ev)=>{
      r.controlType = ev.target.value || defaults.controlType;
      render();
    });

    tr.querySelector('[data-exposure]')?.addEventListener('change', (ev)=>{
      r.exposureTime = ev.target.value || defaults.exposureTime;
      render();
    });

    tr.querySelector('[data-qty]')?.addEventListener('change', (ev)=>{
      applyQuantity(r, ev.target.value);
      render();
    });

    tr.querySelector('[data-stato]')?.addEventListener('change', (ev)=>{
      r.statoFisico = ev.target.value;
      render();
    });

    tr.querySelector('[data-contact]')?.addEventListener('change', (ev)=>{
      r.contactLevel = ev.target.value || defaults.contactLevel;
      render();
    });

    tr.querySelector('[data-distance]')?.addEventListener('change', (ev)=>{
      r.distanceBand = ev.target.value || defaults.distanceBand;
      render();
    });

    tr.querySelector('[data-del]')?.addEventListener('click',()=>{ state.rows.splice(i,1); render(); });
    tb.appendChild(tr);
    console.log('✅ Riga', i, 'aggiunta al DOM');
    }catch(err){
      console.error('❌ ERRORE creando riga', i, ':', err);
      console.error('Stack:', err.stack);
    }
  });
  document.querySelector('#exportBtn').disabled = state.rows.length===0;
  document.querySelector('#exportWordBtn').disabled = state.rows.length===0;
  document.querySelector('#cumulativeBtn').disabled = state.rows.length===0;
}

function badge(text, cls){
  const classes = {
    irr:'b-irr',
    unc:'b-unc',
    sup:'b-sup',
    elev:'b-elev',
    grave:'b-grave'
  };
  const css = classes[cls] || classes.irr;
  const safe = escapeHtml(text).replace(/\n/g, '<br/>');
  return `<span class="badge ${css}">${safe}</span>`;
}

function parseNumeric(value){
  if(value === null || value === undefined){ return NaN; }
  const normalized = String(value).replace(',', '.').trim();
  if(!normalized){ return NaN; }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}
function round(n,d=2){ const p=10**d; return Math.round(n*p)/p; }
function fmt(n){
  const num = Number.isFinite(n) ? n : 0;
  return (Math.round(num*100)/100).toFixed(2);
}
function classifyRisk(value){
  const r = isFinite(value) ? value : 0;
  const found = RISK_CLASSES.find(cls=>cls.test(r));
  if(found){ return found; }
  return RISK_CLASSES[0];
}
function escapeHtml(s){
  return String(s).replace(/[&<>'"]/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c] || c));
}

function buildOptions(options, selected){
  return options.map(opt=>{
    const text = (opt.showIndex && typeof opt.index === 'number')
      ? `${opt.label} (${t('options.indexLabel', { index: opt.index })})`
      : opt.label;
    return `<option value="${opt.value}"${opt.value===selected?' selected':''}>${text}</option>`;
  }).join('');
}

function getSistemaOption(value){ return SISTEMA_OPTIONS.find(opt=>opt.value===value); }
function getControlOption(value){ return CONTROL_TYPE_OPTIONS.find(opt=>opt.value===value); }
function getExposureOption(value){ return EXPOSURE_TIME_OPTIONS.find(opt=>opt.value===value); }
function getQuantityOption(value){ return QUANTITY_OPTIONS.find(opt=>opt.value===value); }
function getPropertyOption(value){ return STATO_FISICO_OPTIONS.find(opt=>opt.value===value); }
function getContactOption(value){ return CONTACT_LEVEL_OPTIONS.find(opt=>opt.value===value); }
function getDistanceOption(value){ return DISTANCE_OPTIONS.find(opt=>opt.value===value); }

function updateExposureFactors(row){
  const sistemaInfo = getSistemaOption(row.sistema) || getSistemaOption(defaults.sistema);
  const propInfo = getPropertyOption(row.statoFisico) || getPropertyOption(defaults.statoFisico);
  const qtyInfo = getQuantityOption(row.qtyBand) || getQuantityOption(defaults.qtyBand);
  const controlInfo = getControlOption(row.controlType) || getControlOption(defaults.controlType);
  const exposureInfo = getExposureOption(row.exposureTime) || getExposureOption(defaults.exposureTime);
  const contactInfo = getContactOption(row.contactLevel) || getContactOption(defaults.contactLevel);
  const distanceInfo = getDistanceOption(row.distanceBand) || getDistanceOption(defaults.distanceBand);

  row.sistema = sistemaInfo?.value ?? defaults.sistema;
  row.statoFisico = propInfo?.value ?? defaults.statoFisico;
  row.qtyBand = qtyInfo?.value ?? defaults.qtyBand;
  row.controlType = controlInfo?.value ?? defaults.controlType;
  row.exposureTime = exposureInfo?.value ?? defaults.exposureTime;
  row.contactLevel = contactInfo?.value ?? defaults.contactLevel;
  row.distanceBand = distanceInfo?.value ?? defaults.distanceBand;
  row.qty = row.qty || qtyInfo?.label || row.qtyBand;

  const usoIdx = sistemaInfo?.index ?? 0;
  const propIdx = propInfo?.index ?? 0;
  const qtyIdx = qtyInfo?.index ?? 0;
  const controlIdx = controlInfo?.index ?? 0;
  const timeIdx = exposureInfo?.index ?? 0;
  const contactIdx = contactInfo?.index ?? 0;
  const distance = Number.isFinite(distanceInfo?.d) ? distanceInfo.d : defaults.DIS;

  row.D = propIdx;
  row.Q = qtyIdx;
  row.U = usoIdx;
  row.C = controlIdx;
  row.T = timeIdx;
  row.contactIndex = contactIdx;
  row.DIS = round(distance, 2);

  const intensityIndex = MOVARISCH.calcI(row.D, row.Q, row.U, row.C);
  row.I = Number.isFinite(intensityIndex) ? intensityIndex : 0;

  const ecutMatrixRow = ECUT_MATRIX[usoIdx] || {};
  const ecutValue = ecutMatrixRow[contactIdx];
  const ecut = Number.isFinite(ecutValue) ? ecutValue : defaults.Ecut;
  row.Ecut = round(ecut, 2);
}

function applySistema(row, value){
  row.sistema = value || defaults.sistema;
  if(!row.qtyBand){
    row.qtyBand = defaults.qtyBand;
    row.qty = getQuantityOption(row.qtyBand)?.label ?? row.qtyBand;
  }
}

function applyQuantity(row, value){
  row.qtyBand = value || defaults.qtyBand;
  row.qty = getQuantityOption(row.qtyBand)?.label ?? row.qtyBand;
  if(!row.sistema){
    row.sistema = defaults.sistema;
  }
}

// =================== EXPORT EXCEL ===================
async function downloadBlob(blob, filename){
  if(window.navigator?.msSaveOrOpenBlob){
    window.navigator.msSaveOrOpenBlob(blob, filename);
    return;
  }
  const urlFactory = window.URL || window.webkitURL;
  if(urlFactory?.createObjectURL){
    const url = urlFactory.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>{ try{ urlFactory.revokeObjectURL(url); }catch(e){} }, 1200);
    return;
  }
  await new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const a = document.createElement('a');
        a.href = reader.result;
        a.download = filename;
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
        resolve();
      }catch(err){
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error || new Error(t('errors.blobDownload')));
    reader.readAsDataURL(blob);
  });
}

function rowsToCsv(rows){
  if(!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (val)=>{
    if(val===null || val===undefined) return '';
    const str = String(val).replace(/\r?\n/g,' ');
    return /[";,]/.test(str) ? '"'+str.replace(/"/g,'""')+'"' : str;
  };
  const lines = [headers.join(';')];
  for(const row of rows){
    lines.push(headers.map(h=>esc(row[h])).join(';'));
  }
  return lines.join('\r\n');
}

async function exportExcel(){
  let flatRows;
  try{
    if(!state.rows.length){
      showAlert(t('alerts.noRows'));
      return;
    }
    const XLSX = await ensureXlsx();
    if(!XLSX?.utils){
      throw new Error(t('errors.xlsxInvalid'));
    }
    flatRows = state.rows.map(r=>{
      const controlInfo = getControlOption(r.controlType);
      const exposureInfo = getExposureOption(r.exposureTime);
      const contactInfo = getContactOption(r.contactLevel);
      const distanceInfo = getDistanceOption(r.distanceBand);
      return {
        File:r.file,
        Nome_commerciale:r.nome,
        Stato_fisico: STATO_FISICO_OPTIONS.find(opt=>opt.value===r.statoFisico)?.label ?? r.statoFisico,
        Hcodes:r.hcodes.join(';'),
        SCORE:r.SCORE,
        Sistema: getSistemaOption(r.sistema)?.label ?? r.sistema,
        Tipologia_di_controllo: controlInfo?.label ?? r.controlType,
        Indice_tipologia_di_controllo: controlInfo?.index ?? '',
        Tempo_di_esposizione: exposureInfo?.label ?? r.exposureTime,
        Indice_tempo_di_esposizione: exposureInfo?.index ?? '',
        Quantità_in_uso: getQuantityOption(r.qtyBand)?.label ?? r.qty,
        Indice_quantità:r.Q ?? '',
        Livello_di_contatto: contactInfo?.label ?? r.contactLevel,
        Indice_livello_di_contatto: r.contactIndex ?? '',
        Indice_D:r.D,
        Indice_Q:r.Q,
        Indice_U:r.U,
        Indice_C:r.C,
        Indice_T:r.T,
        Indice_I:r.I,
        Distanza_operatore_sorgente: distanceInfo?.label ?? r.distanceBand,
        Valore_d:r.DIS,
        E_inal:r.Einal,
        Ecut:r.Ecut,
        R_inal:r.Rinal,
        R_cut:r.Rcut,
        R_tot:r.Rtot,
        Giudizio:r.Giudizio,
        // M.I.R.C. (INRS) SAFETY FIELDS
        Hcodes_Fisici:(r.hcodesPhysical || []).join(';'),
        Quantita_Sicurezza_kg_l:r.quantitySafety ?? '',
        Punto_Infiammabilita_C:r.flashPoint ?? '',
        A1_Danno_Salute:r.A1 ?? 0,
        A2_Danno_Sicurezza:r.A2 ?? 0,
        D_Danno_Totale:r.D_mirc ?? 0,
        B1_Quantita:r.B1 ?? 0,
        B2_Frequenza:r.B2 ?? 0,
        B3_Ventilazione:r.B3 ?? 0,
        B4_DPI:r.B4 ?? 0,
        E_Esposizione:r.E_mirc ?? 0,
        IRC_Indice_Rischio:r.IRC ?? 0,
        Giudizio_Sicurezza:r.mircText ?? '',
        Rischio_Complessivo:r.OverallRiskValue
      };
    });
    const ws = XLSX.utils.json_to_sheet(flatRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MOVARISCH');
    // Fallback robusto via Blob per ambienti con CSP restrittive
    const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' });
    const blob = new Blob([wbout], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    await downloadBlob(blob, 'MOVARISCH_autoestratto.xlsx');
  } catch(err){
    console.error(err);
    if(flatRows?.length){
      try{
        const csv = rowsToCsv(flatRows);
        const csvBlob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
        await downloadBlob(csvBlob, 'MOVARISCH_autoestratto.csv');
        const detail = describeError(err);
        showAlert(t('alerts.excelFallback', { error: detail }));
        return;
      }catch(csvErr){
        console.error(csvErr);
      }
    }
    showAlert(t('errors.excelExport', { error: describeError(err) }));
  }
}

async function exportWord(){
  try{
    if(!state.rows.length){
      showAlert(t('alerts.noRows'));
      return;
    }

    // Assicurati che i18n sia inizializzato prima di procedere
    if(!window.i18n || !window.i18n.isReady || !window.i18n.isReady()){
      showAlert('Le traduzioni non sono ancora caricate. Attendi un momento e riprova. / Translations not loaded yet. Please wait a moment and try again.');
      return;
    }

    const docx = await ensureDocx();
    if(!docx){
      throw new Error(t('errors.docxInvalid'));
    }

    const { Document, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle, ShadingType, VerticalAlign } = docx;

    // Helper per ottenere il colore in base alla classe di rischio
    function getRiskColor(giudizioClass){
      switch(giudizioClass){
        case 'irr': return '00FF00'; // Verde
        case 'unc': return 'FFFF00'; // Giallo
        case 'sup': return 'FFA500'; // Arancione
        case 'elev': return 'FF0000'; // Rosso
        case 'grave': return '8B0000'; // Rosso scuro
        default: return 'FFFFFF'; // Bianco
      }
    }

    // Crea sezioni per ogni riga
    const docLabels = {
      summary: t('doc.summary'),
      exposure: t('doc.exposure'),
      method: t('doc.method'),
      fields: {
        file: t('doc.fields.file'),
        tradeName: t('doc.fields.tradeName'),
        physicalState: t('doc.fields.physicalState'),
        hCodes: t('doc.fields.hCodes'),
        score: t('doc.fields.score'),
        system: t('doc.fields.system'),
        control: t('doc.fields.control'),
        controlIndex: t('doc.fields.controlIndex'),
        exposure: t('doc.fields.exposure'),
        exposureIndex: t('doc.fields.exposureIndex'),
        quantity: t('doc.fields.quantity'),
        quantityIndex: t('doc.fields.quantityIndex'),
        contact: t('doc.fields.contact'),
        contactIndex: t('doc.fields.contactIndex'),
        dIndex: t('doc.fields.dIndex'),
        uIndex: t('doc.fields.uIndex'),
        tIndex: t('doc.fields.tIndex'),
        iIndex: t('doc.fields.iIndex'),
        distance: t('doc.fields.distance'),
        distanceValue: t('doc.fields.distanceValue'),
        eInal: t('doc.fields.eInal'),
        eCut: t('doc.fields.eCut'),
        rInal: t('doc.fields.rInal'),
        rCut: t('doc.fields.rCut'),
        rTot: t('doc.fields.rTot'),
        final: t('doc.fields.final'),
        // M.I.R.C. (INRS) SAFETY FIELDS
        hCodesPhysical: t('doc.fields.hCodesPhysical'),
        quantitySafety: t('doc.fields.quantitySafety'),
        flashPoint: t('doc.fields.flashPoint'),
        A1: t('doc.fields.A1'),
        A2: t('doc.fields.A2'),
        D_mirc: t('doc.fields.D_mirc'),
        B1: t('doc.fields.B1'),
        B2: t('doc.fields.B2'),
        B3: t('doc.fields.B3'),
        B4: t('doc.fields.B4'),
        E_mirc: t('doc.fields.E_mirc'),
        IRC: t('doc.fields.IRC'),
        safetyLevel: t('doc.fields.safetyLevel'),
        overallRisk: t('doc.fields.overallRisk')
      }
    };

    const sections = state.rows.map((r, index) => {
      const controlInfo = getControlOption(r.controlType);
      const exposureInfo = getExposureOption(r.exposureTime);
      const contactInfo = getContactOption(r.contactLevel);
      const distanceInfo = getDistanceOption(r.distanceBand);

      // Dati della tabella (Campo | Valore)
      const tableData = [
        [docLabels.fields.file, r.file || ''],
        [docLabels.fields.tradeName, r.nome || ''],
        [docLabels.fields.physicalState, STATO_FISICO_OPTIONS.find(opt=>opt.value===r.statoFisico)?.label ?? r.statoFisico],
        [docLabels.fields.hCodes, r.hcodes.join('; ')],
        [docLabels.fields.score, String(r.SCORE ?? '')],
        [docLabels.fields.system, getSistemaOption(r.sistema)?.label ?? r.sistema],
        [docLabels.fields.control, controlInfo?.label ?? r.controlType],
        [docLabels.fields.controlIndex, String(controlInfo?.index ?? '')],
        [docLabels.fields.exposure, exposureInfo?.label ?? r.exposureTime],
        [docLabels.fields.exposureIndex, String(exposureInfo?.index ?? '')],
        [docLabels.fields.quantity, getQuantityOption(r.qtyBand)?.label ?? r.qty],
        [docLabels.fields.quantityIndex, String(r.Q ?? '')],
        [docLabels.fields.contact, contactInfo?.label ?? r.contactLevel],
        [docLabels.fields.contactIndex, String(r.contactIndex ?? '')],
        [docLabels.fields.dIndex, String(r.D ?? '')],
        [docLabels.fields.uIndex, String(r.U ?? '')],
        [docLabels.fields.tIndex, String(r.T ?? '')],
        [docLabels.fields.iIndex, String(r.I ?? '')],
        [docLabels.fields.distance, distanceInfo?.label ?? r.distanceBand],
        [docLabels.fields.distanceValue, String(r.DIS ?? '')],
        [docLabels.fields.eInal, String(r.Einal ?? '')],
        [docLabels.fields.eCut, String(r.Ecut ?? '')],
        [docLabels.fields.rInal, String(r.Rinal ?? '')],
        [docLabels.fields.rCut, String(r.Rcut ?? '')],
        [docLabels.fields.rTot, String(r.Rtot ?? '')],
        // M.I.R.C. (INRS) SAFETY FIELDS
        [docLabels.fields.hCodesPhysical, (r.hcodesPhysical || []).join('; ')],
        [docLabels.fields.quantitySafety, String(r.quantitySafety ?? '')],
        [docLabels.fields.flashPoint, String(r.flashPoint ?? '')],
        [docLabels.fields.A1, String(r.A1 ?? 0)],
        [docLabels.fields.A2, String(r.A2 ?? 0)],
        [docLabels.fields.D_mirc, String(r.D_mirc ?? 0)],
        [docLabels.fields.B1, String(r.B1 ?? 0)],
        [docLabels.fields.B2, String(r.B2 ?? 0)],
        [docLabels.fields.B3, String(r.B3 ?? 0)],
        [docLabels.fields.B4, String(r.B4 ?? 0)],
        [docLabels.fields.E_mirc, String(r.E_mirc ?? 0)],
        [docLabels.fields.IRC, String(r.IRC ?? 0)],
        [docLabels.fields.overallRisk, String(r.OverallRiskValue ?? 0)]
      ];

      // Crea righe della tabella
      const tableRows = tableData.map(([campo, valore]) => {
        return new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: campo, bold: true })],
                alignment: AlignmentType.LEFT
              })],
              width: { size: 45, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: valore })],
                alignment: AlignmentType.LEFT
              })],
              width: { size: 55, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER
            })
          ]
        });
      });

      // Aggiungi righe finali per i giudizi con sfondo colorato

      // GIUDIZIO SALUTE
      const healthRiskColor = getRiskColor(r.GiudizioClass);
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: 'Giudizio SALUTE', bold: true })],
                alignment: AlignmentType.LEFT
              })],
              width: { size: 45, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: r.Giudizio || '', bold: true, color: '000000' })],
                alignment: AlignmentType.LEFT
              })],
              width: { size: 55, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              shading: {
                type: ShadingType.SOLID,
                color: healthRiskColor,
                fill: healthRiskColor
              }
            })
          ]
        })
      );

      // GIUDIZIO SICUREZZA (M.I.R.C.)
      const safetyRiskColor = getRiskColor(r.mircClass || 'irr');
      const safetyLevelText = r.mircText || 'RISCHIO IRRILEVANTE';
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: 'Giudizio SICUREZZA (M.I.R.C.)', bold: true })],
                alignment: AlignmentType.LEFT
              })],
              width: { size: 45, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: safetyLevelText, bold: true, color: '000000' })],
                alignment: AlignmentType.LEFT
              })],
              width: { size: 55, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              shading: {
                type: ShadingType.SOLID,
                color: safetyRiskColor,
                fill: safetyRiskColor
              }
            })
          ]
        })
      );

      // RISCHIO COMPLESSIVO (max tra salute e sicurezza)
      const overallRiskColor = getRiskColor(r.OverallClass || r.GiudizioClass);
      const overallText = `RISCHIO COMPLESSIVO: ${r.OverallRiskValue ? r.OverallRiskValue.toFixed(2) : '-'}`;
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: 'Giudizio FINALE (Complessivo)', bold: true, size: 24 })],
                alignment: AlignmentType.LEFT
              })],
              width: { size: 45, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: overallText, bold: true, color: 'FFFFFF', size: 28 })],
                alignment: AlignmentType.CENTER
              })],
              width: { size: 55, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              shading: {
                type: ShadingType.SOLID,
                color: overallRiskColor,
                fill: overallRiskColor
              }
            })
          ]
        })
      );

      // Crea la tabella
      const table = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      });

      // Crea i paragrafi per questa sezione
      const children = [
        new Paragraph({
          children: [new TextRun({
            text: docLabels.summary,
            bold: true,
            size: 28
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({
            text: docLabels.exposure,
            bold: true,
            size: 24
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({
            text: docLabels.method,
            size: 20
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        table
      ];

      // Aggiungi page break tra le sezioni (tranne l'ultima)
      if(index < state.rows.length - 1){
        children.push(new Paragraph({ pageBreakBefore: true }));
      }

      return children;
    });

    // Crea il documento con tutte le sezioni
    const doc = new Document({
      sections: [{
        properties: {},
        children: sections.flat()
      }]
    });

    // Genera il file
    const blob = await docx.Packer.toBlob(doc);
    await downloadBlob(blob, 'MOVARISCH_autoestratto.docx');

  } catch(err){
    console.error(err);
    showAlert(t('errors.wordExport', { error: describeError(err) }));
  }
}

// =================== EVENTS ===================
const pdfInput = document.querySelector('#pdfInput');
const parseBtn = document.querySelector('#parseBtn');
const exportBtn = document.querySelector('#exportBtn');
const exportWordBtn = document.querySelector('#exportWordBtn');
const clearBtn = document.querySelector('#clearBtn');
const testBtn = document.querySelector('#testBtn');

pdfInput.addEventListener('change', (e)=>{
  state.files = Array.from(e.target.files||[]);
  parseBtn.disabled = state.files.length===0;
});

parseBtn.addEventListener('click', async ()=>{
  if(!state.files.length) return;
  clearAlert();
  state.rows = [];
  try{
    for(const file of state.files){
      const text = await pdfToText(file);
      let allHCodes = findH(text);
      if(!allHCodes.length && guessUV(file.name, text)) allHCodes = UV_FALLBACK.slice();

      // Separa H-codes in salute vs fisici
      const separated = separateHCodes(allHCodes);
      const hcodesHealth = separated.health;
      const hcodesPhysical = separated.physical;

      // Calcola score salute (solo da H-codes salute)
      let score = hcodesHealth.length ? pickScore(hcodesHealth) : 0;

      // Estrai proprietà fisico-chimiche per sicurezza
      const flashPoint = extractFlashPoint(text);
      const autoIgnitionTemp = extractAutoIgnitionTemp(text);

      const productName = extractProductName(text) || file.name.replace(/\.pdf$/i, '');

      // Pulizia nome commerciale
      let cleanedProductName = productName;
      if (cleanedProductName) {
        cleanedProductName = cleanedProductName
          .replace(/^commerciale:\s*/i, '')                    // Rimuove "commerciale:"
          .replace(/\s*\(Segue da pagina \d+\)/gi, '')         // Rimuove "(Segue da pagina X)"
          .trim();
      }

      // Log per debug (visibile in console)
      console.log(`[${file.name}] EXTRACTION:`, {
        healthCodes: hcodesHealth,
        physicalCodes: hcodesPhysical,
        flashPoint: flashPoint ? `${flashPoint}°C` : 'non trovato',
        autoIgnitionTemp: autoIgnitionTemp ? `${autoIgnitionTemp}°C` : 'non trovato'
      });

      const row = {
        // HEALTH fields
        file: file.name,
        nome: cleanedProductName,
        statoFisico: defaults.statoFisico,
        hcodes: hcodesHealth, // Solo H-codes salute
        SCORE: score,
        sistema: defaults.sistema,
        controlType: defaults.controlType,
        exposureTime: defaults.exposureTime,
        qtyBand: defaults.qtyBand,
        qty: getQuantityOption(defaults.qtyBand)?.label ?? defaults.qtyBand,
        contactLevel: defaults.contactLevel,
        distanceBand: defaults.distanceBand,
        D: 0, Q:0, U: 0, C: 0, T:0,
        I: 0,
        DIS: defaults.DIS, Ecut: defaults.Ecut,
        Einal: 0, Rinal: 0, Rcut: 0, Rtot: 0, Giudizio: '', GiudizioClass: '',

        // SAFETY fields (auto-popolati)
        hcodesPhysical: hcodesPhysical, // H-codes fisici estratti
        flashPoint: flashPoint, // Estratto da Sezione 9
        autoIgnitionTemp: autoIgnitionTemp, // Estratto da Sezione 9
        operatingTemp: defaults.operatingTemp,
        quantitySafety: defaults.quantitySafety,
        systemTypeSafety: defaults.systemTypeSafety,
        ventilation: defaults.ventilation,
        openFlames: defaults.openFlames,
        ignitionSources: defaults.ignitionSources,
        PI: 10, IQ: 1, FCO: 1.0,
        RiskSafety: 10, SafetyLevel: 'basso', SafetyClass: 'irr',
        OverallRiskValue: 0, OverallClass: 'irr'
      };
      state.rows.push(row);
      console.log('✅ Riga aggiunta a state.rows. Totale righe:', state.rows.length);
    }
    console.log('🎯 Estrazione completata. Chiamo render() con', state.rows.length, 'righe');
    render();
  }catch(err){
    showAlert(t('errors.pdfParse', { error: describeError(err) }));
  }
});

exportBtn.addEventListener('click', exportExcel);
exportWordBtn.addEventListener('click', exportWord);
clearBtn.addEventListener('click', ()=>{ state.rows=[]; render(); clearAlert(); });

// Scheda Cumulativa - salva dati in localStorage prima di aprire
document.querySelector('#cumulativeBtn').addEventListener('click', ()=>{
  try{
    console.log('🔵 CLICK Scheda Cumulativa');
    console.log('🔵 state.rows PRIMA del salvataggio:', state.rows);
    console.log('🔵 state.rows.length:', state.rows.length);

    // Salva tutti i dati della tabella in localStorage
    const dataToSave = {
      rows: state.rows,
      timestamp: new Date().toISOString(),
      count: state.rows.length
    };

    console.log('🔵 Dati DA SALVARE in localStorage:', dataToSave);

    // CANCELLA vecchi dati prima di salvare nuovi (evita contaminazione)
    localStorage.removeItem('movarisch_cumulative_data');
    console.log('🔵 Vecchi dati cancellati da localStorage');

    // Salva i nuovi dati
    localStorage.setItem('movarisch_cumulative_data', JSON.stringify(dataToSave));

    // Verifica immediatamente cosa è stato salvato
    const verificaSalvato = localStorage.getItem('movarisch_cumulative_data');
    console.log('🔵 Verifica DOPO salvataggio - localStorage contiene:', verificaSalvato);
    console.log('🔵 Verifica PARSED:', JSON.parse(verificaSalvato));

    // Apri la scheda cumulativa con timestamp per evitare cache
    const timestamp = new Date().getTime();
    const url = `cumulative-report.html?t=${timestamp}`;
    console.log('🔵 Apertura finestra:', url);
    window.open(url, '_blank');
  }catch(err){
    console.error('❌ ERRORE salvataggio dati cumulativi:', err);
    console.error('❌ Stack:', err.stack);
    showAlert('Errore nel caricamento della scheda cumulativa');
  }
});

if(window.i18n && typeof window.i18n.onChange === 'function'){
  window.i18n.onChange(()=>{ render(); });
}else{
  window.addEventListener('i18n:change', ()=>{ render(); });
}
