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
import { ARENA_ROUTE, CONNECT_4_ROUTE } from "../../Constants/routes";
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
import {get_next_move} from './Alphabetabot'
import { INSTRUMENTATION_TYPES } from "../../instrumentation/types";
import mixpanel from 'mixpanel-browser';

const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");

const BOARD = [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
  ]
const GAME_DIFFICULTY = {
    EASY: 1,
    MEDIUM: 3,
    HARD: 5
};

function Connect4() {
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
  const gameType = "connect4";
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
    const connect4Collection = collection(db, "connect4");
    const gameRef = doc(connect4Collection, gameId);
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
    if (!gameId) return;
    if (!user) {
      getGameDetails();
      return;
    }

    const connect4Collection = collection(db, "connect4");
    const unsubscribe = onSnapshot(
      doc(connect4Collection, gameId),
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
    window.location.replace(`/login?redirect=${CONNECT_4_ROUTE}`);
  };

  const checkUserGameLimit = async (gameStart = false) => {
    const childrenCollection = collection(db, "children");
    const childRef = doc(childrenCollection, user.id);
    const child = await getDoc(childRef);
    if (child.exists()) {
      const data = child.data();
      const gameCount =
        data?.arenaGames?.connect4?.[currentDateInDDMMYYYY] ?? 0;
      const totalGameCount = calculateGameCount(data, currentDateInDDMMYYYY);
      if (totalGameCount >= DAILY_LIMIT) {
        showToast("You have exceeded your daily game limit", "error");
        return true;
      } else if (gameStart) {
        await setDoc(
          childRef,
          {
            arenaGames: {
              connect4: {
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
          otherChildData?.arenaGames?.connect4?.[currentDateInDDMMYYYY] ?? 0;
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
                connect4: {
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
      setDocCreatedDate,
    );
    setButtonLoading(false);
  };

  const findDifficulty = async(userId) => {
    let newdifficultyLevel = "EASY";
    //fetch the previous game played by this user, and get the difficulty level and winner for that game
    const previousGameCollection = collection(db, 'connect4');
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
  const createGame = async (player = "playerOne", reset = false) => {
    if (!user || (user && !user.createdAt && !reset)) {
      window.location.replace(`/login?redirect=${CONNECT_4_ROUTE}`);
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
    const connect4Collection = collection(db, "connect4");

    if (player === "computer") {
      setComputerGameLoading(true);
      const boardMatrix = BOARD;
      const randomName = getRandomValueFromArray(IndianNames);
      const randomState = getRandomValueFromArray(IndianStates);
      const docRef = await addDoc(connect4Collection, {
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
        board: JSON.stringify(boardMatrix),
        currentActivePlayer: "playerOne",
        currentActiveMove: 1,
        activeSound: "/Assets/Sounds/MemoryCards/gameStart.mp3",
        isComputerGame: true,
        isGameStarted: true,
        gameStartedAt: new Date(),
        difficulty : await findDifficulty(user.id),
      });
      if (reset) {
        const gameRef = doc(connect4Collection, gameId);
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
      const boardMatrix = BOARD;
      let nameOfPlayer = user.firstName;
      if (reset && !nameOfPlayer) {
        nameOfPlayer = gameState?.[myPlayerId]?.name;
      }
      const docRef = await addDoc(connect4Collection, {
        createdAt: new Date(),
        playerOne: {
          score: 0,
          id: user.id,
          // moves: { 1: [], 2: [] },
          name: nameOfPlayer,
        },
        playerTwo: { score: 0,
          id: "", 
          // moves: { 1: [], 2: [] }, 
          name: "" },
        result: [],
        winner: null,
        board: JSON.stringify(boardMatrix),
        currentActivePlayer: "playerOne",
        currentActiveMove: 1,
        activeSound: null,
        ...(reset && !gameState.pvpGame && gameState?.chatId
          ? { chatId: gameState?.chatId }
          : {}),
        ...(reset && gameState?.pvpGame ? { pvpGame: true } : {}),
        ...(reset && (gameState?.pvpGame || gameState?.inviteGame || gameState?.isRematch) ? { isRematch: true } : {})
      });
      if (reset) {
        const gameRef = doc(connect4Collection, gameId);
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
      const gameRef = doc(connect4Collection, gameId);
      const game = await getDoc(gameRef);
      if (game.exists()) {
        const data = game.data();
        await setDoc(doc(connect4Collection, gameId), {
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
    const connect4Collection = collection(db, 'connect4');
    const gameRef = doc(connect4Collection, gameId); 
    
    const boardMatrix = BOARD;
      
      const childCollection = collection(db, 'children');
      const playerTwoRef = doc(childCollection, playerTwo);
      const playerTwoDoc = await getDoc(playerTwoRef);
      const playerTwoData = playerTwoDoc.data();
      const playerTwoName = playerTwoData?.firstName;
       await setDoc(gameRef, {
        isGameStarted: true,
        createdAt: new Date(),
        gameStartedAt: new Date(),
        playerOne: {
          score: 0,
          id: user.id,
          // moves: { 1: [], 2: [] },
          name: user.firstName,
        },
        playerTwo: { score: 0,
          id: playerTwo,
          name: playerTwoName,
        },
        result: [],
        winner: null,
        board: JSON.stringify(boardMatrix),
        currentActivePlayer: "playerOne",
        currentActiveMove: 1,
        activeSound: null,
        pvpGame: true,
      })
    const openMatchesCollection = collection(db, 'openMatches');
    const openMatchRef = doc(openMatchesCollection, oneOnOneID);
    await setDoc(openMatchRef, {
      gameStarted: true,
    }, { merge: true });
    setSearchParams({ ...searchParams, gameId: gameRef.id });
    setComputerGameLoading(true);
  }

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
    const connect4Collection = collection(db, "connect4");
    const gameRef = doc(connect4Collection, finalGameId);
    const ogGameRef = doc(connect4Collection, gameId);

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
            // moves: { 1: [], 2: [] },
            name:
              user.firstName ??
              trimmedName ??
              gameState?.playerTwo?.name ??
              "Anonymous",
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
    const connect4Collection = collection(db, "connect4");
    const gameRef = doc(connect4Collection, gameId);
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
        navigate(CONNECT_4_ROUTE);
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
        const connect4Collection = collection(db, "connect4");
        const gameRef = doc(connect4Collection, gameId);
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
       }, 3000);
      
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
      gamesPlayed = data?.arenaGames?.connect4?.[currentDateInDDMMYYYY] ?? 1;
    }
    //update the doc
    setDoc(
      docRef,
      {
        arenaGames: {
          connect4: {
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
      const connect4Collection = collection(db, "connect4");
      const gameRef = doc(connect4Collection, gameId);
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
      navigate(CONNECT_4_ROUTE);
    } else {
      window.location.replace(`/login?redirect=${CONNECT_4_ROUTE}`);
    }
    //set the game doc that current player exited the game.
  };

  const playAudioClip = (clip) => {
    // const audioElRef = new Audio(clip); // Create a new Audio element
    // audioElRef.play();
  };

  const checkForWin = (_board) => {
    let showWinningStars = [];
    // Check for horizontal wins
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        if (
          _board[row][col] !== 0 &&
          _board[row][col] === _board[row][col + 1] &&
          _board[row][col] === _board[row][col + 2] &&
          _board[row][col] === _board[row][col + 3]
        ) {
          showWinningStars = [
            `${row}${col}`,
            `${row}${col + 1}`,
            `${row}${col + 2}`,
            `${row}${col + 3}`,
          ];
          return { isWon: true, player: _board[row][col], showWinningStars };
        }
      }
    }

    // Check for vertical wins
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row < 3; row++) {
        if (
          _board[row][col] !== 0 &&
          _board[row][col] === _board[row + 1][col] &&
          _board[row][col] === _board[row + 2][col] &&
          _board[row][col] === _board[row + 3][col]
        ) {
          showWinningStars = [`${row}${col}`, `${row + 1}${col}`, `${row + 2}${col}`, `${row + 3}${col}`];
          return { isWon: true, player: _board[row][col], showWinningStars };
        }
      }
    }

    // Check for diagonal wins (top-left to bottom-right)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        if (
          _board[row][col] !== 0 &&
          _board[row][col] === _board[row + 1][col + 1] &&
          _board[row][col] === _board[row + 2][col + 2] &&
          _board[row][col] === _board[row + 3][col + 3]
        ) {
          showWinningStars = [`${row}${col}`, `${row + 1}${col + 1}`, `${row + 2}${col + 2}`, `${row + 3}${col + 3}`];
          return { isWon: true, player: _board[row][col], showWinningStars };
        }
      }
    }

    // Check for diagonal wins (top-right to bottom-left)
    for (let row = 0; row < 3; row++) {
      for (let col = 3; col < 7; col++) {
        if (
          _board[row][col] !== 0 &&
          _board[row][col] === _board[row + 1][col - 1] &&
          _board[row][col] === _board[row + 2][col - 2] &&
          _board[row][col] === _board[row + 3][col - 3]
        ) {
          showWinningStars = [`${row}${col}`, `${row + 1}${col - 1}`, `${row + 2}${col - 2}`, `${row + 3}${col - 3}`];
          return { isWon: true, player: _board[row][col], showWinningStars };
        }
      }
    }

    // Check for a tie
    let isTie = true;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (_board[row][col] === 0) {
          isTie = false;
        }
      }
    }

    return { isWon: false, isTie };
  };

  const makeMove = async (column) => {
    const connect4Collection = collection(db, "connect4");
    const gameRef = doc(connect4Collection, gameId);
    const currPlayer = gameState.currentActivePlayer;
    const board = JSON.parse(gameState.board);
    const newBoard = [...board];
    if (newBoard[0][column] !== 0) {
      console.log("Column is full. Choose another column.");
      return;
    }
    const numberOfMoves = (gameState[currPlayer].numberOfMoves ?? 0) + 1;

    // Find the first available row in the selected column
    let row = 5;
    while (newBoard[row][column] !== 0) {
      row--;
    }

    // Place the player's token in the selected row and column
    newBoard[row][column] = currPlayer === "playerOne" ? 1 : 2;
    let stateToUpdate = {
      board: JSON.stringify(newBoard),
      [currPlayer]: {
        ...gameState[currPlayer],
        numberOfMoves,
      },
      clickedCircles: [
        ...(gameState?.clickedCircles ?? []),
        {
          row,
          column,
        },
      ],
      animateCircles: [
        ...(gameState?.animateCircles ?? []),
        {
          row,
          column,
        },
      ],
    };
    const checkWinner = checkForWin(newBoard);
    if (checkWinner.isWon) {
      stateToUpdate = {
        ...stateToUpdate,
        winner: currPlayer,
        gameEndedAt: new Date(),
        activeSound: "/Assets/Sounds/MemoryCards/correct.mp3",
        showWinningStars: checkWinner.showWinningStars,
      };
      
    } else if (checkWinner.isTie) {
      stateToUpdate = {
        ...stateToUpdate,
        winner: "Tied",
        gameEndedAt: new Date(),
        activeSound: "/Assets/Sounds/MemoryCards/correct.mp3",
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
          const level = gameState.difficulty;
          let currlevel = GAME_DIFFICULTY.EASY;

          if(level === "EASY")currlevel = GAME_DIFFICULTY.EASY;
          else if(level === "MEDIUM")currlevel = GAME_DIFFICULTY.MEDIUM
          else currlevel = GAME_DIFFICULTY.HARD

          const currentboard = JSON.parse(gameState.board);
          const column = get_next_move(currentboard,currlevel);
          makeMove(column);
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const handleClick = (column, userClicked = false) => {
    const currActivePlayer = gameState?.[gameState.currentActivePlayer];
    if (currActivePlayer.id === AI_COMPUTER_ID || currActivePlayer.id !== user.id) {
      return;
    }
    // const moveNotAllowed =
    //   currActivePlayer.moves[1].length === 2 &&
    //   currActivePlayer.moves[2].length === 2;

    // if (gameState?.isComputerGame && moveNotAllowed) {
    //   return;
    // }

    // if (
    //   (currActivePlayer.id === AI_COMPUTER_ID && userClicked) ||
    //   (!gameState?.isComputerGame &&
    //     (currActivePlayer.id !== user.id || moveNotAllowed))
    // ) {
    //   return;
    // }
    // let tempMoves = [...pastmoves];
    // if (tempMoves.length === 6) {
    //   tempMoves.pop();
    // }
    // tempMoves.unshift(position);
    // setPastmoves(tempMoves);
    makeMove(column);
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
      `/login?redirect=${CONNECT_4_ROUTE}?gameId=${gameId}`
    );
  };

  const signInAnonymously = async () => {
    await signInAnonymouslyWithFirebase();
  };

  const goBack = async() => {
    MEASURE(INSTRUMENTATION_TYPES.GO_BACK,user?.id,{gameType:gameType});
    if (gameId || gameState?.isGameStarted && !gameState?.gameExited || !gameState && computerGameLoading) {
      setExitGamePopup(true);
    } else {
      navigate(ARENA_ROUTE);
    } 
  };

  const closeDocAndExit = async() => {
    if(oneOnOneID){
      setComputerGameLoading(false);
      setExitGamePopup(false);
      const openMatchesCollection = collection(db, 'openMatches');
        //check if the match is open or not,if open then close it.
      const matchingDoc=  await getDoc(doc(openMatchesCollection, oneOnOneID))

      if(matchingDoc.exists() && matchingDoc.data().status === "open"){
        await setDoc(doc(openMatchesCollection, oneOnOneID), {
          status: "closedWithExit",
        }, { merge: true });
      }
      setOneOnOneID(null);
    }
    navigate(CONNECT_4_ROUTE);
    
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
      const gameLink = `${window.location.protocol}//${window.location.host}/${CONNECT_4_ROUTE}?gameId=${gameId}`;
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
                  const bodyText = `Hey Hey! ${gameState?.playerOne?.name} has challenged you to a game of Connect 4 on Maidaan. Tap the link and Game On!\n\n${gameLink}`;
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
              MEASURE(INSTRUMENTATION_TYPES.CHALLENGE_FRIEND,user?.id,{gameType:gameType});
              createGame("playerOne")}}
            className="h-12 px-9 w-48"
            isLoading={loading}
          >
            Challenge a friend
          </AppButton>
          <AppButton
            onClick={() => {

              MEASURE(INSTRUMENTATION_TYPES.FIND_PLAYER,user?.id,{gameType:gameType});
              if(!buttonLoading) handleFindPlayer();}
            }
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
          2 Players | Turn by Turn | 8 x 8 Grid
        </div>
        <div>
          <ul className="py-0 px-6">
            <li>Tap a column to drop a coin</li>
            <li>Place 4 of your coins in a series</li>
            <li>Vertical, Horizontal or Diagonal</li>
            <li>First person to connect 4 - wins! </li>
          </ul>
        </div>
      </div>
    );
  };

  const renderColorDotForPlayer = (player = 1) => {
    if ((player === 1 && user.id === gameState?.playerOne?.id) || (player === 2 && user.id === gameState?.playerTwo?.id)) {
      return <div className="h-4 w-4 rounded-full bg-red-500 flex-shrink-0"></div>;
    }
    return <div className="h-4 w-4 rounded-full bg-primary-yellow flex-shrink-0"></div>;
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
      const myPlayerData = gameState?.[myPlayerId];

      return (
        <div className="memory-game-board">
          <div className="flex justify-between items-center px-4 my-4 max-xs:my-0">
            <div className="text-xl flex items-center gap-2">
              {renderColorDotForPlayer(1)}
              You
            </div>
            <div>V/S</div>
            <div className="text-xl flex items-center gap-2">
              {renderColorDotForPlayer(2)}
              {gameState?.[otherPlayerId]?.name}
            </div>
          </div>
          <Board handleClick={handleClick} gameState={gameState} />
          <div className="mt-4">
            {myPlayerData?.numberOfMoves > 0 && (
              <>Number of Moves: {myPlayerData?.numberOfMoves}</>
            )}

            {!myPlayerData?.numberOfMoves &&
              gameState?.currentActivePlayer === myPlayerId && (
                <span className="max-xs:text-xs">
                  Tap a column to drop a coin, connect 4 in any direction to win
                </span>
              )}
            <div className="flex justify-center items-center text-xs mt-6 max-xs:mt-1">
              <img
                src="/Assets/Icons/megaphone.svg"
                alt="icon"
                className="h-6 w-6 flex-shrink-0"
              />
              <span className="ml-2">
                Adjust the volume on your phone to hear sounds
              </span>
            </div>
          </div>
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
          <AppButton onClick={() => {
            MEASURE(INSTRUMENTATION_TYPES.REMATCH_ACCEPTED,user?.id ,{gameType:gameType});
            handleButtonClick('yes')}} disabled={buttonClicked}>
            Yes
          </AppButton>
          <AppButton onClick={() => {
            MEASURE(INSTRUMENTATION_TYPES.REMATCH_DECLINED,user?.id ,{gameType:gameType});
            handleButtonClick('no')}} disabled={buttonClicked}>
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
        gameCollectionName="connect4"
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        hideScore
        gameId={gameId}
        gameType={gameType}
        hintText="Somya from Kolkata beat her opponent in 11 moves. Beat her score!"
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
        gameCollectionName="connect4"
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        gameId={gameId}
        handleFindPlayer={handleFindPlayer}
        hideScore
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
        gameCollectionName="connect4"
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        gameId={gameId}
        handleFindPlayer={handleFindPlayer}
        hideScore
        gameType={gameType}
        hintText="Somya from Kolkata beat her opponent in 11 moves. Beat her score!"
      />
    );
  };

  const renderExitGamePopup = () => {
    return (
      <DarkModal isOpen={exitGamePopup}>
        <div className="text-center">Are you sure you want to exit?</div>
        {gameState?.isGameStarted && !gameState.gameEndedAt && (
        <div className="text-center">You will not get any points if you leave</div>
        )}
        <div className="flex gap-4 mt-4">
          <AppButton
            onClick={() => {
              setExitYesButtonLoading(true);
              MEASURE(INSTRUMENTATION_TYPES.GAME_EXIT_YES,user?.id ,{gameType:gameType,gameCreated:gameState?true:false});
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
          <AppButton onClick={() => {
            MEASURE(INSTRUMENTATION_TYPES.GAME_EXIT_NO,user?.id ,{gameType:gameType,gameCreated:gameState?true:false});
            setExitGamePopup(false)}}>No</AppButton>
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

  const headerText = () => {
    let header = "Connect 4";
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
            <div className="text-white px-8 py-4 flex flex-col  items-center h-full">
              {/* <h1>Memory Game</h1> */}
              {renderGame()}
            </div>
          </div>
          {renderExitGamePopup()}
          {otherPlayerQuitPopup()}
          {renderOpponentLeftPopup()}
          <ToastComponent />
          {gameState?.chatId ? (
            <Chat
              gameState={gameState}
              otherPlayerId={otherPlayerId}
              handleShowReaction={setShowReaction}
            />
          ) : (
            <></>
          )}
          <div
            className={twMerge(
              "absolute bottom-[15%] left-1/2 -translate-x-1/2 bg-primary-gray-20 flex flex-col justify-center items-center text-5xl p-4",
              showReaction ? "h-fit w-fit opacity-100" : "h-0 w-0 opacity-0"
            )}
          >
            <div className="text-center text-primary-yellow text-lg mb-3">
              {gameState?.[otherPlayerId]?.name} says
            </div>
            <div className="animate-shake">{showReaction?.text}</div>
          </div>
        </>
      )}
    </Layout>
  );
}

export default Connect4;
