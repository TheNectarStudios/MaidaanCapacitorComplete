import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Box } from "@mui/material";
import AppButton from "../../../Common/AppButton";
import { shuffle1DArray } from "../../../../GamesArena/Common/shuffle";
import { Timer } from "../GameComponents/CountdownTimer";
import LinearTimerBar from "../GameComponents/LinearTimerBar";
import {
	NEW_FORMAT_TOURNAMENT_GAME_TIMER,
	NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER,
} from "../../../../Constants/Commons";
import { InGameNotificationPopup } from "../InGameNotificationPopup";
import Lottie from "lottie-react";
import greeCheckAnimation from "../../../../assets/animations/green-check.json";
import alertIconExclamationAnimation from "../../../../assets/animations/alert-icon-exclamation.json";
import { clear } from "@testing-library/user-event/dist/clear";
import { set } from "lodash";
const PopupDuration = 10;
const smallPopupDuration = 2;

export const CategoriesRoundContainer = ({
	updateGameState,
	gameState,
	isTrialGame,
	questionsList,
	currentActiveIndex,
	submitGame,
	currentActiveQuestion,
	responseView = false,
	responseArray = [],
	totalQuestions = 0,
	correctCategoriesAnswered = [],
}) => {
	const [currentActiveQuestionArray, setCurrentActiveQuestionArray] = useState(
		currentActiveQuestion?.questions
	);
	const [correctlyMatchedArray, setCorrectlyMatchedArray] = useState([]);
	const [selectedItems, setSelectedItems] = useState([]);
	const [rowSize, setRowSize] = useState(0);
	const [enableNextButton, setEnableNextButton] = useState(false);
	const [startTimer, setStartTimer] = useState(false);
	const [scoreData, setScoreData] = useState({
		overall: 0,
		current: 0,
		message: "",
		attempts: 0,
		correctAttempts: 0,
		attemptedWords: [],
		results: [],
	});

	const [notificationData, setNotificationData] = useState({
		message: "",
		score: {
			current: 0,
			overall: 0,
		},
		type: "",
	});
	const [showAnimation, setShowAnimation] = useState(false);
	const [animationType, setAnimationType] = useState("");
	const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
	const [smallNotificationData, setSmallNotificationData] = useState({});
	const [showSmallNotificationPopup, setShowSmallNotificationPopup] =
		useState(false);

	const [showInGameNotificationPopup, setShowInGameNotificationPopup] =
		useState(false);
	const roundTimer = isTrialGame
		? NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER["CATEGORIES"]
		: NEW_FORMAT_TOURNAMENT_GAME_TIMER["CATEGORIES"];

	const previousScoreRef = useRef();
	const overallScoreRef = useRef();
	const timerRef = useRef();
	const currentAttemptsRef = useRef();
	const smallPopupTimerRef = useRef();
	const popupTimerRef = useRef();

	useEffect(() => {
		const category = currentActiveQuestion?.questions?.[0]?.category;
		const categoryQuestions = currentActiveQuestion?.questions.filter(
			(item) => item.category === category
		);
		setRowSize(categoryQuestions.length);

		const shuffledArray = shuffle1DArray(currentActiveQuestion?.questions);
		setCurrentActiveQuestionArray(shuffledArray);
		setCorrectlyMatchedArray([]);
		setSelectedItems([]);
		setStartTimer(true);
		setEnableNextButton(false);
		setShowInGameNotificationPopup(false);
		setShowCorrectAnswer(false);
		setSmallNotificationData({});
		setShowSmallNotificationPopup(false);
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

	useEffect(() => {
		if (responseView) {
			const allQuestions = responseArray;
			//fill correctly matched array automatically with all categories
			const groupedQuestions = allQuestions.reduce((acc, item) => {
				if (!acc[item.category]) {
					acc[item.category] = [];
				}
				acc[item.category].push(item);
				return acc;
			}, {});
			const groupedQuestionsArray = Object.values(groupedQuestions);
			setCorrectlyMatchedArray(groupedQuestionsArray);
			// setEnableNextButton(true);
		} else if (showCorrectAnswer) {
			const allQuestions = currentActiveQuestion?.questions;
			//fill correctly matched array automatically with all categories
			const groupedQuestions = allQuestions.reduce((acc, item) => {
				if (!acc[item.category]) {
					acc[item.category] = [];
				}
				acc[item.category].push(item);
				return acc;
			}, {});
			const groupedQuestionsArray = Object.values(groupedQuestions);
			setCorrectlyMatchedArray(groupedQuestionsArray);
		}
	}, [responseView, showCorrectAnswer]);

	console.log(showCorrectAnswer, "showCorrectAnswer");

	const toggleSelect = (item) => {
		setSelectedItems((prevSelected) => {
			if (prevSelected.some((selectedItem) => selectedItem.id === item.id)) {
				return prevSelected.filter(
					(selectedItem) => selectedItem.id !== item.id
				);
			} else if (prevSelected.length < rowSize) {
				return [...prevSelected, item];
			} else {
				return prevSelected;
			}
		});
	};

	const GridItem = styled(Button)(
		({ selected, rowSize, responseView, input }) => {
			const baseSize = responseView ? 70 : 85;
			const minFontSize = 11;
			const largestWordLength = input
				.split(" ")
				.reduce((max, word) => Math.max(max, word.length), 0);
			let fontSize;
			if (largestWordLength > 8) {
				fontSize = minFontSize;
			} else if (largestWordLength > 6) {
				fontSize = 12;
			} else {
				fontSize = 13;
			}

			const backgroundColor = selected ? "#ccf900" : "white";

			return {
				color: "black",
				borderRadius: "5px",
				height: `${baseSize}px`,
				width: `${baseSize / rowSize}vw`,
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

	const handleDisselectAll = () => {
		setSelectedItems([]);
	};

	const handleCheckAnswer = () => {
		currentAttemptsRef.current += 1;
		const selectedAnswers = selectedItems.map((item) => item.category);
		const isCorrect = selectedAnswers.every(
			(answer) => answer === selectedAnswers[0]
		);

		if (isCorrect) {
			setAnimationType("success");
			setShowAnimation(true);
			setTimeout(() => {
				setShowAnimation(false);
				setAnimationType("");
			}, 1500);

			setSelectedItems([]);

			const latestCorrentActiveQuestionArray =
				currentActiveQuestionArray.filter(
					(item) =>
						!selectedItems.some((selectedItem) => selectedItem.id === item.id)
				);

			// Add selected items to the correctly matched array
			setCorrectlyMatchedArray((prev) => [...prev, selectedItems]);

			let latestCorrectlyMatchedArray = [
				...correctlyMatchedArray,
				selectedItems,
			];
			const totalCategories = currentActiveQuestion?.questions.length;
			let currentCorrectCategories = 0;
			let currentCorrectCategoriesArray = [selectedAnswers[0]];
			let showRoundUpPopup = false;
			if (
				latestCorrectlyMatchedArray.length ===
				totalCategories / rowSize - 1
			) {
				latestCorrectlyMatchedArray.push(
					latestCorrentActiveQuestionArray?.flat()
				);
				setCorrectlyMatchedArray(() => [...latestCorrectlyMatchedArray]);
				setCurrentActiveQuestionArray([]);
				setEnableNextButton(true);
				currentCorrectCategories += 2;
				currentCorrectCategoriesArray.push(
					latestCorrentActiveQuestionArray?.[0]?.category
				);
				showRoundUpPopup = true;
			} else {
				const shuffledArray = shuffle1DArray(latestCorrentActiveQuestionArray);
				setCurrentActiveQuestionArray(shuffledArray);
				currentCorrectCategories += 1;
			}
			calculateAndSetScore(
				currentCorrectCategories,
				currentCorrectCategoriesArray
			);
			if (showRoundUpPopup) {
				console.log("Solved");
				handlePopupsAndGameEnd("Solved!", "successText");
			} else if (currentAttemptsRef.current === 10) {
				console.log("attempts Up");

				handlePopupsAndGameEnd("Attempts Up!", "failedText");
			}
		} else if (!isTrialGame) {
			const gameStateAttempts = gameState.attempts + 1;
			const gameStateCorrectAttempts = gameState.correctAttempts;
			const overAllAttemptedWords = gameState.attemptedWords || [];
			if (overAllAttemptedWords?.length === currentActiveIndex) {
				overAllAttemptedWords.push(
					JSON.stringify(currentActiveQuestion?.questions)
				);
			}
			console.log("overAllAttemptedWords", overAllAttemptedWords);
			updateGameState({
				attempts: gameStateAttempts,
				correctAttempts: gameStateCorrectAttempts,
				attemptedWords: overAllAttemptedWords,
			});
			setShowAnimation(true);
			setAnimationType("error");
			setTimeout(() => {
				setShowAnimation(false);
				setAnimationType("");
			}, 1500);

			if (currentAttemptsRef.current === 10) {
				handlePopupsAndGameEnd("Attempts Up!", "failedText");
			}
		} else {
			setShowAnimation(true);
			setAnimationType("error");
			setTimeout(() => {
				setShowAnimation(false);
				setAnimationType("");
			}, 1500);

			if (currentAttemptsRef.current === 10) {
				console.log("attempts Up");

				handlePopupsAndGameEnd("Attempts Up!", "failedText");
			}
		}
	};

	const calculateAndSetScore = (
		correctCategories,
		currentCorrectCategoriesArray
	) => {
		const currentScore = correctCategories * rowSize;
		const overallScore = scoreData.overall + currentScore;
		previousScoreRef.current += currentScore;
		overallScoreRef.current = overallScore;

		setScoreData((prev) => ({
			...prev,
			overall: overallScore,
			current: currentScore,
		}));

		if (!isTrialGame) {
			const gameStateAttempts = gameState.attempts + correctCategories;
			const gameStateCorrectAttempts =
				gameState.correctAttempts + correctCategories;
			const gameStateScore = overallScore;
			const currentScoreBreakdown = gameState.scoreBreakdown || {};
			const currentIndexCorrectcategories =
				currentScoreBreakdown?.[currentActiveIndex]?.correctCategories || [];
			const currentIndexCorrectCategories = [
				...currentIndexCorrectcategories,
				...currentCorrectCategoriesArray,
			];
			let currentIndexScore =
				currentScoreBreakdown?.[currentActiveIndex]?.score || 0;
			currentIndexScore += currentScore;
			const overAllAttemptedWords = gameState.attemptedWords || [];
			if (overAllAttemptedWords?.length == currentActiveIndex) {
				overAllAttemptedWords.push(
					JSON.stringify(currentActiveQuestion?.questions)
				);
			}

			const dataToUpdate = {
				attempts: gameStateAttempts,
				correctAttempts: gameStateCorrectAttempts,
				score: gameStateScore,
				scoreBreakdown: {
					...gameState.scoreBreakdown,
					[currentActiveIndex]: {
						correctCategories: currentIndexCorrectCategories,
						score: currentIndexScore,
						solved: correctCategories === 2,
					},
				},
				attemptedWords: overAllAttemptedWords,
			};
			updateGameState(dataToUpdate);
		}
	};

	const handleTimerEnd = () => {
		if (!!popupTimerRef.current) {
			console.log("Timer already ended");
			return;
		}

		handlePopupsAndGameEnd("Time's Up!", "failedText");

		//calculateAndSetScore();
		//call submit game f=after say five seconds timeout
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
			// setEnableNextButton(true);
			console.log("Submit Game", isTrialGame, "isTrialGameTimeout");
			submitGame(isTrialGame);
			setStartTimer(false);
			setShowInGameNotificationPopup(false);
		}, PopupDuration * 1000);
	};

	const handleNextQuestion = () => {
		clearTimeout(timerRef.current);
		clearTimeout(smallPopupTimerRef.current);
		clearTimeout(popupTimerRef.current);

		timerRef.current = null;
		smallPopupTimerRef.current = null;
		popupTimerRef.current = null;

		setStartTimer(false);
		submitGame(isTrialGame);
		setShowInGameNotificationPopup(false);
	};

	return (
		<div
			className={`flex flex-col items-center justify-start bg-[#3a3a3a] h-full ${
				responseView ? "w-[100%]" : "min-h-[100vh] w-[100vw]"
			}`}>
			{!responseView && (
				<div className="grid grid-cols-3 h-[80px] w-[80%]">
					<div className="flex flex-col items-center justify-center mt-2">
						<span className="text-base font-bold text-[#ccf900]">Puzzle</span>
						<span className="text-2xl font-bold text-white">
							{currentActiveIndex + 1}/{questionsList?.length}
						</span>
					</div>

					<div className="flex flex-col items-center justify-center mt-2">
						<span className="text-base font-bold text-[#ccf900]">Score</span>
						<span className="text-2xl font-bold text-white">
							{scoreData.overall}
						</span>
					</div>

					<div className="flex flex-col items-center justify-center mt-2">
						<span className="text-base font-bold text-[#ccf900]">
							Attempts left
						</span>
						<span className="text-2xl font-bold text-white">
							{10 - currentAttemptsRef.current}
						</span>
					</div>
				</div>
			)}

			<div className="mt-3"></div>

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

			{/*<div className="mt-2 mb-2"></div>*/}

			<Box>
				<div className="grid mb-1 mt-1">
					{correctlyMatchedArray?.map((question) => (
						<div
							className={`flex flex-col items-center justify-center ${
								correctCategoriesAnswered?.includes(question[0].category)
									? "bg-[#ccf900]"
									: "bg-white"
							} gap-2 rounded-lg mt-2 p-2  min-h-[90px]`}
							key={question[0].id}>
							{console.log(correctCategoriesAnswered, "nk")}
							{console.log(
								correctCategoriesAnswered?.includes(question[0].category),
								"nckdn"
							)}
							<span className="text-black text-xl">{question[0].category}</span>
							<div className="w-full text-center">
								{/** Display the correctly matched items in comma separated format */}
								<span className="text-black text-center min-w-[250px]">
									{question.map((item) => item.options).join(", ")}
								</span>
							</div>
						</div>
					))}
				</div>
			</Box>

			{!!correctlyMatchedArray?.length && <div className="mt-1 mb-1"></div>}

			{correctlyMatchedArray?.length !== rowSize &&
				!responseView &&
				!showCorrectAnswer && (
					<Box>
						<div className={`grid grid-cols-${rowSize} gap-2`}>
							{currentActiveQuestionArray?.flat().map((item) => {
								const isSelected = selectedItems.some(
									(selectedItem) => selectedItem.id === item.id
								);
								const isDisabled =
									selectedItems.length >= rowSize && !isSelected;

								return (
									<div key={item.id}>
										<GridItem
											selected={isSelected}
											onClick={() => toggleSelect(item)}
											disabled={isDisabled}
											rowSize={rowSize}
											input={item.options}>
											{item.options}
										</GridItem>
									</div>
								);
							})}
						</div>
					</Box>
				)}

			{!responseView && !showCorrectAnswer && (
				<span className="text-base text-white mt-2">
					{`Group cards of a common theme`}
				</span>
			)}

			{!responseView && !showCorrectAnswer && (
				<span className="text-xl font-bold text-white mt-2">
					{`${correctlyMatchedArray?.length || 0} ${
						correctlyMatchedArray?.length === 1 ? "Group" : "Groups"
					} of ${rowSize} cards found`}
				</span>
			)}

			{!responseView &&
				(enableNextButton ? (
					currentActiveIndex !== totalQuestions - 1 && (
						<div className="flex flex-col items-center justify-center mt-2 mb-2">
							<AppButton onClick={handleNextQuestion} sx={{ mt: 4 }}>
								Next Question
							</AppButton>
						</div>
					)
				) : (
					<div className="flex flex-col items-center justify-center mt-2 mb-2">
						<div className="flex items-center justify-center gap-2 font-[12px]">
							<AppButton
								onClick={handleDisselectAll}
								disabled={selectedItems.length == 0}
								variant="secondary">
								Deselect All
							</AppButton>
							<AppButton
								onClick={handleCheckAnswer}
								disabled={selectedItems.length !== rowSize}
								className="w-[100px]">
								Submit
							</AppButton>
						</div>
					</div>
				))}
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
			{showSmallNotificationPopup && (
				<InGameNotificationPopup
					message={smallNotificationData.message}
					type={smallNotificationData.type}
					showTimer={false}
					isCenter={true}
				/>
			)}
		</div>
	);
};

export default CategoriesRoundContainer;
