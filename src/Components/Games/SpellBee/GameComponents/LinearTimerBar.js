import React, { useEffect, useState } from 'react';

const LinearTimerBar = ({ totalDuration, timeLeft, startTimer = true, isSelfTimer = false, reset = false, timerEnd = () => {} , timeRef, customHeight = '' }) => {
  const [percentage, setPercentage] = useState(100);
  const timerIntervalRef = React.useRef(null);

  useEffect(() => {
    if (totalDuration > 0 && startTimer) {
      if (isSelfTimer) {
        const decrement = 100 / totalDuration; // Calculate the percentage decrement
        timerIntervalRef.current = setInterval(() => {
          setPercentage((prev) => {
            if (prev <= 0) {
              clearInterval(timerIntervalRef.current);
              return 0;
            }
            return prev - decrement;
          });
        }, 1000);
      } else {
        setPercentage((timeLeft / totalDuration) * 100);    
      }
    }
    return () => {
      clearInterval(timerIntervalRef.current);
    }
  }, [totalDuration, timeLeft, startTimer, isSelfTimer]);

  useEffect(() => {
    if (reset) {
      setPercentage(100);
    }
  } , [reset]);

  useEffect(() => {
    if (percentage <= 0) {
      timerEnd();
    }
    if(timeRef){
      timeRef.current = percentage;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage]);

  return (
    <div className={`relative w-full bg-gray-300 ${customHeight ? customHeight :'h-3'} rounded-lg overflow-hidden`}>
      <div
        className="absolute top-0 left-0 h-full"
        style={{
          width: `${percentage}%`,
          backgroundColor: '#ccf900',
          transition: 'width 1s linear',
        }}
      ></div>
    </div>
  );
};

export default LinearTimerBar;
