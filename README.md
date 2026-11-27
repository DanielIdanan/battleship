# You Sunk My Battle Ships!

Two-player online Battleship with a coin-stake wallet.

## Run

Needs Node.js 22.5 or newer.

```
npm install
npm start
```

Open http://localhost:3000 in two tabs, each with a different name.

## Play

1. Enter your name (you start with 100 coins).
2. Create a game with a stake, or join with a friend's 4-letter code.
3. Place your ships and press Ready. `R` rotates.
4. Take turns firing. Sink all five ships to win the pot.

## Folders

- `src/` and `server.js`: Part 1, the server
- `public/js/`: Part 2, the client
- `public/index.html`, `public/css/`, `public/assets/`: the UI
