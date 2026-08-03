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

// =================== HEALTH HAZARD SCORES (P MoVaRisCh) ===================
// Punteggi P aggiornati a MoVaRisCh 2026 (28/02/2026) e D.Lgs. 135/2024.
// ESCLUSE dal calcolo P:
//   - Cancerogeni/Mutageni cat. 1A/1B (H350, H350i, H340) -> Titolo IX Capo II
//   - Reprotossici cat. 1A/1B (H360 e varianti)            -> Titolo IX Capo II (D.Lgs. 135/2024)
// INCLUSE nel calcolo P (Titolo IX Capo I, art. 223):
//   - Cancerogeni/Mutageni cat. 2 (H351, H341)
//   - Reprotossici cat. 2 (H361 e varianti) - non coperti da D.Lgs. 135/2024
//   - Effetti su allattamento (H362)
const H_SCORE = (() => {
  const rows = window.MoVaRisChHealth2026?.HEALTH_SCORE_ROWS || [];
  return Object.fromEntries(rows.map(row => [
    row.code + (row.category ? ` cat.${row.category}` : ''),
    row.score
  ]));
})();

// =================== CMR FLAG (D.Lgs. 135/2024) ===================
// Frasi H che identificano sostanze da valutare ex Titolo IX Capo II:
// cancerogeni/mutageni cat. 1A/1B + reprotossiche cat. 1A/1B.
// Queste NON contribuiscono al calcolo P MoVaRisCh ma vengono SEGNALATE
// nel report perché richiedono valutazione separata (art. 234 e seg.).
const H_CMR_CODES = new Set([
  // Cancerogeni cat. 1A/1B
  'H350', 'H350I',
  // Mutageni cat. 1A/1B
  'H340',
  // Reprotossici cat. 1A/1B (D.Lgs. 135/2024)
  'H360', 'H360D', 'H360F', 'H360FD', 'H360DF', 'H360FD', 'H360DF'
]);
// Nota: H360 varianti normalizzate in upper case sopra. Riempiamo con tutti
// i casing reali che possono arrivare dalle SDS:
['H360', 'H360D', 'H360F', 'H360FD', 'H360Df', 'H360Fd', 'H360fD', 'H350', 'H350i', 'H340']
  .forEach(c => H_CMR_CODES.add(c.toUpperCase()));

function isCmrSubstance(hcodes){
  if(!Array.isArray(hcodes) || !hcodes.length) return false;
  return hcodes.some(h => {
    const base = (h || '').toString().split(' ')[0].toUpperCase();
    return H_CMR_CODES.has(base);
  });
}

function getCmrCodes(hcodes){
  if(!Array.isArray(hcodes) || !hcodes.length) return [];
  return hcodes.filter(h => {
    const base = (h || '').toString().split(' ')[0].toUpperCase();
    return H_CMR_CODES.has(base);
  });
}

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

  // EUH - INFIAMMABILITÀ DURANTE L'USO (35)
  "EUH209":35, "EUH209A":30
  // NOTA: Rimossi EUH201-EUH208, EUH210, EUH401 (non sono pericoli fisici secondo INRS)
  // EUH203-EUH208 sono avvertimenti per allergie/sensibilizzazione (SALUTE, non SICUREZZA)
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

// =================== PRESET INDICI (MoVaRisCh 2026) ===================
// Due preset operativi pronti all'uso. Il Preset 1 e' anche il default applicato
// alle nuove righe (compatibilita' con defaults). L'utente puo' scegliere tra
// i due tramite i bottoni in tabella.
const PRESETS = {
  preset1: {
    key: 'preset1',
    labelKey: 'presets.preset1.label',
    descKey: 'presets.preset1.desc',
    sistema: 'controllato',
    controlType: 'aspirazione_localizzata',
    exposureTime: '15_120',
    qtyBand: '1_10',
    statoFisico: 'liquido_media_alta',
    contactLevel: 'nessun_contatto',
    distanceBand: '1_3',
    DIS: 0.75,
    Ecut: 1.0
  },
  preset2: {
    key: 'preset2',
    labelKey: 'presets.preset2.label',
    descKey: 'presets.preset2.desc',
    sistema: 'controllato',
    controlType: 'ventilazione_generale',
    exposureTime: 'lt_15',
    qtyBand: '1_10',
    statoFisico: 'liquido_media_alta',
    contactLevel: 'accidentale',
    distanceBand: '1_3',
    DIS: 0.75,
    Ecut: 1.0
  }
};

function applyPreset(row, presetKey){
  const preset = PRESETS[presetKey] || PRESETS.preset1;
  row.sistema = preset.sistema;
  row.controlType = preset.controlType;
  row.exposureTime = preset.exposureTime;
  row.qtyBand = preset.qtyBand;
  row.statoFisico = preset.statoFisico;
  row.contactLevel = preset.contactLevel;
  row.distanceBand = preset.distanceBand;
  row.DIS = preset.DIS;
  row.Ecut = preset.Ecut;
  row.activePreset = preset.key;
  return row;
}

const defaults = {
  // HEALTH defaults (allineati a Preset 1)
  sistema: PRESETS.preset1.sistema,
  controlType: PRESETS.preset1.controlType,
  exposureTime: PRESETS.preset1.exposureTime,
  qtyBand: PRESETS.preset1.qtyBand,
  statoFisico: PRESETS.preset1.statoFisico,
  contactLevel: PRESETS.preset1.contactLevel,
  distanceBand: PRESETS.preset1.distanceBand,
  DIS: PRESETS.preset1.DIS,
  Ecut: PRESETS.preset1.Ecut,

  // M.I.R.C. (INRS) SAFETY defaults
  hcodesPhysical: [],
  flashPoint: null,
  autoIgnitionTemp: null,

  // M.I.R.C. Fattori di Danno (per la SICUREZZA)
  A1: 0,  // Proprietà chimico-fisiche pericolose (esplosivi, infiammabili, comburenti, corrosivi)
  A2: 0,  // Proprietà chimiche pericolose (reazioni pericolose)

  // M.I.R.C. Fattori di Esposizione (per la SICUREZZA)
  B1: 0,  // Modalità di lavoro
  B2: 0,  // Frequenza e tempi di utilizzo
  B3: 0,  // Quantitativi utilizzati
  B4: 0,  // Fattori di riduzione (NEGATIVI: più misure = più sottrazioni)

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
    text: 'Irrilevante per la salute'  // Hardcoded per evitare race condition con i18n
  },
  {
    id:'unc',
    test:(r)=> r >= 15 && r < 21,
    text: 'Intervallo di incertezza - Rivedere misure e consultare medico competente'
  },
  {
    id:'sup',
    test:(r)=> r >= 21 && r <= 40,
    text: 'Rischio superiore al rischio chimico irrilevante per la salute'
  },
  {
    id:'elev',
    test:(r)=> r > 40 && r <= 80,
    text: 'Rischio elevato'
  },
  {
    id:'grave',
    test:(r)=> r > 80,
    text: 'Rischio grave - Riconsiderare misure di prevenzione'
  }
];

// =================== STATE ===================
const state = { files:[], rows:[], batchReviewer:'' };
const $ = s => document.querySelector(s);

// Il worker PDF è distribuito insieme all'app e non richiede accesso alla rete.
if(window.pdfjsLib){
  try{
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'src/lib/pdf.worker.min.mjs';
  }catch(e){}
}

