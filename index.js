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
  let cards = {};
  let cardsFromDeck = Object.getOwnPropertyNames(deck);
  for (let i = 0; i < 10; i++) {
    let randomCardNumber = Math.floor(Math.random() * cardsFromDeck.length);
    let card = cardsFromDeck[randomCardNumber];
    let value = deck[card];
    if (card in cards) {
      i--;
    } else {
      cards[card] = value;
    }
  }
  return cards;
};

const drawCard = (cards, recipient) => {
  cards[recipient].cards.push(Object.getOwnPropertyNames(cards.drawPile)[0]);
  delete cards.drawPile[Object.getOwnPropertyNames(cards.drawPile)[0]];
  return cards;
};

const valueCards = (cards, deckWithValues) => {
  let totalValue = 0;
  cards.sort().reverse(); // Count aces last.
  cards.forEach((card) => {
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

const ip = Object.values(networkInterfaces()).reduce(
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
const port = 8080;
server.listen(port, () => {
  console.log(`Server running at http://${ip}:${port}`);
  io.on("connection", (socket) => {
    socket.on("disconnect", () => {
      delete games[socket.id];
    });
    socket.on("start", () => {
      games[socket.id] = {
        drawPile: getTenRandomCards(deckOfCards),
        player: {
          cards: [],
          value: 0,
        },
        dealer: {
          cards: [],
          value: 0,
        },
      };
      games[socket.id] = drawCard(games[socket.id], "player");
      games[socket.id] = drawCard(games[socket.id], "dealer");
      games[socket.id] = drawCard(games[socket.id], "player");
      io.to(socket.id).emit("players-turn");
      io.to(socket.id).emit("display-players-cards", games[socket.id]);
      io.to(socket.id).emit("display-dealers-cards", games[socket.id]);
      games[socket.id].player.value = valueCards(
        games[socket.id].player.cards,
        deckOfCards
      );
      games[socket.id].dealer.value = valueCards(
        games[socket.id].dealer.cards,
        deckOfCards
      );
      io.to(socket.id).emit("display-dealers-value", games[socket.id]);
      io.to(socket.id).emit("display-players-value", games[socket.id]);
      if (valueCards(games[socket.id].player.cards, deckOfCards) === 21) {
        io.to(socket.id).emit("dealers-turn");
      } else {
        socket.on("hit", () => {
          games[socket.id] = drawCard(games[socket.id], "player");
          io.to(socket.id).emit("display-players-cards", games[socket.id]);
          games[socket.id].player.value = valueCards(
            games[socket.id].player.cards,
            deckOfCards
          );
          io.to(socket.id).emit("display-players-value", games[socket.id]);
          if (
            games[socket.id].player.value >= 21 ||
            games[socket.id].player.cards.length > 4
          ) {
            io.to(socket.id).emit("dealers-turn");
          }
        });
        socket.on("stay", () => {
          io.to(socket.id).emit("dealers-turn");
        });
      }
      socket.on("player-done", () => {
        while (
          games[socket.id].dealer.value < 17 &&
          games[socket.id].dealer.cards.length < 5
        ) {
          games[socket.id] = drawCard(games[socket.id], "dealer");
          io.to(socket.id).emit("display-dealers-cards", games[socket.id]);
          games[socket.id].dealer.value = valueCards(
            games[socket.id].dealer.cards,
            deckOfCards
          );
          io.to(socket.id).emit("display-dealers-value", games[socket.id]);
        }
        let condition = "";
        if (games[socket.id].player.value === 21) {
          condition = "You Won! Your total value was exactly 21.";
        } else if (games[socket.id].player.value > 21) {
          condition = "You Lost! The total value must be less than 21.";
        } else if (games[socket.id].player.cards.length === 5) {
          condition = "You Won! You got 5 cards without going over 21.";
        } else if (games[socket.id].dealer.value > 21) {
          condition = "You Won! The dealer's total was more than 21.";
        } else if (games[socket.id].dealer.cards.length === 5) {
          condition = "You Lost! The dealer got 5 cards without going over 21.";
        } else {
          if (games[socket.id].player.value > games[socket.id].dealer.value) {
            condition = "You Won! Your total value was more than the dealer's.";
          } else if (
            games[socket.id].dealer.value === games[socket.id].player.value
          ) {
            condition = "You Lost! It was a tie, which goes to the dealer.";
          } else {
            condition =
              "You Lost! The dealer's total value was more than yours.";
          }
        }
        io.to(socket.id).emit("win-loss-condition", condition);
      });
    });
  });
});
