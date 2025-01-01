import React, { useState, useEffect, useRef, useMemo } from "react";
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
import useToast from "../../hooks/use-toast";
import ArenaHeader from "../Common/ArenaHeader";
import AppInput from "../../Components/Common/AppInput";
import GameEndModal from "../Common/GameEndModal";
import GameLoader from "../../Components/PageComponents/GameLoader";
import DarkModal from "../../Components/Common/DarkModal";
import { twMerge } from "tailwind-merge";
import { MEASURE } from "../../instrumentation";
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
} from "../utils";
import { ARENA_ROUTE, MINI_SCRABBLE_ROUTE } from "../../Constants/routes";
import axios from "axios";
import {
  findPlayer,
  startPvpGame,
  handleVisibility,
  handleGameStart,
  handleUpdateRating,
} from "../../GamesArena/Common/MatchMaking";
import { checkAndUpdateReferralCoins } from "../../GamesArena/Common/ReferralCoins";
import {
  getWeeklyArenaTournamentLeaderboard,
  sortDataPerRankOrPoints,
} from "../utils";
import { INSTRUMENTATION_TYPES } from "../../instrumentation/types";
import { Timer } from "../../Components/Games/SpellBee/GameComponents/CountdownTimer";
import MiniScrabbleGameBoard from "./GameBoard";
import { POINTS_PER_ALPHABET, ROUND_INFO, getRandomLettersForGame } from "../../Constants/GamesArena/MiniScrabble";
import listOfWords from "../../assets/scrabble-words.json";


const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");

const collectionName = "miniScrabble";

