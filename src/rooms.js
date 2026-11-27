// src/rooms.js - game rooms and payouts
const { io } = require('./clients');
const { balance, adjust } = require('./db');
const { rnd, randomFleet } = require('./ships');

const rooms = {};

const makeCode = () => {
  let code;
  do code = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[rnd(24)]).join('');
  while (rooms[code]);
  return code;
};

const newPlayer = (id, key, name) => ({ id, key, name, ships: randomFleet(), shots: new Set(), ready: false });

const tellWallets = (room) => {
  const list = room.players.map((p) => ({ name: p.name, coins: balance(p.key) }));
  room.players.forEach((p) => { io.to(p.id).emit('wallet', balance(p.key)); io.to(p.id).emit('players', list); });
};

function settle(room, winner) {
  if (room.settled) return 0;
  room.settled = true;
  const pot = room.stake * room.players.length;
  if (winner === null) room.players.forEach((p) => adjust(p.key, room.stake, 'refund', room.code));
  else adjust(room.players[winner].key, pot, 'win', room.code);
  tellWallets(room);
  return pot;
}

module.exports = { rooms, makeCode, newPlayer, tellWallets, settle };
