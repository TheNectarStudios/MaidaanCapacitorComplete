import React, { useState, useEffect, useRef, useMemo } from "react";
import Board from "./Board";
import shuffle from "../Common/shuffle";
import { db } from "../../firebase-config";
import { collection, addDoc, onSnapshot, doc, getDoc, setDoc, FieldPath,updateDoc } from "firebase/firestore";
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
import { INSTRUMENTATION_TYPES } from "../../instrumentation/types";
import { AI_COMPUTER_ID, AI_NUMBER_OF_MOVES_TO_CHECK, DAILY_LIMIT, IndianNames, IndianStates, MATRIX, MATRIX_PRO, getRandomValueFromArray } from "../../Constants/GamesArena/MemoryCards";
import { addGameDetailsToChild, calculateGameCount, getDateOfMondayWithUnderscore, getGameConfig, getTotalGamesCountFromMondayToToday, handleShare, updateChildDetailsUpdateMethod, getDateOfAllDaysFromMondayToSunday, validateAndFormatDate } from "../utils";
import { ARENA_ROUTE, MEMORY_CARDS_ROUTE, MEMORY_CARDS_PRO_ROUTE } from "../../Constants/routes";
import axios from "axios";
import { findPlayer, startPvpGame, handleVisibility, handleGameStart, handleUpdateRating } from "../../GamesArena/Common/MatchMaking";
import { getWeeklyArenaTournamentLeaderboard, sortDataPerRankOrPoints } from "../utils";
import { checkAndUpdateReferralCoins } from "../../GamesArena/Common/ReferralCoins";
import mixpanel from 'mixpanel-browser';

const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");


