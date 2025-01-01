import React, { useEffect, useRef, useState } from "react";
import {
	GAME_FORMATS,
	MAIN_GAME_TIMER,
	PRIMARY_COLOR,
	SECONDARY_COLOR,
} from "../../../Constants/Commons";
import * as FB from "../../Firebase/FirebaseFunctions";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {
	BarChart,
	Bar,
	Cell,
	XAxis,
	YAxis,
	LabelList,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import InputBase from "@mui/material/InputBase";
import { styled } from "@mui/material/styles";
import CountUp from "react-countup";
import _ from "lodash";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import { CarouselComponent } from "../../Utils/Carousel";
import { MEASURE } from "../../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import { pauseAudioClip, playAudioClip } from "../../Utils/AudioPlayer";
import { ReactComponent as PlayButtonSvg } from "../../../assets/icons/play-button.svg";
import GeoLocator from "../../Games/SpellBee/GameComponents/GeoLocator/GeoLocator";
import CategoriesRoundContainer from "../../Games/SpellBee/GameComponents/Categories";
import { MatchingColumnsRoundContainer } from "../../Games/SpellBee/GameComponents/matchingColumns";

const BootstrapInput = styled(InputBase)(({ theme }) => ({
	"label + &": {
		marginTop: theme.spacing(3),
	},
	"& .MuiInputBase-input": {
		borderRadius: 4,
		position: "relative",
		backgroundColor: "rgba(0,0,0,0)",
		color: PRIMARY_COLOR,
		border: "1px solid #ced4da",
		fontSize: 12,
		padding: "6px 26px 6px 12px",
		transition: theme.transitions.create(["border-color", "box-shadow"]),
		"&:focus": {
			borderRadius: 4,
			borderColor: "#80bdff",
			boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
		},
	},
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
	[`&.${tableCellClasses.head}`]: {
		backgroundColor: PRIMARY_COLOR,
		color: SECONDARY_COLOR,
		fontWeight: "bolder",
	},
	[`&.${tableCellClasses.body}`]: {
		fontSize: 14,
		color: "white",
		border: "none",
	},
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
	"&:nth-of-type(odd)": {
		background:
			"linear-gradient(89.91deg, #3A3A3A 80%, rgba(24, 24, 24, 0) 568.67%)",
	},
	"&:nth-of-type(even)": {
		background:
			"linear-gradient(89.91deg, #3A3A3A 80%, rgba(24, 24, 24, 0) 568.67%)",
	},
	// hide last border
	"&:last-child td, &:last-child th": {
		border: 0,
	},
}));

export const UserStats = (props) => {
	const {
		tournamentId,
		poolTournamentId,
		userPoolData,
		isEliminationFinal,
		activeRound,
		isDemoGame,
		data,
	} = props;
	const [wordData, setWordsData] = useState([]);
	const [wordList, setWordList] = useState({});
	const [chartData, setChartData] = useState([]);
	const [score, setScore] = useState(0);
	const [pace, setPace] = useState(0);
	const [accuracy, setAccuracy] = useState(0);
	const [correctAttempts, setCorrectAttempts] = useState(0);
	const [noOfAttempts, setNoOfAttempts] = useState(0);
	const [roundFormat, setRoundFormat] = useState(GAME_FORMATS.QUIZ);
	const [aggregateOption, setAggregateOption] = useState(0);
	const [wordRoundOption, setWordRoundOption] = useState("1");
	const audioElRef = useRef(null);

	const _setOverviewData = (round = 0) => {
		let userScore = 0,
			noOfAttempts = 0,
			userPace = 0,
			correctAttempts = 0;
		if (round === 0 && !isEliminationFinal) {
			userScore = data.score.reduce((prev, curr) => curr + prev, 0);
			noOfAttempts = data.attempts.reduce((prev, curr) => curr + prev, 0);
			correctAttempts = data.correctAttempts.reduce(
				(prev, curr) => curr + prev,
				0
			);
			userPace = noOfAttempts
				? Math.floor((MAIN_GAME_TIMER * data.daysPlayed.length) / noOfAttempts)
				: 0;
		} else {
			let leaderboardData = data;
			const dataIndex = leaderboardData.round?.indexOf(String(round)) ?? 0;
			userScore = leaderboardData.score[dataIndex];
			noOfAttempts = leaderboardData.attempts[dataIndex];
			correctAttempts = leaderboardData.correctAttempts[dataIndex];
			userPace = noOfAttempts ? Math.floor(MAIN_GAME_TIMER / noOfAttempts) : 0;
		}

		const userAccuracy = Math.floor((correctAttempts * 100) / noOfAttempts);

		setScore(userScore);
		setAccuracy(userAccuracy);
		setPace(userPace);
		setCorrectAttempts(correctAttempts);
		setNoOfAttempts(noOfAttempts);
	};

	const _getWordListDetails = async () => {
		const childId = localStorage.getItem("userId");
		const gameId = localStorage.getItem("gId");
		let data = null;
		if (isDemoGame && gameId) {
			data = await FB.getData("practiceGames", gameId);
			data = [data];
		} else {
			if (isEliminationFinal && poolTournamentId) {
				data = await FB.getAllDocsWithQuery(`children/${childId}/games`, {
					field: "tournamentId",
					operator: "==",
					value: poolTournamentId,
				});
			}
			const tempData = await FB.getAllDocsWithQuery(
				`children/${childId}/games`,
				{
					field: "tournamentId",
					operator: "==",
					value: tournamentId,
				}
			);

			if (data) {
				data = [...data, ...tempData];
			} else {
				data = tempData;
			}
		}
		const newData = _.orderBy(data, ["round"], ["asc"]);
		setRoundFormat(newData[0].format);
		setWordsData(newData);
		// FB.getAllDocsWithQuery(`children/${childId}/games`, {
		//   field: "tournamentId",
		//   operator: "==",
		//   value: tournamentId,
		// })
		//   .then((data) => {
		//     const newData = _.orderBy(data, ["round"], ["asc"]);
		//     setRoundFormat(newData[0].format);
		//     setWordsData(newData);
		//   })
		//   .catch((e) => {
		//     console.log("Error!", e);
		//   });
	};

	// useEffect(() => {
	//   const audioEl = document.querySelector("audio");
	//   audioElRef.current = audioEl;
	// }, []);

	const handlePlay = () => {
		const audioEl = document.querySelector("audio");
		audioEl.play();
	};

	const _setWordList = (round) => {
		const wordDataByRound = wordData.find((wd) => wd.round === round);
		setRoundFormat(wordDataByRound.format);
		setWordList(wordDataByRound);
	};

	const handleChange = (event) => {
		setAggregateOption(event.target.value);
		_setOverviewData(event.target.value);
	};
	const handleWordRoundChange = (event) => {
		setWordRoundOption(event.target.value);
		_setWordList(event.target.value);
	};

	// const pauseAnyPlayingAudio = () => {
	//   if (audioElRef && !audioElRef.paused) {
	//     pauseAudioClip();
	//   }
	// };

	useEffect(() => {
		MEASURE(
			INSTRUMENTATION_TYPES.USER_STATS_VIEWED,
			localStorage.getItem("userId"),
			{}
		);
		if (data && data.id) {
			let dataIndex = Number(data.round[data.round.length - 1]);
			if (isEliminationFinal) {
				dataIndex = dataIndex + 1;
			}
			setAggregateOption(dataIndex);
			_setOverviewData(dataIndex);
			_getWordListDetails();
			const cData = [];
			// set chart data
			for (let i = 0; i < Number(activeRound); i++) {
				// const filteredData = data.find((d) => d.round == i + 1);
				const isDataPresent = data.round.includes(String(i + 1));
				cData.push({
					name: `R ${isDataPresent ? data.round[i] : i + 1}`,
					score: isDataPresent ? data.score[i] : 0,
					attempts: isDataPresent ? data.attempts[i] - data.score[i] : 0,
				});
			}
			setChartData(cData);
		}
	}, [data]);

	useEffect(() => {
		if (wordData && wordData.length) {
			setWordRoundOption(wordData[wordData.length - 1].round);
			_setWordList(wordData[wordData.length - 1].round);
		}
	}, [wordData]);

	const renderCards = (roundFormat) => {
		if (!wordList.attemptedWords.length) {
			return <></>;
		}
		return wordList.attemptedWords.map((attr, idx) => {
			const temp = `${attr}`;
			const finalString = temp
				.replace(/"/g, '"')
				.replace(/'/g, "'")
				.replace(/style=\"(.*?)\"/g, (match, p1) => {
					const replaced = p1.replace(/"/g, '\\\\"');
					return `style=\\"${replaced}\\"`;
				});
			const attrObj = JSON.parse(finalString);
			return (
				<div
					key={`com-${idx}`}
					className="w-full text-sm p-3 overflow-hidden bg-[rgba(58,58,58,0.9)]">
					{roundFormat === GAME_FORMATS.AUDIOCLIP ? (
						<div className="flex gap-4 items-center px-2 py-4">
							<audio
								className="absolute -top-[9999px]"
								//src={attrObj.audioClip}
								//preload="auto"
								ref={audioElRef}
							/>
							<div
								className="iconButtonContainer p-4 !w-[78px] !h-[78px]"
								onClick={(e) => playAudioClip(attrObj.audioClip)}>
								<PlayButtonSvg className="h-[50px] w-[50px]" />
							</div>
							<div className="text-sm mt-2 text-center text-white font-bold">
								PLAY AUDIO
							</div>
						</div>
					) : (
						<></>
					)}
					{[
						GAME_FORMATS.IMAGE,
						GAME_FORMATS.IMAGE_JUMBLED,
						GAME_FORMATS.FLASH_IMAGES,
					].includes(roundFormat) ? (
						<div
							style={{
								backgroundImage: `url(${attrObj.imageUrl})`,
								height: "30vh",
								backgroundPosition: "center",
								backgroundSize: "contain",
								backgroundRepeat: "no-repeat",
							}}
						/>
					) : null}
					<div
						style={{
							margin: "10px",
							color: "#ccf900",
						}}>
						Attempt Number: <span style={{ color: "white" }}>{idx + 1}</span>
						<br />
						<br />
						{roundFormat === GAME_FORMATS.IMAGE_JUMBLED ? (
							<>
								Jumbled Word:{" "}
								<span style={{ color: "white", whiteSpace: "pre-line" }}>
									{wordList?.jumbledString[idx]}
								</span>
							</>
						) : (
							<>
								Question:{" "}
								<span
									style={{ color: "white", whiteSpace: "pre-line" }}
									dangerouslySetInnerHTML={{
										__html: attrObj.question,
									}}></span>
							</>
						)}
						<br />
						<br />
						Your Response:{" "}
						<span style={{ color: "white" }}>{wordList.responses[idx]}</span>
						<br />
						<br />
						Answer: <span style={{ color: "white" }}>{attrObj.answer}</span>
						<br />
						<br />
						{wordList.results ? (
							<>
								Result:{" "}
								<span style={{ color: "white" }}>
									{wordList.responses[idx]
										? wordList.results[idx]
											? "Correct"
											: "Incorrect"
										: "Skipped"}
								</span>
								<br />
								<br />
							</>
						) : null}
						{attrObj.solution && attrObj.solution !== "null" ? (
							<>
								Solution:{" "}
								<span style={{ color: "white" }}>{attrObj.solution}</span>
								<br />
								<br />{" "}
							</>
						) : null}
					</div>
				</div>
			);
		});
	};

	const renderTangramCards = () => {
		if (!wordList.attemptedWords.length) {
			return <></>;
		}
		return wordList.attemptedWords.map((attr, idx) => {
			const temp = `${attr}`;
			const finalString = temp
				.replace(/"/g, '"')
				.replace(/'/g, "'")
				.replace(/style=\"(.*?)\"/g, (match, p1) => {
					const replaced = p1.replace(/"/g, '\\\\"');
					return `style=\\"${replaced}\\"`;
				});
			const attrObj = JSON.parse(finalString);

			return (
				<div className="w-full text-sm p-3 overflow-hidden bg-[rgba(58,58,58,0.9)] flex flex-col gap-3">
					<div
						key={`tangram-${idx}`}
						style={{
							backgroundImage: `url(${attrObj.imageUrl})`,
							height: "30vh",
							backgroundPosition: "center",
							backgroundSize: "contain",
							backgroundRepeat: "no-repeat",
						}}
					/>
					<div
						style={{
							margin: "10px",
							color: "#ccf900",
						}}>
						Result:{" "}
						<span className="text-white">
							{wordList.results?.[idx]
								? `You solved it in ${Math.floor(
									wordList.scoreBreakdown?.[idx]?.timeTaken
								)} secs`
								: "You couldn't solve it"}
						</span>
					</div>
					<br />
				</div>
			);
		});
	};

	const getMatchingIndexes = (scoreBreakdown) => {
		const correctPairs = scoreBreakdown.correctPairs;
		const matchingIndexes = [];

		correctPairs.forEach((pair, index) => {
			if (pair.itemOne.matchId === pair.itemTwo.matchId) {
				matchingIndexes.push(index);
			}
		});

		return matchingIndexes;
	};

	const rendermMatchingColumnCards = () => {
		if (!wordList.attemptedWords.length) {
			return <></>;
		}
		return wordList.attemptedWords.map((attr, idx) => {
			const temp = `${attr}`;
			const finalString = temp
				.replace(/"/g, '"')
				.replace(/'/g, "'")
				.replace(/style=\"(.*?)\"/g, (match, p1) => {
					const replaced = p1.replace(/"/g, '\\\\"');
					return `style=\\"${replaced}\\"`;
				});
			const attrObj = JSON.parse(finalString);

			console.log(attrObj, "attrObj")
			const totalCategories = attrObj?.length


			const correctResponses = getMatchingIndexes(wordList?.scoreBreakdown?.[idx])
			const totlaFound = correctResponses?.length
			return (
				<div className="w-full text-sm p-3 overflow-hidden bg-[rgba(58,58,58,0.9)] flex flex-col gap-3">
					<MatchingColumnsRoundContainer
						currentActiveQuestion={{ pairs: attrObj }}
						currentActiveIndex={idx}
						responseView={true}
						responseArray={attrObj}
						correctResponses={correctResponses}
					/>
					<div
						style={{
							margin: "10px",
							color: "#ccf900",
							fontSize: "18px",
						}}>
						You Matched:{" "}
						<span className="text-white">
							{totlaFound}/{totalCategories}
						</span>
					</div>
					<br />
				</div>
			);
		});

	}

	const renderCategryCards = () => {
		if (!wordList.attemptedWords.length) {
			return <></>;
		}
		return wordList.attemptedWords.map((attr, idx) => {
			const temp = `${attr}`;
			const finalString = temp
				.replace(/"/g, '"')
				.replace(/'/g, "'")
				.replace(/style=\"(.*?)\"/g, (match, p1) => {
					const replaced = p1.replace(/"/g, '\\\\"');
					return `style=\\"${replaced}\\"`;
				});
			const attrObj = JSON.parse(finalString);

			const totalCategories =
				attrObj?.length /
				attrObj.filter((item) => item.category === attrObj?.[0]?.category)
					?.length;
			const totlaFound =
				wordList?.scoreBreakdown?.[idx]?.correctCategories?.length ?? 0;
			return (
				<div className="w-full text-sm p-3 overflow-hidden bg-[rgba(58,58,58,0.9)] flex flex-col gap-3">
					<CategoriesRoundContainer
						currentActiveQuestion={{ questions: attrObj }}
						currentActiveIndex={idx}
						responseView={true}
						responseArray={attrObj}
						correctCategoriesAnswered={
							wordList?.scoreBreakdown?.[idx]?.correctCategories
						}
					/>
					<div
						style={{
							margin: "10px",
							color: "#ccf900",
							fontSize: "18px",
						}}>
						You Found:{" "}
						<span className="text-white">
							{totlaFound}/{totalCategories}
						</span>
					</div>
					<br />
				</div>
			);
		});
	};

	const renderGeoLocatorCards = () => {
		if (!wordList.attemptedWords.length) {
			return <></>;
		}
		return wordList.attemptedWords.map((attr, idx) => {
			const temp = `${attr}`;
			const finalString = temp
				.replace(/"/g, '"')
				.replace(/'/g, "'")
				.replace(/style=\"(.*?)\"/g, (match, p1) => {
					const replaced = p1.replace(/"/g, '\\\\"');
					return `style=\\"${replaced}\\"`;
				});
			const attrObj = JSON.parse(finalString);
			return (
				<div className="w-full text-sm p-3 overflow-hidden bg-[rgba(58,58,58,0.9)] flex flex-col gap-3">
					<GeoLocator
						currentActiveQuestion={{
							...attrObj,
							markerLocation: wordList.scoreBreakdown?.[idx]?.markerLocation,
						}}
						currentActiveIndex={idx}
						responseView={true}
					/>

					<div
						style={{
							margin: "2px",
							color: "#ccf900",
						}}>
						City:{" "}
						<span className="text-white">
							{wordList.scoreBreakdown?.[idx]?.city}
						</span>
					</div>
					{wordList.scoreBreakdown?.[idx]?.distance >= 0 && (
						<div
							style={{
								margin: "2px",
								color: "#ccf900",
							}}>
							Distance to your marker:{" "}
							<span className="text-white">
								{wordList.scoreBreakdown?.[idx]?.distance} km
							</span>
						</div>
					)}
					<div
						style={{
							margin: "2px",
							color: "#ccf900",
						}}>
						Score:{" "}
						<span className="text-white">
							{wordList.scoreBreakdown?.[idx]?.currentRoundScore}
						</span>
					</div>
					<br />
				</div>
			);
		});
	};

	return (
		<div className="h-full overflow-auto space-y-4 pb--[20%] md:pb-[10%]">
			<div
				className="mx-2 rounded-xl p-4"
				style={{
					background:
						"linear-gradient(89.91deg, #3A3A3A -7.1%, rgba(24, 24, 24, 0) 568.67%)",
				}}>
				<div style={{ color: "white", fontSize: 14 }}>
					<Select
						id="t-s-select"
						sx={{
							".MuiInputBase-input": {
								fontSize: {
									md: "16px",
								},
							},
							color: "white",
							".MuiOutlinedInput-notchedOutline": {
								borderColor: "rgba(228, 219, 233, 0.25)",
							},
							"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
								borderColor: "rgba(228, 219, 233, 0.25)",
							},
							"&:hover .MuiOutlinedInput-notchedOutline": {
								borderColor: "rgba(228, 219, 233, 0.25)",
							},
							".MuiSvgIcon-root ": {
								fill: "white !important",
							},
						}}
						value={aggregateOption}
						label="Select Round"
						onChange={handleChange}
						input={<BootstrapInput />}>
						{!isEliminationFinal && <MenuItem value={0}>Overall</MenuItem>}
						{Array.from(Array(Number(activeRound))).map((e, i) => (
							<MenuItem key={i} value={i + 1}>
								Round {i + 1}
							</MenuItem>
						))}
					</Select>
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						color: "#f5f5f5",
						fontSize: 16,
						textAlign: "center",
					}}>
					<div>
						<span className="text-[11px] md:text-base">SCORE</span> <br />
						<span style={{ color: "#CCF900", fontWeight: 800, fontSize: 65 }}>
							<CountUp end={score} duration={0.75} />
						</span>
					</div>
					<div className="text-[11px] md:text-sm">
						OVERALL
						<br />
						PROGRESS
						<br />
					</div>
					<img
						src="/Assets/Images/trikon.png"
						height="60px"
						width="auto"
						alt="trikon"
					/>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							marginTop: 0,
						}}>
						{roundFormat === GAME_FORMATS.CODING_ALGOS ||
							roundFormat === GAME_FORMATS.TANGRAM ? (
							<div className="data-round-container">
								<div className="data-round" style={{ flexDirection: "column" }}>
									<CountUp
										end={correctAttempts}
										duration={0.75}
										style={{ flexDirection: "column" }}
									/>
									{/* <span style={{ fontSize: 10 }}>secs/attempt</span> */}
								</div>
								<div className="text-[11px] md:text-base">PROBLEMS SOLVED</div>
							</div>
						) : (
							<div className="data-round-container">
								<div className="data-round" style={{ flexDirection: "column" }}>
									<CountUp
										end={noOfAttempts}
										duration={0.75}
										style={{ flexDirection: "column" }}
									/>
								</div>
								<div style={{ fontSize: 11 }}>QUESTIONS</div>
							</div>
						)}
						<div className="data-round-container">
							<div className="data-round">
								<CountUp end={accuracy} duration={0.75} />%
							</div>
							<div className="text-[11px] md:text-base">ACCURACY</div>
						</div>
					</div>
				</div>
			</div>
			{/*<div
        className="mx-2 rounded-xl p-4"
        style={{
          // width: "96%",
          // minHeight: "233px",
          background:
            "linear-gradient(89.91deg, #3A3A3A -7.1%, rgba(24, 24, 24, 0) 568.67%)",
          borderRadius: "12px",
          // margin: "0 8px",
          padding: "16px",
        }}
      >
        <div
          style={{
            width: "100%",
            textAlign: "center",
            color: "#f5f5f5",
            margin: 10,
          }}
        >
          TRENDLINE
        </div>
        {data && data.id ? (
          <div style={{ width: "100%", height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                width={317}
                height={141}
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tick={{ fill: "#f5f5f5" }}
                  style={{
                    fontSize: "12px",
                  }}
                />
                <Tooltip />
                <defs>
                  <linearGradient
                    id="colorUv"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="100%"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#ccf900" />
                    <stop offset="1" stopColor="#a0c300" />
                  </linearGradient>
                </defs>
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "#f5f5f5", fontSize: "12px" }}>
                      {value}
                    </span>
                  )}
                />
                <Bar dataKey="score" barSize={40} fill="url(#colorUv)">
                  <LabelList
                    dataKey="score"
                    position="top"
                    offset={10}
                    style={{
                      textAnchor: "middle",
                      fontSize: "80%",
                      fill: "#ccf900",
                    }}
                  />
                </Bar>
                {/* <Bar
                  dataKey="attempts"
                  stackId="a"
                  barSize={40}
                  fill="#7f7f7f"
                  style={{ borderRadius: "50px" }}
                >
                  <LabelList
                    dataKey="attempts"
                    position="left"
                    offset={10}
                    style={{
                      textAnchor: "middle",
                      fontSize: "80%",
                      fill: "#f5f5f5",
                    }}
                  />
                </Bar> */}
			{/*</BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>*/}
			<div
				className="mx-2 rounded-xl py-4 md:p-4 !mb-[25%] md:!mb-[15%]"
				style={{
					// marginTop: "10px",
					// width: "96%",
					// minHeight: "110px",
					background:
						"linear-gradient(89.91deg, #3A3A3A -7.1%, rgba(24, 24, 24, 0) 568.67%)",
					// borderRadius: "12px",
					// margin: "6px",
					// marginBottom: "100px",
				}}>
				<div style={{ margin: "10px", color: "white", fontSize: 16 }}>
					<div
						style={{ textAlign: "center", marginBottom: 10, color: "#f5f5f5" }}>
						YOUR ATTEMPTS
					</div>
					<div>
						{wordData && wordData.length ? (
							<Select
								id="t-select"
								sx={{
									color: "white",
									".MuiOutlinedInput-notchedOutline": {
										borderColor: "rgba(228, 219, 233, 0.25)",
									},
									"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
										borderColor: "rgba(228, 219, 233, 0.25)",
									},
									"&:hover .MuiOutlinedInput-notchedOutline": {
										borderColor: "rgba(228, 219, 233, 0.25)",
									},
									".MuiSvgIcon-root ": {
										fill: "white !important",
									},
								}}
								value={wordRoundOption}
								label="Select Round"
								onChange={handleWordRoundChange}
								input={<BootstrapInput />}>
								{wordData.map((wd, i) => (
									<MenuItem key={i} value={wd.round}>
										Round {wd.round}
									</MenuItem>
								))}
							</Select>
						) : null}
					</div>
				</div>
				<div
					style={{
						width: "100%",
						marginBottom: 10,
					}}>
					{wordList &&
						wordList.round &&
						[GAME_FORMATS.JUMBLE, GAME_FORMATS.AUDIO].includes(roundFormat) ? (
						<TableContainer
							component={Paper}
							sx={{
								maxHeight: "60vh",
							}}>
							<Table
								stickyHeader
								sx={{ maxWidth: "100%" }}
								aria-label="simple table"
								size="small">
								<TableHead>
									<StyledTableRow style={{ padding: 8 }}>
										{wordList.jumbledString &&
											wordList.jumbledString.length &&
											wordList.jumbledString[0] !== null ? (
											<StyledTableCell align="center">
												Jumbled String
											</StyledTableCell>
										) : null}
										<StyledTableCell align="center">Answer</StyledTableCell>
										<StyledTableCell align="center">
											Your Response
										</StyledTableCell>
									</StyledTableRow>
								</TableHead>
								<TableBody>
									{wordList.attemptedWords.map((attWrd, i) => (
										<StyledTableRow
											key={`${i}`}
											sx={{
												"&:last-child td, &:last-child th": { border: 0 },
											}}>
											{wordList.jumbledString &&
												wordList.jumbledString.length &&
												wordList.jumbledString[0] !== null ? (
												<StyledTableCell align="center">
													{wordList.jumbledString[i]}
												</StyledTableCell>
											) : null}
											<StyledTableCell
												align="center"
												dangerouslySetInnerHTML={{
													__html: JSON.parse(attWrd).question,
												}}></StyledTableCell>
											<StyledTableCell
												align="center"
												style={{
													color: wordList.results
														? wordList.results[i]
															? "#ccf900"
															: "#ff5050"
														: "white",
												}}>
												{wordList.responses[i]}
											</StyledTableCell>
										</StyledTableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					) : null}
					{wordList &&
						wordList.round &&
						[
							GAME_FORMATS.QUIZ,
							GAME_FORMATS.IMAGE,
							GAME_FORMATS.AUDIOCLIP,
							GAME_FORMATS.IMAGE_JUMBLED,
							GAME_FORMATS.FLASH_IMAGES,
						].includes(roundFormat) ? (
						<div style={{ marginLeft: "10px", marginRight: "10px" }}>
							<CarouselComponent
								dataLength={wordList.attemptedWords.length}
								afterChange={pauseAudioClip}
								itemsPerPage={1}>
								{renderCards(roundFormat)}
							</CarouselComponent>
						</div>
					) : null}
					{wordList &&
						wordList.round &&
						[GAME_FORMATS.MEMORY_CARDS, GAME_FORMATS.CODING_ALGOS].includes(
							roundFormat
						) ? (
						<div
							className="flex flex-wrap justify-center tect-center items-center text-white h-[160px]"
							style={{
								marginLeft: "10px",
								marginRight: "10px",
								marginTop: "10px",
								marginBottom: "10px",
							}}>
							{roundFormat === GAME_FORMATS.CODING_ALGOS
								? "Make your algorithm round"
								: "Memory Cards Round"}
						</div>
					) : null}
					{wordList &&
						wordList.round &&
						[GAME_FORMATS.TANGRAM].includes(roundFormat) ? (
						<CarouselComponent
							dataLength={wordList.attemptedWords.length}
							afterChange={pauseAudioClip}
							itemsPerPage={1}>
							{renderTangramCards()}
						</CarouselComponent>
					) : null}
					{wordList &&
						wordList.round &&
						[GAME_FORMATS.GEO_LOCATOR].includes(roundFormat) ? (
						<CarouselComponent
							dataLength={wordList.attemptedWords.length}
							afterChange={pauseAudioClip}
							itemsPerPage={1}>
							{renderGeoLocatorCards()}
						</CarouselComponent>
					) : null}
					{wordList &&
						wordList.round &&
						[GAME_FORMATS.CATEGORIES].includes(roundFormat) ? (
						<CarouselComponent
							dataLength={wordList.sentWords.length}
							afterChange={pauseAudioClip}
							itemsPerPage={1}>
							{renderCategryCards()}
						</CarouselComponent>
					) : null}
					{wordList &&
						wordList.round &&
						[GAME_FORMATS.MATCHING_COLUMNS].includes(roundFormat) ? (
						<CarouselComponent
							dataLength={wordList.sentWords.length}
							afterChange={pauseAudioClip}
							itemsPerPage={1}>
							{rendermMatchingColumnCards()}
						</CarouselComponent>
					) : null}
				</div>
			</div>
		</div>
	);
};
