export const POINTS_PER_ALPHABET = [
  { letter: "a", frequency: 9, score: 1 },
  { letter: "b", frequency: 2, score: 3 },
  { letter: "c", frequency: 2, score: 3 },
  { letter: "d", frequency: 4, score: 2 },
  { letter: "e", frequency: 12, score: 1 },
  { letter: "f", frequency: 2, score: 4 },
  { letter: "g", frequency: 3, score: 2 },
  { letter: "h", frequency: 2, score: 4 },
  { letter: "i", frequency: 9, score: 1 },
  { letter: "j", frequency: 1, score: 8 },
  { letter: "k", frequency: 1, score: 5 },
  { letter: "l", frequency: 4, score: 1 },
  { letter: "m", frequency: 2, score: 3 },
  { letter: "n", frequency: 6, score: 1 },
  { letter: "o", frequency: 8, score: 1 },
  { letter: "p", frequency: 2, score: 3 },
  { letter: "q", frequency: 1, score: 10 },
  { letter: "r", frequency: 6, score: 1 },
  { letter: "s", frequency: 4, score: 1 },
  { letter: "t", frequency: 6, score: 1 },
  { letter: "u", frequency: 4, score: 1 },
  { letter: "v", frequency: 2, score: 4 },
  { letter: "w", frequency: 2, score: 4 },
  { letter: "x", frequency: 1, score: 8 },
  { letter: "y", frequency: 2, score: 4 },
  { letter: "z", frequency: 1, score: 10 },
];

export const ROUND_INFO = [
  { round: 1, time: 15, length: 2 },
  { round: 2, time: 20, length: 3 },
  { round: 3, time: 25, length: 4 },
  { round: 4, time: 30, length: 5 },
];


// Function to pick a random tile based on frequency
export function pickRandomTile() {
  // Calculate total frequency
  const totalFrequency = POINTS_PER_ALPHABET.reduce(
    (acc, tile) => acc + tile.frequency,
    0
  );
  
  // Generate a random number between 0 and totalFrequency - 1
  const randomNumber = Math.floor(Math.random() * totalFrequency);
  
  // Iterate through tiles to find the selected tile
  let currentSum = 0;
  for (const tile of POINTS_PER_ALPHABET) {
    currentSum += tile.frequency;
    if (randomNumber < currentSum) {
      return tile;
    }
  }
}

// Function to generate a rack of 7 random tiles
export function generateRandomRack() {
  const rack = [];
  while (rack.length < 7) {
    const randomTile = pickRandomTile();
    rack.push({ letter: randomTile.letter, score: randomTile.score });
  }
  return rack;
}

export function checkWordsInRack(rack, wordsList) {
  const foundCategories = {
    two: { found: false, word: null },
    three: { found: false, word: null },
    four: { found: false, word: null },
    five: { found: false, word: null },
  };

  const countLetters = (word) => {
    const count = {};
    for (let letter of word) {
      if (count[letter]) {
        count[letter]++;
      } else {
        count[letter] = 1;
      }
    }
    return count;
  };

  const rackLetterCount = countLetters(
    rack.map((tile) => tile.letter).join("")
  );

  for (const word of wordsList) {
    const wordLetterCount = countLetters(word);
    const isWordInRack = Object.keys(wordLetterCount).every(
      (letter) => wordLetterCount[letter] <= (rackLetterCount[letter] || 0)
    );

    if (word.length === 2 && !foundCategories.two.found && isWordInRack) {
      foundCategories.two = { found: true, word };
    } else if (
      word.length === 3 &&
      !foundCategories.three.found &&
      isWordInRack
    ) {
      foundCategories.three = { found: true, word };
    } else if (
      word.length === 4 &&
      !foundCategories.four.found &&
      isWordInRack
    ) {
      foundCategories.four = { found: true, word };
    } else if (
      word.length === 5 &&
      !foundCategories.five.found &&
      isWordInRack
    ) {
      foundCategories.five = { found: true, word };
    }
  }

  return foundCategories;
}
export const getRandomLettersForGame = (words) => {
  // Generate a random rack of tiles ensuring at least one word can be formed from each category
  let randomRack = generateRandomRack();
  let attempts = 0;
  const MAX_ATTEMPTS = 1000;
  let foundWords;

  while (attempts < MAX_ATTEMPTS) {
    foundWords = checkWordsInRack(randomRack, words);
    if (foundWords.two.found && foundWords.three.found && foundWords.four.found && foundWords.five.found) {
      break;
    }
    randomRack = generateRandomRack();
    attempts++;
  }

  if (attempts === MAX_ATTEMPTS) {
    // Return a default rack or handle the error in another way
    return { randomRack, foundWords };
  }

  return { randomRack, foundWords };
};

// Function to get a random item from an array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to filter words by length
function filterWordsByLength(words, length) {
  return words.filter(word => word.length === length);
}

// Function to get a specified number of random words of a specific length
export function getRandomWordsByLength(words, length, count) {
  const filteredWords = filterWordsByLength(words, length);
  const randomWords = [];
  for (let i = 0; i < count; i++) {
    randomWords.push(getRandomItem(filteredWords));
  }
  return randomWords;
}