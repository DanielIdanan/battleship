// src/ships.js - ship helpers
const { SIZES } = require('./config');

const rnd = (n) => Math.floor(Math.random() * n);

function randomFleet() {
  const taken = new Set();
  return SIZES.map((size) => {
    for (;;) {
      const horizontal = Math.random() < 0.5;
      const x = rnd(horizontal ? 11 - size : 10), y = rnd(horizontal ? 10 : 11 - size);
      const cells = Array.from({ length: size }, (_, i) => (horizontal ? [x + i, y] : [x, y + i]));
      if (cells.some(([a, b]) => taken.has(`${a},${b}`))) continue;
      cells.forEach(([a, b]) => taken.add(`${a},${b}`));
      return cells;
    }
  });
}

function validFleet(f) {
  if (!Array.isArray(f) || f.length !== SIZES.length) return false;
  const taken = new Set();
  return SIZES.every((size, i) => {
    const ship = f[i];
    if (!Array.isArray(ship) || ship.length !== size) return false;
    if (!ship.every((c) => Array.isArray(c) && c.length === 2 && c.every((n) => Number.isInteger(n) && n >= 0 && n < 10))) return false;
    const [x0, y0] = ship[0], horizontal = size > 1 && ship[1][1] === y0;
    if (!ship.every(([a, b], k) => (horizontal ? a === x0 + k && b === y0 : a === x0 && b === y0 + k))) return false;
    return ship.every(([a, b]) => { const key = `${a},${b}`; if (taken.has(key)) return false; taken.add(key); return true; });
  });
}

module.exports = { rnd, randomFleet, validFleet };
