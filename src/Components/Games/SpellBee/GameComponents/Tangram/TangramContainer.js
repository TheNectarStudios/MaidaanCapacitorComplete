import paper, { CompoundPath } from "paper/dist/paper-core"
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  CLICK_TIMEOUT,
  FADE_TRANSITION_DURATION,
  MAX_PARTICLE_OPACITY,
  SNAP_DISTANCE,
  SOFT_ERROR_MARGIN,
  VICTORY_PARTICLES_DURATION,
  View, countCorrectlyPlacedPieces, createPiecesGroup, getSnapVector, isTangramComplete, restrictGroupWithinCanvas, scrambleGroup, updateColisionState
} from "../../../../Utils/tangram"
import LinearTimerBar from "../LinearTimerBar";
import { NewFormatTimer } from "../NewFormatCountDownTimer";
import { NEW_FORMAT_TOURNAMENT_GAME_TIMER, NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER, TANGRAM_TILELEFT_BONUS, TANGRAM_SOLVING_BONUS } from "../../../../../Constants/Commons";
import { InGameNotificationPopup } from "../../InGameNotificationPopup";
import { set } from "lodash";
//import { View } from "./view"

export const Tangram = ({ isTrialGame, submitGame, selectedTangram, currentTangramIndex, updateGameState, gameState, totalQuestions }) => {

  const timeRef = useRef()
  const showParticles = false;
  const showBackgroundPattern = true;
  //const markTangramAsCompleteRef = useRef()
  //markTangramAsCompleteRef.current = markTangramAsComplete

  const Timer = isTrialGame ? NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER["TANGRAM"] : NEW_FORMAT_TOURNAMENT_GAME_TIMER["TANGRAM"];
  const [showInGameNotificationPopup, setShowInGameNotificationPopup] = useState(false);
  const [notificationData, setNotificationData] = useState({});
  const [scoreData, setScoreData] = useState({ score: 0, attempts: 0, correctAttempts: 0, previousRoundScore: 0, attemptedWords: [], results: [] });
  const previousScoreRef = useRef();
  const overallScoreRef = useRef();
  const [startTimer, setStartTimer] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const canvasRef = useRef()
  const scaleFactorRef = useRef()
  const piecesGroupRef = useRef()
  const particlesRef = useRef()
  const coumpoundPathRef = useRef()
  const showBackgroundPatternRef = useRef()

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && piecesGroupRef.current) {
        for (const pieceGroup of piecesGroupRef.current.children) {
          restrictGroupWithinCanvas(pieceGroup, canvasRef.current)
        }
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])


  useEffect(() => {
    setStartTimer(true);
  }, [selectedTangram])

  // Init a game
  useLayoutEffect(() => {
    const start = Date.now()
    const attachPieceGroupEvents = (pieceGroup) => {
      let anchorPoint = null
      let ghostGroup = null
      let mouseDownTimestamp = null
      let mouseDownPoint = null

      const handleMouseEnter = (mdEvent) => {
        if (document.activeElement === canvasRef.current) {
          document.body.style.cursor = "pointer"
        }
      }

      const handleMouseLeave = (mdEvent) => {
        document.body.style.cursor = "default"
      }

      const handleMouseDown = (mdEvent) => {
        mouseDownTimestamp = Date.now()
        mouseDownPoint = mdEvent.point

        anchorPoint = mdEvent.point.subtract(pieceGroup.position)

        ghostGroup = pieceGroup.clone({ insert: false, deep: true })

        pieceGroup.bringToFront()
      }

      const handleMouseDrag = (mdEvent) => {
        document.body.style.cursor = "move"

        const newAnchorPoint = mdEvent.point.subtract(pieceGroup.position)

        const vector = newAnchorPoint.subtract(anchorPoint)

        ghostGroup.position = pieceGroup.position.add(vector)

        const ghostShape = ghostGroup.children["display 1"]

        const otherShapes = piecesGroupRef.current.children
          .filter((otherGroup) => otherGroup !== pieceGroup)
          .map(({ children }) => children["display"])

        const coumpoundShapes =
          showBackgroundPatternRef.current && coumpoundPathRef.current
            ? coumpoundPathRef.current.children
              ? coumpoundPathRef.current.children
              : [coumpoundPathRef.current]
            : null

        const snapVector = getSnapVector(
          SNAP_DISTANCE,
          ghostShape,
          otherShapes,
          coumpoundShapes
        )
        if (snapVector) {
          ghostGroup.position.x += snapVector.x
          ghostGroup.position.y += snapVector.y
        }

        restrictGroupWithinCanvas(ghostGroup, canvasRef.current)

        pieceGroup.position = ghostGroup.position

        updateColisionState(pieceGroup, piecesGroupRef.current)
      }

      const handleMouseUp = (muEvent) => {
        document.body.style.cursor = "pointer"

        if (
          muEvent.point.subtract(mouseDownPoint).length < SNAP_DISTANCE &&
          Date.now() - mouseDownTimestamp < CLICK_TIMEOUT
        ) {
          pieceGroup.rotation += 45
          if (pieceGroup.data.id === "rh") {
            pieceGroup.data.rotation += 45
            if (pieceGroup.data.rotation === 180) {
              pieceGroup.data.rotation = 0
              pieceGroup.scale(-1, 1) // Horizontal flip
            }
          }
          //playRef.current.tangram()

          restrictGroupWithinCanvas(pieceGroup, canvasRef.current)

          updateColisionState(pieceGroup, piecesGroupRef.current)

          mouseDownTimestamp = null
          mouseDownPoint = null
        }

        anchorPoint = null
        ghostGroup && ghostGroup.remove()
        ghostGroup = null

        if (!coumpoundPathRef.current) {
          return
        }

        if (showBackgroundPatternRef.current === false) {
          coumpoundPathRef.current.position = piecesGroupRef.current.position
        }

        countCorrectlyPlacedPieces(coumpoundPathRef.current, piecesGroupRef.current, SOFT_ERROR_MARGIN)
        if (
          isTangramComplete(
            coumpoundPathRef.current,
            piecesGroupRef.current,
            SOFT_ERROR_MARGIN
          )
        ) {

          calculateScoreAndUpdateState(true)
          if (!isTrialGame) {
            // Show the in-game notification
            setShowInGameNotificationPopup(true);
            setStartTimer(false);
            setNotificationData({
              message: "Tangram Solved\n",
              type: "successText",
            });

            setTimeout(() => {
              setNotificationData({
                message: "Tangram Solved\n",
                type: "success",
                score: {
                  current: previousScoreRef.current,
                  overall: overallScoreRef.current,
                }
              });
            }, 3000);

            // Hide the notification after 2 seconds and submit the game
            setTimeout(() => {
              setShowInGameNotificationPopup(false);
              submitGame();
            }, 7000);
          }
          else {
            setShowInGameNotificationPopup(true);
            setNotificationData({
              message: "Tangram Solved\n",
              type: "successText",
            });
            setTimeout(() => {
              setShowInGameNotificationPopup(false);
              submitGame(true);
            }, 3000);
          }

          for (const pieceGroup of piecesGroupRef.current.children) {
            pieceGroup.data.removeListeners()
          }
          document.body.style.cursor = "default"



        }
      }

      pieceGroup.on({
        mouseenter: handleMouseEnter,
        mouseleave: handleMouseLeave,
        mousedown: handleMouseDown,
        mousedrag: handleMouseDrag,
        mouseup: handleMouseUp,
      })

      pieceGroup.data.removeListeners = () =>
        pieceGroup.off({
          mouseenter: handleMouseEnter,
          mouseleave: handleMouseLeave,
          mousedown: handleMouseDown,
          mousedrag: handleMouseDrag,
          mouseup: handleMouseUp,
        })
    }

    const init = () => {
      paper.setup(canvasRef.current)

      piecesGroupRef.current = createPiecesGroup()

      // Loop through each element and place them 
      let index = 0;
      for (const pieceGroup of piecesGroupRef.current.children) {
        if (index === 0) {
          pieceGroup.position = new paper.Point(0, 110);
          pieceGroup.rotation = 270;
        }
        else if (index === 3) {
          pieceGroup.position = new paper.Point(110, 70);
          pieceGroup.rotation = 225;
        }
        else if (index === 4) {
          pieceGroup.position = new paper.Point(0, 140);
          pieceGroup.rotation = 180;
        }

        else if (index === 6) {
          pieceGroup.position = new paper.Point(190, 87);
          pieceGroup.rotation = 90;
        }

        else if (index === 5) {
          pieceGroup.position = new paper.Point(260, 80);
          pieceGroup.rotation = 45;
        }

        else if (index === 2) {
          pieceGroup.position = new paper.Point(220, 140);
          pieceGroup.rotation = 180;
        }

        else if (index === 1) {
          pieceGroup.position = new paper.Point(280, 132);
          pieceGroup.rotation = 90;
        }
        index++;
      }

      // for(const pieceGroup of piecesGroupRef.current.children){
      //   //pieceGroup.position.y = 400;
      //   pieceGroup.position = paper.view.center
      //   //pieceGroup.position 

      //   //pieceGroup._pivot.y = pieceGroup.bounds.height;
      // }

      if (selectedTangram) {
        coumpoundPathRef.current = paper.project.importSVG(
          `<path d="${selectedTangram.path}" />`,
          {
            applyMatrix: true,
          }
        )

        coumpoundPathRef.current.sendToBack()
        coumpoundPathRef.current.fillRule = "evenodd"

        coumpoundPathRef.current.closed = true
      }

      const outerBounds = paper.project.view.bounds
      const innerBounds = coumpoundPathRef.current
        ? coumpoundPathRef.current.bounds
        : piecesGroupRef.current.children[3].bounds.scale(2)

      if (outerBounds.width > outerBounds.height) {
        scaleFactorRef.current = Math.min(
          Math.min(outerBounds.width * 0.8, 700) / innerBounds.width,
          Math.min(outerBounds.height * 0.8, 600) / innerBounds.height
        )
      } else {
        scaleFactorRef.current = Math.min(
          Math.min(outerBounds.width * 0.8, 600) / innerBounds.width,
          Math.min(outerBounds.height * 0.8, 700) / innerBounds.height
        )
      }

      if (coumpoundPathRef.current) {
        coumpoundPathRef.current.scale(scaleFactorRef.current)
        const centerPoint = paper.view.center
        const tempCenterPoint = centerPoint
        //tempCenterPoint.y = tempCenterPoint.y - 100
        coumpoundPathRef.current.position = centerPoint
      }

      for (const pieceGroup of piecesGroupRef.current.children) {
        pieceGroup.scale(scaleFactorRef.current)
        //scrambleGroup(pieceGroup, canvasRef.current)
        attachPieceGroupEvents(pieceGroup)
        restrictGroupWithinCanvas(pieceGroup, canvasRef.current)
        updateColisionState(pieceGroup, piecesGroupRef.current)
      }
    }

    init()

    return () => {
      paper.project.remove()
      particlesRef.current = null
      piecesGroupRef.current = null
      coumpoundPathRef.current = null
    }
  }, [selectedTangram])

  const calculateScoreAndUpdateState = (isProblemSolved = false) => {
    if (isTrialGame) {
      return;
    }
    let timeLeftBonus = 0;
    let currentRoundScore = 0;
    let timeTaken = 0;
    let finishBonus = 0;

    if (isProblemSolved) {

      finishBonus = TANGRAM_SOLVING_BONUS;
      //currentRoundScore
      //calculate percentage of time left
      const timeLeft = timeRef.current
      const timeTakePercentage = 100 - timeLeft;
      timeTaken = timeTakePercentage * Timer / 100;
      if (timeLeft > 50) {
        timeLeftBonus = TANGRAM_TILELEFT_BONUS["MORETHAN50%"]
      }
      else {
        timeLeftBonus = TANGRAM_TILELEFT_BONUS["LESSTHAN50%"]
      }
    }
    else {
      timeLeftBonus = TANGRAM_TILELEFT_BONUS["ZERO"]
    }

    currentRoundScore = timeLeftBonus + finishBonus;

    const score = scoreData.score + currentRoundScore;
    const attempts = scoreData.attempts + 1;
    const correctAttempts = isProblemSolved ? scoreData.correctAttempts + 1 : scoreData.correctAttempts;
    previousScoreRef.current = currentRoundScore;
    overallScoreRef.current = score;
    const attemptedWords = scoreData.attemptedWords;
    const attemptsWordObject = {
      name: selectedTangram.name,
      imageUrl: selectedTangram.imageUrl,
    }
    attemptedWords.push(JSON.stringify(attemptsWordObject));

    const results = scoreData.results;
    results.push(isProblemSolved ? true : false);
    setScoreData({
      score,
      attempts,
      correctAttempts,
      previousRoundScore: currentRoundScore,
      attemptedWords,
      results,
    });
    const dataToUpdate = {
      score: score,
      attempts: attempts,
      correctAttempts: correctAttempts,
      scoreBreakdown: {
        ...(gameState?.scoreBreakdown ?? {}),
        [currentTangramIndex]: {
          name: selectedTangram.name,
          currentRoundScore,
          timeLeftBonus,
          timeTaken,
        },
      },
      attemptedWords,
      results,
    }
    updateGameState(dataToUpdate);
  };


  const timerEndHandler = () => {
    setStartTimer(false);
    calculateScoreAndUpdateState(false);
    //show a popup that time is up
    if (!isTrialGame) {
      setShowInGameNotificationPopup(true);

      setNotificationData({
        message: "Time's up\n",
        type: "failedText",
      });
      //setShowImage(true);

      setTimeout(() => {
        setNotificationData({
          message: "Time's up\n",
          score: {
            current: previousScoreRef.current,
            overall: overallScoreRef.current,
          },
          type: "error",
        });

      }, 3000);

      setTimeout(() => {
        setShowInGameNotificationPopup(false);
        setShowImage(false);
        submitGame();
      }, 7000);
    }
    else {
      setShowInGameNotificationPopup(true);

      setNotificationData({
        message: "Time's up\n",
        type: "failedText",
      });
      setTimeout(() => {
        setShowInGameNotificationPopup(false);
        submitGame(true);
      }, 3000);
    }

  };

  useLayoutEffect(() => {
    showBackgroundPatternRef.current = showBackgroundPattern
    if (!coumpoundPathRef.current) {
      return
    }

    if (showBackgroundPattern) {
      coumpoundPathRef.current.fillColor = "black"
      //coumpoundPathRef.current.strokeColor = "ff0000"
      const newPoint = paper.view.center
      newPoint.y = newPoint.y
      const viewHeight = paper.view.size.height;

      // Calculate 60% of the height
      const shiftAmount = 0.65 * viewHeight;

      // Get the top-left corner of the view
      const topLeft = paper.view.bounds.topCenter;

      // Create a new point shifted by the calculated amount
      const newTopLeft = new paper.Point(topLeft.x, topLeft.y + shiftAmount);
      coumpoundPathRef.current.position = newTopLeft
    } else {
      coumpoundPathRef.current.fillColor = "transparent"
    }
  }, [selectedTangram, showBackgroundPattern])

  useLayoutEffect(() => {
    const colors = [
      "rgba(255, 0, 0, 2)",   // Red with 80% opacity
      "rgba(0, 255, 0, 1)",   // Green with 80% opacity
      "rgba(0, 0, 255, 1)",   // Blue with 80% opacity
      "rgba(255, 255, 0, 0.8)", // Yellow with 80% opacity
      "rgba(128, 0, 128, 0.8)", // Purple with 80% opacity
      "rgba(255, 165, 0, 0.8)", // Orange with 80% opacity
      "rgba(0, 255, 255, 0.8)"  // Cyan with 80% opacity
    ];
    let colorIndex = 0;

    for (const pieceGroup of piecesGroupRef.current.children) {
      const color = colors[colorIndex % colors.length];
      pieceGroup.children["display"].fillColor = color;
      //pieceGroup.children["insetBorder"].strokeColor = color ;
      colorIndex++;
    }

  }, [selectedTangram, showParticles])
  {/* <div className="flex flex-col items-center" style={{ height: `min(600px, 80vh)` }}> */ }
  if (showImage) {
    return (
      <div
        className="flex flex-col items-center"
        style={{ height: `min(${isTrialGame ? '80vh' : '100vh'}, 600px)` }}
      >
        <span className="text-[24px]">Score : {scoreData?.score}</span>

        <div
          style={{
            backgroundImage: `url(${selectedTangram.imageUrl})`,
            height: "90vh",
            width: "100%", // Ensure the div has width
            backgroundPosition: "center",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
          }}
        />
        {showInGameNotificationPopup && <InGameNotificationPopup message={notificationData.message} type={notificationData.type} showTimer={currentTangramIndex !== totalQuestions-1} />}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center"
      style={{ height: `min(${isTrialGame ? '80vh' : '100vh'}, 600px)` }}
    >
      <span className="text-[24px]">Score : {scoreData?.score}</span>
      <LinearTimerBar
        totalDuration={Timer}
        startTimer={startTimer}
        isSelfTimer
        reset={startTimer}
        timerEnd={timerEndHandler}
        timeRef={timeRef}
      />
      <View
        css={{
          flex: "1",
          position: "relative",
          color: "dialogText",
          animation: `${FADE_TRANSITION_DURATION}ms fadeIn ease`,
        }}
      >

        <View
          as="canvas"
          ref={canvasRef}
          css={{
            minHeight: "auto",
            //width: "80vw",
            flex: 1,
          }}
        />
      </View>
      {showInGameNotificationPopup && <InGameNotificationPopup message={notificationData.message} type={notificationData.type} score={notificationData.score} showTimer={currentTangramIndex !== totalQuestions-1} />}
    </div>
  )
}