// =================== LIBRERIE LOCALI + ALERT ===================
function showAlert(msg){ const el=$('#alert'); el.textContent=msg; el.style.display='block'; }
function clearAlert(){ const el=$('#alert'); el.textContent=''; el.style.display='none'; }

async function ensureXlsx(){
  if(!window.XLSX){
    throw new Error(t('errors.loadXlsx'));
  }
  return window.XLSX;
}

async function ensureDocx(){
  if(!window.docx){
    throw new Error(t('errors.loadDocx'));
  }
  return window.docx;
}

let pdfWorkerConfigured = false;

async function configurePdfWorker(pdfjs){
  if(!pdfjs || pdfWorkerConfigured){ return; }
  pdfWorkerConfigured = true;
  if(pdfjs.GlobalWorkerOptions){
    pdfjs.GlobalWorkerOptions.workerSrc = 'src/lib/pdf.worker.min.mjs';
  }
}

async function ensurePdfJs(){
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

async function pdfToDocument(file){
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
  const rawPages = [];
  for(let p=1; p<=pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const txt = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    rawPages.push({
      pageNumber: p,
      width: viewport.width,
      height: viewport.height,
      textContent: txt
    });
  }
  if(!window.SdsTextLayout?.layoutPages){
    throw new Error('Modulo layout SDS non disponibile.');
  }
  const pages = window.SdsTextLayout.layoutPages(rawPages);
  return {
    pages,
    text: pages.map(page => page.text).join('\n\f\n')
  };
}

function formatHazardCode(hazard){
  if(!hazard) return '';
  return hazard.code + (hazard.category ? ` cat.${hazard.category}` : '');
}

function dedupeHazardsPreferCategory(hazards){
  const selected = new Map();
  for(const hazard of hazards || []){
    const key = String(hazard.code || '').toUpperCase();
    if(!key) continue;
    const current = selected.get(key);
    if(!current || (!current.category && hazard.category)){
      selected.set(key, hazard);
    }
  }
  return Array.from(selected.values());
}

function detectSdsPhysicalPhase(section9){
  const text = String(section9?.text || '');
  const stateLine = text.match(/(?:stato\s+fisico|physical\s+state|forma\s+fisica)[^\n]{0,160}/i)?.[0] || '';
  if(/\b(?:gas|gassoso|gaseous)\b/i.test(stateLine)) return 'gas';
  if(/\b(?:liquido|liquid)\b/i.test(stateLine)) return 'liquid';
  if(/\b(?:solido|solid|polvere|powder|aerosol|nebbia|mist)\b/i.test(stateLine)) return 'solid';
  return null;
}

function analyzeSdsDocument(document){
  const parser = window.MovarischSds;
  const engine = window.MoVaRisChHealthEngine;
  if(!parser?.parseSdsSections || !parser?.parseHazards || !engine?.evaluateHealthRisk){
    throw new Error('Moduli di analisi SDS/MoVaRisCh 2026 non disponibili.');
  }

  const parsed = parser.parseSdsSections(document);
  const section2 = parsed.sections['2'];
  const section3 = parsed.sections['3'];
  const section8 = parsed.sections['8'];
  const section9 = parsed.sections['9'];
  const section16 = parsed.sections['16'];
  const productHazards = dedupeHazardsPreferCategory(
    section2 ? parser.parseHazards(section2, { section: 2 }) : []
  );
  const ingredientHazards = dedupeHazardsPreferCategory(
    section3 ? parser.parseHazards(section3, { section: 3 }) : []
  );
  const referenceHazards = dedupeHazardsPreferCategory(
    section16 ? parser.parseHazards(section16, { section: 16 }) : []
  );
  const ingredientAnalysis = section3 && parser.parseSection3Ingredients
    ? parser.parseSection3Ingredients(section3)
    : { ingredients: [], warnings: [], status: section3 ? 'needs_review' : 'missing' };
  const section3Text = section3?.text || '';
  const isMixture = /\b(?:miscel[ae]|mixtures?)\b/i.test(section3Text) || /\b3\.2\b/.test(section3Text);
  const productClassified = productHazards.length > 0;
  const ingredients = ingredientAnalysis.ingredients.length
    ? ingredientAnalysis.ingredients
    : section3 && ingredientHazards.length
      ? [{
          name: 'Ingredienti SDS - sezione 3 non strutturata',
          hazards: ingredientHazards,
          needsReview: true,
          reviewReasons: ['SECTION3_STRUCTURED_INGREDIENTS_NOT_AVAILABLE']
        }]
      : [];
  const mixturePhase = detectSdsPhysicalPhase(section9);
  const dpi = parser.parseSection8Dpi
    ? parser.parseSection8Dpi(section8)
    : { sectionFound: Boolean(section8), items: [], summary: '' };
  const health = engine.evaluateHealthRisk({
    productHazards,
    ingredients,
    isMixture,
    productClassified,
    mixturePhase,
    // La sezione 3 di una SDS elenca normalmente solo gli ingredienti soggetti
    // a comunicazione: non prova da sola l'assenza assoluta di sostanze pericolose.
    compositionComplete: false
  });

  return {
    methodologyId: window.MoVaRisChHealth2026?.METADATA?.edition || '2026-02-28',
    sections: parsed.sections,
    productHazards,
    ingredientHazards,
    ingredients,
    ingredientParsingStatus: ingredientAnalysis.status,
    referenceHazards,
    isMixture,
    mixturePhase,
    dpi,
    health,
    warnings: [
      ...parsed.warnings.filter(warning => warning.code !== 'DUPLICATE_SECTION'),
      ...ingredientAnalysis.warnings,
      ...health.warnings
    ]
  };
}

function reviewHazardText(hazards){
  return (hazards || []).map(formatHazardCode).filter(Boolean).join('; ');
}

function parseReviewHazards(value, section){
  const parser = window.MovarischSds;
  return dedupeHazardsPreferCategory(parser.parseHazards(String(value || ''), { section }));
}

function concentrationText(ingredient){
  const concentration = ingredient?.concentration;
  if(ingredient?.concentrationPercent != null) return String(ingredient.concentrationPercent);
  if(concentration?.raw) return String(concentration.raw);
  if(concentration && concentration.lower != null && concentration.upper != null){
    if(concentration.lower === concentration.upper) return String(concentration.lower);
    return `${concentration.lower}-${concentration.upper}`;
  }
  return '';
}

function concentrationBasisValue(ingredient){
  const value = ingredient?.concentrationBasis || ingredient?.concentration?.basis || '';
  if(/mass|peso|weight|w\/w|p\/p/i.test(value)) return 'mass';
  if(/vol|v\/v/i.test(value)) return 'volume';
  return '';
}

function ingredientSummary(ingredients){
  return (ingredients || []).map(ingredient => {
    const identity = [ingredient.name || 'Ingrediente non denominato', ingredient.CAS || ingredient.cas ? `CAS ${ingredient.CAS || ingredient.cas}` : ''].filter(Boolean).join(' - ');
    const concentration = concentrationText(ingredient);
    const basis = concentrationBasisValue(ingredient);
    const hazards = reviewHazardText(ingredient.hazards || []);
    return [identity, concentration ? `${concentration}%${basis ? ` ${basis === 'mass' ? 'p/p' : 'v/v'}` : ''}` : 'concentrazione non determinata', hazards || 'nessuna frase H rilevata'].join(' | ');
  }).join('\n');
}

function reviewAuditText(review){
  return (review?.audit || []).map(item => `${item.timestamp} - ${item.field}: "${item.before}" -> "${item.after}"`).join('\n');
}

function recomputeReviewedHealth(row){
  const evidence = row.sdsEvidence || {};
  const engine = window.MoVaRisChHealthEngine;
  let result = engine.evaluateHealthRisk({
    productHazards: evidence.productHazards || [],
    ingredients: evidence.ingredients || [],
    isMixture: evidence.isMixture === true,
    productClassified: (evidence.productHazards || []).length > 0,
    mixturePhase: evidence.mixturePhase || null,
    compositionComplete: false
  });

  const manualScore = Number(row.review?.manualScore);
  if(result.status === 'needs_review' && Number.isFinite(manualScore) && manualScore > 0){
    result = {
      ...result,
      status: 'manual_override',
      score: manualScore,
      ruleId: 'PROFESSIONAL_MANUAL_OVERRIDE',
      warnings: [...(result.warnings || []), 'PUNTEGGIO_DEFINITO_DAL_PROFESSIONISTA']
    };
  }

  const codes = (evidence.productHazards || []).map(formatHazardCode);
  const separated = separateHCodes(codes);
  row.hcodes = separated.health;
  row.hcodesPhysical = separated.physical;
  row.A1 = calculateA1FromPhysicalCodes(row.hcodesPhysical);
  row.A2 = calculateA2FromPhysicalCodes(row.hcodesPhysical);
  row.healthAssessmentStatus = result.status;
  row.healthRuleId = result.ruleId;
  row.SCORE = typeof result.score === 'number' ? result.score : 0;
  row.isCmr = result.status === 'excluded_cmr';
  row.cmrCodes = row.isCmr && result.determiningHazard?.code ? [result.determiningHazard.code] : [];
  row.analysisWarnings = Array.from(new Set([
    ...(row.baseAnalysisWarnings || []),
    ...(result.warnings || [])
  ]));
  recalcRow(row);
  return result;
}

function recordReviewChange(row, field, before, after){
  const workflow = window.MovarischReviewWorkflow;
  row.review = workflow.recordChange(row.review, { field, before, after });
  recomputeReviewedHealth(row);
}

function reviewErrorMessage(code){
  return ({
    REVIEWER_REQUIRED: 'Inserisci il nominativo del professionista che esegue la revisione.',
    ACCEPTANCE_REQUIRED: 'Seleziona la dichiarazione di conferma prima di proseguire.',
    CORRECTION_REASON_REQUIRED: 'Hai modificato dati estratti: indica la motivazione della correzione.',
    UNRESOLVED_HEALTH_RESULT: 'Il risultato resta ambiguo. Inserisci un punteggio professionale motivato oppure completa i dati mancanti.'
  })[code] || 'Revisione non completabile: controlla i dati inseriti.';
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

// Separa H-codes in salute (H3xx, H4xx) e fisici (H2xx, EUH specifici)
function separateHCodes(allHCodes){
  const health = [];
  const physical = [];

  // EUH per SICUREZZA (whitelist esplicita secondo INRS M.I.R.C.)
  const SAFETY_EUH = new Set([
    'EUH001', 'EUH006', 'EUH014', 'EUH018', 'EUH019', 'EUH044',  // Esplosivi/reattivi
    'EUH209', 'EUH209A',  // Infiammabili durante l'uso
    'EUH029', 'EUH031', 'EUH032'  // Gas tossici da reazioni (usati in A2)
  ]);

  for(const code of allHCodes){
    const baseCode = code.split(' ')[0]; // Rimuove " cat.X" se presente

    // H-codes fisici: H2xx (200-299)
    if(/^H2\d{2}$/.test(baseCode)){
      physical.push(code);
    }
    // EUH: solo quelli nella whitelist SAFETY per M.I.R.C. (supporta suffissi come EUH201A)
    else if(/^EUH\d{3}[A-Z]?$/.test(baseCode)){
      if(SAFETY_EUH.has(baseCode)){
        physical.push(code);
      } else {
        health.push(code);  // Altri EUH (es. EUH066, EUH070, EUH071) vanno in salute
      }
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

// Calcola A1 (Proprietà chimico-fisiche pericolose) da H-codes fisici
function calculateA1FromPhysicalCodes(physicalCodes){
  if(!physicalCodes || !physicalCodes.length) return 0;

  const scores = physicalCodes.map(code => {
    const baseCode = code.split(' ')[0]; // Rimuove categorie
    return H_PHYSICAL_SCORE[baseCode] || 0;
  });

  // A1 = massimo score tra gli H-codes fisici / 10 (normalizzato)
  const maxScore = Math.max(...scores, 0);
  return maxScore > 0 ? round(maxScore / 10, 2) : 0;
}

// Calcola A2 (Proprietà chimiche pericolose - reazioni) da H-codes fisici e EUH
function calculateA2FromPhysicalCodes(physicalCodes){
  if(!physicalCodes || !physicalCodes.length) return 0;

  let score = 0;
  const baseCodes = physicalCodes.map(c => c.split(' ')[0]);

  // Reazioni esplosive/violente (priorità massima)
  const explosiveReactions = ['EUH006', 'EUH014', 'EUH019', 'EUH044'];
  if(baseCodes.some(c => explosiveReactions.includes(c))){
    score += 3.0; // Reazione violenta/esplosiva
  }

  // Formazione gas infiammabili/pericolosi
  const gasFormation = ['EUH029', 'EUH031', 'EUH032'];
  if(baseCodes.some(c => gasFormation.includes(c))){
    score += 2.0; // Formazione rapida gas pericolosi
  }

  // Formazione prodotti instabili
  if(baseCodes.includes('EUH018')){
    score += 2.5; // Formazione miscela vapor-aria esplosiva
  }

  // Reattività con acqua (formazione gas infiammabili)
  if(baseCodes.includes('H260')){
    score += 3.0; // Reagisce violentemente con acqua -> gas estremamente infiammabili
  } else if(baseCodes.includes('H261')){
    score += 2.0; // Reagisce con acqua -> gas infiammabili
  }

  return round(score, 2);
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
  const scores = hcodes.map(h => {
    const direct = H_SCORE[h];
    if(typeof direct === 'number') return direct;
    const category = h.match(/cat\.?\s*(1A|1B|1C|1|2)/i)?.[1];
    return window.MoVaRisChHealth2026?.getHealthScore(h, category);
  }).filter(v=>typeof v==='number');
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
  if(row.healthAssessmentStatus === 'needs_review'){
    row.Rinal = 0;
    row.Rcut = 0;
    row.Rtot = 0;
    row.Giudizio = 'DA VERIFICARE - dati SDS insufficienti o ambigui';
    row.GiudizioClass = 'unc';
  }else if(row.healthAssessmentStatus === 'excluded_cmr'){
    row.Rinal = 0;
    row.Rcut = 0;
    row.Rtot = 0;
    row.Giudizio = 'CMR 1A/1B - valutazione Titolo IX Capo II richiesta';
    row.GiudizioClass = 'grave';
  }
  if(row.review && row.review.status !== 'confirmed'){
    row.Rinal = 0;
    row.Rcut = 0;
    row.Rtot = 0;
    row.Giudizio = 'RISULTATO PROVVISORIO - confermare la revisione SDS';
    row.GiudizioClass = 'unc';
  }

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
  if(row.review && row.review.status !== 'confirmed'){
    row.OverallClass = 'unc';
    row.OverallRiskValue = 0;
  }
}

function render(){
  const tb = document.querySelector('#tbl tbody');
  tb.innerHTML = '';
  state.rows.forEach((r,i)=>{
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
      <td>${escapeHtml(r.hcodes.join(';'))}</td>
      <td class="num">${fmt(r.SCORE)}</td>
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
      <td>
        <button class="btn ${r.activePreset === 'preset1' ? 'btn-active' : ''}" data-preset="preset1" title="${escapeHtml(t('presets.preset1.desc'))}">P1</button>
        <button class="btn ${r.activePreset === 'preset2' ? 'btn-active' : ''}" data-preset="preset2" title="${escapeHtml(t('presets.preset2.desc'))}">P2</button>
        <button class="btn" data-del="${i}" aria-label="${escapeHtml(deleteLabel)}">${escapeHtml(deleteLabel)}</button>
      </td>`;

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
            r.healthAssessmentStatus = 'manual_override';
            r.healthRuleId = 'MANUAL_OVERRIDE';
            r.analysisWarnings = Array.from(new Set([...(r.analysisWarnings || []), 'Punteggio modificato manualmente']));
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

    // Helper: ogni modifica manuale invalida il flag "preset attivo"
    // cosi' il bottone evidenziato torna spento e l'utente capisce
    // che lo stato e' divergente dai due preset.
    const clearActivePreset = () => { r.activePreset = null; };

    tr.querySelector('[data-sistema]')?.addEventListener('change', (ev)=>{
      applySistema(r, ev.target.value);
      clearActivePreset();
      render();
    });

    tr.querySelector('[data-controllo]')?.addEventListener('change', (ev)=>{
      r.controlType = ev.target.value || defaults.controlType;
      clearActivePreset();
      render();
    });

    tr.querySelector('[data-exposure]')?.addEventListener('change', (ev)=>{
      r.exposureTime = ev.target.value || defaults.exposureTime;
      clearActivePreset();
      render();
    });

    tr.querySelector('[data-qty]')?.addEventListener('change', (ev)=>{
      applyQuantity(r, ev.target.value);
      clearActivePreset();
      render();
    });

    tr.querySelector('[data-stato]')?.addEventListener('change', (ev)=>{
      r.statoFisico = ev.target.value;
      clearActivePreset();
      render();
    });

    tr.querySelector('[data-contact]')?.addEventListener('change', (ev)=>{
      r.contactLevel = ev.target.value || defaults.contactLevel;
      clearActivePreset();
      render();
    });

    tr.querySelector('[data-distance]')?.addEventListener('change', (ev)=>{
      r.distanceBand = ev.target.value || defaults.distanceBand;
      clearActivePreset();
      render();
    });

    // Bottoni preset MoVaRisCh
    tr.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        applyPreset(r, btn.dataset.preset);
        render();
      });
    });

    tr.querySelector('[data-del]')?.addEventListener('click',()=>{ state.rows.splice(i,1); render(); });
    tb.appendChild(tr);
    }catch(err){
      console.error('❌ ERRORE creando riga', i, ':', err);
      console.error('Stack:', err.stack);
    }
  });
  renderSdsReviews();
  const confirmed = window.MovarischReviewWorkflow.allConfirmed(state.rows);
  document.querySelector('#exportBtn').disabled = !confirmed;
  document.querySelector('#exportWordBtn').disabled = !confirmed;
  document.querySelector('#cumulativeBtn').disabled = !confirmed;
}

function evidenceList(hazards){
  const items = (hazards || []).map(hazard => {
    const page = hazard.page != null ? `pag. ${hazard.page}` : 'pagina non rilevata';
    const source = hazard.sourceText ? ` - ${hazard.sourceText}` : '';
    return `<li><strong>${escapeHtml(formatHazardCode(hazard))}</strong> · ${escapeHtml(page + source)}</li>`;
  });
  return items.length ? `<ul class="review-evidence">${items.join('')}</ul>` : '<p class="ingredient-empty">Nessuna frase H rilevata.</p>';
}

function warningLabel(warning){
  const raw = typeof warning === 'string' ? warning : warning?.code;
  const friendly = {
    INGREDIENT_NEEDS_REVIEW: 'Alcuni dati degli ingredienti richiedono verifica.',
    INGREDIENT_DATA_MISSING_FOR_LOW_SCORE_MIXTURE_CHECK: 'Per questa miscela servono i dati degli ingredienti della Sezione 3.',
    UNCLASSIFIED_MIXTURE_DATA_INSUFFICIENT_FOR_GENERIC_SCORE: 'I dati estratti non bastano per attribuire automaticamente il punteggio della miscela.',
    NO_SECTION_HEADINGS: 'Le intestazioni della SDS non sono state riconosciute.',
    MISSING_RELEVANT_SECTION: 'Una sezione necessaria della SDS non è stata riconosciuta.'
  };
  const normalized = String(raw || '').split(':')[0];
  if(friendly[normalized]) return friendly[normalized];
  if(typeof warning === 'string') return warning;
  if(!warning || typeof warning !== 'object') return String(warning || '');
  return [warning.code, warning.message, warning.section ? `sezione ${warning.section}` : ''].filter(Boolean).join(' - ');
}

function reviewIssueDescription(row){
  const rule = String(row?.healthRuleId || '');
  if(rule === 'UNCLASSIFIED_MIXTURE_REQUIRES_STRUCTURED_INGREDIENT_DATA'){
    return 'La Sezione 2 non classifica il prodotto per pericoli per la salute. Verifica la composizione in Sezione 3 e indica il punteggio professionale applicabile.';
  }
  if(rule === 'LOW_SCORE_MIXTURE_REQUIRES_INGREDIENT_REVIEW'){
    return 'Il punteggio della Sezione 2 è basso e il metodo richiede un rapido controllo degli ingredienti rilevanti.';
  }
  if(rule === 'PRODUCT_CLASSIFICATION_INCOMPLETE'){
    return 'La classificazione sanitaria del prodotto non è stata letta in modo completo. Controlla la Sezione 2 oppure indica il punteggio professionale.';
  }
  return 'Il calcolo automatico non è definitivo. Controlla soltanto i dati segnalati e completa il punteggio professionale.';
}

function ingredientReviewHtml(ingredient, rowIndex, ingredientIndex){
  const hazards = reviewHazardText(ingredient.hazards || []);
  const basis = concentrationBasisValue(ingredient);
  const reasons = (ingredient.reviewReasons || []).map(warningLabel).filter(Boolean);
  const evidence = evidenceList(ingredient.hazards || []);
  const summary = [ingredient.name || 'Ingrediente non denominato', ingredient.CAS || ingredient.cas || '', concentrationText(ingredient) ? `${concentrationText(ingredient)}%` : 'concentrazione da verificare'].filter(Boolean).join(' - ');
  return `<details class="ingredient-card" data-ingredient-row="${rowIndex}" data-ingredient-index="${ingredientIndex}">
    <summary><span>${escapeHtml(summary)}</span><span class="ingredient-status${reasons.length ? ' needs-review' : ''}">${reasons.length ? 'controllo richiesto' : 'estratto'}</span></summary>
    <div class="ingredient-card-body"><div class="ingredient-edit">
    <label>Ingrediente<input type="text" value="${escapeHtml(ingredient.name || '')}" data-ingredient-name></label>
    <label>CAS<input type="text" value="${escapeHtml(ingredient.CAS || ingredient.cas || '')}" data-ingredient-cas></label>
    <label>Concentrazione %<input type="text" value="${escapeHtml(concentrationText(ingredient))}" placeholder="es. 0,1 oppure 0,05-0,2" data-ingredient-concentration></label>
    <label>Base<select data-ingredient-basis>
      <option value=""${basis ? '' : ' selected'}>da verificare</option>
      <option value="mass"${basis === 'mass' ? ' selected' : ''}>p/p (massa)</option>
      <option value="volume"${basis === 'volume' ? ' selected' : ''}>v/v (volume)</option>
    </select></label>
    <label>Frasi H<input type="text" value="${escapeHtml(hazards)}" data-ingredient-hazards></label>
  </div>${reasons.length ? `<div class="review-warnings">${escapeHtml(reasons.join('\n'))}</div>` : ''}${evidence}</div></details>`;
}

function reviewRequiresAttention(row){
  if(!row) return true;
  if(row.healthAssessmentStatus === 'needs_review') return true;
  if(row.healthAssessmentStatus !== 'excluded_cmr' && !(Number.isFinite(row.SCORE) && row.SCORE > 0)) return true;
  return (row.analysisWarnings || []).some(warning => {
    const code = typeof warning === 'string' ? warning : warning?.code;
    return code === 'NO_SECTION_HEADINGS' || (code === 'MISSING_RELEVANT_SECTION' && String(warning?.section) === '2');
  });
}

function dpiReviewSummary(row){
  const items = row?.sdsEvidence?.dpi?.items || [];
  const active = items.filter(item => !['not_specified', 'not_required'].includes(item.status));
  return active.length ? `${active.length} famiglie DPI rilevate in Sezione 8` : 'DPI non determinati automaticamente';
}

function confirmationSnapshot(row){
  return {
    productHazards: row.sdsEvidence.productHazards,
    ingredients: row.sdsEvidence.ingredients,
    referenceHazards: row.sdsEvidence.referenceHazards,
    dpi: row.sdsEvidence.dpi,
    ruleId: row.healthRuleId,
    score: row.SCORE,
    methodologyId: row.methodologyId
  };
}

function renderSdsReviews(){
  const section = document.querySelector('#sdsReviewSection');
  const list = document.querySelector('#sdsReviewList');
  const globalStatus = document.querySelector('#reviewGlobalStatus');
  if(!section || !list || !globalStatus) return;
  if(!state.rows.length){
    section.hidden = true;
    list.innerHTML = '';
    return;
  }

  section.hidden = false;
  const allConfirmed = window.MovarischReviewWorkflow.allConfirmed(state.rows);
  const pendingRows = state.rows.filter(row => row.review?.status !== 'confirmed');
  const attentionRows = pendingRows.filter(reviewRequiresAttention);
  const readyRows = pendingRows.filter(row => !reviewRequiresAttention(row));
  globalStatus.textContent = allConfirmed
    ? 'Tutte le estrazioni confermate'
    : `${readyRows.length} pronte · ${attentionRows.length} da approfondire`;
  globalStatus.classList.toggle('confirmed', allConfirmed);

  const batchReviewer = document.querySelector('#reviewBatchReviewer');
  const batchAccept = document.querySelector('#reviewBatchAccept');
  const batchConfirm = document.querySelector('#reviewBatchConfirm');
  const batchError = document.querySelector('#reviewBatchError');
  if(batchReviewer && document.activeElement !== batchReviewer){
    batchReviewer.value = state.batchReviewer || state.rows.find(row => row.review?.reviewer)?.review?.reviewer || '';
  }
  if(batchConfirm){
    batchConfirm.textContent = readyRows.length ? `Conferma ${readyRows.length} schede pronte` : (allConfirmed ? 'Verifica completata' : 'Nessuna scheda pronta');
    batchConfirm.disabled = readyRows.length === 0;
  }

  list.innerHTML = state.rows.map((row, rowIndex) => {
    const evidence = row.sdsEvidence || {};
    const review = row.review || window.MovarischReviewWorkflow.createReviewState();
    row.review = review;
    const confirmed = review.status === 'confirmed';
    const needsAttention = reviewRequiresAttention(row);
    const ingredients = evidence.ingredients || [];
    const warnings = Array.from(new Set((row.analysisWarnings || []).map(warningLabel).filter(Boolean)));
    const audit = review.audit || [];
    return `<details class="review-card${needsAttention ? ' attention' : ''}${confirmed ? ' confirmed' : ''}" data-review-card="${rowIndex}"${needsAttention && !confirmed ? ' open' : ''}>
      <summary>
        <div class="review-card-summary-main"><h3>${escapeHtml(row.nome || row.file)} <small>(${escapeHtml(row.file)})</small></h3>
        <div class="review-card-summary-line"><span><strong>Sezione 2:</strong> ${escapeHtml(reviewHazardText(evidence.productHazards) || 'nessuna frase H')}</span><span><strong>Score:</strong> ${row.healthAssessmentStatus === 'excluded_cmr' ? 'Capo II' : escapeHtml(fmt(row.SCORE))}</span><span>${escapeHtml(dpiReviewSummary(row))}</span></div></div>
        <span class="review-status${confirmed ? ' confirmed' : ''}">${confirmed ? `Confermato il ${escapeHtml(new Date(review.confirmedAt).toLocaleString('it-IT'))}` : 'Da confermare'}</span>
      </summary><div class="review-card-body">
      ${needsAttention ? `<section class="review-exception" aria-label="Azione richiesta">
        <div><strong>Serve una decisione professionale</strong><p>${escapeHtml(reviewIssueDescription(row))}</p></div>
        <span class="review-exception-badge">Eccezione</span>
      </section>
      <div class="review-controls review-controls-fast">
        <label>Punteggio professionale<input type="text" inputmode="decimal" value="${review.manualScore ?? ''}" data-review-score data-row="${rowIndex}" placeholder="es. 5,5"></label>
        <label>Motivazione sintetica<textarea data-review-reason data-row="${rowIndex}" placeholder="Viene proposta automaticamente quando inserisci il punteggio">${escapeHtml(review.correctionReason || '')}</textarea></label>
      </div>` : ''}
      <details class="review-technical">
      <summary>Apri dati tecnici estratti (Sezioni 2, 3 e 16)</summary>
      <div class="review-technical-body"><div class="review-panels">
        <section class="review-panel">
          <h4>Sezione 2 - classificazione del prodotto</h4>
          <textarea data-review-product data-row="${rowIndex}" aria-label="Frasi H sezione 2">${escapeHtml(reviewHazardText(evidence.productHazards))}</textarea>
          ${evidenceList(evidence.productHazards)}
          <p class="review-note">Queste frasi determinano lo score ordinario del prodotto.</p>
        </section>
        <section class="review-panel review-ingredients-panel">
          <h4>Sezione 3 - ingredienti</h4>
          <p class="review-note">Dettaglio tecnico interno: apri soltanto l'ingrediente che vuoi controllare o correggere.</p>
          ${ingredients.length ? ingredients.map((ingredient, index) => ingredientReviewHtml(ingredient, rowIndex, index)).join('') : '<p class="ingredient-empty">Nessun ingrediente strutturato rilevato. Verificare la SDS.</p>'}
          <p class="review-note">Gli ingredienti incidono solo tramite le regole specifiche MoVaRisCh per le miscele.</p>
        </section>
        <section class="review-panel">
          <h4>Sezione 16 - riferimento informativo</h4>
          <textarea data-review-reference data-row="${rowIndex}" aria-label="Frasi H sezione 16">${escapeHtml(reviewHazardText(evidence.referenceHazards))}</textarea>
          ${evidenceList(evidence.referenceHazards)}
          <p class="review-note"><strong>Non utilizzata direttamente per lo score.</strong></p>
        </section>
      </div>
      <div class="review-rule">
        <span><strong>Regola tecnica:</strong> ${escapeHtml(row.healthRuleId || 'non determinata')}</span>
        <span><strong>Score provvisorio:</strong> ${row.healthAssessmentStatus === 'excluded_cmr' ? 'non applicabile - Capo II' : escapeHtml(fmt(row.SCORE))}</span>
        <span><strong>Stato parser ingredienti:</strong> ${escapeHtml(evidence.ingredientParsingStatus || 'non disponibile')}</span>
      </div>
      ${warnings.length ? `<div class="review-warnings"><strong>Avvertenze da verificare</strong>\n${escapeHtml(warnings.join('\n'))}</div>` : ''}
      </div></details>
      <div class="review-confirm">
        <span class="review-note">Usa il nominativo e la conferma unica indicati sopra.</span>
        <button type="button" class="btn primary" data-review-confirm data-row="${rowIndex}">${confirmed ? 'Riconferma' : (needsAttention ? 'Conferma dopo il controllo' : 'Conferma questa scheda')}</button>
      </div>
      <div class="review-inline-error" id="review-error-${rowIndex}" data-review-error role="alert" hidden></div>
      <div class="review-audit"><strong>Registro modifiche:</strong> ${audit.length ? audit.map(item => `${escapeHtml(new Date(item.timestamp).toLocaleString('it-IT'))} - ${escapeHtml(item.field)}: “${escapeHtml(item.before)}” → “${escapeHtml(item.after)}”`).join('<br>') : 'nessuna correzione manuale'}</div>
      </div></details>`;
  }).join('');

  const clearInlineError = target => {
    const card = target.closest('[data-review-card]');
    const error = card?.querySelector('[data-review-error]');
    if(error){ error.hidden = true; error.textContent = ''; }
    card?.querySelectorAll('[aria-invalid="true"]').forEach(element => element.removeAttribute('aria-invalid'));
  };

  if(batchReviewer) batchReviewer.oninput = event => {
    state.batchReviewer = event.target.value;
    if(batchError){ batchError.hidden = true; batchError.textContent = ''; }
  };
  if(batchAccept) batchAccept.onchange = () => {
    if(batchError){ batchError.hidden = true; batchError.textContent = ''; }
  };
  if(batchConfirm) batchConfirm.onclick = () => {
    const reviewer = String(batchReviewer?.value || state.batchReviewer || '').trim();
    if(reviewer.length < 2 || batchAccept?.checked !== true){
      const message = reviewer.length < 2
        ? 'Inserisci una sola volta il nominativo del professionista.'
        : 'Seleziona la conferma unica prima di proseguire.';
      if(batchError){ batchError.textContent = message; batchError.hidden = false; }
      const target = reviewer.length < 2 ? batchReviewer : batchAccept;
      target?.setAttribute('aria-invalid', 'true');
      target?.focus();
      return;
    }
    state.batchReviewer = reviewer;
    let confirmedCount = 0;
    for(const row of state.rows.filter(candidate => candidate.review?.status !== 'confirmed' && !reviewRequiresAttention(candidate))){
      row.review.reviewer = reviewer;
      row.review.accepted = true;
      recomputeReviewedHealth(row);
      const confirmation = window.MovarischReviewWorkflow.confirm(row.review, {
        healthStatus: row.healthAssessmentStatus,
        score: row.healthAssessmentStatus === 'excluded_cmr' ? null : row.SCORE,
        snapshot: confirmationSnapshot(row)
      });
      if(confirmation.ok) confirmedCount += 1;
    }
    if(!confirmedCount){
      if(batchError){ batchError.textContent = 'Le schede rimaste richiedono un controllo puntuale prima della conferma.'; batchError.hidden = false; }
      return;
    }
    clearAlert();
    render();
  };
  list.querySelectorAll('[data-review-reason]').forEach(input => input.addEventListener('input', event => {
    state.rows[Number(event.target.dataset.row)].review.correctionReason = event.target.value;
    clearInlineError(event.target);
  }));
  list.querySelectorAll('[data-review-product]').forEach(input => input.addEventListener('change', event => {
    const row = state.rows[Number(event.target.dataset.row)];
    const before = reviewHazardText(row.sdsEvidence.productHazards);
    row.sdsEvidence.productHazards = parseReviewHazards(event.target.value, 2);
    recordReviewChange(row, 'section2.productHazards', before, reviewHazardText(row.sdsEvidence.productHazards));
    render();
  }));
  list.querySelectorAll('[data-review-reference]').forEach(input => input.addEventListener('change', event => {
    const row = state.rows[Number(event.target.dataset.row)];
    const before = reviewHazardText(row.sdsEvidence.referenceHazards);
    row.sdsEvidence.referenceHazards = parseReviewHazards(event.target.value, 16);
    recordReviewChange(row, 'section16.referenceHazards', before, reviewHazardText(row.sdsEvidence.referenceHazards));
    render();
  }));
  list.querySelectorAll('[data-review-score]').forEach(input => input.addEventListener('change', event => {
    const row = state.rows[Number(event.target.dataset.row)];
    const before = row.review.manualScore ?? '';
    const parsed = parseNumeric(event.target.value);
    row.review.manualScore = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    recordReviewChange(row, 'health.manualScore', before, row.review.manualScore ?? '');
    if(row.review.manualScore && !String(row.review.correctionReason || '').trim()){
      const reason = 'Punteggio definito dal professionista dopo verifica della composizione riportata nella Sezione 3 della SDS.';
      row.review.correctionReason = reason;
      recordReviewChange(row, 'review.correctionReason', '', reason);
    }
    render();
  }));
  list.querySelectorAll('[data-ingredient-row]').forEach(container => {
    const row = state.rows[Number(container.dataset.ingredientRow)];
    const ingredientIndex = Number(container.dataset.ingredientIndex);
    const ingredient = row.sdsEvidence.ingredients[ingredientIndex];
    const bind = (selector, field, transform) => {
      container.querySelector(selector)?.addEventListener('change', event => {
        const before = field === 'hazards' ? reviewHazardText(ingredient.hazards) : ingredient[field] ?? '';
        ingredient[field] = transform ? transform(event.target.value) : event.target.value;
        const after = field === 'hazards' ? reviewHazardText(ingredient.hazards) : ingredient[field] ?? '';
        recordReviewChange(row, `section3.ingredients[${ingredientIndex}].${field}`, before, after);
        render();
      });
    };
    bind('[data-ingredient-name]', 'name');
    bind('[data-ingredient-cas]', 'CAS');
    bind('[data-ingredient-concentration]', 'concentrationPercent');
    bind('[data-ingredient-basis]', 'concentrationBasis');
    bind('[data-ingredient-hazards]', 'hazards', value => parseReviewHazards(value, 3));
  });
  list.querySelectorAll('[data-review-confirm]').forEach(button => button.addEventListener('click', event => {
    const row = state.rows[Number(event.target.dataset.row)];
    row.review.reviewer = String(batchReviewer?.value || state.batchReviewer || '').trim();
    row.review.accepted = batchAccept?.checked === true;
    recomputeReviewedHealth(row);
    const workflow = window.MovarischReviewWorkflow;
    const confirmation = workflow.confirm(row.review, {
      healthStatus: row.healthAssessmentStatus,
      score: row.healthAssessmentStatus === 'excluded_cmr' ? null : (Number.isFinite(row.SCORE) && row.SCORE > 0 ? row.SCORE : null),
      snapshot: confirmationSnapshot(row)
    });
    if(!confirmation.ok){
      const message = reviewErrorMessage(confirmation.error);
      const card = event.target.closest('[data-review-card]');
      const inlineError = card?.querySelector('[data-review-error]');
      const selector = ({
        CORRECTION_REASON_REQUIRED: '[data-review-reason]',
        UNRESOLVED_HEALTH_RESULT: '[data-review-score]'
      })[confirmation.error];
      const invalidField = selector ? card?.querySelector(selector) : null;
      if(confirmation.error === 'REVIEWER_REQUIRED' || confirmation.error === 'ACCEPTANCE_REQUIRED'){
        const globalField = confirmation.error === 'REVIEWER_REQUIRED' ? batchReviewer : batchAccept;
        globalField?.setAttribute('aria-invalid', 'true');
        globalField?.focus();
      }
      if(inlineError){
        inlineError.textContent = message;
        inlineError.hidden = false;
        inlineError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if(invalidField){
        invalidField.setAttribute('aria-invalid', 'true');
        invalidField.focus({ preventScroll: true });
      }
      showAlert(message);
      return;
    }
    clearAlert();
    render();
  }));
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

function reviewsReadyForExport(){
  const ready = window.MovarischReviewWorkflow.allConfirmed(state.rows);
  if(!ready){
    showAlert('Conferma la revisione tecnica di tutte le SDS prima di esportare o creare la scheda cumulativa.');
  }
  return ready;
}

async function exportExcel(){
  let flatRows;
  try{
    if(!state.rows.length){
      showAlert(t('alerts.noRows'));
      return;
    }
    if(!reviewsReadyForExport()) return;
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
        Sezione_2_classificazione_prodotto:reviewHazardText(r.sdsEvidence?.productHazards),
        Sezione_3_ingredienti:ingredientSummary(r.sdsEvidence?.ingredients),
        Sezione_16_solo_informativa:reviewHazardText(r.sdsEvidence?.referenceHazards),
        Regola_MoVaRisCh:r.healthRuleId || '',
        Stato_revisione:r.review?.status || 'pending',
        Validato_da:r.review?.reviewer || '',
        Data_validazione:r.review?.confirmedAt || '',
        Motivazione_correzioni:r.review?.correctionReason || '',
        Registro_correzioni:reviewAuditText(r.review),
        Avvertenze_analisi:(r.analysisWarnings || []).map(warningLabel).join('; '),
        Hcodes_CMR_cat1A_1B: (r.cmrCodes || []).join(';'),
        Sostanza_CMR_TitIX_CapoII: r.isCmr ? 'SI - valutare ex art. 234 D.Lgs. 81/08 (D.Lgs. 135/2024)' : 'NO',
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
    if(!reviewsReadyForExport()) return;

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
      const sistemaInfo = getSistemaOption(r.sistema);
      const propInfo = STATO_FISICO_OPTIONS.find(opt=>opt.value===r.statoFisico);
      const qtyInfo = getQuantityOption(r.qtyBand);
      const controlInfo = getControlOption(r.controlType);
      const exposureInfo = getExposureOption(r.exposureTime);
      const contactInfo = getContactOption(r.contactLevel);
      const distanceInfo = getDistanceOption(r.distanceBand);

      // Helper: stampa "valore_numerico (descrizione_opzione)" per evitare
      // l'incoerenza fra indice numerico e descrizione testuale nel Word.
      const idx = (numeric, label) => {
        const n = numeric != null && numeric !== '' ? String(numeric) : '—';
        const l = label || '';
        return l ? `${n}  (${l})` : n;
      };

      // Dati della tabella (Campo | Valore)
      const tableData = [
        [docLabels.fields.file, r.file || ''],
        [docLabels.fields.tradeName, r.nome || ''],
        [docLabels.fields.physicalState, propInfo?.label ?? r.statoFisico],
        [docLabels.fields.hCodes, (r.hcodes || []).join('; ')],
        [docLabels.fields.score, String(r.SCORE ?? '')],
        [docLabels.fields.system, sistemaInfo?.label ?? r.sistema],
        [docLabels.fields.control, controlInfo?.label ?? r.controlType],
        [docLabels.fields.controlIndex, idx(controlInfo?.index, controlInfo?.label)],
        [docLabels.fields.exposure, exposureInfo?.label ?? r.exposureTime],
        [docLabels.fields.exposureIndex, idx(exposureInfo?.index, exposureInfo?.label)],
        [docLabels.fields.quantity, qtyInfo?.label ?? r.qty],
        [docLabels.fields.quantityIndex, idx(r.Q, qtyInfo?.label)],
        [docLabels.fields.contact, contactInfo?.label ?? r.contactLevel],
        [docLabels.fields.contactIndex, idx(r.contactIndex, contactInfo?.label)],
        [docLabels.fields.dIndex, idx(r.D, propInfo?.label)],
        [docLabels.fields.uIndex, idx(r.U, sistemaInfo?.label)],
        [docLabels.fields.tIndex, idx(r.T, exposureInfo?.label)],
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
        })
      ];

      // WARNING CMR (D.Lgs. 135/2024): se la sostanza ha frasi H di
      // cancerogenicita'/mutagenicita'/reprotossicita' cat. 1A/1B, va
      // valutata ex Titolo IX Capo II e NON nel calcolo P MoVaRisCh.
      if(r.isCmr && Array.isArray(r.cmrCodes) && r.cmrCodes.length){
        const cmrWarningTitle = t('doc.cmrWarning.title');
        const cmrWarningBody = t('doc.cmrWarning.body', { codes: r.cmrCodes.join(', ') });
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cmrWarningTitle, bold: true, color: 'FFFFFF', size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
            shading: { type: ShadingType.SOLID, color: '8B0000', fill: '8B0000' }
          }),
          new Paragraph({
            children: [new TextRun({ text: cmrWarningBody, size: 20 })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 300 }
          })
        );
      }

      children.push(table);

      // Aggiungi page break tra le sezioni (tranne l'ultima)
      if(index < state.rows.length - 1){
        children.push(new Paragraph({ pageBreakBefore: true }));
      }

      return children;
    });

    // =================== APPENDICE: GUIDA INDICI + RIFERIMENTI NORMATIVI ===
    // Stampata UNA volta a fine documento. Serve ad allineare i valori
    // numerici nelle tabelle con il loro significato operativo.
    const guideRows = ['D','Q','U','C','T','I'].map(key => {
      const name = t('doc.indexGuide.rows.' + key + '.name');
      const meaning = t('doc.indexGuide.rows.' + key + '.meaning');
      const lab = t('doc.indexGuide.rows.' + key + '.lab');
      const prod = t('doc.indexGuide.rows.' + key + '.production');
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 24 })] })],
            width: { size: 8, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: name, bold: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: meaning })] })],
            width: { size: 32, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: lab, italics: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: prod, italics: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          })
        ]
      });
    });

    // Riga intestazione della guida
    const guideHeader = new TableRow({
      tableHeader: true,
      children: [
        ['index', 8], ['name', 20], ['meaning', 32], ['labExample', 20], ['productionExample', 20]
      ].map(([col, size]) => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: t('doc.indexGuide.columns.' + col), bold: true, color: 'FFFFFF' })]
        })],
        width: { size, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: '1F4E78', fill: '1F4E78' }
      }))
    });

    const guideTable = new Table({
      rows: [guideHeader, ...guideRows],
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    const appendix = [
      new Paragraph({ pageBreakBefore: true }),
      new Paragraph({
        children: [new TextRun({ text: t('doc.indexGuide.title'), bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: t('doc.indexGuide.intro'), size: 20 })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 }
      }),
      guideTable,
      new Paragraph({
        children: [new TextRun({ text: t('doc.indexGuide.formulaTitle'), bold: true, size: 22 })],
        alignment: AlignmentType.LEFT,
        spacing: { before: 300, after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: t('doc.indexGuide.formula'), font: 'Consolas', size: 20 })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [new TextRun({ text: t('doc.normReference.title'), bold: true, size: 22 })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: t('doc.normReference.body'), size: 18, italics: true })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 }
      })
    ];

    // Crea il documento con tutte le sezioni + appendice normativa
    const doc = new Document({
      sections: [{
        properties: {},
        children: [...sections.flat(), ...appendix]
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
  const extractionMessages = [];
  try{
    for(const file of state.files){
      const document = await pdfToDocument(file);
      const text = document.text;
      const sdsAnalysis = analyzeSdsDocument(document);
      let productCodes = sdsAnalysis.productHazards.map(formatHazardCode);
      if(!productCodes.length && guessUV(file.name, text)){
        productCodes = UV_FALLBACK.slice();
        extractionMessages.push(`${file.name}: applicato fallback UV; verifica manuale obbligatoria.`);
      }

      // Solo la classificazione del prodotto in sezione 2 alimenta il calcolo ordinario.
      const separated = separateHCodes(productCodes);
      const hcodesHealth = separated.health;
      const hcodesPhysical = separated.physical;

      const healthResult = sdsAnalysis.health;
      const cmrCodes = healthResult.status === 'excluded_cmr' && healthResult.determiningHazard
        ? [healthResult.determiningHazard.code]
        : [];
      const isCmr = healthResult.status === 'excluded_cmr';
      const score = typeof healthResult.score === 'number' ? healthResult.score : 0;
      if(healthResult.status !== 'calculated'){
        extractionMessages.push(`${file.name}: ${healthResult.status === 'excluded_cmr'
          ? 'classificazione CMR 1A/1B - usare il percorso Titolo IX Capo II.'
          : 'calcolo salute sospeso: controllare sezioni 2 e 3 della SDS.'}`);
      }
      if(sdsAnalysis.referenceHazards.length){
        extractionMessages.push(`${file.name}: ${sdsAnalysis.referenceHazards.length} frasi della sezione 16 escluse dal calcolo.`);
      }

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

      // Calcola A1 e A2 automaticamente dagli H-codes fisici
      const calculatedA1 = calculateA1FromPhysicalCodes(hcodesPhysical);
      const calculatedA2 = calculateA2FromPhysicalCodes(hcodesPhysical);

      const row = {
        // HEALTH fields
        file: file.name,
        nome: cleanedProductName,
        statoFisico: defaults.statoFisico,
        hcodes: hcodesHealth, // Solo H-codes salute
        cmrCodes: cmrCodes,   // Frasi CMR cat. 1A/1B (escluse dal calcolo P)
        isCmr: isCmr,         // Flag: sostanza da valutare ex Titolo IX Capo II
        healthAssessmentStatus: healthResult.status,
        healthRuleId: healthResult.ruleId,
        methodologyId: sdsAnalysis.methodologyId,
        analysisWarnings: sdsAnalysis.warnings,
        baseAnalysisWarnings: sdsAnalysis.warnings,
        sdsEvidence: {
          productHazards: sdsAnalysis.productHazards,
          ingredientHazards: sdsAnalysis.ingredientHazards,
          ingredients: sdsAnalysis.ingredients,
          ingredientParsingStatus: sdsAnalysis.ingredientParsingStatus,
          referenceHazards: sdsAnalysis.referenceHazards,
          isMixture: sdsAnalysis.isMixture,
          mixturePhase: sdsAnalysis.mixturePhase,
          dpi: sdsAnalysis.dpi
        },
        review: window.MovarischReviewWorkflow.createReviewState(),
        activePreset: 'preset1', // Preset attivo (default = Preset 1 = Laboratorio)
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

        // M.I.R.C. FIELDS (INRS Safety Risk Assessment)
        A1: calculatedA1, // Proprietà chimico-fisiche pericolose (AUTO-CALCOLATO)
        A2: calculatedA2, // Proprietà chimiche pericolose - reazioni (AUTO-CALCOLATO)
        B1: defaults.B1, // Modalità di lavoro
        B2: defaults.B2, // Frequenza e tempi di utilizzo
        B3: defaults.B3, // Quantitativi utilizzati
        B4: defaults.B4, // Fattori di riduzione (negativi)
        D_mirc: 0,   // Calcolato da recalcRow()
        E_mirc: 0,   // Calcolato da recalcRow()
        IRC: 0,      // Calcolato da recalcRow()
        mircLevel: 'irrilevante',
        mircClass: 'irr',
        mircText: '',

        // Legacy fields (da rimuovere in futuro)
        PI: 10, IQ: 1, FCO: 1.0,
        RiskSafety: 10, SafetyLevel: 'basso', SafetyClass: 'irr',
        OverallRiskValue: 0, OverallClass: 'irr'
      };
      state.rows.push(row);
    }
    render();
    if(extractionMessages.length){
      showAlert(extractionMessages.join('\n'));
    }
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
    if(!reviewsReadyForExport()) return;
    // Salva tutti i dati della tabella in localStorage
    const dataToSave = {
      rows: state.rows,
      timestamp: new Date().toISOString(),
      count: state.rows.length,
      version: window.electronAPI?.version || 'web'
    };

    // CANCELLA vecchi dati prima di salvare nuovi (evita contaminazione)
    localStorage.removeItem('movarisch_cumulative_data');

    // Salva i nuovi dati
    localStorage.setItem('movarisch_cumulative_data', JSON.stringify(dataToSave));

    // Apri la scheda cumulativa con timestamp per evitare cache
    const timestamp = new Date().getTime();
    const url = `cumulative-report.html?t=${timestamp}`;
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
