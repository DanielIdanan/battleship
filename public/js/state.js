// public/js/state.js - shared state
import { SIZES } from './constants.js';

export const state = {
  me: -1,
  myTurn: false,
  over: false,
  myName: '',
  myCoins: null,
  players: [],
  turnSeat: -1,
  shownChange: null,
  fleet: SIZES.map(() => null),
  sel: 0,
  horizontal: true,
  placing: false,
};
