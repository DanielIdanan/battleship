// public/js/dom.js - DOM helpers
export const $ = (id) => document.getElementById(id);
export const say = (text) => ($('status').textContent = text);
export const show = (id, on = true) => ($(id).hidden = !on);
export const coins = (n) => `${n} coin${n === 1 ? '' : 's'}`;
