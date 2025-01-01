import { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge"; // Assuming you're using twMerge for merging Tailwind CSS classes
export const InGameNotificationPopup = ({
	message,
	type,
	score,
	showTimer = true,
	PopupDuration = 7,
	isCenter = true,
}) => {
	const [countdown, setCountdown] = useState(PopupDuration);

	useEffect(() => {
		const interval = setInterval(() => {
			setCountdown((prev) => prev - 1);
		}, 1000);

		return () => clearInterval(interval); // Clear the interval on component unmount
	}, []);

	useEffect(() => {
		console.log(countdown + " seconds left");
		if (countdown <= 0) {
			clearInterval();
		}
	}, [countdown]);

	// Inject keyframes using a <style> tag
	useEffect(() => {
		const styleElement = document.createElement("style");
		styleElement.innerHTML = `
        @keyframes zoomIn {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }`;

		document.head.appendChild(styleElement);

		// Cleanup when component unmounts
		return () => {
			document.head.removeChild(styleElement);
		};
	}, []);

	if (type === "successText" || type === "failedText") {
		return (
			<div
				className={twMerge(
					"absolute top-1/2 left-1/2 flex justify-center items-center bg-[#ccf900] rounded-md w-full max-w-[345px] px-3 py-3 shadow-lg h-auot min-h-[266px] -translate-x-1/2 -translate-y-1/2 text-[#ccf900]"
				)}>
				<div
					className="text-gray-800 whitespace-pre text-2xl"
					style={{
						animation: "zoomIn 3s ease-in-out",
					}}>
					{message}
				</div>
			</div>
		);
	}

	return (
		<div
			className={`flex justify-center items-center bg-[#3a3a3a] rounded-md w-full max-w-[300px] px-3 py-3 shadow-lg ${
				isCenter
					? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[240px]"
					: "h-fit"
			}`}>
			<div className="flex flex-col gap-4 text-base font-bold text-center whitespace-pre-line">
				{isCenter && <div className="text-white">{message}</div>}
				<div className="inline-flex justify-center">
					<span className="text-white">You scored: </span>
					<span className="text-[#ccf900] ml-1">{score?.current}</span>
				</div>

				{isCenter && (
					<div className="inline-flex justify-center">
						<span className="text-white">Total round score: </span>
						<span className="text-[#ccf900] ml-1">{score?.overall}</span>
					</div>
				)}

				{showTimer ? (
					<div className="text-white mt-2">Next Puzzle In: {countdown}s</div>
				) : (
					<div className="text-white mt-2">Game Ends In: {countdown}s</div>
				)}
			</div>
		</div>
	);
};
