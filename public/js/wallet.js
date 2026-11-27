// public/js/wallet.js - name and wallet
import { $ } from './dom.js';
import { state } from './state.js';
import { socket, stream } from './connection.js';

try { state.myName = sessionStorage.getItem('bsName') || ''; } catch (e) {}
$('nameInput').value = state.myName;

export const playerName = () => {
  state.myName = $('nameInput').value.trim();
  try { sessionStorage.setItem('bsName', state.myName); } catch (e) {}
  return state.myName;
};

function showWallet() {
  const on = state.myCoins !== null && state.myName;
  $('wallet').hidden = !on;
  if (on) { $('walletName').textContent = state.myName; $('walletCoins').textContent = state.myCoins; }
}

socket.on('wallet', (n) => { state.myCoins = n; showWallet(); });

let helloTimer = null;
$('nameInput').oninput = () => {
  state.myName = $('nameInput').value.trim(); state.myCoins = null; showWallet();
  clearTimeout(helloTimer);
  if (state.myName) helloTimer = setTimeout(() => socket.emit('hello', { name: state.myName }), 300);
};
stream.addEventListener('open', () => { if (state.myName) socket.emit('hello', { name: state.myName }); });
