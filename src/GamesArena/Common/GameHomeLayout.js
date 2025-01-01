import Layout from "../../Components/Common/Layout";
import { useAuth } from "../../providers/auth-provider";
import GameLoader from "../../Components/PageComponents/GameLoader";
import { useMemo, useState } from "react";
import BackButton from "../../Components/Common/BackButton";
import { useNavigate } from "react-router-dom";
import DarkModal from "../../Components/Common/DarkModal";
import AppButton from "../../Components/Common/AppButton";
import useToast from "../../hooks/use-toast";
import Chat from "./Chat";
import { twMerge } from "tailwind-merge";
import { ARENA_ROUTE, MEMORY_CARDS_ROUTE } from "../../Constants/routes";
import { collection,getDoc,doc,setDoc} from "firebase/firestore";
import { db } from "../../firebase-config";
import ArenaHeader from "./ArenaHeader";
import { MEASURE } from "../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../instrumentation/types";
import { quitGame } from "../utils";


const GameHomeLayout = ({
  gameState,
  computerGameLoading,
  setComputerGameLoading,
  gameId,
  renderGame,
  showChat = true,
  showHeader = true,
  gameContainerClassName = "",
  headerText = "MEMORY CARD GAME",
  backButtonLink = MEMORY_CARDS_ROUTE,
  isQuizGame = false,
  myPlayerLeaderboardData,
  gameType,
  oneOnOneID,
  gameCollectionName,
  exitGamePopup,
  setExitGamePopup,
  handleFindPlayer,
  opponentLeftPopup,
  setOpponentLeftPopup,
  quitGamePopup,
  setQuitGamePopup,
  setOneOnOneID,
  setGameWonByExit,
  redirectRoute,
  resetStateVariables,
}) => {
  const navigate = useNavigate();
  const { user, signInAnonymouslyWithFirebase, isUserLoading, logout } =
    useAuth();
  const { showToast, ToastComponent } = useToast();

  const [showReaction, setShowReaction] = useState(null);
  const [exitYesButtonLoading, setExitYesButtonLoading] = useState(false);

  const myPlayerId = useMemo(() => {
    if (gameState?.isComputerGame) {
      return "playerOne";
    }
    return gameState?.playerOne?.id === user?.id ? "playerOne" : "playerTwo";
  }, [gameState?.isComputerGame, gameState?.playerOne?.id, user?.id]);

  const otherPlayerId = useMemo(() => {
    if (gameState?.isComputerGame) {
      return "playerTwo";
    }
    return myPlayerId === "playerOne" ? "playerTwo" : "playerOne";
  }, [gameState?.isComputerGame, myPlayerId]);

  const goBack = async() => {
    MEASURE(INSTRUMENTATION_TYPES.GO_BACK,user?.id,{gameType:gameType});
    if (gameId || gameState?.isGameStarted && !gameState?.gameExited || !gameState && computerGameLoading) {
      setExitGamePopup(true);
    } else {
      navigate(ARENA_ROUTE);
    } 
  };

  const closeDocAndExit = async () => {
    if (oneOnOneID) {
      setComputerGameLoading(false);
      setExitGamePopup(false);
      const openMatchesCollection = collection(db, "openMatches");
      //check if the match is open or not,if open then close it.
      const matchingDoc = await getDoc(doc(openMatchesCollection, oneOnOneID));

      if (matchingDoc.exists() && matchingDoc.data().status === "open") {
        await setDoc(
          doc(openMatchesCollection, oneOnOneID),
          {
            status: "closedWithExit",
          },
          { merge: true }
        );
      }
      setOneOnOneID(null);
    }

    navigate(backButtonLink);
  };

  const handleQuitGame = () => {
    quitGame(
      gameId,
      user,
      redirectRoute,
      gameState,
      gameCollectionName,
      setExitGamePopup,
      setQuitGamePopup,
      setGameWonByExit,
      navigate,
      resetStateVariables,
    );
  };
  const renderExitGamePopup = () => {
    return (
      <DarkModal isOpen={exitGamePopup}>
        <div className="text-center">Are you sure you want to exit?</div>
        {gameState?.isGameStarted && !gameState.gameEndedAt && (
          <div className="text-center">
            You will not get any points if you leave
          </div>
        )}
        <div className="flex gap-4 mt-4">

          <AppButton
            onClick={() => {
              setExitYesButtonLoading(true);
              MEASURE(INSTRUMENTATION_TYPES.GAME_EXIT_YES,user?.id ,{gameType:gameType,gameCreated:gameState?true:false});
              if (!gameState) {
                closeDocAndExit();
              } else {
                handleQuitGame();
              }
              setExitYesButtonLoading(false);
            }}
            isLoading={exitYesButtonLoading}
          >
            Yes
          </AppButton>   
          <AppButton onClick={() => {
            MEASURE(INSTRUMENTATION_TYPES.GAME_EXIT_NO,user?.id ,{gameType:gameType,gameCreated:gameState?true:false});
            setExitGamePopup(false)}}>No</AppButton>

        </div>
      </DarkModal>
    );
  };
  const renderOpponentLeftPopup = () => {
    return (
      <DarkModal isOpen={opponentLeftPopup}>
        <div className="text-center">Your opponent has left the game room</div>
      </DarkModal>
    );
  };

  const otherPlayerQuitPopup = () => {
    return (
      <DarkModal isOpen={quitGamePopup}>
        <div className="text-center">Your opponent has left the game room</div>
        <div className="flex gap-4 mt-4">
          <AppButton onClick={handleFindPlayer}>Find Another Player</AppButton>
          <AppButton onClick={handleQuitGame}>Go Back</AppButton>
        </div>
      </DarkModal>
    );
  };
  return (
    <Layout>
      {isUserLoading ? (
        <div className="w-full h-full flex justify-center items-center">
          <GameLoader message="Setting up the arena" />
        </div>
      ) : (
        <>
          <div className="flex flex-col h-full w-full relative">
            {showHeader ? (
              <ArenaHeader
                goBack={goBack}
                headerText={headerText}
                coins={myPlayerLeaderboardData?.coins ?? 0}
                pointsWon={myPlayerLeaderboardData?.pointsWon ?? 0}
                gamesPlayed={myPlayerLeaderboardData?.gamesPlayed ?? 0}
              />
            ) : (
              <></>
            )}
            <div
              className={twMerge(
                "text-white px-8 py-4 flex flex-col items-center h-full",
                gameContainerClassName
              )}
            >
              {renderGame()}
            </div>
          </div>
          {renderExitGamePopup()}
          {otherPlayerQuitPopup()}
          {renderOpponentLeftPopup()}
          {gameState?.chatId && showChat ? (
            <Chat
              gameState={gameState}
              otherPlayerId={otherPlayerId}
              handleShowReaction={setShowReaction}
            />
          ) : (
            <></>
          )}
          {showReaction ? (
            <div
              className={twMerge(
                "absolute bottom-[15%] left-1/2 -translate-x-1/2 bg-primary-gray-20 flex flex-col justify-center items-center text-5xl p-4 h-fit w-fit opacity-100"
                // showReaction ? "h-fit w-fit opacity-100" : "h-0 w-0 opacity-0"
              )}
            >
              <div className="text-center text-primary-yellow text-lg mb-3">
                {gameState?.[otherPlayerId]?.name} says
              </div>
              <div className="animate-shake">{showReaction?.text}</div>
            </div>
          ) : (
            <></>
          )}
        </>
      )}
    </Layout>
  );
};

export default GameHomeLayout;
