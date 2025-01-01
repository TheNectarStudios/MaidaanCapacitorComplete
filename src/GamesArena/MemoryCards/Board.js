import React, { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

function Board({ handleClick, gameState, revealAllCards = false, roundFormat = "MEMORY_CARDS", differentiate = false }) {

  const timeoutRefs = useRef([]);

  useEffect(() => {
    const foundTiles = document.getElementsByClassName('board__card--found');

    for (let i = 0; i < foundTiles.length; i++) {
      if (!revealAllCards) {
        const timeoutId = setTimeout(() => {
          foundTiles[i].style.opacity = 0;
        }, 500);
        timeoutRefs.current.push(timeoutId);
      } else {
        foundTiles[i].style.opacity = 1;
      }
    }

    // Cleanup function to clear timeouts when the component unmounts or updates
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current = [];
    };
  }, [gameState, revealAllCards]);

  const createCards = () => {
    const isBoardLarge = JSON.parse(gameState?.board ?? '[]').length > 4;
    const isInviteGame = gameState?.inviteGame ? true : false;
    let styleSize = {};
    const isSmallDevice = window.innerHeight < 600;

    if (isSmallDevice) {
      styleSize = { width: `${window.innerHeight * 0.1}px`, height: `${window.innerHeight * 0.1}px` };
    } else {
      if (isBoardLarge && isInviteGame) {
        if (roundFormat === "MEMORY_CARDS_PRO") {
          styleSize = { width: '68px', height: '64px' };
        }
        else {
          styleSize = { width: '64px', height: '60px' };
        }
      } else if (isBoardLarge) {
        if (roundFormat === "MEMORY_CARDS_PRO") {
          styleSize = { width: '68px', height: '64px' };
        }
        else {
          styleSize = { width: '72px', height: '72px' };
        }
      }
    }

    const renderBoard = (gameBoard, renderFirstHalf = false, fullBoard = false) => {
      return gameBoard.map((row, i) => {
        if(!fullBoard) {
        // Only render the first or second half of the board depending on the renderFirstHalf flag
        const shouldRenderRow = (i < gameBoard.length / 2 && renderFirstHalf) || (i >= gameBoard.length / 2 && !renderFirstHalf);
    
        if (!shouldRenderRow) return null;
        }
    
        return (
          <div key={i} className="board__row">
            {row.map((col, j) => {
              const currentPlayer = gameState?.currentActivePlayer;
              const result = gameState?.result;
    
              let isTileFound = result?.includes(col.id);
              const movesArray = Object.values(gameState?.[currentPlayer]?.moves);
              let isTileActive = false;
    
              if (revealAllCards) {
                isTileActive = true;
              } else {
                isTileActive =
                  (movesArray?.[0]?.[0] === i && movesArray?.[0]?.[1] === j) ||
                  (movesArray?.[1]?.[0] === i && movesArray?.[1]?.[1] === j);
              }
              
              return (

                <div
                  key={`${i}-${j}`}
                  className={twMerge(
                    "board__card board__card--hidden",
                    isTileActive && "board__card--active",
                    isTileFound && "board__card--found",
                    !col.isImage && (isTileActive || isTileFound) && "bg-primary-yellow",
                    differentiate && col.lable === "name" && "board_card--differentiate1",
                    differentiate && col.lable === "flag" && "board_card--differentiate2"
                  )}
                  style={styleSize}
                  onClick={(e) => {
                    if (isTileFound || isTileActive) return;
                    handleClick(e, [i, j], true);
                  }}
                >
                  {col.isImage ? (
                    <img
                      className={twMerge(
                        "h-full w-full object-cover z-[-1]",
                        (isTileActive || isTileFound) && "z-0"
                      )}
                      src={col.content}
                      alt=""
                    />
                  ) : (
                    col.content
                  )}
                </div>
              );
            })}
          </div>
        );
      });
    };
    



    if (differentiate) {
      return (
        <div className="flex flex-col items-center justify-center gap-2">
          <div>
            {renderBoard(JSON.parse(gameState?.board ?? '[]'), true)}
          </div>
          <span className="text-white text-sm">Match flags above with countries below</span>
          <div>
            {renderBoard(JSON.parse(gameState?.board ?? '[]'), false)}
          </div>
        </div>
      )
    }

    return renderBoard(JSON.parse(gameState?.board ?? '[]'), false, true);
  };

  return <div className="board">{createCards()}</div>;
}

export default Board;
