// src/ws.js - WebSocket server (one socket per player)
const { WebSocketServer } = require('ws');
const { clients, send } = require('./clients');
const { connect } = require('./handlers');

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function attachWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1e5 });

  wss.on('connection', (ws) => {
    const id = newId();
    const socket = {
      id, ws, rooms: new Set(), handlers: {},
      on: (event, fn) => (socket.handlers[event] = fn),
      join: (code) => socket.rooms.add(code),
      emit: (event, data) => send(socket, event, data),
      to: (code) => ({ emit: (event, data) => Object.values(clients).filter((c) => c !== socket && c.rooms.has(code)).forEach((c) => send(c, event, data)) }),
    };
    clients[id] = socket;
    connect(socket);

    ws.on('message', (raw) => {
      try {
        const { type, data } = JSON.parse(raw);
        if (type !== 'disconnect' && socket.handlers[type]) socket.handlers[type](data ?? undefined);
      } catch (e) {}
    });

    ws.on('close', () => {
      delete clients[id];
      socket.handlers.disconnect && socket.handlers.disconnect();
    });
  });
}

module.exports = { attachWebSocket };
