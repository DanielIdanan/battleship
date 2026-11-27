// public/js/scoreboard.js - scoreboard
import { $, coins } from './dom.js';
import { state } from './state.js';
import { socket } from './connection.js';

export function renderScore() {
  const box = $('scoreboard');
  box.hidden = !state.players.length;
  box.innerHTML = '';
  state.players.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'score-card' + (i === state.turnSeat && !state.over ? ' turn' : '');
    const change = state.shownChange;
    const chg = change && i === state.me ? `<span class="delta ${change > 0 ? 'up' : 'down'}">${change > 0 ? '+' : ''}${change}</span>` : '';
    card.innerHTML = `<div class="score-name"></div><div class="score-coins">🪙 ${coins(p.coins)}${chg}</div>`;
    const name = card.querySelector('.score-name');
    name.textContent = p.name;
    if (i === state.me) name.insertAdjacentHTML('beforeend', ' <small>(you)</small>');
    box.appendChild(card);
  });
}

socket.on('players', (list) => { state.players = list; renderScore(); });
