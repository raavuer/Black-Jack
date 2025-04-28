"use strict";
const prompt = require("prompt-sync")();

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
  cards[recipient].push(Object.getOwnPropertyNames(cards.drawPile)[0]);
  delete cards.drawPile[Object.getOwnPropertyNames(cards.drawPile)[0]];
  return cards;
};

const valueCards = (cards, deckWithValues) => {
  let totalValue = 0;
  cards.sort().reverse(); // Count ace cards last.
  cards.forEach((card) => {
    let value = deckWithValues[card];
    value = value === 11 ? (totalValue + value > 22 ? 1 : 11) : value;
    totalValue += value;
  });
  return totalValue;
};

const gameLoop = (deck) => {
  console.clear();

  let cards = {
    drawPile: getTenRandomCards(deck),
    player: [],
    dealer: [],
  };
  cards = drawCard(cards, "player");
  cards = drawCard(cards, "dealer");
  cards = drawCard(cards, "player");

  console.log("You have: ");
  cards.player.forEach((element) => {
    console.log(`  ${element}`);
  });
  console.log("The dealer has: ");
  cards.dealer.forEach((element) => {
    console.log(`  ${element}`);
  });

  console.log();
  let willDrawCard = prompt("Draw another card? Y/n: ");
  while (willDrawCard === "" || willDrawCard.toLowerCase() === "y") {
    cards = drawCard(cards, "player");
    console.log("You have: ");
    cards.player.forEach((element) => {
      console.log(`  ${element}`);
    });
    if (cards.player.length > 4) {
      break;
    }
    console.log();
    willDrawCard = prompt("Draw another card? Y/n: ");
  }

  let playerCardsTotalValue = valueCards(cards.player, deck);
  console.log();
  console.log(`The total value of your cards is: ${playerCardsTotalValue}`);

  console.log();
  while (valueCards(cards.dealer, deck) < 17) {
    cards = drawCard(cards, "dealer");
    console.log();
    console.log("The dealer has: ");
    cards.dealer.forEach((element) => {
      console.log(`  ${element}`);
    });
  }
  let dealerCardsTotalValue = valueCards(cards.dealer, deck);
  console.log();
  console.log(
    `The total value of the dealer's cards is: ${dealerCardsTotalValue}`
  );
  console.log(`The total value of your cards is: ${playerCardsTotalValue}`);

  console.log();
  if (playerCardsTotalValue === 21) {
    console.log("You Won! Your total value was exactly 21.");
  } else if (playerCardsTotalValue > 21) {
    console.log("You Lost! The total value must be less than 21.");
  } else if (cards.player.length === 5) {
    console.log("You Won! You got 5 cards without going over 21.");
  } else if (dealerCardsTotalValue > 21) {
    console.log("You Won! The dealer's total was more than 21.");
  } else {
    if (playerCardsTotalValue > dealerCardsTotalValue) {
      console.log("You Won! Your total value was more than the dealer's.");
    } else if (dealerCardsTotalValue === playerCardsTotalValue) {
      console.log("You Lost! It was a tie, which goes to the dealer.");
    } else {
      console.log("You Lost! The dealer's total value was more than yours.");
    }
  }

  let willPlayAgain = prompt("Play Again? Y/n: ");
  if (willPlayAgain === "" || willPlayAgain.toLowerCase() === "y") {
    gameLoop(deck);
  }
  return;
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

gameLoop(deckOfCards);
