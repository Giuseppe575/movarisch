(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.MovarischSds = root.MovarischSds || {};
  Object.assign(root.MovarischSds, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SECTION_HEADING = /^\s*(?:SEZIONE|SECTION)\s+(\d{1,2})\s*(?:[.:\-–—]|\s)\s*(.*?)\s*$/i;

  function cleanText(value) {
    return String(value == null ? '' : value)
      .replace(/\u00ad/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  function normalizeInput(input) {
    if (typeof input === 'string') {
      const pages = input.split(/\f/);
      return pages.flatMap((pageText, pageIndex) =>
        pageText.split(/\r?\n/).map((text, lineIndex) => ({
          text: cleanText(text),
          page: pageIndex + 1,
          line: lineIndex + 1
        }))
      );
    }

    if (!input || !Array.isArray(input.pages)) {
      throw new TypeError('parseSdsSections richiede una stringa o un oggetto { pages: [...] }.');
    }

    return input.pages.flatMap((page, pageIndex) => {
      const pageNumber = Number.isFinite(Number(page && page.pageNumber))
        ? Number(page.pageNumber)
        : pageIndex + 1;
      const sourceLines = page && Array.isArray(page.lines)
        ? page.lines
        : String((page && page.text) || '').split(/\r?\n/);

      return sourceLines.map((entry, lineIndex) => {
        const record = entry && typeof entry === 'object' ? entry : { text: entry };
        return Object.assign({}, record, {
          text: cleanText(record.text),
          page: pageNumber,
          line: Number.isFinite(Number(record.lineNumber)) ? Number(record.lineNumber) : lineIndex + 1
        });
      });
    });
  }

  function parseSdsSections(input) {
    const lines = normalizeInput(input);
    const sections = {};
    const warnings = [];
    let current = null;

    for (const line of lines) {
      const match = line.text.match(SECTION_HEADING);
      if (match) {
        const number = String(Number(match[1]));
        if (sections[number]) {
          warnings.push({
            code: 'DUPLICATE_SECTION',
            section: number,
            page: line.page,
            message: `La sezione ${number} compare più di una volta; il contenuto è stato accodato.`
          });
          current = sections[number];
          current.lines.push(Object.assign({}, line, { isHeading: true }));
          current.pageEnd = line.page;
          continue;
        }

        current = {
          number,
          title: cleanText(match[2]),
          pageStart: line.page,
          pageEnd: line.page,
          lines: [Object.assign({}, line, { isHeading: true })],
          text: ''
        };
        sections[number] = current;
        continue;
      }

      if (current) {
        current.lines.push(line);
        current.pageEnd = line.page;
      }
    }

    for (const section of Object.values(sections)) {
      section.text = section.lines
        .filter((line) => !line.isHeading && line.text)
        .map((line) => line.text)
        .join('\n');
    }

    if (Object.keys(sections).length === 0) {
      warnings.push({
        code: 'NO_SECTION_HEADINGS',
        message: 'Non sono state riconosciute intestazioni SEZIONE/SECTION numerate.'
      });
    }

    for (const required of ['2', '3', '16']) {
      if (!sections[required]) {
        warnings.push({
          code: 'MISSING_RELEVANT_SECTION',
          section: required,
          message: `La sezione ${required} non è stata riconosciuta.`
        });
      }
    }

    return { sections, warnings };
  }

  return { parseSdsSections };
});
