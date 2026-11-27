// public/js/lobby.js - lobby
import { $, say, coins } from './dom.js';
import { state } from './state.js';
import { socket } from './connection.js';
import { playerName } from './wallet.js';

$('createBtn').onclick = () => !playerName()
  ? say('Enter your name first.')
  : socket.emit('create', { stake: Math.floor(Number($('stakeInput').value)), name: playerName() });

let peekTimer = null;
const stopWaiting = () => { clearTimeout(peekTimer); peekTimer = null; };

$('joinBtn').onclick = () => {
  if (!playerName()) return say('Enter your name first.');
  $('offer').hidden = true;
  say('Looking for that game…');
  socket.emit('peek', $('codeInput').value);
  stopWaiting();
  peekTimer = setTimeout(() => say('No reply from the server. Stop it, run "node server.js" again so the updated version is running, then reload this page.'), 4000);
};
$('codeInput').onkeydown = (e) => { if (e.key === 'Enter') $('joinBtn').click(); };

socket.on('offer', ({ code, stake }) => {
  stopWaiting();
  if (stake === 0) return socket.emit('join', { code, name: playerName() });
  say('Found it! Check the stake below.');
  $('offerText').textContent = `This game has a stake of ${coins(stake)}. Join and put ${coins(stake)} in the pot?`;
  $('offerJoin').onclick = () => { $('offer').hidden = true; socket.emit('join', { code, name: playerName() }); };
  $('offerCancel').onclick = () => { $('offer').hidden = true; say('Create a game, or join a friend\'s game with their code.'); };
  $('offer').hidden = false;
});

socket.on('problem', (text) => { stopWaiting(); say(text); });
