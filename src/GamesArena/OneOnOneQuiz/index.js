import React, { useState, useEffect, useMemo, useRef } from "react";
import shuffle from "../Common/shuffle";
import { db } from "../../firebase-config";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  documentId,
  updateDoc,
  FieldPath,
  orderBy,
  limit,
} from "firebase/firestore";
import AppButton from "../../Components/Common/AppButton";
import { useAuth } from "../../providers/auth-provider";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../Components/Common/Layout";
import useToast from "../../hooks/use-toast";
import AppInput from "../../Components/Common/AppInput";
import GameEndModal from "../Common/GameEndModal";
import GameLoader from "../../Components/PageComponents/GameLoader";
import { GAME_FORMATS, shareOnWhatsapp } from "../../Constants/Commons";
import BackButton from "../../Components/Common/BackButton";
import DarkModal from "../../Components/Common/DarkModal";
import Chat from "../Common/Chat";
import { twMerge } from "tailwind-merge";
import {
  AI_COMPUTER_ID,
  AI_NUMBER_OF_MOVES_TO_CHECK,
  DAILY_LIMIT,
  IndianNames,
  IndianStates,
  MATRIX,
  getRandomValueFromArray,
} from "../../Constants/GamesArena/MemoryCards";
import { MEASURE } from "../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../instrumentation/types";
import GameHomeLayout from "../Common/GameHomeLayout";
import KeyboardInput from "./KeyboardInput";
import { JumbledWord } from "../../Components/Games/SpellBee/GameComponents/JumbledWord";
import { ImageContainer } from "../../Components/Games/SpellBee/GameComponents/ImageContainer";
import { QuizContainer } from "../../Components/Games/SpellBee/GameComponents/QuizContainer";
import { MCQContainer } from "../../Components/Games/SpellBee/GameComponents/MCQContainer";
import { ImageJumbledContainer } from "../../Components/Games/SpellBee/GameComponents/ImageJumbledContainer";
import { HintsContainer } from "../../Components/Games/SpellBee/GameComponents/HintsContainer";
import AudioContainer from "../../Components/Games/SpellBee/GameComponents/AudioContainer";
import AudioClipContainer from "../../Components/Games/SpellBee/GameComponents/AudioClipContainer";
import { Timer } from "../../Components/Games/SpellBee/GameComponents/CountdownTimer";
import { checkAnswer } from "../../Components/Utils/AssertionLogic";
import { addGameDetailsToChild, calculateGameCount, generateRandomArray, getDateOfMonday, getDateOfMondayWithUnderscore, getGameConfig, getTotalGamesCountFromMondayToToday, handleShare, updateChildDetails, updateChildDetailsUpdateMethod,getDateOfAllDaysFromMondayToSunday,validateAndFormatDate,quitGame } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedModal from "../Common/AnimatedModal";
import { findPlayer, handleVisibility, handleGameStart, handleUpdateRating } from "../Common/MatchMaking";
import { QUIZ_GAME_ROUTE, LOGO_QUIZ_ROUTE, MENTAL_MATH_ROUTE, ENGLISH_MEANIGS_QUIZ_ROUTE } from "../../Constants/routes";
import { getWeeklyArenaTournamentLeaderboard, sortDataPerRankOrPoints } from "../utils";
import { checkAndUpdateReferralCoins } from "../../GamesArena/Common/ReferralCoins";
import mixpanel from 'mixpanel-browser';


const SCORE_BAR_ONE_SECTION_VALUE = 0.125;
const DEFAULT_TIME_FOR_QUESTION = 1500;
const QUESTION_DURATION = 10;
const GAME_START_TIMER = 3;
const SHOW_ANSWER_ICON_TIMER = 2000;
const COMPUTER_SCREEN_TIME = 5000;
const gameType = "mentalMath";

const AI_BOT_DIFFICULTY_SCORE_MAP = {
  easy: 25, // score to fill according to difficulty level
  medium: 36,
  hard: 52,
};

const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");


