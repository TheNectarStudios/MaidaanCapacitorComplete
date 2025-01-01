/***********************************************************************
 * File that contains utility functions for the Board component
 ***********************************************************************/

// generates a random integer from min - max inclusive
function randomIntGenerator(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/***********************************************************************
 * Pure function that takes a symmetrical 2D array as an argument and
 * returns a new 2D array that is shuffled using the Fisher Yates Shuffle
 * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 *
 * I thought of my previous implementation of the fisher yates shuffle
 * and I wasn't sure of the correctness of my algorithm due to the
 * the input being a 2d array. There isn't much data on the internet about
 * shuffling 2d arrays and I wasn't sure about choosing a random row/col
 *
 * The array is symmetrical so on each iteration the row/col is calculated
 * from i, which counts down from the number of total elements. A random
 * integer in the range 0 <= j <= i, is generated and the appropriate
 * row and column is calculated from j.
 *
 * This approach is pretty much identical to the fisher-yates algorithm
 * for a one dimensional array
 ***********************************************************************/

export default function shuffle(oldArr) {
  const n = oldArr.length; 
  if (n === 0) return oldArr; 
  
  const m = oldArr[0].length; 
  const totalElements = n * m; 

  for (let i = totalElements - 1; i > 0; i--) {
    const currRow = Math.floor(i / m);
    const currCol = i % m;

    // Generate a random index between 0 and i
    const j = randomIntGenerator(0, i);

    // Calculate the position of the random element
    const randRow = Math.floor(j / m);
    const randCol = j % m;

    // Swap the current element with the random element
    const temp = oldArr[currRow][currCol];
    oldArr[currRow][currCol] = oldArr[randRow][randCol];
    oldArr[randRow][randCol] = temp;
  }
  return oldArr;
}


export const shuffle1DArray = (array) => {
  let shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}


