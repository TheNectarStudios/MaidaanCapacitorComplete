import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ReactComponent as RobotSvg } from "../../../../../assets/codingGame/robot.svg";
import { ReactComponent as DeleteSvg } from "../../../../../assets/codingGame/delete.svg";
import ConditionButton from "./ConditionButton";
import AppButton from "../../../../../Components/Common/AppButton";
import DarkModal from "../../../../Common/DarkModal";
import { twMerge } from "tailwind-merge";
import { NewFormatTimer } from "../NewFormatCountDownTimer";
import LinearTimerBar from "../LinearTimerBar";

const MAX_ALGO_MOVES_ALLOWED = 8;
const ATTEMPTS_ALLOWED = 3;

const CodingGameContainer = ({
  currentActiveQuestion,
  submitGame,
  updateGameState,
  gameState,
  isTrialGame,
}) => {
  const [grid, setGrid] = useState(new Array(3).fill(new Array(4).fill(0)));
  const [positionOfPlayer, setPositionOfPlayer] = useState([]);
  const [algoMoves, setAlgoMoves] = useState([]);
  const [currentDirection, setCurrentDirection] = useState("");
  const [obstaclePosition, setObstaclePosition] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [numberOfAttempts, setNumberOfAttempts] = useState(0);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showConditionsModal, setShowConditionsModal] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState({});
  const [startTimer, setStartTimer] = useState(false);
  const [currentMove, setCurrentMove] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(ATTEMPTS_ALLOWED);
  const [errorSubHeader, setErrorSubHeader] = useState("Try again");
  const [localCheckConditions, setLocalCheckConditions] = useState({});

  const algoIntervalRef = useRef();
  const positionOfPlayerRef = useRef();
  const newAlgoMovesRef = useRef([]);
  const currentQuestionScoreRef = useRef(0);
  const scoreUpdatesRef = useRef({});

  const {
    checks,
    ifConditions,
    question: questionString,
    targetPosition,
    thenConditions,
    canRepeat,
    showOnUI,
    idealFunctions,
  } = currentActiveQuestion ?? {};

  const functionsUsed = useMemo(() => {
    // if (algoMoves.length > idealFunctions) {
    //   return `+${algoMoves.length - idealFunctions}`;
    // }
    // return '-';
    return algoMoves.length;
  }, [algoMoves]);

  useEffect(() => {
    if (currentActiveQuestion) {
      setPositionOfPlayer(currentActiveQuestion.startPosition);
      positionOfPlayerRef.current = currentActiveQuestion.startPosition;
      setObstaclePosition(
        Object.values(currentActiveQuestion.obstaclePosition ?? {})
      );
      setNumberOfAttempts(0);
      setNotificationMessage({});
      setShowNotificationPopup(false);
      setShowQuestionModal(true);
      setStartTimer(false);
      setAttemptsLeft(ATTEMPTS_ALLOWED);
      setErrorSubHeader("Try again");
    }
  }, [currentActiveQuestion]);

  useEffect(() => {
    if (showNotificationPopup) {
      setTimeout(() => {
        setShowNotificationPopup(false);
      }, 2000);
    }
  }, [showNotificationPopup]);

  const resetGame = () => {
    setTimeout(() => {
      setAlgoMoves([]);
      newAlgoMovesRef.current = [];
      setPositionOfPlayer(currentActiveQuestion.startPosition);
      positionOfPlayerRef.current = currentActiveQuestion.startPosition;
    }, 2000);
    setIsRunning(false);
    setCurrentDirection("");
    clearInterval(algoIntervalRef.current);
  };

  const handleNotificationPopup = (data) => {
    setTimeout(() => {
      setNotificationMessage(data);
      setShowNotificationPopup(true);
    }, 500);
  };

  const showProblemSolvedPopup = () => {
    let message = "Problem Solved";
    if (!isTrialGame) {
      message = `Problem Solved\nYou scored ${currentQuestionScoreRef.current} / 10`;
    }
    handleNotificationPopup({
      message,
      type: "success",
    });
  };

  useEffect(() => {
    if (positionOfPlayer.length) {
      const isObstacleHit =
        obstaclePosition.findIndex((obstacle) => {
          return (
            obstacle[0] === positionOfPlayer[0] &&
            obstacle[1] === positionOfPlayer[1]
          );
        }) !== -1;
      if (isObstacleHit) {
        handleNotificationPopup({
          message: "You hit an obstacle\n" + errorSubHeader,
        });
        // setNotificationMessage();
        // setShowNotificationPopup(true);
        resetGame();
        return;
      }
      const isTargetReached =
        targetPosition[0] === positionOfPlayer[0] &&
        targetPosition[1] === positionOfPlayer[1];
      const isNextMoveAvailable = newAlgoMovesRef.current[currentMove + 1];
      if (isTargetReached) {
        if (isNextMoveAvailable) {
          setTimeout(() => {
            handleNotificationPopup({
              message: "You missed the target\n" + errorSubHeader,
            });
          }, 2000);
        } else {
        const targetPosString = `${targetPosition[0]}${targetPosition[1]}`;
        const winCondition = checks[targetPosString];
        if (winCondition) {
          const isConditionMet =
            algoMoves.findIndex((move) => {
              return (
                move.move === "check" &&
                move.if === winCondition.if &&
                move.then === winCondition.then
              );
            }) !== -1;
          if (isConditionMet) {
            calculateScoreAndUpdateState(true);
            showProblemSolvedPopup();
            setTimeout(() => {
              submitGame(scoreUpdatesRef.current);
            }, 3000);
          } else {
            handleNotificationPopup({
              message: "You missed a check\n" + errorSubHeader,
            });
            // setShowNotificationPopup(true);
          }
        } else {
          calculateScoreAndUpdateState(true);
          showProblemSolvedPopup();
          setTimeout(() => {
            submitGame(scoreUpdatesRef.current);
          }, 3000);
          // setShowNotificationPopup(true);
        }
        resetGame();
        return;
      }
      } else {
        const isLastMove = newAlgoMovesRef.current.length === currentMove + 1;
        if (isLastMove) {
          handleNotificationPopup({
            message: "You missed the target\n" + errorSubHeader,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionOfPlayer]);

  const buildAlgo = (move, data = null) => {
    if (move === "repeat") {
      const newMoves = [...algoMoves];
      const lastMove = newMoves[newMoves.length - 1];
      if (newMoves.length === 0 || newMoves.length === MAX_ALGO_MOVES_ALLOWED) {
        handleNotificationPopup({
          message: "Select one move to repeat",
        });
        // setShowNotificationPopup(true);
        return;
      }
      if (lastMove.move === 'check') {
        handleNotificationPopup({
          message: "Cannot add repeat to a condition",
        });
        return;
      }
      newMoves[newMoves.length - 1] = {
        ...lastMove,
        repeat: true,
        times: 1,
      };
      setAlgoMoves(newMoves);
      return;
    }
    const isCheck =
      algoMoves.length > 0 && algoMoves[algoMoves.length - 1]?.move === "check";
    const isCheckConditionMet =
      algoMoves[algoMoves.length - 1]?.if &&
      algoMoves[algoMoves.length - 1]?.then;
    if (isCheck && !isCheckConditionMet) {
      return;
    }
    if (algoMoves.length === MAX_ALGO_MOVES_ALLOWED) return;
    setAlgoMoves((prevMoves) => {
      let finalData = { move };
      if (data) {
        finalData = { ...finalData, ...data };
      }
      return [...prevMoves, finalData];
    });
  };

  const movePlayerRight = () => {
    positionOfPlayerRef.current = [
      positionOfPlayer[0],
      positionOfPlayer[1] + 1,
    ];
    setPositionOfPlayer((prevPosition) => {
      const newPosition = [...prevPosition];
      if (newPosition[1] < 3) {
        newPosition[1] = newPosition[1] + 1;
      } else {
        handleNotificationPopup({
          message: "You hit a wall!\n" + errorSubHeader,
        });
        // setShowNotificationPopup(true);
        resetGame();
      }
      return newPosition;
    });
  };

  const movePlayerUp = () => {
    positionOfPlayerRef.current = [
      positionOfPlayer[0] - 1,
      positionOfPlayer[1],
    ];
    setPositionOfPlayer((prevPosition) => {
      const newPosition = [...prevPosition];
      if (newPosition[0] > 0) {
        newPosition[0] = newPosition[0] - 1;
      } else {
        handleNotificationPopup({
          message: "You hit a wall!\n" + errorSubHeader,
        });
        // setShowNotificationPopup(true);
        resetGame();
      }
      return newPosition;
    });
  };

  const movePlayerDown = () => {
    positionOfPlayerRef.current = [
      positionOfPlayer[0] + 1,
      positionOfPlayer[1],
    ];
    setPositionOfPlayer((prevPosition) => {
      const newPosition = [...prevPosition];
      if (newPosition[0] < 2) {
        newPosition[0] = newPosition[0] + 1;
        // positionOfPlayerRef.current = newPosition;
      } else {
        handleNotificationPopup({
          message: "You hit a wall!\n" + errorSubHeader,
        });
        // setShowNotificationPopup(true);
        resetGame();
      }
      return newPosition;
    });
  };
  const movePlayerLeft = () => {
    positionOfPlayerRef.current = [
      positionOfPlayer[0],
      positionOfPlayer[1] - 1,
    ];
    setPositionOfPlayer((prevPosition) => {
      const newPosition = [...prevPosition];
      if (newPosition[1] > 0) {
        newPosition[1] = newPosition[1] - 1;
        // positionOfPlayerRef.current = newPosition;
      } else {
        handleNotificationPopup({
          message: "You hit a wall!\n" + errorSubHeader,
        });
        // setShowNotificationPopup(true);
        resetGame();
      }
      return newPosition;
    });
  };

  const populateIfCondition = (type, value) => {
    if (
      algoMoves.length === 0 ||
      algoMoves[algoMoves.length - 1].move !== "check" ||
      algoMoves.length === MAX_ALGO_MOVES_ALLOWED
    ) {
      return;
    }
    setAlgoMoves((prevMoves) => {
      const newMoves = [...prevMoves];
      newMoves[newMoves.length - 1] = {
        ...newMoves[newMoves.length - 1],
        [type]: value,
      };
      return newMoves;
    });
  };

  const checkIfCondition = (move) => {
    const { if: ifCondition, then } = move;
    if (ifCondition && then) {
      const posOfPlayer = positionOfPlayerRef.current;
      const condition = checks[`${posOfPlayer[0]}${posOfPlayer[1]}`];
      const isConditionMet =
        condition?.if === ifCondition && condition?.then === then;
      if (isConditionMet) {
        return true;
      } else {
        handleNotificationPopup({
          message: "You missed a check\n" + errorSubHeader,
        });
        // setShowNotificationPopup(true);
        return false;
      }
    }
  };

  useEffect(() => {
    const { move } = newAlgoMovesRef.current[currentMove] ?? {};
    const { move: nextMove } = newAlgoMovesRef.current[currentMove + 1] ?? {};
    if (move !== "check" && nextMove !== "check") {
      checkIfCheckExistsAtPosition(move, positionOfPlayer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionOfPlayer, currentMove]);

  useEffect(() => {
    if (attemptsLeft === 0) {
      setErrorSubHeader("No more attempts");
      setTimeout(() => {
        calculateScoreAndUpdateState();
        submitGame(scoreUpdatesRef.current);
      }, algoMoves.length * 1000 + 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptsLeft]);

  useEffect(() => {
    if (showConditionsModal) {
      setLocalCheckConditions({});
    }
  }, [showConditionsModal]);

  const checkIfCheckExistsAtPosition = (move, posOfPlayer) => {
    // const posOfPlayer = positionOfPlayerRef.current;
    const doesCheckExist = checks[`${posOfPlayer[0]}${posOfPlayer[1]}`];
    if (doesCheckExist) {
      handleNotificationPopup({
        message: "You missed a check\n" + errorSubHeader,
      });
      // setShowNotificationPopup(true);
      resetGame();
      return;
    }
  };

  const runAlgo = () => {
    if (isDisabled() || attemptsLeft === 0) return;
    setIsRunning(true);
    if (!isTrialGame) {
      updateGameState({
        currentActiveQuestion: currentActiveQuestion.problemNumber,
        playerOne: {
          ...gameState.playerOne,
          algoAttempts: {
            ...gameState.playerOne.algoAttempts,
            [currentActiveQuestion.problemNumber]: [
              ...(gameState.playerOne.algoAttempts[
                currentActiveQuestion.problemNumber
              ] ?? []),
              {
                moves: algoMoves,
                attempt: numberOfAttempts + 1,
              },
            ],
          },
        },
      });
    }
    setNumberOfAttempts((prev) => prev + 1);
    setAttemptsLeft((prev) => prev - 1);
    let i = 0;

    const newAlgoMoves = [];
    algoMoves.forEach((move) => {
      if (move.repeat) {
        for (let j = 0; j < move.times; j++) {
          const newMove = { ...move };
          delete newMove.repeat;
          delete newMove.times;
          newAlgoMoves.push(newMove);
        }
      } else {
        newAlgoMoves.push(move);
      }
    });
    newAlgoMovesRef.current = newAlgoMoves;

    algoIntervalRef.current = setInterval(() => {
      if (i === newAlgoMoves.length) {
        resetGame();
        return;
      }
      const { move } = newAlgoMoves[i];

      if (move === "right") {
        setCurrentDirection("right");
        // for (let j = 0; j < numberOfTimes; j++) {
        movePlayerRight();
        // }
      } else if (move === "up") {
        setCurrentDirection("up");
        // for (let j = 0; j < numberOfTimes; j++) {
        movePlayerUp();
        // }
      } else if (move === "down") {
        setCurrentDirection("down");
        // for (let j = 0; j < numberOfTimes; j++) {
        movePlayerDown();
        // }
      } else if (move === "left") {
        setCurrentDirection("left");
        // for (let j = 0; j < numberOfTimes; j++) {
        movePlayerLeft();
        // }
      } else if (move === "check") {
        const conditionMet = checkIfCondition(newAlgoMoves[i]);
        if (!conditionMet) {
          resetGame();
          return;
        }
      }
      setCurrentMove(i);
      // if (nextMove !== "check") {
      //   checkIfCheckExistsAtPosition(move);
      // };
      // checkIfCheckExistsAtPosition(move);
      i++;
    }, 1000);
  };

  const isDisabled = () => {
    // return false;
    if (isRunning) {
      return true;
    }
    const isCheck = algoMoves[algoMoves.length - 1]?.move === "check";
    const isCheckConditionMet =
      algoMoves[algoMoves.length - 1]?.if &&
      algoMoves[algoMoves.length - 1]?.then;

    return algoMoves.length === 0 || isCheck ? !isCheckConditionMet : false;
  };

  const deleteAlgoStep = (index) => {
    if (isRunning) return;
    setAlgoMoves((prevMoves) => {
      const newMoves = [...prevMoves];
      newMoves.splice(index, 1);
      return newMoves;
    });
  };

  const openProblemModal = () => {
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    if (!startTimer) {
      setStartTimer(true);
    }
    setShowQuestionModal(false);
  };

  const updateRepetitionsValue = (value, index) => {
    setAlgoMoves((prevMoves) => {
      const newMoves = [...prevMoves];
      newMoves[index] = {
        ...newMoves[index],
        times: value,
      };
      return newMoves;
    });
  };

  const handleTimerEnd = () => {
    if (Object.values(gameState.scoreBreakdown).length === currentActiveQuestion.problemNumber) {
      return;
    }
    handleNotificationPopup({
      message: "Time over!",
    });
    setTimeout(() => {
      calculateScoreAndUpdateState();
      submitGame(scoreUpdatesRef.current);
    }, 2000);
  };

  const calculateScoreAndUpdateState = (isProblemSolved = false) => {
    if (isTrialGame) {
      return;
    }
    let score = 1;
    let attemptsBonus = 0;
    let idealStepsBonus = 0
    if (isProblemSolved) {
      // calculate score based on attempts
      if (numberOfAttempts === 1) {
        score += 4;
        attemptsBonus = 4;
      } else if (numberOfAttempts === 2) {
        score += 2;
        attemptsBonus = 2;
      } else {
        score += 1;
        attemptsBonus = 1;
      }

      // calculate score based on functions used
      if (functionsUsed <= idealFunctions) {
        score += 5;
        idealStepsBonus = 5;
      } else if (functionsUsed - idealFunctions === 1) {
        score += 3;
        idealStepsBonus = 3;
      } else if (functionsUsed - idealFunctions === 2) {
        score += 2;
        idealStepsBonus = 2;
      } else if (functionsUsed - idealFunctions > 2) {
        score += 1;
        idealStepsBonus = 1;
      }
    }

    currentQuestionScoreRef.current = score;

    const dataToUpdate = {
      score: gameState.score + score,
      attempts: gameState.attempts + 1,
      correctAttempts: isProblemSolved ? gameState.correctAttempts + 1 : gameState.correctAttempts,
      scoreBreakdown: {
        ...(gameState.scoreBreakdown ?? {}),
        [currentActiveQuestion.problemNumber]: {
          score,
          attempts: numberOfAttempts,
          functionsUsed,
          idealFunctions,
          attemptsBonus,
          idealStepsBonus,
        },
      }
    }
    scoreUpdatesRef.current = dataToUpdate;
    updateGameState(dataToUpdate);
  };

  const renderQuestionModal = () => {
    return (
      <DarkModal isOpen={showQuestionModal}>
        <div className="flex justify-center items-center flex-col">
          <div className="text-xl mb-4">
            Problem {currentActiveQuestion.problemNumber}
          </div>
          {questionString?.[0] ? <div>{questionString[0]}</div> : <></>}
          <ul className="list-disc mb-6 pl-0">
            {questionString?.slice(1).map((question, index) => {
              return <li>{question}</li>;
            })}
          </ul>
          <AppButton onClick={closeQuestionModal}>Got It</AppButton>
        </div>
      </DarkModal>
    );
  };
  const renderIfConditionsModal = () => {
    return (
      <DarkModal
        isOpen={showConditionsModal}
        onClose={() => setShowConditionsModal(false)}
      >
        <div className="flex justify--center items--center flex-col gap-4 px-4 text-center w-full">
          <div className="text-xl">ADD CONDITION</div>
          <div className="flex w-full">
            <div className="w-1/2 flex flex-col gap-2 items-center">
              <span className="text-primary-yellow">IF</span>
              {ifConditions?.map((condition) => (
                <span
                  className="bg-primary-yellow text-primary-gray-20 w-[100px] py-[2px] px-1 text-center rounded"
                  onClick={() => {
                    setLocalCheckConditions((prev) => {
                      return { ...prev, if: condition };
                    });
                  }}
                >
                  {condition}
                </span>
              ))}
            </div>
            <div className="w-1/2 flex flex-col gap-2 items-center">
              <span className="text-primary-yellow">THEN</span>
              {thenConditions?.map((condition) => (
                <span
                  className="bg-primary-yellow text-primary-gray-20 w-[100px] py-[2px] px-1 text-center rounded"
                  onClick={() => {
                    setLocalCheckConditions((prev) => {
                      return { ...prev, then: condition };
                    });
                  }}
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-start flex-col mt-5">
            <div className="text-xl mb-2 text-center flex justify-center w-full">Your Condition</div>
            <div>
              If{" "}
              <span className="underline min-w-[50px]">
                {localCheckConditions?.if ? (
                  <>{localCheckConditions?.if}</>
                ) : (
                  <>&lt;select from above&gt;</>
                )}
              </span>{" "}
            </div>
            <div className="ml-2 mt-2">
              Then{" "}
              <span className="underline min-w-[50px]">
                {localCheckConditions?.then ? (
                  <>{localCheckConditions?.then}</>
                ) : (
                  <>&lt;select from above&gt;</>
                )}
              </span>{" "}
            </div>
            <div className="mt-2">
              Else
            </div>
            <div className="mt-2 ml-2">
              Go to next step
            </div>
          </div>
          <div className="flex justify-center">
            <AppButton
              onClick={() => {
                if (!localCheckConditions.if || !localCheckConditions.then) {
                  return;
                }
                buildAlgo("check", localCheckConditions);
                setShowConditionsModal(false);
              }}
            >
              Submit
            </AppButton>
          </div>
        </div>
      </DarkModal>
    );
  };

  const renderNotificationPopup = () => {
    if (showNotificationPopup) {
      const { message, type } = notificationMessage ?? {};
      return (
        <div
          className={twMerge(
            "absolute top-1/2 left-1/2 flex justify-center items-center bg-[#C32230] rounded-md w-full max-w-[180px] px-3 py-3 shadow-lg h-fit -translate-x-1/2 -translate-y-1/2 text-white",
            type === "success" && "text-primary-gray-20 bg-primary-yellow"
          )}
        >
          <div className="text-base font-bold text-center whitespace-pre-line">
            {message}
          </div>
        </div>
      );
    }
  };

  return (
    <div>
      <div className="flex justify-between">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold">Ideal Steps</span>
          <span className="text-[28px] font-semibold">{idealFunctions}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold">Steps Used</span>
          <span className="text-[28px] font-semibold">{functionsUsed}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold">Attempts Left</span>
          <span className="text-[28px] font-semibold">{attemptsLeft}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center">
        <div className="timer-container w-full max-w-[344px]">
          <LinearTimerBar
            totalDuration={100}
            isSelfTimer
            startTimer={startTimer}
            reset={startTimer}
            timerEnd={handleTimerEnd}
          />
        </div>
      </div>
      <div className="w-full flex justify-center items-center">
      <div className="border-[0.5px] border-solid border-primary-yellow overflow-hidden relative max-w-[344px]">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex bg-primary-gray-20">
            {row.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                className="border-[0.5px] border-solid border-primary-yellow w-[86px] h-[72px] flex justify-center items-center relative"
              >
                {showOnUI[`${rowIndex}${cellIndex}`] ? (
                  <div className="w-full h-full absolute">
                    <div className="w-[50px] aspect-square flex justify-center items-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <img
                        src={`${showOnUI[`${rowIndex}${cellIndex}`]}`}
                        alt="obstacle-img"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                ) : (
                  <></>
                )}
                <AnimatePresence>
                  {positionOfPlayer[0] === rowIndex &&
                    positionOfPlayer[1] === cellIndex && (
                      <motion.div
                        className="w-[60px] aspect-square flex justify-center items-center relative"
                        transition={{ duration: 0.5 }}
                        initial={{
                          x:
                            currentDirection === "right"
                              ? -86
                              : currentDirection === "left"
                              ? 86
                              : 0,
                          y:
                            currentDirection === "up"
                              ? 72
                              : currentDirection === "down"
                              ? -72
                              : 0,
                        }}
                        animate={{ x: 0, y: 0 }}
                      >
                        <RobotSvg />
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ))}
        {renderNotificationPopup()}
      </div>
      </div>
      <div className="grid w-full grid-cols-5 h-full mt-4 gap-2">
        <div className="col-span-2 border-[4px] border-solid rounded-lg h-full p-2 flex flex-col">
          <div className="font-medium text-sm text-center mb-2">FUNCTIONS</div>
          <div>
            <div className="grid grid-cols-2 gap-3">
              <ConditionButton
                onClick={() => buildAlgo("up")}
                className="text-sm w-full rounded-lg"
                disabled={isRunning}
              >
                Up
              </ConditionButton>
              <ConditionButton
                onClick={() => buildAlgo("right")}
                className="text-sm w-full rounded-lg"
                disabled={isRunning}
              >
                Right
              </ConditionButton>
              <ConditionButton
                onClick={() => buildAlgo("down")}
                className="text-sm w-full rounded-lg"
                disabled={isRunning}
              >
                Down
              </ConditionButton>
              <ConditionButton
                onClick={() => buildAlgo("left")}
                className="text-sm w-full rounded-lg"
                disabled={isRunning}
              >
                Left
              </ConditionButton>
            </div>
            <div className="space-y-3 mt-5">
              {Object.keys(checks ?? {}).length ? (
                <ConditionButton
                  onClick={() => {
                    setShowConditionsModal(true);
                  }}
                  className="text-sm w-full rounded-lg"
                  disabled={isRunning}
                >
                  Condition
                </ConditionButton>
              ) : (
                <></>
              )}
              {canRepeat ? (
                <ConditionButton
                  onClick={() => buildAlgo("repeat")}
                  className="text-sm w-full rounded-lg"
                  disabled={isRunning}
                >
                  Repeat
                </ConditionButton>
              ) : (
                <></>
              )}
            </div>
          </div>
          <div className="flex flex-1"></div>
          <div className="space-y-3 mt-5">
            <ConditionButton
              onClick={openProblemModal}
              className="text-sm w-full rounded-lg"
              disabled={isRunning}
            >
              View Problem
            </ConditionButton>
            <ConditionButton
              onClick={runAlgo}
              className="font-bold text-sm w-full rounded-lg bg-primary-yellow text-primary-gray-20"
              isDisabled={isDisabled()}
              disabled={isRunning}
            >
              Submit Algo
            </ConditionButton>
          </div>
        </div>
        <div className="col-span-3 border-[4px] border-solid rounded-lg h-full p-2 flex flex-col">
          <div className="font-medium text-sm text-center mb-2">YOUR ALGO</div>
          <div className="flex flex-col gap-1">
            {algoMoves.map((algoMove, index) => {
              const {
                move,
                if: ifCondition,
                then,
                repeat,
                times,
              } = algoMove ?? {};
              if (move === "check") {
                return (
                  <div className="grid grid-cols-2">
                    <div className="flex gap-2">
                      <span
                        className="font-bold"
                        onClick={() => deleteAlgoStep(index)}
                      >
                        <DeleteSvg />
                      </span>
                      <div className="bg-[rgb(217,217,217)] w-full max-w-[100px] px-1 py-[2px] capitalize">
                        Condition
                      </div>
                    </div>
                    <div className="bg-[#d9d9d9] w-full max-w-[100px] px-1 py-[2px] capitalize text-sm">
                      If {ifCondition}
                    </div>
                    <div className="bg-[#d9d9d9] w-full max-w-[100px] px-1 py-[2px] capitalize col-start-2 text-sm">
                      Then {then}
                    </div>
                  </div>
                );
              }
              return (
                <div>
                  <div className="flex gap-2">
                    <span
                      className="font-bold"
                      onClick={() => deleteAlgoStep(index)}
                    >
                      <DeleteSvg />
                    </span>
                    <div className="bg-[#d9d9d9] w-full max-w-[100px] px-1 py-[2px] capitalize">
                      Move {move}
                    </div>
                  </div>
                  {repeat ? (
                    <div className="bg-[#d9d9d9] w-full max-w-fit px-1 py-[2px] ml-6 flex items-center gap-1">
                      Repeat x{" "}
                      <input
                        className="text-base"
                        type="number"
                        min={1}
                        max={10}
                        value={times}
                        onChange={(e) =>
                          updateRepetitionsValue(e.target.value, index)
                        }
                      />
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {renderQuestionModal()}
      {renderIfConditionsModal()}
    </div>
  );
};

export default CodingGameContainer;