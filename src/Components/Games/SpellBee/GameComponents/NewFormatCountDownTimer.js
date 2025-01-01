import React from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { MAIN_GAME_TIMER, TRIAL_GAME_STRING } from "../../../../Constants/Commons";

import "./styles.css";
import LinearTimerBar from "./LinearTimerBar";

export function NewFormatTimer(props) {
  const { showPopupMessage, setShowPopupMessage, currentGameMode} = props;
  const [height, updateHeight] = React.useState(window.innerHeight);
  const [durationLeft, setDurationLeft] = React.useState(props.duration);
  const [seconds, setSeconds] = React.useState(props.duration);

  const timerArayMemoryCards = [ 60, 30 , 10];

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
    const type = currentGameMode === TRIAL_GAME_STRING ? "popup" : "scoreCard";
      const endType = "timeup";
    props.timerEnd(type, endType);
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      let duration = seconds
      if(startedAt){
        duration = props.duration - (Date.parse(new Date()) - Number(startedAt)) / 1000;
      }
      else{
        duration = seconds - 1;
      }

      setSeconds(duration);
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, []);


  React.useEffect(() => {

  if(duration <= 0){
    endTimer();
  }

  if(props?.timeRef){
    props.timeRef.current = duration;
  }  

  if (timerArayMemoryCards.includes(duration) && setShowPopupMessage) {
    setShowPopupMessage({
      show: true,
      message: `Time left: ${duration}`
    });

    setTimeout(() => {
      setShowPopupMessage({ show: false, message: "" });
    }, 2000);
  }
}
, [duration]);


  return (
    <div className="timer-container w-full">
      <div className="text-[14px]">
        Time left:
      </div>
      <div>
        <LinearTimerBar totalDuration={props.duration} timeLeft={duration} />
      </div>
    </div>
  );

}