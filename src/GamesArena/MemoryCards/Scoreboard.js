import React from "react";

function Scoreboard(props) {
  const formatTime = (seconds) => {
    let mins = Math.floor(seconds / 60);
    seconds %= 60;

    if (mins < 10) {
      mins = `0${mins}`;
    }

    if (seconds < 10) {
      seconds = `0${seconds}`;
    }

    return `${mins}:${seconds}`;
  };

  return (
    <div className="scoreboard">
      <p>
        {props.pairsFound}/{props.numPairs} Pairs Found
      </p>
      <p>Current time: {props.time ? formatTime(props.time) : "00:00"}</p>
      <p>
        Best time:{" "}
        {isFinite(props.bestTime) ? formatTime(props.bestTime) : "N/A"}
      </p>
    </div>
  );
}

export default Scoreboard;
