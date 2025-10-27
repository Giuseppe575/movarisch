// =================== CONFIG ===================
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
const UV_FALLBACK = ["H317","H335"]; // per UV/acrilati quando H non rilevate
const REGEX_H = /(EUH\d{3}|H\d{3})(?:\s*cat\.?\s*(1A|1B|1|2))?/gi;

const SISTEMA_OPTIONS = [
  { value:'chiuso', label:'Sistema chiuso', index:1, showIndex:true },
  { value:'matrice', label:'Inclusione in matrice', index:2, showIndex:true },
  { value:'controllato', label:'Uso controllato', index:3, showIndex:true },
  { value:'dispersivo', label:'Uso dispersivo', index:4, showIndex:true },
];

const CONTROL_TYPE_OPTIONS = [
  { value:'contenimento_completo', label:'Contenimento completo', index:1, showIndex:true },
  { value:'aspirazione_localizzata', label:'Ventilazione localizzata', index:2, showIndex:true },
  { value:'segregazione_separazione', label:'Segregazione / separazione', index:3, showIndex:true },
  { value:'ventilazione_generale', label:'Ventilazione generale', index:4, showIndex:true },
  { value:'manipolazione_diretta', label:'Manipolazione diretta', index:5, showIndex:true },
];

const EXPOSURE_TIME_OPTIONS = [
  { value:'lt_15', label:'< 15 minuti', index:1, showIndex:true },
  { value:'15_120', label:'15 minuti – 2 ore', index:2, showIndex:true },
  { value:'120_240', label:'2 – 4 ore', index:3, showIndex:true },
  { value:'240_360', label:'4 – 6 ore', index:4, showIndex:true },
  { value:'gt_360', label:'> 6 ore', index:5, showIndex:true },
];

const QUANTITY_OPTIONS = [
  { value:'lt_0_1', label:'< 0,1 kg', index:1, showIndex:true },
  { value:'0_1_1', label:'0,1 – 1 kg', index:2, showIndex:true },
  { value:'1_10', label:'1 – 10 kg', index:3, showIndex:true },
  { value:'10_100', label:'10 – 100 kg', index:4, showIndex:true },
  { value:'gt_100', label:'> 100 kg', index:5, showIndex:true },
];

const STATO_FISICO_OPTIONS = [
  { value:'solido_nebbia', label:'Solido / nebbie grossolane', index:1 },
  { value:'liquido_bassa', label:'Liquido a bassa volatilità', index:2 },
  { value:'liquido_media_alta', label:'Liquido a media/alta volatilità o polveri fini', index:3 },
  { value:'gas', label:'Stato gassoso', index:4 },
];

const CONTACT_LEVEL_OPTIONS = [
  { value:'nessun_contatto', label:'Nessun contatto', index:1 },
  { value:'accidentale', label:'Accidentale', index:2 },
  { value:'discontinuo', label:'Discontinuo', index:3 },
  { value:'esteso', label:'Esteso', index:4 },
];

const DISTANCE_OPTIONS = [
  { value:'lt_1', label:'< 1 m (d = 1.00)', d:1.0 },
  { value:'1_3', label:'1 – 3 m (d = 0.75)', d:0.75 },
  { value:'3_5', label:'3 – 5 m (d = 0.50)', d:0.50 },
  { value:'5_10', label:'5 – 10 m (d = 0.25)', d:0.25 },
  { value:'ge_10', label:'≥ 10 m (d = 0.10)', d:0.10 },
];

const ECUT_MATRIX = {
  1: { 1:1, 2:1, 3:3, 4:7 }, // Sistema chiuso
  2: { 1:1, 2:3, 3:3, 4:7 }, // Inclusione in matrice
  3: { 1:1, 2:3, 3:7, 4:10 }, // Uso controllato
  4: { 1:1, 2:7, 3:7, 4:10 }, // Uso dispersivo
};

const defaults = {
  sistema:'controllato',
  controlType:'aspirazione_localizzata',
  exposureTime:'15_120',
  qtyBand:'1_10',
  statoFisico:'liquido_media_alta',
  contactLevel:'nessun_contatto',
  distanceBand:'1_3',
  DIS:0.75,
  Ecut:1.0
};

const MOVARISCH = window.movarischLib || {};

if (
  typeof MOVARISCH.calcI !== 'function' ||
  typeof MOVARISCH.calcEinal !== 'function' ||
  typeof MOVARISCH.calcRinal !== 'function' ||
  typeof MOVARISCH.calcRcute !== 'function' ||
  typeof MOVARISCH.calcRcum !== 'function'
) {
  throw new Error('Libreria MOVARISCH non caricata: funzioni di calcolo mancanti.');
}

