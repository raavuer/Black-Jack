"use strict";
import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { networkInterfaces } from "node:os";

const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static("static"));
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

const deckOfCards = {
  "A♣": 11,
  "A♦": 11,
  "A♥": 11,
  "A♠": 11,
  "2♣": 2,
  "2♦": 2,
  "2♥": 2,
  "2♠": 2,
  "3♣": 3,
  "3♦": 3,
  "3♥": 3,
  "3♠": 3,
  "4♣": 4,
  "4♦": 4,
  "4♥": 4,
  "4♠": 4,
  "5♣": 5,
  "5♦": 5,
  "5♥": 5,
  "5♠": 5,
  "6♣": 6,
  "6♦": 6,
  "6♥": 6,
  "6♠": 6,
  "7♣": 7,
  "7♦": 7,
  "7♥": 7,
  "7♠": 7,
  "8♣": 8,
  "8♦": 8,
  "8♥": 8,
  "8♠": 8,
  "9♣": 9,
  "9♦": 9,
  "9♥": 9,
  "9♠": 9,
  "10♣": 10,
  "10♦": 10,
  "10♥": 10,
  "10♠": 10,
  "J♣": 10,
  "J♦": 10,
  "J♥": 10,
  "J♠": 10,
  "Q♣": 10,
  "Q♦": 10,
  "Q♥": 10,
  "Q♠": 10,
  "K♣": 10,
  "K♦": 10,
  "K♥": 10,
  "K♠": 10,
};
const shuffleDeck = (deck) => {
  const newDeck = Object.getOwnPropertyNames(deck);
  for (let card = newDeck.length - 1; card > 0; card--) {
    const randomNumber = Math.floor(Math.random() * (card + 1));
    [newDeck[card], newDeck[randomNumber]] = [
      newDeck[randomNumber],
      newDeck[card],
    ];
  }
  return newDeck;
};
const valueCards = (cards, deckWithValues) => {
  let totalValue = 0;
  cards.forEach((card, index) => {
    if (card[0] === "A") {
      cards.push(cards.splice(index, 1)[0]);
    }
  });
  cards.forEach((card) => {
    let value = deckWithValues[card];
    value = value === 11 ? (totalValue + value > 22 ? 1 : 11) : value;
    totalValue += value;
  });
  return totalValue;
};

const players = {
  dealer: {
    name: "dealer",
    cards: [],
    cardsValue: 0,
    isDone: true,
    didWin: false,
  },
};
io.on("connection", (socket) => {
  socket.on("hello", (arg1, callback) => {
    callback("got it");
  });
  players[socket.id] = {
    name: "Player: " + Object.getOwnPropertyNames(players).length,
    cards: [],
    cardsValue: 0,
    isDone: false,
    didWin: false,
  };
  io.emit("connectPlayers", players);
  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("restart");
  });
  const drawPile = shuffleDeck(deckOfCards);
  for (const player in players) {
    players[player].cards = [];
    players[player].cards.push(drawPile.pop());
    if (player !== "dealer") {
      players[player].cards.push(drawPile.pop());
    }
    players[player].cardsValue = valueCards(players[player].cards, deckOfCards);
  }
  io.emit("drawCards", players);
  socket.on("hit", () => {
    players[socket.id].cards.push(drawPile.pop());
    players[socket.id].cardsValue = valueCards(
      players[socket.id].cards,
      deckOfCards
    );
    io.emit("drawCards", players);
  });
  socket.on("stay", () => {
    players[socket.id].isDone = true;
    for (const player in players) {
      if (players[player].isDone === false) {
        return;
      }
    }
    while (valueCards(players.dealer.cards, deckOfCards) < 17) {
      players.dealer.cards.push(drawPile.pop());
    }
    players.dealer.cardsValue = valueCards(players.dealer.cards, deckOfCards);
    io.emit("drawCards", players);
    for (const player in players) {
      if (player === "dealer") {
        continue;
      }
      if (players[player].cardsValue === 21) {
        players[player].didWin = true;
      } else if (players[player].cardsValue > 21) {
        players[player].didWin = false;
      } else if (players[player].cards.length > 4) {
        players[player].didWin = true;
      } else if (players.dealer.cardsValue === 21) {
        players[player].didWin = false;
      } else if (players.dealer.cardsValue > 21) {
        players[player].didWin = true;
      } else if (players.dealer.cards.length > 4) {
        players[player].didWin = false;
      } else if (players[player].cardsValue > players.dealer.cardsValue) {
        players[player].didWin = true;
      } else {
        players[player].didWin = false;
      }
    }
    io.emit("displayResults", players);
  });
  socket.on("restart", () => {
    io.emit("restart");
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  const IP = Object.values(networkInterfaces()).reduce(
    (r, list) =>
      r.concat(
        list.reduce(
          (rr, i) =>
            rr.concat((i.family === "IPv4" && !i.internal && i.address) || []),
          []
        )
      ),
    []
  );
  console.log(`Server running at http://${IP}:${PORT}`);
});
