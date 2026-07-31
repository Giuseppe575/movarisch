(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.MovarischSds = root.MovarischSds || {};
  Object.assign(root.MovarischSds, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const HAZARD_CODE = /\b(EUH|H)\s*([0-9]{3})(?:\s*(FD|Fd|Df|fd|[fFdDiI]))?\b/g;
  const CATEGORY_PATTERNS = [
    /(?:categoria|category|cat\.?)[\s:]*(1A|1B|1|2|3|4)\b/ig,
    /(?:Acute\s+Tox\.?|Skin\s+(?:Corr\.?|Irrit\.?|Sens\.?)|Eye\s+(?:Dam\.?|Irrit\.?)|Resp\.?(?:\s+Sens\.?)?|Muta\.?|Carc\.?|Repr\.?|STOT\s+(?:SE|RE)|Aquatic\s+(?:Acute|Chronic))\s*(1A|1B|1|2|3|4)\b/ig
  ];

  function cleanText(value) {
    return String(value == null ? '' : value)
      .replace(/\u00ad/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  function normalizeCode(prefix, digits, suffix) {
    const baseCode = `${prefix.toUpperCase()}${digits}`;
    if (!suffix || prefix.toUpperCase() === 'EUH') return baseCode;

    const raw = String(suffix);
    const lower = raw.toLowerCase();
    if (baseCode === 'H350' && lower === 'i') return 'H350i';
    if (baseCode === 'H361') return `H361${lower}`;
    if (baseCode === 'H360') {
      if (raw === 'FD') return 'H360FD';
      if (raw === 'Df') return 'H360Df';
      if (raw === 'Fd') return 'H360Fd';
      if (lower === 'f') return 'H360F';
      if (lower === 'd') return 'H360D';
      return `H360${raw}`;
    }
    return `${baseCode}${raw}`;
  }

  function toLines(sectionOrText) {
    if (typeof sectionOrText === 'string') {
      return sectionOrText.split(/\r?\n/).map((text, index) => ({
        text: cleanText(text),
        page: null,
        line: index + 1
      }));
    }

    if (!sectionOrText || typeof sectionOrText !== 'object') {
      throw new TypeError('parseHazards richiede il testo o un oggetto sezione.');
    }

    if (Array.isArray(sectionOrText.lines)) {
      return sectionOrText.lines.map((line, index) => ({
        text: cleanText(line && typeof line === 'object' ? line.text : line),
        page: line && typeof line === 'object' && line.page != null ? line.page : null,
        line: line && typeof line === 'object' && line.line != null ? line.line : index + 1,
        isHeading: Boolean(line && typeof line === 'object' && line.isHeading)
      }));
    }

    return String(sectionOrText.text || '').split(/\r?\n/).map((text, index) => ({
      text: cleanText(text),
      page: sectionOrText.pageStart == null ? null : sectionOrText.pageStart,
      line: index + 1
    }));
  }

  function categoryMatches(text) {
    const matches = [];
    for (const pattern of CATEGORY_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.push({ category: match[1].toUpperCase(), index: match.index, end: pattern.lastIndex });
      }
    }
    return matches.sort((a, b) => a.index - b.index);
  }

  function categoryFor(lines, lineIndex, codeStart, codeEnd) {
    const current = lines[lineIndex].text;
    const sameLine = categoryMatches(current);
    const before = sameLine.filter((item) => item.end <= codeStart).pop();
    if (before) return before.category;
    const after = sameLine.find((item) => item.index >= codeEnd);
    if (after) return after.category;

    for (const offset of [-1, 1, -2, 2]) {
      const neighbour = lines[lineIndex + offset];
      if (!neighbour || neighbour.isHeading || !neighbour.text || HAZARD_CODE.test(neighbour.text)) {
        HAZARD_CODE.lastIndex = 0;
        continue;
      }
      HAZARD_CODE.lastIndex = 0;
      const matches = categoryMatches(neighbour.text);
      if (matches.length) return offset < 0 ? matches[matches.length - 1].category : matches[0].category;
    }
    return null;
  }

  function sourceTextFor(lines, lineIndex, category) {
    const selected = [lines[lineIndex].text];
    if (!category) return selected[0];
    if (categoryMatches(lines[lineIndex].text).some((item) => item.category === category)) {
      return selected[0];
    }

    for (const offset of [-1, 1, -2, 2]) {
      const neighbour = lines[lineIndex + offset];
      if (neighbour && categoryMatches(neighbour.text).some((item) => item.category === category)) {
        selected.push(neighbour.text);
        break;
      }
    }
    return selected.filter(Boolean).join(' | ');
  }

  function parseHazards(sectionOrText, options) {
    const config = options || {};
    const lines = toLines(sectionOrText);
    const section = config.section != null
      ? String(config.section)
      : sectionOrText && typeof sectionOrText === 'object' && sectionOrText.number != null
        ? String(sectionOrText.number)
        : null;
    const hazards = [];

    lines.forEach((line, lineIndex) => {
      if (line.isHeading || !line.text) return;
      HAZARD_CODE.lastIndex = 0;
      let match;
      while ((match = HAZARD_CODE.exec(line.text)) !== null) {
        const nextCodeIndex = HAZARD_CODE.lastIndex;
        const code = normalizeCode(match[1], match[2], match[3]);
        const category = categoryFor(lines, lineIndex, match.index, nextCodeIndex);
        hazards.push({
          code,
          baseCode: `${match[1].toUpperCase()}${match[2]}`,
          category,
          section,
          page: line.page,
          sourceText: sourceTextFor(lines, lineIndex, category)
        });
        HAZARD_CODE.lastIndex = nextCodeIndex;
      }
      HAZARD_CODE.lastIndex = 0;
    });

    return hazards;
  }

  return { parseHazards };
});
