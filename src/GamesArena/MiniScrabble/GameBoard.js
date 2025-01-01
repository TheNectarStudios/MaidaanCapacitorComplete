import { useEffect, useState } from "react";
import { TouchBackend } from "react-dnd-touch-backend";
import { DndProvider } from "react-dnd";
import DraggableLetter from "./DraggableLetter";
import DragToBox from "./DragToBox";
import { usePreview } from "react-dnd-preview";
import AppButton from "../../Components/Common/AppButton";
import { ROUND_INFO } from "../../Constants/GamesArena/MiniScrabble";
import { AnimatePresence, motion } from "framer-motion";
import Loader from "../../Components/PageComponents/Loader";

const MyPreview = () => {
  const preview = usePreview();
  if (!preview.display) {
    return null;
  }
  const { item, style } = preview;
  return (
    <div
      className="flex bg-primary-yellow rounded-2xl text-black relative h-[70px] w-[70px] text-[32px] font-medium justify-center items-center uppercase"
      style={style}
    >
      {item.letter}
      <div className="absolute top-1 right-2 text-[18px]">{item.score}</div>
    </div>
  );
};

const MiniScrabbleGameBoard = ({ gameState, myPlayerId, otherPlayerId, updateGameState, showWaitScreen, setShowWaitScreen, setPauseTimer }) => {
    const [filledLetters, setFilledLetters] = useState([]);
    const [submittingAnswer, setSubmittingAnswer] = useState(false);
    const [checkingAnswer, setCheckingAnswer] = useState(false);
    const [isAnsValid, setIsAnsValid] = useState(false);
    const [localScore, setLocalScore] = useState(0);
    const [localAnswer, setLocalAnswer] = useState("");
    const [proceeding, setProceeding] = useState(false);
    const [localActiveRound, setLocalActiveRound] = useState(1);
    const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (gameState?.activeRound !== localActiveRound && gameState?.activeRound < 5) {
      setFilledLetters(
        Array.from({ length: ROUND_INFO[gameState.activeRound - 1].length }).fill({ letter: 0, score: 0 })
      );
      setLocalActiveRound(gameState.activeRound);
      setShowWaitScreen(false);
    }
    if (gameState?.[myPlayerId].proceedToNextRound) {
      setProceeding(false);
    }
    if (!filledLetters.length) {
        setFilledLetters(
          Array.from({ length: ROUND_INFO[gameState.activeRound - 1].length }).fill({ letter: 0, score: 0 })
        );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    // check if localAnswer is not equal to filledLetters and if not, reset the isAnsValid state
    if (localAnswer !== filledLetters.map(({ letter }) => letter).join("")) {
      setIsAnsValid(false);
      setLocalAnswer("");
      setShowImage(false);
      checkWord();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledLetters]);

  useEffect(() => {
    if (showImage) {
      setTimeout(() => {
        setShowImage(false);
      }, 2000);
    }
  }, [showImage]);

  useEffect(() => {
    const img1 = new Image();
    img1.src = "/Assets/Icons/tick-green-icon.svg";
    const img2 = new Image();
    img2.src = "/Assets/Icons/cross-icon.svg";
  }, []);

  const handleDrop = (dropResult) => {
    if (dropResult) {
      const { letter, score, index, clickedIndex } = dropResult;
      const newFilledLetters = [...filledLetters];
      newFilledLetters[index] = { letter, score, clickedIndex };
      setFilledLetters(newFilledLetters);
    }
  };

  const addLetterByClicking = (letter, score, clickedIndex) => {
    const emptyIndex = filledLetters.findIndex(({ letter }) => letter === 0);
    if (emptyIndex !== -1) {
      const newFilledLetters = [...filledLetters];
      newFilledLetters[emptyIndex] = { letter, score, clickedIndex };
      setFilledLetters(newFilledLetters);
    }
  }

  const checkWord = async () => {
    if (filledLetters.some(({ letter }) => letter === 0)) {
      return;
    }
    setCheckingAnswer(true);
    setPauseTimer(true);
    const answer = filledLetters.map(({ letter }) => letter).join("");
    const resp = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${answer}`
    );
    let score = 0;
    if (resp.ok) {
      score = filledLetters.reduce((acc, { score }) => acc + score, 0);
    }
    setLocalAnswer(answer);
    setIsAnsValid(resp.ok);
    setLocalScore(score);
    setCheckingAnswer(false);
    setPauseTimer(false);
    setShowImage(true);
  };

  const submitAnswer = async () => {

    if (!isAnsValid || !localAnswer) {
      return;
    }

    let dataToUpdate = {
        activeSound: null,
        [myPlayerId]: {
            ...gameState[myPlayerId],
            score: gameState[myPlayerId].score + localScore,
            scorePerRound: [...gameState[myPlayerId].scorePerRound, localScore],
            words: [
              ...gameState[myPlayerId].words,
              { word: localAnswer, isValid: isAnsValid },
            ],
            proceedToNextRound: gameState?.activeRound === 4 ? true : !gameState?.[otherPlayerId].proceedToNextRound,
        },
    };
    updateGameState(dataToUpdate, true);
    setSubmittingAnswer(false);
    setShowWaitScreen(true);
  };

  const proceedToNextRound = () => {
    setProceeding(true);
    setShowWaitScreen(false);
    updateGameState(
      {
        [myPlayerId]: {
          ...gameState[myPlayerId],
          proceedToNextRound: true,
        },
      },
      true
    );
    // setProceeding(false);
  };

  const removeLetter = (idx) => {
    const newFilledLetters = [...filledLetters];
    newFilledLetters[idx] = { letter: 0, score: 0 };
    setFilledLetters(newFilledLetters);
  };

  const handleBackspaceClick = () => {
    if (filledLetters.every(({ letter }) => letter === 0)) return;
    const newFilledLetters = [...filledLetters].reverse();
    const idx = newFilledLetters.findIndex(({ letter }) => letter !== 0);
    if (idx !== -1) {
      newFilledLetters[idx] = { letter: 0, score: 0, clickedIndex: -1 };
    }
    setFilledLetters(newFilledLetters.reverse());
  };

  const renderKeysSection = () => {
    return (
      <div className="grid place-items-center">
        <div className="flex flex-wrap gap-x-3 gap-y-[18px] w-full justify-center max-w-[390px]">
          {gameState?.letters?.map(({ letter, score }, index) => {
            return (
              <DraggableLetter
                letter={letter}
                score={score}
                handleDrop={handleDrop}
                handleAddLetter={addLetterByClicking}
                filledLetters={filledLetters}
                clickedIndex={index}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderBlanksSection = () => {
    return (
      <div className="flex w-full justify-center gap-3">
        {filledLetters.map((item, index) => {
          const { letter, score } = item;
          return <DragToBox value={letter} score={score} index={index} handleRemoveLetter={removeLetter} />;
        })}
      </div>
    );
  };

  const scoreVariants = {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 2.5, 2.5, 2.5, 1],
      rotate: [0, 10, -10, 10, -10, 0],
      transition: { times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    },
  };

  return (
    <DndProvider backend={TouchBackend}>
      <div className="h-full w-full bg-primary-gray-20 space-y-5 flex flex-col justify-around">
        {showWaitScreen ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full bg-primary-gray-20 flex items-center justify-center"
            >
              <div className="grid grid-cols-2 w-full gap-y-11 text-center">
                {gameState?.[myPlayerId].words[gameState?.activeRound - 1]
                  ?.isValid ||
                gameState?.[otherPlayerId].words[gameState?.activeRound - 1]
                  ?.isValid ? (
                  <></>
                ) : (
                  <div className="col-span-2 text-2xl">
                    Possible word:{" "}
                    <span className="font-bold text-primary-yellow">
                      {gameState?.activeRound === 1
                        ? gameState?.foundWords?.two?.word
                        : gameState.activeRound === 2
                        ? gameState?.foundWords?.three?.word
                        : gameState.activeRound === 3
                        ? gameState?.foundWords?.four?.word
                        : gameState?.foundWords?.five?.word}
                    </span>
                  </div>
                )}
                <div className="flex flex-col justify-center items-start pl-9">
                  <div className="text-left">
                    <div className="text-primary-yellow font-bold text-xl mb-2">
                      You
                    </div>
                    <div className="font-bold text-2xl">
                      {
                        gameState?.[myPlayerId].words[
                          gameState?.activeRound - 1
                        ]?.word
                      }
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end items-center">
                  <div className="font-bold text-3xl">
                    {
                      gameState?.[myPlayerId].scorePerRound[
                        gameState?.activeRound - 1
                      ]
                    }
                  </div>
                </div>
                <div className="flex flex-col justify-center items-start pl-9">
                  <div className="text-left">
                    <div className="text-primary-yellow font-bold text-xl mb-2">
                      {gameState?.[otherPlayerId].name}
                    </div>
                    <div className="font-bold text-2xl">
                      {gameState?.[otherPlayerId].words[
                        gameState?.activeRound - 1
                      ]?.word ?? (
                        <span className="text-lg text-left">
                          Waiting...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end items-center">
                  <div className="font-bold text-3xl">
                    {gameState?.[otherPlayerId].scorePerRound[
                      gameState?.activeRound - 1
                    ] ?? 0}
                  </div>
                </div>
                <div className="col-span-2">
                  {gameState?.activeRound === 4 &&
                  gameState?.[myPlayerId].proceedToNextRound &&
                  gameState?.[otherPlayerId].proceedToNextRound ? (
                    <>Final score</>
                  ) : gameState?.[otherPlayerId].proceedToNextRound ? (
                    <AppButton
                      className="w-[140px]"
                      onClick={proceedToNextRound}
                      isLoading={proceeding}
                      disabled={proceeding}
                    >
                      Proceed
                    </AppButton>
                  ) : (
                    `Waiting for ${gameState[otherPlayerId].name}...`
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <>
            <div className="grid place-items-center gap-6 mx-2">
              {renderBlanksSection()}
              <div className="text-primary-yellow font-bold gap-10 grid grid-cols-3">
                <div className="text-center">
                  <span>You</span>
                  <div className="text-white text-xl">
                    {localAnswer
                      ? localScore
                      : gameState?.[myPlayerId].scorePerRound[
                          gameState?.activeRound - 1
                        ] ?? 0}
                  </div>
                </div>
                <div className="grid place-items-center">
                  {checkingAnswer ? <Loader /> : <></>}
                  <AnimatePresence>
                    {localAnswer ? (
                      showImage ? (
                        isAnsValid ? (
                          <motion.img
                            key="check-image"
                            alt="tick"
                            src="/Assets/Icons/tick-green-icon.svg"
                            className="w-7 h-7"
                            initial={{ scale: 0.3, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.3, opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                            }}
                          />
                        ) : (
                          <motion.img
                            key="cross-image"
                            alt="cross"
                            src="/Assets/Icons/cross-icon.svg"
                            className="w-7 h-7"
                            initial={{ scale: 0.3, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.3, opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                            }}
                          />
                        )
                      ) : (
                        <></>
                      )
                    ) : (
                      <></>
                    )}
                  </AnimatePresence>
                </div>
                <div className="text-center">
                  <span>{gameState?.[otherPlayerId].name}</span>
                  <div className="text-white text-xl">
                    <AnimatePresence>
                      {gameState?.[otherPlayerId].scorePerRound[
                        gameState?.activeRound - 1
                      ] > 0 ? (
                        <motion.div
                          key={
                            gameState?.[otherPlayerId].scorePerRound[
                              gameState?.activeRound - 1
                            ]
                          }
                          initial="initial"
                          animate="animate"
                          variants={scoreVariants}
                        >
                          {gameState?.[otherPlayerId].scorePerRound[
                            gameState?.activeRound - 1
                          ] ?? 0}
                        </motion.div>
                      ) : (
                        <>0</>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid place-items-center gap-10">
              <div className="flex items-center justify-center gap-4 relative w-full">
                <motion.div
                  animate={{
                    scale:
                      (submittingAnswer ||
                      !localAnswer ||
                      !isAnsValid) ? [1, 1, 1] : [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0.3,
                  }}
                >
                  <AppButton
                    className="w-[140px]"
                    onClick={submitAnswer}
                    isLoading={submittingAnswer}
                    disabled={submittingAnswer || !localAnswer || !isAnsValid}
                  >
                    Submit
                  </AppButton>
                </motion.div>
                <div className="absolute right-4">
                  <AppButton
                    className="w-[58px] h-9 bg-transparent border-2 border-solid border-primary-yellow text-primary-yellow font-bold rounded-lg text-xl p-0"
                    onClick={handleBackspaceClick}
                  >
                    ⌫
                  </AppButton>
                </div>
              </div>
              {renderKeysSection()}
            </div>
          </>
        )}
      </div>
      <MyPreview />
    </DndProvider>
  );
};

export default MiniScrabbleGameBoard;
