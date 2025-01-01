export const HANGMAN_ALPHABETS = [
  [
    { key: "q", disabled: false },
    { key: "w", disabled: false },
    { key: "e", disabled: false },
    { key: "r", disabled: false },
    { key: "t", disabled: false },
    { key: "y", disabled: false },
    { key: "u", disabled: false },
    { key: "i", disabled: false },
    { key: "o", disabled: false },
    { key: "p", disabled: false },
  ],
  [
    { key: "a", disabled: false },
    { key: "s", disabled: false },
    { key: "d", disabled: false },
    { key: "f", disabled: false },
    { key: "g", disabled: false },
    { key: "h", disabled: false },
    { key: "j", disabled: false },
    { key: "k", disabled: false },
    { key: "l", disabled: false },
  ],
  [
    { key: "z", disabled: false },
    { key: "x", disabled: false },
    { key: "c", disabled: false },
    { key: "v", disabled: false },
    { key: "b", disabled: false },
    { key: "n", disabled: false },
    { key: "m", disabled: false },
  ],
];

export const HANGMAN_WORDS_WITH_HINTS = [
  {
    word: "banana",
    hint: "A yellow fruit",
  },
  {
    word: "mango",
    hint: "King of fruits",
  },
  {
    word: "orange",
    hint: "A fruit and a color",
  },
  {
    word: "pineapple",
    hint: "A fruit with a crown",
  },
];

export const HANGMAN_GAME_DIFFICULTY = {
  EASY: {
    basePercentage: 15,
    increaseFactor: 5, 
  },
  HARD: {
    basePercentage: 30,
    increaseFactor: 5,
  },
};

