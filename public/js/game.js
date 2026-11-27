// public/js/game.js - game events
import { $, say, coins, show } from './dom.js';
import { SIZES } from './constants.js';
import { state } from './state.js';
import { socket } from './connection.js';
import { drawGrid, cellAt, addSprite } from './board.js';
import { renderScore } from './scoreboard.js';

$('againBtn').onclick = () => location.reload();

socket.on('joined', ({ code, me: seat, stake }) => {
  state.me = seat;
  show('lobby', false); show('game');
  $('codeBadge').hidden = false;
  $('codeBadge').textContent = `Game code: ${code}` + (stake ? ` · Pot: ${coins(stake * 2)}` : ' · Friendly game');
  drawGrid('myBoard');
  drawGrid('enemyBoard', (x, y) => { if (state.myTurn && !state.over) socket.emit('fire', { x, y }); });
  if (state.me === 0) say(`Game code: ${code} — you staked ${coins(stake)}. Waiting for an opponent…`);
});

socket.on('turn', (turn) => {
  state.myTurn = turn === state.me; state.turnSeat = turn; renderScore();
  ['shuffleBtn', 'rotateBtn', 'tray', 'readyBtn'].forEach((id) => show(id, false));
  if (!state.over) show('surrenderBtn');
  $('enemyBoard').classList.toggle('active', state.myTurn);
  say(state.myTurn ? 'Your turn — click a square in Enemy waters!' : "Opponent's turn…");
});

socket.on('shot', ({ by, x, y, hit, sunk, kind }) => {
  const board = by === state.me ? 'enemyBoard' : 'myBoard';
  cellAt(board, x, y).classList.add('shot', hit ? 'hit' : 'miss');
  if (sunk) {
    if (board === 'enemyBoard') addSprite('enemyBoard', kind ?? SIZES.indexOf(sunk.length), sunk);
    sunk.forEach(([a, b]) => cellAt(board, a, b).classList.add('sunk'));
  }
});

$('surrenderBtn').onclick = () => {
  if (state.over) return;
  if (confirm('Surrender? You will lose your stake and your opponent wins the pot.')) socket.emit('surrender');
};

function finish(text) {
  state.over = true; state.myTurn = false;
  show('surrenderBtn', false);
  $('enemyBoard').classList.remove('active');
  say(text);
  renderScore();
  show('againBtn');
}

socket.on('over', ({ winner, pot, surrendered }) => {
  const stake = pot / 2;
  state.shownChange = stake ? (winner === state.me ? stake : -stake) : null;
  finish(winner === state.me
    ? `🏆 You win!${surrendered !== undefined ? ' Your opponent surrendered.' : ''}${pot ? ` You gain ${coins(stake)} (pot of ${coins(pot)}).` : ''}`
    : (surrendered === state.me ? '🏳️ You surrendered.' : '💥 You lost.') + (pot ? ` You lose your stake of ${coins(stake)}.` : ''));
});

socket.on('left', ({ pot, refunded } = {}) => {
  state.shownChange = !refunded && pot ? pot / 2 : null;
  finish(refunded
    ? 'Your opponent left before the battle — stakes refunded.'
    : `Your opponent left — you win${pot ? ` ${coins(pot / 2)} (pot of ${coins(pot)})` : ''}!`);
});
