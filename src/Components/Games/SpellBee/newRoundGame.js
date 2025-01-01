import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import "animate.css";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import { Timer, TimerFullScreen } from "./GameComponents/CountdownTimer";
import "react-simple-keyboard/build/css/index.css";
import "./Style.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import shuffle from "../../../GamesArena/Common/shuffle";
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
    NEW_FORMAT_TOURNAMENT_GAMES,
    NEW_FORMAT_TOURNAMENT_GAME_TIMER,
    NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER,
    NEW_FORMAT_MAX_ATTEMPTS_LIMIT,
    MEMORY_CARDS_COMPLETION_CORRECT_ANSWERS,
    NEW_FORMAT_PLAYING_BONUS,
    NEW_FORMAT_TOURNAMENT_HEADERS_CONFIG,
    HIDE_SKIP_TRIAL_FORMATS,
    getDemoFlowData,
} from "../../../Constants/Commons";
import Loader from "../../PageComponents/Loader";

import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import { MEASURE } from "../../../instrumentation";
import {
    getData,
    sendData,
} from "../../../Components/Firebase/FirebaseFunctions";
import { MemoryCardsContainer } from "./GameComponents/MemoryCardsContainer";
import { useAuth } from "../../../providers/auth-provider";
import { twMerge } from "tailwind-merge";
import { calculateFinalScore } from "./GameComponents/calculateFinalScore";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import {
    collection,
    getDocs,
    getDoc,
    query,
    where,
    updateDoc,
} from "firebase/firestore";
import { db, storage } from "../../../../src/firebase-config";
import {
    MATRIX_TOURNAMENT_ROUND,
    MATRIX_PRO_TOURNAMENT_ROUND,
} from "../../../Constants/GamesArena/MemoryCards";
import { NewFormatTimer } from "./GameComponents/NewFormatCountDownTimer";
import AppButton from "../../Common/AppButton";
import CodingGameContainer from "./GameComponents/CodingGameContainer";

import {
    fetchQuestionsFromCollection,
    getHeaderConfigForFormat,
    getScoreDataForFormat,
    setTrialWords,
} from "../../Utils/GameUtils";
import { Tangram } from "./GameComponents/Tangram/TangramContainer";
import GeoLocator from "./GameComponents/GeoLocator/GeoLocator";
import PaperCheckingContainer from "./GameComponents/PaperChecking";
import CategoriesRoundContainer from "./GameComponents/Categories";
import { MatchingColumnsRoundContainer } from "./GameComponents/matchingColumns";

