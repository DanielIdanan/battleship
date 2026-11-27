// public/js/placement.js - ship placement
import { $, say, show } from './dom.js';
import { SIZES, SHIPS } from './constants.js';
import { state } from './state.js';
import { socket } from './connection.js';
import { drawGrid, cellAt, addSprite } from './board.js';

const shipCells = (i, x, y) => Array.from({ length: SIZES[i] }, (_, k) => (state.horizontal ? [x + k, y] : [x, y + k]));
const inBounds = (cells) => cells.every(([a, b]) => a >= 0 && a < 10 && b >= 0 && b < 10);
const occupied = (except) => new Set(state.fleet.flatMap((s, i) => (i === except || !s ? [] : s.map(([a, b]) => `${a},${b}`))));
const clearPreview = () => document.querySelectorAll('#myBoard .ok, #myBoard .bad').forEach((c) => c.classList.remove('ok', 'bad'));

export function renderFleet() {
  drawGrid('myBoard', placeHandlers);
  state.fleet.forEach((s, i) => s && addSprite('myBoard', i, s));
  $('tray').innerHTML = '';
  SIZES.forEach((size, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (i === state.sel ? ' selected' : '') + (state.fleet[i] ? ' placed' : '');
    chip.title = `${SHIPS[i]} (${size})`;
    chip.innerHTML = `<img src="assets/ships/${SHIPS[i]}_h.png" alt="${SHIPS[i]}" style="width:${size * 24}px">`;
    chip.onclick = () => { state.sel = i; if (state.fleet[i]) state.fleet[i] = null; renderFleet(); };
    $('tray').appendChild(chip);
  });
  $('readyBtn').disabled = state.fleet.some((s) => !s);
}

function placeHandlers(x, y, cell) {
  cell.onmouseenter = () => {
    if (!state.placing) return;
    clearPreview();
    const cells = shipCells(state.sel, x, y), ok = inBounds(cells) && !cells.some(([a, b]) => occupied(state.sel).has(`${a},${b}`));
    cells.forEach(([a, b]) => { const c = inBounds([[a, b]]) && cellAt('myBoard', a, b); if (c) c.classList.add(ok ? 'ok' : 'bad'); });
  };
  cell.onclick = () => {
    if (!state.placing) return;
    const hit = state.fleet.findIndex((s) => s && s.some(([a, b]) => a === x && b === y));
    if (hit >= 0) { state.fleet[hit] = null; state.sel = hit; return renderFleet(); }
    const cells = shipCells(state.sel, x, y);
    if (!inBounds(cells) || cells.some(([a, b]) => occupied(state.sel).has(`${a},${b}`))) return;
    state.fleet[state.sel] = cells;
    const next = state.fleet.findIndex((s) => !s);
    if (next >= 0) state.sel = next;
    renderFleet();
  };
}

$('shuffleBtn').onclick = () => socket.emit('shuffle');
$('rotateBtn').onclick = () => { state.horizontal = !state.horizontal; renderFleet(); };
document.onkeydown = (e) => { if (state.placing && e.key.toLowerCase() === 'r' && e.target.tagName !== 'INPUT') $('rotateBtn').click(); };
$('readyBtn').onclick = () => {
  socket.emit('ready', state.fleet);
  state.placing = false; $('game').classList.remove('placing');
  clearPreview();
  $('readyBtn').disabled = $('shuffleBtn').disabled = $('rotateBtn').disabled = true;
};

socket.on('fleet', (ships) => {
  state.fleet = ships; state.sel = 0;
  renderFleet();
});

socket.on('placing', () => {
  say('Opponent found! Click your board to move ships (R rotates), or shuffle. Then press Ready.');
  state.placing = true; $('game').classList.add('placing');
  show('tray'); show('rotateBtn'); show('shuffleBtn'); show('readyBtn');
});

socket.on('waiting', () => say('Waiting for your opponent to get ready…'));
