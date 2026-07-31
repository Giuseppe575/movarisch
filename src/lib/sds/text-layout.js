/*
 * Reconstruct a deterministic text layout from PDF.js TextContent items.
 *
 * PDF.js exposes positioned text fragments rather than semantic paragraphs or
 * table cells. This module deliberately limits itself to geometric ordering:
 * top-to-bottom by baseline and left-to-right for fragments on the same row.
 * Large horizontal gaps are split into separate lines so that two columns at
 * the same height are not accidentally concatenated.
 *
 * Known limits:
 * - semantic reading order cannot always be inferred from coordinates alone;
 * - rotated/vertical text and complex writing modes are not re-oriented;
 * - tables remain geometric rows, not structured cells;
 * - scanned PDFs still require OCR before this module can process their text.
 */
(function initTextLayout(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.SdsTextLayout = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createTextLayout() {
  'use strict';

  const DEFAULT_OPTIONS = Object.freeze({
    baselineToleranceRatio: 0.45,
    minimumBaselineTolerance: 1.5,
    columnGapRatio: 0.12,
    minimumColumnGap: 48,
    columnGapHeightRatio: 5,
    splitLargeGaps: true
  });

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function positiveNumber(value, fallback = 0) {
    const number = finiteNumber(value, fallback);
    return number >= 0 ? number : Math.abs(number);
  }

  function median(values) {
    const sorted = values
      .filter(Number.isFinite)
      .slice()
      .sort((left, right) => left - right);

    if (!sorted.length) return 0;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function estimateHeight(item, transform) {
    const declared = positiveNumber(item.height);
    if (declared) return declared;

    // The vertical text vector is [c, d] in a PDF.js transform matrix.
    const transformed = Math.hypot(
      finiteNumber(transform[2]),
      finiteNumber(transform[3])
    );
    return transformed || 1;
  }

  function estimateWidth(item, transform, text, height) {
    const declared = positiveNumber(item.width);
    if (declared) return declared;

    const horizontalScale = Math.hypot(
      finiteNumber(transform[0]),
      finiteNumber(transform[1])
    );
    const averageGlyphWidth = (horizontalScale || height) * 0.5;
    return text.length * averageGlyphWidth;
  }

  function normalizeItem(item, sourceIndex, pageNumber) {
    const transform = Array.isArray(item && item.transform)
      ? item.transform
      : [];
    const text = String(item && (item.str ?? item.text) || '');
    const x = finiteNumber(item && item.x, finiteNumber(transform[4]));
    const y = finiteNumber(item && item.y, finiteNumber(transform[5]));
    const height = estimateHeight(item || {}, transform);
    const width = estimateWidth(item || {}, transform, text, height);

    return {
      pageNumber,
      text,
      x,
      y,
      width,
      height,
      bbox: [x, y, width, height],
      hasEOL: Boolean(item && item.hasEOL),
      sourceIndex,
      source: item
    };
  }

  function compareVisualPosition(left, right) {
    const verticalDifference = right.y - left.y;
    if (verticalDifference !== 0) return verticalDifference;
    const horizontalDifference = left.x - right.x;
    if (horizontalDifference !== 0) return horizontalDifference;
    return left.sourceIndex - right.sourceIndex;
  }

  function groupByBaseline(items, options) {
    const rows = [];

    for (const item of items.slice().sort(compareVisualPosition)) {
      let bestRow = null;
      let bestDistance = Infinity;

      for (const row of rows) {
        const tolerance = Math.max(
          options.minimumBaselineTolerance,
          Math.min(row.medianHeight, item.height) * options.baselineToleranceRatio
        );
        const distance = Math.abs(row.y - item.y);
        if (distance <= tolerance && distance < bestDistance) {
          bestRow = row;
          bestDistance = distance;
        }
      }

      if (!bestRow) {
        rows.push({ y: item.y, medianHeight: item.height, items: [item] });
        continue;
      }

      bestRow.items.push(item);
      bestRow.y = median(bestRow.items.map(entry => entry.y));
      bestRow.medianHeight = median(bestRow.items.map(entry => entry.height));
    }

    return rows.sort((left, right) => {
      const verticalDifference = right.y - left.y;
      if (verticalDifference !== 0) return verticalDifference;
      return Math.min(...left.items.map(item => item.x)) -
        Math.min(...right.items.map(item => item.x));
    });
  }

  function pageExtent(items, declaredWidth) {
    const width = positiveNumber(declaredWidth);
    if (width) return width;
    if (!items.length) return 0;
    const left = Math.min(...items.map(item => item.x));
    const right = Math.max(...items.map(item => item.x + item.width));
    return Math.max(0, right - left);
  }

  function splitRow(row, pageWidth, options) {
    const sorted = row.items.slice().sort((left, right) => {
      const horizontalDifference = left.x - right.x;
      return horizontalDifference || left.sourceIndex - right.sourceIndex;
    });
    if (!sorted.length) return [];

    const medianHeight = median(sorted.map(item => item.height)) || 1;
    const largeGap = Math.max(
      options.minimumColumnGap,
      pageWidth * options.columnGapRatio,
      medianHeight * options.columnGapHeightRatio
    );
    const groups = [[sorted[0]]];

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const gap = current.x - (previous.x + previous.width);
      const mustSplit = previous.hasEOL ||
        (options.splitLargeGaps && gap > largeGap);

      if (mustSplit) groups.push([]);
      groups[groups.length - 1].push(current);
    }

    return groups;
  }

  function needsSpace(previous, current) {
    if (!previous || !current) return false;
    if (/\s$/u.test(previous.text) || /^\s/u.test(current.text)) return false;
    if (/^[,.;:!?%)\]}]/u.test(current.text)) return false;
    if (/[([{/]$/u.test(previous.text)) return false;

    const gap = current.x - (previous.x + previous.width);
    const glyphWidth = Math.max(
      1,
      previous.text.length ? previous.width / previous.text.length : 0,
      current.text.length ? current.width / current.text.length : 0
    );
    return gap > glyphWidth * 0.15;
  }

  function lineFromItems(items, pageNumber) {
    const left = Math.min(...items.map(item => item.x));
    const right = Math.max(...items.map(item => item.x + item.width));
    const bottom = Math.min(...items.map(item => item.y));
    const top = Math.max(...items.map(item => item.y + item.height));
    let text = '';

    for (let index = 0; index < items.length; index += 1) {
      if (needsSpace(items[index - 1], items[index])) text += ' ';
      text += items[index].text;
    }

    return {
      pageNumber,
      text: text.trim(),
      x: left,
      y: median(items.map(item => item.y)),
      width: right - left,
      height: top - bottom,
      bbox: [left, bottom, right - left, top - bottom],
      items
    };
  }

  function extractItems(page) {
    if (Array.isArray(page)) return page;
    if (Array.isArray(page && page.items)) return page.items;
    if (Array.isArray(page && page.textContent && page.textContent.items)) {
      return page.textContent.items;
    }
    return [];
  }

  function layoutPage(page, index = 0, customOptions = {}) {
    const options = { ...DEFAULT_OPTIONS, ...customOptions };
    const pageNumber = finiteNumber(page && page.pageNumber, index + 1);
    const sourceItems = extractItems(page);
    const items = sourceItems
      .map((item, sourceIndex) => normalizeItem(item, sourceIndex, pageNumber))
      .filter(item => item.text.length > 0);
    const declaredWidth = page
      ? (page.width ?? (page.viewport && page.viewport.width))
      : 0;
    const declaredHeight = page
      ? (page.height ?? (page.viewport && page.viewport.height))
      : 0;
    const width = pageExtent(items, declaredWidth);
    const height = positiveNumber(declaredHeight);
    const rows = groupByBaseline(items, options);
    const lines = rows.flatMap(row => splitRow(row, width, options))
      .map(group => lineFromItems(group, pageNumber))
      .filter(line => line.text.length > 0)
      .sort(compareVisualPosition);

    return {
      pageNumber,
      width,
      height,
      text: lines.map(line => line.text).join('\n'),
      lines,
      items
    };
  }

  function layoutPages(pages, customOptions = {}) {
    const list = Array.isArray(pages) ? pages : [];
    return list
      .map((page, index) => layoutPage(page, index, customOptions))
      .sort((left, right) => left.pageNumber - right.pageNumber);
  }

  return Object.freeze({
    DEFAULT_OPTIONS,
    layoutPage,
    layoutPages
  });
}));
