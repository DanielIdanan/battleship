// src/db.js - database (wallets)
const { DatabaseSync } = require('node:sqlite');
const { DB_FILE, START_COINS } = require('./config');

const db = new DatabaseSync(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS wallets (key TEXT PRIMARY KEY, coins INTEGER NOT NULL CHECK (coins >= 0));
  CREATE TABLE IF NOT EXISTS ledger  (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL, delta INTEGER NOT NULL,
                                      reason TEXT NOT NULL, room TEXT, at TEXT DEFAULT CURRENT_TIMESTAMP);
`);
try { db.exec('ALTER TABLE wallets ADD COLUMN name TEXT'); } catch (e) {}

const cleanName = (n) => String(n ?? '').replace(/[^\w .-]/g, '').trim().slice(0, 16) || 'Player';

const balance = (key) => {
  db.prepare('INSERT OR IGNORE INTO wallets (key, coins) VALUES (?, ?)').run(key, START_COINS);
  return db.prepare('SELECT coins FROM wallets WHERE key = ?').get(key).coins;
};

const setName = (key, name) => {
  balance(key);
  db.prepare('UPDATE wallets SET name = ? WHERE key = ?').run(cleanName(name), key);
};

function adjust(key, delta, reason, room) {
  if (delta === 0) return true;
  balance(key);
  const r = db.prepare('UPDATE wallets SET coins = coins + ? WHERE key = ? AND coins + ? >= 0').run(delta, key, delta);
  if (!r.changes) return false;
  db.prepare('INSERT INTO ledger (key, delta, reason, room) VALUES (?, ?, ?, ?)').run(key, delta, reason, room);
  return true;
}

module.exports = { cleanName, setName, balance, adjust };
