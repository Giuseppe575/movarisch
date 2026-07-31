const test = require('node:test');
const assert = require('node:assert/strict');

const {
  layoutPage,
  layoutPages
} = require('../src/lib/sds/text-layout.js');

function item(str, x, y, width, height = 10, hasEOL = false) {
  return {
    str,
    transform: [height, 0, 0, height, x, y],
    width,
    height,
    hasEOL
  };
}

test('ricostruisce righe dall’alto verso il basso e frammenti da sinistra a destra', () => {
  const page = layoutPage({
    pageNumber: 3,
    width: 600,
    height: 800,
    items: [
      item('mondo', 55, 700, 30),
      item('Seconda riga', 20, 680, 70),
      item('Ciao', 20, 700.5, 25)
    ]
  });

  assert.equal(page.pageNumber, 3);
  assert.equal(page.text, 'Ciao mondo\nSeconda riga');
  assert.deepEqual(page.lines.map(line => line.pageNumber), [3, 3]);
  assert.deepEqual(page.lines[0].bbox, [20, 700, 65, 10.5]);
  assert.equal(page.lines[0].items[0].text, 'Ciao');
  assert.deepEqual(page.lines[0].items[0].bbox, [20, 700.5, 25, 10]);
});

test('separa due colonne sulla stessa baseline senza concatenarne il testo', () => {
  const page = layoutPage({
    pageNumber: 1,
    width: 600,
    items: [
      item('Colonna destra 2', 340, 680, 95),
      item('Colonna sinistra 1', 30, 700, 100),
      item('Colonna destra 1', 340, 700, 95),
      item('Colonna sinistra 2', 30, 680, 100)
    ]
  });

  assert.deepEqual(page.lines.map(line => line.text), [
    'Colonna sinistra 1',
    'Colonna destra 1',
    'Colonna sinistra 2',
    'Colonna destra 2'
  ]);
  assert.deepEqual(page.lines.map(line => [line.y, line.x]), [
    [700, 30],
    [700, 340],
    [680, 30],
    [680, 340]
  ]);
});

test('accetta textContent PDF.js, rispetta hasEOL e ordina le pagine', () => {
  const pages = layoutPages([
    {
      pageNumber: 2,
      textContent: {
        items: [
          item('A', 10, 100, 6, 10, true),
          item('B', 20, 100, 6)
        ]
      }
    },
    { pageNumber: 1, items: [item('Prima', 10, 100, 30)] }
  ]);

  assert.deepEqual(pages.map(page => page.pageNumber), [1, 2]);
  assert.equal(pages[0].text, 'Prima');
  assert.deepEqual(pages[1].lines.map(line => line.text), ['A', 'B']);
});

test('gestisce input vuoti e stima le dimensioni quando PDF.js non le dichiara', () => {
  assert.deepEqual(layoutPages(), []);

  const page = layoutPage({
    items: [{ str: 'Test', transform: [10, 0, 0, 10, 15, 50] }]
  });

  assert.equal(page.pageNumber, 1);
  assert.equal(page.text, 'Test');
  assert.equal(page.items[0].height, 10);
  assert.equal(page.items[0].width, 20);
});
