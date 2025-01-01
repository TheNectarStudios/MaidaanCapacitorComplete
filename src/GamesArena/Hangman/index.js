import React, { useState, useEffect, useRef, useMemo } from "react";
import Board from "./Board";
import shuffle from "../Common/shuffle";
import { db } from "../../firebase-config";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  FieldPath,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import AppButton from "../../Components/Common/AppButton";
import { useAuth } from "../../providers/auth-provider";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../Components/Common/Layout";
import { Dialog } from "@mui/material";
import useToast from "../../hooks/use-toast";
import ArenaHeader from "../Common/ArenaHeader";
import AppInput from "../../Components/Common/AppInput";
import GameEndModal from "../Common/GameEndModal";
import Loader from "../../Components/PageComponents/Loader";
import GameLoader from "../../Components/PageComponents/GameLoader";
import { shareOnWhatsapp } from "../../Constants/Commons";
import BackButton from "../../Components/Common/BackButton";
import DarkModal from "../../Components/Common/DarkModal";
import Chat from "../Common/Chat";
import { twMerge } from "tailwind-merge";
import renderStreakInfo from "../Common/PlayerStreak";
import {
  AI_COMPUTER_ID,
  AI_NUMBER_OF_MOVES_TO_CHECK,
  DAILY_LIMIT,
  IndianNames,
  IndianStates,
  MATRIX,
  getRandomValueFromArray,
} from "../../Constants/GamesArena/MemoryCards";
import {
  addGameDetailsToChild,
  calculateGameCount,
  getDateOfMondayWithUnderscore,
  getGameConfig,
  getTotalGamesCountFromMondayToToday,
  handleShare,
  updateChildDetailsUpdateMethod,
  getDateOfAllDaysFromMondayToSunday,
  validateAndFormatDate,
  quitGame,
} from "../utils";
import { ARENA_ROUTE, HANGMAN_ROUTE } from "../../Constants/routes";
import axios from "axios";
import {
  findPlayer,
  startPvpGame,
  handleVisibility,
  handleGameStart,
  handleUpdateRating,
} from "../Common/MatchMaking";
import {
  getWeeklyArenaTournamentLeaderboard,
  sortDataPerRankOrPoints,
} from "../utils";
import GameHomeLayout from "../Common/GameHomeLayout";
import { HANGMAN_ALPHABETS, HANGMAN_GAME_DIFFICULTY } from "../../Constants/GamesArena/Hangman";
import { checkAndUpdateReferralCoins } from "../Common/ReferralCoins";
import mixpanel from 'mixpanel-browser';

const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");

const GameCollectionName = "hangman";

