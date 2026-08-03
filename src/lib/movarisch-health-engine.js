(function (root, factory) {
  const data = typeof module === 'object' && module.exports
    ? require('../data/movarisch-health-2026.js')
    : root.MoVaRisChHealth2026;
  const api = factory(data);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MoVaRisChHealthEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (healthData) {
  'use strict';

  if (!healthData) throw new Error('MoVaRisChHealth2026 deve essere caricato prima del motore salute.');

  const CMR_CATEGORY_1_CODES = /^H(?:340|350I?|360[A-Z]{0,2})$/i;
  const TABLE_3_CLASSIFIED_MIXTURE_OVERRIDE_CODES = new Set([
    'H330/1', 'H334/1A', 'H334/1B', 'H370', 'H371', 'H372',
    'H341', 'H351', 'H361', 'H361FD', 'EUH381',
  ]);
  const UNCLASSIFIED_MIXTURE_ONLY_EUH_EXCLUSIONS = new Set([
    'EUH029', 'EUH031', 'EUH032', 'EUH066', 'EUH201', 'EUH201A',
    'EUH202', 'EUH203', 'EUH204', 'EUH205', 'EUH206', 'EUH207', 'EUH208',
  ]);
  const SPECIAL_POINT_ONE_PERCENT_CODES = /^(?:H341|H351|H361[A-Z]{0,2}|H362|EUH381)$/i;
  const INHALATION_CODES = new Set(['H330', 'H331', 'H332', 'H334', 'H335', 'H336']);
  const DERMAL_OR_MUCOSAL_CODES = new Set(['H310', 'H311', 'H312', 'H314', 'H315', 'H317', 'H318', 'H319']);
  const ORAL_CODES = new Set(['H300', 'H301', 'H302', 'H304']);
  const ACUTE_ONLY_CODES = new Set([
    'H300', 'H301', 'H302', 'H304', 'H310', 'H311', 'H312',
    'H314', 'H315', 'H318', 'H319',
  ]);

  function sourceSection(hazard) {
    if (!hazard || typeof hazard !== 'object') return null;
    const raw = hazard.section != null ? hazard.section : hazard.source;
    if (raw == null) return null;
    const match = String(raw).match(/(?:SEZIONE|SECTION)?\s*(\d{1,2})/i);
    return match ? Number(match[1]) : null;
  }

  function isSection2OrUnspecified(hazard) {
    const section = sourceSection(hazard);
    return section == null || section === 2;
  }

  function describeHazard(hazard, resolved, extra) {
    const item = hazard && typeof hazard === 'object' ? hazard : {};
    return Object.assign({
      code: resolved.code,
      category: resolved.row ? resolved.row.category : resolved.category,
      score: resolved.row ? resolved.row.score : null,
      section: sourceSection(hazard),
      name: item.name || item.ingredientName || null,
    }, extra || {});
  }

  function isOutsideHealthModel(code) {
    const normalized = String(code || '').toUpperCase();
    // Le classi H2xx sono pericoli fisici; le H4xx sono ambientali. Non sono
    // errori di classificazione e non devono sospendere il coefficiente P.
    if (/^H[24]\d{2}[A-Z]{0,2}$/.test(normalized)) return true;
    // Indicazioni supplementari senza coefficiente P (ad es. EUH210) restano
    // documentate, ma non sono dati mancanti del modello salute.
    if (/^EUH\d{3}[A-Z]?$/.test(normalized) &&
        !healthData.HEALTH_SCORE_ROWS.some(function (row) {
          return row.code.toUpperCase() === normalized;
        })) return true;
    return false;
  }

  function resolveList(hazards, warnings, prefix) {
    const resolved = [];
    (Array.isArray(hazards) ? hazards : []).forEach(function (hazard) {
      const section = sourceSection(hazard);
      if (section === 16) {
        warnings.push(prefix + '_SECTION_16_IGNORED');
        return;
      }
      const lookup = healthData.lookupHealthHazard(hazard);
      if (prefix === 'INGREDIENT' && lookup.code && CMR_CATEGORY_1_CODES.test(lookup.code)) {
        // Il modello non attribuisce uno score Capo I ai CMR 1A/1B. La loro
        // presenza nell'ingrediente va segnalata, ma non riclassifica da sola il
        // prodotto e non soddisfa artificialmente la soglia "score >= 8".
        warnings.push('INGREDIENT_CMR_REQUIRES_MIXTURE_CLASSIFICATION_CHECK:' + lookup.code);
        return;
      }
      if (lookup.ambiguous) warnings.push(prefix + '_CATEGORY_REQUIRED:' + lookup.code);
      else if (!lookup.found && isOutsideHealthModel(lookup.code)) {
        warnings.push(prefix + '_NON_HEALTH_HAZARD_IGNORED:' + lookup.code);
      }
      else if (!lookup.found) warnings.push(prefix + '_UNMAPPED_HAZARD:' + (lookup.code || 'INVALID'));
      else resolved.push({ input: hazard, lookup: lookup });
    });
    return resolved;
  }

  function flattenIngredientHazards(ingredients) {
    const flattened = [];
    (Array.isArray(ingredients) ? ingredients : []).forEach(function (ingredient) {
      if (typeof ingredient === 'string') {
        flattened.push({ hazard: ingredient, ingredient: {} });
        return;
      }
      const item = ingredient || {};
      const hazards = item.hazards || item.hazardStatements || item.classifications;
      if (Array.isArray(hazards)) {
        hazards.forEach(function (hazard) {
          if (hazard && typeof hazard === 'object') {
            flattened.push({ hazard: Object.assign({}, hazard, { name: hazard.name || item.name }), ingredient: item });
          } else {
            flattened.push({ hazard: { code: hazard, name: item.name, section: 3 }, ingredient: item });
          }
        });
      } else if (item.code || item.hCode || item.hazardCode || item.statement) {
        flattened.push({ hazard: item, ingredient: item });
      }
    });
    return flattened;
  }

  function result(status, score, determiningHazard, ruleId, warnings) {
    return {
      status: status,
      score: score,
      determiningHazard: determiningHazard || null,
      ruleId: ruleId,
      warnings: Array.from(new Set(warnings)),
    };
  }

  function firstDefined(object, keys) {
    for (const key of keys) {
      if (object && object[key] != null && object[key] !== '') return object[key];
    }
    return null;
  }

  function finiteNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const normalized = value.trim().replace(',', '.').replace(/%/g, '');
    if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }

  /**
   * Normalizza una concentrazione percentuale in un intervallo chiuso/aperto.
   * Sono accettati numeri, intervalli "a-b", limiti < / <= / > / >= e oggetti
   * {min,max}. Un intervallo che attraversa la soglia resta intenzionalmente
   * indeterminato: il motore non sceglie il caso prudenziale al posto del tecnico.
   */
  function concentrationRange(ingredient) {
    const item = ingredient || {};
    const direct = firstDefined(item, ['concentrationPercent', 'concentration', 'percentage']);
    const objectRange = item.concentrationRange ||
      (direct && typeof direct === 'object' ? direct : null);
    const minRaw = firstDefined(item, ['minConcentrationPercent', 'concentrationMinPercent', 'minPercent']);
    const maxRaw = firstDefined(item, ['maxConcentrationPercent', 'concentrationMaxPercent', 'maxPercent']);

    if (objectRange && typeof objectRange === 'object') {
      const min = finiteNumber(firstDefined(objectRange, ['min', 'lower', 'from']));
      const maxValue = firstDefined(objectRange, ['max', 'upper', 'to']);
      const max = maxValue == null && objectRange.upper === null ? Infinity : finiteNumber(maxValue);
      if (min != null && max != null && min >= 0 && max >= min) {
        return {
          min: min,
          max: max,
          minInclusive: objectRange.minInclusive !== false,
          maxInclusive: objectRange.maxInclusive !== false,
        };
      }
      return null;
    }
    if (minRaw != null || maxRaw != null) {
      const min = finiteNumber(minRaw);
      const max = finiteNumber(maxRaw);
      if (min != null && max != null && min >= 0 && max >= min) {
        return { min: min, max: max, minInclusive: true, maxInclusive: true };
      }
      return null;
    }
    const exact = finiteNumber(direct);
    if (exact != null) return exact >= 0 ? { min: exact, max: exact, minInclusive: true, maxInclusive: true } : null;
    if (typeof direct !== 'string') return null;

    const text = direct.trim().replace(/,/g, '.').replace(/%/g, '');
    const comparison = text.match(/^(<=|>=|<|>|≤|≥)\s*(\d+(?:\.\d+)?)$/);
    if (comparison) {
      const value = Number(comparison[2]);
      if (comparison[1] === '<' || comparison[1] === '≤') {
        return { min: 0, max: value, minInclusive: true, maxInclusive: comparison[1] === '≤' };
      }
      return { min: value, max: Infinity, minInclusive: comparison[1] === '>=' || comparison[1] === '≥', maxInclusive: false };
    }
    const interval = text.match(/^(\d+(?:\.\d+)?)\s*(?:-|–|—|\.\.)\s*(\d+(?:\.\d+)?)$/);
    if (interval) {
      const min = Number(interval[1]);
      const max = Number(interval[2]);
      if (max >= min) return { min: min, max: max, minInclusive: true, maxInclusive: true };
    }
    return null;
  }

  function compareRangeToThreshold(range, threshold) {
    if (!range || !Number.isFinite(threshold) || threshold < 0) return 'unknown';
    if (range.min > threshold || (range.min === threshold && range.minInclusive)) return 'meets';
    if (range.max < threshold || (range.max === threshold && !range.maxInclusive)) return 'below';
    return 'crosses';
  }

  function normalizeRoutes(ingredient, code) {
    const raw = firstDefined(ingredient, ['exposureRoutes', 'routes', 'route', 'exposureRoute']);
    const values = Array.isArray(raw) ? raw : raw == null ? [] : String(raw).split(/[,;/|]+/);
    const routes = new Set();
    values.forEach(function (value) {
      const text = String(value).trim().toLowerCase();
      if (/inal|respir/.test(text)) routes.add('inhalation');
      if (/cut|derm|mucos|skin|eye|ocul/.test(text)) routes.add('dermal');
      if (/oral|inger|ingest/.test(text)) routes.add('oral');
    });
    if (INHALATION_CODES.has(code)) routes.add('inhalation');
    if (DERMAL_OR_MUCOSAL_CODES.has(code)) routes.add('dermal');
    if (ORAL_CODES.has(code)) routes.add('oral');
    return routes;
  }

  function sensitizerCategory(code, lookup) {
    if (code !== 'H317' && code !== 'H334') return null;
    const category = lookup && lookup.row ? lookup.row.category : lookup.category;
    return category ? String(category).toUpperCase() : null;
  }

  function specificLimitForHazard(ingredient, code) {
    const scalar = finiteNumber(firstDefined(ingredient, [
      'specificConcentrationLimitPercent', 'sclPercent', 'sensitizerSpecificConcentrationLimitPercent',
    ]));
    if (scalar != null) return { value: scalar, ambiguous: false };
    const limits = Array.isArray(ingredient.specificConcentrationLimits)
      ? ingredient.specificConcentrationLimits.filter(function (limit) {
        return String(limit && limit.hazardCode || '').toUpperCase() === code.toUpperCase();
      })
      : [];
    if (limits.length !== 1 || limits[0].needsReview === true) {
      return { value: null, ambiguous: limits.length > 0 };
    }
    const value = finiteNumber(firstDefined(limits[0], ['value', 'limit', 'min', 'lower']));
    return { value: value, ambiguous: value == null };
  }

  function concentrationBasis(ingredient) {
    const structuredConcentration = ingredient && typeof ingredient.concentration === 'object'
      ? ingredient.concentration
      : null;
    const raw = firstDefined(ingredient, ['concentrationBasis', 'percentageBasis', 'basis']) ||
      firstDefined(structuredConcentration, ['basis', 'concentrationBasis', 'percentageBasis']);
    if (raw == null) return null;
    const text = String(raw).toLowerCase();
    if (/mass|peso|weight|w\/w|p\/p/.test(text)) return 'mass';
    if (/vol|v\/v/.test(text)) return 'volume';
    return null;
  }

  function ingredientThreshold(ingredient, code, lookup, mixtureIsGas) {
    const category = sensitizerCategory(code, lookup);
    const thresholds = [];
    if (mixtureIsGas === true) {
      thresholds.push({ value: 0.2, rule: 'GENERAL_GAS_0_2_PERCENT', requiredBasis: 'volume' });
    } else if (mixtureIsGas === false) {
      thresholds.push({ value: 1, rule: 'GENERAL_NON_GAS_1_PERCENT', requiredBasis: 'mass' });
    }

    if (SPECIAL_POINT_ONE_PERCENT_CODES.test(code) || category === '1' || category === '1B') {
      thresholds.push({ value: 0.1, rule: 'SPECIAL_CLASS_0_1_PERCENT_MASS', requiredBasis: 'mass' });
    }
    if (category === '1A') {
      thresholds.push({ value: 0.01, rule: 'SENSITIZER_1A_0_01_PERCENT_MASS', requiredBasis: 'mass' });
    }
    const scl = specificLimitForHazard(ingredient, code);
    if ((code === 'H317' || code === 'H334') && scl.value != null && scl.value > 0) {
      thresholds.push({ value: scl.value / 10, rule: 'SENSITIZER_ONE_TENTH_SPECIFIC_LIMIT', requiredBasis: 'mass' });
    }

    const basis = concentrationBasis(ingredient);
    const applicable = thresholds.filter(function (entry) {
      return entry.requiredBasis === basis;
    });
    if (applicable.length === 0) {
      return { value: null, rule: null, basisRequired: true, sclAmbiguous: scl.ambiguous };
    }
    const best = applicable.reduce(function (current, entry) { return entry.value < current.value ? entry : current; });
    best.sclAmbiguous = scl.ambiguous;
    return best;
  }

  function table3HighScoreKey(code, lookup) {
    const category = lookup && lookup.row ? lookup.row.category : lookup.category;
    return String(code).toUpperCase() + (category ? '/' + String(category).toUpperCase() : '');
  }

  function genericScoreForIngredient(ingredient, resolved) {
    const lookup = resolved.lookup;
    const code = lookup.code.toUpperCase();
    const score = lookup.row.score;
    const category = sensitizerCategory(code, lookup);
    const routes = normalizeRoutes(ingredient, code);

    if (score >= 8 && !UNCLASSIFIED_MIXTURE_ONLY_EUH_EXCLUSIONS.has(code)) {
      return { score: healthData.GENERIC_MIXTURE_SCORES.ingredientScoreAtLeast8, rule: 'UNCLASSIFIED_MIXTURE_INGREDIENT_GE8' };
    }
    if (category === '1A' && code === 'H317') {
      return { score: healthData.GENERIC_MIXTURE_SCORES.inhalationBelow8OrSkinSensitizer1A, rule: 'UNCLASSIFIED_MIXTURE_SKIN_SENSITIZER_1A' };
    }
    if (category === '1B' && code === 'H317') {
      return { score: healthData.GENERIC_MIXTURE_SCORES.inhalationAcute4IrritationNarcosisOrSkinSensitizer1B, rule: 'UNCLASSIFIED_MIXTURE_SKIN_SENSITIZER_1B' };
    }
    if (routes.has('inhalation')) {
      if (code === 'H332' || code === 'H335' || code === 'H336') {
        return { score: healthData.GENERIC_MIXTURE_SCORES.inhalationAcute4IrritationNarcosisOrSkinSensitizer1B, rule: 'UNCLASSIFIED_MIXTURE_INHALATION_ACUTE4_IRRITATION_NARCOSIS' };
      }
      if (score < 8) {
        return { score: healthData.GENERIC_MIXTURE_SCORES.inhalationBelow8OrSkinSensitizer1A, rule: 'UNCLASSIFIED_MIXTURE_INHALATION_BELOW8' };
      }
    }
    const onlyDermalOrOral = routes.size > 0 && !routes.has('inhalation') &&
      Array.from(routes).every(function (route) { return route === 'dermal' || route === 'oral'; });
    if (onlyDermalOrOral && ACUTE_ONLY_CODES.has(code)) {
      if (score >= 3) {
        return { score: healthData.GENERIC_MIXTURE_SCORES.acuteDermalOrOralScoreAtLeast3, rule: 'UNCLASSIFIED_MIXTURE_ACUTE_DERMAL_ORAL_GE3' };
      }
      return { score: healthData.GENERIC_MIXTURE_SCORES.acuteDermalOrOralScoreBelow3, rule: 'UNCLASSIFIED_MIXTURE_ACUTE_DERMAL_ORAL_LT3' };
    }
    return null;
  }

  function evaluateUnclassifiedMixture(input, warnings) {
    const ingredients = Array.isArray(input.ingredients) ? input.ingredients : [];
    const phase = String(input.mixturePhase || input.physicalState || '').trim();
    const mixtureIsGas = /gas|gass|gaseous/i.test(phase)
      ? true
      : /liquid|liquid|liquido|solid|solido|polvere|powder|aerosol|nebbia|mist/i.test(phase)
        ? false
        : null;
    const candidates = [];
    let incomplete = false;
    let hazardousIngredientSeen = false;

    ingredients.forEach(function (rawIngredient, ingredientIndex) {
      const ingredient = typeof rawIngredient === 'object' && rawIngredient ? rawIngredient : {};
      const flattened = flattenIngredientHazards([rawIngredient]);
      const explicitEuropeanOel = firstDefined(ingredient, [
        'hasEuropeanOccupationalExposureLimit', 'europeanOccupationalExposureLimit', 'hasEuropeanOel', 'europeanOel',
      ]) === true;
      const parsedEuropeanOel = Array.isArray(ingredient.occupationalExposureLimits) &&
        ingredient.occupationalExposureLimits.some(function (limit) {
          return /^(?:UE|EU)$/i.test(String(limit && limit.origin || '')) ||
            /(?:europe|unione europea|direttiva\s*\(?(?:ue|eu))/i.test(String(limit && limit.raw || ''));
        });
      const hasEuropeanOel = explicitEuropeanOel || parsedEuropeanOel;
      if (flattened.length === 0 && !hasEuropeanOel) return;
      hazardousIngredientSeen = hazardousIngredientSeen || flattened.length > 0;
      const range = concentrationRange(ingredient);

      if (ingredient.needsReview === true) {
        const reasons = Array.isArray(ingredient.reviewReasons) ? ingredient.reviewReasons : [];
        const nonBlockingReasons = new Set(['INFORMATIONAL_ONLY']);
        if (reasons.length === 0 || reasons.some(function (reason) { return !nonBlockingReasons.has(reason); })) {
          warnings.push('INGREDIENT_PARSER_REVIEW_REQUIRED:' + ingredientIndex);
          incomplete = true;
        }
      }

      if (ingredient.qualifiesForGenericScoring === true && !range) {
        warnings.push('INGREDIENT_ELIGIBILITY_MANUALLY_CONFIRMED:' + ingredientIndex);
      } else if (!range) {
        warnings.push('INGREDIENT_CONCENTRATION_REQUIRED:' + ingredientIndex);
        warnings.push('UNCLASSIFIED_MIXTURE_CONCENTRATION_THRESHOLDS_REQUIRE_REVIEW');
        incomplete = true;
      }

      if (hasEuropeanOel) {
        const oelState = ingredient.qualifiesForGenericScoring === true && !range
          ? 'meets'
          : compareRangeToThreshold(range, 1);
        if (oelState === 'meets') {
          candidates.push({
            score: healthData.GENERIC_MIXTURE_SCORES.ingredientWithOccupationalLimit,
            rule: 'UNCLASSIFIED_MIXTURE_EUROPEAN_OEL_GE1_PERCENT',
            ingredient: ingredient,
            hazard: null,
            threshold: 1,
          });
        } else if (oelState === 'crosses' || oelState === 'unknown') {
          warnings.push('INGREDIENT_OEL_THRESHOLD_UNCERTAIN:' + ingredientIndex);
          incomplete = true;
        }
      }

      const localWarnings = [];
      const resolved = resolveList(flattened.map(function (entry) { return entry.hazard; }), localWarnings, 'INGREDIENT');
      localWarnings.forEach(function (warning) { warnings.push(warning + ':INDEX_' + ingredientIndex); });
      if (localWarnings.some(function (warning) {
        return warning.startsWith('INGREDIENT_CATEGORY_REQUIRED:') ||
          warning.startsWith('INGREDIENT_UNMAPPED_HAZARD:') ||
          warning.startsWith('INGREDIENT_CMR_REQUIRES_MIXTURE_CLASSIFICATION_CHECK:');
      })) incomplete = true;

      resolved.forEach(function (hazardResolved) {
        if (UNCLASSIFIED_MIXTURE_ONLY_EUH_EXCLUSIONS.has(hazardResolved.lookup.code.toUpperCase())) {
          warnings.push('INGREDIENT_EUH_ONLY_APPLIES_TO_CLASSIFIED_MIXTURE:' + ingredientIndex + ':' + hazardResolved.lookup.code);
          return;
        }
        const threshold = ingredientThreshold(ingredient, hazardResolved.lookup.code, hazardResolved.lookup, mixtureIsGas);
        const thresholdState = ingredient.qualifiesForGenericScoring === true && !range
          ? 'meets'
          : compareRangeToThreshold(range, threshold && threshold.value);
        if (thresholdState === 'below') return;
        if (thresholdState !== 'meets') {
          if (threshold && threshold.basisRequired) warnings.push('INGREDIENT_CONCENTRATION_BASIS_REQUIRED:' + ingredientIndex);
          if (threshold && threshold.sclAmbiguous) warnings.push('INGREDIENT_SPECIFIC_LIMIT_REQUIRES_REVIEW:' + ingredientIndex + ':' + hazardResolved.lookup.code);
          if (mixtureIsGas == null && (!threshold || threshold.value == null)) warnings.push('MIXTURE_PHASE_REQUIRED_FOR_GENERAL_THRESHOLD');
          warnings.push('INGREDIENT_THRESHOLD_UNCERTAIN:' + ingredientIndex + ':' + hazardResolved.lookup.code);
          incomplete = true;
          return;
        }
        const generic = genericScoreForIngredient(ingredient, hazardResolved);
        if (!generic) {
          warnings.push('INGREDIENT_ROUTE_OR_EFFECT_REQUIRED:' + ingredientIndex + ':' + hazardResolved.lookup.code);
          incomplete = true;
          return;
        }
        candidates.push({
          score: generic.score,
          rule: generic.rule,
          ingredient: ingredient,
          hazard: hazardResolved,
          threshold: threshold.value,
          thresholdRule: threshold.rule,
        });
      });
    });

    if (incomplete) {
      warnings.push('UNCLASSIFIED_MIXTURE_DATA_INSUFFICIENT_FOR_GENERIC_SCORE');
      return result('needs_review', null, null, 'UNCLASSIFIED_MIXTURE_REQUIRES_STRUCTURED_INGREDIENT_DATA', warnings);
    }
    if (candidates.length > 0) {
      const best = candidates.reduce(function (current, candidate) {
        return !current || candidate.score > current.score ? candidate : current;
      }, null);
      const determining = best.hazard
        ? describeHazard(best.hazard.input, best.hazard.lookup, {
          name: best.ingredient.name || null,
          genericMixtureScore: true,
          concentrationThresholdPercent: best.threshold,
          concentrationThresholdRule: best.thresholdRule,
        })
        : {
          code: null,
          category: null,
          score: null,
          section: 3,
          name: best.ingredient.name || null,
          genericMixtureScore: true,
          concentrationThresholdPercent: best.threshold,
        };
      return result('calculated', best.score, determining, best.rule, warnings);
    }
    if (input.compositionComplete === true && !hazardousIngredientSeen) {
      return result('calculated', healthData.GENERIC_MIXTURE_SCORES.noHazardousIngredient, null, 'UNCLASSIFIED_MIXTURE_NO_HAZARDOUS_INGREDIENT', warnings);
    }
    warnings.push('UNCLASSIFIED_MIXTURE_DATA_INSUFFICIENT_FOR_GENERIC_SCORE');
    return result('needs_review', null, null, 'UNCLASSIFIED_MIXTURE_REQUIRES_STRUCTURED_INGREDIENT_DATA', warnings);
  }

  /**
   * Valuta esclusivamente il pericolo P per la salute. `productHazards` deve
   * contenere le classificazioni del prodotto in sezione 2 della SDS; eventuali
   * elementi marcati sezione 16 vengono sempre ignorati.
   */
  function evaluateHealthRisk(options) {
    const input = options || {};
    const warnings = [];
    const productInput = (Array.isArray(input.productHazards) ? input.productHazards : [])
      .filter(function (hazard) {
        if (isSection2OrUnspecified(hazard)) return true;
        warnings.push('PRODUCT_NON_SECTION_2_IGNORED');
        return false;
      });

    // Il routing CMR usa la classificazione del prodotto, mai quella del singolo
    // ingrediente: una sostanza in tracce non rende automaticamente CMR la miscela.
    for (const hazard of productInput) {
      const code = healthData.normalizeHazardCode(
        typeof hazard === 'object' && hazard
          ? hazard.code || hazard.hCode || hazard.hazardCode || hazard.statement || hazard.text
          : hazard
      );
      if (code && CMR_CATEGORY_1_CODES.test(code)) {
        return result(
          'excluded_cmr',
          null,
          { code: code, category: null, score: null, section: sourceSection(hazard) },
          'PRODUCT_CMR_CATEGORY_1_TITLE_IX_CAPO_II',
          warnings
        );
      }
    }

    const productResolved = resolveList(productInput, warnings, 'PRODUCT');
    const hasBlockingProductWarning = warnings.some(function (warning) {
      return warning.startsWith('PRODUCT_CATEGORY_REQUIRED:') || warning.startsWith('PRODUCT_UNMAPPED_HAZARD:');
    });
    const productClassified = (typeof input.productClassified === 'boolean'
      ? input.productClassified
      : productInput.length > 0) && (productResolved.length > 0 || hasBlockingProductWarning);

    if (productClassified) {
      if (productResolved.length === 0 || hasBlockingProductWarning) {
        return result('needs_review', null, null, 'PRODUCT_CLASSIFICATION_INCOMPLETE', warnings);
      }
      const productMax = productResolved.reduce(function (best, current) {
        return !best || current.lookup.row.score > best.lookup.row.score ? current : best;
      }, null);

      if (input.isMixture === true && productMax.lookup.row.score < 4) {
        const flattened = flattenIngredientHazards(input.ingredients);
        if (flattened.length === 0) {
          warnings.push('INGREDIENT_DATA_MISSING_FOR_LOW_SCORE_MIXTURE_CHECK');
          return result(
            'needs_review',
            null,
            describeHazard(productMax.input, productMax.lookup),
            'LOW_SCORE_MIXTURE_REQUIRES_INGREDIENT_REVIEW',
            warnings
          );
        }
        const ingredientResolved = resolveList(flattened.map(function (entry) {
          return entry.hazard;
        }), warnings, 'INGREDIENT');
        const ingredientHigh = ingredientResolved.reduce(function (best, current) {
          const key = table3HighScoreKey(current.lookup.code, current.lookup);
          if (!TABLE_3_CLASSIFIED_MIXTURE_OVERRIDE_CODES.has(key) &&
              !TABLE_3_CLASSIFIED_MIXTURE_OVERRIDE_CODES.has(current.lookup.code.toUpperCase())) return best;
          return !best || current.lookup.row.score > best.lookup.row.score ? current : best;
        }, null);
        if (ingredientHigh) {
          return result(
            'calculated',
            healthData.GENERIC_MIXTURE_SCORES.ingredientScoreAtLeast8,
            describeHazard(ingredientHigh.input, ingredientHigh.lookup, { genericMixtureScore: true }),
            'CLASSIFIED_MIXTURE_PRODUCT_LT4_INGREDIENT_GE8',
            warnings
          );
        }
        if (warnings.some(function (warning) {
          return warning.startsWith('INGREDIENT_CATEGORY_REQUIRED:') ||
            warning.startsWith('INGREDIENT_UNMAPPED_HAZARD:');
        })) {
          warnings.push('INGREDIENT_DATA_INSUFFICIENT_FOR_LOW_SCORE_MIXTURE_CHECK');
          return result('needs_review', null, describeHazard(productMax.input, productMax.lookup), 'LOW_SCORE_MIXTURE_REQUIRES_INGREDIENT_REVIEW', warnings);
        }
      }

      return result(
        'calculated',
        productMax.lookup.row.score,
        describeHazard(productMax.input, productMax.lookup),
        'PRODUCT_SECTION_2_MAX_SCORE',
        warnings
      );
    }

    if (input.isMixture === true) {
      return evaluateUnclassifiedMixture(input, warnings);
    }

    warnings.push('NO_PRODUCT_HEALTH_CLASSIFICATION');
    return result('needs_review', null, null, 'NO_CALCULABLE_PRODUCT_HAZARD', warnings);
  }

  return Object.freeze({
    evaluateHealthRisk: evaluateHealthRisk,
    isProductCmrCategory1: function (hazard) {
      const raw = hazard && typeof hazard === 'object'
        ? hazard.code || hazard.hCode || hazard.hazardCode || hazard.statement
        : hazard;
      const code = healthData.normalizeHazardCode(raw);
      return Boolean(code && CMR_CATEGORY_1_CODES.test(code));
    },
  });
});