const NewFormatGame = (props) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isDemo = searchParams.get("d") === "S";
    const { user: userTemp } = useAuth();
    let user;
    if (isDemo) {
        const userId = localStorage.getItem("userId");
        const firstName = localStorage.getItem("firstName");
        const additionData = getDemoFlowData();
        user = {
            firstName,
            id: userId,
            ...additionData,
        };
    }
    else {
        user = userTemp;
    }
    const TOURNAMENT_ID = searchParams.get("tId");
    let ROUND_FORMAT = searchParams.get("rF");
    const pro = searchParams.get("pro");
    ROUND_FORMAT = ROUND_FORMAT === "MEMORY_CARDS" ? (pro === "Y" ? "MEMORY_CARDS_PRO" : "MEMORY_CARDS") : ROUND_FORMAT;
    const activeRound = searchParams.get("r");
    const demoGameId = searchParams.get("gId");
    const isDemoGame = searchParams.get("d") === "Y";
    const group = searchParams.get("group") ?? "";
    const backUrl = searchParams.get("back");

    const isAudio = ROUND_FORMAT === GAME_FORMATS.AUDIO;
    const baseUrl = isDemoGame ? DEMO_BASE_URL : BASE_URL;
    const isNewFormatTournamentRound = NEW_FORMAT_TOURNAMENT_GAMES.includes(ROUND_FORMAT);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [isListenearSetup, setIsListenearSetup] = useState(false);
    const [hideGameContainer, setHideGameContainer] = useState(true);
    const [currentActiveQuestion, setCurrentActiveQuestion] = useState(null);
    const [currentActiveIndex, setCurrentActiveIndex] = useState(0);
    const [currentQuestionsList, setCurrentQuestionsList] = useState([]);
    const [submitTimeLogList, setSubmitTimeLogList] = useState([]);
    const [isInternetSlow, setIsInternetSlow] = useState(false);
    const [tournamentScoreType, setTournamentScoreType] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [showPopupMessage, setShowPopupMessage] = useState(false);
    const [showGameEndPopup, setShowGameEndPopup] = useState(null);

    const [waitingForGameEnd, setWaitingForGameEnd] = useState(false);
    const [revealAllCards, setRevealAllCards] = useState(false);
    const [finalScoreDataObject, setFinalScoreDataObject] = useState(null);
    const [memoryRoundFormat, setMemoryRoundFormat] = useState(ROUND_FORMAT);
    const roundTitle = localStorage.getItem("roundTitle") ?? '';
    const keyboardType = localStorage.getItem("keyboardType");
    const assertionLogic = localStorage.getItem("assertionLogic");
    const quizColl = localStorage.getItem("quizColl");
    const positiveScore = Number(localStorage.getItem(POSITIVE_SCORE_LS_KEY));
    const negativeScore = Number(localStorage.getItem(NEGATIVE_SCORE_LS_KEY));
    const enableSkip = Boolean(JSON.parse(localStorage.getItem(ENABLE_SKIP_LS_KEY)));
    const roundInfo = JSON.parse(localStorage.getItem("roundInfo") ?? "{}");

    const sampleImageUrl =
        GAME_FORMAT_IMAGE_MAP[`${ROUND_FORMAT}-${keyboardType}`];
    // not my vars
    const gameStartedAt = localStorage.getItem("gameStartedAt");
    const trailGame = localStorage.getItem("trailRun");
    const lScore = localStorage.getItem("score");
    const gameType = localStorage.getItem("gameType");
    const attemptNumber = localStorage.getItem("attemptNumber");
    const roundDifficultyPattern = localStorage.getItem("roundDifficultyPattern");
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
    const [roundDifficulty, setRoundDifficulty] = useState(null);
    const MAIN_GAME_TIMER_UPDATED = isNewFormatTournamentRound ? NEW_FORMAT_TOURNAMENT_GAME_TIMER[ROUND_FORMAT] : MAIN_GAME_TIMER;
    const TRIAL_GAME_TIMER_UPDATED = isNewFormatTournamentRound ? NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER[ROUND_FORMAT] : TRIAL_GAME_TIMER;
    const [memoryCardsGameDocId, setMemoryCardsGameDocId] = useState("");
    const [currentImageUrl, setCurrentImageUrl] = useState("");
    const [showWrapPopup, setShowWrapPopup] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isGameEnding, setIsGameEnding] = React.useState(false);
    const [isGameEnd, setIsGameEnd] = React.useState(false);
    const [showToolTip, updateShowToolTip] = React.useState(false);
    const [currentGameMode, updateCurrentGameMode] = React.useState(gameType);
    const [playMode, updatePlayMode] = React.useState(false);
    const [timer, updateTimer] = React.useState(() => {
        if (gameType && gameType === FULL_GAME_STRING) {
            return NEW_FORMAT_TOURNAMENT_GAMES.includes(ROUND_FORMAT) ? NEW_FORMAT_TOURNAMENT_GAME_TIMER[ROUND_FORMAT] : MAIN_GAME_TIMER;
        }
        else {
            return NEW_FORMAT_TOURNAMENT_GAMES.includes(ROUND_FORMAT) ? NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER[ROUND_FORMAT] : TRIAL_GAME_TIMER;
        }
    });
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


    useEffect(() => {

        if (showWrapPopup && finalScoreDataObject) {
            props.popupOpen(true);
            props.popupBackUrl(backUrl);
            props.updateMessage({
                message: `TODAY’S STATS`,
                type: "scoreCard",
                scoreType: finalScoreDataObject.scoreType,
                scoreData: getScoreDataForFormat(finalScoreDataObject, ROUND_FORMAT),
                buttonMessage: ["SHARE ON WHATSAPP"],
                cta: [],
                closeBtn: true,
                closeAction: endGame,
                tournamentId: TOURNAMENT_ID,
                isDemoGame,
                isDemoFlow: isDemo,
                group,
                demoGameId,
                isWeeklyQuiz: finalScoreDataObject.isWeeklyQuiz,
                isQuiz: finalScoreDataObject.isQuiz,
                showCorrectIncorrectDetails: negativeScore > 0,
                headersConfig: getHeaderConfigForFormat(ROUND_FORMAT),
                isCodingGame: ROUND_FORMAT === GAME_FORMATS.CODING_ALGOS,
                isTangramRound: ROUND_FORMAT === GAME_FORMATS.TANGRAM,
                roundNumber: activeRound,
            });
            updateGameStatus(false);
            localStorage.removeItem("gameStartedAt");
        }

    }, [showWrapPopup, finalScoreDataObject]);

    useEffect(() => {
        const initGame = async () => {
            if (isNewFormatTournamentRound && user?.id && !isGameStarted) {
                const gameDocumentId = await getDocumentId(TOURNAMENT_ID, user?.id, activeRound);
                setMemoryCardsGameDocId(gameDocumentId);
                await startMemoryCardsGame(gameDocumentId);
                setIsGameStarted(true)
            }
        }
        initGame();
    }, [isNewFormatTournamentRound, user, activeRound, TOURNAMENT_ID]);

    useEffect(() => {
        if (gameState) {
            const score = calculateScoreForRoundFormat(gameState);
            setScore(score);
        }
    }, [gameState]);

    useEffect(() => {
        // add a listener to the document with the gameId
        // if the document changes, we want to update the board
        if (!memoryCardsGameDocId || isListenearSetup) return;

        const memoryCardsCollection = collection(db, "children", user.id, "games");
        const unsubscribe = onSnapshot(doc(memoryCardsCollection, memoryCardsGameDocId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                /*if (data?.activeSound) {
                  playAudioClip(data.activeSound);
                }*/
                setGameState(data);
            }
        });
        setIsListenearSetup(true);
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [memoryCardsGameDocId, user]);


    const calculateScoreForRoundFormat = (gameState) => {
        let score = {
            answered: 0,
            correct: 0,
            wrong: 0,
            total: 0,
        };
        switch (ROUND_FORMAT) {
            case GAME_FORMATS.MEMORY_CARDS_PRO:
            case GAME_FORMATS.MEMORY_CARDS:
                if (gameState) {
                    const playerOne = gameState.playerOne;
                    const playerTwo = gameState.playerTwo;
                    const totalcorrect = (playerOne?.score ? playerOne?.score : 0) + (playerTwo?.score ? playerTwo?.score : 0);
                    const totalAttempts = (playerOne?.numberOfMoves ? playerOne?.numberOfMoves : 0) + (playerTwo?.numberOfMoves ? playerTwo?.numberOfMoves : 0);
                    score = {
                        answered: totalAttempts ?? 0,
                        correct: totalcorrect ?? 0,
                        wrong: (totalAttempts - totalcorrect) ?? 0,
                        total: totalAttempts ?? 0,
                    };
                }
                break;
            case GAME_FORMATS.CODING_ALGOS:
                break;
            default:
                break;
        }

        return score;
    };

    const calculateFinaleScoreForEnd = async () => {
        let finalScore = 0;
        let correct = 0;
        let answered = 0;
        let puzzlesSolved = 0;
        let timeTakenInSecs = 0;
        let timeLeftBonus = 0;
        let belowFifty = 0;
        let aboveFiftyBelowHundred = 0;
        let aboveHundredBelowTwoHundred = 0;
        let aboveTwoHundredBelowFiveHundred = 0;

        //get the document from the game collection
        const gameCollectionRef = collection(db, "children", user.id, "games");
        const gameRef = doc(gameCollectionRef, memoryCardsGameDocId);
        const gameDoc = await getDoc(gameRef);
        const gameState = gameDoc.data();
        const Score = calculateScoreForRoundFormat(gameState);
        switch (ROUND_FORMAT) {
            case GAME_FORMATS.MEMORY_CARDS_PRO:
            case GAME_FORMATS.MEMORY_CARDS:
                if (Score) {
                    finalScore = Score.correct + NEW_FORMAT_PLAYING_BONUS[memoryRoundFormat] + (Score.correct === MEMORY_CARDS_COMPLETION_CORRECT_ANSWERS[memoryRoundFormat] ? NEW_FORMAT_MAX_ATTEMPTS_LIMIT[memoryRoundFormat] - Score.answered : 0);
                    correct = Score.correct;
                    answered = Score.answered;
                    timeTakenInSecs = (Date.parse(new Date()) - Number(gameStartedAt)) / 1000;
                }
                break;
            case GAME_FORMATS.CODING_ALGOS:
                finalScore = gameState.score;
                correct = gameState.correctAttempts;
                answered = gameState.attempts;
                break;
            case GAME_FORMATS.TANGRAM:
                //timeTakenInSecs = (Date.parse(new Date()) - Number(gameStartedAt)) / 1000;
                finalScore = gameState.score;
                correct = gameState.correctAttempts;
                answered = gameState.attempts;
                //iterate thorugh the score breakdown array and add timeLeftBonus
                timeLeftBonus = Object.values(gameState?.scoreBreakdown || {}).reduce((acc, curr) => acc + curr.timeLeftBonus, 0);
                break;
            case GAME_FORMATS.GEO_LOCATOR:
                finalScore = gameState.score;
                correct = gameState.correctAttempts;
                answered = gameState.attempts;

                Object.values(gameState?.scoreBreakdown || {}).forEach((item) => {
                    if (item.distance < 50) {
                        belowFifty++;
                    } else if (item.distance < 100) {
                        aboveFiftyBelowHundred++;
                    } else if (item.distance < 200) {
                        aboveHundredBelowTwoHundred++;
                    } else if (item.distance < 500) {
                        aboveTwoHundredBelowFiveHundred++;
                    }
                });
                break;
            case GAME_FORMATS.PAPER_GRADING:
                finalScore = gameState.score;
                correct = gameState.correctAttempts;
                answered = gameState.attempts;
                break;
            // const belowFifty = Object.values(gameState?.scoreBreakdown || {}).filter((item) => item.distance < 50).length;

            case GAME_FORMATS.CATEGORIES:
                finalScore = gameState.score;
                correct = gameState.correctAttempts;
                answered = gameState.attempts;
                puzzlesSolved = Object.values(gameState.scoreBreakdown)
                    .filter((item) => item.solved)
                    .length;
                break;

            //belowFifty

            case GAME_FORMATS.MATCHING_COLUMNS:
                finalScore = gameState.score;
                correct = gameState.correctAttempts;
                answered = gameState.attempts;
                puzzlesSolved = Object.values(gameState.scoreBreakdown)
                    .filter((item) => item.solved)
                    .length;
            default:
                finalScore = gameState.score;
                correct = gameState.correctAttempts;
                answered = gameState.attempts;
                break;
        }
        return { finalScore, correct, answered, timeTakenInSecs, timeLeftBonus, belowFifty, aboveFiftyBelowHundred, aboveHundredBelowTwoHundred, aboveTwoHundredBelowFiveHundred, puzzlesSolved };
    };

    const exitGame = async (type, gameEndType = "timeup", scoreData = null) => {
        setCurrentImageUrl("");
        setIsImageLoaded(false);

        updatePlayMode(false);
        localStorage.setItem("gamePlaying", false);
        if (type !== "scoreCard") {
            const gameEndPopupMessage = getGameEndPopupMessage(gameEndType);
            setShowGameEndPopup({
                show: true,
                message: gameEndPopupMessage,
            });

            // Create a promise that resolves after 2 seconds
            const delay = new Promise(resolve => setTimeout(resolve, 3000));

            // Wait for both promises to complete
            await Promise.all([delay]);

            setShowGameEndPopup(null);;


            setHideGameContainer(true);
            props.popupOpen(true);
            props.updateMessage({
                message: `All set to start the main round?`,
                type: "prompt",
                scoreType: tournamentScoreType,
                buttonMessage: ["Yes, I'm ready to play", "Not yet, play trial again"],
                cta: [endTrailRun, resetGame],
                closeBtn: false,
            });
            localStorage.setItem("trailRun", false);
            updateGameStatus(false);
            localStorage.removeItem("gameStartedAt");
        } else {
            const score = localStorage.getItem("score");
            const userId = localStorage.getItem("userId");
            const selectedTenant = localStorage.getItem("selectedTenant");
            const isWeeklyQuiz = Boolean(JSON.parse(localStorage.getItem("isWeeklyQuiz")));
            const isQuiz = Boolean(JSON.parse(localStorage.getItem("isQuiz")));
            const baseDifficulty = localStorage.getItem("baseDifficulty");
            const roundDifficultyPattern = localStorage.getItem("roundDifficultyPattern");
            const firstName = localStorage.getItem("firstName");
            localStorage.clear();
            if (isDemoGame && demoGameId) {
                localStorage.setItem("gId", demoGameId);
            }
            localStorage.setItem("firstName", firstName);
            localStorage.setItem("baseDifficulty", baseDifficulty);
            localStorage.setItem("roundDifficultyPattern", roundDifficultyPattern);
            localStorage.setItem("keyboardType", keyboardType);
            localStorage.setItem("assertionLogic", assertionLogic);
            localStorage.setItem("roundTitle", roundTitle);
            localStorage.setItem("score", score);
            localStorage.setItem("userId", userId);
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
                currentGameScore = 0,
                puzzlesSolved = 0,
                timeLeftBonus = 0,
                accuracy = 0,
                totalWordsSpent = 88,
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
                pace = MAIN_GAME_TIMER / answered;
                accuracy = (correct / answered) * 100;
                totalWordsSpent = 88;
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

            // API call to end game
            const url = `${baseUrl}/end`;

            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            const finalScoreForEnd = await calculateFinaleScoreForEnd();

            currentGameScore = finalScoreForEnd.finalScore;
            correct = finalScoreForEnd.correct;
            answered = finalScoreForEnd.answered;
            puzzlesSolved = finalScoreForEnd.puzzlesSolved;
            timeLeftBonus = finalScoreForEnd.timeLeftBonus;
            accuracy = Math.floor(answered ? (correct / answered) * 100 : 0);
            pace = answered ? finalScoreForEnd.timeTakenInSecs / answered : 0;
            const correctAttempts = scoreData?.correctAttempts;
            const idealStepsBonus = scoreData?.scoreBreakdown
                ? Object.values(scoreData.scoreBreakdown).reduce((acc, curr) => acc + curr.idealStepsBonus, 0)
                : 0;

            const attemptsBonus = scoreData?.scoreBreakdown
                ? Object.values(scoreData.scoreBreakdown).reduce((acc, curr) => acc + curr.attemptsBonus, 0)
                : 0;

            if (ROUND_FORMAT === GAME_FORMATS.CODING_ALGOS) {
                answered = scoreData?.attempts;
                currentGameScore = scoreData?.score;
            }


            setFinalScoreDataObject({
                scoreType,
                currentGameScore,
                answered,
                pace,
                accuracy,
                wrong,
                correct,
                puzzlesSolved,
                totalWordsSpent,
                tip,
                isWeeklyQuiz,
                isQuiz,
                correctAttempts,
                idealStepsBonus,
                attemptsBonus,
                timeLeftBonus,
                belowFifty: finalScoreForEnd.belowFifty ?? 0,
                aboveFiftyBelowHundred: finalScoreForEnd.aboveFiftyBelowHundred ?? 0,
                aboveHundredBelowTwoHundred: finalScoreForEnd.aboveHundredBelowTwoHundred,
                aboveTwoHundredBelowFiveHundred: finalScoreForEnd.aboveTwoHundredBelowFiveHundred
            });


            var raw = JSON.stringify({
                childId: userId,
                tournamentId: TOURNAMENT_ID,
                finalScore: finalScoreForEnd.finalScore,
                correctAttempts: finalScoreForEnd.correct,
                attempts: finalScoreForEnd.answered,
                gameId: demoGameId || memoryCardsGameDocId,
                group: (isDemoGame && group) ? group : undefined,
            });


            var requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
            };

            try {
                const gameEndPopupMessage = getGameEndPopupMessage(gameEndType);
                setShowGameEndPopup({
                    show: true,
                    message: gameEndPopupMessage,
                });

                setWaitingForGameEnd(true);
                await fetch(url, requestOptions);
                setWaitingForGameEnd(false);
                setTimeout(() => {
                    setShowGameEndPopup(null);
                    showGameEndPopupFn();
                    if (![GAME_FORMATS.MEMORY_CARDS, GAME_FORMATS.MEMORY_CARDS_PRO].includes(ROUND_FORMAT)) {
                        setShowWrapPopup(true);
                    }
                }, [GAME_FORMATS.MEMORY_CARDS, GAME_FORMATS.MEMORY_CARDS_PRO].includes(ROUND_FORMAT) ? 3000 : 100);

                // await waitForConditionOrTimeout(100000);

                // Create a promise that resolves after 2 seconds
                // const delay = new Promise(resolve => setTimeout(resolve, 3000));



                // Wait for both promises to complete
                // await Promise.all([delay, fetchRequest]);

            } catch (err) {
                console.error(err);
            }
        }
    };

    function waitForConditionOrTimeout(timeout) {
        return new Promise((resolve) => {

            setTimeout(() => {
                setRevealAllCards(false);
                setShowWrapPopup(true);
                resolve('timeout');
            }, timeout);
        });
    }

    const updateGameState = async (gameState) => {
        const gamesCollection = collection(db, "children", user.id, "games");
        const gameRef = doc(gamesCollection, memoryCardsGameDocId);
        await setDoc(gameRef, gameState, { merge: true });
    };

    const updateGameActions = async (data) => {
        const gameActionCollection = collection(db, "gameActions");
        await setDoc(doc(gameActionCollection), data);
    };

    const getGameEndPopupMessage = (gameEndType) => {
        let message;
        switch (gameEndType) {
            case "timeup":
                message = "Time's up!";
                break;
            case "allMatchesFound":
                message = "All matches found!";
                break;
            case "maxAttemptsReached":
                message = "No moves left!";
                break;

            default:
                message = "";
                break;
        }
        return message;
    };



    const showGameEndPopupFn = async () => {
        // Create a promise that resolves after 2 seconds

        if ([GAME_FORMATS.MEMORY_CARDS, GAME_FORMATS.MEMORY_CARDS_PRO].includes(ROUND_FORMAT)) {
            setRevealAllCards(true);
            //await new Promise((resolve) => setTimeout(resolve, 5000));
            //
        }
    };

    const endGame = () => {
        const gameCount = localStorage.getItem("gameCount");
        const userId = localStorage.getItem("userId");
        const selectedTenant = localStorage.getItem("selectedTenant");
        const isWeeklyQuiz = Boolean(JSON.parse(localStorage.getItem("isWeeklyQuiz")));
        const isQuiz = Boolean(JSON.parse(localStorage.getItem("isQuiz")));
        const timestamp = Number(localStorage.getItem("timestamp"));
        // const gameId = localStorage.getItem("gId");
        const firstName = localStorage.getItem("firstName");
        localStorage.clear();
        if (isDemoGame && demoGameId) {
            localStorage.setItem("gId", demoGameId);
        }
        localStorage.setItem("firstName", firstName);
        localStorage.setItem("userId", userId);
        localStorage.setItem("selectedTenant", selectedTenant);
        localStorage.setItem("isWeeklyQuiz", isWeeklyQuiz);
        localStorage.setItem("isQuiz", isQuiz);
        localStorage.setItem("timestamp", timestamp);
        setScore(initialSCore);
        updateShowTimer(false);
        updateGameStatus(false);
        updateTimer(MAIN_GAME_TIMER_UPDATED);
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
        setCurrentActiveIndex(currentActiveIndex + 1);
        setCurrentActiveQuestion(finalQues);
    };

    useEffect(() => {
        const gameCount = localStorage.getItem("gameCount");
        !gameCount && localStorage.setItem("gameCount", 0);
    }, []);

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
        if (!hideGameContainer) {
            // const quesList = JSON.parse(localStorage.getItem("currentWord")) ?? [];
            // const [firstQues] = quesList;
            // setCurrentQuestionsList(quesList);
            // console.log("firstQues", firstQues);
            // updateCurrentActiveQuestion(firstQues);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hideGameContainer]);

    const finishTrialAndStartGame = () => {
        setCurrentImageUrl("");
        setIsImageLoaded(false);
        setHideGameContainer(true);
        updatePlayMode(false);
        localStorage.setItem("gamePlaying", false);
        props.popupOpen(true);
        props.updateMessage({
            message: `All set to start the main round?`,
            type: "prompt",
            scoreType: tournamentScoreType,
            buttonMessage: ["Yes, I'm ready to play", "Not yet, play trial again"],
            cta: [endTrailRun, resetGame],
            closeBtn: false,
        });
        localStorage.setItem("trailRun", false);
        updateGameStatus(false);
        localStorage.removeItem("gameStartedAt");
    }

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
        const isWeeklyQuiz = Boolean(JSON.parse(localStorage.getItem("isWeeklyQuiz")));
        const isQuiz = Boolean(JSON.parse(localStorage.getItem("isQuiz")));
        const timestamp = Number(localStorage.getItem("timestamp"));
        const baseDifficulty = localStorage.getItem("baseDifficulty");
        const roundDifficultyPattern = localStorage.getItem("roundDifficultyPattern");
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
        localStorage.setItem("quizColl", quizColl);
        localStorage.setItem("isWeeklyQuiz", isWeeklyQuiz);
        localStorage.setItem("isQuiz", isQuiz);
        localStorage.setItem(POSITIVE_SCORE_LS_KEY, positiveScore);
        localStorage.setItem(NEGATIVE_SCORE_LS_KEY, negativeScore);
        localStorage.setItem(ENABLE_SKIP_LS_KEY, enableSkip);
        localStorage.setItem("baseDifficulty", baseDifficulty);
        localStorage.setItem("roundDifficultyPattern", roundDifficultyPattern);
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
        updateTimer(TRIAL_GAME_TIMER_UPDATED);
    };

    const endTrailRun = () => {
        MEASURE(
            INSTRUMENTATION_TYPES.POST_TRIAL_READY_BUTTON_CLICKED,
            localStorage.getItem("userId"),
            {}
        );
        handleEndTrialRunLogic();
    };

    const submitCodingAlgosGame = async (scoreData) => {
        const isTrialGame = localStorage.getItem("trailRun") === "true";
        if (currentActiveQuestion.problemNumber === currentQuestionsList.length) {
            if (isTrialGame) {
                finishTrialAndStartGame();
                return;
            }
            exitGame("scoreCard", "", scoreData);
            return;
        }
        const nextQues = currentQuestionsList[currentActiveQuestion.problemNumber];
        updateCurrentActiveQuestion(nextQues);
    };

    const submitPaperCheckingGame = async (trailRun = false, scoreData = null) => {
        const isTrialGame = localStorage.getItem("trailRun") === "true" || trailRun;
        if (isTrialGame) {
            finishTrialAndStartGame();
            return;
        }
        else if (currentActiveIndex === currentQuestionsList.length - 1) {
            exitGame("scoreCard", "", scoreData);
            return;
        }
        const nextQuestion = currentQuestionsList[currentActiveIndex + 1];
        updateCurrentActiveQuestion(nextQuestion);
        return;
    };

    const submitTangramGame = async (trailRun = false, scoreData = null) => {
        const isTrialGame = localStorage.getItem("trailRun") === "true" || trailRun;

        if (isTrialGame) {
            finishTrialAndStartGame();
            return;
        }
        else if (currentActiveIndex === currentQuestionsList.length - 1) {
            exitGame("scoreCard", "", scoreData);
            return;
        }
        const nextQuestion = currentQuestionsList[currentActiveIndex + 1];
        updateCurrentActiveQuestion(nextQuestion);
        return;
    };

    const submitCategoriesGame = async (trailRun = false, scoreData = null) => {
        const trialGame = JSON.parse(localStorage.getItem("trailRun"));

        const isTrialGame = trialGame !== null ? trialGame : trailRun;
        if (currentActiveIndex !== currentQuestionsList.length - 1) {
            const nextQuestion = currentQuestionsList[currentActiveIndex + 1];
            updateCurrentActiveQuestion(nextQuestion);
            return;
        }
        else if (isTrialGame) {
            finishTrialAndStartGame();
            return;
        }
        else if (currentActiveIndex === currentQuestionsList.length - 1) {
            exitGame("scoreCard", "", scoreData);
            return;
        }
    }


    const submitGeoLocatorGame = async (trailRun = false, scoreData = null) => {
        const isTrialGame = localStorage.getItem("trailRun") === "true" || trailRun;
        if (isTrialGame && (GAME_FORMATS.GEO_LOCATOR === ROUND_FORMAT && currentActiveIndex === currentQuestionsList.length - 1 || GAME_FORMATS.GEO_LOCATOR != ROUND_FORMAT)) {
            finishTrialAndStartGame();
            return;
        }
        else if (currentActiveIndex === currentQuestionsList.length - 1) {
            exitGame("scoreCard", "", scoreData);
            return;
        }

        const nextQuestion = currentQuestionsList[currentActiveIndex + 1];
        updateCurrentActiveQuestion(nextQuestion);
        return;
    };

    const handleEndTrialRunLogic = () => {
        setInput("");
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        const selectedTenant = localStorage.getItem("selectedTenant");
        const isWeeklyQuiz = Boolean(
            JSON.parse(localStorage.getItem("isWeeklyQuiz"))
        );
        const isQuiz = Boolean(JSON.parse(localStorage.getItem("isQuiz")));
        const timestamp = Number(localStorage.getItem("timestamp"));
        const quizColl = localStorage.getItem("quizColl");
        const baseDifficulty = localStorage.getItem("baseDifficulty");
        const roundDifficultyPattern = localStorage.getItem("roundDifficultyPattern");
        const firstName = localStorage.getItem("firstName");
        localStorage.clear();
        if (isDemoGame && demoGameId) {
            localStorage.setItem("gId", demoGameId);
        }
        localStorage.setItem("baseDifficulty", baseDifficulty);
        localStorage.setItem("roundDifficultyPattern", roundDifficultyPattern);
        localStorage.setItem("quizColl", quizColl);
        localStorage.setItem("firstName", firstName);
        if (roundInfo.roundCTA) {
            localStorage.setItem("roundInfo", JSON.stringify(roundInfo));
        }
        localStorage.setItem("token", token);
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
        updateTimer(MAIN_GAME_TIMER_UPDATED);
        updateTrailRun(true);
        updatePlayMode(false);
        localStorage.setItem("gamePlaying", false);
        localStorage.setItem("trailRun", false);
        localStorage.setItem("gameType", FULL_GAME_STRING);
        updateCurrentGameMode(FULL_GAME_STRING);
    };

    const resetGameAndExit = () => {
        resetGame();
        navigate(-1);
    };

    const getDocumentId = async (tournamentId, userId, round) => {
        const gamesCollectionRef = collection(db, "children", userId, "games");
        const querySnapshot = await getDocs(
            query(gamesCollectionRef, where("tournamentId", "==", tournamentId), where("round", "==", round.toString()))
        );
        if (querySnapshot.size === 1) {
            return querySnapshot.docs[0].id;
        }

        return "";
    };

    const renderPopupMessage = (popupMessage) => {
        if (popupMessage.show) {
            return (
                <div className="animate-shake justify-center items-center bg-primary-yellow text-primary-gray-20 rounded-md w-fit p-4 shadow-lg">
                    {`${popupMessage.message}s`}
                </div>
            );
        }
    };

    const renderGameEndPopup = (showGameEndPopup) => {
        if (showGameEndPopup?.show) {
            return (
                <div className="flex justify-center items-center bg-primary-yellow text-primary-gray-20 rounded-md w-fit p-4 shadow-lg">
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-xl font-bold text-center">{'Game Over'}</div>
                        <div className="text-lg font-bold text-center">{showGameEndPopup?.message}</div>
                    </div>
                </div>

            );
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
            ? updateTimer(MAIN_GAME_TIMER_UPDATED)
            : updateTimer(TRIAL_GAME_TIMER_UPDATED);
        // playSound(1);
        updateGameStatus(true);
        localStorage.setItem("gameStartedAt", Date.parse(new Date()));
    };

    const StartGame = async () => {
        //added from here
        updateLoading(true);
        setAttempt(0);
        localStorage.setItem("trailRun", false);
        updateTrailRun(false);


        if (GAME_FORMATS.CODING_ALGOS === ROUND_FORMAT || GAME_FORMATS.TANGRAM === ROUND_FORMAT || GAME_FORMATS.GEO_LOCATOR === ROUND_FORMAT || GAME_FORMATS.MEMORY_CARDS === ROUND_FORMAT || GAME_FORMATS.PAPER_GRADING === ROUND_FORMAT || GAME_FORMATS.CATEGORIES === ROUND_FORMAT || GAME_FORMATS.MATCHING_COLUMNS === ROUND_FORMAT) {
            // custom start code for coding algos
            let quesList = [];
            const baseDifficulty = localStorage.getItem("baseDifficulty");
            const roundDifficultyPattern = localStorage.getItem("roundDifficultyPattern");

            const isTrialGame = localStorage.getItem("trailRun") === "true";
            if (!isTrialGame) {
                await updateGameState({
                    startTime: new Date(),
                })
                await updateGameActions({
                    actionType: "START",
                    childId: user.id,
                    gameId: memoryCardsGameDocId,
                    isCorrect: null,
                    jumbledString: null,
                    response: null,
                    round: activeRound,
                    timestamp: new Date(),
                    tournamentId: TOURNAMENT_ID,
                    wordId: null,
                });
                if (GAME_FORMATS.MEMORY_CARDS !== ROUND_FORMAT) {
                    quesList = await fetchQuestionsFromCollection(quizColl, baseDifficulty, roundDifficultyPattern);
                    const quesIdsList = quesList.map((q) => q?.id);
                    updateDoc(doc(db, "children", user?.id, "games", memoryCardsGameDocId), {
                        sentWords: quesIdsList,
                    }, { merge: true });
                }

            } else {
                if (GAME_FORMATS.MEMORY_CARDS !== ROUND_FORMAT) {
                    quesList = await setTrialWords(quizColl, baseDifficulty);
                }
            }

            quesList.sort((a, b) => a?.problemNumber - b?.problemNumber);
            setCurrentQuestionsList(quesList);
            setCurrentActiveQuestion(quesList?.[0]);
            setCurrentActiveIndex(0);
            updateLoading(true);
            updateShowTimer(true);
            updateTimer(MAIN_GAME_TIMER_UPDATED);
            localStorage.setItem("gameStartedAt", Date.parse(new Date()));
            localStorage.setItem("gameType", FULL_GAME_STRING);
            updateCurrentGameMode(FULL_GAME_STRING);
            window.dispatchEvent(new Event("storage"));
            // startMemoryCardsGame(memoryCardsGameDocId).then(() => {
            //     updateLoading(false);
            // });
            await startMemoryCardsGame(memoryCardsGameDocId);
            updateLoading(false);
            return;
        };

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
                if (res.status >= 400) {
                    console.log("error", res);
                    // return window.location.href = "/error"
                }
                //put an await for 100 seconds  
                setTimeout(() => {
                    updateLoading(false);
                    setShowPopupMessage(true);
                }, 100000);
                return res.text();
            })
            .then((response) => {
                updateLoading(true);
                updateShowTimer(true);
                updateTimer(MAIN_GAME_TIMER_UPDATED);
                localStorage.setItem("gameStartedAt", Date.parse(new Date()));
                localStorage.setItem("gameType", FULL_GAME_STRING);
                updateCurrentGameMode(FULL_GAME_STRING);
                window.dispatchEvent(new Event("storage"));
                startMemoryCardsGame(memoryCardsGameDocId).then(() => {
                    updateLoading(false);
                });
            })
            .catch((error) => {
                console.log("error", error);
                // window.location.href = "/error"
            });
    };


    const trailRunPopup = async () => {
        if (quizColl) {
            const baseDifficulty = localStorage.getItem("baseDifficulty");
            const quesList = await setTrialWords(quizColl, baseDifficulty);
            quesList.sort((a, b) => a.problemNumber - b.problemNumber);

            //const quesList = await setTrialWords(quizColl, baseDifficulty);
            quesList.sort((a, b) => a.problemNumber - b.problemNumber);
            setCurrentQuestionsList(quesList);
            setCurrentActiveQuestion(quesList[0]);
            setCurrentActiveIndex(0);
        }
        props.popupOpen(true);
        props.updateMessage({
            title: isAudio
                ? `Put on HEADPHONES, make sure your phone is not on silent & use the next ${TRIAL_GAME_TIMER} seconds to`
                : `Play a trial game to get used to the format, scores don't count`,
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

    const convertToMatrix = (flattenedArray = [], differentiate = false) => {
        let matrix;
        if (flattenedArray.length === 0) return [];


        if (differentiate) {
            matrix = rearrangeMatrix(flattenedArray);
        }
        else {
            matrix = shuffle(convertTo2DArray(flattenedArray));
        }

        return matrix;
    };

    function rearrangeMatrix(flattenedArray) {
        let flagElements = [];
        let nameElements = [];

        const N = flattenedArray.length;
        for (let i = 0; i < N; i++) {
            if (flattenedArray[i].lable === "flag") {
                flagElements.push(flattenedArray[i]);
            }
            else {
                nameElements.push(flattenedArray[i]);
            }
        }

        flagElements = shuffle(convertTo2DArray(flagElements));
        nameElements = shuffle(convertTo2DArray(nameElements));
        return [...flagElements, ...nameElements];
    }

    function convertTo2DArray(arr) {
        const columns = 4;
        const rows = Math.ceil(arr.length / columns);
        const result = [];

        for (let i = 0; i < rows; i++) {
            const row = arr.slice(i * columns, (i + 1) * columns);
            result.push(row);
        }

        return result;
    }

    const startMemoryCardsGameLogic = async (isTrial = false) => {
        const isTrialGame = localStorage.getItem("trailRun") === "true" || isTrial;
        const baseDifficulty = localStorage.getItem("baseDifficulty");
        let boardMatrix;
        if (isTrialGame) {
            boardMatrix = await setTrialWords(quizColl, baseDifficulty);
        }
        else {
            boardMatrix = await fetchQuestionsFromCollection(quizColl, baseDifficulty, roundDifficultyPattern);
        }

        boardMatrix = boardMatrix[0]?.matrix;
        let differentiate = boardMatrix?.[0]?.lable ? true : false;
        boardMatrix = convertToMatrix(boardMatrix, differentiate);
        if (boardMatrix.length === 4) {
            setMemoryRoundFormat(GAME_FORMATS.MEMORY_CARDS);
        }
        else if (boardMatrix.length === 6) {
            setMemoryRoundFormat(GAME_FORMATS.MEMORY_CARDS_PRO);
        }
        return {
            createdAt: new Date(),
            playerOne: {
                score: 0,
                id: user.id,
                moves: { 1: [], 2: [] },
                name: user.firstName,
            },
            playerTwo: {
                score: 0,
                id: user.id,
                moves: { 1: [], 2: [] },
                name: user.firstName,
            },
            result: [],
            winner: null,
            board: JSON.stringify(boardMatrix),
            activeSound: "/Assets/Sounds/MemoryCards/gameStart.mp3",
            isGameStarted: true,
            gameStartedAt: new Date(),
            currentActivePlayer: "playerOne",
            currentActiveMove: 1,
        };

    };

    const codingAlgosGameLogic = () => {
        return {
            createdAt: new Date(),
            playerOne: {
                score: 0,
                id: user.id,
                name: user.firstName,
                algoAttempts: {},
            },
            result: [],
            winner: null,
            activeSound: null,
            isGameStarted: true,
            gameStartedAt: new Date(),
            currentActivePlayer: "playerOne",
            currentActiveMove: 1,
            currentActiveQuestion: 1,
        };
    };

    const paperCheckingGameState = () => {
        return {
            createdAt: new Date(),
            playerOne: {
                score: 0,
                id: user.id,
                name: user.firstName,
            },
            result: [],
            winner: null,
            activeSound: null,
            isGameStarted: true,
            gameStartedAt: new Date(),
            currentActivePlayer: "playerOne",
            currentActiveMove: 1,
            currentActiveQuestion: 1,
            score: 0,
            correctlyGraded: {},
            answers: {},
        };
    };

    const tangramGameLogic = () => {
        return {
            createdAt: new Date(),
            isGameStarted: true,
            gameStartedAt: new Date(),
        };
    };


    const startMemoryCardsGame = async (gameDocumentId, isTrial = false) => {
        let dataToUpdate = {};
        switch (ROUND_FORMAT) {
            case GAME_FORMATS.MEMORY_CARDS:
            case GAME_FORMATS.MEMORY_CARDS_PRO:
                dataToUpdate = await startMemoryCardsGameLogic(isTrial);
                break;
            case GAME_FORMATS.CODING_ALGOS:
                dataToUpdate = codingAlgosGameLogic();
                break;
            case GAME_FORMATS.PAPER_GRADING:
                dataToUpdate = paperCheckingGameState();
                break;

            case GAME_FORMATS.TANGRAM:
                dataToUpdate = tangramGameLogic();
            default:
                dataToUpdate = paperCheckingGameState();
                break;
        }

        const userGamesCollection = collection(
            db,
            "children",
            user?.id,
            "games"
        );
        const docRef = doc(userGamesCollection, gameDocumentId);

        await updateDoc(docRef, dataToUpdate);

    };


    const startTrailRun = async () => {
        updateLoading(true);
        MEASURE(
            INSTRUMENTATION_TYPES.TRIALGAME_POPUP_START_BUTTON_CLICKED,
            localStorage.getItem("userId"),
            {}
        );

        isAudio && setTimeout(() => setAnimation(), 4000);
        // updateGameStatus(true);
        updateTrailRun(false);
        updateTimer(TRIAL_GAME_TIMER_UPDATED);
        updateShowTimer(true);
        localStorage.setItem("trailRun", true);
        localStorage.setItem("gameType", TRIAL_GAME_STRING);
        updateCurrentGameMode(TRIAL_GAME_STRING);
        setAttempt(0);
        // startMemoryCardsGame(memoryCardsGameDocId).then(() => {
        //     updateLoading(false);
        // });
        await startMemoryCardsGame(memoryCardsGameDocId, true);
        updateLoading(false);
    };

    const renderScoreTypeSection = () => {
        if (tournamentScoreType?.includes("AccuracyBoost")) {
            return (
                <>
                    <span
                        class="font-bold text-left text-xl"
                        style={{ color: "#E3001E" }}
                    >
                        SCORING SYSTEM
                    </span>
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
        if (ROUND_FORMAT === GAME_FORMATS.MEMORY_CARDS) {
            return (
                <>
                    <span
                        class="font-bold text-left text-xl"
                        style={{ color: "#E3001E" }}
                    >
                        SCORING SYSTEM
                    </span>
                    <br />
                    <br />
                    <span class="font-bold text-2xl">Score = 3 + X + Y</span>
                    <br />
                    <br />
                    <span class="font-bold">Calculation</span>
                    <br />
                    <table class="w-100 inline-block mx-auto">
                        <tbody>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]">Points for playing</td>
                                <td class="border px-4 py-2 text-left text-[18px]">3</td>
                            </tr>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]">Number of matches found</td>
                                <td class="border px-4 py-2 text-left text-[18px]">X</td>
                            </tr>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]">Moves left if all matches found</td>
                                <td class="border px-4 py-2 text-left text-[18px]">Y</td>
                            </tr>
                        </tbody>
                    </table>
                </>
            );
        }
        if (ROUND_FORMAT === GAME_FORMATS.CODING_ALGOS) {
            return (
                <>
                    <span
                        class="font-bold text-left text-xl"
                        style={{ color: "#E3001E" }}
                    >
                        SCORING SYSTEM
                    </span>
                    <br />
                    <br />
                    <span class="font-bold text-2xl">Score = 4 + X + Y</span>
                    <br />
                    <br />
                    <span class="font-bold">Explanantion</span>
                    <br />
                    <table class="w-100 inline-block mx-auto">
                        <tbody>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]">Attempting a problem</td>
                                <td class="border px-4 py-2 text-left text-[18px]">1</td>
                            </tr>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]">Bonus (solving in less steps)</td>
                                <td class="border px-4 py-2 text-left text-[18px]">X</td>
                            </tr>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]">Bonus (solving in less attempts)</td>
                                <td class="border px-4 py-2 text-left text-[18px]">Y</td>
                            </tr>
                        </tbody>
                    </table>
                </>
            );
        }
        if (ROUND_FORMAT === GAME_FORMATS.TANGRAM) {
            return (
                <>
                    <span
                        class="font-bold text-left text-xl"
                        style={{ color: "#E3001E" }}
                    >
                        SCORING SYSTEM
                    </span>
                    <br />
                    <br />
                    <span class="font-bold text-2xl">Score = X + Y + Z</span>
                    <br />
                    <br />
                    <span class="font-bold">Explanantion</span>
                    <br />
                    <table class="w-100 inline-block mx-auto">
                        <tbody>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]">Attempting a puzzle</td>
                                <td class="border px-4 py-2 text-left text-[18px]">X</td>
                            </tr>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]">Completion Bonus (if you solve it)</td>
                                <td class="border px-4 py-2 text-left text-[18px]">Y</td>
                            </tr>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]">Time Bonus (solving in less time)</td>
                                <td class="border px-4 py-2 text-left text-[18px]">Z</td>
                            </tr>
                        </tbody>
                    </table>
                </>
            );
        }
        if (ROUND_FORMAT === GAME_FORMATS.GEO_LOCATOR) {
            return (
                <>
                    <span
                        class="font-bold text-left text-xl"
                        style={{ color: "#E3001E" }}
                    >
                        SCORING SYSTEM
                    </span>
                    <br />
                    <span class="block mt-2 text-xl">Score based on distance of your marker from the city</span>
                    <br />
                    <br />
                    <span
                        class="font-bold text-left text-xl"
                        style={{ color: "#E3001E" }}
                    >
                        CALCULATION
                    </span>
                    <br />
                    <table class="inline-block mx-auto">
                        <thead>
                            <tr>
                                <th class="border px-4 py-2 text-left text-[18px]"> Marker's Distance</th>
                                <th class="border px-4 py-2 text-left text-[18px]"> Score</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]"> &lt; 50 Kms </td>
                                <td class="border px-4 py-2 text-left text-[18px] text-center align-middle"> 4</td>
                            </tr>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]"> 50 Kms - 100 Kms </td>
                                <td class="border px-4 py-2 text-left text-[18px] text-center align-middle"> 3</td>
                            </tr>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]"> 100 Kms - 200 Kms </td>
                                <td class="border px-4 py-2 text-left text-[18px] text-center align-middle"> 2</td>
                            </tr>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]"> 200 Kms - 500 Kms </td>
                                <td class="border px-4 py-2 text-left text-[18px] text-center align-middle"> 1</td>
                            </tr>
                            <tr>
                                <td class="border px-4 py-2 text-left text-[18px]"> &gt; 500 Kms </td>
                                <td class="border px-4 py-2 text-left text-[18px] text-center align-middle"> 0</td>
                            </tr>

                        </tbody>
                    </table>
                </>
            )
        }
        if (ROUND_FORMAT === GAME_FORMATS.CATEGORIES) {
            return (
                <>
                    <span
                        class="font-bold text-left text-xl"
                        style={{ color: "#E3001E" }}
                    >
                        SCORING SYSTEM
                    </span>
                    <br />
                    <br />
                    <span class="font-bold text-xl">Score = Number of cards in a group x Number of groups found</span>
                </>
            );
        }
        if (ROUND_FORMAT === GAME_FORMATS.MATCHING_COLUMNS) {
            return (
                <>
                    <span
                        class="font-bold text-left text-xl"
                        style={{ color: "#E3001E" }}
                    >
                        SCORING SYSTEM
                    </span>
                    <br />
                    <br />
                    <span class="font-bold text-xl">Score = 2 x Number of correct matches</span>
                </>
            );
        }
        return <></>;
    };

    const renderSlowInternetBanner = () => {
        return (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
                <span>Please wait while we get your question</span>
            </div>
        );
    };

    const renderGameContainer = () => {
        if (hideGameContainer && !(revealAllCards || showGameEndPopup)) {
            return <></>;
        }
        if (isInternetSlow) {
            return renderSlowInternetBanner();
        }
        let isTrialGame = localStorage.getItem("trailRun") === "true";
        // if(waitingForGameEnd) {
        //     return <div className="flex justify-center items-center h-full w-full">
        //         <Loader />
        //     </div>
        // }
        let gameFormat = <></>;
        switch (ROUND_FORMAT) {
            case GAME_FORMATS.MEMORY_CARDS_PRO:
            case GAME_FORMATS.MEMORY_CARDS:
                gameFormat = (
                    <div className="flex flex-col text-[#00000099]">
                        <div className="h-auto">
                            <div className="flex items-center justify-between w-full px-2">
                                <div className="w-full flex justify-between">
                                    <div className="flex-1 flex justify-center relative z-10">
                                        <div className="bg-transparent">
                                            <div className="flex flex-col items-center">
                                                <div className="title text-3xl font-bold ">MOVES LEFT</div>
                                                <div
                                                    className="value text-2xl"
                                                    style={{
                                                        color:
                                                            NEW_FORMAT_MAX_ATTEMPTS_LIMIT[memoryRoundFormat] - Score.answered <= 5
                                                                ? 'red'
                                                                : NEW_FORMAT_MAX_ATTEMPTS_LIMIT[memoryRoundFormat] - Score.answered <= 10
                                                                    ? 'orange'
                                                                    : 'inherit'
                                                    }}
                                                >
                                                    {NEW_FORMAT_MAX_ATTEMPTS_LIMIT[memoryRoundFormat] - Score.answered}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                        <div>
                                            <div className="flex flex-col items-center">
                                                <div className="title text-3xl font-bold ">MATCHES FOUND</div>
                                                <div className="value text-2xl">
                                                    {Score.correct}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-[10px]">
                            <MemoryCardsContainer
                                tournamentId={TOURNAMENT_ID}
                                user={user}
                                gameDocumentId={memoryCardsGameDocId}
                                gameState={gameState}
                                setGameState={setGameState}
                                endGame={exitGame}
                                currentGameMode={currentGameMode}
                                revealAllCards={revealAllCards}
                                roundFormat={memoryRoundFormat}
                            />
                        </div>


                        {!revealAllCards && !showGameEndPopup && <div className="mt-3 flex items-center justify-center">
                            <NewFormatTimer
                                duration={timer}
                                timerEnd={exitGame}
                                startTimer={gameStarted}
                                showPopupMessage={showPopupMessage}
                                setShowPopupMessage={setShowPopupMessage}
                                currentGameMode={currentGameMode}
                            />
                        </div>}

                        {revealAllCards && <div className="mt-2 flex items-center justify-center">
                            <Button
                                className="mainButton Btn-sm animate__animated animate__pulse animate__infinite infinite"
                                onClick={() => {
                                    setRevealAllCards(false);
                                    setShowWrapPopup(true);
                                }} >
                                Proceed
                            </Button>
                        </div>}
                    </div>
                );
                break;

            case GAME_FORMATS.CODING_ALGOS:

                isTrialGame = localStorage.getItem("trailRun") === "true";
                gameFormat = (
                    <CodingGameContainer
                        currentActiveQuestion={currentActiveQuestion}
                        submitGame={submitCodingAlgosGame}
                        updateGameState={updateGameState}
                        gameState={gameState}
                        isTrialGame={isTrialGame}
                    />
                );
                break;
            case GAME_FORMATS.TANGRAM:
                isTrialGame = localStorage.getItem("trailRun") === "true";
                gameFormat = (
                    <div className="w-full h-full">
                        <Tangram
                            submitGame={submitTangramGame}
                            isTrialGame={isTrialGame}
                            selectedTangram={currentActiveQuestion}
                            updateGameState={updateGameState}
                            gameState={gameState}
                            currentTangramIndex={currentActiveIndex}
                            totalQuestions={currentQuestionsList.length}
                        />
                    </div>
                );
                break;

            case GAME_FORMATS.GEO_LOCATOR:
                isTrialGame = localStorage.getItem("trailRun") === "true";
                gameFormat = (
                    <div className="w-full h-full">
                        <GeoLocator
                            submitGame={submitGeoLocatorGame}
                            isTrialGame={isTrialGame}
                            currentActiveQuestion={currentActiveQuestion}
                            updateGameState={updateGameState}
                            gameState={gameState}
                            currentActiveIndex={currentActiveIndex}
                            totalQuestions={currentQuestionsList.length}
                            roundFormat={ROUND_FORMAT}
                        />
                    </div>
                );
                break;
            case GAME_FORMATS.PAPER_GRADING:
                gameFormat = (
                    <PaperCheckingContainer
                        currentActiveQuestion={currentActiveQuestion}
                        submitGame={submitPaperCheckingGame}
                        updateGameState={updateGameState}
                        gameState={gameState}
                        isTrialGame={isTrialGame}
                        questionsList={currentQuestionsList}
                        currentActiveIndex={currentActiveIndex}
                    />
                );
                break;

            case GAME_FORMATS.CATEGORIES:
                gameFormat = (
                    <CategoriesRoundContainer
                        currentActiveQuestion={currentActiveQuestion}
                        submitGame={submitCategoriesGame}
                        updateGameState={updateGameState}
                        gameState={gameState}
                        isTrialGame={isTrialGame}
                        questionsList={currentQuestionsList}
                        currentActiveIndex={currentActiveIndex}
                        totalQuestions={currentQuestionsList.length}
                    />
                );
                break;

            case GAME_FORMATS.MATCHING_COLUMNS:
                gameFormat = (
                    <MatchingColumnsRoundContainer
                        currentActiveQuestion={currentActiveQuestion}
                        submitGame={submitCategoriesGame}
                        updateGameState={updateGameState}
                        gameState={gameState}
                        isTrialGame={isTrialGame}
                        questionsList={currentQuestionsList}
                        currentActiveIndex={currentActiveIndex}
                        totalQuestions={currentQuestionsList.length}
                    />
                );
                break;

            default:
                break;
        }



        //add a new button ant the bottom to gameFormat
        if (currentGameMode === TRIAL_GAME_STRING) {
            gameFormat = (
                <div className="flex flex-col items-center justify-center h-full w-full">
                    {gameFormat}

                    {HIDE_SKIP_TRIAL_FORMATS.includes(ROUND_FORMAT) ? (
                        <></>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            {(GAME_FORMATS.TANGRAM == ROUND_FORMAT) && <span className="text-[#00000099] text-sm">
                                Instructions: Reproduce the black shape by moving and arranging the pieces. You can rotate a piece by tapping on it.
                            </span>}
                            <AppButton
                                onClick={finishTrialAndStartGame}
                                className="Btn-2xl mt-3"
                                variant="secondary text-[#00000099]"
                            >
                                Skip Trial
                            </AppButton>
                        </div>
                    )}
                </div>
            );
        }
        else {
            gameFormat = <div className="flex flex-col items-center justify-center">
                {gameFormat}
            </div>
        }
        return gameFormat;
    };

    return (
        <>
            {gameLoading || isGameEnding || !memoryCardsGameDocId ? (
                <div className="flex w-screen max-w-3xl h-full items-center justify-center">
                    <Loader />
                </div>
            ) : (
                <>
                    <div className="flex flex-col h-full">
                        {showTimer && (
                            <TimerFullScreen
                                duration={3}
                                stroke={0}
                                cb={closeTimerScreen}
                            />
                        )}
                        {(!gameStarted || !trailRun) && !gameStarted && !showWrapPopup ? (
                            <div className="bg-white py-[2%] px-[4%] min-h-[6vh] flex items-center justify-between mt-2">
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

                        <div
                            className={twMerge(
                                hideGameContainer
                                    ? `flex items-center justify-center flex-col mt-[4vh] mx-4 md:mx-6`
                                    : "",
                                hideGameContainer ? "h-auto" : "",
                                roundInfo?.roundCTA
                                    ? "gap-[6vh] md:gap-[8vh]"
                                    : "gap-6 md:gap-0"
                            )}
                        >
                            {currentGameMode &&
                                currentGameMode === FULL_GAME_STRING &&
                                !gameStarted &&
                                !showWrapPopup ? (
                                <div class="mx-auto max-w-lg">
                                    <p class="text-center text-xl mb-4">
                                        {renderScoreTypeSection()}
                                    </p>
                                </div>
                            ) : (
                                <></>
                            )}
                            {((currentGameMode && currentGameMode === TRIAL_GAME_STRING) ||
                                !currentGameMode) &&
                                !gameStarted && (
                                    <>
                                        <h2 className="text-xl md:text-2xl w-auto text-center ">
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

                            {(sampleImageUrl || roundInfo?.roundInitImage) &&
                                (currentGameMode === TRIAL_GAME_STRING || !currentGameMode) &&
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
                                                    "max-h-[50vh] h-auto w-[80vw] max-w-[560px] object-cover",
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
                                        <div className="flex flex-col items-center justify-center">
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
                        </div>
                        <div className="h-full">
                            <div className="flex flex-col justify-start mx-2 md:mx-6">
                                {renderGameContainer()}
                            </div>
                            {/* Input Box */}
                        </div>
                    </div>
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                        {renderPopupMessage(showPopupMessage)}
                        {renderGameEndPopup(showGameEndPopup)}
                        {/* revealAllCards&& renderGameContainer() */}
                    </div>
                </>
            )}
        </>
    );
};

export default NewFormatGame;
