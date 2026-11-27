import { SIZE, SHIPS, label } from "./config.js";
import * as ui from "./ui.js";
const { el } = ui;
const my = el("myBoard"), enemy = el("enemyBoard");

const S = { phase: "lobby", selected: SHIPS[0].id, o: "h", placed: {}, myTurn: false };
const ship = (id) => SHIPS.find((s) => s.id === id);

/* ---- hooks for your networking layer: listen for these events on document ----
   bs:create {name, stake} · bs:join {code, name} · bs:ready {ships} · bs:fire {r,c} · bs:surrender · bs:again
   and call the exported `api` below when the server answers. */
const emit = (type, detail) => document.dispatchEvent(new CustomEvent("bs:" + type, { detail }));
const typedName = () => el("nameInput").value.trim();

ui.buildBoard(my); ui.buildBoard(enemy);

/* ---------- placement ---------- */
const occupied = (skip) => new Set(Object.entries(S.placed).filter(([id]) => id !== skip)
  .flatMap(([id, p]) => ui.cells(p.o, ship(id).size, p.r, p.c).map(([r, c]) => r * SIZE + c)));
const fits = (id, r, c, o) => ui.cells(o, ship(id).size, r, c).every(([y, x]) => y < SIZE && x < SIZE) &&
  !ui.cells(o, ship(id).size, r, c).some(([y, x]) => occupied(id).has(y * SIZE + x));

function refreshTray() {
  ui.renderTray(S.selected, S.placed, (id) => { S.selected = id; if (S.placed[id]) { ui.removeShip(my, id); delete S.placed[id]; } refreshTray(); });
  el("readyBtn").disabled = Object.keys(S.placed).length < SHIPS.length || S.phase !== "place";
}
const clearPreview = () => my.querySelectorAll(".ok,.bad").forEach((c) => c.classList.remove("ok", "bad"));
const target = (e) => e.target.closest(".cell");

my.addEventListener("mouseover", (e) => {
  clearPreview();
  const t = target(e); if (!t || S.phase !== "place" || !S.selected || S.placed[S.selected]) return;
  const r = +t.dataset.r, c = +t.dataset.c, good = fits(S.selected, r, c, S.o);
  ui.cells(S.o, ship(S.selected).size, r, c).forEach(([y, x]) => ui.cellAt(my, y, x)?.classList.add(good ? "ok" : "bad"));
});
my.addEventListener("mouseleave", clearPreview);
my.addEventListener("click", (e) => {
  const t = target(e); if (!t || S.phase !== "place") return;
  const r = +t.dataset.r, c = +t.dataset.c;
  const lifted = Object.keys(S.placed).find((id) => ui.cells(S.placed[id].o, ship(id).size, S.placed[id].r, S.placed[id].c).some(([y, x]) => y === r && x === c));
  if (lifted) { ui.removeShip(my, lifted); delete S.placed[lifted]; S.selected = lifted; clearPreview(); return refreshTray(); }
  if (!S.selected) return;
  if (!fits(S.selected, r, c, S.o)) return;
  S.placed[S.selected] = { r, c, o: S.o };
  ui.drawShip(my, S.selected, ship(S.selected).size, r, c, S.o);
  clearPreview();
  S.selected = SHIPS.find((s) => !S.placed[s.id])?.id ?? null;
  refreshTray();
});

const rotate = () => { S.o = S.o === "h" ? "v" : "h"; };
el("rotateBtn").onclick = rotate;
document.addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "r" && S.phase === "place" && !/INPUT/.test(e.target.tagName)) rotate(); });

function shuffle() {
  S.placed = {}; ui.clearShips(my);
  SHIPS.forEach((s) => {
    for (let tries = 0; tries < 500; tries++) {
      const o = Math.random() < .5 ? "h" : "v", r = Math.floor(Math.random() * SIZE), c = Math.floor(Math.random() * SIZE);
      if (fits(s.id, r, c, o)) { S.placed[s.id] = { r, c, o }; ui.drawShip(my, s.id, s.size, r, c, o); break; }
    }
  });
  S.selected = null; refreshTray();
}
el("shuffleBtn").onclick = () => S.phase === "place" && shuffle();
el("readyBtn").onclick = () => { emit("ready", { ships: S.placed }); api.setPhase("waiting"); };

/* ---------- battle ---------- */
enemy.addEventListener("click", (e) => {
  const t = target(e);
  if (!t || S.phase !== "battle" || !S.myTurn || t.classList.contains("shot")) return;
  emit("fire", { r: +t.dataset.r, c: +t.dataset.c, label: label(+t.dataset.r, +t.dataset.c) });
});
el("surrenderBtn").onclick = () => confirm("Surrender and lose your stake?") && emit("surrender");
el("againBtn").onclick = () => { emit("again"); api.reset(); };

/* ---------- lobby ---------- */
el("createBtn").onclick = () => emit("create", { name: typedName(), stake: Math.floor(+el("stakeInput").value) || 0 });
el("joinBtn").onclick = () => emit("join", { code: el("codeInput").value.trim().toUpperCase(), name: typedName() });
el("codeInput").addEventListener("input", (e) => (e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "")));
el("offerCancel").onclick = () => (el("offer").hidden = true);
el("offerJoin").onclick = () => { el("offer").hidden = true; emit("join", { code: el("codeInput").value.trim().toUpperCase(), name: typedName(), confirmed: true }); };

/* ---------- API for the networking layer ---------- */
export const api = {
  showOffer(stake) { el("offerText").textContent = `This game has a stake of ${stake} coin${stake === 1 ? "" : "s"}. Join and put ${stake} in the pot?`; el("offer").hidden = false; },
  enterGame() { el("lobby").hidden = true; el("game").hidden = false; this.setPhase("place"); },
  setPhase(p) {
    S.phase = p;
    el("readyBtn").hidden = p !== "place";
    el("rotateBtn").hidden = el("shuffleBtn").hidden = el("tray").hidden = p !== "place";
    el("surrenderBtn").hidden = p !== "battle";
    el("againBtn").hidden = p !== "over";
    if (p === "place") refreshTray();
    ui.setStatus({ place: "Place your ships, then press Ready!", waiting: "Waiting for your opponent…", battle: S.myTurn ? "Your turn — pick a target!" : "Opponent is aiming…", over: "Game over" }[p]);
  },
  /** placed: {carrier:{r,c,o}, ...} */
  setFleet(placed) {
    S.placed = placed; ui.clearShips(my);
    SHIPS.forEach((s) => { const p = placed[s.id]; if (p) ui.drawShip(my, s.id, s.size, p.r, p.c, p.o); });
    S.selected = SHIPS.find((s) => !placed[s.id])?.id ?? null; refreshTray();
  },
  setTurn(mine) { S.myTurn = mine; this.setPhase("battle"); enemy.classList.toggle("active", mine); },
  shot(board, r, c, hit) { ui.markShot(board === "mine" ? my : enemy, r, c, hit); },
  sunk(board, s) { ui.markSunk(board === "mine" ? my : enemy, { ...s, size: ship(s.id).size }); },
  endGame(won, msg) { enemy.classList.remove("active"); this.setPhase("over"); ui.setStatus(msg || (won ? "You sunk them all! 🎉" : "Your fleet is sunk.")); },
  phase: () => S.phase,
  reset() { S.placed = {}; S.selected = SHIPS[0].id; ui.buildBoard(my); ui.buildBoard(enemy); this.setPhase("place"); },
  ...ui,
};
window.battleshipUI = api; // handy for the console / your socket module
refreshTray();

