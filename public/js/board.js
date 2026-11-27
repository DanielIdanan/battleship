// public/js/board.js - board drawing
import { $ } from './dom.js';
import { LETTERS, SHIPS } from './constants.js';

export function drawGrid(id, onClick) {
  const grid = $(id);
  grid.querySelectorAll('.cell, .ships').forEach((n) => n.remove());
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.xy = `${x},${y}`;
    if (onClick) onClick.length > 2 ? onClick(x, y, cell) : (cell.onclick = () => onClick(x, y));
    grid.appendChild(cell);
  }
  const layer = document.createElement('div');
  layer.className = 'ships';
  grid.appendChild(layer);
}

export const cellAt = (id, x, y) => $(id).querySelector(`[data-xy="${x},${y}"]`);

export function addSprite(boardId, i, cells) {
  const horiz = cells.length < 2 || cells[0][1] === cells[1][1], [x, y] = cells[0], n = cells.length;
  const img = document.createElement('img');
  img.className = 'ship'; img.alt = ''; img.draggable = false;
  img.src = `assets/ships/${SHIPS[i]}_${horiz ? 'h' : 'v'}.png`;
  img.style.left = `calc(${x} * var(--cell))`;
  img.style.top = `calc(${y} * var(--cell))`;
  img.style.width = `calc(${horiz ? n : 1} * var(--cell))`;
  img.style.height = `calc(${horiz ? 1 : n} * var(--cell))`;
  $(boardId).querySelector('.ships').append(img);
}

export function drawLabels() {
  ['myBoard', 'enemyBoard'].forEach((id) => {
    const board = $(id);
    board.querySelectorAll('.lbl').forEach((n) => n.remove());
    const put = (text, cls, row, col) => {
      const d = document.createElement('div');
      d.className = 'lbl ' + cls; d.textContent = text;
      d.style.gridRow = row; d.style.gridColumn = col;
      board.append(d);
    };
    put('', '', 1, 1);
    for (let i = 0; i < 10; i++) { put(i + 1, 'col', 1, i + 2); put(LETTERS[i], 'row', i + 2, 1); }
  });
}
