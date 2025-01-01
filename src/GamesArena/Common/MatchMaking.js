import axios from 'axios';
import { doc, getDoc, setDoc, addDoc, collection, getDocs } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import shuffle from "../Common/shuffle";
import { MATRIX, MATRIX_PRO } from "../../Constants/GamesArena/MemoryCards";
import { find } from 'lodash';
import { getDateOfMondayWithUnderscore, getUrlByGameType } from '../utils';
import { Leaderboard } from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import { HANGMAN_ALPHABETS } from '../../Constants/GamesArena/Hangman';
import { getRandomValueFromArray } from '../../Constants/GamesArena/MemoryCards';
import { checkUserGameLimit } from '../utils';
import { MOVES_PER_PERSON, generateRandomTargetPosition, getRandomTargetMovementVertices } from "../../Constants/GamesArena/Archery";
import { getRandomLettersForGame } from '../../Constants/GamesArena/MiniScrabble';
import  listOfWords from '../../assets/scrabble-words.json'; 

export const findPlayer = async (user, gameType, setOneOnOneID, searchParams, setSearchParams, db, setComputerGameLoading, setLoading, setComputerGameMessage, checkUserGameLimit, setDocCreatedDate,game) => {

  const response = await axios.get(`${process.env.REACT_APP_NODE_BASE_URL}/matching/get-matching-game/${user.id}?gameType=${gameType}`);
  const { newMatchCreated, writtenDocId, gameId, currentDate } = response?.data?.data;
  if (newMatchCreated) {
    //set the oneOnOneID to the writtenDocId of the openmatching doc that was created
    setOneOnOneID(writtenDocId);
    setDocCreatedDate(currentDate);
  } else {
    // A matching game is found and updated it with the status matchedWithPlayer,user details and gameId
    //now put a snashot listener on the doc and check if the gameStarted is true or not
    if (gameId) {
      const openMatchesCollection = collection(db, 'openMatches');
      const unsubscribe = onSnapshot(doc(openMatchesCollection, writtenDocId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data?.gameStarted && data?.matchedUserId === user.id) {
            const otherPlayer = data?.userId;
            //get the childDoc of the other player
            const otherPlayerName = data?.userName;
            const otherPlayerCity = data?.userCity;
            setLoading(false);
            setSearchParams({ ...searchParams, gameId: data.gameId ,game: game=="pro" ? "pro" : ""});
            setTimeout(() => {
              setComputerGameLoading(false);
              setComputerGameMessage(
                `You are playing against ${otherPlayerName} from ${otherPlayerCity}`
              );
            }, 3000);

            setTimeout(() => {
              setComputerGameMessage("");
            }
              , 5000);
          }
        }
      });
    }
  }
};

export const startPvpGame = async (user, playerTwo, gameId, oneOnOneID, setLoading, searchParams, setSearchParams, setComputerGameLoading, db, setComputerGameMessage,game) => {

  setLoading(true);
  let memoryCardsCollection;
  let boardMatrix;
  if(game === "pro"){
    memoryCardsCollection = collection(db, 'memoryCardsPro');

    boardMatrix = shuffle(MATRIX_PRO);
  }
  else{
    memoryCardsCollection = collection(db, 'memoryCards');
   boardMatrix = shuffle(MATRIX);
  }
  const docRef = doc(memoryCardsCollection, gameId);
  //get the name of the player two
  const childCollection = collection(db, 'children');
  const playerTwoRef = doc(childCollection, playerTwo);
  const playerTwoDoc = await getDoc(playerTwoRef);
  const playerTwoData = playerTwoDoc.data();
  const playerTwoName = playerTwoData?.firstName;
  const playerTwoCity = playerTwoData?.city;

  await setDoc(docRef, {
    createdAt: new Date(),
    playerOne: {
      score: 0,
      id: user.id,
      moves: { 1: [], 2: [] },
      name: user.firstName,
    },
    playerTwo: {
      score: 0,
      id: playerTwo,
      moves: { 1: [], 2: [] },
      name: playerTwoName,
    },
    result: [],
    winner: null,
    board: JSON.stringify(boardMatrix),
    currentActivePlayer: "playerOne",
    currentActiveMove: 1,
    activeSound: "/Assets/Sounds/MemoryCards/gameStart.mp3",
    isComputerGame: false,
    isGameStarted: true,
    gameStartedAt: new Date(),
    pvpGame: true,
  });



  //update the openmatches doc with the game started
  const openMatchesCollection = collection(db, 'openMatches');
  const openMatchRef = doc(openMatchesCollection, oneOnOneID);
  await setDoc(openMatchRef, {
    gameStarted: true,
  }, { merge: true });

  setSearchParams({ ...searchParams, gameId: docRef.id,game: game=="pro" ? "pro" : "" });
  setComputerGameLoading(true);
};

