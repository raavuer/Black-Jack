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
  "A♣": 11, "A♦": 11, "A♥": 11, "A♠": 11,
  "2♣": 2, "2♦": 2, "2♥": 2, "2♠": 2,
  "3♣": 3, "3♦": 3, "3♥": 3, "3♠": 3,
  "4♣": 4, "4♦": 4, "4♥": 4, "4♠": 4,
  "5♣": 5, "5♦": 5, "5♥": 5, "5♠": 5,
  "6♣": 6, "6♦": 6, "6♥": 6, "6♠": 6,
  "7♣": 7, "7♦": 7, "7♥": 7, "7♠": 7,
  "8♣": 8, "8♦": 8, "8♥": 8, "8♠": 8,
  "9♣": 9, "9♦": 9, "9♥": 9, "9♠": 9,
  "10♣": 10, "10♦": 10, "10♥": 10, "10♠": 10,
  "J♣": 10, "J♦": 10, "J♥": 10, "J♠": 10,
  "Q♣": 10, "Q♦": 10, "Q♥": 10, "Q♠": 10,
  "K♣": 10, "K♦": 10, "K♥": 10, "K♠": 10
}

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
      window.location("single-player.html");
    }
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
