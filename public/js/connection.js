// public/js/connection.js - server connection (WebSocket)
// Leave SERVER empty when the server also serves this page (npm start).
// For GitHub Pages, put the deployed server address here, e.g. 'https://your-game.onrender.com'
const SERVER = '';

const wsUrl = SERVER
  ? SERVER.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws'
  : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
export const stream = new WebSocket(wsUrl);

const listeners = {};
stream.addEventListener('message', (e) => {
  const { event, data } = JSON.parse(e.data);
  (listeners[event] || []).forEach((fn) => fn(data));
});

const queue = [];
stream.addEventListener('open', () => queue.splice(0).forEach((m) => stream.send(m)));

export const socket = {
  on: (event, fn) => (listeners[event] = listeners[event] || []).push(fn),
  emit: (type, data) => {
    const msg = JSON.stringify({ type, data });
    stream.readyState === 1 ? stream.send(msg) : queue.push(msg);
  },
};