export const handleVisibility = (oneOnOneID, gameState, setComputerGameLoading, setLoading, setOneOnOneID, db, gamestate, quitGame) => {
  let timeout;
  const handleVisibilityChange = () => {
    const date = new Date();

    if (!gameState?.gameStartedAt) {
      if (document.visibilityState === 'visible') {
        clearTimeout(timeout);
      } else {
        if (oneOnOneID) {
          //close the matchingDoc
          const openMatchesCollection = collection(db, 'openMatches');
          setDoc(doc(openMatchesCollection, oneOnOneID), {
            status: "closedWithExit",
          }, { merge: true });
          setComputerGameLoading(false);
          setLoading(false);
          setOneOnOneID(null);
        }
      }
    }
    else {
      if (document.visibilityState === 'visible') {
        clearTimeout(timeout);
      } else {
        timeout = setTimeout(() => {
          quitGame();

        }, 8000);
      }
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearTimeout(timeout);
  };
}

export const handleGameStart = (oneOnOneID, createGame, AI_COMPUTER_ID, startPvpGame, user, setLoading, searchParams, setSearchParams, setComputerGameLoading, db, setComputerGameMessage, docCreatedDate,game) => {
  const timerIdRef = { current: null };
  let pvpGameStarted = false;
  let botGameStarted = false;

  if (!oneOnOneID) {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    return;
  }

  const openMatchesCollection = collection(db, 'openMatches');
  // Define a function to create a game with the computer
  const startGameWithComputer = async () => {
    //change the status of the document to closed
    await setDoc(doc(openMatchesCollection, oneOnOneID), {
      status: "closed",
    }, { merge: true });
    botGameStarted = true;
    createGame(AI_COMPUTER_ID);
  };
  const timeleft = 15000 - ((new Date().getTime() - docCreatedDate));
  // Set a timer that will start the game with the computer after 15 seconds if a match is not found
  timerIdRef.current = setTimeout(() => {
    if (!pvpGameStarted) {
      startGameWithComputer();
    }
  }, timeleft);

  const unsubscribe = onSnapshot(doc(openMatchesCollection, oneOnOneID), async (doc) => {

    if (doc.exists()) {
      const data = doc.data();

      if (data.status === "closed") {
        const name = doc.data().gameId;
        const player2 = doc.data().matchedUserId;
        //checkUserGameLimit(true);
        if(!data.gameStarted  && !botGameStarted){
          pvpGameStarted = true;
          await startPvpGame(user, player2, name, oneOnOneID, setLoading, searchParams, setSearchParams, setComputerGameLoading, db, setComputerGameMessage,game);
        }
        else if(botGameStarted){
          await setDoc(doc(openMatchesCollection, oneOnOneID), {
            status: "closedWithExitTimeout",
          }, { merge: true });
        }
        clearTimeout(timerIdRef.current);
      }
    }
  });

  return () => {
    unsubscribe();
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
    }
  };
}

