import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@mui/material";
import styled from "styled-components";
import { set } from 'lodash';
import { shuffle1DArray } from '../../../../../GamesArena/Common/shuffle';
import alertIconExclamationAnimation from "../../../../../assets/animations/alert-icon-exclamation.json";
import greeCheckAnimation from "../../../../../assets/animations/green-check.json";
import AppButton from '../../../../Common/AppButton';
import LinearTimerBar from '../LinearTimerBar';
import Lottie from "lottie-react";
import { NEW_FORMAT_TOURNAMENT_GAME_TIMER, NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER } from '../../../../../Constants/Commons';
import { InGameNotificationPopup } from '../../InGameNotificationPopup';
const PopupDuration = 10;


export const MatchingColumnsRoundContainer = (
    {
        currentActiveQuestion,
        submitGame,
        updateGameState,
        gameState,
        isTrialGame,
        questionsList,
        currentActiveIndex,
        totalQuestions,
        responseView = false,
        correctResponses = [],
    }) => {

    const [selectedItemOne, setSelectedItemOne] = useState(null);
    const [selectedItemTwo, setSelectedItemTwo] = useState(null);
    const [matches, setMatches] = useState([]);
    const [columnOne, setColumnOne] = useState([]);
    const [columnTwo, setColumnTwo] = useState([]);
    const [responseSubmitted, setResponseSubmitted] = useState(false)

    const [notificationData, setNotificationData] = useState({
        message: "",
        score: {
            current: 0,
            overall: 0,
        },
        type: "",
    });

    const [lines, setLines] = useState([]);

    const [showAnimation, setShowAnimation] = useState(false);
    const [animationType, setAnimationType] = useState("");
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
    const [smallNotificationData, setSmallNotificationData] = useState({});
    const [showSmallNotificationPopup, setShowSmallNotificationPopup] =
        useState(false);

    const [showInGameNotificationPopup, setShowInGameNotificationPopup] =
        useState(false);

    const [enableNextButton, setEnableNextButton] = useState(false);
    const [startTimer, setStartTimer] = useState(false);
    const roundTimer = isTrialGame
        ? NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER["MATCHING_COLUMNS"]
        : NEW_FORMAT_TOURNAMENT_GAME_TIMER["MATCHING_COLUMNS"];

    const columnOneRefs = useRef([]);
    const columnTwoRefs = useRef([]);
    const containerRef = useRef(null);

    const previousScoreRef = useRef(0);
    const overallScoreRef = useRef(0);
    const attemptsRef = useRef(0);
    const correctAttemptsRef = useRef(0);
    const timerRef = useRef();
    const currentAttemptsRef = useRef();
    const smallPopupTimerRef = useRef();
    const popupTimerRef = useRef();

    useEffect(() => {
        if (currentActiveQuestion) {

            const pairs = currentActiveQuestion.pairs;
            const columnOne = [];
            const columnTwo = [];
            const matches = []
            pairs.forEach(pair => {
                columnOne.push({ name: pair.columnOne, matchId: pairs.indexOf(pair) });
                columnTwo.push({ name: pair.columnTwo, matchId: pairs.indexOf(pair) });
                if (responseView) {
                    const matchItem = {
                        itemOne: {
                            name: pair.columnOne,
                            matchId: pairs.indexOf(pair)
                        },
                        itemTwo: { name: pair.columnTwo, matchId: pairs.indexOf(pair) }
                    }
                    matches.push(matchItem)
                }
            });

            if (!responseView) {
                setColumnOne(shuffle1DArray(columnOne));
                setColumnTwo(shuffle1DArray(columnTwo));
                setMatches([])
                setLines([])
            }
            else {
                setColumnOne(columnOne);
                setColumnTwo(columnTwo);
                setMatches(matches)
            }
        }
        setStartTimer(true);
        setEnableNextButton(false);
        setShowInGameNotificationPopup(false);
        setShowCorrectAnswer(false);
        setSmallNotificationData({});
        setShowSmallNotificationPopup(false);
        setResponseSubmitted(false);


        previousScoreRef.current = 0;
        currentAttemptsRef.current = 0;

        return () => {
            clearTimeout(timerRef.current);
            clearTimeout(smallPopupTimerRef.current);
            clearTimeout(popupTimerRef.current);
            timerRef.current = null;
            smallPopupTimerRef.current = null;
            popupTimerRef.current = null;
        };
    }, [currentActiveQuestion, currentActiveIndex]);

    const GridItem = styled(Button)(
        ({ status, rowSize, responseView, input, matchId, matches, showCorrectAndIncorrect, correctResponses }) => {
            const baseSize = responseView ? 70 : 85;
            const widthMultiplier = responseView ? 1.3 : 1.1;
            const minFontSize = 11;
            const totalWordLength = input.length;
            let fontSize;

            if (totalWordLength > 10) {
                fontSize = minFontSize;
            } else if (totalWordLength > 6) {
                fontSize = 12;
            } else {
                fontSize = 13;
            }

            let backgroundColor;

            let correctMatch = matches.find(
                (match) =>
                    (match.itemOne.matchId === match.itemTwo.matchId) &&
                    (match.itemOne.matchId === matchId)
            );

            if (responseView) {
                correctMatch = correctResponses?.includes(matchId)
            }

            if ((showCorrectAndIncorrect || responseView) && correctMatch) {
                backgroundColor = "#90EE90";
            } else if ((showCorrectAndIncorrect) && !correctMatch) {
                backgroundColor = "#FF4040";
            }
            else if (responseView && !correctMatch) {
                backgroundColor = "white";
            }
            else if (status === 'selected') {
                backgroundColor = "#ccf900";
            } else if (status === 'matched') {
                backgroundColor = "gray";
            } else {
                backgroundColor = "white";
            }

            return {
                color: "black",
                borderRadius: "5px",
                height: `${baseSize}px`,
                width: `${baseSize * widthMultiplier}px`,
                backgroundColor: backgroundColor,
                fontSize: `${fontSize}px !important`,
                fontFamily: "avenir",
                "-webkit-tap-highlight-color": "transparent",
                "&:active": {
                    backgroundColor: backgroundColor,
                },
                "&:hover": {
                    backgroundColor: backgroundColor,
                },
                "&:focus": {
                    backgroundColor: backgroundColor,
                },
                "&:disabled": {
                    backgroundColor: "#f0f0f0",
                    color: "#999",
                },
            };
        }
    );


    const handleTimerEnd = () => {
        if (!!popupTimerRef.current) {
            console.log("Timer already ended");
            return;
        }
        setResponseSubmitted(true);
        calculateAndSetScore();
        handlePopupsAndGameEnd("Time's Up!", "failedText");
    };


    const handlePopupsAndGameEnd = (message, type) => {
        setShowInGameNotificationPopup(true);
        setShowCorrectAnswer(true);
        setEnableNextButton(true);
        setNotificationData({
            message: message,
            score: {
                current: previousScoreRef.current || 0,
                overall: overallScoreRef.current || 0,
            },
            type: "",
        });

        smallPopupTimerRef.current = setTimeout(() => {
            setShowSmallNotificationPopup(true);
            setSmallNotificationData({
                message: message,
                type: type,
            });
        }, 1500);

        smallPopupTimerRef.current = setTimeout(() => {
            setSmallNotificationData({});
            setShowSmallNotificationPopup(false);
        }, 3000);

        popupTimerRef.current = setTimeout(() => {
            submitGame(isTrialGame);
            setStartTimer(false);
            setShowInGameNotificationPopup(false);
        }, PopupDuration * 1000);
    }

    const handleNext = () => {
        submitGame(isTrialGame);
        setStartTimer(false);
        setShowInGameNotificationPopup(false);
    };

    const isItemMatched = (item) => {
        return matches.find(
            (match) =>
                match.itemOne.name === item.name || match.itemTwo.name === item.name
        );
    };

    const getItemStatus = (item, columnNumber) => {
        const matchedPair = isItemMatched(item);
        if (matchedPair) {
            return 'matched';
        } else if (
            (columnNumber === 1 &&
                selectedItemOne &&
                selectedItemOne.name === item.name) ||
            (columnNumber === 2 &&
                selectedItemTwo &&
                selectedItemTwo.name === item.name)
        ) {
            return 'selected';
        } else {
            return 'default';
        }
    };

    const isItemDisabled = (item, columnNumber) => {
        const matchedPair = isItemMatched(item);
        if (
            (columnNumber === 1 &&
                selectedItemOne &&
                selectedItemOne.name !== item.name &&
                !matchedPair) ||
            (columnNumber === 2 &&
                selectedItemTwo &&
                selectedItemTwo.name !== item.name &&
                !matchedPair)
        ) {
            return true;
        }
        return false;
    };

    const toggleSelect = (item, columnNumber) => {
        if (responseView) {
            return;
        }
        const matchedPair = isItemMatched(item);

        if (matchedPair) {
            setMatches(matches.filter((match) => match !== matchedPair));
            return;
        }

        if (columnNumber === 1) {
            if (selectedItemOne && selectedItemOne.name === item.name) {
                setSelectedItemOne(null);
            } else {
                setSelectedItemOne(item);

                if (selectedItemTwo) {
                    setMatches([
                        ...matches,
                        { itemOne: item, itemTwo: selectedItemTwo },
                    ]);
                    setSelectedItemOne(null);
                    setSelectedItemTwo(null);
                }
            }
        } else if (columnNumber === 2) {
            if (selectedItemTwo && selectedItemTwo.name === item.name) {
                setSelectedItemTwo(null);
            } else {
                setSelectedItemTwo(item);

                if (selectedItemOne) {
                    setMatches([
                        ...matches,
                        { itemOne: selectedItemOne, itemTwo: item },
                    ]);
                    setSelectedItemOne(null);
                    setSelectedItemTwo(null);
                }
            }
        }
    };

    const handleCheckAnswer = () => {
        setResponseSubmitted(true)
        if (matches.length === columnOne.length) {
            const correctMatches = currentActiveQuestion.pairs.filter(
                (pair) =>
                    matches.find(
                        (match) =>
                            match.itemOne.name === pair.columnOne &&
                            match.itemTwo.name === pair.columnTwo
                    )
            );

            calculateAndSetScore();
            if (correctMatches.length === columnOne.length) {
                handlePopupsAndGameEnd("Correct!", "successText");
            } else {
                handlePopupsAndGameEnd("Incorrect!", "failedText");
            }
        }


    };

    const calculateAndSetScore = () => {
        const score = matches.filter((match) => match.itemOne.matchId === match.itemTwo.matchId).length;

        previousScoreRef.current = score * 2;
        overallScoreRef.current += score * 2;
        attemptsRef.current += currentActiveQuestion?.pairs?.length;
        correctAttemptsRef.current += score;
        //update score in state
        const gameStateScore = overallScoreRef.current;
        const gameStateAttempts = attemptsRef.current;
        const gameStateCorrectAttempts = correctAttemptsRef.current;
        const overAllAttemptedWords = gameState.attemptedWords || [];
        if (overAllAttemptedWords?.length === currentActiveIndex) {
            overAllAttemptedWords.push(
                JSON.stringify(currentActiveQuestion?.pairs)
            );
        }
        const dataToUpdate = {
            score: gameStateScore,
            attempts: gameStateAttempts,
            correctAttempts: gameStateCorrectAttempts,
            scoreBreakdown: {
                ...gameState.scoreBreakdown,
                [currentActiveIndex]: {
                    score: score,
                    solved: score === columnOne.length,
                    correctPairs: matches,
                },
            },
            attemptedWords: overAllAttemptedWords,
        };
        if (!isTrialGame) {
            updateGameState(dataToUpdate);
        }
    };


    useEffect(() => {
        if (!containerRef.current) return;

        const parentRect = containerRef.current.getBoundingClientRect();
        const newLines = matches
            .map((match) => {
                const indexOne = columnOne.findIndex(
                    (item) => item.name === match.itemOne.name
                );
                const indexTwo = columnTwo.findIndex(
                    (item) => item.name === match.itemTwo.name
                );

                const elOne = columnOneRefs.current[indexOne];
                const elTwo = columnTwoRefs.current[indexTwo];

                if (elOne && elTwo) {
                    const rectOne = elOne.getBoundingClientRect();
                    const rectTwo = elTwo.getBoundingClientRect();

                    const x1 = rectOne.right - parentRect.left;
                    const y1 =
                        rectOne.top + rectOne.height / 2 - parentRect.top;

                    const x2 = rectTwo.left - parentRect.left;
                    const y2 =
                        rectTwo.top + rectTwo.height / 2 - parentRect.top;

                    if (responseView) {
                        return { x1, y1: y1 + 10, x2: x2 + 20, y2: y2 + 10 };
                    }
                    return { x1, y1, x2, y2 };
                }
                return null;
            })
            .filter((line) => line !== null);

        setLines(newLines);
    }, [matches]);

    return (
        <div ref={containerRef} className={`flex flex-col items-center justify-start bg-[#3a3a3a] h-full ${responseView ? "w-[100%]" : "min-h-[100vh] w-[100vw]"
            }`}>
            {!responseView && (
                <div className="flex justify-between gap-[30vw]">
                    <div className="flex flex-col items-center justify-center mt-2">
                        <span className="text-base font-bold text-[#ccf900]">Puzzle</span>
                        <span className="text-2xl font-bold text-white">
                            {currentActiveIndex + 1}/{questionsList?.length}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center mt-2">
                        <span className="text-base font-bold text-[#ccf900]">Score</span>
                        <span className="text-2xl font-bold text-white">
                            {overallScoreRef.current || 0}
                        </span>
                    </div>
                </div>

            )}

            {!responseView && (<div className="mt-3"></div>)}

            {!responseView && (
                <LinearTimerBar
                    totalDuration={roundTimer}
                    startTimer={startTimer}
                    isSelfTimer
                    reset={startTimer}
                    timerEnd={handleTimerEnd}
                    customHeight="h-2"
                />
            )}

            <div className="mt-3"></div>


            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {lines.map((line, index) => (
                    <line
                        key={index}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="white"
                        strokeWidth="2"
                    />
                ))}
            </svg>
            <div className="flex justify-center items-center">
                <div className="flex gap-[30vw]">
                    <div className="flex flex-col gap-4 items-center justify-center">
                        <span className="text-white text-xl">Column 1</span>
                        {columnOne.map((item, index) => (
                            <GridItem
                                key={index}
                                ref={(el) => (columnOneRefs.current[index] = el)}
                                variant="contained"
                                color="primary"
                                onClick={() => toggleSelect(item, 1)}
                                status={getItemStatus(item, 1)}
                                disabled={isItemDisabled(item, 1)}
                                rowSize={columnOne.length}
                                responseView={responseView}
                                input={item.name}
                                matchId={item.matchId}
                                matches={matches}
                                showCorrectAndIncorrect={showInGameNotificationPopup}
                                correctResponses={correctResponses}
                            >
                                {item.name}
                            </GridItem>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4 items-center justify-center">
                        <span className="text-white text-xl">Column 2</span>
                        {columnTwo.map((item, index) => (
                            <GridItem
                                key={index}
                                ref={(el) => (columnTwoRefs.current[index] = el)}
                                variant="contained"
                                color="primary"
                                onClick={() => toggleSelect(item, 2)}
                                status={getItemStatus(item, 2)}
                                disabled={isItemDisabled(item, 2)}
                                rowSize={columnTwo.length}
                                responseView={responseView}
                                input={item.name}
                                matchId={item.matchId}
                                matches={matches}
                                showCorrectAndIncorrect={showInGameNotificationPopup}
                                correctResponses={correctResponses}
                            >
                                {item.name}
                            </GridItem>
                        ))}
                    </div>
                </div>
            </div>
            {showAnimation && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center justify-center gap-2 text-[14px] md:text-base bg-white p-4 rounded-lg shadow-lg">
                        <div>
                            <Lottie
                                animationData={
                                    animationType === "error"
                                        ? alertIconExclamationAnimation
                                        : greeCheckAnimation
                                }
                                loop={false}
                                className="aspect-square mx-auto h-[128px]"
                            />
                        </div>
                    </div>
                </div>
            )}
            {!responseView && <div className="flex flex-col justify-center items-center w-full mt-4">
                {!showInGameNotificationPopup ? (!responseSubmitted && <AppButton
                    onClick={handleCheckAnswer}
                    disabled={lines.length !== columnOne.length}
                    className="w-[100px]">
                    Submit
                </AppButton>) : (<AppButton
                    onClick={handleNext}
                    className="w-[100px]">
                    Next
                </AppButton>)}

                {showInGameNotificationPopup && (
                    <InGameNotificationPopup
                        message={notificationData.message}
                        type={notificationData.type}
                        score={notificationData.score}
                        showTimer={currentActiveIndex !== totalQuestions - 1}
                        PopupDuration={PopupDuration}
                        isCenter={false}
                    />
                )}
            </div>}
        </div>
    );
};
