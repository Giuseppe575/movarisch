(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MovarischSds = root.MovarischSds || {};
  Object.assign(root.MovarischSds, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CATEGORY_DEFINITIONS = [
    { key: 'hands', label: 'Protezione delle mani', pattern: /\b(?:protezione\s+(?:delle\s+)?mani|hand\s+protection)\b/gi },
    { key: 'eyesFace', label: 'Protezione occhi/viso', pattern: /\b(?:protezione\s+(?:degli\s+)?occhi|protezione\s+(?:del\s+)?viso|eye(?:\/face)?\s+protection)\b/gi },
    { key: 'body', label: 'Protezione della pelle/corpo', pattern: /\b(?:protezione\s+(?:della\s+)?pelle|protezione\s+(?:del\s+)?corpo|skin\s+protection|body\s+protection)\b/gi },
    { key: 'respiratory', label: 'Protezione respiratoria', pattern: /\b(?:protezione\s+respiratoria|respiratory\s+protection)\b/gi }
  ];

  function normalize(value) {
    return String(value == null ? '' : value)
      .replace(/\u00ad/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function classifyInstruction(text) {
    const value = normalize(text).toLowerCase();
    if (!value) return 'not_specified';
    if (/\b(?:non\s+(?:è\s+)?necessari[oa]|non\s+richiest[oa]|non\s+occorre)\b/.test(value)) return 'not_required';
    if (/\b(?:in\s+caso|qualora|se\s+(?:le|la|il|i|si)|al\s+superamento|quando\s+le|ove\s+necessario)\b/.test(value)) return 'conditional';
    if (/\b(?:si\s+consiglia|consigliat[oa]|si\s+raccomanda|valutare\s+l['’`]opportunità|preferibilmente)\b/.test(value)) return 'recommended';
    if (/\b(?:utilizzare|indossare|proteggere|usare|devono|deve|necessario|obbligatori[oa])\b/.test(value)) return 'required';
    return 'mentioned';
  }

  function statusLabel(status) {
    return ({
      required: 'Indicato dalla SDS',
      recommended: 'Consigliato dalla SDS',
      conditional: 'Condizionato allo scenario',
      not_required: 'Non richiesto dalla SDS',
      mentioned: 'Informazione presente',
      not_specified: 'Non specificato'
    })[status] || 'Non specificato';
  }

  function sourcePage(section, offset, fullText) {
    const before = fullText.slice(0, offset);
    const lineNumber = before.split('\n').length;
    const lines = Array.isArray(section && section.lines) ? section.lines.filter(line => !line.isHeading) : [];
    return lines[Math.max(0, Math.min(lines.length - 1, lineNumber - 1))]?.page || section?.pageStart || null;
  }

  function parseSection8Dpi(section) {
    const rawText = String(section && section.text || '');
    const text = rawText.replace(/\r/g, '\n');
    const headings = [];

    for (const definition of CATEGORY_DEFINITIONS) {
      definition.pattern.lastIndex = 0;
      let match;
      while ((match = definition.pattern.exec(text))) {
        headings.push({ index: match.index, end: definition.pattern.lastIndex, definition });
      }
    }
    headings.sort((a, b) => a.index - b.index);

    const items = headings.map((heading, index) => {
      const next = headings[index + 1];
      const sourceText = normalize(text.slice(heading.end, next ? next.index : Math.min(text.length, heading.end + 1800))).slice(0, 900);
      const status = classifyInstruction(sourceText);
      return {
        category: heading.definition.key,
        label: heading.definition.label,
        status,
        statusLabel: statusLabel(status),
        sourceText,
        page: sourcePage(section, heading.index, text)
      };
    });

    const selected = new Map();
    const priority = { required: 5, recommended: 4, conditional: 3, mentioned: 2, not_required: 1, not_specified: 0 };
    for (const item of items) {
      const current = selected.get(item.category);
      if (!current || priority[item.status] > priority[current.status]) selected.set(item.category, item);
    }

    for (const definition of CATEGORY_DEFINITIONS) {
      if (!selected.has(definition.key)) {
        selected.set(definition.key, {
          category: definition.key,
          label: definition.label,
          status: 'not_specified',
          statusLabel: statusLabel('not_specified'),
          sourceText: '',
          page: section?.pageStart || null
        });
      }
    }

    const result = Array.from(selected.values());
    return {
      sectionFound: Boolean(section),
      items: result,
      summary: result.filter(item => !['not_specified', 'not_required'].includes(item.status)).map(item => `${item.label}: ${item.statusLabel}`).join('; ')
    };
  }

  return Object.freeze({ parseSection8Dpi, classifyInstruction, statusLabel });
});
