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
import { ARENA_ROUTE, ARCHERY_ROUTE } from "../../Constants/routes";
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
import ArcheryGameCanvas from "./ArcheryGameCanvas";
import { Timer } from "../../Components/Games/SpellBee/GameComponents/CountdownTimer";
import { MOVES_PER_PERSON, generateRandomTargetPosition, getRandomTargetMovementVertices } from "../../Constants/GamesArena/Archery";
import mixpanel from 'mixpanel-browser';

const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");

const botDifficultyMap = {
    EASY: 1, // number of hits
    MEDIUM: 2,
    HARD: 3,
};

function ArcheryGame() {
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
  const gameType = "archery";
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
    const archeryCollection = collection(db, "archery");
    const gameRef = doc(archeryCollection, gameId);
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

    const archeryCollection = collection(db, "archery");
    const unsubscribe = onSnapshot(
      doc(archeryCollection, gameId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data?.activeSound) {
            playAudioClip(data.activeSound);
            setTimeout(() => {
                updateGameState({ activeSound: null });
            }, 3000);
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
    window.location.replace(`/login?redirect=${ARCHERY_ROUTE}`);
  };

  const checkUserGameLimit = async (gameStart = false) => {
    const childrenCollection = collection(db, "children");
    const childRef = doc(childrenCollection, user.id);
    const child = await getDoc(childRef);
    if (child.exists()) {
      const data = child.data();
      const gameCount =
        data?.arenaGames?.archery?.[currentDateInDDMMYYYY] ?? 0;
      const totalGameCount = calculateGameCount(data, currentDateInDDMMYYYY);
      if (totalGameCount >= DAILY_LIMIT) {
        showToast("You have exceeded your daily game limit", "error");
        return true;
      } else if (gameStart) {
        await setDoc(
          childRef,
          {
            arenaGames: {
              archery: {
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
          otherChildData?.arenaGames?.archery?.[currentDateInDDMMYYYY] ?? 0;
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
                archery: {
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
    const previousGameCollection = collection(db, 'archery');
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
      window.location.replace(`/login?redirect=${ARCHERY_ROUTE}`);
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
    const archeryCollection = collection(db, "archery");

    if (player === "computer") {
      setComputerGameLoading(true);
    //   const boardMatrix = BOARD;
      const randomName = getRandomValueFromArray(IndianNames);
      const randomState = getRandomValueFromArray(IndianStates);
      const targetPosition = generateRandomTargetPosition();
      const docRef = await addDoc(archeryCollection, {
        createdAt: new Date(),
        playerOne: {
          score: 0,
          id: user.id,
          moves: [],
          name: user.firstName,
          targetPosition,
          vertices:
            getRandomTargetMovementVertices(targetPosition),
        },
        playerTwo: {
          score: 0,
          id: AI_COMPUTER_ID,
          moves: [],
          name: randomName,
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
        const gameRef = doc(archeryCollection, gameId);
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
    //   const boardMatrix = BOARD;
      let nameOfPlayer = user.firstName;
      if (reset && !nameOfPlayer) {
        nameOfPlayer = gameState?.[myPlayerId]?.name;
      }
      const targetPosition = generateRandomTargetPosition();
      const docRef = await addDoc(archeryCollection, {
        createdAt: new Date(),
        playerOne: {
          score: 0,
          id: user.id,
          moves: [],
          name: nameOfPlayer,
          targetPosition,
          vertices:
            getRandomTargetMovementVertices(targetPosition),
        },
        playerTwo: {
          score: 0,
          id: "",
          moves: [],
          name: "",
        },
        result: [],
        winner: null,
        // board: JSON.stringify(boardMatrix),
        currentActivePlayer: "playerOne",
        currentActiveMove: 1,
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
        const gameRef = doc(archeryCollection, gameId);
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
      const gameRef = doc(archeryCollection, gameId);
      const game = await getDoc(gameRef);
      if (game.exists()) {
        const data = game.data();
        await setDoc(doc(archeryCollection, gameId), {
          ...data,
          playerTwo: {
            score: 0,
            id: user.id,
            moves: [],
            name: user.firstName,
          },
        });
      }
      setLoading(false);
      return;
    }
  };

  const startPvpConnectGame = async (user,playerTwo,gameId,oneOnOneID,setLoading,searchParams,setSearchParams,setComputerGameLoading,db) => {
    const archeryCollection = collection(db, 'archery');
    const gameRef = doc(archeryCollection, gameId); 
    
    // const boardMatrix = BOARD;
      
      const childCollection = collection(db, 'children');
      const playerTwoRef = doc(childCollection, playerTwo);
      const playerTwoDoc = await getDoc(playerTwoRef);
      const playerTwoData = playerTwoDoc.data();
      const playerTwoName = playerTwoData?.firstName;
      const targetPosition = generateRandomTargetPosition();
       await setDoc(gameRef, {
         isGameStarted: true,
         createdAt: new Date(),
         gameStartedAt: new Date(),
         playerOne: {
           score: 0,
           id: user.id,
           moves: [],
           name: user.firstName,
            targetPosition,
            vertices:
              getRandomTargetMovementVertices(targetPosition),
         },
         playerTwo: {
           score: 0,
           id: playerTwo,
           name: playerTwoName,
           moves: [],
           arrowFired: false,
           arrowAngle: 0,
         },
         result: [],
         winner: null,
         // board: JSON.stringify(boardMatrix),
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
    const archeryCollection = collection(db, "archery");
    const gameRef = doc(archeryCollection, finalGameId);
    const ogGameRef = doc(archeryCollection, gameId);

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
            moves: [],
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
    const archeryCollection = collection(db, "archery");
    const gameRef = doc(archeryCollection, gameId);
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
        navigate(ARCHERY_ROUTE);
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
        const archeryCollection = collection(db, "archery");
        const gameRef = doc(archeryCollection, gameId);
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
       
      setIsGameFinished(true);

       setTimeout(() => {
        setBotMovesArray([]);
        setCurrentBotTurn(0);
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
      gamesPlayed = data?.arenaGames?.archery?.[currentDateInDDMMYYYY] ?? 1;
    }
    //update the doc
    setDoc(
      docRef,
      {
        arenaGames: {
          archery: {
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
      const archeryCollection = collection(db, "archery");
      const gameRef = doc(archeryCollection, gameId);
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
      navigate(ARCHERY_ROUTE);
    } else {
      window.location.replace(`/login?redirect=${ARCHERY_ROUTE}`);
    }
    //set the game doc that current player exited the game.
  };

  const playAudioClip = (clip) => {
    const audioElRef = new Audio(clip); // Create a new Audio element
    audioElRef.play();
  };

  const checkForWin = (_board) => {};

  const makeMove = async (column) => {}

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

  const calculateAngle = (pointA, pointB, isRandom = "") => {
    const finalBPos = { ...pointB };
    if (isRandom === "random") {
      finalBPos.x = Math.floor(pointB.x + 60);
      finalBPos.y = Math.floor(pointB.y + 50);
    }
    const dx = pointA.x - finalBPos.x;  // Invert x-coordinate to make the angle move from right to left
    const dy = pointA.y - finalBPos.y; // Invert y-coordinate to align with standard Cartesian coordinates
    let angle = Math.atan2(dy, dx); // Calculate angle in radians
    if (angle < 0) {
      angle += 2 * Math.PI; // Ensure angle is between 0 and 2 * Math.PI
    }
    angle = Math.PI - angle; // Subtract Math.PI from angle to align with the arc
    if (angle < 0) {
      // Ensure angle is between 0 and Math.PI
      angle += 2 * Math.PI;
    }
    angle = (angle * (180 / Math.PI)).toFixed(2); // Convert radians to degrees
    return angle;
  }
  
  useEffect(() => {
    if (gameState) {
      checkGameState();
      if (!gameState.showOtherPlayerAnimation) {
        setOtherPlayerMovesState(gameState[otherPlayerId]?.moves ?? []);
      }
      const currPlayer = gameState.currentActivePlayer;
      // const currentPlayerState = gameState?.[currPlayer];
      // const movesArray = Object.values(currentPlayerState?.moves);
      if (
        gameState.isComputerGame &&
        currPlayer === "playerTwo" &&
        !gameState.gameEndedAt && currentBotTurn < gameState.playerOne?.moves?.length
      ) {
        setTimeout(() => {
          let botMoves = botMovesArray;
          if (currentBotTurn === 0) {
            const level = gameState.difficulty;

            const numberOfHits = botDifficultyMap[level];
            const moves = new Array(MOVES_PER_PERSON).fill(false);

            for (let i = 0; i < numberOfHits; i++) {
              let position;
              do {
                position = Math.floor(Math.random() * 5);
              } while (moves[position]);
              moves[position] = true;
            }
            setBotMovesArray(moves);
            botMoves = moves;
          }
          const isTargetHit = botMoves[currentBotTurn];
          const playerTwo = gameState.playerTwo;
          const headImgCenterX = window.innerWidth / 2 - 30 + 63 / 2;
          const headImgCenterY =
            window.innerHeight * 0.75 - 50 - 40 + 35 / 2;
          let angle = calculateAngle(
            {
              x: headImgCenterX,
              y: headImgCenterY,
            },
            playerTwo.targetPosition,
            isTargetHit ? "" : "random"
          );
           const angleToFire = (-1 * angle).toFixed(2);
          const dataToUpdate = {
            showOtherPlayerAnimation: true,
            otherPlayerTargetPosition: playerTwo.targetPosition,
            otherPlayerAngle: (angleToFire * Math.PI) / 180,
            playerTwo: {
              ...gameState.playerTwo,
              moves: [...gameState.playerTwo.moves, isTargetHit],
              score: playerTwo.score + (isTargetHit ? 1 : 0),
            },
          };
          updateGameState(dataToUpdate);
          setCurrentBotTurn((curr) => curr + 1);
        }, 4000);
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
      `/login?redirect=${ARCHERY_ROUTE}?gameId=${gameId}`
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
    navigate(ARCHERY_ROUTE);
    
  };

  const updateGameState = async (gameState) => {
    const archeryCollection = collection(db, "archery");
    const gameRef = doc(archeryCollection, gameId);
    await setDoc(gameRef, gameState, { merge: true });
    // setPauseTimer(false);
  };

  const changeTurnOnTimerEnd = () => {
    if (gameState?.currentActivePlayer === myPlayerId && !gameState.showOtherPlayerAnimation) {
      const newTargetPosition = generateRandomTargetPosition();
      // console.log('stateUpate in index', newTargetPosition);
      const newGameState = {
        currentActivePlayer: otherPlayerId,
        showOtherPlayerAnimation: false,
        [otherPlayerId]: {
          ...gameState?.[otherPlayerId],
          targetPosition: newTargetPosition,
          vertices: getRandomTargetMovementVertices(newTargetPosition),
        },
        [myPlayerId]: {
          ...gameState?.[myPlayerId],
          moves: [...gameState?.[otherPlayerId]?.moves, false],
        },
      };
      updateGameState(newGameState);
    }
    
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
      const gameLink = `${window.location.protocol}//${window.location.host}/${ARCHERY_ROUTE}?gameId=${gameId}`;
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
                  const bodyText = `Hey Hey! ${gameState?.playerOne?.name} has challenged you to a game of Balloon Pop on Maidaan. Tap the link and Game On!\n\n${gameLink}`;
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
          2 Players | Turn by Turn | Best of 5
        </div>
        <div>
          <ul className="py-0 px-6">
            <li>Aim and fire to burst the balloon</li>
            <li>8 seconds per turn to shoot</li>
            <li>One who hits most - Wins!</li>
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

  const renderHitCounter = (playerData, isOtherPlayer = false) => {
    return (
      <div className="flex gap-1">
        {Array.from(Array(5)).map((_, index) => {
          const isCorrect = isOtherPlayer ? otherPlayerMovesState[index] : playerData?.moves?.[index];
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
      const myPlayerData = gameState?.[myPlayerId];
      const otherPlayerData = gameState?.[otherPlayerId];

      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div
              className="grid grid-cols-3 items-center max-xs:my-0"
              style={{ borderBottom: "1px solid #ccf900" }}
            >
              <div className="text-xl flex flex-col items-center gap-2 px-2">
                <div className="flex items-center gap-2">
                  {renderColorDotForPlayer(1)}
                  You
                </div>
                {renderHitCounter(myPlayerData)}
              </div>
              <div
                className="flex justify-center py-2"
                style={{
                  borderRight: "1px solid #ccf900",
                  borderLeft: "1px solid #ccf900",
                }}
              >
                <Timer
                  duration={8}
                  stroke={5}
                  timerEnd={changeTurnOnTimerEnd}
                  // timerEnd={() => {}}
                  startTimer={
                    !gameState.gameEndedAt &&
                    (!pauseTimer ||
                    (gameState.currentActivePlayer === "playerTwo" &&
                      gameState.isComputerGame &&
                      !gameState.showOtherPlayerAnimation))
                  }
                  key={gameState.currentActivePlayer}
                />
              </div>
              <div className="text-xl flex flex-col items-center gap-2 px-2">
                <div className="flex items-center gap-2">
                  {renderColorDotForPlayer(2)}
                  {gameState?.[otherPlayerId]?.name}
                </div>
                {renderHitCounter(otherPlayerData, true)}
                {/* {gameState?.[otherPlayerId]?.score} */}
              </div>
            </div>
            {/* <div className="grid grid-cols-2 items-center px-4 max-xs:my-0 mt-2"></div> */}
          </div>
          {!gameState.gameEndedAt && (
            <ArcheryGameCanvas
              gameState={gameState}
              updateGameState={updateGameState}
              myPlayerId={myPlayerId}
              otherPlayerId={otherPlayerId}
              playAudioClip={playAudioClip}
              setPauseTimer={setPauseTimer}
            />
          )}
          {/* <div className="mt-4">
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
          </div> */}
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
        gameCollectionName="archery"
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
        gameCollectionName="archery"
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
        gameCollectionName="archery"
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
    let header = "Balloon Pop";
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

export default ArcheryGame;