export const handleUpdateRating = async (winner, currentActivePlayer, gameType, gameState, otherPlayer) => {
  if (winner === currentActivePlayer) {
    await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/user/update-Rating`, {
      playerOne: gameState[currentActivePlayer].id,
      playerTwo: gameState[otherPlayer].id,
      gameType: gameType
    });
  }
  else if (winner === otherPlayer) {
    await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/user/update-Rating`, {
      playerOne: gameState[otherPlayer].id,
      playerTwo: gameState[currentActivePlayer].id,
      gameType: gameType
    });
  }
  else {
    await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/user/update-Rating`, {
      playerOne: gameState[currentActivePlayer].id,
      playerTwo: gameState[otherPlayer].id,
      tie: 'yes',
      gameType: gameType
    });
  }
}

const startPvpArenaGame = async (db, challengeDocData, quiz) => {
  let gameId;
  switch (challengeDocData.gameType) {
    case "memoryCards":
      gameId = await startPvpArenaMemoryCardsGame(db, challengeDocData);
      break;
    case "memoryCardsPro":
      gameId = await startPvpArenaMemoryCardsProGame(db, challengeDocData);
      break;
    case "connect4":
      gameId = await startPvpArenaConnectGame(db, challengeDocData);
      break;
    case "hangman":
      gameId = await startPvpArenaHangmanGame(db, challengeDocData, quiz);
      break;
    case "englishMeaningsQuiz":
      gameId = await startPvpQuizGame(db, challengeDocData, challengeDocData.gameType, quiz);
      break;
    case "LogoQuiz":
      gameId = await startPvpQuizGame(db, challengeDocData, challengeDocData.gameType, quiz);
      break;
    case "archery":
      gameId = await startPvpArenaArcheryGame(db, challengeDocData);
      break;
    case "miniScrabble":
      gameId = await startPvpArenaMiniScrabbleGame(db, challengeDocData);
      break;
  }
  return gameId;
}

export const startGameandNavigate = async (db, challengeDocData, navigate, quiz) => {

  const gameId = await startPvpArenaGame(db, challengeDocData, quiz);
  //update gameId in the openChallenges doc
  await setDoc(doc(db, "openChallenges", challengeDocData.id), {
    gameId: gameId,
  }, { merge: true });
  const url = getUrlByGameType(challengeDocData.gameType, gameId);
  navigate(url);
}

export const startPvpArenaMemoryCardsProGame = async (db, challengeDocData) => {
  const memoryCardsProCollection = collection(db, 'memoryCardsPro');
  const boardMatrix = shuffle(MATRIX_PRO);
  const docRef = await addDoc(memoryCardsProCollection, {
    createdAt: new Date(),
    playerOne: {
      score: 0,
      id: challengeDocData.userId,
      moves: { 1: [], 2: [] },
      name: challengeDocData.userName,
    },
    playerTwo: {
      score: 0, 
      id: challengeDocData.challengeeId,
      moves: { 1: [], 2: [] },
      name: challengeDocData.challengeeName,
    },
    result: [],
    winner: null,
    board: JSON.stringify(boardMatrix),
    currentActivePlayer: "playerOne",
    currentActiveMove: 1,
    activeSound: "/Assets/Sounds/MemoryCards/gameStart.mp3",
    isComputerGame: false,
    isGameStarted: true,
    gameStartedAt: new Date(),
    pvpGame: true,
    challengeGame: true,
  });
  return docRef.id;
}









const startPvpArenaMemoryCardsGame = async (db, challengeDocData) => {
  const memoryCardsCollection = collection(db, 'memoryCards');
  //const docRef = doc(memoryCardsCollection, challengeDocData.gameId);
  const boardMatrix = shuffle(MATRIX);
  const docRef = await addDoc(memoryCardsCollection, {
    createdAt: new Date(),
    playerOne: {
      score: 0,
      id: challengeDocData.userId,
      moves: { 1: [], 2: [] },
      name: challengeDocData.userName,
    },
    playerTwo: {
      score: 0,
      id: challengeDocData.challengeeId,
      moves: { 1: [], 2: [] },
      name: challengeDocData.challengeeName,
    },
    result: [],
    winner: null,
    board: JSON.stringify(boardMatrix),
    currentActivePlayer: "playerOne",
    currentActiveMove: 1,
    activeSound: "/Assets/Sounds/MemoryCards/gameStart.mp3",
    isComputerGame: false,
    isGameStarted: true,
    gameStartedAt: new Date(),
    pvpGame: true,
    challengeGame: true,
  });
  //setDoc(doc(db, "openChallenges", challengeDocData.id), {
  //  gameId: docRef.id,
  //},{merge:true});
  return docRef.id;
}

const startPvpArenaArcheryGame = async (db, challengeDocData) => {
  const archeryCollection = collection(db, 'archery');
  const targetPosition = generateRandomTargetPosition();
  const gameRef = await addDoc(archeryCollection, {
    isGameStarted: true,
    createdAt: new Date(),
    gameStartedAt: new Date(),
    playerOne: {
      score: 0,
      id: challengeDocData.userId,
      // moves: { 1: [], 2: [] },
      name: challengeDocData.userName,
      targetPosition,
      vertices:
        getRandomTargetMovementVertices(targetPosition),
      moves: [],
    },
    playerTwo: {
      score: 0,
      id: challengeDocData.challengeeId,
      name: challengeDocData.challengeeName,
      moves: [],
      arrowFired: false,
      arrowAngle: 0,
    },
    result: [],
    winner: null,
    currentActivePlayer: "playerOne",
    currentActiveMove: 1,
    activeSound: null,
    pvpGame: true,
    challengeGame: true,
  });
  return gameRef.id;
}

const startPvpArenaConnectGame = async (db, challengeDocData) => {
  const connect4Collection = collection(db, 'connect4');
  const BOARD = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ]
  const GAME_DIFFICULTY = {
    EASY: 1,
    MEDIUM: 3,
    HARD: 5
  };
  const boardMatrix = BOARD;

  const docRef = await addDoc(connect4Collection, {
    isGameStarted: true,
    createdAt: new Date(),
    gameStartedAt: new Date(),
    playerOne: {
      score: 0,
      id: challengeDocData.userId,
      // moves: { 1: [], 2: [] },
      name: challengeDocData.userName,
    },
    playerTwo: {
      score: 0,
      id: challengeDocData.challengeeId,
      name: challengeDocData.challengeeName,
    },
    result: [],
    winner: null,
    board: JSON.stringify(boardMatrix),
    currentActivePlayer: "playerOne",
    currentActiveMove: 1,
    activeSound: null,
    pvpGame: true,
    challengeGame: true,
  })
  return docRef.id;
}

/*const startPvpQuizGame = async (user, playerTwo, gameId, oneOnOneID, setLoading, searchParams, setSearchParams, setComputerGameLoading, db) => {

  setLoading(true);
  const randomQuiz = await getQuizNotPlayedByBothPlayers();
  if (!randomQuiz) {
    showToast(
      "There are no active quizes available. Please contact support.",
      "error"
    );
    setLoading(false);
    return;
  }
  /*
  const isGameLimitExceeded = await checkUserGameLimit(true);
  if (isGameLimitExceeded) {
    setLoading(false);
    return;
  }*/
/*const quizGameCollection = collection(db, gameCollectionName);
const gameRef = doc(quizGameCollection, gameId);

//get playerTwo name and
const childCollection = collection(db, 'children');
const playerTwoRef = doc(childCollection, playerTwo);
const playerTwoDoc = await getDoc(playerTwoRef);
const playerTwoData = playerTwoDoc.data();
const playerTwoName = playerTwoData?.firstName;

// add a new document to the chats collection
const chatsCollection = collection(db, "chats");
const chatRef = doc(chatsCollection);
const chatId = chatRef.id;
await setDoc(chatRef, {
  messages: [],
  createdAt: new Date(),
  members: [user.id, playerTwo],
  status: "active",
});
await setDoc(
  gameRef,
  {
    currentActivePlayer: "playerOne",
    isGameStarted: true,
    createdAt: new Date(),
    gameStartedAt: new Date(),
    playerOne: {
      score: 0,
      id: user.id,
      name: user.firstName,
      percentageOfBar: 0,
    },
    playerTwo: {
      score: 0,
      id: playerTwo,
      name: playerTwoName,
      percentageOfBar: 0,
    },
    result: [],
    winner: null,
    currentActivePlayer: "playerOne",
    activeSound: null,
    pvpGame: true,
    currentTimer: 3,
    // activeSound: "/Assets/Sounds/OneOnOneQuiz/gameStart.mp3",
    quizId: randomQuiz?.id,
    currentActiveQuestion: randomQuiz?.questionIds?.[0],
  },
  { merge: true }
);
}
*/
export const getHangmanQuizNotPlayedByBothPlayers = async (db, playerOne, playerTwo) => {
  // get playerOne arenaGames collection from child
  let mergedQuizes = [];
  const playerOneArenaGamesCollection = collection(
    db,
    `children/${playerOne}/arenaGames`
  );
  const playerOnePlayedGames = await getDocs(playerOneArenaGamesCollection);
  const playerOneQuizes = playerOnePlayedGames.docs.map(
    (doc) => doc.data().wordId
  );
  // fetch arenaGames collection from child
  if (playerTwo !== 'computer') {
    const arenaGamesCollection = collection(
      db,
      `children/${playerTwo}/arenaGames`
    );
    const playedGames = await getDocs(arenaGamesCollection);
    const playerTwoQuizes = playedGames.docs.map((doc) => doc.data().wordId);
    // merge both playerOne and playerTwo quizes without duplicates
    mergedQuizes = [...new Set([...playerOneQuizes, ...playerTwoQuizes])];
  }
  // fetch all quizes from quizzes collection which are not played by playerOne
  const quizCollection = collection(db, 'hangmanWords');
  const quizes = await getDocs(quizCollection);
  const quizesData = quizes.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

  const filteredQuizes = quizesData.filter(
    (word) => !mergedQuizes.includes(word.id)
  );
  const randomQuiz = getRandomValueFromArray(filteredQuizes);
  return randomQuiz;
}

const startPvpArenaHangmanGame = async (db, challengeDocData, randomWord) => {
  const gameCollection = collection(db, 'hangman');

  //const randomWord = await getHangmanQuizNotPlayedByBothPlayers(db,challengeDocData.userId, challengeDocData.challengeeId);
  const gameRef = await addDoc(gameCollection, {
    keyboard: JSON.stringify(HANGMAN_ALPHABETS),
    word: randomWord.word,
    hint: randomWord.hint,
    wordId: randomWord.id,
    mistakes: 0,
    guessedLetters: [],
    isGameStarted: true,
    createdAt: new Date(),
    gameStartedAt: new Date(),
    playerOne: {
      score: 0,
      id: challengeDocData.userId,
      // moves: { 1: [], 2: [] },
      name: challengeDocData.userName,
    },
    playerTwo: { score: 0, id: challengeDocData.challengeeId, name: challengeDocData.challengeeName },
    result: [],
    winner: null,
    currentActivePlayer: "playerOne",
    currentActiveMove: 1,
    activeSound: null,
    pvpGame: true,
    challengeGame: true,
  });
  return gameRef.id;
}

export const getQuizNotPlayedByBothPlayers = async (db, playerOne, playerTwo, gameType) => {
  // get playerOne arenaGames collection from child
  /**case "mental-math":
        setGameCollectionName("oneOnOneQuiz");
        setQuizCollectionName("quizzes");
        setQuizQuestionsCollectionName("quizQuestions");
        setGameType("oneOnOneQuiz");
        setHeaderText("Mental Math");
        setBackButtonUrl(MENTAL_MATH_ROUTE);
        break;
      case "logo-quiz":
        setGameCollectionName("oneOnOneLogoQuiz");
        setQuizCollectionName("oneOnOneLogoQuizzes");
        setQuizQuestionsCollectionName("oneOnOneLogoQuizQuestions");
        setGameType("LogoQuiz");
        setHeaderText("Logo Wars");
        setBackButtonUrl(LOGO_QUIZ_ROUTE);
        break;
      default:
        break;
    } */
  const quizCollectionName = gameType === "englishMeaningsQuiz" ? "oneOnOneEngMeaningsQuizzes" : "oneOnOneLogoQuizzes";
  const playerOneArenaGamesCollection = collection(
    db,
    `children/${playerOne}/arenaGames`
  );
  const playerOnePlayedGames = await getDocs(playerOneArenaGamesCollection);
  const playerOneQuizes = playerOnePlayedGames.docs.map(
    (doc) => doc.data().quizId
  );

  // fetch arenaGames collection from child
  if (playerTwo !== "computer") {
    const arenaGamesCollection = collection(
      db,
      `children/${playerTwo}/arenaGames`
    );
    const playedGames = await getDocs(arenaGamesCollection);
    const playerTwoQuizes = playedGames.docs.map((doc) => doc.data().quizId);
    playerOneQuizes.push(...playerTwoQuizes);
  }
  // fetch all quizes from quizzes collection which are not played by playerOne
  const quizCollection = collection(db, quizCollectionName);
  const quizes = await getDocs(quizCollection);
  const quizesData = quizes.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  const filteredQuizes = quizesData.filter(
    (quiz) => !playerOneQuizes.includes(quiz.id)
  );
  const randomQuiz = getRandomValueFromArray(filteredQuizes);
  return randomQuiz;
}

const startPvpQuizGame = async (db, challengeDocData, gameType, randomQuiz) => {

  const gameCollection = collection(db, gameType === "englishMeaningsQuiz" ? "oneOnOneEngMeaningsQuiz" : "oneOnOneLogoQuiz");

  const docRef = await addDoc(
    gameCollection,
    {
      currentActivePlayer: "playerOne",
      isGameStarted: true,
      createdAt: new Date(),
      gameStartedAt: new Date(),
      playerOne: {
        score: 0,
        id: challengeDocData.userId,
        name: challengeDocData.userName,
        percentageOfBar: 0,
      },
      playerTwo: {
        score: 0,
        id: challengeDocData.challengeeId,
        name: challengeDocData.challengeeName,
        percentageOfBar: 0,
      },
      result: [],
      winner: null,
      currentActivePlayer: "playerOne",
      activeSound: null,
      pvpGame: true,
      challengeGame: true,
      currentTimer: 3,
      // activeSound: "/Assets/Sounds/OneOnOneQuiz/gameStart.mp3",
      quizId: randomQuiz?.id,
      currentActiveQuestion: randomQuiz?.questionIds?.[0],
    },
    { merge: true }
  );

  return docRef.id;
}

const startPvpArenaMiniScrabbleGame = async (db, challengeDocData) => {
  
  const miniScrabbleCollection = collection(db, 'miniScrabble');

  const { foundWords, randomRack: letters } = getRandomLettersForGame(
    listOfWords.words
  );

  const docRef = await addDoc(miniScrabbleCollection, {
    isGameStarted: true,
    createdAt: new Date(),
    gameStartedAt: new Date(),
    letters: letters, // list of letters to show both players
    foundWords: foundWords,
    activeRound: 1,
    playerOne: {
      score: 0,
      id: challengeDocData.userId,
      name: challengeDocData.userName,
      words: [],
      moves: [],
      scorePerRound: [],
    },
    playerTwo: {
      score: 0,
      id: challengeDocData.challengeeId,
      name: challengeDocData.challengeeName,
      words: [],
      moves: [],
      scorePerRound: [],
    },
    result: [],
    winner: null,
    currentActivePlayer: "playerOne",
    currentActiveMove: 1,
    activeSound: null,
    pvpGame: true,
    challengeGame: true,
  });
  return docRef.id;
}



export const handleChallengOnlineUser = async (onlineuser,user, options = {}) => {
  const {
    showToast,
    setChallengeButtonLoading,
    setChallengeData,
    setShowGameSelectionPopup,
  } = options;

  try {
    const userLimitExceeded = await checkUserGameLimit(user?.id);
    const onlineUserLimitExceeded = await checkUserGameLimit(onlineuser.id);
    if (userLimitExceeded) {
      showToast?.("You have exceeded your daily game limit");
      setChallengeButtonLoading?.(false);
      return;
    } else if (onlineUserLimitExceeded) {
      showToast?.("Player has exceeded their daily game limit");
      setChallengeButtonLoading?.(false);
      return;
    }
    setChallengeData?.(onlineuser);
    setShowGameSelectionPopup?.(true);
    setChallengeButtonLoading?.(false);
  } catch (error) {
    console.error("Error handling challenge:", error);
  }
};
