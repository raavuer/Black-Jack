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

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

const getTenRandomCards = (deck) => {
  let cards = [];
  let cardsFromDeck = Object.getOwnPropertyNames(deck);
  for (let i = 0; i < 10; i++) {
    let randomCardNumber = Math.floor(Math.random() * cardsFromDeck.length);
    let card = cardsFromDeck[randomCardNumber];
    if (card in cards) {
      i--;
    } else {
      cards.push(card);
    }
  }
  return cards;
};

const drawCard = (cards, recipient) => {
  cards[recipient].cards.push(cards.drawPile.pop());
  return cards;
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

const deckOfCards = {
  "Ace of Clubs": 11,
  "Ace of Diamonds": 11,
  "Ace of Hearts": 11,
  "Ace of Spades": 11,
  "Two of Clubs": 2,
  "Two of Diamonds": 2,
  "Two of Hearts": 2,
  "Two of Spades": 2,
  "Three of Clubs": 3,
  "Three of Diamonds": 3,
  "Three of Hearts": 3,
  "Three of Spades": 3,
  "Four of Clubs": 4,
  "Four of Diamonds": 4,
  "Four of Hearts": 4,
  "Four of Spades": 4,
  "Five of Clubs": 5,
  "Five of Diamonds": 5,
  "Five of Hearts": 5,
  "Five of Spades": 5,
  "Six of Clubs": 6,
  "Six of Diamonds": 6,
  "Six of Hearts": 6,
  "Six of Spades": 6,
  "Seven of Clubs": 7,
  "Seven of Diamonds": 7,
  "Seven of Hearts": 7,
  "Seven of Spades": 7,
  "Eight of Clubs": 8,
  "Eight of Diamonds": 8,
  "Eight of Hearts": 8,
  "Eight of Spades": 8,
  "Nine of Clubs": 9,
  "Nine of Diamonds": 9,
  "Nine of Hearts": 9,
  "Nine of Spades": 9,
  "Ten of Clubs": 10,
  "Ten of Diamonds": 10,
  "Ten of Hearts": 10,
  "Ten of Spades": 10,
  "Jack of Clubs": 10,
  "Jack of Diamonds": 10,
  "Jack of Hearts": 10,
  "Jack of Spades": 10,
  "Queen of Clubs": 10,
  "Queen of Diamonds": 10,
  "Queen of Hearts": 10,
  "Queen of Spades": 10,
  "King of Clubs": 10,
  "King of Diamonds": 10,
  "King of Hearts": 10,
  "King of Spades": 10,
};

const games = {};
io.on("connection", (socket) => {
  socket.on("play", (gameType, room) => {
    if (gameType === "join") {
      if (games[room]) {
        games[room].players.push(socket.id);
        socket.on("disconnect", () => {
          games[room].players.pop(socket.id);
        });
      }
    } else if (gameType === "host") {
      games[socket.id.substring(0, 4).toUpperCase()] = {
        gameType: "multi",
        players: [socket.id],
      };
      socket.on("disconnect", () => {
        delete games[socket.id.substring(0, 4).toUpperCase()];
      });
    } else {
      games[socket.id] = {
        gameType: "solo",
      };
      socket.on("disconnect", () => {
        delete games[socket.id];
      });
    }
    console.log(games);
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
