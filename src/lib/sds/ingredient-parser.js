(function (root, factory) {
  const dependency = typeof module === 'object' && module.exports
    ? require('./hazard-parser.js')
    : (root.MovarischSds || {});
  const api = factory(dependency);

  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MovarischSds = root.MovarischSds || {};
  Object.assign(root.MovarischSds, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (dependency) {
  'use strict';

  const parseHazards = dependency.parseHazards;

  // Evita di scambiare la coda di un numero INDEX CLP (es. 613-167-00-5)
  // per un numero CAS autonomo (167-00-5).
  const CAS_PATTERN = /(?<![\d-])(\d{2,7}-\d{2}-\d)(?![\d-])/g;
  const EC_PATTERN = /\b(?:CE|EC|EINECS|ELINCS)\s*(?:n(?:\.|°|º)?|number|no\.?)?\s*[:#]?\s*(\d{3}-\d{3}-\d)\b/i;
  const H_CODE_PATTERN = /\b(?:EUH|H)\s*\d{3}(?:FD|Fd|Df|fd|[fFdDiI])?\b/i;
  const HEADER_PATTERN = /^(?:3\.\d|miscele?|mixtures?|nome|name|identificatore|identifier|numero\s+cas|cas\s*(?:n|no|number)|concentrazione|concentration|classificazione|classification)\b/i;
  const NUMBER_SOURCE = '(\\d+(?:[.,]\\d+)?)';

  function clean(value) {
    return String(value == null ? '' : value)
      .replace(/\u00ad/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  function toLines(sectionOrText) {
    if (typeof sectionOrText === 'string') {
      return sectionOrText.split(/\r?\n/).map((text, index) => ({
        text: clean(text), page: null, line: index + 1
      }));
    }
    if (!sectionOrText || typeof sectionOrText !== 'object') {
      throw new TypeError('parseSection3Ingredients richiede il testo o un oggetto sezione.');
    }
    if (Array.isArray(sectionOrText.lines)) {
      return sectionOrText.lines.map((entry, index) => ({
        text: clean(entry && typeof entry === 'object' ? entry.text : entry),
        page: entry && typeof entry === 'object' && entry.page != null ? entry.page : null,
        line: entry && typeof entry === 'object' && entry.line != null ? entry.line : index + 1,
        isHeading: Boolean(entry && typeof entry === 'object' && entry.isHeading)
      }));
    }
    return String(sectionOrText.text || '').split(/\r?\n/).map((text, index) => ({
      text: clean(text), page: sectionOrText.pageStart ?? null, line: index + 1
    }));
  }

  function evidence(line) {
    return { page: line.page, line: line.line, sourceText: line.text };
  }

  function number(value) {
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function validCas(cas) {
    const digits = cas.replace(/-/g, '');
    const check = Number(digits.at(-1));
    let sum = 0;
    for (let index = digits.length - 2, weight = 1; index >= 0; index -= 1, weight += 1) {
      sum += Number(digits[index]) * weight;
    }
    return sum % 10 === check;
  }

  function concentrationCandidates(text) {
    const normalized = clean(text).replace(/[–—]/g, '-');
    const massBasis = /(?:\bp\s*\/\s*p\b|\bw\s*\/\s*w\b|\bm\s*\/\s*m\b|\bpeso\b|\bweight\b)/i.test(normalized);
    const volumeBasis = /(?:\bv\s*\/\s*v\b|\bvolume\b)/i.test(normalized);
    const basis = massBasis && !volumeBasis ? 'mass' : volumeBasis && !massBasis ? 'volume' : 'unspecified';
    const unitMatch = normalized.match(/(?:%|\b(?:p\s*\/\s*p|w\s*\/\s*w|v\s*\/\s*v|m\s*\/\s*m|peso|weight|volume)\b)/i);
    const unit = unitMatch ? '%' : null;
    const candidates = [];
    const occupied = [];
    let match;

    function add(matchValue, item) {
      const start = matchValue.index;
      const end = start + matchValue[0].length;
      if (occupied.some(range => start < range.end && end > range.start)) return;
      occupied.push({ start, end });
      candidates.push({ ...item, basis, certainty: item.unit ? 'explicit' : 'unit_missing', crossesThreshold: null });
    }

    const betweenX = new RegExp(`${NUMBER_SOURCE}\\s*(<=|<)\\s*[xXcC]\\s*(<=|<)\\s*${NUMBER_SOURCE}`, 'g');
    while ((match = betweenX.exec(normalized))) {
      add(match, { lower: number(match[1]), upper: number(match[4]), min: number(match[1]), max: number(match[4]), minInclusive: match[2] === '<=', maxInclusive: match[3] === '<=', unit, raw: match[0] });
    }

    const xBetween = new RegExp(`[xXcC]\\s*(>=|>)\\s*${NUMBER_SOURCE}\\s*(?:e|and|&)\\s*[xXcC]\\s*(<=|<)\\s*${NUMBER_SOURCE}`, 'ig');
    while ((match = xBetween.exec(normalized))) {
      add(match, { lower: number(match[2]), upper: number(match[4]), min: number(match[2]), max: number(match[4]), minInclusive: match[1] === '>=', maxInclusive: match[3] === '<=', unit, raw: match[0] });
    }

    const range = new RegExp(`(?:>=?\\s*)?${NUMBER_SOURCE}\\s*(?:-|a|to)\\s*(?:<=?\\s*)?${NUMBER_SOURCE}\\s*%`, 'ig');
    while ((match = range.exec(normalized))) {
      add(match, { lower: number(match[1]), upper: number(match[2]), min: number(match[1]), max: number(match[2]), minInclusive: true, maxInclusive: true, unit: '%', raw: match[0] });
    }

    const upper = new RegExp(`(?:[xXcC]\\s*)?(<=|<)\\s*${NUMBER_SOURCE}\\s*%?`, 'g');
    while ((match = upper.exec(normalized))) {
      add(match, { lower: 0, upper: number(match[2]), min: 0, max: number(match[2]), minInclusive: true, maxInclusive: match[1] === '<=', unit, raw: match[0] });
    }

    const lower = new RegExp(`(?:[xXcC]\\s*)?(>=|>)\\s*${NUMBER_SOURCE}\\s*%`, 'g');
    while ((match = lower.exec(normalized))) {
      add(match, { lower: number(match[2]), upper: null, min: number(match[2]), max: null, minInclusive: match[1] === '>=', maxInclusive: null, unit: '%', raw: match[0] });
    }

    const exact = new RegExp(`(?:^|[;:,])\\s*${NUMBER_SOURCE}\\s*%`, 'g');
    while ((match = exact.exec(normalized))) {
      add(match, { lower: number(match[1]), upper: number(match[1]), min: number(match[1]), max: number(match[1]), minInclusive: true, maxInclusive: true, unit: '%', raw: match[0].trim().replace(/^[;:,]\s*/, '') });
    }

    const unique = new Map();
    for (const item of candidates) {
      if (item.min == null || (item.max == null && item.upper !== null)) continue;
      unique.set(`${item.min}|${item.max}|${item.minInclusive}|${item.maxInclusive}|${item.raw}`, item);
    }
    return [...unique.values()];
  }

  function specificLimits(lines) {
    const results = [];
    for (const line of lines) {
      if (!/(?:limite.*concentrazione.*specific|specific.*concentration.*limit|\bSCL\b)/i.test(line.text)) continue;
      const hazards = parseHazards(line.text, { section: 3 });
      const concentrations = concentrationCandidates(line.text);
      if (hazards.length === 1 && concentrations.length === 1) {
        results.push({ hazardCode: hazards[0].code, ...concentrations[0], evidence: evidence(line) });
      } else {
        results.push({ hazardCode: hazards[0] ? hazards[0].code : null, raw: line.text, evidence: evidence(line), needsReview: true });
      }
    }
    return results;
  }

  function isSpecificLimitLine(line) {
    return /(?:limite.*concentrazione.*specific|specific.*concentration.*limit|\bSCL\b)/i.test(line.text);
  }

  function dedupeHazardsPreferCategory(hazards) {
    const selected = new Map();
    for (const hazard of hazards) {
      const key = String(hazard.code || '').toUpperCase();
      const current = selected.get(key);
      if (!current || (!current.category && hazard.category)) selected.set(key, hazard);
    }
    return [...selected.values()];
  }

  function relevantParameters(lines) {
    const ate = [];
    const mFactors = [];
    const oels = [];
    for (const line of lines) {
      let match = line.text.match(/\b(?:ATE|STA)\b[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(mg\/?kg|mg\/?l)/i);
      if (match) ate.push({ value: number(match[1]), unit: match[2].toLowerCase(), raw: line.text, evidence: evidence(line) });
      match = line.text.match(/\b(?:fattore\s+M|M[ -]?factor)\b\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
      if (match) mFactors.push({ value: number(match[1]), raw: line.text, evidence: evidence(line) });
      if (/(?:\bOEL\b|\bVLEP\b|\bTLV\b|valore\s+limite.*(?:esposizione|occupaz)|occupational\s+exposure\s+limit)/i.test(line.text)) {
        const originMatch = line.text.match(/\b(UE|EU|Italia|Italy|ACGIH|DFG|OSHA|NIOSH)\b/i);
        oels.push({ raw: line.text, origin: originMatch ? originMatch[1] : 'not_stated', evidence: evidence(line) });
      }
    }
    return { ate, mFactors, oels };
  }

  function likelyName(lines, casLineIndex) {
    const casLine = lines[casLineIndex].text;
    const prefix = clean(casLine.slice(0, casLine.search(/\b\d{2,7}-\d{2}-\d\b/))).replace(/(?:CAS|n\.|no\.?|numero)\s*[:#]?\s*$/i, '').trim();
    CAS_PATTERN.lastIndex = 0;
    if (prefix && !HEADER_PATTERN.test(prefix) && !H_CODE_PATTERN.test(prefix)) return prefix;
    for (let index = casLineIndex - 1; index >= Math.max(0, casLineIndex - 5); index -= 1) {
      const value = lines[index].text;
      if (isLikelyIngredientName(value)) {
        CAS_PATTERN.lastIndex = 0;
        return value;
      }
      CAS_PATTERN.lastIndex = 0;
    }
    return null;
  }

  function isLikelyIngredientName(value) {
    const text = clean(value);
    if (!text || /^(?:CE|EC|EINECS|ELINCS|INDEX|Reg\.\s*REACH)\b/i.test(text)) return false;
    CAS_PATTERN.lastIndex = 0;
    const hasCas = CAS_PATTERN.test(text);
    CAS_PATTERN.lastIndex = 0;
    return !HEADER_PATTERN.test(text) && !H_CODE_PATTERN.test(text) && !hasCas && !concentrationCandidates(text).length;
  }

  function parseSection3Ingredients(sectionOrText) {
    const lines = toLines(sectionOrText).filter(line => !line.isHeading && line.text);
    const anchors = [];
    lines.forEach((line, index) => {
      CAS_PATTERN.lastIndex = 0;
      let match;
      while ((match = CAS_PATTERN.exec(line.text))) anchors.push({ index, cas: match[1], line });
    });
    const warnings = [];
    const ingredients = [];

    if (!anchors.length) {
      const hasCompositionData = lines.some(line => H_CODE_PATTERN.test(line.text) || concentrationCandidates(line.text).length);
      if (hasCompositionData) warnings.push({ code: 'SECTION3_NO_CAS_ANCHOR', message: 'Dati di composizione presenti ma nessun CAS riconosciuto: associazione ingredienti da verificare.' });
      return { ingredients, warnings, status: hasCompositionData ? 'needs_review' : 'empty' };
    }

    const blockStarts = anchors.map((anchor, anchorIndex) => {
      const floor = anchorIndex ? anchors[anchorIndex - 1].index + 1 : 0;
      for (let index = anchor.index - 1; index >= Math.max(floor, anchor.index - 5); index -= 1) {
        if (isLikelyIngredientName(lines[index].text)) return index;
      }
      return Math.max(floor, anchor.index - 2);
    });

    anchors.forEach((anchor, anchorIndex) => {
      const start = blockStarts[anchorIndex];
      const nextStart = anchorIndex + 1 < anchors.length ? blockStarts[anchorIndex + 1] : lines.length;
      const end = nextStart - 1;
      const block = lines.slice(start, end + 1);
      const allConcentrations = block.flatMap(line => concentrationCandidates(line.text).map(value => ({ value, line })));
      const nonLimitConcentrations = allConcentrations.filter(item => !isSpecificLimitLine(item.line));
      const uniqueConcentrations = new Map(nonLimitConcentrations.map(item => [`${item.value.min}|${item.value.max}|${item.value.raw}`, item]));
      const concentrationItems = [...uniqueConcentrations.values()];
      const reasons = [];
      if (!validCas(anchor.cas)) reasons.push('INVALID_CAS_CHECKSUM');
      if (!concentrationItems.length) reasons.push('CONCENTRATION_MISSING');
      if (concentrationItems.length > 1) reasons.push('MULTIPLE_CONCENTRATIONS');
      const chosen = concentrationItems.length === 1 ? concentrationItems[0] : null;
      if (chosen && !chosen.value.unit) reasons.push('CONCENTRATION_UNIT_ASSUMED_PERCENT');
      if (chosen && chosen.value.unit === '%' && chosen.value.basis === 'unspecified') reasons.push('CONCENTRATION_BASIS_UNSPECIFIED');
      if (chosen && chosen.value.max != null && chosen.value.min > chosen.value.max) reasons.push('CONCENTRATION_RANGE_INCOHERENT');
      const limits = specificLimits(block);
      if (limits.some(item => item.needsReview)) reasons.push('SPECIFIC_LIMIT_AMBIGUOUS');
      const parameters = relevantParameters(block);
      const ec = block.map(line => line.text.match(EC_PATTERN)).find(Boolean);
      const classificationLines = block.filter(line => !isSpecificLimitLine(line));
      const hazards = dedupeHazardsPreferCategory(parseHazards({ number: '3', lines: classificationLines }));
      if (!hazards.length) reasons.push('HAZARD_CLASSIFICATION_NOT_FOUND');
      const record = {
        name: likelyName(lines, anchor.index),
        cas: anchor.cas,
        ecNumber: ec ? ec[1] : null,
        concentration: chosen ? { ...chosen.value, unit: chosen.value.unit || '%' } : null,
        hazards,
        hazardStatus: hazards.length ? 'parsed' : 'not_stated_in_extracted_block',
        specificConcentrationLimits: limits,
        ate: parameters.ate,
        mFactors: parameters.mFactors,
        occupationalExposureLimits: parameters.oels,
        evidence: block.map(evidence),
        needsReview: reasons.length > 0,
        reviewReasons: reasons
      };
      ingredients.push(record);
      if (record.needsReview) warnings.push({ code: 'INGREDIENT_NEEDS_REVIEW', cas: record.cas, reasons, page: anchor.line.page, line: anchor.line.line });
    });

    return { ingredients, warnings, status: warnings.length ? 'needs_review' : 'parsed' };
  }

  function classifyConcentrationAgainstThreshold(concentration, threshold) {
    const value = Number(threshold);
    if (!concentration || !Number.isFinite(value) || concentration.lower == null) return 'unknown';
    const lower = Number(concentration.lower);
    const upper = concentration.upper == null ? null : Number(concentration.upper);
    if (!Number.isFinite(lower) || (upper != null && !Number.isFinite(upper))) return 'unknown';
    if (upper == null) return lower >= value ? 'at_or_above' : 'unknown';
    if (upper < value || (upper === value && concentration.maxInclusive === false)) return 'below';
    if (lower >= value) return 'at_or_above';
    return 'crosses_threshold';
  }

  return { parseSection3Ingredients, parseConcentrationExpression: concentrationCandidates, classifyConcentrationAgainstThreshold, isValidCas: validCas };
});
