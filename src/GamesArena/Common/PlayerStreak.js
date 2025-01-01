import React from "react";
import {  useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { DAILY_LIMIT } from "../../Constants/GamesArena/MemoryCards";
import { buildStyles, CircularProgressbarWithChildren } from "react-circular-progressbar";
import ThunderIcon from "../Common/Icons/ThunderIcon";
import { daysOfWeek,calculateGameCount,validateAndFormatDate,getDateOfAllDaysFromMondayToSunday } from "../utils";

const RenderStreakInfo = ({ gameCountsForDates }) => {
    const mondayToSundayDates = getDateOfAllDaysFromMondayToSunday();
    const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");

    return (
      <div className="flex justify-between">
        {mondayToSundayDates.map((date, index) => {
          const isCurrentDayClass =
            currentDateInDDMMYYYY === date ? "scale-[0.85]" : "";
          const noGamesPlayed = gameCountsForDates[date] === 0
          const isFutureDate =
            gameCountsForDates[date] === null;

          const firstLetter = daysOfWeek[index].charAt(0);
              
          const percentage = (gameCountsForDates[date] / DAILY_LIMIT) * 100;
          const textColor = noGamesPlayed
            ? "text-[#3a411b]"
            : isFutureDate
            ? "text-[#898989]"
            : "text-[#ccf900]";
          return (
            <div className={twMerge("relative", textColor)}>
              <div
                className={twMerge(
                  "w-full h-1 bg-primary-yellow absolute top-1/2 -translate-y-[200%] z-0",
                  isFutureDate
                    ? "bg-[#5e5e5e] right-1/2"
                    : index === 0
                    ? "left-1/2"
                    : "left-0"
                )}
              />
              <div
                className={twMerge(
                  "scale-[0.6] relative z-[1]",
                  isCurrentDayClass,
                  textColor
                )}
              >
                <CircularProgressbarWithChildren
                  value={percentage}
                  background
                  styles={buildStyles({
                    trailColor: isFutureDate ? "#898989" : "#3a411b",
                    backgroundColor: isFutureDate ? "#5e5e5e" : "#262e00",
                    pathColor: "#ccf900",
                  })}
                >
                  <ThunderIcon className="w-6 h-6" />
                </CircularProgressbarWithChildren>
              </div>
              <div className="text-white text-center text-xs md:text-lg">
                {firstLetter}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

export default RenderStreakInfo;