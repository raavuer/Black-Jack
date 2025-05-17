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

app.use(express.static("public"));
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
  cards
    .sort()
    .reverse() // Count Aces last
    .forEach((card) => {
      let value = deckWithValues[card];
      value = value === 11 ? (totalValue + value > 22 ? 1 : 11) : value;
      totalValue += value;
    });
  return totalValue;
};

const players = {
  Dealer: [],
};
io.on("connection", (socket) => {
  players[socket.id] = [];
  socket.on("disconnect", () => {
    delete players[socket.id];
  });
  io.emit("connect-players", players);
  const drawPile = shuffleDeck(deckOfCards);
  for (const player in players) {
    players[player] = [];
    players[player].push(drawPile.pop());
    if (player !== "Dealer") {
      players[player].push(drawPile.pop());
    }
  }
  io.emit("deal-cards", players);
  socket.on("hit", () => {
    players[socket.id].push(drawPile.pop());
    io.emit("deal-cards", players);
  });
  let playersDone = 0;
  socket.on("stay", () => {
    playersDone++;
    if (playersDone < Object.getOwnPropertyNames(players).length - 1) {
      return;
    }
    console.log("everyone is done!");
  });
});

const getLocalIPv4Address = () => {
  const interfaces = networkInterfaces();
  for (const interfaceList of Object.values(interfaces)) {
    for (const networkInterface of interfaceList) {
      if (networkInterface.family === "IPv4" && !networkInterface.internal) {
        return networkInterface.address;
      }
    }
  }
};
const [ip, port] = [getLocalIPv4Address(), 8080];
server.listen(port, () => {
  console.log(`Server running at http://${ip}:${port}`);
});
