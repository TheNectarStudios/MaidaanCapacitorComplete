import { useCallback, useRef, useState } from "react";

const useTimer = () => {
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef(null);

    const startTimer = useCallback(
      (timeInSeconds, callback = () => {}) => {
        setIsTimerRunning(true);
        setTimer(timeInSeconds);
        timerRef.current = setInterval(() => {
          setTimer((prevTimer) => {
            if (prevTimer === 0) {
              setIsTimerRunning(false);
              clearInterval(timerRef.current);
              if (callback) {
                callback();
              }
              return prevTimer;
            }
            return prevTimer - 1;
          });
        }, 1000);
      },
      []
    );

    return {
        timer,
        isTimerRunning,
        startTimer,
    };
}

export default useTimer;