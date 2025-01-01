import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HangmanKeyboard from "./HangmanKeyboard";

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: "spring", duration: 1.5, bounce: 0 },
      opacity: { duration: 0.01 },
    },
  },
};

const HangmanSvg = ({ mistakes, winner }) => {
  const isWinner = winner && (winner !== 'Tied' || (winner === 'Tied' && mistakes < 7));
  const isLoss = mistakes === 7;
  
  const hangmanParts = [
    "rope",
    "head",
    "body",
    "leftArm",
    "rightArm",
    "leftLeg",
    "rightLeg",
  ];
  const showHangmanParts = hangmanParts.slice(0, mistakes);

  if (isWinner) {
    return (
      <AnimatePresence>
        <motion.img
          src="/Assets/Images/hangman-win.gif"
          alt="hangman-win"
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      </AnimatePresence>
    );
  }

  else if (isLoss) {
    return (
      <AnimatePresence>
        <motion.img
          src="/Assets/Images/hangman-loss.gif"
          alt="hangman-win"
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      </AnimatePresence>
    );
  }
  
  return (
    <motion.svg
      width="100%"
      height="80%"
      viewBox="0 0 228 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <AnimatePresence>
        {/* Stand */}
        <motion.line
          x1="40"
          y1="4"
          x2="183"
          y2="4"
          stroke="black"
          strokeWidth="8"
          initial={{ opacity: 1 }}
          animate={{ opacity: isWinner ? 0 : 1 }}
        />
        <motion.line
          x1="44"
          y1="7"
          x2="44"
          y2="300"
          stroke="black"
          strokeWidth="8"
          initial={{ opacity: 1 }}
          animate={{ opacity: isWinner ? 0 : 1 }}
        />
        <motion.line
          x1="228"
          y1="296"
          y2="296"
          stroke="black"
          strokeWidth="8"
          initial={{ opacity: 1 }}
          animate={{ opacity: isWinner ? 0 : 1 }}
        />
        {/* Stand */}
        {showHangmanParts.includes("rope") && !isWinner && (
          <motion.line
            x1="179"
            y1="4"
            x2="179"
            y2="42"
            stroke="black"
            strokeWidth="8"
            variants={draw}
            initial="hidden"
            animate="visible"
            key="rope"
          />
        )}
        {(showHangmanParts.includes("head") || isWinner) && (
          <motion.path
            d="M205 68.5C205 83.6878 192.688 96 177.5 96C162.312 96 150 83.6878 150 68.5C150 53.3122 162.312 41 177.5 41C192.688 41 205 53.3122 205 68.5ZM156.175 68.5C156.175 80.2774 165.723 89.8249 177.5 89.8249C189.277 89.8249 198.825 80.2774 198.825 68.5C198.825 56.7226 189.277 47.1751 177.5 47.1751C165.723 47.1751 156.175 56.7226 156.175 68.5Z"
            fill="black"
            variants={draw}
            initial="hidden"
            animate="visible"
            key="head"
          />
        )}
        {(showHangmanParts.includes("body") || isWinner) && (
          <motion.line
            x1="177"
            y1="95"
            x2="177"
            y2="176"
            stroke="black"
            strokeWidth="8"
            variants={draw}
            initial="hidden"
            animate="visible"
            key="body"
          />
        )}

        {(showHangmanParts.includes("leftArm") || isWinner) && (
          <motion.line
            x1="177.735"
            y1="107.194"
            x2="138.735"
            y2="146.194"
            stroke="black"
            strokeWidth="8"
            variants={draw}
            initial="hidden"
            animate="visible"
            key="leftArm"
          />
        )}
        {(showHangmanParts.includes("rightArm") || isWinner) && (
          <motion.line
            x1="177.897"
            y1="107.242"
            x2="215.927"
            y2="147.189"
            stroke="black"
            strokeWidth="8"
            variants={draw}
            initial="hidden"
            animate="visible"
            key="rightArm"
          />
        )}
        {(showHangmanParts.includes("leftLeg") || isWinner) && (
          <motion.line
            x1="176.847"
            y1="171.27"
            x2="129.294"
            y2="240.27"
            stroke="black"
            strokeWidth="8"
            variants={draw}
            initial="hidden"
            animate="visible"
            key="leftLeg"
          />
        )}
        {(showHangmanParts.includes("rightLeg") || isWinner) && (
          <motion.line
            x1="177.348"
            y1="169.812"
            x2="223.194"
            y2="239.958"
            stroke="black"
            strokeWidth="8"
            variants={draw}
            initial="hidden"
            animate="visible"
            key="rightLeg"
          />
        )}
      </AnimatePresence>
    </motion.svg>
  );
};

function Board({ handleClick, gameState, showAnswer }) {

  const { word, hint, keyboard, mistakes, guessedLetters, winner } = gameState ?? {};
  const keyboardState = useMemo(() => {
    return JSON.parse(keyboard);
  }, [keyboard]);

  const onClick = (input, row) => {
    handleClick(input, row);
  };

   const renderHangman = () => {
     return (
        <HangmanSvg mistakes={mistakes} winner={winner} />
     );
   };


  return (
    <div className="flex justify-between items-center flex-col h-[80%] w-full">
      <div className="h-full w-full flex justify-center items-center flex-col gap-[5%]">
        <div className="bg-white w-[200px] h-[250px] grid place-items-center">
          {renderHangman()}
        </div >
        <div className="flex">
        <div>Hint</div>
        <div className="px-3">-</div>
        <div>{hint}</div>
        </div>
        <div className="w-full px-3">
          <div className="w-full text-center border-2 border-[#d9d9d9] rounded-2xl p-4 filter drop-shadow-[0px_4px_4px_rgba(0,0,0,0.25)] bg-white text-black">
            {word.split("").map((letter, index) => (
              <span key={index} className="inline-block mx-1 font-bold uppercase">
                {showAnswer ? letter : guessedLetters.includes(letter) ? letter : "_"} 
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full fixed bottom-0">
        <HangmanKeyboard onClick={onClick} keyboardState={keyboardState} />
      </div>
    </div>
  );
}

export default Board;
