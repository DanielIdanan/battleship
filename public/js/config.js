export const SIZE = 10;
export const SHIPS = [
  { id: "carrier", size: 5 }, { id: "battleship", size: 4 }, { id: "cruiser", size: 3 },
  { id: "submarine", size: 3 }, { id: "destroyer", size: 2 },
];
export const sprite = (id, o) => `assets/ships/${id}_${o}.png`;
export const label = (r, c) => "ABCDEFGHIJ"[r] + (c + 1);
