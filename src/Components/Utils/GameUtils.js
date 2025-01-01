import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase-config";
import {
	GAME_FORMATS,
	NEW_FORMAT_PLAYING_BONUS,
	NEW_FORMAT_TOURNAMENT_HEADERS_CONFIG,
} from "../../Constants/Commons";

export const setTrialWords = async (quizColl, baseDifficulty = 0) => {
	const data = [];
	if (parseInt(baseDifficulty) === 0 || !baseDifficulty) {
		const q = query(collection(db, quizColl), where("isTrial", "==", true));
		const querySnapshot = await getDocs(q);

		querySnapshot.forEach((doc) => {
			data.push(doc.data());
		});
	} else {
		const q = query(
			collection(db, quizColl),
			where("difficulty", "==", +baseDifficulty),
			where("isTrial", "==", true)
		);
		const querySnapshot = await getDocs(q);

		querySnapshot.forEach((doc) => {
			data.push(doc.data());
		});
	}
	localStorage.setItem("currentWord", JSON.stringify(data));
	window.dispatchEvent(new Event("storage"));
	return data;
};

export const fetchQuestionsFromCollection = async (
	quizColl,
	baseDifficulty = 0,
	difficultyPattern = ""
) => {
	let data = [];

	const difficultyPatternNumberArray = difficultyPattern.split(",").map(Number);
	if (difficultyPatternNumberArray?.length > 0) {
		const difficultyArray = difficultyPatternNumberArray;

		// Count occurrences of each difficulty
		const difficultyCounts = difficultyArray.reduce((acc, curr) => {
			acc[curr] = (acc[curr] || 0) + 1;
			return acc;
		}, {});

		const difficultyPatternArray = Object.keys(difficultyCounts);

		// Query questions from Firestore for each difficulty
		const q = query(
			collection(db, quizColl),
			where("difficulty", "in", difficultyPatternArray.map(Number))
		);

		const querySnapshot = await getDocs(q);
		let tempData = [];
		querySnapshot.forEach((doc) => {
			if (!doc.data().isTrial) {
				tempData.push({ ...doc.data(), id: doc.id });
			}
		});

		// Create an object to store questions by difficulty
		let difficultyQuestions = {};
		difficultyPatternArray.forEach((difficulty) => {
			difficultyQuestions[difficulty] = [];
		});

		// Filter and randomly select questions for each difficulty
		difficultyPatternArray.forEach((difficulty) => {
			let temp = tempData.filter((item) => item.difficulty === +difficulty);
			for (let i = 0; i < difficultyCounts[difficulty]; i++) {
				let randomIndex = Math.floor(Math.random() * temp.length);
				difficultyQuestions[difficulty].push(temp[randomIndex]);
				temp.splice(randomIndex, 1); // Remove the selected question to avoid duplication
			}
		});

		// Rebuild the result based on the original difficultyArray sequence
		let finalData = difficultyArray.map((difficulty) =>
			difficultyQuestions[difficulty].shift()
		);

		return finalData;
	} else if (parseInt(baseDifficulty) === 0 || !baseDifficulty) {
		const q = query(collection(db, quizColl));
		const querySnapshot = await getDocs(q);

		querySnapshot.forEach((doc) => {
			data.push(doc.data());
		});
	} else {
		const q = query(
			collection(db, quizColl),
			where("difficulty", "==", +baseDifficulty)
		);
		const querySnapshot = await getDocs(q);

		querySnapshot.forEach((doc) => {
			data.push(doc.data());
		});
		data = data.filter((item) => !item.isTrial);
	}
	return data;
};

export const getScoreDataForFormat = (
	finalScoreDataObject,
	ROUND_FORMAT,
	scoreType = []
) => {
	let scoreDataArray = [];
	switch (ROUND_FORMAT) {
		case GAME_FORMATS.MEMORY_CARDS:
		case GAME_FORMATS.MEMORY_CARDS_PRO:
			scoreDataArray = [
				finalScoreDataObject.currentGameScore,
				finalScoreDataObject.correct,
				Math.floor(
					finalScoreDataObject.currentGameScore - finalScoreDataObject.correct
				),
				NEW_FORMAT_PLAYING_BONUS[ROUND_FORMAT],
				Math.floor(
					finalScoreDataObject.currentGameScore -
					finalScoreDataObject.correct -
					NEW_FORMAT_PLAYING_BONUS[ROUND_FORMAT]
				),
			];
			break;
		case GAME_FORMATS.TANGRAM:
			scoreDataArray = [
				finalScoreDataObject.currentGameScore,
				finalScoreDataObject.correct,
				Math.floor(
					finalScoreDataObject.currentGameScore -
					finalScoreDataObject.timeLeftBonus
				),
				finalScoreDataObject.answered,
				finalScoreDataObject.timeLeftBonus,
			];
			break;
		case GAME_FORMATS.CODING_ALGOS:
			scoreDataArray = [
				finalScoreDataObject.currentGameScore,
				finalScoreDataObject.correct,
				Math.floor(
					finalScoreDataObject.idealStepsBonus +
					finalScoreDataObject.attemptsBonus
				),
				finalScoreDataObject.idealStepsBonus,
				finalScoreDataObject.attemptsBonus,
			];
			break;
		case GAME_FORMATS.GEO_LOCATOR:
			scoreDataArray = [
				finalScoreDataObject.currentGameScore,
				finalScoreDataObject.belowFifty,
				finalScoreDataObject.aboveFiftyBelowHundred,
				finalScoreDataObject.aboveHundredBelowTwoHundred,
				finalScoreDataObject.aboveTwoHundredBelowFiveHundred,
			];
			break;

		case GAME_FORMATS.MATCHING_COLUMNS:
		case GAME_FORMATS.CATEGORIES:
			scoreDataArray = [
				finalScoreDataObject.currentGameScore,
				finalScoreDataObject.puzzlesSolved,
				finalScoreDataObject.accuracy,
				finalScoreDataObject.correct,
				finalScoreDataObject.answered,
			];
			break;
		default:
			let thirdValue;
			if (scoreType && scoreType.includes("AccuracyBoost")) {
				thirdValue =
					finalScoreDataObject.currentGameScore - finalScoreDataObject.correct;
			} else {
				thirdValue = Math.floor(finalScoreDataObject.pace);
			}
			const accuracy = Math.floor(finalScoreDataObject.accuracy);

			scoreDataArray = [
				finalScoreDataObject.currentGameScore,
				finalScoreDataObject.correct,
				thirdValue,
				finalScoreDataObject.attempts,
				accuracy,
			];
			break;
	}
	return scoreDataArray;
};

export const getHeaderConfigForFormat = (ROUND_FORMAT, scoreType = []) => {
	const headerConfig = NEW_FORMAT_TOURNAMENT_HEADERS_CONFIG[ROUND_FORMAT];
	if (
		scoreType &&
		scoreType.includes("AccuracyBoost") &&
		ROUND_FORMAT == "DEFAULT"
	) {
		headerConfig[2] = "ACCURACY BOOST";
	}
	return headerConfig;
};