function MemoryCards() {
  const { user, getUserDetails, signInAnonymouslyWithFirebase, isUserLoading, logout } = useAuth();
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
  const game = searchParams.get("game");
  const gameId = searchParams.get("gameId");
  const [gameConfig, setGameConfig] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [gamePointsEndModal, setGamePointsEndModal] = useState({});
  const [messageDisplayed, setMessageDisplayed] = useState(false);
  const [gameWonByExit, setGameWonByExit] = useState(false);
  const [countUpdated, setCountUpdated] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [exitYesButtonLoading, setExitYesButtonLoading] = useState(false);
  const [docCreatedDate, setDocCreatedDate] = useState(null);
  let memoryCardsMatrix;
  let memoryCardsGameCollection;
  let backButtonUrl;
  let gameType;
  if (game == "pro") {
    memoryCardsMatrix = MATRIX_PRO;
    memoryCardsGameCollection = "memoryCardsPro";
    backButtonUrl = MEMORY_CARDS_PRO_ROUTE;
    gameType = 'memoryCardsPro';
  }
  else {
    memoryCardsMatrix = MATRIX;
    memoryCardsGameCollection = "memoryCards";
    backButtonUrl = MEMORY_CARDS_ROUTE;
    gameType = 'memoryCards';
  }

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
    const memoryCardsCollection = collection(db, memoryCardsGameCollection);
    const gameRef = doc(memoryCardsCollection, gameId);
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
    const previousMoveCard = gameBoard[previousMovePosition[0]][previousMovePosition[1]];
    const prevCardId = previousMoveCard.id;
    let i = 0;
    let j = 0;
    for (i = 0; i < gameBoard.length; i++) {
      for (j = 0; j < gameBoard[0].length; j++) {
        if ((gameBoard[i][j].id == prevCardId) && !((i == previousMovePosition[0]) && (j == previousMovePosition[1]))) {
          return [i, j];
        }
      }
    }
  }

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
    const gameResultLimit = game === "pro" ? 12 : 8;
    if (gameState.result.length < gameResultLimit) {
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
        const previousMoveCard = board[previousMovePosition[0]][previousMovePosition[1]];
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
              }
              else {
                position = findWrongPosition(board);
              }
              break;
            case 2:
              random = Math.floor(Math.random() * 100) + 1;
              if (random >= 100 - 60) {
                position = findCorrectPosition(board);
              }
              else {
                position = findWrongPosition(board);
              }
              break;
            case 3:
              random = Math.floor(Math.random() * 100) + 1;
              if (random >= 100 - 20) {
                position = findCorrectPosition(board);
              }
              else {
                position = findWrongPosition(board);
              }
              break;
          }
        }
        else {
          position = findRandomPosition(board);
        }
      }
    }
    return position;
  }

  const findWrongPosition = (board) => {
    const currPlayer = gameState.currentActivePlayer;
    const previousMovePosition = gameState[currPlayer].moves[1];
    const gameBoard = JSON.parse(gameState.board);
    const previousMoveCard = gameBoard[previousMovePosition[0]][previousMovePosition[1]];
    const prevCardId = previousMoveCard.id;
    let unmatchedCardFound = false;
    let randomPosition;
    while (!unmatchedCardFound) {
      randomPosition = findRandomPosition(board);
      if (gameState.result.length <= 13) {
        unmatchedCardFound = (gameBoard[randomPosition[0]][randomPosition[1]].id != prevCardId);
      }
      else {
        unmatchedCardFound = true;
      }
    }
    return randomPosition;
  }



  const findRandomPosition = (board) => {
    // write this function recursively to find a random position
    // which is not already selected
    const boardLength = board.length;
    const position = [
      Math.floor(Math.random() * boardLength),
      Math.floor(Math.random() * board[0].length),
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


    const memoryCardsCollection = collection(db, memoryCardsGameCollection);
    const unsubscribe = onSnapshot(doc(memoryCardsCollection, gameId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data?.activeSound) {
          playAudioClip(data.activeSound);
        }
        setGameState(data);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, user]);


  const gameCount = useMemo(() => {
    return calculateGameCount(user, currentDateInDDMMYYYY);
  }, [user]);


  useEffect(() => {
    const unsubscribe = handleGameStart(oneOnOneID, createGame, AI_COMPUTER_ID, startPvpGame, user, setLoading, searchParams, setSearchParams, setComputerGameLoading, db, setComputerGameMessage, docCreatedDate, game);
    return unsubscribe;
  }, [oneOnOneID]);

  //create useeffect to chceck player one 

  useEffect(() => {
    const unsubscribe = handleVisibility(oneOnOneID, gameState, setComputerGameLoading, setLoading, setOneOnOneID, db, quitGame);
    return unsubscribe;
  }, [document.visibilityState, oneOnOneID, gameState]);

  const handleLogout = async () => {
    await logout();
    window.location.replace(`/login?redirect=${MEMORY_CARDS_ROUTE}`);
  };

  const checkUserGameLimit = async (gameStart = false) => {
    const childrenCollection = collection(db, "children");
    const childRef = doc(childrenCollection, user.id);
    const child = await getDoc(childRef);
    if (child.exists()) {
      const data = child.data();
      const gameCount = data?.arenaGames?.[gameType]?.[currentDateInDDMMYYYY] ?? 0;
      const totalGameCount = calculateGameCount(
        data,
        currentDateInDDMMYYYY
      );
      if (totalGameCount >= DAILY_LIMIT) {
        showToast("You have exceeded your daily game limit", "error");
        return true;
      } else if (gameStart) {
        const newGameCount = gameCount + 1;
        const fieldPath = new FieldPath(
          "arenaGames",
          memoryCardsGameCollection,
          currentDateInDDMMYYYY
        );
        await updateDoc(childRef, fieldPath, newGameCount);
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
          gamesPlayed: leaderboardChildData?.gamesPlayed ? leaderboardChildData?.gamesPlayed + 1 : 1,
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
        const otherChildGameCount = otherChildData?.arenaGames?.[gameType]?.[currentDateInDDMMYYYY] ?? 0;
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
          const newGameCount = otherChildGameCount + 1;
          const fieldPath = new FieldPath(
            "arenaGames",
            memoryCardsGameCollection,
            currentDateInDDMMYYYY
          );
          await updateDoc(otherChildRef, fieldPath, newGameCount);
          
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
            gamesPlayed: leaderboardChildData?.gamesPlayed ? leaderboardChildData?.gamesPlayed + 1 : 1,
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
    findPlayer(user, gameType, setOneOnOneID, searchParams, setSearchParams, db, setComputerGameLoading, setLoading, setComputerGameMessage, checkUserGameLimit, setDocCreatedDate, game);
    setButtonLoading(false);
  };

  const createGame = async (player = 'playerOne', reset = false) => {
    if (!user || (user && !user.createdAt && !reset)) {
      window.location.replace(`/login?redirect=${backButtonUrl}`);
      return;
    }

    const isGameLimitExceeded = await checkUserGameLimit(player === 'computer');
    if (isGameLimitExceeded) {
      return;
    }

    setLoading(true);
    setGameWon(false);
    setGameLost(false);
    setGameTied(false);
    setPastmoves([]);
    let memoryCardsCollection;
    memoryCardsCollection = collection(db, memoryCardsGameCollection);


    if (player === 'computer') {
      setComputerGameLoading(true);
      const boardMatrix = shuffle(memoryCardsMatrix);
      const randomName = getRandomValueFromArray(IndianNames);
      const randomState = getRandomValueFromArray(IndianStates);
      const docRef = await addDoc(memoryCardsCollection, {
        createdAt: new Date(),
        playerOne: {
          score: 0,
          id: user.id,
          moves: { 1: [], 2: [] },
          name: user.firstName,
        },
        playerTwo: {
          score: 0,
          id: AI_COMPUTER_ID,
          moves: { 1: [], 2: [] },
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
      });
      if (reset) {
        const gameRef = doc(memoryCardsCollection, gameId);
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
      setSearchParams({ ...searchParams, gameId: docRef.id, game: game === "pro" ? "pro" : "" });
      setLoading(false);
      setTimeout(() => {
        setComputerGameLoading(false);
        setComputerGameMessage(
          `You are playing against ${randomName} from ${randomState}`
        );
      }, 3000);
      setTimeout(() => {
        setComputerGameMessage("");
      }
        , 5000);
      return;
    }

    if (((player === 'playerOne' && !gameId) || (gameId && gameState?.rematchDeclined)) || reset) {
      const boardMatrix = shuffle(memoryCardsMatrix);
      let nameOfPlayer = user.firstName;
      if (reset && !nameOfPlayer) {
        nameOfPlayer = gameState?.[myPlayerId]?.name;
      };
      const docRef = await addDoc(memoryCardsCollection, {
        createdAt: new Date(),
        playerOne: {
          score: 0,
          id: user.id,
          moves: { 1: [], 2: [] },
          name: nameOfPlayer,
        },
        playerTwo: { score: 0, id: "", moves: { 1: [], 2: [] }, name: "" },
        result: [],
        winner: null,
        board: JSON.stringify(boardMatrix),
        currentActivePlayer: "playerOne",
        currentActiveMove: 1,
        activeSound: null,
        ...(reset && !gameState.pvpGame && gameState?.chatId ? { chatId: gameState?.chatId } : {}),
        ...(reset && (gameState?.pvpGame || gameState?.inviteGame || gameState?.isRematch) ? { isRematch: true } : {}),
        ...(reset && gameState?.inviteGame ? { inviteGame: true } : {}),
      });
      if (reset) {
        const gameRef = doc(memoryCardsCollection, gameId);
        setDoc(
          gameRef,
          {
            ...gameState,
            rematchGameId: docRef.id,
            rematchStartedBy: user.id,
            activeSound: null
          },
          { merge: true }
        );
      } else {
        setSearchParams({ ...searchParams, gameId: docRef.id, game: game === "pro" ? "pro" : "" });
      }
      setLoading(false);
      return;
    }
    if (player === 'playerTwo') {

      const gameRef = doc(memoryCardsCollection, gameId);
      const game = await getDoc(gameRef);
      if (game.exists()) {
        const data = game.data();
        await setDoc(doc(memoryCardsCollection, gameId), {
          ...data,
          playerTwo: {
            score: 0,
            id: user.id,
            moves: { 1: [], 2: [] },
            name: user.firstName,
          },
        });
      }
      setLoading(false);
      return;
    }
  }

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
      setSearchParams({ ...searchParams, gameId: gameState?.rematchGameId, game: game === "pro" ? "pro" : "" });
    }
    let memoryCardsCollection;
    memoryCardsCollection = collection(db, memoryCardsGameCollection);
    const gameRef = doc(memoryCardsCollection, finalGameId);
    const ogGameRef = doc(memoryCardsCollection, gameId);

    if (rematchAccepted) {
      setDoc(ogGameRef, {
        ...gameState,
        rematchAccepted,
      }, { merge: true });
    }

    // get gameRef data
    const gameDoc = await getDoc(gameRef);
    if (gameDoc.exists()) {
      const data = gameDoc.data();
      // add a new document to the chats collection
      const chatsCollection = collection(db, "chats");
      const chatRef = doc(chatsCollection);
      const chatId = chatRef.id;
      if (!gameState?.pvpGame) {
        await setDoc(chatRef, { messages: [], createdAt: new Date(), members: [user.id, data.playerOne.id], status: "active" });
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
            moves: { 1: [], 2: [] },
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
    const memoryCardsCollection = collection(db, memoryCardsGameCollection);
    const gameRef = doc(memoryCardsCollection, gameId);
    const game = await getDoc(gameRef);
    if (game.exists()) {
      const data = game.data();
      setDoc(
        gameRef,
        {
          ...data,
          ...(gameState?.rematchGameId ? { rematchDeclined: true } : { invitationDeclined: true }),
          activeSound: null,
        },
        { merge: true }
      );
    }
    setTimeout(() => {
      if (!user.createdAt) {
        handleLogout();
      } else {
        navigate(backButtonUrl);
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
        setSearchParams({ ...searchParams, gameId: gameState?.rematchGameId, game: game === "pro" ? "pro" : "" });
      }
      return;
    };
    const gameBoard = JSON.parse(gameState.board);
    const playerOneOrTwo = gameState?.playerOne.id === user?.id ? "playerOne" : "playerTwo"
    const currentPlayer = gameState?.[playerOneOrTwo];
    if ((!currentPlayer?.pointsAwarded && (gameState.result.length === (memoryCardsMatrix?.length * memoryCardsMatrix[0]?.length) / 2)) || (gameState.gameExited !== user?.id && gameState.gameWonByExit && !currentPlayer?.pointsAwarded)) {
      let winner;
      let isTied = false;
      let currentActivePlayer;
      let otherPlayer;
      let stateToUpdate;
      const memoryCardsCollection = collection(db, memoryCardsGameCollection);
      const gameRef = doc(memoryCardsCollection, gameId);
      if (!gameState.gameWonByExit) {

        currentActivePlayer = gameState.currentActivePlayer;
        otherPlayer =
          currentActivePlayer === "playerOne" ? "playerTwo" : "playerOne";
        isTied =
          gameState[currentActivePlayer].score === gameState[otherPlayer].score;
        winner = isTied
          ? "Tied"
          : gameState[currentActivePlayer].score > gameState[otherPlayer].score
            ? currentActivePlayer
            : otherPlayer;

        /* stateToUpdate = {
          winner: winner,
          gameEndedAt: new Date(),
          activeSound: "/Assets/Sounds/MemoryCards/gameEnd.mp3",
        };
        await setDoc(gameRef, stateToUpdate, { merge: true });*/

        if (playerOneOrTwo === "playerOne") {
          stateToUpdate = {
            playerOne: {
              "pointsAwarded": true,
            },
            winner: winner,
            gameEndedAt: new Date(),
            activeSound: "/Assets/Sounds/MemoryCards/gameEnd.mp3",

          }
        } else {
          stateToUpdate = {
            playerTwo: {
              "pointsAwarded": true,
            },
            winner: winner,
            gameEndedAt: new Date(),
            activeSound: "/Assets/Sounds/MemoryCards/gameEnd.mp3",

          }
        };

        await setDoc(gameRef, stateToUpdate, { merge: true });
      }
      else {
        winner = gameState.winner;
        if (playerOneOrTwo === "playerOne") {
          stateToUpdate = {
            playerOne: {
              "pointsAwarded": true,
            },
            gameEndedAt: new Date(),
            activeSound: "/Assets/Sounds/MemoryCards/gameEnd.mp3",

          }
        } else {
          stateToUpdate = {
            playerTwo: {
              "pointsAwarded": true,
            },
            gameEndedAt: new Date(),
            activeSound: "/Assets/Sounds/MemoryCards/gameEnd.mp3",

          }
        };

        await setDoc(gameRef, stateToUpdate, { merge: true });
      }
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
        const todaysGameCount = calculateGameCount(userData, currentDateInDDMMYYYY);

        const currentDate = new Date();
        const currentDayOfWeek = (currentDate.getDay() === 0) ? 7 : currentDate.getDay();


        if (todaysGameCount === DAILY_LIMIT) {
          disciplinePoints += (gameConfig?.allPlayedStreakPointsMap?.[1] ?? 0);
        }
        if (totalGamesCount / DAILY_LIMIT === currentDayOfWeek && currentDayOfWeek != 1) {
          disciplinePoints += (gameConfig?.allPlayedStreakPointsMap?.[currentDayOfWeek] ?? 0);
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
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]?.played ?? 0) + playedPoints,
          won:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]?.won ?? 0) + wonPoints,
          discipline:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]?.discipline ?? 0) + disciplinePoints,
          total:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]?.total ?? 0) +
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
          addGameDetailsToChild(user.id, gameId, {
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
            pointsWon: (leaderboardChildData?.pointsWon ?? 0) + playedPoints + wonPoints + disciplinePoints,
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
      if (isTied) {
        setGameTied(true);
      } else {
        if (winner === myPlayerId) {
          setGameWon(true);
        } else {
          setGameLost(true);
        }
      }

      handleUpdateRating(winner, currentActivePlayer, gameType, gameState, otherPlayer);
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
      createGame('playerOne', true);
    }
  };

  const getLeaderboardAndUpdatedGameCounts = async (userID) => {
    const mondayDate = getDateOfMondayWithUnderscore();
    const collectionRef = collection(db, "weeklyArenaTournaments/" + mondayDate + "/leaderboard");
    //get  userid doc
    const docRef = doc(collectionRef, userID);
    const docSnap = await getDoc(docRef);
    let newGamesPlayed = 0;
    if (docSnap.exists()) {
      const data = docSnap.data();
      newGamesPlayed = data?.gamesPlayed ? data?.gamesPlayed - 1 : 0;
    }
    //update the doc
    setDoc(docRef, {
      gamesPlayed: newGamesPlayed,
    }, { merge: true });

  }

  const getChildAndUpdateGameCount = async (userID) => {
    const collectionRef = collection(db, "children");
    //get  userid doc
    const docRef = doc(collectionRef, userID);
    const docSnap = await getDoc(docRef);
    let gamesPlayed = 0;
    if (docSnap.exists()) {
      const data = docSnap.data();
      gamesPlayed = data?.arenaGames?.[gameType]?.[currentDateInDDMMYYYY] ?? 1;
    }
    const testField = docSnap.data()?.testField
    //update the doc
    const newGameCount = gamesPlayed - 1;
    const fieldPath = new FieldPath(
      "arenaGames",
      memoryCardsGameCollection,
      currentDateInDDMMYYYY
    );
    await updateDoc(docRef, fieldPath, newGameCount);
  }


  const quitGame = async () => {

    if (gameId && user.createdAt) {
      setExitGamePopup(false);
      setQuitGamePopup(false);
      const numberOfMovesOfCurrentPlayer = gameState?.[gameState?.playerOne.id === user?.id ? "playerOne" : "playerTwo"]?.numberOfMoves ?? 0;
      const playerOne = gameState?.playerOne;
      const memoryCardsCollection = collection(db, memoryCardsGameCollection);
      const gameRef = doc(memoryCardsCollection, gameId);
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
        }
        else {
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
      navigate(backButtonUrl);

    } else if (!user.createdAt) {
      window.location.replace(`/login?redirect=${backButtonUrl}`);
    }
    //set the game doc that current player exited the game.

  };

  const checkAnswer = (currPlayer, currPosition) => {
    const previousMovePosition = gameState[currPlayer].moves[1];
    const gameBoard = JSON.parse(gameState.board);
    const previousMoveCard = gameBoard[previousMovePosition[0]][previousMovePosition[1]];
    const currentMoveCard = gameBoard[currPosition[0]][currPosition[1]];
    return {
      found: previousMoveCard.id === currentMoveCard.id,
      id: currentMoveCard.id,
    };
  };

  const playAudioClip = (clip) => {
    const audioElRef = new Audio(clip); // Create a new Audio element
    audioElRef.play();
  };

  const makeMove = async (position) => {
    const memoryCardsCollection = collection(db, memoryCardsGameCollection);
    const gameRef = doc(memoryCardsCollection, gameId);
    const currPlayer = gameState.currentActivePlayer;
    const currMove = gameState.currentActiveMove;
    let ansFound = null;
    let numberOfMoves = gameState[currPlayer].numberOfMoves ?? 0;
    if (currMove === 2) {
      ansFound = checkAnswer(currPlayer, position);
      numberOfMoves += 1;
    }
    let stateToUpdate = {
      ...gameState,
      [currPlayer]: {
        ...gameState[currPlayer],
        moves: {
          ...gameState[currPlayer].moves,
          [currMove]: position,
        },
        numberOfMoves,
      },
      currentActiveMove: currMove === 1 ? 2 : 1,
      activeSound: "/Assets/Sounds/MemoryCards/singleMove.mp3",
    };
    if (ansFound?.found) {
      stateToUpdate = {
        ...gameState,
        [currPlayer]: {
          ...gameState[currPlayer],
          moves: {
            1: [],
            2: [],
          },
          score: gameState[currPlayer].score + 1,
          numberOfMoves,
        },
        currentActiveMove: 1,
        result: [...gameState.result, ansFound.id],
        activeSound: "/Assets/Sounds/MemoryCards/correct.mp3",
      };
    }
    setDoc(
      gameRef,
      stateToUpdate,
      { merge: true }
    );
  };

  useEffect(() => {

    if (gameState) {
      checkGameState();
      const currPlayer = gameState.currentActivePlayer;
      const currentPlayerState = gameState?.[currPlayer];
      const movesArray = Object.values(currentPlayerState?.moves);
      if (gameState.isComputerGame && currPlayer === "playerTwo" && !gameState.gameEndedAt) {
        setTimeout(() => {
          if (movesArray.flat().length === 4) {
            return;
          }
          let position = getCurrentPosition(currentPlayerState, gameState);
          handleClick(null, position);
        }, 2000);
      }
      if (movesArray.flat().length === 4) {
        setTimeout(() => {
          // if (currMove === 2) {
          const memoryCardsCollection = collection(db, memoryCardsGameCollection);
          const gameRef = doc(memoryCardsCollection, gameId);
          setDoc(
            gameRef,
            {
              [currPlayer]: {
                moves: {
                  1: [],
                  2: [],
                },
              },
              currentActivePlayer:
                currPlayer === "playerOne" ? "playerTwo" : "playerOne",
              activeSound: null,
            },
            { merge: true }
          );
          // }
        }, 1500);
      }
      if (gameState?.gameExited && gameState?.gameExited !== user.id && !gameState?.winner) {

        getChildAndUpdateGameCount(user?.id);
        getLeaderboardAndUpdatedGameCounts(user?.id);
        setQuitGamePopup(true);
        //show a popup that the other player has exited the game with two options to go back or find another player.
      }
      else if ((gameState?.gameExited && gameState?.gameExited !== user.id) || (gameState?.isComputerGame && gameState?.gameEndedAt && !opponentLeftPopup && gameState?.gameExited !== user.id)) {


        let timeout = gameState.isComputerGame ? 2000 : 0;
        setTimeout(() => {
          setOpponentLeftPopup(true);
        }, timeout);
        setTimeout(() => {
          setOpponentLeftPopup(false);
        }, 4000 + timeout);
        setExitGamePopup(false);
      }

      if (gameState?.createdAt && !gameState?.winner && !gameState?.gameExited && gameState?.playerOne?.id === user?.id && !gameState?.isComputerGame && gameState?.playerTwo?.id && !gameState?.playerTwo?.numberOfMoves && !gameState?.playerOne?.numberOfMoves && !messageDisplayed && !gameState?.isRematch && !gameState?.inviteGame) {


        async function getComputerGameMessage() {
          const playerTwoId = gameState?.playerTwo?.id;

          const ref = doc(db, "children", playerTwoId);
          const docSnap = await getDoc(ref);
          const playerTwoData = docSnap.data();
          const playerTwoName = playerTwoData?.firstName ?? "Anonymous";
          const playerTwoCity = playerTwoData?.city ?? "India";
          return { playerTwoName, playerTwoCity };
        }

        let playerTwoName;
        let playerTwoCity;
        async function fetchPlayerData() {
          try {
            const { playerTwoName, playerTwoCity } = await getComputerGameMessage();
            if (playerTwoName !== "Anonymous") {
              setTimeout(() => {
                setComputerGameLoading(false);
                setComputerGameMessage(`You are playing against ${playerTwoName} from ${playerTwoCity}`);
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
        setMessageDisplayed(true);
        checkUserGameLimit(true);
        setLoading(false);
        fetchPlayerData();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);


  const handleClick = (e, position, userClicked = false) => {
    const currActivePlayer = gameState?.[gameState.currentActivePlayer];
    const moveNotAllowed =
      currActivePlayer.moves[1].length === 2 &&
      currActivePlayer.moves[2].length === 2;

    if (gameState?.isComputerGame && moveNotAllowed) {
      return;
    }

    if (
      (currActivePlayer.id === AI_COMPUTER_ID && userClicked) ||
      (!gameState?.isComputerGame && (currActivePlayer.id !== user.id ||
        moveNotAllowed))
    ) {
      return;
    }
    let tempMoves = [...pastmoves];
    if (tempMoves.length === 6) {
      tempMoves.pop();
    }
    tempMoves.unshift(position);
    setPastmoves(tempMoves);
    makeMove(position);
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
      `/login?redirect=/${backButtonUrl}?gameId=${gameId}`
    );
  };

  const signInAnonymously = async () => {
    await signInAnonymouslyWithFirebase();
  }

  /*const goBack = async() => {
    if (gameId || gameState?.isGameStarted && !gameState?.gameExited) {
      setExitGamePopup(true);
    } else {
      if(oneOnOneID){
      const openMatchesCollection = collection(db, 'openMatches');
        //check if the match is open or not,if open then close it.
      const matchingDoc=  await getDoc(doc(openMatchesCollection, oneOnOneID))
      if(matchingDoc.exists() && matchingDoc.data().status === "open"){
       await setDoc(doc(openMatchesCollection, oneOnOneID), {
        status: "closedWithExit",
      }, { merge: true });
    }
    }
      navigate(ARENA_ROUTE);
    }
  };*/

  const goBack = async () => {
    MEASURE(INSTRUMENTATION_TYPES.GO_BACK, user?.id, { gameType: gameType });
    if (gameId || gameState?.isGameStarted && !gameState?.gameExited || !gameState && computerGameLoading) {
      setExitGamePopup(true);
    } else {
      navigate(ARENA_ROUTE);
    }
  };

  const closeDocAndExit = async () => {
    if (oneOnOneID) {
      setComputerGameLoading(false);
      setExitGamePopup(false);
      const openMatchesCollection = collection(db, 'openMatches');
      //check if the match is open or not,if open then close it.
      const matchingDoc = await getDoc(doc(openMatchesCollection, oneOnOneID))

      if (matchingDoc.exists() && matchingDoc.data().status === "open") {
        await setDoc(doc(openMatchesCollection, oneOnOneID), {
          status: "closedWithExit",
        }, { merge: true });
      }
      setOneOnOneID(null);
    }

    navigate(backButtonUrl);
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
      let gameLink;
      if (game === "pro") {
        gameLink = `${window.location.protocol}//${window.location.host}/${MEMORY_CARDS_PRO_ROUTE}&gameId=${gameId}`;
      } else {
        gameLink = `${window.location.protocol}//${window.location.host}/${MEMORY_CARDS_ROUTE}?gameId=${gameId}`;
      }
      if (gameState?.rematchGameId && gameState?.rematchStartedBy !== user?.id) {
        return renderRematchScreen();
      }
      if ((!gameState?.playerTwo?.id && gameState?.playerOne?.id !== user?.id)) {

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
                  const bodyText = `Hey Hey! ${gameState?.playerOne?.name} has challenged you to a game of Memory Cards on Maidaan. Tap the link and Game On!\n\n${gameLink}`;
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
              MEASURE(INSTRUMENTATION_TYPES.CHALLENGE_FRIEND, user?.id, { gameType: gameType });
              createGame("playerOne")
            }}
            className="h-12 px-9 w-48"
            isLoading={loading}
          >
            Challenge a friend
          </AppButton>
          <AppButton
            onClick={() => {

              MEASURE(INSTRUMENTATION_TYPES.FIND_PLAYER, user?.id, { gameType: gameType });
              if (!buttonLoading) handleFindPlayer();
            }
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
          2 Players | Turn by Turn | {game === "pro" ? "6 x 4 Grid" : "4 x 4 Grid"}
        </div>
        <div>
          <ul className="py-0 px-6">
            <li>Flip 2 cards in each turn</li>
            <li>Remember the positions</li>
            <li>Find matching cards to score</li>
            <li>One who finds most pairs - wins!</li>
          </ul>
        </div>
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
    };
    if (user && !gameState?.playerTwo?.id && !user.firstName) {
      return renderEnterNameScreen();
    }
    const isGameStarted = gameState?.isGameStarted;
    if (gameId && isGameStarted && !gameState?.rematchGameId) {
      const myPlayerData = gameState?.[myPlayerId];

      return (
        <div className="memory-game-board">
          <div className="flex justify-between items-center px-4 my-4 max-xs:my-0">
            <div className="text-xl">
              You:{" "}
              <span className="text-primary-yellow">{myPlayerData?.score}</span>
            </div>
            <div className="text-xl">
              {gameState?.[otherPlayerId]?.name}:{" "}
              <span className="text-primary-yellow">
                {gameState?.[otherPlayerId]?.score}
              </span>
            </div>
          </div>
          <Board handleClick={handleClick} gameState={gameState} game={game} />
          <div className="mt-4">
            {myPlayerData?.numberOfMoves > 0 && (
              <>Number of Moves: {myPlayerData?.numberOfMoves}</>
            )}

            {!myPlayerData?.numberOfMoves &&
              gameState?.currentActivePlayer === myPlayerId && (
                <span className="max-xs:text-xs">
                  Tap 2 cards and remember their position, match cards to score
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
        <AppButton onClick={startGame} className="h-12 px-9" isLoading={loading}>
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
            MEASURE(INSTRUMENTATION_TYPES.REMATCH_ACCEPTED, user?.id, { gameType: gameType });
            handleButtonClick('yes')
          }} disabled={buttonClicked}>
            Yes
          </AppButton>
          <AppButton onClick={() => {
            MEASURE(INSTRUMENTATION_TYPES.REMATCH_DECLINED, user?.id, { gameType: gameType });
            handleButtonClick('no')
          }} disabled={buttonClicked}>
            No
          </AppButton>
        </div>
      </div>
    );
  };

  const renderEnterNameScreen = () => {
    const isAllowed = anonymousName && anonymousName.length > 2 && anonymousName.length <= 12;
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
        <AppButton onClick={loginToMaidaan} className="mb-10 w-48" variant="secondary">
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
        gameCollectionName={memoryCardsGameCollection}
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        gameId={gameId}
        gameType={gameType}
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
        title={gameState.gameExited ? "You win By Walkover" : "Victory is Yours!"}
        isGameLost={false}
        gameCollectionName={memoryCardsGameCollection}
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        gameId={gameId}
        gameType={gameType}
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
        gameCollectionName={memoryCardsGameCollection}
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        gameId={gameId}
        gameType={gameType}
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
              MEASURE(INSTRUMENTATION_TYPES.GAME_EXIT_YES, user?.id, { gameType: gameType, gameCreated: gameState ? true : false });
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
            MEASURE(INSTRUMENTATION_TYPES.GAME_EXIT_NO, user?.id, { gameType: gameType, gameCreated: gameState ? true : false });
            setExitGamePopup(false)
          }}>No</AppButton>
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
          <AppButton onClick={handleFindPlayer}
          >Find Another Player</AppButton>
          <AppButton onClick={quitGame}>Go Back</AppButton>
        </div>
      </DarkModal>
    );
  };

  const renderHeader = () => {
    let header = "MEMORY CARD GAME";
    if (!computerGameLoading) {
      if (gameState?.gameEndedAt) {
        header = "Game Over";
      } else if (gameState?.isGameStarted) {
        header = "Your Turn";
        if (gameState?.currentActivePlayer !== myPlayerId) {
          header = `${gameState?.[otherPlayerId].name}'s Turn`;
        }
      }
    }
    return (
      <div className="text-primary-yellow text-center font-bold text-2xl bg-primary-gray-20 py-4 max-xs:py-2 relative max-xs:text-xl">
        <BackButton onClick={goBack} />
        {header}
      </div>
    );
  };

  const headerText = () => {
    let header = "Memory Cards";
    if (game === "pro") {
      header = "Memory Cards Pro";
    }
    if (!gameState?.gameEndedAt && gameState?.isGameStarted && !gameState?.gameExited) {
      header = "Your Turn";
      if (gameState?.currentActivePlayer !== myPlayerId) {
        header = `${gameState?.[otherPlayerId].name}'s Turn`;
      }
    }
    return header;
  }
  return (
    <Layout>
      {isUserLoading ? (
        <div className="w-full h-full flex justify-center items-center">
          <GameLoader message="Setting up the arena" />
        </div>
      ) : (
        <>
          <div className="flex flex-col h-full w-full relative">
            {<ArenaHeader
              goBack={goBack}
              headerText={headerText()}
              coins={myPlayerLeaderboardData?.coins ?? 0}
              pointsWon={myPlayerLeaderboardData?.pointsWon ?? 0}
              gamesPlayed={myPlayerLeaderboardData?.gamesPlayed ?? 0}
            />}
            <div className="text-white px-8 py-4 flex flex-col  items-center h-full">
              {/* <h1>Memory Game</h1> */}
              {renderGame()}
            </div>
          </div>
          {renderExitGamePopup()}
          {otherPlayerQuitPopup()}
          {renderOpponentLeftPopup()}
          <ToastComponent />
          {gameState?.chatId && !!gameState?.gameEndedAt ? (
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

export default MemoryCards;
