import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { MOVES_PER_PERSON, generateRandomTargetPosition, getRandomTargetMovementVertices } from "../../Constants/GamesArena/Archery";
import { AnimatePresence } from "framer-motion";
import AnimatedModal from "../Common/AnimatedModal";
import { Timer } from "../../Components/Games/SpellBee/GameComponents/CountdownTimer";

const trueWidth = 375;
const trueHeight = 500;

const ArcheryGameCanvas = ({
  gameState,
  updateGameState,
  myPlayerId,
  otherPlayerId,
  playAudioClip,
  setPauseTimer,
}) => {
  const canvasRef = useRef(null);
  const animationId = useRef(null);
  const localGameState = useRef(null);
  const gunFiredSoundPlayed = useRef(false);
  const targetHitSoundPlayed = useRef(false);
  const targetPositionOfOtherPlayer = useRef(null);
  const targetPositionOfMyPlayer = useRef(null);
  const verticesOfMyPlayer = useRef(null);
  const verticesOfOtherPlayer = useRef(null);
  //
  //
  const showOtherPlayerAnimation = useRef(false);
  const otherPlayerTargetPosition = useRef(null);
  const otherPlayerAngle = useRef(0);

  const otherPlayerTargetHitSoundPlayed = useRef(false);

  const [startGame, setStartGame] = useState(false);
  const [otherPlayerAnimationDone, setOtherPlayerAnimationDone] = useState(false);
  const [isArrowFired, setIsArrowFired] = useState(false);
  const [disableCanvas, setDisableCanvas] = useState(true);
  const [showGameStartTimer, setShowGameStartTimer] = useState(true);

  const targetHit = useRef(false);
  const otherPlayerAnimationDoneRef = useRef(false);
  const currentActivePlayerRef = useRef(null);

  const gravity = 0.5;
  const archerPosition = { x: 63 / 2, y: 50 };
  const speed = 5;
  const circleLineWidth = 3;

  let currentFrame = 0;
  let isAnimating = false;
  let frameCount = 0;
  const totalFrames = 8; // total number of frames in the sprite
  const frameWidths = [79, 80, 80, 90, 100, 100, 100, 100];
  const frameHeights = [177, 177, 177, 177, 214, 193, 180, 175];
  let isVisible = true;
  let balloonSpeed = .3;
  let arcRadius = 60;
  let gunDimensions = { width: 78, height: 42 };

  function drawArcher(
    ctx,
    canvas,
    baseImg,
    headImg,
    angle,
    aimImg,
    mouseDownParam
  ) {
    ctx.drawImage(
      baseImg,
      canvas.width / 2 - (archerPosition.x * scaleFactor.current),
      canvas.height - (archerPosition.y * scaleFactor.current),
      63,
      35
    );
    const headImgCenterX = canvas.width / 2 - 30 + gunDimensions.width / 2 - 10;
    const headImgCenterY =
      canvas.height -
      archerPosition.y * scaleFactor.current -
      40 +
      gunDimensions.height / 2;
    ctx.save();
    ctx.translate(headImgCenterX, headImgCenterY);

    ctx.rotate(angle);

    ctx.drawImage(
      headImg,
      -gunDimensions.width / 2 + 10,
      -gunDimensions.height / 2,
      gunDimensions.width,
      gunDimensions.height
    );

    if (aimImg) {
      ctx.rotate(Math.PI / 2);
      // draw the aim image at the tip of the gun
      ctx.drawImage(aimImg, -15, -canvas.width / 2 + 70 + 30, 30, 30);
    }

    ctx.restore();
  }

  // set the targetPosition, vertices in the gamestate
  // set the arrowFired state for each player
  // set the angle state for each player
  // only update the vertices and targetPosition once both turns are done

  // let vertices = null;
  let currentVertex = 0;
  let pos = null;

  function drawTarget(isMyPlayer, isOtherPlayer, isHitPos, ctx, canvas, img, posP, targetHit, vertices, angle = 0) {
    if (pos === null) {
      pos = { ...posP };
    }
    if (pos.x + frameWidths[currentFrame] / 2 > canvas.width || pos.x < 0) {
      balloonSpeed = -balloonSpeed;
    }
    if (vertices) {
    // Update position based on direction
    let dx = vertices[(currentVertex + 1) % vertices?.length].x - pos.x;
    let dy = vertices[(currentVertex + 1) % vertices?.length].y - pos.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction
    dx /= distance;
    dy /= distance;

    // Move towards next vertex
    pos.x += dx * balloonSpeed;
    pos.y += dy * balloonSpeed;

    // If the target has reached the next vertex, move to the next one
    if (
      Math.abs(pos.x - vertices[(currentVertex + 1) % vertices?.length].x) <
        balloonSpeed &&
      Math.abs(pos.y - vertices[(currentVertex + 1) % vertices?.length].y) <
        balloonSpeed
    ) {
      currentVertex = (currentVertex + 1) % vertices?.length;
    }
  }

    // pos.x += balloonSpeed;
    if (targetHit) {
      isAnimating = true;
      // vertices = null;
      currentVertex = 0;
    }
    if (isAnimating && !targetHit) {
      isVisible = true;
      isAnimating = false;
      pos = null;
    }

    if (isAnimating && isVisible) {
      frameCount++;
      if (frameCount < 4) {
        ctx.drawImage(
          img,
          currentFrame * frameWidths[currentFrame], // source x
          0, // source y
          frameWidths[currentFrame], // source width
          frameHeights[currentFrame], // source height
          pos.x,
          pos.y,
          (frameWidths[currentFrame] / 2) * 0.6 * scaleFactor.current,
          (frameHeights[currentFrame] / 2) * 0.6 * scaleFactor.current
        );
        return;
      }
      frameCount = 0;
      // Draw the current frame
      ctx.drawImage(
        img,
        currentFrame * frameWidths[currentFrame], // source x
        0, // source y
        frameWidths[currentFrame], // source width
        frameHeights[currentFrame], // source height
        pos.x,
        pos.y,
        (frameWidths[currentFrame] / 2) * 0.6 * scaleFactor.current,
        (frameHeights[currentFrame] / 2) * 0.6 * scaleFactor.current
      );

      // Go to the next frame
      currentFrame++;

      // If it's the last frame, reset the animation
      if (currentFrame >= totalFrames) {
        currentFrame = 0;
        isAnimating = false;
        isVisible = false;
      }
    } else if (!isAnimating && isVisible && pos) {
      ctx.drawImage(
        img,
        0, // source x
        0, // source y
        frameWidths[currentFrame], // source width
        frameHeights[currentFrame], // source height
        pos.x,
        pos.y,
        (frameWidths[currentFrame] / 2) * 0.6 * scaleFactor.current,
        (frameHeights[currentFrame] / 2) * 0.6 * scaleFactor.current
      );
    }
  }

  function drawArrow(ctx, angle, x, y, canvas) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();

    ctx.rect(-15, -2.5, 30, 5);
    if (localGameState?.current?.currentActivePlayer === "playerOne") {
      ctx.fillStyle = "#f04444";
    } else {
      ctx.fillStyle = "#ccf900";
    }
    // ctx.fillStyle = "black";
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  function drawArc(ctx, canvas, mouseDown, angle, currentActivePlayer, otherPlayerTargetHit) {
    const centerX = canvas.width / 2 - 30 + 78 / 2;
    const centerY = canvas.height - (archerPosition.y * scaleFactor.current) - 40 + 42 / 2;
    const radius = 70 * scaleFactor.current;
    ctx.beginPath();
    // convert 270 deg angle to radians
    let startAngle = 150 * (Math.PI / 180); // Convert 120 degrees to radians
    let endAngle = 395 * (Math.PI / 180); // Convert 360 degrees to radians

    ctx.arc(centerX - 10, centerY, radius, startAngle, endAngle, false);
    ctx.fillStyle = "transparent"; // Set transparent fill
    ctx.fill();

    // Black outline
    ctx.beginPath();
    ctx.arc(centerX - 10, centerY, radius, startAngle, endAngle, false);
    ctx.lineWidth = circleLineWidth;
    ctx.strokeStyle = "#00000040";
    ctx.stroke();
    ctx.closePath();
    
    if(showOtherPlayerAnimation.current && !otherPlayerAnimationDoneRef.current && gameState.currentActivePlayer !== myPlayerId) {
      drawText(ctx, {
        x: centerX,
        y: canvas.height / 2,
        text: otherPlayerTargetHit
          ? `${gameState[otherPlayerId].name} hits!`
          : `${gameState[otherPlayerId].name} misses!`,
        font: "30px Arial",
      });
    };

    // Display text above the arc
    if (mouseDown) {
      drawAngleText(ctx, canvas, angle, centerX, centerY - radius - 25);
    } else {
      if (currentActivePlayer === myPlayerId) {
        drawText(ctx, {
          x: centerX,
          y: centerY - radius - 15,
          text: "Drag to aim, release to shoot",
          font: "15px Arial",
        });
      } else {
        drawText(ctx, {
          // x should be in the middle horizontally
          x: centerX,
          y: centerY - radius - 15,
          text: `Waiting for ${localGameState?.current?.[otherPlayerId].name} to shoot`,
          font: "15px Arial",
        });
      }
    }
  }

  function drawAngleText(ctx, canvas, angle, x, y) {
    ctx.fillStyle = "black";
    ctx.beginPath();
    // add this text to the canvas
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Angle: ${angle}`, x, y);
    ctx.strokeStyle = "#000";
    ctx.stroke();
    ctx.closePath();
  }

  function drawText(ctx, { x, y, text, font, color, strokeColor }) {
    ctx.fillStyle = color || "black";
    ctx.beginPath();
    ctx.font = font || "20px Arial";
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
    ctx.strokeStyle = strokeColor || "#000";
    ctx.stroke();
    ctx.closePath();
  }

  const setInitialStateForCanvas = (gameState) => {
    let targetPosition = { x: Math.floor(window.innerWidth - 100), y: 50 };
    let vertices = getRandomTargetMovementVertices(targetPosition);
    targetPositionOfMyPlayer.current = targetPosition;
    verticesOfMyPlayer.current = vertices;
    updateGameState({
      playerOne: {
        ...gameState.playerOne,
        targetPosition,
        vertices,
      },
    });
  };

  const scaleFactor = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.75;
    if (canvas.width !== trueWidth && canvas.height !== trueHeight) {
      const widthRatio = canvas.width / trueWidth;
      const heightRatio = canvas.height / trueHeight;
      scaleFactor.current = Math.min(widthRatio, heightRatio);
    }
    let mouseDown = false;
    let arrowFired = false;


    const bgImg = document.getElementById("bg");
    const targetImg = document.getElementById("archery-target");

    let baseImgPlayerOne = document.getElementById(
      "archery-gun-base-playerOne"
    );
    let headImgPlayerOne = document.getElementById(
      "archery-gun-head-playerOne"
    );
    let baseImgPlayerTwo = document.getElementById(
      "archery-gun-base-playerTwo"
    );
    let headImgPlayerTwo = document.getElementById(
      "archery-gun-head-playerTwo"
    );
    let aimImg = document.getElementById("aim");
    const headImgCenterX = canvas.width / 2 - 30 + 78 / 2;
    const headImgCenterY = canvas.height - archerPosition.y - 40 + 42 / 2;
    const baseImgCenterX = canvas.width / 2 - 30 + 63 / 2;
    const baseImgCenterY = canvas.height - archerPosition.y - 40 + 35 / 2;
    let x = headImgCenterX;
    let y = headImgCenterY + 5;
    
    let angle = 0;
    let angleForStateUpdate = 0;
    let otherPlayerX = baseImgCenterX;
    let otherPlayerY = baseImgCenterY + 5;

    function mouseUpHandler(e) {
      if (arrowFired) return;
      mouseDown = false;
      arrowFired = true;
      setIsArrowFired(true);
    }

    function mouseDownHandler(e) {
      if (arrowFired) return;
      mouseDown = true;
    }

    function mouseMoveHandler(e) {
      if (mouseDown) {
        const centerX = canvas.width / 2 - 30 + 78 / 2;
        const centerY = canvas.height - archerPosition.y - 40 + 42 / 2;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const distanceToCenter = Math.sqrt(
          (x - centerX) ** 2 + (y - centerY) ** 2
        );

        if (
          distanceToCenter >= 5 &&
          distanceToCenter <= 80 + circleLineWidth + 20
        ) {
          const dx = centerX - x; // Invert x-coordinate to make the angle move from right to left
          const dy = centerY - y; // Invert y-coordinate to align with standard Cartesian coordinates
          angle = Math.atan2(dy, dx); // Calculate angle in radians
          if (angle < 0) {
            angle += 2 * Math.PI; // Ensure angle is between 0 and 2 * Math.PI
          }
          angle = Math.PI - angle; // Subtract Math.PI from angle to align with the arc
          if (angle < 0) {
            // Ensure angle is between 0 and Math.PI
            angle += 2 * Math.PI;
          }
          angle = (angle * (180 / Math.PI)).toFixed(2); // Convert radians to degrees
          angleForStateUpdate = angle;
        }
      }
    }

    let targetOutOfCanvas = false;
    let otherPlayerTargetHit = false;
    let otherPlayerTargetOutOfCanvas = false;


    const draw = () => {
      const { currentActivePlayer } = localGameState.current ?? {};
      // let vertices = verticesOfMyPlayer.current;
      if (currentActivePlayer !== myPlayerId) {
        mouseDown = false;
        arrowFired = false;
        x = headImgCenterX;
        y = headImgCenterY + 5;
        angle = 0;
      }
      const angleToFire = (-1 * angle).toFixed(2);
      const angleToFireForStateUpdate = (-1 * angleForStateUpdate).toFixed(2);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      if (
        currentActivePlayer === "playerOne" &&
        myPlayerId === "playerOne"
      ) {
        drawArcher(
          ctx,
          canvas,
          baseImgPlayerOne,
          headImgPlayerOne,
          (angleToFire * Math.PI) / 180,
          aimImg,
          mouseDown
        );
      } else if (
        currentActivePlayer === "playerTwo" &&
        myPlayerId === "playerTwo"
      ) {
        drawArcher(
          ctx,
          canvas,
          baseImgPlayerTwo,
          headImgPlayerTwo,
          (angleToFire * Math.PI) / 180,
          aimImg,
          mouseDown
        );
      } else {
        drawArcher(
          ctx,
          canvas,
          currentActivePlayer === 'playerOne' ? baseImgPlayerOne : baseImgPlayerTwo,
          currentActivePlayer === 'playerOne' ? headImgPlayerOne : headImgPlayerTwo,
          0,
          null
        );
      }

      if (showOtherPlayerAnimation.current && !otherPlayerAnimationDoneRef.current && gameState.currentActivePlayer !== myPlayerId) {
        const lastMove =
          gameState[gameState.currentActivePlayer]?.moves?.slice(-1)[0];
        if (lastMove === true && !otherPlayerTargetHit) {
          otherPlayerTargetHit = true;
          if (!otherPlayerTargetHitSoundPlayed.current) {
            playAudioClip("/Assets/Sounds/Archery/balloon-pop.mp3");
            otherPlayerTargetHitSoundPlayed.current = true;
          }
          setTimeout(() => {
            if (
              gameState.currentActivePlayer !== myPlayerId
            ) {
            otherPlayerTargetHit = false;
            setOtherPlayerAnimationDone(true);
            otherPlayerAnimationDoneRef.current = true; }
          }, 1000);
        } else if (lastMove === false && !otherPlayerTargetOutOfCanvas) {
          otherPlayerTargetOutOfCanvas = true;
          setTimeout(() => {
            if (gameState.currentActivePlayer !== myPlayerId) {
              setOtherPlayerAnimationDone(true);
              otherPlayerAnimationDoneRef.current = true;
              otherPlayerTargetOutOfCanvas = false;

            }
          }, 1000);
        }

      }

      if (currentActivePlayer === myPlayerId) {
        drawTarget(
          true,
          false,
          false,
          ctx,
          canvas,
          targetImg,
          gameState[myPlayerId].targetPosition,
          targetHit.current,
          gameState[myPlayerId].vertices,
          (angleToFireForStateUpdate * Math.PI) / 180
        );
      } else if (!showOtherPlayerAnimation.current) {
        drawTarget(
          false,
          true,
          false,
          ctx,
          canvas,
          targetImg,
          gameState[otherPlayerId].targetPosition,
          otherPlayerTargetHit,
          gameState[otherPlayerId].vertices
          // (angleToFire * Math.PI) / 180
        );
      } else if (showOtherPlayerAnimation.current && !otherPlayerAnimationDoneRef.current && gameState.currentActivePlayer !== myPlayerId) {
        let coords = {
          x: gameState.otherPlayerTargetPosition.x,
          y: gameState.otherPlayerTargetPosition.y,
        };
        if (!gameState.isComputerGame) {
          coords = {
            x: gameState.otherPlayerTargetPosition.x * canvas.width,
            y: gameState.otherPlayerTargetPosition.y * canvas.height,
          };
        }
        
        drawTarget(
          false,
          false,
          true,
          ctx,
          canvas,
          targetImg,
          coords,
          otherPlayerTargetHit,
          null
          // (angleToFire * Math.PI) / 180
        );
      }

      drawArc(ctx, canvas, mouseDown, angle, currentActivePlayer, otherPlayerTargetHit);
      
      if (arrowFired) {
        setPauseTimer(true);
        if (!gunFiredSoundPlayed.current) {
          playAudioClip("/Assets/Sounds/Archery/gun-fire.mp3");
          gunFiredSoundPlayed.current = true;
        }
        drawArrow(ctx, (angleToFire * Math.PI) / 180, x, y, canvas);
        // Calculate velocity components based on angle and speed
        let velocityX = speed * Math.cos((angleToFire * Math.PI) / 180);
        let velocityY = speed * Math.sin((angleToFire * Math.PI) / 180);
        // if (targetHit) {
        //   velocityX = 0;
        //   velocityY = 0;
        // }

        // Update arrow position
        x += velocityX;
        y += velocityY;

        // Apply gravity
        // y -= gravity;
        const myPlayerData = localGameState.current[myPlayerId];
        // updateGameState({
        //   [myPlayerId]: {
        //     ...myPlayerData,
        //     arrowFired: true,
        //     arrowAngle: (angleToFire * Math.PI) / 180,
        //   },
        // });
        // check if arrow has hit the target
        if (
          x > pos.x &&
          x < pos.x + frameWidths[0] * 0.4 - 10 &&
          y > pos.y &&
          y < pos.y + frameHeights[0] * 0.4 - 30 &&
          !targetHit.current
        ) {
          if (!targetHitSoundPlayed.current) {
            playAudioClip("/Assets/Sounds/Archery/balloon-pop.mp3");
            targetHitSoundPlayed.current = true;
          }
          if (
            localGameState.current.currentActivePlayer === "playerOne" &&
            localGameState.current.isComputerGame
          ) {
            const newTargetPosition = generateRandomTargetPosition();
            updateGameState({
              showOtherPlayerAnimation: false,
              otherPlayerTargetPosition: pos,
              otherPlayerAngle: 0,
              playerTwo: {
                ...gameState.playerTwo,
                targetPosition: newTargetPosition,
                vertices: getRandomTargetMovementVertices(newTargetPosition),
              },
              playerOne: {
                ...localGameState.current.playerOne,
                moves: [...localGameState.current.playerOne?.moves, true],
                score: localGameState.current.playerOne.score + 1,
              },
            });
          } else {
            updateGameState({
              showOtherPlayerAnimation: true,
              otherPlayerTargetPosition: {
                x: (pos.x) / canvas.width,
                y: (pos.y) / canvas.height,
              },
              otherPlayerAngle: (angleToFireForStateUpdate * Math.PI) / 180,
              [myPlayerId]: {
                ...localGameState.current[myPlayerId],
                moves: [...myPlayerData?.moves, true],
                score: myPlayerData.score + 1,
              },
            });
          }
          targetHit.current = true;
          arrowFired = false;
          gunFiredSoundPlayed.current = false;
          x = headImgCenterX;
          y = headImgCenterY + 5;
          angle = 0;
          setTimeout(() => {
            targetHit.current = false;
            targetHitSoundPlayed.current = false;
            // setPauseTimer(false);
            if (
              gameState.currentActivePlayer === "playerOne" &&
              gameState.isComputerGame
            ) {
              updateGameState({
                currentActivePlayer: "playerTwo",
              });
            }
          }, 1000);
        } else if (x > canvas.width || x < 0 || y > canvas.height || y < 0) {
          arrowFired = false;
          x = headImgCenterX;
          y = headImgCenterY + 5;
          angle = 0;
          gunFiredSoundPlayed.current = false;
          if (
            gameState.currentActivePlayer === "playerOne" &&
            gameState.isComputerGame
          ) {
            const newTargetPosition = generateRandomTargetPosition();
            updateGameState({
              showOtherPlayerAnimation: false,
              otherPlayerTargetPosition: pos,
              otherPlayerAngle: 0,
              playerTwo: {
                ...gameState.playerTwo,
                targetPosition: newTargetPosition,
                vertices: getRandomTargetMovementVertices(newTargetPosition),
              },
              playerOne: {
                ...localGameState.current.playerOne,
                moves: [...localGameState.current.playerOne?.moves, false],
              },
            });
            setTimeout(() => {
              updateGameState({
                currentActivePlayer: "playerTwo",
              });
            }, 1000);
          } else {
            updateGameState({
              showOtherPlayerAnimation: true,
              otherPlayerTargetPosition: {
                x: pos.x / canvas.width,
                y: pos.y / canvas.height,
              },
              otherPlayerAngle: (angleToFireForStateUpdate * Math.PI) / 180,
              [myPlayerId]: {
                ...localGameState.current[myPlayerId],
                moves: [...myPlayerData?.moves, false],
              },
            });
          }
        }
      }
      animationId.current = requestAnimationFrame(draw);
    };

    animationId.current = requestAnimationFrame(draw);

    // Prevent scrolling when touching the canvas
    document.body.addEventListener(
      "touchstart",
      function (e) {
        if (e.target === canvas) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
    document.body.addEventListener(
      "touchend",
      function (e) {
        if (e.target === canvas) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
    document.body.addEventListener(
      "touchmove",
      function (e) {
        if (e.target === canvas) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // Set up touch events for mobile, etc
    canvas.addEventListener(
      "touchstart",
      function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        canvas.dispatchEvent(mouseEvent);
      },
      false
    );
    canvas.addEventListener(
      "touchend",
      function (e) {
        var mouseEvent = new MouseEvent("mouseup", {});
        canvas.dispatchEvent(mouseEvent);
      },
      false
    );
    canvas.addEventListener(
      "touchmove",
      function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        canvas.dispatchEvent(mouseEvent);
      },
      false
    );

    canvas.addEventListener("mousedown", mouseDownHandler, false);
    canvas.addEventListener("mousemove", mouseMoveHandler, false);
    canvas.addEventListener("mouseup", mouseUpHandler, false);

    return () => {
      cancelAnimationFrame(animationId.current);
      document.removeEventListener("touchstart", mouseDownHandler);
      document.removeEventListener("touchmove", mouseMoveHandler);
      document.removeEventListener("touchend", mouseUpHandler);
      document.removeEventListener("mousedown", mouseDownHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
      canvas.removeEventListener("mousedown", mouseDownHandler);
      canvas.removeEventListener("mouseup", mouseUpHandler);
      canvas.removeEventListener("mousemove", mouseMoveHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    currentActivePlayerRef.current = gameState.currentActivePlayer;
    if (!startGame) {
      setPauseTimer(true);
    }
    localGameState.current = gameState;
    if (gameState.showOtherPlayerAnimation && startGame) {
      setPauseTimer(true);
    } else if (startGame) {
      setPauseTimer(false);
    }
      if (gameState.currentActivePlayer !== myPlayerId) {
        showOtherPlayerAnimation.current = gameState.showOtherPlayerAnimation;
        otherPlayerTargetPosition.current = gameState.otherPlayerTargetPosition;
        otherPlayerAngle.current = gameState.otherPlayerAngle;
        if (gameState.showOtherPlayerAnimation) {
          setPauseTimer(true);
        }
      }

    if (gameState.currentActivePlayer !== myPlayerId && gameState[otherPlayerId].targetPosition) {
      targetPositionOfOtherPlayer.current = gameState[otherPlayerId].targetPosition;
      verticesOfOtherPlayer.current = gameState[otherPlayerId].vertices;
    }

    targetPositionOfMyPlayer.current = gameState[myPlayerId]?.targetPosition;
    verticesOfMyPlayer.current = gameState[myPlayerId]?.vertices;

    
    if (!gameState?.playerOne?.targetPosition) {
      setInitialStateForCanvas(gameState);
    }
    if (
      gameState[myPlayerId]?.moves?.length >= MOVES_PER_PERSON &&
      gameState[otherPlayerId]?.moves?.length >= MOVES_PER_PERSON &&
      !gameState.showOtherPlayerAnimation
    ) {
      const isTied =
        gameState[myPlayerId].score === gameState[otherPlayerId].score;
      updateGameState({
        gameEndedAt: new Date(),
        winner: isTied
          ? "Tied"
          : gameState[myPlayerId].score > gameState[otherPlayerId].score
          ? myPlayerId
          : otherPlayerId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    if (otherPlayerAnimationDone) {
      otherPlayerAnimationDoneRef.current = false;
      otherPlayerTargetHitSoundPlayed.current = false;
      const newTargetPosition = generateRandomTargetPosition();
      targetPositionOfMyPlayer.current = newTargetPosition;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pos = null;
      verticesOfMyPlayer.current =
        getRandomTargetMovementVertices(newTargetPosition);
      showOtherPlayerAnimation.current = false;
      let activePlayer =
        gameState.isComputerGame ||
        gameState.currentActivePlayer === "playerTwo"
          ? "playerOne"
          : "playerTwo";
      updateGameState({
        currentActivePlayer: activePlayer,
        showOtherPlayerAnimation: false,
        otherPlayerTargetPosition: newTargetPosition,
        otherPlayerAngle: 0,
        [activePlayer]: {
          ...gameState[activePlayer],
          targetPosition: newTargetPosition,
          vertices: getRandomTargetMovementVertices(newTargetPosition),
        },
      });
      setOtherPlayerAnimationDone(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherPlayerAnimationDone]);

useEffect(() => {
  if (isArrowFired) {
    setTimeout(() => {
      setIsArrowFired(false);
    }, 4000);
  }
}, [isArrowFired]);

const handleMainTimerEnd = () => {
  setStartGame(true);
  setDisableCanvas(false);
  setTimeout(() => {
    setShowGameStartTimer(false);
    setPauseTimer(false);
  }, 2000);
};

  return (
    <div>
      <img
        id="archery-target"
        src="/Assets/Images/balloon-popping-sprite.png"
        alt="target"
        className="absolute z-[-1] w-0 h-0 opacity-0"
      />
      <img
        id="archery-gun-head"
        src="/Assets/Images/archery-gun-head.png"
        alt="stickman"
        className="absolute z-[-1] w-0 h-0 opacity-0"
      />
      <img
        id="archery-gun-base"
        src="/Assets/Images/archery-gun-base.png"
        alt="stickman"
        className="absolute z-[-1] w-0 h-0 opacity-0"
      />
      <img
        id="archery-gun-head-playerOne"
        src="/Assets/Images/archery-gun-head-playerOne.png"
        alt="stickman"
        className="absolute z-[-1] w-0 h-0 opacity-0"
      />
      <img
        id="archery-gun-base-playerOne"
        src="/Assets/Images/archery-gun-base-playerOne.png"
        alt="stickman"
        className="absolute z-[-1] w-0 h-0 opacity-0"
      />
      <img
        id="archery-gun-head-playerTwo"
        src="/Assets/Images/archery-gun-head-playerTwo.png"
        alt="stickman"
        className="absolute z-[-1] w-0 h-0 opacity-0"
      />
      <img
        id="archery-gun-base-playerTwo"
        src="/Assets/Images/archery-gun-base-playerTwo.png"
        alt="stickman"
        className="absolute z-[-1] w-0 h-0 opacity-0"
      />
      <img
        id="bg"
        src="/Assets/Images/archery-bg.png"
        alt="bg"
        className="absolute z-[-1] w-0 h-0 opacity-0 object-cover"
      />
      <img
        id="aim"
        src="/Assets/Images/archery-game-aim.png"
        alt="bg"
        className="absolute z-[-1] w-0 h-0 opacity-0 object-cover"
      />
      <canvas
        ref={canvasRef}
        className={twMerge(
          "block my-0 mx-auto bg-[#eee]",
          (gameState.currentActivePlayer !== myPlayerId ||
            isArrowFired ||
            disableCanvas) &&
            "pointer-events-none touch-none"
        )}
      />
      <AnimatePresence>
        {showGameStartTimer ? (
          <AnimatedModal key="startTimer">
            {!startGame ? (
              <Timer
                duration={3}
                startTimer={true}
                stroke={0}
                timerEnd={handleMainTimerEnd}
                color="#ccf900"
              />
            ) : (
              <div className="text-primary-yellow text-[35px] font-medium py-8 px-12">
                GO!
              </div>
            )}
          </AnimatedModal>
        ) : (
          <></>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArcheryGameCanvas;