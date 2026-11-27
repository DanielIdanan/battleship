// src/config.js - settings
const path = require('path');

module.exports = {
  PORT: process.env.PORT || 3000,
  PUBLIC_DIR: path.join(__dirname, '..', 'public'),
  DB_FILE: path.join(__dirname, '..', 'battleship.db'),
  SIZES: [5, 4, 3, 3, 2],
  START_COINS: 100,
  MAX_STAKE: 1000000,
};
