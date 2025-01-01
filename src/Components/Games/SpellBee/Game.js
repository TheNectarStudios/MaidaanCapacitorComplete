import React, { useEffect, useState } from "react";
import { getScoreDataForFormat, setTrialWords, getHeaderConfigForFormat } from "../../Utils/GameUtils";
import { pauseAudioClip } from "../../Utils/AudioPlayer";
import Button from "@mui/material/Button";
import "animate.css";
import Grid from "@mui/material/Unstable_Grid2";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import { Timer, TimerFullScreen } from "./GameComponents/CountdownTimer";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./Style.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import {
  BASE_URL,
  DEMO_BASE_URL,
  ENABLE_SKIP_LS_KEY,
  FULL_GAME_STRING,
  GAME_FORMATS,
  GAME_FORMAT_IMAGE_MAP,
  getJumbledWord,
  KEYBOARD_TYPES,
  MAIN_GAME_TIMER,
  NEGATIVE_SCORE_LS_KEY,
  POSITIVE_SCORE_LS_KEY,
  TRIAL_GAME_STRING,
  TRIAL_GAME_TIMER,
  ALLOWED_ATTEMPTS_PER_ROUND,
  NEW_FORMAT_TOURNAMENT_HEADERS_CONFIG,
} from "../../../Constants/Commons";
import Loader from "../../PageComponents/Loader";
import { JumbledWord } from "./GameComponents/JumbledWord";
import { HintsContainer } from "./GameComponents/HintsContainer";
import { ImageContainer } from "./GameComponents/ImageContainer";
import { checkAnswer } from "../../Utils/AssertionLogic";
import { QuizContainer } from "./GameComponents/QuizContainer";
import AudioContainer from "./GameComponents/AudioContainer";
import AudioClipContainer from "./GameComponents/AudioClipContainer";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import { MEASURE } from "../../../instrumentation";
import { MCQContainer } from "./GameComponents/MCQContainer";
import { MCQKeyboard } from "./GameComponents/MCQKeyboard";
import axios from "axios";
import { getData, sendData } from "../../../Components/Firebase/FirebaseFunctions";
import { ImageJumbledContainer } from "./GameComponents/ImageJumbledContainer";
import AttemptDisqualifiedPopup from "../../Common/AttemptDisqualifiedPopup";
import { useAuth } from "../../../providers/auth-provider";
import { clearAttemptsAndLogs } from "../../../services/tournament";
import useGame from "../../../hooks/use-game";
import { twMerge } from "tailwind-merge";
import { calculateFinalScore } from "./GameComponents/calculateFinalScore"
import { doc, setDoc } from "firebase/firestore";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../../../../src/firebase-config";
import FlashImagesTournamentContainer from "./GameComponents/FlashImagesTournamentContainer";

