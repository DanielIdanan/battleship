// server.js - entry point
const { server } = require('./src/http');
const { attachWebSocket } = require('./src/ws');
const { PORT } = require('./src/config');

attachWebSocket(server);
server.listen(PORT, () => console.log(`You Sunk My Battle Ships! running on http://localhost:${PORT}`));
