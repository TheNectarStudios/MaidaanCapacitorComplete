import React, { useState, useEffect, useRef, useMemo } from "react";
import Loader from "../../../PageComponents/Loader";
import Board from "../../../../GamesArena/MemoryCards/Board";
import { collection, addDoc, onSnapshot, doc, getDoc, setDoc, FieldPath,updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase-config";
import shuffle from "../../../../GamesArena/Common/shuffle";
import { MATRIX_TOURNAMENT_ROUND, MATRIX_PRO_TOURNAMENT_ROUND } from "../../../../Constants/GamesArena/MemoryCards";
import { AI_COMPUTER_ID } from "../../../../Constants/GamesArena/MemoryCards";
import { MEMORY_CARDS_COMPLETION_CORRECT_ANSWERS, NEW_FORMAT_MAX_ATTEMPTS_LIMIT } from "../../../../Constants/Commons";
import { TRIAL_GAME_STRING, FULL_GAME_STRING } from "../../../../Constants/Commons";

export const MemoryCardsContainer = ({ tournamentId, user, gameDocumentId, gameType, gameState, setGameState, endGame, revealAllCards, roundFormat="MEMORY_CARDS", currentGameMode}) => {

  const [pastmoves, setPastmoves] = useState([]);
  const [currentAttempts, setCurrentAttempts] = useState(0)
  const userId = user?.id;

  useEffect(() => {

    if (gameState) {
      const currPlayer = gameState.currentActivePlayer;
      const currentPlayerState = gameState?.[currPlayer];
      const movesArray = Object.values(currentPlayerState?.moves);

      if (movesArray.flat().length === 4) {
        setTimeout(() => {
          // if (currMove === 2) {
            const memoryCardsCollection = collection(db, "children", userId, "games");
          //const memoryCardsCollection = collection(db, memoryCardsCollection);
          const gameRef = doc(memoryCardsCollection, gameDocumentId);
          setDoc(
            gameRef,
            {
              [currPlayer]: {
                moves: {
                  1: [],
                  2: [],
                },
              },
              currentActivePlayer:
                currPlayer === "playerOne" ? "playerTwo" : "playerOne",
              activeSound: null,
            },
            { merge: true }
          );
          // }
        }, 1500);
      }


      if(gameCompleteAfterWin(gameState) ){
        if(currentGameMode === TRIAL_GAME_STRING){
          endGame("", "allMatchesFound");
        }
        else if (currentGameMode === FULL_GAME_STRING){
          endGame("scoreCard","allMatchesFound");
        }
      }
      else if( gameCompletedAfterAllMoves(gameState)){
        if(currentGameMode === TRIAL_GAME_STRING){
          endGame("", "maxAttemptsReached");
        }
        else if (currentGameMode === FULL_GAME_STRING){
          endGame("scoreCard","maxAttemptsReached");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const gameCompleteAfterWin = (gameState) => {
    if (gameState?.playerOne?.score + gameState?.playerTwo?.score === MEMORY_CARDS_COMPLETION_CORRECT_ANSWERS[roundFormat]) {
      return true;
    }
    return false;
  };

  const gameCompletedAfterAllMoves = (gameState) => {
    if (gameState?.playerOne?.numberOfMoves + gameState?.playerTwo?.numberOfMoves === NEW_FORMAT_MAX_ATTEMPTS_LIMIT[roundFormat]) {
      return true;
    }
    return false;
  };

  const myPlayerId = useMemo(() => {
    if (gameState?.isComputerGame) {
      return "playerOne";
    }
    return gameState?.playerOne?.id === user?.id ? "playerOne" : "playerTwo";
  }, [gameState?.isComputerGame, gameState?.playerOne?.id, user?.id]);


  const myPlayerData = gameState?.[myPlayerId];


  const handleClick = (e, position, userClicked = false) => {
    const currActivePlayer = gameState?.[gameState.currentActivePlayer];
    const moveNotAllowed =
      currActivePlayer.moves[1].length === 2 &&
      currActivePlayer.moves[2].length === 2;

    if (gameState?.isComputerGame && moveNotAllowed) {
      return;
    }

    if (
      (currActivePlayer.id === AI_COMPUTER_ID ) ||
      (!gameState?.isComputerGame && (currActivePlayer.id !== user.id ||
        moveNotAllowed))
    ) {
      return;
    }
    let tempMoves = [...pastmoves];
    if (tempMoves.length === 6) {
      tempMoves.pop();
    }
    tempMoves.unshift(position);
    setPastmoves(tempMoves);
    makeMove(position);
  };

  const checkAnswer = (currPlayer, currPosition) => {
    const previousMovePosition = gameState[currPlayer].moves[1];
    const gameBoard = JSON.parse(gameState.board);
    const previousMoveCard = gameBoard[previousMovePosition[0]][previousMovePosition[1]];
    const currentMoveCard = gameBoard[currPosition[0]][currPosition[1]];
    return {
      found: previousMoveCard.id === currentMoveCard.id,
      id: currentMoveCard.id,
    };
  };

  const makeMove = async (position) => {
    const memoryCardsCollection = collection(db, "children", userId, "games");
    //const memoryCardsCollection = collection(db, memoryCardsGameCollection);
    const gameRef = doc(memoryCardsCollection, gameDocumentId);
    const currPlayer = gameState.currentActivePlayer;
    const currMove = gameState.currentActiveMove;
    let ansFound = null;
    let attempts = currentAttempts ?? 0;
    let numberOfMoves = gameState[currPlayer].numberOfMoves ?? 0;
    if (currMove === 2) {
      attempts = attempts + 1;
      setCurrentAttempts(attempts);
      ansFound = checkAnswer(currPlayer, position);
      numberOfMoves += 1;
    }

    let stateToUpdate = {
      ...gameState,
      [currPlayer]: {
        ...gameState[currPlayer],
        moves: {
          ...gameState[currPlayer].moves,
          [currMove]: position,
        },
        numberOfMoves,
      },
      currentActiveMove: currMove === 1 ? 2 : 1,
      activeSound: "/Assets/Sounds/MemoryCards/singleMove.mp3",
      attempts,
    };
    if (ansFound?.found) {
      //check if all the answers are found if yes, call gameEnd..
      stateToUpdate = {
        ...gameState,
        [currPlayer]: {
          ...gameState[currPlayer],
          moves: {
            1: [],
            2: [],
          },
          score: gameState[currPlayer].score + 1,
          numberOfMoves,
        },
        currentActiveMove: 1,
        result: [...gameState.result, ansFound.id],
        activeSound: "/Assets/Sounds/MemoryCards/correct.mp3",
        attempts,
      };
    }
     setDoc(
      gameRef,
      stateToUpdate,
      { merge: true }
    );
    
  };

  return (
    <div className="memory-game-board ">
      <Board handleClick={handleClick} gameState={gameState} revealAllCards={revealAllCards} roundFormat={roundFormat} differentiate={true}/>
      <div className="mt-4">
            {/* <span className="max-xs:text-[14px] text-[#00000099]">
              Tap 2 cards and remember their position, match cards to score
            </span> */}
      </div>
    </div>
  );

}

