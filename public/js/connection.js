// public/js/connection.js - server connection (WebSocket)
export const stream = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);

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