const Game = (props) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { initialiseGame } = useGame();
  const TOURNAMENT_ID = searchParams.get("tId");
  const ROUND_FORMAT = searchParams.get("rF");
  const activeRound = searchParams.get("r");
  const demoGameId = searchParams.get("gId");
  const isDemoGame = searchParams.get("d") === "Y";
  const isDemo = searchParams.get("d") === "S";
  const backUrl = searchParams.get("back");
  const group = searchParams.get("group") ?? "";

  const isAudio = ROUND_FORMAT === GAME_FORMATS.AUDIO;
  const baseUrl = (isDemoGame) ? DEMO_BASE_URL : BASE_URL;

  const [isDesktop, setIsDesktop] = useState(false);

  const [hideGameContainer, setHideGameContainer] = useState(true);
  const [currentActiveQuestion, setCurrentActiveQuestion] = useState(null);
  const [currentQuestionsList, setCurrentQuestionsList] = useState([]);
  const [submitTimeLogList, setSubmitTimeLogList] = useState([]);
  const [isInternetSlow, setIsInternetSlow] = useState(false);
  const [tournamentScoreType, setTournamentScoreType] = useState(null);
  const roundTitle = localStorage.getItem("roundTitle") ?? '';
  const keyboardType = localStorage.getItem("keyboardType");
  const assertionLogic = localStorage.getItem("assertionLogic");
  const quizColl = localStorage.getItem("quizColl");
  const positiveScore = Number(localStorage.getItem(POSITIVE_SCORE_LS_KEY));
  const negativeScore = Number(localStorage.getItem(NEGATIVE_SCORE_LS_KEY));
  const enableSkip = Boolean(JSON.parse(localStorage.getItem(ENABLE_SKIP_LS_KEY)));
  const roundInfo = JSON.parse(localStorage.getItem("roundInfo") ?? "{}");
  const userId = localStorage.getItem("userId");

  const roundDuration = localStorage.getItem("roundDuration");

  const gameStartedAt = localStorage.getItem("gameStartedAt");
  const trailGame = localStorage.getItem("trailRun");
  const lScore = localStorage.getItem("score");
  const gameType = localStorage.getItem("gameType");
  const attemptNumber = localStorage.getItem("attemptNumber");
  const [input, setInput] = React.useState("");
  const [attempt, setAttempt] = React.useState(
    attemptNumber ? Number(attemptNumber) : 0
  );
  const [gameLoading, updateLoading] = React.useState(false);
  const [trailRun, updateTrailRun] = React.useState(
    trailGame && JSON.parse(trailGame)
  );
  const initialSCore = {
    answered: 0,
    correct: 0,
    wrong: 0,
    total: 0,
  };
  const [Score, setScore] = React.useState(
    lScore ? JSON.parse(lScore) : initialSCore
  );
  const [showTimer, updateShowTimer] = React.useState(
    JSON.parse(localStorage.getItem("showTimer"))
  );
  const [gameStarted, updateGameStatus] = React.useState(
    gameStartedAt ? gameStartedAt : false
  );

  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isGameEnding, setIsGameEnding] = React.useState(false);
  const [showToolTip, updateShowToolTip] = React.useState(false);
  const [currentGameMode, updateCurrentGameMode] = React.useState(gameType);
  const [playMode, updatePlayMode] = React.useState(false);
  const ROUND_MAIN_GAME_TIMER = roundDuration != null && !isNaN(Number(roundDuration))
    ? Number(roundDuration)
    : MAIN_GAME_TIMER;
  const [timer, updateTimer] = React.useState(
    gameType && gameType === FULL_GAME_STRING ? ROUND_MAIN_GAME_TIMER : TRIAL_GAME_TIMER
  );
  const [showAttemptDisqualifiedPopup, setShowAttemptDisqualifiedPopup] =
    React.useState(false);
  const [totalAttempts, setTotalAttempts] = React.useState(1);
  const keyboard = React.useRef();
  const inputBox = React.useRef();
  const submitBtn = React.useRef();
  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
    boxShadow: "none",
  }));

  useEffect(() => {
    const resizeListener = () => {
      setIsDesktop(window.innerWidth > window.innerHeight);
    };
    window.addEventListener("resize", resizeListener);
    return () => {
      window.removeEventListener("resize", resizeListener);
    };
  }, []);


  useEffect(() => {
    async function fetchScoreType() {
      const roundRef = doc(db, "tournaments", TOURNAMENT_ID, "rounds", activeRound);
      const roundDoc = await getDoc(roundRef);
      if (roundDoc.exists()) {
        setTournamentScoreType(() => roundDoc.data().scoreType)
      } else {
        console.log("No such document!");
      }
    }

    fetchScoreType();
  }, [])

  const exitGame = async (type) => {
    setCurrentImageUrl("");
    setIsImageLoaded(false);
    setHideGameContainer(true);
    updatePlayMode(false);
    localStorage.setItem("gamePlaying", false);
    if (type !== "scoreCard") {
      props.popupOpen(true);
      props.updateMessage({
        message: `Time's up! All Set?`,
        type: "prompt",
        scoreType: tournamentScoreType,
        buttonMessage: ["Yes, I'm ready to play", "Not yet there's an issue"],
        cta: [endTrailRun, resetGame],
        closeBtn: false,
      });
      localStorage.setItem("trailRun", false);
      updateGameStatus(false);
      localStorage.removeItem("gameStartedAt");
    } else {
      const score = localStorage.getItem("score");
      const userId = localStorage.getItem("userId");
      const firstName = localStorage.getItem("firstName");
      const selectedTenant = localStorage.getItem("selectedTenant");
      const isWeeklyQuiz = Boolean(JSON.parse(localStorage.getItem("isWeeklyQuiz")));
      const isQuiz = Boolean(JSON.parse(localStorage.getItem("isQuiz")));
      const roundDuration = localStorage.getItem("roundDuration");
      localStorage.clear();
      if (isDemoGame && demoGameId) {
        localStorage.setItem("gId", demoGameId);
      }
      localStorage.setItem("roundDuration", roundDuration);
      localStorage.setItem("keyboardType", keyboardType);
      localStorage.setItem("assertionLogic", assertionLogic);
      localStorage.setItem("roundTitle", roundTitle);
      localStorage.setItem("score", score);
      localStorage.setItem("userId", userId);
      localStorage.setItem("firstName", firstName);
      localStorage.setItem("selectedTenant", selectedTenant);
      localStorage.setItem("isWeeklyQuiz", isWeeklyQuiz);
      localStorage.setItem("isQuiz", isQuiz);
      localStorage.setItem(POSITIVE_SCORE_LS_KEY, positiveScore);
      localStorage.setItem(NEGATIVE_SCORE_LS_KEY, negativeScore);
      localStorage.setItem(ENABLE_SKIP_LS_KEY, enableSkip);
      if (roundInfo.roundCTA) {
        localStorage.setItem("roundInfo", JSON.stringify(roundInfo));
      }
      var total = 0,
        answered = 0,
        pace = 0,
        finalScore = 0,
        accuracy = 0,
        totalWords = 88,
        tip = "No Questions answered!",
        decScore,
        correct = 0,
        wrong = 0;
      if (score) {
        decScore = JSON.parse(score);
        total = decScore.total;
        correct = decScore.correct;
        answered = decScore.answered;
        wrong = decScore.wrong;
        pace = ROUND_MAIN_GAME_TIMER / answered;
        accuracy = (correct / answered) * 100;
        totalWords = 88;
        tip =
          "Your accuracy is great, focus on your pace to attempt more words";
      }

      MEASURE(
        INSTRUMENTATION_TYPES.SUBMIT_TIME_LOG,
        userId,
        { tournamentId: TOURNAMENT_ID, submitTimes: submitTimeLogList }
      );

      if (answered > ALLOWED_ATTEMPTS_PER_ROUND) {
        setShowAttemptDisqualifiedPopup(true);
        return;
      }

      let scoreType = tournamentScoreType;

      finalScore = calculateFinalScore(correct, scoreType, accuracy);

      //calculate score , correct attempts and attempts and pass it to java server..
      const collectionPath = `tournaments/${TOURNAMENT_ID}/leaderboard`;
      const getLeaderboardData = await getData(collectionPath, isDemoGame ? demoGameId : userId);
      const { correctAttempts: correctAttempts = [], score: tempScore = [], attempts = [] } = getLeaderboardData;
      tempScore.pop();
      attempts.pop();
      correctAttempts.push(correct);
      tempScore.push(finalScore);
      attempts.push(answered);

      const finalData = {
        ...getLeaderboardData,
        score: tempScore,
        correctAttempts: correctAttempts,
        attempts,
      };

      // API call to end game
      const url = `${baseUrl}/end`;

      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      var raw = JSON.stringify({
        childId: userId,
        tournamentId: TOURNAMENT_ID,
        finalScore: finalScore,
        correctAttempts: correct,
        attempts: answered,
        gameId: demoGameId || undefined,
        group: (isDemoGame && group) ? group : undefined,
      });

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
      };

      try {
        setIsGameEnding(true);
        await fetch(url, requestOptions);

        //get ScoreType
        /*let scoreType = [];
        try{
          const tournamentCollectionRef = doc(db,'tournaments',TOURNAMENT_ID);
          const tournamentCollectionDoc = await getDoc(tournamentCollectionRef);

          if(tournamentCollectionDoc.exists()){
            scoreType = tournamentCollectionDoc.data().scoreType;
          }
          else{
            console.log('No such document!');
          }
        }
        catch (error) {
          console.error('Error fetching document:', error);
        }*/

        //const finalScore = calculateFinalScore(correct,scoreType, accuracy);
        //update score in children/games subcollection

        /*if(activeRound !== null && activeRound !== undefined){
          const gamesCollectionRef = collection(db, "children", userId, "games");
          
            const querySnapshot = await getDocs(
            query(gamesCollectionRef, where("tournamentId", "==", TOURNAMENT_ID), where("round", "==", activeRound.toString()))
          );

          if (querySnapshot.size === 1) {
              const gameDocRef = querySnapshot.docs[0].ref;
              await updateDoc(gameDocRef, { score: finalScore });
          } 

        }*/
        // update attempts and score at last position in leaderboard
        setIsGameEnding(false);
        const finalScoreDataObject = {
          currentGameScore: tempScore[tempScore.length - 1],
          attempts: answered,
          pace: pace,
          accuracy: accuracy,
          wrong: wrong,
          correct: correct,
          totalWordsSpent: totalWords,
          tip: tip,
        };

        props.popupOpen(true);
        props.popupBackUrl(backUrl);
        props.updateMessage({
          message: `TODAY’S STATS`,
          type: "scoreCard",
          scoreType: scoreType,
          scoreData: getScoreDataForFormat(finalScoreDataObject, ROUND_FORMAT, scoreType),
          headersConfig: getHeaderConfigForFormat("DEFAULT", scoreType),
          buttonMessage: ["SHARE ON WHATSAPP"],
          cta: [],
          closeBtn: true,
          closeAction: endGame,
          tournamentId: TOURNAMENT_ID,
          isDemoGame,
          group,
          demoGameId,
          isWeeklyQuiz,
          isQuiz,
          showCorrectIncorrectDetails: negativeScore > 0,
          isDemoFlow: isDemo,
          roundNumber: activeRound,
        });
        updateGameStatus(false);
        localStorage.removeItem("gameStartedAt");
      } catch (err) {
        console.error(err);
      }
    }
  };
  const endGame = () => {
    const gameCount = localStorage.getItem("gameCount");
    const userId = localStorage.getItem("userId");
    const selectedTenant = localStorage.getItem("selectedTenant");
    const isWeeklyQuiz = Boolean(JSON.parse(localStorage.getItem("isWeeklyQuiz")));
    const isQuiz = Boolean(JSON.parse(localStorage.getItem("isQuiz")));
    const timestamp = Number(localStorage.getItem("timestamp"));
    const roundDuration = localStorage.getItem("roundDuration");
    const firstName = localStorage.getItem("firstName");
    // const gameId = localStorage.getItem("gId");
    localStorage.clear();
    if (isDemoGame && demoGameId) {
      localStorage.setItem("gId", demoGameId);
    }
    localStorage.setItem("userId", userId);
    localStorage.setItem("firstName", firstName);
    localStorage.setItem("selectedTenant", selectedTenant);
    localStorage.setItem("roundDuration", roundDuration);
    localStorage.setItem("isWeeklyQuiz", isWeeklyQuiz);
    localStorage.setItem("isQuiz", isQuiz);
    localStorage.setItem("timestamp", timestamp);
    setScore(initialSCore);
    updateShowTimer(false);
    updateGameStatus(false);
    updateTimer(ROUND_MAIN_GAME_TIMER);
    updatePlayMode(false);
    localStorage.setItem("gamePlaying", false);
    if (gameCount && Number(gameCount) < 2) {
      localStorage.setItem("gameCount", Number(gameCount) + 1);
      localStorage.setItem("gameType", FULL_GAME_STRING);
    } else {
      localStorage.setItem("gameCount", 0);
      localStorage.setItem("gameType", FULL_GAME_STRING);
    }
  };

  const updateCurrentActiveQuestion = (ques) => {
    const finalQues = { ...ques };
    if ([GAME_FORMATS.JUMBLE, GAME_FORMATS.IMAGE_JUMBLED].includes(ROUND_FORMAT) && !ques.jumbledWord) {
      const questionWordArray = ques?.question?.split(" ");
      let finalWord = "";
      let finalJumbledWord = "";
      let finalWordArray = [];
      let finalJumbledWordArray = [];
      if (questionWordArray?.length) {
        questionWordArray.forEach((w) => {
          const { wordFormated, word } = getJumbledWord(w);
          finalWordArray.push(word);
          finalJumbledWordArray.push(wordFormated);
        });
        finalWord = finalWordArray.join(" ");
        finalJumbledWord = finalJumbledWordArray.join(" ");
        localStorage.setItem("currentJumbledWord", finalWord);
        finalQues.jumbledWord = finalWord;
      }
    }
    setCurrentActiveQuestion(finalQues);
  };

  useEffect(() => {
    const gameCount = localStorage.getItem("gameCount");
    !gameCount && localStorage.setItem("gameCount", 0);
  }, []);

  useEffect(() => {
    if (!hideGameContainer) {
      const quesList = JSON.parse(localStorage.getItem("currentWord")) ?? [];
      const [firstQues] = quesList;
      setCurrentQuestionsList(quesList);
      updateCurrentActiveQuestion(firstQues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideGameContainer]);

  useEffect(() => {
    const gamePlaying = Boolean(JSON.parse(localStorage.getItem("gamePlaying")));
    const gameType = localStorage.getItem("gameType");
    if (gamePlaying && gameType === FULL_GAME_STRING) {
      //navigate to error page
      navigate("/error");
    }
    else {
      resetGame();
    }
  }, []);

  useEffect(() => {
    let timeout = null;
    if (currentQuestionsList.length) {
      clearTimeout(timeout);
      setIsInternetSlow(false);
      if (!currentActiveQuestion) {
        updateCurrentActiveQuestion(currentQuestionsList[0]);
      }
    } else {
      timeout = setTimeout(() => {
        setIsInternetSlow(true);
      }, [1500]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionsList]);

  const resetGame = () => {
    MEASURE(
      INSTRUMENTATION_TYPES.POST_TRIAL_ISSUE_BUTTON_CLICKED,
      localStorage.getItem("userId"),
      {}
    );
    setInput("");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const selectedTenant = localStorage.getItem("selectedTenant");
    const roundDuration = localStorage.getItem("roundDuration");
    const isWeeklyQuiz = Boolean(JSON.parse(localStorage.getItem("isWeeklyQuiz")));
    const isQuiz = Boolean(JSON.parse(localStorage.getItem("isQuiz")));
    const timestamp = Number(localStorage.getItem("timestamp"));
    const firstName = localStorage.getItem("firstName");
    localStorage.clear();
    if (isDemoGame && demoGameId) {
      localStorage.setItem("gId", demoGameId);
    }
    if (roundInfo.roundCTA) {
      localStorage.setItem("roundInfo", JSON.stringify(roundInfo));
    }
    localStorage.setItem("firstName", firstName);
    localStorage.setItem("token", token);
    localStorage.setItem("keyboardType", keyboardType);
    localStorage.setItem("assertionLogic", assertionLogic);
    localStorage.setItem("roundTitle", roundTitle);
    localStorage.setItem("userId", userId);
    localStorage.setItem("selectedTenant", selectedTenant);
    localStorage.setItem("roundDuration", roundDuration);
    localStorage.setItem("quizColl", quizColl);
    localStorage.setItem("isWeeklyQuiz", isWeeklyQuiz);
    localStorage.setItem("isQuiz", isQuiz);
    localStorage.setItem(POSITIVE_SCORE_LS_KEY, positiveScore);
    localStorage.setItem(NEGATIVE_SCORE_LS_KEY, negativeScore);
    localStorage.setItem(ENABLE_SKIP_LS_KEY, enableSkip);
    if (roundInfo.roundCTA) {
      localStorage.setItem("roundInfo", JSON.stringify(roundInfo));
    }
    setScore(initialSCore);
    updateShowTimer(false);
    updateGameStatus(false);
    updatePlayMode(false);
    updateTrailRun(false);
    updateCurrentGameMode("");
    localStorage.setItem("gamePlaying", false);
    localStorage.setItem("trailRun", false);
    localStorage.setItem("gameStartedAt", "");
    localStorage.setItem("gameType", "");
    updateTimer(TRIAL_GAME_TIMER);
  };

  const endTrailRun = () => {
    MEASURE(
      INSTRUMENTATION_TYPES.POST_TRIAL_READY_BUTTON_CLICKED,
      localStorage.getItem("userId"),
      {}
    );
    handleEndTrialRunLogic();

  };

  const handleEndTrialRunLogic = () => {
    setInput("");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const selectedTenant = localStorage.getItem("selectedTenant");
    const roundDuration = localStorage.getItem("roundDuration");
    const isWeeklyQuiz = Boolean(
      JSON.parse(localStorage.getItem("isWeeklyQuiz"))
    );
    const firstName = localStorage.getItem("firstName");
    const isQuiz = Boolean(JSON.parse(localStorage.getItem("isQuiz")));
    const timestamp = Number(localStorage.getItem("timestamp"));
    localStorage.clear();
    if (isDemoGame && demoGameId) {
      localStorage.setItem("gId", demoGameId);
    }
    if (roundInfo.roundCTA) {
      localStorage.setItem("roundInfo", JSON.stringify(roundInfo));
    }
    localStorage.setItem("firstName", firstName);
    localStorage.setItem("token", token);
    localStorage.setItem("roundDuration", roundDuration);
    localStorage.setItem("selectedTenant", selectedTenant);
    localStorage.setItem("keyboardType", keyboardType);
    localStorage.setItem("userId", userId);
    localStorage.setItem("assertionLogic", assertionLogic);
    localStorage.setItem("isWeeklyQuiz", isWeeklyQuiz);
    localStorage.setItem("isQuiz", isQuiz);
    localStorage.setItem(POSITIVE_SCORE_LS_KEY, positiveScore);
    localStorage.setItem(NEGATIVE_SCORE_LS_KEY, negativeScore);
    localStorage.setItem(ENABLE_SKIP_LS_KEY, enableSkip);
    setScore(initialSCore);
    updateShowTimer(false);
    updateGameStatus(false);
    updateTimer(ROUND_MAIN_GAME_TIMER);
    updateTrailRun(true);
    updatePlayMode(false);
    localStorage.setItem("gamePlaying", false);
    localStorage.setItem("trailRun", true);
    localStorage.setItem("gameType", FULL_GAME_STRING);
    updateCurrentGameMode(FULL_GAME_STRING);
  };

  const resetGameAndExit = () => {
    resetGame();
    // let redirectUrl = "/lobby";
    // if (isDemoGame) {
    //   redirectUrl = `/lobby?d=Y`;
    //   if (group) {
    //     redirectUrl += `&group=${group}`;
    //   }
    // }
    navigate(-1);
  };


  const handleAttemptYesSelection = async () => {
    updateLoading(true);
    await clearAttemptsAndLogs(
      userId,
      TOURNAMENT_ID
    );
    setShowAttemptDisqualifiedPopup(false);
    setTotalAttempts((prevVal) => prevVal + 1);
    const initGame = await initialiseGame(TOURNAMENT_ID, activeRound, userId, ROUND_FORMAT, isDemoGame, group);
    if (initGame) {
      handleEndTrialRunLogic();
    }
    updateLoading(false);
  };

  const handleAttemptNoSelection = async () => {
    updateLoading(true);
    await clearAttemptsAndLogs(userId, TOURNAMENT_ID);
    setShowAttemptDisqualifiedPopup(false);
    resetGameAndExit();
    updateLoading(false);
  };

  const handleAttemptExit = async () => {
    setShowAttemptDisqualifiedPopup(false);
    resetGameAndExit();
  };


  const handleSubmitApi = (input = '', jumbledWord, skipped = false) => {
    const startTime = new Date().getTime();
    axios
      .post(`${baseUrl}/submit`, {
        childId: localStorage.getItem("userId"),
        tournamentId: TOURNAMENT_ID,
        attemptNum: attempt + 1,
        answer: input.toLowerCase(),
        jumbledString: jumbledWord,
        gameId: demoGameId || undefined,
        skipped,
        currentQuestion: currentActiveQuestion.id,
      })
      .then(({ data }) => {
        if (data) {
          setCurrentQuestionsList((l) => {
            const finalList = [...l, data];
            const endTime = new Date().getTime();
            const timeDiffInSeconds = (endTime - startTime) / 1000;
            setSubmitTimeLogList([...submitTimeLogList, timeDiffInSeconds]);
            localStorage.setItem("currentWord", JSON.stringify(finalList));
            window.dispatchEvent(new Event("storage"));
            return finalList;
          });
        }
        else {
          exitGame("scoreCard");
        }
      })
      .catch((error) => console.log("error", error));
  };

  const submitMainGame = (finalInput, jumbledWord, skipped = false) => {
    setCurrentQuestionsList((ql) => {
      const previousQuestionsList = ql.slice(1);
      updateCurrentActiveQuestion(previousQuestionsList[0]);
      handleSubmitApi(finalInput, jumbledWord, skipped);
      return previousQuestionsList;
    });
    // localStorage.setItem("currentWord", JSON.stringify(previousQuestionsList));
    // window.dispatchEvent(new Event("storage"));
  };

  const submitTrialGame = (questionsList) => {
    // push the current word to last
    const tempQues = [...questionsList];
    tempQues.push(tempQues.shift());
    const [nextQues] = tempQues;
    updateCurrentActiveQuestion(nextQues);
    setCurrentQuestionsList(tempQues);
    localStorage.setItem("currentWord", JSON.stringify(tempQues));
    window.dispatchEvent(new Event("storage"));
  };

  const handleCheckAnswer = (finalInput, currentQuestion) => {
    updateShowToolTip(false);
    if (!currentQuestion) return;
    const isAnswerCorrect = checkAnswer(
      assertionLogic,
      finalInput,
      currentQuestion
    );
    if (isAnswerCorrect) {
      setScore((prevVal) => {
        const newScore = {
          ...prevVal,
          answered: prevVal.answered + 1,
          correct: prevVal.correct + 1,
          total: prevVal.total + positiveScore,
        };
        localStorage.setItem("score", JSON.stringify(newScore));
        return newScore;
      });
      props.setSnackBar({
        open: true,
        message: "CORRECT",
        type: "success",
        duration: 1500,
      });
    } else {
      setScore((prevVal) => {
        const newScore = {
          ...prevVal,
          answered: prevVal.answered + 1,
          total: prevVal.total,
          wrong: prevVal.wrong + 1,
        };
        localStorage.setItem("score", JSON.stringify(newScore));
        return newScore;
      });
      props.setSnackBar({
        open: true,
        message: "INCORRECT",
        type: "error",
        duration: 1500,
      });
    }
    keyboard?.current?.clearInput();
    setInput("");
  };

  // const pauseAnyPlayingAudio = () => {
  //   if (audioElRef && !audioElRef.paused) {
  //     pauseAudioClip();
  //   }
  // };

  const handleSubmitAnswer = (answer = '', skipped = false) => {
    pauseAudioClip();
    let finalInput = answer ? answer : input;
    finalInput = finalInput.trim();
    finalInput = skipped ? '' : finalInput;
    isAudio && setAnimation();
    if (!finalInput && !skipped) return;
    if (!playMode) {
      keyboard?.current?.clearInput();
      setInput("");
      return;
    }
    let [currentQuestion, nextQuestion] = currentQuestionsList;
    if (!nextQuestion) {
      console.log('Please wait getting questions');
    }
    setAttempt((att) => att + 1);
    switch (timer) {
      case ROUND_MAIN_GAME_TIMER:
        submitMainGame(finalInput, currentActiveQuestion?.jumbledWord, skipped);
        break;
      case TRIAL_GAME_TIMER:
        submitTrialGame(currentQuestionsList);
        break;
      default:
        break;
    }
    if (!skipped) {
      handleCheckAnswer(finalInput, currentQuestion);
    }
    keyboard?.current?.clearInput();
    setInput("");
  };

  const clearInput = () => {
    keyboard?.current?.clearInput();
    setInput("");
  };

  const onChange = (data) => {
    setInput(data);
  };

  const onKeyPress = (button) => {
    const canVibrate = window.navigator.vibrate;
    if (canVibrate) {
      navigator.vibrate(10);
    }
  };

  const closeTimerScreen = () => {
    setHideGameContainer(false);
    updatePlayMode(true);
    localStorage.setItem("gamePlaying", true);
    updateShowTimer(false);
    localStorage.setItem("showTimer", false);
    const gameType = localStorage.getItem("gameType");
    gameType === FULL_GAME_STRING
      ? updateTimer(ROUND_MAIN_GAME_TIMER)
      : updateTimer(TRIAL_GAME_TIMER);
    // playSound(1);
    updateGameStatus(true);
    localStorage.setItem("gameStartedAt", Date.parse(new Date()));
  };

  const StartGame = () => {
    //added from here
    updateLoading(true);
    setAttempt(0);
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    //myHeaders.append("Access-Control-Allow-Origin", "*");

    var raw = JSON.stringify({
      childId: localStorage.getItem("userId"),
      tournamentId: TOURNAMENT_ID,
      gameId: demoGameId || undefined,
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    fetch(`${baseUrl}/start`, requestOptions)
      .then((res) => {
        if (res.status >= 400) return (window.location.href = "/error");

        return res.text();
      })
      .then((response) => {
        updateLoading(false);
        updateShowTimer(true);
        updateTimer(ROUND_MAIN_GAME_TIMER);
        isAudio && setTimeout(() => setAnimation(), 4000);

        localStorage.setItem("gameStartedAt", Date.parse(new Date()));
        localStorage.setItem("gameType", FULL_GAME_STRING);
        updateCurrentGameMode(FULL_GAME_STRING);

        localStorage.setItem("currentWord", response);
        // setCurrentQuestionsList(response);
        // if (!currentActiveQuestion) {
        //   setCurrentActiveQuestion(response[0]);
        // }
        window.dispatchEvent(new Event("storage"));
      })
      .catch((error) => (window.location.href = "/error"));
  };

  const trailRunPopup = async () => {
    const quesList = await setTrialWords(quizColl);
    setCurrentQuestionsList(quesList);
    props.popupOpen(true);
    props.updateMessage({
      title: isAudio
        ? `Put on HEADPHONES, make sure your phone is not on silent & use the next ${TRIAL_GAME_TIMER} seconds to`
        : `Use the next ${TRIAL_GAME_TIMER} seconds to warm up with a few trial questions.`,
      message: "All superstars need a dry-run",
      list: isAudio ? ["Adjust volume", "Warm up with a few trial words"] : [],
      type: "list",
      buttonMessage: ["START TRIAL"],
      cta: [startTrailRun],
      closeBtn: true,
    });
  };

  const helpPopUp = () => {
    props.popupOpen(true);
    props.updateMessage({
      message:
        "You can reach us at +918618006284",
      closeBtn: true,
    });
  };

  const setAnimation = () => {
    document.getElementsByClassName("mainBtn1")[0].className = "mainBtn1";
    setTimeout(() => {
      document.getElementsByClassName("mainBtn1")[0].className =
        "mainBtn1 animate__animated animate__pulse animate__repeat-3";
    }, 0);
  };

  const startTrailRun = () => {
    MEASURE(
      INSTRUMENTATION_TYPES.TRIALGAME_POPUP_START_BUTTON_CLICKED,
      localStorage.getItem("userId"),
      {}
    );

    isAudio && setTimeout(() => setAnimation(), 4000);
    // updateGameStatus(true);
    updateTrailRun(false);
    updateTimer(TRIAL_GAME_TIMER);
    updateShowTimer(true);
    localStorage.setItem("trailRun", true);
    localStorage.setItem("gameType", TRIAL_GAME_STRING);
    updateCurrentGameMode(TRIAL_GAME_STRING);
    setAttempt(0);
  };


  const sampleImageUrl =
    GAME_FORMAT_IMAGE_MAP[`${ROUND_FORMAT}-${keyboardType}`];

  const renderSlowInternetBanner = () => {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <span>Please wait while we get your question</span>
      </div>
    );
  };

  const renderGameContainer = () => {
    if (hideGameContainer) {
      return <></>;
    }
    if (isInternetSlow) {
      return renderSlowInternetBanner();
    }
    let gameFormat = <></>;
    switch (ROUND_FORMAT) {
      case GAME_FORMATS.JUMBLE:
        gameFormat = (
          <div className="w-full h-full flex items-center">
            <JumbledWord question={currentActiveQuestion} />
          </div>
        );
        break;
      case GAME_FORMATS.IMAGE:
        gameFormat = (
          <div>
            <ImageContainer
              answered={Score.answered}
              question={currentActiveQuestion}
              isImageLoaded={isImageLoaded}
              setIsImageLoaded={setIsImageLoaded}
              currentImageUrl={currentImageUrl}
              setCurrentImageUrl={setCurrentImageUrl}
            />
          </div>
        );
        break;
      case GAME_FORMATS.AUDIOCLIP:
      case GAME_FORMATS.QUIZ:
        gameFormat = (
          <div>
            <QuizContainer question={currentActiveQuestion} />
          </div>
        );
        break;
      case GAME_FORMATS.MCQ:
        gameFormat = (
          <div style={{ marginTop: "16vh" }}>
            <MCQContainer question={currentActiveQuestion} />
          </div>
        );
        break;
      case GAME_FORMATS.IMAGE_JUMBLED:
        gameFormat = (
          <div>
            <ImageJumbledContainer
              answered={Score.answered}
              question={currentActiveQuestion}
              isImageLoaded={isImageLoaded}
              setIsImageLoaded={setIsImageLoaded}
              currentImageUrl={currentImageUrl}
              setCurrentImageUrl={setCurrentImageUrl}
            />
          </div>
        );
        break;
      case GAME_FORMATS.FLASH_IMAGES:
        gameFormat = (
          <div>
            <FlashImagesTournamentContainer
              answered={Score.answered}
              question={currentActiveQuestion}
              isImageLoaded={isImageLoaded}
              setIsImageLoaded={setIsImageLoaded}
            />
          </div>
        );
        break;

      default:
        break;
    }
    return gameFormat;
  };

  const renderScoreTypeSection = () => {
    if (tournamentScoreType?.includes("AccuracyBoost")) {
      return (
        <>
          <span class="font-bold" style={{ color: "#E3001E" }}>SCORING SYSTEM</span>
          <br />
          <br />
          Score = Correct Ans + Accuracy Boost
          <br />
          <br />
          <span class="font-bold">Accuracy Boost Calculation</span>
          <br />
          <table class="w-100 inline-block mx-auto">
            <thead>
              <tr>
                <th class="border px-[20px] py-2">Accuracy</th>
                <th class="border px-8 py-2">Boost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border px-4 py-2"> &gt; 80%</td>
                <td class="border px-4 py-2">5</td>
              </tr>
              <tr>
                <td class="border px-4 py-2">70% - 80%</td>
                <td class="border px-4 py-2">3</td>
              </tr>
              <tr>
                <td class="border px-4 py-2">50% - 70%</td>
                <td class="border px-4 py-2">1</td>
              </tr>
              <tr>
                <td class="border px-4 py-2">&lt; 50%</td>
                <td class="border px-4 py-2">0</td>
              </tr>
            </tbody>
          </table>
        </>
      );
    }
    if (tournamentScoreType?.includes("MemoryCards")) {
      return (
        <>
          <span class="font-bold" style={{ color: "#E3001E" }}>SCORING SYSTEM</span>
          <br />
          <br />
          Score = 5 + X + Y
          <br />
          <br />
          <span class="font-bold">Description</span>
          <br />
          <table class="w-100 inline-block mx-auto">
            <tbody>
              <tr>
                <td class="border px-4 py-2">5</td>
                <td class="border px-4 py-2">Points for playing</td>
              </tr>
              <tr>
                <td class="border px-4 py-2">X</td>
                <td class="border px-4 py-2">Number of matches found</td>
              </tr>
              <tr>
                <td class="border px-4 py-2">Y</td>
                <td class="border px-4 py-2">Moves left if all matches found</td>
              </tr>
            </tbody>
          </table>
        </>
      );
    }
    return <></>;
  };

  return (
    <>
      {gameLoading || isGameEnding ? (
        <div className="flex w-screen max-w-3xl h-full items-center justify-center">
          <Loader />
        </div>
      ) : (
        <>
          <div className="flex flex-col h-full">
            {showTimer && (
              <TimerFullScreen duration={3} stroke={0} cb={closeTimerScreen} />
            )}
            {(!gameStarted || !trailRun) && !gameStarted ? (
              <div className="bg-white py-[2%] px-[4%] min-h-[6vh] flex items-center justify-between">
                <div>
                  {(!gameStarted || !trailRun) && !gameStarted && (
                    <Button
                      className="mainButton Btn-sm"
                      onClick={resetGameAndExit}
                    >
                      EXIT
                    </Button>
                  )}
                </div>
                {!gameStarted && trailRun && (
                  <div>
                    <Button className="mainButton letsGo" onClick={StartGame}>
                      START
                    </Button>
                  </div>
                )}
                {!trailRun && !gameStarted && (
                  <div>
                    <Button
                      className="mainButton letsGo"
                      onClick={trailRunPopup}
                    >
                      PLAY TRIAL
                    </Button>
                  </div>
                )}
                <div>
                  {(!gameStarted || !trailRun) && !gameStarted && (
                    <Button className="mainButton Btn-sm" onClick={helpPopUp}>
                      HELP
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
            <div className={twMerge("h-full")}>
              {playMode ? (
                <div className="h-auto">
                  <div className="flex items-center justify-between w-full px-2">
                    <Grid>
                      <Item className="attemptsContainer">
                        <div class="flex flex-col items-center justify-center">
                          <div class="title text-3xl font-bold">ATTEMPTS</div>
                          <div class="value text-2xl">
                            {Score.answered < 10
                              ? `0${Score.answered}`
                              : Score.answered}
                          </div>
                        </div>
                      </Item>
                    </Grid>
                    <Grid sx={{ position: "relative", zIndex: "10" }}>
                      <Item
                        sx={{
                          backgroundColor: "transparent",
                        }}
                      >
                        <Timer
                          duration={timer}
                          stroke={5}
                          timerEnd={
                            currentGameMode === TRIAL_GAME_STRING
                              ? exitGame
                              : () => exitGame("scoreCard")
                          } // timerEnd={() => {}}
                          startTimer={gameStarted}
                          mainGameTimer={ROUND_MAIN_GAME_TIMER}
                        />
                      </Item>
                    </Grid>
                    <Grid>
                      <Item>
                        <div class="flex flex-col items-center justify-center">
                          <div class="title text-3xl font-bold">CORRECT</div>
                          <div class="value text-2xl">
                            {Score.total < 10
                              ? `0${Score.correct}`
                              : Score.correct}
                          </div>
                        </div>
                      </Item>
                    </Grid>
                  </div>
                </div>
              ) : (
                <></>
              )}

              <div
                className={twMerge(
                  `flex items-center justify-center flex-col mt-[2vh] mx-4 md:mx-6`,
                  hideGameContainer ? "h-auto" : "h-1/2",
                  roundInfo?.roundCTA
                    ? "gap-[3vh] md:gap-[6vh]"
                    : "gap-4 md:gap-0"
                )}
              >
                {!showToolTip && (
                  <>
                    {currentGameMode &&
                      currentGameMode === FULL_GAME_STRING &&
                      !gameStarted && (
                        <p style={{ textAlign: "center" }}>
                          Next {ROUND_MAIN_GAME_TIMER} seconds, NO PAUSE
                          <br />
                          Time to Rock n Roll!
                        </p>
                      )}
                    {currentGameMode &&
                      currentGameMode === FULL_GAME_STRING &&
                      !gameStarted ? (
                      <div class="mx-auto max-w-lg">
                        <p class="text-center text-lg mb-4">
                          {renderScoreTypeSection()}
                        </p>
                      </div>
                    ) : (
                      <></>
                    )}
                    {((currentGameMode &&
                      currentGameMode === TRIAL_GAME_STRING) ||
                      !currentGameMode) &&
                      !gameStarted && (
                        <>
                          <h2 className="md:text-4xl text-center">
                            <b>
                              {roundInfo?.roundCTA
                                ? roundInfo?.roundCTA
                                : roundTitle}
                            </b>
                          </h2>
                          {roundInfo?.roundCTA ? (
                            <></>
                          ) : (
                            <p className="md:text-2xl">
                              Play a few trial questions to warm up
                            </p>
                          )}
                        </>
                      )}
                  </>
                )}
                {renderGameContainer()}
                {!hideGameContainer ? (
                  <>
                    {!isInternetSlow && (
                      <HintsContainer
                        question={currentActiveQuestion}
                        roundFormat={ROUND_FORMAT}
                      />
                    )}
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "auto",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "800px",
                          margin: "15px auto 0 auto",
                          position: "absolute",
                          bottom: "0",
                          width: "100%",
                        }}
                      >
                        {/* bottom buttons */}
                        {ROUND_FORMAT === GAME_FORMATS.AUDIO ? (
                          isInternetSlow ? (
                            renderSlowInternetBanner()
                          ) : (
                            <div>
                              <AudioContainer
                                question={currentActiveQuestion}
                              />
                            </div>
                          )
                        ) : (
                          <></>
                        )}
                        {ROUND_FORMAT === GAME_FORMATS.AUDIOCLIP ? (
                          isInternetSlow ? (
                            renderSlowInternetBanner()
                          ) : (
                            <div>
                              <AudioClipContainer
                                question={currentActiveQuestion}
                              />
                            </div>
                          )
                        ) : (
                          <></>
                        )}
                        {keyboardType === GAME_FORMATS.MCQ ? (
                          isInternetSlow ? (
                            <></>
                          ) : (
                            <MCQKeyboard
                              question={currentActiveQuestion}
                              onSubmit={handleSubmitAnswer}
                              enableSkip={enableSkip}
                            />
                          )
                        ) : (
                          <>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "10px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexDirection: "row",
                                  gap: "6px",
                                  width: "100%",
                                  padding: "0 10px",
                                }}
                              >
                                {enableSkip ? (
                                  <span
                                    style={{
                                      fontSize: "14px",
                                      textDecoration: "underline",
                                      minWidth: "fit-content",
                                    }}
                                    onClick={() =>
                                      handleSubmitAnswer(input, true)
                                    }
                                  >
                                    Skip {">>"}
                                  </span>
                                ) : (
                                  <></>
                                )}
                                <div
                                  style={{
                                    position: "relative",
                                    display: "flex",
                                    width: "100%",
                                    gap: "10px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "100%",
                                      position: "relative",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      ref={inputBox}
                                      {...(!isDesktop
                                        ? { readOnly: true }
                                        : {})}
                                      style={{
                                        border: "1px solid #CCF900",
                                        outline: "none",
                                        // minWidth: "40vw",
                                        // height: "2.5vh",
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "10px",
                                        width: "100%",
                                        backgroundColor: "#F5F5F5",
                                        borderRadius: "6px",
                                        boxShadow:
                                          "0px 6px 10px -3px #80808029",
                                        fontWeight: "600",
                                        color: "grey",
                                        fontSize: "20px",
                                        textAlign: "center",
                                      }}
                                      defaultValue={input}
                                      onChange={(e) => setInput(e.target.value)}
                                    />
                                    {input && input.length > 0 && (
                                      <div
                                        style={{
                                          fontSize: "18px",
                                          color: "black",
                                          display: "flex",
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          position: "absolute",
                                          right: "3px",
                                          zIndex: "10",
                                        }}
                                      >
                                        <HighlightOffIcon
                                          onClick={clearInput}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="contained"
                                    ref={submitBtn}
                                    className="mainButton submitBtn"
                                    onClick={() => handleSubmitAnswer(input)}
                                  >
                                    ⏎
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <Keyboard
                              keyboardRef={(r) => (keyboard.current = r)}
                              layoutName="default"
                              layout={{
                                default: keyboardType
                                  ? KEYBOARD_TYPES[keyboardType]
                                  : KEYBOARD_TYPES.ALPHABETS,
                              }}
                              display={{
                                "{bksp}": "⌫",
                                "{space}": "Space",
                              }}
                              physicalKeyboardHighlight={true}
                              onChange={onChange}
                              onKeyPress={onKeyPress}
                              theme={"hg-theme-default myTheme1"}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {(sampleImageUrl || roundInfo?.roundInitImage) &&
                      (currentGameMode === TRIAL_GAME_STRING ||
                        !currentGameMode) &&
                      !gameStarted ? (
                      <>
                        <div className="gap-3 flex flex-col justify-center items-center">
                          {roundInfo?.roundInitImage ? (
                            <></>
                          ) : (
                            <span className="md:text-2xl md:mb-4">
                              How your game will look
                            </span>
                          )}
                          {roundInfo?.roundInitImage ? (
                            <img
                              src={roundInfo?.roundInitImage}
                              alt="sample"
                              className={twMerge(
                                "max-h-[50vh] h-full w-full object-cover",
                                roundInfo?.roundFact && "max-h-[30vh]"
                              )}
                            />
                          ) : (
                            <img
                              src={sampleImageUrl}
                              alt="sample"
                              className="h-[50vh] aspect-[9/16]"
                            />
                          )}
                        </div>
                        {roundInfo?.roundFact ? (
                          <div>
                            <div className="text-xl md:text-2xl text-center">
                              <b>Did you know?</b>
                            </div>
                            <div className="text-[18px] md:text-2xl text-center mt-[6px] text-[#3a3a3a] font-light">
                              <b>{roundInfo?.roundFact}</b>
                            </div>
                          </div>
                        ) : (
                          <></>
                        )}
                      </>
                    ) : (
                      <></>
                    )}
                  </>
                )}
              </div>
              {/* Input Box */}
            </div>
          </div>
          {showAttemptDisqualifiedPopup && (
            <AttemptDisqualifiedPopup
              open={showAttemptDisqualifiedPopup}
              handleClose={() => setShowAttemptDisqualifiedPopup(false)}
              handleNo={handleAttemptNoSelection}
              handleYes={handleAttemptYesSelection}
              allowedAttempts={1}
              totalAttempts={totalAttempts}
              handleExit={handleAttemptExit}
            />
          )}
        </>
      )}
    </>
  );
};

export default Game;