function Hangman() {
  const {
    user,
    getUserDetails,
    signInAnonymouslyWithFirebase,
    isUserLoading,
    logout,
  } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [gameTied, setGameTied] = useState(false);
  const [anonymousName, setAnonymousName] = useState("");
  const [exitGamePopup, setExitGamePopup] = useState(false);
  const [quitGamePopup, setQuitGamePopup] = useState(false);
  const [showReaction, setShowReaction] = useState(null);
  const [computerGameLoading, setComputerGameLoading] = useState(false);
  const [computerGameMessage, setComputerGameMessage] = useState("");
  const [opponentLeftPopup, setOpponentLeftPopup] = useState(false);
  const [selectNumber, setSelectNumber] = useState(0);
  const [activeList, setActiveList] = useState([]);
  const [gameQuit, setGameQuit] = useState(false);
  const [pastmoves, setPastmoves] = useState([]);
  const [oneOnOneID, setOneOnOneID] = useState(null);
  const gameType = "hangman";
  const gameId = searchParams.get("gameId");
  const [gameConfig, setGameConfig] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [gamePointsEndModal, setGamePointsEndModal] = useState({});
  const [messageDisplayed, setMessageDisplayed] = useState(false);
  const [gameWonByExit, setGameWonByExit] = useState(false);
  const [guessedLettersState, setGuessedLettersState] = useState([]);
  const [wordsList, setWordsList] = useState([]);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [docCreatedDate, setDocCreatedDate] = useState(null);

  const mondayToSundayDates = getDateOfAllDaysFromMondayToSunday();

  useEffect(() => {
    const func = async () => {
      const mondayDate = getDateOfMondayWithUnderscore();
      const config = await getGameConfig(mondayDate);
      const leaderboardData = await getWeeklyArenaTournamentLeaderboard(
        mondayDate
      );
      const sortedData = sortDataPerRankOrPoints(leaderboardData, config);
      // const myData = sortedData.find((obj) => obj.id === user?.id);
      setLeaderboardData(sortedData);

      // setMyPlayerData(myData);
      setGameConfig(config);
      setLoading(false);
    };
    setLoading(true);
    func();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameWon, gameLost, gameTied]);

  const myPlayerLeaderboardData = useMemo(() => {
    if (!leaderboardData || !user) return null;
    return leaderboardData.find((obj) => obj.id === user?.id);
  }, [leaderboardData, user]);

  const gameCountsForDates = useMemo(() => {
    if (!user) return {};
    const gameCounts = {};
    const currDate = new Date().getTime();
    mondayToSundayDates.forEach((date) => {
      const gameCount = calculateGameCount(user, date);
      // if future date then set gameCount to null
      const validatedDate = validateAndFormatDate(date);
      gameCounts[date] =
        new Date(validatedDate).getTime() > currDate ? null : gameCount;
    });
    return gameCounts;
  }, [user]);

  const getGameDetails = async () => {
    const gameCollection = collection(db, GameCollectionName);
    const gameRef = doc(gameCollection, gameId);
    const game = await getDoc(gameRef);
    if (game.exists()) {
      const data = game.data();
      setGameState(data);
    }
  };

  const fetchGameConfig = async () => {
    const mondayDate = getDateOfMondayWithUnderscore();
    const config = await getGameConfig(mondayDate);
    setGameConfig(config);
  };

  const fetchWords = async () => {
    try {
      const wordsCollection = collection(db, "hangmanWords");
      const wordsSnapshot = await getDocs(wordsCollection);
      const words = [];
      wordsSnapshot.forEach((doc) => {
        words.push(doc.data());
      });
      setWordsList(words);
    } catch (err) {
      showToast("Error fetching words", "error");
    }
  };

  const findCorrectPosition = (board) => {
    const currPlayer = gameState.currentActivePlayer;
    const previousMovePosition = gameState[currPlayer].moves[1];
    const gameBoard = JSON.parse(gameState.board);
    const previousMoveCard =
      gameBoard[previousMovePosition[0]][previousMovePosition[1]];
    const prevCardId = previousMoveCard.id;
    let i = 0;
    let j = 0;
    for (i = 0; i < 4; i++) {
      for (j = 0; j < 4; j++) {
        if (
          gameBoard[i][j].id == prevCardId &&
          !(i == previousMovePosition[0] && j == previousMovePosition[1])
        ) {
          return [i, j];
        }
      }
    }
  };

  const isUnmatchedCardPairFoundInPastMoves = (pastmoves) => {
    const board = JSON.parse(gameState.board);
    const finalPosition = pastmoves.length < 4 ? pastmoves.length : 4;
    for (let i = 0; i < finalPosition; i = i + 1) {
      for (let j = i + 1; j < finalPosition; j = j + 1) {
        if (
          pastmoves &&
          board[pastmoves[i][0]][pastmoves[i][1]].id ===
            board[pastmoves[j][0]][pastmoves[j][1]].id &&
          !(i % 2 === 0 && j % 2 === 1 && j === i + 1) &&
          !gameState.result.includes(
            board[pastmoves[i][0]][pastmoves[i][1]].id
          ) &&
          !(
            pastmoves[i][0] === pastmoves[j][0] &&
            pastmoves[i][1] === pastmoves[j][1]
          )
        ) {
          return pastmoves[i];
        }
      }
    }
    return null;
  };

  const getCurrentPosition = (currentPlayerState, gameState) => {
    const board = JSON.parse(gameState.board);
    let position;
    if (gameState.result.length < 8) {
      //for first attempt
      if (currentPlayerState?.moves[1].length === 0) {
        //if unmatched card pair found in 4 pastmoves then run with 90% probability
        position = isUnmatchedCardPairFoundInPastMoves(pastmoves);
        if (!position) {
          position = findRandomPosition(board);
        }
      }

      //for second attempt
      else {
        //get previous move of the current player.
        const previousMovePosition = currentPlayerState?.moves[1];
        const previousMoveCard =
          board[previousMovePosition[0]][previousMovePosition[1]];
        const prevCardId = previousMoveCard.id;
        //traverse through the pastmoves and find if there is any matching card for previous move.
        let index = -1;
        const finalPosition = pastmoves.length < 6 ? pastmoves.length : 6;
        for (let i = 1; i < finalPosition; i++) {
          if (board[pastmoves[i][0]][pastmoves[i][1]].id == prevCardId) {
            index = i;
            break;
          }
        }
        if (index > 0) {
          const category = Math.floor((index + 1) / 2);
          let random;
          // eslint-disable-next-line default-case
          switch (category) {
            case 1:
              random = Math.floor(Math.random() * 100) + 1;
              if (random >= 100 - 80) {
                position = findCorrectPosition(board);
              } else {
                position = findWrongPosition(board);
              }
              break;
            case 2:
              random = Math.floor(Math.random() * 100) + 1;
              if (random >= 100 - 60) {
                position = findCorrectPosition(board);
              } else {
                position = findWrongPosition(board);
              }
              break;
            case 3:
              random = Math.floor(Math.random() * 100) + 1;
              if (random >= 100 - 20) {
                position = findCorrectPosition(board);
              } else {
                position = findWrongPosition(board);
              }
              break;
          }
        } else {
          position = findRandomPosition(board);
        }
      }
    }
    return position;
  };

  const findWrongPosition = (board) => {
    const currPlayer = gameState.currentActivePlayer;
    const previousMovePosition = gameState[currPlayer].moves[1];
    const gameBoard = JSON.parse(gameState.board);
    const previousMoveCard =
      gameBoard[previousMovePosition[0]][previousMovePosition[1]];
    const prevCardId = previousMoveCard.id;
    let unmatchedCardFound = false;
    let randomPosition;
    while (!unmatchedCardFound) {
      randomPosition = findRandomPosition(board);
      if (gameState.result.length <= 6) {
        unmatchedCardFound =
          gameBoard[randomPosition[0]][randomPosition[1]].id != prevCardId;
      } else {
        unmatchedCardFound = true;
      }
    }
    return randomPosition;
  };

  const findRandomPosition = (board) => {
    // write this function recursively to find a random position
    // which is not already selected
    const boardLength = board.length;
    const position = [
      Math.floor(Math.random() * boardLength),
      Math.floor(Math.random() * boardLength),
    ];
    // if the position is already selected, find a new position
    // also check if the value at the position is not inside the result array
    if (
      !gameState.gameEndedAt &&
      (gameState?.result?.includes(board[position[0]][position[1]].id) ||
        (gameState?.[gameState?.currentActivePlayer]?.moves[1][0] ===
          position[0] &&
          gameState?.[gameState?.currentActivePlayer]?.moves[1][1] ===
            position[1]))
    ) {
      return findRandomPosition(board);
    }

    return position;
  };

  useEffect(() => {
    // add a listener to the document with the gameId
    // if the document changes, we want to update the board
    setButtonClicked(false);
    fetchGameConfig();
    fetchWords();
    if (!gameId) return;
    if (!user) {
      getGameDetails();
      return;
    }

    const gameCollection = collection(db, GameCollectionName);
    const unsubscribe = onSnapshot(
      doc(gameCollection, gameId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data?.activeSound) {
            playAudioClip(data.activeSound);
          }
          setGameState(data);
        }
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, user]);

  const gameCount = useMemo(() => {
    return calculateGameCount(user, currentDateInDDMMYYYY);
  }, [user]);

  useEffect(() => {
    const unsubscribe = handleGameStart(
      oneOnOneID,
      createGame,
      AI_COMPUTER_ID,
      startPvpConnectGame,
      user,
      setLoading,
      searchParams,
      setSearchParams,
      setComputerGameLoading,
      db,
      setComputerGameMessage,
      docCreatedDate, 
    );
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oneOnOneID]);

  //create useeffect to chceck player one

  useEffect(() => {
    // const unsubscribe = handleVisibility(
    // oneOnOneID,
    // gameState,
    // setComputerGameLoading,
    // setLoading,
    // setOneOnOneID,
    // db,
    // gameState,
    // handleQuitGame
    // );
    // return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.visibilityState, oneOnOneID, gameState]);

  const handleLogout = async () => {
    await logout();
    window.location.replace(`/login?redirect=${HANGMAN_ROUTE}`);
  };

  const handleQuitGame = async () => {

     await quitGame(
          gameId,
          user,
          HANGMAN_ROUTE,
          gameState,
          GameCollectionName,
          setExitGamePopup,
          setQuitGamePopup,
          setGameWonByExit,
          navigate,
        )
        
  };

  const checkUserGameLimit = async (gameStart = false) => {
    const childrenCollection = collection(db, "children");
    const childRef = doc(childrenCollection, user.id);
    const child = await getDoc(childRef);
    if (child.exists()) {
      const data = child.data();
      const gameCount =
        data?.arenaGames?.[GameCollectionName]?.[currentDateInDDMMYYYY] ?? 0;
      const totalGameCount = calculateGameCount(data, currentDateInDDMMYYYY);
      if (totalGameCount >= DAILY_LIMIT) {
        showToast("You have exceeded your daily game limit", "error");
        return true;
      } else if (gameStart) {
        await setDoc(
          childRef,
          {
            arenaGames: {
              [GameCollectionName]: {
                [currentDateInDDMMYYYY]: gameCount + 1,
              },
            },
          },
          { merge: true }
        );
        //update leaderbaord doc with games played as +1

        const mondayDate = getDateOfMondayWithUnderscore();
        const weeklyArenaTournamentsCollection = collection(
          db,
          "weeklyArenaTournaments"
        );
        const weeklyArenaTournamentsRef = doc(
          weeklyArenaTournamentsCollection,
          mondayDate
        );
        const leaderboardRef = collection(
          weeklyArenaTournamentsRef,
          "leaderboard"
        );
        const leaderboardChildRef = doc(leaderboardRef, user.id);
        const leaderboardChild = await getDoc(leaderboardChildRef);
        const leaderboardChildData = leaderboardChild.data();

        const dataToUpdate = {
          gamesPlayed: leaderboardChildData?.gamesPlayed
            ? leaderboardChildData?.gamesPlayed + 1
            : 1,
          pointsWon: leaderboardChildData?.pointsWon ?? 0,
          gamesWon: leaderboardChildData?.gamesWon ?? 0,
          firstName: user.firstName,
          lastName: user.lastName,
          schoolName: user.school,
          city: user.city,
        };
        await setDoc(leaderboardChildRef, dataToUpdate, { merge: true });
      }
    }
    const otherChildId = gameState?.[otherPlayerId]?.id;
    if (otherChildId) {
      const otherChildRef = doc(childrenCollection, otherChildId);
      const otherChild = await getDoc(otherChildRef);
      if (otherChild.exists()) {
        const otherChildData = otherChild.data();
        const otherChildGameCount =
          otherChildData?.arenaGames?.[GameCollectionName]?.[currentDateInDDMMYYYY] ?? 0;
        const totalGameCount = calculateGameCount(
          otherChildData,
          currentDateInDDMMYYYY
        );
        if (totalGameCount >= DAILY_LIMIT) {
          showToast(
            `${gameState?.[otherPlayerId]?.name} has exceeded their daily game limit`,
            "error"
          );
          return true;
        } else if (gameStart) {
          await setDoc(
            otherChildRef,
            {
              arenaGames: {
                [GameCollectionName]: {
                  [currentDateInDDMMYYYY]: otherChildGameCount + 1,
                },
              },
            },
            { merge: true }
          );
          const mondayDate = getDateOfMondayWithUnderscore();
          const weeklyArenaTournamentsCollection = collection(
            db,
            "weeklyArenaTournaments"
          );
          const weeklyArenaTournamentsRef = doc(
            weeklyArenaTournamentsCollection,
            mondayDate
          );
          const leaderboardRef = collection(
            weeklyArenaTournamentsRef,
            "leaderboard"
          );
          const leaderboardChildRef = doc(leaderboardRef, otherChildId);
          const leaderboardChild = await getDoc(leaderboardChildRef);
          const leaderboardChildData = leaderboardChild.data();
          const dataToUpdate = {
            gamesPlayed: leaderboardChildData?.gamesPlayed
              ? leaderboardChildData?.gamesPlayed + 1
              : 1,
            pointsWon: leaderboardChildData?.pointsWon ?? 0,
            gamesWon: leaderboardChildData?.gamesWon ?? 0,
            firstName: otherChildData.firstName,
            lastName: otherChildData.lastName,
            schoolName: otherChildData.school,
            city: otherChildData.city,
          };
          await setDoc(leaderboardChildRef, dataToUpdate, { merge: true });
        }
      }
    }
    return false;
  };

  const resetStateVariables = () => {
    setGameWon(false);
    setGameLost(false);
    setGameTied(false);
    setPastmoves([]);
    setGameQuit(false);
    setGamePointsEndModal({});
    setGameState(null);
    setShowAnswer(false);
  };

  const handleFindPlayer = async () => {
    setButtonLoading(true);
    setExitGamePopup(false);
    setQuitGamePopup(false);
    resetStateVariables();

    const bool = await checkUserGameLimit();
    if (bool) {
      return;
    }
    setComputerGameLoading(true);
    findPlayer(
      user,
      gameType,
      setOneOnOneID,
      searchParams,
      setSearchParams,
      db,
      setComputerGameLoading,
      setLoading,
      setComputerGameMessage,
      checkUserGameLimit,
      setDocCreatedDate,
    );
    setButtonLoading(false);
  };

  const handleButtonClick = (action) => {
    if (!buttonClicked) {
      setButtonClicked(true);
      if (action === 'yes') {
        startGame();
      } else if (action === 'no') {
        declineGame();
      }
    }
  };

  const findDifficulty = async(userId) => {
    let newdifficultyLevel = "EASY";
    //fetch the previous game played by this user, and get the difficulty level and winner for that game
    const previousGameCollection = collection(db, GameCollectionName);
    const previousGameQuery = query(
      previousGameCollection,
      where("playerOne.id", "==", userId),
      where("isComputerGame", "==", true),
      orderBy("gameEndedAt", "desc"),
      limit(1)
    );

    const previousGameSnapshot = await getDocs(previousGameQuery);
    const previousGame = previousGameSnapshot.docs[0]?.data();
    const previousGameDifficultyLevel = previousGame?.difficulty;
    const previousGameWinner = previousGame?.winner;
    if (previousGameDifficultyLevel && previousGameWinner) {
      if (previousGameWinner === "playerOne") {
        if(previousGameDifficultyLevel === "HARD"){
          newdifficultyLevel = "HARD"
        }
        else if(previousGameDifficultyLevel === "MEDIUM"){
          newdifficultyLevel = "HARD"
        }
        else{
          newdifficultyLevel = "MEDIUM"
        }
      } else if (previousGameWinner === "playerTwo") {
        if(previousGameDifficultyLevel === "HARD"){
          newdifficultyLevel = "MEDIUM";
        }
        else {
          newdifficultyLevel = "EASY";
        }
      } else {
        newdifficultyLevel = previousGameDifficultyLevel;
      }
    } else {
      // if no previous game is played then set difficulty level to easy
      newdifficultyLevel = "EASY";
    }

    return newdifficultyLevel;
  }

  const getQuizWithBot = async(wordDifficulty) => {
    let wordDifficultyInteger; 
    if(wordDifficulty === "EASY")wordDifficultyInteger = 1;
    else wordDifficultyInteger = 2;

    const playerOneArenaGamesCollection = collection(
      db,
      `children/${user?.id}/arenaGames`
    );
    const playerOnePlayedGames = await getDocs(playerOneArenaGamesCollection);
    const playerOneQuizes = playerOnePlayedGames.docs.map(
      (doc) => doc.data().wordId
    );
    // fetch arenaGames collection from child
    // fetch all quizes from quizzes collection which are not played by playerOne
    const quizCollection = collection(db, 'hangmanWords');
    const quizes = await getDocs(quizCollection);
    const quizesData = quizes.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    const filteredQuizes = quizesData.filter(
      (word) => !playerOneQuizes.includes(word.id)
    );
    const requiredQuizzes = quizesData.filter(
      (word) => !playerOneQuizes.includes(word.id) && word.difficulty === wordDifficultyInteger
    );
    const randomQuiz = getRandomValueFromArray(requiredQuizzes);
    return randomQuiz;
  }

  const getQuizNotPlayedByBothPlayers = async (playerOne, playerTwo) => {
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
    if (user?.createdAt && playerTwo !== AI_COMPUTER_ID) {
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
  const createGame = async (player = "playerOne", reset = false) => {
    if (!user || (user && !user.createdAt && !reset)) {
      window.location.replace(`/login?redirect=${HANGMAN_ROUTE}`);
      return;
    }

    const isGameLimitExceeded = await checkUserGameLimit(player === "computer");
    if (isGameLimitExceeded) {
      return;
    }

    setLoading(true);
    setGameWon(false);
    setGameLost(false);
    setGameTied(false);
    setPastmoves([]);
    setShowAnswer(false);
    const gameCollection = collection(db, GameCollectionName);

    if (player === "computer") {
      setComputerGameLoading(true);
      const randomName = getRandomValueFromArray(IndianNames);
      const randomState = getRandomValueFromArray(IndianStates);
      const difficulty = await findDifficulty(user.id);
      let wordDifficulty;
      if (difficulty === "MEDIUM") {
        wordDifficulty = Math.random() < 0.5 ? "EASY" : "HARD";
      }
      else if(difficulty === "EASY"){
        wordDifficulty = "EASY";
      } 
      else{
        wordDifficulty = "HARD";
      }

      let randomWord = await getQuizWithBot(wordDifficulty);
      const docRef = await addDoc(gameCollection, {
        keyboard: JSON.stringify(HANGMAN_ALPHABETS),
        word: randomWord.word,
        hint: randomWord.hint,
        mistakes: 0,
        guessedLetters: [],
        createdAt: new Date(),
        playerOne: {
          score: 0,
          id: user.id,
          // moves: { 1: [], 2: [] },
          name: user.firstName,
        },
        playerTwo: {
          score: 0,
          id: AI_COMPUTER_ID,
          // moves: { 1: [], 2: [] },
          name: randomName,
        },
        result: [],
        winner: null,
        currentActivePlayer: "playerOne",
        currentActiveMove: 1,
        activeSound: "/Assets/Sounds/MemoryCards/gameStart.mp3",
        isComputerGame: true,
        isGameStarted: true,
        gameStartedAt: new Date(),
        wordId : randomWord.id,
        difficulty : wordDifficulty,
        difficulty : difficulty,
      });
      if (reset) {
        const gameRef = doc(gameCollection, gameId);
        await setDoc(
          gameRef,
          {
            ...gameState,
            rematchGameId: docRef.id,
            rematchStartedBy: user.id,
            activeSound: null,
          },
          { merge: true }
        );
      }
      setSearchParams({ ...searchParams, gameId: docRef.id });
      setLoading(false);
      setTimeout(() => {
        setComputerGameLoading(false);
        setComputerGameMessage(
          `You are playing against ${randomName} from ${randomState}`
        );
      }, 3000);
      setTimeout(() => {
        setComputerGameMessage("");
      }, 5000);
      return;
    }

    if (
      (player === "playerOne" && !gameId) ||
      (gameId && gameState?.rematchDeclined) ||
      reset
    ) {
      let nameOfPlayer = user.firstName;
      if (reset && !nameOfPlayer) {
        nameOfPlayer = gameState?.[myPlayerId]?.name;
      }
      const docRef = await addDoc(gameCollection, {
        keyboard: JSON.stringify(HANGMAN_ALPHABETS),
        // word: randomWord.word,
        // hint: randomWord.hint,
        mistakes: 0,
        guessedLetters: [],
        createdAt: new Date(),
        playerOne: {
          score: 0,
          id: user.id,
          name: nameOfPlayer,
        },
        playerTwo: {
          score: 0,
          id: "",
          name: "",
        },
        result: [],
        winner: null,
        // wordId : randomWord.id,
        currentActivePlayer: "playerOne",
        currentActiveMove: 1,
        activeSound: null,
        ...(reset && !gameState.pvpGame && gameState?.chatId
          ? { chatId: gameState?.chatId }
          : {}),
        ...(reset && gameState.pvpGame ? { pvpGame: true } : {}),
        ...(reset && (gameState?.pvpGame || gameState?.inviteGame || gameState?.isRematch) ? { isRematch: true } : {})
      });
      if (reset) {
        const gameRef = doc(gameCollection, gameId);
        setDoc(
          gameRef,
          {
            ...gameState,
            rematchGameId: docRef.id,
            rematchStartedBy: user.id,
            activeSound: null,
          },
          { merge: true }
        );
      } else {
        setSearchParams({ ...searchParams, gameId: docRef.id });
      }
      setLoading(false);
      return;
    }
    if (player === "playerTwo") {
      const gameRef = doc(gameCollection, gameId);
      const game = await getDoc(gameRef);
      if (game.exists()) {
        const data = game.data();
        await setDoc(doc(gameCollection, gameId), {
          ...data,
          playerTwo: {
            score: 0,
            id: user.id,
            // moves: { 1: [], 2: [] },
            name: user.firstName,
          },
        });
      }
      setLoading(false);
      return;
    }
  };

  const startPvpConnectGame = async (user,playerTwo,gameId,oneOnOneID,setLoading,searchParams,setSearchParams,setComputerGameLoading,db) => {
    const gameCollection = collection(db, GameCollectionName);
    const gameRef = doc(gameCollection, gameId); 
      const childCollection = collection(db, 'children');
      const playerTwoRef = doc(childCollection, playerTwo);
      const playerTwoDoc = await getDoc(playerTwoRef);
      const playerTwoData = playerTwoDoc.data();
      const playerTwoName = playerTwoData?.firstName;
      const randomWord = await getQuizNotPlayedByBothPlayers(user?.id,playerTwo);
       await setDoc(gameRef, {
         keyboard: JSON.stringify(HANGMAN_ALPHABETS),
         word: randomWord.word,
         hint: randomWord.hint,
         wordId : randomWord.id,
         mistakes: 0,
         guessedLetters: [],
         isGameStarted: true,
         createdAt: new Date(),
         gameStartedAt: new Date(),
         playerOne: {
           score: 0,
           id: user.id,
           // moves: { 1: [], 2: [] },
           name: user.firstName,
         },
         playerTwo: { score: 0, id: playerTwo, name: playerTwoName },
         result: [],
         winner: null,
         currentActivePlayer: "playerOne",
         currentActiveMove: 1,
         activeSound: null,
         pvpGame: true,
       });
    const openMatchesCollection = collection(db, 'openMatches');
    const openMatchRef = doc(openMatchesCollection, oneOnOneID);
    await setDoc(openMatchRef, {
      gameStarted: true,
    }, { merge: true });
    setSearchParams({ ...searchParams, gameId: gameRef.id });
    setComputerGameLoading(true);
  }

  const startGame = async () => {
    setShowAnswer(false);
    const trimmedName = anonymousName?.trim();
    if (!user.firstName && !trimmedName) {
      showToast("Please enter a valid name", "error");
      return;
    }
    const isGameLimitExceeded = await checkUserGameLimit(true);
    if (isGameLimitExceeded) {
      return;
    }
    setLoading(true);
    const finalGameId = gameState?.rematchGameId || gameId;
    const rematchAccepted = gameState?.rematchGameId && gameState?.winner;
    if (gameState?.rematchGameId && gameState?.winner) {
      setSearchParams({ ...searchParams, gameId: gameState?.rematchGameId });
    }
    const gameCollection = collection(db, GameCollectionName);
    const gameRef = doc(gameCollection, finalGameId);
    const ogGameRef = doc(gameCollection, gameId);

    if (rematchAccepted) {
      setDoc(
        ogGameRef,
        {
          ...gameState,
          rematchAccepted,
        },
        { merge: true }
      );
    }

    // get gameRef data
    const game = await getDoc(gameRef);
    if (game.exists()) {
      const data = game.data();
      // add a new document to the chats collection
      const chatsCollection = collection(db, "chats");
      const chatRef = doc(chatsCollection);
      const chatId = chatRef.id;
      if (!gameState?.pvpGame) {
        await setDoc(chatRef, {
          messages: [],
          createdAt: new Date(),
          members: [user.id, data.playerOne.id],
          status: "active",
        });
      }
      
      let randomWord = await getQuizNotPlayedByBothPlayers(gameState?.playerOne?.id, user?.id);

      await setDoc(
        gameRef,
        {
          ...data,
          currentActivePlayer: "playerOne",
          isGameStarted: true,
          gameStartedAt: new Date(),
          playerTwo: {
            score: 0,
            id: user.id,
            name:
              user.firstName ??
              trimmedName ??
              gameState?.playerTwo?.name ??
              "Anonymous",
          },
          activeSound: "/Assets/Sounds/MemoryCards/gameStart.mp3",
          ...(!gameState?.pvpGame ? { chatId } : {}),
          ...(!gameState?.rematchGameId ? { inviteGame: true } : {}),
          wordId : randomWord.id,
          word: randomWord.word,
          hint: randomWord.hint,
        },
        { merge: true }
      );
    }
    setLoading(false);
  };

  const declineGame = async () => {
    const gameCollection = collection(db, GameCollectionName);
    const gameRef = doc(gameCollection, gameId);
    const game = await getDoc(gameRef);
    if (game.exists()) {
      const data = game.data();
      setDoc(
        gameRef,
        {
          ...data,
          ...(gameState?.rematchGameId
            ? { rematchDeclined: true }
            : { invitationDeclined: true }),
          activeSound: null,
        },
        { merge: true }
      );
    }
    setTimeout(() => {
      if (!user.createdAt) {
        handleLogout();
      } else {
        navigate(HANGMAN_ROUTE);
      }
    }, 1000);
  };

  const checkGameState = async () => {
    if (gameState.rematchGameId && gameState.winner) {
      setGameLost(false);
      setGameWon(false);
      setGameTied(false);
      //update the elo scores.
      if (gameState.rematchAccepted) {
        setSearchParams({ ...searchParams, gameId: gameState?.rematchGameId });
      }
      return;
    }
    const playerOneOrTwo = gameState?.playerOne.id === user?.id ? "playerOne" : "playerTwo"
    const currentPlayer =gameState?.[playerOneOrTwo];
    if (
      (gameState.gameEndedAt && gameState.winner && !currentPlayer?.pointsAwarded) ||
      (gameState.gameExited !== user?.id && gameState.gameWonByExit && !currentPlayer?.pointsAwarded)
    ) {
      let winner = gameState.winner;
      let isTied = gameState.winner === "Tied";
      let currentActivePlayer = gameState.currentActivePlayer;
      let otherPlayer = gameState.currActivePlayer === "playerOne" ? "playerTwo" : "playerOne";
      let stateToUpdate = {};
      const hangmanCollection = collection(db, "hangman");
      const gameRef = doc(hangmanCollection, gameId);
    
        
        if(playerOneOrTwo ==="playerOne"){
         stateToUpdate = {
          playerOne :{
            "pointsAwarded" :true,
          }
        }
      }else{
          stateToUpdate = {
            playerTwo : {
              "pointsAwarded" :true,
            }
        }
      };
      await setDoc(gameRef, stateToUpdate, { merge: true });
      
      // fetch user again to get updated values
      const childrenCollection = collection(db, "children");
      const childRef = doc(childrenCollection, user.id);
      const child = await getDoc(childRef);
      const userData = child.data();
      if (userData?.createdAt) {
        const pointsMap = gameConfig?.pointsMap;
        let playedPoints = pointsMap?.played?.friend;
        let wonPoints = pointsMap?.won?.friend;
        if (gameState?.isComputerGame || gameState?.pvpGame) {
          playedPoints = pointsMap?.played?.random;
          wonPoints = pointsMap?.won?.random;
        }
        if (winner !== myPlayerId || gameState.mistakes === 7) {
          wonPoints = 0;
        }
        // caculate discipline points
        const { totalGamesCount, streak } =
          getTotalGamesCountFromMondayToToday(userData);
        let disciplinePoints = 0;
        const todaysGameCount = calculateGameCount(
          userData,
          currentDateInDDMMYYYY
        );

        const currentDate = new Date();
        const currentDayOfWeek =
          currentDate.getDay() === 0 ? 7 : currentDate.getDay();

        if (todaysGameCount === DAILY_LIMIT) {
          disciplinePoints += gameConfig?.allPlayedStreakPointsMap?.[1] ?? 0;
        }
        if (
          totalGamesCount / DAILY_LIMIT === currentDayOfWeek &&
          currentDayOfWeek !== 1
        ) {
          disciplinePoints +=
            gameConfig?.allPlayedStreakPointsMap?.[currentDayOfWeek] ?? 0;
        }
        if (todaysGameCount === 1) {
          disciplinePoints += gameConfig?.anyStreakPointsMap?.[streak] ?? 0;
        }

        const arenaPoints =
          (userData?.arenaPoints ?? 0) +
          playedPoints +
          wonPoints +
          disciplinePoints;
        const gamePoints = {
          played:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]?.played ??
              0) + playedPoints,
          won:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]?.won ?? 0) +
            wonPoints,
          discipline:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]
              ?.discipline ?? 0) + disciplinePoints,
          total:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]?.total ??
              0) +
            playedPoints +
            wonPoints +
            disciplinePoints,
        };
        const currentGamePoints = {
          played: playedPoints,
          won: wonPoints,
          discipline: disciplinePoints,
          total: playedPoints + wonPoints + disciplinePoints,
        };

        const dataToUpdate = [
          new FieldPath("arenaPoints"),
          arenaPoints,
          new FieldPath("arenaGames", "points", currentDateInDDMMYYYY),
          gamePoints,
        ];
        const isChildDetailUpdated = await updateChildDetailsUpdateMethod(
          user.id,
          dataToUpdate
        );
        if (isChildDetailUpdated) {
          const pointsData = {
            [myPlayerId]: {
              ...gameState?.[myPlayerId],
              points: {
                played: playedPoints,
                won: wonPoints,
                discipline: disciplinePoints,
                total: playedPoints + wonPoints + disciplinePoints,
              },
            },
          };
          await checkAndUpdateReferralCoins(user?.id, user?.referredBy, user?.walletId, user?.referralBonusCredited);
          await addGameDetailsToChild(user.id, gameId, {
            ...gameState,
            ...stateToUpdate,
            ...pointsData,
          });
          // add document to weeklyArenaTournaments/{mondayDate}/leaderboard/{childId}
          const mondayDate = getDateOfMondayWithUnderscore();
          const weeklyArenaTournamentsCollection = collection(
            db,
            "weeklyArenaTournaments"
          );
          const weeklyArenaTournamentsRef = doc(
            weeklyArenaTournamentsCollection,
            mondayDate
          );
          const leaderboardRef = collection(
            weeklyArenaTournamentsRef,
            "leaderboard"
          );
          const leaderboardChildRef = doc(leaderboardRef, user.id);
          const leaderboardChild = await getDoc(leaderboardChildRef);
          const leaderboardChildData = leaderboardChild.data();

          //get new date in ist
          const date = new Date();
          const dataToUpdate = {
            firstName: user.firstName,
            lastName: user.lastName,
            schoolName: user.school,
            city: user.city,
            gamesPlayed: totalGamesCount,
            gamesWon:
              (leaderboardChildData?.gamesWon ?? 0) +
              (winner === myPlayerId ? 1 : 0),
            pointsWon:
              (leaderboardChildData?.pointsWon ?? 0) +
              playedPoints +
              wonPoints +
              disciplinePoints,
            specialAwards: [],
            lastGamePlayedAt: date,
          };
          setGamePointsEndModal({
            ...currentGamePoints,
            weeklyPointsWon: leaderboardChildData?.pointsWon,
          });
          await setDoc(leaderboardChildRef, dataToUpdate, { merge: true });
        }
      }
       await handleUpdateRating(
         winner,
         currentActivePlayer,
         gameType,
         gameState,
         otherPlayer
       );
       if(isTied){
          setShowAnswer(true);
        }
       setTimeout(() => {
         if (isTied) {
           setGameTied(true);
         } else {
           if (winner === myPlayerId) {
             setGameWon(true);
           } else {
             setGameLost(true);
           }
         }
       }, 5000);
    }
  };

  const resetGame = async () => {
    const bool = await checkUserGameLimit();
    if( bool) {
      return;
    }
    if (gameState?.isComputerGame) {
      createGame(AI_COMPUTER_ID, true);
    } else {
      createGame("playerOne", true);
    }
  };

  const getLeaderboardAndUpdatedGameCounts = async (userID) => {
    const mondayDate = getDateOfMondayWithUnderscore();
    const collectionRef = collection(
      db,
      "weeklyArenaTournaments/" + mondayDate + "/leaderboard"
    );
    //get  userid doc
    const docRef = doc(collectionRef, userID);
    const docSnap = await getDoc(docRef);
    let newGamesPlayed = 0;
    if (docSnap.exists()) {
      const data = docSnap.data();
      newGamesPlayed = data?.gamesPlayed ? data?.gamesPlayed - 1 : 0;
    }
    //update the doc
    setDoc(
      docRef,
      {
        gamesPlayed: newGamesPlayed,
        testField: true,
      },
      { merge: true }
    );
  };

  const getChildAndUpdateGameCount = async (userID) => {
    const collectionRef = collection(db, "children");
    //get  userid doc
    const docRef = doc(collectionRef, userID);
    const docSnap = await getDoc(docRef);
    let gamesPlayed = 0;
    if (docSnap.exists()) {
      const data = docSnap.data();
      gamesPlayed = data?.arenaGames?.[GameCollectionName]?.[currentDateInDDMMYYYY] ?? 1;
    }
    //update the doc
    setDoc(
      docRef,
      {
        arenaGames: {
          [GameCollectionName]: {
            [currentDateInDDMMYYYY]: gamesPlayed - 1,
          },
        },
      },
      { merge: true }
    );
  };

  const playAudioClip = (clip) => {
    const audioElRef = new Audio(clip); // Create a new Audio element
    audioElRef.play();
  };

  const checkForWin = (word, mistakes, guessedLetters, score, currPlayer) => {
    let isWon = false;
    let isTie = false;
    let isLost = false;
    const otherPlayerData = currPlayer === "playerOne" ? gameState?.playerTwo : gameState?.playerOne;
    const wordArray = word.split("");
    const isWordCompleted = wordArray.every((letter) =>
      guessedLetters.includes(letter)
    );

    if(mistakes === 7){
      isTie = true;
    }
    else if (isWordCompleted) {
      if (score > otherPlayerData.score) {
        isWon = true;
      } else if (score === otherPlayerData.score) {
        isTie = true;
      } else {
        isLost = true;
      }
    }

    let winner;
    if(score > otherPlayerData.score){
      winner = currPlayer
    }
    else if(score < otherPlayerData.score){
      winner = (currPlayer === "playerOne")?"playerTwo" : "playerOne";
    }
    return { isWon, isTie, isLost, winner};
  };

  const makeMove = async (input, row) => {
    const {
      keyboard: keyboardState,
      mistakes,
      guessedLetters,
      word,
      currentActivePlayer: currPlayer,
    } = gameState;
    const keyboard = JSON.parse(keyboardState);
    const keyFromStateIndex = keyboard[row].findIndex(
      (row) => row.key === input
    );
    const newKeyboardState = [...keyboard];
    newKeyboardState[row][keyFromStateIndex].disabled = true;
    let newMistakes = mistakes;
    let newGuessedLetters = guessedLetters;
    let newScore = gameState[currPlayer].score;
    let newLetters = gameState[currPlayer].letters ?? [];

    if (!guessedLetters.includes(input)) {
      newGuessedLetters = [...guessedLetters, input];
      setGuessedLettersState(newGuessedLetters);
      let letterCount = 0;
      word.split("").forEach((w) => {
        if (w === input) {
          letterCount += 1;
        }
      })
      if (letterCount) {
         newScore += letterCount;
         newLetters = [...newLetters, { key: input, correct: true }];
      } else {
       newMistakes = mistakes + 1;
        newLetters = [...newLetters, { key: input, correct: false }];
      }
    }
    const gameCollection = collection(db, GameCollectionName);
    const gameRef = doc(gameCollection, gameId);

    const numberOfMoves = (gameState[currPlayer].numberOfMoves ?? 0) + 1;

    let stateToUpdate = {
      keyboard: JSON.stringify(newKeyboardState),
      [currPlayer]: {
        ...gameState[currPlayer],
        numberOfMoves,
        score: newScore,
        letters: newLetters,
      },
      mistakes: newMistakes,
      guessedLetters: newGuessedLetters,
    };
    const checkWinner = checkForWin(word, newMistakes, newGuessedLetters, newScore, currPlayer);
    const gameEndState = {
      gameEndedAt: new Date(),
      activeSound: "/Assets/Sounds/MemoryCards/correct.mp3",
    };
    if (checkWinner.isWon) {
      stateToUpdate = {
        ...stateToUpdate,
        ...gameEndState,
        winner: checkWinner.winner,
      };
    } else if (checkWinner.isTie) {
      stateToUpdate = {
        ...stateToUpdate,
        ...gameEndState,
        winner: "Tied",
      };
    } else if (checkWinner.isLost) {
      stateToUpdate = {
        ...stateToUpdate,
        ...gameEndState,
        winner: checkWinner.winner,
        activeSound: "/Assets/Sounds/MemoryCards/wrong.mp3",
      };
    } else {
      stateToUpdate = {
        ...stateToUpdate,
        currentActivePlayer: currPlayer === "playerOne" ? "playerTwo" : "playerOne",
        activeSound: "/Assets/Sounds/MemoryCards/singleMove.mp3",
      };
    }
    setDoc(gameRef, stateToUpdate, { merge: true });
  };

  async function getComputerGameMessage() {
    const playerTwoId = gameState?.playerTwo?.id;

    const ref = doc(db, "children", playerTwoId);
    const docSnap = await getDoc(ref);
    const playerTwoData = docSnap.data();
    const playerTwoName = playerTwoData?.firstName ?? "Anonymous";
    const playerTwoCity = playerTwoData?.city ?? "India";
    return { playerTwoName, playerTwoCity };
  }
   async function fetchPlayerData() {
     try {
       const { playerTwoName, playerTwoCity } = await getComputerGameMessage();
       if (playerTwoName !== "Anonymous") {
         setTimeout(() => {
           setComputerGameLoading(false);
           setComputerGameMessage(
             `You are playing against ${playerTwoName} from ${playerTwoCity}`
           );
         }, 3000);

         setTimeout(() => {
           setComputerGameMessage("");
         }, 5000);
       }
     } catch (error) {
       console.error("Error fetching player data:", error);
       // Handle the error appropriately
     }
   }
  
  function calculatePercentage(numberOfGuessedWords, difficulty) {
    const basePercentage = difficulty.basePercentage; 
    const increaseFactor = difficulty.increaseFactor; 
  
    const adjustedPercentage = basePercentage + increaseFactor * numberOfGuessedWords;
  
    const finalPercentage = Math.min(adjustedPercentage, 100);
  
    return finalPercentage;
  }

  useEffect(() => {
    if (gameState) {
      checkGameState();
      const currPlayer = gameState.currentActivePlayer;
      // const currentPlayerState = gameState?.[currPlayer];
      // const movesArray = Object.values(currentPlayerState?.moves);
      if (
        gameState.isComputerGame &&
        currPlayer === "playerTwo" &&
        !gameState.gameEndedAt
      ) {
        setTimeout(() => {

          const keyboard = JSON.parse(gameState.keyboard);
          let randomLetter = '';

          if(gameState.guessedLetters.length < 4){
            const vowels = ['a', 'e', 'i', 'o', 'u'];

            const remainingVowels = vowels.filter((vowel) => !gameState.guessedLetters.includes(vowel));
            if (remainingVowels.length > 0) {
              randomLetter = getRandomValueFromArray(remainingVowels);
            }
          }
          else{ 
            let botDifficulty;

            if(gameState.difficulty === "EASY" && gameState.wordDifficulty === "EASY"){
              botDifficulty = "EASY";
            }
            else if(gameState.difficulty === "HARD"){
              botDifficulty = "HARD";
            }
            else{
              botDifficulty = (gameState.wordDifficulty === "EASY")?"HARD" : "EASY";
            }
            const correctGuessPercentage = calculatePercentage(gameState.guessedLetters.length,HANGMAN_GAME_DIFFICULTY[botDifficulty]);

            const rand = Math.random();
            const scaledNumber = rand * 100;
            const randomNumber = Math.round(scaledNumber);

            if(randomNumber <= correctGuessPercentage){
              //play correct move
              
              const word = gameState.word;
              const wordArray = word.split("");
              randomLetter = getRandomValueFromArray(
                wordArray.filter((l) => !guessedLettersState.includes(l))
              );
            }
            else {
              //play wrong move
              
              const flatKeyboard = keyboard.flat();
              const activeLetters = flatKeyboard.filter((key) => !key.disabled)
                                                .map((key) => key.key);
            
              const unusedLetters = activeLetters.filter(
                (letter) => !gameState.word.includes(letter)
              );
            
              randomLetter = unusedLetters.length > 0
                ? getRandomValueFromArray(unusedLetters)
                : null;
            }
          }
          // find row index of the random letter

          let rowIndex = 0;
          keyboard.forEach((row, index) => {
            const keyIndexInRow = row.findIndex((k) => k.key === randomLetter);
            if (keyIndexInRow > -1) {
              rowIndex = index;
            }
          });
          makeMove(randomLetter, rowIndex);
        }, 2000);
      }
      if (
        gameState?.gameExited &&
        gameState?.gameExited !== user.id &&
        !gameState?.winner
      ) {
        getChildAndUpdateGameCount(user?.id);
        getLeaderboardAndUpdatedGameCounts(user?.id);
        setQuitGamePopup(true);
        //show a popup that the other player has exited the game with two options to go back or find another player.
      } else if (
        (gameState?.gameExited && gameState?.gameExited !== user.id) ||
        (gameState?.isComputerGame && gameState?.gameEndedAt && !opponentLeftPopup && gameState?.gameExited !== user.id)
      ) {
        let timeout = gameState.isComputerGame ? 5000 : 0;
        setTimeout(() => {
          setOpponentLeftPopup(true);
        }, timeout);
        setTimeout(() => {
          setOpponentLeftPopup(false);
        }, 4000 + timeout);
        setExitGamePopup(false);
      }

      if (
        gameState?.createdAt &&
        !gameState?.winner &&
        !gameState?.gameExited &&
        gameState?.playerOne?.id === user?.id &&
        !gameState?.isComputerGame &&
        gameState?.playerTwo?.id &&
        !gameState?.playerTwo?.numberOfMoves &&
        !gameState?.playerOne?.numberOfMoves &&
        !messageDisplayed &&
        !gameState?.isRematch &&
        !gameState?.inviteGame
      ) {
        setMessageDisplayed(true);
        checkUserGameLimit(true);
        setLoading(false);
        fetchPlayerData();
      }
    }

  }, [gameState]);

  const handleClick = (input, row) => {
    const currActivePlayer = gameState?.[gameState.currentActivePlayer];
    if (
      currActivePlayer.id === AI_COMPUTER_ID ||
      currActivePlayer.id !== user.id
    ) {
      return;
    }
    makeMove(input, row);
  };

  const myPlayerId = useMemo(() => {
    if (gameState?.isComputerGame) {
      return "playerOne";
    }
    return gameState?.playerOne?.id === user?.id ? "playerOne" : "playerTwo";
  }, [gameState?.isComputerGame, gameState?.playerOne?.id, user?.id]);

  const otherPlayerId = useMemo(() => {
    if (gameState?.isComputerGame) {
      return "playerTwo";
    }
    return myPlayerId === "playerOne" ? "playerTwo" : "playerOne";
  }, [gameState?.isComputerGame, myPlayerId]);

  const loginToMaidaan = () => {
    window.location.replace(
      `/login?redirect=${HANGMAN_ROUTE}?gameId=${gameId}`
    );
  };

  const signInAnonymously = async () => {
    await signInAnonymouslyWithFirebase();
  };

  const renderAnonymousLoginScreen = () => {
    return (
      <div className="flex flex-col w-full justify-center items-center h-full">
        <p>You have been invited by {gameState?.playerOne?.name} to play.</p>
        <AppButton onClick={loginToMaidaan} className="mb-3 w-48">
          Login to Maidaan
        </AppButton>
        <AppButton onClick={signInAnonymously} className="w-48 mb-4">
          Play as Guest
        </AppButton>
        {renderRules()}
      </div>
    );
  };

  const renderCorrectScreenForPlayer = () => {
    if (gameId) {
      const gameLink = `${window.location.protocol}//${window.location.host}${HANGMAN_ROUTE}?gameId=${gameId}`;
      if (
        gameState?.rematchGameId &&
        gameState?.rematchStartedBy !== user?.id
      ) {
        return renderRematchScreen();
      }
      if (!gameState?.playerTwo?.id && gameState?.playerOne?.id !== user?.id) {
        return renderPlayerTwoInviteScreen();
      }
      return (
        <>
          {gameState?.rematchGameId &&
          gameState?.rematchStartedBy === user?.id ? (
            <div className="h-full flex justify-center items-center flex-col">
              {gameState?.rematchDeclined ? (
                <>
                  {gameState?.[otherPlayerId].name} doesn't want to play again.{" "}
                  <AppButton
                    onClick={() => createGame("playerOne")}
                    className="h-12 px-9 mt-4"
                  >
                    Challenge Another friend
                  </AppButton>
                </>
              ) : (
                <>Waiting for {gameState?.[otherPlayerId].name} to accept...</>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-full text-center text-white text-2xl">
                Challenge a Friend
              </div>
              <div className="text-center mt-8 mb-4">
                Share this link with the
                <br />
                friend you want to play with
                <br />
                <br />
                <br />
                Game will automatically start
                <br />
                once they join
              </div>
              <div className="border border-solid border-primary-yellow rounded-lg p-4 max-w-[280px] bg-[#ffffff17] mb-4">
                <div className="truncate">{gameLink}</div>
              </div>
              <AppButton
                onClick={() => {
                  showToast("Link copied to clipboard", "success");
                  const bodyText = `Hey Hey! ${gameState?.playerOne?.name} has challenged you to a game of Hangman on Maidaan. Tap the link and Game On!\n\n${gameLink}`;
                  handleShare(bodyText);
                }}
                className="h-12 px-9"
              >
                Copy link & Share
              </AppButton>
            </div>
          )}
        </>
      );
    }
    return (
      <div className="flex flex-col gap-12 items-center">
        <div className="text-2xl">
          Games Left Today:{" "}
          <span className="text-primary-yellow">{DAILY_LIMIT - gameCount}</span>
        </div>
        <div className="flex flex-col items-center gap-4">
          <AppButton
            onClick={() => createGame("playerOne")}
            className="h-12 px-9 w-48"
            isLoading={loading}
          >
            Challenge a friend
          </AppButton>
          <AppButton
            onClick={() => !buttonLoading && handleFindPlayer()}
            className="h-12 px-9 w-48"
            isLoading={buttonLoading}
          >
            Find a player
          </AppButton>
        </div>
        {renderRules()}
      </div>
    );
  };
  
  const renderRules = () => {
    return (
      <div className="bg-primary-gradient-reverse p-3 rounded-lg flex flex-col w-full border border-solid border-primary-yellow max-w-xs">
        <div className="text-center">How To Play</div>
        <div className="text-primary-yellow my-4 text-center">
          2 Players | Turn by Turn
        </div>
        <div>
          <ul className="py-0 px-6">
            <li>Pick a letter to fill the blanks</li>
            <li>Use hints to complete the word</li>
            <li>Save the man from hanging</li>
            <li>Player filling most blanks - wins!</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderRightWrongLetterIcon = (letter) => {
    return (
      <div className="grid grid-cols-2 text-white items-center uppercase gap-2 font-bold">
        <div className="pt-[2px]">{letter.key}</div>
        <div className="grid place-items-center">
          {letter.correct ? (
            <img
              alt="tick"
              src="/Assets/Icons/tick-green-icon.svg"
              className="w-3 h-3"
            />
          ) : (
            <img
              alt="cross"
              src="/Assets/Icons/cross-icon.svg"
              className="w-3 h-3"
            />
          )}
        </div>
      </div>
    );
  };

  const renderBoard = () => {
     const myPlayerData = gameState?.[myPlayerId];
     const otherPlayerData = gameState?.[otherPlayerId];
     return (
       <div className="memory-game-board h-[calc(100%-28px)] relative">
         <div className="flex flex-col items-center gap-2 absolute left-4 top-3 text-primary-yellow text-sm">
           You
           <div className="text-white text-xl">{myPlayerData.score}</div>
           <div>
             {myPlayerData.letters?.map((letter) => {
               return renderRightWrongLetterIcon(letter);
             })}
           </div>
         </div>
         <div className="flex flex-col items-center gap-2 absolute top-3 right-4 text-primary-yellow text-sm">
           {otherPlayerData?.name}
           <div className="text-white text-xl">{otherPlayerData?.score}</div>
           <div>
             {otherPlayerData.letters?.map((letter) => {
               return renderRightWrongLetterIcon(letter);
             })}
           </div>
         </div>
         <Board handleClick={handleClick} gameState={gameState} showAnswer={showAnswer}/>
       </div>
     );
  }

  const renderGame = () => {
    if (computerGameLoading) {
      return (
        <div className="w-full h-full flex justify-center items-center">
          <GameLoader message="Finding a worthy opponent..." />
        </div>
      );
    }
    if (computerGameMessage) {
      return (
        <div className="w-full h-full flex justify-center items-center">
          <div className="text-center">{computerGameMessage}</div>
        </div>
      );
    }

    if (gameWon) {
      return renderGameWonModal();
    }
    if (gameLost) {
      return renderGameLostModal();
    }
    if (gameTied) {
      return renderGameTiedModal();
    }

    if (!gameState && gameId) {
      return (
        <div className="w-full h-full flex justify-center items-center">
          <GameLoader message="Initializing game" />
        </div>
      );
    }
    if (!user && gameState?.playerOne?.id && !gameState?.playerTwo?.id) {
      return renderAnonymousLoginScreen();
    }
    if (user && !gameState?.playerTwo?.id && !user.firstName) {
      return renderEnterNameScreen();
    }
    const isGameStarted = gameState?.isGameStarted;
    if (gameId && isGameStarted && !gameState?.rematchGameId) {
     return renderBoard();
    }
    return <div className="mt-8 h-full">{renderCorrectScreenForPlayer()}</div>;
  };

  const renderPlayerTwoInviteScreen = () => {
    return (
      <div className="flex flex-col gap-12 items-center">
        <div className="text-xl">
          {gameState?.playerOne?.name} has challenged you
        </div>
        <AppButton
          onClick={startGame}
          className="h-12 px-9"
          isLoading={loading}
        >
          Accept Invite
        </AppButton>
        {renderRules()}
      </div>
    );
  };

  const renderRematchScreen = () => {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-full">
        <div className="text-center text-xl">Play again?</div>
        <div>{gameState?.[otherPlayerId].name} wants a rematch</div>
        <div className="flex gap-4">
          <AppButton onClick={() => handleButtonClick('yes')} disabled={buttonClicked}>
            Yes
          </AppButton>
          <AppButton onClick={() => handleButtonClick('no')} disabled={buttonClicked}>
            No
          </AppButton>
        </div>
      </div>
    );
  };

  const renderEnterNameScreen = () => {
    const isAllowed =
      anonymousName && anonymousName.length > 2 && anonymousName.length <= 12;
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-full w-full">
        <div className="text-center text-xl">Play as Guest</div>
        <AppInput
          onChange={setAnonymousName}
          value={anonymousName}
          placeholder="Enter your name to play"
          className="text-center"
          error={isAllowed ? "" : "Name should be between 3 to 12 characters"}
        />
        <AppButton
          onClick={startGame}
          isLoading={loading}
          className="w-48"
          disabled={!isAllowed}
        >
          Accept
        </AppButton>
        <AppButton
          onClick={loginToMaidaan}
          className="mb-10 w-48"
          variant="secondary"
        >
          Login to Maidaan
        </AppButton>
        {renderRules()}
      </div>
    );
  };

  const renderGameLostModal = () => {
    return (
      <GameEndModal
        gameState={gameState}
        gameId = {gameId}
        inviteOthers={handleQuitGame}
        isOpen={gameLost}
        myPlayerId={myPlayerId}
        resetGame={resetGame}
        icon="/Assets/Icons/skull.svg"
        title="Better luck next time!"
        isGameLost={true}
        gameCollectionName={GameCollectionName}
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        hintText="Somya from Kolkata beat her opponent in 11 moves. Beat her score!"
        smallCopy = "You saved the person but your opponent filled more blanks! Hard luck but great work!"
      />
    );
  };

  const renderGameWonModal = () => {
    return (
      <GameEndModal
        gameState={gameState}
        gameId={gameId}
        inviteOthers={handleQuitGame}
        isOpen={gameWon}
        myPlayerId={myPlayerId}
        resetGame={resetGame}
        icon="/Assets/Icons/trophy.svg"
        title={
          gameState.gameExited ? "You win By Walkover" : "Victory is Yours!"
        }
        isGameLost={false}
        gameCollectionName={GameCollectionName}
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        hintText="Somya from Kolkata beat her opponent in 11 moves. Beat her score!"
        smallCopy = "You saved the person and filled more blanks than your opponent! Way to go!"
      />
    );
  };

  const renderGameTiedModal = () => {
    return (
      <GameEndModal
        gameState={gameState}
        gameId={gameId}
        inviteOthers={handleQuitGame}
        isOpen={gameTied}
        myPlayerId={myPlayerId}
        resetGame={resetGame}
        icon={gameState.mistakes === 7 ? "/Assets/Icons/skull.svg" : "/Assets/Icons/handshake.svg"}
        title={gameState.mistakes === 7 ? "Better luck next time!" : "Its a Tie!"} 
        isGameLost={false}
        isGameTied={true}
        gameCollectionName={GameCollectionName}
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        hintText="Somya from Kolkata beat her opponent in 11 moves. Beat her score!"
        smallCopy = {gameState.mistakes === 7? "You tried your best but couldn't save the person!" :
                    "You saved the person and both of you filled an equal number of blanks! Great partnership!"}
      />
    );
  };

  const headerText = () => {
    let header = "Hangman";
    if (
      !gameState?.gameEndedAt &&
      gameState?.isGameStarted &&
      !gameState?.gameExited
    ) {
      header = "Your Turn";
      if (gameState?.currentActivePlayer !== myPlayerId) {
        header = `${gameState?.[otherPlayerId].name}'s Turn`;
      }
    }
    return header;
  };
  return (
    <>
      <GameHomeLayout
        gameId={gameId}
        gameState={gameState}
        computerGameLoading={computerGameLoading}
        setComputerGameLoading={setComputerGameLoading}
        renderGame={renderGame}
        showChat={!!gameState?.gameEndedAt}
        gameContainerClassName="p-0 items-stretch"
        headerText={headerText()}
        showHeader
        backButtonLink={HANGMAN_ROUTE}
        isQuizGame
        gameType={gameType}
        myPlayerLeaderboardData={myPlayerLeaderboardData}
        oneOnOneID={oneOnOneID}
        gameCollectionName={GameCollectionName}
        quitGamePopup={quitGamePopup}
        setQuitGamePopup={setQuitGamePopup}
        setExitGamePopup={setExitGamePopup}
        handleFindPlayer={handleFindPlayer}
        exitGamePopup={exitGamePopup}
        opponentLeftPopup={opponentLeftPopup}
        setOpponentLeftPopup={setOpponentLeftPopup}
        setOneOnOneID={setOneOnOneID}
        redirectRoute={HANGMAN_ROUTE}
        resetStateVariables={resetStateVariables}
        setGameWonByExit={setGameWonByExit}
      />
      <ToastComponent />
    </>
  );
}

export default Hangman;
