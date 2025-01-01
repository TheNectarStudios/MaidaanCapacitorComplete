import { useEffect, useMemo, useRef, useState } from "react";
import LinearTimerBar from "../LinearTimerBar";
import AppButton from "../../../../Common/AppButton";
import PaperCheckingOptions from "./PaperCheckingOptions";

const PaperCheckingContainer = ({
  currentActiveQuestion,
  questionsList,
  submitGame,
  updateGameState,
  gameState,
  isTrialGame,
  currentActiveIndex,
}) => {
  const [totalRows, setTotalRows] = useState(0);
  const [localAnswers, setLocalAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [correctGraded, setCorrectGraded] = useState(0);
  const [startTimer, setStartTimer] = useState(true);
  const [resetTimer, setResetTimer] = useState(false);
  const [scoreState, setScoreState] = useState({ score: 0, attempts: 0, correctAttempts: 0 });
  const scoreRef = useRef(0);

  useEffect(() => {
    const calculateRows = () => {
      const rows = Math.floor(window.innerHeight / 40);
      setTotalRows(rows);
    };
    calculateRows();
    window.addEventListener("resize", calculateRows);

    return () => {
      window.removeEventListener("resize", calculateRows);
    };
  }, []);

  const totalToGrade = useMemo(() => {
    return currentActiveQuestion?.questions?.filter((ques) => ques.isQuestion)
      .length;
  }, [currentActiveQuestion]);

  const gradedQues = useMemo(() => {
    return Object.keys(localAnswers[currentActiveIndex] ?? {}).length;
  }, [currentActiveIndex, localAnswers]);

  const handleTimerEnd = () => {
    handleSubmitQuestion();
  };

  const recordAnswer = (index, isCorrect) => {
    const currIndex = currentActiveIndex;
    setLocalAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currIndex] = { ...newAnswers[currIndex], [index]: isCorrect };
      return newAnswers;
    });
  };

  const isDisabled = (isSubmit = true) => {
    const areAllAnswered = Object.keys(localAnswers?.[currentActiveIndex] || {}).length === currentActiveQuestion.questions.filter((ques) => ques.isQuestion).length;
    console.log(currentActiveQuestion.questions.filter((ques) => ques.isQuestion).length,"qlength")
    console.log(localAnswers?.[currentActiveIndex]?.length,"localAnswers")
    console.log("areAllAnswered", areAllAnswered);
    console.log("localAnswers", localAnswers);
    console.log(areAllAnswered, "areAllAnswered")
    if(isSubmit){
      return !areAllAnswered;
    }
    else{
      return false;
    }
  };

  const calculateScoreForCorrectAnswers = () => {
    const currIndex = currentActiveIndex;
    const correctAnswers = currentActiveQuestion.questions.filter(
      (ques, index) => {
        if (!ques.isQuestion) return false;
        return localAnswers[currIndex]?.[index] === ques.isCorrect;
      }
    );
    ;
    setScore((prev) => prev + correctAnswers.length);
    scoreRef.current += correctAnswers.length;
    setCorrectGraded(correctAnswers.length);
    if (!isTrialGame) {
      const attempts = Object.keys(localAnswers[currIndex] || {}).length + scoreState.attempts;
      const correctAttempts = correctAnswers.length + scoreState.correctAttempts;
      const score = scoreRef.current + scoreState.score;
      setScoreState({
        score,
        attempts,
        correctAttempts,
      });
      updateGameState({
        score,
        attempts,
        correctAttempts,        
        correctlyGraded: {
          ...gameState.correctlyGraded,
          [currentActiveIndex]: correctAnswers.length,
        },
        answers: {
          ...gameState.answers,
          [currentActiveIndex]: localAnswers[currIndex],
        },
      });
    }

  };

  const handleSubmitQuestion = () => {
    setSubmitted(true);
    calculateScoreForCorrectAnswers();
  };

  const handleProceed = () => {
    submitGame();
    setSubmitted(false);
    setCorrectGraded(0);
    setStartTimer(false);
    setTimeout(() => {
      setStartTimer(true);
    }, 100);
  }

  const getCorrectGradedString = () => {
    return `${correctGraded} / ${totalToGrade}`;
  };


  console.log("currentActiveQuestion", currentActiveQuestion);
  console.log("localAnswers", localAnswers);

  return (
    <div>
      <div className="grid grid-cols-3">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold">
            {submitted ? "Correct graded" : "Graded"}
          </span>
          <span className="text-[28px] font-semibold">
            {submitted ? getCorrectGradedString() : gradedQues}
          </span>
        </div>
        <div className="flex justify-center items-center">
          {submitted ? (
            <AppButton onClick={handleProceed} disabled={isDisabled(false)}>
              Proceed
            </AppButton>
          ) : (
            <AppButton onClick={handleSubmitQuestion} disabled={isDisabled()}>
              Submit
            </AppButton>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold">
            {submitted ? "Your score" : "To Grade"}
          </span>
          <span className="text-[28px] font-semibold">
            {submitted ? score : totalToGrade}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center">
        <div className="timer-container w-full max-w-[90vw]">
          <LinearTimerBar
            totalDuration={100}
            isSelfTimer
            startTimer={startTimer}
            reset={startTimer}
            timerEnd={handleTimerEnd}
          />
        </div>
      </div>

      <div className="flex items-center justify-center w-full relative">
        <div className="bg-white border-2 border-solid rounded-lg shadow-md overflow-y-auto w--full px--3 h-[85vh] w-[90vw]">
          <div className="w-[1px] min-h-[85vh] bg-[#EC1C24] absolute left-8"></div>
          <div className="w-[1px] min-h-[85vh] bg-[#EC1C24] absolute left-9"></div>
            
         

          <div
            className="flex items-start w-full  border-gray-300 h-[60px] justify-end px-[6px] m-0"
            style={{
              borderBottom: "1px solid black",
            }}
          >
            <div className="flex flex-col">
              {/* <div className="w-4 h-fit mt-5">2</div> */}
              <div className="flex h-5">
                <p className="text-black font-bold text-sm">Name : </p>
                <p className="text-black text-sm"> Maidaan</p>
              </div>

              <div className="flex h-5">
                <p className="text-black font-bold text-sm">Class :</p>
                <p className="text-black text-sm">5</p>
              </div>
            </div>
          </div>


          <div
            className="flex items-center border-gray-300 h-10 justify-between px-[6px] m-0"
            style={{
              borderBottom: "1px solid black",
            }}
          >
            <div className="flex items-center justify-center w-full">
              {/* <div className="w-4 h-fit mt-5">1</div> */}
              <div className="flex items-start h-full">
                <p className="text-black font-bold text-sm">{currentActiveQuestion?.header ?? "Header"}</p>
              </div>
            </div>
          </div>

          {currentActiveQuestion?.questions.map((line, index) => (
            <div
              key={index}
              className="flex items-center border-gray-300 h-10 justify-between px-[6px]"
              style={{
                borderBottom: "1px solid black",
              }}
            >
              <div className="flex items-center gap-6">
                <div className="w-4 h-fit mt-5">{line.prefix ?? ""}</div>
                <div className="flex items-start h-full mt-5">
                  <p className="text-black font-bold text-sm">{line.text}</p>
                </div>
              </div>
              {line.isQuestion ? (
                <PaperCheckingOptions
                  localAnswers={localAnswers}
                  currentActiveQuestion={currentActiveQuestion}
                  currentActiveIndex={currentActiveIndex}
                  question={line}
                  index={index}
                  recordAnswer={recordAnswer}
                  submitted={submitted}
                />
              ) : (
                <></>
              )}
            </div>
          ))}
          {/* Add empty lines to fill the notebook UI */}
          {currentActiveQuestion?.questions?.length < totalRows ? (
            [...Array(totalRows - currentActiveQuestion.questions.length)].map(
              (_, index) => (
                <div
                  key={currentActiveQuestion.questions.length + index}
                  className="flex items-center border-b border-gray-300 h-10 pl-2"
                  style={{
                    borderBottom: "1px solid black",
                  }}
                >
                  <p className="text-gray-800"></p>
                </div>
              )
            )
          ) : (
            <></>
          )}
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default PaperCheckingContainer;