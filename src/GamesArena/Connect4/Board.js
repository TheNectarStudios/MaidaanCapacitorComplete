import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import starAnimation from "../../assets/animations/star-yellow.json";
import starRedAnimation from "../../assets/animations/star-red.json";

export const StarIcon = () => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z"
        fill="currentColor"
      ></path>
    </svg>
  );
};

function Board({ handleClick, gameState }) {
  const board = JSON.parse(gameState.board);
  const [clickedCircles, setClickedCircles] = useState([]);
  const [animateCircles, setAnimateCircles] = useState({});
  const [showWinningStars, setShowWinningStars] = useState([]);

  useEffect(() => {
    const cc = gameState?.clickedCircles || [];
    const ac = gameState?.animateCircles || [];
    const sws = gameState?.showWinningStars || [];
    if (ac.length) {
      setAnimateCircles(ac[ac.length - 1]);
      setTimeout(() => {
        setAnimateCircles({});
      }, 1000);
    };
    if (cc.length) {
      setTimeout(() => {
        setClickedCircles(cc);
      }, 700);
    }
    if (sws.length) {
      setTimeout(() => {
        setShowWinningStars(sws);
      }, 1000);
    }
  }, [gameState]);

  const onClick = (row, col) => {
    handleClick(col);
  };

  const createCards = () => {
    return board.map((row, index) => {
      return (
        <div key={index + "row"} className="flex">
          {row.map((col, colIndex) => {
            const isPlayerOne = col === 1;
            const isPlayerTwo = col === 2;
            const animate =
              animateCircles.row === index &&
              animateCircles.column === colIndex;
            const showWinningStar = showWinningStars.includes(
              `${index}${colIndex}`
            );
            const isClickedCircle = clickedCircles.find(
              (circle) =>
                circle.row === index && circle.column === colIndex
            );
            return (
              <motion.div
                key={index + colIndex + "col"}
                className={twMerge(
                  "h-8 w-8 bg-white rounded-full m-2 text-black flex-shrink-0 flex justify-center items-center relative",
                  isClickedCircle && isPlayerOne && "bg-red-500",
                  isClickedCircle && isPlayerTwo && "bg-primary-yellow"
                )}
                onClick={() => onClick(index, colIndex)}
              >
                <AnimatePresence>
                  {animate && (
                    <motion.div
                      initial={{ y: -300, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        duration: 0.4,
                        type: "spring",
                      }}
                      className={twMerge(
                        "rounded-full flex-shrink-0 absolute inset-0 w-full h-full",
                        isPlayerOne && "bg-red-500",
                        isPlayerTwo && "bg-primary-yellow"
                      )}
                    ></motion.div>
                  )}
                  {showWinningStar && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      transition={{ delay: 1 }}
                      className="w-full h-full flex justify-center items-center relative"
                    >
                      <Lottie
                        animationData={
                          gameState?.winner === "playerOne"
                            ? starAnimation
                            : starRedAnimation
                        }
                        loop
                        className="absolute h-full w-full top-0 z-0"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="h-fit w-full bg-[#999] rounded-lg">{createCards()}</div>
  );
}

export default Board;
