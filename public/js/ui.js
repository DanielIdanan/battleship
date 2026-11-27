import { SIZE, SHIPS, sprite } from "./config.js";
const $ = (id) => document.getElementById(id);
export const el = $;

export function buildBoard(root) {
  root.innerHTML = "";
  const lbl = (t, cls = "") => Object.assign(document.createElement("div"), { className: "lbl " + cls, textContent: t });
  root.append(lbl(""));
  for (let c = 1; c <= SIZE; c++) root.append(lbl(c));
  for (let r = 0; r < SIZE; r++) {
    root.append(lbl("ABCDEFGHIJ"[r], "row"));
    for (let c = 0; c < SIZE; c++) {
      const d = document.createElement("div");
      d.className = "cell"; d.dataset.r = r; d.dataset.c = c;
      root.append(d);
    }
  }
  const layer = document.createElement("div");
  layer.className = "ships";
  root.append(layer);
}
export const cellAt = (root, r, c) => root.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
export const cells = (o, size, r, c) => Array.from({ length: size }, (_, i) => (o === "h" ? [r, c + i] : [r + i, c]));

export function drawShip(root, id, size, r, c, o) {
  const img = new Image();
  img.className = "ship"; img.src = sprite(id, o); img.alt = id; img.dataset.id = id;
  const w = o === "h" ? size : 1, h = o === "h" ? 1 : size;
  Object.assign(img.style, {
    left: `calc(var(--cell) * ${c})`, top: `calc(var(--cell) * ${r})`,
    width: `calc(var(--cell) * ${w})`, height: `calc(var(--cell) * ${h})`,
  });
  root.querySelector(".ships").append(img);
}
export const clearShips = (root) => root.querySelectorAll(".ship").forEach((s) => s.remove());
export const removeShip = (root, id) => root.querySelector(`.ship[data-id="${id}"]`)?.remove();

export function renderTray(selected, placed, onPick) {
  const t = $("tray"); t.innerHTML = "";
  SHIPS.forEach((s) => {
    const b = document.createElement("button");
    b.className = "chip" + (s.id === selected ? " selected" : "") + (placed[s.id] ? " placed" : "");
    b.innerHTML = `<img src="${sprite(s.id, "h")}" alt="${s.id}">`;
    b.title = `${s.id} (${s.size})`;
    b.onclick = () => onPick(s.id);
    t.append(b);
  });
}

export function markShot(root, r, c, hit) {
  cellAt(root, r, c).classList.add("shot", hit ? "hit" : "miss");
}
export function markSunk(root, ship) {
  cells(ship.o, ship.size, ship.r, ship.c).forEach(([r, c]) => cellAt(root, r, c).classList.add("sunk"));
  if (!root.querySelector(`.ship[data-id="${ship.id}"]`)) drawShip(root, ship.id, ship.size, ship.r, ship.c, ship.o);
}

export function setStatus(t) { $("status").textContent = t; }
export function setCode(code, pot) {
  const b = $("codeBadge"); b.hidden = !code;
  if (code) b.textContent = `GAME ${code} · ` + (pot ? `POT ${pot} 🪙` : "FRIENDLY GAME");
}
export function setWallet(name, coins) {
  $("wallet").hidden = !name; $("walletName").textContent = name; $("walletCoins").textContent = coins;
}
/** players: [{name, coins, you, turn, delta}] */
export function renderScoreboard(players) {
  $("scoreboard").innerHTML = players.map((p) => `
    <div class="score-card${p.turn ? " turn" : ""}">
      <div class="score-name">${esc(p.name)}${p.you ? " <small>(you)</small>" : ""}</div>
      <div class="score-coins">🪙 ${p.coins}${p.delta ? `<span class="delta ${p.delta > 0 ? "up" : "down"}">${p.delta > 0 ? "+" : ""}${p.delta}</span>` : ""}</div>
    </div>`).join("");
}
const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
