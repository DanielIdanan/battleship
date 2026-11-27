// src/handlers.js - player actions
const { MAX_STAKE } = require('./config');
const { io } = require('./clients');
const { cleanName, setName, balance, adjust } = require('./db');
const { randomFleet, validFleet } = require('./ships');
const { rooms, makeCode, newPlayer, tellWallets, settle } = require('./rooms');

function connect(socket) {
  let room = null, me = -1;
  const toRoom = (event, data) => io.to(room.code).emit(event, data);

  let key = null;
  const isStake = (n) => Number.isInteger(n) && n >= 0 && n <= MAX_STAKE;

  let name = '';
  const useName = (n) => {
    if (room || typeof n !== 'string' || !n.trim()) return false;
    name = cleanName(n);
    key = 'name:' + name.toLowerCase();
    setName(key, name);
    return true;
  };
  socket.on('hello', (h) => {
    if (useName(h && h.name)) socket.emit('wallet', balance(key));
  });

  socket.on('create', (raw) => {
    if (room) return;
    useName(raw && raw.name);
    if (!key) return socket.emit('problem', 'Enter your name first.');
    const stake = Number((raw && raw.stake) ?? 0);
    if (!isStake(stake)) return socket.emit('problem', 'The stake must be a whole number of coins.');
    if (!adjust(key, -stake, 'stake', null)) return socket.emit('problem', `You only have ${balance(key)} coins.`);
    const code = makeCode();
    room = rooms[code] = { code, stake, players: [newPlayer(socket.id, key, name)], turn: 0, started: false, over: false, settled: false };
    me = 0;
    socket.join(code);
    socket.emit('joined', { code, me, stake });
    tellWallets(room);
  });

  socket.on('peek', (raw) => {
    const code = String(raw || '').trim().toUpperCase(), r = rooms[code];
    if (!r || r.players.length !== 1) return socket.emit('problem', 'No open game with that code.');
    socket.emit('offer', { code, stake: r.stake });
  });

  socket.on('join', (raw) => {
    if (room) return;
    if (raw && typeof raw === 'object') { useName(raw.name); raw = raw.code; }
    if (!key) return socket.emit('problem', 'Enter your name first.');
    const r = rooms[String(raw || '').trim().toUpperCase()];
    if (!r || r.players.length !== 1) return socket.emit('problem', 'No open game with that code.');
    if (r.players[0].key === key) return socket.emit('problem', 'That name is already in this game. Pick a different name.');
    if (!adjust(key, -r.stake, 'stake', r.code)) return socket.emit('problem', `This game costs ${r.stake} coins but you only have ${balance(key)}.`);
    room = r; me = 1;
    room.players.push(newPlayer(socket.id, key, name));
    socket.join(room.code);
    socket.emit('joined', { code: room.code, me, stake: room.stake });
    room.players.forEach((p) => io.to(p.id).emit('fleet', p.ships));
    toRoom('placing');
    tellWallets(room);
  });

  socket.on('shuffle', () => {
    const p = room && room.players[me];
    if (!p || room.players.length < 2 || p.ready) return;
    p.ships = randomFleet();
    socket.emit('fleet', p.ships);
  });

  socket.on('ready', (ships) => {
    if (!room || room.players.length < 2 || room.started || room.players[me].ready) return;
    if (ships !== undefined) {
      if (!validFleet(ships)) return socket.emit('problem', 'Invalid ship placement.');
      room.players[me].ships = ships;
    }
    room.players[me].ready = true;
    if (room.players.every((p) => p.ready)) { room.started = true; toRoom('turn', room.turn); }
    else socket.emit('waiting');
  });

  socket.on('fire', ({ x, y } = {}) => {
    if (!room || !room.started || room.over || room.turn !== me) return;
    if (![x, y].every((n) => Number.isInteger(n) && n >= 0 && n < 10)) return;
    const enemy = room.players[1 - me], cellKey = `${x},${y}`;
    if (enemy.shots.has(cellKey)) return;
    enemy.shots.add(cellKey);

    const isSunk = (ship) => ship.every(([a, b]) => enemy.shots.has(`${a},${b}`));
    const ship = enemy.ships.find((s) => s.some(([a, b]) => a === x && b === y));
    const sunk = ship && isSunk(ship) ? ship : null;
    toRoom('shot', { by: me, x, y, hit: !!ship, sunk, kind: sunk ? enemy.ships.indexOf(ship) : null });

    if (enemy.ships.every(isSunk)) { room.over = true; const pot = settle(room, me); return toRoom('over', { winner: me, pot }); }
    room.turn = 1 - me;
    toRoom('turn', room.turn);
  });

  socket.on('surrender', () => {
    if (!room || !room.started || room.over) return;
    room.over = true;
    const pot = settle(room, 1 - me);
    toRoom('over', { winner: 1 - me, pot, surrendered: me });
  });

  socket.on('disconnect', () => {
    if (!room) return;
    if (!room.over) {
      room.over = true;
      if (room.started) {
        const pot = settle(room, 1 - me);
        socket.to(room.code).emit('left', { pot });
      } else {
        settle(room, null);
        socket.to(room.code).emit('left', { refunded: true });
      }
    }
    delete rooms[room.code];
  });
}

module.exports = { connect };
