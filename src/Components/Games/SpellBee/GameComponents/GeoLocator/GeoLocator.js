import React, { useState, useEffect, useRef } from "react";
import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	useMap,
	useMapEvents,
} from "react-leaflet";
import L, { marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import AppButton from "../../../../Common/AppButton";
import { InGameNotificationPopup } from "../../InGameNotificationPopup";
import { set } from "lodash";
import LinearTimerBar from "../LinearTimerBar";
import {
	NEW_FORMAT_TOURNAMENT_GAME_TIMER,
	NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER,
} from "../../../../../Constants/Commons";
import "./markerPopup.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
	iconUrl: require("leaflet/dist/images/marker-icon.png"),
	shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const greenIcon = new L.Icon({
	iconUrl:
		"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
	shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

const GeoLocator = ({
	submitGame,
	isTrialGame,
	currentActiveQuestion,
	updateGameState,
	gameState,
	currentActiveIndex,
	totalQuestions,
	roundFormat,
	responseView = false,
	isDemo = false,
}) => {
	const currentCity = currentActiveQuestion;
	const Timer = isTrialGame
		? NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER[roundFormat]
		: NEW_FORMAT_TOURNAMENT_GAME_TIMER[roundFormat];
	const [currentCityIndex, setCurrentCityIndex] = useState(0);
	const [scoreData, setScoreData] = useState({
		overall: 0,
		current: 0,
		message: "",
		distance: 0,
		attempts: 0,
		correctAttempts: 0,
		attemptedWords: [],
		results: [],
	});
	const [actualLocationPopup, setActualLocationPopup] = useState(false);
	const [showActualLocationPopup, setShowActualLocationPopup] = useState(false);
	const [markerPosition, setMarkerPosition] = useState(null);
	const [country, setCountry] = useState(null);
	const [showInGameNotificationPopup, setShowInGameNotificationPopup] =
		useState(false);
	const [zoom, setZoom] = useState(4);
	const [zoonLevelSet, setZoomLevelSet] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState(5);
	const timerAfterSubmit = 10;
	const [startTimer, setStartTimer] = useState(false);
	const markerRef = useRef(null);
	const timeOutRef = useRef(null);

	const MapZoomHandler = ({ zoom }) => {
		const map = useMap();
		useEffect(() => {
			if (zoonLevelSet) return;
			map.setZoom(zoom);
			map.setView([20.5937, 78.9629]);
			setZoomLevelSet(true);
		}, [zoom, zoonLevelSet]);
		return null;
	};

	useEffect(() => {
		setZoomLevelSet(false);
		setStartTimer(true);
	}, [currentActiveIndex]);

	useEffect(() => {
		if (responseView) {
			setMarkerPosition(currentCity?.markerLocation);
			setShowActualLocationPopup(true);
		}
	}, [responseView, currentCity]);

	const fetchLocation = async (lat, lon) => {
		const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
		try {
			const response = await fetch(url, {
				headers: {
					"User-Agent": "MyAppName (your.email@example.com)",
				},
			});
			if (!response.ok) throw new Error("Error fetching data");
			const data = await response.json();
			// setLocationData(data);
		} catch (error) {
			// setError(error.message);
		}
	};
	useEffect(() => {
		if (markerRef.current && showActualLocationPopup) {
			markerRef.current.openPopup(); // Open the popup manually using the Leaflet API
		}
	}, [showActualLocationPopup]);
	const distanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
		if (lat1 === -1 || lon1 === -1) return -1;
		const R = 6371e3; // metres
		const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
		const φ2 = (lat2 * Math.PI) / 180;
		const Δφ = ((lat2 - lat1) * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;
		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const d = (R * c) / 1000; // in kilometers
		return d;
	};

	useEffect(() => {
		let timer;
		if (showActualLocationPopup && timeRemaining > 0) {
			timer = setTimeout(() => {
				setTimeRemaining((prevTime) => prevTime - 1);
			}, 1000);
		}
		return () => clearTimeout(timer); // Clear the timer when the component unmounts or timer is done
	}, [showActualLocationPopup, timeRemaining]);

	const MapClickHandler = () => {
		useMapEvents({
			click: (e) => {
				if (!showActualLocationPopup) {
					setMarkerPosition(e.latlng);
				}
			},
		});
		return null;
	};

	const handleSubmitLocation = (submitAction = false) => {
		if (submitAction && !markerPosition) {
			return;
		}
		setShowActualLocationPopup(true);
		calculateAndSetScore();
		setTimeRemaining(timerAfterSubmit);
		setStartTimer(false);
		timeOutRef.current = setTimeout(() => {
			setShowActualLocationPopup(false);
			setMarkerPosition(null);
			submitGame(isTrialGame);
		}, timerAfterSubmit * 1000);
	};

	const handleGetNextQuestion = () => {
		setStartTimer(false);
		setShowActualLocationPopup(false);
		setMarkerPosition(null);
		if (timeOutRef.current) {
			clearTimeout(timeOutRef.current);
		}
		submitGame(isTrialGame);
	};

	const calculateAndSetScore = () => {
		let distance = distanceBetweenPoints(
			markerPosition?.lat ?? -1,
			markerPosition?.lng ?? -1,
			currentCity.location[0],
			currentCity.location[1]
		);
		//restrict the distance to 2 decimal places
		distance = distance.toFixed(2);

		let currentRoundScore = 0;
		let message = "Correct!";
		if (distance >= 0 && distance < 50) {
			currentRoundScore = 4;
		} else if (distance >= 0 && distance < 100) {
			currentRoundScore = 3;
		} else if (distance >= 0 && distance < 200) {
			currentRoundScore = 2;
		} else if (distance >= 0 && distance < 500) {
			currentRoundScore = 1;
		} else {
			message = "Incorrect!";
		}
		const updatedScore = scoreData.overall + currentRoundScore;
		const attempts = scoreData.attempts + 1;
		const correctAttempts =
			currentRoundScore > 0
				? scoreData.correctAttempts + 1
				: scoreData.correctAttempts;
		// const attemptedWords = [...(scoreData.attemptedWords ?? []), currentCity.city];
		const attemptedWords = scoreData.attemptedWords;
		const attemptsWordObject = {
			city: currentCity.city,
			location: currentCity.location,
			// markerLocation: markerPosition ? [markerPosition.lat, markerPosition.lng] : null,
		};
		attemptedWords.push(JSON.stringify(attemptsWordObject));
		const results = scoreData.results ?? [];
		results.push(currentRoundScore > 0 ? true : false);
		setScoreData({
			overall: updatedScore,
			current: currentRoundScore,
			message: message,
			distance: distance >= 0 ? distance : "NA",
			attempts: attempts,
			correctAttempts: correctAttempts,
			attemptedWords: attemptedWords,
			results: results,
		});

		if (!isTrialGame) {
			const dataToUpdate = {
				score: updatedScore,
				attempts: attempts,
				correctAttempts: correctAttempts,
				scoreBreakdown: {
					...(gameState?.scoreBreakdown ?? {}),
					[currentActiveIndex]: {
						city: currentCity.city,
						currentRoundScore,
						distance,
						markerLocation: markerPosition
							? [markerPosition.lat, markerPosition.lng]
							: null,
					},
				},
				attemptedWords,
				results,
			};

			updateGameState(dataToUpdate);
		}
	};

	return (
		<div className="w-[100%] text-center text-black">
			{!responseView && (
				<div className="mt-4 flex justify-between text-[16px]">
					<div className="flex flex-col gap-2">
						<span>Score </span>
						<span> {scoreData?.overall ?? 0} </span>
					</div>
					<div className="flex flex-col gap-2">
						<span className="text-black">Locate</span>
						<span className="text-2xl">{currentCity?.city}</span>
					</div>
					<div className="flex flex-col gap-2">
						<span>Progress</span>
						<span>{`${currentActiveIndex + 1}/${totalQuestions}`}</span>
					</div>
				</div>
			)}
			{!responseView && (
				<LinearTimerBar
					totalDuration={Timer}
					startTimer={startTimer}
					isSelfTimer
					reset={startTimer}
					timerEnd={handleSubmitLocation}
					customHeight="h-2"
					// timeRef={timeRef}
				/>
			)}
			<MapContainer
				center={[20.5937, 78.9629]}
				zoom={zoom}
				style={{
					height: `${responseView ? "50vh" : isDemo ? "60vh" : "70vh"}`,
					width: "100%",
				}}
				attributionControl={false}
				dragging={!responseView}>
				<TileLayer
					url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
					//  url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"

					// url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
					// url="https://tile.waymarkedtrails.org/mtb/{z}/{x}/{y}.png"
					attribution="&copy; OpenStreetMap contributors &copy; CARTO"
				/>

				<MapClickHandler />
				<MapZoomHandler zoom={zoom} />
				{markerPosition && (
					<Marker position={markerPosition}>
						<Popup>You are in: {country || "Unknown"}</Popup>
					</Marker>
				)}
				{showActualLocationPopup && (
					//     <Marker position={[currentCity.location[0], currentCity.location[1]]} icon={greenIcon} ref={markerRef} >
					//       {!responseView && <Popup autoClose={false} closeOnClick={false} closeButton={false}
					// style={{ backgroundColor: '#3a3a3a', color: 'white', borderRadius: '8px', padding: '10px' }}
					// >
					//         <div className='flex flex-col  w-full h-[100%]'>
					//           <span className='text-center'>{currentCity.city}</span>
					//           <div className='flex flex-col justify-center mt-3 mb-2'>

					//             {scoreData.distance !== "NA" && <span>Distance from your marker: {scoreData?.distance} km</span>}
					//             <span>Current score: {scoreData?.current}</span>
					//           </div>
					//           <span className='text-center'>
					//             Next question starts in : <span className="text-base">{timeRemaining}</span> seconds
					//           </span>

					//           {/* <span className='text-center'> Next question starts in : {timeRemaining} seconds</span> */}
					//         </div>
					//       </Popup>}
					//     </Marker>
					<Marker
						position={[currentCity.location[0], currentCity.location[1]]}
						icon={greenIcon}
						ref={markerRef}>
						{!responseView && (
							<Popup
								autoClose={false}
								closeOnClick={false}
								closeButton={false}
								className="custom-popup">
								<div className="flex flex-col">
									<span className="text-center">{currentCity.city}</span>
									<div className="flex flex-col justify-center mt-3 mb-2">
										{scoreData.distance !== "NA" && (
											<span>
												Distance from your marker:{" "}
												<span className="text-[#ccf900]">
													{scoreData?.distance}
												</span>{" "}
												km
											</span>
										)}
										<span>
											Current score:{" "}
											<span className="text-[#ccf900]">
												{scoreData?.current}
											</span>
										</span>
									</div>
									<span className="text-start">
										{totalQuestions !== currentActiveIndex + 1
											? "Next question starts in"
											: "Game ends in"}{" "}
										:{" "}
										<span className="text-base text-[#ccf900]">
											{timeRemaining}
										</span>{" "}
										seconds
									</span>
								</div>
							</Popup>
						)}
					</Marker>
				)}
			</MapContainer>
			{!responseView &&
				(!showActualLocationPopup ? (
					<AppButton
						onClick={() => handleSubmitLocation(true)}
						className="w-[100px] mt-2 px-0">
						Submit
					</AppButton>
				) : (
					<AppButton
						onClick={handleGetNextQuestion}
						className="w-[120px] mt-2 px-0">
						{totalQuestions !== currentActiveIndex + 1
							? "Next Question"
							: "Proceed"}
					</AppButton>
				))}

			{showInGameNotificationPopup && (
				<InGameNotificationPopup
					type={scoreData.type}
					message={scoreData.message}
					score={scoreData}
				/>
			)}
		</div>
	);
};

export default GeoLocator;
