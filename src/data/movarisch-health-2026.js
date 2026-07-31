(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MoVaRisChHealth2026 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const METADATA = Object.freeze({
    model: 'MoVaRisCh - pericolo per la salute',
    edition: '2026-02-28',
    schemaVersion: 1,
    sourceTitle: 'Modello di valutazione del rischio da agenti chimici pericolosi per la salute',
    sourceUrl: 'https://www.ausl.mo.it/media/MoVaRisCh-2026-aggiornamento-del-28-02-2026-approvato.pdf',
    sourcePages: '10-13 (pagine PDF 11-14)',
    transcriptionNote: 'Coefficienti P trascritti dalla tabella ufficiale; le categorie sono parte della chiave quando indicate.',
  });

  // Tabella ufficiale dei coefficienti P, edizione 28/02/2026.
  // Le righe senza categoria hanno una chiave univoca basata sul solo codice H/EUH.
  const HEALTH_SCORE_ROWS = Object.freeze([
    ['H332', null, 4.50], ['H312', null, 3.00], ['H302', null, 2.00],
    ['H331', null, 6.00], ['H311', null, 4.50], ['H301', null, 2.25],
    ['H330', '2', 7.50], ['H310', '2', 5.50], ['H300', '2', 2.50],
    ['H330', '1', 8.50], ['H310', '1', 6.50], ['H300', '1', 3.00],
    ['H314', '1A', 6.25], ['H314', '1B', 5.75], ['H314', '1C', 5.50],
    ['H315', null, 2.50], ['H318', null, 4.50], ['H319', null, 3.00],
    ['H334', '1A', 9.00], ['H334', '1B', 8.00],
    ['H317', '1A', 6.00], ['H317', '1B', 4.50],
    ['H370', null, 9.50], ['H371', null, 8.00], ['H335', null, 3.25],
    ['H336', null, 3.50], ['H372', null, 8.00], ['H373', null, 7.00],
    ['H304', null, 5.00], ['H341', null, 8.00], ['H351', null, 8.00],
    ['H361', null, 8.00], ['H361d', null, 7.50], ['H361f', null, 7.50],
    ['H361fd', null, 8.00], ['H362', null, 6.00],
    ['EUH029', null, 3.00], ['EUH031', null, 3.00], ['EUH032', null, 3.50],
    ['EUH066', null, 2.50], ['EUH070', null, 6.00], ['EUH071', null, 6.50],
    ['EUH201', null, 6.00], ['EUH201A', null, 6.00], ['EUH202', null, 4.50],
    ['EUH203', null, 4.50], ['EUH204', null, 7.00], ['EUH205', null, 4.50],
    ['EUH206', null, 3.00], ['EUH207', null, 8.00], ['EUH208', null, 4.00],
    ['EUH380', null, 10.00], ['EUH381', null, 8.00],
  ].map(function (row) {
    return Object.freeze({ code: row[0], category: row[1], score: row[2] });
  }));

  const GENERIC_MIXTURE_SCORES = Object.freeze({
    ingredientScoreAtLeast8: 5.50,
    inhalationBelow8OrSkinSensitizer1A: 4.00,
    inhalationAcute4IrritationNarcosisOrSkinSensitizer1B: 2.50,
    acuteDermalOrOralScoreAtLeast3: 2.25,
    ingredientWithOccupationalLimit: 2.25,
    acuteDermalOrOralScoreBelow3: 1.75,
    noHazardousIngredient: 1.00,
  });

  function normalizeHazardCode(value) {
    if (value == null) return null;
    const match = String(value).toUpperCase().match(/\b(EUH\s*\d{3}[A-Z]?|H\s*\d{3}[A-Z]{0,2})\b/);
    if (!match) return null;
    const upper = match[1].replace(/\s+/g, '');
    const row = HEALTH_SCORE_ROWS.find(function (item) {
      return item.code.toUpperCase() === upper;
    });
    return row ? row.code : upper;
  }

  function normalizeCategory(value) {
    if (value == null || String(value).trim() === '') return null;
    const text = String(value).toUpperCase().replace(/,/g, '.');
    const explicit = text.match(/(?:CAT(?:EGORIA|EGORY)?\.?\s*)([123](?:[ABC])?)/);
    if (explicit) return explicit[1];
    const standalone = text.match(/\b([123](?:[ABC])?)\b/);
    return standalone ? standalone[1] : null;
  }

  function unpackHazard(input, explicitCategory) {
    if (typeof input === 'string' || typeof input === 'number') {
      return {
        code: normalizeHazardCode(input),
        category: normalizeCategory(explicitCategory) || normalizeCategory(input),
      };
    }
    const item = input || {};
    const rawCode = item.code || item.hCode || item.hazardCode || item.statement || item.text || '';
    return {
      code: normalizeHazardCode(rawCode),
      category: normalizeCategory(explicitCategory) ||
        normalizeCategory(item.category || item.cat || item.classification || item.hazardClass) ||
        normalizeCategory(rawCode),
    };
  }

  /**
   * Restituisce una risoluzione esplicita. In presenza di più categorie possibili non
   * sceglie un punteggio prudenziale arbitrario: `ambiguous` resta true e il chiamante
   * deve richiedere/reperire la categoria dalla SDS.
   */
  function lookupHealthHazard(input, explicitCategory) {
    const hazard = unpackHazard(input, explicitCategory);
    if (!hazard.code) {
      return { found: false, ambiguous: false, code: null, category: hazard.category, row: null, candidates: [] };
    }
    const candidates = HEALTH_SCORE_ROWS.filter(function (row) {
      return row.code.toUpperCase() === hazard.code.toUpperCase();
    });
    if (candidates.length === 0) {
      return { found: false, ambiguous: false, code: hazard.code, category: hazard.category, row: null, candidates: [] };
    }
    const exact = candidates.find(function (row) {
      return row.category === hazard.category;
    });
    if (exact) {
      return { found: true, ambiguous: false, code: exact.code, category: exact.category, row: exact, candidates: candidates };
    }
    const categoryFree = candidates.find(function (row) { return row.category === null; });
    if (categoryFree) {
      return { found: true, ambiguous: false, code: categoryFree.code, category: null, row: categoryFree, candidates: candidates };
    }
    return {
      found: false,
      ambiguous: true,
      code: hazard.code,
      category: hazard.category,
      row: null,
      candidates: candidates,
    };
  }

  function getHealthScore(input, category) {
    const result = lookupHealthHazard(input, category);
    return result.found ? result.row.score : null;
  }

  return Object.freeze({
    METADATA: METADATA,
    HEALTH_SCORE_ROWS: HEALTH_SCORE_ROWS,
    GENERIC_MIXTURE_SCORES: GENERIC_MIXTURE_SCORES,
    normalizeHazardCode: normalizeHazardCode,
    normalizeCategory: normalizeCategory,
    lookupHealthHazard: lookupHealthHazard,
    getHealthScore: getHealthScore,
  });
});
