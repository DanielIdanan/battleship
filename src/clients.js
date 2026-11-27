// src/clients.js - live connections (WebSocket)
const clients = {};

const send = (c, event, data) => {
  if (c.ws.readyState === 1) c.ws.send(JSON.stringify({ event, data: data ?? null }));
};

const io = {
  to: (target) => ({
    emit: (event, data) => {
      if (clients[target]) return send(clients[target], event, data);
      Object.values(clients).filter((c) => c.rooms.has(target)).forEach((c) => send(c, event, data));
    },
  }),
};

module.exports = { clients, send, io };