function OneOnOneQuiz() {
  const { user, getUserDetails, signInAnonymouslyWithFirebase, isUserLoading, logout } =
    useAuth();
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
  const [showReaction, setShowReaction] = useState(null);
  const [computerGameLoading, setComputerGameLoading] = useState(false);
  const [computerGameMessage, setComputerGameMessage] = useState("");
  const [selectNumber, setSelectNumber] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentRemainingTime, setCurrentRemainingTime] = useState(10);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [haveGivenAnswer, setHaveGivenAnswer] = useState(false);
  const [questionsList, setQuestionsList] = useState([]);
  const [computerScores, setComputerScores] = useState([]);
  const [oneOnOneID, setOneOnOneID] = useState(null);
  const [gameConfig, setGameConfig] = useState(null);
  const [opponentLeftPopup, setOpponentLeftPopup] = useState(false);
  const [messageDisplayed, setMessageDisplayed] = useState(false);
  const [quitGamePopup, setQuitGamePopup] = useState(false);
  const [gameWonByExit, setGameWonByExit] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // loaders
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [showGameStartTimer, setShowGameStartTimer] = useState(false);
  const [hasDefaultTimePassed, setHasDefaultTimePassed] = useState(false);
  const [showGameFinishedModal, setShowGameFinishedModal] = useState(false);
  const [hasPlayedOpponentSound, setHasPlayedOpponentSound] = useState(false);
  const [myAnswerFlag, setMyAnswerFlag] = useState(-1);
  const [otherAnswerFlag, setOtherAnswerFlag] = useState(-1);
  const [isOtherAnswerFlagShown, setIsOtherAnswerFlagShown] = useState(false);
  const isQuestionFetching = useRef(false);
  const [gamePointsEndModal, setGamePointsEndModal] = useState({});

  const gameId = searchParams.get("gameId");
  const name = searchParams.get("name");
  const [gameCollectionName, setGameCollectionName] = useState("");
  const [quizCollectionName, setQuizCollectionName] = useState("");
  const [quizQuestionsCollectionName, setQuizQuestionsCollectionName] = useState("");
  const [gameType, setGameType] = useState("");
  const [backButtonUrl, setBackButtonUrl] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [headerText, setHeaderText] = useState("");
  const [buttonClicked, setButtonClicked] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [docCreatedDate, setDocCreatedDate] = useState(null);

  const mondayToSundayDates = getDateOfAllDaysFromMondayToSunday();


  useEffect(() => {
    switch (name) {
      case "mental-math":
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
      case "english-meanings-quiz":
        setGameCollectionName("oneOnOneEngMeaningsQuiz");
        setQuizCollectionName("oneOnOneEngMeaningsQuizzes");
        setQuizQuestionsCollectionName("english_meaningsMCQ");
        setGameType("englishMeaningsQuiz");
        setHeaderText("Word Wars");
        setBackButtonUrl(ENGLISH_MEANIGS_QUIZ_ROUTE);
      default:
        break;
    }
  }, [name, gameId]);


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
    const quizGameCollection = collection(db, gameCollectionName);
    const gameRef = doc(quizGameCollection, gameId);
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
  }

  useEffect(() => {
    if (gameState) {
      checkGameState();
      if (gameState.gameExited && gameState.gameExited !== user.id && !gameState.winner) {
        getChildAndUpdateGameCount(user?.id);
        getLeaderboardAndUpdatedGameCounts(user?.id);
        setQuitGamePopup(true);
        //show a popup that the other player has exited the game with two options to go back or find another player.
      }
      else if ((gameState.gameExited && gameState.gameExited !== user.id) || (gameState.isComputerGame && gameState.gameEndedAt && !opponentLeftPopup && gameState?.gameExited !== user.id)) {


        let timeout = gameState.isComputerGame ? 2000 : 0;
        setTimeout(() => {
          setOpponentLeftPopup(true);
        }, timeout);
        setTimeout(() => {
          setOpponentLeftPopup(false);
        }, 3000 + timeout);
        setExitGamePopup(false);
      }
      if (gameState.createdAt && !gameState.winner && !gameState.gameExited && gameState?.playerOne?.id === user?.id && !gameState.isComputerGame && gameState?.playerTwo?.id && !gameState?.playerTwo?.numberOfMoves && !gameState.playerOne?.numberOfMoves && !messageDisplayed && !gameState?.isRematch && !gameState?.inviteGame) {
        //setComputerGameLoading(true);
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

  useEffect(() => {
    // add a listener to the document with the gameId
    // if the document changes, we want to update the board
    setButtonClicked(false);
    fetchGameConfig();
    if (!gameId || !gameCollectionName) return;

    if (!user) {
      getGameDetails();
    }

    const quizGameCollection = collection(db, gameCollectionName);
    const unsubscribe = onSnapshot(doc(quizGameCollection, gameId), (doc) => {
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
  }, [gameId, user, gameCollectionName]);

  const handleDefaultTimePassed = (startTime) => {
    const endTime = new Date();
    const timeDiff = endTime - startTime;
    // if time difference is greater than or equal to 1.5 seconds then set hasDefaultTimePassed to true
    if (timeDiff >= DEFAULT_TIME_FOR_QUESTION) {
      setHasDefaultTimePassed(true);
      setLoadingQuestion(false);
      setHaveGivenAnswer(false);
      isQuestionFetching.current = false;
    } else {
      setTimeout(() => {
        setHasDefaultTimePassed(true);
        setLoadingQuestion(false);
        setHaveGivenAnswer(false);
        isQuestionFetching.current = false;
      }, DEFAULT_TIME_FOR_QUESTION - timeDiff);
    }
  };

  const fetchQuiz = async () => {
    // fetch quiz from quizess collection
    setLoadingQuiz(true);
    const startTime = new Date();
    const quizCollection = collection(db, quizCollectionName);
    const quizRef = doc(quizCollection, gameState?.quizId);
    const quiz = await getDoc(quizRef);
    const quizData = quiz.data();
    // fetch question from quizQuestions collection
    const quizQuestionsCollection = collection(db, quizQuestionsCollectionName);
    // const fieldPath = new FieldPath("documentId");
    const q = query(quizQuestionsCollection, where(documentId(), "in", quizData.questionIds));
    const quizQuestions = await getDocs(q);
    const quizQuestionsData = quizQuestions.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    setQuiz(quizData);
    setQuestionsList(quizQuestionsData);
    setCurrentQuestion({
      ...quizQuestionsData[0],
      position: 1,
    });
    handleDefaultTimePassed(startTime);
    if (gameState?.playerTwo.id === AI_COMPUTER_ID) {
      const lengthOfQuestions = quizData?.questionIds?.length;
      const scoreForLevel =
        AI_BOT_DIFFICULTY_SCORE_MAP[gameState?.difficultyLevel];
      const listOfScores = generateRandomArray(
        lengthOfQuestions,
        scoreForLevel
      );
      setComputerScores(listOfScores);
    }
    setLoadingQuiz(false);
  }

  const timerIdRef = useRef(null);

  useEffect(() => {
    if (oneOnOneID) {
      const unsubscribe = handleGameStart(oneOnOneID, createGame, AI_COMPUTER_ID, startPvpQuizGame, user, setLoading, searchParams, setSearchParams, setComputerGameLoading, db, setComputerGameMessage,docCreatedDate);
      return unsubscribe;
    }
  }, [oneOnOneID]);


  const startPvpQuizGame = async (user, playerTwo, gameId, oneOnOneID, setLoading, searchParams, setSearchParams, setComputerGameLoading, db) => {

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
    const quizGameCollection = collection(db, gameCollectionName);
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

    const openMatchesCollection = collection(db, 'openMatches');
    const openMatchRef = doc(openMatchesCollection, oneOnOneID);
    await setDoc(openMatchRef, {
      gameStarted: true,
    }, { merge: true });
    setSearchParams({ ...searchParams, gameId: gameRef.id });
    setComputerGameLoading(true);
  }


    useEffect(() => {
      const unsubscribe = handleVisibility(
        oneOnOneID,
        gameState,
        setComputerGameLoading,
        setLoading,
        setOneOnOneID,
        db,
        handleQuitGame
      );
      return unsubscribe;
    }, [document.visibilityState,oneOnOneID,gameState]);

  useEffect(() => {
    if (!gameState?.currentActiveQuestion && gameState?.gameEndedAt && gameState.rematchGameId) {
      setQuiz(null);
      setCurrentQuestion(null);
    }
    if (currentQuestion && gameState?.isGameStarted && !gameState.gameEndedAt) {
      // check if both players have given their answers and then fetch the next question
      const playerOneAnswers = gameState?.playerOne?.answers ?? {};
      const playerTwoAnswers = gameState?.playerTwo?.answers ?? {};
      const currentQuestionId = currentQuestion?.id;
      const playerOneAnswered = playerOneAnswers[currentQuestionId];
      const playerTwoAnswered = playerTwoAnswers[currentQuestionId];
      const isCurrAnsCorrect =
        gameState?.[otherPlayerId]?.answers?.[currentQuestionId]?.isCorrect;
      if (isCurrAnsCorrect !== undefined && !isOtherAnswerFlagShown) {
        setIsOtherAnswerFlagShown(true);
        setOtherAnswerFlag(isCurrAnsCorrect ? 1 : 0);
        setTimeout(() => {
          setOtherAnswerFlag(-1);
        }, SHOW_ANSWER_ICON_TIMER);
      }

      if (playerOneAnswered && playerTwoAnswered && myAnswerFlag === -1 && otherAnswerFlag === -1) {
        setTimeout(() => {
          fetchNextQuestion();
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, myAnswerFlag, otherAnswerFlag]);

  useEffect(() => {
    if (!quiz && !currentQuestion && gameState?.isGameStarted && gameState?.quizId && gameState?.currentActiveQuestion) {
      fetchQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, gameState, quiz]);

  useEffect(() => {
    if (computerScores.length && !gameState?.playerTwo?.answers) {
      const currentQuestionId = currentQuestion?.id;
      updateComputerScore(0, currentQuestionId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computerScores]);

  const gameCount = useMemo(() => {
    return calculateGameCount(user, currentDateInDDMMYYYY);
  }, [user]);

    const handleQuitGame = () => {
      quitGame(
        gameId,
        user,
        backButtonUrl,
        gameState,
        gameCollectionName,
        setExitGamePopup,
        setQuitGamePopup,
        () => {},
        navigate,
      );
    };

  const updateComputerScore = async (
    index,
    currentQuestionId,
    isFirstQuestion = false,
  ) => {
    const isLastQues = index === computerScores.length - 1;
    let currentComputerScore = isLastQues ? 2 * computerScores[index] : computerScores[index];
    const currentComputerPercentageOfBar =
      (currentComputerScore / 10) * SCORE_BAR_ONE_SECTION_VALUE * 100;
    const finalPercentageOfBar =
      currentComputerPercentageOfBar +
      (gameState?.playerTwo?.percentageOfBar ?? 0);

    const gameRef = doc(collection(db, gameCollectionName), gameId);
    const dataToUpdate = [
      new FieldPath("playerTwo", "score"),
      currentComputerScore + (gameState?.playerTwo?.score ?? 0),
      new FieldPath("playerTwo", "percentageOfBar"),
      finalPercentageOfBar,
      new FieldPath("playerTwo", "answers", currentQuestionId),
      {
        answer: "",
        isCorrect: currentComputerScore > 0,
      },
      "activeSound",
      null
    ];
    let timeAccordingToScore = 0;
    if (currentComputerScore > 0) {
      if (isLastQues) {
        timeAccordingToScore =
          QUESTION_DURATION * 1000 - computerScores[index] * 1000;
      } else {
        timeAccordingToScore =
          QUESTION_DURATION * 1000 - currentComputerScore * 1000;
      }
    }
    if (isFirstQuestion) {
      timeAccordingToScore += (GAME_START_TIMER * 1000) + COMPUTER_SCREEN_TIME;
    }
    setTimeout(() => {
      updateDoc(gameRef, ...dataToUpdate);
    }, DEFAULT_TIME_FOR_QUESTION + timeAccordingToScore);
  };

  const handleLogout = async () => {
    await logout();
    window.location.replace(`/login?redirect=${backButtonUrl}`);
  };

  const checkUserGameLimit = async (gameStart = false) => {
    const childrenCollection = collection(db, "children");
    const childRef = doc(childrenCollection, user.id);
    const child = await getDoc(childRef);
    if (child.exists()) {
      const data = child.data();
      const gameCount = data.arenaGames?.[gameCollectionName]?.[currentDateInDDMMYYYY] ?? 0;
      const totalGameCount = calculateGameCount(data, currentDateInDDMMYYYY);
      if (totalGameCount >= DAILY_LIMIT) {
        showToast("You have exceeded your daily game limit", "error");
        return true;
      } else if (gameStart) {
        const newGameCount = gameCount + 1;
        const fieldPath = new FieldPath(
          "arenaGames",
          gameCollectionName,
          currentDateInDDMMYYYY
        );
        await updateDoc(childRef, fieldPath, newGameCount);

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
          gamesPlayed: leaderboardChildData?.gamesPlayed ?? 0 + 1,
          pointsWon: leaderboardChildData?.pointsWon ?? 0,
          gamesWon: leaderboardChildData?.gamesWon ?? 0,
          firstName: user.firstName,
          lastName: user.lastName,
          schoolName: user.school,
          city: user.city,
        };
        await setDoc(leaderboardChildRef, dataToUpdate, { merge: true });

        // if (totalGameCount === 0) {
        //   await updateChildDetails(user.id, {
        //     arenaGames: {
        //       currentStreak: (data?.arenaGames?.currentStreak ?? 0) + 1,
        //     },
        //   });
        // }
      }
    }

    const otherChildId = gameState?.[otherPlayerId]?.id;
    if (otherChildId) {
      const otherChildRef = doc(childrenCollection, otherChildId);
      const otherChild = await getDoc(otherChildRef);
      if (otherChild.exists()) {
        const otherChildData = otherChild.data();
        const otherChildGameCount = otherChildData.arenaGames?.[gameCollectionName]?.[currentDateInDDMMYYYY] ?? 0;
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
            gameCollectionName,
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
          // if (totalGameCount === 0) {
          //   await updateChildDetails(user.id, {
          //     arenaGames: {
          //       currentStreak: (otherChildData?.arenaGames?.currentStreak ?? 0) + 1,
          //     },
          //   });
          // }
        }
      }
    }
    return false;
  };

  const createGame = async (player = "playerOne", reset = false) => {
    if (!user || (user && !user.createdAt && !reset)) {
      if (!user.createdAt) {
        handleLogout();
      }
      return;
    }
    setLoading(true);
    setGameWon(false);
    setGameLost(false);
    setGameTied(false);
    const quizGameCollection = collection(db, gameCollectionName);
    const newDate = new Date();

    let newGameData = {
      createdAt: newDate,
      playerOne: {
        score: 0,
        id: user.id,
        name: user.firstName,
        percentageOfBar: 0,
      },
      playerTwo: {
        score: 0,
        id: "",
        name: "",
        percentageOfBar: 0,
      },
      result: [],
      winner: null,
      currentActivePlayer: "playerOne",
      activeSound: null,
      currentTimer: 3,
      currentActiveQuestion: '', // fetched from questionIds array from the quiz
      quizId: '', // this id will be selected based on what both users have already played
    };

    if (player === "computer") {
      setComputerGameLoading(true);
      // const boardMatrix = shuffle(MATRIX);
      const randomName = getRandomValueFromArray(IndianNames);
      const randomState = getRandomValueFromArray(IndianStates);
      const randomQuiz = await getQuizNotPlayedByBothPlayers();
      if (!randomQuiz) {
        showToast(
          "There are no active quizes available. Please contact support.",
          "error"
        );
        setLoading(false);
        setComputerGameLoading(false);
        setComputerGameMessage("");
        return;
      }
      const isGameLimitExceeded = await checkUserGameLimit(
        player === AI_COMPUTER_ID
      );
      if (isGameLimitExceeded) {
        return;
      }
      newGameData.playerTwo.name = randomName;
      newGameData.playerTwo.id = AI_COMPUTER_ID;
      newGameData.isComputerGame = true;
      newGameData.isGameStarted = true;
      newGameData.gameStartedAt = newDate;
      // newGameData.activeSound = "/Assets/Sounds/MemoryCards/gameStart.mp3";

      //fetch the previous game played by this user, and get the difficulty level and winner for that game
      const previousGameCollection = collection(db, gameCollectionName);
      const previousGameQuery = query(
        previousGameCollection,
        where("playerOne.id", "==", user.id),
        where("isComputerGame", "==", true),
        orderBy("gameEndedAt", "desc"),
        limit(1)
      );
      const previousGameSnapshot = await getDocs(previousGameQuery);
      const previousGame = previousGameSnapshot.docs[0]?.data();
      const previousGameDifficultyLevel = previousGame?.difficultyLevel;
      const previousGameWinner = previousGame?.winner;
      if (previousGameDifficultyLevel && previousGameWinner) {
        if (previousGameWinner === "playerOne") {
          newGameData.difficultyLevel =
            previousGameDifficultyLevel === "easy" ? "medium" : "hard";
        } else if (previousGameWinner === "playerTwo") {
          newGameData.difficultyLevel =
            previousGameDifficultyLevel === "hard" ? "medium" : "easy";
        } else {
          newGameData.difficultyLevel = previousGameDifficultyLevel;
        }
      } else {
        // if no previous game is played then set difficulty level to easy
        newGameData.difficultyLevel = "medium";
      }
      newGameData.quizId = randomQuiz?.id;
      newGameData.currentActiveQuestion = randomQuiz?.questionIds?.[0];
      const docRef = await addDoc(quizGameCollection, newGameData);
      if (reset) {
        setQuiz(null);
        setCurrentQuestion(null);
        setComputerScores([]);
        setQuestionsList([]);
        const gameRef = doc(quizGameCollection, gameId);
        await setDoc(
          gameRef,
          {
            rematchGameId: docRef.id,
            rematchStartedBy: user.id,
            activeSound: null,
          },
          { merge: true }
        );
      }
      setLoading(false);
      setSearchParams({ ...searchParams, gameId: docRef.id, name: name });
      setTimeout(() => {
        setComputerGameLoading(false);
        setComputerGameMessage(
          `You are playing against ${randomName} from ${randomState}`
        );
      }, COMPUTER_SCREEN_TIME - 2000);
      setTimeout(() => {
        setComputerGameMessage("");
      }, COMPUTER_SCREEN_TIME);
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
      newGameData.playerOne.name = nameOfPlayer;
      if (reset && gameState?.chatId) {
        newGameData.chatId = gameState?.chatId;
      }
      if (reset && (gameState?.pvpGame || gameState?.inviteGame || gameState?.isRematch))  {
        newGameData.pvpGame = true;
        newGameData.isRematch = true;
      }
      const docRef = await addDoc(quizGameCollection, newGameData);
      if (reset) {
        const gameRef = doc(quizGameCollection, gameId);
        await setDoc(
          gameRef,
          {
            rematchGameId: docRef.id,
            rematchStartedBy: user.id,
            activeSound: null,
          },
          { merge: true }
        );
      } else {
        setSearchParams({ ...searchParams, gameId: docRef.id, name: name });
      }
      setLoading(false);
      return;
    }
    if (player === "playerTwo") {
      await setDoc(
        doc(quizGameCollection, gameId),
        {
          playerTwo: {
            score: 0,
            id: user.id,
            name: user.firstName,
            percentageOfBar: 0,
          },
        },
        { merge: true }
      );
      setLoading(false);
    }
  };

  const getQuizNotPlayedByBothPlayers = async () => {
    // get playerOne arenaGames collection from child


    const playerOneArenaGamesCollection = collection(
      db,
      `children/${gameState?.playerOne?.id}/arenaGames`
    );
    const playerOnePlayedGames = await getDocs(playerOneArenaGamesCollection);
    const playerOneQuizes = playerOnePlayedGames.docs.map(
      (doc) => doc.data().quizId
    );

    // fetch arenaGames collection from child
    if (user?.createdAt && gameState?.playerTwo?.id !== AI_COMPUTER_ID) {
      const arenaGamesCollection = collection(
        db,
        `children/${user?.id}/arenaGames`
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

  const startGame = async () => {
    let trimmedName = anonymousName.trim();
    if (!trimmedName) {
      trimmedName = user?.firstName;
      if (!trimmedName) {
        trimmedName = gameState?.[myPlayerId]?.name;
      }
    }
    if (!trimmedName) {
      showToast("Please enter a valid name", "error");
      return;
    }
    setLoading(true);
    const finalGameId = gameState?.rematchGameId || gameId;
    const rematchAccepted = gameState?.rematchGameId && gameState?.winner;
    if (rematchAccepted) {
      setSearchParams({ ...searchParams, gameId: gameState?.rematchGameId, name: name });
    }

    const randomQuiz = await getQuizNotPlayedByBothPlayers();
    if (!randomQuiz) {
      showToast(
        "There are no active quizes available. Please contact support.",
        "error"
      );
      setLoading(false);
      return;
    }
    const isGameLimitExceeded = await checkUserGameLimit(true);
    if (isGameLimitExceeded) {
      setLoading(false);
      return;
    }

    const quizGameCollection = collection(db, gameCollectionName);
    const gameRef = doc(quizGameCollection, finalGameId);
    const ogGameRef = doc(quizGameCollection, gameId);

    if (rematchAccepted) {
      updateDoc(ogGameRef, "rematchAccepted", rematchAccepted);
      resetStates();
    }

    // add a new document to the chats collection
    const chatsCollection = collection(db, "chats");
    const chatRef = doc(chatsCollection);
    const chatId = chatRef.id;
    if (!gameState?.pvpGame) {
      await setDoc(chatRef, {
        messages: [],
        createdAt: new Date(),
        members: [user.id, gameState.playerOne.id],
        status: "active",
      });
    }
    await setDoc(
      gameRef,
      {
        currentActivePlayer: "playerOne",
        isGameStarted: true,
        gameStartedAt: new Date(),
        playerTwo: {
          score: 0,
          id: user.id,
          percentageOfBar: 0,
          name:
            user.firstName ??
            trimmedName ??
            gameState?.playerTwo?.name ??
            "Anonymous",
        },
        // activeSound: "/Assets/Sounds/OneOnOneQuiz/gameStart.mp3",
        ...(!gameState?.pvpGame ? { chatId } : {}),
        ...(!gameState?.rematchGameId ? { inviteGame: true } : {}),
        quizId: randomQuiz?.id,
        currentActiveQuestion: randomQuiz?.questionIds?.[0],
      },
      { merge: true }
    );
    setLoading(false);
  };

  const declineGame = async () => {
    const memoryCardsCollection = collection(db, gameCollectionName);
    const gameRef = doc(memoryCardsCollection, gameId);
    await updateDoc(
      gameRef,
      gameState?.rematchGameId ? "rematchDeclined" : "invitationDeclined",
      true
    );
    setTimeout(() => {
      if (!user.createdAt) {
        handleLogout();
      } else {
        navigate(backButtonUrl);
      }
    }, 1000);
  };

  const checkGameState = async () => {
    // if (gameState?.isGameStarted && otherAnswerFlag === -1 && gameState?.[otherPlayerId]?.answers) {
    // if (gameState?.[otherPlayerId]?.answers?.[currentQuestion?.id]) {
    // TODO: sound code
    // const isCurrAnsCorrect = gameState?.[otherPlayerId]?.answers?.[currentQuestion?.id]?.isCorrect;
    // if (isCurrAnsCorrect) {
    //   playAudioClip("/Assets/Sounds/OneOnOneQuiz/otherCorrect.mp3");
    // } else {
    //   playAudioClip("/Assets/Sounds/OneOnOneQuiz/otherIncorrect.mp3");
    // }
    // setHasPlayedOpponentSound(true);
    // }
    // }
    if (
      gameState?.isGameStarted &&
      !gameState?.gameEndedAt &&
      gameState?.currentTimer > 0
    ) {
      setShowGameStartTimer(true);
      if (gameState?.isComputerGame) {
        setTimeout(() => {
          playAudioClip("/Assets/Sounds/MemoryCards/gameStart.mp3");
        }, COMPUTER_SCREEN_TIME);
      } else {
        playAudioClip("/Assets/Sounds/MemoryCards/gameStart.mp3");
      }
      await updateDoc(
        doc(collection(db, gameCollectionName), gameId),
        "currentTimer",
        0
      );
      return;
    }

    if (gameState.rematchGameId && gameState.winner) {
      setGameLost(false);
      setGameWon(false);
      setGameTied(false);
      if (gameState.rematchAccepted) {
        setSearchParams({ ...searchParams, gameId: gameState?.rematchGameId, name: name });
      }
      return;
    }
    /*if (gameState?.playerOne?.hasPlayedAllQuestions && gameState?.playerTwo?.hasPlayedAllQuestions && !gameState?.gameEndedAt) {
      const quizGameCollection = collection(db, gameCollectionName);
      const gameRef = doc(quizGameCollection, gameId);
      const stateToUpdate = {
        gameEndedAt: new Date(),
        // activeSound: "/Assets/Sounds/OneOnOneQuiz/gameEnd.mp3",
      };
      await setDoc(gameRef, stateToUpdate, { merge: true });
      return;
    }*/
    const playerOneOrTwo = gameState?.playerOne.id === user?.id ? "playerOne" : "playerTwo"
    const currentPlayer = gameState?.[playerOneOrTwo];
    if (
      gameState?.playerOne?.hasPlayedAllQuestions &&
      gameState?.playerTwo?.hasPlayedAllQuestions &&
      !currentPlayer?.pointsAwarded || (gameState.gameExited !== user?.id && gameState.gameWonByExit && !currentPlayer?.pointsAwarded)
    ) {
      let isTied = false;
      let winner;
      let stateToUpdate ;
      const memoryCardsCollection = collection(db, gameCollectionName);
      const gameRef = doc(memoryCardsCollection, gameId);
      if (!gameState.gameWonByExit) {
        isTied =
          gameState?.playerOne.score === gameState?.playerTwo.score;
        winner = isTied
          ? "Tied"
          : gameState?.playerOne.score > gameState?.playerTwo.score
            ? "playerOne"
            : "playerTwo";
        
        
        //await setDoc(gameRef, stateToUpdate, { merge: true });
        if (playerOneOrTwo === "playerOne") {
          stateToUpdate = {
            playerOne: {
              "pointsAwarded": true,
            },
            winner: winner,
            gameEndedAt: new Date(),
            //activeSound: "/Assets/Sounds/MemoryCards/gameEnd.mp3",
          }
        } else {
          stateToUpdate = {
            playerTwo: {
              "pointsAwarded": true,
            },
            winner: winner,
            gameEndedAt: new Date(),
            //activeSound: "/Assets/Sounds/MemoryCards/gameEnd.mp3",
          }
        };

        await setDoc(gameRef, stateToUpdate, { merge: true });
      } else {
        winner = gameState.winner;
        if (playerOneOrTwo === "playerOne") {
          stateToUpdate = {
            playerOne: {
              "pointsAwarded": true,
            },
            gameEndedAt: new Date(),
            //activeSound: "/Assets/Sounds/MemoryCards/gameEnd.mp3",
          }
        } else {
          stateToUpdate = {
            playerTwo: {
              "pointsAwarded": true,
            },
            gameEndedAt: new Date(),
            //activeSound: "/Assets/Sounds/MemoryCards/gameEnd.mp3",
          }
        };

        await setDoc(gameRef, stateToUpdate, { merge: true });
      }
      const currentActivePlayer = gameState.currentActivePlayer;
      const otherPlayer = currentActivePlayer === "playerOne" ? "playerTwo" : "playerOne";

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
        // calculate discipline points
        const { totalGamesCount, streak } = getTotalGamesCountFromMondayToToday(userData);
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

        const gamePointsWon = playedPoints + wonPoints + disciplinePoints;
        const arenaPoints = (userData?.arenaPoints ?? 0) + gamePointsWon;
        const gamePoints = {
          played:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]?.played ??
              0) + playedPoints,
          won:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]?.won ??
              0) + wonPoints,
          discipline:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]
              ?.discipline ?? 0) + disciplinePoints,
          total:
            (userData?.arenaGames?.points?.[currentDateInDDMMYYYY]?.total ??
              0) + gamePointsWon,
        };
        const currentGamePoints = {
          played: playedPoints,
          won: wonPoints,
          discipline: disciplinePoints,
          total: gamePointsWon,
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
              points: currentGamePoints,
            },
          };
          const stateToUpdate = {
            winner: winner,
            gameEndedAt: new Date(),
            activeSound: "/Assets/Sounds/MemoryCards/gameEnd.mp3",
          };
          await checkAndUpdateReferralCoins(user?.id, user?.referredBy, user?.walletId, user?.referralBonusCredited);
          await addGameDetailsToChild(user.id, gameId, {
            ...gameState,
            ...stateToUpdate,
            ...pointsData,
          });
          // add document to weeklyArenaTournaments/{mondayDate}/leaderboard/{childId}
          const mondayDate = getDateOfMondayWithUnderscore();
          const weeklyArenaTournamentsCollection = collection(db, "weeklyArenaTournaments");
          const weeklyArenaTournamentsRef = doc(weeklyArenaTournamentsCollection, mondayDate);
          const leaderboardRef = collection(weeklyArenaTournamentsRef, "leaderboard");
          const leaderboardChildRef = doc(leaderboardRef, user.id);
          const leaderboardChild = await getDoc(leaderboardChildRef);
          const leaderboardChildData = leaderboardChild.data();
          const date = new Date();
          const dataToUpdate = {
            firstName: user.firstName,
            lastName: user.lastName,
            schoolName: user.school,
            city: user.city,
            gamesPlayed: totalGamesCount,
            gamesWon: (leaderboardChildData?.gamesWon ?? 0) + (winner === myPlayerId ? 1 : 0),
            pointsWon: (leaderboardChildData?.pointsWon ?? 0) + gamePointsWon,
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

      setShowGameFinishedModal(true);
      setTimeout(() => {
        setShowGameFinishedModal(false);
        if (isTied) {
          setGameTied(true);
        } else if (winner === myPlayerId) {
          setGameWon(true);
        } else {
          setGameLost(true);
        }
      }, 3000);
      handleUpdateRating(winner, currentActivePlayer, gameType, gameState, otherPlayer);
       stateToUpdate = {
        currentActiveQuestion: null,
        activeSound: "/Assets/Sounds/OneOnOneQuiz/gameEnd.mp3",
      };
      await setDoc(gameRef, stateToUpdate, { merge: true });
      if (user?.createdAt) {
        addGameDetailsToChild(user.id, gameId, { ...gameState, ...stateToUpdate });
      }
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

  const resetStates = () => {
    setQuiz(null);
    setCurrentQuestion(null);
    setComputerScores([]);
    setQuestionsList([]);
    setIsLastQuestion(false);
    setHaveGivenAnswer(false);
    setHasDefaultTimePassed(false);
  };

  const resetGame = async () => {
    resetStates();
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
      testField: true,

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
    setDoc(docRef, {
      arenaGames: {
        memoryCards: {
          [currentDateInDDMMYYYY]: gamesPlayed - 1,
        },

      },
      testField: true,
    }, { merge: true });
  }
  
  const playAudioClip = (clip) => {
    const audioElRef = new Audio(clip); // Create a new Audio element
    audioElRef.play();
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
  };

  const handleSubmitAnswer = async (answer, isTimerEnd = false) => {
    let finalInput = answer;
    finalInput = finalInput.trim();
    if (!finalInput && !isTimerEnd) return;
    const quizGameCollection = collection(db, gameCollectionName);
    const gameRef = doc(quizGameCollection, gameId);
    setHaveGivenAnswer(true);
    const isCorrect = checkAnswer(
      quiz?.assertionLogic,
      finalInput,
      currentQuestion
    );
    const scoreToAdd = isCorrect
      ? isLastQuestion
        ? currentRemainingTime * 2
        : currentRemainingTime
      : quiz.negativeScore * -1;
    const currentScore = gameState?.[myPlayerId]?.score ?? 0;
    const newScore = currentScore + scoreToAdd;
    const newPercentageOfBar =
      (scoreToAdd / 10) * SCORE_BAR_ONE_SECTION_VALUE * 100;

    const finalPercentageOfBar =
      newPercentageOfBar + (gameState?.[myPlayerId]?.percentageOfBar ?? 0);

    const dataToUpdate = [
      new FieldPath(myPlayerId, "score"),
      newScore,
      new FieldPath(myPlayerId, "percentageOfBar"),
      finalPercentageOfBar,
      new FieldPath(myPlayerId, "answers", currentQuestion?.id),
      {
        answer: finalInput,
        isCorrect,
      },
    ];
    // playAudioClip(isCorrect ? "/Assets/Sounds/OneOnOneQuiz/myCorrect.mp3" : "/Assets/Sounds/OneOnOneQuiz/myIncorrect.mp3");

    setMyAnswerFlag(isCorrect ? 1 : 0);
    setTimeout(() => {
      setMyAnswerFlag(-1);
    }, SHOW_ANSWER_ICON_TIMER);

    await updateDoc(gameRef, ...dataToUpdate);
  };

  const resetStateVariables = () => {
    setGameWon(false);
    setGameLost(false);
    setGameTied(false);
    setGamePointsEndModal({});
    setQuiz(null);
    setCurrentQuestion(null);
    setCurrentRemainingTime(10);
    setIsLastQuestion(false);
    setHaveGivenAnswer(false);
    setQuestionsList([]);
    setComputerScores([]);
    setOpponentLeftPopup(false);
    setMessageDisplayed(false);
    setQuitGamePopup(false);
    setLoadingQuiz(false);
    setLoadingQuestion(false);
    setShowGameStartTimer(false);
    setHasDefaultTimePassed(false);
    setShowGameFinishedModal(false);
    setHasPlayedOpponentSound(false);
    setMyAnswerFlag(-1);
    setOtherAnswerFlag(-1);
    setIsOtherAnswerFlagShown(false);
    isQuestionFetching.current = false;
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
    findPlayer(user, gameType, setOneOnOneID, searchParams, setSearchParams, db, setComputerGameLoading, setLoading, setComputerGameMessage,checkUserGameLimit,setDocCreatedDate);
    setButtonLoading(false);
  };

  const handleQuestionChange = async (question, nextQuestionIndex, startTime, isLastQuestion) => {
    setCurrentQuestion({
      ...question,
      position: nextQuestionIndex + 1,
    });

    if (gameState?.isComputerGame) {
      updateComputerScore(nextQuestionIndex, question.id, false, isLastQuestion);
    }

    handleDefaultTimePassed(startTime);
  };

  const fetchNextQuestion = async () => {
    if (isQuestionFetching.current) return;
    const startTime = new Date();
    const previousQuestionIndex = questionsList.findIndex((q) => q.id === currentQuestion?.id);
    const nextQuestionIndex = previousQuestionIndex + 1;
    const quizGameCollection = collection(db, gameCollectionName);
    const gameRef = doc(quizGameCollection, gameId);
    const isLastQues = nextQuestionIndex === quiz?.questionIds?.length - 1;
    if (isLastQues) {
      setIsLastQuestion(true);
    }
    if (nextQuestionIndex < quiz?.questionIds?.length) {
      setLoadingQuestion(true);
      setHasDefaultTimePassed(false);
      setHasPlayedOpponentSound(false);
      setIsOtherAnswerFlagShown(false);
      isQuestionFetching.current = true;
      const nextQuestion = questionsList[nextQuestionIndex];
      await handleQuestionChange(nextQuestion, nextQuestionIndex, startTime, isLastQues);
    } else {
      const dataToUpdate = [
        new FieldPath(myPlayerId, "hasPlayedAllQuestions"),
        true,
      ];
      if (gameState?.isComputerGame) {
        dataToUpdate.push(
          new FieldPath("playerTwo", "hasPlayedAllQuestions"),
          true
        );
      }
      if (gameState?.[otherPlayerId].hasPlayedAllQuestions || gameState?.isComputerGame) {
        dataToUpdate.push(
          ...[
            "gameEndedAt",
            new Date(),
          ]
        );
      }
      await updateDoc(gameRef, ...dataToUpdate);
    }
  }

  const handleMainTimerEnd = async () => {
    setLoadingQuestion(true);
    setTimeout(() => {
      setShowGameStartTimer(false);
    }, DEFAULT_TIME_FOR_QUESTION);
    setTimeout(() => {
      setLoadingQuestion(false);
      setHasDefaultTimePassed(true);
      isQuestionFetching.current = false;
    }, DEFAULT_TIME_FOR_QUESTION * 2);
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
      if (
        gameState?.gameEndedAt &&
        !gameState?.isGameStarted &&
        gameState?.winner &&
        !gameState?.rematchGameId
      ) {
        return (
          <AnimatePresence>
            {showGameFinishedModal ? (
              <AnimatedModal key="gameFinishedWrapModal">
                <div className="text-primary-yellow whitespace-pre text-2xl">That's a wrap!</div>
              </AnimatedModal>
            ) : (
              <></>
            )}
          </AnimatePresence>
        );
      }
      const gameLink = `${window.location.protocol}//${window.location.host}${QUIZ_GAME_ROUTE}?gameId=${gameId}&name=${name}`;
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
                  const bodyText = `Hey Hey! ${gameState?.playerOne?.name} has challenged you to a game of Quiz on Maidaan. Tap the link and Game On!\n\n${gameLink}`;
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
          2 Players | Rapid Fire | 7 Questions
        </div>
        <div>
          <ul className="py-0 px-6">
            <li>10 Seconds per Question</li>
            <li>Answer fast, Score more</li>
            <li>Last question - Double Points</li>
            <li>Higher score after 7 Qs - Wins!</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderGameContainer = () => {
    if (!quiz || !currentQuestion) {
      return <></>;
    }
    let gameFormat = <></>;
    const displayStyle = (gameState?.isGameStarted &&
      !gameState?.gameEndedAt &&
      !loadingQuestion &&
      !showGameStartTimer &&
      hasDefaultTimePassed) ? "block" : "none";
    switch (quiz?.format) {
      case GAME_FORMATS.JUMBLE:
        gameFormat = (
          <div className="w-full h-full flex items-center" style={{ display: displayStyle }}>
            <JumbledWord question={currentQuestion} />
          </div>
        );
        break;
      case GAME_FORMATS.IMAGE:
        gameFormat = (
          <div style={{ display: displayStyle }}>
            <ImageContainer answered={questionsList.findIndex((q) => q.id === currentQuestion?.id)} question={currentQuestion} isImageLoaded={isImageLoaded} setIsImageLoaded={setIsImageLoaded} currentImageUrl={currentImageUrl} setCurrentImageUrl={setCurrentImageUrl} />
          </div>
        );
        break;
      case GAME_FORMATS.AUDIOCLIP:
      case GAME_FORMATS.QUIZ:
        gameFormat = (
          <div style={{ display: displayStyle }}>
            <QuizContainer question={currentQuestion} />
          </div>
        );
        break;
      case GAME_FORMATS.MCQ:
        gameFormat = (
          <div style={{ marginTop: "16vh", display: displayStyle }}>
            <MCQContainer question={currentQuestion} />
          </div>
        );
        break;
      case GAME_FORMATS.IMAGE_JUMBLED:
        gameFormat = (
          <div style={{ display: displayStyle }}>
            <ImageJumbledContainer answered={questionsList.findIndex((q) => q.id === currentQuestion?.id)} question={currentQuestion} isImageLoaded={isImageLoaded} setIsImageLoaded={setIsImageLoaded} currentImageUrl={currentImageUrl} setCurrentImageUrl={setCurrentImageUrl} />
          </div>
        );
        break;

      default:
        break;
    }
    return gameFormat;
  };

  const renderHintsContainer = () => {
    return <HintsContainer question={currentQuestion} />;
  };

  const renderIndividualScore = (name, score, isCorrect) => {
    return (
      <div className="text-center w-[90px] relative">
        <div className="text-primary-yellow truncate">{name}</div>
        <div className="text-3xl">{score}</div>
        <AnimatePresence>
          {isCorrect === -1 ? (
            <></>
          ) : (
            <motion.div
              className="absolute top-[60px] left-1/2 h-full w-[60px]"
              initial={{ opacity: 0, scale: 0.8, x: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%" }}
              exit={{ opacity: 0, scale: 0.8, x: "-50%" }}
              transition={{ type: "spring" }}
            >
              {isCorrect === 1 ? (
                <img alt="tick" src="/Assets/Icons/tick-green-icon.svg" />
              ) : (
                <></>
              )}
              {isCorrect === 0 ? (
                <img alt="cross" src="/Assets/Icons/cross-icon.svg" />
              ) : (
                <></>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderGameHeader = () => {
    const myPlayerData = gameState?.[myPlayerId];
    const otherPlayerData = gameState?.[otherPlayerId];
    return (
      <div className="flex justify-between w-full font-bold px-4 py-2 relative">
        {renderIndividualScore("You", myPlayerData?.score, myAnswerFlag)}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Timer
            duration={QUESTION_DURATION}
            stroke={0}
            timerEnd={() => {
              if (!haveGivenAnswer) {
                handleSubmitAnswer("", true);
              }
              setTimeout(() => {
                fetchNextQuestion();
              }, SHOW_ANSWER_ICON_TIMER + 500);
            }}
            // timerEnd={() => {}}
            startTimer={
              gameState?.isGameStarted &&
              !gameState?.gameEndedAt &&
              !loadingQuestion &&
              !showGameStartTimer &&
              hasDefaultTimePassed
            }
            key={currentQuestion?.id}
            onUpdate={(time) => {
              setCurrentRemainingTime(time);
            }}
          />
        </div>
        {renderIndividualScore(
          otherPlayerData.name,
          otherPlayerData?.score,
          otherAnswerFlag
        )}
      </div>
    );
  };

  const renderScoreBar = (percentage, position = 'left') => {
    return (
      <div
        className="absolute bottom-2 w-[6px] h-full bg-[#52525240]"
        style={{
          left: position === "left" ? "6px" : "auto",
          right: position === "right" ? "6px" : "auto",
        }}
      >
        <div className="relative h-full w-full">
          <div
            className="absolute bottom-0 w-full h-0 transition-all bg-primary-yellow"
            style={{
              height: `${percentage}%`,
            }}
          ></div>
        </div>
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

    if ((!gameState && gameId) || isUserLoading) {
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
        <div className="w-full h-full flex flex-col justify-between relative">
          {renderGameHeader()}
          <div className="flex justify-center items-center flex-col h-full relative">
            {renderScoreBar(myPlayerData?.percentageOfBar)}
            {renderScoreBar(otherPlayerData?.percentageOfBar, "right")}
            <div>{renderGameContainer()}</div>
            {showGameStartTimer || loadingQuestion || !hasDefaultTimePassed ? (
              <></>
            ) : (
              <>
                <div className="shrink-0 w-[90%]">{renderHintsContainer()}</div>
                {gameState?.format === GAME_FORMATS.AUDIO && (
                  <div>
                    <AudioContainer question={currentQuestion} />
                  </div>
                )}
                {gameState?.format === GAME_FORMATS.AUDIOCLIP && (
                  <div>
                    <AudioClipContainer question={currentQuestion} />
                  </div>
                )}
              </>
            )}
          </div>
          {gameState?.isGameStarted &&
            !gameState?.gameEndedAt &&
            !loadingQuestion &&
            !showGameStartTimer &&
            hasDefaultTimePassed && <div>
              <KeyboardInput
                quiz={quiz}
                currentQuestion={currentQuestion}
                submitAnswer={handleSubmitAnswer}
                isDisabled={
                  haveGivenAnswer ||
                  (myPlayerData?.hasPlayedAllQuestions &&
                    !otherPlayerData?.hasPlayedAllQuestions)
                }
              />
            </div>
          }
          <AnimatePresence>
            {showGameStartTimer ? (
              <AnimatedModal key="startTimer">
                {!loadingQuestion ? (
                  <Timer
                    duration={3}
                    startTimer={true}
                    stroke={0}
                    timerEnd={handleMainTimerEnd}
                    color="#ccf900"
                  />
                ) : (
                  <div className="text-primary-yellow text-[35px] font-medium py-8 px-12">GO!</div>
                )}
              </AnimatedModal>
            ) : (
              <></>
            )}
            {!showGameStartTimer &&
              (loadingQuestion || !hasDefaultTimePassed) ? (
              <AnimatedModal modalKey="questionModal" key="questionModal">
                <div className="whitespace-pre">
                  {isLastQuestion ? "Bonus Question" : "Question"}
                </div>
                <div className="text-primary-yellow text-[70px]">
                  {currentQuestion?.position}
                </div>
                <div>
                  {currentQuestion?.position} of {questionsList.length}
                </div>
              </AnimatedModal>
            ) : (
              <></>
            )}
            {myPlayerData?.hasPlayedAllQuestions &&
              !otherPlayerData?.hasPlayedAllQuestions ? (
              <AnimatedModal key="waitingModal">
                <div className="whitespace-pre text-lg">
                  Waiting for {otherPlayerData?.name} to finish
                </div>
              </AnimatedModal>
            ) : (
              <></>
            )}
          </AnimatePresence>
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
    const isAllowed =
      anonymousName && anonymousName.length > 2 && anonymousName.length <= 12;
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-full w-full px-8">
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
    const lostByPoints = gameState?.[otherPlayerId]?.score - gameState?.[myPlayerId]?.score ?? 0;
    return (
      <GameEndModal
        gameState={gameState}
        inviteOthers={handleQuitGame}
        gameId={gameId}
        gameType={gameType}
        isOpen={gameLost}
        myPlayerId={myPlayerId}
        resetGame={resetGame}
        icon="/Assets/Icons/skull.svg"
        title="Better luck next time!"
        isGameLost={true}
        showSubtitle={false}
        gameCollectionName={gameCollectionName}
        gamePoints={gamePointsEndModal}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        hintText={gameType === "oneOnOneQuiz" ? "Arnav from Class 7 in New Delhi beat his opponent and scored 76! Beat his score!" : "Rohan from Class 6 in Bengaluru beat his opponent and scored 74! Beat his score!"}
        customSubtitle
        subtitleText={
          <>
            You lost by{" "}
            <span className="text-primary-yellow">{lostByPoints}</span> points
          </>
        }
      />
    );
  };

  const renderGameWonModal = () => {
    return (
      <GameEndModal
        gameState={gameState}
        inviteOthers={handleQuitGame}
        gameId={gameId}
        gameType={gameType}
        isOpen={gameWon}
        myPlayerId={myPlayerId}
        resetGame={resetGame}
        icon="/Assets/Icons/trophy.svg"
        title="Victory is Yours!"
        isGameLost={false}
        showSubtitle={false}
        gameCollectionName={gameCollectionName}
        gameCountsForDates={gameCountsForDates}
        gamePoints={gamePointsEndModal}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        hintText={gameType === "oneOnOneQuiz" ? "Arnav from Class 7 in New Delhi beat his opponent and scored 76! Beat his score!" : "Rohan from Class 6 in Bengaluru beat his opponent and scored 74! Beat his score!"}
      />
    );
  };

  const renderGameTiedModal = () => {
    return (
      <GameEndModal
        gameState={gameState}
        inviteOthers={handleQuitGame}
        gameId={gameId}
        gameType={gameType}
        isOpen={gameTied}
        myPlayerId={myPlayerId}
        resetGame={resetGame}
        icon="/Assets/Icons/handshake.svg"
        title="Its a Tie!"
        isGameLost={false}
        showSubtitle={false}
        isGameTied={true}
        gamePoints={gamePointsEndModal}
        gameCollectionName={gameCollectionName}
        gameCountsForDates={gameCountsForDates}
        gamesLeft={DAILY_LIMIT - gameCount}
        handleFindPlayer={handleFindPlayer}
        hintText={gameType === "oneOnOneQuiz" ? "Arnav from Class 7 in New Delhi beat his opponent and scored 76! Beat his score!" : "Rohan from Class 6 in Bengaluru beat his opponent and scored 74! Beat his score!"}


      />
    );
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
        gameContainerClassName="p-0"
        headerText={headerText}
        showHeader
        backButtonLink={backButtonUrl}
        isQuizGame
        gameType={gameType}
        myPlayerLeaderboardData={myPlayerLeaderboardData}
        oneOnOneID={oneOnOneID}
        gameCollectionName={gameCollectionName}
        quitGame={quitGame}
        quitGamePopup={quitGamePopup}
        setQuitGamePopup={setQuitGamePopup}
        setExitGamePopup={setExitGamePopup}
        handleFindPlayer={handleFindPlayer}
        exitGamePopup={exitGamePopup}
        opponentLeftPopup={opponentLeftPopup}
        setOpponentLeftPopup={setOpponentLeftPopup}
        setOneOnOneID={setOneOnOneID}
        setGameWonByExit={() => {}}
        redirectRoute={backButtonUrl}
        resetStateVariables={resetStateVariables}
      />
      <ToastComponent />
    </>
  );
}

export default OneOnOneQuiz;