function MiniScrabble() {
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
  const gameType = "miniScrabble";
  const gameId = searchParams.get("gameId");
  const [gameConfig, setGameConfig] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [gamePointsEndModal, setGamePointsEndModal] = useState({});
  const [messageDisplayed, setMessageDisplayed] = useState(false);
  const [gameWonByExit, setGameWonByExit] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [exitYesButtonLoading, setExitYesButtonLoading] = useState(false);
  const [docCreatedDate, setDocCreatedDate] = useState(null);
  const [currentBotTurn, setCurrentBotTurn] = useState(0);
  const [botMovesArray, setBotMovesArray] = useState([]);
  const [pauseTimer, setPauseTimer] = useState(true);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [otherPlayerMovesState, setOtherPlayerMovesState] = useState([]);
  const [activeSoundPlayed, setActiveSoundPlayed] = useState(false);
  const [showRoundInfoPopup, setShowRoundInfoPopup] = useState(false);
  const [showWaitScreen, setShowWaitScreen] = useState(false);
  const [currentBotRound, setCurrentBotRound] = useState(1);
  const gameStateRef = useRef({});

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
    const miniScrabbleCollection = collection(db, "miniScrabble");
    const gameRef = doc(miniScrabbleCollection, gameId);
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

  useEffect(() => {
    // add a listener to the document with the gameId
    // if the document changes, we want to update the board
    setButtonClicked(false);
    fetchGameConfig();
    if (!gameId) return;
    if (!user) {
      getGameDetails();
      return;
    }

    const miniScrabbleCollection = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      doc(miniScrabbleCollection, gameId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          // if (data?.activeSound && !activeSoundPlayed) {
          //   playAudioClip(data.activeSound);
          //   setActiveSoundPlayed(true);
          // }
          setGameState(data);
          gameStateRef.current = data;
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
      docCreatedDate
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oneOnOneID]);

  //create useeffect to chceck player one

  useEffect(() => {
    const unsubscribe = handleVisibility(
      oneOnOneID,
      gameState,
      setComputerGameLoading,
      setLoading,
      setOneOnOneID,
      db,
      gameState,
      quitGame
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.visibilityState, oneOnOneID, gameState]);

  const handleLogout = async () => {
    await logout();
    window.location.replace(`/login?redirect=${MINI_SCRABBLE_ROUTE}`);
  };

  const checkUserGameLimit = async (gameStart = false) => {
    const childrenCollection = collection(db, "children");
    const childRef = doc(childrenCollection, user.id);
    const child = await getDoc(childRef);
    if (child.exists()) {
      const data = child.data();
      const gameCount =
        data?.arenaGames?.[collectionName]?.[currentDateInDDMMYYYY] ?? 0;
      const totalGameCount = calculateGameCount(data, currentDateInDDMMYYYY);
      if (totalGameCount >= DAILY_LIMIT) {
        showToast("You have exceeded your daily game limit", "error");
        return true;
      } else if (gameStart) {
        await setDoc(
          childRef,
          {
            arenaGames: {
              [collectionName]: {
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
          otherChildData?.arenaGames?.[collectionName]?.[currentDateInDDMMYYYY] ?? 0;
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
                [collectionName]: {
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
    setOpponentLeftPopup(false);
  };

  const handleFindPlayer = async () => {
    setButtonLoading(true);
    const bool = await checkUserGameLimit();
    if (bool) {
      return;
    }

    setExitGamePopup(false);
    setQuitGamePopup(false);
    resetStateVariables();
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
      setDocCreatedDate
    );
    setButtonLoading(false);
  };

  const findDifficulty = async (userId) => {
    let newdifficultyLevel = "EASY";
    //fetch the previous game played by this user, and get the difficulty level and winner for that game
    const previousGameCollection = collection(db, collectionName);
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
        if (previousGameDifficultyLevel === "HARD") {
          newdifficultyLevel = "HARD";
        } else if (previousGameDifficultyLevel === "MEDIUM") {
          newdifficultyLevel = "HARD";
        } else {
          newdifficultyLevel = "MEDIUM";
        }
      } else if (previousGameWinner === "playerTwo") {
        if (previousGameDifficultyLevel === "HARD") {
          newdifficultyLevel = "MEDIUM";
        } else {
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
  };
  const createGame = async (player = "playerOne", reset = false) => {
    if (!user || (user && !user.createdAt && !reset)) {
      window.location.replace(`/login?redirect=${MINI_SCRABBLE_ROUTE}`);
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
    const miniScrabbleCollection = collection(db, collectionName);

    if (player === "computer") {
      setComputerGameLoading(true);
      const randomName = getRandomValueFromArray(IndianNames);
      const randomState = getRandomValueFromArray(IndianStates);
      const { foundWords, randomRack: localLettersList } = getRandomLettersForGame(
        listOfWords.words
      );
      const docRef = await addDoc(miniScrabbleCollection, {
        createdAt: new Date(),
        letters: localLettersList, // list of letters to show both players
        foundWords,
        activeRound: 1,
        playerOne: {
          score: 0,
          id: user.id,
          moves: [],
          name: user.firstName,
          words: [], // list of words the players have made and submitted
          scorePerRound: [], // list of scores per round
        },
        playerTwo: {
          score: 0,
          id: AI_COMPUTER_ID,
          moves: [],
          name: randomName,
          words: [], // list of words the players have made and submitted
          scorePerRound: [], // list of scores per round
        },
        result: [],
        winner: null,
        // board: JSON.stringify(boardMatrix),
        currentActivePlayer: "playerOne",
        currentActiveMove: 1,
        activeSound: "/Assets/Sounds/MemoryCards/gameStart.mp3",
        isComputerGame: true,
        isGameStarted: true,
        gameStartedAt: new Date(),
        difficulty: await findDifficulty(user.id),
      });
      if (reset) {
        const gameRef = doc(miniScrabbleCollection, gameId);
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
      // setCurrentBotRound(1);
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
      //   const boardMatrix = BOARD;
      let nameOfPlayer = user.firstName;
      if (reset && !nameOfPlayer) {
        nameOfPlayer = gameState?.[myPlayerId]?.name;
      }
      const { foundWords, randomRack: letters } = getRandomLettersForGame(
        listOfWords.words
      );
      // setLettersList(letters);
      // setFoundWords(foundWords);
      const docRef = await addDoc(miniScrabbleCollection, {
        createdAt: new Date(),
        letters: letters, // list of letters to show both players
        foundWords: foundWords,
        activeRound: 1,
        playerOne: {
          score: 0,
          id: user.id,
          moves: [],
          name: nameOfPlayer,
          words: [], // list of words the players have made and submitted
          scorePerRound: [], // list of scores per round
        },
        playerTwo: {
          score: 0,
          id: "",
          moves: [],
          name: "",
          words: [], // list of words the players have made and submitted
          scorePerRound: [], // list of scores per round
        },
        result: [],
        winner: null,
        // board: JSON.stringify(boardMatrix),
        currentActivePlayer: "playerOne",
        activeSound: null,
        ...(reset && !gameState.pvpGame && gameState?.chatId
          ? { chatId: gameState?.chatId }
          : {}),
        ...(reset && gameState?.pvpGame ? { pvpGame: true } : {}),
        ...(reset && (gameState?.pvpGame || gameState?.inviteGame || gameState?.isRematch)
          ? { isRematch: true }
          : {}),
      });
      if (reset) {
        const gameRef = doc(miniScrabbleCollection, gameId);
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
      const gameRef = doc(miniScrabbleCollection, gameId);
      const game = await getDoc(gameRef);
      if (game.exists()) {
        const data = game.data();
        await setDoc(doc(miniScrabbleCollection, gameId), {
          ...data,
          playerTwo: {
            score: 0,
            id: user.id,
            moves: [],
            name: user.firstName,
            words: [], // list of words the players have made and submitted
            scorePerRound: [], // list of scores per round
          },
        });
      }
      setLoading(false);
      return;
    }
  };

  const startPvpConnectGame = async (
    user,
    playerTwo,
    gameId,
    oneOnOneID,
    setLoading,
    searchParams,
    setSearchParams,
    setComputerGameLoading,
    db
  ) => {
    const miniScrabbleCollection = collection(db, collectionName);
    const gameRef = doc(miniScrabbleCollection, gameId);

    const { foundWords, randomRack: letters } = getRandomLettersForGame(
      listOfWords.words
    );
    // setLettersList(letters);
    // setFoundWords(foundWords);

    const childCollection = collection(db, "children");
    const playerTwoRef = doc(childCollection, playerTwo);
    const playerTwoDoc = await getDoc(playerTwoRef);
    const playerTwoData = playerTwoDoc.data();
    const playerTwoName = playerTwoData?.firstName;
    await setDoc(gameRef, {
      isGameStarted: true,
      createdAt: new Date(),
      gameStartedAt: new Date(),
      letters: letters, // list of letters to show both players
      foundWords: foundWords,
      activeRound: 1,
      playerOne: {
        score: 0,
        id: user.id,
        moves: [],
        name: user.firstName,
        words: [], // list of words the players have made and submitted
        scorePerRound: [], // list of scores per round
      },
      playerTwo: {
        score: 0,
        id: playerTwo,
        name: playerTwoName,
        moves: [],
        words: [], // list of words the players have made and submitted
        scorePerRound: [], // list of scores per round
      },
      result: [],
      winner: null,
      // board: JSON.stringify(boardMatrix),
      currentActivePlayer: "playerOne",
      currentActiveMove: 1,
      activeSound: null,
      pvpGame: true,
    });
    const openMatchesCollection = collection(db, "openMatches");
    const openMatchRef = doc(openMatchesCollection, oneOnOneID);
    await setDoc(
      openMatchRef,
      {
        gameStarted: true,
      },
      { merge: true }
    );
    setSearchParams({ ...searchParams, gameId: gameRef.id });
    setComputerGameLoading(true);
  };

  const startGame = async () => {
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
    const miniScrabbleCollection = collection(db, collectionName);
    const gameRef = doc(miniScrabbleCollection, finalGameId);
    const ogGameRef = doc(miniScrabbleCollection, gameId);

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
      const { foundWords, randomRack: letters } = getRandomLettersForGame(
        listOfWords.words
      );
      // setLettersList(letters);
      // setFoundWords(foundWords);
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
      await setDoc(
        gameRef,
        {
          ...data,
          currentActivePlayer: "playerOne",
          isGameStarted: true,
          gameStartedAt: new Date(),
          letters: letters, // list of letters to show both players
          foundWords: foundWords,
          activeRound: 1,
          playerTwo: {
            score: 0,
            id: user.id,
            moves: [],
            name:
              user.firstName ??
              trimmedName ??
              gameState?.playerTwo?.name ??
              "Anonymous",
            words: [], // list of words the players have made and submitted
            scorePerRound: [], // list of scores per round
          },
          activeSound: "/Assets/Sounds/MemoryCards/gameStart.mp3",
          ...(!gameState?.pvpGame ? { chatId } : {}),
          ...(!gameState?.rematchGameId ? { inviteGame: true } : {}),
        },
        { merge: true }
      );
    }
    setLoading(false);
  };

  const declineGame = async () => {
    const miniScrabbleCollection = collection(db, collectionName);
    const gameRef = doc(miniScrabbleCollection, gameId);
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
        navigate(MINI_SCRABBLE_ROUTE);
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
    const playerOneOrTwo =
      gameState?.playerOne.id === user?.id ? "playerOne" : "playerTwo";
    const currentPlayer = gameState?.[playerOneOrTwo];
    if (
      (gameState.gameEndedAt &&
        gameState.winner &&
        !currentPlayer?.pointsAwarded) ||
      (gameState.gameExited !== user?.id &&
        gameState.gameWonByExit &&
        !currentPlayer?.pointsAwarded)
    ) {
      let winner = gameState.winner;
      let isTied = gameState.winner === "Tied";
      let currentActivePlayer = gameState.currentActivePlayer;
      let otherPlayer =
        gameState.currActivePlayer === "playerOne" ? "playerTwo" : "playerOne";
      let stateToUpdate = {};
      const miniScrabbleCollection = collection(db, collectionName);
      const gameRef = doc(miniScrabbleCollection, gameId);
      if (playerOneOrTwo === "playerOne") {
        stateToUpdate = {
          playerOne: {
            pointsAwarded: true,
          },
        };
      } else {
        stateToUpdate = {
          playerTwo: {
            pointsAwarded: true,
          },
        };
      }
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
        if (winner !== myPlayerId) {
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
          await checkAndUpdateReferralCoins(
            user?.id,
            user?.referredBy,
            user?.walletId,
            user?.referralBonusCredited
          );
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

      setIsGameFinished(true);

      setTimeout(() => {
        // setCurrentBotRound(1);
        setActiveSoundPlayed(false);
        setIsGameFinished(false);
        if (isTied) {
          setGameTied(true);
        } else {
          if (winner === myPlayerId) {
            setGameWon(true);
          } else {
            setGameLost(true);
          }
        }
      }, 2000);
    }
  };

  const resetGame = async () => {
    const bool = await checkUserGameLimit();
    if (bool) {
      return;
    }
    if (gameState?.isComputerGame) {
      createGame(AI_COMPUTER_ID, true);
    } else {
      createGame("playerOne", true);
    }
  };

  const handleButtonClick = (action) => {
    if (!buttonClicked) {
      setButtonClicked(true);
      if (action === "yes") {
        startGame();
      } else if (action === "no") {
        declineGame();
      }
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
      gamesPlayed = data?.arenaGames?.[collectionName]?.[currentDateInDDMMYYYY] ?? 1;
    }
    //update the doc
    setDoc(
      docRef,
      {
        arenaGames: {
          [collectionName]: {
            [currentDateInDDMMYYYY]: gamesPlayed - 1,
          },
        },
      },
      { merge: true }
    );
  };

  const quitGame = async () => {
    if (gameId && user.createdAt) {
      setExitGamePopup(false);
      setQuitGamePopup(false);
      const numberOfMovesOfCurrentPlayer =
        gameState?.[
          gameState?.playerOne.id === user?.id ? "playerOne" : "playerTwo"
        ]?.numberOfMoves ?? 0;
      const playerOne = gameState?.playerOne;
      const miniScrabbleCollection = collection(db, collectionName);
      const gameRef = doc(miniScrabbleCollection, gameId);
      if (!numberOfMovesOfCurrentPlayer) {
        await setDoc(
          gameRef,
          {
            ...gameState,
            gameEndedAt: new Date(),
            gameExited: user.id,
          },
          { merge: true }
        );
        //getChildAndUpdateGameCount(user?.id);
        //getLeaderboardAndUpdatedGameCounts(user?.id);
      } else {
        if (!gameState?.winner) {
          setDoc(
            gameRef,
            {
              ...gameState,
              gameEndedAt: new Date(),
              winner: playerOne.id === user.id ? "playerTwo" : "playerOne",
              gameExited: user.id,
              gameWonByExit: true,
            },
            { merge: true }
          );
          setGameWonByExit(true);
        } else {
          setDoc(
            gameRef,
            {
              ...gameState,
              gameEndedAt: new Date(),
              gameExited: user.id,
            },
            { merge: true }
          );
        }
      }
      resetStateVariables();
      navigate(MINI_SCRABBLE_ROUTE);
    } else {
      window.location.replace(`/login?redirect=${MINI_SCRABBLE_ROUTE}`);
    }
    //set the game doc that current player exited the game.
  };

  const playAudioClip = (clip) => {
    const audioElRef = new Audio(clip); // Create a new Audio element
    audioElRef.play();
  };

  const checkForWin = (_board) => {};

  const makeMove = async (column) => {};

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

  const checkWordAndCalculateScoreForBot = (word) => {
    const localGS = gameStateRef.current;
    if (word.length !== ROUND_INFO[localGS.activeRound - 1].length) {
      return;
    }
    const score = word.split("").reduce((acc, letter) => {
      const findScore = POINTS_PER_ALPHABET.find(
        (point) => point.letter === letter
      );
      return acc + findScore?.score;
    }, 0);
    let dataToUpdate = {
      playerTwo: {
        ...localGS.playerTwo,
        score: localGS.playerTwo.score + score,
        scorePerRound: [...localGS.playerTwo.scorePerRound, score],
        words: [...localGS.playerTwo.words, { word: word, isValid: true }],
        proceedToNextRound: localGS?.playerOne.proceedToNextRound ? false : true,
      },
    };
    updateGameState(dataToUpdate);
    if (localGS?.playerOne.proceedToNextRound) {
      setTimeout(() => {
        updateGameState({
          playerTwo: {
            ...dataToUpdate.playerTwo,
            proceedToNextRound: true,
          },
        });
      }, 3000);
    }
  };


  useEffect(() => {
    if (gameState) {
      checkGameState();
      if (gameState?.gameStartedAt && !gameState.gameEndedAt && gameState?.playerOne?.id && gameState?.playerTwo?.id) {
        const { playerOne, playerTwo, activeRound } = gameState;
        const { score, proceedToNextRound } = playerOne ?? {};
        const { score: scoreTwo, proceedToNextRound: proceedToNextRoundTwo } = playerTwo ?? {};
        if (proceedToNextRound && proceedToNextRoundTwo) {
          setPauseTimer(true);
          let dataToUpdate = {
            activeRound: activeRound + 1,
            playerOne: {
              ...playerOne,
              proceedToNextRound: false,
            },
            playerTwo: {
              ...playerTwo,
              proceedToNextRound: false,
            },
          };
          // setCurrentBotRound(activeRound + 1);
          if (activeRound === 4) {
            dataToUpdate = {
              gameEndedAt: new Date(),
              winner:
                score > scoreTwo
                  ? "playerOne"
                  : score < scoreTwo
                  ? "playerTwo"
                  : "Tied",
            };
            setTimeout(() => {
              setShowWaitScreen(false);
              updateGameState(dataToUpdate, true);
            }, 5000);
          } else {
            updateGameState(dataToUpdate, true);
            setShowWaitScreen(false);
          }
        }
        if (
          gameState?.activeRound === 1 &&
          !gameState?.playerOne?.proceedToNextRound &&
          !gameState?.playerTwo?.proceedToNextRound
        ) {
          if (!activeSoundPlayed) {
            playAudioClip("/Assets/Sounds/MemoryCards/gameStart.mp3");
            setActiveSoundPlayed(true);
          }
          if (gameState.isComputerGame) {
            setTimeout(() => {
              setShowRoundInfoPopup(true);
              setPauseTimer(true);
            }, 5000);
            setTimeout(() => {
              setShowRoundInfoPopup(false);
              setPauseTimer(false);
            }, 7000);

          } else {
            setShowRoundInfoPopup(true);
            setPauseTimer(true);
            setTimeout(() => {
              setShowRoundInfoPopup(false);
              setPauseTimer(false);
            }, 2000);
          }
        } else if (
          gameState?.activeRound &&
          gameState?.playerOne?.proceedToNextRound &&
          gameState?.playerTwo?.proceedToNextRound &&
          !showRoundInfoPopup
        ) {
          setShowRoundInfoPopup(true);
          setPauseTimer(true);
          setTimeout(() => {
            setShowRoundInfoPopup(false);
            setPauseTimer(false);
          }, 4000);
        }
      }
      if (
        gameStateRef.current.isComputerGame &&
        !gameStateRef.current.gameEndedAt && !gameStateRef.current?.playerTwo.words[gameStateRef.current.activeRound - 1]
      ) {
        // const localGS = gameStateRef.current;
        // bot logic goes here
        const { foundWords } = gameStateRef.current;
        const currentDiff = gameStateRef.current.difficulty;
        if (gameStateRef.current.activeRound === 1) {
          setTimeout(() => {
            const correctWord = foundWords.two.word;
            checkWordAndCalculateScoreForBot(correctWord);
          }, 10000);
        } else if (gameStateRef.current.activeRound === 2) {
          setTimeout(() => {
            const correctWord = foundWords.three.word;
            checkWordAndCalculateScoreForBot(correctWord);
          }, 15000);
        } else if (gameStateRef.current.activeRound === 3) {
          if (currentDiff === "MEDIUM" || currentDiff === "HARD") {
            setTimeout(() => {
              const correctWord = foundWords.four.word;
              checkWordAndCalculateScoreForBot(correctWord);
            }, 20000);
          } else {
            setTimeout(() => {
              let dateToUpdate = {
                playerTwo: {
                  ...gameStateRef.current.playerTwo,
                  scorePerRound: [
                    ...gameStateRef.current.playerTwo.scorePerRound,
                    0,
                  ],
                  words: [
                    ...gameStateRef.current.playerTwo.words,
                    { word: "", isValid: false },
                  ],
                  // proceedToNextRound: true,
                },
              };
              updateGameState(dateToUpdate);
            }, 15000);
            setTimeout(() => {
              updateGameState({
                playerTwo: {
                  ...gameStateRef.current.playerTwo,
                  proceedToNextRound: true,
                },
              });
            }, 20000);
          }
        } else if (gameStateRef.current.activeRound === 4) {
          if (currentDiff === "HARD") {
            setTimeout(() => {
              const correctWord = foundWords.five.word;
              checkWordAndCalculateScoreForBot(correctWord);
            }, 25000);
          } else {
            setTimeout(() => {
              let dateToUpdate = {
                playerTwo: {
                  ...gameStateRef.current.playerTwo,
                  scorePerRound: [
                    ...gameStateRef.current.playerTwo.scorePerRound,
                    0,
                  ],
                  words: [
                    ...gameStateRef.current.playerTwo.words,
                    { word: "", isValid: false },
                  ],
                  // proceedToNextRound: true,
                },
              };
              updateGameState(dateToUpdate);
            }, 21000);
            setTimeout(() => {
              updateGameState({
                playerTwo: {
                  ...gameStateRef.current.playerTwo,
                  proceedToNextRound: true,
                },
              });
            }, 27000);
          }
        }
       }
      if (
        gameState?.gameExited &&
        gameState?.gameExited !== user?.id &&
        !gameState?.winner
      ) {
        getChildAndUpdateGameCount(user?.id);
        getLeaderboardAndUpdatedGameCounts(user?.id);
        setQuitGamePopup(true);
        //show a popup that the other player has exited the game with two options to go back or find another player.
      } else if (
        (gameState?.gameExited && gameState?.gameExited !== user.id) ||
        (gameState?.isComputerGame &&
          gameState?.gameEndedAt &&
          !opponentLeftPopup &&
          gameState?.gameExited !== user.id)
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

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
      `/login?redirect=${MINI_SCRABBLE_ROUTE}?gameId=${gameId}`
    );
  };

  const signInAnonymously = async () => {
    await signInAnonymouslyWithFirebase();
  };

  const goBack = async () => {
    MEASURE(INSTRUMENTATION_TYPES.GO_BACK, user?.id, { gameType: gameType });
    if (
      gameId ||
      (gameState?.isGameStarted && !gameState?.gameExited) ||
      (!gameState && computerGameLoading)
    ) {
      setExitGamePopup(true);
    } else {
      navigate(ARENA_ROUTE);
    }
  };

  const closeDocAndExit = async () => {
    if (oneOnOneID) {
      setComputerGameLoading(false);
      setExitGamePopup(false);
      const openMatchesCollection = collection(db, "openMatches");
      //check if the match is open or not,if open then close it.
      const matchingDoc = await getDoc(doc(openMatchesCollection, oneOnOneID));

      if (matchingDoc.exists() && matchingDoc.data().status === "open") {
        await setDoc(
          doc(openMatchesCollection, oneOnOneID),
          {
            status: "closedWithExit",
          },
          { merge: true }
        );
      }
      setOneOnOneID(null);
    }
    navigate(MINI_SCRABBLE_ROUTE);
  };

  const updateGameState = async (gameState, pauseTimer = false) => {
    setPauseTimer(pauseTimer);
    const miniScrabbleCollection = collection(db, collectionName);
    const gameRef = doc(miniScrabbleCollection, gameId);
    await setDoc(gameRef, gameState, { merge: true });
  };

  const changeTurnOnTimerEnd = () => {
    const localGS = gameStateRef.current;
    if (localGS[myPlayerId].proceedToNextRound) {
      return;
    }
    setShowWaitScreen(true);
    let dataToUpdate = {
      [myPlayerId]: {
        ...localGS[myPlayerId],
        scorePerRound: [...localGS[myPlayerId].scorePerRound, 0],
        words: [...localGS[myPlayerId].words, { word: "", isValid: false }],
        proceedToNextRound:
          localGS?.activeRound === 4
            ? true
            : !localGS?.[otherPlayerId].proceedToNextRound,
      },
    };
    updateGameState(dataToUpdate, true);
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
      const gameLink = `${window.location.protocol}//${window.location.host}/${MINI_SCRABBLE_ROUTE}?gameId=${gameId}`;
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
                  const bodyText = `Hey Hey! ${gameState?.playerOne?.name} has challenged you to a game of Mini Scrabble on Maidaan. Tap the link and Game On!\n\n${gameLink}`;
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
            onClick={() => {
              MEASURE(INSTRUMENTATION_TYPES.CHALLENGE_FRIEND, user?.id, {
                gameType: gameType,
              });
              createGame("playerOne");
            }}
            className="h-12 px-9 w-48"
            isLoading={loading}
          >
            Challenge a friend
          </AppButton>
          <AppButton
            onClick={() => {
              MEASURE(INSTRUMENTATION_TYPES.FIND_PLAYER, user?.id, {
                gameType: gameType,
              });
              if (!buttonLoading) handleFindPlayer();
            }}
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
          2 Players | 4 Words | 7 Letters
        </div>
        <div>
          <ul className="py-0 px-6">
            <li>Use the letters to make 2, 3, 4 and 5 letter words</li>
            <li>Choose letters with higher value to score more</li>
            <li>Highest score at the end of all rounds wins!</li> 
          </ul>
        </div>
      </div>
    );
  };

  const renderColorDotForPlayer = (player = 1) => {
    if (
      (player === 1 && user.id === gameState?.playerOne?.id) ||
      (player === 2 && user.id === gameState?.playerTwo?.id)
    ) {
      return (
        <div className="h-4 w-4 rounded-full bg-red-500 flex-shrink-0"></div>
      );
    }
    return (
      <div className="h-4 w-4 rounded-full bg-primary-yellow flex-shrink-0"></div>
    );
  };

  const renderHitCounter = (playerData, isOtherPlayer = false) => {
    return (
      <div className="flex gap-1">
        {Array.from(Array(5)).map((_, index) => {
          const isCorrect = isOtherPlayer
            ? otherPlayerMovesState[index]
            : playerData?.moves?.[index];
          return (
            <div className="border border-solid border-primary-yellow rounded-full shrink-0 w-5 h-5 grid place-items-center">
              {isCorrect !== undefined ? (
                isCorrect ? (
                  <img
                    alt="tick"
                    src="/Assets/Icons/tick-green-icon.svg"
                    className="w-[70%]"
                  />
                ) : (
                  <img
                    alt="cross"
                    src="/Assets/Icons/cross-icon.svg"
                    className="w-[70%]"
                  />
                )
              ) : (
                <></>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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
      return (
        <div className="h-full w-full flex flex-col justify-between bg-primary-gray-20">
          <div>
            <div className="grid grid-cols-3 items-center max-xs:my-0">
              <div className="text-xl flex flex-col items-center gap-2 px-2">
                <div className="flex items-center gap-2 text-primary-yellow text-sm">
                  You
                </div>
                <div className="text-2xl font-bold">
                  {gameState?.[myPlayerId]?.score}
                </div>
              </div>
              <div className="flex justify-center py-2">
                <Timer
                  duration={ROUND_INFO[gameState?.activeRound - 1]?.time}
                  stroke={5}
                  timerEnd={changeTurnOnTimerEnd}
                  // timerEnd={() => {}}
                  startTimer={!gameState.gameEndedAt && !pauseTimer}
                  key={gameState?.activeRound}
                />
              </div>
              <div className="text-xl flex flex-col items-center gap-2 px-2">
                <div className="flex items-center gap-2 text-primary-yellow text-sm">
                  {gameState?.[otherPlayerId]?.name}
                </div>
                <div className="text-2xl font-bold">
                  {gameState?.[otherPlayerId]?.score}
                </div>
              </div>
            </div>
          </div>
          {!gameState.gameEndedAt && (
            <MiniScrabbleGameBoard
              gameState={gameState}
              myPlayerId={myPlayerId}
              otherPlayerId={otherPlayerId}
              updateGameState={updateGameState}
              showWaitScreen={showWaitScreen}
              setShowWaitScreen={setShowWaitScreen}
              setPauseTimer={setPauseTimer}
            />
          )}
        </div>
      );
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
          <AppButton
            onClick={() => {
              MEASURE(INSTRUMENTATION_TYPES.REMATCH_ACCEPTED, user?.id, {
                gameType: gameType,
              });
              handleButtonClick("yes");
            }}
            disabled={buttonClicked}
          >
            Yes
          </AppButton>
          <AppButton
            onClick={() => {
              MEASURE(INSTRUMENTATION_TYPES.REMATCH_DECLINED, user?.id, {
                gameType: gameType,
              });
              handleButtonClick("no");
            }}
            disabled={buttonClicked}
          >
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
        inviteOthers={quitGame}
        isOpen={gameLost}
        myPlayerId={myPlayerId}
        resetGame={resetGame}
        icon="/Assets/Icons/skull.svg"
        title="Better luck next time!"
        isGameLost={true}
        gameCollectionName={collectionName}
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        gameId={gameId}
        gameType={gameType}
        hintText="Somya from Kolkata beat her opponent in 11 moves. Beat her score!"
        showSubtitle={false}
      />
    );
  };

  const renderGameWonModal = () => {
    return (
      <GameEndModal
        gameState={gameState}
        inviteOthers={quitGame}
        isOpen={gameWon}
        myPlayerId={myPlayerId}
        resetGame={resetGame}
        icon="/Assets/Icons/trophy.svg"
        title={
          gameState.gameExited ? "You win By Walkover" : "Victory is Yours!"
        }
        isGameLost={false}
        gameCollectionName={collectionName}
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        gameId={gameId}
        handleFindPlayer={handleFindPlayer}
        showSubtitle={false}
        gameType={gameType}
        hintText="Somya from Kolkata beat her opponent in 11 moves. Beat her score!"
      />
    );
  };

  const renderGameTiedModal = () => {
    return (
      <GameEndModal
        gameState={gameState}
        inviteOthers={quitGame}
        isOpen={gameTied}
        myPlayerId={myPlayerId}
        resetGame={resetGame}
        icon="/Assets/Icons/handshake.svg"
        title="Its a Tie!"
        isGameLost={false}
        isGameTied={true}
        gameCollectionName={collectionName}
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        gameId={gameId}
        handleFindPlayer={handleFindPlayer}
        showSubtitle={false}
        gameType={gameType}
        hintText="Somya from Kolkata beat her opponent in 11 moves. Beat her score!"
      />
    );
  };

  const renderGameFinishedDialog = () => {
    const isTied = gameState?.winner === "Tied";
    let textToRender = `${gameState?.[gameState?.winner]?.name} Wins!`;
    if (isTied) {
      textToRender = "It's a Tie!";
    }
    if (gameState?.winner === myPlayerId) {
      textToRender = "You Win!";
    }
    return (
      <DarkModal isOpen={isGameFinished}>
        <div className="text-center text-xl">{textToRender}</div>
      </DarkModal>
    );
  };

  const renderExitGamePopup = () => {
    return (
      <DarkModal isOpen={exitGamePopup}>
        <div className="text-center">Are you sure you want to exit?</div>
        {gameState?.isGameStarted && !gameState.gameEndedAt && (
          <div className="text-center">
            You will not get any points if you leave
          </div>
        )}
        <div className="flex gap-4 mt-4">
          <AppButton
            onClick={() => {
              setExitYesButtonLoading(true);
              MEASURE(INSTRUMENTATION_TYPES.GAME_EXIT_YES, user?.id, {
                gameType: gameType,
                gameCreated: gameState ? true : false,
              });
              if (!gameState) {
                closeDocAndExit();
              } else {
                quitGame();
              }
              setExitYesButtonLoading(false);
            }}
            isLoading={exitYesButtonLoading}
          >
            Yes
          </AppButton>
          <AppButton
            onClick={() => {
              MEASURE(INSTRUMENTATION_TYPES.GAME_EXIT_NO, user?.id, {
                gameType: gameType,
                gameCreated: gameState ? true : false,
              });
              setExitGamePopup(false);
            }}
          >
            No
          </AppButton>
        </div>
      </DarkModal>
    );
  };

  const renderOpponentLeftPopup = () => {
    return (
      <DarkModal isOpen={opponentLeftPopup}>
        <div className="text-center">Your opponent has left the game room</div>
      </DarkModal>
    );
  };

  const otherPlayerQuitPopup = () => {
    return (
      <DarkModal isOpen={quitGamePopup}>
        <div className="text-center">Your opponent has left the game room</div>
        <div className="flex gap-4 mt-4">
          <AppButton onClick={handleFindPlayer}>Find Another Player</AppButton>
          <AppButton onClick={quitGame}>Go Back</AppButton>
        </div>
      </DarkModal>
    );
  };

  const renderRoundInfoPopup = () => {
    return (
      <DarkModal isOpen={showRoundInfoPopup && !showWaitScreen}>
        <div className="flex items-center justify-center flex-col gap-6 w-full">
          <div className="text-2xl">Make A</div>
          <div className="text-primary-yellow relative flex w-full justify-center">
            <div className="text-8xl">
              {ROUND_INFO[gameState?.activeRound - 1]?.length}
            </div>
            <div className="text-lg absolute right-0 bottom-[15px] w-20 text-white">
              Letter Word
            </div>
          </div>
        </div>
      </DarkModal>
    );
  };

  const headerText = () => {
    let header = "Mini Scrabble";
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
    <Layout>
      {isUserLoading ? (
        <div className="w-full h-full flex justify-center items-center">
          <GameLoader message="Setting up the arena" />
        </div>
      ) : (
        <>
          <div className="flex flex-col h-full w-full relative">
            {
              <ArenaHeader
                goBack={goBack}
                headerText={headerText()}
                coins={myPlayerLeaderboardData?.coins ?? 0}
                pointsWon={myPlayerLeaderboardData?.pointsWon ?? 0}
                gamesPlayed={myPlayerLeaderboardData?.gamesPlayed ?? 0}
              />
            }
            <div className="text-white flex flex-col  items-center h-full">
              {/* <h1>Memory Game</h1> */}
              {renderGame()}
            </div>
          </div>
          {renderExitGamePopup()}
          {otherPlayerQuitPopup()}
          {renderOpponentLeftPopup()}
          {renderGameFinishedDialog()}
          <ToastComponent />
          {/* {gameState?.chatId ? (
            <Chat
              gameState={gameState}
              otherPlayerId={otherPlayerId}
              handleShowReaction={setShowReaction}
            />
          ) : (
            <></>
          )} */}
          {/* <div
            className={twMerge(
              "absolute bottom-[15%] left-1/2 -translate-x-1/2 bg-primary-gray-20 flex flex-col justify-center items-center text-5xl p-4",
              showReaction ? "h-fit w-fit opacity-100" : "h-0 w-0 opacity-0"
            )}
          >
            <div className="text-center text-primary-yellow text-lg mb-3">
              {gameState?.[otherPlayerId]?.name} says
            </div>
            <div className="animate-shake">{showReaction?.text}</div>
          </div> */}
          {renderRoundInfoPopup()}
        </>
      )}
    </Layout>
  );
}

export default MiniScrabble;