const RISK_CLASSES = [
  {
    id:'irr',
    test:(r)=> r < 15,
    text:'Irrilevante per la salute'
  },
  {
    id:'unc',
    test:(r)=> r >= 15 && r < 21,
    text:'Intervallo di incertezza\nE\u2019 necessario, prima della classificazione in rischio irrilevante per la salute, rivedere con scrupolo l\u2019assegnazione dei vari punteggi, rivedere le misure di prevenzione e protezione adottate e consultare il medico competente per la decisione finale.'
  },
  {
    id:'sup',
    test:(r)=> r >= 21 && r <= 40,
    text:'Rischio superiore al rischio chimico irrilevante per la salute\nApplicare gli articoli 225, 226, 229 e 230 D. Lgs 81/08 e s.m.i.'
  },
  {
    id:'elev',
    test:(r)=> r > 40 && r <= 80,
    text:'Rischio elevato'
  },
  {
    id:'grave',
    test:(r)=> r > 80,
    text:'Rischio grave\nRiconsiderare il percorso dell\u2019identificazione delle misure di prevenzione e protezione ai fini di una loro eventuale implementazione. Intensificare i controlli quali la sorveglianza sanitaria, la misurazione degli agenti chimici e la periodicità della manutenzione.'
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
      reject(err || new Error('Impossibile caricare '+src));
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
    throw lastErr || new Error('Impossibile caricare la libreria Excel (SheetJS).');
  }
  return window.XLSX;
}

async function ensurePdfJs(){
  if(window.pdfjsLib){ return window.pdfjsLib; }
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
  if(!window.pdfjsLib){ throw new Error('Impossibile caricare PDF.js. Verifica la connessione o le policy di rete.'); }
  try{ window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'; }catch(e){}
  return window.pdfjsLib;
}

// =================== PDF TEXT EXTRACTION ===================
function readAsArrayBuffer(file){
  return new Promise((resolve, reject)=>{
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error || new Error('Impossibile leggere il file'));
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
  updateExposureFactors(row);
  const timeFactor = Number.isFinite(row.T) ? row.T : 0;
  const distanceFactor = Number.isFinite(row.DIS) ? row.DIS : 0;
  const einal = MOVARISCH.calcEinal(row.I, timeFactor, distanceFactor);
  row.Einal = round(einal, 2);
  row.Rinal = round(MOVARISCH.calcRinal(row.SCORE, row.Einal), 2);
  row.Rcut  = round(MOVARISCH.calcRcute(row.SCORE, row.Ecut), 2);
  row.Rtot  = round(MOVARISCH.calcRcum(row.Rinal, row.Rcut), 2);
  const risk = classifyRisk(row.Rtot);
  row.Giudizio = risk.text;
  row.GiudizioClass = risk.id;
}

function render(){
  const tb = document.querySelector('#tbl tbody');
  tb.innerHTML = '';
  state.rows.forEach((r,i)=>{
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

    tr.innerHTML = `
      <td>${escapeHtml(r.file)}</td>
      <td class="edit" data-field="nome" contenteditable>${escapeHtml(r.nome)}</td>
      <td><select data-stato>${statoOptions}</select></td>
      <td class="edit" data-field="hcodes" contenteditable>${escapeHtml(r.hcodes.join(';'))}</td>
      <td class="num edit" data-field="SCORE" contenteditable>${fmt(r.SCORE)}</td>
      <td><select data-sistema>${sistemaOptions}</select></td>
      <td><select data-controllo title="Indice ${controlInfo?.index ?? '-'}">${controlOptions}</select></td>
      <td><select data-exposure title="Indice ${exposureInfo?.index ?? '-'}">${exposureOptions}</select></td>
      <td><select data-qty>${qtyOptions}</select></td>
      <td><select data-contact>${contactOptions}</select></td>
      <td class="num" title="Indice proprietà chimico-fisiche (D)">${r.D}</td>
      <td class="num" title="Indice quantità in uso (Q)">${r.Q}</td>
      <td class="num" title="Indice tipologia d'uso (U)">${r.U}</td>
      <td class="num" title="Indice tipologia di controllo (C)">${r.C}</td>
      <td class="num" title="Indice tempo di esposizione (T)">${r.T}</td>
      <td class="num">${fmt(r.I)}</td>
      <td><select data-distance>${distanceOptions}</select></td>
      <td class="num">${fmt(r.DIS)}</td>
      <td class="num">${fmt(r.Einal)}</td>
      <td class="num">${fmt(r.Ecut)}</td>
      <td class="num">${fmt(r.Rinal)}</td>
      <td class="num">${fmt(r.Rcut)}</td>
      <td class="num"><b>${fmt(r.Rtot)}</b></td>
      <td>${badge(r.Giudizio, r.GiudizioClass)}</td>
      <td><button class="btn" data-del="${i}">x</button></td>`;

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
  });
  document.querySelector('#exportBtn').disabled = state.rows.length===0;
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
function escapeHtml(s){ return String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;","\u003e":"&gt;"}[c]||c)); }

function buildOptions(options, selected){
  return options.map(opt=>{
    const text = (opt.showIndex && typeof opt.index === 'number')
      ? `${opt.label} (Indice ${opt.index})`
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
    reader.onerror = () => reject(reader.error || new Error('Browser non supporta download di Blob.'));
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
      showAlert('Nessun dato da esportare. Carica o genera prima delle righe.');
      return;
    }
    const XLSX = await ensureXlsx();
    if(!XLSX?.utils){
      throw new Error('Libreria SheetJS caricata ma priva delle utilità attese.');
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
        Giudizio:r.Giudizio
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
        showAlert('Export Excel non disponibile. È stato generato un CSV di fallback. Dettaglio: ' + (err && err.message ? err.message : err));
        return;
      }catch(csvErr){
        console.error(csvErr);
      }
    }
    showAlert('Export Excel fallito: ' + (err && err.message ? err.message : err));
  }
}

// =================== EVENTS ===================
const pdfInput = document.querySelector('#pdfInput');
const parseBtn = document.querySelector('#parseBtn');
const exportBtn = document.querySelector('#exportBtn');
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
      let hcodes = findH(text);
      if(!hcodes.length && guessUV(file.name, text)) hcodes = UV_FALLBACK.slice();
      let score = hcodes.length ? pickScore(hcodes) : 0;
      const productName = extractProductName(text) || file.name.replace(/\.pdf$/i, '');
      const row = {
        file: file.name,
        nome: productName,
        statoFisico: defaults.statoFisico,
        hcodes,
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
        Einal: 0, Rinal: 0, Rcut: 0, Rtot: 0, Giudizio: '', GiudizioClass: ''
      };
      state.rows.push(row);
    }
    render();
  }catch(err){
    showAlert('Errore durante il parsing PDF: '+ (err && err.message ? err.message : err));
  }
});

