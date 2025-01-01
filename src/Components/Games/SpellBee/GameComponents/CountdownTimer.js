import React from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { MAIN_GAME_TIMER } from "../../../../Constants/Commons";

import "./styles.css";

export function Timer(props) {
  const renderTime = ({ remainingTime }) => {
    if(props.timeRef){
      props.timeRef.current = remainingTime;
    }
    if (remainingTime === 0) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          <div
            className="timer"
            style={{ fontSize: "70px", color: "#ccf900", lineHeight: "35px" }}
          >
            -
          </div>
        </div>
      );
    }
     
    return (
      <div className="timer" style={{ color: props.color}}>
        <div className="value">{remainingTime}</div>
      </div>
    );
  };

  const [height, updateHeight] = React.useState(window.innerHeight);

  window.addEventListener("resize", () => {
    updateHeight(window.innerHeight);
  });
  const startedAt = localStorage.getItem("gameStartedAt");
  var duration;
  if (startedAt) {
    duration =
      props.duration - (Date.parse(new Date()) - Number(startedAt)) / 1000;
  } else {
    duration = props.duration;
  }
  const endTimer = () => {
    const type =
      props.duration && (props.duration === (props.mainGameTimer ?? MAIN_GAME_TIMER))
    ? "scoreCard"
    : "popup";

    props.timerEnd(type);
  };
  return (
    <div className="App">
      <div className="timer-wrapper">
        <CountdownCircleTimer
          duration={props.duration}
          initialRemainingTime={duration}
          // colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
          // colorsTime={[10, 6, 3, 0]}
          rotation="clockwise"
          size={props.size ?? 80}
          trailStrokeWidth={props.stroke}
          isPlaying={props.startTimer}
          strokeWidth={props.stroke}
          colors={props.duration === 0 ? "#7f7f7f" : "#CCF900"}
          onComplete={endTimer}
          {...props}
        >
          {renderTime}
        </CountdownCircleTimer>
      </div>
    </div>
  );
}

const Time = ({ remainingTime }, props) => {
  if (remainingTime <= 0) {
    return (
      <div
        className="timer"
        style={{
          backgroundColor: "#ccf900",
          color: "#7f7f7f",
          padding: "40px",
        }}
      >
        <div
          className=""
          style={{
            fontSize: "75px",
            width: "100px",
            height: "100px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontStyle: "italic",
            fontWeight: "600",
          }}
        >
          GO
        </div>
      </div>
    );
  }
  return (
    <div
      className="timer"
      style={{ backgroundColor: "#ccf900", color: "#7f7f7f", padding: "40px" }}
    >
      <div
        className=""
        style={{
          fontSize: "90px",
          width: "100px",
          height: "100px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontStyle: "italic",
          fontWeight: "600",
        }}
      >
        {remainingTime}
      </div>
    </div>
  );
};
export function TimerFullScreen(props) {
  return (
    <div
      className="loadingScreen"
      style={{
        position: "fixed",
        width: "100%",
        height: "100vh",
        zIndex: "99",
        backgroundColor: "#00000066",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        right: "0",
      }}
    >
      <div className="timer-wrapper">
        <CountdownCircleTimer
          isPlaying
          duration={3}
          //   colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
          //   colorsTime={[10, 6, 3, 0]}
          rotation="clockwise"
          size={130}
          trailStrokeWidth={0}
          strokeWidth={0}
          colors={"#CCF900"}
          onComplete={props.cb}
        >
          {Time}
        </CountdownCircleTimer>
      </div>
    </div>
  );
}