exportBtn.addEventListener('click', exportExcel);
clearBtn.addEventListener('click', ()=>{ state.rows=[]; render(); clearAlert(); });

// =================== TEST CASE ===================
const TEST_PDF_BASE64 = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHMgWzIgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAxIDAgUi9NZWRpYUJveFswIDAgNTk1IDg0Ml0vUmVzb3VyY2VzPDwvUHJvY1svUERGIC9UZXh0XSA+Pi9Db250ZW50cyAzIDAgUj4+CmVuZG9iajozIDAgb2JqCjw8L0xlbmd0aCAxMTM+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCA3MDAgVGQKKC9IQzMxNyBjYXQuMUIgSDMzNSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDA5NjMgMDAwMDAgbg0KMDAwMDAwMDEzNiAwMDAwMCBuDQowMDAwMDAwMjc0IDAwMDAwIG4NCnRyYWlsZXIKPDwvU2l6ZSA0IC9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjM5OQolJUVPRgo=';

async function runTest(){
  clearAlert();
  try{
    await ensurePdfJs();
    const bin = atob(TEST_PDF_BASE64);
    const bytes = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    const testFile = new File([bytes], 'TEST_H317_H335.pdf', {type:'application/pdf'});
    const text = await pdfToText(testFile);
    const productName = extractProductName(text) || 'Esempio – Test Parser';
    const h = findH(text);
    state.rows = [{
      file: testFile.name,
      nome: productName,
      statoFisico: defaults.statoFisico,
      hcodes: h,
      SCORE: pickScore(h),
      sistema: defaults.sistema,
      controlType: defaults.controlType,
      exposureTime: defaults.exposureTime,
      qtyBand: defaults.qtyBand,
      qty: getQuantityOption(defaults.qtyBand)?.label ?? defaults.qtyBand,
      contactLevel: defaults.contactLevel,
      distanceBand: defaults.distanceBand,
      D: 0, Q:0, U: 0, C: 0, T:0,
      I: 0, DIS: defaults.DIS, Ecut: defaults.Ecut,
      Einal:0,Rinal:0,Rcut:0,Rtot:0,Giudizio:'', GiudizioClass:''
    }];
    render();
    showAlert('Test eseguito: libreria PDF.js caricata e parsing OK. H trovate: '+h.join('; '));
  }catch(e){
    showAlert('Test fallito: '+(e && e.message ? e.message : e));
  }
}

document.querySelector('#testBtn').addEventListener('click', runTest);
